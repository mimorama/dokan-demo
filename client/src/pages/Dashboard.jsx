import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  Package, 
  CalendarClock, 
  Wallet, 
  AlertTriangle, 
  ArrowUpRight, 
  ShoppingCart, 
  CheckCircle2, 
  PhoneCall, 
  Receipt, 
  Printer, 
  ChevronLeft,
  ShieldAlert,
  Flame,
  BadgePercent,
  RotateCcw
} from 'lucide-react';
import { api } from '../api';

export default function Dashboard({ onNewSale, onPayInstallment, onViewSale, onReturnSale, settings }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const currency = settings?.currency || 'ج.م';

  const loadData = async () => {
    try {
      const res = await api.getDashboard();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-blue-200 text-xs font-semibold mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              المعرض نشط | تحديث فوري للبيانات
            </div>
            <h1 className="text-2xl sm:text-3xl font-black mb-2">
              أهلاً بك في {settings?.store_name || 'معرض النور للأجهزة الكهربائية'}
            </h1>
            <p className="text-blue-100 text-sm max-w-xl font-medium leading-relaxed">
              إدارة شاملة لمخزن الأجهزة بالسيريال نمبر، أنظمة التقسيط، شهادات الضمان، وفواتير الكاش والأجل في نظام واحد ذكي.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onNewSale}
              className="bg-white hover:bg-slate-100 text-blue-800 font-extrabold px-6 py-3 rounded-2xl shadow-lg transition-all duration-200 cursor-pointer flex items-center gap-2 active:scale-98"
            >
              <ShoppingCart className="w-5 h-5" />
              <span>فاتورة بيع سريعة</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Sales Today & This Month */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">مبيعات اليوم</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {Number(data.todaySales?.total || 0).toLocaleString()} <span className="text-xs font-normal text-slate-500">{currency}</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>مبيعات هذا الشهر:</span>
            <span className="font-extrabold text-blue-600">{Number(data.monthSales?.total || 0).toLocaleString()} {currency}</span>
          </div>
        </div>

        {/* Stock Status & Serials */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">الأجهزة بالمخزن (بالسيريال)</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {data.inStockSerials} <span className="text-xs font-normal text-slate-500">جهاز متاح</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>قيمة المخزون الإجمالية:</span>
            <span className="font-extrabold text-emerald-600">{Number(data.stockValuation?.totalCost || 0).toLocaleString()} {currency}</span>
          </div>
        </div>

        {/* Active Installments & Outstanding Debt */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">عقود التقسيط النشطة</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <CalendarClock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {data.activePlans?.count || 0} <span className="text-xs font-normal text-slate-500">عقد نشط</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>إجمالي مستحقات الأقساط:</span>
            <span className="font-extrabold text-amber-700">{Number(data.activePlans?.totalRemaining || 0).toLocaleString()} {currency}</span>
          </div>
        </div>

        {/* Overdue Installments Warning */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">أقساط متأخرة واجبة التحصيل</span>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 tracking-tight">
            {data.overdueInstallments?.count || 0} <span className="text-xs font-normal text-rose-400">قسط متأخر</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>مبلغ المتأخرات:</span>
            <span className="font-extrabold text-rose-600">{Number(data.overdueInstallments?.totalLate || 0).toLocaleString()} {currency}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Collections Alert + Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Due Payments List (2 columns) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-blue-600" />
                أقساط مستحقة للتحصيل (خلال 15 يوم أو متأخرة)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">متابعة سداد العملاء والاتصال بهم لتسجيل التحصيل</p>
            </div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              {data.upcomingPayments?.length || 0} مستحق
            </span>
          </div>

          {data.upcomingPayments && data.upcomingPayments.length > 0 ? (
            <div className="divide-y divide-slate-100 overflow-x-auto">
              {data.upcomingPayments.map((p) => {
                const isLate = new Date(p.due_date) < new Date();
                return (
                  <div key={p.id} className="py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/80 px-2 rounded-xl transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${
                        isLate ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                      }`}>
                        #{p.installment_no}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{p.customer_name}</h4>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <span dir="ltr">{p.customer_phone}</span>
                          <span>•</span>
                          <span className={isLate ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                            تاريخ الاستحقاق: {p.due_date} {isLate && '(متأخر)'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-left">
                        <span className="font-extrabold text-slate-900 text-sm block" dir="ltr">
                          {Number(p.amount_due).toLocaleString()} {currency}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isLate ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {isLate ? 'متأخر عن السداد' : 'قيد الانتظار'}
                        </span>
                      </div>

                      <button
                        onClick={() => onPayInstallment(p)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>تحصيل</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 text-slate-400">
              <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 mb-2 opacity-80" />
              <p className="font-bold text-slate-700">لا توجد أقساط متأخرة أو مستحقة حالياً</p>
              <p className="text-xs text-slate-400 mt-1">جميع الأقساط مسددة في مواعيدها بنجاح</p>
            </div>
          )}
        </div>

        {/* Low Stock Alerts (1 column) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              أجهزة أوشكت على النفاد
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">تنبيه المخزن</span>
          </div>

          {data.lowStockProducts && data.lowStockProducts.length > 0 ? (
            <div className="space-y-3">
              {data.lowStockProducts.map((prod) => (
                <div key={prod.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-xs text-slate-800">{prod.name}</h5>
                    <p className="text-[10px] text-slate-500 mt-0.5">{prod.brand_name} | {prod.model_number}</p>
                  </div>
                  <div className="text-center">
                    <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-black ${
                      prod.stock_count === 0 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {prod.stock_count === 0 ? 'نفد تماماً' : `${prod.stock_count} متبقي`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <Package className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-xs">المخزون كافي لجميع الأجهزة</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Sales List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <Receipt className="w-5 h-5 text-blue-600" />
            آخر الفواتير والمبيعات المسجلة
          </h3>
          <span className="text-xs text-slate-400">سجل المعرض الفوري</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold">
                <th className="py-2.5 px-3">رقم الفاتورة</th>
                <th className="py-2.5 px-3">العميل</th>
                <th className="py-2.5 px-3">نوع البيع</th>
                <th className="py-2.5 px-3">إجمالي الفاتورة</th>
                <th className="py-2.5 px-3">المدفوع / المقدم</th>
                <th className="py-2.5 px-3">التاريخ</th>
                <th className="py-2.5 px-3 text-center">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {data.recentSales && data.recentSales.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-3 font-mono font-bold text-blue-600" dir="ltr">{s.invoice_no}</td>
                  <td className="py-3 px-3 font-bold text-slate-800">{s.customer_name}</td>
                  <td className="py-3 px-3">
                    <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                      s.sale_type === 'installment'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {s.sale_type === 'installment' ? 'تقسيط شهري' : 'كاش فوري'}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-extrabold text-slate-900" dir="ltr">
                    {Number(s.total).toLocaleString()} {currency}
                  </td>
                  <td className="py-3 px-3 text-emerald-700 font-bold" dir="ltr">
                    {Number(s.paid_amount).toLocaleString()} {currency}
                  </td>
                  <td className="py-3 px-3 text-slate-500">{new Date(s.created_at).toLocaleDateString('ar-EG')}</td>
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => onViewSale(s.id)}
                        className="bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                        title="عرض الفاتورة والطباعة"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>طباعة</span>
                      </button>
                      {onReturnSale && (
                        <button
                          onClick={() => onReturnSale(s)}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-700 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                          title="إرجاع واسترداد أجهزة (مرتجع)"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>مرتجع</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
