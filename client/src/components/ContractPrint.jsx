import React from 'react';
import { Printer, X, FileText, CheckCircle2 } from 'lucide-react';

export default function ContractPrint({ plan, settings, onClose }) {
  if (!plan) return null;

  const handlePrint = () => {
    window.print();
  };

  const currency = settings?.currency || 'ج.م';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Controls */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between no-print">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-800">
              عقد بيع بالتقسيط وإيصال أمانة (رقم الفاتورة: {plan.invoice_no})
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer"
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
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100 flex justify-center">
          <div id="printable-area" className="w-[210mm] min-h-[297mm] p-10 bg-white text-slate-900 shadow-md text-xs leading-relaxed">
            {/* Header */}
            <div className="text-center border-b-2 border-slate-900 pb-3 mb-4">
              <img
                src={settings?.logo_url || '/logo.svg'}
                alt="دكان عبد العزيز"
                className="h-12 mx-auto mb-2 object-contain"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <h2 className="text-xl font-black">{settings?.store_name || 'معرض دكان عبد العزيز للأجهزة الكهربائية'}</h2>
              <p className="text-sm font-bold text-slate-700">عقد بيع بالتقسيط وإقرار استلام جهاز على سبيل الأمانة</p>
              <p className="text-[11px] text-slate-500 font-mono mt-1">رقم العقد: CNT-{plan.id} | تاريخ التعاقد: {plan.sale_date?.slice(0, 10) || plan.start_date}</p>
            </div>

            {/* Contract Parties */}
            <div className="space-y-2 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <p>
                <strong className="text-slate-900 font-black">الطرف الأول (البائع): </strong>
                {settings?.store_name} ومقره {settings?.address}، هاتف: {settings?.phone}.
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
                    <th className="p-1.5 border border-slate-300">#</th>
                    <th className="p-1.5 border border-slate-300">اسم الجهاز والموديل</th>
                    <th className="p-1.5 border border-slate-300">الرقم التسلسلي (Serial No)</th>
                    <th className="p-1.5 border border-slate-300">الوكيل والضمان</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.items?.map((it, idx) => (
                    <tr key={idx} className="text-center">
                      <td className="p-1.5 border border-slate-300">{idx + 1}</td>
                      <td className="p-1.5 border border-slate-300 font-bold text-right">{it.product_name}</td>
                      <td className="p-1.5 border border-slate-300 font-mono font-bold text-blue-700" dir="ltr">{it.serial_number || '---'}</td>
                      <td className="p-1.5 border border-slate-300">{it.warranty_agency || 'الوكيل المعتمد'} ({it.warranty_months} شهر)</td>
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
                  <span dir="ltr">{Number(plan.total_cash_price).toLocaleString()} {currency}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">المقدم المسدد</span>
                  <span className="text-emerald-700" dir="ltr">{Number(plan.down_payment).toLocaleString()} {currency}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">المبلغ المقسط الإجمالي</span>
                  <span className="text-blue-800" dir="ltr">{Number(plan.total_installment_amount).toLocaleString()} {currency}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">القسط الشهري</span>
                  <span className="text-indigo-800" dir="ltr">{Number(plan.monthly_amount).toLocaleString()} {currency}</span>
                </div>
              </div>
            </div>

            {/* Payment Schedule Table */}
            <div className="mb-4">
              <h4 className="font-black text-slate-900 mb-1">جدول الأقساط الشهرية المستحقة ({plan.installments_count} قسط):</h4>
              <div className="grid grid-cols-3 gap-1.5 max-h-56 overflow-hidden">
                {plan.payments?.map((pm) => (
                  <div key={pm.id} className="border border-slate-200 rounded p-1.5 flex justify-between items-center text-[10px]">
                    <span className="font-bold">قسط #{pm.installment_no}: {pm.due_date}</span>
                    <span className="font-extrabold text-slate-800" dir="ltr">{Number(pm.amount_due).toLocaleString()} {currency}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Legal Acknowledgment & Promissory Note */}
            <div className="border border-slate-300 bg-slate-50/70 p-3 rounded-lg text-[10px] text-slate-700 leading-relaxed mb-6">
              <h5 className="font-black text-slate-900 text-xs mb-1">إقرار استلام وإيصال أمانة:</h5>
              <p>
                أقر أنا الموقع أدناه الطرف الثاني (المشتري) وبضمان الطرف الثالث المتضامن، بأنني استلمت الأجهزة الموضحة عالية بحالة المصنع الكاملة على سبيل الأمانة، وأتعهد بسداد الأقساط المحددة في مواعيدها المقررة دون تأخير. وإذا أخللت بسداد أي قسط في موعده، تصبح باقي الأقساط جميعها حالة الأداء فوراً، ويحق للطرف الأول اتخاذ كافة الإجراءات القانونية والمطالبة القضائية بإيصالات الأمانة والشيكات الموقعة مني والضامن، وهذا إقرار مني بذلك.
              </p>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-3 gap-4 text-center text-xs pt-2">
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
