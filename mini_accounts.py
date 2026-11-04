"""Same-origin accounts and owner-controlled mini homes for the Python server."""
import hashlib
import hmac
import json
import secrets
import sqlite3
import time
from http.cookies import SimpleCookie
import base64
from urllib.parse import urlsplit

MAX_PROFILE_PNG_BYTES = 600 * 1024


def database(path):
    db = sqlite3.connect(path, timeout=20)
    db.executescript('''
        CREATE TABLE IF NOT EXISTS mini_users (
            id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, salt TEXT NOT NULL,
            password TEXT NOT NULL, profile TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS mini_sessions (
            token TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires INTEGER NOT NULL);
    ''')
    return db


def clean_profile(value):
    if not isinstance(value, dict):
        raise ValueError('프로필 형식이 올바르지 않습니다.')
    def text(key, limit):
        return str(value.get(key, '')).strip()[:limit]
    def url(raw):
        raw = str(raw).strip()
        if not raw:
            return ''
        parsed = urlsplit(raw)
        if parsed.scheme not in ('http', 'https') or not parsed.hostname or parsed.username:
            raise ValueError('링크는 https:// 또는 http:// 주소를 입력하세요.')
        if len(raw) > 1000:
            raise ValueError('링크가 너무 깁니다.')
        return raw
    def image_url(raw):
        raw = str(raw).strip()
        if not raw:
            return ''
        if raw.startswith('data:'):
            if not raw.startswith('data:image/png;base64,'):
                raise ValueError('프로필 업로드 이미지는 PNG 형식만 허용됩니다.')
            b64 = raw.split(',', 1)[1]
            try:
                decoded = base64.b64decode(b64, validate=True)
            except Exception as exc:
                raise ValueError('올바른 PNG 이미지 데이터가 아닙니다.') from exc
            if not decoded.startswith(b'\x89PNG\r\n\x1a\n') or len(decoded) > MAX_PROFILE_PNG_BYTES:
                raise ValueError('프로필 이미지는 600KB 이하의 PNG여야 합니다.')
            return raw
        return url(raw)
    result = {key: text(key, limit) for key, limit in
              [('name', 60), ('bio', 400), ('region', 60), ('handle', 40), ('badgeText', 40)]}
    if not result['name']:
        raise ValueError('활동명을 입력하세요.')
    result['role'] = text('role', 20) if value.get('role') in ('producer', 'maker', 'creative', 'local') else 'local'
    result['theme'] = text('theme', 20) if value.get('theme') in ('coral', 'forest', 'violet', 'ocean', 'amber', 'rose') else 'coral'
    result['bgStyle'] = text('bgStyle', 20) if value.get('bgStyle') in ('clean', 'dots', 'grid', 'soft') else 'clean'
    result['btnShape'] = text('btnShape', 20) if value.get('btnShape') in ('rounded', 'pill', 'sharp') else 'rounded'
    result['image'] = image_url(value.get('image', ''))
    result['coverImage'] = image_url(value.get('coverImage', ''))
    for collection, limit in [('links', 8), ('products', 12)]:
        entries = value.get(collection, [])
        if not isinstance(entries, list) or len(entries) > limit:
            raise ValueError('링크는 8개, 상품은 12개까지 등록할 수 있습니다.')
        result[collection] = []
        for entry in entries:
            if not isinstance(entry, dict):
                raise ValueError('항목 형식이 올바르지 않습니다.')
            row = {'title': str(entry.get('title', '')).strip()[:80], 'url': url(entry.get('url', ''))}
            if not row['title'] or not row['url']:
                raise ValueError('각 항목의 제목과 링크를 입력하세요.')
            if collection == 'products':
                row.update(price=str(entry.get('price', ''))[:60], image=url(entry.get('image', '')),
                           description=str(entry.get('description', ''))[:200])
            result[collection].append(row)
    return result


