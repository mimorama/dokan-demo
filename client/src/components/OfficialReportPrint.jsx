import React from 'react';
import { X, Printer, ShieldCheck, FileCheck, CheckCircle2 } from 'lucide-react';

export default function OfficialReportPrint({ reportType, reportData, startDate, endDate, settings, onClose }) {
  const currency = settings?.currency || 'ج.م';
  const storeName = settings?.store_name || 'معرض دكان عبد العزيز للأجهزة الكهربائية';
  const phone = settings?.phone || '01012345678 - 01187654321';
  const address = settings?.address || 'شارع الملك فيصل الرئيسي - الجيزة - جمهورية مصر العربية';
  const commercialReg = settings?.commercial_reg || '198425';
  const taxId = settings?.tax_id || '654-321-987';

  const todayStr = new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date());

  const docNo = `DOC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const getReportTitle = () => {
    switch (reportType) {
      case 'sales': return 'تقرير المبيعات والأرباح والتحصيل الرسمي المعتمد';
      case 'installments': return 'تقرير عقود التقسيط والتحصيل ومتابعة المتأخرات';
      case 'inventory': return 'تقرير جرد الأجهزة وتقييم المخزون الرأسمالي بالسيريال';
      case 'cashflow': return 'تقرير حركة الخزينة والسيولة والتدفقات النقدية';
      default: return 'تقرير إداري ومالي رسمي معتمد';
    }
  };

  // Harmonize data
  const getKPIs = () => {
    if (!reportData) return {};
    if (reportType === 'sales') {
      return {
        total_sales: reportData.summary?.totalRevenue ?? reportData.kpis?.total_sales ?? 0,
        total_paid: reportData.summary?.totalCollected ?? reportData.kpis?.total_paid ?? 0,
        net_profit: reportData.summary?.totalGrossProfit ?? reportData.kpis?.net_profit ?? 0,
        invoices_count: reportData.summary?.totalInvoices ?? reportData.kpis?.invoices_count ?? (reportData.rows?.length || 0)
      };
    }
    if (reportType === 'installments') {
      return {
        total_contract_value: (reportData.totals?.totalCollectedInPeriod || 0) + (reportData.totalOverdue?.totalLateBalance || 0),
        total_collected: reportData.totals?.totalCollectedInPeriod ?? reportData.kpis?.total_collected ?? 0,
        overdue_amount: reportData.totalOverdue?.totalLateBalance ?? reportData.kpis?.overdue_amount ?? 0,
        active_plans_count: reportData.totalOverdue?.lateCount ?? reportData.kpis?.active_plans_count ?? (reportData.overduePayments?.length || 0)
      };
    }
    if (reportType === 'inventory') {
      return {
        total_units: reportData.overallTotals?.totalDevicesInStock ?? reportData.kpis?.total_units ?? 0,
        total_cost_value: reportData.overallTotals?.totalCostValuation ?? reportData.kpis?.total_cost_value ?? 0,
        total_retail_value: reportData.overallTotals?.totalRetailValuation ?? reportData.kpis?.total_retail_value ?? 0,
        expected_profit: (reportData.overallTotals?.totalRetailValuation || 0) - (reportData.overallTotals?.totalCostValuation || 0)
      };
    }
    if (reportType === 'cashflow') {
      return {
        total_inflow: reportData.periodIn ?? reportData.kpis?.total_inflow ?? 0,
        total_expenses: reportData.periodOut ?? reportData.kpis?.total_expenses ?? 0,
        net_cashflow: reportData.netFlow ?? reportData.kpis?.net_cashflow ?? 0,
        current_cashbox_balance: reportData.currentBalance ?? reportData.kpis?.current_cashbox_balance ?? 0
      };
    }
    return reportData.kpis || {};
  };

  const getTableRows = () => {
    if (!reportData) return [];
    if (reportType === 'sales') return reportData.rows || reportData.items || [];
    if (reportType === 'installments') return reportData.overduePayments || reportData.collectedPayments || reportData.items || [];
    if (reportType === 'inventory') return reportData.productsInventory || reportData.items || [];
    if (reportType === 'cashflow') return reportData.ledger || reportData.items || [];
    return reportData.items || [];
  };

  const kpis = getKPIs();
  const rows = getTableRows();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* Container */}
      <div className="bg-slate-100 rounded-2xl shadow-2xl max-w-4xl w-full flex flex-col my-auto max-h-[96vh]">
        {/* Top Control Bar (Hidden when printed) */}
        <div className="no-print bg-slate-900 text-white p-4 rounded-t-2xl flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-sm">معاينة التقرير المالي المعتمد (طباعة رسمية A4)</h3>
              <p className="text-[11px] text-slate-300">مجهز وفقاً لأعلى معايير المحاسبة والطباعة الرسمية الصالحة كتقرير ورقي أو PDF</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>طباعة التقرير أو حفظ كـ PDF (A4)</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Document Body */}
        <div className="overflow-y-auto p-4 sm:p-8 flex justify-center bg-slate-200/50">
          <div 
            id="official-printable-area" 
            className="bg-white text-slate-900 w-[210mm] min-h-[297mm] p-[15mm] shadow-2xl border border-slate-300 relative font-['Cairo',sans-serif] text-xs flex flex-col justify-between"
            dir="rtl"
          >
            {/* Top Formal Letterhead Header */}
            <div>
              <div className="border-b-2 border-slate-900 pb-4 mb-5">
                <div className="flex items-center justify-between gap-4">
                  {/* Right: Company Info */}
                  <div className="text-right space-y-1 w-1/3">
                    <p className="text-[11px] font-bold text-slate-500">جمهورية مصر العربية</p>
                    <h1 className="text-lg font-black text-slate-900 leading-tight">{storeName}</h1>
                    <p className="text-[11px] font-bold text-amber-700">لتجارة وتوزيع الأجهزة الكهربائية والمنزلية</p>
                    <div className="text-[10px] text-slate-600 space-y-0.5 pt-1">
                      <p>س.ت: <span className="font-mono font-bold text-slate-800">{commercialReg}</span> | ب.ض: <span className="font-mono font-bold text-slate-800">{taxId}</span></p>
                      <p>هاتف الإدارة: <span className="font-mono font-bold" dir="ltr">{phone}</span></p>
                    </div>
                  </div>

                  {/* Center: Official Logo */}
                  <div className="flex flex-col items-center justify-center w-1/3 text-center">
                    <div className="w-20 h-20 rounded-2xl border-2 border-amber-600/30 p-2 shadow-sm flex items-center justify-center bg-slate-50 mb-1">
                      <img
                        src={settings?.logo_url || '/logo.svg'}
                        alt="شعار المعرض"
                        className="w-full h-full object-contain"
                        onError={(e) => { e.target.src = '/logo.svg'; }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 tracking-wider">وثيقة مالية رسمية معتمدة</span>
                  </div>

                  {/* Left: Document Metadata Box */}
                  <div className="w-1/3 flex justify-end">
                    <div className="border border-slate-400 rounded-lg p-2.5 bg-slate-50 text-[10px] space-y-1 w-52">
                      <div className="flex justify-between border-b border-slate-200 pb-1">
                        <span className="text-slate-500">رقم الوثيقة:</span>
                        <span className="font-mono font-bold text-blue-900">{docNo}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200 pb-1">
                        <span className="text-slate-500">تاريخ الإصدار:</span>
                        <span className="font-bold text-slate-800">{todayStr}</span>
                      </div>
                      {reportType !== 'inventory' && (
                        <>
                          <div className="flex justify-between border-b border-slate-200 pb-1">
                            <span className="text-slate-500">الفترة من:</span>
                            <span className="font-mono font-bold text-slate-800">{startDate}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">إلى تاريخ:</span>
                            <span className="font-mono font-bold text-slate-800">{endDate}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Document Title Banner */}
              <div className="bg-slate-900 text-white py-2 px-4 rounded-md text-center mb-5 flex items-center justify-between">
                <span className="text-[10px] text-amber-400 font-bold">★ الإدارة العامة للشؤون المالية والمحاسبية ★</span>
                <h2 className="text-sm font-black tracking-wide">{getReportTitle()}</h2>
                <span className="text-[10px] text-slate-300">نظام دكان عبد العزيز الذكي</span>
              </div>

              {/* Financial KPI Summary Cards (Official Grid) */}
              <div className="mb-5">
                <div className="text-[11px] font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>المؤشرات المالية الرئيسية:</span>
                </div>
                <div className="grid grid-cols-4 gap-2 border border-slate-400 rounded-lg p-2.5 bg-slate-50 text-center">
                  {reportType === 'sales' && (
                    <>
                      <div className="border-l border-slate-300 p-1">
                        <span className="text-[10px] text-slate-500 block">إجمالي المبيعات</span>
                        <span className="font-black text-sm text-slate-900 font-mono">
                          {Number(kpis.total_sales || 0).toLocaleString()} {currency}
                        </span>
                      </div>
                      <div className="border-l border-slate-300 p-1">
                        <span className="text-[10px] text-slate-500 block">المحصل نقداً ومقدمات</span>
                        <span className="font-black text-sm text-emerald-700 font-mono">
                          {Number(kpis.total_paid || 0).toLocaleString()} {currency}
                        </span>
                      </div>
                      <div className="border-l border-slate-300 p-1">
                        <span className="text-[10px] text-slate-500 block">مجمل الربح التجاري</span>
                        <span className="font-black text-sm text-blue-700 font-mono">
                          {Number(kpis.net_profit || 0).toLocaleString()} {currency}
                        </span>
                      </div>
                      <div className="p-1">
                        <span className="text-[10px] text-slate-500 block">عدد الفواتير</span>
                        <span className="font-black text-sm text-slate-800 font-mono">
                          {kpis.invoices_count || 0} فاتورة
                        </span>
                      </div>
                    </>
                  )}

                  {reportType === 'installments' && (
                    <>
                      <div className="border-l border-slate-300 p-1">
                        <span className="text-[10px] text-slate-500 block">إجمالي المحصل بالفترة</span>
                        <span className="font-black text-sm text-emerald-700 font-mono">
                          {Number(kpis.total_collected || 0).toLocaleString()} {currency}
                        </span>
                      </div>
                      <div className="border-l border-slate-300 p-1">
                        <span className="text-[10px] text-slate-500 block">إجمالي المتأخرات الحالية</span>
                        <span className="font-black text-sm text-rose-700 font-mono">
                          {Number(kpis.overdue_amount || 0).toLocaleString()} {currency}
                        </span>
                      </div>
                      <div className="border-l border-slate-300 p-1">
                        <span className="text-[10px] text-slate-500 block">عدد الأقساط المتأخرة</span>
                        <span className="font-black text-sm text-amber-700 font-mono">
                          {kpis.active_plans_count || 0} قسط
                        </span>
                      </div>
                      <div className="p-1">
                        <span className="text-[10px] text-slate-500 block">حالة التحصيل</span>
                        <span className="font-black text-sm text-emerald-800">
                          تحصيل دوري نشط
                        </span>
                      </div>
                    </>
                  )}

                  {reportType === 'inventory' && (
                    <>
                      <div className="border-l border-slate-300 p-1">
                        <span className="text-[10px] text-slate-500 block">إجمالي الأجهزة بالمخزن</span>
                        <span className="font-black text-sm text-blue-900 font-mono">
                          {kpis.total_units || 0} جهاز
                        </span>
                      </div>
                      <div className="border-l border-slate-300 p-1">
                        <span className="text-[10px] text-slate-500 block">رأس المال (سعر التكلفة)</span>
                        <span className="font-black text-sm text-slate-900 font-mono">
                          {Number(kpis.total_cost_value || 0).toLocaleString()} {currency}
                        </span>
                      </div>
                      <div className="border-l border-slate-300 p-1">
                        <span className="text-[10px] text-slate-500 block">القيمة البيعية المتوقعة</span>
                        <span className="font-black text-sm text-emerald-700 font-mono">
                          {Number(kpis.total_retail_value || 0).toLocaleString()} {currency}
                        </span>
                      </div>
                      <div className="p-1">
                        <span className="text-[10px] text-slate-500 block">الأرباح المتوقعة</span>
                        <span className="font-black text-sm text-amber-700 font-mono">
                          {Number(kpis.expected_profit || 0).toLocaleString()} {currency}
                        </span>
                      </div>
                    </>
                  )}

                  {reportType === 'cashflow' && (
                    <>
                      <div className="border-l border-slate-300 p-1">
                        <span className="text-[10px] text-slate-500 block">إجمالي الوارد بالفترة</span>
                        <span className="font-black text-sm text-emerald-700 font-mono">
                          +{Number(kpis.total_inflow || 0).toLocaleString()} {currency}
                        </span>
                      </div>
                      <div className="border-l border-slate-300 p-1">
                        <span className="text-[10px] text-slate-500 block">إجمالي المنصرف بالفترة</span>
                        <span className="font-black text-sm text-rose-700 font-mono">
                          -{Number(kpis.total_expenses || 0).toLocaleString()} {currency}
                        </span>
                      </div>
                      <div className="border-l border-slate-300 p-1">
                        <span className="text-[10px] text-slate-500 block">صافي التدفق النقدي</span>
                        <span className="font-black text-sm text-blue-800 font-mono">
                          {Number(kpis.net_cashflow || 0).toLocaleString()} {currency}
                        </span>
                      </div>
                      <div className="p-1">
                        <span className="text-[10px] text-slate-500 block">رصيد الخزينة الحالي</span>
                        <span className="font-black text-sm text-slate-900 font-mono">
                          {Number(kpis.current_cashbox_balance || 0).toLocaleString()} {currency}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Data Table: Formal Ledger Layout */}
              <div className="mb-6">
                <table className="w-full text-right text-[11px] border-collapse border border-slate-400">
                  <thead className="bg-slate-100 text-slate-800 font-bold border-b-2 border-slate-400">
                    {reportType === 'sales' && (
                      <tr>
                        <th className="border border-slate-400 p-2 text-center w-10">م</th>
                        <th className="border border-slate-400 p-2">رقم الفاتورة</th>
                        <th className="border border-slate-400 p-2">التاريخ</th>
                        <th className="border border-slate-400 p-2">العميل</th>
                        <th className="border border-slate-400 p-2">نوع البيع</th>
                        <th className="border border-slate-400 p-2 text-left">الإجمالي ({currency})</th>
                        <th className="border border-slate-400 p-2 text-left">المدفوع ({currency})</th>
                        <th className="border border-slate-400 p-2 text-left">الربح التقديري</th>
                      </tr>
                    )}

                    {reportType === 'installments' && (
                      <tr>
                        <th className="border border-slate-400 p-2 text-center w-10">م</th>
                        <th className="border border-slate-400 p-2">العميل</th>
                        <th className="border border-slate-400 p-2">الهاتف</th>
                        <th className="border border-slate-400 p-2 text-center">رقم القسط</th>
                        <th className="border border-slate-400 p-2">تاريخ الاستحقاق</th>
                        <th className="border border-slate-400 p-2 text-left">المبلغ المطلوب ({currency})</th>
                        <th className="border border-slate-400 p-2">الضامن</th>
                      </tr>
                    )}

                    {reportType === 'inventory' && (
                      <tr>
                        <th className="border border-slate-400 p-2 text-center w-10">م</th>
                        <th className="border border-slate-400 p-2">الجهاز والموديل</th>
                        <th className="border border-slate-400 p-2">الماركة والتصنيف</th>
                        <th className="border border-slate-400 p-2 text-center">المتاح بالمخزن</th>
                        <th className="border border-slate-400 p-2 text-left">سعر التكلفة</th>
                        <th className="border border-slate-400 p-2 text-left">سعر الكاش</th>
                        <th className="border border-slate-400 p-2 text-left">إجمالي التكلفة ({currency})</th>
                      </tr>
                    )}

                    {reportType === 'cashflow' && (
                      <tr>
                        <th className="border border-slate-400 p-2 text-center w-10">م</th>
                        <th className="border border-slate-400 p-2">التاريخ</th>
                        <th className="border border-slate-400 p-2">نوع الحركة</th>
                        <th className="border border-slate-400 p-2">التصنيف</th>
                        <th className="border border-slate-400 p-2">البيان والتفاصيل</th>
                        <th className="border border-slate-400 p-2 text-left">المبلغ ({currency})</th>
                      </tr>
                    )}
                  </thead>

                  <tbody className="divide-y divide-slate-300">
                    {rows && rows.length > 0 ? (
                      rows.slice(0, 20).map((row, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                          <td className="border border-slate-300 p-1.5 text-center font-bold text-slate-500">{idx + 1}</td>

                          {reportType === 'sales' && (
                            <>
                              <td className="border border-slate-300 p-1.5 font-mono font-bold text-blue-900">{row.invoice_no}</td>
                              <td className="border border-slate-300 p-1.5 font-mono">{row.created_at?.slice(0, 10)}</td>
                              <td className="border border-slate-300 p-1.5 font-bold text-slate-800">{row.customer_name || 'عميل نقدي'}</td>
                              <td className="border border-slate-300 p-1.5 font-bold">
                                {row.sale_type === 'cash' ? 'نقدي' : row.sale_type === 'installment' ? 'تقسيط' : 'تمويل استهلاكي'}
                              </td>
                              <td className="border border-slate-300 p-1.5 text-left font-mono font-bold">{Number(row.total || 0).toLocaleString()}</td>
                              <td className="border border-slate-300 p-1.5 text-left font-mono font-bold text-emerald-700">{Number(row.paid_amount || 0).toLocaleString()}</td>
                              <td className="border border-slate-300 p-1.5 text-left font-mono font-bold text-teal-700">+{Number(row.order_profit || 0).toLocaleString()}</td>
                            </>
                          )}

                          {reportType === 'installments' && (
                            <>
                              <td className="border border-slate-300 p-1.5 font-bold text-slate-800">{row.customer_name}</td>
                              <td className="border border-slate-300 p-1.5 font-mono" dir="ltr">{row.customer_phone || '-'}</td>
                              <td className="border border-slate-300 p-1.5 text-center font-bold">#{row.installment_no}</td>
                              <td className="border border-slate-300 p-1.5 font-mono text-rose-600 font-bold">{row.due_date}</td>
                              <td className="border border-slate-300 p-1.5 text-left font-mono font-bold text-rose-700">{Number(row.amount_late || row.amount_paid || 0).toLocaleString()}</td>
                              <td className="border border-slate-300 p-1.5 text-slate-600">{row.guarantor_name ? `${row.guarantor_name} (${row.guarantor_phone || ''})` : '---'}</td>
                            </>
                          )}

                          {reportType === 'inventory' && (
                            <>
                              <td className="border border-slate-300 p-1.5 font-bold text-slate-900">{row.name} {row.model_number && `(${row.model_number})`}</td>
                              <td className="border border-slate-300 p-1.5 text-slate-600">{row.brand_name || ''} - {row.category_name || ''}</td>
                              <td className="border border-slate-300 p-1.5 text-center font-bold font-mono text-blue-900">{row.in_stock || row.stock_quantity || 0}</td>
                              <td className="border border-slate-300 p-1.5 text-left font-mono">{Number(row.cost_price || 0).toLocaleString()}</td>
                              <td className="border border-slate-300 p-1.5 text-left font-mono font-bold">{Number(row.cash_price || 0).toLocaleString()}</td>
                              <td className="border border-slate-300 p-1.5 text-left font-mono font-black text-emerald-800">
                                {Number((row.in_stock || row.stock_quantity || 0) * (row.cost_price || 0)).toLocaleString()}
                              </td>
                            </>
                          )}

                          {reportType === 'cashflow' && (
                            <>
                              <td className="border border-slate-300 p-1.5 font-mono">{row.created_at?.slice(0, 16)}</td>
                              <td className="border border-slate-300 p-1.5 font-bold">
                                <span className={row.type === 'in' ? 'text-emerald-700' : 'text-rose-700'}>
                                  {row.type === 'in' ? 'وارد (+)' : 'منصرف (-)'}
                                </span>
                              </td>
                              <td className="border border-slate-300 p-1.5 font-bold text-slate-800">{row.category}</td>
                              <td className="border border-slate-300 p-1.5 text-slate-600">{row.description || '---'}</td>
                              <td className="border border-slate-300 p-1.5 text-left font-mono font-bold text-slate-900">
                                {Number(row.amount || 0).toLocaleString()}
                              </td>
                            </>
                          )}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="border border-slate-300 p-6 text-center text-slate-400 font-bold">
                          لا توجد سجلات مطابقة لهذه الفترة
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Certification, Signatures & Official Stamp */}
            <div className="border-t-2 border-slate-800 pt-4 mt-6">
              {/* Official Declaration */}
              <div className="bg-slate-50 border border-slate-300 rounded-md p-2.5 mb-6 text-[10px] text-slate-600 leading-relaxed text-justify">
                <p className="font-bold text-slate-800 mb-0.5">إقرار واعتماد مالي ورسمي:</p>
                نشهد نحن إدارة <strong>{storeName}</strong> بصحة ومطابقة البيانات المحاسبية والجردية والتدفقات النقدية الواردة أعلاه، ومطابقتها التامة مع الدفاتر والمستندات المخزنية ومحاضر الاستلام والتسليم خلال الفترة المحددة، وقد تم التدقيق والمراجعة بمعرفة قسم الحسابات العامة ورقابة المخازن.
              </div>

              {/* Signatures & Circular Seal Row */}
              <div className="grid grid-cols-3 gap-6 text-center items-end">
                {/* 1. Storekeeper / Cashier */}
                <div className="space-y-8">
                  <div>
                    <span className="font-bold text-slate-800 block text-xs">أمين الخزينة / المستودع</span>
                    <span className="text-[10px] text-slate-500">مسؤول الصندوق والحسابات</span>
                  </div>
                  <div className="border-b border-dashed border-slate-400 mx-6 pb-1">
                    <span className="text-[10px] text-slate-400 italic">التوقيع: .....................</span>
                  </div>
                </div>

                {/* 2. Official Circular Seal */}
                <div className="flex flex-col items-center justify-center">
                  <div className="w-28 h-28 rounded-full border-2 border-dashed border-amber-800/80 p-1 flex items-center justify-center relative rotate-[-6deg]">
                    <div className="w-full h-full rounded-full border border-amber-800/60 p-1 flex flex-col items-center justify-center text-center text-amber-900 bg-amber-50/40">
                      <span className="text-[8px] font-black uppercase tracking-widest">معتمد رسمياً</span>
                      <span className="text-[10px] font-black my-0.5">{storeName}</span>
                      <span className="text-[7px] font-bold">خاتم الإدارة والرقابة المالية</span>
                      <span className="text-[8px] font-mono font-bold mt-0.5">C.R: {commercialReg}</span>
                    </div>
                  </div>
                  <span className="text-[9px] text-slate-400 mt-1 font-bold">خاتم المعرض المعتمد</span>
                </div>

                {/* 3. General Manager / Financial Auditor */}
                <div className="space-y-8">
                  <div>
                    <span className="font-bold text-slate-800 block text-xs">المدير العام والمالي</span>
                    <span className="text-[10px] text-slate-500">الإدارة المالية العامة</span>
                  </div>
                  <div className="border-b border-dashed border-slate-400 mx-6 pb-1">
                    <span className="text-[10px] text-slate-400 italic">التوقيع: .....................</span>
                  </div>
                </div>
              </div>

              {/* Bottom Micro Footer */}
              <div className="mt-8 pt-2 border-t border-slate-200 flex justify-between items-center text-[9px] text-slate-400">
                <span>تم الطباعة آلياً عبر منظومة دكان عبد العزيز الذكية v2.5</span>
                <span>{address}</span>
                <span>صفحة 1 من 1</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
