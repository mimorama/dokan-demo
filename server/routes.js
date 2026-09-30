const express = require('express');
const router = express.Router();
const db = require('./db');
const fs = require('fs');
const path = require('path');

// Cairo / Egypt Timezone Helpers (Africa/Cairo)
function getCairoDate() {
  return new Intl.DateTimeFormat('en-CA', { 
    timeZone: 'Africa/Cairo', 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  }).format(new Date()); // Returns "YYYY-MM-DD" in Cairo time
}

function formatCairoDate(dateObj = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { 
    timeZone: 'Africa/Cairo', 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  }).format(dateObj);
}

function getCairoDateTime() {
  const formatted = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Africa/Cairo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(new Date());
  return formatted.replace(' ', 'T'); // Returns "YYYY-MM-DDTHH:mm:ss" in Cairo time
}

// Helper to generate Invoice / Reference Numbers using Cairo date
function generateInvoiceNo(type = 'INV') {
  const dateStr = getCairoDate().replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `${type}-${dateStr}-${randomSuffix}`;
}

// Enterprise Activity Audit Logger
function logActivity(req, actionType, targetType, targetId, description, details = {}) {
  try {
    let userName = null;
    let userId = null;
    let userRole = null;

    if (req?.headers) {
      if (req.headers['x-user-name']) {
        try { userName = decodeURIComponent(req.headers['x-user-name']); } catch(e) { userName = req.headers['x-user-name']; }
      }
      if (req.headers['x-user-id']) {
        userId = Number(req.headers['x-user-id']) || null;
      }
      if (req.headers['x-user-role']) {
        userRole = req.headers['x-user-role'];
      }
    }

    const bodyUser = req?.body?._user || req?.query?._user || {};
    userId = userId || bodyUser.id || req?.body?.user_id || null;
    userName = userName || bodyUser.name || req?.body?.user_name || req?.body?.processed_by || 'النظام المحلي';
    userRole = userRole || bodyUser.role || req?.body?.user_role || 'system';

    const ip = req?.headers?.['x-forwarded-for'] || req?.socket?.remoteAddress || '127.0.0.1';
    db.prepare(`
      INSERT INTO activity_logs (user_id, user_name, user_role, action_type, target_type, target_id, description, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      userName,
      userRole,
      actionType,
      targetType || '',
      String(targetId || ''),
      description,
      typeof details === 'string' ? details : JSON.stringify(details),
      ip
    );
  } catch (e) {
    console.error('Failed to log activity:', e);
  }
}

// ==========================================
// 1. DASHBOARD
// ==========================================
router.get('/dashboard', (req, res) => {
  try {
    const today = getCairoDate();
    const startOfMonth = today.slice(0, 7) + '-01';

    // Products & Stock
    const totalProducts = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
    const inStockSerials = db.prepare("SELECT COUNT(*) as count FROM product_serials WHERE status = 'in_stock'").get().count;
    const soldSerials = db.prepare("SELECT COUNT(*) as count FROM product_serials WHERE status = 'sold'").get().count;

    // Stock Valuation
    const stockValuation = db.prepare(`
      SELECT 
        COALESCE(SUM(s.cost_price), 0) as totalCost,
        COALESCE(SUM(p.cash_price), 0) as potentialCashRevenue
      FROM product_serials s
      JOIN products p ON s.product_id = p.id
      WHERE s.status = 'in_stock'
    `).get();

    // Sales Stats
    const todaySales = db.prepare(`
      SELECT COALESCE(SUM(total), 0) as total, COUNT(*) as count 
      FROM sales WHERE DATE(created_at) = DATE(?) AND status = 'completed'
    `).get(today);

    const monthSales = db.prepare(`
      SELECT COALESCE(SUM(total), 0) as total, COUNT(*) as count 
      FROM sales WHERE DATE(created_at) >= DATE(?) AND status = 'completed'
    `).get(startOfMonth);

    // Installments Stats
    const activePlans = db.prepare("SELECT COUNT(*) as count, COALESCE(SUM(remaining_balance), 0) as totalRemaining FROM installment_plans WHERE status = 'active'").get();
    
    // Overdue installments
    const overdueInstallments = db.prepare(`
      SELECT COUNT(*) as count, COALESCE(SUM(amount_due - amount_paid), 0) as totalLate
      FROM installment_payments
      WHERE status != 'paid' AND due_date < DATE('now')
    `).get();

    // Due this month installments
    const dueThisMonth = db.prepare(`
      SELECT COUNT(*) as count, COALESCE(SUM(amount_due), 0) as totalDue
      FROM installment_payments
      WHERE due_date >= DATE(?) AND due_date <= DATE(?, '+1 month', '-1 day')
    `).get(startOfMonth, startOfMonth);

    // Cashbox Balance
    const cashIn = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM cash_box WHERE type = 'in'").get().total;
    const cashOut = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM cash_box WHERE type = 'out'").get().total;
    const cashBalance = cashIn - cashOut;

    // Low Stock Alerts (Products where in-stock serials <= alert_quantity)
    const lowStockProducts = db.prepare(`
      SELECT p.id, p.name, p.model_number, p.alert_quantity, b.name as brand_name,
        (SELECT COUNT(*) FROM product_serials WHERE product_id = p.id AND status = 'in_stock') as stock_count
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE (SELECT COUNT(*) FROM product_serials WHERE product_id = p.id AND status = 'in_stock') <= p.alert_quantity
      ORDER BY stock_count ASC
      LIMIT 6
    `).all();

    // Upcoming Due Installments (Next 15 days or overdue)
    const upcomingPayments = db.prepare(`
      SELECT 
        ip.id, ip.installment_no, ip.due_date, ip.amount_due, ip.amount_paid, ip.status,
        c.name as customer_name, c.phone as customer_phone,
        plan.id as plan_id, plan.monthly_amount
      FROM installment_payments ip
      JOIN installment_plans plan ON ip.installment_plan_id = plan.id
      JOIN customers c ON plan.customer_id = c.id
      WHERE ip.status != 'paid' AND ip.due_date <= DATE('now', '+15 days')
      ORDER BY ip.due_date ASC
      LIMIT 10
    `).all();

    // Recent Sales
    const recentSales = db.prepare(`
      SELECT s.id, s.invoice_no, s.sale_type, s.total, s.paid_amount, s.created_at,
        COALESCE(c.name, 'عميل نقدي') as customer_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      ORDER BY s.created_at DESC
      LIMIT 5
    `).all();

    res.json({
      totalProducts,
      inStockSerials,
      soldSerials,
      stockValuation,
      todaySales,
      monthSales,
      activePlans,
      overdueInstallments,
      dueThisMonth,
      cashBalance,
      lowStockProducts,
      upcomingPayments,
      recentSales
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 2. SETTINGS
// ==========================================
router.get('/settings', (req, res) => {
  try {
    const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const updateSettingsHandler = (req, res) => {
  try {
    const current = db.prepare('SELECT * FROM settings WHERE id = 1').get() || {};
    const {
      store_name, tagline, phone, phone2, address, commercial_reg, tax_number, currency,
      warranty_policy, installment_terms, logo_url,
      max_cashier_discount_percent, max_cashier_discount_amount, manager_override_pin
    } = req.body;

    db.prepare(`
      UPDATE settings SET
        store_name = @store_name,
        tagline = @tagline,
        phone = @phone,
        phone2 = @phone2,
        address = @address,
        commercial_reg = @commercial_reg,
        tax_number = @tax_number,
        currency = @currency,
        warranty_policy = @warranty_policy,
        installment_terms = @installment_terms,
        logo_url = @logo_url,
        max_cashier_discount_percent = @max_cashier_discount_percent,
        max_cashier_discount_amount = @max_cashier_discount_amount,
        manager_override_pin = @manager_override_pin
      WHERE id = 1
    `).run({
      store_name: store_name !== undefined ? store_name : (current.store_name || ''),
      tagline: tagline !== undefined ? tagline : (current.tagline || ''),
      phone: phone !== undefined ? phone : (current.phone || ''),
      phone2: phone2 !== undefined ? phone2 : (current.phone2 || ''),
      address: address !== undefined ? address : (current.address || ''),
      commercial_reg: commercial_reg !== undefined ? commercial_reg : (current.commercial_reg || ''),
      tax_number: tax_number !== undefined ? tax_number : (current.tax_number || ''),
      currency: currency !== undefined ? currency : (current.currency || 'ج.م'),
      warranty_policy: warranty_policy !== undefined ? warranty_policy : (current.warranty_policy || ''),
      installment_terms: installment_terms !== undefined ? installment_terms : (current.installment_terms || ''),
      logo_url: logo_url !== undefined ? logo_url : (current.logo_url || ''),
      max_cashier_discount_percent: max_cashier_discount_percent !== undefined ? Number(max_cashier_discount_percent) : (current.max_cashier_discount_percent || 5),
      max_cashier_discount_amount: max_cashier_discount_amount !== undefined ? Number(max_cashier_discount_amount) : (current.max_cashier_discount_amount || 500),
      manager_override_pin: manager_override_pin !== undefined ? manager_override_pin : (current.manager_override_pin || '1234')
    });

    logActivity(req, 'SETTINGS_UPDATED', 'settings', 1, `تحديث إعدادات المعرض والشعار والخصومات`);

    const updated = db.prepare('SELECT * FROM settings WHERE id = 1').get();
    res.json({ success: true, settings: updated, message: 'تم حفظ إعدادات المحل وشعار المعرض بنجاح' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

router.post('/settings', updateSettingsHandler);
router.put('/settings', updateSettingsHandler);

// ==========================================
// 3. CATEGORIES & BRANDS
// ==========================================
router.get('/categories', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT c.*, (SELECT COUNT(*) FROM products WHERE category_id = c.id) as products_count
      FROM categories c ORDER BY c.id ASC
    `).all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/categories', (req, res) => {
  try {
    const { name, icon, description } = req.body;
    const info = db.prepare('INSERT INTO categories (name, icon, description) VALUES (?, ?, ?)').run(name, icon || 'Package', description || '');
    res.json({ id: info.lastInsertRowid, name, icon, description });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/categories/:id', (req, res) => {
  try {
    const { name, icon, description } = req.body;
    db.prepare('UPDATE categories SET name = ?, icon = ?, description = ? WHERE id = ?').run(name, icon || 'Package', description || '', req.params.id);
    res.json({ success: true, id: req.params.id, name, icon, description });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/categories/:id', (req, res) => {
  try {
    const pCount = db.prepare('SELECT COUNT(*) as count FROM products WHERE category_id = ?').get(req.params.id).count;
    if (pCount > 0) {
      return res.status(400).json({ error: `لا يمكن حذف هذا التصنيف لوجود ${pCount} أجهزة مسجلة تابعة له` });
    }
    db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/brands', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT b.*, (SELECT COUNT(*) FROM products WHERE brand_id = b.id) as products_count
      FROM brands b ORDER BY b.name ASC
    `).all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/brands', (req, res) => {
  try {
    const { name, country, agent_name, agent_phone, supplier_ids } = req.body;
    const supIds = Array.isArray(supplier_ids) ? JSON.stringify(supplier_ids) : (supplier_ids || null);
    const info = db.prepare('INSERT INTO brands (name, country, agent_name, agent_phone, supplier_ids) VALUES (?, ?, ?, ?, ?)').run(name, country, agent_name, agent_phone, supIds);
    logActivity(req, 'BRAND_CREATED', 'brand', info.lastInsertRowid, `إضافة ماركة جديدة: ${name} (${country || 'عام'})`, req.body);
    res.json({ id: info.lastInsertRowid, name, country, agent_name, agent_phone, supplier_ids: supIds });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 4. PRODUCTS & INVENTORY
// ==========================================
router.get('/products', (req, res) => {
  try {
    const { category_id, brand_id, search } = req.query;
    let query = `
      SELECT 
        p.*, 
        c.name as category_name,
        b.name as brand_name,
        b.agent_name,
        b.agent_phone,
        (SELECT COUNT(*) FROM product_serials WHERE product_id = p.id AND status = 'in_stock') as in_stock_count,
        (SELECT COUNT(*) FROM product_serials WHERE product_id = p.id AND status = 'sold') as sold_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE 1=1
    `;
    const params = [];

    if (category_id) {
      query += ` AND p.category_id = ?`;
      params.push(category_id);
    }
    if (brand_id) {
      query += ` AND p.brand_id = ?`;
      params.push(brand_id);
    }
    if (search) {
      query += ` AND (p.name LIKE ? OR p.model_number LIKE ? OR p.barcode LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY p.id DESC`;
    const products = db.prepare(query).all(...params);
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/products/:id', (req, res) => {
  try {
    const product = db.prepare(`
      SELECT p.*, c.name as category_name, b.name as brand_name, b.agent_name, b.agent_phone
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.id = ?
    `).get(req.params.id);

    if (!product) return res.status(404).json({ error: 'المنتج غير موجود' });

    // Fetch serials
    const serials = db.prepare('SELECT * FROM product_serials WHERE product_id = ? ORDER BY id DESC').all(req.params.id);
    product.serials = serials;

    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/products', (req, res) => {
  try {
    const {
      category_id, brand_id, name, model_number, barcode, specifications,
      cost_price, cash_price, installment_price, warranty_months, warranty_agency, alert_quantity,
      initial_serials // Array or newline-separated string of serial numbers
    } = req.body;

    const insert = db.prepare(`
      INSERT INTO products (
        category_id, brand_id, name, model_number, barcode, specifications,
        cost_price, cash_price, installment_price, warranty_months, warranty_agency, alert_quantity
      ) VALUES (
        @category_id, @brand_id, @name, @model_number, @barcode, @specifications,
        @cost_price, @cash_price, @installment_price, @warranty_months, @warranty_agency, @alert_quantity
      )
    `);

    const transaction = db.transaction(() => {
      const info = insert.run({
        category_id: category_id || null,
        brand_id: brand_id || null,
        name,
        model_number: model_number || '',
        barcode: barcode || '',
        specifications: specifications || '',
        cost_price: Number(cost_price) || 0,
        cash_price: Number(cash_price) || 0,
        installment_price: Number(installment_price) || 0,
        warranty_months: Number(warranty_months) || 12,
        warranty_agency: warranty_agency || '',
        alert_quantity: Number(alert_quantity) || 2
      });

      const productId = info.lastInsertRowid;

      // If initial serials provided
      if (initial_serials) {
        let serialList = [];
        if (Array.isArray(initial_serials)) {
          serialList = initial_serials;
        } else if (typeof initial_serials === 'string') {
          serialList = initial_serials.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
        }

        const insertSerial = db.prepare(`
          INSERT OR IGNORE INTO product_serials (product_id, serial_number, status, cost_price)
          VALUES (?, ?, 'in_stock', ?)
        `);

        for (const s of serialList) {
          insertSerial.run(productId, s, Number(cost_price) || 0);
        }
      }

      return productId;
    });

    const newId = transaction();
    res.json({ success: true, id: newId, message: 'تمت إضافة الجهاز بنجاح' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk Import Products from Excel / JSON
router.post('/products/bulk', (req, res) => {
  try {
    const rawList = Array.isArray(req.body) ? req.body : (req.body.products || []);
    if (!rawList || rawList.length === 0) {
      return res.status(400).json({ error: 'لم يتم إرسال أي أصناف للاستيراد' });
    }

    const defaultWh = db.prepare('SELECT id FROM warehouses WHERE is_default = 1 LIMIT 1').get() 
      || db.prepare('SELECT id FROM warehouses LIMIT 1').get();
    const warehouseId = defaultWh ? defaultWh.id : null;

    let inserted = 0;
    let updated = 0;
    let errors = [];

    const bulkTx = db.transaction(() => {
      for (let i = 0; i < rawList.length; i++) {
        const item = rawList[i];
        const name = (item.name || item['اسم الجهاز *'] || item['اسم الجهاز'] || item['اسم الصنف'] || '').trim();
        if (!name) {
          errors.push(`الصف رقم ${i + 1}: اسم الجهاز مطلوب`);
          continue;
        }

        const model_number = (item.model_number || item['الموديل'] || item['رقم الموديل'] || '').trim();
        const barcode = (item.barcode || item['الباركود'] || item['باركود'] || '').trim();
        const specifications = (item.specifications || item['المواصفات الفنية'] || item['المواصفات'] || '').trim();
        const cost_price = Number(item.cost_price ?? item['سعر التكلفة'] ?? item['التكلفة']) || 0;
        const cash_price = Number(item.cash_price ?? item['سعر الكاش'] ?? item['سعر البيع'] ?? item['سعر البيع كاش']) || 0;
        const installment_price = Number(item.installment_price ?? item['سعر التقسيط'] ?? item['سعر بيع التقسيط']) || 0;
        const warranty_months = Number(item.warranty_months ?? item['مدة الضمان بالشهور'] ?? item['مدة الضمان'] ?? item['الضمان']) || 12;
        const warranty_agency = (item.warranty_agency || item['شركة الضمان والصيانة'] || item['وكيل الضمان'] || item['شركة الضمان'] || '').trim();
        const alert_quantity = Number(item.alert_quantity ?? item['حد النواقص الأدنى'] ?? item['حد الطلب'] ?? item['حد النواقص']) || 2;
        const initial_quantity = Number(item.initial_quantity ?? item['الرصيد / الكمية الأولية'] ?? item['الكمية الأولية'] ?? item['الكمية'] ?? item['الرصيد']) || 0;
        const rawSerials = item.serials || item['السيريالات'] || item['الأرقام التسلسلية'] || item['سيريالات'] || item.initial_serials || '';

        // Category resolution
        let category_id = item.category_id || null;
        const categoryName = (item.category_name || item['القسم / الفئة'] || item['القسم'] || item['التصنيف'] || '').trim();
        if (!category_id && categoryName) {
          let cat = db.prepare('SELECT id FROM categories WHERE name = ? COLLATE NOCASE').get(categoryName);
          if (!cat) {
            const insCat = db.prepare('INSERT INTO categories (name, description, icon) VALUES (?, ?, ?)').run(categoryName, 'تمت الإضافة تلقائياً عبر استيراد Excel', 'Package');
            category_id = insCat.lastInsertRowid;
          } else {
            category_id = cat.id;
          }
        }

        // Brand resolution
        let brand_id = item.brand_id || null;
        const brandName = (item.brand_name || item['الماركة'] || item['الماركة التجارية'] || item['البراند'] || '').trim();
        if (!brand_id && brandName) {
          let brnd = db.prepare('SELECT id FROM brands WHERE name = ? COLLATE NOCASE').get(brandName);
          if (!brnd) {
            const insBrnd = db.prepare('INSERT INTO brands (name, country, agent_name, agent_phone) VALUES (?, ?, ?, ?)').run(brandName, 'مصر', warranty_agency || '', '');
            brand_id = insBrnd.lastInsertRowid;
          } else {
            brand_id = brnd.id;
          }
        }

        // Find existing product by barcode, or name + model, or name
        let existing = null;
        if (barcode) {
          existing = db.prepare('SELECT id FROM products WHERE barcode = ?').get(barcode);
        }
        if (!existing && name && model_number) {
          existing = db.prepare('SELECT id FROM products WHERE name = ? AND model_number = ?').get(name, model_number);
        }
        if (!existing && name) {
          existing = db.prepare('SELECT id FROM products WHERE name = ?').get(name);
        }

        let productId;
        if (existing) {
          productId = existing.id;
          db.prepare(`
            UPDATE products SET
              category_id = COALESCE(?, category_id),
              brand_id = COALESCE(?, brand_id),
              model_number = CASE WHEN ? != '' THEN ? ELSE model_number END,
              barcode = CASE WHEN ? != '' THEN ? ELSE barcode END,
              specifications = CASE WHEN ? != '' THEN ? ELSE specifications END,
              cost_price = CASE WHEN ? > 0 THEN ? ELSE cost_price END,
              cash_price = CASE WHEN ? > 0 THEN ? ELSE cash_price END,
              installment_price = CASE WHEN ? > 0 THEN ? ELSE installment_price END,
              warranty_months = CASE WHEN ? > 0 THEN ? ELSE warranty_months END,
              warranty_agency = CASE WHEN ? != '' THEN ? ELSE warranty_agency END,
              alert_quantity = CASE WHEN ? > 0 THEN ? ELSE alert_quantity END
            WHERE id = ?
          `).run(
            category_id,
            brand_id,
            model_number, model_number,
            barcode, barcode,
            specifications, specifications,
            cost_price, cost_price,
            cash_price, cash_price,
            installment_price, installment_price,
            warranty_months, warranty_months,
            warranty_agency, warranty_agency,
            alert_quantity, alert_quantity,
            productId
          );
          updated++;
        } else {
          const ins = db.prepare(`
            INSERT INTO products (
              category_id, brand_id, name, model_number, barcode, specifications,
              cost_price, cash_price, installment_price, warranty_months, warranty_agency, alert_quantity
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            category_id, brand_id, name, model_number, barcode, specifications,
            cost_price, cash_price, installment_price, warranty_months, warranty_agency, alert_quantity
          );
          productId = ins.lastInsertRowid;
          inserted++;
        }

        // Handle Serials / Stock quantity
        let serialList = [];
        if (Array.isArray(rawSerials)) {
          serialList = rawSerials.map(s => String(s).trim()).filter(Boolean);
        } else if (typeof rawSerials === 'string' && rawSerials.trim()) {
          serialList = rawSerials.split(/[\n,;]+/).map(s => s.trim()).filter(Boolean);
        }

        // If no explicit serials provided, but initial_quantity > 0
        if (serialList.length === 0 && initial_quantity > 0) {
          const prefix = barcode ? barcode.slice(-6) : `PRD${productId}`;
          const timestamp = Date.now().toString(36).toUpperCase();
          for (let q = 1; q <= initial_quantity; q++) {
            const rand = Math.floor(100 + Math.random() * 900);
            serialList.push(`${prefix}-${timestamp}-${q}${rand}`);
          }
        }

        if (serialList.length > 0) {
          const insertSerial = db.prepare(`
            INSERT OR IGNORE INTO product_serials (product_id, serial_number, status, cost_price, warehouse_id)
            VALUES (?, ?, 'in_stock', ?, ?)
          `);
          for (const s of serialList) {
            insertSerial.run(productId, s, cost_price, warehouseId);
          }
        }
      }
    });

    bulkTx();

    logActivity(
      req, 
      'PRODUCTS_BULK_IMPORT', 
      'product', 
      null, 
      `استيراد جماعي لـ ${rawList.length} صنف/جهاز من ملف Excel (إضافة: ${inserted}، تحديث: ${updated})`, 
      { count: rawList.length, inserted, updated, errors }
    );

    res.json({
      success: true,
      count: rawList.length,
      inserted,
      updated,
      errors: errors.length > 0 ? errors : undefined,
      message: `تم استيراد ${inserted + updated} صنف بنجاح (إضافة جديدة: ${inserted}، تحديث: ${updated})`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/products/:id', (req, res) => {
  try {
    const {
      category_id, brand_id, name, model_number, barcode, specifications,
      cost_price, cash_price, installment_price, warranty_months, warranty_agency, alert_quantity
    } = req.body;

    db.prepare(`
      UPDATE products SET
        category_id = @category_id, brand_id = @brand_id, name = @name,
        model_number = @model_number, barcode = @barcode, specifications = @specifications,
        cost_price = @cost_price, cash_price = @cash_price, installment_price = @installment_price,
        warranty_months = @warranty_months, warranty_agency = @warranty_agency, alert_quantity = @alert_quantity
      WHERE id = @id
    `).run({
      id: req.params.id,
      category_id: category_id || null,
      brand_id: brand_id || null,
      name,
      model_number: model_number || '',
      barcode: barcode || '',
      specifications: specifications || '',
      cost_price: Number(cost_price) || 0,
      cash_price: Number(cash_price) || 0,
      installment_price: Number(installment_price) || 0,
      warranty_months: Number(warranty_months) || 12,
      warranty_agency: warranty_agency || '',
      alert_quantity: Number(alert_quantity) || 2
    });

    res.json({ success: true, message: 'تم تحديث بيانات الجهاز بنجاح' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/products/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'تم حذف الجهاز بنجاح' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 5. SERIAL NUMBERS & WARRANTY
// ==========================================
// Get all serials or search warranty
router.get('/serials', (req, res) => {
  try {
    const { status, search, product_id } = req.query;
    let query = `
      SELECT 
        s.*,
        p.name as product_name,
        p.model_number,
        p.warranty_months,
        p.warranty_agency,
        b.name as brand_name,
        c.name as customer_name,
        c.phone as customer_phone,
        sales.invoice_no
      FROM product_serials s
      JOIN products p ON s.product_id = p.id
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN sales ON s.sale_id = sales.id
      LEFT JOIN customers c ON sales.customer_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ` AND s.status = ?`;
      params.push(status);
    }
    if (product_id) {
      query += ` AND s.product_id = ?`;
      params.push(product_id);
    }
    if (search) {
      query += ` AND (s.serial_number LIKE ? OR p.name LIKE ? OR c.name LIKE ? OR c.phone LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY s.id DESC LIMIT 100`;
    const rows = db.prepare(query).all(...params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Batch add serial numbers to a product
router.post('/serials/batch', (req, res) => {
  try {
    const { product_id, serials, cost_price, warehouse_id } = req.body;
    if (!product_id || !serials) {
      return res.status(400).json({ error: 'الرجاء تحديد المنتج والأرقام التسلسلية' });
    }

    let serialList = [];
    if (Array.isArray(serials)) {
      serialList = serials;
    } else if (typeof serials === 'string') {
      serialList = serials.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
    }

    const targetWarehouseId = Number(warehouse_id) || 1;
    const insert = db.prepare(`
      INSERT OR IGNORE INTO product_serials (product_id, serial_number, status, cost_price, warehouse_id)
      VALUES (?, ?, 'in_stock', ?, ?)
    `);

    let addedCount = 0;
    const batchTransaction = db.transaction(() => {
      for (const s of serialList) {
        const result = insert.run(product_id, s, Number(cost_price) || 0, targetWarehouseId);
        if (result.changes > 0) addedCount++;
      }
    });

    batchTransaction();
    res.json({ success: true, count: addedCount, message: `تم تسجيل ${addedCount} جهاز بالسيريال بنجاح` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update serial status (e.g. maintenance, returned)
router.put('/serials/:id', (req, res) => {
  try {
    const { status, notes, warehouse_id } = req.body;
    if (warehouse_id) {
      db.prepare('UPDATE product_serials SET status = ?, notes = ?, warehouse_id = ? WHERE id = ?').run(status, notes, warehouse_id, req.params.id);
    } else {
      db.prepare('UPDATE product_serials SET status = ?, notes = ? WHERE id = ?').run(status, notes, req.params.id);
    }
    res.json({ success: true, message: 'تم تحديث حالة السيريال' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Available serials for POS selection
router.get('/products/:id/available-serials', (req, res) => {
  try {
    const { warehouse_id } = req.query;
    let query = `
      SELECT s.id, s.serial_number, s.cost_price, s.warehouse_id, w.name as warehouse_name
      FROM product_serials s
      LEFT JOIN warehouses w ON s.warehouse_id = w.id
      WHERE s.product_id = ? AND s.status = 'in_stock'
    `;
    const params = [req.params.id];
    if (warehouse_id) {
      query += ` AND s.warehouse_id = ?`;
      params.push(warehouse_id);
    }
    query += ` ORDER BY s.id ASC`;
    const serials = db.prepare(query).all(...params);
    res.json(serials);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 6. CUSTOMERS & GUARANTORS
// ==========================================
router.get('/customers', (req, res) => {
  try {
    const { search } = req.query;
    let query = `
      SELECT 
        c.*,
        (SELECT COUNT(*) FROM sales WHERE customer_id = c.id) as sales_count,
        (SELECT COUNT(*) FROM installment_plans WHERE customer_id = c.id AND status = 'active') as active_plans_count,
        (SELECT COALESCE(SUM(remaining_balance), 0) FROM installment_plans WHERE customer_id = c.id AND status = 'active') as total_debt
      FROM customers c
      WHERE 1=1
    `;
    const params = [];
    if (search) {
      query += ` AND (c.name LIKE ? OR c.phone LIKE ? OR c.national_id LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    query += ` ORDER BY c.id DESC`;
    const customers = db.prepare(query).all(...params);
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/customers/lookup', (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length === 0) return res.json([]);
    const query = `
      SELECT 
        c.*,
        (SELECT COUNT(*) FROM sales WHERE customer_id = c.id) as sales_count,
        (SELECT COALESCE(SUM(total), 0) FROM sales WHERE customer_id = c.id) as total_spent,
        (SELECT COUNT(*) FROM installment_plans WHERE customer_id = c.id AND status = 'active') as active_plans_count,
        (SELECT COALESCE(SUM(remaining_balance), 0) FROM installment_plans WHERE customer_id = c.id AND status = 'active') as total_debt,
        g.name as guarantor_name, g.phone as guarantor_phone, g.relation as guarantor_relation
      FROM customers c
      LEFT JOIN guarantors g ON g.customer_id = c.id
      WHERE c.phone LIKE ? OR c.phone2 LIKE ? OR c.name LIKE ? OR c.national_id LIKE ?
      ORDER BY c.id DESC
      LIMIT 10
    `;
    const searchParam = `%${q.trim()}%`;
    const rows = db.prepare(query).all(searchParam, searchParam, searchParam, searchParam);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/customers/:id', (req, res) => {
  try {
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
    if (!customer) return res.status(404).json({ error: 'العميل غير موجود' });

    // Guarantors
    customer.guarantors = db.prepare('SELECT * FROM guarantors WHERE customer_id = ?').all(req.params.id);

    // Sales history
    customer.sales = db.prepare('SELECT * FROM sales WHERE customer_id = ? ORDER BY id DESC').all(req.params.id);

    // Installment plans with payments
    const plans = db.prepare('SELECT * FROM installment_plans WHERE customer_id = ? ORDER BY id DESC').all(req.params.id);
    for (const plan of plans) {
      plan.payments = db.prepare('SELECT * FROM installment_payments WHERE installment_plan_id = ? ORDER BY installment_no ASC').all(plan.id);
    }
    customer.installment_plans = plans;

    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/customers', (req, res) => {
  try {
    const { name, phone, phone2, national_id, address, workplace, notes, guarantor } = req.body;
    if (!name || !phone) return res.status(400).json({ error: 'اسم العميل ورقم الهاتف مطلوبان' });

    const customerTransaction = db.transaction(() => {
      const info = db.prepare(`
        INSERT INTO customers (name, phone, phone2, national_id, address, workplace, notes)
        VALUES (@name, @phone, @phone2, @national_id, @address, @workplace, @notes)
      `).run({
        name, phone, phone2: phone2 || '', national_id: national_id || '',
        address: address || '', workplace: workplace || '', notes: notes || ''
      });

      const customerId = info.lastInsertRowid;

      // Add guarantor if provided
      if (guarantor && guarantor.name) {
        db.prepare(`
          INSERT INTO guarantors (customer_id, name, phone, national_id, address, workplace, relation)
          VALUES (@customer_id, @name, @phone, @national_id, @address, @workplace, @relation)
        `).run({
          customer_id: customerId,
          name: guarantor.name,
          phone: guarantor.phone || '',
          national_id: guarantor.national_id || '',
          address: guarantor.address || '',
          workplace: guarantor.workplace || '',
          relation: guarantor.relation || 'قريب'
        });
      }

      return customerId;
    });

    const newCustomerId = customerTransaction();
    res.json({ success: true, id: newCustomerId, message: 'تم تسجيل العميل بنجاح' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/customers/:id', (req, res) => {
  try {
    const { name, phone, phone2, national_id, address, workplace, notes, guarantor } = req.body;
    db.prepare(`
      UPDATE customers 
      SET name = ?, phone = ?, phone2 = ?, national_id = ?, address = ?, workplace = ?, notes = ?
      WHERE id = ?
    `).run(name, phone, phone2 || '', national_id || '', address || '', workplace || '', notes || '', req.params.id);

    if (guarantor && guarantor.name) {
      db.prepare('DELETE FROM guarantors WHERE customer_id = ?').run(req.params.id);
      db.prepare(`
        INSERT INTO guarantors (customer_id, name, phone, national_id, address, workplace, relation)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(req.params.id, guarantor.name, guarantor.phone || '', guarantor.national_id || '', guarantor.address || '', guarantor.workplace || '', guarantor.relation || 'قريب');
    }

    res.json({ success: true, message: 'تم تحديث بيانات العميل بنجاح' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/customers/:id', (req, res) => {
  try {
    const active = db.prepare("SELECT COUNT(*) as c FROM installment_plans WHERE customer_id = ? AND status = 'active'").get(req.params.id).c;
    if (active > 0) {
      return res.status(400).json({ error: 'لا يمكن حذف العميل لوجود أقساط جارية مسجلة باسمه' });
    }
    db.prepare('DELETE FROM customers WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'تم حذف العميل بنجاح' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 7. SALES & POINT OF SALE (POS)
// ==========================================
router.post('/sales', (req, res) => {
  try {
    const {
      customer_id,
      customer_name,
      customer_phone,
      customer_national_id,
      customer_address,
      sale_type, // 'cash', 'installment', 'card', 'transfer'
      items, // array of { product_id, serial_id, unit_price, notes }
      discount,
      paid_amount,
      notes,
      installment_data // if sale_type === 'installment'
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'يجب اختيار جهاز واحد على الأقل لإتمام البيع' });
    }

    const saleTransaction = db.transaction(() => {
      let finalCustomerId = customer_id;

      // If customer not registered yet, create them automatically
      if (!finalCustomerId && customer_name) {
        const custInfo = db.prepare(`
          INSERT INTO customers (name, phone, national_id, address, id_card_image)
          VALUES (?, ?, ?, ?, ?)
        `).run(customer_name, customer_phone || '', customer_national_id || '', customer_address || '', req.body.id_card_image || req.body.customer_id_card_image || null);
        finalCustomerId = custInfo.lastInsertRowid;
      } else if (finalCustomerId && (req.body.id_card_image || req.body.customer_id_card_image)) {
        db.prepare('UPDATE customers SET id_card_image = ? WHERE id = ?')
          .run(req.body.id_card_image || req.body.customer_id_card_image, finalCustomerId);
      }

      // Calculate totals
      let subtotal = 0;
      for (const item of items) {
        subtotal += Number(item.unit_price) || 0;
      }

      const disc = Number(discount) || 0;
      const total = Math.max(0, subtotal - disc);
      const invoiceNo = generateInvoiceNo('INV');
      const paid = (paid_amount !== undefined && paid_amount !== null && paid_amount !== '')
        ? Number(paid_amount)
        : (sale_type === 'installment' ? 0 : total);
      const remaining = Math.max(0, total - paid);

      let finalPaid = paid;
      let finalRemaining = remaining;
      let financeCompanyId = null;
      let financeCompanyName = null;
      let financeApproval = null;
      let merchantFee = 0;
      let netPayout = 0;

      if (sale_type === 'finance_company') {
        financeCompanyId = req.body.finance_company_id || null;
        financeApproval = req.body.finance_approval_code || '';
        const comp = financeCompanyId ? db.prepare('SELECT * FROM finance_companies WHERE id = ?').get(financeCompanyId) : null;
        financeCompanyName = comp ? comp.name : (req.body.finance_company_name || 'شركة تقسيط');
        const feeRate = req.body.merchant_fee_rate !== undefined ? Number(req.body.merchant_fee_rate) : (comp ? comp.merchant_fee_rate : 0);
        merchantFee = Math.round(((total * feeRate) / 100) * 100) / 100;
        netPayout = total - merchantFee;
        finalPaid = total; // Financed by the company
        finalRemaining = 0;

        // Credit to the partner bank account
        const targetAccId = comp?.bank_account_id || 1;
        db.prepare('UPDATE bank_accounts SET balance = balance + ? WHERE id = ?').run(netPayout, targetAccId);
      }

      // 1. Create Sale Record
      const saleInfo = db.prepare(`
        INSERT INTO sales (
          invoice_no, customer_id, branch_id, warehouse_id, sale_type, subtotal, discount, total,
          paid_amount, remaining_amount, finance_company_id, finance_company_name,
          finance_approval_code, merchant_fee, net_payout, installment_plan_name, installment_duration_months, status, notes
        ) VALUES (
          @invoice_no, @customer_id, @branch_id, @warehouse_id, @sale_type, @subtotal, @discount, @total,
          @paid_amount, @remaining_amount, @finance_company_id, @finance_company_name,
          @finance_approval_code, @merchant_fee, @net_payout, @installment_plan_name, @installment_duration_months, 'completed', @notes
        )
      `).run({
        invoice_no: invoiceNo,
        customer_id: finalCustomerId || null,
        branch_id: Number(req.body.branch_id) || 1,
        warehouse_id: Number(req.body.warehouse_id) || 1,
        sale_type: sale_type || 'cash',
        subtotal,
        discount: disc,
        total,
        paid_amount: finalPaid,
        remaining_amount: finalRemaining,
        finance_company_id: financeCompanyId,
        finance_company_name: financeCompanyName,
        finance_approval_code: financeApproval,
        merchant_fee: merchantFee,
        net_payout: netPayout,
        installment_plan_name: req.body.installment_plan_name || (sale_type === 'installment' ? 'تقسيط مباشر من المعرض' : null),
        installment_duration_months: req.body.installment_duration_months ? Number(req.body.installment_duration_months) : null,
        notes: notes || ''
      });

      const saleId = saleInfo.lastInsertRowid;

      // 2. Insert Sale Items and update Serial Numbers to 'sold'
      for (const item of items) {
        const product = db.prepare('SELECT warranty_months FROM products WHERE id = ?').get(item.product_id);
        const warrantyMonths = product ? product.warranty_months : 12;

        // Calculate warranty end date
        const startDate = getCairoDate();
        const warrantyDate = new Date();
        warrantyDate.setMonth(warrantyDate.getMonth() + warrantyMonths);
        const endDate = formatCairoDate(warrantyDate);

        let serialNumber = null;
        let serialCost = 0;

        if (item.serial_id) {
          const serialRecord = db.prepare('SELECT serial_number, cost_price FROM product_serials WHERE id = ?').get(item.serial_id);
          if (serialRecord) {
            serialNumber = serialRecord.serial_number;
            serialCost = serialRecord.cost_price;

            // Mark serial as sold
            db.prepare(`
              UPDATE product_serials SET
                status = 'sold',
                sale_id = ?,
                sold_price = ?,
                warranty_start_date = ?,
                warranty_end_date = ?
              WHERE id = ?
            `).run(saleId, item.unit_price, startDate, endDate, item.serial_id);
          }
        }

        db.prepare(`
          INSERT INTO sale_items (
            sale_id, product_id, serial_id, serial_number, unit_price,
            cost_price, warranty_months, warranty_end_date, notes
          ) VALUES (
            @sale_id, @product_id, @serial_id, @serial_number, @unit_price,
            @cost_price, @warranty_months, @warranty_end_date, @notes
          )
        `).run({
          sale_id: saleId,
          product_id: item.product_id,
          serial_id: item.serial_id || null,
          serial_number: serialNumber || item.serial_number || '',
          unit_price: Number(item.unit_price),
          cost_price: serialCost,
          warranty_months: warrantyMonths,
          warranty_end_date: endDate,
          notes: item.notes || ''
        });
      }

      // 3. Record Cash Inflow (Cash drawer records only physical cash payments)
      if ((sale_type === 'cash' || !sale_type) && paid > 0) {
        db.prepare(`
          INSERT INTO cash_box (type, category, amount, description, ref_type, ref_id)
          VALUES ('in', 'مبيعات كاش', ?, ?, 'sale', ?)
        `).run(
          paid,
          `فاتورة مبيعات نقدية رقم ${invoiceNo}`,
          saleId
        );
      } else if (sale_type === 'installment' && paid > 0) {
        db.prepare(`
          INSERT INTO cash_box (type, category, amount, description, ref_type, ref_id)
          VALUES ('in', 'مقدم قسط', ?, ?, 'sale', ?)
        `).run(
          paid,
          `دفعة مقدمة نقدية لفاتورة تقسيط مباشر رقم ${invoiceNo}`,
          saleId
        );
      } else if (sale_type === 'finance_company' && Number(req.body.cash_down_payment) > 0) {
        const cDown = Number(req.body.cash_down_payment);
        db.prepare(`
          INSERT INTO cash_box (type, category, amount, description, ref_type, ref_id)
          VALUES ('in', 'مقدم تقسيط ممول', ?, ?, 'sale', ?)
        `).run(cDown, `مقدم نقدي لفاتورة تقسيط ممول رقم ${invoiceNo}`, saleId);
      }

      // 4. Handle Installment Plan if sale_type === 'installment'
      if (sale_type === 'installment' && installment_data) {
        if (!finalCustomerId) {
          throw new Error('البيع بالتقسيط يتطلب تسجيل بيانات العميل أولاً');
        }

        const downPayment = Number(installment_data.down_payment) || paid;
        const totalCash = Number(total);
        const financed = Math.max(0, totalCash - downPayment);
        const profitRate = Number(installment_data.profit_rate) || 0; // e.g. 20%
        const profitAmount = (financed * profitRate) / 100;
        const totalInstallment = financed + profitAmount;
        const count = Number(installment_data.installments_count) || 12;
        const monthlyAmount = Math.round((totalInstallment / count) * 100) / 100;
        const startDate = installment_data.start_date || getCairoDate();

        // Guarantor check
        let guarantorId = installment_data.guarantor_id || null;
        if (!guarantorId && installment_data.guarantor_name) {
          const gInfo = db.prepare(`
            INSERT INTO guarantors (customer_id, name, phone, national_id, address, workplace, relation)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(
            finalCustomerId,
            installment_data.guarantor_name,
            installment_data.guarantor_phone || '',
            installment_data.guarantor_national_id || '',
            installment_data.guarantor_address || '',
            installment_data.guarantor_workplace || '',
            installment_data.guarantor_relation || 'ضامن'
          );
          guarantorId = gInfo.lastInsertRowid;
        }

        const planInfo = db.prepare(`
          INSERT INTO installment_plans (
            sale_id, customer_id, guarantor_id, total_cash_price, down_payment,
            financed_amount, profit_rate, profit_amount, total_installment_amount,
            remaining_balance, installments_count, monthly_amount, start_date, status, notes
          ) VALUES (
            @sale_id, @customer_id, @guarantor_id, @total_cash_price, @down_payment,
            @financed_amount, @profit_rate, @profit_amount, @total_installment_amount,
            @remaining_balance, @installments_count, @monthly_amount, @start_date, 'active', @notes
          )
        `).run({
          sale_id: saleId,
          customer_id: finalCustomerId,
          guarantor_id: guarantorId,
          total_cash_price: totalCash,
          down_payment: downPayment,
          financed_amount: financed,
          profit_rate: profitRate,
          profit_amount: profitAmount,
          total_installment_amount: totalInstallment,
          remaining_balance: totalInstallment,
          installments_count: count,
          monthly_amount: monthlyAmount,
          start_date: startDate,
          notes: installment_data.notes || ''
        });

        const planId = planInfo.lastInsertRowid;

        // Generate Installment Schedule
        const insertPayment = db.prepare(`
          INSERT INTO installment_payments (
            installment_plan_id, installment_no, due_date, amount_due, amount_paid, status
          ) VALUES (?, ?, ?, ?, 0, 'pending')
        `);

        const start = new Date(startDate);
        for (let i = 1; i <= count; i++) {
          const dueDate = new Date(start.getFullYear(), start.getMonth() + i, start.getDate());
          const dueDateStr = formatCairoDate(dueDate);
          insertPayment.run(planId, i, dueDateStr, monthlyAmount);
        }
      }

      return { 
        saleId, 
        invoiceNo,
        total,
        paidAmount: finalPaid,
        remainingAmount: finalRemaining
      };
    });

    const result = saleTransaction();
    logActivity(
      req, 
      'SALE_CREATED', 
      'sale', 
      result.saleId, 
      `إصدار فاتورة بيع جديدة برقم ${result.invoiceNo} - النوع: ${sale_type || 'cash'} - الإجمالي: ${result.total} ج.م`, 
      {
        invoice_no: result.invoiceNo,
        sale_type: sale_type || 'cash',
        total: result.total,
        paid_amount: result.paidAmount,
        remaining_amount: result.remainingAmount
      }
    );
    res.json({ success: true, ...result, message: 'تم إتمام عملية البيع وحفظ الفاتورة بنجاح' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// List sales with filtering
router.get('/sales', (req, res) => {
  try {
    const { sale_type, search, date_from, date_to } = req.query;
    let query = `
      SELECT 
        s.*,
        c.name as customer_name,
        c.phone as customer_phone,
        (SELECT COUNT(*) FROM sale_items WHERE sale_id = s.id) as items_count
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (sale_type) {
      query += ` AND s.sale_type = ?`;
      params.push(sale_type);
    }
    if (search) {
      query += ` AND (s.invoice_no LIKE ? OR c.name LIKE ? OR c.phone LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (date_from) {
      query += ` AND DATE(s.created_at) >= DATE(?)`;
      params.push(date_from);
    }
    if (date_to) {
      query += ` AND DATE(s.created_at) <= DATE(?)`;
      params.push(date_to);
    }

    query += ` ORDER BY s.id DESC LIMIT 100`;
    const sales = db.prepare(query).all(...params);
    res.json(sales);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Single sale details with full invoice info for printing
router.get('/sales/:id', (req, res) => {
  try {
    const sale = db.prepare(`
      SELECT 
        s.*,
        c.name as customer_name,
        c.phone as customer_phone,
        c.phone2 as customer_phone2,
        c.national_id as customer_national_id,
        c.address as customer_address,
        c.workplace as customer_workplace,
        c.id_card_image as customer_id_card_image,
        br.name as branch_name,
        br.address as branch_address,
        br.phone as branch_phone,
        wh.name as warehouse_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN branches br ON s.branch_id = br.id
      LEFT JOIN warehouses wh ON s.warehouse_id = wh.id
      WHERE s.id = ?
    `).get(req.params.id);

    if (!sale) return res.status(404).json({ error: 'الفاتورة غير موجودة' });

    // Sale items with product details and serials
    sale.items = db.prepare(`
      SELECT 
        si.*,
        COALESCE(p.name, si.notes, 'جهاز غير معرف') as product_name,
        COALESCE(p.model_number, '') as model_number,
        COALESCE(p.specifications, '') as specifications,
        COALESCE(p.warranty_agency, '') as warranty_agency,
        b.name as brand_name,
        cat.name as category_name
      FROM sale_items si
      LEFT JOIN products p ON si.product_id = p.id
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN categories cat ON p.category_id = cat.id
      WHERE si.sale_id = ?
    `).all(req.params.id);

    // If installment, get plan details
    if (sale.sale_type === 'installment') {
      const plan = db.prepare(`
        SELECT 
          p.*,
          g.name as guarantor_name,
          g.phone as guarantor_phone,
          g.national_id as guarantor_national_id,
          g.address as guarantor_address,
          g.relation as guarantor_relation
        FROM installment_plans p
        LEFT JOIN guarantors g ON p.guarantor_id = g.id
        WHERE p.sale_id = ?
      `).get(req.params.id);

      if (plan) {
        plan.payments = db.prepare('SELECT * FROM installment_payments WHERE installment_plan_id = ? ORDER BY installment_no ASC').all(plan.id);
        sale.installment_plan = plan;
      }
    }

    res.json(sale);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 8. INSTALLMENTS MANAGEMENT
// ==========================================
// All installment plans
router.get('/installments', (req, res) => {
  try {
    const { status, search } = req.query;
    let query = `
      SELECT 
        ip.*,
        c.name as customer_name,
        c.phone as customer_phone,
        c.national_id as customer_national_id,
        g.name as guarantor_name,
        g.phone as guarantor_phone,
        s.invoice_no,
        (SELECT COUNT(*) FROM installment_payments WHERE installment_plan_id = ip.id AND status = 'paid') as paid_count,
        (SELECT COUNT(*) FROM installment_payments WHERE installment_plan_id = ip.id AND status != 'paid' AND due_date < DATE('now')) as late_count,
        (SELECT due_date FROM installment_payments WHERE installment_plan_id = ip.id AND status != 'paid' ORDER BY due_date ASC LIMIT 1) as next_due_date
      FROM installment_plans ip
      JOIN customers c ON ip.customer_id = c.id
      LEFT JOIN guarantors g ON ip.guarantor_id = g.id
      JOIN sales s ON ip.sale_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ` AND ip.status = ?`;
      params.push(status);
    }
    if (search) {
      query += ` AND (c.name LIKE ? OR c.phone LIKE ? OR s.invoice_no LIKE ? OR g.name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY ip.id DESC`;
    const plans = db.prepare(query).all(...params);
    res.json(plans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Single installment plan with full schedule & contract data
router.get('/installments/:id', (req, res) => {
  try {
    const plan = db.prepare(`
      SELECT 
        ip.*,
        c.name as customer_name,
        c.phone as customer_phone,
        c.phone2 as customer_phone2,
        c.national_id as customer_national_id,
        c.address as customer_address,
        c.workplace as customer_workplace,
        g.name as guarantor_name,
        g.phone as guarantor_phone,
        g.national_id as guarantor_national_id,
        g.address as guarantor_address,
        g.workplace as guarantor_workplace,
        g.relation as guarantor_relation,
        s.invoice_no,
        s.created_at as sale_date
      FROM installment_plans ip
      JOIN customers c ON ip.customer_id = c.id
      LEFT JOIN guarantors g ON ip.guarantor_id = g.id
      JOIN sales s ON ip.sale_id = s.id
      WHERE ip.id = ?
    `).get(req.params.id);

    if (!plan) return res.status(404).json({ error: 'عقد التقسيط غير موجود' });

    // Get sale items (purchased appliances)
    plan.items = db.prepare(`
      SELECT si.*, p.name as product_name, p.model_number, p.warranty_agency
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      WHERE si.sale_id = ?
    `).all(plan.sale_id);

    // Get payments schedule
    plan.payments = db.prepare(`
      SELECT * FROM installment_payments 
      WHERE installment_plan_id = ? 
      ORDER BY installment_no ASC
    `).all(req.params.id);

    res.json(plan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Pay an installment
router.post('/installments/pay/:paymentId', (req, res) => {
  try {
    const { paymentId } = req.params;
    const { amount_paid, payment_method, notes } = req.body;

    const payment = db.prepare('SELECT * FROM installment_payments WHERE id = ?').get(paymentId);
    if (!payment) return res.status(404).json({ error: 'القسط غير موجود' });

    const plan = db.prepare(`
      SELECT ip.*, c.name as customer_name 
      FROM installment_plans ip 
      JOIN customers c ON ip.customer_id = c.id 
      WHERE ip.id = ?
    `).get(payment.installment_plan_id);

    const paid = Number(amount_paid) || payment.amount_due;
    const isFullyPaid = paid >= payment.amount_due;
    const receiptNo = generateInvoiceNo('REC');
    const today = getCairoDate();

    const payTransaction = db.transaction(() => {
      // 1. Update Payment Record
      db.prepare(`
        UPDATE installment_payments SET
          amount_paid = ?,
          status = ?,
          paid_date = ?,
          payment_method = ?,
          receipt_no = ?,
          notes = ?
        WHERE id = ?
      `).run(
        paid,
        isFullyPaid ? 'paid' : 'partial',
        today,
        payment_method || 'cash',
        receiptNo,
        notes || '',
        paymentId
      );

      // 2. Update Installment Plan Balance
      const newBalance = Math.max(0, plan.remaining_balance - paid);
      const isPlanFinished = newBalance <= 0;

      db.prepare(`
        UPDATE installment_plans SET
          remaining_balance = ?,
          status = ?
        WHERE id = ?
      `).run(
        newBalance,
        isPlanFinished ? 'completed' : 'active',
        plan.id
      );

      // 3. Record in Cash Box (only for cash payments)
      if (!payment_method || payment_method === 'cash') {
        db.prepare(`
          INSERT INTO cash_box (type, category, amount, description, ref_type, ref_id)
          VALUES ('in', 'سداد قسط', ?, ?, 'installment', ?)
        `).run(
          paid,
          `تحصيل قسط نقدي رقم ${payment.installment_no} للعميل ${plan.customer_name} (إيصال ${receiptNo})`,
          paymentId
        );
      }

      return { receiptNo, newBalance, isPlanFinished };
    });

    const result = payTransaction();
    logActivity(
      req, 
      'INSTALLMENT_PAID', 
      'installment', 
      paymentId, 
      `سداد قسط بقيمة ${paid} ج.م للعميل ${plan.customer_name} (إيصال ${result.receiptNo})`, 
      {
        receiptNo: result.receiptNo,
        amount: paid,
        newBalance: result.newBalance,
        customer: plan.customer_name
      }
    );
    res.json({
      success: true,
      message: 'تم تسجيل سداد القسط بنجاح',
      ...result
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Overdue or due installments list
router.get('/installments-due', (req, res) => {
  try {
    const { overdue_only } = req.query;
    let query = `
      SELECT 
        ip.id as payment_id,
        ip.installment_no,
        ip.due_date,
        ip.amount_due,
        ip.amount_paid,
        ip.status,
        plan.id as plan_id,
        plan.monthly_amount,
        plan.remaining_balance,
        c.name as customer_name,
        c.phone as customer_phone,
        c.phone2 as customer_phone2,
        c.address as customer_address,
        g.name as guarantor_name,
        g.phone as guarantor_phone
      FROM installment_payments ip
      JOIN installment_plans plan ON ip.installment_plan_id = plan.id
      JOIN customers c ON plan.customer_id = c.id
      LEFT JOIN guarantors g ON plan.guarantor_id = g.id
      WHERE ip.status != 'paid'
    `;

    if (overdue_only === 'true') {
      query += ` AND ip.due_date < DATE('now')`;
    } else {
      query += ` AND ip.due_date <= DATE('now', '+30 days')`;
    }

    query += ` ORDER BY ip.due_date ASC`;
    const rows = db.prepare(query).all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 9. EXPENSES & CASHBOX
// ==========================================
router.get('/expenses', (req, res) => {
  try {
    const { month } = req.query;
    let query = 'SELECT * FROM expenses WHERE 1=1';
    const params = [];
    if (month) {
      query += " AND strftime('%Y-%m', expense_date) = ?";
      params.push(month);
    }
    query += ' ORDER BY expense_date DESC, id DESC';
    const rows = db.prepare(query).all(...params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/expenses', (req, res) => {
  try {
    const { category, title, amount, notes, expense_date } = req.body;
    if (!title || !amount) return res.status(400).json({ error: 'العنوان وقيمة المصروف مطلوبان' });

    const expenseTransaction = db.transaction(() => {
      const info = db.prepare(`
        INSERT INTO expenses (category, title, amount, notes, expense_date)
        VALUES (@category, @title, @amount, @notes, @expense_date)
      `).run({
        category: category || 'أخرى',
        title,
        amount: Number(amount),
        notes: notes || '',
        expense_date: expense_date || getCairoDate()
      });

      const expId = info.lastInsertRowid;

      // Deduct from cashbox
      db.prepare(`
        INSERT INTO cash_box (type, category, amount, description, ref_type, ref_id)
        VALUES ('out', 'مصروفات', ?, ?, 'expense', ?)
      `).run(Number(amount), `مصروف: ${title} (${category})`, expId);

      return expId;
    });

    const id = expenseTransaction();
    logActivity(
      req, 
      'EXPENSE_RECORDED', 
      'expense', 
      id, 
      `تسجيل مصروف بقيمة ${amount} ج.م: ${title} (${category || 'أخرى'})`, 
      { title, category, amount: Number(amount), expense_date }
    );
    res.json({ success: true, id, message: 'تم تسجيل المصروف وصرفه من الخزينة' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/cashbox', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM cash_box ORDER BY id DESC LIMIT 100').all();
    const inTotal = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM cash_box WHERE type = 'in'").get().total;
    const outTotal = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM cash_box WHERE type = 'out'").get().total;
    res.json({
      balance: inTotal - outTotal,
      totalIn: inTotal,
      totalOut: outTotal,
      transactions: rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/cashbox/transaction', (req, res) => {
  try {
    const { type, category, amount, description } = req.body;
    if (!type || !amount) return res.status(400).json({ error: 'النوع والمبلغ مطلوبان' });

    const info = db.prepare(`
      INSERT INTO cash_box (type, category, amount, description, ref_type)
      VALUES (?, ?, ?, ?, 'manual')
    `).run(type, category || 'حركة يدوية', Number(amount), description || '');

    logActivity(
      req, 
      type === 'in' ? 'CASH_IN' : 'CASH_OUT', 
      'cash_box', 
      info.lastInsertRowid, 
      `${type === 'in' ? 'إيداع نقدي بالخزينة' : 'سحب نقدي من الخزينة'} بقيمة ${amount} ج.م: ${description || category || ''}`, 
      { type, amount: Number(amount), category, description }
    );

    res.json({ success: true, message: 'تمت إضافة الحركة إلى الخزينة بنجاح' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 10. SUPPLIERS & PURCHASES
// ==========================================
router.get('/suppliers', (req, res) => {
  try {
    const suppliers = db.prepare('SELECT * FROM suppliers ORDER BY id DESC').all();
    res.json(suppliers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/suppliers', (req, res) => {
  try {
    const { name, company, phone, phone2, address, balance, notes } = req.body;
    const info = db.prepare(`
      INSERT INTO suppliers (name, company, phone, phone2, address, balance, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(name, company || '', phone, phone2 || '', address || '', Number(balance) || 0, notes || '');
    logActivity(req, 'SUPPLIER_CREATED', 'supplier', info.lastInsertRowid, `إضافة مورد جديد: ${name} (${company || 'بدون شركة'})`, req.body);
    res.json({ success: true, id: info.lastInsertRowid, message: 'تمت إضافة المورد بنجاح' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/suppliers/:id', (req, res) => {
  try {
    const { name, company, phone, phone2, address, balance, notes } = req.body;
    const existing = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'المورد غير موجود' });

    db.prepare(`
      UPDATE suppliers SET
        name = ?,
        company = ?,
        phone = ?,
        phone2 = ?,
        address = ?,
        balance = ?,
        notes = ?
      WHERE id = ?
    `).run(
      name !== undefined ? name : existing.name,
      company !== undefined ? company : existing.company,
      phone !== undefined ? phone : existing.phone,
      phone2 !== undefined ? phone2 : existing.phone2,
      address !== undefined ? address : existing.address,
      balance !== undefined ? Number(balance) : existing.balance,
      notes !== undefined ? notes : existing.notes,
      req.params.id
    );

    logActivity(req, 'SUPPLIER_UPDATED', 'supplier', req.params.id, `تحديث بيانات المورد: ${name || existing.name}`, req.body);
    res.json({ success: true, message: 'تم تحديث بيانات المورد بنجاح' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/suppliers/:id', (req, res) => {
  try {
    const s = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(req.params.id);
    if (!s) return res.status(404).json({ error: 'المورد غير موجود' });

    const purchasesCount = db.prepare('SELECT COUNT(*) as count FROM purchase_invoices WHERE supplier_id = ?').get(req.params.id)?.count || 0;
    if (purchasesCount > 0) {
      return res.status(400).json({ error: `لا يمكن حذف المورد (${s.name}) لوجود (${purchasesCount}) فاتورة توريد ومشتريات مسجلة باسمه بالنظام` });
    }

    db.prepare('DELETE FROM suppliers WHERE id = ?').run(req.params.id);
    logActivity(req, 'SUPPLIER_DELETED', 'supplier', req.params.id, `حذف المورد: ${s.name}`, s);
    res.json({ success: true, message: 'تم حذف المورد بنجاح' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk Import Suppliers from Excel / JSON
router.post('/suppliers/bulk', (req, res) => {
  try {
    const rawList = Array.isArray(req.body) ? req.body : (req.body.suppliers || []);
    if (!rawList || rawList.length === 0) {
      return res.status(400).json({ error: 'لم يتم إرسال أي موردين للاستيراد' });
    }

    let inserted = 0;
    let updated = 0;
    let errors = [];

    const bulkTx = db.transaction(() => {
      for (let i = 0; i < rawList.length; i++) {
        const item = rawList[i];
        const name = (item.name || item['اسم المورد / المسؤول *'] || item['اسم المورد'] || item['اسم المسؤول'] || item['اسم الشركة'] || '').trim();
        if (!name) {
          errors.push(`الصف رقم ${i + 1}: اسم المورد مطلوب`);
          continue;
        }

        const company = (item.company || item['اسم الشركة الموزعة'] || item['الشركة'] || item['اسم الشركة'] || '').trim();
        const phone = (item.phone || item['رقم الهاتف *'] || item['رقم الهاتف'] || item['الهاتف'] || item['الموبايل'] || '').trim();
        const phone2 = (item.phone2 || item['رقم هاتف إضافي'] || item['هاتف آخر'] || item['الهاتف الثاني'] || '').trim();
        const address = (item.address || item['العنوان / المقر'] || item['العنوان'] || '').trim();
        const balance = Number(item.balance ?? item['الرصيد المالي الحالي'] ?? item['الرصيد الحالي'] ?? item['الرصيد'] ?? item['الرصيد المالي']) || 0;
        const notes = (item.notes || item['ملاحظات'] || item['الملاحظات'] || '').trim();

        // Check if supplier exists by phone or name
        let existing = null;
        if (phone) {
          existing = db.prepare('SELECT id FROM suppliers WHERE phone = ?').get(phone);
        }
        if (!existing && name) {
          existing = db.prepare('SELECT id FROM suppliers WHERE name = ?').get(name);
        }

        if (existing) {
          db.prepare(`
            UPDATE suppliers SET
              company = CASE WHEN ? != '' THEN ? ELSE company END,
              phone = CASE WHEN ? != '' THEN ? ELSE phone END,
              phone2 = CASE WHEN ? != '' THEN ? ELSE phone2 END,
              address = CASE WHEN ? != '' THEN ? ELSE address END,
              balance = ?,
              notes = CASE WHEN ? != '' THEN ? ELSE notes END
            WHERE id = ?
          `).run(
            company, company,
            phone, phone,
            phone2, phone2,
            address, address,
            balance,
            notes, notes,
            existing.id
          );
          updated++;
        } else {
          db.prepare(`
            INSERT INTO suppliers (name, company, phone, phone2, address, balance, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(name, company, phone, phone2, address, balance, notes);
          inserted++;
        }
      }
    });

    bulkTx();

    logActivity(
      req,
      'SUPPLIERS_BULK_IMPORT',
      'supplier',
      null,
      `استيراد جماعي لـ ${rawList.length} مورد من ملف Excel (إضافة: ${inserted}، تحديث: ${updated})`,
      { count: rawList.length, inserted, updated, errors }
    );

    res.json({
      success: true,
      count: rawList.length,
      inserted,
      updated,
      errors: errors.length > 0 ? errors : undefined,
      message: `تم استيراد ${inserted + updated} مورد بنجاح (إضافة جديدة: ${inserted}، تحديث: ${updated})`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 11. REPORTS
// ==========================================
router.get('/reports', (req, res) => {
  try {
    const { period } = req.query; // 'today', 'month', 'year', 'all'
    let dateFilter = '';
    const today = getCairoDate();
    const startOfMonth = today.slice(0, 7) + '-01';
    const startOfYear = today.slice(0, 4) + '-01-01';

    if (period === 'today') {
      dateFilter = `WHERE DATE(created_at) = DATE('${today}')`;
    } else if (period === 'month') {
      dateFilter = `WHERE DATE(created_at) >= DATE('${startOfMonth}')`;
    } else if (period === 'year') {
      dateFilter = `WHERE DATE(created_at) >= DATE('${startOfYear}')`;
    }

    // Sales summary
    const salesSummary = db.prepare(`
      SELECT 
        COUNT(*) as totalOrders,
        COALESCE(SUM(total), 0) as totalRevenue,
        COALESCE(SUM(paid_amount), 0) as totalCollected,
        COALESCE(SUM(remaining_amount), 0) as totalUncollected
      FROM sales ${dateFilter}
    `).get();

    // Profits calculation (sales items unit price minus cost price)
    const profitCalc = db.prepare(`
      SELECT 
        COALESCE(SUM(si.unit_price - si.cost_price), 0) as grossProfit
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      ${dateFilter.replace(/created_at/g, 's.created_at')}
    `).get();

    // Expenses in period
    let expFilter = '';
    if (period === 'today') {
      expFilter = `WHERE DATE(expense_date) = DATE('${today}')`;
    } else if (period === 'month') {
      expFilter = `WHERE DATE(expense_date) >= DATE('${startOfMonth}')`;
    } else if (period === 'year') {
      expFilter = `WHERE DATE(expense_date) >= DATE('${startOfYear}')`;
    }

    const expensesTotal = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM expenses ${expFilter}
    `).get().total;

    // Top selling products
    const topProducts = db.prepare(`
      SELECT p.id, p.name, p.model_number, b.name as brand_name, COUNT(si.id) as sold_qty, SUM(si.unit_price) as revenue
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      LEFT JOIN brands b ON p.brand_id = b.id
      GROUP BY p.id
      ORDER BY sold_qty DESC
      LIMIT 5
    `).all();

    res.json({
      salesSummary,
      grossProfit: profitCalc.grossProfit,
      expensesTotal,
      netProfit: profitCalc.grossProfit - expensesTotal,
      topProducts
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 12. ADVANCED PROFESSIONAL REPORTS
// ==========================================
router.get('/reports/advanced', (req, res) => {
  try {
    const { reportType = 'sales', startDate, endDate } = req.query;

    const start = startDate || formatCairoDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const end = endDate || getCairoDate();

    if (reportType === 'sales') {
      // Detailed sales rows with items & profit
      const sales = db.prepare(`
        SELECT 
          s.id, s.invoice_no, s.sale_type, s.total, s.paid_amount, s.remaining_amount, s.created_at,
          c.name as customer_name, c.phone as customer_phone,
          (
            SELECT COALESCE(SUM(si.unit_price - si.cost_price), 0)
            FROM sale_items si WHERE si.sale_id = s.id
          ) as order_profit,
          (
            SELECT COUNT(*) FROM sale_items si WHERE si.sale_id = s.id
          ) as items_count
        FROM sales s
        LEFT JOIN customers c ON s.customer_id = c.id
        WHERE DATE(s.created_at) >= DATE(?) AND DATE(s.created_at) <= DATE(?)
        ORDER BY s.created_at DESC
      `).all(start, end);

      const summary = db.prepare(`
        SELECT 
          COUNT(s.id) as totalInvoices,
          COALESCE(SUM(s.total), 0) as totalRevenue,
          COALESCE(SUM(s.paid_amount), 0) as totalCollected,
          COALESCE(SUM(s.remaining_amount), 0) as totalReceivables,
          (
            SELECT COALESCE(SUM(si.unit_price - si.cost_price), 0)
            FROM sale_items si
            JOIN sales s2 ON si.sale_id = s2.id
            WHERE DATE(s2.created_at) >= DATE(?) AND DATE(s2.created_at) <= DATE(?)
          ) as totalGrossProfit
        FROM sales s
        WHERE DATE(s.created_at) >= DATE(?) AND DATE(s.created_at) <= DATE(?)
      `).get(start, end, start, end);

      return res.json({
        reportType: 'sales',
        startDate: start,
        endDate: end,
        summary,
        rows: sales
      });
    }

    if (reportType === 'installments') {
      // Collections in period
      const collectedPayments = db.prepare(`
        SELECT 
          ip.id, ip.installment_no, ip.due_date, ip.paid_date, ip.amount_paid, ip.payment_method, ip.receipt_no,
          c.name as customer_name, c.phone as customer_phone,
          plan.invoice_no, plan.id as plan_id
        FROM installment_payments ip
        JOIN installment_plans plan ON ip.installment_plan_id = plan.id
        JOIN customers c ON plan.customer_id = c.id
        WHERE ip.status = 'paid' AND DATE(ip.paid_date) >= DATE(?) AND DATE(ip.paid_date) <= DATE(?)
        ORDER BY ip.paid_date DESC
      `).all(start, end);

      // Overdue payments right now
      const overduePayments = db.prepare(`
        SELECT 
          ip.id, ip.installment_no, ip.due_date, (ip.amount_due - ip.amount_paid) as amount_late,
          c.name as customer_name, c.phone as customer_phone,
          g.name as guarantor_name, g.phone as guarantor_phone,
          plan.invoice_no
        FROM installment_payments ip
        JOIN installment_plans plan ON ip.installment_plan_id = plan.id
        JOIN customers c ON plan.customer_id = c.id
        LEFT JOIN guarantors g ON plan.guarantor_id = g.id
        WHERE ip.status != 'paid' AND ip.due_date < DATE('now')
        ORDER BY ip.due_date ASC
      `).all();

      const totals = db.prepare(`
        SELECT 
          COALESCE(SUM(amount_paid), 0) as totalCollectedInPeriod,
          COUNT(*) as paymentsCount
        FROM installment_payments
        WHERE status = 'paid' AND DATE(paid_date) >= DATE(?) AND DATE(paid_date) <= DATE(?)
      `).get(start, end);

      const totalOverdue = db.prepare(`
        SELECT COALESCE(SUM(amount_due - amount_paid), 0) as totalLateBalance, COUNT(*) as lateCount
        FROM installment_payments
        WHERE status != 'paid' AND due_date < DATE('now')
      `).get();

      return res.json({
        reportType: 'installments',
        startDate: start,
        endDate: end,
        totals,
        totalOverdue,
        collectedPayments,
        overduePayments
      });
    }

    if (reportType === 'inventory') {
      // Stock valuation by category
      const categoriesSummary = db.prepare(`
        SELECT 
          cat.id, cat.name as category_name,
          COUNT(s.id) as in_stock_count,
          COALESCE(SUM(s.cost_price), 0) as total_cost_value,
          COALESCE(SUM(p.cash_price), 0) as total_retail_value
        FROM categories cat
        JOIN products p ON p.category_id = cat.id
        JOIN product_serials s ON s.product_id = p.id AND s.status = 'in_stock'
        GROUP BY cat.id
      `).all();

      // Brand summary
      const brandsSummary = db.prepare(`
        SELECT 
          b.id, b.name as brand_name,
          COUNT(s.id) as in_stock_count,
          COALESCE(SUM(s.cost_price), 0) as total_cost_value
        FROM brands b
        JOIN products p ON p.brand_id = b.id
        JOIN product_serials s ON s.product_id = p.id AND s.status = 'in_stock'
        GROUP BY b.id
      `).all();

      // Granular products inventory with serial counts
      const productsInventory = db.prepare(`
        SELECT 
          p.id, p.name, p.model_number, p.cost_price, p.cash_price, p.installment_price,
          b.name as brand_name, cat.name as category_name,
          (SELECT COUNT(*) FROM product_serials WHERE product_id = p.id AND status = 'in_stock') as in_stock,
          (SELECT COUNT(*) FROM product_serials WHERE product_id = p.id AND status = 'sold') as sold,
          (SELECT COUNT(*) FROM product_serials WHERE product_id = p.id AND status = 'maintenance') as maintenance
        FROM products p
        LEFT JOIN brands b ON p.brand_id = b.id
        LEFT JOIN categories cat ON p.category_id = cat.id
        ORDER BY in_stock DESC
      `).all();

      const overallTotals = db.prepare(`
        SELECT 
          COUNT(s.id) as totalDevicesInStock,
          COALESCE(SUM(s.cost_price), 0) as totalCostValuation,
          COALESCE(SUM(p.cash_price), 0) as totalRetailValuation
        FROM product_serials s
        JOIN products p ON s.product_id = p.id
        WHERE s.status = 'in_stock'
      `).get();

      return res.json({
        reportType: 'inventory',
        overallTotals,
        categoriesSummary,
        brandsSummary,
        productsInventory
      });
    }

    if (reportType === 'cashflow') {
      // Cash ledger in range
      const ledger = db.prepare(`
        SELECT * FROM cash_box
        WHERE DATE(created_at) >= DATE(?) AND DATE(created_at) <= DATE(?)
        ORDER BY created_at DESC
      `).all(start, end);

      const inTotal = db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as total FROM cash_box
        WHERE type = 'in' AND DATE(created_at) >= DATE(?) AND DATE(created_at) <= DATE(?)
      `).get(start, end).total;

      const outTotal = db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as total FROM cash_box
        WHERE type = 'out' AND DATE(created_at) >= DATE(?) AND DATE(created_at) <= DATE(?)
      `).get(start, end).total;

      const currentBalance = db.prepare(`
        SELECT 
          (SELECT COALESCE(SUM(amount), 0) FROM cash_box WHERE type = 'in') -
          (SELECT COALESCE(SUM(amount), 0) FROM cash_box WHERE type = 'out') as balance
      `).get().balance;

      return res.json({
        reportType: 'cashflow',
        startDate: start,
        endDate: end,
        periodIn: inTotal,
        periodOut: outTotal,
        netFlow: inTotal - outTotal,
        currentBalance,
        ledger
      });
    }

    res.status(400).json({ error: 'نوع التقرير غير معروف' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 13. PURCHASES & INTAKE SHIPMENTS
// ==========================================
router.post('/purchases', (req, res) => {
  try {
    const { supplier_id, warehouse_id, invoice_no, total, total_amount, paid_amount, items, notes } = req.body;

    const purchaseTransaction = db.transaction(() => {
      const invNo = invoice_no || generateInvoiceNo('PUR');
      const finalTotal = Number(total ?? total_amount) || 0;
      const paid = Number(paid_amount) || 0;
      const remaining = finalTotal - paid;
      const targetWarehouseId = Number(warehouse_id) || 1;
      const cairoNow = getCairoDateTime().replace('T', ' ');

      const info = db.prepare(`
        INSERT INTO purchases (invoice_no, supplier_id, warehouse_id, total_amount, paid_amount, remaining_amount, notes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(invNo, supplier_id || null, targetWarehouseId, finalTotal, paid, remaining, notes || '', cairoNow);

      const purchaseId = info.lastInsertRowid;

      // Add serials for each product based on quantity and serials
      if (items && Array.isArray(items)) {
        const insertSerial = db.prepare(`
          INSERT OR IGNORE INTO product_serials (product_id, warehouse_id, serial_number, status, cost_price, purchase_id, created_at)
          VALUES (?, ?, ?, 'in_stock', ?, ?, ?)
        `);

        for (const item of items) {
          const productId = Number(item.product_id);
          const cost = Number(item.cost_price) || 0;

          // If item is sent as a flat single serial: { product_id, serial_number, cost_price }
          if (item.serial_number && typeof item.serial_number === 'string') {
            insertSerial.run(productId, targetWarehouseId, item.serial_number.trim(), cost, purchaseId, cairoNow);
            continue;
          }

          // If item has quantity and/or serials array
          const givenSerials = Array.isArray(item.serials) ? item.serials.map(s => String(s).trim()).filter(Boolean) : [];
          const quantity = Math.max(1, Number(item.quantity) || givenSerials.length || 1);

          for (let i = 0; i < quantity; i++) {
            let sn = givenSerials[i];
            if (!sn) {
              const datePart = getCairoDate().replace(/-/g, '');
              const rnd = Math.floor(1000 + Math.random() * 9000);
              sn = `SN-${datePart}-${productId}-${rnd}-${i + 1}`;
            }
            insertSerial.run(productId, targetWarehouseId, sn, cost, purchaseId, cairoNow);
          }
        }
      }

      // Record in cashbox if paid > 0
      if (paid > 0) {
        db.prepare(`
          INSERT INTO cash_box (type, category, amount, description, ref_type, ref_id)
          VALUES ('out', 'مشتريات وبضاعة', ?, ?, 'purchase', ?)
        `).run(paid, `سداد فاتورة توريد أجهزة رقم ${invNo}`, purchaseId);
      }

      // Update supplier balance if supplier provided
      if (supplier_id && remaining !== 0) {
        db.prepare(`
          UPDATE suppliers SET balance = balance + ? WHERE id = ?
        `).run(remaining, supplier_id);
      }

      logActivity(req, 'PURCHASE_CREATED', 'purchase', purchaseId, `تسجيل فاتورة توريد أجهزة برقم ${invNo} بقيمة ${finalTotal} ج.م ومسدد ${paid} ج.م`);

      return { purchaseId, invoiceNo: invNo };
    });

    const result = purchaseTransaction();
    res.json({ success: true, ...result, message: 'تم تسجيل فاتورة الشراء واستلام الأجهزة وتوريد الكميات للمخزن بنجاح' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 14. BANK ACCOUNTS & TRANSFERS
// ==========================================
router.get('/accounts', (req, res) => {
  try {
    const accounts = db.prepare('SELECT * FROM bank_accounts ORDER BY id ASC').all();
    const inTotal = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM cash_box WHERE type = 'in'").get().total;
    const outTotal = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM cash_box WHERE type = 'out'").get().total;
    const cashboxBalance = inTotal - outTotal;

    const totalBankBalance = accounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0);
    const totalLiquidAssets = cashboxBalance + totalBankBalance;

    res.json({
      cashboxBalance,
      accounts,
      totalBankBalance,
      totalLiquidAssets
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/accounts', (req, res) => {
  try {
    const { name, bank_name, account_number, type, balance, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'اسم الحساب مطلوب' });

    const info = db.prepare(`
      INSERT INTO bank_accounts (name, bank_name, account_number, type, balance, notes, is_active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `).run(name, bank_name || '', account_number || '', type || 'bank', Number(balance) || 0, notes || '');

    logActivity(req, 'BANK_ACCOUNT_CREATED', 'bank_account', info.lastInsertRowid, `إضافة حساب بنكي / محفظة: ${name} (${bank_name || ''}) - رصيد: ${balance || 0} ج.م`, req.body);

    res.json({ success: true, id: info.lastInsertRowid, message: 'تم فتح الحساب بنجاح' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/accounts/:id', (req, res) => {
  try {
    const { name, bank_name, account_number, type, notes, is_active } = req.body;
    const existing = db.prepare('SELECT * FROM bank_accounts WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'الحساب غير موجود' });

    db.prepare(`
      UPDATE bank_accounts SET
        name = ?,
        bank_name = ?,
        account_number = ?,
        type = ?,
        notes = ?,
        is_active = ?
      WHERE id = ?
    `).run(
      name !== undefined ? name : existing.name,
      bank_name !== undefined ? bank_name : existing.bank_name,
      account_number !== undefined ? account_number : existing.account_number,
      type !== undefined ? type : existing.type,
      notes !== undefined ? notes : existing.notes,
      is_active !== undefined ? Number(is_active) : (existing.is_active ?? 1),
      req.params.id
    );

    logActivity(req, 'BANK_ACCOUNT_UPDATED', 'bank_account', req.params.id, `تحديث بيانات الحساب البنكي: ${name || existing.name}`, req.body);
    res.json({ success: true, message: 'تم تحديث بيانات الحساب بنجاح' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/accounts/:id', (req, res) => {
  try {
    const acc = db.prepare('SELECT * FROM bank_accounts WHERE id = ?').get(req.params.id);
    if (!acc) return res.status(404).json({ error: 'الحساب غير موجود' });

    if (Number(acc.balance) > 0) {
      return res.status(400).json({ 
        error: `لا يمكن حذف الحساب لأنه يحتوي على رصيد متبقي (${Number(acc.balance).toLocaleString()} ج.م). يجب تحويل الرصيد إلى الخزينة أو حساب آخر أولاً.` 
      });
    }

    const transferCount = db.prepare('SELECT COUNT(*) as count FROM fund_transfers WHERE from_account_id = ? OR to_account_id = ?').get(req.params.id, req.params.id).count;
    if (transferCount > 0) {
      // Soft-delete to keep historical transfer ledger integrity
      db.prepare('UPDATE bank_accounts SET is_active = 0 WHERE id = ?').run(req.params.id);
      logActivity(req, 'BANK_ACCOUNT_DEACTIVATED', 'bank_account', req.params.id, `تعطيل وأرشفة الحساب البنكي لوجود تحويلات سابقة: ${acc.name}`, acc);
      return res.json({ success: true, message: 'تمت أرشفة وتعطيل الحساب بنجاح حفاظاً على سلامة سجل التحويلات السابقة' });
    }

    db.prepare('DELETE FROM bank_accounts WHERE id = ?').run(req.params.id);
    logActivity(req, 'BANK_ACCOUNT_DELETED', 'bank_account', req.params.id, `حذف الحساب البنكي نهائياً: ${acc.name}`, acc);
    res.json({ success: true, message: 'تم حذف الحساب بنجاح' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/transfers', (req, res) => {
  try {
    const { from_type, from_account_id, to_type, to_account_id, amount, fee, notes, reference_no } = req.body;
    const transferAmount = Number(amount);
    const transferFee = Number(fee) || 0;

    if (!transferAmount || transferAmount <= 0) {
      return res.status(400).json({ error: 'مبلغ التحويل يجب أن يكون أكبر من الصفر' });
    }

    const transferTx = db.transaction(() => {
      // 1. Deduct from source
      if (from_type === 'cashbox') {
        const inTot = db.prepare("SELECT COALESCE(SUM(amount), 0) as t FROM cash_box WHERE type = 'in'").get().t;
        const outTot = db.prepare("SELECT COALESCE(SUM(amount), 0) as t FROM cash_box WHERE type = 'out'").get().t;
        if ((inTot - outTot) < (transferAmount + transferFee)) {
          throw new Error('رصيد الخزينة النقدية غير كافٍ لإتمام التحويل');
        }

        db.prepare(`
          INSERT INTO cash_box (type, category, amount, description, ref_type)
          VALUES ('out', 'تحويل بنكي', ?, ?, 'transfer')
        `).run(transferAmount + transferFee, `توريد نقدية إلى البنك (شامل مصاريف: ${transferFee})`);
      } else if (from_type === 'bank') {
        const srcAcc = db.prepare('SELECT balance, name FROM bank_accounts WHERE id = ?').get(from_account_id);
        if (!srcAcc || srcAcc.balance < (transferAmount + transferFee)) {
          throw new Error(`رصيد ${srcAcc?.name || 'الحساب'} غير كافٍ`);
        }
        db.prepare('UPDATE bank_accounts SET balance = balance - ? WHERE id = ?').run(transferAmount + transferFee, from_account_id);
      }

      // 2. Add to destination
      if (to_type === 'cashbox') {
        db.prepare(`
          INSERT INTO cash_box (type, category, amount, description, ref_type)
          VALUES ('in', 'سحب بنكي', ?, ?, 'transfer')
        `).run(transferAmount, `سحب نقدي من البنك لتغذية الخزينة`);
      } else if (to_type === 'bank') {
        db.prepare('UPDATE bank_accounts SET balance = balance + ? WHERE id = ?').run(transferAmount, to_account_id);
      }

      // 3. Record in fund_transfers
      const info = db.prepare(`
        INSERT INTO fund_transfers (from_type, from_account_id, to_type, to_account_id, amount, fee, notes, reference_no)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(from_type, from_account_id || null, to_type, to_account_id || null, transferAmount, transferFee, notes || '', reference_no || '');

      return info.lastInsertRowid;
    });

    const transferId = transferTx();
    res.json({ success: true, transferId, message: 'تم تنفيذ التحويل وتحديث الأرصدة بنجاح' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/transfers', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT 
        ft.*,
        f_acc.name as from_account_name,
        t_acc.name as to_account_name
      FROM fund_transfers ft
      LEFT JOIN bank_accounts f_acc ON ft.from_account_id = f_acc.id
      LEFT JOIN bank_accounts t_acc ON ft.to_account_id = t_acc.id
      ORDER BY ft.id DESC
      LIMIT 100
    `).all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 15. FINANCE PARTNERS (valU, Contact, etc.)
// ==========================================
router.get('/finance-companies', (req, res) => {
  try {
    const list = db.prepare(`
      SELECT fc.*, ba.name as bank_account_name 
      FROM finance_companies fc
      LEFT JOIN bank_accounts ba ON fc.bank_account_id = ba.id
      ORDER BY fc.id ASC
    `).all();

    const getPlans = db.prepare('SELECT * FROM finance_company_plans WHERE finance_company_id = ? AND is_active = 1 ORDER BY duration_months ASC');
    for (const fc of list) {
      fc.plans = getPlans.all(fc.id);
    }

    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/finance-companies/:id/plans', (req, res) => {
  try {
    const { name, duration_months, merchant_fee_rate, customer_interest_rate, min_downpayment_rate, notes } = req.body;
    if (!name || !duration_months) {
      return res.status(400).json({ error: 'اسم الخطة وعدد الشهور مطلوب' });
    }
    const info = db.prepare(`
      INSERT INTO finance_company_plans (finance_company_id, name, duration_months, merchant_fee_rate, customer_interest_rate, min_downpayment_rate, is_active, notes)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?)
    `).run(req.params.id, name, Number(duration_months), Number(merchant_fee_rate) || 0, Number(customer_interest_rate) || 0, Number(min_downpayment_rate) || 0, notes || '');

    logActivity(req, 'FINANCE_PLAN_CREATED', 'finance_company_plan', info.lastInsertRowid, `إضافة خطة تقسيط جديدة: ${name} (${duration_months} شهر)`);
    res.json({ success: true, id: info.lastInsertRowid, message: 'تمت إضافة خطة التقسيط بنجاح' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/finance-companies/plans/:planId', (req, res) => {
  try {
    const { name, duration_months, merchant_fee_rate, customer_interest_rate, min_downpayment_rate, is_active, notes } = req.body;
    db.prepare(`
      UPDATE finance_company_plans SET
        name = COALESCE(?, name),
        duration_months = COALESCE(?, duration_months),
        merchant_fee_rate = COALESCE(?, merchant_fee_rate),
        customer_interest_rate = COALESCE(?, customer_interest_rate),
        min_downpayment_rate = COALESCE(?, min_downpayment_rate),
        is_active = COALESCE(?, is_active),
        notes = COALESCE(?, notes)
      WHERE id = ?
    `).run(name, duration_months, merchant_fee_rate, customer_interest_rate, min_downpayment_rate, is_active, notes, req.params.planId);

    res.json({ success: true, message: 'تم تحديث خطة التقسيط بنجاح' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/finance-companies/plans/:planId', (req, res) => {
  try {
    db.prepare('DELETE FROM finance_company_plans WHERE id = ?').run(req.params.planId);
    res.json({ success: true, message: 'تم حذف خطة التقسيط بنجاح' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/finance-companies', (req, res) => {
  try {
    const { name, merchant_fee_rate, bank_account_id, phone, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'اسم جهة التمويل مطلوب' });

    const info = db.prepare(`
      INSERT INTO finance_companies (name, merchant_fee_rate, bank_account_id, phone, notes, is_active)
      VALUES (?, ?, ?, ?, ?, 1)
    `).run(name, Number(merchant_fee_rate) || 0, bank_account_id || null, phone || '', notes || '');

    logActivity(req, 'FINANCE_COMPANY_CREATED', 'finance_company', info.lastInsertRowid, `إضافة جهة تمويل استهلاكي / تقسيط: ${name} - عمولة التاجر: ${merchant_fee_rate || 0}%`, req.body);

    res.json({ success: true, id: info.lastInsertRowid, message: 'تمت إضافة جهة التمويل بنجاح' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/finance-companies/:id', (req, res) => {
  try {
    const { name, merchant_fee_rate, bank_account_id, phone, notes, is_active } = req.body;
    const existing = db.prepare('SELECT * FROM finance_companies WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'جهة التمويل غير موجودة' });

    db.prepare(`
      UPDATE finance_companies SET
        name = ?,
        merchant_fee_rate = ?,
        bank_account_id = ?,
        phone = ?,
        notes = ?,
        is_active = ?
      WHERE id = ?
    `).run(
      name !== undefined ? name : existing.name,
      merchant_fee_rate !== undefined ? Number(merchant_fee_rate) : existing.merchant_fee_rate,
      bank_account_id !== undefined ? (bank_account_id ? Number(bank_account_id) : null) : existing.bank_account_id,
      phone !== undefined ? phone : existing.phone,
      notes !== undefined ? notes : existing.notes,
      is_active !== undefined ? Number(is_active) : (existing.is_active ?? 1),
      req.params.id
    );

    logActivity(req, 'FINANCE_COMPANY_UPDATED', 'finance_company', req.params.id, `تحديث سياسة وتعاقد شركة التمويل: ${name || existing.name} - عمولة: ${merchant_fee_rate}%`, req.body);
    res.json({ success: true, message: 'تم تحديث بيانات وسياسات شركة التمويل بنجاح' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/finance-companies/:id', (req, res) => {
  try {
    const fc = db.prepare('SELECT * FROM finance_companies WHERE id = ?').get(req.params.id);
    if (!fc) return res.status(404).json({ error: 'جهة التمويل غير موجودة' });

    const salesCount = db.prepare('SELECT COUNT(*) as count FROM sales WHERE finance_company_id = ?').get(req.params.id).count;
    if (salesCount > 0) {
      // Soft-delete to keep historical sales ledger integrity
      db.prepare('UPDATE finance_companies SET is_active = 0 WHERE id = ?').run(req.params.id);
      logActivity(req, 'FINANCE_COMPANY_DEACTIVATED', 'finance_company', req.params.id, `تعطيل وأرشفة شركة التمويل لوجود مبيعات سابقة: ${fc.name}`, fc);
      return res.json({ success: true, message: `تمت أرشفة وتعطيل شركة التمويل بنجاح حفاظاً على سلامة (${salesCount}) فاتورة مسجلة بها` });
    }

    db.prepare('DELETE FROM finance_companies WHERE id = ?').run(req.params.id);
    logActivity(req, 'FINANCE_COMPANY_DELETED', 'finance_company', req.params.id, `حذف شركة التمويل نهائياً: ${fc.name}`, fc);
    res.json({ success: true, message: 'تم حذف جهة التمويل بنجاح' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 16. BARCODE SCANNER FAST LOOKUP
// ==========================================
router.get('/barcode/lookup', (req, res) => {
  try {
    const { code } = req.query;
    if (!code) return res.status(400).json({ error: 'الباركود مطلوب' });

    const trimmed = code.trim();

    // 1. Check if it's an exact serial number
    const serial = db.prepare(`
      SELECT s.*, p.name as product_name, p.model_number, p.cash_price, p.installment_price, p.warranty_months, p.warranty_agency, b.name as brand_name
      FROM product_serials s
      JOIN products p ON s.product_id = p.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE s.serial_number = ?
    `).get(trimmed);

    if (serial) {
      return res.json({
        type: 'serial',
        serial: serial,
        product: {
          id: serial.product_id,
          name: serial.product_name,
          model_number: serial.model_number,
          cash_price: serial.cash_price,
          installment_price: serial.installment_price,
          warranty_months: serial.warranty_months,
          warranty_agency: serial.warranty_agency,
          brand_name: serial.brand_name
        }
      });
    }

    // 2. Check if it's a product barcode or model number
    const product = db.prepare(`
      SELECT p.*, b.name as brand_name
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.barcode = ? OR p.model_number = ?
    `).get(trimmed, trimmed);

    if (product) {
      const availableSerials = db.prepare(`
        SELECT id, serial_number, cost_price FROM product_serials
        WHERE product_id = ? AND status = 'in_stock'
      `).all(product.id);

      return res.json({
        type: 'product',
        product,
        availableSerials
      });
    }

    res.status(404).json({ error: 'لم يتم العثور على أي جهاز أو سيريال مطابق' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 17. BRANCHES MANAGEMENT
// ==========================================
router.get('/branches', (req, res) => {
  try {
    const branches = db.prepare(`
      SELECT b.*,
        (SELECT COUNT(*) FROM warehouses WHERE branch_id = b.id) as warehouses_count,
        (SELECT COUNT(*) FROM sales WHERE branch_id = b.id) as sales_count,
        (SELECT COALESCE(SUM(total), 0) FROM sales WHERE branch_id = b.id) as total_sales_amount
      FROM branches b
      ORDER BY b.is_main DESC, b.id ASC
    `).all();
    res.json(branches);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/branches', (req, res) => {
  try {
    const { name, code, phone, address, manager_name, is_main, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'اسم الفرع مطلوب' });
    const bCode = code || `BR-${Math.floor(100 + Math.random() * 900)}`;
    const info = db.prepare(`
      INSERT INTO branches (name, code, phone, address, manager_name, is_main, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(name, bCode, phone || '', address || '', manager_name || '', is_main ? 1 : 0, notes || '');
    res.json({ success: true, id: info.lastInsertRowid, message: 'تمت إضافة الفرع بنجاح' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/branches/:id', (req, res) => {
  try {
    const { name, code, phone, address, manager_name, is_main, status, notes } = req.body;
    db.prepare(`
      UPDATE branches 
      SET name = ?, code = ?, phone = ?, address = ?, manager_name = ?, is_main = ?, status = ?, notes = ?
      WHERE id = ?
    `).run(name, code, phone || '', address || '', manager_name || '', is_main ? 1 : 0, status || 'active', notes || '', req.params.id);
    res.json({ success: true, message: 'تم تحديث بيانات الفرع' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 18. WAREHOUSES MANAGEMENT
// ==========================================
router.get('/warehouses', (req, res) => {
  try {
    const warehouses = db.prepare(`
      SELECT w.*, b.name as branch_name,
        (SELECT COUNT(*) FROM product_serials WHERE warehouse_id = w.id AND status = 'in_stock') as items_count,
        (SELECT COALESCE(SUM(cost_price), 0) FROM product_serials WHERE warehouse_id = w.id AND status = 'in_stock') as total_cost_value
      FROM warehouses w
      LEFT JOIN branches b ON w.branch_id = b.id
      ORDER BY w.is_default DESC, w.id ASC
    `).all();
    res.json(warehouses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/warehouses', (req, res) => {
  try {
    const { branch_id, name, code, location, manager_name, phone, is_default, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'اسم المخزن مطلوب' });
    const wCode = code || `WH-${Math.floor(100 + Math.random() * 900)}`;
    const info = db.prepare(`
      INSERT INTO warehouses (branch_id, name, code, location, manager_name, phone, is_default, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(branch_id || null, name, wCode, location || '', manager_name || '', phone || '', is_default ? 1 : 0, notes || '');
    res.json({ success: true, id: info.lastInsertRowid, message: 'تمت إضافة المخزن بنجاح' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/warehouses/:id', (req, res) => {
  try {
    const { branch_id, name, code, location, manager_name, phone, is_default, status, notes } = req.body;
    db.prepare(`
      UPDATE warehouses 
      SET branch_id = ?, name = ?, code = ?, location = ?, manager_name = ?, phone = ?, is_default = ?, status = ?, notes = ?
      WHERE id = ?
    `).run(branch_id || null, name, code, location || '', manager_name || '', phone || '', is_default ? 1 : 0, status || 'active', notes || '', req.params.id);
    res.json({ success: true, message: 'تم تحديث بيانات المخزن' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serials inside a specific warehouse
router.get('/warehouses/:id/serials', (req, res) => {
  try {
    const serials = db.prepare(`
      SELECT s.*, p.name as product_name, p.model_number, p.cash_price, b.name as brand_name
      FROM product_serials s
      JOIN products p ON s.product_id = p.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE s.warehouse_id = ? AND s.status = 'in_stock'
      ORDER BY s.id DESC
    `).all(req.params.id);
    res.json(serials);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 19. WAREHOUSE STOCK TRANSFERS
// ==========================================
router.get('/transfers/stock', (req, res) => {
  try {
    const transfers = db.prepare(`
      SELECT st.*, 
        wFrom.name as from_warehouse_name, bFrom.name as from_branch_name,
        wTo.name as to_warehouse_name, bTo.name as to_branch_name
      FROM stock_transfers st
      LEFT JOIN warehouses wFrom ON st.from_warehouse_id = wFrom.id
      LEFT JOIN branches bFrom ON wFrom.branch_id = bFrom.id
      LEFT JOIN warehouses wTo ON st.to_warehouse_id = wTo.id
      LEFT JOIN branches bTo ON wTo.branch_id = bTo.id
      ORDER BY st.id DESC
      LIMIT 100
    `).all();

    for (const t of transfers) {
      t.items = db.prepare(`
        SELECT sti.*, p.name as product_name, p.model_number
        FROM stock_transfer_items sti
        JOIN products p ON sti.product_id = p.id
        WHERE sti.transfer_id = ?
      `).all(t.id);
    }

    res.json(transfers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/transfers/stock', (req, res) => {
  try {
    const { from_warehouse_id, to_warehouse_id, serial_ids, items, notes, created_by } = req.body;
    if (!from_warehouse_id || !to_warehouse_id) {
      return res.status(400).json({ error: 'يجب تحديد المخزن المصدر والمخزن المستقبل' });
    }
    if (Number(from_warehouse_id) === Number(to_warehouse_id)) {
      return res.status(400).json({ error: 'لا يمكن التحويل لنفس المخزن' });
    }

    let finalSerialIds = (serial_ids && Array.isArray(serial_ids)) ? [...serial_ids] : [];

    // Support direct quantity transfer per product
    if (finalSerialIds.length === 0 && Array.isArray(items) && items.length > 0) {
      const getSerialsForProduct = db.prepare('SELECT id, serial_number FROM product_serials WHERE product_id = ? AND warehouse_id = ? AND status = \'in_stock\' LIMIT ?');
      for (const item of items) {
        const qty = Number(item.quantity) || 1;
        const found = getSerialsForProduct.all(item.product_id, from_warehouse_id, qty);
        if (found.length < qty) {
          const prodName = db.prepare('SELECT name FROM products WHERE id = ?').get(item.product_id)?.name || 'الصنف';
          return res.status(400).json({ error: `الكمية المتوفرة بالمخزن المصدر للجهاز (${prodName}) غير كافية (المطلوب: ${qty}، المتوفر: ${found.length})` });
        }
        finalSerialIds.push(...found.map(f => f.id));
      }
    }

    if (finalSerialIds.length === 0) {
      return res.status(400).json({ error: 'يجب اختيار جهاز واحد أو تحديد كمية صالحة للتحويل' });
    }

    const transferTx = db.transaction(() => {
      const transferNo = generateInvoiceNo('TR');
      const cairoDate = getCairoDate();
      const cairoDateTime = getCairoDateTime().replace('T', ' ');
      const info = db.prepare(`
        INSERT INTO stock_transfers (transfer_no, from_warehouse_id, to_warehouse_id, total_items, notes, created_by, status, transfer_date, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 'completed', ?, ?)
      `).run(transferNo, from_warehouse_id, to_warehouse_id, finalSerialIds.length, notes || '', created_by || 'مسؤول الفرع', cairoDate, cairoDateTime);

      const transferId = info.lastInsertRowid;
      const insertItem = db.prepare(`
        INSERT INTO stock_transfer_items (transfer_id, product_id, serial_id, serial_number, notes)
        VALUES (?, ?, ?, ?, ?)
      `);
      const updateSerial = db.prepare(`
        UPDATE product_serials SET warehouse_id = ? WHERE id = ?
      `);

      for (const sId of finalSerialIds) {
        const sRecord = db.prepare('SELECT id, product_id, serial_number, warehouse_id FROM product_serials WHERE id = ?').get(sId);
        if (sRecord) {
          insertItem.run(transferId, sRecord.product_id, sRecord.id, sRecord.serial_number, '');
          updateSerial.run(to_warehouse_id, sRecord.id);
        }
      }

      return { transferId, transferNo, totalItems: finalSerialIds.length };
    });

    const result = transferTx();
    logActivity(req, 'STOCK_TRANSFER_CREATED', 'stock_transfer', result.transferId, `إذن تحويل مخزني: ${result.transferNo} - عدد (${result.totalItems}) أجهزة`);
    res.json({ success: true, ...result, message: `تم تحويل ${result.totalItems} جهاز بنجاح` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/transfers/stock/:id', (req, res) => {
  try {
    const { 
      from_warehouse_id, 
      to_warehouse_id, 
      items, 
      notes, 
      transfer_date, 
      created_by, 
      manager_pin, 
      manager_name 
    } = req.body;

    const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get() || {};
    const validPin = settings.manager_override_pin || '1234';

    if (manager_pin && manager_pin !== validPin) {
      return res.status(403).json({ error: 'رمز مرور المدير غير صحيح' });
    }

    const t = db.prepare('SELECT * FROM stock_transfers WHERE id = ?').get(req.params.id);
    if (!t) return res.status(404).json({ error: 'إذن التحويل غير موجود' });

    const oldItems = db.prepare('SELECT * FROM stock_transfer_items WHERE transfer_id = ?').all(t.id);

    // Verify none of the items were already sold from the destination warehouse
    for (const it of oldItems) {
      if (it.serial_id) {
        const s = db.prepare('SELECT status FROM product_serials WHERE id = ?').get(it.serial_id);
        if (s && s.status === 'sold') {
          return res.status(400).json({ error: 'لا يمكن تعديل هذا الإذن لأن بعض أجهزته تم بيعها بالفعل للعملاء من المخزن المستلم' });
        }
      }
    }

    const targetFromWarehouseId = from_warehouse_id ? Number(from_warehouse_id) : t.from_warehouse_id;
    const targetToWarehouseId = to_warehouse_id ? Number(to_warehouse_id) : t.to_warehouse_id;

    if (targetFromWarehouseId === targetToWarehouseId) {
      return res.status(400).json({ error: 'لا يمكن أن يكون المخزن المصدر هو نفس المخزن المستقبل' });
    }

    const updateTx = db.transaction(() => {
      const updateSerial = db.prepare('UPDATE product_serials SET warehouse_id = ? WHERE id = ?');

      // 1. Rollback old items: return all serials of this transfer to the original from_warehouse_id
      for (const it of oldItems) {
        if (it.serial_id) {
          updateSerial.run(t.from_warehouse_id, it.serial_id);
        }
      }

      let finalTotalItems = t.total_items;

      // 2. If new items are specified, reassign items and move serials
      if (Array.isArray(items)) {
        const getSerialsForProduct = db.prepare(`
          SELECT id, serial_number 
          FROM product_serials 
          WHERE product_id = ? AND warehouse_id = ? AND status = 'in_stock' 
          LIMIT ?
        `);

        const newSerialRecords = [];

        for (const it of items) {
          const qty = Number(it.quantity) || 0;
          if (qty <= 0) continue;

          const available = getSerialsForProduct.all(it.product_id, targetFromWarehouseId, qty);
          if (available.length < qty) {
            const prodName = db.prepare('SELECT name FROM products WHERE id = ?').get(it.product_id)?.name || 'الصنف';
            throw new Error(`الكمية المتوفرة بالمخزن المصدر للجهاز (${prodName}) غير كافية (المطلوب: ${qty}، المتوفر حالياً: ${available.length})`);
          }

          for (const s of available) {
            newSerialRecords.push({
              product_id: it.product_id,
              serial_id: s.id,
              serial_number: s.serial_number
            });
          }
        }

        if (newSerialRecords.length === 0) {
          throw new Error('يجب أن يحتوي إذن التحويل على صنف وجهاز واحد على الأقل بكمية صالحة');
        }

        // Delete old stock_transfer_items
        db.prepare('DELETE FROM stock_transfer_items WHERE transfer_id = ?').run(t.id);

        // Insert new items and move serials to targetToWarehouseId
        const insertItem = db.prepare(`
          INSERT INTO stock_transfer_items (transfer_id, product_id, serial_id, serial_number, notes)
          VALUES (?, ?, ?, ?, '')
        `);

        for (const s of newSerialRecords) {
          insertItem.run(t.id, s.product_id, s.serial_id, s.serial_number);
          updateSerial.run(targetToWarehouseId, s.serial_id);
        }

        finalTotalItems = newSerialRecords.length;
      } else {
        // If items were not changed, but warehouses were changed:
        // move the rolled-back old items from t.from_warehouse_id to targetToWarehouseId
        for (const it of oldItems) {
          if (it.serial_id) {
            updateSerial.run(targetToWarehouseId, it.serial_id);
          }
        }
      }

      // Update transfer header
      db.prepare(`
        UPDATE stock_transfers SET 
          from_warehouse_id = ?,
          to_warehouse_id = ?,
          total_items = ?,
          notes = ?,
          transfer_date = COALESCE(?, transfer_date),
          created_by = COALESCE(?, created_by),
          manager_approved_by = ?
        WHERE id = ?
      `).run(
        targetFromWarehouseId,
        targetToWarehouseId,
        finalTotalItems,
        notes !== undefined ? notes : t.notes,
        transfer_date || null,
        created_by || null,
        manager_name || 'إدارة المعرض',
        t.id
      );

      return { finalTotalItems };
    });

    const result = updateTx();

    logActivity(
      req, 
      'STOCK_TRANSFER_UPDATED', 
      'stock_transfer', 
      t.id, 
      `تعديل إذن التحويل المخزني: ${t.transfer_no} (إجمالي ${result.finalTotalItems} جهاز) بموافقة المدير: ${manager_name || 'إدارة المعرض'}`
    );

    res.json({ 
      success: true, 
      message: `تم حفظ تعديل إذن التحويل المخزني وتحديث حركة الأرصدة (${result.finalTotalItems} جهاز) بنجاح` 
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/transfers/stock/:id', (req, res) => {
  try {
    const { manager_pin, manager_name, reason } = req.body;
    const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get() || {};
    const validPin = settings.manager_override_pin || '1234';

    if (manager_pin && manager_pin !== validPin) {
      return res.status(403).json({ error: 'رمز مرور المدير غير صحيح. لا يمكن إلغاء التحويل إلا بموافقة المدير العام.' });
    }

    const t = db.prepare('SELECT * FROM stock_transfers WHERE id = ?').get(req.params.id);
    if (!t) return res.status(404).json({ error: 'إذن التحويل غير موجود' });

    // Reverse the transfer: return serials back to from_warehouse_id
    const deleteTx = db.transaction(() => {
      const items = db.prepare('SELECT * FROM stock_transfer_items WHERE transfer_id = ?').all(t.id);
      const updateSerial = db.prepare('UPDATE product_serials SET warehouse_id = ? WHERE id = ?');

      for (const item of items) {
        if (item.serial_id) {
          updateSerial.run(t.from_warehouse_id, item.serial_id);
        }
      }

      db.prepare('DELETE FROM stock_transfer_items WHERE transfer_id = ?').run(t.id);
      db.prepare('DELETE FROM stock_transfers WHERE id = ?').run(t.id);
    });

    deleteTx();

    logActivity(req, 'STOCK_TRANSFER_REVERSED', 'stock_transfer', req.params.id, `إلغاء وعكس إذن التحويل المخزني: ${t.transfer_no} وإرجاع (${t.total_items}) جهاز إلى المخزن المصدر بموافقة المدير: ${manager_name || 'الإدارة'} - السبب: ${reason || 'إلغاء إداري'}`);
    res.json({ success: true, message: `تم إلغاء إذن التحويل بنجاح وإعادة جميع الأجهزة (${t.total_items} جهاز) إلى المخزن المصدر` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 20. ELECTRONIC PUBLIC INVOICE (WHATSAPP & PDF VIEWER)
// ==========================================
router.get('/invoices/public/:invoiceNo', (req, res) => {
  try {
    const invoiceNo = req.params.invoiceNo;
    const sale = db.prepare(`
      SELECT 
        s.*,
        c.name as customer_name,
        c.phone as customer_phone,
        c.phone2 as customer_phone2,
        c.national_id as customer_national_id,
        c.address as customer_address,
        br.name as branch_name,
        br.phone as branch_phone,
        br.address as branch_address
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN branches br ON s.branch_id = br.id
      WHERE s.invoice_no = ?
    `).get(invoiceNo);

    if (!sale) {
      return res.status(404).send(`
        <html dir="rtl" style="font-family: Cairo, sans-serif; text-align: center; padding: 50px;">
          <h2 style="color: #e11d48;">عفواً، الفاتورة غير موجودة أو تم حذفها</h2>
          <p>تأكد من صحة رقم الفاتورة أو تواصل مع المعرض.</p>
        </html>
      `);
    }

    const items = db.prepare(`
      SELECT 
        si.*,
        COALESCE(p.name, si.notes, 'جهاز كهربائي') as product_name,
        COALESCE(p.model_number, '') as model_number,
        COALESCE(p.specifications, '') as specifications,
        COALESCE(p.warranty_agency, 'الوكيل المعتمد') as warranty_agency,
        b.name as brand_name
      FROM sale_items si
      LEFT JOIN products p ON si.product_id = p.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE si.sale_id = ?
    `).all(sale.id);

    const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get() || {};
    const storeName = settings.store_name || 'معرض دكان عبد العزيز للأجهزة الكهربائية';
    const storePhone = settings.phone || '01023456789';
    const currency = settings.currency || 'ج.م';

    const itemsRowsHtml = items.map((item, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0; font-size: 13px;">
        <td style="padding: 12px 10px; font-weight: bold; text-align: center;">${idx + 1}</td>
        <td style="padding: 12px 10px;">
          <div style="font-weight: 800; color: #0f172a; font-size: 14px;">${item.product_name}</div>
          <div style="font-size: 11px; color: #475569; margin-top: 3px;">
            ${item.model_number ? `موديل: <span style="font-family: monospace; font-weight: bold;">${item.model_number}</span> | ` : ''}
            ${item.brand_name ? `ماركة: ${item.brand_name}` : ''}
          </div>
          ${item.serial_number ? `
            <div style="display: inline-block; background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; border-radius: 4px; padding: 2px 6px; font-family: monospace; font-size: 11px; font-weight: bold; margin-top: 4px;">
              سيريال: ${item.serial_number}
            </div>
          ` : ''}
        </td>
        <td style="padding: 12px 10px; text-align: center;">
          <div style="font-weight: 700; color: #047857; font-size: 12px;">ضمان ${item.warranty_months} شهر</div>
          <div style="font-size: 11px; color: #64748b;">${item.warranty_agency || 'الوكيل المعتمد'}</div>
          ${item.warranty_end_date ? `<div style="font-size: 10px; color: #94a3b8;">ينتهي: ${item.warranty_end_date}</div>` : ''}
        </td>
        <td style="padding: 12px 10px; text-align: left; font-weight: 800; font-size: 14px; font-family: monospace;" dir="ltr">
          ${Number(item.unit_price).toLocaleString()} ${currency}
        </td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>فاتورة إلكترونية معتمدة | ${storeName} (${sale.invoice_no})</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Cairo', sans-serif; }
          body { background: #f1f5f9; color: #1e293b; padding: 16px; min-height: 100vh; }
          .container { max-width: 800px; margin: 0 auto; background: #ffffff; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); overflow: hidden; border: 1px solid #e2e8f0; }
          .top-bar { background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); color: #ffffff; padding: 24px; position: relative; }
          .badge { display: inline-block; background: #f59e0b; color: #000; font-weight: 800; font-size: 11px; padding: 4px 10px; border-radius: 9999px; margin-bottom: 8px; }
          .header-info { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; }
          .brand-title { font-size: 22px; font-weight: 900; }
          .brand-subtitle { font-size: 12px; color: #93c5fd; margin-top: 4px; font-weight: 600; }
          .inv-meta { text-align: left; background: rgba(255,255,255,0.1); padding: 12px 16px; border-radius: 12px; backdrop-filter: blur(4px); }
          .section { padding: 20px 24px; border-bottom: 1px solid #f1f5f9; }
          .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; font-size: 12px; }
          .label { color: #64748b; font-weight: 600; font-size: 11px; margin-bottom: 2px; }
          .val { font-weight: 800; color: #0f172a; font-size: 13px; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          th { background: #f8fafc; color: #475569; font-weight: 800; font-size: 12px; padding: 10px; text-align: right; border-bottom: 2px solid #e2e8f0; }
          .totals-box { background: #f8fafc; border-radius: 14px; padding: 16px; max-width: 320px; margin-right: auto; margin-top: 16px; font-size: 13px; border: 1px solid #e2e8f0; }
          .totals-row { display: flex; justify-content: space-between; margin-bottom: 6px; }
          .totals-final { border-top: 2px solid #cbd5e1; padding-top: 8px; font-size: 16px; font-weight: 900; color: #1d4ed8; }
          .actions-bar { background: #f8fafc; padding: 16px 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
          .btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 12px; font-weight: 800; font-size: 13px; text-decoration: none; cursor: pointer; border: none; }
          .btn-print { background: #2563eb; color: #ffffff; }
          .btn-whatsapp { background: #16a34a; color: #ffffff; }
          @media print {
            body { background: #ffffff; padding: 0; }
            .container { box-shadow: none; border: none; max-width: 100%; border-radius: 0; }
            .actions-bar, .no-print { display: none !important; }
            .top-bar { background: #0f172a !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Top Bar -->
          <div class="top-bar">
            <div class="badge">✓ فاتورة وشهادة ضمان إلكترونية معتمدة</div>
            <div class="header-info">
              <div>
                <h1 class="brand-title">${storeName}</h1>
                <p class="brand-subtitle">${settings.tagline || 'للأجهزة الكهربائية والمنزلية والتقسيط المريح'}</p>
                <p style="font-size: 11px; color: #cbd5e1; margin-top: 6px;">
                  📍 ${sale.branch_address || settings.address || 'شارع الأزهر - القاهرة'} | 📞 ${sale.branch_phone || storePhone}
                </p>
              </div>
              <div class="inv-meta">
                <div style="font-size: 11px; color: #cbd5e1;">رقم الفاتورة:</div>
                <div style="font-family: monospace; font-weight: 900; font-size: 16px; color: #fde047;">${sale.invoice_no}</div>
                <div style="font-size: 11px; color: #cbd5e1; margin-top: 4px;">تاريخ البيع: ${new Date(sale.created_at).toLocaleDateString('ar-EG')}</div>
              </div>
            </div>
          </div>

          <!-- Customer & Sale Meta -->
          <div class="section">
            <div class="grid">
              <div>
                <div class="label">اسم المشتري:</div>
                <div class="val">${sale.customer_name || 'عميل نقدي'}</div>
              </div>
              <div>
                <div class="label">رقم الموبايل:</div>
                <div class="val" dir="ltr" style="text-align: right;">${sale.customer_phone || '-'}</div>
              </div>
              <div>
                <div class="label">طريقة السداد:</div>
                <div class="val">
                  ${sale.sale_type === 'finance_company' ? `تقسيط شركة (${sale.finance_company_name || 'فاليو / بنوك'})` :
                    sale.sale_type === 'installment' ? 'تقسيط مباشر من المعرض' : 'كاش فوري'}
                </div>
              </div>
              <div>
                <div class="label">الفرع المسجل:</div>
                <div class="val">${sale.branch_name || 'معرض الأزهر الرئيسي'}</div>
              </div>
              ${sale.installment_plan_name ? `
                <div>
                  <div class="label">خطة ونظام التقسيط:</div>
                  <div class="val" style="color: #4338ca; font-weight: 800;">
                    ${sale.installment_plan_name} ${sale.installment_duration_months ? `(${sale.installment_duration_months} شهر)` : ''}
                  </div>
                </div>
              ` : ''}
              ${sale.finance_approval_code ? `
                <div>
                  <div class="label">كود موافقة التمويل:</div>
                  <div class="val" style="font-family: monospace; color: #4338ca;">${sale.finance_approval_code}</div>
                </div>
              ` : ''}
            </div>
          </div>

          <!-- Items Table -->
          <div class="section">
            <h3 style="font-size: 14px; font-weight: 900; color: #0f172a; margin-bottom: 12px;">الأجهزة المشتراة وتفاصيل الضمان</h3>
            <table>
              <thead>
                <tr>
                  <th style="width: 40px; text-align: center;">#</th>
                  <th>الجهاز والموديل والسيريال</th>
                  <th style="text-align: center;">الضمان والوكيل</th>
                  <th style="text-align: left;">السعر</th>
                </tr>
              </thead>
              <tbody>
                ${itemsRowsHtml}
              </tbody>
            </table>

            <!-- Financial Totals -->
            <div class="totals-box">
              <div class="totals-row">
                <span style="color: #64748b;">إجمالي الأصناف:</span>
                <span style="font-weight: 700;">${Number(sale.subtotal).toLocaleString()} ${currency}</span>
              </div>
              ${Number(sale.discount) > 0 ? `
                <div class="totals-row" style="color: #e11d48;">
                  <span>الخصم الممنوح:</span>
                  <span>-${Number(sale.discount).toLocaleString()} ${currency}</span>
                </div>
              ` : ''}
              <div class="totals-row totals-final">
                <span>المبلغ الإجمالي:</span>
                <span dir="ltr">${Number(sale.total).toLocaleString()} ${currency}</span>
              </div>
              <div class="totals-row" style="margin-top: 6px; font-size: 12px; color: #047857;">
                <span>المسدد:</span>
                <span dir="ltr">${Number(sale.paid_amount).toLocaleString()} ${currency}</span>
              </div>
              ${Number(sale.remaining_amount) > 0 ? `
                <div class="totals-row" style="font-size: 12px; color: #b45309; font-weight: bold;">
                  <span>المتبقي:</span>
                  <span dir="ltr">${Number(sale.remaining_amount).toLocaleString()} ${currency}</span>
                </div>
              ` : ''}
            </div>
          </div>

          <!-- Warranty Policy -->
          <div class="section" style="background: #fafaf9; font-size: 11px; color: #57534e; line-height: 1.6;">
            <strong>📜 شروط الضمان وخدمة ما بعد البيع:</strong>
            <p style="margin-top: 4px;">
              ${settings.warranty_policy || 'يسري الضمان من تاريخ الشراء المدون بهذه الفاتورة مع ضرورة الاحتفاظ بأصل الفاتورة وكرتونة الجهاز برقم السيريال عند طلب الصيانة من مراكز خدمة الوكيل المعتمد.'}
            </p>
          </div>

          <!-- Action Buttons Bar -->
          <div class="actions-bar no-print">
            <div style="font-size: 12px; color: #64748b; font-weight: 600;">
              💡 يمكنك طباعة الفاتورة كـ Web Page مباشرة أو حفظها
            </div>
            <div style="display: flex; gap: 8px;">
              <button onclick="window.print()" class="btn btn-print">
                🖨️ طباعة الفاتورة (Web Page)
              </button>
              <a href="https://wa.me/20${storePhone.replace(/^0+/, '')}?text=${encodeURIComponent(`مرحباً دكان عبد العزيز، بخصوص الفاتورة رقم ${sale.invoice_no}`)}" target="_blank" class="btn btn-whatsapp">
                💬 تواصل مع المعرض
              </a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    res.status(500).send(`خطأ في معالجة الفاتورة: ${err.message}`);
  }
});

// ==========================================
// 21. AUTHENTICATION & USER MANAGEMENT
// ==========================================
router.post('/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'الرجاء إدخال اسم المستخدم وكلمة المرور' });
    }

    const user = db.prepare(`
      SELECT u.id, u.username, u.name, u.role, u.branch_id, u.warehouse_id, u.phone, u.status, u.permissions,
             b.name as branch_name, w.name as warehouse_name
      FROM users u
      LEFT JOIN branches b ON u.branch_id = b.id
      LEFT JOIN warehouses w ON u.warehouse_id = w.id
      WHERE u.username = ? AND u.password = ? AND u.status = 'active'
    `).get(username.trim(), password.trim());

    if (!user) {
      logActivity(req, 'LOGIN_FAILED', 'user', 0, `محاولة دخول فاشلة باسم المستخدم: ${username.trim()}`, { username: username.trim() });
      return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    }

    if (user.permissions) {
      try { user.permissions = JSON.parse(user.permissions); } catch (e) { user.permissions = []; }
    } else {
      user.permissions = [];
    }

    logActivity(
      req, 
      'USER_LOGIN', 
      'user', 
      user.id, 
      `تسجيل دخول ناجح للمستخدم: ${user.name} (${user.username}) - الفرع: ${user.branch_name || 'جميع الفروع'}`, 
      { username: user.username, role: user.role, branch_name: user.branch_name || 'جميع الفروع' }
    );

    res.json({
      success: true,
      user,
      message: `مرحباً بك ${user.name}`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/users', (req, res) => {
  try {
    const users = db.prepare(`
      SELECT u.id, u.username, u.name, u.role, u.branch_id, u.warehouse_id, u.phone, u.status, u.permissions, u.created_at,
             b.name as branch_name, w.name as warehouse_name
      FROM users u
      LEFT JOIN branches b ON u.branch_id = b.id
      LEFT JOIN warehouses w ON u.warehouse_id = w.id
      ORDER BY u.id ASC
    `).all();

    for (const u of users) {
      if (u.permissions) {
        try { u.permissions = JSON.parse(u.permissions); } catch (e) { u.permissions = []; }
      } else {
        u.permissions = [];
      }
    }

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/users', (req, res) => {
  try {
    const { username, password, name, role, branch_id, warehouse_id, phone, status, permissions } = req.body;
    if (!username || !password || !name) {
      return res.status(400).json({ error: 'اسم المستخدم، كلمة المرور، والاسم ثلاثي مطلوبان' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username.trim());
    if (existing) {
      return res.status(400).json({ error: 'اسم المستخدم موجود بالفعل، اختر اسماً آخر' });
    }

    const finalBranchId = (branch_id && Number(branch_id) !== 0) ? Number(branch_id) : null;
    const finalWarehouseId = (warehouse_id && Number(warehouse_id) !== 0) ? Number(warehouse_id) : null;
    const permsJson = permissions ? JSON.stringify(permissions) : null;
    const info = db.prepare(`
      INSERT INTO users (username, password, name, role, branch_id, warehouse_id, phone, status, permissions)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(username.trim(), password.trim(), name.trim(), role || 'cashier', finalBranchId, finalWarehouseId, phone || '', status || 'active', permsJson);

    logActivity(req, 'USER_CREATE', 'user', info.lastInsertRowid, `إنشاء مستخدم جديد: ${name} (${username}) بدور ${role}`);

    res.json({ success: true, id: info.lastInsertRowid, message: 'تم إضافة المستخدم وتعيين الصلاحيات بنجاح' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/users/:id', (req, res) => {
  try {
    const { name, role, branch_id, warehouse_id, phone, status, password, permissions } = req.body;
    const finalBranchId = (branch_id && Number(branch_id) !== 0) ? Number(branch_id) : null;
    const finalWarehouseId = (warehouse_id && Number(warehouse_id) !== 0) ? Number(warehouse_id) : null;
    const permsJson = permissions ? JSON.stringify(permissions) : null;

    if (password && password.trim()) {
      db.prepare(`
        UPDATE users 
        SET name = ?, role = ?, branch_id = ?, warehouse_id = ?, phone = ?, status = ?, password = ?, permissions = ?
        WHERE id = ?
      `).run(name, role, finalBranchId, finalWarehouseId, phone || '', status || 'active', password.trim(), permsJson, req.params.id);
    } else {
      db.prepare(`
        UPDATE users 
        SET name = ?, role = ?, branch_id = ?, warehouse_id = ?, phone = ?, status = ?, permissions = ?
        WHERE id = ?
      `).run(name, role, finalBranchId, finalWarehouseId, phone || '', status || 'active', permsJson, req.params.id);
    }

    logActivity(req, 'USER_UPDATE', 'user', req.params.id, `تحديث بيانات وصلاحيات المستخدم: ${name} (الحالة: ${status})`);

    res.json({ success: true, message: 'تم تحديث بيانات وصلاحيات المستخدم بنجاح' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/users/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    if (Number(req.params.id) === 1 && status !== 'active') {
      return res.status(400).json({ error: 'لا يمكن إيقاف أو تعطيل حساب المدير العام الرئيسي' });
    }

    const nextStatus = status === 'active' ? 'active' : 'suspended';
    db.prepare('UPDATE users SET status = ? WHERE id = ?').run(nextStatus, req.params.id);

    const user = db.prepare('SELECT name, username FROM users WHERE id = ?').get(req.params.id);
    const actionDesc = nextStatus === 'active' ? 'تنشيط حساب المستخدم' : 'إيقاف وتعطيل حساب المستخدم';
    logActivity(req, 'USER_STATUS_CHANGE', 'user', req.params.id, `${actionDesc}: ${user?.name || ''} (${user?.username || ''})`);

    res.json({ success: true, status: nextStatus, message: `تم ${nextStatus === 'active' ? 'تنشيط' : 'إيقاف'} الحساب بنجاح` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/users/:id', (req, res) => {
  try {
    if (Number(req.params.id) === 1) {
      return res.status(400).json({ error: 'لا يمكن حذف حساب المدير العام الرئيسي' });
    }
    const user = db.prepare('SELECT name, username FROM users WHERE id = ?').get(req.params.id);
    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);

    logActivity(req, 'USER_DELETE', 'user', req.params.id, `حذف حساب المستخدم نهائياً: ${user?.name || ''} (${user?.username || ''})`);

    res.json({ success: true, message: 'تم حذف حساب المستخدم بنجاح' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 22. STOCK SHORTAGE REQUESTS & INVENTORY MATRIX
// ==========================================
router.get('/stock-requests', (req, res) => {
  try {
    const requests = db.prepare(`
      SELECT sr.*, 
        b.name as branch_name,
        w.name as from_warehouse_name
      FROM stock_requests sr
      LEFT JOIN branches b ON sr.branch_id = b.id
      LEFT JOIN warehouses w ON sr.from_warehouse_id = w.id
      ORDER BY sr.id DESC
      LIMIT 100
    `).all();

    for (const r of requests) {
      r.items = db.prepare(`
        SELECT sri.*, p.name as product_name, p.model_number,
          (SELECT COUNT(*) FROM product_serials WHERE product_id = sri.product_id AND status = 'in_stock') as total_in_stock
        FROM stock_request_items sri
        JOIN products p ON sri.product_id = p.id
        WHERE sri.request_id = ?
      `).all(r.id);
    }

    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/stock-requests', (req, res) => {
  try {
    const { branch_id, from_warehouse_id, requested_by, urgency, notes, items } = req.body;
    if (!branch_id || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'الرجاء تحديد الفرع والأجهزة المطلوبة' });
    }

    const requestTx = db.transaction(() => {
      const requestNo = generateInvoiceNo('REQ');
      const info = db.prepare(`
        INSERT INTO stock_requests (request_no, branch_id, from_warehouse_id, requested_by, urgency, status, notes)
        VALUES (?, ?, ?, ?, ?, 'pending', ?)
      `).run(requestNo, branch_id, from_warehouse_id || 2, requested_by || 'مسؤول الفرع', urgency || 'normal', notes || '');

      const reqId = info.lastInsertRowid;
      const insertItem = db.prepare(`
        INSERT INTO stock_request_items (request_id, product_id, quantity, notes)
        VALUES (?, ?, ?, ?)
      `);

      for (const it of items) {
        insertItem.run(reqId, it.product_id, Number(it.quantity) || 1, it.notes || '');
      }

      return { reqId, requestNo };
    });

    const result = requestTx();
    res.json({ success: true, ...result, message: 'تم إرسال طلب النواقص للمستودع بنجاح' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/stock-requests/:id/status', (req, res) => {
  try {
    const { status, notes } = req.body;
    db.prepare('UPDATE stock_requests SET status = ?, notes = COALESCE(?, notes) WHERE id = ?')
      .run(status, notes || null, req.params.id);
    res.json({ success: true, message: `تم تحديث حالة الطلب إلى ${status}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Comprehensive Real-Time Stock Tracking Matrix Across all Branches and Warehouses
router.get('/inventory/matrix', (req, res) => {
  try {
    const products = db.prepare(`
      SELECT p.id, p.name, p.model_number, p.cost_price, p.cash_price, p.installment_price,
        c.name as category_name, b.name as brand_name,
        (SELECT COUNT(*) FROM product_serials WHERE product_id = p.id AND status = 'in_stock') as total_in_stock
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      ORDER BY p.id ASC
    `).all();

    const warehouses = db.prepare(`
      SELECT w.id, w.name, w.branch_id, b.name as branch_name
      FROM warehouses w
      LEFT JOIN branches b ON w.branch_id = b.id
      ORDER BY w.id ASC
    `).all();

    for (const p of products) {
      p.warehouse_counts = {};
      for (const w of warehouses) {
        const count = db.prepare(`
          SELECT COUNT(*) as c FROM product_serials 
          WHERE product_id = ? AND warehouse_id = ? AND status = 'in_stock'
        `).get(p.id, w.id).c;
        p.warehouse_counts[w.id] = count;
      }
    }

    res.json({ products, warehouses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 23. PURCHASES MANAGEMENT & INVOICE AUDIT
// ==========================================
router.get('/purchases', (req, res) => {
  try {
    const { supplier_id, warehouse_id, review_status } = req.query;
    let query = `
      SELECT 
        p.*,
        p.total_amount as total,
        s.name as supplier_name,
        s.company as supplier_company,
        s.phone as supplier_phone,
        w.name as warehouse_name,
        (SELECT COUNT(*) FROM product_serials WHERE purchase_id = p.id) as serials_count
      FROM purchases p
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      LEFT JOIN warehouses w ON p.warehouse_id = w.id
      WHERE 1=1
    `;
    const params = [];
    if (supplier_id) {
      query += ` AND p.supplier_id = ?`;
      params.push(supplier_id);
    }
    if (warehouse_id) {
      query += ` AND p.warehouse_id = ?`;
      params.push(warehouse_id);
    }
    if (review_status) {
      query += ` AND p.review_status = ?`;
      params.push(review_status);
    }

    query += ` ORDER BY p.id DESC LIMIT 100`;
    const rows = db.prepare(query).all(...params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/purchases/:id', (req, res) => {
  try {
    const purchase = db.prepare(`
      SELECT 
        p.*,
        p.total_amount as total,
        s.name as supplier_name,
        s.company as supplier_company,
        s.phone as supplier_phone,
        w.name as warehouse_name
      FROM purchases p
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      LEFT JOIN warehouses w ON p.warehouse_id = w.id
      WHERE p.id = ?
    `).get(req.params.id);

    if (!purchase) return res.status(404).json({ error: 'فاتورة الشراء غير موجودة' });

    purchase.items = db.prepare(`
      SELECT s.*, pr.name as product_name, pr.model_number, b.name as brand_name
      FROM product_serials s
      JOIN products pr ON s.product_id = pr.id
      LEFT JOIN brands b ON pr.brand_id = b.id
      WHERE s.purchase_id = ?
      ORDER BY s.id ASC
    `).all(req.params.id);

    // Group items into product-level summary with quantity
    purchase.summary_items = db.prepare(`
      SELECT 
        s.product_id,
        pr.name as product_name,
        pr.model_number,
        b.name as brand_name,
        COUNT(*) as quantity,
        s.cost_price,
        (COUNT(*) * s.cost_price) as total_cost,
        GROUP_CONCAT(s.serial_number, ', ') as serial_numbers
      FROM product_serials s
      JOIN products pr ON s.product_id = pr.id
      LEFT JOIN brands b ON pr.brand_id = b.id
      WHERE s.purchase_id = ?
      GROUP BY s.product_id, s.cost_price
    `).all(req.params.id);

    res.json(purchase);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Invoice Audit: Audit / Review Sale Invoice
router.put('/sales/:id/audit', (req, res) => {
  try {
    const { review_status, audit_notes, reviewed_by } = req.body;
    db.prepare(`
      UPDATE sales 
      SET review_status = ?, audit_notes = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(review_status || 'reviewed', audit_notes || '', reviewed_by || 'المراجع المالي', req.params.id);
    res.json({ success: true, message: 'تم تدقيق واعتماد فاتورة المبيعات بنجاح' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Invoice Audit: Audit / Review Purchase Invoice
router.put('/purchases/:id/audit', (req, res) => {
  try {
    const { review_status, audit_notes, reviewed_by } = req.body;
    db.prepare(`
      UPDATE purchases 
      SET review_status = ?, audit_notes = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(review_status || 'reviewed', audit_notes || '', reviewed_by || 'المراجع المالي', req.params.id);
    res.json({ success: true, message: 'تم تدقيق واعتماد فاتورة المشتريات بنجاح' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 24. CASHIER SHIFTS & Z-REPORT (تقفيل الوردية اليومية)
// ==========================================
router.get('/shifts/current', (req, res) => {
  try {
    const userId = Number(req.query.user_id) || 1;
    const shift = db.prepare(`
      SELECT cs.*, b.name as branch_name 
      FROM cashier_shifts cs
      LEFT JOIN branches b ON cs.branch_id = b.id
      WHERE cs.user_id = ? AND cs.status = 'open'
      ORDER BY cs.id DESC LIMIT 1
    `).get(userId);

    if (!shift) {
      return res.json({ hasOpenShift: false });
    }

    // Compute live metrics for this active shift
    const startTime = shift.start_time;
    
    // Cash sales
    const salesCash = db.prepare(`
      SELECT COALESCE(SUM(paid_amount), 0) as total
      FROM sales 
      WHERE sale_type = 'cash' AND created_at >= ?
    `).get(startTime).total;

    // Cash installments collected
    const installmentsCash = db.prepare(`
      SELECT COALESCE(SUM(amount_paid), 0) as total
      FROM installment_payments
      WHERE status = 'paid' AND payment_method = 'cash' AND (paid_date >= DATE(?) OR receipt_no IS NOT NULL)
    `).get(startTime).total;

    // Inflows from cashbox
    const cashInflows = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM cash_box
      WHERE type = 'in' AND category != 'مبيعات نقدية' AND category != 'سداد قسط' AND created_at >= ?
    `).get(startTime).total;

    // Expenses / Outflows
    const cashExpenses = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM cash_box
      WHERE type = 'out' AND created_at >= ?
    `).get(startTime).total;

    const opening = shift.opening_balance || 0;
    const expectedCash = opening + salesCash + installmentsCash + cashInflows - cashExpenses;

    res.json({
      hasOpenShift: true,
      shift,
      liveMetrics: {
        opening_balance: opening,
        cash_sales: salesCash,
        cash_installments: installmentsCash,
        cash_inflows: cashInflows,
        cash_expenses: cashExpenses,
        expected_cash: expectedCash
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/shifts/open', (req, res) => {
  try {
    const { user_id, user_name, branch_id, opening_balance, notes } = req.body;
    if (!user_id) return res.status(400).json({ error: 'معرف المستخدم مطلوب' });

    // Check if user already has open shift
    const existing = db.prepare("SELECT id FROM cashier_shifts WHERE user_id = ? AND status = 'open'").get(user_id);
    if (existing) {
      return res.status(400).json({ error: 'لديك وردية مفتوحة بالفعل، يجب إغلاقها أولاً قبل فتح وردية جديدة' });
    }

    const shiftNo = generateInvoiceNo('SH');
    const info = db.prepare(`
      INSERT INTO cashier_shifts (shift_no, user_id, user_name, branch_id, opening_balance, status, notes)
      VALUES (?, ?, ?, ?, ?, 'open', ?)
    `).run(shiftNo, user_id, user_name || 'كاشير', branch_id || 1, Number(opening_balance) || 0, notes || '');

    logActivity(req, 'SHIFT_OPENED', 'shift', info.lastInsertRowid, `فتح وردية جديدة برصيد افتتاحي ${opening_balance || 0} ج.م`, { shiftNo, opening_balance });

    res.json({ success: true, shift_id: info.lastInsertRowid, shift_no: shiftNo, message: 'تم فتح الوردية بنجاح' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/shifts/close', (req, res) => {
  try {
    const { shift_id, actual_cash, notes, closed_by } = req.body;
    if (!shift_id) return res.status(400).json({ error: 'رقم الوردية مطلوب' });

    const shift = db.prepare('SELECT * FROM cashier_shifts WHERE id = ?').get(shift_id);
    if (!shift) return res.status(404).json({ error: 'الوردية غير موجودة' });
    if (shift.status === 'closed') return res.status(400).json({ error: 'هذه الوردية مغلقة بالفعل' });

    // Calculate totals during this shift
    const startTime = shift.start_time;
    const salesCash = db.prepare("SELECT COALESCE(SUM(paid_amount), 0) as total FROM sales WHERE sale_type = 'cash' AND created_at >= ?").get(startTime).total;
    const installmentsCash = db.prepare("SELECT COALESCE(SUM(amount_paid), 0) as total FROM installment_payments WHERE status = 'paid' AND payment_method = 'cash' AND paid_date >= DATE(?)").get(startTime).total;
    const cashInflows = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM cash_box WHERE type = 'in' AND category != 'مبيعات نقدية' AND category != 'سداد قسط' AND created_at >= ?").get(startTime).total;
    const cashExpenses = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM cash_box WHERE type = 'out' AND created_at >= ?").get(startTime).total;

    const opening = shift.opening_balance || 0;
    const expected = opening + salesCash + installmentsCash + cashInflows - cashExpenses;
    const actual = Number(actual_cash) || 0;
    const difference = actual - expected; // Negative = deficit, Positive = surplus
    const cairoNow = getCairoDateTime();

    db.prepare(`
      UPDATE cashier_shifts SET
        status = 'closed',
        end_time = ?,
        cash_sales = ?,
        cash_installments = ?,
        cash_inflows = ?,
        cash_expenses = ?,
        expected_cash = ?,
        actual_cash = ?,
        difference = ?,
        closed_by = ?,
        notes = ?
      WHERE id = ?
    `).run(cairoNow.replace('T', ' '), salesCash, installmentsCash, cashInflows, cashExpenses, expected, actual, difference, closed_by || 'الكاشير', notes || '', shift_id);

    const zReport = {
      shift_no: shift.shift_no,
      user_name: shift.user_name,
      start_time: shift.start_time,
      end_time: cairoNow,
      opening_balance: opening,
      cash_sales: salesCash,
      cash_installments: installmentsCash,
      cash_inflows: cashInflows,
      cash_expenses: cashExpenses,
      expected_cash: expected,
      actual_cash: actual,
      difference: difference,
      status: difference === 0 ? 'مطابق تماماً' : difference < 0 ? `عجز بقيمة ${Math.abs(difference)} ج.م` : `زيادة بقيمة ${difference} ج.م`
    };

    logActivity(req, 'SHIFT_CLOSED', 'shift', shift_id, `إغلاق الوردية ${shift.shift_no} - النقدية الفعلية: ${actual} - الفارق: ${difference}`, zReport);

    res.json({
      success: true,
      message: 'تم إغلاق الوردية وحساب العجز/الزيادة وإصدار تقرير Z-Report بنجاح',
      zReport
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/shifts/history', (req, res) => {
  try {
    const shifts = db.prepare(`
      SELECT cs.*, b.name as branch_name
      FROM cashier_shifts cs
      LEFT JOIN branches b ON cs.branch_id = b.id
      ORDER BY cs.id DESC
      LIMIT 100
    `).all();
    res.json(shifts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 25. ACTIVITY AUDIT TRAIL (سجل الحركات الحساسة)
// ==========================================
router.get('/activity-logs', (req, res) => {
  try {
    const { action_type, user_id, search, limit = 200 } = req.query;
    let query = `
      SELECT 
        id, 
        user_id, 
        user_name, 
        user_role, 
        action_type, 
        action_type AS action, 
        target_type, 
        target_id, 
        description, 
        details, 
        ip_address, 
        created_at 
      FROM activity_logs 
      WHERE 1=1
    `;
    const params = [];

    if (action_type) {
      query += ` AND action_type = ?`;
      params.push(action_type);
    }
    if (user_id) {
      query += ` AND user_id = ?`;
      params.push(user_id);
    }
    if (search) {
      query += ` AND (description LIKE ? OR user_name LIKE ? OR action_type LIKE ? OR target_id LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY id DESC LIMIT ?`;
    params.push(Number(limit) || 200);

    const logs = db.prepare(query).all(...params);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 26. SALES RETURNS & REFUNDS (المرتجعات واسترداد الأموال)
// ==========================================
router.post('/sales/:id/return', (req, res) => {
  try {
    const saleId = req.params.id;
    const { items, refund_amount, refund_method, reason, processed_by } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'يجب تحديد جهاز واحد على الأقل للإرجاع' });
    }

    const sale = db.prepare('SELECT * FROM sales WHERE id = ?').get(saleId);
    if (!sale) return res.status(404).json({ error: 'فاتورة البيع غير موجودة' });

    const returnTx = db.transaction(() => {
      const returnNo = generateInvoiceNo('RET');
      const totalRefund = Number(refund_amount) || 0;

      // 1. Insert return record
      const returnInfo = db.prepare(`
        INSERT INTO sale_returns (return_no, sale_id, customer_id, refund_amount, refund_method, reason, processed_by, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(returnNo, saleId, sale.customer_id, totalRefund, refund_method || 'cash', reason || '', processed_by || 'الكاشير', '');

      const returnId = returnInfo.lastInsertRowid;

      // 2. Process items & restore/update serial status
      for (const it of items) {
        db.prepare(`
          INSERT INTO sale_return_items (return_id, sale_item_id, product_id, serial_number, refund_price, restock_status, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(returnId, it.sale_item_id || null, it.product_id, it.serial_number || '', Number(it.refund_price) || 0, it.restock_status || 'in_stock', it.notes || '');

        // Update serial in DB
        if (it.serial_number) {
          const serialRecord = db.prepare('SELECT id FROM product_serials WHERE serial_number = ?').get(it.serial_number);
          if (serialRecord) {
            const nextStatus = it.restock_status === 'damaged' ? 'damaged' : it.restock_status === 'outlet' ? 'outlet' : 'in_stock';
            const notesText = nextStatus === 'in_stock' ? 'مرتجع سليم من العميل' : `مرتجع: ${reason || ''}`;
            db.prepare(`
              UPDATE product_serials 
              SET status = ?, sale_id = NULL, notes = ?
              WHERE id = ?
            `).run(nextStatus, notesText, serialRecord.id);
          }
        }
      }

      // 3. Financial refund deduction
      if (refund_method === 'cash' && totalRefund > 0) {
        db.prepare(`
          INSERT INTO cash_box (type, category, amount, description, ref_type, ref_id)
          VALUES ('out', 'مرتجع مبيعات', ?, ?, 'sale_return', ?)
        `).run(totalRefund, `استرداد نقدي لمرتجع فاتورة ${sale.invoice_no}`, returnId);
      }

      // 4. Update sale record
      db.prepare(`
        UPDATE sales SET
          return_status = 'returned',
          returned_amount = COALESCE(returned_amount, 0) + ?
        WHERE id = ?
      `).run(totalRefund, saleId);

      return { returnId, returnNo };
    });

    const result = returnTx();
    logActivity(req, 'SALE_REFUND', 'sale', saleId, `تسجيل مرتجع للفاتورة ${sale.invoice_no} بقيمة ${refund_amount} ج.م`, result);

    res.json({ success: true, ...result, message: 'تم تسجيل المرتجع واسترداد المبلغ وتحديث حالة الأجهزة بنجاح' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/returns', (req, res) => {
  try {
    const returns = db.prepare(`
      SELECT sr.*, s.invoice_no as sale_invoice_no, c.name as customer_name, c.phone as customer_phone
      FROM sale_returns sr
      JOIN sales s ON sr.sale_id = s.id
      LEFT JOIN customers c ON sr.customer_id = c.id
      ORDER BY sr.id DESC
      LIMIT 100
    `).all();

    for (const r of returns) {
      r.items = db.prepare(`
        SELECT sri.*, p.name as product_name, p.model_number
        FROM sale_return_items sri
        JOIN products p ON sri.product_id = p.id
        WHERE sri.return_id = ?
      `).all(r.id);
    }

    res.json(returns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 27. PHYSICAL INVENTORY CYCLE COUNTING (الجرد الدوري الآلي بالباركود)
// ==========================================
router.post('/inventory/audit', (req, res) => {
  try {
    const { warehouse_id, auditor_name, scanned_serials, notes } = req.body;
    if (!warehouse_id || !Array.isArray(scanned_serials)) {
      return res.status(400).json({ error: 'الرجاء تحديد المخزن وقائمة السيريالات الممسوحة' });
    }

    // Clean list
    const scannedSet = new Set(scanned_serials.map(s => String(s).trim().toUpperCase()).filter(Boolean));

    // Get expected in_stock serials in this warehouse
    const dbSerials = db.prepare(`
      SELECT ps.id, ps.serial_number, ps.product_id, ps.status, p.name as product_name, p.model_number
      FROM product_serials ps
      JOIN products p ON ps.product_id = p.id
      WHERE ps.warehouse_id = ? AND ps.status = 'in_stock'
    `).all(warehouse_id);

    const matched = [];
    const missing = [];
    const surplus = [];

    const dbSerialsMap = new Map();
    dbSerials.forEach(s => dbSerialsMap.set(s.serial_number.toUpperCase(), s));

    // 1. Check scanned against DB
    for (const sn of scannedSet) {
      if (dbSerialsMap.has(sn)) {
        matched.push(dbSerialsMap.get(sn));
      } else {
        // Look up if serial exists elsewhere or not in DB
        const anywhere = db.prepare(`
          SELECT ps.id, ps.serial_number, ps.product_id, ps.status, ps.warehouse_id, p.name as product_name, w.name as warehouse_name
          FROM product_serials ps
          JOIN products p ON ps.product_id = p.id
          LEFT JOIN warehouses w ON ps.warehouse_id = w.id
          WHERE UPPER(ps.serial_number) = ?
        `).get(sn);

        surplus.push({
          serial_number: sn,
          product_name: anywhere ? anywhere.product_name : 'غير مسجل بقاعدة البيانات',
          status: anywhere ? `موجود بمخزن (${anywhere.warehouse_name || 'آخر'}) بحالة (${anywhere.status})` : 'سيريال مجهول جديد'
        });
      }
    }

    // 2. Identify missing
    for (const item of dbSerials) {
      if (!scannedSet.has(item.serial_number.toUpperCase())) {
        missing.push(item);
      }
    }

    // 3. Save audit record
    const auditNo = generateInvoiceNo('AUDIT');
    const info = db.prepare(`
      INSERT INTO inventory_audits (audit_no, warehouse_id, auditor_name, total_expected, total_scanned, matched_count, missing_count, surplus_count, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      auditNo, warehouse_id, auditor_name || 'أمين المخزن',
      dbSerials.length, scannedSet.size, matched.length, missing.length, surplus.length, notes || ''
    );

    const auditId = info.lastInsertRowid;

    // Insert items
    const insertAuditItem = db.prepare(`
      INSERT INTO inventory_audit_items (audit_id, serial_number, product_id, product_name, status, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    matched.forEach(it => insertAuditItem.run(auditId, it.serial_number, it.product_id, it.product_name, 'matched', 'مطابق للجرد'));
    missing.forEach(it => insertAuditItem.run(auditId, it.serial_number, it.product_id, it.product_name, 'missing', 'عجز - لم يظهر بالمسح'));
    surplus.forEach(it => insertAuditItem.run(auditId, it.serial_number, null, it.product_name, 'surplus', it.status));

    logActivity(req, 'INVENTORY_AUDIT', 'inventory_audit', auditId, `جرد مخزني ${auditNo} - مطابق: ${matched.length} - عجز: ${missing.length} - فائض: ${surplus.length}`);

    res.json({
      success: true,
      audit_id: auditId,
      audit_no: auditNo,
      summary: {
        total_expected: dbSerials.length,
        total_scanned: scannedSet.size,
        matched_count: matched.length,
        missing_count: missing.length,
        surplus_count: surplus.length
      },
      matched,
      missing,
      surplus
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/inventory/audits', (req, res) => {
  try {
    const audits = db.prepare(`
      SELECT ia.*, w.name as warehouse_name, b.name as branch_name
      FROM inventory_audits ia
      JOIN warehouses w ON ia.warehouse_id = w.id
      LEFT JOIN branches b ON w.branch_id = b.id
      ORDER BY ia.id DESC LIMIT 100
    `).all();
    res.json(audits);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/inventory/audits/:id', (req, res) => {
  try {
    const audit = db.prepare(`
      SELECT ia.*, w.name as warehouse_name, b.name as branch_name
      FROM inventory_audits ia
      JOIN warehouses w ON ia.warehouse_id = w.id
      LEFT JOIN branches b ON w.branch_id = b.id
      WHERE ia.id = ?
    `).get(req.params.id);

    if (!audit) return res.status(404).json({ error: 'تقرير الجرد غير موجود' });

    audit.items = db.prepare('SELECT * FROM inventory_audit_items WHERE audit_id = ?').all(req.params.id);
    res.json(audit);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 28. CUSTOMER CREDIT SCORING & BLACKLIST
// ==========================================
router.put('/customers/:id/credit-status', (req, res) => {
  try {
    const { credit_score, max_credit_limit, is_blacklisted, blacklist_reason } = req.body;
    db.prepare(`
      UPDATE customers 
      SET credit_score = ?, max_credit_limit = ?, is_blacklisted = ?, blacklist_reason = ?
      WHERE id = ?
    `).run(
      credit_score || 'A',
      Number(max_credit_limit) || 50000,
      is_blacklisted ? 1 : 0,
      blacklist_reason || '',
      req.params.id
    );

    logActivity(req, 'CUSTOMER_CREDIT_UPDATED', 'customer', req.params.id, `تحديث التقييم الائتماني للعميل إلى ${credit_score} ${is_blacklisted ? '(محظور في القائمة السوداء)' : ''}`);

    res.json({ success: true, message: 'تم تحديث التقييم الائتماني للعميل بنجاح' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 29. INSTALLMENT RESCHEDULING & PENALTIES
// ==========================================
router.post('/installments/:id/reschedule', (req, res) => {
  try {
    const planId = req.params.id;
    const { new_months, start_date, notes } = req.body;

    const plan = db.prepare('SELECT * FROM installment_plans WHERE id = ?').get(planId);
    if (!plan) return res.status(404).json({ error: 'عقد التقسيط غير موجود' });

    const remainingBalance = plan.remaining_balance;
    const months = Number(new_months) || 12;
    const monthlyAmount = Math.ceil(remainingBalance / months);

    const rescheduleTx = db.transaction(() => {
      // Delete unpaid payments
      db.prepare("DELETE FROM installment_payments WHERE installment_plan_id = ? AND status != 'paid'").run(planId);

      // Create new payments
      const startDateObj = start_date ? new Date(start_date) : new Date();
      const insertPayment = db.prepare(`
        INSERT INTO installment_payments (installment_plan_id, installment_no, due_date, amount_due, status)
        VALUES (?, ?, ?, ?, 'pending')
      `);

      for (let i = 1; i <= months; i++) {
        const dueDate = new Date(startDateObj);
        dueDate.setMonth(dueDate.getMonth() + (i - 1));
        const dueDateStr = formatCairoDate(dueDate);
        const amount = (i === months) ? (remainingBalance - (monthlyAmount * (months - 1))) : monthlyAmount;
        insertPayment.run(planId, i, dueDateStr, amount);
      }

      // Update plan
      db.prepare(`
        UPDATE installment_plans 
        SET monthly_installment = ?, total_months = ?, notes = COALESCE(notes || ' | ', '') || ?
        WHERE id = ?
      `).run(monthlyAmount, months, `تمت إعادة الجدولة على ${months} شهر بتاريخ ${getCairoDate()} - ${notes || ''}`, planId);
    });

    rescheduleTx();
    logActivity(req, 'INSTALLMENT_RESCHEDULED', 'installment', planId, `إعادة جدولة العقد ${plan.contract_no} على ${months} شهر بقسط ${monthlyAmount} ج.م`);

    res.json({ success: true, message: `تمت إعادة جدولة العقد بنجاح على ${months} شهر بقسط شهري ${monthlyAmount} ج.م` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 30. AUTOMATED DATABASE BACKUP (النسخ الاحتياطي الذكي)
// ==========================================
router.post('/backup/create', (req, res) => {
  try {
    const backupsDir = path.join(__dirname, '..', 'backups');
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }

    const timestamp = getCairoDateTime().replace(/[:.]/g, '-');
    const backupFileName = `dokan_backup_${timestamp}.db`;
    const targetPath = path.join(backupsDir, backupFileName);

    // SQLite online backup mechanism
    db.backup(targetPath)
      .then(() => {
        const stats = fs.statSync(targetPath);
        logActivity(req, 'BACKUP_CREATED', 'backup', 0, `إنشاء نسخة احتياطية لقاعدة البيانات: ${backupFileName} بحجم ${(stats.size / 1024).toFixed(1)} KB`);
        res.json({
          success: true,
          filename: backupFileName,
          backup_filename: backupFileName,
          size_kb: Math.round(stats.size / 1024),
          created_at: getCairoDateTime(),
          message: 'تم إنشاء النسخة الاحتياطية بنجاح وحفظها في مجلد backups'
        });
      })
      .catch((err) => {
        res.status(500).json({ error: `فشل إنشاء النسخة الاحتياطية: ${err.message}` });
      });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/backup/list', (req, res) => {
  try {
    const backupsDir = path.join(__dirname, '..', 'backups');
    if (!fs.existsSync(backupsDir)) {
      return res.json([]);
    }

    const files = fs.readdirSync(backupsDir)
      .filter(f => f.endsWith('.db'))
      .map(f => {
        const filePath = path.join(backupsDir, f);
        const stats = fs.statSync(filePath);
        return {
          filename: f,
          size_kb: Math.round(stats.size / 1024),
          created_at: stats.mtime
        };
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json(files);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/backup/download/:filename', (req, res) => {
  try {
    const backupsDir = path.join(__dirname, '..', 'backups');
    const safeName = path.basename(req.params.filename);
    const filePath = path.join(backupsDir, safeName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'ملف النسخة الاحتياطية غير موجود' });
    }
    res.download(filePath, safeName);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 31. CUSTOMER PUBLIC SELF-SERVICE PORTAL (استعلام العميل بالـ QR)
// ==========================================
router.get('/portal/installments/:contractNo', (req, res) => {
  try {
    const plan = db.prepare(`
      SELECT 
        ip.*,
        c.name as customer_name,
        c.phone as customer_phone,
        c.national_id,
        b.name as branch_name,
        s.invoice_no
      FROM installment_plans ip
      JOIN customers c ON ip.customer_id = c.id
      JOIN sales s ON ip.sale_id = s.id
      LEFT JOIN branches b ON s.branch_id = b.id
      WHERE ip.contract_no = ?
    `).get(req.params.contractNo);

    if (!plan) return res.status(404).json({ error: 'عقد التقسيط غير موجود' });

    plan.payments = db.prepare(`
      SELECT * FROM installment_payments 
      WHERE installment_plan_id = ?
      ORDER BY installment_no ASC
    `).all(plan.id);

    const settings = db.prepare('SELECT store_name, phone, phone2, address, currency FROM settings WHERE id = 1').get();
    const bankAccounts = db.prepare("SELECT name, bank_name, account_number, type FROM bank_accounts WHERE type IN ('bank', 'wallet')").all();

    res.json({
      plan,
      settings,
      paymentAccounts: bankAccounts
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 32. OUTLET & DEAD STOCK ANALYTICS
// ==========================================
router.get('/inventory/dead-stock', (req, res) => {
  try {
    // Serials in stock created > 60 days ago
    const rows = db.prepare(`
      SELECT ps.*, p.name as product_name, p.model_number, p.cash_price, p.cost_price,
        b.name as brand_name, c.name as category_name, w.name as warehouse_name,
        CAST((julianday('now') - julianday(ps.created_at)) AS INTEGER) as days_in_stock
      FROM product_serials ps
      JOIN products p ON ps.product_id = p.id
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN warehouses w ON ps.warehouse_id = w.id
      WHERE ps.status = 'in_stock'
      ORDER BY days_in_stock DESC
      LIMIT 100
    `).all();

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/products/outlet', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT ps.*, p.name as product_name, p.model_number, p.cash_price, p.outlet_price, p.outlet_notes,
        b.name as brand_name, w.name as warehouse_name
      FROM product_serials ps
      JOIN products p ON ps.product_id = p.id
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN warehouses w ON ps.warehouse_id = w.id
      WHERE ps.status IN ('outlet', 'damaged')
      ORDER BY ps.id DESC
    `).all();

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 34. DAILY PAYMENT RECONCILIATION (مراجعة اليومية وتقفيل طرق الدفع)
// ==========================================
router.get('/reconciliation/daily', (req, res) => {
  try {
    const { date, branch_id } = req.query;
    const targetDate = date || getCairoDate();

    let branchFilter = '';
    const branchParams = [];
    if (branch_id) {
      branchFilter = ' AND s.branch_id = ?';
      branchParams.push(branch_id);
    }

    // 1. Sales for target date
    const sales = db.prepare(`
      SELECT 
        s.*, 
        c.name as customer_name, 
        c.phone as customer_phone,
        br.name as branch_name,
        fc.name as partner_company_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN branches br ON s.branch_id = br.id
      LEFT JOIN finance_companies fc ON s.finance_company_id = fc.id
      WHERE DATE(s.created_at) = DATE(?)${branchFilter}
      ORDER BY s.id DESC
    `).all(targetDate, ...branchParams);

    // Group sales by payment method / sale_type
    const cashSales = sales.filter(s => s.sale_type === 'cash');
    const cardSales = sales.filter(s => s.sale_type === 'card');
    const financeSales = sales.filter(s => s.sale_type === 'finance_company');
    const transferSales = sales.filter(s => s.sale_type === 'transfer');
    const installmentSales = sales.filter(s => s.sale_type === 'installment');

    // 2. Installments payments collected on target date
    const installmentPayments = db.prepare(`
      SELECT 
        ip.*,
        c.name as customer_name,
        c.phone as customer_phone,
        plan.sale_id,
        s.invoice_no
      FROM installment_payments ip
      JOIN installment_plans plan ON ip.installment_plan_id = plan.id
      JOIN customers c ON plan.customer_id = c.id
      LEFT JOIN sales s ON plan.sale_id = s.id
      WHERE ip.status = 'paid' AND DATE(ip.paid_date) = DATE(?)
      ORDER BY ip.id DESC
    `).all(targetDate);

    // 3. Expenses and cash out movements on target date
    const cashExpenses = db.prepare(`
      SELECT * FROM cash_box 
      WHERE type = 'out' AND DATE(created_at) = DATE(?)
      ORDER BY id DESC
    `).all(targetDate);

    // 4. Other cash inflows on target date
    const manualCashInflows = db.prepare(`
      SELECT * FROM cash_box 
      WHERE type = 'in' AND ref_type != 'sale' AND ref_type != 'installment' AND DATE(created_at) = DATE(?)
      ORDER BY id DESC
    `).all(targetDate);

    // 5. Fund transfers executed on target date
    const bankTransfers = db.prepare(`
      SELECT ft.*, f_acc.name as from_acc_name, t_acc.name as to_acc_name
      FROM fund_transfers ft
      LEFT JOIN bank_accounts f_acc ON ft.from_account_id = f_acc.id
      LEFT JOIN bank_accounts t_acc ON ft.to_account_id = t_acc.id
      WHERE DATE(ft.created_at) = DATE(?)
      ORDER BY ft.id DESC
    `).all(targetDate);

    // 6. Active or closed cashier shifts on target date
    const shifts = db.prepare(`
      SELECT cs.*, b.name as branch_name 
      FROM cashier_shifts cs
      LEFT JOIN branches b ON cs.branch_id = b.id
      WHERE DATE(cs.start_time) = DATE(?) OR DATE(cs.end_time) = DATE(?)
      ORDER BY cs.id DESC
    `).all(targetDate, targetDate);

    // 7. Aggregate Metrics
    const totalCashSalesPaid = cashSales.reduce((sum, s) => sum + (Number(s.paid_amount) || 0), 0);
    const totalInstallmentDownPayments = installmentSales.reduce((sum, s) => sum + (Number(s.paid_amount) || 0), 0);
    const totalInstallmentsCashCollected = installmentPayments
      .filter(p => p.payment_method === 'cash' || !p.payment_method)
      .reduce((sum, p) => sum + (Number(p.amount_paid) || 0), 0);
    const totalInstallmentsNonCash = installmentPayments
      .filter(p => p.payment_method && p.payment_method !== 'cash')
      .reduce((sum, p) => sum + (Number(p.amount_paid) || 0), 0);

    const totalManualCashIn = manualCashInflows.reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
    const totalCashExpenses = cashExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    // Total Cash Collected into the Drawer today
    const totalCashInflowToday = totalCashSalesPaid + totalInstallmentDownPayments + totalInstallmentsCashCollected + totalManualCashIn;
    const netCashChangeToday = totalCashInflowToday - totalCashExpenses;

    // Card (POS) Machine Metrics
    const totalCardSales = cardSales.reduce((sum, s) => sum + (Number(s.total) || 0), 0);

    // Consumer Finance Companies (valU, Contact, etc.) Detailed Grouping
    const financeCompaniesSummary = {};
    financeSales.forEach(s => {
      const compName = s.finance_company_name || s.partner_company_name || 'جهة تمويل أخرى';
      if (!financeCompaniesSummary[compName]) {
        financeCompaniesSummary[compName] = {
          company_name: compName,
          count: 0,
          gross_amount: 0,
          merchant_fees: 0,
          net_payout: 0,
          transactions: []
        };
      }
      financeCompaniesSummary[compName].count += 1;
      financeCompaniesSummary[compName].gross_amount += (Number(s.total) || 0);
      financeCompaniesSummary[compName].merchant_fees += (Number(s.merchant_fee) || 0);
      financeCompaniesSummary[compName].net_payout += (Number(s.net_payout) || 0);
      financeCompaniesSummary[compName].transactions.push({
        id: s.id,
        invoice_no: s.invoice_no,
        customer_name: s.customer_name,
        approval_code: s.finance_approval_code,
        gross: Number(s.total) || 0,
        fee: Number(s.merchant_fee) || 0,
        net: Number(s.net_payout) || 0,
        time: s.created_at
      });
    });

    const totalFinanceGross = financeSales.reduce((sum, s) => sum + (Number(s.total) || 0), 0);
    const totalFinanceFees = financeSales.reduce((sum, s) => sum + (Number(s.merchant_fee) || 0), 0);
    const totalFinanceNetPayout = financeSales.reduce((sum, s) => sum + (Number(s.net_payout) || 0), 0);

    // Bank Transfers / InstaPay
    const totalTransferSales = transferSales.reduce((sum, s) => sum + (Number(s.total) || 0), 0);

    // Gross Business Turnover today
    const totalGrossRevenue = sales.reduce((sum, s) => sum + (Number(s.total) || 0), 0) + (totalInstallmentsCashCollected + totalInstallmentsNonCash);

    res.json({
      targetDate,
      summary: {
        total_invoices_count: sales.length,
        total_gross_revenue: totalGrossRevenue,
        
        // Cash Channel
        cash: {
          sales_paid: totalCashSalesPaid,
          installment_down_payments: totalInstallmentDownPayments,
          installments_collected: totalInstallmentsCashCollected,
          manual_inflows: totalManualCashIn,
          total_cash_in: totalCashInflowToday,
          total_cash_out: totalCashExpenses,
          net_cash_drawer_flow: netCashChangeToday
        },

        // POS Cards Channel
        cards: {
          count: cardSales.length,
          total_amount: totalCardSales
        },

        // Consumer Finance Channel
        finance_companies: {
          count: financeSales.length,
          gross_amount: totalFinanceGross,
          total_merchant_fees: totalFinanceFees,
          net_store_payout: totalFinanceNetPayout,
          companies: Object.values(financeCompaniesSummary)
        },

        // Bank / Wallet Transfers
        transfers: {
          count: transferSales.length,
          total_amount: totalTransferSales
        },

        // Installment Collections
        installments: {
          count: installmentPayments.length,
          cash: totalInstallmentsCashCollected,
          non_cash: totalInstallmentsNonCash,
          total: totalInstallmentsCashCollected + totalInstallmentsNonCash
        }
      },
      itemized: {
        sales,
        cashSales,
        cardSales,
        financeSales,
        transferSales,
        installmentSales,
        installmentPayments,
        cashExpenses,
        manualCashInflows,
        bankTransfers,
        shifts
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

