import React, { useState, useEffect } from 'react';
import { Printer, X, ShieldCheck, CheckCircle2, FileText, Send, MessageCircle, Download, ExternalLink } from 'lucide-react';
import { api } from '../api';

export default function InvoicePrint({ sale, settings, onClose }) {
  const [currentSale, setCurrentSale] = useState(sale);
  const [loadingSale, setLoadingSale] = useState(false);
  const [printFormat, setPrintFormat] = useState('a4'); // 'a4' or 'thermal'
  const [whatsAppPhone, setWhatsAppPhone] = useState(sale?.customer_phone || '');
  const [showWhatsAppInput, setShowWhatsAppInput] = useState(false);

  useEffect(() => {
    setCurrentSale(sale);
    if (sale?.customer_phone) {
      setWhatsAppPhone(sale.customer_phone);
    }
    // Auto-fetch full sale data if items are missing or empty
    if (sale?.id && (!sale.items || sale.items.length === 0)) {
      setLoadingSale(true);
      api.getSale(sale.id)
        .then((fullData) => {
          if (fullData) {
            setCurrentSale(fullData);
            if (fullData.customer_phone) {
              setWhatsAppPhone(fullData.customer_phone);
            }
          }
        })
        .catch((err) => {
          console.error('Failed to load full sale details in InvoicePrint:', err);
        })
        .finally(() => {
          setLoadingSale(false);
        });
    }
  }, [sale?.id]);

  if (!currentSale) return null;

  const handlePrint = () => {
    if (loadingSale) return;
    window.print();
  };

  const currency = settings?.currency || 'ج.م';
  const storeName = settings?.store_name || 'معرض دكان عبد العزيز للأجهزة الكهربائية';
  const logoUrl = settings?.logo_url || '/logo.svg';

  const handleSendWhatsApp = () => {
    const rawPhone = whatsAppPhone || currentSale.customer_phone;
    if (!rawPhone) {
      alert('الرجاء إدخال رقم هاتف العميل (واتساب)');
      return;
    }

    // Normalize phone number for international WhatsApp wa.me link
    let cleanPhone = rawPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '20' + cleanPhone.slice(1);
    } else if (!cleanPhone.startsWith('20') && cleanPhone.length === 10) {
      cleanPhone = '20' + cleanPhone;
    }

    // Public link to electronic invoice web page
    const publicLink = `${window.location.origin}/api/invoices/public/${currentSale.invoice_no}`;

    // Format item details
    const itemsList = currentSale.items?.map((it, i) => 
      `🔹 *${i + 1}. ${it.product_name || it.name || 'جهاز كهربائي'}*\n` +
      `   ▪️ الموديل: \`${it.model_number || '-'}\`\n` +
      `   ▪️ السيريال: \`${it.serial_number || '-'}\`\n` +
      `   ▪️ الضمان: ${it.warranty_months ? `${it.warranty_months} شهر` : 'ساري'} (${it.warranty_agency || 'الوكيل المعتمد'})\n` +
      `   ▪️ السعر: ${Number(it.unit_price || 0).toLocaleString()} ${currency}`
    ).join('\n\n') || '';

    const installmentDetails = currentSale.sale_type === 'finance_company'
      ? `🏢 *نظام التقسيط:* ${currentSale.installment_plan_name || currentSale.finance_company_name || 'تمويل استهلاكي'}${currentSale.installment_duration_months ? ` (${currentSale.installment_duration_months} شهر)` : ''}\n` +
        (currentSale.finance_approval_code ? `🔑 *كود الموافقة:* \`${currentSale.finance_approval_code}\`\n` : '')
      : currentSale.sale_type === 'installment'
      ? `📅 *نظام التقسيط:* ${currentSale.installment_plan_name || 'تقسيط مباشر من المعرض'}${currentSale.installment_duration_months ? ` (${currentSale.installment_duration_months} شهر)` : ''}\n` +
        (currentSale.installment_plan?.monthly_amount ? `💵 *القسط الشهري:* ${Number(currentSale.installment_plan.monthly_amount).toLocaleString()} ${currency}\n` : '')
      : '';

    const message = 
`🌟 *${storeName}* 🌟
━━━━━━━━━━━━━━━━━━━━
💐 أهلاً بك عزيزنا العميل: *${currentSale.customer_name || 'المحترم'}*

يسعدنا إرفاق تفاصيل فاتورة الشراء المعتمدة وشهادة الضمان للأجهزة الكهربائية:

📄 *رقم الفاتورة:* \`${currentSale.invoice_no}\`
📅 *تاريخ الفاتورة:* ${new Date(currentSale.created_at).toLocaleDateString('ar-EG', { timeZone: 'Africa/Cairo' })}
🏢 *الفرع:* ${currentSale.branch_name || 'معرض الأزهر الرئيسي'}

📦 *الأجهزة المشتراة وتفاصيل السيريال والضمان:*
${itemsList}

━━━━━━━━━━━━━━━━━━━━
💰 *إجمالي الفاتورة:* *${Number(currentSale.total || 0).toLocaleString()} ${currency}*
💵 *المبلغ المسدد:* *${Number(currentSale.paid_amount || 0).toLocaleString()} ${currency}*
${Number(currentSale.remaining_amount) > 0 ? `⏳ *المتبقي:* *${Number(currentSale.remaining_amount).toLocaleString()} ${currency}*\n` : ''}${installmentDetails}
📜 *شروط الضمان:*
يسري الضمان من تاريخ هذه الفاتورة بالسيريال نمبر المدون أعلاه مع أصل شهادة ضمان الشركة المرفقة مع كرتونة الجهاز.

🔗 *رابط عرض وطباعة الفاتورة الإلكترونية المباشر:*
${publicLink}

━━━━━━━━━━━━━━━━━━━━
📞 خدمة العملاء والصيانة: ${currentSale.branch_phone || settings?.phone || '01023456789'}
📍 العنوان: ${currentSale.branch_address || settings?.address || 'شارع الأزهر - القاهرة'}
نشكركم دائماً لاختياركم دكان عبد العزيز! ✨`;

    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
    setShowWhatsAppInput(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto print:static print:inset-auto print:bg-transparent print:backdrop-blur-none print:p-0 print:m-0 print:overflow-visible print:block print:w-full">
      {/* Dynamic Print CSS */}
      <style>{`
        @media print {
          @page {
            size: ${printFormat === 'thermal' ? '80mm auto' : 'A4 portrait'};
            margin: ${printFormat === 'thermal' ? '0mm' : '8mm'};
          }
          body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print,
          .print\\:hidden {
            display: none !important;
          }
          #invoice-printable-area {
            position: static !important;
            box-shadow: none !important;
            border: none !important;
            width: ${printFormat === 'thermal' ? '72mm !important' : '100% !important'};
            max-width: ${printFormat === 'thermal' ? '72mm !important' : '100% !important'};
            margin: 0 auto !important;
            padding: ${printFormat === 'thermal' ? '2mm !important' : '0mm !important'};
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
          }
        }
      `}</style>

      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden print:shadow-none print:border-none print:rounded-none print:max-h-none print:h-auto print:overflow-visible print:block print:w-full print:m-0 print:p-0">
        {/* Modal Controls Bar (Hidden during print) */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              معاينة وطباعة الفاتورة ({currentSale.invoice_no})
            </h3>
            <div className="flex bg-slate-200 p-0.5 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setPrintFormat('a4')}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  printFormat === 'a4' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                نموذج A4 رسمي مع الضمان
              </button>
              <button
                onClick={() => setPrintFormat('thermal')}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  printFormat === 'thermal' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                إيصال كاشير حراري (80mm)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Invoice in New Window */}
            <a
              href={`/api/invoices/public/${currentSale.invoice_no}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer border border-slate-300"
              title="عرض وطباعة الفاتورة في نافذة مستقلة"
            >
              <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
              <span>عرض الفاتورة</span>
            </a>

            {/* WhatsApp Send Button */}
            <div className="relative">
              {!showWhatsAppInput ? (
                <button
                  onClick={() => setShowWhatsAppInput(true)}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
                  title="إرسال الفاتورة وتفاصيلها الكاملة عبر واتساب للعميل"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>إرسال واتساب</span>
                </button>
              ) : (
                <div className="flex items-center gap-1 bg-white border border-emerald-400 p-1 rounded-xl shadow-lg">
                  <input
                    type="text"
                    placeholder="رقم موبايل العميل..."
                    value={whatsAppPhone}
                    onChange={(e) => setWhatsAppPhone(e.target.value)}
                    className="w-36 text-xs px-2 py-1 bg-slate-50 border border-slate-200 rounded font-mono font-bold"
                    dir="ltr"
                    autoFocus
                  />
                  <button
                    onClick={handleSendWhatsApp}
                    className="bg-emerald-600 text-white text-xs px-2.5 py-1 rounded font-bold hover:bg-emerald-700 cursor-pointer"
                  >
                    إرسال
                  </button>
                  <button
                    onClick={() => setShowWhatsAppInput(false)}
                    className="text-slate-400 hover:text-slate-600 px-1 text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Print & PDF Button */}
            <button
              onClick={handlePrint}
              disabled={loadingSale}
              className={`flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all ${
                loadingSale ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
              title="طباعة الفاتورة أو حفظها كملف PDF"
            >
              <Printer className="w-4 h-4" />
              <span>{loadingSale ? 'جاري التحميل...' : 'طباعة / حفظ PDF'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Loading Indicator */}
        {loadingSale && (
          <div className="mx-6 mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs font-bold text-blue-800 flex items-center gap-2 animate-pulse no-print">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping"></span>
            <span>جاري تحميل بيانات الأجهزة وتفاصيل الضمان والسيريال بالكامل...</span>
          </div>
        )}

        {/* Printable Invoice Container */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100 flex justify-center print:p-0 print:m-0 print:bg-white print:overflow-visible print:block print:w-full print:h-auto print:max-h-none">
          {printFormat === 'thermal' ? (
            /* ========================================================== */
            /* 80mm THERMAL RECEIPT LAYOUT (WIDTH EXACTLY 72mm)           */
            /* ========================================================== */
            <div
              id="invoice-printable-area"
              className="bg-white shadow-md text-black w-[72mm] max-w-[72mm] p-2.5 text-[11px] font-sans leading-tight border border-slate-200 print:shadow-none print:border-none print:p-1 print:m-0 print:block"
              style={{ boxSizing: 'border-box', overflow: 'visible', wordBreak: 'break-word' }}
            >
              {/* Header */}
              <div className="text-center pb-2 border-b border-dashed border-black">
                <img
                  src={logoUrl}
                  alt={storeName}
                  className="h-9 max-w-[160px] mx-auto object-contain mb-1"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <h1 className="font-black text-sm text-black">{storeName}</h1>
                <p className="text-[10px] text-gray-700 font-semibold mt-0.5">{settings?.tagline || 'للأجهزة الكهربائية والمنزلية'}</p>
                <p className="text-[9px] text-gray-600 mt-1">
                  📍 {currentSale.branch_address || settings?.address || 'شارع الأزهر - القاهرة'}
                </p>
                <p className="text-[9px] text-gray-600">
                  📞 {currentSale.branch_phone || settings?.phone || '01023456789'}
                </p>
                {settings?.commercial_reg && (
                  <p className="text-[8px] text-gray-500">س.ت: {settings?.commercial_reg} | ب.ض: {settings?.tax_number}</p>
                )}
              </div>

              {/* Invoice Meta */}
              <div className="py-2 border-b border-dashed border-black text-[10px] space-y-0.5">
                <div className="flex justify-between font-bold">
                  <span>إيصال رقم:</span>
                  <span className="font-mono">{currentSale.invoice_no}</span>
                </div>
                <div className="flex justify-between">
                  <span>التاريخ والوقت:</span>
                  <span dir="ltr">{new Date(currentSale.created_at).toLocaleString('ar-EG', { timeZone: 'Africa/Cairo', dateStyle: 'short', timeStyle: 'short' })}</span>
                </div>
                <div className="flex justify-between">
                  <span>الفرع:</span>
                  <span>{currentSale.branch_name || 'معرض الأزهر الرئيسي'}</span>
                </div>
                <div className="flex justify-between">
                  <span>نوع البيع:</span>
                  <span className="font-bold">
                    {currentSale.sale_type === 'finance_company'
                      ? `تقسيط شركة (${currentSale.finance_company_name || 'تمويل'})`
                      : currentSale.sale_type === 'installment'
                      ? 'تقسيط معرض'
                      : 'نقدي كاش'}
                  </span>
                </div>
                {currentSale.customer_name && (
                  <div className="flex justify-between pt-1 border-t border-dotted border-gray-300">
                    <span>العميل:</span>
                    <span className="font-bold">{currentSale.customer_name}</span>
                  </div>
                )}
                {currentSale.customer_phone && (
                  <div className="flex justify-between">
                    <span>الهاتف:</span>
                    <span className="font-mono" dir="ltr">{currentSale.customer_phone}</span>
                  </div>
                )}
              </div>

              {/* Items List */}
              <div className="py-2 border-b border-dashed border-black">
                <div className="flex justify-between font-bold pb-1 text-[10px] border-b border-gray-300">
                  <span>الصنف والجهاز</span>
                  <span>السعر</span>
                </div>
                <div className="space-y-2 pt-1.5">
                  {(!currentSale.items || currentSale.items.length === 0) ? (
                    <div className="text-center text-gray-500 py-1 font-bold">
                      {loadingSale ? 'جاري تحميل الأجهزة...' : 'لا توجد أجهزة مسجلة'}
                    </div>
                  ) : (
                    currentSale.items.map((item, idx) => (
                      <div key={idx} className="text-[10px]">
                        <div className="flex justify-between font-black text-black">
                          <span>{idx + 1}. {item.product_name || item.name || 'جهاز كهربائي'}</span>
                          <span className="font-mono font-bold" dir="ltr">{Number(item.unit_price || 0).toLocaleString()} {currency}</span>
                        </div>
                        {item.model_number && (
                          <div className="text-[9px] text-gray-700 font-mono">
                            موديل: {item.model_number}
                          </div>
                        )}
                        {item.serial_number && (
                          <div className="text-[9px] font-mono font-bold text-gray-800 bg-gray-100 px-1 py-0.5 rounded my-0.5 inline-block">
                            سيريال: {item.serial_number}
                          </div>
                        )}
                        <div className="text-[9px] text-gray-600">
                          ضمان: {item.warranty_months ? `${item.warranty_months} شهر` : 'ساري'} ({item.warranty_agency || 'الوكيل المعتمد'})
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Financial Totals */}
              <div className="py-2 border-b border-dashed border-black space-y-1 text-[10px]">
                <div className="flex justify-between">
                  <span>إجمالي الأصناف:</span>
                  <span className="font-mono font-bold" dir="ltr">{Number(currentSale.subtotal || currentSale.total || 0).toLocaleString()} {currency}</span>
                </div>
                {Number(currentSale.discount) > 0 && (
                  <div className="flex justify-between text-red-600 font-bold">
                    <span>الخصم الممنوح:</span>
                    <span className="font-mono" dir="ltr">-{Number(currentSale.discount).toLocaleString()} {currency}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-xs pt-1 border-t border-black">
                  <span>الصافي المطلوب:</span>
                  <span className="font-mono" dir="ltr">{Number(currentSale.total || 0).toLocaleString()} {currency}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-800">
                  <span>المبلغ المسدد:</span>
                  <span className="font-mono" dir="ltr">{Number(currentSale.paid_amount || 0).toLocaleString()} {currency}</span>
                </div>
                {Number(currentSale.remaining_amount) > 0 && (
                  <div className="flex justify-between font-bold text-amber-900">
                    <span>المتبقي:</span>
                    <span className="font-mono" dir="ltr">{Number(currentSale.remaining_amount).toLocaleString()} {currency}</span>
                  </div>
                )}

                {/* Installment Plan Info */}
                {(currentSale.installment_plan_name || currentSale.sale_type === 'finance_company' || currentSale.sale_type === 'installment') && (
                  <div className="bg-gray-100 p-1.5 rounded mt-1.5 space-y-0.5 text-[9px]">
                    <div className="font-bold text-black">
                      نظام التقسيط: {currentSale.installment_plan_name || currentSale.finance_company_name || 'تقسيط'}
                    </div>
                    {currentSale.installment_duration_months && (
                      <div>المدة: {currentSale.installment_duration_months} شهر</div>
                    )}
                    {currentSale.finance_approval_code && (
                      <div className="font-mono">كود الموافقة: {currentSale.finance_approval_code}</div>
                    )}
                    {currentSale.installment_plan?.monthly_amount && (
                      <div className="font-bold text-black">
                        القسط الشهري: {Number(currentSale.installment_plan.monthly_amount).toLocaleString()} {currency}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Warranty & Policy Footer */}
              <div className="py-2 text-[9px] text-gray-700 text-center leading-tight">
                <p className="font-bold mb-1">✓ احتفظ بالإيصال وكرتونة الجهاز برقم السيريال للضمان</p>
                <p>البضاعة ترد وتستبدل خلال 14 يوماً وفق قانون حماية المستهلك بحالة المصنع الأصلية.</p>
                <p className="mt-1 text-[8px] text-gray-500">شكراً لزيارتكم واختياركم دكان عبد العزيز ✨</p>
              </div>
            </div>
          ) : (
            /* ========================================================== */
            /* A4 FORMAL INVOICE WITH FULL WARRANTY DETAILS               */
            /* ========================================================== */
            <div
              id="invoice-printable-area"
              className="bg-white shadow-md text-slate-900 w-[210mm] max-w-full p-8 print:p-0 print:m-0 print:min-h-0 print:w-full print:max-w-none print:shadow-none print:border-none print:block rounded-sm"
            >
              {/* Header with Logo */}
              <div className="border-b-2 border-slate-900 pb-4 mb-4 flex items-start justify-between">
                <div>
                  <img
                    src={logoUrl}
                    alt={storeName}
                    className="h-12 max-w-[240px] object-contain mb-1"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <h1 className="text-xl font-black text-slate-900 tracking-tight">
                    {storeName}
                  </h1>
                  <p className="text-xs text-slate-600 font-semibold mt-0.5">
                    {settings?.tagline || 'ثلاجات - غسالات - شاشات - تكييفات - كاش وبالتقسيط المريح'}
                  </p>
                  <div className="text-[11px] text-slate-500 mt-1 space-y-0.5 font-medium">
                    <p>📍 {currentSale.branch_address || settings?.address || 'شارع الأزهر - القاهرة'}</p>
                    <p>📞 {currentSale.branch_phone || settings?.phone || '01023456789'} {settings?.phone2 && `| ${settings?.phone2}`}</p>
                    {settings?.tax_number && <p>س.ت: {settings?.commercial_reg} | ب.ض: {settings?.tax_number}</p>}
                  </div>
                </div>

                <div className="text-left">
                  <span className={`inline-block px-3 py-1 rounded-md font-black text-xs border ${
                    currentSale.sale_type === 'finance_company'
                      ? 'bg-indigo-50 text-indigo-900 border-indigo-300'
                      : currentSale.sale_type === 'installment'
                      ? 'bg-amber-50 text-amber-900 border-amber-300'
                      : 'bg-emerald-50 text-emerald-900 border-emerald-300'
                  }`}>
                    {currentSale.sale_type === 'finance_company'
                      ? `تقسيط ممول (${currentSale.finance_company_name || 'فاليو / بنوك'})`
                      : currentSale.sale_type === 'installment'
                      ? 'فاتورة بيع بالتقسيط'
                      : 'فاتورة مبيعات نقدية'}
                  </span>
                  {currentSale.installment_plan_name && (
                    <p className="text-[10px] font-bold text-indigo-800 mt-1">
                      خطة: {currentSale.installment_plan_name} {currentSale.installment_duration_months ? `(${currentSale.installment_duration_months} شهر)` : ''}
                    </p>
                  )}
                  {currentSale.finance_approval_code && (
                    <p className="text-[10px] font-mono font-bold text-indigo-700 mt-0.5" dir="ltr">
                      موافقة: {currentSale.finance_approval_code}
                    </p>
                  )}
                  <p className="text-xs font-mono font-bold mt-2 text-slate-800">#{currentSale.invoice_no}</p>
                  <p className="text-[11px] text-slate-500">{new Date(currentSale.created_at).toLocaleString('ar-EG', { timeZone: 'Africa/Cairo', dateStyle: 'medium', timeStyle: 'short' })}</p>
                  <p className="text-[10px] text-blue-700 font-bold mt-1">الفرع: {currentSale.branch_name || 'معرض الأزهر الرئيسي'}</p>
                </div>
              </div>

              {/* Customer Information */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-500 font-semibold">اسم العميل: </span>
                    <span className="font-bold text-slate-800">{currentSale.customer_name || 'عميل نقدي'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold">رقم الهاتف: </span>
                    <span className="font-bold text-slate-800" dir="ltr">{currentSale.customer_phone || '---'}</span>
                  </div>
                  {currentSale.customer_national_id && (
                    <div>
                      <span className="text-slate-500 font-semibold">الرقم القومي: </span>
                      <span className="font-bold text-slate-800" dir="ltr">{currentSale.customer_national_id}</span>
                    </div>
                  )}
                  {currentSale.customer_address && (
                    <div>
                      <span className="text-slate-500 font-semibold">العنوان: </span>
                      <span className="font-bold text-slate-800">{currentSale.customer_address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Sold Appliances Table (With Serial Numbers & Warranty) */}
              <table className="w-full text-right border-collapse mb-4 text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold">
                    <th className="p-2 border border-slate-900 w-8 text-center">#</th>
                    <th className="p-2 border border-slate-900">بيان الجهاز والموديل</th>
                    <th className="p-2 border border-slate-900">الرقم التسلسلي (Serial Number)</th>
                    <th className="p-2 border border-slate-900">فترة الضمان والوكيل</th>
                    <th className="p-2 border border-slate-900 text-left">السعر</th>
                  </tr>
                </thead>
                <tbody>
                  {(!currentSale.items || currentSale.items.length === 0) ? (
                    <tr>
                      <td colSpan="5" className="p-4 text-center text-slate-500 font-bold border border-slate-200">
                        {loadingSale ? 'جاري استدعاء تفاصيل الأجهزة والضمان...' : 'لا توجد أجهزة مسجلة في هذه الفاتورة'}
                      </td>
                    </tr>
                  ) : (
                    currentSale.items.map((item, index) => (
                      <tr key={index} className="border-b border-slate-200">
                        <td className="p-2 border border-slate-200 text-center font-bold">{index + 1}</td>
                        <td className="p-2 border border-slate-200">
                          <p className="font-extrabold text-slate-800">{item.product_name || item.name || 'جهاز كهربائي'}</p>
                          {item.model_number && (
                            <p className="text-[10px] text-slate-500 font-mono">موديل: {item.model_number}</p>
                          )}
                          {item.specifications && (
                            <p className="text-[9px] text-slate-400 mt-0.5 line-clamp-1">{item.specifications}</p>
                          )}
                        </td>
                        <td className="p-2 border border-slate-200">
                          <span className="font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-blue-700 block text-center" dir="ltr">
                            {item.serial_number || 'غير مدون'}
                          </span>
                        </td>
                        <td className="p-2 border border-slate-200 text-[11px]">
                          <div className="flex items-center gap-1 font-bold text-emerald-700">
                            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                            <span>{item.warranty_months ? `${item.warranty_months} شهر (${Math.round(item.warranty_months / 12)} سنوات)` : 'ضمان الوكيل المعتمد'}</span>
                          </div>
                          {item.warranty_agency && (
                            <p className="text-[10px] text-slate-500 mt-0.5">وكيل: {item.warranty_agency}</p>
                          )}
                        </td>
                        <td className="p-2 border border-slate-200 font-extrabold text-slate-900 text-left" dir="ltr">
                          {Number(item.unit_price || 0).toLocaleString()} {currency}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Financial Summary */}
              <div className="flex justify-end mb-4">
                <div className="w-72 bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-medium">الإجمالي:</span>
                    <span className="font-bold text-slate-800" dir="ltr">{Number(currentSale.subtotal || currentSale.total || 0).toLocaleString()} {currency}</span>
                  </div>
                  {Number(currentSale.discount) > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>خصم خاص:</span>
                      <span dir="ltr">-{Number(currentSale.discount).toLocaleString()} {currency}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-slate-200 pt-1.5 font-extrabold text-sm text-slate-900">
                    <span>الصافي المطلوب:</span>
                    <span dir="ltr">{Number(currentSale.total || 0).toLocaleString()} {currency}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>{currentSale.sale_type === 'installment' ? 'المقدم المدفوع:' : 'المبلغ المسدد:'}</span>
                    <span dir="ltr">{Number(currentSale.paid_amount || 0).toLocaleString()} {currency}</span>
                  </div>
                  {Number(currentSale.remaining_amount) > 0 && (
                    <div className="flex justify-between text-amber-700 font-bold border-t border-slate-200 pt-1">
                      <span>{currentSale.sale_type === 'installment' ? 'المتبقي أقساط:' : 'المتبقي آجل:'}</span>
                      <span dir="ltr">{Number(currentSale.remaining_amount).toLocaleString()} {currency}</span>
                    </div>
                  )}
                  {currentSale.installment_plan_name && (
                    <div className="pt-1 border-t border-slate-200 text-[11px] text-indigo-700 font-bold flex justify-between">
                      <span>خطة التقسيط:</span>
                      <span>{currentSale.installment_plan_name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Installment Plan Highlights (If Installment Sale) */}
              {currentSale.sale_type === 'installment' && currentSale.installment_plan && (
                <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-3 mb-4 text-xs">
                  <h4 className="font-black text-amber-900 mb-2">تفاصيل خطة التقسيط والأقساط الشهرية:</h4>
                  <div className="grid grid-cols-4 gap-2 mb-2 text-center">
                    <div className="bg-white p-2 rounded border border-amber-200">
                      <span className="block text-slate-500 text-[10px]">عدد الأقساط</span>
                      <span className="font-bold text-amber-900">{currentSale.installment_plan.installments_count} شهر</span>
                    </div>
                    <div className="bg-white p-2 rounded border border-amber-200">
                      <span className="block text-slate-500 text-[10px]">القسط الشهري</span>
                      <span className="font-extrabold text-amber-900">{Number(currentSale.installment_plan.monthly_amount).toLocaleString()} {currency}</span>
                    </div>
                    <div className="bg-white p-2 rounded border border-amber-200">
                      <span className="block text-slate-500 text-[10px]">تاريخ بداية السداد</span>
                      <span className="font-bold text-amber-900">{currentSale.installment_plan.start_date}</span>
                    </div>
                    <div className="bg-white p-2 rounded border border-amber-200">
                      <span className="block text-slate-500 text-[10px]">بيانات الضامن</span>
                      <span className="font-bold text-amber-900">{currentSale.installment_plan.guarantor_name || 'مسجل بالعقد'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Warranty & Store Policy */}
              <div className="border border-slate-200 rounded-lg p-3 text-[10px] text-slate-600 bg-slate-50/50 mb-6">
                <h5 className="font-bold text-slate-800 mb-1 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  شروط الضمان وخدمة ما بعد البيع:
                </h5>
                <p className="leading-relaxed">
                  {settings?.warranty_policy || 'يسري الضمان من تاريخ هذه الفاتورة بالسيريال نمبر الموضح أعلاه مع أصل شهادة ضمان الشركة المرفقة مع كرتونة الجهاز.'}
                </p>
                <p className="mt-1 font-semibold text-slate-700">
                  * في حالة وجود أي عطل فني خلال فترة الضمان، يرجى التواصل مباشرة مع الخط الساخن لتوكيل الجهاز أو مراجعة المعرض.
                </p>
              </div>

              {/* Signatures & Seal */}
              <div className="grid grid-cols-2 gap-8 text-center text-xs pt-4 border-t border-slate-200">
                <div>
                  <p className="font-bold text-slate-700">توقيع المستلم / المشتري</p>
                  <div className="h-14 border-b border-dashed border-slate-400 mt-2"></div>
                  <p className="text-[10px] text-slate-500 mt-1">أقر باستلام الأجهزة بحالة المصنع والكرتونة سليمة</p>
                </div>
                <div>
                  <p className="font-bold text-slate-700">ختم وتوقيع المعرض</p>
                  <div className="h-14 border-b border-dashed border-slate-400 mt-2 flex items-center justify-center">
                    <span className="text-[11px] font-bold text-blue-800 border-2 border-dashed border-blue-600 px-3 py-1 rounded rotate-[-4deg]">
                      معتمد | {storeName}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
