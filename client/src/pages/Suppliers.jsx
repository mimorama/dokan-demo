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
  CheckCircle
} from 'lucide-react';
import { api } from '../api';
import { exportToExcel, readExcelFile, downloadSuppliersTemplate } from '../utils/excel';

export default function Suppliers({ settings }) {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);

  // Excel Import/Export State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importRows, setImportRows] = useState([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState('');
  const [importFileName, setImportFileName] = useState('');
  const [importSuccessMsg, setImportSuccessMsg] = useState('');

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

  useEffect(() => {
    loadSuppliers();
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
    </div>
  );
}
