const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { auth, requireRole } = require('../middleware/auth');

const SECRET = process.env.JWT_SECRET || 'production_secret_2026';

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username va parol kerak' });

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) return res.status(401).json({ error: 'Foydalanuvchi topilmadi' });

  const ok = bcrypt.compareSync(password, user.password);
  if (!ok) return res.status(401).json({ error: 'Parol noto\'g\'ri' });

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role, department: user.department },
    SECRET, { expiresIn: '7d' }
  );
  res.json({ token, user: { id: user.id, username: user.username, role: user.role, department: user.department } });
});

// GET /api/auth/me
router.get('/me', auth, (req, res) => {
  const user = db.prepare('SELECT id, username, role, department, telegram_chat_id FROM users WHERE id = ?').get(req.user.id);
  res.json(user);
});

// GET /api/auth/users  (admin only)
router.get('/users', auth, requireRole('admin'), (req, res) => {
  const users = db.prepare('SELECT id, username, role, department, created_at FROM users ORDER BY id').all();
  res.json(users);
});

// POST /api/auth/users  (admin only)
router.post('/users', auth, requireRole('admin'), (req, res) => {
  const { username, password, role, department } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username va parol kerak' });
  const hash = bcrypt.hashSync(password, 10);
  try {
    const result = db.prepare('INSERT INTO users (username, password, role, department) VALUES (?, ?, ?, ?)').run(username, hash, role || 'viewer', department || '');
    res.json({ id: result.lastInsertRowid, username, role, department });
  } catch (e) {
    res.status(400).json({ error: 'Bu username band' });
  }
});

// PUT /api/auth/users/:id  (admin only)
router.put('/users/:id', auth, requireRole('admin'), (req, res) => {
  const { role, department, password } = req.body;
  if (password) {
    const hash = bcrypt.hashSync(password, 10);
    db.prepare('UPDATE users SET role=?, department=?, password=? WHERE id=?').run(role, department, hash, req.params.id);
  } else {
    db.prepare('UPDATE users SET role=?, department=? WHERE id=?').run(role, department, req.params.id);
  }
  res.json({ ok: true });
});

// DELETE /api/auth/users/:id  (admin only)
router.delete('/users/:id', auth, requireRole('admin'), (req, res) => {
  if (parseInt(req.params.id) === req.user.id) return res.status(400).json({ error: 'O\'zingizni o\'chira olmaysiz' });
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// PUT /api/auth/telegram  — user saves their own telegram chat id
router.put('/telegram', auth, (req, res) => {
  const { chat_id } = req.body;
  db.prepare('UPDATE users SET telegram_chat_id=? WHERE id=?').run(chat_id, req.user.id);
  res.json({ ok: true });
});

module.exports = router;
