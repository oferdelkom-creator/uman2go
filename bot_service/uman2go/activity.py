"""Admin activity alerts contain action metadata, never message bodies or GPS."""
from .i18n import t
LABELS = {
    'book': ('בקשת נסיעה', 'Ride request'), 'confirm': ('שליחת בקשה לנהגים', 'Request dispatched'),
    'choose': ('אישור הצעת מחיר', 'Price accepted'), 'quote': ('שליחת הצעת מחיר', 'Price offered'),
    'bid_amount': ('שליחת הצעת מחיר', 'Price offered'), 'bid': ('שליחת הצעת מחיר', 'Price offered'), 'accept': ('התחלת הצעת מחיר', 'Quote started'),
    'cancel': ('ביטול נסיעה', 'Ride cancelled'), 'cancelride': ('ביטול נסיעה בידי מנהל', 'Admin cancellation'),
    'move': ('עדכון מצב נסיעה', 'Ride status changed'), 'available': ('שינוי זמינות נהג', 'Driver availability changed'),
    'driver': ('אזור נהג / הרשמה', 'Driver area / registration'), 'profile': ('עריכת פרופיל', 'Profile update'),
    'vehicle': ('פרטי רכב', 'Vehicle details'), 'plate': ('לוחית רכב', 'Vehicle plate'),
    'seats': ('מספר מושבים', 'Seat capacity'), 'phone': ('טלפון להרשמה', 'Registration phone'),
    'photo': ('תמונת רכב', 'Vehicle photo'), 'approve': ('אישור נהג', 'Driver approved'),
    'notification_approve': ('אישור נהג', 'Driver approved'), 'reject': ('השעיית נהג', 'Driver suspended'),
    'approvecompany': ('אישור חברה', 'Company approved'), 'rejectcompany': ('דחיית חברה', 'Company rejected'),
    'location': ('שיתוף מיקום', 'Location shared'), 'gps': ('שיתוף מיקום', 'Location shared'),
    'message': ('הודעה בנסיעה', 'Ride message'), 'chat': ('שיחה בנסיעה', 'Ride conversation'),
    'rate': ('דירוג נסיעה', 'Ride rating'), 'decline': ('דחיית בקשת נסיעה', 'Ride request declined'),
    'language': ('בחירת שפה', 'Language selection'), 'lang': ('בחירת שפה', 'Language selection'),
    'start': ('פתיחת הבוט', 'Bot opened'), 'destination': ('בחירת יעד', 'Destination entered'),
    'passengers': ('מספר נוסעים', 'Passenger count'), 'pickup': ('בחירת איסוף', 'Pickup entered'),
    'status': ('בדיקת מצב נסיעה', 'Ride status checked'), 'drivers': ('רשימת נהגים', 'Driver list viewed'),
    'rides': ('רשימת נסיעות', 'Ride list viewed'), 'prices': ('בדיקת הצעות מחיר', 'Price offers viewed'),
    'receipt': ('סיכום נסיעה', 'Trip summary viewed'), 'health': ('בדיקת מסירת התראות', 'Delivery checked'),
}


def notify_activity(service, db, uid, action, succeeded=True, detail=''):
    user = db.execute('SELECT name FROM users WHERE id=?', (uid,)).fetchone()
    name = user['name'] if user else str(uid)
    key = action.lstrip('/').split(':')[0][:40]
    title = LABELS.get(key, ('פעולה: ' + key, 'Action: ' + key))
    ride_keys = {'book','confirm','choose','quote','bid','bid_amount','accept','cancel','move','message','chat','rate','status','destination','passengers','pickup'}
    ride = (service.active_driver(db, uid) or service.active_passenger(db, uid)) if key in ride_keys else None
    bid = db.execute("SELECT ride_id,action FROM events WHERE actor_id=? AND action LIKE 'price_offered:%' ORDER BY id DESC LIMIT 1", (uid,)).fetchone() if key in ('quote', 'bid', 'bid_amount') and succeeded else None
    driver = db.execute('SELECT available FROM drivers WHERE id=?', (uid,)).fetchone() if key == 'available' else None
    for admin in service.admins:
        he = service.language(db, admin) == 'he'
        status = ('בוצע' if succeeded else 'לא הושלם') if he else ('Completed' if succeeded else 'Not completed')
        text = ('פעילות במערכת' if he else 'System activity') + ' · ' + status
        text += '\n' + name + ' · ID ' + str(uid) + '\n' + title[0 if he else 1]
        if detail:
            text += '\n' + detail[:120]
        if ride:
            text += '\n' + ('נסיעה' if he else 'Ride') + ' #' + str(ride['id']) + ' · ' + t(service.language(db, admin), ride['status'], id=ride['id'])
        if bid:
            text += '\n' + ('נסיעה' if he else 'Ride') + ' #' + str(bid['ride_id']) + ' · ' + f"{int(bid['action'].split(':')[1]) / 100:.2f} ₴"
        if driver:
            text += '\n' + (('זמין' if driver['available'] else 'לא זמין') if he else ('Online' if driver['available'] else 'Offline'))
        service.send(db, admin, text)
