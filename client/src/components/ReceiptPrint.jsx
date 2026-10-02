import React, { useState } from 'react';
import { Printer, X, Receipt, CheckCircle, FileText } from 'lucide-react';

export default function ReceiptPrint({ receiptData, settings, onClose }) {
  if (!receiptData) return null;

  const [printFormat, setPrintFormat] = useState('a5'); // 'a5' or 'compact'

  const handlePrint = () => {
    window.print();
  };

  const currency = settings?.currency || 'ج.م';
  const storeName = settings?.store_name || 'معرض دكان عبد العزيز للأجهزة الكهربائية';
  const todayFormatted = new Date().toLocaleDateString('ar-EG', { 
    timeZone: 'Africa/Cairo',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      {/* Isolated Print Styles */}
      <style>{`
        @media print {
          @page {
            size: ${printFormat === 'a5' ? 'A5 landscape' : '100mm 150mm'};
            margin: ${printFormat === 'a5' ? '6mm 8mm' : '4mm'};
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
          #receipt-printable-area,
          #receipt-printable-area * {
            visibility: visible !important;
          }
          #receipt-printable-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
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
        {/* Controls Bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2.5">
            <Receipt className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">سند قبض استلام قسط شهري</h3>
              <p className="text-[11px] text-slate-500 font-mono">رقم الإيصال: {receiptData.receiptNo}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Format Selector */}
            <div className="flex items-center bg-slate-200/80 p-0.5 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setPrintFormat('a5')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  printFormat === 'a5' 
                    ? 'bg-white text-emerald-800 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                مقاس رسمي A5
              </button>
              <button
                type="button"
                onClick={() => setPrintFormat('compact')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  printFormat === 'compact' 
                    ? 'bg-white text-emerald-800 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                إيصال مصغر (حراري)
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer active:scale-98"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة السند ({printFormat === 'a5' ? 'A5' : 'حراري'})</span>
            </button>

            <button 
              onClick={onClose} 
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Voucher Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 flex justify-center">
          {printFormat === 'a5' ? (
            /* OFFICIAL A5 VOUCHER (Requirement 13) */
            <div 
              id="receipt-printable-area"
              className="w-[210mm] max-w-full bg-white p-6 rounded-xl border border-slate-300 shadow-md text-slate-900 font-['Cairo',sans-serif] text-xs leading-normal"
              dir="rtl"
            >
              {/* Official Store Header */}
              <div className="border-b-2 border-slate-900 pb-3 mb-3">
                <div className="flex items-center justify-between">
                  <div className="w-20">
                    <img
                      src={settings?.logo_url || '/logo.svg'}
                      alt={storeName}
                      className="max-h-12 w-auto object-contain"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                  <div className="flex-1 text-center">
                    <h2 className="text-base font-black text-slate-900">{storeName}</h2>
                    <p className="text-[11px] font-bold text-slate-700">لتجارة وتوزيع الأجهزة الكهربائية والمنزلية بالتقسيط المباشر</p>
                    <p className="text-[9.5px] text-slate-500 font-medium mt-0.5">
                      {settings?.address || 'الفرع الرئيسي'} | هاتف: {settings?.phone || '---'}
                    </p>
                  </div>
                  <div className="text-left w-32 font-mono text-[10px] space-y-0.5" dir="rtl">
                    <div className="font-bold text-slate-900">سند قبض رقم:</div>
                    <div className="text-emerald-700 font-black text-xs">{receiptData.receiptNo}</div>
                    <div className="text-slate-500 text-[9px]">{todayFormatted}</div>
                  </div>
                </div>
              </div>

              {/* Title Strip */}
              <div className="flex items-center justify-between bg-emerald-50/80 border border-emerald-300 rounded-lg px-3 py-1.5 mb-3 text-xs">
                <span className="font-black text-emerald-950 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>سند قبض واستلام نقدية - تحصيل قسط شهري</span>
                </span>
                <span className="font-mono font-bold text-emerald-800 text-[11px]">
                  التاريخ: {new Date().toLocaleDateString('ar-EG', { timeZone: 'Africa/Cairo' })}
                </span>
              </div>

              {/* Customer and Installment Grid */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 space-y-1.5">
                  <div className="flex justify-between border-b border-slate-200 pb-1">
                    <span className="text-slate-500 font-semibold">استلمنا من السيد/ة:</span>
                    <strong className="text-slate-900 font-black text-xs">{receiptData.customerName}</strong>
                  </div>
                  {receiptData.customerPhone && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">رقم الهاتف:</span>
                      <span className="font-mono font-bold" dir="ltr">{receiptData.customerPhone}</span>
                    </div>
                  )}
                  {receiptData.contractNo && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">رقم العقد / الفاتورة:</span>
                      <span className="font-mono font-bold text-blue-700">{receiptData.contractNo}</span>
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 space-y-1.5">
                  <div className="flex justify-between border-b border-slate-200 pb-1">
                    <span className="text-slate-500 font-semibold">بيان القسط المسدد:</span>
                    <strong className="text-indigo-950 font-black text-xs">
                      قسط شهر {receiptData.dueDate || 'الحالي'} (قسط #{receiptData.installmentNo || '1'})
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">قناة وسيلة السداد:</span>
                    <span className="font-bold text-slate-800">
                      {receiptData.paymentMethod === 'bank' ? 'تحويل بنكي / إنستاباي' : 'نقداً بخزينة المعرض'}
                    </span>
                  </div>
                  {receiptData.remainingBalance !== undefined && (
                    <div className="flex justify-between text-rose-800 font-bold">
                      <span>الرصيد المتبقي على العقد:</span>
                      <span className="font-mono" dir="ltr">{Number(receiptData.remainingBalance).toLocaleString()} {currency}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Amount Highlight Box */}
              <div className="bg-emerald-100/70 border-2 border-emerald-400 rounded-xl p-3 mb-4 flex items-center justify-between">
                <div>
                  <span className="block text-[11px] text-emerald-950 font-bold">المبلغ المستلم والمقيد بحساب العقد:</span>
                  <span className="text-xs font-semibold text-emerald-900 mt-0.5 block">
                    (فقط وقدره {Number(receiptData.amountPaid).toLocaleString()} جنيه مصري لا غير)
                  </span>
                </div>
                <div className="text-left font-mono font-black text-lg text-emerald-900" dir="ltr">
                  {Number(receiptData.amountPaid).toLocaleString()} {currency}
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-3 gap-6 pt-2 border-t border-slate-200 text-center text-[10px]">
                <div>
                  <p className="font-bold text-slate-700">المحصل / أمين الخزينة</p>
                  <div className="h-10 border-b border-dashed border-slate-400 mt-1"></div>
                  <p className="text-[9px] text-slate-500 mt-1">خزينة المعرض</p>
                </div>
                <div>
                  <p className="font-bold text-slate-700">توقيع المودع (العميل)</p>
                  <div className="h-10 border-b border-dashed border-slate-400 mt-1"></div>
                  <p className="text-[9px] text-slate-500 mt-1">{receiptData.customerName}</p>
                </div>
                <div>
                  <p className="font-bold text-slate-700">اعتماد الإدارة وختم المعرض</p>
                  <div className="h-10 border-b border-dashed border-slate-400 mt-1 flex items-center justify-center">
                    <span className="border border-slate-400 px-2 py-0.5 text-[9.5px] font-bold text-slate-800 rounded">
                      {storeName}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* COMPACT 100mm THERMAL RECEIPT */
            <div id="receipt-printable-area" className="w-[100mm] max-w-[100mm] bg-white p-4 rounded-lg border border-slate-300 shadow-sm text-xs text-slate-800">
              <div className="text-center border-b border-slate-300 pb-3 mb-3">
                <img
                  src={settings?.logo_url || '/logo.svg'}
                  alt={storeName}
                  className="h-10 mx-auto mb-2 object-contain"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <h2 className="font-black text-base">{storeName}</h2>
                <p className="text-[11px] text-slate-500 font-semibold">{settings?.address} | {settings?.phone}</p>
                <span className="inline-block mt-2 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded font-bold text-xs">
                  سند قبض قسط شهري
                </span>
              </div>

              <div className="space-y-2 mb-4 text-xs">
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

              <div className="border-t border-slate-200 pt-3 flex justify-between text-center text-[10px]">
                <div>
                  <p className="text-slate-500">توقيع المستلم</p>
                  <div className="h-6"></div>
                  <p className="font-bold">المعرض</p>
                </div>
                <div>
                  <p className="text-slate-500">توقيع المودع</p>
                  <div className="h-6"></div>
                  <p className="font-bold">{receiptData.customerName}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
