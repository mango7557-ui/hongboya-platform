"""GitHub Pages에 공개할 화면 파일만 별도 폴더로 구성합니다."""
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parent
OUTPUT = ROOT / 'docs'


def main():
    OUTPUT.mkdir(exist_ok=True)
    pages = list(ROOT.glob('*.html'))
    for page in pages:
        html = page.read_text(encoding='utf-8')
        if './web-preview.js' not in html:
            html = html.replace('<head>', '<head>\n    <script src="./web-preview.js"></script>', 1)
        (OUTPUT / page.name).write_text(html, encoding='utf-8')
    for name in ('web-preview.js', 'sw.js'):
        shutil.copy2(ROOT / name, OUTPUT / name)
    (OUTPUT / '.nojekyll').touch()
    print(f'Built {len(pages)} HTML pages for GitHub Pages')


if __name__ == '__main__':
    main()
