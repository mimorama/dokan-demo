const db = require('./db');

function seed() {
  console.log('🌱 جاري إضافة البيانات الأولية لمعرض الأجهزة الكهربائية...');

  // 1. Categories
  const categories = [
    { name: 'ثلاجات وديب فريزر', icon: 'Refrigerator', description: 'ثلاجات بابين، 4 باب، ديب فريزر رأسي وأفقي' },
    { name: 'غسالات ومجففات', icon: 'WashingMachine', description: 'غسالات أوتوماتيك، فوق أوتوماتيك، نص أوتوماتيك، ومجففات' },
    { name: 'شاشات وتلفزيونات', icon: 'Tv', description: 'شاشات سمارت 4K و OLED بمختلف المقاسات من 32 إلى 75 بوصة' },
    { name: 'تكييفات ومبردات هواء', icon: 'Wind', description: 'تكييفات سبليت انفرتر، مبردات مياه، مراوح حائط وعامود' },
    { name: 'بوتاجازات وأفران', icon: 'Flame', description: 'بوتاجازات 4 و 5 شعلة، أفران بلت إن، مسطحات غاز وكهرباء' },
    { name: 'أجهزة مطبخ ومنزل صغيرة', icon: 'Microwave', description: 'ميكروويف، مكانس، خلاطات، قلايات هوائية، دفايات' }
  ];

  const insertCategory = db.prepare('INSERT OR IGNORE INTO categories (id, name, icon, description) VALUES (@id, @name, @icon, @description)');
  categories.forEach((cat, idx) => {
    insertCategory.run({ id: idx + 1, ...cat });
  });

  // 2. Brands
  const brands = [
    { name: 'توشيبا (Toshiba)', country: 'اليابان / تصنيع مصري', agent_name: 'مجموعة العربي', agent_phone: '19319' },
    { name: 'إل جي (LG)', country: 'كوريا الجنوبية', agent_name: 'إل جي مصر', agent_phone: '19960' },
    { name: 'سامسونج (Samsung)', country: 'كوريا الجنوبية', agent_name: 'سامسونج للإلكترونيات', agent_phone: '16580' },
    { name: 'شارب (Sharp)', country: 'اليابان', agent_name: 'مجموعة العربي', agent_phone: '19319' },
    { name: 'بيكو (Beko)', country: 'تركيا', agent_name: 'بيكو مصر', agent_phone: '16614' },
    { name: 'فريش (Fresh)', country: 'مصر', agent_name: 'شركة فريش للأجهزة الكهربائية', agent_phone: '19059' },
    { name: 'تورنيدو (Tornado)', country: 'مصر / ياباني', agent_name: 'مجموعة العربي', agent_phone: '19319' },
    { name: 'كريازي (Kiriazi)', country: 'مصر', agent_name: 'مجموعة كريازي', agent_phone: '19008' }
  ];

  const insertBrand = db.prepare('INSERT OR IGNORE INTO brands (id, name, country, agent_name, agent_phone) VALUES (@id, @name, @country, @agent_name, @agent_phone)');
  brands.forEach((brand, idx) => {
    insertBrand.run({ id: idx + 1, ...brand });
  });

  // 3. Products
  const products = [
    {
      id: 1,
      category_id: 1,
      brand_id: 1, // Toshiba
      name: 'ثلاجة توشيبا 16 قدم نوفروست سيلفر 2 باب',
      model_number: 'GR-EF40P-H-S',
      barcode: '622115501001',
      specifications: 'سعة 378 لتر - أرفف زجاجية متينة - فلتر بلاتينيوم منقي للروائح - ضمان 10 سنوات شامل',
      cost_price: 24500,
      cash_price: 27800,
      installment_price: 32000,
      warranty_months: 120, // 10 years
      warranty_agency: 'العربي جروب (19319)',
      alert_quantity: 2
    },
    {
      id: 2,
      category_id: 1,
      brand_id: 2, // LG
      name: 'ثلاجة إل جي 18 قدم نوفروست سمارت انفرتر بالصنبور ديجيتال',
      model_number: 'GN-B592SLC',
      barcode: '622115501002',
      specifications: 'سعة 437 لتر - كمبروسور انفرتر ذكي موفر للطاقة - صنبور مياه خارجي - تدفق هواء متعدد - شاشة تحكم خارجية',
      cost_price: 38000,
      cash_price: 43500,
      installment_price: 49500,
      warranty_months: 120,
      warranty_agency: 'إل جي مصر (19960)',
      alert_quantity: 2
    },
    {
      id: 3,
      category_id: 2,
      brand_id: 2, // LG
      name: 'غسالة ملابس إل جي 8 كيلو أوتوماتيك بالمجفف بالبخار سيلفر',
      model_number: 'FH4G6VDGG6',
      barcode: '622115502001',
      specifications: '8 كجم غسيل و 5 كجم تجفيف - موتور Direct Drive بالدفع المباشر بدون سير - تقنية البخار للقضاء على الحساسية 99.9%',
      cost_price: 29000,
      cash_price: 33500,
      installment_price: 38500,
      warranty_months: 60, // 5 years
      warranty_agency: 'إل جي مصر (19960)',
      alert_quantity: 3
    },
    {
      id: 4,
      category_id: 2,
      brand_id: 1, // Toshiba
      name: 'غسالة ملابس توشيبا 10 كيلو فوق أوتوماتيك طلمبة سيلفر',
      model_number: 'AEW-E1050SUP',
      barcode: '622115502002',
      specifications: 'سعة 10 كجم - حلة استانلس ستيل دائرية - مدخلين للمياه ساخن وبارد - كفاءة استهلاك طاقة عالية (أ)',
      cost_price: 15200,
      cash_price: 17800,
      installment_price: 20500,
      warranty_months: 60,
      warranty_agency: 'العربي جروب (19319)',
      alert_quantity: 2
    },
    {
      id: 5,
      category_id: 3,
      brand_id: 3, // Samsung
      name: 'شاشة سامسونج 55 بوصة Crystal UHD 4K Smart TV',
      model_number: 'UA55CU7000',
      barcode: '622115503001',
      specifications: 'دقة 4K فائقة الوضوح (3840x2160) - معالج كريستال 4K - نظام تايزن الذكي - ريسيفر داخلي مدمج - دعم HDR10+',
      cost_price: 18500,
      cash_price: 21500,
      installment_price: 25000,
      warranty_months: 24, // 2 years
      warranty_agency: 'سامسونج للإلكترونيات (16580)',
      alert_quantity: 3
    },
    {
      id: 6,
      category_id: 3,
      brand_id: 2, // LG
      name: 'شاشة إل جي 65 بوصة 4K UHD الذكية مع ريموت ماجيك',
      model_number: '65UQ75006LF',
      barcode: '622115503002',
      specifications: 'دقة 4K حقيقية - معالج ألفا 5 الجيل الخامس - ريموت الماجيك السحري بالحركة والصوت - WebOS',
      cost_price: 26000,
      cash_price: 29900,
      installment_price: 34500,
      warranty_months: 24,
      warranty_agency: 'إل جي مصر (19960)',
      alert_quantity: 2
    },
    {
      id: 7,
      category_id: 4,
      brand_id: 4, // Sharp
      name: 'تكييف شارب 1.5 حصان بارد ساخن انفرتر بلازما كلاستر سيلفر',
      model_number: 'AY-XP12UHE',
      barcode: '622115504001',
      specifications: 'توفير طاقة حتى 60% بفضل تقنية الانفرتر - خاصية التبريد فائق السرعة Super Jet - منقي هواء بلازما كلاستر - شاشة رقمية',
      cost_price: 25500,
      cash_price: 28900,
      installment_price: 33000,
      warranty_months: 60,
      warranty_agency: 'العربي جروب (19319)',
      alert_quantity: 2
    },
    {
      id: 8,
      category_id: 5,
      brand_id: 6, // Fresh
      name: 'بوتاجاز فريش بروفيشنال كنترول 5 شعلة استانلس كامل 60×90 سم',
      model_number: 'PRFC90',
      barcode: '622115505001',
      specifications: 'أمان كامل للشعلات والفرن - إشعال ذاتي - شواية ومروحة لتوزيع الحرارة - حوامل أواني زهر متينة - تايمر تاتش',
      cost_price: 13500,
      cash_price: 15600,
      installment_price: 18000,
      warranty_months: 60,
      warranty_agency: 'فريش مصر (19059)',
      alert_quantity: 2
    },
    {
      id: 9,
      category_id: 6,
      brand_id: 7, // Tornado
      name: 'مكنسة كهربائية تورنيدو 2000 وات كيس قماش كبير',
      model_number: 'TVC-2000',
      barcode: '622115506001',
      specifications: 'قوة 2000 وات شفط قوي - كيس قماش سعة 5 لتر سهل الغسيل والتنظيف - فلتر مضاد للبكتيريا - سلك 7 متر مع بكرة أوتوماتيك',
      cost_price: 3200,
      cash_price: 3950,
      installment_price: 4500,
      warranty_months: 24,
      warranty_agency: 'العربي جروب (19319)',
      alert_quantity: 4
    }
  ];

  const insertProduct = db.prepare(`
    INSERT OR REPLACE INTO products (
      id, category_id, brand_id, name, model_number, barcode, specifications,
      cost_price, cash_price, installment_price, warranty_months, warranty_agency, alert_quantity
    ) VALUES (
      @id, @category_id, @brand_id, @name, @model_number, @barcode, @specifications,
      @cost_price, @cash_price, @installment_price, @warranty_months, @warranty_agency, @alert_quantity
    )
  `);

  products.forEach(p => insertProduct.run(p));

  // 4. Product Serials (تتبع الأرقام التسلسلية لكل جهاز)
  const serials = [
    // ثلاجة توشيبا (id: 1)
    { product_id: 1, serial_number: 'TSH-REF-9082101', status: 'in_stock', cost_price: 24500 },
    { product_id: 1, serial_number: 'TSH-REF-9082102', status: 'in_stock', cost_price: 24500 },
    { product_id: 1, serial_number: 'TSH-REF-9082103', status: 'in_stock', cost_price: 24500 },
    { product_id: 1, serial_number: 'TSH-REF-9082104', status: 'sold', cost_price: 24500, sold_price: 27800, warranty_start_date: '2026-08-15', warranty_end_date: '2036-08-15' },

    // ثلاجة إل جي (id: 2)
    { product_id: 2, serial_number: 'LG-REF-592811', status: 'in_stock', cost_price: 38000 },
    { product_id: 2, serial_number: 'LG-REF-592812', status: 'in_stock', cost_price: 38000 },

    // غسالة إل جي 8ك (id: 3)
    { product_id: 3, serial_number: 'LG-WSH-800411', status: 'in_stock', cost_price: 29000 },
    { product_id: 3, serial_number: 'LG-WSH-800412', status: 'in_stock', cost_price: 29000 },
    { product_id: 3, serial_number: 'LG-WSH-800413', status: 'sold', cost_price: 29000, sold_price: 38500, warranty_start_date: '2026-09-01', warranty_end_date: '2031-09-01' },

    // غسالة توشيبا 10ك (id: 4)
    { product_id: 4, serial_number: 'TSH-WSH-10501', status: 'in_stock', cost_price: 15200 },
    { product_id: 4, serial_number: 'TSH-WSH-10502', status: 'in_stock', cost_price: 15200 },
    { product_id: 4, serial_number: 'TSH-WSH-10503', status: 'in_stock', cost_price: 15200 },

    // شاشة سامسونج 55 (id: 5)
    { product_id: 5, serial_number: 'SAM-TV55-7001', status: 'in_stock', cost_price: 18500 },
    { product_id: 5, serial_number: 'SAM-TV55-7002', status: 'in_stock', cost_price: 18500 },
    { product_id: 5, serial_number: 'SAM-TV55-7003', status: 'sold', cost_price: 18500, sold_price: 21500, warranty_start_date: '2026-09-10', warranty_end_date: '2028-09-10' },

    // شاشة إل جي 65 (id: 6)
    { product_id: 6, serial_number: 'LG-TV65-9011', status: 'in_stock', cost_price: 26000 },
    { product_id: 6, serial_number: 'LG-TV65-9012', status: 'in_stock', cost_price: 26000 },

    // تكييف شارب (id: 7)
    { product_id: 7, serial_number: 'SHP-AC-12U01', status: 'in_stock', cost_price: 25500 },
    { product_id: 7, serial_number: 'SHP-AC-12U02', status: 'in_stock', cost_price: 25500 },

    // بوتاجاز فريش (id: 8)
    { product_id: 8, serial_number: 'FRS-STV-9001', status: 'in_stock', cost_price: 13500 },
    { product_id: 8, serial_number: 'FRS-STV-9002', status: 'in_stock', cost_price: 13500 },

    // مكنسة تورنيدو (id: 9)
    { product_id: 9, serial_number: 'TOR-VAC-2001', status: 'in_stock', cost_price: 3200 },
    { product_id: 9, serial_number: 'TOR-VAC-2002', status: 'in_stock', cost_price: 3200 },
    { product_id: 9, serial_number: 'TOR-VAC-2003', status: 'in_stock', cost_price: 3200 }
  ];

  const insertSerial = db.prepare(`
    INSERT OR REPLACE INTO product_serials (
      product_id, serial_number, status, cost_price, sold_price,
      warranty_start_date, warranty_end_date
    ) VALUES (
      @product_id, @serial_number, @status, @cost_price, @sold_price,
      @warranty_start_date, @warranty_end_date
    )
  `);

  serials.forEach(s => insertSerial.run({
    product_id: s.product_id,
    serial_number: s.serial_number,
    status: s.status,
    cost_price: s.cost_price,
    sold_price: s.sold_price || 0,
    warranty_start_date: s.warranty_start_date || null,
    warranty_end_date: s.warranty_end_date || null
  }));

  // 5. Customers & Guarantors
  const customers = [
    {
      id: 1,
      name: 'أحمد محمود عبد الرحمن',
      phone: '01012345678',
      phone2: '01198765432',
      national_id: '28910151234567',
      address: 'القاهرة - المعادي - شارع النصر عمارة 14',
      workplace: 'موظف بوزارة التربية والتعليم',
      notes: 'عميل منتظم بالسداد، اشترى غسالة بالتقسيط'
    },
    {
      id: 2,
      name: 'محمود السيد إبراهيم',
      phone: '01223456789',
      phone2: '01511223344',
      national_id: '28503201456789',
      address: 'الجيزة - الدقي - شارع مصدق',
      workplace: 'مهندس بشركة بترول',
      notes: 'عميل كاش معتمد'
    },
    {
      id: 3,
      name: 'سارة خالد النجار',
      phone: '01099887766',
      phone2: '01122334455',
      national_id: '29208051654321',
      address: 'حلوان - ش راغب باشا برج الرواد',
      workplace: 'طبيبة صيدلانية',
      notes: 'تجهز شقة الزوجية - خطة تقسيط 18 شهر'
    }
  ];

  const insertCustomer = db.prepare(`
    INSERT OR REPLACE INTO customers (id, name, phone, phone2, national_id, address, workplace, notes)
    VALUES (@id, @name, @phone, @phone2, @national_id, @address, @workplace, @notes)
  `);
  customers.forEach(c => insertCustomer.run(c));

  // Guarantors
  const guarantors = [
    {
      id: 1,
      customer_id: 1,
      name: 'إبراهيم محمود عبد الرحمن',
      phone: '01055566677',
      national_id: '29104051239874',
      address: 'المعادي - شارع 9',
      workplace: 'محاسب ببنك القاهرة',
      relation: 'شقيق العميل'
    },
    {
      id: 2,
      customer_id: 3,
      name: 'خالد محمد النجار',
      phone: '01288899900',
      national_id: '26501011567890',
      address: 'حلوان - ش راغب باشا',
      workplace: 'موجه أول لغة عربية بالمعاش',
      relation: 'والد العميل'
    }
  ];

  const insertGuarantor = db.prepare(`
    INSERT OR REPLACE INTO guarantors (id, customer_id, name, phone, national_id, address, workplace, relation)
    VALUES (@id, @customer_id, @name, @phone, @national_id, @address, @workplace, @relation)
  `);
  guarantors.forEach(g => insertGuarantor.run(g));

  // 6. Suppliers
  const suppliers = [
    {
      id: 1,
      name: 'مجموعة العربي للتجارة والتوزيع',
      company: 'مجموعة العربي (توشيبا - شارب - تورنيدو)',
      phone: '19319',
      phone2: '0225789000',
      address: 'قليوب - طريق مصر إسكندرية الزراعي',
      balance: 45000,
      notes: 'الموزع المعتمد لأجهزة توشيبا وشارب'
    },
    {
      id: 2,
      name: 'راية للتوزيع والتجارة',
      company: 'راية إلكترونكس (سامسونج - بيكو)',
      phone: '19900',
      phone2: '0238271000',
      address: 'القرية الذكية - طريق مصر إسكندرية الصحراوي',
      balance: 30000,
      notes: 'توريد شاشات سامسونج وأجهزة بيكو'
    }
  ];

  const insertSupplier = db.prepare(`
    INSERT OR REPLACE INTO suppliers (id, name, company, phone, phone2, address, balance, notes)
    VALUES (@id, @name, @company, @phone, @phone2, @address, @balance, @notes)
  `);
  suppliers.forEach(s => insertSupplier.run(s));

  // 7. Sales & Installment Plan Demo
  // Sale 1: Cash sale for Samsung TV
  db.prepare(`
    INSERT OR REPLACE INTO sales (id, invoice_no, customer_id, sale_type, subtotal, discount, total, paid_amount, remaining_amount, status, notes, created_at)
    VALUES (1, 'INV-2026-0001', 2, 'cash', 21500, 500, 21000, 21000, 0, 'completed', 'فاتورة نقدية مبيعات شاشة سامسونج', '2026-09-10 14:30:00')
  `).run();

  db.prepare(`
    INSERT OR REPLACE INTO sale_items (sale_id, product_id, serial_number, unit_price, cost_price, warranty_months, warranty_end_date)
    VALUES (1, 5, 'SAM-TV55-7003', 21000, 18500, 24, '2028-09-10')
  `).run();

  // Sale 2: Installment sale for LG Washing Machine
  db.prepare(`
    INSERT OR REPLACE INTO sales (id, invoice_no, customer_id, sale_type, subtotal, discount, total, paid_amount, remaining_amount, status, notes, created_at)
    VALUES (2, 'INV-2026-0002', 1, 'installment', 38500, 0, 38500, 8500, 30000, 'completed', 'بيع بالتقسيط غسالة ملابس إل جي', '2026-09-01 11:00:00')
  `).run();

  db.prepare(`
    INSERT OR REPLACE INTO sale_items (sale_id, product_id, serial_number, unit_price, cost_price, warranty_months, warranty_end_date)
    VALUES (2, 3, 'LG-WSH-800413', 38500, 29000, 60, '2031-09-01')
  `).run();

  // Installment plan for Sale 2: Total 38,500, Down Payment 8,500, Financed 30,000 for 12 months = 2,500/month
  db.prepare(`
    INSERT OR REPLACE INTO installment_plans (
      id, sale_id, customer_id, guarantor_id, total_cash_price, down_payment, financed_amount,
      profit_rate, profit_amount, total_installment_amount, remaining_balance,
      installments_count, monthly_amount, start_date, status, notes, created_at
    ) VALUES (
      1, 2, 1, 1, 33500, 8500, 25000, 20.0, 5000, 30000, 27500, 12, 2500, '2026-09-01', 'active', 'عقد تقسيط 12 شهر مع إيصالات أمانة وشيكات ضمان', '2026-09-01 11:00:00'
    )
  `).run();

  // Generate 12 monthly installments: first one paid, second one due now, rest pending
  const insertPayment = db.prepare(`
    INSERT OR REPLACE INTO installment_payments (
      installment_plan_id, installment_no, due_date, amount_due, amount_paid, status, paid_date, payment_method, receipt_no, notes
    ) VALUES (
      @plan_id, @no, @due_date, @amount, @paid, @status, @paid_date, @method, @receipt, @notes
    )
  `);

  // Month 1 (Sep 2026) - Paid
  insertPayment.run({
    plan_id: 1,
    no: 1,
    due_date: '2026-09-05',
    amount: 2500,
    paid: 2500,
    status: 'paid',
    paid_date: '2026-09-04',
    method: 'cash',
    receipt: 'REC-2026-001',
    notes: 'تم السداد نقداً بالمعرض'
  });

  // Month 2 (Oct 2026) - Due soon / pending
  insertPayment.run({
    plan_id: 1,
    no: 2,
    due_date: '2026-10-05',
    amount: 2500,
    paid: 0,
    status: 'pending',
    paid_date: null,
    method: 'cash',
    receipt: null,
    notes: 'مستحق السداد أول الشهر'
  });

  // Months 3 to 12
  for (let m = 3; m <= 12; m++) {
    const year = m > 4 ? 2027 : 2026;
    const month = ((m + 8) % 12) + 1;
    const monthStr = month < 10 ? `0${month}` : `${month}`;
    insertPayment.run({
      plan_id: 1,
      no: m,
      due_date: `${year}-${monthStr}-05`,
      amount: 2500,
      paid: 0,
      status: 'pending',
      paid_date: null,
      method: 'cash',
      receipt: null,
      notes: null
    });
  }

  // 8. Initial Expenses
  const expenses = [
    { category: 'إيجار', title: 'إيجار المعرض عن شهر سبتمبر', amount: 8000, expense_date: '2026-09-01', notes: 'شيك مؤجر' },
    { category: 'كهرباء', title: 'فاتورة كهرباء المعرض والتكييفات', amount: 1450, expense_date: '2026-09-12', notes: 'سداد فوري فوري' },
    { category: 'نقل وشحن', title: 'توصيل ثلاجة وغسالة لمنازل العملاء', amount: 650, expense_date: '2026-09-18', notes: 'سيارة نصف نقل' },
    { category: 'أخرى', title: 'ضيافة وبوفيه واستقبال عملاء', amount: 350, expense_date: '2026-09-22', notes: 'شاي وقهوة ومياه' }
  ];

  const insertExpense = db.prepare(`
    INSERT INTO expenses (category, title, amount, notes, expense_date)
    VALUES (@category, @title, @amount, @notes, @expense_date)
  `);
  expenses.forEach(e => insertExpense.run(e));

  // 9. Initial Cash box transactions
  db.prepare(`
    INSERT INTO cash_box (type, category, amount, description, ref_type, ref_id)
    VALUES 
      ('in', 'رصيد افتتاحي', 50000, 'رصيد بداية المدة في خزينة المعرض', 'manual', NULL),
      ('in', 'مبيعات كاش', 21000, 'فاتورة كاش INV-2026-0001 (شاشة سامسونج)', 'sale', 1),
      ('in', 'مقدم قسط', 8500, 'مقدم تقسيط فاتورة INV-2026-0002 (غسالة إل جي)', 'installment', 1),
      ('in', 'سداد قسط', 2500, 'القسط رقم 1 للعميل أحمد محمود (REC-2026-001)', 'installment', 1),
      ('out', 'مصروفات', 10450, 'إجمالي مصروفات المعرض من إيجار وكهرباء ونقل', 'expense', NULL)
  `).run();

  console.log('✅ تم تجهيز البيانات الأولية بنجاح!');
}

if (require.main === module) {
  seed();
}

module.exports = seed;
