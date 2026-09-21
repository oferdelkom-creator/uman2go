"""Offline end-to-end demo using real application handlers and a temporary database."""
import argparse
import json
import tempfile
from pathlib import Path
from .db import connect
from .service import Service
from .runtime import Worker

def run_demo():
    with tempfile.TemporaryDirectory() as directory:
        path = Path(directory) / 'demo.sqlite3'
        service = Service(path, {900})
        class DemoTransport:
            def call(self, method, payload):
                return True
        worker = Worker(path, DemoTransport())
        seq = 0
        actors = {900: 'מנהל', 10: 'דוד הנהג', 11: 'מיכאל הנהג', 20: 'יוסף הנוסע'}
        def send(uid, text=None, data=None, **extra):
            nonlocal seq
            seq += 1
            sender = {'id': uid, 'first_name': actors[uid], 'language_code': 'he'}
            msg = {'chat': {'id': uid, 'type': 'private'}, 'from': sender, **extra}
            if text:
                msg['text'] = text
            update = {'update_id': seq}
            if data:
                update['callback_query'] = {'id': str(seq), 'from': sender, 'message': msg, 'data': data}
            else:
                update['message'] = msg
            service.process(update)
            worker.flush()
        for uid, car, plate in ((10, 'מרצדס ויטו שחורה', 'AA1234BB'), (11, 'פולקסווגן לבנה', 'AA5678CC')):
            send(uid, location={'latitude': 48.75, 'longitude': 30.22}, message_id=uid)
            for text in ('/driver', car, plate, '6'):
                send(uid, text)
            send(uid, contact={'user_id': uid, 'phone_number': '+380000000000'})
            send(900, f'/approve {uid}')
            send(uid, data='available:1')
        send(20, '/start facebook')
        send(20, data='lang:he')
        send(20, location={'latitude': 47.01, 'longitude': 28.86}, message_id=20)
        send(20, data='book')
        send(20, location={'latitude': 47.01, 'longitude': 28.86})
        send(20, data='route:chisinau_uman')
        send(20, '3')
        send(20, data='confirm:1')
        send(10, data='accept:1')
        send(10, '180')
        send(11, data='accept:1')
        send(11, '165')
        send(20, data='choose:1:11')
        send(11, '/message אני בדרך לנקודת האיסוף')
        send(20, '/message מחכה ליד הכניסה')
        send(11, location={'latitude': 47.02, 'longitude': 28.87}, message_id=111)
        send(20, '/where')
        for status in ('arrived', 'in_progress', 'completed'):
            send(11, data='move:1:' + status)
        send(900, '/prices')
        send(20, data='rate:1:5')
        send(20, '/subscribe')
        send(900, '/customer 20')
        db = connect(path)
        ride = dict(db.execute('SELECT * FROM rides').fetchone())
        assert ride['status'] == 'completed' and ride['price'] == 16500 and ride['driver_id'] == 11
        assert db.execute('SELECT stars FROM ratings WHERE ride_id=1').fetchone()[0] == 5
        assert db.execute('SELECT source FROM customers WHERE user_id=20').fetchone()[0] == 'facebook'
        messages = [json.loads(r['payload']) for r in db.execute("SELECT payload FROM outbox WHERE method IN ('sendMessage','sendLocation') AND sent_at IS NOT NULL ORDER BY id")]
        events = [dict(r) for r in db.execute('SELECT * FROM events ORDER BY id')]
        db.close()
        result = ['# UMAN2GO — הדגמה מקומית שעברה בהצלחה', '',
                  'זוהי סימולציה באמצעות מנוע הבוט האמיתי ובסיס נתונים זמני. לא נשלחו הודעות בטלגרם.',
                  'השמות, הטלפונים והמחירים בדוגמה הם נתוני בדיקה בלבד.', '',
                  'שני נהגים הציעו 180 ו־165 ₴ (UAH). הנוסע בחר בהצעת 165 ₴, והנסיעה הושלמה.', '', '## הודעות לנוסע', '']
        for msg in messages:
            if msg['chat_id'] == 20:
                result.extend(['```text', msg.get('text', f'GPS: {msg.get("latitude")}, {msg.get("longitude")}'), '```'])
                for row in msg.get('reply_markup', {}).get('inline_keyboard', []):
                    result.append('כפתור: ' + ' | '.join(b['text'] for b in row))
                result.append('')
        result.extend(['## רישום פעולות', '', '```json', json.dumps(events, ensure_ascii=False, indent=2), '```'])
        return '\n'.join(result)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', default='DEMO.md')
    args = parser.parse_args()
    Path(args.output).write_text(run_demo(), encoding='utf-8')
    print('Demo passed: two driver quotes, passenger selection, arrival, start, completion.')
    print('Saved: ' + args.output)

if __name__ == '__main__':
    main()
