import json
import logging
import os
from pathlib import Path
import re
import threading
import time
from urllib.parse import urlparse
from .db import connect
from .service import Service
from .telegram import Telegram, TelegramError

log = logging.getLogger('uman2go')

def load_env(path):
    if Path(path).exists():
        for line in Path(path).read_text(encoding='utf-8-sig').splitlines():
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))

def settings():
    token = os.getenv('TELEGRAM_BOT_TOKEN', '')
    admins = os.getenv('ADMIN_TELEGRAM_IDS', '')
    currency = os.getenv('CURRENCY', 'UAH')
    if not re.fullmatch(r'[0-9]+:[A-Za-z0-9_-]{20,}', token):
        raise ValueError('Set TELEGRAM_BOT_TOKEN in .env (see .env.example).')
    if not re.fullmatch(r'[1-9][0-9]*(,[1-9][0-9]*)*', admins):
        raise ValueError('Set ADMIN_TELEGRAM_IDS to comma-separated numeric Telegram user IDs.')
    if not re.fullmatch(r'[A-Z]{3}', currency):
        raise ValueError('CURRENCY must contain 3 uppercase letters, e.g. UAH.')
    return token, {int(x) for x in admins.split(',')}, currency

class Worker:
    def __init__(self, path, api, batch_limit=25):
        self.path, self.api = path, api
        self.batch_limit = batch_limit

    def flush(self, now=None, max_seconds=None):
        now = time.time() if now is None else now
        deadline = time.monotonic() + max_seconds if max_seconds is not None else None
        db = connect(self.path)
        try:
            rows = db.execute('SELECT * FROM outbox WHERE sent_at IS NULL AND failed=0 AND discarded=0 AND next_attempt<=? ORDER BY id LIMIT ?', (now,self.batch_limit)).fetchall()
            for row in rows:
                if deadline is not None and time.monotonic() >= deadline:
                    break
                # Re-read: GPS updates can coalesce or a ride can end after this batch was fetched.
                row = db.execute('SELECT * FROM outbox WHERE id=?', (row['id'],)).fetchone()
                if row['discarded'] or row['sent_at']:
                    continue
                if row['ride_id'] is not None:
                    ride = db.execute('SELECT * FROM rides WHERE id=?', (row['ride_id'],)).fetchone()
                    payload = json.loads(row['payload'])
                    valid = ride and ride['status'] in ('accepted', 'arrived', 'in_progress')
                    valid = valid and {row['actor_id'], payload.get('chat_id')} == {ride['driver_id'], ride['passenger_id']}
                    if not valid:
                        db.execute('UPDATE outbox SET discarded=1 WHERE id=?', (row['id'],))
                        continue
                try:
                    self.api.call(row['method'], json.loads(row['payload']))
                except TelegramError as exc:
                    attempts = row['attempts'] + 1
                    permanent = exc.code in (400, 403, 404) or attempts >= 20
                    delay = max(exc.retry_after, min(300, 2 ** min(attempts, 8)))
                    db.execute('UPDATE outbox SET attempts=?,failed=?,next_attempt=? WHERE id=?', (attempts, int(permanent), now + delay, row['id']))
                    log.warning('Notification %s failed: code=%s; permanent=%s', row['id'], exc.code, permanent)
                    if exc.code == 429:
                        # Respect Telegram's flood wait globally for pending messages.
                        db.execute('UPDATE outbox SET next_attempt=MAX(next_attempt,?) WHERE sent_at IS NULL AND failed=0', (now + delay,))
                        break
                else:
                    db.execute('UPDATE outbox SET sent_at=CURRENT_TIMESTAMP WHERE id=?', (row['id'],))
        finally:
            db.close()

