const TelegramBot = require('node-telegram-bot-api');
const db = require('../db');

let bot = null;

function getBot() {
  if (!bot && process.env.TELEGRAM_BOT_TOKEN) {
    bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });
  }
  return bot;
}

async function sendMessage(chatId, text) {
  const b = getBot();
  if (!b) return;
  try {
    await b.sendMessage(chatId, text, { parse_mode: 'HTML' });
  } catch (e) {
    console.error('Telegram send error:', e.message);
  }
}

async function broadcastToAdmins(text) {
  const users = db.prepare("SELECT telegram_chat_id FROM users WHERE role IN ('admin','editor') AND telegram_chat_id IS NOT NULL AND telegram_chat_id != ''").all();
  for (const u of users) await sendMessage(u.telegram_chat_id, text);

  const subs = db.prepare('SELECT chat_id FROM telegram_subscribers WHERE active=1').all();
  for (const s of subs) await sendMessage(s.chat_id, text);
}

async function notifyDeadlines(daysBefore = 3) {
  const b = getBot();
  if (!b) return;

  const orders = db.prepare(`
    SELECT *, CAST(julianday(delivery_date) - julianday('now') AS INTEGER) as days_left
    FROM orders
    WHERE status != 'completed' AND delivery_date != ''
      AND julianday(delivery_date) - julianday('now') BETWEEN 0 AND ?
    ORDER BY delivery_date ASC
  `).all(daysBefore);

  if (!orders.length) return;

  for (const o of orders) {
    const items = db.prepare('SELECT * FROM order_items WHERE order_id=?').all(o.id);
    const notDone = items.filter(i => i.qty_produced < i.qty_requested);
    const daysText = o.days_left === 0 ? '🚨 <b>BUGUN!</b>' :
                     o.days_left === 1 ? '🔴 <b>Ertaga</b>' :
                     `🟡 <b>${o.days_left} kun qoldi</b>`;

    let msg = `${daysText}\n📦 <b>Buyurtma #${o.order_number}</b>\n`;
    msg += `👤 Xaridor: ${o.customer}\n`;
    msg += `📅 Yetkazish sanasi: ${formatDate(o.delivery_date)}\n`;
    msg += `📊 Tur: ${o.order_type === 'export' ? '🌍 Export' : '🏙 Shahar'}\n`;

    if (notDone.length > 0) {
      msg += `\n⚠️ Tayyor bo'lmagan mahsulotlar:\n`;
      for (const it of notDone.slice(0, 5)) {
        const left = it.qty_requested - it.qty_produced;
        msg += `  • ${it.product_name}: ${left} ${it.unit} qoldi\n`;
      }
      if (notDone.length > 5) msg += `  ... va yana ${notDone.length - 5} ta\n`;
    } else {
      msg += `\n✅ Barcha mahsulotlar tayyor!\n`;
    }

    await broadcastToAdmins(msg);
  }
}

async function notifyLineStop(lineStop) {
  const b = getBot();
  if (!b) return;
  const reason = lineStop.reason_custom || lineStop.reason_preset || 'Noma\'lum sabab';
  const msg = `🔴 <b>Liniya to'xtadi!</b>\n` +
    `🏭 ${lineStop.line_name}\n` +
    `🕐 Vaqt: ${lineStop.stop_time || 'N/A'}\n` +
    `⏱ Davomiylik: ${lineStop.duration_min} daqiqa\n` +
    `❗ Sabab: ${reason}\n` +
    `📅 Sana: ${formatDate(lineStop.stop_date)}`;
  await broadcastToAdmins(msg);
}

async function notifyProductionSummary(date) {
  const b = getBot();
  if (!b) return;

  const today = db.prepare(`
    SELECT SUM(actual_qty) as actual, SUM(planned_qty) as planned, SUM(brak_qty) as brak
    FROM production_logs WHERE log_date=?
  `).get(date);

  if (!today?.actual) return;

  const pct = today.planned > 0 ? Math.round((today.actual / today.planned) * 100) : 0;
  const emoji = pct >= 95 ? '✅' : pct >= 80 ? '🟡' : '🔴';

  const msg = `📊 <b>Kunlik hisobot — ${formatDate(date)}</b>\n\n` +
    `${emoji} Reja bajarilishi: <b>${pct}%</b>\n` +
    `📦 Ishlab chiqarildi: <b>${(today.actual||0).toLocaleString()}</b> dona\n` +
    `🎯 Reja: <b>${(today.planned||0).toLocaleString()}</b> dona\n` +
    `❌ Brak: <b>${(today.brak||0).toLocaleString()}</b> dona`;

  await broadcastToAdmins(msg);
}

function formatDate(d) {
  if (!d) return '';
  return d.split('-').reverse().join('.');
}

module.exports = { getBot, sendMessage, broadcastToAdmins, notifyDeadlines, notifyLineStop, notifyProductionSummary };
