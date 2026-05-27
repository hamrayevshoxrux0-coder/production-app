// ═══════════════════════════════════════════════════════════
// KELAJAK MODULLARI — tayyor shablon
// Bu fayllar keyinchalik to'ldiriladi
// ═══════════════════════════════════════════════════════════

// ─── employees.js (Xodimlar va smenalar) ──────────────────
/*
Schema qo'shish uchun db.js ga:

  CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    position TEXT,
    department TEXT,
    shift TEXT DEFAULT 'day',
    phone TEXT,
    hire_date TEXT,
    status TEXT DEFAULT 'active',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS shift_schedule (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER REFERENCES employees(id),
    work_date TEXT NOT NULL,
    shift TEXT NOT NULL,
    line_id INTEGER,
    hours REAL DEFAULT 8,
    notes TEXT
  );

server.js da ochish:
  app.use('/api/employees', require('./routes/employees'));
*/

// ─── customers.js (Mijozlar CRM) ──────────────────────────
/*
Schema qo'shish uchun db.js ga:

  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    company TEXT,
    phone TEXT,
    email TEXT,
    region TEXT,
    customer_type TEXT DEFAULT 'shahar',
    total_orders INTEGER DEFAULT 0,
    total_amount REAL DEFAULT 0,
    last_order_date TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

server.js da ochish:
  app.use('/api/customers', require('./routes/customers'));

Frontend da qo'shish uchun:
  1. src/pages/CustomersPage.js yarating
  2. App.js ga: <Route path="customers" element={<CustomersPage />} />
  3. Layout.js navItems ga: { to: '/customers', label: 'Mijozlar', icon: '👥' }
  4. i18n/translations.js ga tarjimalar qo'shing
*/

// ─── materials.js (Xom ashyo / Sklad) ─────────────────────
/*
Schema:
  CREATE TABLE IF NOT EXISTS materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT,
    unit TEXT DEFAULT 'kg',
    stock_qty REAL DEFAULT 0,
    min_stock REAL DEFAULT 0,
    supplier TEXT,
    last_received TEXT,
    notes TEXT
  );

  CREATE TABLE IF NOT EXISTS material_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    material_id INTEGER REFERENCES materials(id),
    movement_type TEXT NOT NULL,  -- 'in' | 'out' | 'adjustment'
    qty REAL NOT NULL,
    movement_date TEXT NOT NULL,
    reason TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now'))
  );
*/

module.exports = {};
