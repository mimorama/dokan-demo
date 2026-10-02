import React, { useState, useEffect } from 'react';
import { Printer, X, ShieldCheck, CheckCircle2, FileText, Send, MessageCircle, Download, ExternalLink } from 'lucide-react';
import { api } from '../api';

export default function InvoicePrint({ sale, settings, onClose }) {
  const [currentSale, setCurrentSale] = useState(sale);
  const [loadingSale, setLoadingSale] = useState(false);
  const [printFormat, setPrintFormat] = useState('a4'); // 'a4', 'a5', or 'thermal'
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
`🌟 *فاتورة شراء معتمدة* 🌟
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
      {/* Dynamic Print CSS (Requirement 13 & 14) */}
      <style>{`
        @media print {
          @page {
            size: ${printFormat === 'thermal' ? '80mm auto' : printFormat === 'a5' ? 'A5 portrait' : 'A4 portrait'};
            margin: ${printFormat === 'thermal' ? '0mm' : printFormat === 'a5' ? '4mm 6mm' : '8mm 10mm'};
          }
          html, body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Strictly hide all other page chrome */
          body * {
            visibility: hidden !important;
          }
          #invoice-printable-area,
          #invoice-printable-area * {
            visibility: visible !important;
          }
          #invoice-printable-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: ${printFormat === 'thermal' ? '72mm !important' : '100% !important'};
            max-width: ${printFormat === 'thermal' ? '72mm !important' : '100% !important'};
            margin: 0 auto !important;
            padding: ${printFormat === 'thermal' ? '2mm !important' : printFormat === 'a5' ? '4mm !important' : '0mm !important'};
            box-shadow: none !important;
            border: none !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
          }
          .no-print,
          .print\\:hidden {
            display: none !important;
          }
          table {
            page-break-inside: auto !important;
            break-inside: auto !important;
          }
          thead {
            display: table-header-group !important;
          }
          tr, .avoid-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
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
                مقاس A4 رسمي
              </button>
              <button
                onClick={() => setPrintFormat('a5')}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  printFormat === 'a5' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                مقاس A5 مدمج
              </button>
              <button
                onClick={() => setPrintFormat('thermal')}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  printFormat === 'thermal' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                إيصال حراري (80mm)
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
                  alt="شعار المعرض"
                  className="h-12 max-w-[180px] mx-auto object-contain mb-1"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <p className="text-[10px] text-gray-700 font-semibold mt-0.5">{settings?.tagline || 'للأجهزة الكهربائية والمنزلية'}</p>
                <p className="text-[9px] text-gray-600 mt-1">
                  📍 {currentSale.branch_address || settings?.address || 'شارع الأزهر - القاهرة'}
                </p>
                <p className="text-[9px] text-gray-600">
                  📞 {currentSale.branch_phone || settings?.phone || '01023456789'}
                </p>
                {settings?.commercial_reg && (
                  <p className="text-[8.5px] text-gray-700">السجل التجاري (س.ت): <span className="font-mono font-bold">{settings.commercial_reg}</span></p>
                )}
                {settings?.tax_number && (
                  <p className="text-[8.5px] text-gray-700">البطاقة الضريبية (ب.ض): <span className="font-mono font-bold">{settings.tax_number}</span></p>
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
              className={`bg-white shadow-xl text-slate-900 w-full ${printFormat === 'a5' ? 'max-w-[148mm] text-[11px]' : 'max-w-[210mm] text-xs'} p-5 sm:p-6 print:p-0 print:m-0 print:min-h-0 print:w-full print:max-w-none print:shadow-none print:border-none print:block rounded-xl border border-slate-200 font-['Cairo',sans-serif] leading-normal`}
            >
              {/* Header with Logo & Meta */}
              <div className="border-b-2 border-slate-900 pb-2.5 mb-2.5 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <img
                      src={logoUrl}
                      alt="شعار المعرض"
                      className="h-12 sm:h-14 max-w-[220px] object-contain"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <div>
                      <p className="text-[11px] text-slate-600 font-bold">
                        {settings?.tagline || 'تجارة وتوزيع الأجهزة الكهربائية والمنزلية والتقسيط المريح'}
                      </p>
                    </div>
                  </div>
                  <div className="text-[9.5px] text-slate-600 font-medium space-y-0.5">
                    <div className="flex flex-wrap items-center gap-x-4">
                      <span>📍 {currentSale.branch_address || settings?.address || 'شارع الأزهر - القاهرة'}</span>
                      <span>📞 {currentSale.branch_phone || settings?.phone || '01023456789'} {settings?.phone2 && `| ${settings?.phone2}`}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 pt-0.5 text-slate-700">
                      {settings?.commercial_reg && (
                        <span>السجل التجاري (س.ت): <strong className="font-mono font-bold text-slate-900">{settings.commercial_reg}</strong></span>
                      )}
                      {settings?.tax_number && (
                        <span>البطاقة الضريبية (ب.ض): <strong className="font-mono font-bold text-slate-900">{settings.tax_number}</strong></span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-left shrink-0">
                  <div className="border border-slate-400 bg-slate-50 p-2 rounded-lg text-left min-w-[170px] space-y-1">
                    <div className="flex justify-between items-center text-[10px] border-b border-slate-200 pb-0.5">
                      <span className="text-slate-500 font-semibold">رقم الفاتورة:</span>
                      <span className="font-mono font-black text-blue-900 text-xs" dir="ltr">{currentSale.invoice_no}</span>
                    </div>
                    <div className="flex justify-between items-center text-[9.5px] border-b border-slate-200 py-0.5">
                      <span className="text-slate-500">التاريخ:</span>
                      <span className="font-bold text-slate-800">{new Date(currentSale.created_at).toLocaleDateString('ar-EG', { timeZone: 'Africa/Cairo' })}</span>
                    </div>
                    <div className="flex justify-between items-center text-[9px] pt-0.5 text-slate-600">
                      <span>الفرع:</span>
                      <span className="font-bold text-slate-800">{currentSale.branch_name || 'معرض الأزهر الرئيسي'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Information Bar */}
              <div className="bg-slate-50 border border-slate-300 rounded-lg p-2 mb-2.5 text-[11px]">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-slate-500 block text-[9.5px] font-semibold">اسم العميل:</span>
                    <span className="font-extrabold text-slate-900 text-xs block truncate">{currentSale.customer_name || 'عميل نقدي'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9.5px] font-semibold">رقم الهاتف:</span>
                    <span className="font-bold font-mono text-slate-900 block" dir="ltr">{currentSale.customer_phone || '---'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9.5px] font-semibold">طريقة السداد:</span>
                    <span className="font-bold text-slate-800 block">
                      {currentSale.sale_type === 'finance_company'
                        ? `تقسيط شركة (${currentSale.finance_company_name || 'تمويل'})`
                        : currentSale.sale_type === 'installment'
                        ? 'تقسيط معرض مباشر'
                        : 'سداد نقدي (كاش)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sold Appliances Table - Formatted specifically for A5 vs A4 */}
              <div className="mb-2.5">
                {printFormat === 'a5' ? (
                  /* Compact Tailored A5 Table (Requirement 2) */
                  <table className="w-full text-right border-collapse border border-slate-400 text-[10px]">
                    <thead>
                      <tr className="bg-slate-900 text-white font-bold">
                        <th className="p-1 border border-slate-900 w-6 text-center">م</th>
                        <th className="p-1 border border-slate-900">بيان الصنف والموديل والرقم التسلسلي</th>
                        <th className="p-1 border border-slate-900 text-center w-28">الضمان والوكيل</th>
                        <th className="p-1 border border-slate-900 text-left w-20">السعر</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(!currentSale.items || currentSale.items.length === 0) ? (
                        <tr>
                          <td colSpan="4" className="p-2 text-center text-slate-500 font-bold border border-slate-300">
                            {loadingSale ? 'جاري استدعاء تفاصيل الأجهزة والضمان...' : 'لا توجد أجهزة مسجلة في هذه الفاتورة'}
                          </td>
                        </tr>
                      ) : (
                        currentSale.items.map((item, index) => (
                          <tr key={index} className="border-b border-slate-300 hover:bg-slate-50">
                            <td className="p-1 border border-slate-300 text-center font-bold text-slate-500">{index + 1}</td>
                            <td className="p-1 border border-slate-300">
                              <p className="font-black text-slate-900 text-[10.5px] leading-tight">{item.product_name || item.name || 'جهاز كهربائي'}</p>
                              <div className="flex flex-wrap items-center gap-1.5 text-[9px] text-slate-600 mt-0.5">
                                {item.model_number && <span className="font-mono">موديل: {item.model_number}</span>}
                                {item.brand_name && <span>ماركة: {item.brand_name}</span>}
                                {item.serial_number && (
                                  <span className="font-mono font-bold bg-slate-100 border border-slate-300 px-1 py-0.2 rounded text-blue-900" dir="ltr">
                                    S/N: {item.serial_number}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-1 border border-slate-300 text-center">
                              <span className="font-bold text-emerald-800 text-[9.5px] block">
                                {item.warranty_months ? `ضمان ${item.warranty_months} شهر` : 'ضمان معتمد'}
                              </span>
                              {item.warranty_agency && (
                                <span className="text-[8.5px] text-slate-500 block leading-tight">وكيل: {item.warranty_agency}</span>
                              )}
                            </td>
                            <td className="p-1 border border-slate-300 font-black text-slate-900 text-left font-mono text-[10.5px]" dir="ltr">
                              {Number(item.unit_price || 0).toLocaleString()} {currency}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                ) : (
                  /* Standard A4 Table */
                  <table className="w-full text-right border-collapse border border-slate-400 text-[11px]">
                    <thead>
                      <tr className="bg-slate-900 text-white font-bold">
                        <th className="p-1.5 border border-slate-900 w-7 text-center">م</th>
                        <th className="p-1.5 border border-slate-900">بيان الصنف والموديل</th>
                        <th className="p-1.5 border border-slate-900 text-center w-36">الرقم التسلسلي (Serial No)</th>
                        <th className="p-1.5 border border-slate-900 text-center w-40">الضمان والوكيل المعتمد</th>
                        <th className="p-1.5 border border-slate-900 text-left w-24">السعر</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(!currentSale.items || currentSale.items.length === 0) ? (
                        <tr>
                          <td colSpan="5" className="p-3 text-center text-slate-500 font-bold border border-slate-300">
                            {loadingSale ? 'جاري استدعاء تفاصيل الأجهزة والضمان...' : 'لا توجد أجهزة مسجلة في هذه الفاتورة'}
                          </td>
                        </tr>
                      ) : (
                        currentSale.items.map((item, index) => (
                          <tr key={index} className="border-b border-slate-300 hover:bg-slate-50">
                            <td className="p-1.5 border border-slate-300 text-center font-bold text-slate-500">{index + 1}</td>
                            <td className="p-1.5 border border-slate-300">
                              <p className="font-black text-slate-900 text-xs">{item.product_name || item.name || 'جهاز كهربائي'}</p>
                              <div className="flex items-center gap-2 text-[9.5px] text-slate-500 mt-0.5">
                                {item.model_number && <span className="font-mono">موديل: {item.model_number}</span>}
                                {item.brand_name && <span>ماركة: {item.brand_name}</span>}
                              </div>
                              {item.specifications && (
                                <p className="text-[9px] text-slate-400 line-clamp-1 mt-0.5">{item.specifications}</p>
                              )}
                            </td>
                            <td className="p-1.5 border border-slate-300 text-center">
                              <span className="font-mono font-bold bg-slate-100 border border-slate-300 px-1.5 py-0.5 rounded text-blue-900 text-[10px] inline-block" dir="ltr">
                                {item.serial_number || 'غير مدون'}
                              </span>
                            </td>
                            <td className="p-1.5 border border-slate-300 text-center">
                              <div className="inline-flex items-center gap-1 font-bold text-emerald-800 text-[10px]">
                                <ShieldCheck className="w-3 h-3 shrink-0" />
                                <span>{item.warranty_months ? `ضمان ${item.warranty_months} شهر (${Math.round(item.warranty_months / 12)} سنة)` : 'ضمان معتمد'}</span>
                              </div>
                              {item.warranty_agency && (
                                <p className="text-[9px] text-slate-500 mt-0.5">وكيل: {item.warranty_agency}</p>
                              )}
                            </td>
                            <td className="p-1.5 border border-slate-300 font-black text-slate-900 text-left font-mono" dir="ltr">
                              {Number(item.unit_price || 0).toLocaleString()} {currency}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Financial Totals & Installment Block (Side-by-Side to Save Vertical A4 Space) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-2.5 items-start">
                {/* Right / Left Side: Installment Highlights (if applicable) or Delivery / Notes */}
                {(currentSale.installment_plan_name || currentSale.sale_type === 'finance_company' || currentSale.sale_type === 'installment') ? (
                  <div className="bg-indigo-50/60 border border-indigo-200 rounded-lg p-2.5 text-[10px] space-y-1">
                    <div className="font-black text-indigo-950 text-xs flex items-center justify-between border-b border-indigo-200 pb-1">
                      <span>خطة ونظام التقسيط المعتمد:</span>
                      <span className="text-[10px] font-bold text-indigo-700 font-mono">
                        {currentSale.installment_duration_months ? `${currentSale.installment_duration_months} شهر` : ''}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>النظام:</span>
                      <span className="font-bold text-indigo-900">{currentSale.installment_plan_name || currentSale.finance_company_name || 'تقسيط معرض'}</span>
                    </div>
                    {currentSale.installment_plan?.monthly_amount && (
                      <div className="flex justify-between text-slate-700">
                        <span>القسط الشهري:</span>
                        <span className="font-bold font-mono text-indigo-900" dir="ltr">{Number(currentSale.installment_plan.monthly_amount).toLocaleString()} {currency}</span>
                      </div>
                    )}
                    {currentSale.installment_plan?.start_date && (
                      <div className="flex justify-between text-slate-700">
                        <span>تاريخ بداية السداد:</span>
                        <span className="font-bold font-mono text-indigo-900">{currentSale.installment_plan.start_date}</span>
                      </div>
                    )}
                    {currentSale.installment_plan?.guarantor_name && (
                      <div className="flex justify-between text-slate-700">
                        <span>الضامن المتضامن:</span>
                        <span className="font-bold text-slate-900">{currentSale.installment_plan.guarantor_name} ({currentSale.installment_plan.guarantor_phone || ''})</span>
                      </div>
                    )}
                    {currentSale.finance_approval_code && (
                      <div className="flex justify-between text-slate-700">
                        <span>كود الموافقة البنكية:</span>
                        <span className="font-mono font-bold text-indigo-800" dir="ltr">{currentSale.finance_approval_code}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-[10px] space-y-1">
                    <span className="font-bold text-slate-700 block border-b border-slate-200 pb-1">ملاحظات الفاتورة والتسليم:</span>
                    <p className="text-slate-600 text-[9.5px] leading-relaxed">
                      ✓ تم فحص ومطابقة الأجهزة الكهربائية المسجلة بالسيريال مع كراتين المصنع الأصلية قبل التسليم.
                    </p>
                    <p className="text-slate-600 text-[9.5px] leading-relaxed">
                      ✓ يسري الضمان الشامل بالتعاون مع مراكز الصيانة وخدمة العملاء المعتمدة بموجب هذه الفاتورة.
                    </p>
                  </div>
                )}

                {/* Left Side: Financial Totals Box */}
                <div className="bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs space-y-1">
                  <div className="flex justify-between text-slate-600 text-[11px]">
                    <span>إجمالي الأصناف:</span>
                    <span className="font-bold font-mono" dir="ltr">{Number(currentSale.subtotal || currentSale.total || 0).toLocaleString()} {currency}</span>
                  </div>
                  {Number(currentSale.discount) > 0 && (
                    <div className="flex justify-between text-rose-600 text-[11px]">
                      <span>خصم ممنوح:</span>
                      <span className="font-bold font-mono" dir="ltr">-{Number(currentSale.discount).toLocaleString()} {currency}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-slate-300 pt-1 font-black text-sm text-slate-900">
                    <span>الصافي المطلوب:</span>
                    <span className="font-mono" dir="ltr">{Number(currentSale.total || 0).toLocaleString()} {currency}</span>
                  </div>
                  <div className="flex justify-between text-emerald-800 font-bold text-[11px]">
                    <span>{currentSale.sale_type === 'installment' ? 'المقدم المدفوع:' : 'المبلغ المسدد:'}</span>
                    <span className="font-mono" dir="ltr">{Number(currentSale.paid_amount || 0).toLocaleString()} {currency}</span>
                  </div>
                  {Number(currentSale.remaining_amount) > 0 && (
                    <div className="flex justify-between text-amber-800 font-bold text-[11px] border-t border-dashed border-slate-300 pt-0.5">
                      <span>{currentSale.sale_type === 'installment' ? 'المتبقي أقساط:' : 'المتبقي آجل:'}</span>
                      <span className="font-mono" dir="ltr">{Number(currentSale.remaining_amount).toLocaleString()} {currency}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Warranty & Store Policy Notice */}
              <div className="border border-slate-200 bg-slate-50/70 rounded-lg p-2 text-[9.5px] text-slate-600 mb-2.5">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 mb-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                  <span>شروط الضمان المعتمد وحماية المستهلك:</span>
                </div>
                <p className="leading-relaxed">
                  {settings?.warranty_policy || 'يسري الضمان المعتمد من تاريخ هذه الفاتورة بالسيريال نمبر المدون أعلاه مع أصل شهادة ضمان الشركة المرفقة مع كرتونة الجهاز. البضاعة المباعة ترد وتستبدل خلال 14 يوماً وفق قانون حماية المستهلك بحالة المصنع الأصلية.'}
                </p>
              </div>

              {/* Signatures & Seal Box */}
              <div className="grid grid-cols-2 gap-6 text-center text-xs pt-2 border-t-2 border-slate-800 avoid-break" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                <div>
                  <p className="font-bold text-slate-800 text-[11px]">توقيع المستلم / المشتري</p>
                  <div className="h-9 border-b border-dashed border-slate-400 mt-1"></div>
                  <p className="text-[9px] text-slate-500 mt-1">أقر باستلام الأجهزة الموضحة أعلاه بحالة المصنع والكرتونة سليمة</p>
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-[11px]">ختم وتوقيع إدارة المعرض</p>
                  <div className="h-9 border-b border-dashed border-slate-400 mt-1 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-blue-900 border-2 border-dashed border-blue-700 px-3 py-0.5 rounded rotate-[-3deg] bg-blue-50/50">
                      ختم وتوقيع المعرض المعتمد
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-500 mt-1">س.ت: {settings?.commercial_reg || '198425'} | ب.ض: {settings?.tax_number || '654-321-987'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
