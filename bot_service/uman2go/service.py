"""Transactional application service. No network calls occur inside transactions.

All state changes, the inbound update receipt, audit events and outbound messages
commit together. Transport retries do not duplicate bookings or assignments.
"""
import json
from decimal import Decimal, InvalidOperation
from .db import connect, initialize, ROUTES
from .i18n import LANGUAGES, t, route_name
from .interaction import Interaction
from .crm import CRM
from .profiles import Profiles
from .companies import Companies
from .distance import Distance
from .activity import notify_activity
from .fleet import Fleet

ACTIVE = "('accepted','arrived','in_progress')"
OPEN = "('completed','cancelled')"

class InvalidAction(Exception):
    pass

def require(condition):
    if not condition:
        raise InvalidAction()

def amount(value):
    try:
        n = Decimal(str(value))
        require(n.is_finite() and Decimal('0.01') <= n <= Decimal('100000') and n * 100 == (n * 100).to_integral_value())
        return int(n * 100)
    except (InvalidOperation, ValueError):
        raise InvalidAction() from None

def integer(value, low=1, high=50):
    try:
        n = int(value)
        require(low <= n <= high)
        return n
    except (ValueError, TypeError):
        raise InvalidAction() from None

class Service(Fleet, Distance, Companies, Profiles, Interaction, CRM):
    def __init__(self, path, admins=(), currency='UAH'):
        self.path, self.admins, self.currency = str(path), set(admins), currency
        initialize(path)

    def language(self, db, uid):
        row = db.execute('SELECT lang FROM users WHERE id=?', (uid,)).fetchone()
        return row['lang'] if row else 'he'

    def enqueue(self, db, method, payload):
        db.execute('INSERT INTO outbox(method,payload) VALUES (?,?)', (method, json.dumps(payload, ensure_ascii=False)))

    def send(self, db, uid, text, buttons=None, markup=None):
        payload = {'chat_id': uid, 'text': text, 'disable_notification': False}
        if buttons:
            payload['reply_markup'] = {'inline_keyboard': [[{'text': label, 'callback_data': data}] for label, data in buttons]}
        elif markup:
            payload['reply_markup'] = markup
        self.enqueue(db, 'sendMessage', payload)

    def say(self, db, uid, key, **values):
        self.send(db, uid, t(self.language(db, uid), key, **values))

    def admins_notify(self, db, text):
        for uid in self.admins:
            self.send(db, uid, text)

    def state(self, db, uid, state, draft=None):
        db.execute('UPDATE users SET state=?,draft=? WHERE id=?', (state, json.dumps(draft or {}), uid))

    def event(self, db, ride, uid, action):
        db.execute('INSERT INTO events(ride_id,actor_id,action) VALUES (?,?,?)', (ride, uid, action))
        if ride is not None and action.startswith('price_accepted:'):
            self.company_assignment(db, ride)

    def home(self, db, uid):
        if uid not in self.admins and not self.has_location(db, uid):
            self.require_location_prompt(db, uid)
            return
        lang = self.language(db, uid)
        buttons = [(t(lang, 'book'), 'book'), (t(lang, 'driver'), 'driver'), (t(lang, 'language'), 'language')]
        buttons.append((self.ct(db, uid, 'area'), 'company'))
        if db.execute("SELECT 1 FROM metadata WHERE key IN ('community_telegram','community_facebook')").fetchone():
            buttons.append((t(lang, 'community_button'), 'community'))
        self.send(db, uid, t(lang, 'welcome'), buttons)

    def money(self, ride, lang):
        currency = '₴ (UAH)' if ride['currency'] == 'UAH' else ride['currency']
        return f"{ride['price'] / 100:.2f} {currency}" if ride['price'] is not None else t(lang, 'unknown_price')

    def summary(self, db, uid, ride):
        lang = self.language(db, uid)
        status = t(lang, 'searching', id=ride['id']) if ride['status'] == 'searching' else t(lang, ride['status'])
        return t(lang, 'summary', id=ride['id'], pickup=ride['pickup'],
                 destination=route_name(lang, ride['route_id']) if ride['route_id'] else ride['destination'],
                 passengers=ride['passengers'], price=self.money(ride, lang), status=status) + '\n' + t(lang, 'payment_terms')

    def ride(self, db, rid):
        row = db.execute('SELECT * FROM rides WHERE id=?', (rid,)).fetchone()
        require(row is not None)
        return row

    def active_passenger(self, db, uid):
        return db.execute(f'SELECT * FROM rides WHERE passenger_id=? AND status NOT IN {OPEN}', (uid,)).fetchone()

    def active_driver(self, db, uid):
        return db.execute(f'SELECT * FROM rides WHERE driver_id=? AND status IN {ACTIVE}', (uid,)).fetchone()

    def passenger_view(self, db, uid, ride):
        lang, rid = self.language(db, uid), ride['id']
        buttons = []
        if ride['status'] == 'quoted':
            buttons.append((t(lang, 'request_prices'), f'confirm:{rid}'))
        if ride['status'] in ('awaiting_quote', 'quoted', 'searching', 'accepted', 'arrived'):
            buttons.append((t(lang, 'cancel'), f'cancel:{rid}'))
        buttons.extend(self.interaction_buttons(db, uid, ride))
        text = self.summary(db, uid, ride)
        if ride['status'] == 'quoted':
            text += '\n\n' + t(lang, 'driver_prices')
        self.send(db, uid, text, buttons)
        if ride['status'] == 'searching':
            for offer in db.execute("SELECT o.*,d.name,d.vehicle FROM offers o JOIN drivers d ON d.id=o.driver_id WHERE o.ride_id=? AND o.status='priced' AND d.approval='approved' AND d.available=1", (rid,)).fetchall():
                self.bid_view(db, uid, ride, offer)

    def bid_view(self, db, uid, ride, offer):
        lang = self.language(db, uid)
        offer=dict(offer)
        suffix=''
        if offer.get('fleet_vehicle_id'):
            v=db.execute('SELECT * FROM fleet_vehicles WHERE id=?',(offer['fleet_vehicle_id'],)).fetchone()
            if not v: return
            offer.update(name=v['driver_name'],vehicle=v['vehicle']+' · '+v['plate'])
            suffix=f":{v['id']}:{offer['price']}"
        self.send(db, uid, t(lang, 'bid_offer', id=ride['id'], name=offer['name'], vehicle=offer['vehicle'],
                  price=self.money({'price': offer['price'], 'currency': ride['currency']}, lang)) + '\n' + self.driver_rating(db, uid, offer['driver_id']),
                  [(t(lang, 'choose_bid'), f'choose:{ride["id"]}:{offer["driver_id"]}'+suffix)])

    def driver_view(self, db, uid, ride):
        lang = self.language(db, uid)
        steps = {'accepted': ('arrive', 'arrived'), 'arrived': ('start_ride', 'in_progress'), 'in_progress': ('finish', 'completed')}
        buttons = []
        if ride['status'] in steps:
            label, status = steps[ride['status']]
            buttons = [(t(lang, label), f'move:{ride["id"]}:{status}')]
        buttons.extend(self.interaction_buttons(db, uid, ride))
        v=self.fleet_profile(db,ride)
        self.send(db, uid, (f"{v['vehicle']} · {v['plate']} · {v['driver_name']}\n" if v else '') + self.summary(db, uid, ride), buttons)

    def dispatch(self, db, ride):
        self.fleet_dispatch(db,ride)
        drivers = db.execute(f'''SELECT d.* FROM drivers d WHERE approval='approved' AND available=1
            AND seats>=? AND d.id!=? AND NOT EXISTS
            (SELECT 1 FROM rides r WHERE r.driver_id=d.id AND r.status IN {ACTIVE}) AND NOT EXISTS
            (SELECT 1 FROM rides r WHERE r.passenger_id=d.id AND r.status NOT IN {OPEN})''',
            (ride['passengers'], ride['passenger_id'])).fetchall()
        for d in drivers:
            if self.fleet_registered(db,d['id']):
                continue
            if not self.has_location(db, d['id']):
                continue
            cursor = db.execute('INSERT OR IGNORE INTO offers(ride_id,driver_id) VALUES (?,?)', (ride['id'], d['id']))
            if cursor.rowcount:
                lang = self.language(db, d['id'])
                self.send(db, d['id'], t(lang, 'offer') + '\n' + self.summary(db, d['id'], ride),
                          [(t(lang, 'offer_price'), f'accept:{ride["id"]}'), (t(lang, 'decline'), f'decline:{ride["id"]}')])
        return db.execute("SELECT COUNT(*) FROM offers WHERE ride_id=? AND status IN ('offered','priced')", (ride['id'],)).fetchone()[0]

    def cancel(self, db, uid, rid, admin=False):
        ride = self.ride(db, rid)
        require(admin or (ride['passenger_id'] == uid and ride['status'] != 'in_progress'))
        require(ride['status'] not in ('completed', 'cancelled'))
        notified_drivers = {r['driver_id'] for r in db.execute("SELECT driver_id FROM offers WHERE ride_id=? AND status IN ('offered','priced')", (rid,))}
        db.execute("UPDATE rides SET status='cancelled',updated_at=CURRENT_TIMESTAMP WHERE id=?", (rid,))
        db.execute("UPDATE offers SET status='closed' WHERE ride_id=? AND status IN ('offered','priced')", (rid,))
        self.event(db, rid, uid, 'cancelled')
        self.communication_closed(db, rid)
        for target in ({ride['passenger_id'], ride['driver_id']} | notified_drivers) - {None}:
            self.send(db, target, t(self.language(db, target), 'cancelled') + f' · #{rid}')

    def process(self, update):
        """Durably handle one private-chat Telegram update, once, in a write transaction."""
        db = connect(self.path)
        try:
            db.execute('BEGIN IMMEDIATE')
            if db.execute('SELECT 1 FROM updates WHERE id=?', (update['update_id'],)).fetchone():
                db.rollback()
                return
            callback = update.get('callback_query')
            edited = 'edited_message' in update
            msg = callback.get('message', {}) if callback else update.get('message', update.get('edited_message', {}))
            sender = callback.get('from', {}) if callback else msg.get('from', {})
            if msg.get('chat', {}).get('type') == 'private' and sender.get('id') == msg['chat']['id']:
                uid = sender['id']
                lang = sender.get('language_code', 'he').split('-')[0]
                db.execute('INSERT OR IGNORE INTO users(id,name,lang) VALUES (?,?,?)',
                           (uid, sender.get('first_name', str(uid))[:120], lang if lang in LANGUAGES else 'en'))
                if callback:
                    self.enqueue(db, 'answerCallbackQuery', {'callback_query_id': callback['id']})
                db.execute('SAVEPOINT action')
                previous_state = db.execute('SELECT state FROM users WHERE id=?', (uid,)).fetchone()['state']
                activity = (callback.get('data', '').split(':')[0] if callback else
                            'location' if msg.get('location') else
                            msg.get('text', '').split()[0].split('@')[0] if msg.get('text', '').startswith('/') else
                            'photo' if msg.get('photo') else previous_state)
                succeeded = True
                try:
                    self.track_customer(db, uid, msg, callback)
                    if self.access_gate(db, uid, msg, callback.get('data') if callback else None, edited):
                        succeeded = bool(msg.get('location'))
                    elif edited:
                        if msg.get('location'):
                            self.receive_location(db, uid, msg, edited=True)
                    else:
                        self.handle(db, uid, msg, callback.get('data') if callback else None)
                except (InvalidAction, ValueError, KeyError, TypeError, IndexError):
                    succeeded = False
                    db.execute('ROLLBACK TO action')
                    self.say(db, uid, 'invalid')
                db.execute('RELEASE action')
                details = ''
                if callback and len(callback.get('data', '').split(':')) > 1 and callback.get('data', '').split(':')[0] in ('choose','cancel','move','accept','decline','rate'):
                    details = '#' + callback['data'].split(':')[1]
                elif msg.get('text', '').split() and activity in ('/approve','/reject','/approvecompany','/rejectcompany','/cancelride'):
                    args = msg['text'].split()
                    if len(args) > 1 and args[1].isdigit():
                        details = 'ID ' + args[1]
                notify_activity(self, db, uid, activity, succeeded, details)
            db.execute('INSERT INTO updates(id) VALUES (?)', (update['update_id'],))
            db.execute("INSERT INTO metadata(key,value) VALUES ('offset',?) ON CONFLICT(key) DO UPDATE SET value=MAX(CAST(metadata.value AS INTEGER),CAST(excluded.value AS INTEGER))", (str(update['update_id'] + 1),))
            db.commit()
        except BaseException:
            db.rollback()
            raise
        finally:
            db.close()

    def handle(self, db, uid, msg, data):
        user = db.execute('SELECT * FROM users WHERE id=?', (uid,)).fetchone()
        lang, state, draft = user['lang'], user['state'], json.loads(user['draft'])
        text = msg.get('text', '').strip()
        command = text.split()[0].split('@')[0] if text.startswith('/') else ''
        if self.handle_fleet(db,uid,msg,data,command,state,draft):
            return
        if self.handle_company(db, uid, msg, data, command, state, draft):
            return
        if self.handle_profile(db, uid, msg, data, command, state):
            return
        if self.handle_crm(db, uid, msg, data, command):
            return
        if self.handle_interaction(db, uid, msg, data, command, state, draft):
            return
        if data == 'language' or command in ('/start', '/language'):
            if command == '/start':
                self.state(db, uid, 'home')
            self.send(db, uid, 'בחרו שפה / Choose language / Выберите язык / Виберіть мову',
                      [(name, 'lang:' + code) for code, name in LANGUAGES.items()])
            return
        if data and data.startswith('lang:'):
            code = data.split(':')[1]
            require(code in LANGUAGES)
            db.execute('UPDATE users SET lang=? WHERE id=?', (code, uid))
            self.state(db, uid, 'home')
            self.home(db, uid)
            return
        admin_commands = ('/admin', '/drivers', '/approve', '/reject', '/rides', '/prices', '/cancelride', '/health')
        if command in admin_commands:
            require(uid in self.admins)
            self.admin(db, uid, command, text.split()[1:])
            return
        if command in ('/status', '/help'):
            ride = self.active_driver(db, uid)
            if ride:
                self.driver_view(db, uid, ride)
            elif (ride := self.active_passenger(db, uid)):
                self.passenger_view(db, uid, ride)
            else:
                self.say(db, uid, 'none')
                self.home(db, uid)
            return
        if command == '/cancel':
            ride = self.active_passenger(db, uid)
            if ride:
                self.cancel(db, uid, ride['id'])
            self.state(db, uid, 'home')
            self.home(db, uid)
            return
        if data == 'book' or command == '/book':
            ride = self.active_passenger(db, uid)
            if ride:
                self.passenger_view(db, uid, ride)
                return
            require(not self.active_driver(db, uid))
            self.state(db, uid, 'pickup')
            self.send(db, uid, t(lang, 'pickup'), markup={'keyboard': [[{'text': t(lang, 'share'), 'request_location': True}]], 'resize_keyboard': True, 'one_time_keyboard': True})
            return
        if data == 'driver' or command == '/driver':
            d = db.execute('SELECT * FROM drivers WHERE id=?', (uid,)).fetchone()
            if d:
                self.profile_view(db, uid, uid)
                if d['approval'] != 'approved':
                    self.say(db, uid, d['approval'])
                elif (ride := self.active_driver(db, uid)):
                    self.driver_view(db, uid, ride)
                else:
                    self.send(db, uid, t(lang, 'driver') + '\n' + t(lang, 'online' if d['available'] else 'offline'),
                              [(t(lang, 'online'), 'available:1'), (t(lang, 'offline'), 'available:0')])
            else:
                self.state(db, uid, 'vehicle')
                self.say(db, uid, 'vehicle')
            return
        if data:
            parts = data.split(':')
            action = parts[0]
            if action == 'route':
                require(state == 'destination' and parts[1] in ROUTES)
                draft.update(route_id=parts[1], destination=route_name(lang, parts[1]))
                self.state(db, uid, 'passengers', draft)
                self.say(db, uid, 'passengers')
            elif action == 'available':
                require(parts[1] in ('0', '1'))
                d = db.execute('SELECT * FROM drivers WHERE id=?', (uid,)).fetchone()
                require(d and d['approval'] == 'approved' and not self.active_driver(db, uid) and not self.active_passenger(db, uid))
                db.execute('UPDATE drivers SET available=? WHERE id=?', (int(parts[1]), uid))
                self.say(db, uid, 'availability', value=t(lang, 'online' if parts[1] == '1' else 'offline'))
                if parts[1] == '1':
                    for ride in db.execute("SELECT * FROM rides WHERE status='searching'").fetchall():
                        self.dispatch(db, ride)
            elif action in ('confirm', 'cancel', 'accept', 'decline', 'move', 'choose'):
                rid = integer(parts[1], 1, 2**63 - 1)
                ride = self.ride(db, rid)
                if action == 'cancel':
                    self.cancel(db, uid, rid)
                elif action == 'confirm':
                    require(ride['passenger_id'] == uid and ride['status'] == 'quoted')
                    db.execute("UPDATE rides SET status='searching',updated_at=CURRENT_TIMESTAMP WHERE id=?", (rid,))
                    self.event(db, rid, uid, 'confirmed')
                    ride = self.ride(db, rid)
                    self.passenger_view(db, uid, ride)
                    if not self.dispatch(db, ride):
                        self.say(db, uid, 'no_drivers')
                        self.admins_notify(db, f'No available drivers / אין נהגים זמינים: #{rid}')
                elif action in ('accept', 'decline'):
                    d = db.execute('SELECT * FROM drivers WHERE id=?', (uid,)).fetchone()
                    offer = db.execute("SELECT 1 FROM offers WHERE ride_id=? AND driver_id=? AND status='offered'", (rid, uid)).fetchone()
                    require(offer and d and d['approval'] == 'approved' and ride['status'] == 'searching')
                    if action == 'decline':
                        db.execute("UPDATE offers SET status='declined' WHERE ride_id=? AND driver_id=?", (rid, uid))
                        self.say(db, uid, 'declined')
                        if not self.dispatch(db, ride):
                            self.say(db, ride['passenger_id'], 'no_drivers')
                            self.admins_notify(db, f'All offers declined / כל ההצעות נדחו: #{rid}')
                    else:
                        require(d['available'] and d['seats'] >= ride['passengers'] and not self.active_driver(db, uid) and not self.active_passenger(db, uid))
                        self.state(db, uid, 'bid', {'ride_id': rid})
                        self.say(db, uid, 'bid_amount', currency='₴ (UAH)' if ride['currency'] == 'UAH' else ride['currency'])
                elif action == 'choose':
                    driver = integer(parts[2], 1, 2**63 - 1)
                    require(ride['passenger_id'] == uid and ride['status'] == 'searching')
                    d = db.execute('SELECT * FROM drivers WHERE id=?', (driver,)).fetchone()
                    offer = db.execute("SELECT * FROM offers WHERE ride_id=? AND driver_id=? AND status='priced'", (rid, driver)).fetchone()
                    require(offer and d and d['approval'] == 'approved' and d['available'] and self.has_location(db, driver) and d['seats'] >= ride['passengers'] and not self.active_driver(db, driver) and not self.active_passenger(db, driver))
                    db.execute("UPDATE rides SET driver_id=?,price=?,status='accepted',updated_at=CURRENT_TIMESTAMP WHERE id=? AND status='searching'", (driver, offer['price'], rid))
                    db.execute('UPDATE drivers SET available=0 WHERE id=?', (driver,))
                    db.execute("UPDATE offers SET status=CASE WHEN driver_id=? THEN 'accepted' ELSE 'closed' END WHERE ride_id=?", (driver, rid))
                    self.event(db, rid, uid, f'price_accepted:{driver}:{offer["price"]}')
                    self.profile_view(db, uid, d['id'])
                    self.say(db, uid, 'assigned', name=d['name'], vehicle=d['vehicle'], plate=d['plate'], phone=d['phone'])
                    self.passenger_view(db, uid, self.ride(db, rid))
                    self.driver_view(db, driver, self.ride(db, rid))
                else:
                    target = parts[2]
                    require(ride['driver_id'] == uid and {'accepted': 'arrived', 'arrived': 'in_progress', 'in_progress': 'completed'}.get(ride['status']) == target)
                    db.execute('UPDATE rides SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?', (target, rid))
                    self.event(db, rid, uid, target)
                    if target == 'in_progress':
                        self.start_distance(db, rid)
                        self.say(db, uid, 'distance_start')
                    self.say(db, ride['passenger_id'], target)
                    self.driver_view(db, uid, self.ride(db, rid))
                    if target == 'completed':
                        self.finish_distance(db, rid)
                        for recipient in (ride['passenger_id'], uid):
                            self.send(db, recipient, self.trip_receipt(db, recipient, self.ride(db, rid)))
                        self.communication_closed(db, rid)
                        self.rating_prompt(db, ride['passenger_id'], self.ride(db, rid))
            else:
                raise InvalidAction()
            return
        if state == 'pickup':
            location = msg.get('location')
            if location:
                lat, lon = float(location['latitude']), float(location['longitude'])
                require(-90 <= lat <= 90 and -180 <= lon <= 180)
                pickup = f'https://maps.google.com/?q={lat},{lon}'
            else:
                self.require_location_prompt(db, uid)
                return
            self.state(db, uid, 'destination', {'pickup': pickup})
            self.send(db, uid, t(lang, 'destination'), markup={'remove_keyboard': True})
            self.send(db, uid, t(lang, 'route_choice'),
                      [(route_name(lang, route), 'route:' + route) for route in ROUTES])
        elif state == 'destination':
            require(5 <= len(text) <= 400 and not text.startswith('/'))
            draft.update(destination=text, route_id=None)
            self.state(db, uid, 'passengers', draft)
            self.say(db, uid, 'passengers')
        elif state == 'passengers':
            count = integer(text)
            require(not self.active_passenger(db, uid) and not self.active_driver(db, uid))
            price, status = None, 'quoted'
            cur = db.execute('''INSERT INTO rides(passenger_id,pickup,destination,route_id,passengers,price,currency,status)
                                VALUES (?,?,?,?,?,?,?,?)''', (uid, draft['pickup'], draft['destination'], draft['route_id'], count, price, self.currency, status))
            self.event(db, cur.lastrowid, uid, 'created')
            self.state(db, uid, 'home')
            ride = self.ride(db, cur.lastrowid)
            self.passenger_view(db, uid, ride)
        elif state == 'bid':
            rid = draft['ride_id']
            ride = self.ride(db, rid)
            d = db.execute('SELECT * FROM drivers WHERE id=?', (uid,)).fetchone()
            offer = db.execute("SELECT 1 FROM offers WHERE ride_id=? AND driver_id=? AND status='offered'", (rid, uid)).fetchone()
            require(ride['status'] == 'searching' and offer and d and d['approval'] == 'approved' and d['available'] and not self.active_driver(db, uid))
            price = amount(text)
            db.execute("UPDATE offers SET price=?,status='priced' WHERE ride_id=? AND driver_id=?", (price, rid, uid))
            self.event(db, rid, uid, f'price_offered:{price}')
            self.state(db, uid, 'home')
            self.say(db, uid, 'bid_sent')
            self.bid_view(db, ride['passenger_id'], ride, {'price': price, 'driver_id': uid, 'name': d['name'], 'vehicle': d['vehicle']})
        elif state == 'vehicle':
            require(3 <= len(text) <= 100 and not text.startswith('/'))
            self.state(db, uid, 'plate', {'vehicle': text})
            self.say(db, uid, 'plate')
        elif state == 'plate':
            require(2 <= len(text) <= 25 and not text.startswith('/'))
            draft['plate'] = text
            self.state(db, uid, 'seats', draft)
            self.say(db, uid, 'seats')
        elif state == 'seats':
            draft['seats'] = integer(text)
            self.state(db, uid, 'phone', draft)
            self.send(db, uid, t(lang, 'phone'), markup={'keyboard': [[{'text': t(lang, 'share_phone'), 'request_contact': True}]], 'resize_keyboard': True, 'one_time_keyboard': True})
        elif state == 'phone':
            contact = msg.get('contact', {})
            phone = contact.get('phone_number', '')
            require(contact.get('user_id') == uid and 5 <= len(phone) <= 30)
            db.execute('INSERT INTO drivers(id,name,phone,vehicle,plate,seats) VALUES (?,?,?,?,?,?)',
                       (uid, user['name'], phone, draft['vehicle'], draft['plate'], draft['seats']))
            self.state(db, uid, 'profile_photo')
            self.send(db, uid, t(lang, 'photo_prompt'), markup={'remove_keyboard': True})
            self.admins_notify(db, f'Driver / נהג: {uid}\n{user["name"]} • {draft["vehicle"]} • {draft["plate"]}\n{phone}\n/approve {uid}\n/reject {uid}')
        else:
            self.home(db, uid)

    def admin(self, db, uid, command, args):
        lang = self.language(db, uid)
        if command == '/admin':
            self.say(db, uid, 'admin_help')
            self.send(db, uid, '/companies\n/approvecompany ID\n/rejectcompany ID')
            self.send(db, uid, 'CRM: /customers [page] · /customer ID\n/tag ID TAG · /note ID TEXT\n/setcommunity telegram URL\n/setcommunity facebook URL\nמקור לקוחות: קישור לבוט עם ?start=telegram או ?start=facebook')
        elif command == '/health':
            row = db.execute('SELECT SUM(sent_at IS NULL AND failed=0 AND discarded=0) pending,SUM(failed AND discarded=0) failed FROM outbox').fetchone()
            self.send(db, uid, f'Notifications / הודעות: pending={row["pending"] or 0}, failed={row["failed"] or 0}')
        elif command == '/drivers':
            rows = db.execute('SELECT * FROM drivers ORDER BY id LIMIT 100').fetchall()
            for d in rows:
                self.profile_view(db, uid, d['id'])
                self.send(db, uid, f'{d["id"]} | {d["name"]}\n{d["vehicle"]} | {d["plate"]} | {d["phone"]}\n{d["seats"]} seats | {d["approval"]} | online={d["available"]}\n' + self.driver_rating(db, uid, d['id']))
            if not rows:
                self.send(db, uid, '0')
        elif command == '/rides':
            rows = db.execute('SELECT * FROM rides ORDER BY id DESC LIMIT 20').fetchall()
            for ride in rows:
                self.send(db, uid, self.summary(db, uid, ride) + f'\nPassenger ID: {ride["passenger_id"]} | Driver ID: {ride["driver_id"]}')
            if not rows:
                self.send(db, uid, '0')
        elif command == '/prices':
            rows = db.execute('''SELECT o.*,r.currency FROM offers o JOIN rides r ON r.id=o.ride_id
                                 WHERE o.price IS NOT NULL ORDER BY o.ride_id DESC LIMIT 30''').fetchall()
            self.say(db, uid, 'driver_prices')
            for offer in rows:
                self.send(db, uid, f'Ride #{offer["ride_id"]} | Driver {offer["driver_id"]} | {self.money(offer, lang)} | {offer["status"]}')
        elif command in ('/approve', '/reject'):
            require(len(args) == 1)
            driver = integer(args[0], 1, 2**63 - 1)
            require(db.execute('SELECT 1 FROM drivers WHERE id=?', (driver,)).fetchone())
            if command == '/approve':
                require(db.execute('SELECT photo_id FROM drivers WHERE id=?', (driver,)).fetchone()['photo_id'])
            status = 'approved' if command == '/approve' else 'rejected'
            db.execute('UPDATE drivers SET approval=?,available=0 WHERE id=?', (status, driver))
            self.event(db, None, uid, f'driver:{driver}:{status}')
            self.say(db, driver, status)
            self.say(db, uid, 'saved')
        elif command == '/cancelride':
            require(len(args) == 1)
            self.cancel(db, uid, integer(args[0], 1, 2**63 - 1), admin=True)
            self.say(db, uid, 'saved')
