"""홍보야 로컬 실행 서버: Python 표준 라이브러리만 사용합니다."""
import argparse
import json
import mimetypes
import sqlite3
import uuid
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlsplit

ROOT = Path(__file__).resolve().parent
TABLES = {
    'poster_settings', 'site_config', 'chatbot_data', 'consultation_requests',
    'franchise_store_rows', 'banners', 'events', 'member_registrations',
}
PUBLIC_FILES = {p.name for p in ROOT.glob('*.html')} | {'sw.js'}


def connect(database):
    connection = sqlite3.connect(database, timeout=20)
    connection.execute('''CREATE TABLE IF NOT EXISTS records (
        table_name TEXT NOT NULL, id TEXT NOT NULL, body TEXT NOT NULL,
        PRIMARY KEY (table_name, id))''')
    return connection


def make_handler(database):
    class Handler(BaseHTTPRequestHandler):
        def json_response(self, status, data):
            payload = json.dumps(data, ensure_ascii=False).encode('utf-8')
            self.send_response(status)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(payload)))
            self.send_header('Cache-Control', 'no-store')
            self.end_headers()
            self.wfile.write(payload)

        def body(self):
            length = int(self.headers.get('Content-Length', '0'))
            if not 0 < length <= 10 * 1024 * 1024:
                raise ValueError('JSON body must be between 1 byte and 10 MB')
            data = json.loads(self.rfile.read(length))
            if not isinstance(data, dict):
                raise ValueError('JSON body must be an object')
            return data

        def handle_api(self, path, query):
            parts = path.strip('/').split('/')
            if len(parts) not in (2, 3) or parts[1] not in TABLES:
                return self.json_response(404, {'error': 'Unknown table'})
            table = parts[1]
            record_id = parts[2] if len(parts) == 3 else None
            db = connect(database)
            try:
                with db:
                    if self.command == 'GET':
                        if record_id:
                            row = db.execute('SELECT body FROM records WHERE table_name=? AND id=?',
                                             (table, record_id)).fetchone()
                            return self.json_response(200, json.loads(row[0])) if row else self.json_response(404, {'error': 'Record not found'})
                        page = int(query.get('page', ['1'])[0])
                        limit = int(query.get('limit', ['100'])[0])
                        if page < 1 or not 1 <= limit <= 10000:
                            raise ValueError('Invalid page or limit')
                        rows = [json.loads(row[0]) for row in db.execute(
                            'SELECT body FROM records WHERE table_name=? ORDER BY rowid', (table,))]
                        search = query.get('search', [''])[0].casefold()
                        if search:
                            rows = [row for row in rows if any(search in str(v).casefold() for v in row.values())]
                        sort = query.get('sort', [''])[0]
                        if sort:
                            field = sort.lstrip('-')
                            def sort_key(row):
                                value = row.get(field)
                                if value is None:
                                    return (2, '')
                                if isinstance(value, (int, float)):
                                    return (0, value)
                                return (1, str(value).casefold())
                            rows.sort(key=sort_key, reverse=sort.startswith('-'))
                        total = len(rows)
                        start = (page - 1) * limit
                        return self.json_response(200, {
                            'data': rows[start:start + limit], 'total': total,
                            'page': page, 'limit': limit, 'total_pages': (total + limit - 1) // limit,
                        })
                    if self.command == 'POST' and not record_id:
                        data = self.body()
                        now = datetime.now(timezone.utc).isoformat()
                        data.update(id=str(uuid.uuid4()), created_at=now, updated_at=now)
                        db.execute('INSERT INTO records VALUES (?, ?, ?)',
                                   (table, data['id'], json.dumps(data, ensure_ascii=False)))
                        db.commit()
                        return self.json_response(201, data)
                    if self.command in ('PATCH', 'PUT', 'DELETE') and record_id:
                        row = db.execute('SELECT body FROM records WHERE table_name=? AND id=?',
                                         (table, record_id)).fetchone()
                        if not row:
                            return self.json_response(404, {'error': 'Record not found'})
                        if self.command == 'DELETE':
                            db.execute('DELETE FROM records WHERE table_name=? AND id=?', (table, record_id))
                            db.commit()
                            return self.json_response(200, {'success': True, 'id': record_id})
                        previous = json.loads(row[0])
                        data = previous.copy() if self.command == 'PATCH' else {}
                        data.update(self.body())
                        data.update(id=record_id, created_at=previous['created_at'],
                                    updated_at=datetime.now(timezone.utc).isoformat())
                        db.execute('UPDATE records SET body=? WHERE table_name=? AND id=?',
                                   (json.dumps(data, ensure_ascii=False), table, record_id))
                        db.commit()
                        return self.json_response(200, data)
                    return self.json_response(405, {'error': 'Method not allowed'})
            finally:
                db.close()

        def dispatch(self):
            try:
                url = urlsplit(self.path)
                path = unquote(url.path)
                if path.startswith('/tables/'):
                    return self.handle_api(path, parse_qs(url.query))
                if self.command not in ('GET', 'HEAD'):
                    return self.json_response(405, {'error': 'Method not allowed'})
                name = 'index.html' if path == '/' else path.removeprefix('/')
                if name not in PUBLIC_FILES:
                    return self.json_response(404, {'error': 'File not found'})
                payload = (ROOT / name).read_bytes()
                content_type = mimetypes.guess_type(name)[0] or 'application/octet-stream'
                self.send_response(200)
                self.send_header('Content-Type', content_type + '; charset=utf-8')
                self.send_header('Content-Length', str(len(payload)))
                self.send_header('Cache-Control', 'no-cache')
                self.end_headers()
                if self.command != 'HEAD':
                    self.wfile.write(payload)
            except (ValueError, UnicodeError) as error:
                self.json_response(400, {'error': str(error)})
            except sqlite3.Error:
                self.json_response(500, {'error': 'Database operation failed'})

        do_GET = do_HEAD = do_POST = do_PATCH = do_PUT = do_DELETE = dispatch

    return Handler


def main():
    parser = argparse.ArgumentParser(description='Hongboya local server')
    parser.add_argument('--port', type=int, default=8000)
    parser.add_argument('--database', type=Path, default=ROOT / 'data' / 'hongboya.sqlite3')
    args = parser.parse_args()
    args.database.parent.mkdir(parents=True, exist_ok=True)
    connect(args.database).close()
    server = ThreadingHTTPServer(('127.0.0.1', args.port), make_handler(args.database))
    print(f'Hongboya: http://127.0.0.1:{args.port}', flush=True)
    print(f'Admin: http://127.0.0.1:{args.port}/admin.html', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == '__main__':
    main()
