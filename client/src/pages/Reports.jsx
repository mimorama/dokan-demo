import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Printer, 
  Download, 
  Package, 
  CalendarClock, 
  Wallet, 
  Receipt, 
  FileText, 
  ArrowUpRight, 
  CheckCircle2, 
  AlertTriangle,
  PhoneCall,
  MessageSquare
} from 'lucide-react';
import { api } from '../api';
import OfficialReportPrint from '../components/OfficialReportPrint';

export default function Reports({ settings }) {
  const [reportType, setReportType] = useState('sales'); // 'sales', 'installments', 'inventory', 'cashflow'
  const [showOfficialPrint, setShowOfficialPrint] = useState(false);
  
  // Date Range state
  const todayStr = new Date().toISOString().slice(0, 10);
  const monthStartStr = todayStr.slice(0, 7) + '-01';
  const [startDate, setStartDate] = useState(monthStartStr);
  const [endDate, setEndDate] = useState(todayStr);

  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  const currency = settings?.currency || 'ج.م';
  const storeName = settings?.store_name || 'معرض دكان عبد العزيز للأجهزة الكهربائية';

  useEffect(() => {
    loadReport();
  }, [reportType, startDate, endDate]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await api.getAdvancedReport({ reportType, startDate, endDate });
      setReportData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPeriod = (type) => {
    const now = new Date();
    if (type === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (type === 'week') {
      const weekAgo = new Date(now.setDate(now.getDate() - 7)).toISOString().slice(0, 10);
      setStartDate(weekAgo);
      setEndDate(todayStr);
    } else if (type === 'month') {
      setStartDate(monthStartStr);
      setEndDate(todayStr);
    } else if (type === 'year') {
      setStartDate(`${now.getFullYear()}-01-01`);
      setEndDate(todayStr);
    }
  };

  const handlePrintReport = () => {
    setShowOfficialPrint(true);
  };

  const sendWhatsAppReminder = (phone, customerName, dueDate, amountDue) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const fullPhone = cleanPhone.startsWith('0') ? `2${cleanPhone}` : cleanPhone;
    const msg = encodeURIComponent(
      `مرحباً أستاذ ${customerName}،\nنود تذكير سيادتكم باستحقاق قسط شهر (${dueDate}) بقيمة (${Number(amountDue).toLocaleString()} ${currency}) لمعرض ${storeName}.\nنرجو التكرم بالسداد في الموعد المحدد شاكرين حسن تعاونكم الدائم.\n📍 ${settings?.address || 'القاهرة'}\n📞 للاستفسار: ${settings?.phone || ''}`
    );
    window.open(`https://wa.me/${fullPhone}?text=${msg}`, '_blank');
  };

  return (
    <div className="space-y-6">

      {/* Control Bar (Hidden during print) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-blue-600" />
              نظام التقارير المالية والتحليلية المتقدم
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              متابعة دقيقة لأداء مبيعات الأجهزة، أرباح الكاش والتقسيط، نسب التحصيل، وجرد المخزون بالسيريال
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowOfficialPrint(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 border border-slate-700 hover:border-amber-400"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>🖨️ طباعة تقرير رسمي معتمد A4</span>
            </button>
          </div>
        </div>

        {/* Report Types Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold border-t border-slate-100 pt-3">
          {[
            { id: 'sales', label: '📊 تقرير المبيعات والأرباح', icon: Receipt },
            { id: 'installments', label: '📅 تقرير التحصيل والأقساط', icon: CalendarClock },
            { id: 'inventory', label: '📦 تقرير جرد المخزون ورأس المال', icon: Package },
            { id: 'cashflow', label: '💵 تقرير حركة الخزينة وتدفق الأموال', icon: Wallet },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setReportType(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  reportType === tab.id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Date Filter & Quick Presets */}
        {reportType !== 'inventory' && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-600">الفترة الزمنية:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold font-mono"
              />
              <span className="text-slate-400">إلى</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold font-mono"
              />
            </div>

            <div className="flex items-center gap-1.5 font-semibold">
              <button
                onClick={() => handleQuickPeriod('today')}
                className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                اليوم
              </button>
              <button
                onClick={() => handleQuickPeriod('week')}
                className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                آخر 7 أيام
              </button>
              <button
                onClick={() => handleQuickPeriod('month')}
                className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                هذا الشهر
              </button>
              <button
                onClick={() => handleQuickPeriod('year')}
                className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                هذا العام
              </button>
            </div>
          </div>
        )}
      </div>

      {loading || !reportData ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
        </div>
      ) : (
        <div>
          {/* ============================================================ */}
          {/* 1. SALES & PROFITS REPORT VIEW */}
          {/* ============================================================ */}
          {reportType === 'sales' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-blue-50/70 border border-blue-200/80 p-3.5 rounded-2xl gap-3">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-blue-700" />
                  <div>
                    <h3 className="font-extrabold text-sm text-blue-950">تقرير حركة المبيعات والأرباح المعتمد</h3>
                    <p className="text-[11px] text-blue-700">الفترة من: {startDate} إلى: {endDate}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowOfficialPrint(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 self-start sm:self-auto"
                >
                  <Printer className="w-4 h-4 text-amber-300" />
                  <span>🖨️ طباعة تقرير المبيعات المعتمد (A4)</span>
                </button>
              </div>

              {/* Summary KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-bold text-slate-500 block mb-1">إجمالي المبيعات</span>
                  <div className="text-xl font-black text-slate-900" dir="ltr">
                    {Number(reportData.summary?.totalRevenue || 0).toLocaleString()} <span className="text-xs font-normal text-slate-500">{currency}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block font-medium">{reportData.summary?.totalInvoices || 0} فاتورة</span>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-bold text-slate-500 block mb-1">المبالغ المحصلة كاش / مقدمات</span>
                  <div className="text-xl font-black text-emerald-600" dir="ltr">
                    {Number(reportData.summary?.totalCollected || 0).toLocaleString()} <span className="text-xs font-normal text-slate-500">{currency}</span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-bold text-slate-500 block mb-1">المتبقي آجل وأقساط</span>
                  <div className="text-xl font-black text-amber-600" dir="ltr">
                    {Number(reportData.summary?.totalReceivables || 0).toLocaleString()} <span className="text-xs font-normal text-slate-500">{currency}</span>
                  </div>
                </div>

                <div className="bg-gradient-to-tr from-emerald-600 to-teal-700 text-white rounded-2xl p-4 shadow-sm">
                  <span className="text-[11px] font-bold text-emerald-100 block mb-1">مجمل الربح التجاري</span>
                  <div className="text-xl font-black text-white" dir="ltr">
                    {Number(reportData.summary?.totalGrossProfit || 0).toLocaleString()} <span className="text-xs font-normal text-emerald-100">{currency}</span>
                  </div>
                  <span className="text-[10px] text-emerald-200 mt-1 block">هامش الربح من بيع الأجهزة</span>
                </div>
              </div>

              {/* Invoices Breakdown Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center text-xs">
                  <h3 className="font-extrabold text-slate-800">تفاصيل الفواتير والأرباح المحققة خلال الفترة</h3>
                  <span className="text-slate-500">{reportData.rows?.length || 0} عملية بيع</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                        <th className="py-2.5 px-3">رقم الفاتورة</th>
                        <th className="py-2.5 px-3">العميل والمشتري</th>
                        <th className="py-2.5 px-3">نوع البيع</th>
                        <th className="py-2.5 px-3">عدد الأجهزة</th>
                        <th className="py-2.5 px-3">إجمالي الفاتورة</th>
                        <th className="py-2.5 px-3">المدفوع / المقدم</th>
                        <th className="py-2.5 px-3">ربح الفاتورة التقديري</th>
                        <th className="py-2.5 px-3">التاريخ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {reportData.rows?.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50/70">
                          <td className="py-3 px-3 font-mono font-bold text-blue-700" dir="ltr">{row.invoice_no}</td>
                          <td className="py-3 px-3">
                            <span className="font-bold text-slate-900 block">{row.customer_name || 'عميل نقدي'}</span>
                            {row.customer_phone && <span className="text-[10px] text-slate-400 font-mono" dir="ltr">{row.customer_phone}</span>}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              row.sale_type === 'installment' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {row.sale_type === 'installment' ? 'تقسيط' : 'كاش'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-600 font-bold">{row.items_count} أجهزة</td>
                          <td className="py-3 px-3 font-black text-slate-900" dir="ltr">{Number(row.total).toLocaleString()} {currency}</td>
                          <td className="py-3 px-3 text-emerald-700 font-bold" dir="ltr">{Number(row.paid_amount).toLocaleString()} {currency}</td>
                          <td className="py-3 px-3 text-teal-700 font-black" dir="ltr">+{Number(row.order_profit).toLocaleString()} {currency}</td>
                          <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">{new Date(row.created_at).toLocaleDateString('ar-EG')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* 2. INSTALLMENTS & RECOVERY REPORT VIEW */}
          {/* ============================================================ */}
          {reportType === 'installments' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-indigo-50/70 border border-indigo-200/80 p-3.5 rounded-2xl gap-3">
                <div className="flex items-center gap-2">
                  <CalendarClock className="w-5 h-5 text-indigo-700" />
                  <div>
                    <h3 className="font-extrabold text-sm text-indigo-950">تقرير تحصيل الأقساط والمتأخرات المعتمد</h3>
                    <p className="text-[11px] text-indigo-700">الفترة من: {startDate} إلى: {endDate}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowOfficialPrint(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 self-start sm:self-auto"
                >
                  <Printer className="w-4 h-4 text-amber-300" />
                  <span>🖨️ طباعة تقرير التحصيل والأقساط (A4)</span>
                </button>
              </div>

              {/* KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-bold text-slate-500 block mb-1">إجمالي الأقساط المحصلة بالفترة</span>
                  <div className="text-xl font-black text-emerald-600" dir="ltr">
                    {Number(reportData.totals?.totalCollectedInPeriod || 0).toLocaleString()} <span className="text-xs font-normal text-slate-500">{currency}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block font-medium">عدد الأقساط المسددة: {reportData.totals?.paymentsCount || 0}</span>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-bold text-slate-500 block mb-1">إجمالي الأقساط المتأخرة حالياً</span>
                  <div className="text-xl font-black text-rose-600" dir="ltr">
                    {Number(reportData.totalOverdue?.totalLateBalance || 0).toLocaleString()} <span className="text-xs font-normal text-slate-500">{currency}</span>
                  </div>
                  <span className="text-[10px] text-rose-500 mt-1 block font-bold">عدد المتأخرات: {reportData.totalOverdue?.lateCount || 0} قسط</span>
                </div>

                <div className="bg-gradient-to-tr from-blue-700 to-indigo-800 text-white rounded-2xl p-4 shadow-sm">
                  <span className="text-[11px] font-bold text-blue-200 block mb-1">حالة التحصيل</span>
                  <div className="text-xl font-black text-white">
                    سداد منتظم
                  </div>
                  <span className="text-[10px] text-blue-200 mt-1 block">متابعة العملاء عبر رسائل واتساب</span>
                </div>
              </div>

              {/* Overdue Payments Table with WhatsApp Action */}
              <div className="bg-white rounded-2xl border border-rose-200 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-rose-200 bg-rose-50 flex justify-between items-center text-xs">
                  <h3 className="font-extrabold text-rose-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    قائمة العملاء المتأخرين عن السداد (واجبة المتابعة والتحصيل)
                  </h3>
                  <span className="text-rose-700 font-bold">{reportData.overduePayments?.length || 0} متأخر</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                        <th className="py-2.5 px-3">العميل</th>
                        <th className="py-2.5 px-3">رقم الهاتف</th>
                        <th className="py-2.5 px-3">الضامن المتضامن</th>
                        <th className="py-2.5 px-3">رقم القسط</th>
                        <th className="py-2.5 px-3">تاريخ الاستحقاق</th>
                        <th className="py-2.5 px-3">المبلغ المتأخر</th>
                        <th className="py-2.5 px-3 text-center no-print">تذكير واتساب</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {reportData.overduePayments?.map((p) => (
                        <tr key={p.id} className="hover:bg-rose-50/40">
                          <td className="py-3 px-3 font-bold text-slate-900">{p.customer_name}</td>
                          <td className="py-3 px-3 font-mono font-bold text-blue-700" dir="ltr">{p.customer_phone}</td>
                          <td className="py-3 px-3 text-slate-600">{p.guarantor_name || '---'} ({p.guarantor_phone || '---'})</td>
                          <td className="py-3 px-3 font-bold text-center">#{p.installment_no}</td>
                          <td className="py-3 px-3 font-mono text-rose-600 font-bold">{p.due_date}</td>
                          <td className="py-3 px-3 font-black text-rose-700 text-sm" dir="ltr">{Number(p.amount_late).toLocaleString()} {currency}</td>
                          <td className="py-3 px-3 text-center no-print">
                            <button
                              onClick={() => sendWhatsAppReminder(p.customer_phone, p.customer_name, p.due_date, p.amount_late)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>إرسال واتساب</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Collected Payments in Period */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center text-xs">
                  <h3 className="font-extrabold text-slate-800">الأقساط المسددة خلال الفترة المحددة</h3>
                  <span className="text-slate-500">{reportData.collectedPayments?.length || 0} إيصال سداد</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <th className="py-2.5 px-3">رقم الإيصال</th>
                        <th className="py-2.5 px-3">العميل</th>
                        <th className="py-2.5 px-3">القسط المستحق</th>
                        <th className="py-2.5 px-3">المبلغ المسدد</th>
                        <th className="py-2.5 px-3">طريقة الدفع</th>
                        <th className="py-2.5 px-3">تاريخ السداد</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {reportData.collectedPayments?.map((pm) => (
                        <tr key={pm.id} className="hover:bg-slate-50/70">
                          <td className="py-3 px-3 font-mono font-bold text-slate-800" dir="ltr">{pm.receipt_no || 'REC'}</td>
                          <td className="py-3 px-3 font-bold text-slate-900">{pm.customer_name}</td>
                          <td className="py-3 px-3 text-slate-600">قسط #{pm.installment_no} (تاريخ: {pm.due_date})</td>
                          <td className="py-3 px-3 font-black text-emerald-700" dir="ltr">{Number(pm.amount_paid).toLocaleString()} {currency}</td>
                          <td className="py-3 px-3 font-bold text-slate-600">{pm.payment_method === 'cash' ? 'نقداً بالمعرض' : pm.payment_method}</td>
                          <td className="py-3 px-3 font-mono text-slate-500">{pm.paid_date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* 3. INVENTORY & CAPITAL VALUATION REPORT VIEW */}
          {/* ============================================================ */}
          {reportType === 'inventory' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-teal-50/70 border border-teal-200/80 p-3.5 rounded-2xl gap-3">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-teal-700" />
                  <div>
                    <h3 className="font-extrabold text-sm text-teal-950">محضر جرد المخزون الفعلي وتقييم رأس المال</h3>
                    <p className="text-[11px] text-teal-700">جرد تفصيلي لموديلات الأجهزة والسيريالات المتاحة بالمخازن</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowOfficialPrint(true)}
                  className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 self-start sm:self-auto"
                >
                  <Printer className="w-4 h-4 text-amber-300" />
                  <span>🖨️ طباعة محضر الجرد المعتمد (A4)</span>
                </button>
              </div>

              {/* Summary Valuation */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-bold text-slate-500 block mb-1">إجمالي الأجهزة بالمخزن (بالسيريال)</span>
                  <div className="text-2xl font-black text-slate-900 tracking-tight">
                    {reportData.overallTotals?.totalDevicesInStock || 0} <span className="text-xs font-normal text-slate-500">جهاز متاح</span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-bold text-slate-500 block mb-1">رأس مال البضاعة (بسعر التكلفة)</span>
                  <div className="text-2xl font-black text-blue-700 tracking-tight" dir="ltr">
                    {Number(reportData.overallTotals?.totalCostValuation || 0).toLocaleString()} <span className="text-xs font-normal text-slate-500">{currency}</span>
                  </div>
                </div>

                <div className="bg-gradient-to-tr from-indigo-700 to-blue-800 text-white rounded-2xl p-4 shadow-sm">
                  <span className="text-[11px] font-bold text-blue-200 block mb-1">القيمة البيعية المتوقعة (كاش)</span>
                  <div className="text-2xl font-black text-white tracking-tight" dir="ltr">
                    {Number(reportData.overallTotals?.totalRetailValuation || 0).toLocaleString()} <span className="text-xs font-normal text-blue-200">{currency}</span>
                  </div>
                </div>
              </div>

              {/* Categories Breakdown */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
                <h3 className="font-extrabold text-sm text-slate-800 mb-3">توزيع المخزون ورأس المال حسب أقسام الأجهزة</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {reportData.categoriesSummary?.map((cat) => (
                    <div key={cat.id} className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <h4 className="font-bold text-slate-900 text-xs mb-1">{cat.category_name}</h4>
                      <p className="text-[11px] text-blue-700 font-bold">{cat.in_stock_count} أجهزة متاحة</p>
                      <p className="text-[10px] text-slate-500 mt-1" dir="ltr">
                        قيمة التكلفة: {Number(cat.total_cost_value).toLocaleString()} {currency}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Granular Stock Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center text-xs">
                  <h3 className="font-extrabold text-slate-800">بيان جرد تفصيلي لموديلات الأجهزة والمخزون</h3>
                  <span className="text-slate-500">{reportData.productsInventory?.length || 0} صنف مسجل</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <th className="py-2.5 px-3">اسم الجهاز والموديل</th>
                        <th className="py-2.5 px-3">الماركة والتصنيف</th>
                        <th className="py-2.5 px-3">سعر التكلفة</th>
                        <th className="py-2.5 px-3">سعر البيع كاش</th>
                        <th className="py-2.5 px-3">المتاح بالمخزن</th>
                        <th className="py-2.5 px-3">إجمالي قيمة التكلفة</th>
                        <th className="py-2.5 px-3">المباع</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {reportData.productsInventory?.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/70">
                          <td className="py-3 px-3">
                            <span className="font-bold text-slate-900 block">{item.name}</span>
                            {item.model_number && <span className="text-[10px] text-slate-400 font-mono">موديل: {item.model_number}</span>}
                          </td>
                          <td className="py-3 px-3 text-slate-600">{item.brand_name} | {item.category_name}</td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-600" dir="ltr">{Number(item.cost_price).toLocaleString()} {currency}</td>
                          <td className="py-3 px-3 font-mono font-black text-slate-900" dir="ltr">{Number(item.cash_price).toLocaleString()} {currency}</td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-full font-black text-[11px] ${
                              item.in_stock === 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {item.in_stock} جهاز
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono font-black text-blue-700" dir="ltr">
                            {Number(item.in_stock * item.cost_price).toLocaleString()} {currency}
                          </td>
                          <td className="py-3 px-3 text-slate-500 font-bold">{item.sold} مباع</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* 4. CASH FLOW & LEDGER REPORT VIEW */}
          {/* ============================================================ */}
          {reportType === 'cashflow' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-100 border border-slate-300 p-3.5 rounded-2xl gap-3">
                <div className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-slate-800" />
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">تقرير حركة الخزينة وتدفق الأموال المعتمد</h3>
                    <p className="text-[11px] text-slate-600">الفترة من: {startDate} إلى: {endDate}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowOfficialPrint(true)}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 self-start sm:self-auto"
                >
                  <Printer className="w-4 h-4 text-amber-300" />
                  <span>🖨️ طباعة تقرير حركة الخزينة (A4)</span>
                </button>
              </div>

              {/* KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-bold text-slate-500 block mb-1">إجمالي الوارد بالفترة</span>
                  <div className="text-xl font-black text-emerald-600" dir="ltr">
                    +{Number(reportData.periodIn || 0).toLocaleString()} <span className="text-xs font-normal text-slate-500">{currency}</span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-bold text-slate-500 block mb-1">إجمالي المنصرف بالفترة</span>
                  <div className="text-xl font-black text-rose-600" dir="ltr">
                    -{Number(reportData.periodOut || 0).toLocaleString()} <span className="text-xs font-normal text-slate-500">{currency}</span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-bold text-slate-500 block mb-1">صافي التدفق النقدي بالفترة</span>
                  <div className={`text-xl font-black ${reportData.netFlow >= 0 ? 'text-emerald-700' : 'text-rose-700'}`} dir="ltr">
                    {Number(reportData.netFlow || 0).toLocaleString()} <span className="text-xs font-normal text-slate-500">{currency}</span>
                  </div>
                </div>

                <div className="bg-gradient-to-tr from-slate-900 to-blue-900 text-white rounded-2xl p-4 shadow-sm">
                  <span className="text-[11px] font-bold text-slate-300 block mb-1">رصيد الخزينة الحالي الآن</span>
                  <div className="text-xl font-black text-white" dir="ltr">
                    {Number(reportData.currentBalance || 0).toLocaleString()} <span className="text-xs font-normal text-slate-300">{currency}</span>
                  </div>
                </div>
              </div>

              {/* Transactions Ledger */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center text-xs">
                  <h3 className="font-extrabold text-slate-800">دفتر يومية الخزينة وحركة الأموال بالتفصيل</h3>
                  <span className="text-slate-500">{reportData.ledger?.length || 0} حركة</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <th className="py-2.5 px-3">نوع الحركة</th>
                        <th className="py-2.5 px-3">التصنيف</th>
                        <th className="py-2.5 px-3">البيان والسبب</th>
                        <th className="py-2.5 px-3">المبلغ</th>
                        <th className="py-2.5 px-3">التاريخ والوقت</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {reportData.ledger?.map((tx) => {
                        const isIn = tx.type === 'in';
                        return (
                          <tr key={tx.id} className="hover:bg-slate-50/70">
                            <td className="py-3 px-3">
                              <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                isIn ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}>
                                {isIn ? 'وارد (إيداع)' : 'منصرف (صرف)'}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-bold text-slate-900">{tx.category}</td>
                            <td className="py-3 px-3 text-slate-600">{tx.description}</td>
                            <td className={`py-3 px-3 font-black text-sm ${isIn ? 'text-emerald-700' : 'text-rose-600'}`} dir="ltr">
                              {isIn ? '+' : '-'}{Number(tx.amount).toLocaleString()} {currency}
                            </td>
                            <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">{tx.created_at}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Official Formal Document Print Modal */}
      {showOfficialPrint && (
        <OfficialReportPrint
          reportType={reportType}
          reportData={reportData}
          startDate={startDate}
          endDate={endDate}
          settings={settings}
          onClose={() => setShowOfficialPrint(false)}
        />
      )}
    </div>
  );
}
