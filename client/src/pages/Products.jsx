import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Package, 
  Edit3, 
  Trash2, 
  Barcode, 
  ShieldCheck, 
  AlertTriangle, 
  Filter, 
  Check, 
  X,
  PhoneCall,
  Building2,
  Tags,
  CheckSquare,
  Square,
  FolderPlus,
  FileSpreadsheet,
  FileDown,
  FileUp,
  Download,
  Upload,
  Info,
  CheckCircle,
  AlertCircle,
  Scan
} from 'lucide-react';
import { api } from '../api';
import BarcodeLabelModal from '../components/BarcodeLabelModal';
import { exportToExcel, readExcelFile, downloadProductsTemplate } from '../utils/excel';

export default function Products({ settings, onOpenCycleCount }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Excel Import/Export State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importRows, setImportRows] = useState([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState('');
  const [importFileName, setImportFileName] = useState('');
  const [importSuccessMsg, setImportSuccessMsg] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSerialModal, setShowSerialModal] = useState(false);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [suppliersList, setSuppliersList] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [barcodeProduct, setBarcodeProduct] = useState(null);

  // Form State for Category
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    icon: 'Package'
  });

  // Form State for Brand with Multi-supplier link
  const [brandForm, setBrandForm] = useState({
    name: '',
    country: 'مصر',
    agent_name: '',
    agent_phone: '',
    selected_suppliers: []
  });

  // Form State for New/Edit Product
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    brand_id: '',
    model_number: '',
    barcode: '',
    specifications: '',
    cost_price: '',
    cash_price: '',
    installment_price: '',
    warranty_months: 12,
    warranty_agency: '',
    alert_quantity: 2,
    initial_serials: ''
  });

  // Batch Serials Form
  const [batchSerials, setBatchSerials] = useState('');
  const [batchCostPrice, setBatchCostPrice] = useState('');

  const currency = settings?.currency || 'ج.م';

  useEffect(() => {
    loadData();
  }, [selectedCategory, selectedBrand, search]);

  const loadData = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category_id', selectedCategory);
      if (selectedBrand) params.append('brand_id', selectedBrand);
      if (search) params.append('search', search);

      const [prods, cats, brnds] = await Promise.all([
        api.getProducts(params.toString()),
        api.getCategories(),
        api.getBrands()
      ]);
      setProducts(prods);
      setCategories(cats);
      setBrands(brnds);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = (product = null) => {
    if (product) {
      setSelectedProduct(product);
      setFormData({
        name: product.name,
        category_id: product.category_id || '',
        brand_id: product.brand_id || '',
        model_number: product.model_number || '',
        barcode: product.barcode || '',
        specifications: product.specifications || '',
        cost_price: product.cost_price,
        cash_price: product.cash_price,
        installment_price: product.installment_price,
        warranty_months: product.warranty_months,
        warranty_agency: product.warranty_agency || '',
        alert_quantity: product.alert_quantity,
        initial_serials: ''
      });
    } else {
      setSelectedProduct(null);
      setFormData({
        name: '',
        category_id: categories[0]?.id || '',
        brand_id: brands[0]?.id || '',
        model_number: '',
        barcode: '',
        specifications: '',
        cost_price: '',
        cash_price: '',
        installment_price: '',
        warranty_months: 12,
        warranty_agency: '',
        alert_quantity: 2,
        initial_serials: ''
      });
    }
    setShowAddModal(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      if (selectedProduct) {
        await api.updateProduct(selectedProduct.id, formData);
      } else {
        await api.createProduct(formData);
      }
      setShowAddModal(false);
      loadData();
    } catch (err) {
      alert(err.message || 'حدث خطأ أثناء حفظ الجهاز');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (confirm('هل أنت متأكد من حذف هذا الجهاز من النظام؟')) {
      try {
        await api.deleteProduct(id);
        loadData();
      } catch (err) {
        alert(err.message || 'خطأ أثناء الحذف');
      }
    }
  };

  const handleOpenAddSerials = (product) => {
    setSelectedProduct(product);
    setBatchSerials('');
    setBatchCostPrice(product.cost_price);
    setShowSerialModal(true);
  };

  const handleSaveSerials = async (e) => {
    e.preventDefault();
    if (!batchSerials.trim()) {
      alert('الرجاء كتابة أو مسح الأرقام التسلسلية');
      return;
    }

    try {
      await api.addSerialsBatch({
        product_id: selectedProduct.id,
        serials: batchSerials,
        cost_price: batchCostPrice
      });
      setShowSerialModal(false);
      loadData();
    } catch (err) {
      alert(err.message || 'خطأ أثناء إضافة الأرقام التسلسلية');
    }
  };

  const handleOpenAddBrandModal = async () => {
    try {
      const sups = await api.getSuppliers();
      setSuppliersList(sups || []);
    } catch (e) {
      console.error(e);
    }
    setBrandForm({
      name: '',
      country: 'مصر',
      agent_name: '',
      agent_phone: '',
      selected_suppliers: []
    });
    setShowBrandModal(true);
  };

  const handleToggleSupplierInBrand = (supId) => {
    setBrandForm(prev => {
      const exists = prev.selected_suppliers.includes(supId);
      return {
        ...prev,
        selected_suppliers: exists
          ? prev.selected_suppliers.filter(id => id !== supId)
          : [...prev.selected_suppliers, supId]
      };
    });
  };

  const handleSaveBrand = async (e) => {
    e.preventDefault();
    if (!brandForm.name.trim()) {
      alert('اسم الماركة مطلوب');
      return;
    }
    try {
      const newBrand = await api.createBrand({
        name: brandForm.name.trim(),
        country: brandForm.country,
        agent_name: brandForm.agent_name,
        agent_phone: brandForm.agent_phone,
        supplier_ids: brandForm.selected_suppliers
      });
      setShowBrandModal(false);
      const updatedBrands = await api.getBrands();
      setBrands(updatedBrands);
      if (showAddModal) {
        setFormData(prev => ({ ...prev, brand_id: newBrand.id }));
      }
    } catch (err) {
      alert(err.message || 'خطأ أثناء إضافة الماركة');
    }
  };

  const handleOpenAddCategoryModal = () => {
    setCategoryForm({
      name: '',
      description: '',
      icon: 'Package'
    });
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      alert('اسم التصنيف / الصنف مطلوب');
      return;
    }
    try {
      const newCat = await api.createCategory({
        name: categoryForm.name.trim(),
        description: categoryForm.description.trim(),
        icon: categoryForm.icon || 'Package'
      });
      setShowCategoryModal(false);
      const updatedCategories = await api.getCategories();
      setCategories(updatedCategories);
      if (showAddModal) {
        setFormData(prev => ({ ...prev, category_id: newCat.id }));
      }
    } catch (err) {
      alert(err.message || 'خطأ أثناء إضافة التصنيف');
    }
  };

  // Export current products to Excel
  const handleExportExcel = () => {
    try {
      if (!products || products.length === 0) {
        alert('لا توجد أجهزة أو أصناف متاحة للتصدير حالياً');
        return;
      }
      const dataToExport = products.map(p => ({
        'اسم الجهاز': p.name || '',
        'الموديل': p.model_number || '',
        'الباركود': p.barcode || '',
        'القسم / الفئة': p.category_name || '',
        'الماركة': p.brand_name || '',
        'سعر التكلفة': Number(p.cost_price) || 0,
        'سعر الكاش': Number(p.cash_price) || 0,
        'سعر التقسيط': Number(p.installment_price) || 0,
        'الرصيد المتاح': Number(p.in_stock_count) || 0,
        'الكمية المباعة': Number(p.sold_count) || 0,
        'مدة الضمان (شهور)': Number(p.warranty_months) || 0,
        'شركة الضمان': p.warranty_agency || '',
        'حد النواقص الأدنى': Number(p.alert_quantity) || 2,
        'المواصفات الفنية': p.specifications || ''
      }));

      exportToExcel({
        data: dataToExport,
        filename: `قائمة_الأجهزة_والأصناف_دكان_عبدالعزيز_${new Date().toISOString().slice(0, 10)}`,
        sheetName: 'الأجهزة_والأصناف'
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
      const res = await api.bulkImportProducts(importRows);
      setImportSuccessMsg(res.message || `تم استيراد ${res.count} صنف بنجاح`);
      setTimeout(() => {
        setShowImportModal(false);
        setImportRows([]);
        setImportFileName('');
        setImportSuccessMsg('');
        loadData();
      }, 1500);
    } catch (err) {
      setImportError(err.message || 'خطأ أثناء استيراد البيانات إلى النظام');
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-600" />
            إدارة الأصناف والأجهزة الكهربائية
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            سجل شامل بالأصناف، الأسعار، مدد الضمان والوكيل المعتمد، وتتبع أرقام السيريال المتاحة والمباعة
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {/* Export Excel Button */}
          <button
            type="button"
            onClick={handleExportExcel}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 active:scale-98"
            title="تصدير جميع الأصناف المعروضة حالياً إلى ملف Excel"
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
            className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 active:scale-98"
            title="استيراد أصناف وأجهزة من ملف Excel جاهز"
          >
            <FileUp className="w-4 h-4 text-teal-100" />
            <span>استيراد Excel</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddCategoryModal}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
          >
            <FolderPlus className="w-4 h-4 text-indigo-200" />
            <span>إضافة تصنيف</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddBrandModal}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Building2 className="w-4 h-4 text-amber-400" />
            <span>إضافة ماركة</span>
          </button>

          <button
            type="button"
            onClick={onOpenCycleCount}
            className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-black text-xs px-3.5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 active:scale-98"
            title="بدء عملية الجرد المخزني الفعلي ومطابقة السيريال والباركود وحصر العجز والزيادة"
          >
            <Scan className="w-4 h-4 text-amber-200" />
            <span>الجرد المخزني الفعلي (تدقيق العهدة)</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenAddModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة جهاز جديد</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="بحث باسم الجهاز، الموديل، أو الباركود..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
        >
          <option value="">جميع التصنيفات (ثلاجات، غسالات...)</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select
          value={selectedBrand}
          onChange={(e) => setSelectedBrand(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
        >
          <option value="">جميع الماركات (توشيبا، إل جي، سامسونج...)</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold">
                <th className="py-3 px-4">اسم الجهاز والموديل</th>
                <th className="py-3 px-4">التصنيف والماركة</th>
                <th className="py-3 px-4">سعر التكلفة</th>
                <th className="py-3 px-4">سعر الكاش</th>
                <th className="py-3 px-4">سعر التقسيط</th>
                <th className="py-3 px-4">المخزون (سيريال متاح)</th>
                <th className="py-3 px-4">فترة الضمان والوكيل</th>
                <th className="py-3 px-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {products.map((p) => {
                const isLow = p.in_stock_count <= p.alert_quantity;
                return (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-extrabold text-slate-900 text-sm">{p.name}</p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-0.5">
                        {p.model_number && <span>موديل: {p.model_number}</span>}
                        {p.barcode && <span>| باركود: {p.barcode}</span>}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-700 block">{p.category_name || 'عام'}</span>
                      <span className="text-[11px] text-blue-600 font-semibold">{p.brand_name || '---'}</span>
                    </td>

                    <td className="py-3 px-4 text-slate-500 font-bold" dir="ltr">
                      {Number(p.cost_price).toLocaleString()} {currency}
                    </td>

                    <td className="py-3 px-4 text-slate-900 font-black text-sm" dir="ltr">
                      {Number(p.cash_price).toLocaleString()} {currency}
                    </td>

                    <td className="py-3 px-4 text-blue-700 font-extrabold" dir="ltr">
                      {Number(p.installment_price).toLocaleString()} {currency}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-full font-black text-xs ${
                          p.in_stock_count === 0
                            ? 'bg-rose-100 text-rose-700'
                            : isLow
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {p.in_stock_count} أجهزة
                        </span>
                        <button
                          onClick={() => handleOpenAddSerials(p)}
                          title="شحن وتوريد أرقام سيريال جديدة"
                          className="p-1 rounded bg-slate-100 hover:bg-blue-100 text-blue-700 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">مباع: {p.sold_count}</span>
                    </td>

                    <td className="py-3 px-4 text-[11px]">
                      <div className="flex items-center gap-1 font-bold text-emerald-700">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{p.warranty_months} شهر ({Math.round(p.warranty_months / 12)} سنين)</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">{p.warranty_agency || p.agent_name || 'الوكيل المعتمد'}</p>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setBarcodeProduct(p)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                          title="طباعة ملصق وباركود الجهاز"
                        >
                          <Barcode className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenAddModal(p)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="تعديل الجهاز"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="حذف الجهاز"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="font-bold text-base text-slate-800">
                {selectedProduct ? 'تعديل بيانات الجهاز' : 'إضافة جهاز كهربائي جديد'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">اسم الجهاز *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: ثلاجة شارب 16 قدم نوفروست"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">رقم الموديل (Model)</label>
                  <input
                    type="text"
                    placeholder="مثال: SJ-GV58A-SL"
                    value={formData.model_number}
                    onChange={(e) => setFormData({ ...formData, model_number: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-600 font-bold">التصنيف *</label>
                    <button
                      type="button"
                      onClick={handleOpenAddCategoryModal}
                      className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
                    >
                      + تصنيف جديد
                    </button>
                  </div>
                  <select
                    required
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-700"
                  >
                    <option value="">اختر التصنيف...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-600 font-bold">الماركة والشركة</label>
                    <button
                      type="button"
                      onClick={handleOpenAddBrandModal}
                      className="text-[10px] text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
                    >
                      + ماركة جديدة
                    </button>
                  </div>
                  <select
                    value={formData.brand_id}
                    onChange={(e) => setFormData({ ...formData, brand_id: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-700"
                  >
                    <option value="">اختر الماركة...</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">سعر الشراء / التكلفة</label>
                  <input
                    type="number"
                    required
                    placeholder="0"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">سعر بيع الكاش</label>
                  <input
                    type="number"
                    required
                    placeholder="0"
                    value={formData.cash_price}
                    onChange={(e) => setFormData({ ...formData, cash_price: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">سعر بيع التقسيط</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={formData.installment_price}
                    onChange={(e) => setFormData({ ...formData, installment_price: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-blue-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">مدة الضمان (بالشهور)</label>
                  <input
                    type="number"
                    value={formData.warranty_months}
                    onChange={(e) => setFormData({ ...formData, warranty_months: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">120 = 10 سنوات، 60 = 5 سنوات، 24 = سنتين</span>
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">اسم الوكيل المعتمد والخط الساخن</label>
                  <input
                    type="text"
                    placeholder="مثال: العربي جروب (19319)"
                    value={formData.warranty_agency}
                    onChange={(e) => setFormData({ ...formData, warranty_agency: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">المواصفات الفنية وسعة الجهاز</label>
                <textarea
                  rows={2}
                  placeholder="مثال: سعة 380 لتر، لون سيلفر ديجيتال، انفرتر توفير طاقة..."
                  value={formData.specifications}
                  onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>

              {!selectedProduct && (
                <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-3">
                  <label className="block text-blue-900 font-bold mb-1">
                    الأرقام التسلسلية الأولية (Serial Numbers) - اختياري
                  </label>
                  <textarea
                    rows={2}
                    placeholder="اكتب أو انسخ أرقام السيريال للأجهزة المستلمة (كل سيريال في سطر أو مفصولة بفواصل)..."
                    value={formData.initial_serials}
                    onChange={(e) => setFormData({ ...formData, initial_serials: e.target.value })}
                    className="w-full bg-white border border-blue-200 rounded-lg px-2.5 py-1.5 font-mono text-xs"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md cursor-pointer"
                >
                  حفظ الجهاز
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Batch Serials Modal */}
      {showSerialModal && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-800">شحن وتوريد أرقام سيريال</h3>
                <p className="text-xs text-blue-600 font-bold mt-0.5">{selectedProduct.name}</p>
              </div>
              <button onClick={() => setShowSerialModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSerials} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">أرقام السيريال المستلمة (Serial Numbers) *</label>
                <p className="text-[11px] text-slate-400 mb-1">
                  يمكنك مسح الباركود الخاص بكل جهاز بالماسح الضوئي أو كتابة السيريالات مفصولة بأسطر:
                </p>
                <textarea
                  rows={5}
                  required
                  placeholder="TSH-REF-1001&#10;TSH-REF-1002&#10;TSH-REF-1003"
                  value={batchSerials}
                  onChange={(e) => setBatchSerials(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">تكلفة الشراء للجهاز الواحد</label>
                <input
                  type="number"
                  value={batchCostPrice}
                  onChange={(e) => setBatchCostPrice(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowSerialModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md cursor-pointer"
                >
                  تسجيل الأجهزة في المخزن
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Brand with Multi-Supplier Link Modal */}
      {showBrandModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 text-xs text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-500" />
                إضافة ماركة جديدة وربطها بشركات التوريد
              </h3>
              <button onClick={() => setShowBrandModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBrand} className="space-y-3.5">
              <div>
                <label className="block text-slate-600 font-bold mb-1">اسم الماركة التجارية *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: توشيبا العربي / إل جي LG / تورنيدو / بيكو"
                  value={brandForm.name}
                  onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">بلد المنشأ والتصنيع</label>
                  <input
                    type="text"
                    placeholder="مثال: مصر / اليابان / تركيا"
                    value={brandForm.country}
                    onChange={(e) => setBrandForm({ ...brandForm, country: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">الوكيل المعتمد</label>
                  <input
                    type="text"
                    placeholder="مثال: مجموعة العربي للتجارة"
                    value={brandForm.agent_name}
                    onChange={(e) => setBrandForm({ ...brandForm, agent_name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">هاتف وخط ساخن الوكيل / الصيانة</label>
                <input
                  type="text"
                  placeholder="مثال: 19319"
                  value={brandForm.agent_phone}
                  onChange={(e) => setBrandForm({ ...brandForm, agent_phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono"
                  dir="ltr"
                />
              </div>

              {/* Multi-Supplier Selection Checkboxes */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-800 font-extrabold text-xs">
                    الموردين والشركات الموزعة لهذه الماركة:
                  </label>
                  <span className="text-[11px] text-blue-700 font-bold">
                    ({brandForm.selected_suppliers.length} موردين محددين)
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  حدد الشركات والموزعين المعتمدين الذين يقومون بتوريد هذه الماركة للمعرض:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pt-1">
                  {suppliersList.map((sup) => {
                    const isSelected = brandForm.selected_suppliers.includes(sup.id);
                    return (
                      <button
                        key={sup.id}
                        type="button"
                        onClick={() => handleToggleSupplierInBrand(sup.id)}
                        className={`flex items-center gap-2 p-2 rounded-xl border text-right transition cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 border-blue-400 text-blue-900 font-bold'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <div className="truncate">
                          <p className="text-xs font-bold truncate">{sup.name}</p>
                          {sup.company && <p className="text-[10px] text-slate-400 truncate">{sup.company}</p>}
                        </div>
                      </button>
                    );
                  })}
                  {suppliersList.length === 0 && (
                    <p className="text-[11px] text-slate-400 col-span-2 text-center py-2">لا يوجد موردين مسجلين حالياً</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowBrandModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>حفظ الماركة الآن</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 text-xs text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-indigo-600" />
                إضافة تصنيف / صنف رئيسي جديد
              </h3>
              <button onClick={() => setShowCategoryModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-slate-600 font-bold mb-1.5">اسم التصنيف / الصنف *</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="مثال: سخانات مياه، ديب فريزر، مكانس، أجهزة مطبخ..."
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Quick Preset Badges */}
              <div>
                <label className="block text-[11px] text-slate-500 font-semibold mb-1.5">اقتراحات سريعة شائعة للأجهزة:</label>
                <div className="flex flex-wrap gap-1.5">
                  {['سخانات مياه', 'دفايات وتدفئة', 'مكانس ومغاسل', 'فلاتر ومبردات مياه', 'ميكروويف وأفران', 'قلايات هوائية', 'خلاطات ومحضرات طعام'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCategoryForm({ ...categoryForm, name: preset })}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-600 transition-all cursor-pointer"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1.5">وصف التصنيف (اختياري)</label>
                <textarea
                  rows={2}
                  placeholder="وصف إضافي للأجهزة التابعة لهذا التصنيف..."
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>حفظ التصنيف الآن</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excel Import Modal */}
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
                    استيراد الأصناف والأجهزة من ملف Excel (XLSX)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    إضافة جماعية أو تحديث لبيانات الأجهزة والأسعار والضمان بضغطة واحدة
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
                  <div className="text-[11px] text-slate-500">قم بتحميل نموذج بالأعمدة والبيانات المطلوبة لملء أصنافك بكل سهولة.</div>
                </div>
              </div>
              <button
                type="button"
                onClick={downloadProductsTemplate}
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
                  id="excelFileInput"
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={importLoading}
                />
                <label htmlFor="excelFileInput" className="cursor-pointer flex flex-col items-center justify-center gap-2">
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
                    معاينة البيانات المستخرجة ({importRows.length} صنف / جهاز):
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    سيتم عرض أول 5 أصناف للمعاينة السريعة
                  </span>
                </div>
                <div className="max-h-48 overflow-x-auto overflow-y-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                      <tr>
                        <th className="p-2.5">#</th>
                        <th className="p-2.5">اسم الجهاز</th>
                        <th className="p-2.5">الموديل</th>
                        <th className="p-2.5">الباركود</th>
                        <th className="p-2.5">سعر الكاش</th>
                        <th className="p-2.5">الكمية</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {importRows.slice(0, 5).map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2 text-slate-400 font-bold">{idx + 1}</td>
                          <td className="p-2 font-bold text-slate-800">
                            {row['اسم الجهاز *'] || row['اسم الجهاز'] || row['اسم الصنف'] || row.name || '—'}
                          </td>
                          <td className="p-2 font-mono text-slate-600">
                            {row['الموديل'] || row['رقم الموديل'] || row.model_number || '—'}
                          </td>
                          <td className="p-2 font-mono text-slate-600">
                            {row['الباركود'] || row['باركود'] || row.barcode || '—'}
                          </td>
                          <td className="p-2 font-bold text-emerald-600">
                            {Number(row['سعر الكاش'] || row['سعر البيع'] || row.cash_price || 0).toLocaleString()} {currency}
                          </td>
                          <td className="p-2 font-bold text-blue-600">
                            {row['الرصيد / الكمية الأولية'] || row['الكمية'] || row.initial_quantity || 0}
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
                    <span>تأكيد استيراد ({importRows.length}) جهاز الآن</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Sticker Print Modal */}
      {barcodeProduct && (
        <BarcodeLabelModal
          product={barcodeProduct}
          settings={settings}
          onClose={() => setBarcodeProduct(null)}
        />
      )}
    </div>
  );
}
