"""A real company coordinator controls vehicle-scoped rides; no fake Telegram users."""
from .i18n import t

ACTIVE = "('accepted','arrived','in_progress')"
WORDS = {
 'title': ('ניהול צי רכבים', 'Fleet management', 'Управление автопарком', 'Керування автопарком'),
 'intro': ('חשבון מנהל צי הופעל. כל ההזמנות והשיחות מגיעות אליך. בחר רכב לכל הצעה; אפשר שתי נסיעות במקביל ברכבים שונים. הנהג הנוסף אינו צריך טלפון. הוסף עכשיו את הרכב השני. המיקום שלך אינו מוצג כמיקום הרכב.', 'Fleet account enabled. All orders and conversations reach you. Select a vehicle per quote; two different vehicles can take parallel rides. The other driver needs no phone. Add your second vehicle now. Your position is not shown as the vehicle location.', 'Аккаунт диспетчера включён. Все заказы и сообщения поступают вам. Выбирайте авто для каждой цены; два разных авто могут выполнять поездки одновременно. Второму водителю телефон не нужен. Добавьте второе авто. Ваша геопозиция не показывается как местоположение авто.', 'Обліковий запис диспетчера увімкнено. Усі замовлення та повідомлення надходять вам. Обирайте авто для кожної ціни; два різні авто можуть виконувати поїздки одночасно. Другому водієві телефон не потрібен. Додайте друге авто. Ваша геопозиція не показується як місцезнаходження авто.'),
 'add': ('הוספת רכב', 'Add vehicle', 'Добавить авто', 'Додати авто'),
 'vehicle': ('כתוב דגם וצבע של הרכב השני.', 'Enter the second vehicle model and color.', 'Введите модель и цвет второго авто.', 'Введіть модель і колір другого авто.'),
 'plate': ('כתוב מספר רישוי מלא.', 'Enter the full license plate.', 'Введите полный номер авто.', 'Введіть повний номер авто.'),
 'seats': ('כמה מקומות לנוסעים, ללא הנהג?', 'How many passenger seats, excluding the driver?', 'Сколько мест для пассажиров без водителя?', 'Скільки місць для пасажирів без водія?'),
 'driver': ('כתוב את שם הנהג בפועל ברכב הזה.', 'Enter the name of the actual driver for this vehicle.', 'Введите имя водителя этого авто.', 'Введіть ім’я водія цього авто.'),
 'pending': ('הרכב נשמר וממתין לאישור מנהל.', 'Vehicle saved; awaiting administrator approval.', 'Авто сохранено, ожидает одобрения администратора.', 'Авто збережено, очікує схвалення адміністратора.'),
 'select': ('בחר רכב להצעת המחיר', 'Select vehicle for this quote', 'Выберите авто для предложения цены', 'Оберіть авто для цінової пропозиції'),
 'coordinator': ('מתאם הנסיעה', 'Ride coordinator', 'Диспетчер поездки', 'Диспетчер поїздки'),
 'chooseRide': ('יש כמה נסיעות. בחר את כפתור השיחה בנסיעה המתאימה מתוך /fleet.', 'Multiple rides: use the conversation button on the correct ride in /fleet.', 'Несколько поездок: выберите чат нужной поездки в /fleet.', 'Кілька поїздок: оберіть чат потрібної поїздки в /fleet.'),
 'noGPS': ('מיקום מנהל הצי אינו מיקום הרכב. עדכן הגעה באמצעות כפתור הנסיעה.', 'Coordinator location is not vehicle location. Update arrival using the ride button.', 'Геопозиция диспетчера не является позицией авто. Отметьте прибытие кнопкой поездки.', 'Геопозиція диспетчера не є позицією авто. Позначте прибуття кнопкою поїздки.'),
}

