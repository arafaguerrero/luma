
CREATE TABLE preview_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fingerprint TEXT NOT NULL,
  user_id TEXT,
  preview_count INTEGER DEFAULT 0,
  last_preview_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_preview_usage_fingerprint ON preview_usage(fingerprint);
CREATE INDEX idx_preview_usage_user_id ON preview_usage(user_id);