def handle(handler, path, db_path):
    method = handler.command
    if method != 'GET':
        origin = handler.headers.get('Origin')
        if origin and urlsplit(origin).netloc != handler.headers.get('Host'):
            return handler.json_response(403, {'error': '허용되지 않은 요청입니다.'})
    db = database(db_path)
    try:
        cookie = SimpleCookie()
        cookie.load(handler.headers.get('Cookie', ''))
        token = cookie['hongboya_session'].value if 'hongboya_session' in cookie else ''
        session = db.execute('SELECT user_id FROM mini_sessions WHERE token=? AND expires>?',
                             (hashlib.sha256(token.encode()).hexdigest(), int(time.time()))).fetchone()
        user = db.execute('SELECT id,email,profile FROM mini_users WHERE id=?', (session[0],)).fetchone() if session else None
        if path == '/api/mini/status' and method == 'GET':
            return handler.json_response(200, {'accounts': True})
        if path in ('/api/mini/signup', '/api/mini/login') and method == 'POST':
            body = handler.body()
            email = str(body.get('email', '')).strip().lower()
            password = str(body.get('password', ''))
            if '@' not in email or len(email) > 254 or not 10 <= len(password) <= 200:
                raise ValueError('이메일과 10~200자 비밀번호를 입력하세요.')
            if path.endswith('signup'):
                profile = clean_profile(body.get('profile', {}))
                uid, salt = secrets.token_hex(12), secrets.token_hex(16)
                digest = hashlib.pbkdf2_hmac('sha256', password.encode(), bytes.fromhex(salt), 600000).hex()
                try:
                    db.execute('INSERT INTO mini_users VALUES (?,?,?,?,?)',
                               (uid, email, salt, digest, json.dumps(profile, ensure_ascii=False)))
                    db.commit()
                except sqlite3.IntegrityError:
                    return handler.json_response(409, {'error': '이미 가입된 이메일입니다.'})
            else:
                record = db.execute('SELECT id,salt,password FROM mini_users WHERE email=?', (email,)).fetchone()
                salt = record[1] if record else '00' * 16
                digest = hashlib.pbkdf2_hmac('sha256', password.encode(), bytes.fromhex(salt), 600000).hex()
                if not record or not hmac.compare_digest(record[2], digest):
                    return handler.json_response(401, {'error': '이메일 또는 비밀번호를 확인하세요.'})
                uid = record[0]
            token = secrets.token_urlsafe(32)
            db.execute('DELETE FROM mini_sessions WHERE expires<=?', (int(time.time()),))
            db.execute('INSERT INTO mini_sessions VALUES (?,?,?)',
                       (hashlib.sha256(token.encode()).hexdigest(), uid, int(time.time()) + 604800))
            db.commit()
            handler.session_cookie = f'hongboya_session={token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800'
            return handler.json_response(200, {'id': uid})
        if path == '/api/mini/logout' and method == 'POST':
            db.execute('DELETE FROM mini_sessions WHERE token=?', (hashlib.sha256(token.encode()).hexdigest(),))
            db.commit()
            handler.session_cookie = 'hongboya_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0'
            return handler.json_response(200, {'ok': True})
        if path == '/api/mini/me':
            if not user:
                return handler.json_response(401, {'error': '로그인이 필요합니다.'})
            if method == 'GET':
                return handler.json_response(200, {'id': user[0], 'email': user[1], 'profile': json.loads(user[2])})
            if method == 'PUT':
                profile = clean_profile(handler.body())
                db.execute('UPDATE mini_users SET profile=? WHERE id=?', (json.dumps(profile, ensure_ascii=False), user[0]))
                db.commit()
                return handler.json_response(200, {'id': user[0], 'profile': profile})
        if path.startswith('/api/mini/public/') and method == 'GET':
            row = db.execute('SELECT profile FROM mini_users WHERE id=?', (path.rsplit('/', 1)[-1],)).fetchone()
            return handler.json_response(200, json.loads(row[0])) if row else handler.json_response(404, {'error': '미니홈피를 찾을 수 없습니다.'})
        return handler.json_response(404, {'error': '요청을 찾을 수 없습니다.'})
    finally:
        db.close()
