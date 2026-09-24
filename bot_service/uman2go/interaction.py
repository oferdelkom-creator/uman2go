"""Ride-scoped communication, opt-in GPS and verified-trip driver ratings."""
import json
import time
from datetime import datetime, timezone
from .i18n import t
from .translation import notice

TRIP_STATES = ('accepted', 'arrived', 'in_progress')

class Interaction:
    LOCATION_MAX_AGE = 15 * 60

    def has_location(self, db, uid):
        loc = db.execute('SELECT updated_at FROM location_access WHERE user_id=?', (uid,)).fetchone()
        return bool(loc and 0 <= time.time() - loc['updated_at'] <= self.LOCATION_MAX_AGE)

    def require_location_prompt(self, db, uid):
        lang = self.language(db, uid)
        self.send(db, uid, t(lang, 'gps_required'), markup={'keyboard': [[{'text': t(lang, 'share'), 'request_location': True}]], 'resize_keyboard': True, 'one_time_keyboard': True})

    def access_gate(self, db, uid, msg, data, edited=False):
        """Return True if handled. Language and exit actions remain accessible."""
        loc = msg.get('location') if not data else None
        if loc:
            lat, lon = float(loc['latitude']), float(loc['longitude'])
            if not (-90 <= lat <= 90 and -180 <= lon <= 180):
                raise ValueError('Valid GPS coordinates are required')
            if edited:
                source = db.execute('SELECT * FROM location_access WHERE user_id=?', (uid,)).fetchone()
                if not source or not source['live'] or source['message_id'] != msg.get('message_id'):
                    return True
            observed_at = min(time.time(), float(msg.get('edit_date', msg.get('date', time.time()))))
            if time.time() - observed_at > self.LOCATION_MAX_AGE:
                if not edited:
                    self.require_location_prompt(db, uid)
                return True
            db.execute('''INSERT INTO location_access(user_id,latitude,longitude,updated_at,message_id,live) VALUES (?,?,?,?,?,?)
                          ON CONFLICT(user_id) DO UPDATE SET latitude=excluded.latitude,longitude=excluded.longitude,
                          updated_at=excluded.updated_at,message_id=excluded.message_id,live=excluded.live''',
                       (uid, lat, lon, observed_at, msg.get('message_id'), int(bool(loc.get('live_period')))))
            state = db.execute('SELECT state FROM users WHERE id=?', (uid,)).fetchone()['state']
            ride = self.active_driver(db, uid) or self.active_passenger(db, uid)
            if not edited and state != 'pickup' and (not ride or ride['status'] not in TRIP_STATES):
                self.send(db, uid, t(self.language(db, uid), 'gps_access_granted'), markup={'remove_keyboard': True})
                # An interrupted form remains in the same step; show the correct prompt.
                if state == 'phone':
                    lang = self.language(db, uid)
                    self.send(db, uid, t(lang, 'phone'), markup={'keyboard': [[{'text': t(lang, 'share_phone'), 'request_contact': True}]], 'resize_keyboard': True, 'one_time_keyboard': True})
                elif state == 'company_phone':
                    self.send(db, uid, self.ct(db, uid, 'phone'), markup={'keyboard': [[{'text': self.ct(db, uid, 'contact'), 'request_contact': True}]], 'resize_keyboard': True, 'one_time_keyboard': True})
                elif state in ('company_name', 'company_invite'):
                    self.send(db, uid, self.ct(db, uid, 'name' if state == 'company_name' else 'id'))
                elif state.startswith('profile_'):
                    self.say(db, uid, 'photo_prompt' if state == 'profile_photo' else state.removeprefix('profile_'))
                elif state in ('vehicle', 'plate', 'seats', 'destination', 'passengers'):
                    self.say(db, uid, state)
                elif state == 'bid':
                    self.say(db, uid, 'bid_amount', currency=self.currency)
                else:
                    self.home(db, uid)
                return True
            return False
        if edited:
            return True
        command = msg.get('text', '').split(' ')[0].split('@')[0]
        admin_command = command in ('/admin', '/drivers', '/approve', '/reject', '/rides', '/prices', '/cancelride', '/health', '/customers', '/customer', '/tag', '/note', '/setcommunity', '/companies', '/approvecompany', '/rejectcompany', '/fleet_enable', '/fleet_approve')
        exempt = (uid in self.admins and admin_command) or command in ('/start', '/language', '/cancel', '/stopgps', '/unsubscribe', '/leavecompany', '/receipt') or data == 'language' or (data and data.startswith(('lang:', 'cancel:')))
        if self.fleet_account(db,uid):
            state=db.execute('SELECT state FROM users WHERE id=?',(uid,)).fetchone()['state']
            exempt = exempt or command in ('/fleet','/driver','/company','/status','/message','/where') or data in ('fleet','driver','company') or (data and data.startswith(('fleet:','accept:','decline:','move:','chat:','where:','available:'))) or (not command and not data and (state.startswith('fleet_') or state=='chat'))
        if not exempt and not self.has_location(db, uid):
            self.require_location_prompt(db, uid)
            return True
        return False

    def peer(self, db, uid, rid=None):
        if rid is None and db.execute("SELECT COUNT(*) FROM rides WHERE driver_id=? AND status IN ('accepted','arrived','in_progress')",(uid,)).fetchone()[0]>1:
            raise ValueError(self.ft(db,uid,'chooseRide'))
        ride = self.ride(db, rid) if rid is not None else (self.active_driver(db, uid) or self.active_passenger(db, uid))
        if not ride or ride['status'] not in TRIP_STATES or uid not in (ride['driver_id'], ride['passenger_id']):
            raise ValueError('No assigned ride')
        return ride, ride['passenger_id'] if uid == ride['driver_id'] else ride['driver_id']

    def interaction_buttons(self, db, uid, ride):
        if ride['status'] not in TRIP_STATES:
            return []
        lang, rid = self.language(db, uid), ride['id']
        buttons=[(t(lang, 'chat_button'), f'chat:{rid}'), (t(lang, 'where_button'), f'where:{rid}')]
        if not (ride['fleet_vehicle_id'] and uid==ride['driver_id']):
            buttons.insert(1,(t(lang, 'gps_button'), f'gps:{rid}'))
        return buttons

    def relay_queue(self, db, ride, uid, method, payload):
        db.execute('INSERT INTO outbox(method,payload,ride_id,actor_id) VALUES (?,?,?,?)',
                   (method, json.dumps(payload, ensure_ascii=False), ride['id'], uid))

    def communication_closed(self, db, rid):
        db.execute('UPDATE ride_distance SET last_lat=NULL,last_lon=NULL WHERE ride_id=?', (rid,))
        db.execute('UPDATE location_sources SET enabled=0 WHERE ride_id=?', (rid,))
        db.execute('UPDATE outbox SET discarded=1 WHERE ride_id=? AND sent_at IS NULL', (rid,))
        # Coordinates have no operational use after the trip. Delivered chat pins remain in Telegram.
        db.execute('DELETE FROM ride_locations WHERE ride_id=?', (rid,))
        for row in db.execute("SELECT id,draft FROM users WHERE state='chat'").fetchall():
            if json.loads(row['draft']).get('ride_id') == rid:
                self.state(db, row['id'], 'home')

    def handle_interaction(self, db, uid, msg, data, command, state, draft):
        lang = self.language(db, uid)
        action = data.split(':')[0] if data else ''
        if command == '/receipt':
            args = msg.get('text', '').split()[1:]
            if args:
                ride = self.ride(db, int(args[0]))
            else:
                ride = db.execute("SELECT * FROM rides WHERE (passenger_id=? OR driver_id=?) AND status='completed' ORDER BY id DESC LIMIT 1", (uid, uid)).fetchone()
            if not ride or ride['status'] != 'completed' or (uid not in (ride['passenger_id'], ride['driver_id']) and uid not in self.admins):
                raise ValueError('Completed trip not available')
            self.send(db, uid, self.trip_receipt(db, uid, ride))
            return True
        if command == '/stopgps':
            db.execute('UPDATE ride_distance SET partial=1,last_lat=NULL,last_lon=NULL,last_at=NULL WHERE finished_at IS NULL AND ride_id IN (SELECT id FROM rides WHERE driver_id=?)', (uid,))
            db.execute('DELETE FROM location_access WHERE user_id=?', (uid,))
            db.execute('UPDATE drivers SET available=0 WHERE id=?', (uid,))
            db.execute('UPDATE location_sources SET enabled=0 WHERE user_id=?', (uid,))
            db.execute('DELETE FROM ride_locations WHERE user_id=?', (uid,))
            db.execute("UPDATE outbox SET discarded=1 WHERE actor_id=? AND sent_at IS NULL AND method='sendLocation'", (uid,))
            self.say(db, uid, 'gps_stopped')
            return True
        if action in ('chat', 'gps', 'where') or command in ('/message', '/gps', '/where', '/stopgps'):
            rid = int(data.split(':')[1]) if data else None
            ride, other = self.peer(db, uid, rid)
            if action == 'chat' or command == '/message':
                text = msg.get('text', '').partition(' ')[2].strip() if not data else ''
                if text:
                    self.relay_message(db, uid, ride, other, {'text': text})
                else:
                    self.state(db, uid, 'chat', {'ride_id': ride['id']})
                    self.say(db, uid, 'chat_prompt')
                    self.send(db, uid, notice(self.language(db, uid)))
            elif action == 'gps' or command == '/gps':
                if ride['fleet_vehicle_id'] and uid==ride['driver_id']:
                    self.send(db,uid,self.ft(db,uid,'noGPS'))
                    return True
                self.send(db, uid, t(lang, 'gps_prompt'), markup={'keyboard': [[{'text': t(lang, 'share'), 'request_location': True}]], 'resize_keyboard': True, 'one_time_keyboard': True})
            else:
                loc = db.execute('SELECT * FROM ride_locations WHERE ride_id=? AND user_id=?', (ride['id'], other)).fetchone()
                if loc:
                    stamp = datetime.fromtimestamp(loc['updated_at'], timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')
                    self.send(db, uid, t(lang, 'gps_time', time=stamp))
                    self.relay_queue(db, ride, other, 'sendLocation', {'chat_id': uid, 'latitude': loc['latitude'], 'longitude': loc['longitude']})
                else:
                    self.say(db, uid, 'gps_missing')
            return True
        if not data and state == 'chat' and not command and not msg.get('location'):
            ride, other = self.peer(db, uid, draft['ride_id'])
            if self.relay_message(db, uid, ride, other, msg):
                self.state(db, uid, 'home')
            return True
        if not data and msg.get('location') and state != 'pickup':
            self.receive_location(db, uid, msg)
            return True
        if action == 'rate':
            _, rid, stars = data.split(':')
            ride = self.ride(db, int(rid))
            stars = int(stars)
            if ride['status'] != 'completed' or ride['passenger_id'] != uid or not 1 <= stars <= 5:
                raise ValueError('Not a completed passenger trip')
            if db.execute('SELECT 1 FROM ratings WHERE ride_id=?', (ride['id'],)).fetchone():
                self.say(db, uid, 'rating_already')
            else:
                db.execute('INSERT INTO ratings(ride_id,passenger_id,driver_id,stars) VALUES (?,?,?,?)', (ride['id'], uid, ride['driver_id'], stars))
                self.event(db, ride['id'], uid, 'driver_rated')
                self.say(db, uid, 'rating_thanks')
            return True
        if command == '/rate':
            args = msg.get('text', '').split()[1:]
            if args:
                ride = self.ride(db, int(args[0]))
                if ride['status'] != 'completed' or ride['passenger_id'] != uid:
                    raise ValueError('Rating not permitted')
            else:
                ride = db.execute("SELECT * FROM rides WHERE passenger_id=? AND status='completed' AND id NOT IN (SELECT ride_id FROM ratings) ORDER BY id DESC LIMIT 1", (uid,)).fetchone()
            if ride:
                self.rating_prompt(db, uid, ride)
            else:
                self.say(db, uid, 'rating_none')
            return True
        return False

    def relay_message(self, db, uid, ride, other, msg):
        lang = self.language(db, other)
        role = t(lang, 'from_driver' if uid == ride['driver_id'] else 'from_passenger')
        if ride['fleet_vehicle_id'] and uid==ride['driver_id']:
            role=self.ft(db,other,'coordinator')
        prefix = t(lang, 'chat_header', role=role, id=ride['id'])
        markup = {'inline_keyboard': [[{'text': t(lang, 'reply_button'), 'callback_data': f'chat:{ride["id"]}'}]]}
        if msg.get('text'):
            if len(msg['text'].encode('utf-16-le')) // 2 > 3500:
                raise ValueError('Message too long')
            method, payload = 'sendMessage', {'text': prefix + '\n' + msg['text']}
            payload['_translation'] = {'source': msg['text'], 'prefix': prefix, 'target': lang}
        elif msg.get('voice'):
            method, payload = 'sendVoice', {'voice': msg['voice']['file_id'], 'caption': prefix + '\n' + msg.get('caption', '')[:800]}
        elif msg.get('photo'):
            method, payload = 'sendPhoto', {'photo': msg['photo'][-1]['file_id'], 'caption': prefix + '\n' + msg.get('caption', '')[:800]}
        else:
            self.say(db, uid, 'chat_prompt')
            return
        self.relay_queue(db, ride, uid, method, {'chat_id': other, 'reply_markup': markup, **payload})
        self.say(db, uid, 'chat_queued')
        return True

    def receive_location(self, db, uid, msg, edited=False):
        if self.fleet_registered(db,uid):
            return  # Coordinator GPS never represents either vehicle.
        mid = msg.get('message_id')
        if edited:
            source = db.execute('SELECT * FROM location_sources WHERE user_id=? AND message_id=? AND enabled=1', (uid, mid)).fetchone()
            if not source:
                return
            # A location from an old trip can never be routed to a new partner.
            ride, other = self.peer(db, uid, source['ride_id'])
        else:
            ride, other = self.peer(db, uid)
        loc = msg['location']
        lat, lon = float(loc['latitude']), float(loc['longitude'])
        if not (-90 <= lat <= 90 and -180 <= lon <= 180):
            raise ValueError('Invalid coordinates')
        self.record_distance(db, ride, uid, msg)
        now = time.time()
        db.execute('''INSERT INTO ride_locations(ride_id,user_id,latitude,longitude,updated_at) VALUES (?,?,?,?,?)
                      ON CONFLICT(ride_id,user_id) DO UPDATE SET latitude=excluded.latitude,longitude=excluded.longitude,updated_at=excluded.updated_at''', (ride['id'], uid, lat, lon, now))
        if not edited and mid is not None and loc.get('live_period'):
            db.execute('UPDATE location_sources SET enabled=0 WHERE ride_id=? AND user_id=?', (ride['id'], uid))
            db.execute('INSERT OR IGNORE INTO location_sources(user_id,message_id,ride_id) VALUES (?,?,?)', (uid, mid, ride['id']))
        if edited and not loc.get('live_period'):
            db.execute('UPDATE location_sources SET enabled=0 WHERE user_id=? AND message_id=?', (uid, mid))
        # Coalesce queued GPS updates: retain the newest position while transport is offline.
        db.execute("UPDATE outbox SET discarded=1 WHERE ride_id=? AND actor_id=? AND method='sendLocation' AND sent_at IS NULL", (ride['id'], uid))
        self.relay_queue(db, ride, uid, 'sendLocation', {'chat_id': other, 'latitude': lat, 'longitude': lon, 'disable_notification': True})
        if not edited:
            self.send(db, uid, t(self.language(db, uid), 'gps_queued'), markup={'remove_keyboard': True})

    def rating_prompt(self, db, uid, ride):
        if db.execute('SELECT 1 FROM ratings WHERE ride_id=?', (ride['id'],)).fetchone():
            self.say(db, uid, 'rating_already')
            return
        self.send(db, uid, t(self.language(db, uid), 'rating_prompt', id=ride['id']),
                  [('⭐' * n, f'rate:{ride["id"]}:{n}') for n in range(1, 6)])

    def driver_rating(self, db, uid, driver):
        stats = db.execute('SELECT AVG(stars) average,COUNT(*) count FROM ratings WHERE driver_id=?', (driver,)).fetchone()
        lang = self.language(db, uid)
        return t(lang, 'rating_summary', average=f'{stats["average"]:.1f}', count=stats['count']) if stats['count'] else t(lang, 'rating_new')
