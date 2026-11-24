PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS admins (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS prizes (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  name                  TEXT NOT NULL,
  description           TEXT NOT NULL DEFAULT '',
  image_url             TEXT NOT NULL DEFAULT '',
  icon                  TEXT NOT NULL DEFAULT '🎉',
  color                 TEXT NOT NULL DEFAULT '#8b5cf6',
  probability           REAL NOT NULL DEFAULT 10 CHECK (probability >= 0),
  quantity              INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  is_unlimited          INTEGER NOT NULL DEFAULT 0 CHECK (is_unlimited IN (0,1)),
  delivered             INTEGER NOT NULL DEFAULT 0 CHECK (delivered >= 0),
  active                INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
  is_consolation        INTEGER NOT NULL DEFAULT 0 CHECK (is_consolation IN (0,1)),
  position              INTEGER NOT NULL DEFAULT 0,
  result_title          TEXT NOT NULL DEFAULT '',
  result_message        TEXT NOT NULL DEFAULT '',
  result_description    TEXT NOT NULL DEFAULT '',
  celebration_image_url TEXT NOT NULL DEFAULT '',
  claim_instructions    TEXT NOT NULL DEFAULT '',
  expires_at            TEXT NOT NULL DEFAULT '',
  terms                 TEXT NOT NULL DEFAULT '',
  whatsapp_button_text  TEXT NOT NULL DEFAULT 'RESERVAR POR WHATSAPP',
  whatsapp_number       TEXT NOT NULL DEFAULT '',
  whatsapp_message      TEXT NOT NULL DEFAULT '',
  created_at            TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at            TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS participations (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  participation_uid    TEXT NOT NULL UNIQUE,
  name                 TEXT NOT NULL,
  phone                TEXT NOT NULL,
  prize_id             INTEGER REFERENCES prizes(id) ON DELETE SET NULL,
  prize_name_snapshot  TEXT NOT NULL,
  prize_icon_snapshot  TEXT NOT NULL DEFAULT '',
  code                 TEXT NOT NULL UNIQUE,
  status               TEXT NOT NULL DEFAULT 'pendiente'
                       CHECK (status IN ('pendiente','reclamado','vencido','cancelado')),
  redeemed_at          TEXT,
  result_message_snapshot TEXT NOT NULL DEFAULT '',
  created_at           TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_participations_phone ON participations(phone);
CREATE INDEX IF NOT EXISTS idx_participations_created ON participations(created_at);
CREATE INDEX IF NOT EXISTS idx_participations_prize ON participations(prize_id);
CREATE INDEX IF NOT EXISTS idx_participations_status ON participations(status);

CREATE TABLE IF NOT EXISTS settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id   INTEGER REFERENCES admins(id) ON DELETE SET NULL,
  action     TEXT NOT NULL,
  entity     TEXT NOT NULL,
  entity_id  TEXT NOT NULL DEFAULT '',
  details    TEXT NOT NULL DEFAULT '',
  ip         TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
