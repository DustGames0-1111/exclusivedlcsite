-- Cloudflare D1 Database Schema for Resence / DustGames Client

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    isEmailVerified INTEGER DEFAULT 1,
    role TEXT DEFAULT 'USER',
    banned INTEGER DEFAULT 0,
    hwid TEXT DEFAULT 'HWID-NONE',
    subtill TEXT DEFAULT '31.12.2099',
    regdate TEXT DEFAULT '01.01.2024'
);

CREATE TABLE IF NOT EXISTS tokens (
    token TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    display TEXT NOT NULL,
    generatedBy TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS promocodes (
    name TEXT PRIMARY KEY,
    discount INTEGER DEFAULT 10,
    activations INTEGER DEFAULT 0,
    maxActivations INTEGER DEFAULT 100,
    bet INTEGER DEFAULT 10,
    maxUsages INTEGER DEFAULT 100
);

CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    username TEXT NOT NULL,
    action TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS withdraws (
    orderId TEXT PRIMARY KEY,
    amount INTEGER NOT NULL,
    status TEXT DEFAULT 'PENDING',
    type TEXT DEFAULT 'SBP',
    wallet TEXT NOT NULL,
    bank TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- Initial seed data
INSERT OR IGNORE INTO users (id, username, email, isEmailVerified, role, banned, hwid, subtill, regdate)
VALUES (1, 'Resence', 'resence@localhost', 1, 'ADMIN', 0, 'LOCAL-FULL-ACCESS', '31.12.2099', '01.01.2024');

INSERT OR IGNORE INTO promocodes (name, discount, activations, maxActivations, bet, maxUsages)
VALUES ('WELCOME', 10, 2, 100, 10, 100);

INSERT OR IGNORE INTO promocodes (name, discount, activations, maxActivations, bet, maxUsages)
VALUES ('FULLACCESS', 50, 0, 999, 50, 999);

INSERT OR IGNORE INTO keys (key, display, generatedBy)
VALUES ('RESENCE-AAAA-BBBB-CCCC-DDDD', 'Lifetime', 'Resence');

INSERT OR IGNORE INTO keys (key, display, generatedBy)
VALUES ('RESENCE-1111-2222-3333-4444', '30 days', 'Resence');
