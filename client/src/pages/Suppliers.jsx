import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Plus, 
  Search, 
  PhoneCall, 
  MapPin, 
  Building2, 
  Check, 
  X, 
  Edit2, 
  Trash2, 
  AlertCircle,
  FileSpreadsheet,
  FileDown,
  FileUp,
  Download,
  Upload,
  Info,
  CheckCircle,
  DollarSign,
  Wallet,
  Printer,
  FileText,
  Calendar,
  Building,
  Clock,
  RefreshCw
} from 'lucide-react';
import { api } from '../api';
import { exportToExcel, readExcelFile, downloadSuppliersTemplate } from '../utils/excel';

export default function Suppliers({ settings }) {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);

  // Supplier Payment Modal (Requirements 6 & 14)
  const [paySupplierModal, setPaySupplierModal] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payType, setPayType] = useState('partial'); // 'partial' or 'full'
  const [payMethod, setPayMethod] = useState('cash'); // 'cash' or 'bank'
  const [payNotes, setPayNotes] = useState('');
  const [isSubmittingPay, setIsSubmittingPay] = useState(false);

  // Bank & Check Payment States (Requirement 14)
  const [bankChannel, setBankChannel] = useState('check'); // 'check' or 'transfer'
  const [selectedBankName, setSelectedBankName] = useState('البنك الأهلي المصري');
  const [checkNumber, setCheckNumber] = useState('');
  const [checkDueDate, setCheckDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [recipientName, setRecipientName] = useState('');
  const [recipientNationalId, setRecipientNationalId] = useState('');

  // Check Handover Receipt Modal State (Requirement 14)
  const [showCheckReceiptModal, setShowCheckReceiptModal] = useState(false);
  const [checkReceiptData, setCheckReceiptData] = useState(null);

  // Supplier Statement of Account State (Requirement 7)
  const [statementSupplier, setStatementSupplier] = useState(null);
  const [statementData, setStatementData] = useState(null);
  const [statementLoading, setStatementLoading] = useState(false);
  const [statementFromDate, setStatementFromDate] = useState('');
  const [statementToDate, setStatementToDate] = useState('');

  // Excel Import/Export State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importRows, setImportRows] = useState([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState('');
  const [importFileName, setImportFileName] = useState('');
  const [importSuccessMsg, setImportSuccessMsg] = useState('');

  // Bank Accounts for payment (Requirement 14)
  const [bankAccounts, setBankAccounts] = useState([]);
  const [selectedBankAccountId, setSelectedBankAccountId] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    company: '',
    phone: '',
    phone2: '',
    address: '',
    balance: 0,
    notes: ''
  });

  const currency = settings?.currency || 'ج.م';
  const storeName = settings?.store_name || 'معرض دكان عبد العزيز للأجهزة الكهربائية';

  useEffect(() => {
    loadSuppliers();
    loadBankAccounts();
  }, []);

  const loadSuppliers = async () => {
    try {
      const data = await api.getSuppliers();
      setSuppliers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadBankAccounts = async () => {
    try {
      const data = await api.getAccounts();
      const list = data?.accounts || (Array.isArray(data) ? data : []);
      // Filter out merchants like valu/contact if we want, or keep all active
      setBankAccounts(list);
      if (list.length > 0) {
        setSelectedBankAccountId(list[0].id);
        setSelectedBankName(list[0].bank_name || list[0].name);
      }
    } catch (err) {
      console.error('Failed to load bank accounts', err);
    }
  };

  const handleOpenPayModal = (s) => {
    setPaySupplierModal(s);
    setPayType('partial');
    setPayAmount('');
    setPayMethod('cash');
    setPayNotes('');
    setBankChannel('check');
    if (bankAccounts.length > 0) {
      setSelectedBankAccountId(bankAccounts[0].id);
      setSelectedBankName(bankAccounts[0].bank_name || bankAccounts[0].name);
    } else {
      setSelectedBankName('البنك الأهلي المصري');
    }
    setCheckNumber('');
    setCheckDueDate(new Date().toISOString().slice(0, 10));
    setRecipientName(s.name || '');
    setRecipientNationalId('');
  };

  const handlePayTypeChange = (type) => {
    setPayType(type);
    if (type === 'full') {
      setPayAmount(Math.max(0, Number(paySupplierModal?.balance || 0)));
    } else {
      setPayAmount('');
    }
  };

  const handleConfirmSupplierPayment = async (e) => {
    e.preventDefault();
    if (!paySupplierModal) return;
    const amountVal = Number(payAmount);
    if (!amountVal || amountVal <= 0) {
      alert('الرجاء إدخال مبلغ سداد صحيح أكبر من الصفر');
      return;
    }

    if (payMethod === 'bank' && bankChannel === 'check' && !checkNumber.trim()) {
      alert('يرجى إدخال رقم الشيك البنكي');
      return;
    }

    setIsSubmittingPay(true);
    try {
      const payload = {
        amount: amountVal,
        payment_type: payType,
        payment_method: payMethod,
        bank_account_id: payMethod === 'bank' && selectedBankAccountId ? Number(selectedBankAccountId) : null,
        notes: payNotes || (payType === 'full' ? 'سداد كامل المديونية' : 'دفعة من تحت الحساب'),
        check_number: (payMethod === 'bank' && bankChannel === 'check') ? checkNumber.trim() : null,
        check_due_date: (payMethod === 'bank' && bankChannel === 'check') ? checkDueDate : null,
        bank_name: payMethod === 'bank' ? selectedBankName : null,
        recipient_name: (payMethod === 'bank' && bankChannel === 'check') ? recipientName.trim() : null,
        recipient_national_id: (payMethod === 'bank' && bankChannel === 'check') ? recipientNationalId.trim() : null
      };

      const res = await api.paySupplier(paySupplierModal.id, payload);

      // If paid via bank check, open printable handover receipt
      if (payMethod === 'bank' && bankChannel === 'check') {
        setCheckReceiptData({
          receiptNo: res.payment?.receipt_no || `CHK-REC-${Date.now().toString().slice(-6)}`,
          supplierName: paySupplierModal.name,
          supplierCompany: paySupplierModal.company || '',
          amount: amountVal,
          bankName: selectedBankName,
          checkNumber: checkNumber.trim(),
          checkDueDate: checkDueDate,
          recipientName: recipientName.trim() || paySupplierModal.name,
          recipientNationalId: recipientNationalId.trim() || '---',
          paymentDate: new Date().toLocaleDateString('ar-EG', { timeZone: 'Africa/Cairo' }),
          notes: payNotes
        });
        setShowCheckReceiptModal(true);
      } else {
        alert(res.message || 'تم تسجيل سداد المورد بنجاح وتحديث الرصيد والخزينة!');
      }

      setPaySupplierModal(null);
      loadSuppliers();
    } catch (err) {
      alert(err.message || 'خطأ أثناء تسجيل سداد المورد');
    } finally {
      setIsSubmittingPay(false);
    }
  };

  // Supplier Statement Handler (Requirement 7)
  const handleOpenStatementModal = async (s) => {
    setStatementSupplier(s);
    setStatementFromDate('');
    setStatementToDate('');
    await fetchSupplierStatement(s.id, '', '');
  };

  const fetchSupplierStatement = async (supplierId, from, to) => {
    setStatementLoading(true);
    try {
      const q = new URLSearchParams();
      if (from) q.append('from_date', from);
      if (to) q.append('to_date', to);
      const data = await api.getSupplierStatement(supplierId, q.toString());
      setStatementData(data);
    } catch (err) {
      alert('خطأ أثناء تحميل كشف حساب المورد');
    } finally {
      setStatementLoading(false);
    }
  };

  const handleApplyStatementFilter = (e) => {
    e.preventDefault();
    if (!statementSupplier) return;
    fetchSupplierStatement(statementSupplier.id, statementFromDate, statementToDate);
  };

  // Export current suppliers to Excel
  const handleExportExcel = () => {
    try {
      if (!suppliers || suppliers.length === 0) {
        alert('لا يوجد موردين متاحين للتصدير حالياً');
        return;
      }
      const dataToExport = suppliers.map(s => ({
        'اسم المورد / المسؤول': s.name || '',
        'اسم الشركة الموزعة': s.company || '',
        'رقم الهاتف': s.phone || '',
        'رقم هاتف إضافي': s.phone2 || '',
        'العنوان / المقر': s.address || '',
        'الرصيد المالي الحالي': Number(s.balance) || 0,
        'ملاحظات': s.notes || ''
      }));

      exportToExcel({
        data: dataToExport,
        filename: `قائمة_الموردين_والشركات_دكان_عبدالعزيز_${new Date().toISOString().slice(0, 10)}`,
        sheetName: 'الموردين'
      });
    } catch (err) {
      alert(err.message || 'خطأ أثناء تصدير ملف Excel');
    }
  };

  // Read uploaded Excel file
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError('');
    setImportSuccessMsg('');
    setImportFileName(file.name);
    try {
      setImportLoading(true);
      const rows = await readExcelFile(file);
      if (!rows || rows.length === 0) {
        throw new Error('الملف فارغ أو لا يحتوي على صفوف صالحة');
      }
      setImportRows(rows);
    } catch (err) {
      setImportError(err.message || 'فشل قراءة ملف Excel');
      setImportRows([]);
    } finally {
      setImportLoading(false);
      e.target.value = '';
    }
  };

  // Confirm import and send to server
  const handleConfirmImport = async () => {
    if (!importRows || importRows.length === 0) {
      alert('الرجاء اختيار ملف Excel يحتوي على بيانات أولاً');
      return;
    }
    try {
      setImportLoading(true);
      setImportError('');
      const res = await api.bulkImportSuppliers(importRows);
      setImportSuccessMsg(res.message || `تم استيراد ${res.count} مورد بنجاح`);
      setTimeout(() => {
        setShowImportModal(false);
        setImportRows([]);
        setImportFileName('');
        setImportSuccessMsg('');
        loadSuppliers();
      }, 1500);
    } catch (err) {
      setImportError(err.message || 'خطأ أثناء استيراد البيانات إلى النظام');
    } finally {
      setImportLoading(false);
    }
  };

  const handleSaveSupplier = async (e) => {
    e.preventDefault();
    try {
      await api.createSupplier(formData);
      setShowAddModal(false);
      setFormData({ name: '', company: '', phone: '', phone2: '', address: '', balance: 0, notes: '' });
      loadSuppliers();
    } catch (err) {
      alert(err.message || 'خطأ أثناء حفظ المورد');
    }
  };

  const handleUpdateSupplier = async (e) => {
    e.preventDefault();
    if (!editingSupplier) return;
    try {
      await api.updateSupplier(editingSupplier.id, editingSupplier);
      setEditingSupplier(null);
      loadSuppliers();
    } catch (err) {
      alert(err.message || 'خطأ أثناء تعديل بيانات المورد');
    }
  };

  const handleDeleteSupplier = async (s) => {
    if (!window.confirm(`هل أنت متأكد من حذف المورد "${s.name}" (${s.company || 'بدون شركة'})؟`)) return;
    try {
      await api.deleteSupplier(s.id);
      loadSuppliers();
    } catch (err) {
      alert(err.message || 'خطأ أثناء حذف المورد');
    }
  };

  const filteredSuppliers = suppliers.filter(s => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      s.name?.toLowerCase().includes(term) ||
      s.company?.toLowerCase().includes(term) ||
      s.phone?.includes(term) ||
      s.phone2?.includes(term) ||
      s.address?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Truck className="w-6 h-6 text-blue-600" />
            الموردين والشركات الموزعة
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            سجل وكلاء وموزعي الأجهزة (مجموعة العربي، راية، فريش، كريازي، بيكو) وأرصدة الحسابات
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="بحث بالاسم، الشركة، الهاتف..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2 text-xs font-medium w-52 sm:w-60 focus:outline-blue-500"
            />
          </div>

          {/* Export Excel Button */}
          <button
            type="button"
            onClick={handleExportExcel}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 active:scale-98 whitespace-nowrap"
            title="تصدير جميع الموردين الحاليين إلى ملف Excel"
          >
            <FileDown className="w-4 h-4 text-emerald-100" />
            <span>تصدير Excel</span>
          </button>

          {/* Import Excel Button */}
          <button
            type="button"
            onClick={() => {
              setImportRows([]);
              setImportError('');
              setImportSuccessMsg('');
              setImportFileName('');
              setShowImportModal(true);
            }}
            className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 active:scale-98 whitespace-nowrap"
            title="استيراد موردين وشركات من ملف Excel"
          >
            <FileUp className="w-4 h-4 text-teal-100" />
            <span>استيراد Excel</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة مورد / شركة</span>
          </button>
        </div>
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSuppliers.map((s) => (
          <div key={s.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">{s.name}</h3>
                  {s.company && <p className="text-xs text-blue-600 font-semibold">{s.company}</p>}
                </div>
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <PhoneCall className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-mono font-bold" dir="ltr">{s.phone} {s.phone2 && `| ${s.phone2}`}</span>
                </div>
                {s.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{s.address}</span>
                  </div>
                )}
                {s.notes && (
                  <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-lg">{s.notes}</p>
                )}
              </div>
            </div>

            <div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs mb-3">
                <span className="text-slate-500 font-bold">رصيد المورد:</span>
                <span className="font-black text-slate-900 text-sm" dir="ltr">
                  {Number(s.balance).toLocaleString()} {currency}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleOpenStatementModal(s)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold transition cursor-pointer"
                  title="عرض كشف حساب تفصيلي بجميع المشتريات والتوريدات والمدفوعات"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>كشف حساب</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenPayModal(s)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold transition cursor-pointer"
                  title="سداد دفعة من تحت الحساب أو كامل المديونية"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>سداد</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingSupplier({ ...s })}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold transition cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>تعديل</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteSupplier(s)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>حذف</span>
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredSuppliers.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs">
            لا توجد نتائج مطابقة لبحثك
          </div>
        )}
      </div>

      {/* Add Supplier Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 text-xs text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600" />
                إضافة مورد أو شركة توزيع جديدة
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="space-y-3">
              <div>
                <label className="block text-slate-600 font-bold mb-1">اسم المورد أو المسؤول *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: م. أحمد عبد العزيز / مسؤول مبيعات العربي"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">اسم الشركة أو التوكيل الموزع</label>
                <input
                  type="text"
                  placeholder="مثال: مجموعة العربي / راية للتوزيع / بيكو مصر"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">رقم الهاتف الأساسي *</label>
                  <input
                    type="text"
                    required
                    placeholder="010xxxxxxxx"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">هاتف إضافي / واتساب</label>
                  <input
                    type="text"
                    placeholder="011xxxxxxxx"
                    value={formData.phone2}
                    onChange={(e) => setFormData({ ...formData, phone2: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">العنوان ومقر الشركة</label>
                <input
                  type="text"
                  placeholder="مثال: مدينة نصر - القاهرة"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">الرصيد الافتتاحي (مديونية للمورد)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={formData.balance}
                  onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">ملاحظات والتصنيفات الموردة</label>
                <textarea
                  rows="2"
                  placeholder="مثال: مورد شاشات وتكييفات شارب وتورنيدو..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer shadow-md"
                >
                  حفظ المورد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Supplier Modal */}
      {editingSupplier && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 text-xs text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-600" />
                تعديل بيانات المورد
              </h3>
              <button onClick={() => setEditingSupplier(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSupplier} className="space-y-3">
              <div>
                <label className="block text-slate-600 font-bold mb-1">اسم المورد أو المسؤول *</label>
                <input
                  type="text"
                  required
                  value={editingSupplier.name || ''}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">اسم الشركة أو التوكيل</label>
                <input
                  type="text"
                  value={editingSupplier.company || ''}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, company: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">رقم الهاتف الأساسي *</label>
                  <input
                    type="text"
                    required
                    value={editingSupplier.phone || ''}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">هاتف إضافي / واتساب</label>
                  <input
                    type="text"
                    value={editingSupplier.phone2 || ''}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, phone2: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">العنوان ومقر الشركة</label>
                <input
                  type="text"
                  value={editingSupplier.address || ''}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">الرصيد المالي للمورد</label>
                <input
                  type="number"
                  value={editingSupplier.balance ?? 0}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, balance: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">ملاحظات والتصنيفات الموردة</label>
                <textarea
                  rows="2"
                  value={editingSupplier.notes || ''}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingSupplier(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer shadow-md"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excel Import Modal for Suppliers */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800">
                    استيراد الموردين والشركات من ملف Excel (XLSX)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    إضافة جماعية أو تحديث لبيانات الشركات الموزعة والموردين وأرقام التواصل بضغطة واحدة
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Template Download Banner */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-xs text-slate-600">
                <Info className="w-5 h-5 text-blue-600 shrink-0" />
                <div>
                  <div className="font-bold text-slate-800">هل تحتاج نموذج إكسيل جاهز؟</div>
                  <div className="text-[11px] text-slate-500">قم بتحميل نموذج بالأعمدة والبيانات المطلوبة لملء الموردين بكل سهولة.</div>
                </div>
              </div>
              <button
                type="button"
                onClick={downloadSuppliersTemplate}
                className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2 shrink-0 active:scale-98"
              >
                <Download className="w-4 h-4 text-teal-600" />
                <span>تحميل نموذج Excel فارغ</span>
              </button>
            </div>

            {/* Error & Success Messages */}
            {importError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{importError}</span>
              </div>
            )}
            {importSuccessMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{importSuccessMsg}</span>
              </div>
            )}

            {/* File Upload Zone */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                اختر ملف Excel (.xlsx أو .xls):
              </label>
              <div className="border-2 border-dashed border-slate-300 hover:border-teal-500 bg-slate-50/50 rounded-2xl p-6 text-center transition-colors">
                <input
                  type="file"
                  id="excelSupplierFileInput"
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={importLoading}
                />
                <label htmlFor="excelSupplierFileInput" className="cursor-pointer flex flex-col items-center justify-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-teal-600 hover:underline">اضغط لاختيار ملف من جهازك</span>
                    <span className="text-xs text-slate-500 block mt-1">صيغ الملفات المدعومة: XLSX, XLS</span>
                  </div>
                  {importFileName && (
                    <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-white border border-teal-200 text-teal-700 text-xs font-semibold rounded-lg">
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>{importFileName}</span>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Parsed Preview Table */}
            {importRows.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-slate-800">
                    معاينة البيانات المستخرجة ({importRows.length} مورد / شركة):
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    سيتم عرض أول 5 موردين للمعاينة السريعة
                  </span>
                </div>
                <div className="max-h-48 overflow-x-auto overflow-y-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                      <tr>
                        <th className="p-2.5">#</th>
                        <th className="p-2.5">اسم المورد</th>
                        <th className="p-2.5">الشركة الموزعة</th>
                        <th className="p-2.5">الهاتف</th>
                        <th className="p-2.5">الرصيد المالي</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {importRows.slice(0, 5).map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2 text-slate-400 font-bold">{idx + 1}</td>
                          <td className="p-2 font-bold text-slate-800">
                            {row['اسم المورد / المسؤول *'] || row['اسم المورد'] || row['اسم المسؤول'] || row.name || '—'}
                          </td>
                          <td className="p-2 text-blue-600 font-semibold">
                            {row['اسم الشركة الموزعة'] || row['الشركة'] || row.company || '—'}
                          </td>
                          <td className="p-2 font-mono text-slate-600" dir="ltr">
                            {row['رقم الهاتف *'] || row['رقم الهاتف'] || row.phone || '—'}
                          </td>
                          <td className="p-2 font-bold text-slate-700">
                            {Number(row['الرصيد المالي الحالي'] || row['الرصيد'] || row.balance || 0).toLocaleString()} {currency}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                disabled={importLoading}
                className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs cursor-pointer transition-colors"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={importLoading || importRows.length === 0}
                className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs shadow-md cursor-pointer transition-all flex items-center gap-2 active:scale-98"
              >
                {importLoading ? (
                  <span>جاري الاستيراد والحفظ...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>تأكيد استيراد ({importRows.length}) مورد الآن</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Supplier Payment Modal (Requirement 6) */}
      {paySupplierModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 text-xs text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">
                    سداد حساب المورد: {paySupplierModal.name}
                  </h3>
                  {paySupplierModal.company && (
                    <p className="text-[11px] text-blue-600 font-semibold">{paySupplierModal.company}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setPaySupplierModal(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Balance Display */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 mb-4 flex items-center justify-between">
              <span className="font-bold text-slate-600">رصيد المديونية المستحق للمورد:</span>
              <span className="font-black text-rose-700 text-sm" dir="ltr">
                {Number(paySupplierModal.balance || 0).toLocaleString()} {currency}
              </span>
            </div>

            <form onSubmit={handleConfirmSupplierPayment} className="space-y-3.5">
              {/* Payment Type Selection */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">نوع السداد المطلوب:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handlePayTypeChange('partial')}
                    className={`py-2 px-3 rounded-xl font-bold border transition-all cursor-pointer text-center ${
                      payType === 'partial'
                        ? 'bg-blue-50 border-blue-500 text-blue-800 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    دفعة من تحت الحساب
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePayTypeChange('full')}
                    className={`py-2 px-3 rounded-xl font-bold border transition-all cursor-pointer text-center ${
                      payType === 'full'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    سداد كامل المديونية
                  </button>
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">المبلغ المراد سداده ({currency}) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  placeholder="0.00"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 focus:border-emerald-600 rounded-xl px-3 py-2 font-mono font-black text-sm text-left focus:outline-none"
                  dir="ltr"
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">طريقة السداد / قناة الدفع:</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                >
                  <option value="cash">خزينة المعرض النقدية (صرف كاش)</option>
                  <option value="bank">تحويل بنكي / شيك مسحوب على حساب المعرض</option>
                </select>
              </div>

              {/* Bank & Check Fields (Requirement 14) */}
              {payMethod === 'bank' && (
                <div className="space-y-3 bg-blue-50/50 p-3.5 rounded-2xl border border-blue-100">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1 text-[11px]">نوع المعاملة البنكية:</label>
                      <select
                        value={bankChannel}
                        onChange={(e) => setBankChannel(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-xs"
                      >
                        <option value="check">شيك بنكي مسحوب على المعرض</option>
                        <option value="transfer">تحويل بنكي مباشر (حساب لحساب)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1 text-[11px]">الحساب البنكي للمعرض:</label>
                      <select
                        value={selectedBankAccountId}
                        onChange={(e) => {
                          const id = e.target.value;
                          setSelectedBankAccountId(id);
                          const acc = bankAccounts.find(a => String(a.id) === String(id));
                          if (acc) setSelectedBankName(acc.bank_name || acc.name);
                        }}
                        className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-xs"
                      >
                        {bankAccounts.map(b => (
                          <option key={b.id} value={b.id}>
                            {b.bank_name ? `${b.bank_name} - ${b.name}` : b.name}
                          </option>
                        ))}
                        {bankAccounts.length === 0 && (
                          <option value="">البنك الأهلي المصري (الرئيسي)</option>
                        )}
                      </select>
                    </div>
                  </div>

                  {bankChannel === 'check' && (
                    <div className="space-y-2 pt-2 border-t border-blue-200/60">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-slate-700 font-bold mb-1 text-[11px]">رقم الشيك البنكي *</label>
                          <input
                            type="text"
                            required
                            placeholder="مثال: 0049281"
                            value={checkNumber}
                            onChange={(e) => setCheckNumber(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 font-mono font-bold text-xs"
                            dir="ltr"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-700 font-bold mb-1 text-[11px]">تاريخ استحقاق وصرف الشيك *</label>
                          <input
                            type="date"
                            required
                            value={checkDueDate}
                            onChange={(e) => setCheckDueDate(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 font-mono text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-slate-700 font-bold mb-1 text-[11px]">اسم مستلم أصل الشيك:</label>
                          <input
                            type="text"
                            placeholder={paySupplierModal.name}
                            value={recipientName}
                            onChange={(e) => setRecipientName(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-700 font-bold mb-1 text-[11px]">الرقم القومي للمستلم:</label>
                          <input
                            type="text"
                            maxLength={14}
                            placeholder="14 رقم"
                            value={recipientNationalId}
                            onChange={(e) => setRecipientNationalId(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 font-mono text-xs"
                            dir="ltr"
                          />
                        </div>
                      </div>

                      <div className="bg-amber-50 p-2 rounded-lg text-[11px] text-amber-800 font-semibold flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                        <span>سيتم توليد إيصال رسمي لتسليم أصل الشيك مع بيانات المستلم وتوقيعه فور التأكيد.</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">البيان / رقم الإيصال / ملاحظات:</label>
                <input
                  type="text"
                  placeholder="مثال: سداد دفعة شيك أو إيصال استلام نقدية"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setPaySupplierModal(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPay}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black cursor-pointer shadow-md transition-all active:scale-98"
                >
                  {isSubmittingPay ? 'جاري التسجيل...' : 'تأكيد السداد وصرف المبلغ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Check Handover Receipt Modal (Requirement 14) */}
      {showCheckReceiptModal && checkReceiptData && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          {/* Isolated Print Styles for Check Receipt */}
          <style>{`
            @media print {
              @page {
                size: A5 landscape;
                margin: 8mm 10mm;
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
              #check-receipt-printable-area,
              #check-receipt-printable-area * {
                visibility: visible !important;
              }
              #check-receipt-printable-area {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
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
            {/* Modal Controls Bar */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-3 no-print">
              <div className="flex items-center gap-2.5">
                <Receipt className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm">إيصال استلام أصل شيك بنكي معتمد</h3>
                  <p className="text-[11px] text-slate-500 font-mono">رقم السند: {checkReceiptData.receiptNo}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-98"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة الإيصال (A5)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowCheckReceiptModal(false)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Receipt Content */}
            <div className="p-6 overflow-y-auto" dir="rtl">
              <div id="check-receipt-printable-area" className="border-2 border-slate-900 rounded-2xl p-6 bg-white space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
                  <div className="flex items-center gap-3">
                    {settings?.logo_url && (
                      <img src={settings.logo_url} alt="Logo" className="h-12 w-auto object-contain" />
                    )}
                    <div>
                      <h2 className="text-base font-black text-slate-900">{storeName}</h2>
                      <p className="text-[11px] text-slate-600">لتجارة وتوزيع الأجهزة الكهربائية والأدوات المنزلية</p>
                    </div>
                  </div>
                  <div className="text-left font-mono text-xs space-y-1" dir="ltr">
                    <div className="font-black text-slate-900">سند استلام أصل شيك</div>
                    <div className="text-slate-600">No: {checkReceiptData.receiptNo}</div>
                    <div className="text-slate-600">Date: {checkReceiptData.paymentDate}</div>
                  </div>
                </div>

                {/* Voucher Title */}
                <div className="text-center py-1 bg-slate-100 rounded-lg border border-slate-300">
                  <span className="font-black text-sm text-slate-900 tracking-wide">
                    سند تسليم واستلام أصل شيك بنكي مسحوب على حساب المعرض
                  </span>
                </div>

                {/* Grid Info */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-slate-500 font-bold block text-[11px]">اسم المورد / الجهة المستفيدة:</span>
                    <span className="font-extrabold text-slate-900 text-sm">{checkReceiptData.supplierName}</span>
                    {checkReceiptData.supplierCompany && (
                      <span className="block text-[11px] text-blue-700 font-semibold">{checkReceiptData.supplierCompany}</span>
                    )}
                  </div>
                  <div className="bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200 space-y-1">
                    <span className="text-emerald-800 font-bold block text-[11px]">المبلغ المسدد بالشيك:</span>
                    <span className="font-black text-emerald-900 text-base" dir="ltr">
                      {Number(checkReceiptData.amount).toLocaleString()} {currency}
                    </span>
                    <span className="block text-[11px] text-emerald-800 font-bold">
                      (فقط وقدره {Number(checkReceiptData.amount).toLocaleString()} جنيهاً مصرياً لا غير)
                    </span>
                  </div>
                </div>

                {/* Check & Bank Details */}
                <div className="grid grid-cols-3 gap-2.5 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-500 font-bold block text-[11px]">البنك المسحوب عليه:</span>
                    <span className="font-bold text-slate-900">{checkReceiptData.bankName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block text-[11px]">رقم الشيك البنكي:</span>
                    <span className="font-mono font-black text-slate-900 text-sm" dir="ltr">
                      {checkReceiptData.checkNumber}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block text-[11px]">تاريخ استحقاق وصرف الشيك:</span>
                    <span className="font-mono font-bold text-slate-900" dir="ltr">
                      {checkReceiptData.checkDueDate}
                    </span>
                  </div>
                </div>

                {/* Recipient Details & Legal Acknowledgment */}
                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80 text-xs space-y-1.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-600 font-bold">اسم المستلم لأصل الشيك: </span>
                      <span className="font-black text-slate-900">{checkReceiptData.recipientName}</span>
                    </div>
                    <div>
                      <span className="text-slate-600 font-bold">الرقم القومي: </span>
                      <span className="font-mono font-bold text-slate-900" dir="ltr">{checkReceiptData.recipientNationalId}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-700 leading-relaxed font-semibold pt-1 border-t border-amber-200/50">
                    أقر أنا الموقع أدناه ومندوب الجهة الموضحة أعلاه، بأني قد استلمت من إدارة المعرض أصل الشيك البنكي الموضح بياناته وأرقامه بعاليه بكامل الصحة والصلاحية، وأتعهد بتسليمه للشركة الموردة دون أدنى مسؤولية مالية أو قانونية على المعرض بعد التوقيع والاستلام.
                  </p>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-3 gap-4 pt-3 border-t-2 border-slate-900 text-center text-xs">
                  <div className="space-y-6">
                    <span className="font-bold text-slate-700 block">توقيع المستلم لأصل الشيك</span>
                    <div className="text-[11px] text-slate-400">............................................</div>
                  </div>
                  <div className="space-y-6">
                    <span className="font-bold text-slate-700 block">توقيع أمين الخزينة / المحاسب</span>
                    <div className="text-[11px] text-slate-400">............................................</div>
                  </div>
                  <div className="space-y-6">
                    <span className="font-bold text-slate-700 block">اعتماد الإدارة العامة والختم</span>
                    <div className="text-[11px] text-slate-400">............................................</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Supplier Statement of Account Modal (Requirement 7) */}
      {statementSupplier && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          {/* Isolated Print Styles for Statement */}
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
              body * {
                visibility: hidden !important;
              }
              #supplier-statement-printable-area,
              #supplier-statement-printable-area * {
                visibility: visible !important;
              }
              #supplier-statement-printable-area {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
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

          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Controls Bar */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 no-print">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm">
                    كشف حساب المورد: {statementSupplier.name}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {statementSupplier.company ? `شركة ${statementSupplier.company} | ` : ''}سجل المشتريات والتوريدات وسداد الدفعات
                  </p>
                </div>
              </div>

              {/* Filter Form */}
              <form onSubmit={handleApplyStatementFilter} className="flex items-center gap-2 text-xs">
                <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5">
                  <span className="text-slate-500 font-bold text-[11px]">من:</span>
                  <input
                    type="date"
                    value={statementFromDate}
                    onChange={(e) => setStatementFromDate(e.target.value)}
                    className="font-mono text-xs focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5">
                  <span className="text-slate-500 font-bold text-[11px]">إلى:</span>
                  <input
                    type="date"
                    value={statementToDate}
                    onChange={(e) => setStatementToDate(e.target.value)}
                    className="font-mono text-xs focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={statementLoading}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${statementLoading ? 'animate-spin' : ''}`} />
                  <span>تحديث</span>
                </button>
              </form>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-98"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة كشف الحساب (A4)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatementSupplier(null)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Statement Document */}
            <div className="p-6 overflow-y-auto" dir="rtl">
              <div id="supplier-statement-printable-area" className="space-y-4 bg-white text-slate-900 text-xs">
                {/* Formal Header */}
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
                  <div className="flex items-center gap-3">
                    {settings?.logo_url && (
                      <img src={settings.logo_url} alt="Logo" className="h-12 w-auto object-contain" />
                    )}
                    <div>
                      <h2 className="text-base font-black text-slate-900">{storeName}</h2>
                      <p className="text-[11px] text-slate-600">قسم الحسابات والمشتريات العامة ومتابعة الموردين</p>
                    </div>
                  </div>
                  <div className="text-left font-mono text-xs space-y-0.5" dir="ltr">
                    <div className="font-black text-slate-900">STATEMENT OF ACCOUNT</div>
                    <div className="text-slate-600">Date: {new Date().toLocaleDateString('ar-EG', { timeZone: 'Africa/Cairo' })}</div>
                    <div className="text-[11px] text-slate-500">
                      {statementData?.period?.from_date ? `From: ${statementData.period.from_date}` : 'All History'}
                      {statementData?.period?.to_date ? ` To: ${statementData.period.to_date}` : ''}
                    </div>
                  </div>
                </div>

                {/* Title */}
                <div className="text-center py-1.5 bg-slate-100 rounded-xl border border-slate-300">
                  <span className="font-black text-sm text-slate-900 tracking-wide">
                    كشف حساب مورد معتمد وحركة التوريدات والمدفوعات
                  </span>
                </div>

                {/* Supplier Card Info */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px]">
                  <div>
                    <span className="text-slate-500 font-bold block">اسم المورد:</span>
                    <span className="font-extrabold text-slate-900 text-xs">{statementSupplier.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block">الشركة / التوكيل:</span>
                    <span className="font-bold text-blue-700 text-xs">{statementSupplier.company || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block">رقم الهاتف:</span>
                    <span className="font-mono font-bold text-slate-900" dir="ltr">{statementSupplier.phone}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block">العنوان:</span>
                    <span className="font-bold text-slate-700">{statementSupplier.address || '—'}</span>
                  </div>
                </div>

                {/* Summary KPIs */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-blue-50/80 p-3 rounded-xl border border-blue-200">
                    <span className="text-blue-700 font-bold block text-[11px]">إجمالي التوريدات والمشتريات (دائن)</span>
                    <span className="font-black text-blue-950 text-base" dir="ltr">
                      {Number(statementData?.summary?.total_purchases || 0).toLocaleString()} {currency}
                    </span>
                  </div>
                  <div className="bg-emerald-50/80 p-3 rounded-xl border border-emerald-200">
                    <span className="text-emerald-700 font-bold block text-[11px]">إجمالي المسدد والمدفوعات (مدين)</span>
                    <span className="font-black text-emerald-950 text-base" dir="ltr">
                      {Number(statementData?.summary?.total_payments || 0).toLocaleString()} {currency}
                    </span>
                  </div>
                  <div className="bg-rose-50/80 p-3 rounded-xl border border-rose-200">
                    <span className="text-rose-700 font-bold block text-[11px]">الرصيد المتبقي المستحق للمورد</span>
                    <span className="font-black text-rose-950 text-base" dir="ltr">
                      {Number(statementData?.summary?.closing_balance || statementSupplier.balance || 0).toLocaleString()} {currency}
                    </span>
                  </div>
                </div>

                {/* Transactions Table */}
                <div className="border border-slate-300 rounded-xl overflow-hidden">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-800 text-white font-bold">
                      <tr>
                        <th className="p-2 text-center w-8">#</th>
                        <th className="p-2 w-24">التاريخ</th>
                        <th className="p-2 w-28">رقم المرجع</th>
                        <th className="p-2">البيان والحركة</th>
                        <th className="p-2 w-24 text-left">مدين (سداد)</th>
                        <th className="p-2 w-24 text-left">دائن (توريد)</th>
                        <th className="p-2 w-28 text-left">الرصيد بعد الحركة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {statementData?.transactions?.length > 0 ? (
                        statementData.transactions.map((tx, idx) => (
                          <tr key={tx.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                            <td className="p-2 text-center font-bold text-slate-500">{idx + 1}</td>
                            <td className="p-2 font-mono text-[11px] text-slate-700" dir="ltr">{tx.date}</td>
                            <td className="p-2 font-mono font-bold text-slate-800 text-[11px]" dir="ltr">{tx.ref_no}</td>
                            <td className="p-2 text-slate-700">
                              <span className="font-bold">{tx.description}</span>
                            </td>
                            <td className="p-2 font-mono font-bold text-emerald-700 text-left" dir="ltr">
                              {tx.debit > 0 ? Number(tx.debit).toLocaleString() : '—'}
                            </td>
                            <td className="p-2 font-mono font-bold text-blue-700 text-left" dir="ltr">
                              {tx.credit > 0 ? Number(tx.credit).toLocaleString() : '—'}
                            </td>
                            <td className="p-2 font-mono font-black text-slate-900 text-left" dir="ltr">
                              {Number(tx.balance || 0).toLocaleString()} {currency}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="p-8 text-center text-slate-400 font-bold">
                            {statementLoading ? 'جاري استخراج كشف الحساب...' : 'لا توجد حركات مسجلة لهذا المورد في الفترة المحددة'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-black text-xs">
                      <tr>
                        <td colSpan="4" className="p-2.5 text-slate-900 font-bold text-center">الإجمالي العام للحركات</td>
                        <td className="p-2.5 text-left font-mono text-emerald-800" dir="ltr">
                          {Number(statementData?.summary?.total_payments || 0).toLocaleString()} {currency}
                        </td>
                        <td className="p-2.5 text-left font-mono text-blue-800" dir="ltr">
                          {Number(statementData?.summary?.total_purchases || 0).toLocaleString()} {currency}
                        </td>
                        <td className="p-2.5 text-left font-mono text-slate-900" dir="ltr">
                          {Number(statementData?.summary?.closing_balance || 0).toLocaleString()} {currency}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t-2 border-slate-900 text-center text-xs">
                  <div className="space-y-8">
                    <span className="font-bold text-slate-700 block">مندوب / مسؤول المورد</span>
                    <div className="text-[11px] text-slate-400">............................................</div>
                  </div>
                  <div className="space-y-8">
                    <span className="font-bold text-slate-700 block">المحاسب المالي المختص</span>
                    <div className="text-[11px] text-slate-400">............................................</div>
                  </div>
                  <div className="space-y-8">
                    <span className="font-bold text-slate-700 block">اعتماد المدير العام والختم</span>
                    <div className="text-[11px] text-slate-400">............................................</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
