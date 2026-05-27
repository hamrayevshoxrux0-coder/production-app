require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Routes ───────────────────────────────────────────────
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/orders',     require('./routes/orders'));
app.use('/api/production', require('./routes/production'));
app.use('/api/lines',      require('./routes/lines'));
app.use('/api/reports',    require('./routes/reports'));
app.use('/api/import',     require('./routes/import'));
app.use('/api/telegram',   require('./routes/telegram'));
app.use('/api/dashboard',  require('./routes/dashboard'));

// ─── Future modules (ready to uncomment) ──────────────────
// app.use('/api/employees',  require('./routes/employees'));   // Xodimlar va smenalar
// app.use('/api/customers',  require('./routes/customers'));   // Mijozlar (CRM)
// app.use('/api/materials',  require('./routes/materials'));   // Xom ashyo / sklad
// app.use('/api/finance',    require('./routes/finance'));     // Narx va moliya

// Health check
app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// Start scheduler
require('./services/scheduler');

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
