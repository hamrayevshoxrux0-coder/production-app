const XLSX = require('xlsx');

function parseOrderFile(filePath) {
  const wb = XLSX.readFile(filePath);
  const results = [];

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

    if (rows.length < 3) continue;

    // Detect format: Заказ_XXXX (single order per sheet with header metadata)
    const fmt = detectFormat(rows);

    if (fmt === 'single') {
      const order = parseSingleFormat(rows, sheetName);
      if (order) results.push(order);
    } else if (fmt === 'multi') {
      const order = parseMultiFormat(rows, sheetName);
      if (order) results.push(order);
    }
  }

  return results;
}

function detectFormat(rows) {
  // Single format (Заказ_XXXX): has "Заказ №" and "Покупатель" in top rows
  for (let i = 0; i < Math.min(10, rows.length); i++) {
    const rowStr = rows[i].join(' ');
    if (rowStr.includes('Заказ') && rowStr.match(/\d{3,}/)) return 'single';
    if (rowStr.includes('Покупатель') || rowStr.includes('Xaridor')) return 'single';
  }
  // Multi format (Retpen): has "№:", "Заказчик:", "Тип заказа" near top
  for (let i = 0; i < Math.min(6, rows.length); i++) {
    const rowStr = rows[i].join(' ');
    if (rowStr.includes('Заказчик') || rowStr.includes('Тип заказа')) return 'multi';
  }
  return 'unknown';
}

function parseSingleFormat(rows, sheetName) {
  let orderNumber = '', orderDate = '', customer = '', deliveryDate = '', supplier = '';
  const items = [];
  let currentGroup = '';

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowStr = row.join(' ');

    // Extract header info
    if (!orderNumber) {
      const m = rowStr.match(/Заказ\s*[№#]?\s*(\d+)/i);
      if (m) orderNumber = m[1];
    }
    if (!orderDate) {
      const m = rowStr.match(/Дата[:\s]*(\d{2}[.\/-]\d{2}[.\/-]\d{2,4})/i);
      if (m) orderDate = normalizeDate(m[1]);
    }
    if (!customer) {
      const m = rowStr.match(/Покупатель[:\s]*(.+)/i);
      if (m) customer = m[1].trim();
    }
    if (!deliveryDate) {
      const m = rowStr.match(/[Жж]елаем[а-я]*\s*[а-я]*[:\s]*(\d{2}[.\/-]\d{2}[.\/-]\d{2,4})/i);
      if (m) deliveryDate = normalizeDate(m[1]);
    }
    if (!supplier) {
      const m = rowStr.match(/Поставщик[:\s]*(.+)/i);
      if (m) supplier = m[1].trim();
    }

    // Detect group header (bold-ish rows with no number in col 0)
    if (row[0] === '' && row[1] && typeof row[1] === 'string' && row[1].length > 5 && !row[2]) {
      currentGroup = row[1];
      continue;
    }

    // Data rows: first col is number
    const num = parseInt(row[0]);
    if (!isNaN(num) && num > 0 && row[1]) {
      const productName = String(row[1]).trim();
      const qty = parseFloat(String(row[2]).replace(/[, ]/g,'')) || 0;
      const weightUnit = parseFloat(String(row[3]).replace(/[, ]/g,'')) || 0;
      const packages = parseFloat(String(row[4]).replace(/[, ]/g,'')) || 0;
      const weightTotal = parseFloat(String(row[5]).replace(/[, ]/g,'')) || 0;
      const note = row[6] ? String(row[6]).trim() : '';

      if (productName && qty > 0) {
        items.push({
          product_name: productName,
          group: currentGroup,
          qty_requested: qty,
          weight_unit: weightUnit,
          packages,
          weight_total: weightTotal,
          supplier: note || supplier,
          unit: 'dona'
        });
      }
    }
  }

  if (!orderNumber || items.length === 0) return null;

  return {
    order_number: orderNumber,
    order_date: orderDate || new Date().toISOString().split('T')[0],
    customer: customer || 'Noma\'lum',
    order_type: 'export',
    delivery_date: deliveryDate || '',
    total_qty: items.reduce((s, i) => s + i.qty_requested, 0),
    total_weight: items.reduce((s, i) => s + (i.weight_total || 0), 0),
    items
  };
}

function parseMultiFormat(rows, sheetName) {
  let orderNumber = '', orderDate = '', customer = '', orderType = 'shahar';
  const items = [];
  let headerFound = false;
  let currentGroup = '';

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowStr = row.join('\t');

    if (!orderNumber) {
      const m = rowStr.match(/№[:\s]*(\d+)/);
      if (m) orderNumber = m[1];
    }
    if (!orderDate) {
      const m = rowStr.match(/Дата[:\s]*(\d{4}-\d{2}-\d{2}|\d{2}[.\/-]\d{2}[.\/-]\d{2,4})/i);
      if (m) orderDate = normalizeDate(m[1]);
    }
    if (!customer) {
      const m = rowStr.match(/Заказчик[:\s]*(.+)/i);
      if (m) customer = m[1].trim();
    }
    if (rowStr.includes('Тип заказа')) {
      const m = rowStr.match(/Тип заказа[:\s]*(.+)/i);
      if (m) orderType = m[1].toLowerCase().includes('прих') ? 'shahar' : 'export';
    }

    // Header row detection
    if (rowStr.includes('Название') || rowStr.includes('Кол') ) {
      headerFound = true;
      continue;
    }

    if (!headerFound) continue;

    // Group header (no ID in first col)
    if (row[0] === '' && row[1] && typeof row[1] === 'string' && !parseInt(row[0])) {
      if (row[1].trim().length > 2) currentGroup = row[1].trim();
      continue;
    }

    // Item rows
    const num = parseInt(row[0]);
    if (!isNaN(num) && num > 0 && row[1]) {
      const productName = String(row[1]).trim();
      const qtyReq = parseFloat(String(row[2]).replace(/[, ]/g,'')) || 0;
      const qtyExtra = parseFloat(String(row[3]).replace(/[, ]/g,'')) || 0;
      const price = parseFloat(String(row[4]).replace(/[, ]/g,'')) || 0;
      const amount = parseFloat(String(row[5]).replace(/[, ]/g,'')) || 0;

      if (productName && qtyReq > 0) {
        items.push({
          product_name: productName,
          group: currentGroup,
          qty_requested: qtyReq,
          qty_extra: qtyExtra,
          price,
          amount,
          unit: 'dona'
        });
      }
    }
  }

  if (!orderNumber || items.length === 0) return null;

  return {
    order_number: orderNumber,
    order_date: orderDate || new Date().toISOString().split('T')[0],
    customer: customer || 'Noma\'lum',
    order_type: orderType,
    destination: sheetName,
    total_qty: items.reduce((s, i) => s + i.qty_requested, 0),
    total_weight: items.reduce((s, i) => s + (i.qty_extra || 0), 0),
    items
  };
}

function normalizeDate(str) {
  if (!str) return '';
  str = str.trim();
  // Already ISO
  if (str.match(/^\d{4}-\d{2}-\d{2}$/)) return str;
  // DD.MM.YY or DD.MM.YYYY
  const m = str.match(/^(\d{2})[.\/-](\d{2})[.\/-](\d{2,4})$/);
  if (m) {
    let year = m[3];
    if (year.length === 2) year = '20' + year;
    return `${year}-${m[2]}-${m[1]}`;
  }
  return str;
}

module.exports = { parseOrderFile };
