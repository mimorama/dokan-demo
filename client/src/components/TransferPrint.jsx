import React, { useState, useEffect } from 'react';
import { Printer, X, ShieldCheck, ArrowLeftRight, CheckCircle2, Warehouse, Building2, Package, FileText } from 'lucide-react';
import { api } from '../api';

export default function TransferPrint({ transfer, settings, onClose }) {
  const [currentTransfer, setCurrentTransfer] = useState(transfer);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setCurrentTransfer(transfer);
    // If items are missing or incomplete, fetch full transfer details
    if (transfer?.id && (!transfer.items || transfer.items.length === 0)) {
      setLoading(true);
      api.getStockTransfer(transfer.id)
        .then((fullData) => {
          if (fullData) {
            setCurrentTransfer(fullData);
          }
        })
        .catch((err) => {
          console.error('Failed to load full transfer details in TransferPrint:', err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [transfer?.id]);

  if (!currentTransfer) return null;

  const handlePrint = () => {
    if (loading) return;
    window.print();
  };

  const currency = settings?.currency || 'ج.م';
  const storeName = settings?.store_name || 'معرض دكان عبد العزيز للأجهزة الكهربائية';
  const tagline = settings?.tagline || 'تجارة وتوزيع الأجهزة الكهربائية والمنزلية والأقساط';
  const phone = settings?.phone || '01012345678 - 01187654321';
  const address = settings?.address || 'شارع الملك فيصل الرئيسي - الجيزة - جمهورية مصر العربية';
  const commercialReg = settings?.commercial_reg || '198425';
  const taxId = settings?.tax_number || settings?.tax_id || '654-321-987';
  const logoUrl = settings?.logo_url || '/logo.svg';

  const printDateStr = new Intl.DateTimeFormat('ar-EG', {
    timeZone: 'Africa/Cairo',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date());

  const printTimeStr = new Intl.DateTimeFormat('ar-EG', {
    timeZone: 'Africa/Cairo',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }).format(new Date());

  // Group items by product for clean summary if items array has duplicate product rows
  const groupedItems = React.useMemo(() => {
    if (!currentTransfer.items || !Array.isArray(currentTransfer.items)) return [];
    const map = new Map();
    for (const it of currentTransfer.items) {
      if (!map.has(it.product_id)) {
        map.set(it.product_id, {
          product_id: it.product_id,
          product_name: it.product_name || 'جهاز كهربائي',
          model_number: it.model_number || '',
          brand_name: it.brand_name || '',
          category_name: it.category_name || '',
          quantity: 1,
          serials: it.serial_number ? [it.serial_number] : []
        });
      } else {
        const existing = map.get(it.product_id);
        existing.quantity += 1;
        if (it.serial_number) existing.serials.push(it.serial_number);
      }
    }
    return Array.from(map.values());
  }, [currentTransfer.items]);

  const totalDevicesCount = currentTransfer.total_items || 
    (groupedItems.length > 0 ? groupedItems.reduce((acc, it) => acc + it.quantity, 0) : 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* Dynamic Print CSS for Transfer Documents */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }
          body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print, .print\\:hidden {
            display: none !important;
          }
          #transfer-printable-area {
            position: static !important;
            box-shadow: none !important;
            border: none !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 auto !important;
            padding: 0 !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
            display: block !important;
            visibility: visible !important;
          }
          #transfer-printable-area * {
            visibility: visible !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            page-break-inside: auto !important;
            break-inside: auto !important;
          }
          thead {
            display: table-header-group !important;
          }
          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .avoid-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

      {/* Outer Modal Container */}
      <div className="bg-slate-100 rounded-2xl shadow-2xl max-w-4xl w-full flex flex-col my-auto max-h-[96vh]">
        {/* Top Control Bar (Hidden when printed) */}
        <div className="no-print bg-slate-900 text-white p-4 rounded-t-2xl flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-sm">معاينة إذن التحويل المخزني الرسمي (طباعة A4)</h3>
              <p className="text-[11px] text-slate-300">
                وثيقة نقل رسمية معتمدة بالأجهزة والسيريالات وتوقيعات الاستلام والتسليم
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              disabled={loading}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              <Printer className="w-4 h-4 text-emerald-200" />
              <span>{loading ? 'جارٍ تحميل البيانات...' : 'طباعة الإذن أو حفظ كـ PDF (A4)'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Transfer Document Body */}
        <div className="overflow-y-auto p-4 sm:p-8 flex justify-center bg-slate-200/50 print:p-0 print:bg-white print:overflow-visible">
          <div
            id="transfer-printable-area"
            className="bg-white text-slate-900 w-full max-w-[210mm] p-6 sm:p-8 print:p-0 print:m-0 print:w-full print:max-w-none print:shadow-none print:border-none print:block relative font-['Cairo',sans-serif] text-xs leading-normal"
            dir="rtl"
          >
            {/* 1. Official Store Letterhead */}
            <div className="border-b-2 border-slate-900 pb-3 mb-3">
              <div className="flex items-center justify-between gap-3">
                {/* Right: Store Info */}
                <div className="text-right space-y-0.5 w-1/3">
                  <p className="text-[10px] font-bold text-slate-500">جمهورية مصر العربية</p>
                  <h1 className="text-base font-black text-slate-900 tracking-tight">{storeName}</h1>
                  <p className="text-[10px] font-bold text-emerald-700">{tagline}</p>
                  <p className="text-[9px] text-slate-600 leading-tight">{address}</p>
                  <p className="text-[9px] text-slate-600 font-mono font-bold" dir="ltr">{phone}</p>
                </div>

                {/* Center: Official Logo & Legal Badges */}
                <div className="flex flex-col items-center justify-center text-center w-1/3">
                  <img
                    src={logoUrl}
                    alt={storeName}
                    className="h-14 w-auto object-contain mb-1.5"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <div className="flex items-center justify-center gap-2 text-[9px] font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                    <span>س.ت: <strong className="font-mono text-slate-900">{commercialReg}</strong></span>
                    <span>|</span>
                    <span>ب.ض: <strong className="font-mono text-slate-900">{taxId}</strong></span>
                  </div>
                </div>

                {/* Left: Transfer Document Meta */}
                <div className="text-left w-1/3 space-y-1" dir="ltr">
                  <div className="inline-block bg-slate-900 text-white px-3 py-1 rounded-lg text-left shadow-xs">
                    <span className="block text-[8px] text-slate-300 tracking-wider">TRANSFER NUMBER</span>
                    <span className="block font-mono font-black text-sm tracking-widest text-emerald-400">
                      {currentTransfer.transfer_no}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-600 space-y-0.5 font-medium">
                    <p>Date: <strong className="font-mono text-slate-800">{currentTransfer.transfer_date || printDateStr}</strong></p>
                    <p>Print Time: <span className="font-mono">{printTimeStr}</span></p>
                    <p>Status: <strong className="text-emerald-700">COMPLETED / معتمد</strong></p>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Document Title Banner */}
            <div className="text-center py-2 mb-4 bg-slate-900 text-white rounded-xl shadow-xs">
              <h2 className="text-sm font-black tracking-wide flex items-center justify-center gap-2">
                <span>إذن تحويل بضائع وأجهزة مخزني رسمي</span>
                <span className="text-[10px] font-normal text-emerald-300 bg-slate-800 px-2.5 py-0.5 rounded-full font-mono">
                  TR-SLIP
                </span>
              </h2>
              <p className="text-[9px] text-slate-300 mt-0.5">
                وثيقة نقل داخلي رسمية لنقل وحفظ عهدة الأجهزة بين المعارض والمستودعات
              </p>
            </div>

            {/* 3. Transfer Route & Warehouse Details */}
            <div className="grid grid-cols-2 gap-3 mb-4 bg-slate-50 border border-slate-300 rounded-xl p-3.5 avoid-break">
              {/* Source (من) */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                <div className="flex items-center gap-1.5 text-blue-800 font-black text-xs border-b border-slate-100 pb-1 mb-1">
                  <Warehouse className="w-3.5 h-3.5" />
                  <span>المخزن المصدر (المُسلّم للعهدة)</span>
                </div>
                <p className="text-xs font-black text-slate-900">{currentTransfer.from_warehouse_name || 'المستودع الرئيسي'}</p>
                <p className="text-[10px] text-slate-500 font-bold">الفرع: {currentTransfer.from_branch_name || 'الفرع الرئيسي'}</p>
                <p className="text-[9px] text-slate-400">حالة الصرف: تم خصم الأجهزة ونقلها من رصيد المستودع</p>
              </div>

              {/* Destination (إلى) */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-800 font-black text-xs border-b border-slate-100 pb-1 mb-1">
                  <Warehouse className="w-3.5 h-3.5" />
                  <span>المخزن المستقبل (المُستلم للعهدة)</span>
                </div>
                <p className="text-xs font-black text-emerald-800">{currentTransfer.to_warehouse_name || 'مخزن صالة العرض'}</p>
                <p className="text-[10px] text-slate-500 font-bold">الفرع: {currentTransfer.to_branch_name || 'فرع المعرض'}</p>
                <p className="text-[9px] text-slate-400">حالة الاستلام: تم إيداع الأجهزة بالسيريال في رصيد المستودع</p>
              </div>

              {/* Transfer Metadata Bar */}
              <div className="col-span-2 pt-2 border-t border-slate-200 grid grid-cols-3 gap-2 text-[10px]">
                <div>
                  <span className="text-slate-500 block">المسؤول عن النقل والتسجيل:</span>
                  <strong className="text-slate-800">{currentTransfer.created_by || 'أمين المستودع'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">اعتماد إدارة المعرض:</span>
                  <strong className="text-emerald-700">✓ {currentTransfer.manager_approved_by || 'معتمد رسمياً من الإدارة'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">إجمالي عدد الأجهزة المنقولة:</span>
                  <strong className="text-blue-900 font-mono text-xs font-black">{totalDevicesCount} جهاز / قطعة</strong>
                </div>
                {currentTransfer.notes && (
                  <div className="col-span-3 mt-1 bg-amber-50/70 border border-amber-200 p-2 rounded-lg text-amber-900">
                    <span className="font-bold">بيان وملاحظات التحويل: </span>
                    <span>{currentTransfer.notes}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 4. Transferred Devices & Serials Table */}
            <div className="mb-4">
              <h3 className="font-extrabold text-xs text-slate-800 mb-2 flex items-center justify-between">
                <span>بيان الأصناف والأجهزة المنقولة والسيريالات المعتمدة:</span>
                <span className="text-[10px] text-slate-500 font-normal">
                  ({groupedItems.length > 0 ? groupedItems.length : 1} صنف / {totalDevicesCount} جهاز)
                </span>
              </h3>

              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-800 text-white font-bold">
                    <tr>
                      <th className="p-2 w-8 text-center border-b border-slate-700">#</th>
                      <th className="p-2 border-b border-slate-700">اسم الجهاز والموديل</th>
                      <th className="p-2 border-b border-slate-700">الماركة / التصنيف</th>
                      <th className="p-2 border-b border-slate-700 text-center w-20">الكمية</th>
                      <th className="p-2 border-b border-slate-700">السيريالات المحولة المخصصة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium">
                    {groupedItems.length > 0 ? (
                      groupedItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 avoid-break">
                          <td className="p-2 text-center font-bold text-slate-400">{idx + 1}</td>
                          <td className="p-2">
                            <span className="font-extrabold text-slate-900 block">{item.product_name}</span>
                            {item.model_number && (
                              <span className="font-mono text-[10px] text-slate-500 font-bold block" dir="ltr">
                                Model: {item.model_number}
                              </span>
                            )}
                          </td>
                          <td className="p-2 text-slate-600">
                            <span>{item.brand_name || '-'}</span>
                            {item.category_name && <span className="block text-[10px] text-slate-400">{item.category_name}</span>}
                          </td>
                          <td className="p-2 text-center font-mono font-black text-slate-900 bg-slate-50">
                            {item.quantity}
                          </td>
                          <td className="p-2">
                            {item.serials && item.serials.length > 0 ? (
                              <div className="flex flex-wrap gap-1" dir="ltr">
                                {item.serials.map((sn, sIdx) => (
                                  <span
                                    key={sIdx}
                                    className="font-mono text-[10px] font-bold bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded border border-slate-200"
                                  >
                                    {sn}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">بند عام / كمية محولة بدون سيريال فردي</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="p-4 text-center text-slate-400">
                          إجمالي الأجهزة المحولة: {totalDevicesCount} جهاز
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300">
                    <tr>
                      <td colSpan="3" className="p-2.5 text-left font-black text-slate-800">
                        إجمالي كمية الأجهزة المنقولة بالإذن:
                      </td>
                      <td className="p-2.5 text-center font-mono font-black text-sm text-blue-900 bg-blue-50/50">
                        {totalDevicesCount}
                      </td>
                      <td className="p-2.5 text-[10px] text-slate-500 font-normal">
                        تمت مطابقة السيريالات وفحص حالة الأجهزة قبل التسليم والنقل
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* 5. Transfer Terms & Warehouse Legal Responsibility */}
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/60 mb-5 text-[9px] text-slate-600 space-y-1 avoid-break">
              <p className="font-bold text-slate-800 text-[10px]">شروط وإقرار النقل والتسليم المخزني:</p>
              <ul className="list-disc list-inside space-y-0.5 text-slate-600 pr-1">
                <li>يقر أمين المخزن المسلّم بصرف وفحص الأجهزة والسيريالات المذكورة أعلاه بحالة المصنع الجديدة والسليمة.</li>
                <li>يتحمل مندوب النقل / السائق مسؤولية سلامة الأجهزة وكراتين التغليف أثناء عملية النقل بين الفروع والمخازن.</li>
                <li>يقر أمين المخزن المستلم بفحص مطابقة السيريالات والأجهزة للعدد المكتوب فور الوصول والتوقيع بالاستلام الفعلي.</li>
              </ul>
            </div>

            {/* 6. Four Formal Signatures and Approval Boxes */}
            <div className="grid grid-cols-4 gap-2 pt-4 border-t-2 border-slate-900 text-center text-[10px] avoid-break">
              {/* 1. Delivering Storekeeper */}
              <div className="border border-slate-200 p-2.5 rounded-xl bg-white space-y-4">
                <div>
                  <p className="font-black text-slate-900">أمين المخزن المسلّم</p>
                  <p className="text-[9px] text-slate-500">{currentTransfer.from_warehouse_name || 'المصدر'}</p>
                </div>
                <div className="text-[9px] text-slate-400 space-y-1 text-right">
                  <p className="border-b border-dashed border-slate-300 pb-1">الاسم: ...................</p>
                  <p className="border-b border-dashed border-slate-300 pb-1">التوقيع: ...................</p>
                </div>
              </div>

              {/* 2. Courier / Driver */}
              <div className="border border-slate-200 p-2.5 rounded-xl bg-white space-y-4">
                <div>
                  <p className="font-black text-slate-900">السائق / مندوب النقل</p>
                  <p className="text-[9px] text-slate-500 font-bold">{currentTransfer.created_by || 'المندوب'}</p>
                </div>
                <div className="text-[9px] text-slate-400 space-y-1 text-right">
                  <p className="border-b border-dashed border-slate-300 pb-1">الاسم: ...................</p>
                  <p className="border-b border-dashed border-slate-300 pb-1">التوقيع: ...................</p>
                </div>
              </div>

              {/* 3. Receiving Storekeeper */}
              <div className="border border-slate-200 p-2.5 rounded-xl bg-white space-y-4">
                <div>
                  <p className="font-black text-slate-900">أمين المخزن المستلم</p>
                  <p className="text-[9px] text-slate-500">{currentTransfer.to_warehouse_name || 'المستقبل'}</p>
                </div>
                <div className="text-[9px] text-slate-400 space-y-1 text-right">
                  <p className="border-b border-dashed border-slate-300 pb-1">الاسم: ...................</p>
                  <p className="border-b border-dashed border-slate-300 pb-1">التوقيع: ...................</p>
                </div>
              </div>

              {/* 4. Store Manager & Seal */}
              <div className="border border-slate-200 p-2.5 rounded-xl bg-slate-50 space-y-3">
                <div>
                  <p className="font-black text-emerald-900">اعتماد إدارة المعرض</p>
                  <p className="text-[9px] text-emerald-700 font-bold">
                    {currentTransfer.manager_approved_by || 'مدير الفرع / المعرض'}
                  </p>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-full border-2 border-dashed border-emerald-600/40 flex items-center justify-center text-[8px] text-emerald-700 font-black rotate-[-12deg] bg-emerald-50">
                    ختم الإدارة
                  </div>
                </div>
              </div>
            </div>

            {/* Document Footer Note */}
            <div className="mt-4 pt-2 border-t border-slate-200 text-center text-[8px] text-slate-400 flex items-center justify-between">
              <span>نظام إدارة معارض الأجهزة الكهربائية - Dokan POS & ERP</span>
              <span>تمت الطباعة آلياً في: {printDateStr} - {printTimeStr}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
