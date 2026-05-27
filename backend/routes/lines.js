const router = require('express').Router();
const db = require('../db');
const { auth, requireRole } = require('../middleware/auth');

// GET /api/lines
router.get('/', auth, (req, res) => {
  const lines = db.prepare('SELECT * FROM lines ORDER BY id').all();
  res.json(lines);
});

// GET /api/lines/:id
router.get('/:id', auth, (req, res) => {
  const line = db.prepare('SELECT * FROM lines WHERE id=?').get(req.params.id);
  if (!line) return res.status(404).json({ error: 'Topilmadi' });
  const recentStops = db.prepare('SELECT * FROM line_stops WHERE line_id=? ORDER BY stop_date DESC, stop_time DESC LIMIT 10').all(req.params.id);
  const recentLogs  = db.prepare('SELECT * FROM production_logs WHERE line_id=? ORDER BY log_date DESC LIMIT 10').all(req.params.id);
  res.json({ ...line, recentStops, recentLogs });
});

// PUT /api/lines/:id/status
router.put('/:id/status', auth, requireRole('admin','editor'), (req, res) => {
  const { status, current_product } = req.body;
  db.prepare("UPDATE lines SET status=?, current_product=?, last_updated=datetime('now') WHERE id=?")
    .run(status || 'running', current_product || '', req.params.id);
  res.json({ ok: true });
});

// PUT /api/lines/:id  — rename or update
router.put('/:id', auth, requireRole('admin'), (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name kerak' });
  db.prepare('UPDATE lines SET name=? WHERE id=?').run(name, req.params.id);
  res.json({ ok: true });
});

// POST /api/lines  — add new line
router.post('/', auth, requireRole('admin'), (req, res) => {
  const { name } = req.body;
  const result = db.prepare("INSERT INTO lines (name, status) VALUES (?, 'running')").run(name || `Liniya ${Date.now()}`);
  res.json({ id: result.lastInsertRowid, name });
});

// GET /api/lines/stats/all  — stats per line for date range
router.get('/stats/all', auth, (req, res) => {
  const { from, to } = req.query;
  let q = `
    SELECT l.id, l.name, l.status,
      SUM(pl.actual_qty) as total_produced,
      SUM(pl.brak_qty) as total_brak,
      COUNT(DISTINCT ls.id) as stop_count,
      SUM(ls.duration_min) as stop_minutes
    FROM lines l
    LEFT JOIN production_logs pl ON pl.line_id = l.id ${from ? `AND pl.log_date >= '${from}'` : ''} ${to ? `AND pl.log_date <= '${to}'` : ''}
    LEFT JOIN line_stops ls ON ls.line_id = l.id ${from ? `AND ls.stop_date >= '${from}'` : ''} ${to ? `AND ls.stop_date <= '${to}'` : ''}
    GROUP BY l.id ORDER BY l.id
  `;
  res.json(db.prepare(q).all());
});

module.exports = router;
