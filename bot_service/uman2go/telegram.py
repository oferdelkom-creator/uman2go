"""Small HTTPS adapter to the official Telegram Bot API; injectable in tests."""
import json
import urllib.request
import urllib.error

class TelegramError(Exception):
    def __init__(self, code, retry_after=0):
        # Never put the URL (which contains the bot token) in exception messages.
        super().__init__(f'Telegram request failed (code {code})')
        self.code, self.retry_after = code, retry_after

class Telegram:
    def __init__(self, token, timeout=40):
        self._base = 'https://api.telegram.org/bot' + token + '/'
        self.timeout = timeout

    def call(self, method, payload):
        req = urllib.request.Request(self._base + method, data=json.dumps(payload).encode(),
                                     headers={'Content-Type': 'application/json'}, method='POST')
        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as response:
                result = json.load(response)
        except urllib.error.HTTPError as exc:
            try:
                result = json.load(exc)
            except (ValueError, OSError):
                raise TelegramError(exc.code) from None
        except (urllib.error.URLError, TimeoutError, OSError):
            raise TelegramError(0) from None
        if not result.get('ok'):
            raise TelegramError(result.get('error_code', 0), result.get('parameters', {}).get('retry_after', 0))
        return result['result']
