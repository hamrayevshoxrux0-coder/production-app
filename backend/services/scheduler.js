const cron = require('node-cron');
const { notifyDeadlines, notifyProductionSummary } = require('./telegram');

// Every day at 08:00 — deadline warnings
cron.schedule('0 8 * * *', async () => {
  console.log('⏰ Deadline tekshirilmoqda...');
  await notifyDeadlines(3);
}, { timezone: 'Asia/Tashkent' });

// Every day at 18:00 — daily production summary
cron.schedule('0 18 * * *', async () => {
  const today = new Date().toISOString().split('T')[0];
  console.log('📊 Kunlik hisobot yuborilmoqda...');
  await notifyProductionSummary(today);
}, { timezone: 'Asia/Tashkent' });

// Every day at 06:00 — morning deadline warning
cron.schedule('0 6 * * *', async () => {
  console.log('🌅 Ertalabki ogohlantirish...');
  await notifyDeadlines(2);
}, { timezone: 'Asia/Tashkent' });

console.log('✅ Scheduler ishga tushdi (Toshkent vaqti)');
