import React, { useState, useEffect } from 'react';
import { 
  CalendarClock, 
  Search, 
  Printer, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  ShieldCheck, 
  FileText, 
  DollarSign, 
  Clock, 
  PhoneCall,
  Eye,
  X
} from 'lucide-react';
import { api } from '../api';

export default function Installments({ onPrintContract, onPrintReceipt, settings }) {
  const [plans, setPlans] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Selected Plan for detailed schedule view & payment
  const [viewPlan, setViewPlan] = useState(null);
  const [payPayment, setPayPayment] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('cash');
  const [payNotes, setPayNotes] = useState('');
  const [isSubmittingPay, setIsSubmittingPay] = useState(false);

  const currency = settings?.currency || 'ج.م';

  useEffect(() => {
    loadPlans();
  }, [statusFilter, search]);

  const loadPlans = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (search) params.append('search', search);

      const data = await api.getInstallments(params.toString());
      setPlans(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPlanDetails = async (planId) => {
    try {
      const fullPlan = await api.getInstallmentPlan(planId);
      setViewPlan(fullPlan);
    } catch (err) {
      alert(err.message || 'خطأ أثناء جلب تفاصيل العقد');
    }
  };

  const handleOpenPayModal = (payment) => {
    setPayPayment(payment);
    setPayAmount(payment.amount_due);
    setPayMethod('cash');
    setPayNotes('');
  };

  const handleConfirmPayment = async (e) => {
    e.preventDefault();
    if (!payPayment) return;

    setIsSubmittingPay(true);
    try {
      const res = await api.payInstallment(payPayment.id, {
        amount_paid: Number(payAmount),
        payment_method: payMethod,
        notes: payNotes
      });

      // Show receipt print
      if (onPrintReceipt) {
        onPrintReceipt({
          receiptNo: res.receiptNo,
          customerName: viewPlan ? viewPlan.customer_name : 'العميل',
          dueDate: payPayment.due_date,
          installmentNo: payPayment.installment_no,
          amountPaid: payAmount,
          remainingBalance: res.newBalance
        });
      }

      setPayPayment(null);
      // Refresh current plan and table
      if (viewPlan) {
        handleOpenPlanDetails(viewPlan.id);
      }
      loadPlans();
    } catch (err) {
      alert(err.message || 'خطأ أثناء تسجيل السداد');
    } finally {
      setIsSubmittingPay(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <CalendarClock className="w-6 h-6 text-blue-600" />
            إدارة عقود البيع بالتقسيط والأقساط الشهرية
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            متابعة خطط السداد، كشوفات حساب العملاء، تواريخ الاستحقاق، وطباعة العقود الرسمية وإيصالات الأمانة
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="بحث باسم العميل، الهاتف، أو الضامن..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
        {[
          { id: '', label: 'جميع عقود التقسيط' },
          { id: 'active', label: 'العقود النشطة الجارية' },
          { id: 'completed', label: 'العقود المسددة بالكامل' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === tab.id
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Plans List Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold">
                <th className="py-3 px-4">رقم العقد / الفاتورة</th>
                <th className="py-3 px-4">العميل والمشتري</th>
                <th className="py-3 px-4">الضامن المتضامن</th>
                <th className="py-3 px-4">إجمالي المبلغ</th>
                <th className="py-3 px-4">المقدم المسدد</th>
                <th className="py-3 px-4">المتبقي أقساط</th>
                <th className="py-3 px-4">القسط الشهري</th>
                <th className="py-3 px-4">حالة السداد</th>
                <th className="py-3 px-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {plans.map((p) => {
                const paidPercentage = Math.round(((p.total_installment_amount - p.remaining_balance) / p.total_installment_amount) * 100);
                return (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-700" dir="ltr">
                      {p.invoice_no}
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-extrabold text-slate-900 text-sm">{p.customer_name}</p>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5" dir="ltr">{p.customer_phone}</p>
                    </td>

                    <td className="py-3.5 px-4 text-[11px]">
                      {p.guarantor_name ? (
                        <div>
                          <p className="font-bold text-slate-800">{p.guarantor_name}</p>
                          <p className="text-slate-400 font-mono" dir="ltr">{p.guarantor_phone}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400">بدون ضامن</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-800" dir="ltr">
                      {Number(p.total_installment_amount).toLocaleString()} {currency}
                    </td>

                    <td className="py-3.5 px-4 text-emerald-700 font-bold" dir="ltr">
                      {Number(p.down_payment).toLocaleString()} {currency}
                    </td>

                    <td className="py-3.5 px-4 font-black text-rose-600 text-sm" dir="ltr">
                      {Number(p.remaining_balance).toLocaleString()} {currency}
                    </td>

                    <td className="py-3.5 px-4 font-extrabold text-blue-800" dir="ltr">
                      {Number(p.monthly_amount).toLocaleString()} {currency}
                      <span className="block text-[10px] text-slate-400 font-normal">({p.installments_count} شهر)</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="w-28">
                        <div className="flex justify-between text-[10px] font-bold mb-1">
                          <span className={p.remaining_balance === 0 ? 'text-emerald-700' : 'text-slate-600'}>
                            {p.remaining_balance === 0 ? 'خالص السداد' : `${paidPercentage}%`}
                          </span>
                          <span className="text-slate-400">{p.paid_count}/{p.installments_count}</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              p.remaining_balance === 0 ? 'bg-emerald-500' : 'bg-blue-600'
                            }`}
                            style={{ width: `${paidPercentage}%` }}
                          ></div>
                        </div>
                        {p.late_count > 0 && (
                          <span className="text-[10px] text-rose-600 font-bold mt-1 block">
                            ⚠️ {p.late_count} قسط متأخر
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenPlanDetails(p.id)}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>كشف الحساب والجدول</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Plan Details & Payment Schedule Modal */}
      {viewPlan && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-slate-800 flex items-center gap-2">
                  <CalendarClock className="w-5 h-5 text-blue-600" />
                  كشف حساب أقساط العميل: {viewPlan.customer_name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  رقم الفاتورة: {viewPlan.invoice_no} | هاتف: {viewPlan.customer_phone}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => onPrintContract(viewPlan)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة العقد وإيصال الأمانة</span>
                </button>
                <button
                  onClick={() => setViewPlan(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="p-4 bg-slate-100 border-b border-slate-200 grid grid-cols-4 gap-3 text-xs">
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 block">إجمالي المقسط</span>
                <span className="font-black text-slate-900 text-sm" dir="ltr">
                  {Number(viewPlan.total_installment_amount).toLocaleString()} {currency}
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 block">المقدم المسدد</span>
                <span className="font-black text-emerald-700 text-sm" dir="ltr">
                  {Number(viewPlan.down_payment).toLocaleString()} {currency}
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 block">الرصيد المتبقي</span>
                <span className="font-black text-rose-600 text-sm" dir="ltr">
                  {Number(viewPlan.remaining_balance).toLocaleString()} {currency}
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 block">القسط الشهري</span>
                <span className="font-black text-blue-700 text-sm" dir="ltr">
                  {Number(viewPlan.monthly_amount).toLocaleString()} {currency}
                </span>
              </div>
            </div>

            {/* Schedule List */}
            <div className="flex-1 overflow-y-auto p-4">
              <h4 className="font-bold text-sm text-slate-800 mb-3">جدول الأقساط الشهرية وتواريخ الاستحقاق:</h4>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
                {viewPlan.payments?.map((pm) => {
                  const isPaid = pm.status === 'paid';
                  const isLate = !isPaid && new Date(pm.due_date) < new Date();
                  return (
                    <div key={pm.id} className="p-3 flex items-center justify-between gap-4 hover:bg-slate-50">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                          isPaid
                            ? 'bg-emerald-100 text-emerald-800'
                            : isLate
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          #{pm.installment_no}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">
                            قسط شهر {pm.due_date} {isLate && <span className="text-rose-600 font-extrabold">(متأخر)</span>}
                          </p>
                          {isPaid && (
                            <p className="text-[11px] text-emerald-700 mt-0.5">
                              تم السداد بتاريخ: {pm.paid_date} | إيصال: {pm.receipt_no}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-left">
                          <span className="font-black text-slate-900 text-sm block" dir="ltr">
                            {Number(pm.amount_due).toLocaleString()} {currency}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isPaid
                              ? 'bg-emerald-50 text-emerald-700'
                              : isLate
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}>
                            {isPaid ? 'تم السداد' : isLate ? 'متأخر' : 'مستحق'}
                          </span>
                        </div>

                        {!isPaid ? (
                          <button
                            onClick={() => handleOpenPayModal(pm)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>تحصيل القسط</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => onPrintReceipt({
                              receiptNo: pm.receipt_no,
                              customerName: viewPlan.customer_name,
                              dueDate: pm.due_date,
                              installmentNo: pm.installment_no,
                              amountPaid: pm.amount_paid,
                              remainingBalance: viewPlan.remaining_balance
                            })}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>طباعة الإيصال</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pay Modal */}
      {payPayment && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-xs">
            <h3 className="font-extrabold text-base text-slate-800 mb-1">
              تحصيل قسط شهري (#{payPayment.installment_no})
            </h3>
            <p className="text-slate-500 mb-4">
              تاريخ استحقاق القسط: {payPayment.due_date}
            </p>

            <form onSubmit={handleConfirmPayment} className="space-y-4">
              <div>
                <label className="block text-slate-600 font-bold mb-1">المبلغ المحصل *</label>
                <input
                  type="number"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-mono font-black text-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">طريقة السداد</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800"
                >
                  <option value="cash">نقداً بالمعرض (خزينة كاش)</option>
                  <option value="vodafone_cash">فودافون كاش / محفظة إلكترونية</option>
                  <option value="instapay">انستاباي / تحويل بنكي فوري</option>
                  <option value="pos_card">فيزا / بطاقة بنكية</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">ملاحظات التحصيل (اختياري)</label>
                <input
                  type="text"
                  placeholder="مثال: تم الاستلام من المشتري شخصياً..."
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setPayPayment(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPay}
                  className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تأكيد التحصيل وإصدار الإيصال</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
