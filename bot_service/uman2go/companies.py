"""Company management with explicit driver consent and assignment-time ownership."""

LABELS = {
 'area': ('חברת הסעות', 'Transport company', 'Транспортная компания', 'Транспортна компанія'),
 'name': ('כתבו את שם החברה (2–100 תווים).', 'Enter company name (2–100 characters).', 'Введите название компании (2–100 символов).', 'Введіть назву компанії (2–100 символів).'),
 'phone': ('שתפו את מספר הטלפון שלכם באמצעות הכפתור.', 'Share your own phone using the button.', 'Поделитесь своим телефоном кнопкой.', 'Поділіться своїм телефоном кнопкою.'),
 'contact': ('שיתוף טלפון', 'Share phone', 'Поделиться телефоном', 'Поділитися телефоном'),
 'pending': ('החברה ממתינה לאישור מנהל.', 'Company pending administrator approval.', 'Компания ожидает одобрения администратора.', 'Компанія очікує схвалення адміністратора.'),
 'approved': ('החברה אושרה.', 'Company approved.', 'Компания одобрена.', 'Компанію схвалено.'),
 'rejected': ('החברה אינה מאושרת לניהול.', 'Company is not approved for management.', 'Компания не допущена к управлению.', 'Компанію не допущено до керування.'),
 'drivers': ('נהגי החברה', 'Company drivers', 'Водители компании', 'Водії компанії'),
 'rides': ('נסיעות החברה', 'Company rides', 'Поездки компании', 'Поїздки компанії'),
 'invite': ('הזמנת נהג', 'Invite driver', 'Пригласить водителя', 'Запросити водія'),
 'id': ('שלחו את מזהה הנהג בטלגרם. הנהג יכול לקבל אותו באמצעות /myid. עליו להירשם תחילה ב־/driver.', 'Send the driver Telegram ID, available with /myid. The driver must register first with /driver.', 'Отправьте Telegram ID водителя из /myid. Сначала нужна регистрация /driver.', 'Надішліть Telegram ID водія з /myid. Спочатку потрібна реєстрація /driver.'),
 'sent': ('ההזמנה נשלחה לנהג לאישור.', 'Invitation sent for driver approval.', 'Приглашение отправлено водителю.', 'Запрошення надіслано водієві.'),
 'consent': ('החברה {name} מזמינה אותך להצטרף. המנהל יוכל לראות את פרופיל הרכב, הזמינות, היעד, המחיר והסטטוס של נסיעות שיוקצו אחרי ההצטרפות, ולהעביר אותך ללא זמין. היסטוריית נסיעות החברה תישמר לאחר עזיבה. לעזיבה: /leavecompany.', 'Company {name} invites you. Its manager can view your vehicle profile, availability, destination, price and status of rides assigned after joining, and set you offline. Company ride history is retained after leaving. Leave with /leavecompany.', 'Компания {name} приглашает вас. Менеджер видит профиль авто, доступность, адрес назначения, цену и статус поездок, назначенных после вступления, и может отключить доступность. История компании сохраняется после выхода. Выход: /leavecompany.', 'Компанія {name} запрошує вас. Менеджер бачить профіль авто, доступність, адресу призначення, ціну та статус поїздок, призначених після вступу, і може вимкнути доступність. Історія компанії зберігається після виходу. Вихід: /leavecompany.'),
 'accept': ('אישור הצטרפות', 'Accept invitation', 'Принять приглашение', 'Прийняти запрошення'),
 'decline': ('דחייה', 'Decline', 'Отклонить', 'Відхилити'),
 'saved': ('עודכן.', 'Updated.', 'Обновлено.', 'Оновлено.'),
 'empty': ('אין רשומות.', 'No records.', 'Нет записей.', 'Немає записів.'),
 'offline': ('העברה ללא זמין', 'Set offline', 'Отключить доступность', 'Вимкнути доступність'),
 'remove': ('הסרה מהחברה', 'Remove from company', 'Удалить из компании', 'Видалити з компанії'),
 'help': ('הנהגים מציעים מחירים; הנוסע מאשר שיבוץ. עד 30 נסיעות אחרונות. /company לפתיחת הניהול.', 'Drivers quote; passengers approve assignment. Up to 30 latest rides. Open management with /company.', 'Водитель предлагает цену, пассажир подтверждает. До 30 последних поездок. Управление: /company.', 'Водій пропонує ціну, пасажир підтверджує. До 30 останніх поїздок. Керування: /company.'),
}

