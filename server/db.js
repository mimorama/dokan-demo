process.env.TZ = 'Africa/Cairo';

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const defaultDbPath = path.join(__dirname, '..', 'dokan.db');
const dbPath = process.env.DB_PATH || defaultDbPath;

// If a custom DB_PATH is specified (e.g. Render Persistent Disk /var/data/dokan.db)
// and the file doesn't exist yet, copy initial seed database so the app starts fully populated
if (dbPath !== defaultDbPath && !fs.existsSync(dbPath)) {
  const targetDir = path.dirname(dbPath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  if (fs.existsSync(defaultDbPath)) {
    try {
      fs.copyFileSync(defaultDbPath, dbPath);
      console.log(`📦 Copied initial seed database to persistent path: ${dbPath}`);
    } catch (e) {
      console.error('Failed to copy initial database:', e);
    }
  }
}

const db = new Database(dbPath);

// Enable WAL mode for performance & concurrent reads
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDb() {
  db.exec(`
    -- إعدادات المحل
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      store_name TEXT DEFAULT 'معرض دكان عبد العزيز للأجهزة الكهربائية',
      tagline TEXT DEFAULT 'ثلاجات - غسالات - شاشات - تكييفات - كاش وبالتقسيط المريح',
      phone TEXT DEFAULT '01023456789',
      phone2 TEXT DEFAULT '01123456789',
      address TEXT DEFAULT 'شارع الأزهر - أمام مجمع المحاكم - القاهرة',
      commercial_reg TEXT DEFAULT '123456',
      tax_number TEXT DEFAULT '987-654-321',
      currency TEXT DEFAULT 'ج.م',
      warranty_policy TEXT DEFAULT 'يسري الضمان من تاريخ الشراء بفاتورة المحل والسيريال نمبر المدون بالفاتورة مع شهادة ضمان الوكيل المعتمد.',
      installment_terms TEXT DEFAULT 'يلتزم المشتري بسداد الأقساط الشهرية في موعد أقصاه تاريخ الاستحقاق المحدد، والتأخير يترتب عليه اتخاذ الإجراءات القانونية المترتبة على إيصالات الأمانة.',
      logo_url TEXT DEFAULT ''
    );

    -- التصنيفات (ثلاجات، غسالات، شاشات...)
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT DEFAULT 'Package',
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- الماركات التجارية (توشيبا، إل جي، سامسونج...)
    CREATE TABLE IF NOT EXISTS brands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      country TEXT,
      agent_name TEXT,
      agent_phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- الأجهزة والمنتجات
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      brand_id INTEGER REFERENCES brands(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      model_number TEXT,
      barcode TEXT,
      specifications TEXT,
      cost_price REAL NOT NULL DEFAULT 0,
      cash_price REAL NOT NULL DEFAULT 0,
      installment_price REAL NOT NULL DEFAULT 0,
      warranty_months INTEGER DEFAULT 12,
      warranty_agency TEXT,
      alert_quantity INTEGER DEFAULT 2,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- تتبع الأرقام التسلسلية (Serial Numbers) لكل جهاز
    CREATE TABLE IF NOT EXISTS product_serials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      serial_number TEXT NOT NULL UNIQUE,
      status TEXT DEFAULT 'in_stock',
      cost_price REAL DEFAULT 0,
      sold_price REAL DEFAULT 0,
      warranty_start_date DATE,
      warranty_end_date DATE,
      sale_id INTEGER,
      purchase_id INTEGER,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- العملاء
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      phone2 TEXT,
      national_id TEXT,
      address TEXT,
      workplace TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- الضامنون
    CREATE TABLE IF NOT EXISTS guarantors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      national_id TEXT,
      address TEXT,
      workplace TEXT,
      relation TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- الموردون
    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      company TEXT,
      phone TEXT NOT NULL,
      phone2 TEXT,
      address TEXT,
      balance REAL DEFAULT 0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- الحسابات البنكية والمحافظ الإلكترونية
    CREATE TABLE IF NOT EXISTS bank_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      bank_name TEXT,
      account_number TEXT,
      type TEXT DEFAULT 'bank', -- bank, wallet, finance_partner
      balance REAL DEFAULT 0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- شركات التمويل الاستهلاكي والتقسيط البنكي (فاليو، كونتاكت، سهولة...)
    CREATE TABLE IF NOT EXISTS finance_companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      merchant_fee_rate REAL DEFAULT 0, -- نسبة عمولة الشركة %
      bank_account_id INTEGER REFERENCES bank_accounts(id),
      phone TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- فواتير المبيعات
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_no TEXT NOT NULL UNIQUE,
      customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
      sale_type TEXT DEFAULT 'cash', -- cash, installment, finance_company, card, transfer
      subtotal REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0,
      paid_amount REAL DEFAULT 0,
      remaining_amount REAL DEFAULT 0,
      finance_company_id INTEGER REFERENCES finance_companies(id),
      finance_company_name TEXT,
      finance_approval_code TEXT, -- رقم الموافقة / العملية
      merchant_fee REAL DEFAULT 0, -- قيمة عمولة الشركة الممولة
      net_payout REAL DEFAULT 0, -- الصافي المحول لحساب المعرض
      status TEXT DEFAULT 'completed',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- بنود الفاتورة مع ربط كل جهاز برقم السيريال
    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id),
      serial_id INTEGER REFERENCES product_serials(id),
      serial_number TEXT,
      unit_price REAL NOT NULL,
      cost_price REAL NOT NULL DEFAULT 0,
      warranty_months INTEGER DEFAULT 12,
      warranty_end_date DATE,
      notes TEXT
    );

    -- خطة الأقساط (عقد التقسيط المباشر من المعرض)
    CREATE TABLE IF NOT EXISTS installment_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
      customer_id INTEGER NOT NULL REFERENCES customers(id),
      guarantor_id INTEGER REFERENCES guarantors(id),
      total_cash_price REAL NOT NULL,
      down_payment REAL NOT NULL DEFAULT 0,
      financed_amount REAL NOT NULL,
      profit_rate REAL DEFAULT 0,
      profit_amount REAL DEFAULT 0,
      total_installment_amount REAL NOT NULL,
      remaining_balance REAL NOT NULL,
      installments_count INTEGER NOT NULL,
      monthly_amount REAL NOT NULL,
      start_date DATE NOT NULL,
      status TEXT DEFAULT 'active',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- جدول الأقساط الشهرية
    CREATE TABLE IF NOT EXISTS installment_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      installment_plan_id INTEGER NOT NULL REFERENCES installment_plans(id) ON DELETE CASCADE,
      installment_no INTEGER NOT NULL,
      due_date DATE NOT NULL,
      amount_due REAL NOT NULL,
      amount_paid REAL DEFAULT 0,
      status TEXT DEFAULT 'pending',
      paid_date DATE,
      payment_method TEXT DEFAULT 'cash',
      receipt_no TEXT,
      notes TEXT
    );

    -- فواتير المشتريات
    CREATE TABLE IF NOT EXISTS purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_no TEXT NOT NULL,
      supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
      total_amount REAL NOT NULL DEFAULT 0,
      paid_amount REAL DEFAULT 0,
      remaining_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'completed',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- المصروفات العامة
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      notes TEXT,
      expense_date DATE DEFAULT (DATE('now')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- حركة الخزينة النقدية (وارد ومنصرف)
    CREATE TABLE IF NOT EXISTS cash_box (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL, -- in, out
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      ref_type TEXT,
      ref_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- التحويلات المالية بين الخزينة والبنوك، أو بين الحسابات
    CREATE TABLE IF NOT EXISTS fund_transfers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_type TEXT NOT NULL, -- 'cashbox', 'bank'
      from_account_id INTEGER REFERENCES bank_accounts(id),
      to_type TEXT NOT NULL, -- 'cashbox', 'bank'
      to_account_id INTEGER REFERENCES bank_accounts(id),
      amount REAL NOT NULL,
      fee REAL DEFAULT 0,
      transfer_date DATE DEFAULT (DATE('now')),
      reference_no TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- فروع المعرض
    CREATE TABLE IF NOT EXISTS branches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE,
      phone TEXT,
      address TEXT,
      manager_name TEXT,
      is_main INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- المخازن التابعة للفروع
    CREATE TABLE IF NOT EXISTS warehouses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      code TEXT UNIQUE,
      location TEXT,
      manager_name TEXT,
      phone TEXT,
      is_default INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- التحويلات المخزنية بين الفروع والمخازن
    CREATE TABLE IF NOT EXISTS stock_transfers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transfer_no TEXT NOT NULL UNIQUE,
      from_warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
      to_warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
      transfer_date DATE DEFAULT (DATE('now')),
      status TEXT DEFAULT 'completed', -- completed, pending, cancelled
      total_items INTEGER DEFAULT 1,
      notes TEXT,
      created_by TEXT DEFAULT 'مسؤول المخزن',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- تفاصيل الأجهزة المنقولة بين المخازن
    CREATE TABLE IF NOT EXISTS stock_transfer_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transfer_id INTEGER NOT NULL REFERENCES stock_transfers(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id),
      serial_id INTEGER REFERENCES product_serials(id),
      serial_number TEXT,
      notes TEXT
    );

    -- المستخدمون وصلاحيات النظام
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'cashier', -- admin, manager, cashier, storekeeper, accountant
      branch_id INTEGER REFERENCES branches(id),
      warehouse_id INTEGER REFERENCES warehouses(id),
      phone TEXT,
      status TEXT DEFAULT 'active', -- active, inactive
      permissions TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- طلبات النواقص والاحتياجات بين الفروع والمخازن
    CREATE TABLE IF NOT EXISTS stock_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_no TEXT NOT NULL UNIQUE,
      branch_id INTEGER NOT NULL REFERENCES branches(id),
      from_warehouse_id INTEGER REFERENCES warehouses(id),
      requested_by TEXT,
      urgency TEXT DEFAULT 'normal', -- normal, urgent, critical
      status TEXT DEFAULT 'pending', -- pending, approved, fulfilled, rejected
      notes TEXT,
      fulfilled_transfer_id INTEGER REFERENCES stock_transfers(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- تفاصيل بنود طلب النواقص
    CREATE TABLE IF NOT EXISTS stock_request_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_id INTEGER NOT NULL REFERENCES stock_requests(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id),
      quantity INTEGER NOT NULL DEFAULT 1,
      fulfilled_quantity INTEGER DEFAULT 0,
      notes TEXT
    );

    -- الإشعارات والتنبيهات المتبادلة بين الفروع والمخازن والتحويلات
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL, -- 'stock_transfer', 'stock_request', 'low_stock', 'system'
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      entity_type TEXT, -- 'stock_transfer', 'stock_request', 'product', 'branch'
      entity_id INTEGER,
      from_branch_id INTEGER REFERENCES branches(id),
      to_branch_id INTEGER REFERENCES branches(id),
      from_warehouse_id INTEGER REFERENCES warehouses(id),
      to_warehouse_id INTEGER REFERENCES warehouses(id),
      urgency TEXT DEFAULT 'normal', -- 'normal', 'urgent', 'critical'
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 1. ورديات الكاشير وتقفيل الدرج اليومي (Z-Report)
    CREATE TABLE IF NOT EXISTS cashier_shifts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shift_no TEXT NOT NULL UNIQUE,
      user_id INTEGER NOT NULL REFERENCES users(id),
      user_name TEXT,
      branch_id INTEGER REFERENCES branches(id),
      start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      end_time DATETIME,
      opening_balance REAL DEFAULT 0,
      cash_sales REAL DEFAULT 0,
      cash_installments REAL DEFAULT 0,
      cash_inflows REAL DEFAULT 0,
      cash_expenses REAL DEFAULT 0,
      expected_cash REAL DEFAULT 0,
      actual_cash REAL DEFAULT 0,
      difference REAL DEFAULT 0, -- actual_cash - expected_cash (negative = deficit, positive = surplus)
      status TEXT DEFAULT 'open', -- open, closed
      closed_by TEXT,
      notes TEXT
    );

    -- 2. سجل الرقابة والتدقيق للأنشطة الحساسة (Audit Activity Trail)
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      user_name TEXT,
      user_role TEXT,
      action_type TEXT NOT NULL,
      target_type TEXT,
      target_id TEXT,
      description TEXT NOT NULL,
      details TEXT, -- JSON payload
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 3. الجرد الدوري الآلي ومطابقة السيريالات (Cycle Counting & Physical Inventory Audit)
    CREATE TABLE IF NOT EXISTS inventory_audits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      audit_no TEXT NOT NULL UNIQUE,
      warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
      auditor_name TEXT,
      total_expected INTEGER DEFAULT 0,
      total_scanned INTEGER DEFAULT 0,
      matched_count INTEGER DEFAULT 0,
      missing_count INTEGER DEFAULT 0,
      surplus_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'completed', -- draft, completed, reconciled
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS inventory_audit_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      audit_id INTEGER NOT NULL REFERENCES inventory_audits(id) ON DELETE CASCADE,
      serial_number TEXT NOT NULL,
      product_id INTEGER,
      product_name TEXT,
      status TEXT NOT NULL, -- matched, missing, surplus
      notes TEXT
    );

    -- 4. مرتجعات المبيعات واسترداد الأموال (Sales Returns & Refunds)
    CREATE TABLE IF NOT EXISTS sale_returns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      return_no TEXT NOT NULL UNIQUE,
      sale_id INTEGER NOT NULL REFERENCES sales(id),
      customer_id INTEGER REFERENCES customers(id),
      return_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      refund_amount REAL NOT NULL DEFAULT 0,
      refund_method TEXT DEFAULT 'cash', -- cash, bank, credit
      reason TEXT,
      condition TEXT DEFAULT 'good', -- good (in_stock), damaged (damaged), outlet (outlet)
      processed_by TEXT,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS sale_return_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      return_id INTEGER NOT NULL REFERENCES sale_returns(id) ON DELETE CASCADE,
      sale_item_id INTEGER,
      product_id INTEGER NOT NULL REFERENCES products(id),
      serial_number TEXT,
      refund_price REAL NOT NULL DEFAULT 0,
      restock_status TEXT DEFAULT 'in_stock',
      notes TEXT
    );
  `);

  // Safe migrations for newly added columns if table existed
  try { db.exec('ALTER TABLE sales ADD COLUMN finance_company_id INTEGER'); } catch (_) {}
  try { db.exec('ALTER TABLE sales ADD COLUMN finance_company_name TEXT'); } catch (_) {}
  try { db.exec('ALTER TABLE sales ADD COLUMN finance_approval_code TEXT'); } catch (_) {}
  try { db.exec('ALTER TABLE sales ADD COLUMN merchant_fee REAL DEFAULT 0'); } catch (_) {}
  try { db.exec('ALTER TABLE sales ADD COLUMN net_payout REAL DEFAULT 0'); } catch (_) {}
  try { db.exec('ALTER TABLE sales ADD COLUMN branch_id INTEGER'); } catch (_) {}
  try { db.exec('ALTER TABLE sales ADD COLUMN warehouse_id INTEGER'); } catch (_) {}
  try { db.exec("ALTER TABLE sales ADD COLUMN review_status TEXT DEFAULT 'pending_review'"); } catch (_) {}
  try { db.exec("ALTER TABLE sales ADD COLUMN reviewed_by TEXT"); } catch (_) {}
  try { db.exec("ALTER TABLE sales ADD COLUMN reviewed_at DATETIME"); } catch (_) {}
  try { db.exec("ALTER TABLE sales ADD COLUMN audit_notes TEXT"); } catch (_) {}
  try { db.exec("ALTER TABLE sales ADD COLUMN return_status TEXT DEFAULT 'none'"); } catch (_) {}
  try { db.exec("ALTER TABLE sales ADD COLUMN returned_amount REAL DEFAULT 0"); } catch (_) {}
  try { db.exec("ALTER TABLE sales ADD COLUMN sales_rep_id INTEGER"); } catch (_) {}
  try { db.exec("ALTER TABLE sales ADD COLUMN sales_rep_name TEXT"); } catch (_) {}
  try { db.exec("ALTER TABLE sales ADD COLUMN commission_amount REAL DEFAULT 0"); } catch (_) {}

  try { db.exec('ALTER TABLE product_serials ADD COLUMN warehouse_id INTEGER'); } catch (_) {}
  try { db.exec('ALTER TABLE purchases ADD COLUMN warehouse_id INTEGER'); } catch (_) {}
  try { db.exec("ALTER TABLE purchases ADD COLUMN review_status TEXT DEFAULT 'pending_review'"); } catch (_) {}
  try { db.exec("ALTER TABLE purchases ADD COLUMN reviewed_by TEXT"); } catch (_) {}
  try { db.exec("ALTER TABLE purchases ADD COLUMN reviewed_at DATETIME"); } catch (_) {}
  try { db.exec("ALTER TABLE purchases ADD COLUMN audit_notes TEXT"); } catch (_) {}

  try { db.exec("ALTER TABLE customers ADD COLUMN credit_score TEXT DEFAULT 'A'"); } catch (_) {}
  try { db.exec("ALTER TABLE customers ADD COLUMN max_credit_limit REAL DEFAULT 50000"); } catch (_) {}
  try { db.exec("ALTER TABLE customers ADD COLUMN is_blacklisted INTEGER DEFAULT 0"); } catch (_) {}
  try { db.exec("ALTER TABLE customers ADD COLUMN blacklist_reason TEXT"); } catch (_) {}

  try { db.exec("ALTER TABLE products ADD COLUMN min_stock_alert INTEGER DEFAULT 2"); } catch (_) {}
  try { db.exec("ALTER TABLE products ADD COLUMN outlet_price REAL DEFAULT 0"); } catch (_) {}
  try { db.exec("ALTER TABLE products ADD COLUMN outlet_notes TEXT"); } catch (_) {}

  try { db.exec("ALTER TABLE settings ADD COLUMN max_cashier_discount_percent REAL DEFAULT 5.0"); } catch (_) {}
  try { db.exec("ALTER TABLE settings ADD COLUMN max_cashier_discount_amount REAL DEFAULT 500.0"); } catch (_) {}
  try { db.exec("ALTER TABLE settings ADD COLUMN manager_override_pin TEXT DEFAULT '1234'"); } catch (_) {}

  // Seed default users if empty
  const usersCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (usersCount === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (username, password, name, role, branch_id, phone, status)
      VALUES (@username, @password, @name, @role, @branch_id, @phone, 'active')
    `);

    [
      { username: 'admin', password: '123', name: 'الحاج عبد العزيز (المدير العام)', role: 'admin', branch_id: 1, phone: '01023456789' },
      { username: 'faisal_mgr', password: '123', name: 'أحمد عبد العزيز (مدير فرع فيصل)', role: 'manager', branch_id: 2, phone: '01155443322' },
      { username: 'cashier1', password: '123', name: 'محمود صابر (كاشير ومبيعات)', role: 'cashier', branch_id: 1, phone: '01011122233' },
      { username: 'store1', password: '123', name: 'سعيد النجار (أمين المستودع المركزي)', role: 'storekeeper', branch_id: 1, phone: '01099881122' },
      { username: 'accountant1', password: '123', name: 'أ / سامح حسني (مراجع الحسابات والمالية)', role: 'accountant', branch_id: 1, phone: '01233445566' }
    ].forEach(u => insertUser.run(u));
  }

  // Ensure default settings record exists & logo is set
  const settingsCount = db.prepare('SELECT COUNT(*) as count FROM settings').get().count;
  if (settingsCount === 0) {
    db.prepare('INSERT INTO settings (id, logo_url) VALUES (1, "/logo.svg")').run();
  } else {
    try {
      const sett = db.prepare('SELECT logo_url FROM settings WHERE id = 1').get();
      if (!sett || !sett.logo_url) {
        db.prepare('UPDATE settings SET logo_url = "/logo.svg" WHERE id = 1').run();
      }
    } catch (_) {}
  }

  // Seed default branches if empty
  const branchesCount = db.prepare('SELECT COUNT(*) as count FROM branches').get().count;
  if (branchesCount === 0) {
    const insertBranch = db.prepare(`
      INSERT INTO branches (id, name, code, phone, address, manager_name, is_main, notes)
      VALUES (@id, @name, @code, @phone, @address, @manager_name, @is_main, @notes)
    `);

    [
      { id: 1, name: 'معرض الأزهر الرئيسي', code: 'BR-AZHAR-01', phone: '01023456789', address: 'شارع الأزهر - أمام مجمع المحاكم - القاهرة', manager_name: 'الحاج عبد العزيز', is_main: 1, notes: 'الفرع والمقر الرئيسي للمعرض' },
      { id: 2, name: 'فرع فيصل والجيزة', code: 'BR-FAISAL-02', phone: '01155443322', address: 'شارع فيصل الرئيسي - محطة العشرين - الجيزة', manager_name: 'أحمد عبد العزيز', is_main: 0, notes: 'فرع مبيعات قطاعي وتقسيط' },
      { id: 3, name: 'فرع مدينة نصر', code: 'BR-NASR-03', phone: '01299887766', address: 'شارع مكرم عبيد - مدينة نصر - القاهرة', manager_name: 'محمود رمضان', is_main: 0, notes: 'صالة عرض كبرى' }
    ].forEach(b => insertBranch.run(b));
  }

  // Seed default warehouses if empty
  const warehousesCount = db.prepare('SELECT COUNT(*) as count FROM warehouses').get().count;
  if (warehousesCount === 0) {
    const insertWarehouse = db.prepare(`
      INSERT INTO warehouses (id, branch_id, name, code, location, manager_name, phone, is_default, notes)
      VALUES (@id, @branch_id, @name, @code, @location, @manager_name, @phone, @is_default, @notes)
    `);

    [
      { id: 1, branch_id: 1, name: 'مخزن صالة العرض (الأزهر)', code: 'WH-AZHAR-01', location: 'صالة العرض بالمعرض الرئيسي', manager_name: 'محمد صابر', phone: '01011122233', is_default: 1, notes: 'المخزن الافتراضي لصالة العرض بالأزهر' },
      { id: 2, branch_id: 1, name: 'المستودع المركزي للبضائع (العاشر من رمضان)', code: 'WH-CENTRAL', location: 'المنطقة الصناعية B3 - العاشر من رمضان', manager_name: 'سعيد النجار', phone: '01099881122', is_default: 0, notes: 'مستودع الاستلام وتوزيع الشحنات الكبرى' },
      { id: 3, branch_id: 2, name: 'مخزن فرع فيصل', code: 'WH-FAISAL', location: 'بدروم المعرض - شارع فيصل', manager_name: 'إبراهيم كمال', phone: '01144332211', is_default: 0, notes: 'مخزن تسليم فوري لزبائن فيصل' },
      { id: 4, branch_id: 3, name: 'مخزن فرع مدينة نصر', code: 'WH-NASR', location: 'المخزن الخلفي - مكرم عبيد', manager_name: 'ياسر جودة', phone: '01233445566', is_default: 0, notes: 'مخزن أجهزة الشاشات والتكييفات' }
    ].forEach(w => insertWarehouse.run(w));

    // Assign existing serials to default warehouse (WH 1)
    db.prepare('UPDATE product_serials SET warehouse_id = 1 WHERE warehouse_id IS NULL').run();
  }

  // Seed default bank accounts if empty
  const accountsCount = db.prepare('SELECT COUNT(*) as count FROM bank_accounts').get().count;
  if (accountsCount === 0) {
    const insertAccount = db.prepare(`
      INSERT INTO bank_accounts (id, name, bank_name, account_number, type, balance, notes)
      VALUES (@id, @name, @bank_name, @account_number, @type, @balance, @notes)
    `);

    [
      { id: 1, name: 'حساب البنك الأهلي المصري (الرئيسي)', bank_name: 'البنك الأهلي المصري', account_number: '1002345678901', type: 'bank', balance: 125000, notes: 'حساب جاري المعرض' },
      { id: 2, name: 'حساب بنك CIB التجاري الدولي', bank_name: 'CIB', account_number: '1000987654321', type: 'bank', balance: 65000, notes: 'حساب تحصيلات الفيزا والتقسيط' },
      { id: 3, name: 'محفظة انستاباي وفودافون كاش المعرض', bank_name: 'InstaPay / فودافون كاش', account_number: '01023456789', type: 'wallet', balance: 18500, notes: 'تحويلات لحظية من الزبائن' },
      { id: 4, name: 'مستحقات شركة فاليو (valU)', bank_name: 'فاليو - EFG', account_number: 'VALU-MERCH-8821', type: 'finance_partner', balance: 42000, notes: 'مستحقات معلقة لتحويل فاليو' },
      { id: 5, name: 'مستحقات شركة كونتاكت (Contact)', bank_name: 'كونتاكت للتمويل', account_number: 'CNT-MERCH-4412', type: 'finance_partner', balance: 28500, notes: 'مستحقات تقسيط كونتاكت' }
    ].forEach(acc => insertAccount.run(acc));
  }

  // Seed default finance companies if empty
  const financeCount = db.prepare('SELECT COUNT(*) as count FROM finance_companies').get().count;
  if (financeCount === 0) {
    const insertFinance = db.prepare(`
      INSERT INTO finance_companies (name, merchant_fee_rate, bank_account_id, phone, notes)
      VALUES (@name, @merchant_fee_rate, @bank_account_id, @phone, @notes)
    `);

    [
      { name: 'فاليو (valU)', merchant_fee_rate: 2.5, bank_account_id: 4, phone: '16671', notes: 'تمويل استهلاكي 3 إلى 60 شهر' },
      { name: 'كونتاكت (Contact Financial)', merchant_fee_rate: 2.0, bank_account_id: 5, phone: '16177', notes: 'تقسيط أجهزة منزلية وإلكترونيات' },
      { name: 'سهولة (Souhoola)', merchant_fee_rate: 2.0, bank_account_id: 1, phone: '16908', notes: 'شريكة تمويل استهلاكي' },
      { name: 'أمان للتقسيط (Aman)', merchant_fee_rate: 3.0, bank_account_id: 1, phone: '19910', notes: 'تقسيط أمان حتى 36 شهر' },
      { name: 'فرصة (Forsa)', merchant_fee_rate: 2.5, bank_account_id: 1, phone: '19477', notes: 'تمويل استهلاكي' },
      { name: 'تقسيط فيزا CIB (بدون فوائد)', merchant_fee_rate: 1.5, bank_account_id: 2, phone: '19666', notes: 'تقسيط بطاقات ائتمان CIB' },
      { name: 'تقسيط فيزا البنك الأهلي المصري', merchant_fee_rate: 1.5, bank_account_id: 1, phone: '19623', notes: 'تقسيط بطاقات ائتمان الأهلي' },
    ].forEach(comp => insertFinance.run(comp));
  }

  // Safe Migrations for bank_accounts and finance_companies
  try { db.exec("ALTER TABLE bank_accounts ADD COLUMN is_active INTEGER DEFAULT 1"); } catch (e) {}
  try { db.exec("ALTER TABLE finance_companies ADD COLUMN is_active INTEGER DEFAULT 1"); } catch (e) {}
  // Auto-seed demo products and data if products table is empty
  const productsCount = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
  if (productsCount === 0) {
    try {
      const seed = require('./seed');
      seed();
    } catch (err) {
      console.error('Auto-seed notice:', err.message);
    }
  }
}

module.exports = db;
initDb();