class Fleet:
    def ft(self, db, uid, key):
        return WORDS[key][('he','en','ru','uk').index(self.language(db,uid))]

    def fleet_account(self, db, uid):
        return db.execute('SELECT f.* FROM fleet_accounts f JOIN companies c ON c.id=f.company_id WHERE f.owner_id=? AND c.owner_id=f.owner_id AND c.status=\'approved\'',(uid,)).fetchone()

    def fleet_registered(self, db, uid):
        return db.execute('SELECT 1 FROM fleet_accounts WHERE owner_id=?',(uid,)).fetchone() is not None

    def fleet_ready(self, db, uid):
        d=db.execute("SELECT * FROM drivers WHERE id=? AND approval='approved' AND available=1",(uid,)).fetchone()
        return bool(d and self.fleet_account(db,uid) and not self.active_passenger(db,uid))

    def fleet_free(self, db, uid, seats=1):
        return db.execute(f"SELECT v.* FROM fleet_vehicles v WHERE v.owner_id=? AND v.approval='approved' AND v.available=1 AND v.seats>=? AND NOT EXISTS(SELECT 1 FROM rides r WHERE r.fleet_vehicle_id=v.id AND r.status IN {ACTIVE}) ORDER BY v.id",(uid,seats)).fetchall()

    def fleet_profile(self, db, ride):
        if not ride['fleet_vehicle_id']: return None
        return db.execute('SELECT v.*,d.phone,d.name coordinator FROM fleet_vehicles v JOIN drivers d ON d.id=v.owner_id WHERE v.id=? AND v.owner_id=?',(ride['fleet_vehicle_id'],ride['driver_id'])).fetchone()

    def fleet_view(self, db, uid):
        if not self.fleet_account(db,uid): raise ValueError('Fleet unavailable')
        self.send(db,uid,self.ft(db,uid,'title'),[(self.ft(db,uid,'add'),'fleet:add')])
        for v in db.execute('SELECT * FROM fleet_vehicles WHERE owner_id=? ORDER BY id',(uid,)):
            text=f"#{v['id']} · {v['vehicle']} · {v['plate']}\n{v['driver_name']} · {v['seats']}\n{v['approval']}"
            buttons=[]
            if v['approval']=='approved':
                buttons=[(t(self.language(db,uid),'offline' if v['available'] else 'online'),f"fleet:available:{v['id']}:{0 if v['available'] else 1}")]
            self.send(db,uid,text,buttons)
        for r in db.execute(f'SELECT * FROM rides WHERE driver_id=? AND status IN {ACTIVE} ORDER BY id',(uid,)).fetchall(): self.driver_view(db,uid,r)
        for r in db.execute("SELECT r.* FROM rides r JOIN offers o ON o.ride_id=r.id WHERE o.driver_id=? AND r.status='searching' AND o.status IN ('offered','priced') ORDER BY r.id",(uid,)).fetchall():
            self.send(db,uid,self.summary(db,uid,r),[(self.ft(db,uid,'select'),f"accept:{r['id']}")])

    def fleet_dispatch(self, db, ride):
        for f in db.execute('SELECT owner_id FROM fleet_accounts').fetchall():
            uid=f['owner_id']
            if uid==ride['passenger_id'] or not self.fleet_ready(db,uid) or not self.fleet_free(db,uid,ride['passengers']): continue
            cur=db.execute("INSERT INTO offers(ride_id,driver_id) VALUES (?,?) ON CONFLICT(ride_id,driver_id) DO UPDATE SET status='offered',price=NULL,fleet_vehicle_id=NULL WHERE offers.status='closed'",(ride['id'],uid))
            if cur.rowcount:
                self.send(db,uid,t(self.language(db,uid),'offer')+'\n'+self.summary(db,uid,ride),[(self.ft(db,uid,'select'),f"accept:{ride['id']}"),(t(self.language(db,uid),'decline'),f"decline:{ride['id']}")])

    def fleet_quote(self, db, uid, rid, vid, price):
        from .service import amount
        ride=self.ride(db,rid)
        vehicle=next((v for v in self.fleet_free(db,uid,ride['passengers']) if v['id']==vid),None)
        offer=db.execute("SELECT * FROM offers WHERE ride_id=? AND driver_id=? AND status IN ('offered','priced')",(rid,uid)).fetchone()
        if not self.fleet_ready(db,uid) or not vehicle or not offer or ride['status']!='searching': raise ValueError('Vehicle unavailable')
        price=amount(price)
        db.execute("UPDATE offers SET price=?,fleet_vehicle_id=?,status='priced' WHERE ride_id=? AND driver_id=?",(price,vid,rid,uid))
        self.event(db,rid,uid,f'fleet_price:{vid}:{price}')
        self.state(db,uid,'home')
        self.say(db,uid,'bid_sent')
        self.bid_view(db,ride['passenger_id'],ride,{'price':price,'driver_id':uid,'name':vehicle['driver_name'],'vehicle':vehicle['vehicle']+' · '+vehicle['plate'],'fleet_vehicle_id':vid})

    def fleet_choose(self, db, uid, rid, owner, expected_vehicle, expected_price):
        ride=self.ride(db,rid)
        offer=db.execute("SELECT * FROM offers WHERE ride_id=? AND driver_id=? AND status='priced'",(rid,owner)).fetchone()
        if ride['passenger_id']!=uid or ride['status']!='searching' or not offer or not self.fleet_ready(db,owner): raise ValueError('Invalid fleet offer')
        if (offer['fleet_vehicle_id'],offer['price'])!=(expected_vehicle,expected_price): raise ValueError('Offer changed')
        v=next((v for v in self.fleet_free(db,owner,ride['passengers']) if v['id']==offer['fleet_vehicle_id']),None)
        if not v: raise ValueError('Vehicle unavailable')
        db.execute("UPDATE rides SET driver_id=?,fleet_vehicle_id=?,price=?,status='accepted',updated_at=CURRENT_TIMESTAMP WHERE id=?",(owner,v['id'],offer['price'],rid))
        db.execute('UPDATE fleet_vehicles SET available=0 WHERE id=?',(v['id'],))
        db.execute("UPDATE offers SET status=CASE WHEN driver_id=? THEN 'accepted' ELSE 'closed' END WHERE ride_id=?",(owner,rid))
        db.execute("UPDATE offers SET status='closed' WHERE fleet_vehicle_id=? AND ride_id!=? AND status IN ('offered','priced')",(v['id'],rid))
        c=self.fleet_account(db,owner)
        db.execute('INSERT OR IGNORE INTO company_rides(ride_id,company_id) VALUES (?,?)',(rid,c['company_id']))
        self.event(db,rid,uid,f'price_accepted:{owner}:{offer["price"]}')
        d=db.execute('SELECT * FROM drivers WHERE id=?',(owner,)).fetchone()
        self.say(db,uid,'assigned',name=v['driver_name'],vehicle=v['vehicle'],plate=v['plate'],phone=d['phone'])
        self.send(db,uid,self.ft(db,uid,'coordinator')+': '+d['name'])
        self.passenger_view(db,uid,self.ride(db,rid)); self.driver_view(db,owner,self.ride(db,rid))
        for other in db.execute("SELECT * FROM rides WHERE status='searching'").fetchall(): self.dispatch(db,other)

    def handle_fleet(self, db, uid, msg, data, command, state, draft):
        text=msg.get('text','').strip()
        if command in ('/fleet_enable','/fleet_approve'):
            if uid not in self.admins: raise ValueError('Administrator required')
            target=int(text.split()[1])
            if command=='/fleet_enable':
                c=self.company_owner(db,target)
                d=db.execute("SELECT * FROM drivers WHERE id=? AND approval='approved'",(target,)).fetchone()
                if not d or self.active_driver(db,target) or self.active_passenger(db,target): raise ValueError('Finish current ride first')
                if not self.fleet_registered(db,target):
                    db.execute('INSERT INTO fleet_accounts(owner_id,company_id) VALUES (?,?)',(target,c['id']))
                    db.execute("INSERT INTO fleet_vehicles(owner_id,vehicle,plate,seats,driver_name,approval,available) VALUES (?,?,?,?,?,'approved',?)",(target,d['vehicle'],d['plate'],d['seats'],d['name'],d['available']))
                    db.execute("UPDATE offers SET status='closed' WHERE driver_id=? AND status IN ('offered','priced')",(target,))
                    self.event(db,None,uid,f'fleet_enabled:{target}')
                    self.send(db,target,self.ft(db,target,'intro'),[(self.ft(db,target,'add'),'fleet:add')])
                self.send(db,uid,f'Fleet enabled: {target} · company #{c["id"]}')
            else:
                v=db.execute('SELECT * FROM fleet_vehicles WHERE id=?',(target,)).fetchone()
                if not v or not self.fleet_account(db,v['owner_id']): raise ValueError('Unknown vehicle')
                db.execute("UPDATE fleet_vehicles SET approval='approved' WHERE id=?",(target,))
                self.event(db,None,uid,f'fleet_vehicle_approved:{target}')
                self.fleet_view(db,v['owner_id']); self.send(db,uid,f'Vehicle #{target}: approved')
            return True
        if data and data.startswith('choose:'):
            parts=data.split(':'); rid,owner=parts[1:3]
            if self.fleet_registered(db,int(owner)):
                if len(parts)!=5: raise ValueError('Refresh fleet offer')
                self.fleet_choose(db,uid,int(rid),int(owner),int(parts[3]),int(parts[4])); return True
        registered=self.fleet_registered(db,uid)
        if not registered:
            if data and data.startswith('fleet:'): raise ValueError('Fleet account required')
            return False
        if command in ('/message','/gps','/where') and db.execute(f'SELECT COUNT(*) FROM rides WHERE driver_id=? AND status IN {ACTIVE}',(uid,)).fetchone()[0]>1:
            self.send(db,uid,self.ft(db,uid,'chooseRide')); self.fleet_view(db,uid); return True
        if command in ('/fleet','/driver','/status') or data in ('fleet','driver'):
            self.fleet_view(db,uid); return True
        if data and data.startswith('available:'):
            if not self.fleet_account(db,uid): raise ValueError('Fleet unavailable')
            value=int(data.split(':')[1])
            if value not in (0,1): raise ValueError('Invalid availability')
            db.execute('UPDATE drivers SET available=? WHERE id=?',(value,uid))
            if value:
                for r in db.execute("SELECT * FROM rides WHERE status='searching'").fetchall(): self.dispatch(db,r)
            self.fleet_view(db,uid); return True
        if data and data.startswith('accept:'):
            rid=int(data.split(':')[1]); r=self.ride(db,rid)
            if not self.fleet_ready(db,uid) or r['status']!='searching' or not db.execute("SELECT 1 FROM offers WHERE ride_id=? AND driver_id=? AND status IN ('offered','priced')",(rid,uid)).fetchone(): raise ValueError('No offer')
            self.send(db,uid,self.ft(db,uid,'select'),[(v['vehicle']+' · '+v['plate'],f"fleet:bid:{rid}:{v['id']}") for v in self.fleet_free(db,uid,r['passengers'])]); return True
        if data and data.startswith('fleet:'):
            if not self.fleet_account(db,uid): raise ValueError('Fleet unavailable')
            p=data.split(':')
            if p[1]=='add':
                f=self.fleet_account(db,uid)
                if db.execute('SELECT COUNT(*) FROM fleet_vehicles WHERE owner_id=?',(uid,)).fetchone()[0]>=f['vehicle_limit']: raise ValueError('Vehicle limit reached')
                self.state(db,uid,'fleet_vehicle'); self.send(db,uid,self.ft(db,uid,'vehicle'))
            elif p[1]=='bid':
                rid,vid=int(p[2]),int(p[3]); r=self.ride(db,rid)
                if not self.fleet_ready(db,uid) or not any(v['id']==vid for v in self.fleet_free(db,uid,r['passengers'])): raise ValueError('Vehicle unavailable')
                self.state(db,uid,'fleet_bid',{'ride_id':rid,'vehicle_id':vid}); self.say(db,uid,'bid_amount',currency='₴ (UAH)')
            elif p[1]=='available':
                vid,value=int(p[2]),int(p[3]); v=db.execute("SELECT * FROM fleet_vehicles WHERE id=? AND owner_id=? AND approval='approved'",(vid,uid)).fetchone()
                if not v or value not in (0,1) or db.execute(f'SELECT 1 FROM rides WHERE fleet_vehicle_id=? AND status IN {ACTIVE}',(vid,)).fetchone(): raise ValueError('Vehicle unavailable')
                db.execute('UPDATE fleet_vehicles SET available=? WHERE id=?',(value,vid))
                if value:
                    db.execute('UPDATE drivers SET available=1 WHERE id=?',(uid,))
                    for r in db.execute("SELECT * FROM rides WHERE status='searching'").fetchall(): self.dispatch(db,r)
                self.fleet_view(db,uid)
            else: raise ValueError('Unknown fleet action')
            return True
        if state.startswith('fleet_') and not data and not command:
            if not self.fleet_account(db,uid): raise ValueError('Fleet unavailable')
            field=state[6:]
            if field=='bid': self.fleet_quote(db,uid,draft['ride_id'],draft['vehicle_id'],text); return True
            if field in ('vehicle','plate','driver') and not 2<=len(text)<=100: raise ValueError('Invalid vehicle field')
            if field=='seats':
                value=int(text)
                if not 1<=value<=50: raise ValueError('Invalid seats')
            else: value=text
            draft[field]=value
            next_field={'vehicle':'plate','plate':'seats','seats':'driver'}.get(field)
            if next_field:
                self.state(db,uid,'fleet_'+next_field,draft); self.send(db,uid,self.ft(db,uid,next_field))
            elif field=='driver':
                if db.execute('SELECT COUNT(*) FROM fleet_vehicles WHERE owner_id=?',(uid,)).fetchone()[0]>=self.fleet_account(db,uid)['vehicle_limit']: raise ValueError('Vehicle limit reached')
                vid=db.execute('INSERT INTO fleet_vehicles(owner_id,vehicle,plate,seats,driver_name) VALUES (?,?,?,?,?)',(uid,draft['vehicle'],draft['plate'].upper(),draft['seats'],draft['driver'])).lastrowid
                self.event(db,None,uid,f'fleet_vehicle_added:{vid}')
                self.state(db,uid,'home'); self.send(db,uid,self.ft(db,uid,'pending'))
                self.admins_notify(db,f"Fleet vehicle #{vid} · owner {uid}\n{draft['vehicle']} · {draft['plate']} · {draft['seats']}\n{draft['driver']}\n/fleet_approve {vid}")
            else: raise ValueError('Unknown vehicle field')
            return True
        return False
