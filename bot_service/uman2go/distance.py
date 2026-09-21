"""Approximate recorded driver GPS distance; never a fare meter."""
import math
import time
from .i18n import t


def meters_between(lat1, lon1, lat2, lon2):
    p1, p2 = math.radians(lat1), math.radians(lat2)
    a = math.sin((p2-p1)/2)**2 + math.cos(p1)*math.cos(p2)*math.sin(math.radians(lon2-lon1)/2)**2
    return 6371000 * 2 * math.asin(min(1, math.sqrt(a)))


class Distance:
    def start_distance(self, db, rid):
        db.execute('INSERT OR IGNORE INTO ride_distance(ride_id,started_at) VALUES (?,?)', (rid, time.time()))

    def record_distance(self, db, ride, uid, msg):
        if ride['status'] != 'in_progress' or ride['driver_id'] != uid:
            return
        row = db.execute('SELECT * FROM ride_distance WHERE ride_id=?', (ride['id'],)).fetchone()
        if not row or row['finished_at'] is not None:
            return
        now = time.time()
        stamp = float(msg.get('edit_date', msg.get('date', now)))
        if not math.isfinite(stamp) or stamp > now + 5 or stamp < row['started_at'] or now-stamp > 120:
            return
        if row['last_at'] is not None and stamp <= row['last_at']:
            return
        loc = msg['location']
        lat, lon = float(loc['latitude']), float(loc['longitude'])
        if not (math.isfinite(lat) and math.isfinite(lon) and -90 <= lat <= 90 and -180 <= lon <= 180):
            return
        gap = stamp - (row['last_at'] if row['last_at'] is not None else row['started_at'])
        partial = row['partial'] or gap > 120
        distance, segment = 0, 0
        if row['last_at'] is not None and row['last_lat'] is not None and gap <= 120:
            distance = meters_between(row['last_lat'], row['last_lon'], lat, lon)
            if distance/gap > 200/3.6:
                # Reject implausible jumps without poisoning the previous valid anchor.
                db.execute('UPDATE ride_distance SET partial=1 WHERE ride_id=?', (ride['id'],))
                return
            segment = 1
        db.execute('''UPDATE ride_distance SET meters=meters+?,segments=segments+?,samples=samples+?,
                      partial=?,last_lat=?,last_lon=?,last_at=? WHERE ride_id=?''',
                   (distance, segment, 1, int(partial), lat, lon, stamp, ride['id']))

    def finish_distance(self, db, rid):
        now = time.time()
        db.execute('''UPDATE ride_distance SET finished_at=?,partial=CASE
                      WHEN last_at IS NULL OR ?-last_at>120 THEN 1 ELSE partial END,
                      last_lat=NULL,last_lon=NULL WHERE ride_id=? AND finished_at IS NULL''', (now, now, rid))

    def distance_text(self, db, uid, ride):
        row = db.execute('SELECT * FROM ride_distance WHERE ride_id=?', (ride['id'],)).fetchone()
        lang = self.language(db, uid)
        if not row or row['segments'] < 1:
            return t(lang, 'distance_missing')
        return t(lang, 'distance_partial' if row['partial'] else 'distance_recorded', km=f"{row['meters']/1000:.2f}")

    def trip_receipt(self, db, uid, ride):
        lang = self.language(db, uid)
        return (t(lang, 'trip_receipt', id=ride['id'], price=self.money(ride, lang)) + '\n' +
                t(lang, 'payment_terms') + '\n' + self.distance_text(db, uid, ride))
