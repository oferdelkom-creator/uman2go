"""Customer records and voluntary community entry points. No member scraping."""
from urllib.parse import urlparse
from .i18n import t

class CRM:
    def track_customer(self, db, uid, msg, callback):
        if uid in self.admins:
            return
        args = msg.get('text', '').split() if not callback else []
        source = args[1] if len(args) == 2 and args[0] == '/start' and args[1] in ('telegram', 'facebook') else 'direct'
        db.execute('INSERT OR IGNORE INTO customers(user_id,source) VALUES (?,?)', (uid, source))
        db.execute('UPDATE customers SET last_seen=CURRENT_TIMESTAMP WHERE user_id=?', (uid,))

    def community(self, db, uid):
        lang = self.language(db, uid)
        buttons = []
        for platform, label in (('telegram', 'Telegram'), ('facebook', 'Facebook')):
            value = db.execute('SELECT value FROM metadata WHERE key=?', ('community_' + platform,)).fetchone()
            if value:
                buttons.append([{'text': label, 'url': value['value']}])
        if not buttons:
            self.say(db, uid, 'community_pending')
            return
        self.send(db, uid, t(lang, 'community_intro'), markup={'inline_keyboard': buttons})

    def handle_crm(self, db, uid, msg, data, command):
        if data == 'community' or command == '/community':
            self.community(db, uid)
            return True
        if command in ('/subscribe', '/unsubscribe'):
            db.execute('UPDATE customers SET subscribed=? WHERE user_id=?', (int(command == '/subscribe'), uid))
            self.say(db, uid, 'subscribed' if command == '/subscribe' else 'unsubscribed')
            return True
        if command not in ('/customers', '/customer', '/tag', '/note', '/setcommunity'):
            return False
        if uid not in self.admins:
            raise ValueError('Admin only')
        args = msg.get('text', '').split()[1:]
        if command == '/setcommunity':
            if len(args) != 2 or args[0] not in ('telegram', 'facebook'):
                raise ValueError('Platform and group URL required')
            platform, url = args
            if url == '-':
                db.execute('DELETE FROM metadata WHERE key=?', ('community_' + platform,))
            else:
                parsed = urlparse(url)
                valid = parsed.scheme == 'https' and not parsed.username and not parsed.password and not parsed.port
                valid = valid and ((platform == 'telegram' and parsed.hostname == 't.me' and len(parsed.path) > 1)
                                   or (platform == 'facebook' and parsed.hostname in ('facebook.com', 'www.facebook.com') and parsed.path.startswith('/groups/') and len(parsed.path) > 8))
                if not valid or len(url) > 500:
                    raise ValueError('Use a Telegram invite or Facebook group HTTPS URL')
                db.execute('INSERT INTO metadata(key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value', ('community_' + platform, url))
            self.event(db, None, uid, 'community_link_updated:' + platform)
            self.say(db, uid, 'saved')
        elif command == '/customers':
            page = int(args[0]) if args else 1
            if not 1 <= page <= 100000:
                raise ValueError('Invalid page')
            rows = db.execute('''SELECT c.*,u.name,u.lang FROM customers c JOIN users u ON u.id=c.user_id
                                 ORDER BY c.user_id LIMIT 20 OFFSET ?''', ((page - 1) * 20,)).fetchall()
            total = db.execute('SELECT COUNT(*) FROM customers').fetchone()[0]
            self.send(db, uid, f'לקוחות / Customers: {total} · Page {page}\n/customer ID · /tag ID TAG · /note ID TEXT')
            for row in rows:
                self.send(db, uid, f'{row["user_id"]} | {row["name"]} | {row["lang"]}\n{row["source"]} | {row["tag"]} | opt-in={row["subscribed"]}')
        else:
            if not args:
                raise ValueError('Customer ID required')
            customer = int(args[0])
            row = db.execute('SELECT c.*,u.name,u.lang FROM customers c JOIN users u ON u.id=c.user_id WHERE user_id=?', (customer,)).fetchone()
            if not row:
                raise ValueError('Customer not found')
            if command in ('/tag', '/note'):
                value = ' '.join(args[1:])
                if not 1 <= len(value) <= (30 if command == '/tag' else 500):
                    raise ValueError('Invalid value')
                column = 'tag' if command == '/tag' else 'note'
                db.execute(f'UPDATE customers SET {column}=? WHERE user_id=?', (value, customer))
                self.event(db, None, uid, f'customer_{column}_updated:{customer}')
                self.say(db, uid, 'saved')
            else:
                rides = db.execute('SELECT COUNT(*) count,SUM(status=\'completed\') completed FROM rides WHERE passenger_id=?', (customer,)).fetchone()
                totals = db.execute("SELECT currency,SUM(price) total FROM rides WHERE passenger_id=? AND status='completed' GROUP BY currency", (customer,)).fetchall()
                total_text = ', '.join(f'{r["total"]/100:.2f} {r["currency"]}' for r in totals) or '0'
                rating_count = db.execute('SELECT COUNT(*) FROM ratings WHERE passenger_id=?', (customer,)).fetchone()[0]
                self.send(db, uid, f'{row["name"]} | {customer}\nLanguage: {row["lang"]} | Source: {row["source"]}\nTag: {row["tag"]}\nNote: {row["note"]}\nRides: {rides["count"]} | Completed: {rides["completed"] or 0}\nCompleted ride value (not payment): {total_text}\nRatings given: {rating_count}\nUpdates consent: {row["subscribed"]}\nLast seen: {row["last_seen"]}')
        return True
