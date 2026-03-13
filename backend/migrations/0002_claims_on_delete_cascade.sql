PRAGMA foreign_keys=OFF;

CREATE TABLE claims_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  code_id INTEGER NOT NULL,
  ip_hash TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, code_id),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(code_id) REFERENCES access_codes(id) ON DELETE CASCADE
);

INSERT INTO claims_new (id, user_id, code_id, ip_hash, user_agent, created_at)
SELECT id, user_id, code_id, ip_hash, user_agent, created_at
FROM claims;

DROP TABLE claims;
ALTER TABLE claims_new RENAME TO claims;

CREATE INDEX IF NOT EXISTS idx_claims_created_at ON claims(created_at DESC);

PRAGMA foreign_keys=ON;
