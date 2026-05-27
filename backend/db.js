const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'production.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'viewer',
    department TEXT,
    telegram_chat_id TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number TEXT UNIQUE NOT NULL,
    order_date TEXT NOT NULL,
    customer TEXT NOT NULL,
    order_type TEXT NOT NULL DEFAULT 'shahar',
    destination TEXT,
    delivery_date TEXT,
    total_qty REAL DEFAULT 0,
    total_weight REAL DEFAULT 0,
    status TEXT DEFAULT 'active',
    source TEXT DEFAULT 'manual',
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    qty_requested REAL DEFAULT 0,
    qty_extra REAL DEFAULT 0,
    qty_produced REAL DEFAULT 0,
    weight_unit REAL DEFAULT 0,
    weight_total REAL DEFAULT 0,
    packages INTEGER DEFAULT 0,
    price REAL DEFAULT 0,
    amount REAL DEFAULT 0,
    unit TEXT DEFAULT 'dona',
    supplier TEXT,
    status TEXT DEFAULT 'pending'
  );

  CREATE TABLE IF NOT EXISTS production_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    log_date TEXT NOT NULL,
    shift TEXT NOT NULL DEFAULT 'day',
    line_id INTEGER,
    line_name TEXT,
    product_name TEXT NOT NULL,
    planned_qty REAL DEFAULT 0,
    actual_qty REAL DEFAULT 0,
    brak_qty REAL DEFAULT 0,
    unit TEXT DEFAULT 'dona',
    notes TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS line_stops (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stop_date TEXT NOT NULL,
    shift TEXT DEFAULT 'day',
    line_id INTEGER NOT NULL,
    line_name TEXT NOT NULL,
    stop_time TEXT,
    duration_min INTEGER DEFAULT 0,
    reason_preset TEXT,
    reason_custom TEXT,
    reason_category TEXT DEFAULT 'other',
    created_by INTEGER REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS lines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'running',
    current_product TEXT,
    last_updated TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS telegram_subscribers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id TEXT UNIQUE NOT NULL,
    username TEXT,
    notify_days_before INTEGER DEFAULT 3,
    active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// Seed default lines if empty
const lineCount = db.prepare('SELECT COUNT(*) as c FROM lines').get();
if (lineCount.c === 0) {
  const insert = db.prepare('INSERT INTO lines (name, status) VALUES (?, ?)');
  for (let i = 1; i <= 50; i++) {
    insert.run(`Liniya ${i}`, 'running');
  }
}

// Seed default admin user if empty
const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get();
if (userCount.c === 0) {
  const bcrypt = require('bcryptjs');
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare(`INSERT INTO users (username, password, role, department) VALUES (?, ?, ?, ?)`).run('admin', hash, 'admin', 'Boshqaruv');
  const hash2 = bcrypt.hashSync('viewer123', 10);
  db.prepare(`INSERT INTO users (username, password, role, department) VALUES (?, ?, ?, ?)`).run('kuzatuvchi', hash2, 'viewer', 'Ombor');
  const hash3 = bcrypt.hashSync('editor123', 10);
  db.prepare(`INSERT INTO users (username, password, role, department) VALUES (?, ?, ?, ?)`).run('tahrilovchi', hash3, 'editor', 'Ishlab chiqarish');
}

module.exports = db;