class Companies:
    def ct(self, db, uid, key, **values):
        return LABELS[key][('he','en','ru','uk').index(self.language(db,uid))].format(**values)

    def company_owner(self, db, uid):
        company = db.execute("SELECT * FROM companies WHERE owner_id=? AND status='approved'", (uid,)).fetchone()
        if not company:
            raise ValueError('Approved company owner required')
        return company

    def company_view(self, db, uid):
        if self.fleet_account(db,uid):
            self.fleet_view(db,uid)
            return
        c = db.execute('SELECT * FROM companies WHERE owner_id=?', (uid,)).fetchone()
        if not c:
            self.state(db,uid,'company_name')
            self.send(db,uid,self.ct(db,uid,'name'))
        elif c['status'] != 'approved':
            self.send(db,uid,self.ct(db,uid,c['status']))
        else:
            self.send(db,uid,c['name']+'\n'+self.ct(db,uid,'help'),[(self.ct(db,uid,k),'company:'+k) for k in ('drivers','rides','invite')])

    def company_assignment(self, db, ride_id):
        # Snapshot the affiliation once: joining later cannot expose old rides.
        db.execute('''INSERT OR IGNORE INTO company_rides(ride_id,company_id)
          SELECT r.id,m.company_id FROM rides r JOIN company_members m ON m.driver_id=r.driver_id
          JOIN companies c ON c.id=m.company_id AND c.status='approved' WHERE r.id=?''',(ride_id,))

    def handle_company(self, db, uid, msg, data, command, state, draft):
        text=msg.get('text','').strip()
        if command == '/myid':
            self.send(db,uid,str(uid)); return True
        if command in ('/companies','/approvecompany','/rejectcompany'):
            if uid not in self.admins: raise ValueError('Administrator required')
            if command == '/companies':
                rows=db.execute('SELECT * FROM companies ORDER BY id DESC LIMIT 50').fetchall()
                for c in rows:
                    self.send(db,uid,f"#{c['id']} {c['name']}\n{c['phone']} · {c['status']}\n/approvecompany {c['id']}\n/rejectcompany {c['id']}")
                if not rows:self.send(db,uid,self.ct(db,uid,'empty'))
            else:
                cid=int(text.split()[1]); c=db.execute('SELECT * FROM companies WHERE id=?',(cid,)).fetchone()
                if not c: raise ValueError('Unknown company')
                status='approved' if command=='/approvecompany' else 'rejected'
                db.execute('UPDATE companies SET status=? WHERE id=?',(status,cid))
                self.event(db,None,uid,f'company:{cid}:{status}')
                self.send(db,c['owner_id'],self.ct(db,c['owner_id'],status))
                self.send(db,uid,self.ct(db,uid,'saved'))
            return True
        if command == '/company' or data == 'company':
            self.company_view(db,uid); return True
        if command == '/leavecompany':
            db.execute('DELETE FROM company_members WHERE driver_id=?',(uid,))
            self.event(db,None,uid,'company:left')
            self.send(db,uid,self.ct(db,uid,'saved')); return True
        if data and data.startswith('companyjoin:'):
            _,inv,answer=data.split(':')
            invitation=db.execute("SELECT * FROM company_invites WHERE id=? AND driver_id=? AND status='pending' AND created_at > datetime('now','-7 days')",(int(inv),uid)).fetchone()
            if not invitation or answer not in ('yes','no'):raise ValueError('Invalid invitation')
            c=db.execute("SELECT * FROM companies WHERE id=? AND status='approved'",(invitation['company_id'],)).fetchone()
            if not c:raise ValueError('Company not approved')
            if answer=='yes':
                if db.execute('SELECT 1 FROM company_members WHERE driver_id=?',(uid,)).fetchone() or self.active_driver(db,uid):raise ValueError('Already affiliated or on a ride')
                db.execute('INSERT INTO company_members(driver_id,company_id) VALUES (?,?)',(uid,c['id']))
            db.execute('UPDATE company_invites SET status=? WHERE id=?',('accepted' if answer=='yes' else 'declined',invitation['id']))
            self.event(db,None,uid,f"company:{c['id']}:{answer}")
            self.send(db,uid,self.ct(db,uid,'saved'))
            self.send(db,c['owner_id'],f"{uid}: "+self.ct(db,c['owner_id'],'accept' if answer=='yes' else 'decline'))
            return True
        if data and data.startswith('company:'):
            c=self.company_owner(db,uid); parts=data.split(':'); action=parts[1]
            if action=='invite':
                self.state(db,uid,'company_invite'); self.send(db,uid,self.ct(db,uid,'id'))
            elif action=='drivers':
                rows=db.execute('SELECT d.* FROM drivers d JOIN company_members m ON m.driver_id=d.id WHERE m.company_id=? ORDER BY d.id LIMIT 50',(c['id'],)).fetchall()
                for d in rows:
                    self.profile_view(db,uid,d['id'])
                    self.send(db,uid,f"#{d['id']} · {d['approval']} · "+self.ct(db,uid,'offline')+f": {not bool(d['available'])}",[(self.ct(db,uid,k),f"company:{k}:{d['id']}") for k in ('offline','remove')])
                if not rows:self.send(db,uid,self.ct(db,uid,'empty'))
            elif action=='rides':
                rows=db.execute('SELECT r.* FROM rides r JOIN company_rides cr ON cr.ride_id=r.id WHERE cr.company_id=? ORDER BY r.id DESC LIMIT 30',(c['id'],)).fetchall()
                for r in rows:
                    self.send(db,uid,f"#{r['id']} · driver {r['driver_id']}\n{r['destination']}\n{r['passengers']} · {r['status']} · {self.money(r,self.language(db,uid))}")
                if not rows:self.send(db,uid,self.ct(db,uid,'empty'))
            elif action in ('offline','remove'):
                did=int(parts[2])
                if not db.execute('SELECT 1 FROM company_members WHERE driver_id=? AND company_id=?',(did,c['id'])).fetchone():raise ValueError('Not your driver')
                if action=='remove': db.execute('DELETE FROM company_members WHERE driver_id=?',(did,))
                else:
                    db.execute('UPDATE drivers SET available=0 WHERE id=?',(did,))
                    db.execute("UPDATE offers SET status='closed' WHERE driver_id=? AND status IN ('offered','priced')",(did,))
                self.event(db,None,uid,f"company:{c['id']}:{action}:{did}")
                self.send(db,uid,self.ct(db,uid,'saved'))
                self.send(db,did,c['name']+': '+self.ct(db,did,action))
            else:raise ValueError('Unknown action')
            return True
        if state.startswith('company_') and not command and not data:
            if state=='company_name':
                if not 2<=len(text)<=100:raise ValueError('Invalid name')
                self.state(db,uid,'company_phone',{'name':text})
                self.send(db,uid,self.ct(db,uid,'phone'),markup={'keyboard':[[{'text':self.ct(db,uid,'contact'),'request_contact':True}]],'resize_keyboard':True,'one_time_keyboard':True})
            elif state=='company_phone':
                contact=msg.get('contact',{}); phone=contact.get('phone_number','')
                if contact.get('user_id')!=uid or not 5<=len(phone)<=30:raise ValueError('Own phone required')
                cur=db.execute('INSERT INTO companies(owner_id,name,phone) VALUES (?,?,?)',(uid,draft['name'],phone))
                self.state(db,uid,'home')
                self.send(db,uid,self.ct(db,uid,'pending'),markup={'remove_keyboard':True})
                self.admins_notify(db,f"Company #{cur.lastrowid}: {draft['name']}\n{phone}\n/approvecompany {cur.lastrowid}\n/rejectcompany {cur.lastrowid}")
            elif state=='company_invite':
                c=self.company_owner(db,uid); did=int(text)
                if not db.execute('SELECT 1 FROM drivers WHERE id=?',(did,)).fetchone() or db.execute('SELECT 1 FROM company_members WHERE driver_id=?',(did,)).fetchone():raise ValueError('Registered unaffiliated driver required')
                existing=db.execute("SELECT 1 FROM company_invites WHERE company_id=? AND driver_id=? AND status='pending' AND created_at > datetime('now','-7 days')",(c['id'],did)).fetchone()
                if existing:raise ValueError('Pending invitation exists')
                inv=db.execute('INSERT INTO company_invites(company_id,driver_id) VALUES (?,?)',(c['id'],did)).lastrowid
                self.send(db,did,self.ct(db,did,'consent',name=c['name']),[(self.ct(db,did,'accept'),f'companyjoin:{inv}:yes'),(self.ct(db,did,'decline'),f'companyjoin:{inv}:no')])
                self.state(db,uid,'home'); self.send(db,uid,self.ct(db,uid,'sent'))
            return True
        return False
