import React, { useState } from 'react';
import { Printer, X, ShieldCheck, CheckCircle2, FileText, Send, MessageCircle, Download, ExternalLink } from 'lucide-react';

export default function InvoicePrint({ sale, settings, onClose }) {
  const [printFormat, setPrintFormat] = useState('a4'); // 'a4' or 'thermal'
  const [whatsAppPhone, setWhatsAppPhone] = useState(sale?.customer_phone || '');
  const [showWhatsAppInput, setShowWhatsAppInput] = useState(false);

  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const currency = settings?.currency || 'ج.م';
  const storeName = settings?.store_name || 'معرض دكان عبد العزيز للأجهزة الكهربائية';
  const logoUrl = settings?.logo_url || '/logo.svg';

  const handleSendWhatsApp = () => {
    const rawPhone = whatsAppPhone || sale.customer_phone;
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
    const publicLink = `${window.location.origin}/api/invoices/public/${sale.invoice_no}`;

    // Format item details
    const itemsList = sale.items?.map((it, i) => 
      `🔹 *${i + 1}. ${it.product_name}*\n` +
      `   ▪️ الموديل: \`${it.model_number || '-'}\`\n` +
      `   ▪️ السيريال: \`${it.serial_number || '-'}\`\n` +
      `   ▪️ الضمان: ${it.warranty_months} شهر (${it.warranty_agency || 'الوكيل المعتمد'})\n` +
      `   ▪️ السعر: ${Number(it.unit_price).toLocaleString()} ${currency}`
    ).join('\n\n') || '';

    const installmentDetails = sale.sale_type === 'finance_company'
      ? `🏢 *نظام التقسيط:* ${sale.installment_plan_name || sale.finance_company_name || 'تمويل استهلاكي'}${sale.installment_duration_months ? ` (${sale.installment_duration_months} شهر)` : ''}\n` +
        (sale.finance_approval_code ? `🔑 *كود الموافقة:* \`${sale.finance_approval_code}\`\n` : '')
      : sale.sale_type === 'installment'
      ? `📅 *نظام التقسيط:* ${sale.installment_plan_name || 'تقسيط مباشر من المعرض'}${sale.installment_duration_months ? ` (${sale.installment_duration_months} شهر)` : ''}\n` +
        (sale.installment_plan?.monthly_amount ? `💵 *القسط الشهري:* ${Number(sale.installment_plan.monthly_amount).toLocaleString()} ${currency}\n` : '')
      : '';

    const message = 
`🌟 *${storeName}* 🌟
━━━━━━━━━━━━━━━━━━━━
💐 أهلاً بك عزيزنا العميل: *${sale.customer_name || 'المحترم'}*

يسعدنا إرفاق تفاصيل فاتورة الشراء المعتمدة وشهادة الضمان للأجهزة الكهربائية:

📄 *رقم الفاتورة:* \`${sale.invoice_no}\`
📅 *تاريخ الفاتورة:* ${new Date(sale.created_at).toLocaleDateString('ar-EG', { timeZone: 'Africa/Cairo' })}
🏢 *الفرع:* ${sale.branch_name || 'معرض الأزهر الرئيسي'}

📦 *الأجهزة المشتراة وتفاصيل السيريال والضمان:*
${itemsList}

━━━━━━━━━━━━━━━━━━━━
💰 *إجمالي الفاتورة:* *${Number(sale.total).toLocaleString()} ${currency}*
💵 *المبلغ المسدد:* *${Number(sale.paid_amount).toLocaleString()} ${currency}*
${Number(sale.remaining_amount) > 0 ? `⏳ *المتبقي:* *${Number(sale.remaining_amount).toLocaleString()} ${currency}*\n` : ''}${installmentDetails}
📜 *شروط الضمان:*
يسري الضمان من تاريخ هذه الفاتورة بالسيريال نمبر المدون أعلاه مع أصل شهادة ضمان الشركة المرفقة مع كرتونة الجهاز.

🔗 *رابط عرض وطباعة الفاتورة الإلكترونية المباشر:*
${publicLink}

━━━━━━━━━━━━━━━━━━━━
📞 خدمة العملاء والصيانة: ${sale.branch_phone || settings?.phone || '01023456789'}
📍 العنوان: ${sale.branch_address || settings?.address || 'شارع الأزهر - القاهرة'}
نشكركم دائماً لاختياركم دكان عبد العزيز! ✨`;

    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
    setShowWhatsAppInput(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
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
          .no-print {
            display: none !important;
          }
          #invoice-printable-area {
            box-shadow: none !important;
            border: none !important;
            width: ${printFormat === 'thermal' ? '72mm !important' : '100% !important'};
            max-width: ${printFormat === 'thermal' ? '72mm !important' : '100% !important'};
            margin: 0 auto !important;
            padding: ${printFormat === 'thermal' ? '2mm !important' : '0mm !important'};
            height: auto !important;
            min-height: 0 !important;
          }
        }
      `}</style>


      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Controls Bar (Hidden during print) */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              معاينة وطباعة الفاتورة ({sale.invoice_no})
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
              href={`/api/invoices/public/${sale.invoice_no}`}
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
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
              title="طباعة الفاتورة أو حفظها كملف PDF"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة / حفظ PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100 flex justify-center print:p-0 print:bg-white print:overflow-visible">
          {printFormat === 'thermal' ? (
            /* ========================================================== */
            /* 80mm THERMAL RECEIPT LAYOUT (WIDTH EXACTLY 72mm)           */
            /* ========================================================== */
            <div
              id="invoice-printable-area"
              className="bg-white shadow-md text-black w-[72mm] max-w-[72mm] p-2.5 text-[11px] font-sans leading-tight border border-slate-200"
              style={{ boxSizing: 'border-box', overflow: 'hidden', wordBreak: 'break-word' }}
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
                  📍 {sale.branch_address || settings?.address || 'شارع الأزهر - القاهرة'}
                </p>
                <p className="text-[9px] text-gray-600">
                  📞 {sale.branch_phone || settings?.phone || '01023456789'}
                </p>
                {settings?.commercial_reg && (
                  <p className="text-[8px] text-gray-500">س.ت: {settings?.commercial_reg} | ب.ض: {settings?.tax_number}</p>
                )}
              </div>

              {/* Invoice Meta */}
              <div className="py-2 border-b border-dashed border-black text-[10px] space-y-0.5">
                <div className="flex justify-between font-bold">
                  <span>إيصال رقم:</span>
                  <span className="font-mono">{sale.invoice_no}</span>
                </div>
                <div className="flex justify-between">
                  <span>التاريخ والوقت:</span>
                  <span dir="ltr">{new Date(sale.created_at).toLocaleString('ar-EG', { timeZone: 'Africa/Cairo', dateStyle: 'short', timeStyle: 'short' })}</span>
                </div>
                <div className="flex justify-between">
                  <span>الفرع:</span>
                  <span>{sale.branch_name || 'الرئيسي'}</span>
                </div>
                <div className="flex justify-between">
                  <span>نوع البيع:</span>
                  <span className="font-bold">
                    {sale.sale_type === 'finance_company'
                      ? `تقسيط شركة (${sale.finance_company_name || 'تمويل'})`
                      : sale.sale_type === 'installment'
                      ? 'تقسيط معرض'
                      : 'نقدي كاش'}
                  </span>
                </div>
                {sale.customer_name && (
                  <div className="flex justify-between pt-1 border-t border-dotted border-gray-300">
                    <span>العميل:</span>
                    <span className="font-bold">{sale.customer_name}</span>
                  </div>
                )}
                {sale.customer_phone && (
                  <div className="flex justify-between">
                    <span>الهاتف:</span>
                    <span className="font-mono" dir="ltr">{sale.customer_phone}</span>
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
                  {sale.items && sale.items.map((item, idx) => (
                    <div key={idx} className="text-[10px]">
                      <div className="flex justify-between font-black text-black">
                        <span>{idx + 1}. {item.product_name}</span>
                        <span className="font-mono font-bold" dir="ltr">{Number(item.unit_price).toLocaleString()} {currency}</span>
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
                        ضمان: {item.warranty_months} شهر ({item.warranty_agency || 'الوكيل'})
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Totals */}
              <div className="py-2 border-b border-dashed border-black space-y-1 text-[10px]">
                <div className="flex justify-between">
                  <span>إجمالي الأصناف:</span>
                  <span className="font-mono font-bold" dir="ltr">{Number(sale.subtotal).toLocaleString()} {currency}</span>
                </div>
                {Number(sale.discount) > 0 && (
                  <div className="flex justify-between text-red-600 font-bold">
                    <span>الخصم الممنوح:</span>
                    <span className="font-mono" dir="ltr">-{Number(sale.discount).toLocaleString()} {currency}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-xs pt-1 border-t border-black">
                  <span>الصافي المطلوب:</span>
                  <span className="font-mono" dir="ltr">{Number(sale.total).toLocaleString()} {currency}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-800">
                  <span>المبلغ المسدد:</span>
                  <span className="font-mono" dir="ltr">{Number(sale.paid_amount).toLocaleString()} {currency}</span>
                </div>
                {Number(sale.remaining_amount) > 0 && (
                  <div className="flex justify-between font-bold text-amber-900">
                    <span>المتبقي:</span>
                    <span className="font-mono" dir="ltr">{Number(sale.remaining_amount).toLocaleString()} {currency}</span>
                  </div>
                )}

                {/* Installment Plan Info */}
                {(sale.installment_plan_name || sale.sale_type === 'finance_company' || sale.sale_type === 'installment') && (
                  <div className="bg-gray-100 p-1.5 rounded mt-1.5 space-y-0.5 text-[9px]">
                    <div className="font-bold text-black">
                      نظام التقسيط: {sale.installment_plan_name || sale.finance_company_name || 'تقسيط'}
                    </div>
                    {sale.installment_duration_months && (
                      <div>المدة: {sale.installment_duration_months} شهر</div>
                    )}
                    {sale.finance_approval_code && (
                      <div className="font-mono">كود الموافقة: {sale.finance_approval_code}</div>
                    )}
                    {sale.installment_plan?.monthly_amount && (
                      <div className="font-bold text-black">
                        القسط الشهري: {Number(sale.installment_plan.monthly_amount).toLocaleString()} {currency}
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
              className="bg-white shadow-md text-slate-900 w-[210mm] max-w-full p-8 print:p-0 print:min-h-0 print:w-full print:max-w-none print:shadow-none print:border-none rounded-sm"
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
                    <p>📍 {sale.branch_address || settings?.address || 'شارع الأزهر - القاهرة'}</p>
                    <p>📞 {sale.branch_phone || settings?.phone || '01023456789'} {settings?.phone2 && `| ${settings?.phone2}`}</p>
                    {settings?.tax_number && <p>س.ت: {settings?.commercial_reg} | ب.ض: {settings?.tax_number}</p>}
                  </div>
                </div>

                <div className="text-left">
                  <span className={`inline-block px-3 py-1 rounded-md font-black text-xs border ${
                    sale.sale_type === 'finance_company'
                      ? 'bg-indigo-50 text-indigo-900 border-indigo-300'
                      : sale.sale_type === 'installment'
                      ? 'bg-amber-50 text-amber-900 border-amber-300'
                      : 'bg-emerald-50 text-emerald-900 border-emerald-300'
                  }`}>
                    {sale.sale_type === 'finance_company'
                      ? `تقسيط ممول (${sale.finance_company_name || 'فاليو / بنوك'})`
                      : sale.sale_type === 'installment'
                      ? 'فاتورة بيع بالتقسيط'
                      : 'فاتورة مبيعات نقدية'}
                  </span>
                  {sale.installment_plan_name && (
                    <p className="text-[10px] font-bold text-indigo-800 mt-1">
                      خطة: {sale.installment_plan_name} {sale.installment_duration_months ? `(${sale.installment_duration_months} شهر)` : ''}
                    </p>
                  )}
                  {sale.finance_approval_code && (
                    <p className="text-[10px] font-mono font-bold text-indigo-700 mt-0.5" dir="ltr">
                      موافقة: {sale.finance_approval_code}
                    </p>
                  )}
                  <p className="text-xs font-mono font-bold mt-2 text-slate-800">#{sale.invoice_no}</p>
                  <p className="text-[11px] text-slate-500">{new Date(sale.created_at).toLocaleString('ar-EG', { timeZone: 'Africa/Cairo', dateStyle: 'medium', timeStyle: 'short' })}</p>
                  <p className="text-[10px] text-blue-700 font-bold mt-1">الفرع: {sale.branch_name || 'معرض الأزهر الرئيسي'}</p>
                </div>
              </div>

              {/* Customer Information */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-500 font-semibold">اسم العميل: </span>
                    <span className="font-bold text-slate-800">{sale.customer_name || 'عميل نقدي'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold">رقم الهاتف: </span>
                    <span className="font-bold text-slate-800" dir="ltr">{sale.customer_phone || '---'}</span>
                  </div>
                  {sale.customer_national_id && (
                    <div>
                      <span className="text-slate-500 font-semibold">الرقم القومي: </span>
                      <span className="font-bold text-slate-800" dir="ltr">{sale.customer_national_id}</span>
                    </div>
                  )}
                  {sale.customer_address && (
                    <div>
                      <span className="text-slate-500 font-semibold">العنوان: </span>
                      <span className="font-bold text-slate-800">{sale.customer_address}</span>
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
                  {sale.items && sale.items.map((item, index) => (
                    <tr key={index} className="border-b border-slate-200">
                      <td className="p-2 border border-slate-200 text-center font-bold">{index + 1}</td>
                      <td className="p-2 border border-slate-200">
                        <p className="font-extrabold text-slate-800">{item.product_name}</p>
                        {item.model_number && (
                          <p className="text-[10px] text-slate-500 font-mono">موديل: {item.model_number}</p>
                        )}
                      </td>
                      <td className="p-2 border border-slate-200">
                        <span className="font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-blue-700 block text-center" dir="ltr">
                          {item.serial_number || 'غير مدون'}
                        </span>
                      </td>
                      <td className="p-2 border border-slate-200 text-[11px]">
                        <div className="flex items-center gap-1 font-bold text-emerald-700">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>{item.warranty_months} شهر ({Math.round(item.warranty_months / 12)} سنوات)</span>
                        </div>
                        {item.warranty_agency && (
                          <p className="text-[10px] text-slate-500 mt-0.5">وكيل: {item.warranty_agency}</p>
                        )}
                      </td>
                      <td className="p-2 border border-slate-200 font-extrabold text-slate-900 text-left" dir="ltr">
                        {Number(item.unit_price).toLocaleString()} {currency}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Financial Summary */}
              <div className="flex justify-end mb-4">
                <div className="w-72 bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-medium">الإجمالي:</span>
                    <span className="font-bold text-slate-800" dir="ltr">{Number(sale.subtotal).toLocaleString()} {currency}</span>
                  </div>
                  {sale.discount > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>خصم خاص:</span>
                      <span dir="ltr">-{Number(sale.discount).toLocaleString()} {currency}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-slate-200 pt-1.5 font-extrabold text-sm text-slate-900">
                    <span>الصافي المطلوب:</span>
                    <span dir="ltr">{Number(sale.total).toLocaleString()} {currency}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>{sale.sale_type === 'installment' ? 'المقدم المدفوع:' : 'المبلغ المسدد:'}</span>
                    <span dir="ltr">{Number(sale.paid_amount).toLocaleString()} {currency}</span>
                  </div>
                  {sale.remaining_amount > 0 && (
                    <div className="flex justify-between text-amber-700 font-bold border-t border-slate-200 pt-1">
                      <span>{sale.sale_type === 'installment' ? 'المتبقي أقساط:' : 'المتبقي آجل:'}</span>
                      <span dir="ltr">{Number(sale.remaining_amount).toLocaleString()} {currency}</span>
                    </div>
                  )}
                  {sale.installment_plan_name && (
                    <div className="pt-1 border-t border-slate-200 text-[11px] text-indigo-700 font-bold flex justify-between">
                      <span>خطة التقسيط:</span>
                      <span>{sale.installment_plan_name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Installment Plan Highlights (If Installment Sale) */}
              {sale.sale_type === 'installment' && sale.installment_plan && (
                <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-3 mb-4 text-xs">
                  <h4 className="font-black text-amber-900 mb-2">تفاصيل خطة التقسيط والأقساط الشهرية:</h4>
                  <div className="grid grid-cols-4 gap-2 mb-2 text-center">
                    <div className="bg-white p-2 rounded border border-amber-200">
                      <span className="block text-slate-500 text-[10px]">عدد الأقساط</span>
                      <span className="font-bold text-amber-900">{sale.installment_plan.installments_count} شهر</span>
                    </div>
                    <div className="bg-white p-2 rounded border border-amber-200">
                      <span className="block text-slate-500 text-[10px]">القسط الشهري</span>
                      <span className="font-extrabold text-amber-900">{Number(sale.installment_plan.monthly_amount).toLocaleString()} {currency}</span>
                    </div>
                    <div className="bg-white p-2 rounded border border-amber-200">
                      <span className="block text-slate-500 text-[10px]">تاريخ بداية السداد</span>
                      <span className="font-bold text-amber-900">{sale.installment_plan.start_date}</span>
                    </div>
                    <div className="bg-white p-2 rounded border border-amber-200">
                      <span className="block text-slate-500 text-[10px]">بيانات الضامن</span>
                      <span className="font-bold text-amber-900">{sale.installment_plan.guarantor_name || 'مسجل بالعقد'}</span>
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
