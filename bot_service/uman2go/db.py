import sqlite3
from pathlib import Path

SCHEMA = """
CREATE TABLE IF NOT EXISTS ride_distance (
 ride_id INTEGER PRIMARY KEY REFERENCES rides(id), started_at REAL NOT NULL, finished_at REAL,
 meters REAL NOT NULL DEFAULT 0, samples INTEGER NOT NULL DEFAULT 0,
 segments INTEGER NOT NULL DEFAULT 0, partial INTEGER NOT NULL DEFAULT 0,
 last_lat REAL, last_lon REAL, last_at REAL
);
CREATE TABLE IF NOT EXISTS companies (
 id INTEGER PRIMARY KEY AUTOINCREMENT, owner_id INTEGER UNIQUE NOT NULL REFERENCES users(id),
 name TEXT NOT NULL, phone TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected'))
);
CREATE TABLE IF NOT EXISTS company_members (
 driver_id INTEGER PRIMARY KEY REFERENCES drivers(id), company_id INTEGER NOT NULL REFERENCES companies(id)
);
CREATE INDEX IF NOT EXISTS company_members_company ON company_members(company_id);
CREATE TABLE IF NOT EXISTS company_invites (
 id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER NOT NULL REFERENCES companies(id),
 driver_id INTEGER NOT NULL REFERENCES drivers(id), status TEXT NOT NULL DEFAULT 'pending',
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS company_rides (
 ride_id INTEGER PRIMARY KEY REFERENCES rides(id), company_id INTEGER NOT NULL REFERENCES companies(id)
);
CREATE INDEX IF NOT EXISTS company_rides_company ON company_rides(company_id);
CREATE TABLE IF NOT EXISTS users (
 id INTEGER PRIMARY KEY, name TEXT NOT NULL, lang TEXT NOT NULL DEFAULT 'he',
 state TEXT NOT NULL DEFAULT 'home', draft TEXT NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS drivers (
 id INTEGER PRIMARY KEY REFERENCES users(id), name TEXT NOT NULL,
 phone TEXT NOT NULL, vehicle TEXT NOT NULL, plate TEXT NOT NULL,
 seats INTEGER NOT NULL CHECK(seats BETWEEN 1 AND 50),
 approval TEXT NOT NULL DEFAULT 'pending' CHECK(approval IN ('pending','approved','rejected')),
 available INTEGER NOT NULL DEFAULT 0 CHECK(available IN (0,1))
);
CREATE TABLE IF NOT EXISTS routes (id TEXT PRIMARY KEY, price INTEGER CHECK(price>0));
CREATE TABLE IF NOT EXISTS rides (
 id INTEGER PRIMARY KEY AUTOINCREMENT, passenger_id INTEGER NOT NULL REFERENCES users(id),
 pickup TEXT NOT NULL, destination TEXT NOT NULL, route_id TEXT REFERENCES routes(id),
 passengers INTEGER NOT NULL CHECK(passengers BETWEEN 1 AND 50),
 price INTEGER CHECK(price>0), currency TEXT NOT NULL,
 status TEXT NOT NULL CHECK(status IN ('awaiting_quote','quoted','searching','accepted','arrived','in_progress','completed','cancelled')),
 driver_id INTEGER REFERENCES drivers(id), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS one_passenger_ride ON rides(passenger_id)
 WHERE status NOT IN ('completed','cancelled');
CREATE UNIQUE INDEX IF NOT EXISTS one_driver_ride ON rides(driver_id)
 WHERE status IN ('accepted','arrived','in_progress');
CREATE TABLE IF NOT EXISTS offers (
 ride_id INTEGER NOT NULL REFERENCES rides(id), driver_id INTEGER NOT NULL REFERENCES drivers(id),
 status TEXT NOT NULL DEFAULT 'offered', price INTEGER CHECK(price>0), PRIMARY KEY(ride_id,driver_id)
);
CREATE TABLE IF NOT EXISTS events (
 id INTEGER PRIMARY KEY, ride_id INTEGER REFERENCES rides(id), actor_id INTEGER NOT NULL,
 action TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS updates (id INTEGER PRIMARY KEY);
CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS outbox (
 id INTEGER PRIMARY KEY, method TEXT NOT NULL, payload TEXT NOT NULL,
 attempts INTEGER NOT NULL DEFAULT 0, next_attempt REAL NOT NULL DEFAULT 0,
 sent_at TEXT, failed INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS ride_locations (
 ride_id INTEGER NOT NULL REFERENCES rides(id), user_id INTEGER NOT NULL REFERENCES users(id),
 latitude REAL NOT NULL, longitude REAL NOT NULL, updated_at REAL NOT NULL,
 PRIMARY KEY(ride_id,user_id)
);
CREATE TABLE IF NOT EXISTS location_sources (
 user_id INTEGER NOT NULL REFERENCES users(id), message_id INTEGER NOT NULL,
 ride_id INTEGER NOT NULL REFERENCES rides(id), enabled INTEGER NOT NULL DEFAULT 1,
 PRIMARY KEY(user_id,message_id)
);
CREATE TABLE IF NOT EXISTS ratings (
 ride_id INTEGER PRIMARY KEY REFERENCES rides(id), passenger_id INTEGER NOT NULL REFERENCES users(id),
 driver_id INTEGER NOT NULL REFERENCES drivers(id), stars INTEGER NOT NULL CHECK(stars BETWEEN 1 AND 5),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS ratings_driver ON ratings(driver_id);
CREATE TABLE IF NOT EXISTS location_access (
 user_id INTEGER PRIMARY KEY REFERENCES users(id), latitude REAL NOT NULL,
 longitude REAL NOT NULL, updated_at REAL NOT NULL, message_id INTEGER,
 live INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS customers (
 user_id INTEGER PRIMARY KEY REFERENCES users(id), source TEXT NOT NULL DEFAULT 'direct',
 tag TEXT NOT NULL DEFAULT 'new', note TEXT NOT NULL DEFAULT '',
 subscribed INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 last_seen TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
"""

ROUTES = ('chisinau_uman', 'uman_chisinau', 'odesa_uman', 'uman_odesa', 'kyiv_uman', 'uman_kyiv')

def connect(path):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(path, timeout=15, isolation_level=None)
    db.row_factory = sqlite3.Row
    db.execute('PRAGMA foreign_keys=ON')
    db.execute('PRAGMA journal_mode=WAL')
    return db

def initialize(path):
    db = connect(path)
    db.executescript(SCHEMA)
    # Additive migration: existing MVP data remains intact.
    columns = {r['name'] for r in db.execute('PRAGMA table_info(outbox)')}
    for name, kind in (('ride_id', 'INTEGER REFERENCES rides(id)'), ('actor_id', 'INTEGER REFERENCES users(id)'), ('discarded', 'INTEGER NOT NULL DEFAULT 0')):
        if name not in columns:
            db.execute(f'ALTER TABLE outbox ADD COLUMN {name} {kind}')
    if 'photo_id' not in {r['name'] for r in db.execute('PRAGMA table_info(drivers)')}:
        db.execute("ALTER TABLE drivers ADD COLUMN photo_id TEXT")
    db.executemany('INSERT OR IGNORE INTO routes(id) VALUES (?)', [(r,) for r in ROUTES])
    db.close()
