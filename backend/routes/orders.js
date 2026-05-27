const router = require('express').Router();
const db = require('../db');
const { auth, requireRole } = require('../middleware/auth');

// GET /api/orders
router.get('/', auth, (req, res) => {
  const { status, type, search, from, to } = req.query;
  let q = 'SELECT * FROM orders WHERE 1=1';
  const params = [];
  if (status) { q += ' AND status=?'; params.push(status); }
  if (type)   { q += ' AND order_type=?'; params.push(type); }
  if (search) { q += ' AND (order_number LIKE ? OR customer LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  if (from)   { q += ' AND delivery_date >= ?'; params.push(from); }
  if (to)     { q += ' AND delivery_date <= ?'; params.push(to); }
  q += ' ORDER BY delivery_date ASC, created_at DESC';
  const orders = db.prepare(q).all(...params);
  res.json(orders);
});

// GET /api/orders/:id  with items
router.get('/:id', auth, (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id=?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Topilmadi' });
  const items = db.prepare('SELECT * FROM order_items WHERE order_id=? ORDER BY id').all(order.id);
  res.json({ ...order, items });
});

// POST /api/orders
router.post('/', auth, requireRole('admin', 'editor'), (req, res) => {
  const { order_number, order_date, customer, order_type, destination, delivery_date, total_qty, total_weight, notes, items } = req.body;
  if (!order_number || !customer) return res.status(400).json({ error: 'order_number va customer kerak' });

  const insertOrder = db.prepare(`
    INSERT INTO orders (order_number, order_date, customer, order_type, destination, delivery_date, total_qty, total_weight, notes, source)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'manual')
  `);
  const insertItem = db.prepare(`
    INSERT INTO order_items (order_id, product_name, qty_requested, qty_extra, qty_produced, weight_unit, weight_total, packages, price, amount, unit, supplier)
    VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?)
  `);

  const tx = db.transaction(() => {
    const result = insertOrder.run(order_number, order_date, customer, order_type || 'shahar', destination || '', delivery_date || '', total_qty || 0, total_weight || 0, notes || '');
    const orderId = result.lastInsertRowid;
    if (items && items.length) {
      for (const it of items) {
        insertItem.run(orderId, it.product_name, it.qty_requested || 0, it.qty_extra || 0, it.weight_unit || 0, it.weight_total || 0, it.packages || 0, it.price || 0, it.amount || 0, it.unit || 'dona', it.supplier || '');
      }
    }
    return orderId;
  });

  try {
    const id = tx();
    const order = db.prepare('SELECT * FROM orders WHERE id=?').get(id);
    res.json(order);
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(400).json({ error: 'Bu buyurtma raqami mavjud: ' + order_number });
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/orders/:id
router.put('/:id', auth, requireRole('admin', 'editor'), (req, res) => {
  const fields = ['customer','order_type','destination','delivery_date','total_qty','total_weight','status','notes'];
  const updates = [];
  const vals = [];
  for (const f of fields) {
    if (req.body[f] !== undefined) { updates.push(`${f}=?`); vals.push(req.body[f]); }
  }
  if (!updates.length) return res.status(400).json({ error: 'Yangilash uchun maydon yo\'q' });
  updates.push("updated_at=datetime('now')");
  vals.push(req.params.id);
  db.prepare(`UPDATE orders SET ${updates.join(',')} WHERE id=?`).run(...vals);
  res.json({ ok: true });
});

// DELETE /api/orders/:id  (admin only)
router.delete('/:id', auth, requireRole('admin'), (req, res) => {
  db.prepare('DELETE FROM orders WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// PUT /api/orders/:id/items/:itemId  — update produced qty
router.put('/:id/items/:itemId', auth, requireRole('admin','editor'), (req, res) => {
  const { qty_produced, status } = req.body;
  const updates = [];
  const vals = [];
  if (qty_produced !== undefined) { updates.push('qty_produced=?'); vals.push(qty_produced); }
  if (status !== undefined) { updates.push('status=?'); vals.push(status); }
  if (!updates.length) return res.status(400).json({ error: 'Maydon yo\'q' });
  vals.push(req.params.itemId, req.params.id);
  db.prepare(`UPDATE order_items SET ${updates.join(',')} WHERE id=? AND order_id=?`).run(...vals);

  // Auto-update order status
  const items = db.prepare('SELECT * FROM order_items WHERE order_id=?').all(req.params.id);
  const allDone = items.every(i => i.qty_produced >= i.qty_requested);
  const anyDone = items.some(i => i.qty_produced > 0);
  const newStatus = allDone ? 'completed' : anyDone ? 'in_progress' : 'active';
  db.prepare("UPDATE orders SET status=?, updated_at=datetime('now') WHERE id=?").run(newStatus, req.params.id);

  res.json({ ok: true });
});

// GET /api/orders/urgent/list  — orders due in N days
router.get('/urgent/list', auth, (req, res) => {
  const days = parseInt(req.query.days) || 3;
  const orders = db.prepare(`
    SELECT *, julianday(delivery_date) - julianday('now') as days_left
    FROM orders
    WHERE status != 'completed' AND delivery_date != ''
      AND julianday(delivery_date) - julianday('now') <= ?
    ORDER BY delivery_date ASC
  `).all(days);
  res.json(orders);
});

module.exports = router;
