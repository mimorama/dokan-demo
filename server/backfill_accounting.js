const db = require('./db');

function getCairoDate() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' }).format(new Date());
}

function generateInvoiceNo(prefix) {
  const y = new Date().getFullYear();
  const rnd = Math.floor(1000 + Math.random() * 9000);
  return prefix + '-' + y + '-' + rnd;
}

function createJournalEntry({ ref_type, ref_id, description, lines, entry_date, created_by }) {
  if (!lines || !Array.isArray(lines) || lines.length === 0) return null;
  const today = entry_date || getCairoDate();
  const entryNo = generateInvoiceNo('JV');
  const entryRes = db.prepare(`
    INSERT INTO journal_entries (entry_no, entry_date, ref_type, ref_id, description, created_by, status)
    VALUES (?, ?, ?, ?, ?, ?, 'posted')
  `).run(entryNo, today, ref_type || 'manual', ref_id || null, description, created_by || 'النظام المحاسبي الآلي');

  const entryId = entryRes.lastInsertRowid;
  const insertLine = db.prepare(`
    INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const l of lines) {
    let accountId = l.account_id;
    if (!accountId && l.account_code) {
      const acc = db.prepare('SELECT id FROM accounts WHERE code = ?').get(String(l.account_code));
      if (acc) accountId = acc.id;
    }
    if (!accountId) continue;
    const d = Math.round((Number(l.debit) || 0) * 100) / 100;
    const c = Math.round((Number(l.credit) || 0) * 100) / 100;
    if (d === 0 && c === 0) continue;
    insertLine.run(entryId, accountId, d, c, l.description || description);
  }
  return entryId;
}

function runBackfill() {
  const currentCount = db.prepare('SELECT count(*) as c FROM journal_entries').get().c;
  if (currentCount > 0) {
    console.log(`Journal entries already exist (${currentCount} entries). Skipping.`);
    return;
  }

  const sales = db.prepare('SELECT * FROM sales ORDER BY id ASC').all();
  const purchases = db.prepare('SELECT * FROM purchases ORDER BY id ASC').all();
  const expenses = db.prepare("SELECT * FROM cash_box WHERE type = 'out' AND category NOT IN ('sale', 'سداد موردين') ORDER BY id ASC").all();
  const supplierPayments = db.prepare('SELECT sp.*, s.name as supplier_name FROM supplier_payments sp JOIN suppliers s ON sp.supplier_id = s.id ORDER BY sp.id ASC').all();

  console.log(`Backfilling ${sales.length} sales, ${purchases.length} purchases, ${expenses.length} expenses, ${supplierPayments.length} payments...`);

  // Purchases
  for (const p of purchases) {
    const total = Number(p.total) || 0;
    if (total <= 0) continue;
    const sName = p.supplier_id ? (db.prepare('SELECT name FROM suppliers WHERE id = ?').get(p.supplier_id)?.name || 'مورد') : 'مورد';
    createJournalEntry({
      ref_type: 'purchase',
      ref_id: p.id,
      entry_date: p.created_at ? p.created_at.slice(0, 10) : getCairoDate(),
      description: 'إثبات فاتورة مشتريات وتوريد رقم ' + p.invoice_no + ' من المورد ' + sName,
      lines: [
        { account_code: '1106', debit: total, credit: 0, description: 'إضافة أجهزة لمخزون المعرض - فاتورة ' + p.invoice_no },
        { account_code: '2101', debit: 0, credit: total, description: 'استحقاق مديونية المورد ' + sName + ' - فاتورة ' + p.invoice_no }
      ],
      created_by: 'ترحيل تاريخي'
    });
    const paid = Number(p.paid_amount) || 0;
    if (paid > 0) {
      createJournalEntry({
        ref_type: 'purchase_payment',
        ref_id: p.id,
        entry_date: p.created_at ? p.created_at.slice(0, 10) : getCairoDate(),
        description: 'سداد دفعة فورية لفاتورة مشتريات رقم ' + p.invoice_no + ' للمورد ' + sName,
        lines: [
          { account_code: '2101', debit: paid, credit: 0, description: 'تخفيض مديونية المورد ' + sName },
          { account_code: '1101', debit: 0, credit: paid, description: 'صرف نقدي من الخزينة لفاتورة ' + p.invoice_no }
        ],
        created_by: 'ترحيل تاريخي'
      });
    }
  }

  // Sales
  for (const s of sales) {
    const total = Number(s.total) || 0;
    const paid = Number(s.paid_amount) || 0;
    const remaining = Math.max(0, total - paid);
    if (total <= 0) continue;
    let code = '1101';
    if (s.sale_type === 'finance_company') code = '1104';
    else if (s.payment_method === 'instapay' || s.payment_method === 'wallet') code = '1103';
    else if (s.payment_method === 'visa' || s.payment_method === 'card') code = '1102';

    const lines = [];
    if (paid > 0) lines.push({ account_code: code, debit: paid, credit: 0, description: 'تحصيل مبيعات فاتورة ' + s.invoice_no });
    if (remaining > 0) lines.push({ account_code: '1105', debit: remaining, credit: 0, description: 'مديونية عملاء/تقسيط فاتورة ' + s.invoice_no });
    lines.push({ account_code: '4101', debit: 0, credit: total, description: 'إيراد مبيعات أجهزة فاتورة ' + s.invoice_no });

    createJournalEntry({
      ref_type: 'sale',
      ref_id: s.id,
      entry_date: s.created_at ? s.created_at.slice(0, 10) : getCairoDate(),
      description: 'إثبات إيراد مبيعات فاتورة رقم ' + s.invoice_no + ' (' + (s.customer_name || 'عميل نقدي') + ')',
      lines,
      created_by: 'ترحيل تاريخي'
    });

    const items = db.prepare('SELECT si.*, ps.cost_price FROM sale_items si LEFT JOIN product_serials ps ON si.serial_number = ps.serial_number WHERE si.sale_id = ?').all(s.id);
    let cost = 0;
    for (const it of items) if (it.cost_price) cost += Number(it.cost_price);
    if (cost > 0) {
      createJournalEntry({
        ref_type: 'cogs',
        ref_id: s.id,
        entry_date: s.created_at ? s.created_at.slice(0, 10) : getCairoDate(),
        description: 'إثبات تكلفة البضاعة المباعة للفاتورة ' + s.invoice_no,
        lines: [
          { account_code: '5101', debit: cost, credit: 0, description: 'تكلفة البضاعة المباعة - فاتورة ' + s.invoice_no },
          { account_code: '1106', debit: 0, credit: cost, description: 'صرف بضاعة من المخزون - فاتورة ' + s.invoice_no }
        ],
        created_by: 'ترحيل تاريخي'
      });
    }
  }

  // Supplier Payments
  for (const sp of supplierPayments) {
    const amt = Number(sp.amount) || 0;
    if (amt <= 0) continue;
    const acc = sp.payment_method === 'bank' ? '1102' : '1101';
    createJournalEntry({
      ref_type: 'supplier_payment',
      ref_id: sp.id,
      entry_date: sp.payment_date || (sp.created_at ? sp.created_at.slice(0, 10) : getCairoDate()),
      description: 'سداد مستحقات للمورد ' + (sp.supplier_name || 'مورد'),
      lines: [
        { account_code: '2101', debit: amt, credit: 0, description: 'تخفيض مديونية المورد ' + (sp.supplier_name || '') },
        { account_code: acc, debit: 0, credit: amt, description: 'سداد من ' + (acc === '1101' ? 'الخزينة النقدية' : 'الحساب البنكي') }
      ],
      created_by: 'ترحيل تاريخي'
    });
  }

  // Expenses
  for (const exp of expenses) {
    const amt = Number(exp.amount) || 0;
    if (amt <= 0) continue;
    createJournalEntry({
      ref_type: 'expense',
      ref_id: exp.id,
      entry_date: exp.created_at ? exp.created_at.slice(0, 10) : getCairoDate(),
      description: 'إثبات مصروف: ' + (exp.description || exp.category || 'مصروف عمومي'),
      lines: [
        { account_code: '5106', debit: amt, credit: 0, description: exp.description || 'مصروفات تشغيلية وعمومية' },
        { account_code: '1101', debit: 0, credit: amt, description: 'صرف نقدي من الخزينة' }
      ],
      created_by: 'ترحيل تاريخي'
    });
  }

  console.log('Now journal_entries count:', db.prepare('SELECT count(*) as c FROM journal_entries').get().c);
  console.log('Now journal_entry_lines count:', db.prepare('SELECT count(*) as c FROM journal_entry_lines').get().c);
}

module.exports = { runBackfill };

if (require.main === module) {
  runBackfill();
}
