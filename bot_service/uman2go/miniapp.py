"""Telegram-authenticated web adapter sharing the bot's transactional service."""
import argparse
import hashlib
import hmac
import json
import mimetypes
import os
from pathlib import Path
import re
import tempfile
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qsl, urlparse
from .db import connect, ROUTES
from .i18n import LANGUAGES, route_name
from .service import Service, InvalidAction
from .notifications import initialize_inbox, inbox, mark_read, approve_from_notification
from .activity import notify_activity
from .translation import notice

WEB = Path(__file__).parent / 'web'

def authenticate(raw, token, now=None):
    if not token or not raw or len(raw) > 12000:
        raise PermissionError('Open this app from Telegram')
    pairs = parse_qsl(raw, keep_blank_values=True, strict_parsing=True)
    fields = dict(pairs)
    if len(fields) != len(pairs):
        raise PermissionError('Invalid Telegram session')
    signature = fields.pop('hash', '')
    key = hmac.new(b'WebAppData', token.encode(), hashlib.sha256).digest()
    expected = hmac.new(key, '\n'.join(f'{k}={v}' for k, v in sorted(fields.items())).encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(signature, expected):
        raise PermissionError('Invalid Telegram signature')
    age = (time.time() if now is None else now) - int(fields.get('auth_date', '0'))
    if not -30 <= age <= 3600:
        raise PermissionError('Reopen the app from Telegram')
    user = json.loads(fields['user'])
    if type(user.get('id')) is not int or user['id'] <= 0 or user.get('is_bot'):
        raise PermissionError('Invalid user')
    return user

class MiniApp:
    def __init__(self, path, admins=(), token='', demo=False):
        self.service = Service(path, admins)
        self.path, self.token, self.demo = str(path), token, demo
        db = connect(path)
        initialize_inbox(db)
        db.execute('CREATE TABLE IF NOT EXISTS web_actions(user_id INTEGER NOT NULL,request_id TEXT NOT NULL,body_hash TEXT NOT NULL,PRIMARY KEY(user_id,request_id))')
        db.close()

    def identity(self, headers):
        if self.demo:
            driver = headers.get('X-Demo-Role') == 'driver'
            return {'id': 10 if driver else 20, 'first_name': 'דוד' if driver else 'יוסף', 'language_code': 'he'}
        return authenticate(headers.get('X-Telegram-Init-Data', ''), self.token)

    def ensure_user(self, db, user):
        lang = user.get('language_code', 'he').split('-')[0]
        db.execute('INSERT OR IGNORE INTO users(id,name,lang) VALUES (?,?,?)', (user['id'], user.get('first_name', 'UMAN2GO')[:120], lang if lang in LANGUAGES else 'en'))
        self.service.track_customer(db, user['id'], {}, None)

    def snapshot(self, user):
        db = connect(self.path)
        try:
            self.ensure_user(db, user)
            uid = user['id']
            profile = dict(db.execute('SELECT id,name,lang FROM users WHERE id=?', (uid,)).fetchone())
            driver = db.execute('SELECT * FROM drivers WHERE id=?', (uid,)).fetchone()
            gps = db.execute('SELECT * FROM location_access WHERE user_id=?', (uid,)).fetchone()
            allowed = self.service.has_location(db, uid)
            result = {'user': profile, 'demo': self.demo, 'gps_required': not allowed,
                      'translation_notice': notice(profile['lang']),
                      'notifications': inbox(db, uid, self.service.admins),
                      'gps': dict(gps) if gps and allowed else None, 'driver': dict(driver) if driver else None,
                      'routes': [{'id': r, 'name': route_name(profile['lang'], r)} for r in ROUTES],
                      'ride': None, 'offers': [], 'jobs': [], 'history': [], 'messages': [], 'partner_location': None,
                      'payment': 'on_arrival'}
            if not allowed:
                return result
            ride = self.service.active_driver(db, uid) or self.service.active_passenger(db, uid)
            if ride:
                result['ride'] = dict(ride)
                if ride['passenger_id'] == uid:
                    offers = db.execute("SELECT o.*,d.name,d.vehicle,d.seats FROM offers o JOIN drivers d ON d.id=o.driver_id WHERE ride_id=? AND o.status='priced' AND d.approval='approved' AND d.available=1", (ride['id'],)).fetchall()
                    result['offers'] = [dict(o, rating=self.service.driver_rating(db, uid, o['driver_id'])) for o in offers if self.service.has_location(db, o['driver_id'])]
                if ride['driver_id']:
                    d = db.execute('SELECT name,phone,vehicle,plate,id FROM drivers WHERE id=?', (ride['driver_id'],)).fetchone()
                    result['ride']['assigned_driver'] = dict(d)
                    peer = ride['driver_id'] if uid == ride['passenger_id'] else ride['passenger_id']
                    loc = db.execute('SELECT latitude,longitude,updated_at FROM ride_locations WHERE ride_id=? AND user_id=?', (ride['id'], peer)).fetchone()
                    result['partner_location'] = dict(loc) if loc else None
                    rows = db.execute("SELECT id,actor_id,method,payload FROM outbox WHERE ride_id=? AND method IN ('sendMessage','sendVoice','sendPhoto') AND discarded=0 ORDER BY id DESC LIMIT 30", (ride['id'],)).fetchall()
                    for row in reversed(rows):
                        payload = json.loads(row['payload'])
                        if uid in (row['actor_id'], payload.get('chat_id')):
                            result['messages'].append({'id': row['id'], 'mine': row['actor_id'] == uid,
                                                       'text': payload.get('text', payload.get('caption', '')), 'media': row['method'] != 'sendMessage'})
            if driver and driver['approval'] == 'approved':
                result['jobs'] = [dict(r) for r in db.execute("SELECT r.*,o.status offer_status,o.price offered_price FROM offers o JOIN rides r ON r.id=o.ride_id WHERE o.driver_id=? AND r.status='searching' AND o.status IN ('offered','priced') ORDER BY r.id DESC LIMIT 20", (uid,))]
            result['history'] = [dict(r) for r in db.execute("SELECT r.*,s.stars FROM rides r LEFT JOIN ratings s ON s.ride_id=r.id WHERE (r.passenger_id=? OR r.driver_id=?) AND r.status IN ('completed','cancelled') ORDER BY r.id DESC LIMIT 10", (uid, uid))]
            for past in result['history']:
                if past['status'] == 'completed':
                    past['distance_text'] = self.service.distance_text(db, uid, past)
            return result
        finally:
            db.close()

    def act(self, user, body):
        uid, svc = user['id'], self.service
        request_id = body.get('request_id', '')
        if not isinstance(request_id, str) or not re.fullmatch(r'[A-Za-z0-9-]{8,80}', request_id):
            raise ValueError('Request ID required')
        fingerprint = hashlib.sha256(json.dumps(body, sort_keys=True).encode()).hexdigest()
        db = connect(self.path)
        try:
            db.execute('BEGIN IMMEDIATE')
            self.ensure_user(db, user)
            previous = db.execute('SELECT body_hash FROM web_actions WHERE user_id=? AND request_id=?', (uid, request_id)).fetchone()
            if previous:
                if previous['body_hash'] != fingerprint:
                    raise ValueError('Request ID already used')
                db.rollback()
                return self.snapshot(user)
            action = body.get('action')
            notification_target = None
            if action not in ('location', 'language', 'cancel', 'notification_read', 'notification_approve') and not svc.has_location(db, uid):
                raise ValueError('GPS_REQUIRED')
            def message(text=None, data=None, **extra):
                msg = {'from': user, 'chat': {'id': uid, 'type': 'private'}, **extra}
                if text is not None:
                    msg['text'] = text
                svc.handle(db, uid, msg, data)
            if action == 'notification_read':
                mark_read(db, uid, int(body['notification_id']))
            elif action == 'notification_approve':
                notification_target = approve_from_notification(db, svc, uid, int(body['notification_id']))
            elif action == 'location':
                msg = {'location': {'latitude': body['latitude'], 'longitude': body['longitude']}, 'date': int(time.time())}
                if not svc.access_gate(db, uid, msg, None):
                    message(**msg)
            elif action == 'language':
                message(data='lang:' + str(body['language']))
            elif action == 'book':
                if svc.active_passenger(db, uid) or svc.active_driver(db, uid):
                    raise ValueError('A ride is already active')
                count = int(body['passengers'])
                if not 1 <= count <= 50:
                    raise ValueError('Invalid passenger count')
                gps = db.execute('SELECT latitude,longitude FROM location_access WHERE user_id=?', (uid,)).fetchone()
                message('/book')
                message(location=dict(gps))
                if body.get('route'):
                    if body['route'] not in ROUTES:
                        raise ValueError('Invalid route')
                    message(data='route:' + body['route'])
                else:
                    destination = str(body.get('destination', '')).strip()
                    if not 5 <= len(destination) <= 400:
                        raise ValueError('Enter a full destination address')
                    message(destination)
                message(str(count))
                ride = svc.active_passenger(db, uid)
                message(data=f'confirm:{ride["id"]}')
            elif action in ('choose', 'cancel', 'move', 'rate', 'decline'):
                rid = int(body['ride_id'])
                suffix = {'choose': str(body.get('driver_id', '')), 'move': str(body.get('status', '')), 'rate': str(body.get('stars', ''))}.get(action)
                message(data=f'{action}:{rid}' + (f':{suffix}' if suffix is not None else ''))
            elif action == 'available':
                if type(body.get('available')) is not bool:
                    raise ValueError('Invalid availability')
                message(data='available:' + str(int(body['available'])))
            elif action == 'quote':
                message(data=f'accept:{int(body["ride_id"])}')
                message(str(body['price']))
            elif action == 'message':
                svc.peer(db, uid, int(body['ride_id']))
                text = str(body.get('text', '')).strip()
                if not text:
                    raise ValueError('Message is empty')
                message('/message ' + text)
            else:
                raise ValueError('Unknown action')
            if action != 'notification_read':
                notify_activity(svc, db, uid, action, detail='ID ' + str(notification_target) if notification_target else '')
            db.execute('INSERT INTO web_actions VALUES (?,?,?)', (uid, request_id, fingerprint))
            db.commit()
        except BaseException:
            db.rollback()
            raise
        finally:
            db.close()
        return self.snapshot(user)

def create_server(app, host='127.0.0.1', port=8787, public_url=''):
    if app.demo and host not in ('127.0.0.1', 'localhost', '::1'):
        raise ValueError('Demo must remain on loopback')
    public = urlparse(public_url)
    allowed_hosts = {public.netloc} if public.netloc else {f'127.0.0.1:{port}', f'localhost:{port}'}
    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *args):
            pass  # Never log Telegram authorization or chat content.

        def reply(self, status, content, content_type='application/json; charset=utf-8'):
            raw = json.dumps(content, ensure_ascii=False).encode() if not isinstance(content, bytes) else content
            self.send_response(status)
            self.send_header('Content-Type', content_type)
            self.send_header('Content-Length', str(len(raw)))
            self.send_header('Cache-Control', 'no-store' if self.path.startswith('/api/') else 'no-cache')
            self.send_header('X-Content-Type-Options', 'nosniff')
            self.send_header('Referrer-Policy', 'strict-origin-when-cross-origin')
            self.send_header('Content-Security-Policy', "default-src 'self'; script-src 'self' https://telegram.org; style-src 'self'; img-src 'self' data: https://tile.openstreetmap.org; connect-src 'self'; base-uri 'none'; object-src 'none'")
            self.end_headers()
            self.wfile.write(raw)

        def allowed(self):
            if self.headers.get('Host', '') not in allowed_hosts:
                return False
            origin = self.headers.get('Origin')
            return not origin or origin == f'{public.scheme or "http"}://{self.headers.get("Host")}'

        def do_GET(self):
            if not self.allowed():
                return self.reply(403, {'error': 'Origin not allowed'})
            path = urlparse(self.path).path
            if path == '/api/state':
                try:
                    return self.reply(200, app.snapshot(app.identity(self.headers)))
                except (PermissionError, ValueError, KeyError, TypeError):
                    return self.reply(401, {'error': 'OPEN_IN_TELEGRAM'})
            if path == '/api/config':
                return self.reply(200, {'demo': app.demo})
            files = {'/': 'index.html', '/app.js': 'app.js', '/notifications.js': 'notifications.js', '/style.css': 'style.css', '/favicon.svg': 'favicon.svg', '/leaflet.js': 'leaflet.js', '/leaflet.css': 'leaflet.css'}
            if path not in files:
                return self.reply(404, {'error': 'Not found'})
            file = WEB / files[path]
            self.reply(200, file.read_bytes(), (mimetypes.guess_type(file.name)[0] or 'text/plain') + '; charset=utf-8')

        def do_POST(self):
            if not self.allowed() or urlparse(self.path).path != '/api/action':
                return self.reply(403, {'error': 'Not allowed'})
            try:
                if self.headers.get('Content-Type', '').split(';')[0] != 'application/json':
                    raise ValueError('JSON required')
                size = int(self.headers.get('Content-Length', '0'))
                if not 0 < size <= 16000:
                    raise ValueError('Invalid body size')
                user = app.identity(self.headers)
                body = json.loads(self.rfile.read(size))
                self.reply(200, app.act(user, body))
            except PermissionError:
                self.reply(401, {'error': 'OPEN_IN_TELEGRAM'})
            except (ValueError, KeyError, TypeError, InvalidAction, IndexError) as exc:
                self.reply(400, {'error': 'GPS_REQUIRED' if str(exc) == 'GPS_REQUIRED' else 'ACTION_UNAVAILABLE'})
    return ThreadingHTTPServer((host, port), Handler)

def seed_demo(app):
    db = connect(app.path)
    db.execute("INSERT OR IGNORE INTO users(id,name,lang) VALUES (10,'דוד','he')")
    db.execute("INSERT OR IGNORE INTO drivers(id,name,phone,vehicle,plate,seats,approval,available) VALUES (10,'דוד — נהג הדגמה','+380000000000','Mercedes Vito','DEMO',6,'approved',1)")
    db.execute('INSERT OR REPLACE INTO location_access(user_id,latitude,longitude,updated_at) VALUES (10,48.751,30.223,?)', (time.time(),))
    db.close()

def main():
    parser = argparse.ArgumentParser(description='UMAN2GO local Mini App demo')
    parser.add_argument('--port', type=int, default=8787)
    args = parser.parse_args()
    # Demo has a separate temporary DB and cannot access real customers or send Telegram messages.
    with tempfile.TemporaryDirectory(prefix='uman2go-preview-') as folder:
        app = MiniApp(Path(folder) / 'preview.sqlite3', demo=True)
        seed_demo(app)
        server = create_server(app, port=args.port)
        print(f'UMAN2GO demo: http://127.0.0.1:{args.port}', flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
        finally:
            server.server_close()

if __name__ == '__main__':
    main()
