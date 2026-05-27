const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { parseOrderFile } = require('../excelParser');
const { auth, requireRole } = require('../middleware/auth');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '_' + file.originalname)
});
const upload = multer({ storage, fileFilter: (req, file, cb) => {
  const ok = file.originalname.match(/\.(xlsx|xls)$/i);
  cb(null, !!ok);
}});

// POST /api/import/orders  — upload and parse, return preview
router.post('/orders', auth, requireRole('admin','editor'), upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Excel fayl kerak (.xlsx yoki .xls)' });
  try {
    const orders = parseOrderFile(req.file.path);
    if (!orders.length) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Faylda buyurtma topilmadi. Format tekshirib ko\'ring.' });
    }
    // Return preview — not saved yet
    res.json({ preview: orders, file: req.file.filename, count: orders.length });
  } catch (e) {
    fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'Fayl o\'qishda xato: ' + e.message });
  }
});

// POST /api/import/orders/confirm  — actually save to DB
router.post('/orders/confirm', auth, requireRole('admin','editor'), (req, res) => {
  const { orders, skip_existing } = req.body;
  if (!orders || !orders.length) return res.status(400).json({ error: 'Buyurtmalar yo\'q' });

  const insertOrder = db.prepare(`
    INSERT INTO orders (order_number, order_date, customer, order_type, destination, delivery_date, total_qty, total_weight, source)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'excel')
  `);
  const insertItem = db.prepare(`
    INSERT INTO order_items (order_id, product_name, qty_requested, qty_extra, weight_unit, weight_total, packages, price, amount, unit, supplier)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const checkExists = db.prepare('SELECT id FROM orders WHERE order_number=?');

  const results = { saved: 0, skipped: 0, errors: [] };

  const tx = db.transaction(() => {
    for (const order of orders) {
      const exists = checkExists.get(order.order_number);
      if (exists) {
        if (skip_existing) { results.skipped++; continue; }
        else {
          // Update delivery date and status only
          db.prepare("UPDATE orders SET delivery_date=?, customer=?, updated_at=datetime('now') WHERE order_number=?")
            .run(order.delivery_date || '', order.customer, order.order_number);
          results.skipped++;
          continue;
        }
      }
      try {
        const r = insertOrder.run(order.order_number, order.order_date, order.customer, order.order_type || 'shahar', order.destination || '', order.delivery_date || '', order.total_qty || 0, order.total_weight || 0);
        const orderId = r.lastInsertRowid;
        if (order.items) {
          for (const it of order.items) {
            insertItem.run(orderId, it.product_name, it.qty_requested || 0, it.qty_extra || 0, it.weight_unit || 0, it.weight_total || 0, it.packages || 0, it.price || 0, it.amount || 0, it.unit || 'dona', it.supplier || '');
          }
        }
        results.saved++;
      } catch (e) {
        results.errors.push({ order: order.order_number, error: e.message });
      }
    }
  });

  tx();
  res.json(results);
});

// GET /api/import/history
router.get('/history', auth, (req, res) => {
  const orders = db.prepare(`SELECT order_number, customer, order_date, created_at FROM orders WHERE source='excel' ORDER BY created_at DESC LIMIT 50`).all();
  res.json(orders);
});

module.exports = router;
