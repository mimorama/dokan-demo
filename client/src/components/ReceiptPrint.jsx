import React from 'react';
import { Printer, X, CheckCircle, Receipt } from 'lucide-react';

export default function ReceiptPrint({ receiptData, settings, onClose }) {
  if (!receiptData) return null;

  const handlePrint = () => {
    window.print();
  };

  const currency = settings?.currency || 'ج.م';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Controls */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-800">إيصال استلام قسط</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-xl font-bold text-sm shadow cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة</span>
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Voucher Content */}
        <div className="p-6 bg-slate-50 flex justify-center print:p-0 print:bg-white">
          <div id="printable-area" className="w-[100mm] max-w-[100mm] bg-white p-6 rounded-lg border border-slate-300 shadow-sm text-xs text-slate-800 print:border-none print:shadow-none print:p-4 print:mx-auto">
            <div className="text-center border-b border-slate-300 pb-3 mb-3">
              <img
                src={settings?.logo_url || '/logo.svg'}
                alt="دكان عبد العزيز"
                className="h-10 mx-auto mb-2 object-contain"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <h2 className="font-black text-base">{settings?.store_name || 'معرض دكان عبد العزيز للأجهزة الكهربائية'}</h2>
              <p className="text-[11px] text-slate-500 font-semibold">{settings?.address} | {settings?.phone}</p>
              <span className="inline-block mt-2 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded font-bold text-xs">
                سند قبض قسط شهري
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-slate-500">رقم الإيصال:</span>
                <span className="font-mono font-bold text-slate-900" dir="ltr">{receiptData.receiptNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">التاريخ:</span>
                <span>{new Date().toLocaleDateString('ar-EG', { timeZone: 'Africa/Cairo' })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">اسم العميل:</span>
                <span className="font-bold text-slate-900">{receiptData.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">بيان القسط:</span>
                <span className="font-semibold">قسط شهر {receiptData.dueDate} (رقم {receiptData.installmentNo})</span>
              </div>
              <div className="flex justify-between bg-emerald-50 p-2 rounded border border-emerald-200 text-sm font-extrabold text-emerald-900">
                <span>المبلغ المستلم:</span>
                <span dir="ltr">{Number(receiptData.amountPaid).toLocaleString()} {currency}</span>
              </div>
              {receiptData.remainingBalance !== undefined && (
                <div className="flex justify-between text-[11px] text-slate-600">
                  <span>الرصيد المتبقي على العقد:</span>
                  <span className="font-bold" dir="ltr">{Number(receiptData.remainingBalance).toLocaleString()} {currency}</span>
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 pt-4 flex justify-between text-center text-[11px]">
              <div>
                <p className="text-slate-500">توقيع المستلم</p>
                <div className="h-8"></div>
                <p className="font-bold">المعرض</p>
              </div>
              <div>
                <p className="text-slate-500">توقيع المودع</p>
                <div className="h-8"></div>
                <p className="font-bold">{receiptData.customerName}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
