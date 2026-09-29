import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  PhoneCall, 
  MapPin, 
  Briefcase, 
  FileText, 
  CalendarClock, 
  Eye, 
  X,
  MessageCircle,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Edit,
  ShieldAlert,
  ShieldCheck
} from 'lucide-react';
import { api } from '../api';

export default function Customers({ settings }) {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [creditModalCustomer, setCreditModalCustomer] = useState(null);
  const [creditForm, setCreditForm] = useState({
    credit_score: 'A',
    max_credit_limit: 50000,
    is_blacklisted: false,
    blacklist_reason: ''
  });

  const handleOpenCreditModal = (cust) => {
    setCreditModalCustomer(cust);
    setCreditForm({
      credit_score: cust.credit_score || 'A',
      max_credit_limit: cust.max_credit_limit || 50000,
      is_blacklisted: Boolean(cust.is_blacklisted),
      blacklist_reason: cust.blacklist_reason || ''
    });
  };

  const handleSaveCreditStatus = async (e) => {
    e.preventDefault();
    try {
      await api.updateCustomerCredit(creditModalCustomer.id, creditForm);
      alert('تم تحديث التصنيف الائتماني والحد الأقصى للعميل بنجاح!');
      setCreditModalCustomer(null);
      loadCustomers();
    } catch (err) {
      alert(err.message || 'خطأ أثناء تحديث التصنيف الائتماني');
    }
  };

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    phone2: '',
    national_id: '',
    address: '',
    workplace: '',
    notes: '',
    guarantor_name: '',
    guarantor_phone: '',
    guarantor_national_id: '',
    guarantor_relation: 'أخ'
  });

  const [customerType, setCustomerType] = useState('installment');

  const currency = settings?.currency || 'ج.م';
  const storeName = settings?.store_name || 'معرض دكان عبد العزيز للأجهزة الكهربائية';

  useEffect(() => {
    loadCustomers();
  }, [search]);

  const loadCustomers = async () => {
    try {
      const data = await api.getCustomers(search ? `search=${search}` : '');
      setCustomers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCustomer = async (id) => {
    try {
      const cust = await api.getCustomer(id);
      setSelectedCustomer(cust);
    } catch (err) {
      alert(err.message || 'خطأ أثناء جلب بيانات العميل');
    }
  };

  const handleOpenWhatsApp = (cust, customMsg = null) => {
    let cleanPhone = (cust.phone || '').replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '20' + cleanPhone.slice(1);
    } else if (!cleanPhone.startsWith('20') && cleanPhone.length === 10) {
      cleanPhone = '20' + cleanPhone;
    }

    const defaultMsg = customMsg || 
      `مرحباً بك أ / *${cust.name}* في ${storeName} 🌟\nكيف يمكننا مساعدتك اليوم؟ يسعدنا دائماً تواصلكم معنا! ✨`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(defaultMsg)}`, '_blank');
  };

  const handleSendDebtReminderWhatsApp = (cust) => {
    let cleanPhone = (cust.phone || '').replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '20' + cleanPhone.slice(1);
    
    const msg = `🌟 *${storeName}* 🌟\n` +
      `تحية طيبة أ / *${cust.name}* المحترم 💐\n\n` +
      `نحيط سيادتكم علماً ببيان حساب الأقساط المسجلة لديكم:\n` +
      `💰 *المتبقي المستحق:* *${Number(cust.total_debt).toLocaleString()} ${currency}*\n\n` +
      `يرجى التكرم بالسداد في الموعد المحدد بالمعرض أو عبر إنستاباي/فودافون كاش.\n` +
      `📞 للاستفسار وخدمة العملاء: ${settings?.phone || '01023456789'}`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    try {
      await api.createCustomer({
        name: formData.name,
        phone: formData.phone,
        phone2: formData.phone2,
        national_id: formData.national_id,
        address: formData.address,
        workplace: formData.workplace,
        notes: formData.notes,
        guarantor: formData.guarantor_name ? {
          name: formData.guarantor_name,
          phone: formData.guarantor_phone,
          national_id: formData.guarantor_national_id,
          relation: formData.guarantor_relation
        } : null
      });
      setShowAddModal(false);
      resetForm();
      loadCustomers();
    } catch (err) {
      alert(err.message || 'خطأ أثناء إضافة العميل');
    }
  };

  const handleUpdateCustomer = async (e) => {
    e.preventDefault();
    try {
      await api.updateCustomer(editingCustomer.id, {
        name: formData.name,
        phone: formData.phone,
        phone2: formData.phone2,
        national_id: formData.national_id,
        address: formData.address,
        workplace: formData.workplace,
        notes: formData.notes,
        guarantor: formData.guarantor_name ? {
          name: formData.guarantor_name,
          phone: formData.guarantor_phone,
          national_id: formData.guarantor_national_id,
          relation: formData.guarantor_relation
        } : null
      });
      setEditingCustomer(null);
      resetForm();
      loadCustomers();
    } catch (err) {
      alert(err.message || 'خطأ أثناء تعديل بيانات العميل');
    }
  };

  const handleDeleteCustomer = async (id, name) => {
    if (!window.confirm(`هل أنت متأكد من حذف العميل "${name}" نهائياً من النظام؟`)) return;
    try {
      await api.deleteCustomer(id);
      loadCustomers();
    } catch (err) {
      alert(err.message || 'خطأ أثناء حذف العميل');
    }
  };

  const openEditModal = (cust) => {
    setEditingCustomer(cust);
    setCustomerType(cust.national_id || cust.address ? 'installment' : 'cash');
    setFormData({
      name: cust.name,
      phone: cust.phone,
      phone2: cust.phone2 || '',
      national_id: cust.national_id || '',
      address: cust.address || '',
      workplace: cust.workplace || '',
      notes: cust.notes || '',
      guarantor_name: '',
      guarantor_phone: '',
      guarantor_national_id: '',
      guarantor_relation: 'أخ'
    });
  };

  const resetForm = () => {
    setCustomerType('installment');
    setFormData({
      name: '', phone: '', phone2: '', national_id: '', address: '', workplace: '', notes: '',
      guarantor_name: '', guarantor_phone: '', guarantor_national_id: '', guarantor_relation: 'أخ'
    });
  };

  // KPIs
  const totalCustomers = customers.length;
  const customersWithDebt = customers.filter(c => Number(c.total_debt) > 0).length;
  const totalDebtSum = customers.reduce((sum, c) => sum + (Number(c.total_debt) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            سجل العملاء وإدارة العلاقات والضامنين
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            بيانات المشترين، الأرقام القومية، التواصل المباشر عبر واتساب، وسجلات المشتريات والمديونيات
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="بحث بالاسم، الهاتف، أو الرقم القومي..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
            />
          </div>

          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة عميل جديد</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold block">إجمالي العملاء المسجلين</span>
            <span className="text-lg font-black text-slate-800">{totalCustomers} عميل</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <CalendarClock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold block">عملاء لديهم عقود تقسيط جارية</span>
            <span className="text-lg font-black text-amber-700">{customersWithDebt} عميل</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold block">إجمالي المديونيات المستحقة للمعرض</span>
            <span className="text-lg font-black text-rose-600" dir="ltr">{totalDebtSum.toLocaleString()} {currency}</span>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold">
                <th className="py-3 px-4">اسم العميل</th>
                <th className="py-3 px-4">رقم الموبايل</th>
                <th className="py-3 px-4">الرقم القومي</th>
                <th className="py-3 px-4">التصنيف الائتماني</th>
                <th className="py-3 px-4">الفواتير</th>
                <th className="py-3 px-4">عقود التقسيط</th>
                <th className="py-3 px-4">المتبقي (مديونية)</th>
                <th className="py-3 px-4 text-center">إجراءات سريعة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900 text-sm block">{c.name}</span>
                    {c.workplace && <span className="text-[10px] text-slate-400">{c.workplace}</span>}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-700" dir="ltr">{c.phone}</td>
                  <td className="py-3 px-4 font-mono text-slate-600" dir="ltr">{c.national_id || '---'}</td>
                  <td className="py-3 px-4">
                    {c.is_blacklisted ? (
                      <div>
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-black text-[10px] inline-flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" />
                          محظور (قائمة سوداء)
                        </span>
                        {c.blacklist_reason && (
                          <span className="text-[9px] text-rose-600 block mt-0.5 truncate max-w-[120px]">{c.blacklist_reason}</span>
                        )}
                      </div>
                    ) : (
                      <div>
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          c.credit_score === 'A' ? 'bg-emerald-100 text-emerald-800' :
                          c.credit_score === 'B' ? 'bg-blue-100 text-blue-800' :
                          c.credit_score === 'C' ? 'bg-amber-100 text-amber-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          تصنيف {c.credit_score || 'A'}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                          حد: {Number(c.max_credit_limit || 50000).toLocaleString()} {currency}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 font-bold text-blue-700">{c.sales_count} فواتير</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      c.active_plans_count > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {c.active_plans_count} عقد جاري
                    </span>
                  </td>
                  <td className="py-3 px-4 font-black text-rose-600 text-sm" dir="ltr">
                    {Number(c.total_debt).toLocaleString()} {currency}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-1.5">
                      {/* WhatsApp Button */}
                      <button
                        onClick={() => handleOpenWhatsApp(c)}
                        title="مراسلة العميل عبر واتساب"
                        className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold transition-colors cursor-pointer"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>

                      {/* Reminder Button if debt */}
                      {Number(c.total_debt) > 0 && (
                        <button
                          onClick={() => handleSendDebtReminderWhatsApp(c)}
                          title="إرسال تذكير بموعد القسط وقيمة المديونية عبر واتساب"
                          className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold transition-colors cursor-pointer"
                        >
                          <CalendarClock className="w-4 h-4" />
                        </button>
                      )}

                      {/* Credit Rating Management Button */}
                      <button
                        onClick={() => handleOpenCreditModal(c)}
                        title="تعديل التصنيف الائتماني وسقف التقسيط والحظر"
                        className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold transition-colors cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4" />
                      </button>

                      {/* View Statement */}
                      <button
                        onClick={() => handleOpenCustomer(c.id)}
                        title="عرض كشف حساب العميل وسجل المشتريات"
                        className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold transition-colors cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => openEditModal(c)}
                        title="تعديل بيانات العميل"
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition-colors cursor-pointer"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteCustomer(c.id, c.name)}
                        title="حذف العميل"
                        className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Full Statement Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden text-xs">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-base text-slate-800">{selectedCustomer.name}</h3>
                  <button
                    onClick={() => handleOpenWhatsApp(selectedCustomer)}
                    className="flex items-center gap-1 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg hover:bg-emerald-700 cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>مراسلة واتساب</span>
                  </button>
                </div>
                <p className="text-slate-500 mt-0.5">
                  هاتف: <span className="font-mono" dir="ltr">{selectedCustomer.phone}</span> {selectedCustomer.phone2 && `| ${selectedCustomer.phone2}`} | رقم قومي: <span className="font-mono">{selectedCustomer.national_id || '-'}</span>
                </p>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Guarantors */}
              <div>
                <h4 className="font-bold text-slate-800 mb-2">بيانات الضامنون:</h4>
                {selectedCustomer.guarantors?.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {selectedCustomer.guarantors.map((g) => (
                      <div key={g.id} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <p className="font-bold text-slate-800">{g.name} ({g.relation})</p>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5" dir="ltr">هاتف: {g.phone}</p>
                        <p className="text-[10px] text-slate-400 font-mono" dir="ltr">ق.ق: {g.national_id}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400">لا يوجد ضامن مسجل</p>
                )}
              </div>

              {/* Installment Plans */}
              <div>
                <h4 className="font-bold text-slate-800 mb-2">عقود التقسيط وجدول السداد:</h4>
                {selectedCustomer.installment_plans?.length === 0 ? (
                  <p className="text-slate-400">لا توجد عقود تقسيط مسجلة</p>
                ) : (
                  selectedCustomer.installment_plans?.map((plan) => (
                    <div key={plan.id} className="border border-slate-200 rounded-xl p-3 mb-2 bg-slate-50">
                      <div className="flex justify-between items-center mb-2 font-bold">
                        <span className="text-blue-700">عقد #{plan.id} (قسط شهري: {Number(plan.monthly_amount).toLocaleString()} {currency})</span>
                        <span className="text-rose-600">المتبقي: {Number(plan.remaining_balance).toLocaleString()} {currency}</span>
                      </div>

                      <div className="grid grid-cols-3 gap-1 text-[11px]">
                        {plan.payments?.map((pm) => (
                          <div key={pm.id} className={`p-1.5 rounded border ${pm.status === 'paid' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-white border-slate-200 text-slate-700'}`}>
                            <span className="font-bold">قسط #{pm.installment_no}: </span>
                            <span>{pm.amount_due} {currency} ({pm.status === 'paid' ? 'مسدد' : pm.due_date})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Purchase History */}
              <div>
                <h4 className="font-bold text-slate-800 mb-2">سجل الفواتير والمشتريات السابقة:</h4>
                {selectedCustomer.sales?.length === 0 ? (
                  <p className="text-slate-400">لا توجد فواتير سابقة</p>
                ) : (
                  <div className="space-y-1.5">
                    {selectedCustomer.sales?.map((s) => (
                      <div key={s.id} className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
                        <div>
                          <span className="font-mono font-bold text-blue-700">{s.invoice_no}</span>
                          <span className="text-[11px] text-slate-500 mr-2">{new Date(s.created_at).toLocaleDateString('ar-EG')}</span>
                          <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-bold mr-2">
                            {s.sale_type === 'finance_company' ? 'تقسيط ممول' : s.sale_type === 'installment' ? 'تقسيط مباشر' : 'كاش'}
                          </span>
                        </div>
                        <span className="font-black text-slate-900" dir="ltr">{Number(s.total).toLocaleString()} {currency}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      {(showAddModal || editingCustomer) && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 text-xs">
            <h3 className="font-bold text-base text-slate-800 mb-4">
              {editingCustomer ? 'تعديل بيانات العميل' : 'تسجيل عميل جديد'}
            </h3>
            {/* Customer Type Selector */}
            <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold text-center mb-3">
              <button
                type="button"
                onClick={() => setCustomerType('installment')}
                className={`py-2 rounded-lg transition-all cursor-pointer ${
                  customerType === 'installment'
                    ? 'bg-white text-amber-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📑 عميل تقسيط مباشر
              </button>
              <button
                type="button"
                onClick={() => setCustomerType('cash')}
                className={`py-2 rounded-lg transition-all cursor-pointer ${
                  customerType === 'cash'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                💵 عميل كاش / شركات تمويل
              </button>
            </div>

            <form onSubmit={editingCustomer ? handleUpdateCustomer : handleSaveCustomer} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="اسم العميل *"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                />
                <input
                  type="text"
                  required
                  placeholder="رقم الموبايل الأول *"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono"
                  dir="ltr"
                />
              </div>

              {customerType !== 'installment' ? (
                <div>
                  <input
                    type="text"
                    placeholder="رقم هاتف إضافي (اختياري)"
                    value={formData.phone2}
                    onChange={(e) => setFormData({ ...formData, phone2: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono"
                    dir="ltr"
                  />
                  <p className="text-[10.5px] text-slate-400 mt-1">
                    ✓ عميل كاش أو شركات وبنوك: لا يتطلب تسجيل الرقم القومي أو العنوان أو بيانات الضامن.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="رقم هاتف إضافي (اختياري)"
                      value={formData.phone2}
                      onChange={(e) => setFormData({ ...formData, phone2: e.target.value })}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono"
                      dir="ltr"
                    />
                    <input
                      type="text"
                      placeholder="الرقم القومي (14 رقم) *"
                      value={formData.national_id}
                      onChange={(e) => setFormData({ ...formData, national_id: e.target.value })}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono"
                      dir="ltr"
                    />
                  </div>

                  <input
                    type="text"
                    placeholder="العنوان بالتفصيل *"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />

                  <input
                    type="text"
                    placeholder="جهة العمل / الوظيفة"
                    value={formData.workplace}
                    onChange={(e) => setFormData({ ...formData, workplace: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />

                  {/* Guarantor Info */}
                  <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-200 space-y-2">
                    <h5 className="font-bold text-blue-900">بيانات الضامن (اختياري)</h5>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="اسم الضامن"
                        value={formData.guarantor_name}
                        onChange={(e) => setFormData({ ...formData, guarantor_name: e.target.value })}
                        className="bg-white border border-blue-200 rounded-lg px-2.5 py-1.5"
                      />
                      <input
                        type="text"
                        placeholder="هاتف الضامن"
                        value={formData.guarantor_phone}
                        onChange={(e) => setFormData({ ...formData, guarantor_phone: e.target.value })}
                        className="bg-white border border-blue-200 rounded-lg px-2.5 py-1.5 font-mono"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingCustomer(null);
                  }}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
                >
                  {editingCustomer ? 'تحديث البيانات' : 'حفظ العميل'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Credit Rating & Risk Management Modal */}
      {creditModalCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 text-slate-800 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">إدارة التصنيف الائتماني والمخاطر</h3>
                  <p className="text-[11px] text-slate-500">{creditModalCustomer.name}</p>
                </div>
              </div>
              <button
                onClick={() => setCreditModalCustomer(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCreditStatus} className="space-y-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">درجة التصنيف الائتماني (Credit Score):</label>
                <select
                  value={creditForm.credit_score}
                  onChange={(e) => setCreditForm({ ...creditForm, credit_score: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                >
                  <option value="A">فئة A (عميل ممتاز - سداد فوري بدون تأخير)</option>
                  <option value="B">فئة B (عميل جيد - سداد منتظم)</option>
                  <option value="C">فئة C (عميل متوسط - تأخير طفيف مع متابعة)</option>
                  <option value="D">فئة D (عميل عالي المخاطر - يتطلب موافقة إدارة)</option>
                  <option value="Blacklisted">قائمة سوداء (محظور من التقسيط)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">الحد الائتماني الأقصى للتقسيط ({currency}):</label>
                <input
                  type="number"
                  value={creditForm.max_credit_limit}
                  onChange={(e) => setCreditForm({ ...creditForm, max_credit_limit: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-xs"
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  أقصى إجمالي مديونية مسموح بها لهذا العميل في نفس الوقت
                </span>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={creditForm.is_blacklisted}
                    onChange={(e) => setCreditForm({ ...creditForm, is_blacklisted: e.target.checked })}
                    className="w-4 h-4 text-rose-600 rounded cursor-pointer"
                  />
                  <span className="font-extrabold text-rose-700">إدراج العميل في القائمة السوداء (Blacklist)</span>
                </label>

                {creditForm.is_blacklisted && (
                  <div>
                    <label className="block text-rose-800 font-bold mb-1 text-[11px]">سبب الحظر أو التعثر:</label>
                    <textarea
                      rows={2}
                      placeholder="اذكر سبب إدراج العميل بالقائمة السوداء..."
                      value={creditForm.blacklist_reason}
                      onChange={(e) => setCreditForm({ ...creditForm, blacklist_reason: e.target.value })}
                      className="w-full bg-white border border-rose-300 rounded-xl p-2 text-xs focus:ring-1 focus:ring-rose-500"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setCreditModalCustomer(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
