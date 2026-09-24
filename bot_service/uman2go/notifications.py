"""Private inbox backed by the same durable messages delivered to Telegram."""
import json
import re
from .i18n import LANGUAGES, t


def initialize_inbox(db):
    db.execute('''CREATE TABLE IF NOT EXISTS notification_reads (
        user_id INTEGER NOT NULL, notification_id INTEGER NOT NULL,
        PRIMARY KEY(user_id, notification_id))''')
    db.execute("CREATE INDEX IF NOT EXISTS outbox_recipient ON outbox(json_extract(payload,'$.chat_id'),id)")


def owned_message(db, uid, nid):
    row = db.execute("SELECT * FROM outbox WHERE id=? AND discarded=0 AND method IN ('sendMessage','sendPhoto') AND json_extract(payload,'$.chat_id')=?", (nid, uid)).fetchone()
    if row is None:
        raise ValueError('Notification unavailable')
    return row, json.loads(row['payload'])


def pending_driver(db, text):
    # Only recognize the server's registration header or its standalone command card.
    match = re.match(r'^(?:Driver / נהג: |/approve )(\d+)(?:\s|$)', text)
    if not match:
        return None
    target = int(match.group(1))
    row = db.execute("SELECT id FROM drivers WHERE id=? AND approval='pending' AND photo_id IS NOT NULL AND photo_id!=''", (target,)).fetchone()
    return target if row else None


def inbox(db, uid, admins):
    rows = db.execute("""SELECT o.*,n.notification_id read_id FROM outbox o
        LEFT JOIN notification_reads n ON n.notification_id=o.id AND n.user_id=?
        WHERE o.discarded=0 AND o.method IN ('sendMessage','sendPhoto')
        AND json_extract(o.payload,'$.chat_id')=? ORDER BY o.id DESC LIMIT 250""", (uid, uid)).fetchall()
    items = []
    for row in rows:
        payload = json.loads(row['payload'])
        text = payload.get('text', payload.get('caption', ''))
        if not text or not important_message(row, payload):
            continue
        target = pending_driver(db, text) if uid in admins else None
        display_text = re.sub(r'/(?:approve|reject) \d+', '', text).strip() if uid in admins else text
        if not display_text:
            display_text = 'Driver / נהג: ' + text.split()[1]
        items.append({'id': row['id'], 'text': display_text, 'read': row['read_id'] is not None,
                      'approve_driver': target,
                      'delivery': 'failed' if row['failed'] else 'sent' if row['sent_at'] else 'pending'})
        if len(items) == 50:
            break
    return {'items': items, 'unread': sum(not item['read'] for item in items)}


def important_message(row, payload):
    text = payload.get('text', payload.get('caption', ''))
    if row['ride_id'] is not None or text.startswith(('פעילות במערכת', 'System activity', 'Driver / נהג: ', '/approve ', 'Company #')):
        return True
    actions = [button.get('callback_data', '').split(':')[0]
               for line in payload.get('reply_markup', {}).get('inline_keyboard', []) for button in line]
    if any(action in ('choose', 'accept', 'move', 'cancel', 'rate') for action in actions):
        return True
    for lang in LANGUAGES:
        for key in ('cancelled', 'approved', 'rejected', 'bid_sent', 'no_drivers', 'completed'):
            if text.startswith(t(lang, key)):
                return True
    return False


def mark_read(db, uid, nid):
    owned_message(db, uid, nid)
    db.execute('INSERT OR IGNORE INTO notification_reads VALUES (?,?)', (uid, nid))


def approve_from_notification(db, service, uid, nid):
    if uid not in service.admins:
        raise ValueError('Admin required')
    _, payload = owned_message(db, uid, nid)
    target = pending_driver(db, payload.get('text', ''))
    if target is None:
        raise ValueError('Driver no longer pending')
    service.admin(db, uid, '/approve', [str(target)])
    mark_read(db, uid, nid)
    return target