def run(path, token, admins, currency, stop=None):
    api = Telegram(token)
    identity = api.call('getMe', {})
    if identity.get('username', '').lower() != 'uman2go_ridesbot':
        raise ValueError('This release is restricted to @UMAN2GO_RidesBot. No bot settings were changed.')
    if api.call('getWebhookInfo', {}).get('url'):
        raise ValueError('This bot already has a webhook. Use a dedicated bot or remove its webhook before polling.')
    service = Service(path, admins, currency)
    stop = stop or threading.Event()
    worker = Worker(path, api)
    web_server = None
    mini_url = os.getenv('MINIAPP_URL', '').strip()
    if mini_url:
        parsed = urlparse(mini_url)
        if parsed.scheme != 'https' or not parsed.netloc or parsed.username or parsed.password or parsed.query or parsed.fragment or parsed.path not in ('', '/'):
            raise ValueError('MINIAPP_URL must be a public HTTPS origin.')
        from .miniapp import MiniApp, create_server
        web_server = create_server(MiniApp(path, admins, token), host=os.getenv('MINIAPP_HOST', '127.0.0.1'), port=int(os.getenv('MINIAPP_PORT', '8787')), public_url=mini_url)
        threading.Thread(target=web_server.serve_forever, daemon=True).start()
        api.call('setChatMenuButton', {'menu_button': {'type': 'web_app', 'text': 'UMAN2GO', 'web_app': {'url': mini_url}}})
    api.call('setMyCommands', {'commands': [
        {'command': 'start', 'description': 'Start / התחלה'}, {'command': 'book', 'description': 'Book ride / הזמנת נסיעה'},
        {'command': 'status', 'description': 'Ride status / מצב נסיעה'}, {'command': 'driver', 'description': 'Drivers / הרשמה וקבלת נסיעות'},
        {'command': 'gps', 'description': 'Share GPS / שיתוף מיקום'}, {'command': 'message', 'description': 'Ride chat / הודעה'},
        {'command': 'receipt', 'description': 'Trip summary / סיכום נסיעה'},
        {'command': 'rate', 'description': 'Rate driver / דירוג נהג'}, {'command': 'cancel', 'description': 'Cancel ride / ביטול'},
        {'command': 'company', 'description': 'Transport company / חברת הסעות'},
        {'command': 'myid', 'description': 'My ID / המזהה שלי'},
        {'command': 'leavecompany', 'description': 'Leave company / עזיבת חברה'},
        {'command': 'companies', 'description': 'Admin: companies / ניהול חברות'},
        {'command': 'profile', 'description': 'Vehicle profile / פרופיל רכב'},
        {'command': 'invite', 'description': 'Join as driver / הצטרפות נהגים'},
        {'command': 'admin', 'description': 'Admin / ניהול'}]})
    log.info('Bot connected: @%s', identity.get('username', ''))

    def delivery():
        while not stop.is_set():
            try:
                worker.flush()
            except Exception:
                log.error('Notification worker error; pending messages retained in database.')
            stop.wait(1.1)

    sender = threading.Thread(target=delivery, daemon=True)
    sender.start()
    log.info('UMAN2GO started. Private-chat polling enabled.')
    try:
        while not stop.is_set():
            db = connect(path)
            row = db.execute("SELECT value FROM metadata WHERE key='offset'").fetchone()
            db.close()
            try:
                updates = api.call('getUpdates', {'offset': int(row['value']) if row else 0, 'timeout': 25, 'allowed_updates': ['message', 'edited_message', 'callback_query']})
                for update in updates:
                    service.process(update)
            except TelegramError as exc:
                if exc.code in (401, 409):
                    raise ValueError('Invalid token or another polling process is running.') from None
                log.warning('Polling unavailable: code=%s; retrying.', exc.code)
                stop.wait(max(3, exc.retry_after))
    finally:
        stop.set()
        sender.join(timeout=45)
        if web_server:
            web_server.shutdown()
            web_server.server_close()

class ProcessLock:
    """OS lock prevents two senders sharing a database on the same host."""
    def __init__(self, path):
        self.path = str(path) + '.lock'

    def __enter__(self):
        Path(self.path).parent.mkdir(parents=True, exist_ok=True)
        self.file = open(self.path, 'a+b')
        self.file.write(b'0')
        self.file.flush()
        self.file.seek(0)
        try:
            if os.name == 'nt':
                import msvcrt
                msvcrt.locking(self.file.fileno(), msvcrt.LK_NBLCK, 1)
            else:
                import fcntl
                fcntl.flock(self.file, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except OSError:
            self.file.close()
            raise ValueError('Another UMAN2GO process is using this database.') from None
        return self

    def __exit__(self, *args):
        self.file.close()

