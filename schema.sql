CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    isEmailVerified INTEGER DEFAULT 1,
    role TEXT DEFAULT 'USER',
    banned INTEGER DEFAULT 0,
    hwid TEXT DEFAULT 'HWID-NONE',
    subtill TEXT DEFAULT 'None',
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

CREATE TABLE IF NOT EXISTS payloads (
    version TEXT PRIMARY KEY,
    payload_data TEXT NOT NULL,
    entry_class TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Only DustGames is Admin
INSERT OR IGNORE INTO users (id, username, email, isEmailVerified, role, banned, hwid, subtill, regdate)
VALUES (1, 'DustGames', 'nikiforova280987@gmail.com', 1, 'ADMIN', 0, 'LOCAL-FULL-ACCESS', '31.12.2099', '01.01.2024');

