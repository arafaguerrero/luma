
CREATE TABLE palettes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  colors TEXT NOT NULL,
  style TEXT,
  source TEXT,
  user_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE color_equivalencies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  brand TEXT NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  hex TEXT NOT NULL,
  set_name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_palettes_user_id ON palettes(user_id);
CREATE INDEX idx_palettes_created_at ON palettes(created_at);
CREATE INDEX idx_color_equivalencies_brand_code ON color_equivalencies(brand, code);
