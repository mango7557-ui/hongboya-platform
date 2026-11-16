"""Prepare workbook rows for private review; never publishes source records."""
import argparse
import json
import re
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

NS = {'x': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
      'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
REL = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id'


def col_index(ref):
    value = 0
    for ch in re.match(r'[A-Z]+', ref).group():
        value = value * 26 + ord(ch) - 64
    return value - 1


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('workbook')
    parser.add_argument('output')
    args = parser.parse_args()
    output = Path(args.output)
    output.mkdir(parents=True, exist_ok=True)
    manifest = []
    with zipfile.ZipFile(args.workbook) as z:
        strings = []
        with z.open('xl/sharedStrings.xml') as stream:
            for _, el in ET.iterparse(stream, events=('end',)):
                if el.tag == '{%s}si' % NS['x']:
                    strings.append(''.join(n.text or '' for n in el.iter('{%s}t' % NS['x'])))
                    el.clear()
        wb = ET.fromstring(z.read('xl/workbook.xml'))
        rels = ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
        paths = {x.attrib['Id']: x.attrib['Target'].lstrip('/') for x in rels}
        for sheet in wb.find('x:sheets', NS):
            name = sheet.attrib['name']
            path = paths[sheet.attrib[REL]]
            if not path.startswith('xl/'): path = 'xl/' + path
            relpath = 'xl/worksheets/_rels/' + Path(path).name + '.rels'
            targets = {}
            if relpath in z.namelist():
                targets = {x.attrib['Id']: x.attrib.get('Target', '') for x in ET.fromstring(z.read(relpath))}
            rows, headers, hyperlinks = [], None, {}
            with z.open(path) as stream:
                for _, el in ET.iterparse(stream, events=('end',)):
                    tag = el.tag.rsplit('}', 1)[-1]
                    if tag == 'row':
                        cells = {}
                        for cell in el.findall('x:c', NS):
                            ref = cell.attrib.get('r', '')
                            v = cell.find('x:v', NS)
                            if not ref or v is None or v.text is None: continue
                            value = strings[int(v.text)] if cell.attrib.get('t') == 's' else v.text
                            cells[col_index(ref)] = value
                        if str(cells.get(0, '')).strip().lower() in ('no', '번호'):
                            headers = cells
                        elif headers and str(cells.get(0, '')).strip().isdigit():
                            rownum = int(el.attrib['r'])
                            payload = {headers[i]: v for i, v in cells.items() if i in headers and headers[i]}
                            rows.append({'source_sheet': name, 'source_row': rownum, 'payload': payload})
                        el.clear()
                    elif tag == 'hyperlink':
                        ref, target = el.attrib.get('ref', ''), targets.get(el.attrib.get(REL), '')
                        match = re.fullmatch(r'([A-Z]+)(\d+)', ref)
                        if match and target.startswith(('https://', 'http://')):
                            hyperlinks.setdefault(int(match.group(2)), {})[col_index(ref)] = target
                        el.clear()
            if not rows: continue
            for row in rows:
                links = hyperlinks.get(row['source_row'], {})
                row['payload']['_links'] = {headers[i]: v for i, v in links.items() if i in headers}
            pathout = output / ('batch_%03d.jsonl' % len(manifest))
            with pathout.open('w', encoding='utf-8') as f:
                for row in rows: f.write(json.dumps(row, ensure_ascii=False, separators=(',', ':')) + '\n')
            manifest.append({'sheet': name, 'rows': len(rows), 'file': pathout.name})
            print(name, len(rows), flush=True)
    (output / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
    print('TOTAL', sum(s['rows'] for s in manifest), flush=True)


if __name__ == '__main__': main()
