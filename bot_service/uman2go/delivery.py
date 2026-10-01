"""Ride alerts have durable identities, priority and send-time eligibility checks."""
import json
import os

OPEN_RIDE = ('accepted', 'arrived', 'in_progress')


def enqueue_notice(service, db, uid, text, buttons, kind, ride, driver=None, version=0):
    key = f'{kind}:{ride}:{uid}:{driver or 0}:{version}'
    keyboard = [[{'text': label, 'callback_data': data}] for label, data in buttons]
    url = os.getenv('MINIAPP_URL', 'https://uman2go-live.vercel.app/api/umanbot').rstrip('/')
    # Existing app authenticates the user and shows their own active ride.
    labels = {'he': 'פתיחת הנסיעה', 'en': 'Open ride', 'ru': 'Открыть поездку', 'uk': 'Відкрити поїздку'}
    keyboard.append([{'text': labels.get(service.language(db, uid), 'Open ride'),
                      'web_app': {'url': url + ('&' if '?' in url else '?') + f'ride={ride}'}}])
    payload = {'chat_id': uid, 'text': text, 'disable_notification': False,
               'reply_markup': {'inline_keyboard': keyboard}}
    db.execute('''INSERT OR IGNORE INTO outbox(method,payload,event_key,notice_kind,notice_ride,notice_driver,notice_version)
                  VALUES ('sendMessage',?,?,?,?,?,?)''',
               (json.dumps(payload, ensure_ascii=False), key, kind, ride, driver, version))


def relevant(service, db, row):
    if not row['notice_kind']:
        return True
    ride = db.execute('SELECT * FROM rides WHERE id=?', (row['notice_ride'],)).fetchone()
    if not ride:
        return False
    uid = json.loads(row['payload'])['chat_id']
    if row['notice_kind'] == 'status':
        return ride['passenger_id'] == uid and ride['status'] == OPEN_RIDE[row['notice_version']]
    driver = row['notice_driver']
    offer = db.execute('SELECT * FROM offers WHERE ride_id=? AND driver_id=?', (ride['id'], driver)).fetchone()
    d = db.execute("SELECT * FROM drivers WHERE id=? AND approval='approved' AND available=1", (driver,)).fetchone()
    if not d or not offer or ride['status'] != 'searching' or service.active_passenger(db, driver):
        return False
    if service.fleet_registered(db, driver):
        free = service.fleet_free(db, driver, ride['passengers'])
        eligible = service.fleet_ready(db, driver) and bool(free)
        if row['notice_kind'] == 'quote':
            eligible = eligible and any(v['id'] == offer['fleet_vehicle_id'] for v in free)
    else:
        eligible = d['seats'] >= ride['passengers'] and not service.active_driver(db, driver)
        eligible = eligible and service.has_location(db, driver)
    if row['notice_kind'] == 'request':
        return bool(eligible and uid == driver and offer['status'] == 'offered')
    return bool(eligible and uid == ride['passenger_id'] and offer['status'] == 'priced'
                and offer['version'] == row['notice_version'])
