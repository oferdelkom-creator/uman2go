"""Driver profile editing and voluntary recruitment, using Telegram photo storage."""
from .i18n import t

class Profiles:
    def profile_view(self, db, viewer, driver):
        d = db.execute('SELECT * FROM drivers WHERE id=?', (driver,)).fetchone()
        if not d:
            self.say(db, viewer, 'join_driver')
            return
        text = t(self.language(db, viewer), 'profile_card', name=d['name'], vehicle=d['vehicle'], seats=d['seats'])
        if d['photo_id']:
            self.enqueue(db, 'sendPhoto', {'chat_id': viewer, 'photo': d['photo_id'], 'caption': text})
        else:
            self.send(db, viewer, text)
        if viewer == driver:
            self.send(db, viewer, t(self.language(db, viewer), 'profile_edit'),
                      [(t(self.language(db, viewer), 'photo_prompt'), 'profile:photo'),
                       (t(self.language(db, viewer), 'vehicle'), 'profile:vehicle'),
                       (t(self.language(db, viewer), 'seats'), 'profile:seats')])

    def handle_profile(self, db, uid, msg, data, command, state):
        if command == '/invite':
            self.say(db, uid, 'join_driver')
            self.send(db, uid, 'https://t.me/UMAN2GO_RidesBot?start=driver')
            return True
        if command == '/start' and msg.get('text', '').split()[-1] == 'driver':
            self.say(db, uid, 'join_driver')
            return False
        if command == '/profile' or data == 'profile':
            self.profile_view(db, uid, uid)
            return True
        if data and data.startswith('profile:'):
            field = data.split(':')[1]
            if field not in ('photo', 'vehicle', 'seats') or self.active_driver(db, uid):
                raise ValueError('Profile locked during a ride')
            if not db.execute('SELECT 1 FROM drivers WHERE id=?', (uid,)).fetchone():
                raise ValueError('Register first')
            self.state(db, uid, 'profile_' + field)
            self.say(db, uid, 'photo_prompt' if field == 'photo' else field)
            return True
        if state.startswith('profile_') and not data and not command:
            if self.active_driver(db, uid):
                raise ValueError('Profile locked during a ride')
            field = state.removeprefix('profile_')
            text = msg.get('text', '').strip()
            if field == 'photo':
                value = msg.get('photo', [{}])[-1].get('file_id')
                if not isinstance(value, str) or not 1 <= len(value) <= 512:
                    raise ValueError('Send a photo')
                column = 'photo_id'
            elif field == 'vehicle':
                if not 3 <= len(text) <= 100:
                    raise ValueError('Enter vehicle type and model')
                value, column = text, 'vehicle'
            elif field == 'seats':
                value, column = int(text), 'seats'
                if not 1 <= value <= 50:
                    raise ValueError('Invalid passenger capacity')
            else:
                return False
            db.execute(f"UPDATE drivers SET {column}=?,approval='pending',available=0 WHERE id=?", (value, uid))
            db.execute("UPDATE offers SET status='closed' WHERE driver_id=? AND status IN ('offered','priced')", (uid,))
            self.state(db, uid, 'home')
            self.say(db, uid, 'pending')
            for admin in self.admins:
                self.profile_view(db, admin, uid)
                self.send(db, admin, f'/approve {uid}\n/reject {uid}')
            self.profile_view(db, uid, uid)
            return True
        return False
