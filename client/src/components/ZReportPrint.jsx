import React from 'react';
import { X, Printer, ShieldCheck, FileCheck } from 'lucide-react';

export default function ZReportPrint({ zReport, settings, onClose }) {
  const currency = settings?.currency || 'ج.م';
  const storeName = settings?.store_name || 'معرض دكان عبد العزيز للأجهزة الكهربائية';

  const handlePrint = () => {
    window.print();
  };

  if (!zReport) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        {/* Top Control Bar (Hidden when printed) */}
        <div className="no-print bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm">تقرير إغلاق الوردية اليومية (Z-Report)</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة</span>
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Thermal / A5 Document */}
        <div id="printable-area" className="p-6 text-xs text-slate-900 font-['Cairo',sans-serif]" dir="rtl">
          {/* Header */}
          <div className="text-center border-b-2 border-slate-900 pb-3 mb-4">
            <div className="w-12 h-12 mx-auto mb-1">
              <img src="/logo.svg" alt="دكان عبد العزيز" className="w-full h-full object-contain" />
            </div>
            <h2 className="font-black text-sm text-slate-900">{storeName}</h2>
            <p className="text-[10px] text-slate-500 font-bold">تقرير تصفية درج الكاشير وإغلاق الوردية (Z-Report)</p>
            <span className="font-mono text-[10px] font-bold text-blue-800 block mt-1">{zReport.shift_no}</span>
          </div>

          {/* Shift Metadata */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500">الكاشير:</span>
              <span className="font-bold text-slate-800">{zReport.user_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">بداية الوردية:</span>
              <span className="font-mono">{zReport.start_time?.slice(0, 16).replace('T', ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">إغلاق الوردية:</span>
              <span className="font-mono">{zReport.end_time?.slice(0, 16).replace('T', ' ')}</span>
            </div>
          </div>

          {/* Cash Ledger Breakdown */}
          <div className="border border-slate-300 rounded-xl overflow-hidden mb-4">
            <table className="w-full text-right text-[11px]">
              <tbody className="divide-y divide-slate-200">
                <tr className="bg-slate-100">
                  <td className="p-2 font-bold text-slate-700">الرصيد الافتتاحي بالدرج:</td>
                  <td className="p-2 font-mono font-bold text-left" dir="ltr">{Number(zReport.opening_balance || 0).toLocaleString()} {currency}</td>
                </tr>
                <tr>
                  <td className="p-2 text-slate-600">المبيعات النقدية المحصلة:</td>
                  <td className="p-2 font-mono font-bold text-emerald-700 text-left" dir="ltr">+{Number(zReport.cash_sales || 0).toLocaleString()} {currency}</td>
                </tr>
                <tr>
                  <td className="p-2 text-slate-600">أقساط محصلة بالخزينة:</td>
                  <td className="p-2 font-mono font-bold text-emerald-700 text-left" dir="ltr">+{Number(zReport.cash_installments || 0).toLocaleString()} {currency}</td>
                </tr>
                <tr>
                  <td className="p-2 text-slate-600">إيداعات نقدية أخرى:</td>
                  <td className="p-2 font-mono font-bold text-emerald-700 text-left" dir="ltr">+{Number(zReport.cash_inflows || 0).toLocaleString()} {currency}</td>
                </tr>
                <tr>
                  <td className="p-2 text-slate-600">منصرفات ومصروفات نقدية:</td>
                  <td className="p-2 font-mono font-bold text-rose-600 text-left" dir="ltr">-{Number(zReport.cash_expenses || 0).toLocaleString()} {currency}</td>
                </tr>
                <tr className="bg-blue-50 font-bold border-t-2 border-slate-400">
                  <td className="p-2 text-blue-900">النقدية المتوقعة دفترياً:</td>
                  <td className="p-2 font-mono font-black text-blue-900 text-left" dir="ltr">{Number(zReport.expected_cash || 0).toLocaleString()} {currency}</td>
                </tr>
                <tr className="bg-slate-100 font-bold">
                  <td className="p-2 text-slate-900">النقدية الفعلية (العد باليد):</td>
                  <td className="p-2 font-mono font-black text-slate-900 text-left" dir="ltr">{Number(zReport.actual_cash || 0).toLocaleString()} {currency}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Difference & Status Box */}
          <div className={`p-3 rounded-xl border text-center mb-5 ${
            zReport.difference === 0 ? 'bg-emerald-50 border-emerald-300 text-emerald-900' :
            zReport.difference < 0 ? 'bg-rose-50 border-rose-300 text-rose-900' :
            'bg-amber-50 border-amber-300 text-amber-900'
          }`}>
            <span className="block text-[10px] font-bold">نتيجة مطابقة الخزينة:</span>
            <span className="block text-sm font-black mt-0.5">
              {zReport.difference === 0 ? '✅ الدرج مطابق تماماً بدون عجز أو زيادة' :
               zReport.difference < 0 ? `🚨 عجز نقدية بمبلغ ${Math.abs(zReport.difference).toLocaleString()} ${currency}` :
               `⚡ زيادة نقدية بمبلغ ${zReport.difference.toLocaleString()} ${currency}`}
            </span>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-4 text-center border-t border-slate-300 pt-4 text-[10px]">
            <div>
              <span className="block font-bold text-slate-700">توقيع الكاشير</span>
              <span className="text-slate-400 mt-6 block border-b border-dashed border-slate-300 mx-4"></span>
            </div>
            <div>
              <span className="block font-bold text-slate-700">اعتماد مدير الفرع</span>
              <span className="text-slate-400 mt-6 block border-b border-dashed border-slate-300 mx-4"></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
