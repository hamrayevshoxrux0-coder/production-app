# 🏭 Ishlab Chiqarish Boshqaruv Tizimi — O'rnatish Qo'llanmasi

## 📁 Papkalar tuzilishi
```
production-app/
├── backend/          ← Node.js server
│   ├── routes/       ← Har bir bo'lim uchun alohida fayl
│   ├── services/     ← Telegram, Scheduler
│   ├── middleware/   ← Auth
│   ├── server.js     ← Asosiy server
│   ├── db.js         ← Ma'lumotlar bazasi
│   └── .env.example  ← Sozlamalar namunasi
└── frontend/         ← React ilova
    └── src/
        ├── pages/    ← Sahifalar
        ├── components/← Komponentlar
        ├── utils/    ← API, Context
        └── i18n/     ← 3 til (UZ/RU/EN)
```

---

## 🚀 1-QADAM: Telegram Bot yaratish

1. Telegramda **@BotFather** ga yozing
2. `/newbot` buyrug'ini yuboring
3. Botga nom bering: `ZavodProduction`
4. Username bering: `zavodproduction_bot`
5. **BOT TOKEN** ni nusxa oling (shunday ko'rinadi: `7234567890:AAHxxxxx`)

---

## 🖥️ 2-QADAM: Render.com da Backend joylashtirish

### 2.1 GitHub ga yuklash
```bash
# GitHub.com da yangi repository oching: "production-app"
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/SIZNING_USERNAME/production-app.git
git push -u origin main
```

### 2.2 Render.com da yaratish
1. [render.com](https://render.com) ga kiring (GitHub bilan ro'yxatdan o'ting)
2. **"New +"** → **"Web Service"**
3. GitHub repo tanlang
4. Sozlamalar:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Plan:** Free

### 2.3 Environment Variables (Render dashboard → Environment)
```
PORT=3001
JWT_SECRET=sizning_maxfiy_kalit_bu_yerga_yozing
TELEGRAM_BOT_TOKEN=7234567890:AAHxxxxx_bu_yerga
FRONTEND_URL=https://sizning-frontend.onrender.com
```

### 2.4 Backend URL ni eslab qoling
`https://sizning-backend.onrender.com`

---

## 🌐 3-QADAM: Render.com da Frontend joylashtirish

1. **"New +"** → **"Static Site"**
2. GitHub repo tanlang
3. Sozlamalar:
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `build`
4. Environment Variables:
   ```
   REACT_APP_API_URL=https://sizning-backend.onrender.com
   ```

---

## 📱 4-QADAM: Telegram bot ulash

Dasturga kirgandan keyin:
1. **Settings** sahifasiga o'ting
2. Telegram bot nomini Telegramda toping: `@zavodproduction_bot`
3. `/start` yuboring
4. Bot sizga **Chat ID** beradi
5. Shu Chat ID ni Settings sahifasiga kiriting
6. **Test xabar** yuborish tugmasini bosing

---

## 🔑 Kirish ma'lumotlari (birinchi marta)

| Foydalanuvchi | Parol | Rol |
|---|---|---|
| admin | admin123 | Admin (hammasi) |
| tahrilovchi | editor123 | Tahrilovchi (kiritish/o'zgartirish) |
| kuzatuvchi | viewer123 | Kuzatuvchi (faqat ko'rish) |

> ⚠️ **Muhim:** Birinchi kirishdan keyin admin parolini o'zgartiring!

---

## 📊 Excel Import

**Ikkala format qo'llab-quvvatlanadi:**

### Format 1: Заказ_XXXX.xlsx
- Alohida buyurtma fayli
- Yuqorida: Заказ №, Дата, Покупатель
- Pastda: mahsulot qatorlari

### Format 2: Retpen_uchun_zakazlar.xlsx
- Ko'p buyurtmali fayl
- Har bir sheet alohida buyurtma
- №, Заказчик, Тип заказа sarlavhalari

---

## ➕ Kelajakda bo'lim qo'shish

1. `backend/routes/` ga yangi fayl qo'shing (masalan: `employees.js`)
2. `backend/server.js` da kommentni oching:
   ```js
   app.use('/api/employees', require('./routes/employees'));
   ```
3. Frontend `frontend/src/pages/` ga yangi sahifa qo'shing
4. `App.js` da yangi Route qo'shing
5. `Layout.js` da nav elementga qo'shing

---

## 🔔 Telegram xabarlar jadvali

| Vaqt | Xabar |
|---|---|
| 06:00 | 2 kun ichida yetkazilishi kerak bo'lgan buyurtmalar |
| 08:00 | 3 kun ichida yetkazilishi kerak bo'lgan buyurtmalar |
| 18:00 | Kunlik ishlab chiqarish hisoboti |
| Darhol | Liniya to'xtaganda |

---

## 🆘 Yordam

Muammo bo'lsa:
1. Render.com → Logs ni tekshiring
2. Browser Console ni tekshiring (F12)
3. `.env` faylini tekshiring
