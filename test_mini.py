import json
import threading
import tempfile
import unittest
from http.server import ThreadingHTTPServer
from pathlib import Path
from urllib.request import Request, urlopen, build_opener, HTTPCookieProcessor
from urllib.error import HTTPError
from http.cookiejar import CookieJar
from server import make_handler


class MiniAccountsTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.server = ThreadingHTTPServer(('127.0.0.1', 0), make_handler(Path(self.temp.name) / 'test.db'))
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.url = f'http://127.0.0.1:{self.server.server_port}/api/mini/'
        self.owner = build_opener(HTTPCookieProcessor(CookieJar()))
        self.other = build_opener(HTTPCookieProcessor(CookieJar()))

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join()
        self.temp.cleanup()

    def request(self, client, path, method='GET', data=None):
        req = Request(self.url + path, method=method,
                      data=json.dumps(data).encode() if data is not None else None,
                      headers={'Content-Type': 'application/json'})
        try:
            res = client.open(req)
        except HTTPError as error:
            res = error
        with res:
            return res.status, json.load(res)

    def test_signup_owner_edit_public_and_login(self):
        credentials = {'email': 'farmer@example.com', 'password': 'long-password-123',
                       'profile': {'name': '나의 농장', 'role': 'producer', 'links': [], 'products': []}}
        status, account = self.request(self.owner, 'signup', 'POST', credentials)
        self.assertEqual(status, 200)
        status, me = self.request(self.owner, 'me')
        self.assertEqual(me['profile']['name'], '나의 농장')
        self.assertEqual(self.request(self.other, 'me', 'PUT', {'name': 'tampered'})[0], 401)
        profile = me['profile']
        profile['products'] = [{'title': '직접 기른 사과', 'url': 'https://example.com/apple', 'price': '10,000원'}]
        self.assertEqual(self.request(self.owner, 'me', 'PUT', profile)[0], 200)
        status, public = self.request(self.other, 'public/' + account['id'])
        self.assertEqual(public['products'][0]['price'], '10,000원')
        self.assertNotIn('email', public)
        self.assertNotIn('password', public)
        self.assertEqual(self.request(self.owner, 'logout', 'POST', {})[0], 200)
        self.assertEqual(self.request(self.owner, 'me')[0], 401)
        self.assertEqual(self.request(self.owner, 'login', 'POST', {**credentials, 'password': 'wrong-password'})[0], 401)
        self.assertEqual(self.request(self.owner, 'login', 'POST', credentials)[0], 200)
        self.assertEqual(self.request(self.owner, 'me')[1]['profile']['products'][0]['title'], '직접 기른 사과')
        self.assertEqual(self.request(self.other, 'signup', 'POST', credentials)[0], 409)
        profile['links'] = [{'title': 'bad', 'url': 'javascript:alert(1)'}]
        self.assertEqual(self.request(self.owner, 'me', 'PUT', profile)[0], 400)


if __name__ == '__main__':
    unittest.main()
