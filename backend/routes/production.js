const router = require('express').Router();
const db = require('../db');
const { auth, requireRole } = require('../middleware/auth');

// ─── Production Logs ───────────────────────────────────────

// GET /api/production/logs
router.get('/logs', auth, (req, res) => {
  const { date, shift, line_id, from, to, year, month } = req.query;
  let q = 'SELECT * FROM production_logs WHERE 1=1';
  const p = [];
  if (date)    { q += ' AND log_date=?'; p.push(date); }
  if (shift)   { q += ' AND shift=?'; p.push(shift); }
  if (line_id) { q += ' AND line_id=?'; p.push(line_id); }
  if (from)    { q += ' AND log_date>=?'; p.push(from); }
  if (to)      { q += ' AND log_date<=?'; p.push(to); }
  if (year)    { q += ' AND strftime(\'%Y\',log_date)=?'; p.push(year); }
  if (month)   { q += ' AND strftime(\'%Y-%m\',log_date)=?'; p.push(month); }
  q += ' ORDER BY log_date DESC, created_at DESC';
  res.json(db.prepare(q).all(...p));
});

// POST /api/production/logs
router.post('/logs', auth, requireRole('admin','editor'), (req, res) => {
  const { log_date, shift, line_id, line_name, product_name, planned_qty, actual_qty, brak_qty, unit, notes } = req.body;
  if (!log_date || !product_name) return res.status(400).json({ error: 'log_date va product_name kerak' });
  const result = db.prepare(`
    INSERT INTO production_logs (log_date, shift, line_id, line_name, product_name, planned_qty, actual_qty, brak_qty, unit, notes, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(log_date, shift||'day', line_id||null, line_name||'', product_name, planned_qty||0, actual_qty||0, brak_qty||0, unit||'dona', notes||'', req.user.id);
  res.json({ id: result.lastInsertRowid });
});

// PUT /api/production/logs/:id
router.put('/logs/:id', auth, requireRole('admin','editor'), (req, res) => {
  const { planned_qty, actual_qty, brak_qty, notes } = req.body;
  db.prepare('UPDATE production_logs SET planned_qty=?, actual_qty=?, brak_qty=?, notes=? WHERE id=?')
    .run(planned_qty, actual_qty, brak_qty, notes, req.params.id);
  res.json({ ok: true });
});

// DELETE /api/production/logs/:id
router.delete('/logs/:id', auth, requireRole('admin'), (req, res) => {
  db.prepare('DELETE FROM production_logs WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// ─── Line Stops ────────────────────────────────────────────

// GET /api/production/stops
router.get('/stops', auth, (req, res) => {
  const { date, shift, line_id, from, to, year, month } = req.query;
  let q = 'SELECT * FROM line_stops WHERE 1=1';
  const p = [];
  if (date)    { q += ' AND stop_date=?'; p.push(date); }
  if (shift)   { q += ' AND shift=?'; p.push(shift); }
  if (line_id) { q += ' AND line_id=?'; p.push(line_id); }
  if (from)    { q += ' AND stop_date>=?'; p.push(from); }
  if (to)      { q += ' AND stop_date<=?'; p.push(to); }
  if (year)    { q += ' AND strftime(\'%Y\',stop_date)=?'; p.push(year); }
  if (month)   { q += ' AND strftime(\'%Y-%m\',stop_date)=?'; p.push(month); }
  q += ' ORDER BY stop_date DESC, stop_time DESC';
  res.json(db.prepare(q).all(...p));
});

// POST /api/production/stops
router.post('/stops', auth, requireRole('admin','editor'), (req, res) => {
  const { stop_date, shift, line_id, line_name, stop_time, duration_min, reason_preset, reason_custom, reason_category } = req.body;
  if (!stop_date || !line_id) return res.status(400).json({ error: 'stop_date va line_id kerak' });

  // Update line status
  db.prepare("UPDATE lines SET status='stopped', last_updated=datetime('now') WHERE id=?").run(line_id);

  const result = db.prepare(`
    INSERT INTO line_stops (stop_date, shift, line_id, line_name, stop_time, duration_min, reason_preset, reason_custom, reason_category, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(stop_date, shift||'day', line_id, line_name||'', stop_time||'', duration_min||0, reason_preset||'', reason_custom||'', reason_category||'other', req.user.id);
  res.json({ id: result.lastInsertRowid });
});

// DELETE /api/production/stops/:id
router.delete('/stops/:id', auth, requireRole('admin'), (req, res) => {
  db.prepare('DELETE FROM line_stops WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// GET /api/production/summary?date=2026-05-26
router.get('/summary', auth, (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];
  const month = date.slice(0, 7);

  const today = db.prepare(`
    SELECT
      SUM(actual_qty) as total_produced,
      SUM(planned_qty) as total_planned,
      SUM(brak_qty) as total_brak,
      COUNT(DISTINCT line_id) as active_lines
    FROM production_logs WHERE log_date=?
  `).get(date);

  const stops_today = db.prepare(`
    SELECT COUNT(*) as cnt, SUM(duration_min) as total_min
    FROM line_stops WHERE stop_date=?
  `).get(date);

  const monthly = db.prepare(`
    SELECT
      SUM(actual_qty) as total_produced,
      SUM(planned_qty) as total_planned,
      SUM(brak_qty) as total_brak
    FROM production_logs WHERE strftime('%Y-%m', log_date)=?
  `).get(month);

  res.json({ today, stops_today, monthly, date });
});

// GET /api/production/stop-reasons  — top reasons for analytics
router.get('/stop-reasons', auth, (req, res) => {
  const { from, to } = req.query;
  let q = `SELECT reason_preset, reason_category, COUNT(*) as cnt, SUM(duration_min) as total_min FROM line_stops WHERE 1=1`;
  const p = [];
  if (from) { q += ' AND stop_date>=?'; p.push(from); }
  if (to)   { q += ' AND stop_date<=?'; p.push(to); }
  q += ' GROUP BY reason_preset ORDER BY cnt DESC LIMIT 20';
  res.json(db.prepare(q).all(...p));
});

module.exports = router;
