-- 紫米芽和六角星的港湾 - D1 数据库建表
-- 执行: wrangler d1 execute our-garden-db --file=schema.sql

CREATE TABLE IF NOT EXISTS diaries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL UNIQUE,
  author TEXT NOT NULL,
  content TEXT,
  mood TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  image_key TEXT NOT NULL,
  image_url TEXT NOT NULL,
  caption TEXT,
  photo_date TEXT,
  location TEXT,
  upload_time DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wishes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content TEXT NOT NULL,
  who TEXT NOT NULL,
  done INTEGER DEFAULT 0,
  done_date TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
