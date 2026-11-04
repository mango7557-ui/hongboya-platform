import json
import tempfile
import threading
import unittest
from contextlib import closing
from concurrent.futures import ThreadPoolExecutor
from http.server import ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from server import TABLES, connect, make_handler


class LocalServerTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.database = Path(self.temp.name) / 'test.sqlite3'
        self.server = ThreadingHTTPServer(('127.0.0.1', 0), make_handler(self.database))
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.base = f'http://127.0.0.1:{self.server.server_port}'

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join()
        self.temp.cleanup()

    def request(self, path, method='GET', data=None):
        payload = json.dumps(data).encode() if data is not None else None
        request = Request(self.base + path, data=payload, method=method,
                          headers={'Content-Type': 'application/json'})
        try:
            response = urlopen(request, timeout=5)
        except HTTPError as error:
            response = error
        with response:
            return response.status, json.loads(response.read())

    def test_all_tables_and_crud(self):
        for table in TABLES:
            path = '/tables/' + table
            status, record = self.request(path, 'POST', {'brand_name': '테스트 브랜드', 'order_idx': 2})
            self.assertEqual(status, 201)
            item = path + '/' + record['id']
            self.assertEqual(self.request(item)[1]['brand_name'], '테스트 브랜드')
            self.assertEqual(self.request(item, 'PATCH', {'order_idx': 1})[1]['order_idx'], 1)
            with closing(connect(self.database)) as db:
                saved = db.execute('SELECT body FROM records WHERE table_name=?', (table,)).fetchone()
                self.assertEqual(json.loads(saved[0])['order_idx'], 1)
            self.assertEqual(self.request(item, 'DELETE')[0], 200)
            self.assertEqual(self.request(item)[0], 404)

    def test_search_sort_pagination_and_concurrent_writes(self):
        path = '/tables/poster_settings'
        with ThreadPoolExecutor(max_workers=5) as pool:
            results = list(pool.map(lambda n: self.request(path, 'POST', {'brand_name': '카페', 'order_idx': n}), range(12)))
        self.assertTrue(all(status == 201 for status, _ in results))
        status, result = self.request(path + '?sort=-order_idx&limit=5&page=2&search=%EC%B9%B4%ED%8E%98')
        self.assertEqual(status, 200)
        self.assertEqual(result['total'], 12)
        self.assertEqual([row['order_idx'] for row in result['data']], [6, 5, 4, 3, 2])
        self.assertEqual(self.request(path + '?page=4&limit=5')[1]['data'], [])

    def test_invalid_requests_and_private_files(self):
        self.assertEqual(self.request('/tables/unknown')[0], 404)
        self.assertEqual(self.request('/tables/site_config?limit=0')[0], 400)
        self.assertEqual(self.request('/tables/site_config', 'POST', [1, 2])[0], 400)
        for path in ('/server.py', '/data/hongboya.sqlite3', '/%2e%2e/server.py'):
            self.assertEqual(self.request(path)[0], 404)

    def test_pages(self):
        for page in ('/', '/admin.html', '/chatbot.html', '/register-bot.html', '/share.html', '/check-models.html', '/test-api.html', '/sw.js'):
            with urlopen(self.base + page) as response:
                self.assertEqual(response.status, 200)
                self.assertGreater(len(response.read()), 100)


if __name__ == '__main__':
    unittest.main()
