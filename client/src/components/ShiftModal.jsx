import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Wallet, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  FileCheck, 
  DollarSign, 
  Calculator, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { api } from '../api';

export default function ShiftModal({ isOpen, onClose, currentUser, onShiftClosed }) {
  const [shiftData, setShiftData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Open shift form
  const [openingBalance, setOpeningBalance] = useState('500');
  const [openNotes, setOpenNotes] = useState('');

  // Close shift form
  const [actualCash, setActualCash] = useState('');
  const [closeNotes, setCloseNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadShift();
    }
  }, [isOpen, currentUser]);

  const loadShift = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getCurrentShift(currentUser?.id || 1);
      setShiftData(data);
      if (data?.hasOpenShift) {
        setActualCash(String(data.liveMetrics?.expected_cash || 0));
      }
    } catch (err) {
      setError(err.message || 'خطأ في جلب بيانات الوردية');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleOpenShift = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.openShift({
        user_id: currentUser?.id || 1,
        user_name: currentUser?.name || 'الكاشير',
        branch_id: currentUser?.branch_id || 1,
        opening_balance: Number(openingBalance) || 0,
        notes: openNotes
      });
      alert('تم فتح الوردية بنجاح!');
      loadShift();
    } catch (err) {
      alert(err.message || 'خطأ أثناء فتح الوردية');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseShift = async (e) => {
    e.preventDefault();
    if (!window.confirm('هل أنت متأكد من رغبتك في تقفيل الوردية الحالية وإصدار تقرير Z-Report؟')) return;

    setSubmitting(true);
    try {
      const res = await api.closeShift({
        shift_id: shiftData.shift.id,
        actual_cash: Number(actualCash) || 0,
        notes: closeNotes,
        closed_by: currentUser?.name || 'الكاشير'
      });
      onClose();
      if (onShiftClosed) {
        onShiftClosed(res.zReport);
      }
    } catch (err) {
      alert(err.message || 'خطأ أثناء إغلاق الوردية');
    } finally {
      setSubmitting(false);
    }
  };

  const expected = shiftData?.liveMetrics?.expected_cash || 0;
  const actual = Number(actualCash) || 0;
  const diff = actual - expected;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 max-h-[92vh] flex flex-col border border-slate-200 font-['Cairo',sans-serif]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900">إدارة ورديات الكاشير وتقفيل الخزينة</h3>
              <p className="text-xs text-slate-500">متابعة النقدية بالدرج وإصدار تقارير التصفية Z-Report</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {loading ? (
            <div className="py-12 text-center text-slate-400">
              <div className="animate-spin rounded-full h-8 w-8 border-3 border-blue-600 border-t-transparent mx-auto mb-2"></div>
              <p className="text-xs font-bold">جاري فحص حالة الوردية...</p>
            </div>
          ) : !shiftData?.hasOpenShift ? (
            /* STATE 1: NO OPEN SHIFT -> OPEN NEW SHIFT */
            <form onSubmit={handleOpenShift} className="space-y-4 text-xs">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-900">
                <span className="font-bold block text-sm mb-1">لا توجد وردية مفتوحة حالياً</span>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  يجب فتح وردية جديدة قبل البدء في إصدار فواتير البيع وتسجيل تحصيلات الأقساط لحساب العجز والزيادة بدقة.
                </p>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">الرصيد الافتتاحي في درج الكاشير (فكة/سلفة) *</label>
                <div className="relative">
                  <Wallet className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                  <input
                    type="number"
                    min="0"
                    required
                    value={openingBalance}
                    onChange={(e) => setOpeningBalance(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2.5 font-bold font-mono text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">ملاحظات فتح الوردية</label>
                <input
                  type="text"
                  placeholder="مثال: استلام الدرج بفكة 500 جنيه كاملة"
                  value={openNotes}
                  onChange={(e) => setOpenNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Clock className="w-4 h-4" />
                  <span>بدء وفتح الوردية الآن</span>
                </button>
              </div>
            </form>
          ) : (
            /* STATE 2: ACTIVE SHIFT -> LIVE STATS & CLOSE SHIFT FORM */
            <form onSubmit={handleCloseShift} className="space-y-4 text-xs">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-emerald-700 font-bold block">وردية نشطة ومفتوحة</span>
                  <span className="font-mono font-black text-sm text-emerald-900">{shiftData.shift.shift_no}</span>
                </div>
                <span className="text-[10px] text-emerald-600 font-bold">
                  بدأت: {shiftData.shift.start_time?.slice(11, 16)}
                </span>
              </div>

              {/* Live Drawer Breakdown */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                <div className="p-3 bg-slate-50 border-b border-slate-200 font-bold text-slate-700 flex justify-between">
                  <span>حركة النقدية بالدرج خلال الوردية:</span>
                  <span className="text-[10px] text-slate-400">تحديث لحظي</span>
                </div>
                <div className="p-3 space-y-1.5 text-[11px]">
                  <div className="flex justify-between text-slate-600">
                    <span>الرصيد الافتتاحي:</span>
                    <span className="font-mono font-bold">{Number(shiftData.liveMetrics.opening_balance).toLocaleString()} ج.م</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>مبيعات نقدية محصلة:</span>
                    <span className="font-mono font-bold text-emerald-700">+{Number(shiftData.liveMetrics.cash_sales).toLocaleString()} ج.م</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>أقساط محصلة بالخزينة:</span>
                    <span className="font-mono font-bold text-emerald-700">+{Number(shiftData.liveMetrics.cash_installments).toLocaleString()} ج.م</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>إيداعات ومقبوضات أخرى:</span>
                    <span className="font-mono font-bold text-emerald-700">+{Number(shiftData.liveMetrics.cash_inflows).toLocaleString()} ج.م</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>منصرفات ومصروفات نقدية:</span>
                    <span className="font-mono font-bold text-rose-600">-{Number(shiftData.liveMetrics.cash_expenses).toLocaleString()} ج.م</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-xs text-blue-900 bg-blue-50/50 -mx-3 -mb-3 p-3">
                    <span>النقدية المتوقعة دفترياً بالدرج:</span>
                    <span className="font-mono font-black text-sm">{Number(expected).toLocaleString()} ج.م</span>
                  </div>
                </div>
              </div>

              {/* Actual Cash Input */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div>
                  <label className="block text-slate-800 font-bold mb-1">
                    النقدية الفعلية بعد العد اليدوي للدرج (ج.م) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={actualCash}
                    onChange={(e) => setActualCash(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 font-black text-base text-slate-900 font-mono text-center shadow-xs"
                  />
                </div>

                {/* Live Surplus / Deficit Result */}
                <div className={`p-3 rounded-xl border text-center font-bold text-xs ${
                  diff === 0 ? 'bg-emerald-100 text-emerald-900 border-emerald-300' :
                  diff < 0 ? 'bg-rose-100 text-rose-900 border-rose-300' :
                  'bg-amber-100 text-amber-900 border-amber-300'
                }`}>
                  {diff === 0 ? '✅ الدرج مطابق تماماً للنظام' :
                   diff < 0 ? `🚨 عجز نقدية بالدرج: ${Math.abs(diff).toLocaleString()} ج.م` :
                   `⚡ زيادة نقدية بالدرج: ${diff.toLocaleString()} ج.م`}
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">ملاحظات التقفيل</label>
                  <input
                    type="text"
                    placeholder="مثال: تسليم الوردية للمدير وتمت المطابقة"
                    value={closeNotes}
                    onChange={(e) => setCloseNotes(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold cursor-pointer hover:bg-slate-100"
                >
                  متابعة العمل لاحقاً
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>تقفيل الوردية وإصدار Z-Report</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
