const router = require('express').Router();
const db = require('../db');
const { auth } = require('../middleware/auth');

// GET /api/reports/daily?date=2026-05-26
router.get('/daily', auth, (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];

  const production = db.prepare(`
    SELECT product_name, line_name, shift,
      SUM(planned_qty) as planned, SUM(actual_qty) as actual, SUM(brak_qty) as brak
    FROM production_logs WHERE log_date=?
    GROUP BY product_name, line_name, shift ORDER BY line_name, shift
  `).all(date);

  const stops = db.prepare(`
    SELECT line_name, shift, stop_time, duration_min, reason_preset, reason_custom
    FROM line_stops WHERE stop_date=? ORDER BY stop_time
  `).all(date);

  const totals = db.prepare(`
    SELECT SUM(planned_qty) as planned, SUM(actual_qty) as actual, SUM(brak_qty) as brak
    FROM production_logs WHERE log_date=?
  `).get(date);

  const stopTotals = db.prepare(`
    SELECT COUNT(*) as cnt, SUM(duration_min) as total_min FROM line_stops WHERE stop_date=?
  `).get(date);

  res.json({ date, production, stops, totals, stopTotals });
});

// GET /api/reports/monthly?month=2026-05
router.get('/monthly', auth, (req, res) => {
  const month = req.query.month || new Date().toISOString().slice(0, 7);

  const byProduct = db.prepare(`
    SELECT product_name,
      SUM(planned_qty) as planned, SUM(actual_qty) as actual, SUM(brak_qty) as brak,
      COUNT(DISTINCT log_date) as days_produced
    FROM production_logs WHERE strftime('%Y-%m', log_date)=?
    GROUP BY product_name ORDER BY actual DESC
  `).all(month);

  const byLine = db.prepare(`
    SELECT line_name,
      SUM(actual_qty) as actual, SUM(brak_qty) as brak,
      COUNT(DISTINCT log_date) as days_active
    FROM production_logs WHERE strftime('%Y-%m', log_date)=?
    GROUP BY line_name ORDER BY actual DESC
  `).all(month);

  const byDay = db.prepare(`
    SELECT log_date as date,
      SUM(planned_qty) as planned, SUM(actual_qty) as actual, SUM(brak_qty) as brak
    FROM production_logs WHERE strftime('%Y-%m', log_date)=?
    GROUP BY log_date ORDER BY log_date
  `).all(month);

  const stopsByReason = db.prepare(`
    SELECT reason_preset, COUNT(*) as cnt, SUM(duration_min) as total_min
    FROM line_stops WHERE strftime('%Y-%m', stop_date)=?
    GROUP BY reason_preset ORDER BY cnt DESC
  `).all(month);

  const orders = db.prepare(`
    SELECT * FROM orders WHERE strftime('%Y-%m', delivery_date)=? ORDER BY delivery_date
  `).all(month);

  const totals = db.prepare(`
    SELECT SUM(planned_qty) as planned, SUM(actual_qty) as actual, SUM(brak_qty) as brak
    FROM production_logs WHERE strftime('%Y-%m', log_date)=?
  `).get(month);

  res.json({ month, byProduct, byLine, byDay, stopsByReason, orders, totals });
});

// GET /api/reports/yearly?year=2026
router.get('/yearly', auth, (req, res) => {
  const year = req.query.year || new Date().getFullYear().toString();

  const byMonth = db.prepare(`
    SELECT strftime('%Y-%m', log_date) as month,
      SUM(planned_qty) as planned, SUM(actual_qty) as actual, SUM(brak_qty) as brak
    FROM production_logs WHERE strftime('%Y', log_date)=?
    GROUP BY month ORDER BY month
  `).all(year);

  const totals = db.prepare(`
    SELECT SUM(planned_qty) as planned, SUM(actual_qty) as actual, SUM(brak_qty) as brak
    FROM production_logs WHERE strftime('%Y', log_date)=?
  `).get(year);

  const orderTotals = db.prepare(`
    SELECT COUNT(*) as cnt, SUM(total_qty) as qty, SUM(total_weight) as weight
    FROM orders WHERE strftime('%Y', delivery_date)=?
  `).get(year);

  res.json({ year, byMonth, totals, orderTotals });
});

// GET /api/reports/shifts?from=2026-05-01&to=2026-05-31
router.get('/shifts', auth, (req, res) => {
  const { from, to } = req.query;
  let q = `SELECT shift, log_date,
    SUM(planned_qty) as planned, SUM(actual_qty) as actual, SUM(brak_qty) as brak
    FROM production_logs WHERE 1=1`;
  const p = [];
  if (from) { q += ' AND log_date>=?'; p.push(from); }
  if (to)   { q += ' AND log_date<=?'; p.push(to); }
  q += ' GROUP BY shift, log_date ORDER BY log_date, shift';
  res.json(db.prepare(q).all(...p));
});

module.exports = router;
