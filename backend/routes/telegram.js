const router = require('express').Router();
const db = require('../db');
const { sendMessage, notifyDeadlines, broadcastToAdmins } = require('../services/telegram');
const { auth, requireRole } = require('../middleware/auth');

// POST /api/telegram/subscribe  — save chat_id for current user
router.post('/subscribe', auth, (req, res) => {
  const { chat_id } = req.body;
  if (!chat_id) return res.status(400).json({ error: 'chat_id kerak' });
  db.prepare('UPDATE users SET telegram_chat_id=? WHERE id=?').run(String(chat_id), req.user.id);
  sendMessage(chat_id, `✅ <b>Ulandi!</b>\n\nSiz ishlab chiqarish tizimiga Telegram orqali ulangansiz.\n\nXabarlar:\n• Buyurtma deadline yaqinlashganda\n• Liniya to'xtaganda\n• Kunlik hisobot (18:00)\n\n— <i>Ishlab chiqarish tizimi</i>`);
  res.json({ ok: true });
});

// POST /api/telegram/test  — send test message
router.post('/test', auth, requireRole('admin'), async (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id);
  if (!user?.telegram_chat_id) return res.status(400).json({ error: 'Telegram chat_id saqlanmagan. Avval /subscribe qiling.' });
  await sendMessage(user.telegram_chat_id, '✅ <b>Test xabar</b>\n\nTelegram to\'g\'ri ulangan!');
  res.json({ ok: true });
});

// POST /api/telegram/notify-deadlines  — manual trigger
router.post('/notify-deadlines', auth, requireRole('admin'), async (req, res) => {
  const days = parseInt(req.body.days) || 3;
  await notifyDeadlines(days);
  res.json({ ok: true });
});

// POST /api/telegram/broadcast  — admin broadcast
router.post('/broadcast', auth, requireRole('admin'), async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Xabar matni kerak' });
  await broadcastToAdmins(`📢 <b>Admin xabari</b>\n\n${message}`);
  res.json({ ok: true });
});

// GET /api/telegram/subscribers
router.get('/subscribers', auth, requireRole('admin'), (req, res) => {
  const users = db.prepare("SELECT id, username, role, department, telegram_chat_id FROM users WHERE telegram_chat_id IS NOT NULL AND telegram_chat_id != ''").all();
  res.json(users);
});

module.exports = router;
