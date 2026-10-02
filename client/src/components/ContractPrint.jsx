import React from 'react';
import { Printer, X, FileText, CheckCircle2 } from 'lucide-react';

export default function ContractPrint({ plan, settings, onClose }) {
  if (!plan) return null;

  const handlePrint = () => {
    window.print();
  };

  const currency = settings?.currency || 'ج.م';

  // Compute installments schedule fallback if plan.payments is missing or empty
  const paymentsList = (plan.payments && plan.payments.length > 0)
    ? plan.payments
    : Array.from({ length: Number(plan.installments_count) || 12 }).map((_, idx) => {
        const start = plan.start_date ? new Date(plan.start_date) : new Date();
        const dueDate = new Date(start);
        dueDate.setMonth(dueDate.getMonth() + idx);
        const y = dueDate.getFullYear();
        const m = String(dueDate.getMonth() + 1).padStart(2, '0');
        const d = String(dueDate.getDate()).padStart(2, '0');
        const count = Number(plan.installments_count) || 12;
        const total = Number(plan.total_installment_amount) || (Number(plan.monthly_amount) * count) || 0;
        const monthly = Number(plan.monthly_amount) || (count > 0 ? Math.round(total / count) : 0);
        const amount = (idx === count - 1) ? Math.max(0, total - (monthly * (count - 1))) : monthly;
        return {
          id: `calc-${idx + 1}`,
          installment_no: idx + 1,
          due_date: `${y}-${m}-${d}`,
          amount_due: amount,
          status: 'pending'
        };
      });

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* Dynamic Isolated Print CSS */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }
          html, body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Hide app and modal backdrops */
          body * {
            visibility: hidden !important;
          }
          #contract-printable-area,
          #contract-printable-area * {
            visibility: visible !important;
          }
          #contract-printable-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            height: auto !important;
            overflow: visible !important;
          }
          .no-print {
            display: none !important;
          }
          .avoid-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Controls Bar (Hidden during print) */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between no-print">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-800 text-sm">
              عقد بيع بالتقسيط وإيصال أمانة (رقم الفاتورة: {plan.invoice_no})
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة العقد وإيصالات الأمانة</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contract Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 flex justify-center">
          <div 
            id="contract-printable-area" 
            className="w-[210mm] max-w-full p-6 sm:p-8 bg-white text-slate-900 shadow-md text-xs leading-relaxed font-['Cairo',sans-serif]"
            dir="rtl"
          >
            {/* Header */}
            <div className="text-center border-b-2 border-slate-900 pb-3 mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="w-20">
                  <img
                    src={settings?.logo_url || '/logo.svg'}
                    alt="دكان عبد العزيز"
                    className="max-h-12 w-auto object-contain"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
                <div className="flex-1 text-center">
                  <h2 className="text-lg font-black text-slate-900">{settings?.store_name || 'معرض دكان عبد العزيز للأجهزة الكهربائية'}</h2>
                  <p className="text-xs font-bold text-slate-700">عقد بيع بالتقسيط وإقرار استلام جهاز على سبيل الأمانة</p>
                </div>
                <div className="w-20 text-left text-[10px] text-slate-500 font-mono" dir="rtl">
                  <div>CNT-{plan.id}</div>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                تاريخ التعاقد: {plan.sale_date?.slice(0, 10) || plan.start_date} | رقم الفاتورة / المرجع: {plan.invoice_no}
              </p>
            </div>

            {/* Contract Parties */}
            <div className="space-y-2 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
              <p>
                <strong className="text-slate-900 font-black">الطرف الأول (البائع): </strong>
                {settings?.store_name} ومقره {settings?.address || 'المركز الرئيسي'}، هاتف: {settings?.phone || '---'}.
              </p>
              <p>
                <strong className="text-slate-900 font-black">الطرف الثاني (المشتري / المستلم): </strong>
                السيد/ <span className="font-extrabold text-blue-900">{plan.customer_name}</span>، 
                رقم قومي: <span className="font-mono font-bold" dir="ltr">{plan.customer_national_id || '---'}</span>، 
                المقيم في: {plan.customer_address || '---'}، 
                جهة العمل: {plan.customer_workplace || '---'}، 
                هاتف: <span className="font-mono font-bold" dir="ltr">{plan.customer_phone}</span>.
              </p>
              {plan.guarantor_name && (
                <p>
                  <strong className="text-slate-900 font-black">الطرف الثالث (الضامن المتضامن): </strong>
                  السيد/ <span className="font-extrabold text-indigo-900">{plan.guarantor_name}</span> (صلة القرابة: {plan.guarantor_relation || 'ضامن'})، 
                  رقم قومي: <span className="font-mono font-bold" dir="ltr">{plan.guarantor_national_id || '---'}</span>، 
                  المقيم في: {plan.guarantor_address || '---'}، 
                  هاتف: <span className="font-mono font-bold" dir="ltr">{plan.guarantor_phone || '---'}</span>.
                </p>
              )}
            </div>

            {/* Preamble */}
            <div className="mb-4">
              <h4 className="font-black text-slate-900 mb-1">التمهيد وبيان الأجهزة المبيعة:</h4>
              <p className="text-[11px] text-slate-700">
                اتفق الطرفان بكامل أهليتهما القانونية على شراء الأجهزة الكهربائية الآتية، وقد قام الطرف الثاني بمعاينتها واستلامها سليمة بحالة المصنع:
              </p>

              <table className="w-full mt-2 border-collapse border border-slate-300 text-[11px]">
                <thead className="bg-slate-100 font-bold">
                  <tr>
                    <th className="p-1.5 border border-slate-300 text-center w-8">#</th>
                    <th className="p-1.5 border border-slate-300 text-right">اسم الجهاز والموديل</th>
                    <th className="p-1.5 border border-slate-300 text-center">الرقم التسلسلي (Serial No)</th>
                    <th className="p-1.5 border border-slate-300 text-center">الوكيل والضمان</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.items?.map((it, idx) => (
                    <tr key={idx} className="text-center">
                      <td className="p-1.5 border border-slate-300 font-bold">{idx + 1}</td>
                      <td className="p-1.5 border border-slate-300 font-bold text-right">
                        {it.product_name || it.name || 'جهاز كهربائي'}
                        {(it.model_number || it.model) ? ` - موديل (${it.model_number || it.model})` : ''}
                      </td>
                      <td className="p-1.5 border border-slate-300 font-mono font-bold text-blue-700" dir="ltr">
                        {it.serial_number || it.serial || '---'}
                      </td>
                      <td className="p-1.5 border border-slate-300">
                        {it.warranty_agency || 'الوكيل المعتمد'} ({it.warranty_months || 12} شهر)
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Terms */}
            <div className="mb-4">
              <h4 className="font-black text-slate-900 mb-1">الشروط المالية وجدول السداد:</h4>
              <div className="grid grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-center font-bold">
                <div>
                  <span className="text-[10px] text-slate-500 block">إجمالي السعر كاش</span>
                  <span dir="ltr" className="font-mono">{Number(plan.total_cash_price).toLocaleString()} {currency}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">المقدم المسدد</span>
                  <span className="text-emerald-700 font-mono" dir="ltr">{Number(plan.down_payment).toLocaleString()} {currency}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">المبلغ المقسط الإجمالي</span>
                  <span className="text-blue-800 font-mono" dir="ltr">{Number(plan.total_installment_amount).toLocaleString()} {currency}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">القسط الشهري</span>
                  <span className="text-indigo-800 font-mono" dir="ltr">{Number(plan.monthly_amount).toLocaleString()} {currency}</span>
                </div>
              </div>
            </div>

            {/* Payment Schedule Table */}
            <div className="mb-4 avoid-break">
              <h4 className="font-black text-slate-900 mb-1.5 flex items-center justify-between text-xs">
                <span>جدول الأقساط الشهرية المستحقة ({plan.installments_count || paymentsList.length} قسط):</span>
                <span className="text-[10px] text-slate-500 font-normal">
                  قيمة القسط الشهري: <strong className="text-indigo-900 font-mono">{Number(plan.monthly_amount).toLocaleString()} {currency}</strong>
                </span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {paymentsList.map((pm) => (
                  <div key={pm.id || pm.installment_no} className="border border-slate-300 rounded-lg p-1.5 flex justify-between items-center text-[10px] bg-slate-50/70">
                    <span className="font-bold text-slate-800">
                      قسط #{pm.installment_no}: <span className="font-mono text-slate-600 font-semibold">{pm.due_date}</span>
                    </span>
                    <span className="font-black text-slate-900 font-mono" dir="ltr">
                      {Number(pm.amount_due).toLocaleString()} {currency}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Legal Acknowledgment & Promissory Note */}
            <div className="border border-slate-300 bg-slate-50/70 p-3 rounded-lg text-[10px] text-slate-700 leading-relaxed mb-6 avoid-break">
              <h5 className="font-black text-slate-900 text-xs mb-1">إقرار استلام وإيصال أمانة:</h5>
              <p>
                أقر أنا الموقع أدناه الطرف الثاني (المشتري) وبضمان الطرف الثالث المتضامن، بأنني استلمت الأجهزة الموضحة عالية بحالة المصنع الكاملة على سبيل الأمانة، وأتعهد بسداد الأقساط المحددة في مواعيدها المقررة دون تأخير. وإذا أخللت بسداد أي قسط في موعده، تصبح باقي الأقساط جميعها حالة الأداء فوراً، ويحق للطرف الأول اتخاذ كافة الإجراءات القانونية والمطالبة القضائية بإيصالات الأمانة والشيكات الموقعة مني والضامن، وهذا إقرار مني بذلك.
              </p>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-3 gap-4 text-center text-xs pt-2 avoid-break">
              <div>
                <p className="font-bold text-slate-800">توقيع المشتري</p>
                <div className="h-12 border-b border-dashed border-slate-400 mt-1"></div>
                <p className="text-[10px] text-slate-500 mt-1">{plan.customer_name}</p>
              </div>

              {plan.guarantor_name ? (
                <div>
                  <p className="font-bold text-slate-800">توقيع الضامن المتضامن</p>
                  <div className="h-12 border-b border-dashed border-slate-400 mt-1"></div>
                  <p className="text-[10px] text-slate-500 mt-1">{plan.guarantor_name}</p>
                </div>
              ) : (
                <div></div>
              )}

              <div>
                <p className="font-bold text-slate-800">ختم وتوقيع المعرض (البائع)</p>
                <div className="h-12 border-b border-dashed border-slate-400 mt-1 flex items-center justify-center">
                  <span className="text-[11px] font-bold text-slate-800 border border-slate-500 px-2 py-0.5 rounded">
                    {settings?.store_name}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
