import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  Printer, 
  MessageCircle, 
  Eye, 
  RotateCcw, 
  CheckCircle2, 
  Calendar, 
  CreditCard, 
  Wallet, 
  Building2, 
  ArrowUpDown, 
  FileText, 
  Share2, 
  Copy, 
  RefreshCw,
  TrendingUp,
  Clock,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { api } from '../api';

export default function Sales({ 
  settings, 
  onViewInvoice, 
  onInitiateReturn 
}) {
  const [sales, setSales] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [saleTypeFilter, setSaleTypeFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  
  const todayStr = new Date().toISOString().slice(0, 10);
  const monthStartStr = todayStr.slice(0, 7) + '-01';
  const [dateFrom, setDateFrom] = useState(monthStartStr);
  const [dateTo, setDateTo] = useState(todayStr);

  // WhatsApp quick sender state
  const [whatsAppModalSale, setWhatsAppModalSale] = useState(null);
  const [whatsAppPhone, setWhatsAppPhone] = useState('');
  const [copiedInvoiceNo, setCopiedInvoiceNo] = useState(null);

  // Tabs & Returns State (Requirement 6)
  const [activeTab, setActiveTab] = useState('invoices'); // 'invoices' or 'returns'
  const [returnsList, setReturnsList] = useState([]);
  const [returnsLoading, setReturnsLoading] = useState(false);
  const [printableCreditNote, setPrintableCreditNote] = useState(null);

  const currency = settings?.currency || 'ج.م';
  const storeName = settings?.store_name || 'معرض دكان عبد العزيز للأجهزة الكهربائية';

  useEffect(() => {
    loadBranches();
    loadSales();
  }, [saleTypeFilter, branchFilter, dateFrom, dateTo]);

  useEffect(() => {
    if (activeTab === 'returns') {
      loadReturns();
    }
  }, [activeTab]);

  const loadReturns = async () => {
    setReturnsLoading(true);
    try {
      const data = await api.getReturns();
      setReturnsList(data || []);
    } catch (err) {
      console.error('Error loading returns:', err);
    } finally {
      setReturnsLoading(false);
    }
  };

  const loadBranches = async () => {
    try {
      const data = await api.getBranches();
      setBranches(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadSales = async () => {
    setLoading(true);
    try {
      let queryParams = [];
      if (saleTypeFilter) queryParams.push(`sale_type=${encodeURIComponent(saleTypeFilter)}`);
      if (searchTerm) queryParams.push(`search=${encodeURIComponent(searchTerm)}`);
      if (dateFrom) queryParams.push(`date_from=${encodeURIComponent(dateFrom)}`);
      if (dateTo) queryParams.push(`date_to=${encodeURIComponent(dateTo)}`);

      const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
      const data = await api.getSales(queryString.replace(/^\?/, ''));
      setSales(data || []);
    } catch (err) {
      console.error('Error loading sales:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadSales();
  };

  const handleQuickPeriod = (type) => {
    const now = new Date();
    if (type === 'today') {
      setDateFrom(todayStr);
      setDateTo(todayStr);
    } else if (type === 'week') {
      const weekAgo = new Date(now.setDate(now.getDate() - 7)).toISOString().slice(0, 10);
      setDateFrom(weekAgo);
      setDateTo(todayStr);
    } else if (type === 'month') {
      setDateFrom(monthStartStr);
      setDateTo(todayStr);
    } else if (type === 'all') {
      setDateFrom('');
      setDateTo('');
    }
  };

  // KPIs
  const totalSalesCount = sales.length;
  const totalGrossAmount = sales.reduce((sum, s) => sum + (Number(s.total) || 0), 0);
  const totalPaidAmount = sales.reduce((sum, s) => sum + (Number(s.paid_amount) || 0), 0);
  const totalRemainingAmount = sales.reduce((sum, s) => sum + (Number(s.remaining_amount) || 0), 0);
  const totalDiscountAmount = sales.reduce((sum, s) => sum + (Number(s.discount) || 0), 0);

  // Actions
  const handlePrintSale = async (sale) => {
    try {
      const fullSale = await api.getSale(sale.id);
      if (onViewInvoice) onViewInvoice(fullSale);
    } catch (err) {
      alert(err.message || 'خطأ أثناء جلب تفاصيل الفاتورة');
    }
  };

  const handleOpenWhatsAppModal = (sale) => {
    setWhatsAppModalSale(sale);
    setWhatsAppPhone(sale.customer_phone || '');
  };

  const handleSendWhatsApp = async (sale, overridePhone) => {
    const rawPhone = overridePhone || sale.customer_phone;
    if (!rawPhone) {
      handleOpenWhatsAppModal(sale);
      return;
    }

    let cleanPhone = rawPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '20' + cleanPhone.slice(1);
    } else if (!cleanPhone.startsWith('20') && cleanPhone.length === 10) {
      cleanPhone = '20' + cleanPhone;
    }

    let fullSale = sale;
    if (!sale.items || sale.items.length === 0) {
      try {
        fullSale = await api.getSale(sale.id);
      } catch (e) {
        console.error(e);
      }
    }

    const publicLink = `${window.location.origin}/api/invoices/public/${sale.invoice_no}`;

    // Itemized list with serials, models, warranty
    const itemsList = fullSale.items?.map((it, i) => 
      `🔹 *${i + 1}. ${it.product_name}*\n` +
      `   ▪️ الموديل: \`${it.model_number || '-'}\`\n` +
      `   ▪️ السيريال: \`${it.serial_number || '-'}\`\n` +
      `   ▪️ الضمان: ${it.warranty_months} شهر (${it.warranty_agency || 'الوكيل المعتمد'})\n` +
      `   ▪️ السعر: ${Number(it.unit_price).toLocaleString()} ${currency}`
    ).join('\n\n') || '';

    const installmentDetails = fullSale.sale_type === 'finance_company'
      ? `🏢 *نظام التقسيط:* ${fullSale.installment_plan_name || fullSale.finance_company_name || 'تمويل استهلاكي'}${fullSale.installment_duration_months ? ` (${fullSale.installment_duration_months} شهر)` : ''}\n` +
        (fullSale.finance_approval_code ? `🔑 *كود الموافقة:* \`${fullSale.finance_approval_code}\`\n` : '')
      : fullSale.sale_type === 'installment'
      ? `📅 *نظام التقسيط:* ${fullSale.installment_plan_name || 'تقسيط مباشر من المعرض'}${fullSale.installment_duration_months ? ` (${fullSale.installment_duration_months} شهر)` : ''}\n` +
        (fullSale.installment_plan?.monthly_amount ? `💵 *القسط الشهري:* ${Number(fullSale.installment_plan.monthly_amount).toLocaleString()} ${currency}\n` : '')
      : '';

    const msg = 
`🌟 *${storeName}* 🌟
━━━━━━━━━━━━━━━━━━━━
💐 أهلاً بك عزيزنا العميل: *${fullSale.customer_name || 'المحترم'}*

يسعدنا إرفاق تفاصيل فاتورة الشراء المعتمدة وشهادة الضمان للأجهزة الكهربائية:

📄 *رقم الفاتورة:* \`${fullSale.invoice_no}\`
📅 *التاريخ:* ${new Date(fullSale.created_at).toLocaleDateString('ar-EG')}
🏢 *الفرع:* ${fullSale.branch_name || 'معرض الأزهر الرئيسي'}

📦 *الأجهزة المشتراة وتفاصيل السيريال والضمان:*
${itemsList}

━━━━━━━━━━━━━━━━━━━━
💰 *إجمالي الفاتورة:* *${Number(fullSale.total).toLocaleString()} ${currency}*
💵 *المبلغ المسدد:* *${Number(fullSale.paid_amount).toLocaleString()} ${currency}*
${Number(fullSale.remaining_amount) > 0 ? `⏳ *المتبقي:* *${Number(fullSale.remaining_amount).toLocaleString()} ${currency}*\n` : ''}${installmentDetails}
📜 *شروط الضمان:*
يسري الضمان من تاريخ هذه الفاتورة بالسيريال نمبر المدون أعلاه مع أصل شهادة ضمان الشركة المرفقة مع كرتونة الجهاز.

🔗 *رابط عرض وطباعة الفاتورة الإلكترونية المباشر:*
${publicLink}

━━━━━━━━━━━━━━━━━━━━
📞 خدمة العملاء والصيانة: ${fullSale.branch_phone || settings?.phone || '01023456789'}
📍 العنوان: ${fullSale.branch_address || settings?.address || 'شارع الأزهر - القاهرة'}
نشكركم دائماً لاختياركم دكان عبد العزيز! ✨`;

    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
    setWhatsAppModalSale(null);
  };

  const handleCopyLink = (invoiceNo) => {
    const link = `${window.location.origin}/api/invoices/public/${invoiceNo}`;
    navigator.clipboard.writeText(link);
    setCopiedInvoiceNo(invoiceNo);
    setTimeout(() => setCopiedInvoiceNo(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <span>سجل وتدقيق فواتير البيع والمبيعات</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            متابعة ومراجعة فواتير المعرض، إعادة الطباعة (A4 وبونات حرارية)، وإرسال الفواتير للعملاء عبر الواتساب
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (activeTab === 'invoices') loadSales();
              else loadReturns();
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${(loading || returnsLoading) ? 'animate-spin' : ''}`} />
            <span>{activeTab === 'invoices' ? 'تحديث الفواتير' : 'تحديث المرتجعات'}</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation (Requirement 6) */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('invoices')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-black text-xs transition-all cursor-pointer ${
            activeTab === 'invoices'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>سجل وتدقيق فواتير البيع ({sales.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('returns')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-black text-xs transition-all cursor-pointer ${
            activeTab === 'returns'
              ? 'bg-rose-600 text-white shadow-md'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>سجل المرتجعات والإشعارات الدائنة ({returnsList.length})</span>
        </button>
      </div>

      {activeTab === 'invoices' && (
        <div className="space-y-6">

      {/* KPI Stats Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 block">إجمالي الفواتير</span>
          <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
            {totalSalesCount.toLocaleString()} <span className="text-xs text-slate-500 font-bold">فاتورة</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 block">إجمالي المبيعات</span>
          <div className="text-2xl font-black text-blue-700 mt-1 font-mono" dir="ltr">
            {totalGrossAmount.toLocaleString()} <span className="text-xs font-bold text-slate-500">{currency}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 block">المبالغ المحصلة</span>
          <div className="text-2xl font-black text-emerald-700 mt-1 font-mono" dir="ltr">
            {totalPaidAmount.toLocaleString()} <span className="text-xs font-bold text-slate-500">{currency}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 block">المتبقي والآجل</span>
          <div className="text-2xl font-black text-amber-700 mt-1 font-mono" dir="ltr">
            {totalRemainingAmount.toLocaleString()} <span className="text-xs font-bold text-slate-500">{currency}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs col-span-2 lg:col-span-1">
          <span className="text-[11px] font-bold text-slate-500 block">إجمالي الخصومات</span>
          <div className="text-2xl font-black text-rose-700 mt-1 font-mono" dir="ltr">
            {totalDiscountAmount.toLocaleString()} <span className="text-xs font-bold text-slate-500">{currency}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 absolute right-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="بحث برقم الفاتورة، اسم العميل، رقم الهاتف..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-3 py-2 text-xs font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
            />
          </div>

          {/* Sale Type Filter */}
          <div>
            <select
              value={saleTypeFilter}
              onChange={(e) => setSaleTypeFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">جميع طرق الدفع</option>
              <option value="cash">💵 بيع نقدي كاش</option>
              <option value="installment">📅 تقسيط داخلي</option>
              <option value="finance_company">🏢 شركات تمويل (فاليو / كونتاكت / سهولة)</option>
              <option value="card">💳 بطاقة ائتمان / فيزا POS</option>
              <option value="transfer">🏦 تحويل بنكي / انستاباي</option>
            </select>
          </div>

          {/* Date From */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-500 font-bold whitespace-nowrap">من:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold"
            />
          </div>

          {/* Date To */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-500 font-bold whitespace-nowrap">إلى:</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold"
            />
          </div>
        </form>

        {/* Quick Date Filters */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-bold text-[11px]">فترة سريعة:</span>
            <button
              onClick={() => handleQuickPeriod('today')}
              className={`px-3 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                dateFrom === todayStr && dateTo === todayStr ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              فواتير اليوم
            </button>
            <button
              onClick={() => handleQuickPeriod('week')}
              className="px-3 py-1 rounded-lg font-bold text-[11px] bg-slate-100 text-slate-600 hover:bg-slate-200 transition cursor-pointer"
            >
              آخر 7 أيام
            </button>
            <button
              onClick={() => handleQuickPeriod('month')}
              className={`px-3 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                dateFrom === monthStartStr && dateTo === todayStr ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              الشهر الحالي
            </button>
            <button
              onClick={() => handleQuickPeriod('all')}
              className="px-3 py-1 rounded-lg font-bold text-[11px] bg-slate-100 text-slate-600 hover:bg-slate-200 transition cursor-pointer"
            >
              الكل
            </button>
          </div>

          <div className="text-xs text-slate-500 font-bold">
            عدد الفواتير المطابقة: <span className="font-mono text-blue-700">{sales.length}</span>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold">
                <th className="py-3.5 px-4">رقم الفاتورة</th>
                <th className="py-3.5 px-4">التاريخ والوقت</th>
                <th className="py-3.5 px-4">بيانات العميل</th>
                <th className="py-3.5 px-4">طريقة الدفع</th>
                <th className="py-3.5 px-4">إجمالي الفاتورة</th>
                <th className="py-3.5 px-4">المسدد</th>
                <th className="py-3.5 px-4">المتبقي</th>
                <th className="py-3.5 px-4 text-center">الأصناف</th>
                <th className="py-3.5 px-4 text-center">إجراءات الفاتورة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {sales.length > 0 ? (
                sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/70 transition">
                    {/* Invoice Number */}
                    <td className="py-3.5 px-4">
                      <a
                        href={`/api/invoices/public/${sale.invoice_no}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="عرض وطباعة الفاتورة في شاشة مستقلة"
                        className="font-mono font-bold text-blue-700 hover:text-blue-900 hover:underline flex items-center gap-1.5"
                        dir="ltr"
                      >
                        <span>{sale.invoice_no}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      </a>
                      <span className="text-[10px] text-slate-400 block font-normal">معرف #{sale.id}</span>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="text-slate-800 font-bold">
                        {new Date(sale.created_at).toLocaleDateString('ar-EG')}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono" dir="ltr">
                        {new Date(sale.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">
                        {sale.customer_name || 'عميل نقدي مجهول'}
                      </div>
                      {sale.customer_phone && (
                        <div className="text-[11px] font-mono text-slate-500 mt-0.5" dir="ltr">
                          {sale.customer_phone}
                        </div>
                      )}
                    </td>

                    {/* Sale Type / Payment Method */}
                    <td className="py-3.5 px-4">
                      {sale.sale_type === 'cash' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1 w-fit">
                          <span>💵</span>
                          <span>نقدي كاش</span>
                        </span>
                      )}
                      {sale.sale_type === 'installment' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1 w-fit">
                          <span>📅</span>
                          <span>تقسيط داخلي</span>
                        </span>
                      )}
                      {sale.sale_type === 'finance_company' && (
                        <div>
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center gap-1 w-fit">
                            <span>🏢</span>
                            <span>{sale.finance_company_name || 'شركة تمويل'}</span>
                          </span>
                          {sale.finance_approval_code && (
                            <span className="text-[9px] font-mono text-indigo-600 block mt-0.5" dir="ltr">
                              كود: {sale.finance_approval_code}
                            </span>
                          )}
                        </div>
                      )}
                      {sale.sale_type === 'card' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1 w-fit">
                          <span>💳</span>
                          <span>فيزا POS</span>
                        </span>
                      )}
                      {sale.sale_type === 'transfer' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1 w-fit">
                          <span>🏦</span>
                          <span>تحويل بنكي / انستاباي</span>
                        </span>
                      )}
                    </td>

                    {/* Total */}
                    <td className="py-3.5 px-4 font-black text-slate-900 text-sm font-mono" dir="ltr">
                      {Number(sale.total).toLocaleString()} {currency}
                    </td>

                    {/* Paid */}
                    <td className="py-3.5 px-4 font-bold text-emerald-700 font-mono" dir="ltr">
                      {Number(sale.paid_amount).toLocaleString()} {currency}
                    </td>

                    {/* Remaining */}
                    <td className="py-3.5 px-4 font-bold font-mono" dir="ltr">
                      {Number(sale.remaining_amount) > 0 ? (
                        <span className="text-amber-700">{Number(sale.remaining_amount).toLocaleString()} {currency}</span>
                      ) : (
                        <span className="text-slate-400">0 {currency}</span>
                      )}
                    </td>

                    {/* Items Count */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[11px] font-mono">
                        {sale.items_count || 1}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Print / View */}
                        <button
                          onClick={() => handlePrintSale(sale)}
                          title="عرض وطباعة الفاتورة (A4 وبون)"
                          className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 transition cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>طباعة</span>
                        </button>


                        {/* WhatsApp Resend */}
                        <button
                          onClick={() => handleSendWhatsApp(sale)}
                          title="إعادة إرسال الفاتورة عبر واتساب"
                          className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 transition cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>واتساب</span>
                        </button>

                        {/* Return RMA button */}
                        {onInitiateReturn && (
                          <button
                            onClick={() => onInitiateReturn(sale)}
                            title="طلب مرتجع / استبدال للفاتورة"
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 transition cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>مرتجع</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    {loading ? 'جاري تحميل فواتير البيع...' : 'لا توجد فواتير بيع مطابقة لشروط البحث والفلاتر'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    )}

      {/* Returns Tab Content (Requirement 6) */}
      {activeTab === 'returns' && (
        <div className="space-y-6">
          {/* Returns KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 block">إجمالي إشعارات المرتجع</span>
              <div className="text-2xl font-black text-rose-700 mt-1 font-mono">
                {returnsList.length.toLocaleString()} <span className="text-xs text-slate-500 font-bold">عملية</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 block">إجمالي مبالغ المرتجعات المستردة</span>
              <div className="text-2xl font-black text-rose-800 mt-1 font-mono" dir="ltr">
                {returnsList.reduce((sum, r) => sum + (Number(r.refund_amount) || 0), 0).toLocaleString()} <span className="text-xs text-slate-500 font-bold">{currency}</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 block">إجمالي الأجهزة المرتجعة للمخازن</span>
              <div className="text-2xl font-black text-indigo-900 mt-1 font-mono">
                {returnsList.reduce((sum, r) => sum + (r.items ? r.items.length : 0), 0).toLocaleString()} <span className="text-xs text-slate-500 font-bold">جهاز</span>
              </div>
            </div>
          </div>

          {/* Returns Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-rose-600" />
                <h3 className="font-extrabold text-sm text-slate-800">سجل الإشعارات الدائنة ومرتجع المبيعات (Sales Returns)</h3>
              </div>
              <span className="text-xs text-slate-500 font-bold">
                مرتبط آلياً بحركة المخزون والخزينة وأرصدة العملاء
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-700 font-extrabold">
                  <tr>
                    <th className="py-3 px-3 text-center">#</th>
                    <th className="py-3 px-3">رقم الإشعار</th>
                    <th className="py-3 px-3">تاريخ المرتجع</th>
                    <th className="py-3 px-3">الفاتورة الأصلية</th>
                    <th className="py-3 px-3">العميل</th>
                    <th className="py-3 px-3">الأجهزة المرتجعة والسيريال</th>
                    <th className="py-3 px-3 text-center">طريقة الاسترداد</th>
                    <th className="py-3 px-3 text-left">مبلغ المرتجع</th>
                    <th className="py-3 px-3 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {returnsList.length > 0 ? (
                    returnsList.map((ret, idx) => (
                      <tr key={ret.id || idx} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-3 text-center text-slate-400 font-bold">{idx + 1}</td>
                        <td className="py-3 px-3">
                          <span className="font-mono font-black text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-lg text-[11px]" dir="ltr">
                            RET-{ret.id}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-600 text-[11px]" dir="ltr">
                          {ret.return_date ? String(ret.return_date).slice(0, 16).replace('T', ' ') : '-'}
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[11px]" dir="ltr">
                            {ret.sale_invoice_no}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{ret.customer_name || 'عميل نقدي'}</div>
                          {ret.customer_phone && (
                            <div className="text-[10px] text-slate-500 font-mono" dir="ltr">{ret.customer_phone}</div>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <div className="space-y-1">
                            {ret.items?.map((item, itemIdx) => (
                              <div key={itemIdx} className="flex items-center gap-1.5 text-[11px]">
                                <span className="font-bold text-slate-800">{item.product_name}</span>
                                {item.serial_number && (
                                  <span className="font-mono text-[10px] bg-slate-100 px-1 rounded text-slate-600">
                                    SN: {item.serial_number}
                                  </span>
                                )}
                                <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                  item.restock_status === 'in_stock' ? 'bg-emerald-100 text-emerald-800' :
                                  item.restock_status === 'outlet' ? 'bg-amber-100 text-amber-800' :
                                  'bg-rose-100 text-rose-800'
                                }`}>
                                  {item.restock_status === 'in_stock' ? 'مخزن سليم' :
                                   item.restock_status === 'outlet' ? 'أوتلت مخفض' : 'تالف / خردة'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            ret.refund_method === 'cash' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {ret.refund_method === 'cash' ? 'نقدي من الخزينة' : 'رصيد دائن بحساب العميل'}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono font-black text-rose-700 text-left text-xs" dir="ltr">
                          {Number(ret.refund_amount || 0).toLocaleString()} {currency}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => setPrintableCreditNote(ret)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] shadow-2xs cursor-pointer transition active:scale-98"
                            title="طباعة إشعار دائن رسمي A4"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>إشعار دائن (A4)</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="py-12 text-center text-slate-400">
                        {returnsLoading ? 'جاري تحميل المرتجعات...' : 'لا توجد عمليات مرتجع مسجلة'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Printable Credit Note Modal (Requirement 6) */}
      {printableCreditNote && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          {/* Isolated Print Styles */}
          <style>{`
            @media print {
              @page {
                size: A4 portrait;
                margin: 8mm 10mm;
              }
              html, body {
                background: #ffffff !important;
                margin: 0 !important;
                padding: 0 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              body * {
                visibility: hidden !important;
              }
              #credit-note-printable-area,
              #credit-note-printable-area * {
                visibility: visible !important;
              }
              #credit-note-printable-area {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                box-shadow: none !important;
                border: none !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `}</style>

          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-3 no-print">
              <div className="flex items-center gap-2.5">
                <RotateCcw className="w-5 h-5 text-rose-600" />
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm">إشعار دائن مرتجع مبيعات معتمد (Credit Note)</h3>
                  <p className="text-[11px] text-slate-500 font-mono">رقم الإشعار: RET-{printableCreditNote.id}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-98"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة الإشعار (A4)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintableCreditNote(null)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Content */}
            <div className="p-6 overflow-y-auto" dir="rtl">
              <div id="credit-note-printable-area" className="border-2 border-slate-900 rounded-2xl p-6 bg-white space-y-4 text-xs">
                {/* Header */}
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
                  <div className="flex items-center gap-3">
                    {settings?.logo_url && (
                      <img src={settings.logo_url} alt="Logo" className="h-12 w-auto object-contain" />
                    )}
                    <div>
                      <h2 className="text-base font-black text-slate-900">{storeName}</h2>
                      <p className="text-[11px] text-slate-600">قسم المبيعات وخدمة العملاء والمرتجعات (RMA)</p>
                    </div>
                  </div>
                  <div className="text-left font-mono text-xs space-y-0.5" dir="ltr">
                    <div className="font-black text-rose-700">SALES CREDIT NOTE</div>
                    <div className="text-slate-800 font-bold">No: RET-{printableCreditNote.id}</div>
                    <div className="text-slate-600">Date: {printableCreditNote.return_date ? String(printableCreditNote.return_date).slice(0, 10) : ''}</div>
                  </div>
                </div>

                {/* Title */}
                <div className="text-center py-1.5 bg-rose-50 rounded-xl border border-rose-200">
                  <span className="font-black text-sm text-rose-950 tracking-wide">
                    إشعار دائن مرتجع مبيعات معتمد (CREDIT NOTE)
                  </span>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-500 font-bold block text-[11px]">بيانات العميل:</span>
                    <span className="font-extrabold text-slate-900 text-sm">{printableCreditNote.customer_name || 'عميل نقدي'}</span>
                    {printableCreditNote.customer_phone && (
                      <span className="block text-[11px] font-mono text-slate-600" dir="ltr">{printableCreditNote.customer_phone}</span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block text-[11px]">الفاتورة المرجعية الأصلية:</span>
                    <span className="font-mono font-black text-blue-800 text-sm" dir="ltr">{printableCreditNote.sale_invoice_no}</span>
                    <span className="block text-[11px] text-slate-500">سبب الإرجاع: {printableCreditNote.reason || 'رغبة العميل'}</span>
                  </div>
                </div>

                {/* Returned Items Table */}
                <div className="border border-slate-300 rounded-xl overflow-hidden">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-800 text-white font-bold">
                      <tr>
                        <th className="p-2 text-center w-8">#</th>
                        <th className="p-2">اسم الصنف والموديل</th>
                        <th className="p-2 w-36">السيريال المسجل</th>
                        <th className="p-2 w-32 text-center">حالة إعادة التخزين</th>
                        <th className="p-2 w-28 text-left">مبلغ الاسترداد</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {printableCreditNote.items?.map((item, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                          <td className="p-2 text-center font-bold text-slate-500">{idx + 1}</td>
                          <td className="p-2 font-bold text-slate-900">
                            {item.product_name} {item.model_number && `(${item.model_number})`}
                          </td>
                          <td className="p-2 font-mono font-bold text-slate-700 text-[11px]" dir="ltr">
                            {item.serial_number || '—'}
                          </td>
                          <td className="p-2 text-center">
                            <span className="font-semibold text-[11px]">
                              {item.restock_status === 'in_stock' ? 'مخزون جديد سليم' :
                               item.restock_status === 'outlet' ? 'أوتلت مخفض' : 'تالف / خردة'}
                            </span>
                          </td>
                          <td className="p-2 font-mono font-bold text-rose-700 text-left" dir="ltr">
                            {Number(item.refund_price || 0).toLocaleString()} {currency}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-rose-50/80 border-t-2 border-rose-300 font-black text-xs">
                      <tr>
                        <td colSpan="4" className="p-2.5 text-slate-900">
                          إجمالي قيمة الإشعار الدائن المسترد للعميل:
                          <span className="text-[11px] font-bold text-slate-600 mr-2">
                            ({printableCreditNote.refund_method === 'cash' ? 'تم الصرف نقداً من خزينة المعرض' : 'تم إضافة المبلغ كرصيد دائن متاح بحساب العميل'})
                          </span>
                        </td>
                        <td className="p-2.5 text-left font-mono text-rose-900 text-sm" dir="ltr">
                          {Number(printableCreditNote.refund_amount || 0).toLocaleString()} {currency}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-4 gap-2 pt-4 border-t-2 border-slate-900 text-center text-xs">
                  <div className="space-y-8">
                    <span className="font-bold text-slate-700 block">توقيع العميل المستلم</span>
                    <div className="text-[11px] text-slate-400">..............................</div>
                  </div>
                  <div className="space-y-8">
                    <span className="font-bold text-slate-700 block">مسؤول استلام المخزن</span>
                    <div className="text-[11px] text-slate-400">..............................</div>
                  </div>
                  <div className="space-y-8">
                    <span className="font-bold text-slate-700 block">أمين الخزينة / الحسابات</span>
                    <div className="text-[11px] text-slate-400">..............................</div>
                  </div>
                  <div className="space-y-8">
                    <span className="font-bold text-slate-700 block">اعتماد الإدارة والختم</span>
                    <div className="text-[11px] text-slate-400">..............................</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Custom Phone Modal */}
      {whatsAppModalSale && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 text-xs text-slate-800">
            <h3 className="font-extrabold text-sm text-slate-900 mb-2 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              إرسال الفاتورة عبر واتساب للعميل
            </h3>
            <p className="text-slate-500 mb-4">
              فاتورة رقم: <span className="font-mono font-bold text-blue-900">{whatsAppModalSale.invoice_no}</span>
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">رقم هاتف العميل (واتساب) *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: 01012345678"
                  value={whatsAppPhone}
                  onChange={(e) => setWhatsAppPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-sm"
                  dir="ltr"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setWhatsAppModalSale(null)}
                  className="px-4 py-2 font-bold cursor-pointer text-slate-600"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={() => handleSendWhatsApp(whatsAppModalSale, whatsAppPhone)}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer flex items-center gap-1.5"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>فتح محادثة واتساب</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
