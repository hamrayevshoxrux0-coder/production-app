const router = require('express').Router();
const db = require('../db');
const { auth } = require('../middleware/auth');

// GET /api/dashboard?date=2026-05-26
router.get('/', auth, (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];
  const month = date.slice(0, 7);

  // Today production
  const todayProd = db.prepare(`
    SELECT SUM(planned_qty) as planned, SUM(actual_qty) as actual, SUM(brak_qty) as brak,
      COUNT(DISTINCT line_id) as active_lines
    FROM production_logs WHERE log_date=?
  `).get(date);

  // Today stops
  const todayStops = db.prepare(`
    SELECT COUNT(*) as cnt, SUM(duration_min) as total_min
    FROM line_stops WHERE stop_date=?
  `).get(date);

  // Lines summary
  const linesSummary = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status='running' THEN 1 ELSE 0 END) as running,
      SUM(CASE WHEN status='stopped' THEN 1 ELSE 0 END) as stopped,
      SUM(CASE WHEN status='idle' THEN 1 ELSE 0 END) as idle
    FROM lines
  `).get();

  // Active orders
  const ordersSummary = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) as active,
      SUM(CASE WHEN status='in_progress' THEN 1 ELSE 0 END) as in_progress,
      SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) as completed
    FROM orders
  `).get();

  // Urgent orders (≤3 days)
  const urgentOrders = db.prepare(`
    SELECT *, CAST(julianday(delivery_date) - julianday('now') AS INTEGER) as days_left
    FROM orders
    WHERE status != 'completed' AND delivery_date != ''
      AND julianday(delivery_date) - julianday('now') <= 3
    ORDER BY delivery_date ASC LIMIT 10
  `).all();

  // Today's deliveries
  const todayDeliveries = db.prepare(`SELECT * FROM orders WHERE delivery_date=? AND status!='completed' ORDER BY order_type`).all(date);

  // Monthly totals
  const monthProd = db.prepare(`
    SELECT SUM(planned_qty) as planned, SUM(actual_qty) as actual, SUM(brak_qty) as brak
    FROM production_logs WHERE strftime('%Y-%m', log_date)=?
  `).get(month);

  // Recent stops
  const recentStops = db.prepare(`SELECT * FROM line_stops WHERE stop_date=? ORDER BY stop_time DESC LIMIT 5`).all(date);

  res.json({
    date,
    todayProd,
    todayStops,
    linesSummary,
    ordersSummary,
    urgentOrders,
    todayDeliveries,
    monthProd,
    recentStops
  });
});

module.exports = router;
