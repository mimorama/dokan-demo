import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Wallet, 
  CreditCard, 
  Building2, 
  ArrowRightLeft, 
  TrendingUp, 
  Printer, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  FileText, 
  Coins, 
  ShieldCheck, 
  Truck,
  RotateCcw,
  Percent,
  Smartphone,
  Send,
  X
} from 'lucide-react';
import { api } from '../api';

export default function DailyReconciliation({ settings, currentUser }) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [branches, setBranches] = useState([]);
  const [reconciliationData, setReconciliationData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cash Drawer Counting Tool
  const [actualCashCounted, setActualCashCounted] = useState('');
  const [drawerNotes, setDrawerNotes] = useState('');
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Active channel subtab
  const [activeChannelTab, setActiveChannelTab] = useState('all');

  const currency = settings?.currency || 'ج.م';
  const storeName = settings?.store_name || 'معرض دكان عبد العزيز للأجهزة الكهربائية';
  const commercialReg = settings?.commercial_reg || '198425';
  const taxId = settings?.tax_number || settings?.tax_id || '654-321-987';

  useEffect(() => {
    loadBranches();
  }, []);

  useEffect(() => {
    loadReconciliation();
  }, [selectedDate, selectedBranch]);

  const loadBranches = async () => {
    try {
      const data = await api.getBranches();
      setBranches(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadReconciliation = async () => {
    setLoading(true);
    try {
      let params = `date=${selectedDate}`;
      if (selectedBranch) params += `&branch_id=${selectedBranch}`;
      const data = await api.getDailyReconciliation(params);
      setReconciliationData(data);
    } catch (err) {
      console.error('Error loading reconciliation:', err);
    } finally {
      setLoading(false);
    }
  };

  const summary = reconciliationData?.summary || {};
  const cashMetrics = summary?.cash_drawer || summary?.cash || {};
  const visaMetrics = summary?.visa || {};
  const instapayMetrics = summary?.instapay || {};
  const walletMetrics = summary?.wallet || {};
  const cardMetrics = summary?.cards || {};
  const financeMetrics = summary?.finance_companies || {};
  const bankMetrics = summary?.banks || {};
  const transferMetrics = summary?.transfers || {};
  const installmentMetrics = summary?.installments || {};
  const returnMetrics = summary?.returns || {};
  const supplierPayMetrics = summary?.supplier_payments || {};
  const customerCreditMetrics = summary?.customer_credit || {};
  const itemized = reconciliationData?.itemized || {};

  // Expected Cash calculation
  const expectedCash = cashMetrics?.net_cash_drawer_flow || 0;
  const countedNum = actualCashCounted !== '' ? Number(actualCashCounted) : null;
  const cashDifference = countedNum !== null ? Math.round((countedNum - expectedCash) * 100) / 100 : null;

  const handlePrintOfficialSheet = () => {
    setShowPrintModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Date Selector */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Coins className="w-5 h-5" />
            </div>
            <span>مراجعة اليومية وتدقيق طرق الدفع (تقفيل الخزينة)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            تدقيق محاسبي شامل ومطابقة دقيقة لجميع قنوات التحصيل (نقدي، فيزا POS 2%، انستاباي، محافظ 1%، شركات التمويل، البنوك، والأقساط)
          </p>
        </div>

        {/* Date & Branch Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            <Calendar className="w-4 h-4 text-slate-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-mono font-bold text-slate-800 focus:outline-none"
            />
          </div>

          <button
            onClick={() => setSelectedDate(todayStr)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedDate === todayStr ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            اليوم
          </button>

          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="">جميع الفروع</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          <button
            onClick={loadReconciliation}
            title="تحديث البيانات"
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handlePrintOfficialSheet}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>طباعة محضر التقفيل اليومي</span>
          </button>
        </div>
      </div>

      {/* Main KPI Summary Channels Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* 1. Pure Cash Drawer Net Flow */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold">1. صافي الدرج النقدي</span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-700 font-mono" dir="ltr">
            {(cashMetrics.net_cash_drawer_flow || 0).toLocaleString()} <span className="text-[10px] font-bold text-slate-500">{currency}</span>
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1 pt-1 border-t border-slate-100 font-mono">
            <span className="text-emerald-600 font-bold">وارد: +{(cashMetrics.total_cash_in || 0).toLocaleString()}</span>
            <span className="text-rose-600 font-bold">صرف: -{(cashMetrics.total_cash_out || 0).toLocaleString()}</span>
          </div>
        </div>

        {/* 2. Visa POS (2% fee deducted) */}
        <div className="bg-white p-4 rounded-2xl border border-blue-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold">2. ماكينات الفيزا (2%)</span>
            <CreditCard className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-black text-blue-700 font-mono" dir="ltr">
            {(visaMetrics.gross || 0).toLocaleString()} <span className="text-[10px] font-bold text-slate-500">{currency}</span>
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1 pt-1 border-t border-slate-100">
            <span className="text-rose-600 font-mono">عمولة: -{(visaMetrics.fees || 0).toLocaleString()}</span>
            <span className="text-blue-700 font-bold font-mono">صافي: {(visaMetrics.net || 0).toLocaleString()}</span>
          </div>
        </div>

        {/* 3. InstaPay (1 EGP / 1000 EGP fee deducted) */}
        <div className="bg-white p-4 rounded-2xl border border-purple-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold">3. إنستاباي InstaPay</span>
            <Send className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl font-black text-purple-700 font-mono" dir="ltr">
            {(instapayMetrics.gross || 0).toLocaleString()} <span className="text-[10px] font-bold text-slate-500">{currency}</span>
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1 pt-1 border-t border-slate-100">
            <span className="text-rose-600 font-mono">رسوم: -{(instapayMetrics.fees || 0).toLocaleString()}</span>
            <span className="text-purple-700 font-bold font-mono">صافي: {(instapayMetrics.net || 0).toLocaleString()}</span>
          </div>
        </div>

        {/* 4. Electronic Wallets (1% fee deducted) */}
        <div className="bg-white p-4 rounded-2xl border border-amber-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold">4. محافظ إلكترونية (1%)</span>
            <Smartphone className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-black text-amber-700 font-mono" dir="ltr">
            {(walletMetrics.gross || 0).toLocaleString()} <span className="text-[10px] font-bold text-slate-500">{currency}</span>
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1 pt-1 border-t border-slate-100">
            <span className="text-rose-600 font-mono">رسوم: -{(walletMetrics.fees || 0).toLocaleString()}</span>
            <span className="text-amber-700 font-bold font-mono">صافي: {(walletMetrics.net || 0).toLocaleString()}</span>
          </div>
        </div>

        {/* 5. Banks & Consumer Finance */}
        <div className="bg-white p-4 rounded-2xl border border-indigo-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold">5. تمويل و بنوك</span>
            <Building2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-black text-indigo-700 font-mono" dir="ltr">
            {((financeMetrics.gross || 0) + (bankMetrics.gross || 0)).toLocaleString()} <span className="text-[10px] font-bold text-slate-500">{currency}</span>
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1 pt-1 border-t border-slate-100">
            <span className="text-indigo-600 font-bold font-mono">شركات: {(financeMetrics.count || 0)}</span>
            <span className="text-indigo-900 font-bold font-mono">صافي: {((financeMetrics.net || 0) + (bankMetrics.net || 0)).toLocaleString()}</span>
          </div>
        </div>

        {/* 6. Total Gross Sales & Turnover */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-4 rounded-2xl shadow-md">
          <span className="text-[11px] font-bold text-amber-300 block mb-1">إجمالي تداول اليوم</span>
          <div className="text-xl font-black text-white font-mono" dir="ltr">
            {(summary.total_gross_revenue || 0).toLocaleString()} <span className="text-[10px] font-bold text-blue-200">{currency}</span>
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-300 mt-1 pt-1 border-t border-white/10 font-mono">
            <span>{summary.total_invoices_count || 0} فاتورة</span>
            <span>{installmentMetrics.count || 0} قسط</span>
          </div>
        </div>
      </div>

      {/* Cash Drawer Reconciliation Box (مطابقة الدرج والعجز والزيادة) */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <h3 className="font-extrabold text-base text-white">مطابقة النقدية بالدرج والعهدة اليومية (Drawer Reconciliation)</h3>
            </div>
            <p className="text-xs text-blue-200 mt-0.5">
              مقارنة النقدية المسجلة محاسبياً بالنظام مع النقدية الفعلية بعد جرد الدرج لتحديد العجز أو الزيادة بدقة
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl text-left" dir="ltr">
              <span className="text-[10px] text-blue-200 block">المبلغ المتوقع بالدرج:</span>
              <span className="text-lg font-black text-amber-300 font-mono">
                {expectedCash.toLocaleString()} {currency}
              </span>
            </div>
          </div>
        </div>

        {/* Drawer Counting Input Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div>
            <label className="block text-xs font-bold text-blue-200 mb-1.5">
              أدخل النقدية الفعلية الموجودة بالدرج (العد الفعلي) *
            </label>
            <input
              type="number"
              placeholder="مثال: 15400"
              value={actualCashCounted}
              onChange={(e) => setActualCashCounted(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-base font-black text-white font-mono focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-blue-200 mb-1.5">ملاحظات التقفيل / الكاشير</label>
            <input
              type="text"
              placeholder="مثال: تم التقفيل وتسليم النقدية للحاج عبد العزيز..."
              value={drawerNotes}
              onChange={(e) => setDrawerNotes(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:bg-white/20"
            />
          </div>

          {/* Variance Status Display */}
          <div>
            <span className="block text-xs font-bold text-blue-200 mb-1.5">نتيجة المطابقة:</span>
            {cashDifference !== null ? (
              <div className={`p-2.5 rounded-xl border flex items-center gap-2 font-bold text-xs ${
                cashDifference === 0 
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300' 
                  : cashDifference < 0 
                  ? 'bg-rose-500/20 border-rose-400 text-rose-300' 
                  : 'bg-amber-500/20 border-amber-400 text-amber-300'
              }`}>
                {cashDifference === 0 && <CheckCircle2 className="w-5 h-5 flex-shrink-0" />}
                {cashDifference !== 0 && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                <div>
                  <div className="font-black text-sm">
                    {cashDifference === 0 
                      ? 'الدرج مطابق تماماً (0 ج.م)' 
                      : cashDifference < 0 
                      ? `عجز في الخزينة بقيمة: ${Math.abs(cashDifference).toLocaleString()} ${currency}` 
                      : `زيادة في الخزينة بقيمة: ${cashDifference.toLocaleString()} ${currency}`}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-400 font-medium">
                بانتظار إدخال قيمة العد الفعلي لحساب الفارق...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Subtabs for Itemized Channels */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Navigation Tabs */}
        <div className="p-3 border-b border-slate-200 bg-slate-50 flex flex-wrap gap-2">
          {[
            { id: 'all', label: 'جميع المعاملات', count: summary.total_invoices_count || 0 },
            { id: 'drawer', label: 'حركة الدرج النقدي', count: (itemized.pureCashSales?.length || 0) + (itemized.installmentPayments?.filter(p => !p.payment_method || p.payment_method === 'cash').length || 0) },
            { id: 'visa', label: 'فيزا POS (2%)', count: itemized.visaSales?.length || 0 },
            { id: 'instapay', label: 'إنستاباي (1ج/1000ج)', count: itemized.instapaySales?.length || 0 },
            { id: 'wallet', label: 'محافظ إلكترونية (1%)', count: itemized.walletSales?.length || 0 },
            { id: 'finance', label: 'شركات التمويل والبنوك', count: (itemized.financeCompanySales?.length || 0) + (itemized.bankSales?.length || 0) },
            { id: 'installments', label: 'تحصيلات الأقساط', count: itemized.installmentPayments?.length || 0 },
            { id: 'suppliers', label: 'سداد الموردين', count: itemized.supplierPaymentsList?.length || 0 },
            { id: 'returns', label: 'المرتجعات والاسترداد', count: itemized.returnsList?.length || 0 },
            { id: 'expenses', label: 'المصروفات النثرية', count: itemized.cashExpenses?.length || 0 }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveChannelTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeChannelTab === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                activeChannelTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Content based on Active Channel */}
        <div className="p-5">
          {/* TAB: FINANCE & BANKS BREAKDOWN */}
          {activeChannelTab === 'finance' && (
            <div className="space-y-6">
              <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-black text-sm text-indigo-950">تفصيل عمولات ومستحقات شركات التمويل الاستهلاكي والبنوك</h4>
                  <p className="text-xs text-indigo-700 mt-0.5">
                    العمولة المقتطعة تخصم من مستحقات المعرض ويتم إيداع الصافي في حساب المعرض البنكي
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs font-bold">
                  <div>
                    <span className="text-slate-500 block text-[11px]">إجمالي الموافقات:</span>
                    <span className="font-mono text-slate-900 font-black text-sm">{financeMetrics.gross?.toLocaleString()} {currency}</span>
                  </div>
                  <div>
                    <span className="text-rose-600 block text-[11px]">عمولات التاجر:</span>
                    <span className="font-mono text-rose-700 font-black text-sm">-{financeMetrics.fees?.toLocaleString()} {currency}</span>
                  </div>
                  <div>
                    <span className="text-emerald-700 block text-[11px]">صافي المستحق للمعرض:</span>
                    <span className="font-mono text-emerald-800 font-black text-sm">{financeMetrics.net?.toLocaleString()} {currency}</span>
                  </div>
                </div>
              </div>

              {/* Company Breakdown Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {financeMetrics.companies?.map((comp, idx) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <h5 className="font-black text-sm text-slate-900">{comp.company_name}</h5>
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full font-bold text-[10px]">
                        {comp.count} فاتورة
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">إجمالي المبيعات:</span>
                        <span className="font-mono font-bold text-slate-800">{comp.gross_amount?.toLocaleString()} {currency}</span>
                      </div>
                      <div className="flex justify-between text-rose-600">
                        <span>عمولة الشركة:</span>
                        <span className="font-mono font-bold">-{comp.merchant_fees?.toLocaleString()} {currency}</span>
                      </div>
                      <div className="flex justify-between font-black text-emerald-700 pt-1 border-t border-slate-100">
                        <span>صافي الإيداع المتوقع:</span>
                        <span className="font-mono">{comp.net_payout?.toLocaleString()} {currency}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Transactions List */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold">
                    <tr>
                      <th className="py-3 px-4">رقم الفاتورة</th>
                      <th className="py-3 px-4">اسم العميل</th>
                      <th className="py-3 px-4">الجهة الممولة</th>
                      <th className="py-3 px-4">كود الموافقة</th>
                      <th className="py-3 px-4">المبلغ الإجمالي</th>
                      <th className="py-3 px-4">عمولة التاجر</th>
                      <th className="py-3 px-4">صافي المعرض</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {itemized.financeCompanySales?.concat(itemized.bankSales || [])?.map(s => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-bold text-blue-900" dir="ltr">{s.invoice_no}</td>
                        <td className="py-3 px-4 font-bold text-slate-800">{s.customer_name || 'عميل'}</td>
                        <td className="py-3 px-4 font-bold text-indigo-700">{s.finance_company_name || s.partner_company_name || 'تقسيط'}</td>
                        <td className="py-3 px-4 font-mono text-slate-600" dir="ltr">{s.finance_approval_code || '---'}</td>
                        <td className="py-3 px-4 font-black font-mono text-slate-900" dir="ltr">{Number(s.total).toLocaleString()} {currency}</td>
                        <td className="py-3 px-4 font-mono text-rose-600 font-bold" dir="ltr">-{Number(s.merchant_fee || 0).toLocaleString()} {currency}</td>
                        <td className="py-3 px-4 font-black font-mono text-emerald-700" dir="ltr">{Number(s.net_payout || (Number(s.total) - Number(s.merchant_fee || 0))).toLocaleString()} {currency}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: DRAWER FLOW (وارد / منصرف) */}
          {activeChannelTab === 'drawer' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4">
                  <h4 className="font-extrabold text-sm text-emerald-900 mb-2 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span>مقبوضات وارد الدرج النقدي اليوم (+{(cashMetrics.total_cash_in || 0).toLocaleString()} {currency})</span>
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-emerald-100">
                      <span>مبيعات الصالة النقدية:</span>
                      <strong className="font-mono text-emerald-800">{(cashMetrics.pure_cash_sales || 0).toLocaleString()} {currency}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-emerald-100">
                      <span>مقدمات عقود التقسيط نقداً:</span>
                      <strong className="font-mono text-emerald-800">{(cashMetrics.installment_down_payments || 0).toLocaleString()} {currency}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-emerald-100">
                      <span>أقساط شهرية محصلة نقداً:</span>
                      <strong className="font-mono text-emerald-800">{(cashMetrics.installments_collected || 0).toLocaleString()} {currency}</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>إيداعات نقدية أخرى بالخزينة:</span>
                      <strong className="font-mono text-emerald-800">{(cashMetrics.manual_inflows || 0).toLocaleString()} {currency}</strong>
                    </div>
                  </div>
                </div>

                <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-4">
                  <h4 className="font-extrabold text-sm text-rose-900 mb-2 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-rose-600 rotate-180" />
                    <span>منصرفات ومدفوعات الدرج النقدي اليوم (-{(cashMetrics.total_cash_out || 0).toLocaleString()} {currency})</span>
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-rose-100">
                      <span>مصروفات نثرية وإدارية:</span>
                      <strong className="font-mono text-rose-800">-{(cashMetrics.cash_expenses || 0).toLocaleString()} {currency}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-rose-100">
                      <span>سداد دفعات الموردين نقداً:</span>
                      <strong className="font-mono text-rose-800">-{(cashMetrics.supplier_cash_paid || 0).toLocaleString()} {currency}</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>مرتجعات مستردة نقداً للعملاء:</span>
                      <strong className="font-mono text-rose-800">-{(cashMetrics.returns_cash_refund || 0).toLocaleString()} {currency}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: VISA (2%) */}
          {activeChannelTab === 'visa' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex justify-between items-center text-xs">
                <div>
                  <h4 className="font-black text-sm text-blue-900">عمليات بطاقات الائتمان وفيزا POS</h4>
                  <p className="text-slate-600 mt-0.5">يتم احتساب رسم تحصيل بنكي 2% وتخصم كمصروف تحصيل بنكي</p>
                </div>
                <div className="flex gap-4 font-mono font-bold">
                  <div>إجمالي: <span className="text-slate-900">{(visaMetrics.gross || 0).toLocaleString()} {currency}</span></div>
                  <div>عمولة 2%: <span className="text-rose-600">-{(visaMetrics.fees || 0).toLocaleString()} {currency}</span></div>
                  <div>صافي المعرض: <span className="text-blue-700">{(visaMetrics.net || 0).toLocaleString()} {currency}</span></div>
                </div>
              </div>
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold">
                    <tr>
                      <th className="py-3 px-4">رقم الفاتورة</th>
                      <th className="py-3 px-4">العميل</th>
                      <th className="py-3 px-4">إجمالي العملية</th>
                      <th className="py-3 px-4">عمولة التحصيل (2%)</th>
                      <th className="py-3 px-4">صافي المعرض</th>
                      <th className="py-3 px-4">الملاحظات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {itemized.visaSales?.map(s => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-bold text-blue-900" dir="ltr">{s.invoice_no}</td>
                        <td className="py-3 px-4 font-bold text-slate-800">{s.customer_name || 'عميل فيزا'}</td>
                        <td className="py-3 px-4 font-black font-mono text-slate-900" dir="ltr">{Number(s.total).toLocaleString()} {currency}</td>
                        <td className="py-3 px-4 font-mono text-rose-600 font-bold" dir="ltr">-{Number(s.collection_fee || (Number(s.total) * 0.02)).toLocaleString()} {currency}</td>
                        <td className="py-3 px-4 font-black font-mono text-blue-700" dir="ltr">{(Number(s.total) - Number(s.collection_fee || (Number(s.total) * 0.02))).toLocaleString()} {currency}</td>
                        <td className="py-3 px-4 text-slate-500">{s.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: INSTAPAY (1 EGP / 1000 EGP) */}
          {activeChannelTab === 'instapay' && (
            <div className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 flex justify-between items-center text-xs">
                <div>
                  <h4 className="font-black text-sm text-purple-900">تحويلات شبكة المدفوعات اللحظية إنستاباي InstaPay</h4>
                  <p className="text-slate-600 mt-0.5">يتم احتساب رسم تحصيل 1 جنيه لكل 1000 جنيه من قيمة العملية وتخصم كمصروف</p>
                </div>
                <div className="flex gap-4 font-mono font-bold">
                  <div>إجمالي: <span className="text-slate-900">{(instapayMetrics.gross || 0).toLocaleString()} {currency}</span></div>
                  <div>رسوم إنستاباي: <span className="text-rose-600">-{(instapayMetrics.fees || 0).toLocaleString()} {currency}</span></div>
                  <div>صافي المعرض: <span className="text-purple-700">{(instapayMetrics.net || 0).toLocaleString()} {currency}</span></div>
                </div>
              </div>
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold">
                    <tr>
                      <th className="py-3 px-4">رقم الفاتورة</th>
                      <th className="py-3 px-4">العميل</th>
                      <th className="py-3 px-4">المبلغ المحول</th>
                      <th className="py-3 px-4">رسم التحصيل (1ج/1000ج)</th>
                      <th className="py-3 px-4">صافي المعرض</th>
                      <th className="py-3 px-4">الملاحظات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {itemized.instapaySales?.map(s => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-bold text-blue-900" dir="ltr">{s.invoice_no}</td>
                        <td className="py-3 px-4 font-bold text-slate-800">{s.customer_name || 'عميل إنستاباي'}</td>
                        <td className="py-3 px-4 font-black font-mono text-slate-900" dir="ltr">{Number(s.total).toLocaleString()} {currency}</td>
                        <td className="py-3 px-4 font-mono text-rose-600 font-bold" dir="ltr">-{Number(s.collection_fee || Math.ceil(Number(s.total) / 1000)).toLocaleString()} {currency}</td>
                        <td className="py-3 px-4 font-black font-mono text-purple-700" dir="ltr">{(Number(s.total) - Number(s.collection_fee || Math.ceil(Number(s.total) / 1000))).toLocaleString()} {currency}</td>
                        <td className="py-3 px-4 text-slate-500">{s.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: WALLET (1%) */}
          {activeChannelTab === 'wallet' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex justify-between items-center text-xs">
                <div>
                  <h4 className="font-black text-sm text-amber-900">المحافظ الإلكترونية (فودافون كاش، أورنج كاش، وي باي، اتصالات كاش)</h4>
                  <p className="text-slate-600 mt-0.5">يتم احتساب رسم تحصيل 1% من قيمة العملية وتخصم كمصروف</p>
                </div>
                <div className="flex gap-4 font-mono font-bold">
                  <div>إجمالي: <span className="text-slate-900">{(walletMetrics.gross || 0).toLocaleString()} {currency}</span></div>
                  <div>رسوم المحفظة (1%): <span className="text-rose-600">-{(walletMetrics.fees || 0).toLocaleString()} {currency}</span></div>
                  <div>صافي المعرض: <span className="text-amber-700">{(walletMetrics.net || 0).toLocaleString()} {currency}</span></div>
                </div>
              </div>
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold">
                    <tr>
                      <th className="py-3 px-4">رقم الفاتورة</th>
                      <th className="py-3 px-4">العميل</th>
                      <th className="py-3 px-4">المبلغ الإجمالي</th>
                      <th className="py-3 px-4">رسم المحفظة (1%)</th>
                      <th className="py-3 px-4">صافي المعرض</th>
                      <th className="py-3 px-4">الملاحظات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {itemized.walletSales?.map(s => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-bold text-blue-900" dir="ltr">{s.invoice_no}</td>
                        <td className="py-3 px-4 font-bold text-slate-800">{s.customer_name || 'عميل محفظة'}</td>
                        <td className="py-3 px-4 font-black font-mono text-slate-900" dir="ltr">{Number(s.total).toLocaleString()} {currency}</td>
                        <td className="py-3 px-4 font-mono text-rose-600 font-bold" dir="ltr">-{Number(s.collection_fee || (Number(s.total) * 0.01)).toLocaleString()} {currency}</td>
                        <td className="py-3 px-4 font-black font-mono text-amber-700" dir="ltr">{(Number(s.total) - Number(s.collection_fee || (Number(s.total) * 0.01))).toLocaleString()} {currency}</td>
                        <td className="py-3 px-4 text-slate-500">{s.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: SUPPLIER PAYMENTS */}
          {activeChannelTab === 'suppliers' && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex justify-between items-center text-xs">
                <div>
                  <h4 className="font-black text-sm text-slate-900">سداد مستحقات الموردين والشركات اليوم</h4>
                  <p className="text-slate-600 mt-0.5">سندات الصرف المسجلة لسداد دفعات الموردين (من الخزينة النقدية أو الحساب البنكي)</p>
                </div>
                <div className="flex gap-4 font-mono font-bold">
                  <div>سداد نقدي: <span className="text-rose-700 font-mono">{(supplierPayMetrics.cash_paid || 0).toLocaleString()} {currency}</span></div>
                  <div>سداد بنكي: <span className="text-indigo-700 font-mono">{(supplierPayMetrics.bank_paid || 0).toLocaleString()} {currency}</span></div>
                  <div>إجمالي السداد: <span className="text-slate-900 font-mono">{(supplierPayMetrics.total || 0).toLocaleString()} {currency}</span></div>
                </div>
              </div>
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold">
                    <tr>
                      <th className="py-3 px-4">رقم السند</th>
                      <th className="py-3 px-4">المورد</th>
                      <th className="py-3 px-4">نوع السداد</th>
                      <th className="py-3 px-4">طريقة الدفع</th>
                      <th className="py-3 px-4">المبلغ</th>
                      <th className="py-3 px-4">البيان والملاحظات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {itemized.supplierPaymentsList?.map(sp => (
                      <tr key={sp.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">#{sp.id}</td>
                        <td className="py-3 px-4 font-bold text-slate-800">{sp.supplier_name}</td>
                        <td className="py-3 px-4"><span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold">{sp.payment_type === 'full' ? 'كامل المديونية' : 'دفعة تحت الحساب'}</span></td>
                        <td className="py-3 px-4"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${sp.payment_method === 'cash' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>{sp.payment_method === 'cash' ? '💵 نقداً من الخزينة' : '🏦 تحويل بنكي'}</span></td>
                        <td className="py-3 px-4 font-black font-mono text-rose-700" dir="ltr">{Number(sp.amount).toLocaleString()} {currency}</td>
                        <td className="py-3 px-4 text-slate-500">{sp.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: RETURNS */}
          {activeChannelTab === 'returns' && (
            <div className="space-y-4">
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex justify-between items-center text-xs">
                <div>
                  <h4 className="font-black text-sm text-rose-900">سجل مرتجعات المبيعات اليوم</h4>
                  <p className="text-slate-600 mt-0.5">تفصيل المبالغ المستردة نقداً أو المضافة إلى رصيد حساب العميل</p>
                </div>
                <div className="flex gap-4 font-mono font-bold">
                  <div>استرداد نقدي: <span className="text-rose-700 font-mono">{(returnMetrics.cash_refunds || 0).toLocaleString()} {currency}</span></div>
                  <div>رصيد عميل (دائن): <span className="text-blue-700 font-mono">{(returnMetrics.credit_refunds || 0).toLocaleString()} {currency}</span></div>
                  <div>إجمالي المرتجع: <span className="text-slate-900 font-mono">{(returnMetrics.total || 0).toLocaleString()} {currency}</span></div>
                </div>
              </div>
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold">
                    <tr>
                      <th className="py-3 px-4">رقم المرتجع</th>
                      <th className="py-3 px-4">رقم الفاتورة</th>
                      <th className="py-3 px-4">العميل</th>
                      <th className="py-3 px-4">طريقة الاسترداد</th>
                      <th className="py-3 px-4">المبلغ المسترد</th>
                      <th className="py-3 px-4">السبب</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {itemized.returnsList?.map(r => (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">#{r.id}</td>
                        <td className="py-3 px-4 font-mono text-blue-900">{r.invoice_no}</td>
                        <td className="py-3 px-4 font-bold text-slate-800">{r.customer_name || 'عميل'}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.refund_method === 'credit' ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'}`}>
                            {r.refund_method === 'credit' ? '💼 إضافة لرصيد العميل' : '💵 استرداد نقدي من الخزينة'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-black font-mono text-rose-700" dir="ltr">{Number(r.refund_amount).toLocaleString()} {currency}</td>
                        <td className="py-3 px-4 text-slate-500">{r.reason || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: ALL / OTHER CHANNELS TABLE */}
          {(activeChannelTab === 'all' || activeChannelTab === 'installments' || activeChannelTab === 'expenses') && (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold">
                  <tr>
                    <th className="py-3 px-4">المعرف / الرقم</th>
                    <th className="py-3 px-4">التاريخ والوقت</th>
                    <th className="py-3 px-4">البيان / العميل</th>
                    <th className="py-3 px-4">طريقة التحصيل</th>
                    <th className="py-3 px-4">المبلغ</th>
                    <th className="py-3 px-4">الملاحظات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {/* If All or Cash Sales */}
                  {activeChannelTab === 'all' && itemized.pureCashSales?.map(s => (
                    <tr key={`cash-${s.id}`} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-bold text-blue-900" dir="ltr">{s.invoice_no}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{new Date(s.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{s.customer_name || 'مبيعات كاش بالصالة'}</td>
                      <td className="py-3 px-4"><span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">💵 نقدي كاش</span></td>
                      <td className="py-3 px-4 font-black text-emerald-700 font-mono" dir="ltr">{Number(s.paid_amount).toLocaleString()} {currency}</td>
                      <td className="py-3 px-4 text-slate-500">{s.notes || '-'}</td>
                    </tr>
                  ))}

                  {/* Cards in ALL */}
                  {activeChannelTab === 'all' && itemized.visaSales?.map(s => (
                    <tr key={`card-${s.id}`} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-bold text-blue-900" dir="ltr">{s.invoice_no}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{new Date(s.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{s.customer_name || 'عميل فيزا'}</td>
                      <td className="py-3 px-4"><span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px]">💳 فيزا POS (2%)</span></td>
                      <td className="py-3 px-4 font-black text-blue-700 font-mono" dir="ltr">{Number(s.total).toLocaleString()} {currency}</td>
                      <td className="py-3 px-4 text-slate-500">{s.notes || '-'}</td>
                    </tr>
                  ))}

                  {/* InstaPay in ALL */}
                  {activeChannelTab === 'all' && itemized.instapaySales?.map(s => (
                    <tr key={`insta-${s.id}`} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-bold text-blue-900" dir="ltr">{s.invoice_no}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{new Date(s.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{s.customer_name || 'عميل إنستاباي'}</td>
                      <td className="py-3 px-4"><span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold text-[10px]">⚡ إنستاباي</span></td>
                      <td className="py-3 px-4 font-black text-purple-700 font-mono" dir="ltr">{Number(s.total).toLocaleString()} {currency}</td>
                      <td className="py-3 px-4 text-slate-500">{s.notes || '-'}</td>
                    </tr>
                  ))}

                  {/* Wallet in ALL */}
                  {activeChannelTab === 'all' && itemized.walletSales?.map(s => (
                    <tr key={`wal-${s.id}`} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-bold text-blue-900" dir="ltr">{s.invoice_no}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{new Date(s.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{s.customer_name || 'عميل محفظة'}</td>
                      <td className="py-3 px-4"><span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">📱 محفظة (1%)</span></td>
                      <td className="py-3 px-4 font-black text-amber-700 font-mono" dir="ltr">{Number(s.total).toLocaleString()} {currency}</td>
                      <td className="py-3 px-4 text-slate-500">{s.notes || '-'}</td>
                    </tr>
                  ))}

                  {/* Installments Collected */}
                  {(activeChannelTab === 'all' || activeChannelTab === 'installments') && itemized.installmentPayments?.map(p => (
                    <tr key={`inst-${p.id}`} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-bold text-amber-900" dir="ltr">إيصال #{p.receipt_no || p.id}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{p.paid_date}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{p.customer_name} (قسط #{p.installment_no})</td>
                      <td className="py-3 px-4"><span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">📅 سداد قسط ({p.payment_method || 'نقدي'})</span></td>
                      <td className="py-3 px-4 font-black text-amber-700 font-mono" dir="ltr">{Number(p.amount_paid).toLocaleString()} {currency}</td>
                      <td className="py-3 px-4 text-slate-500">{p.notes || '-'}</td>
                    </tr>
                  ))}

                  {/* Expenses */}
                  {(activeChannelTab === 'all' || activeChannelTab === 'expenses') && itemized.cashExpenses?.map(e => (
                    <tr key={`exp-${e.id}`} className="hover:bg-slate-50 bg-rose-50/20">
                      <td className="py-3 px-4 font-mono font-bold text-rose-800" dir="ltr">صرف #{e.id}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{new Date(e.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="py-3 px-4 font-bold text-rose-900">{e.description || e.category}</td>
                      <td className="py-3 px-4"><span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[10px]">🔻 منصرف خزينة</span></td>
                      <td className="py-3 px-4 font-black text-rose-700 font-mono" dir="ltr">-{Number(e.amount).toLocaleString()} {currency}</td>
                      <td className="py-3 px-4 text-slate-500">{e.category}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODAL: OFFICIAL A4 CLOSING PRINT SHEET */}
      {/* ============================================================ */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-slate-100 rounded-2xl shadow-2xl max-w-4xl w-full flex flex-col my-auto max-h-[96vh]">
            {/* Top Control Bar (Hidden when printed) */}
            <div className="no-print bg-slate-900 text-white p-4 rounded-t-2xl flex items-center justify-between shadow-md">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">محضر تقفيل اليومية ومطابقة طرق الدفع والخزينة الرسمي</h3>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition shadow cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة أو حفظ كملف PDF</span>
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Printable Sheet */}
            <div className="overflow-y-auto p-4 sm:p-8 flex justify-center bg-slate-200/50">
              <div 
                className="bg-white text-slate-900 w-[210mm] min-h-[297mm] p-[15mm] shadow-2xl border border-slate-300 relative font-['Cairo',sans-serif] text-xs flex flex-col justify-between"
                dir="rtl"
              >
                <div>
                  {/* Formal Header */}
                  <div className="border-b-2 border-slate-900 pb-4 mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold">جمهورية مصر العربية</p>
                      <h1 className="text-base font-black text-slate-900">{storeName}</h1>
                      <p className="text-[10px] text-slate-600">السجل التجاري (س.ت): <span className="font-mono font-bold">{commercialReg}</span> | البطاقة الضريبية (ب.ض): <span className="font-mono font-bold">{taxId}</span></p>
                    </div>

                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto p-1 border rounded-xl mb-1 flex items-center justify-center">
                        <img src="/logo.svg" alt="شعار" className="max-h-full max-w-full object-contain" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-500">محضر مراجعة وتقفيل يومية معتمد</span>
                    </div>

                    <div className="text-left border border-slate-300 p-2 rounded-lg bg-slate-50 text-[10px] space-y-0.5" dir="rtl">
                      <div>التاريخ: <span className="font-bold font-mono">{selectedDate}</span></div>
                      <div>الفرع: <span className="font-bold">{selectedBranch ? branches.find(b => b.id === Number(selectedBranch))?.name : 'المركز الرئيسي'}</span></div>
                      <div>المسؤول: <span className="font-bold">{currentUser?.name || 'الكاشير والمراجع'}</span></div>
                    </div>
                  </div>

                  {/* Title Banner */}
                  <div className="bg-slate-900 text-white py-1.5 px-3 rounded text-center mb-4 font-black text-xs">
                    محضر جرد الخزينة والتقفيل اليومي لقنوات الدفع والتحصيل
                  </div>

                  {/* Summary Table */}
                  <table className="w-full text-right border-collapse border border-slate-300 mb-4 text-xs">
                    <thead>
                      <tr className="bg-slate-100 font-bold">
                        <th className="border border-slate-300 p-2">قناة وطريقة الدفع</th>
                        <th className="border border-slate-300 p-2 text-center">عدد العمليات</th>
                        <th className="border border-slate-300 p-2 text-center">إجمالي المبلغ المحصل</th>
                        <th className="border border-slate-300 p-2 text-center">العمولات والمصاريف</th>
                        <th className="border border-slate-300 p-2 text-center">صافي التدفق للمعرض</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Cash Drawer */}
                      <tr>
                        <td className="border border-slate-300 p-2 font-bold">💵 النقدية والكاش بالدرج</td>
                        <td className="border border-slate-300 p-2 text-center">{(itemized.pureCashSales?.length || 0) + (installmentMetrics.count || 0)}</td>
                        <td className="border border-slate-300 p-2 text-center font-mono">{(cashMetrics.total_cash_in || 0).toLocaleString()} {currency}</td>
                        <td className="border border-slate-300 p-2 text-center font-mono text-rose-700">مصروفات: -{(cashMetrics.total_cash_out || 0).toLocaleString()} {currency}</td>
                        <td className="border border-slate-300 p-2 text-center font-mono font-bold text-emerald-800">{(cashMetrics.net_cash_drawer_flow || 0).toLocaleString()} {currency}</td>
                      </tr>
                      {/* Visa POS */}
                      <tr>
                        <td className="border border-slate-300 p-2 font-bold">💳 بطاقات ائتمان / فيزا POS (2%)</td>
                        <td className="border border-slate-300 p-2 text-center">{visaMetrics.count || 0}</td>
                        <td className="border border-slate-300 p-2 text-center font-mono">{(visaMetrics.gross || 0).toLocaleString()} {currency}</td>
                        <td className="border border-slate-300 p-2 text-center font-mono text-rose-700">-{(visaMetrics.fees || 0).toLocaleString()} {currency}</td>
                        <td className="border border-slate-300 p-2 text-center font-mono font-bold text-blue-800">{(visaMetrics.net || 0).toLocaleString()} {currency}</td>
                      </tr>
                      {/* InstaPay */}
                      <tr>
                        <td className="border border-slate-300 p-2 font-bold">⚡ إنستاباي InstaPay (1ج/1000ج)</td>
                        <td className="border border-slate-300 p-2 text-center">{instapayMetrics.count || 0}</td>
                        <td className="border border-slate-300 p-2 text-center font-mono">{(instapayMetrics.gross || 0).toLocaleString()} {currency}</td>
                        <td className="border border-slate-300 p-2 text-center font-mono text-rose-700">-{(instapayMetrics.fees || 0).toLocaleString()} {currency}</td>
                        <td className="border border-slate-300 p-2 text-center font-mono font-bold text-purple-800">{(instapayMetrics.net || 0).toLocaleString()} {currency}</td>
                      </tr>
                      {/* Wallets */}
                      <tr>
                        <td className="border border-slate-300 p-2 font-bold">📱 محافظ إلكترونية كاش (1%)</td>
                        <td className="border border-slate-300 p-2 text-center">{walletMetrics.count || 0}</td>
                        <td className="border border-slate-300 p-2 text-center font-mono">{(walletMetrics.gross || 0).toLocaleString()} {currency}</td>
                        <td className="border border-slate-300 p-2 text-center font-mono text-rose-700">-{(walletMetrics.fees || 0).toLocaleString()} {currency}</td>
                        <td className="border border-slate-300 p-2 text-center font-mono font-bold text-amber-800">{(walletMetrics.net || 0).toLocaleString()} {currency}</td>
                      </tr>
                      {/* Consumer Finance */}
                      <tr>
                        <td className="border border-slate-300 p-2 font-bold">🏢 شركات التمويل (فاليو، كونتاكت، سهولة...)</td>
                        <td className="border border-slate-300 p-2 text-center">{financeMetrics.count || 0}</td>
                        <td className="border border-slate-300 p-2 text-center font-mono">{(financeMetrics.gross || 0).toLocaleString()} {currency}</td>
                        <td className="border border-slate-300 p-2 text-center font-mono text-rose-700">-{(financeMetrics.fees || 0).toLocaleString()} {currency}</td>
                        <td className="border border-slate-300 p-2 text-center font-mono font-bold text-indigo-900">{(financeMetrics.net || 0).toLocaleString()} {currency}</td>
                      </tr>
                      {/* Banks */}
                      <tr>
                        <td className="border border-slate-300 p-2 font-bold">🏦 تمويلات البنوك المباشرة</td>
                        <td className="border border-slate-300 p-2 text-center">{bankMetrics.count || 0}</td>
                        <td className="border border-slate-300 p-2 text-center font-mono">{(bankMetrics.gross || 0).toLocaleString()} {currency}</td>
                        <td className="border border-slate-300 p-2 text-center font-mono text-rose-700">-{(bankMetrics.fees || 0).toLocaleString()} {currency}</td>
                        <td className="border border-slate-300 p-2 text-center font-mono font-bold text-slate-800">{(bankMetrics.net || 0).toLocaleString()} {currency}</td>
                      </tr>
                      {/* Supplier Payments (Cash Out) */}
                      <tr>
                        <td className="border border-slate-300 p-2 font-bold text-rose-800">🚚 سداد دفعات للموردين من الخزينة</td>
                        <td className="border border-slate-300 p-2 text-center">{supplierPayMetrics.count || 0}</td>
                        <td className="border border-slate-300 p-2 text-center font-mono text-rose-700">-{(supplierPayMetrics.cash_paid || 0).toLocaleString()} {currency}</td>
                        <td className="border border-slate-300 p-2 text-center font-mono text-slate-400">---</td>
                        <td className="border border-slate-300 p-2 text-center font-mono font-bold text-rose-700">-{(supplierPayMetrics.cash_paid || 0).toLocaleString()} {currency}</td>
                      </tr>
                      {/* Returns */}
                      <tr>
                        <td className="border border-slate-300 p-2 font-bold text-rose-800">🔄 مرتجعات مبيعات مستردة نقداً</td>
                        <td className="border border-slate-300 p-2 text-center">{returnMetrics.count || 0}</td>
                        <td className="border border-slate-300 p-2 text-center font-mono text-rose-700">-{(returnMetrics.cash_refunds || 0).toLocaleString()} {currency}</td>
                        <td className="border border-slate-300 p-2 text-center font-mono text-slate-400">---</td>
                        <td className="border border-slate-300 p-2 text-center font-mono font-bold text-rose-700">-{(returnMetrics.cash_refunds || 0).toLocaleString()} {currency}</td>
                      </tr>
                      {/* Gross Revenue Total */}
                      <tr className="bg-slate-100 font-black text-sm">
                        <td className="border border-slate-300 p-2">الإجمالي العام لتداول اليوم</td>
                        <td className="border border-slate-300 p-2 text-center font-mono">{summary.total_invoices_count || 0} فاتورة</td>
                        <td className="border border-slate-300 p-2 text-center font-mono" colSpan="3">
                          {(summary.total_gross_revenue || 0).toLocaleString()} {currency}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Cash Drawer Status in Document */}
                  <div className="border border-slate-300 rounded p-3 bg-slate-50 mb-4 space-y-1">
                    <p className="font-bold text-slate-800">نتيجة جرد ومطابقة الدرج النقدي:</p>
                    <div className="grid grid-cols-3 gap-2 font-mono text-[11px] pt-1">
                      <div>المتوقع دفترياً: <strong>{expectedCash.toLocaleString()} {currency}</strong></div>
                      <div>الفعلي بالعد: <strong>{actualCashCounted ? Number(actualCashCounted).toLocaleString() : '---'} {currency}</strong></div>
                      <div>الفارق: <strong className={cashDifference === 0 ? 'text-emerald-700' : 'text-rose-700'}>
                        {cashDifference !== null ? (cashDifference === 0 ? 'مطابق تماماً' : `${cashDifference} ${currency}`) : '---'}
                      </strong></div>
                    </div>
                    {drawerNotes && <p className="text-[10px] text-slate-600 pt-1">ملاحظة التقفيل: {drawerNotes}</p>}
                  </div>
                </div>

                {/* Signatures & Certification */}
                <div className="border-t-2 border-slate-900 pt-4 mt-6">
                  <div className="grid grid-cols-3 gap-4 text-center items-end">
                    <div>
                      <span className="font-bold block text-xs">كاشير الخزينة</span>
                      <span className="text-[10px] text-slate-500">{currentUser?.name || 'أمين الخزينة'}</span>
                      <div className="border-b border-dashed border-slate-400 mt-6 pb-1">
                        <span className="text-[9px] text-slate-400">التوقيع: ....................</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20 rounded-full border border-dashed border-amber-800 p-1 flex flex-col items-center justify-center text-center text-amber-900 bg-amber-50/50">
                        <span className="text-[8px] font-black">خاتم الإدارة المالية</span>
                        <span className="text-[9px] font-bold mt-0.5">{storeName}</span>
                        <span className="text-[7px]">معتمد رسمياً</span>
                      </div>
                    </div>

                    <div>
                      <span className="font-bold block text-xs">المراجع المالي / المدير</span>
                      <span className="text-[10px] text-slate-500">الحاج عبد العزيز</span>
                      <div className="border-b border-dashed border-slate-400 mt-6 pb-1">
                        <span className="text-[9px] text-slate-400">التوقيع: ....................</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-2 border-t border-slate-200 flex justify-between text-[8px] text-slate-400">
                    <span>حرر إلكترونياً عبر منظومة دكان عبد العزيز v3.1.0</span>
                    <span>تاريخ وساعة التقفيل: {new Date().toLocaleString('ar-EG')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
