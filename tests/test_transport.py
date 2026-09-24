import io
import json
import unittest
from unittest.mock import patch
from urllib.error import HTTPError, URLError
from uman2go.telegram import Telegram, TelegramError

class TransportTests(unittest.TestCase):
    def setUp(self):
        self.token = '123:SECRET_TOKEN_NOT_TO_BE_LOGGED'
        self.api = Telegram(self.token)

    def test_sends_json_to_official_https_endpoint(self):
        result = io.BytesIO(json.dumps({'ok': True, 'result': {'message_id': 7}}).encode())
        with patch('urllib.request.urlopen', return_value=result) as call:
            self.assertEqual({'message_id': 7}, self.api.call('sendMessage', {'chat_id': 20, 'text': 'שלום ₴'}))
            request = call.call_args.args[0]
            self.assertEqual('https://api.telegram.org/bot' + self.token + '/sendMessage', request.full_url)
            self.assertEqual('POST', request.method)
            self.assertEqual('שלום ₴', json.loads(request.data)['text'])

    def test_rate_limit_retry_after_is_preserved(self):
        body = io.BytesIO(b'{"ok":false,"error_code":429,"parameters":{"retry_after":30}}')
        exc = HTTPError('https://secret-url', 429, 'limited', {}, body)
        with patch('urllib.request.urlopen', side_effect=exc):
            with self.assertRaises(TelegramError) as caught:
                self.api.call('sendMessage', {})
        self.assertEqual((429, 30), (caught.exception.code, caught.exception.retry_after))
        self.assertNotIn(self.token, str(caught.exception))

    def test_network_error_does_not_expose_token(self):
        with patch('urllib.request.urlopen', side_effect=URLError(self.token)):
            with self.assertRaises(TelegramError) as caught:
                self.api.call('getUpdates', {})
        self.assertEqual(0, caught.exception.code)
        self.assertNotIn(self.token, str(caught.exception))

    def test_non_json_http_error_is_sanitized(self):
        exc = HTTPError('https://secret-url', 503, self.token, {}, io.BytesIO(b'bad gateway'))
        with patch('urllib.request.urlopen', side_effect=exc):
            with self.assertRaises(TelegramError) as caught:
                self.api.call('getUpdates', {})
        self.assertEqual(503, caught.exception.code)
        self.assertNotIn(self.token, str(caught.exception))
