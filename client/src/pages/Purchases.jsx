import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Truck, 
  Plus, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  ShieldCheck, 
  FileText, 
  X, 
  Barcode, 
  Wallet, 
  Building2,
  Calendar,
  Layers,
  ArrowRight,
  Filter,
  Check,
  AlertTriangle
} from 'lucide-react';
import { api } from '../api';

export default function Purchases({ settings, currentUser }) {
  const [activeTab, setActiveTab] = useState('purchases'); // 'purchases', 'sales_audit'
  const [purchases, setPurchases] = useState([]);
  const [sales, setSales] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showNewPurchaseModal, setShowNewPurchaseModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [auditTarget, setAuditTarget] = useState(null); // { type: 'sale' | 'purchase', id, currentStatus, currentNotes }

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterReviewStatus, setFilterReviewStatus] = useState('all');

  // Purchase Form
  const [purchaseForm, setPurchaseForm] = useState({
    supplier_id: '',
    warehouse_id: '',
    invoice_no: '',
    payment_type: 'cash', // 'cash', 'credit', 'bank'
    paid_amount: '',
    notes: '',
    items: []
  });

  const [currentLineItem, setCurrentLineItem] = useState({
    product_id: '',
    cost_price: '',
    serialsText: '' // Comma or newline separated serials
  });

  // Audit Form
  const [auditForm, setAuditForm] = useState({
    review_status: 'reviewed',
    audit_notes: '',
    reviewed_by: currentUser?.name || 'المراجع المالي'
  });

  const currency = settings?.currency || 'ج.م';

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pData, sData, supData, wData, prData] = await Promise.all([
        api.getPurchases().catch(() => []),
        api.getSales().catch(() => []),
        api.getSuppliers().catch(() => []),
        api.getWarehouses().catch(() => []),
        api.getProducts().catch(() => [])
      ]);
      setPurchases(pData);
      setSales(sData);
      setSuppliers(supData);
      setWarehouses(wData);
      setProducts(prData);

      if (wData.length > 0 && !purchaseForm.warehouse_id) {
        setPurchaseForm(prev => ({ ...prev, warehouse_id: wData[0].id }));
      }
      if (supData.length > 0 && !purchaseForm.supplier_id) {
        setPurchaseForm(prev => ({ ...prev, supplier_id: supData[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAuditModal = (type, item) => {
    setAuditTarget({ type, item });
    setAuditForm({
      review_status: item.review_status === 'pending_review' ? 'reviewed' : item.review_status,
      audit_notes: item.audit_notes || '',
      reviewed_by: currentUser?.name || 'المراجع المالي'
    });
  };

  const handleSaveAudit = async (e) => {
    e.preventDefault();
    if (!auditTarget) return;

    try {
      if (auditTarget.type === 'purchase') {
        await api.auditPurchase(auditTarget.item.id, auditForm);
      } else {
        await api.auditSale(auditTarget.item.id, auditForm);
      }
      alert('تم حفظ قرار التدقيق والمراجعة بنجاح');
      setAuditTarget(null);
      loadData();
    } catch (err) {
      alert(err.message || 'خطأ أثناء حفظ التدقيق');
    }
  };

  const handleAddLineItem = () => {
    if (!currentLineItem.product_id) {
      alert('الرجاء اختيار الجهاز');
      return;
    }
    const product = products.find(p => p.id === Number(currentLineItem.product_id));
    if (!product) return;

    // Parse serials
    const serialList = currentLineItem.serialsText
      .split(/[\n,]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const cost = Number(currentLineItem.cost_price) || product.cost_price;

    setPurchaseForm(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          product_id: product.id,
          product_name: product.name,
          model_number: product.model_number,
          cost_price: cost,
          serials: serialList
        }
      ]
    }));

    setCurrentLineItem({ product_id: '', cost_price: '', serialsText: '' });
  };

  const handleRemoveLineItem = (index) => {
    setPurchaseForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const calculatePurchaseTotal = () => {
    return purchaseForm.items.reduce((sum, it) => sum + (it.cost_price * (it.serials.length || 1)), 0);
  };

  const handleSavePurchase = async (e) => {
    e.preventDefault();
    if (!purchaseForm.supplier_id || !purchaseForm.warehouse_id) {
      alert('الرجاء اختيار المورد والمخزن المستقبل');
      return;
    }
    if (purchaseForm.items.length === 0) {
      alert('يجب إضافة أجهزة لفاتورة الشراء');
      return;
    }

    const total = calculatePurchaseTotal();
    const paid = purchaseForm.payment_type === 'cash' ? total : Number(purchaseForm.paid_amount) || 0;

    // Expand items to format expected by backend: array of { product_id, serial_number, cost_price }
    const expandedItems = [];
    for (const it of purchaseForm.items) {
      if (it.serials.length > 0) {
        for (const sn of it.serials) {
          expandedItems.push({
            product_id: it.product_id,
            serial_number: sn,
            cost_price: it.cost_price
          });
        }
      } else {
        // Auto-generate serial if empty
        const autoSerial = `SN-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
        expandedItems.push({
          product_id: it.product_id,
          serial_number: autoSerial,
          cost_price: it.cost_price
        });
      }
    }

    try {
      await api.createPurchase({
        supplier_id: Number(purchaseForm.supplier_id),
        warehouse_id: Number(purchaseForm.warehouse_id),
        invoice_no: purchaseForm.invoice_no || `SUP-${Date.now().toString().slice(-6)}`,
        subtotal: total,
        discount: 0,
        total: total,
        paid_amount: paid,
        items: expandedItems,
        notes: purchaseForm.notes
      });

      alert('تم تسجيل فاتورة الشراء وتوريد الأجهزة للمخزن بنجاح');
      setShowNewPurchaseModal(false);
      setPurchaseForm({
        supplier_id: suppliers[0]?.id || '',
        warehouse_id: warehouses[0]?.id || '',
        invoice_no: '',
        payment_type: 'cash',
        paid_amount: '',
        notes: '',
        items: []
      });
      loadData();
    } catch (err) {
      alert(err.message || 'خطأ أثناء تسجيل فاتورة الشراء');
    }
  };

  const handleViewPurchaseDetails = async (id) => {
    try {
      const p = await api.getPurchase(id);
      setSelectedPurchase(p);
    } catch (err) {
      alert('خطأ أثناء جلب تفاصيل الفاتورة');
    }
  };

  // Filtered Lists
  const filteredPurchases = purchases.filter(p => {
    const matchSearch = !searchQuery || 
      p.invoice_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.supplier_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterReviewStatus === 'all' || p.review_status === filterReviewStatus;
    return matchSearch && matchStatus;
  });

  const filteredSales = sales.filter(s => {
    const matchSearch = !searchQuery ||
      s.invoice_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.customer_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterReviewStatus === 'all' || s.review_status === filterReviewStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-blue-600" />
            نظام المشتريات والتوريدات ومراجعة الفواتير
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            تسجيل وتدقيق فواتير توريد الأجهزة من كبرى الشركات، إدخال السيريالات المخزنية، واعتماد الفواتير محاسبياً
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowNewPurchaseModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>تسجيل فاتورة شراء وتوريد جديدة</span>
          </button>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Navigation Tabs */}
        <div className="flex bg-slate-200/70 p-1 rounded-2xl text-xs font-bold max-w-md">
          <button
            onClick={() => setActiveTab('purchases')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'purchases' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>فواتير مشتريات الموردين ({purchases.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('sales_audit')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'sales_audit' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>مراجعة وتدقيق فواتير المبيعات ({sales.length})</span>
          </button>
        </div>

        {/* Filter by review status */}
        <div className="flex items-center gap-2 text-xs font-bold">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-slate-600">حالة التدقيق:</span>
          <select
            value={filterReviewStatus}
            onChange={(e) => setFilterReviewStatus(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold"
          >
            <option value="all">الكل</option>
            <option value="pending_review">⏳ قيد المراجعة</option>
            <option value="reviewed">✅ معتمدة ومطابقة</option>
            <option value="flagged">🚨 بها ملاحظات تدقيق</option>
          </select>

          <div className="relative w-48">
            <Search className="w-3.5 h-3.5 absolute right-3 top-2 text-slate-400" />
            <input
              type="text"
              placeholder="بحث برقم الفاتورة أو الاسم..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pr-8 pl-3 py-1.5 text-xs"
            />
          </div>
        </div>
      </div>

      {/* TAB 1: PURCHASES INVOICES */}
      {activeTab === 'purchases' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          {filteredPurchases.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Truck className="w-12 h-12 mx-auto mb-2 opacity-30 text-blue-500" />
              <p className="font-bold text-sm text-slate-700">لا توجد فواتير مشتريات مسجلة</p>
              <p className="text-xs text-slate-400 mt-1">اضغط على زر "تسجيل فاتورة شراء جديدة" لاستلام بضائع من الموردين</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">رقم الفاتورة</th>
                    <th className="p-3">التاريخ</th>
                    <th className="p-3">المورد والشركة</th>
                    <th className="p-3">المخزن المستقبل</th>
                    <th className="p-3 text-left">قيمة الفاتورة ({currency})</th>
                    <th className="p-3 text-left">المدفوع ({currency})</th>
                    <th className="p-3 text-center">الأجهزة الواردة</th>
                    <th className="p-3 text-center">حالة التدقيق</th>
                    <th className="p-3 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredPurchases.map((p) => {
                    const rev = p.review_status || 'pending_review';
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition">
                        <td className="p-3 font-mono font-bold text-blue-700">{p.invoice_no}</td>
                        <td className="p-3 text-slate-600 font-mono">{p.created_at?.slice(0, 10)}</td>
                        <td className="p-3">
                          <span className="font-bold text-slate-900 block">{p.supplier_name || 'مورد عام'}</span>
                          <span className="text-[10px] text-slate-400 block">{p.supplier_company}</span>
                        </td>
                        <td className="p-3 font-bold text-slate-700">{p.warehouse_name || 'المستودع الرئيسي'}</td>
                        <td className="p-3 text-left font-mono font-black text-slate-900" dir="ltr">
                          {Number(p.total).toLocaleString()}
                        </td>
                        <td className="p-3 text-left font-mono font-bold text-emerald-700" dir="ltr">
                          {Number(p.paid_amount || 0).toLocaleString()}
                        </td>
                        <td className="p-3 text-center">
                          <span className="bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-full">
                            {p.serials_count || 0} جهاز
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold ${
                            rev === 'reviewed' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                            rev === 'flagged' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                            'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                          }`}>
                            {rev === 'reviewed' ? '✅ معتمدة ومطابقة' :
                             rev === 'flagged' ? '🚨 ملاحظات تدقيق' : '⏳ قيد التدقيق'}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleViewPurchaseDetails(p.id)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                              title="عرض التفاصيل والأجهزة"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenAuditModal('purchase', p)}
                              className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] cursor-pointer flex items-center gap-1 border border-blue-200"
                              title="تدقيق واعتماد الفاتورة"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>تدقيق</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SALES INVOICES AUDIT */}
      {activeTab === 'sales_audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          {filteredSales.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <ShieldCheck className="w-12 h-12 mx-auto mb-2 opacity-30 text-emerald-600" />
              <p className="font-bold text-sm text-slate-700">لا توجد فواتير مبيعات مطابقة</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">رقم الفاتورة</th>
                    <th className="p-3">التاريخ</th>
                    <th className="p-3">العميل</th>
                    <th className="p-3">طريقة البيع</th>
                    <th className="p-3 text-left">الإجمالي ({currency})</th>
                    <th className="p-3 text-left">المدفوع ({currency})</th>
                    <th className="p-3 text-left">المتبقي ({currency})</th>
                    <th className="p-3 text-center">حالة المراجعة</th>
                    <th className="p-3 text-center">المراجع</th>
                    <th className="p-3 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredSales.map((s) => {
                    const rev = s.review_status || 'pending_review';
                    return (
                      <tr key={s.id} className="hover:bg-slate-50/70 transition">
                        <td className="p-3 font-mono font-bold text-blue-700">{s.invoice_no}</td>
                        <td className="p-3 font-mono text-slate-500">{s.created_at?.slice(0, 10)}</td>
                        <td className="p-3">
                          <span className="font-bold text-slate-900 block">{s.customer_name || 'عميل نقدي'}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{s.customer_phone}</span>
                        </td>
                        <td className="p-3">
                          <span className="font-bold">
                            {s.sale_type === 'cash' ? 'نقدي' : s.sale_type === 'installment' ? 'تقسيط' : 'شركة تمويل'}
                          </span>
                        </td>
                        <td className="p-3 text-left font-mono font-black text-slate-900" dir="ltr">
                          {Number(s.total).toLocaleString()}
                        </td>
                        <td className="p-3 text-left font-mono font-bold text-emerald-700" dir="ltr">
                          {Number(s.paid_amount || 0).toLocaleString()}
                        </td>
                        <td className="p-3 text-left font-mono font-bold text-rose-600" dir="ltr">
                          {Number(s.remaining_amount || 0).toLocaleString()}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold ${
                            rev === 'reviewed' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                            rev === 'flagged' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                            'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                          }`}>
                            {rev === 'reviewed' ? '✅ معتمدة' :
                             rev === 'flagged' ? '🚨 ملاحظات تدقيق' : '⏳ قيد التدقيق'}
                          </span>
                        </td>
                        <td className="p-3 text-center text-slate-500 text-[11px]">
                          {s.reviewed_by || '-'}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleOpenAuditModal('sale', s)}
                            className="px-3 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] cursor-pointer flex items-center justify-center gap-1 border border-blue-200 mx-auto"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>تدقيق ومراجعة</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL: CREATE NEW PURCHASE INVOICE */}
      {showNewPurchaseModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full p-6 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-800">فاتورة توريد وشراء أجهزة جديدة</h3>
                  <p className="text-xs text-slate-500">إدخال بضائع من الشركات الموزعة مع تسجيل السيريالات وتوزيعها على المخازن</p>
                </div>
              </div>
              <button onClick={() => setShowNewPurchaseModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePurchase} className="space-y-4 flex-1 overflow-y-auto pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">الشركة / المورد *</label>
                  <select
                    required
                    value={purchaseForm.supplier_id}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, supplier_id: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                  >
                    <option value="">اختر المورد...</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.company || 'موزع'})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">المستودع المستقبل *</label>
                  <select
                    required
                    value={purchaseForm.warehouse_id}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, warehouse_id: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                  >
                    <option value="">اختر المستودع...</option>
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name} ({w.branch_name || 'مركزي'})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">رقم فاتورة المورد</label>
                  <input
                    type="text"
                    placeholder="مثال: LG-INV-9921"
                    value={purchaseForm.invoice_no}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, invoice_no: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Line Item Adder */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2 text-xs">
                <span className="font-bold text-slate-700 block">إضافة أجهزة للفاتورة:</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] text-slate-500 mb-1">الجهاز الكهربائي</label>
                    <select
                      value={currentLineItem.product_id}
                      onChange={(e) => {
                        const pId = e.target.value;
                        const pr = products.find(p => p.id === Number(pId));
                        setCurrentLineItem({
                          ...currentLineItem,
                          product_id: pId,
                          cost_price: pr ? pr.cost_price : ''
                        });
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold"
                    >
                      <option value="">اختر الجهاز الكهربائي...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.model_number})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">سعر التكلفة للقطعة ({currency})</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={currentLineItem.cost_price}
                      onChange={(e) => setCurrentLineItem({ ...currentLineItem, cost_price: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">
                    أرقام السيريال للأجهزة الواردة (افصل بفواصل أو أسطر جديدة - أو اتركها فارغة للتوليد الآلي)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="SN100293, SN100294, SN100295..."
                    value={currentLineItem.serialsText}
                    onChange={(e) => setCurrentLineItem({ ...currentLineItem, serialsText: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-mono text-xs"
                    dir="ltr"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddLineItem}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl cursor-pointer"
                  >
                    + إضافة الجهاز للفاتورة
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="border border-slate-200 rounded-2xl p-3 bg-white text-xs">
                <span className="font-bold text-slate-700 block mb-2">الأجهزة المسجلة بالفاتورة:</span>
                {purchaseForm.items.length === 0 ? (
                  <p className="text-center py-4 text-slate-400">لم تقم بإضافة أي أجهزة بعد</p>
                ) : (
                  <div className="space-y-2">
                    {purchaseForm.items.map((it, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                        <div>
                          <span className="font-bold text-slate-900 block">{it.product_name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">موديل: {it.model_number} | سعر التكلفة: {it.cost_price} {currency}</span>
                          {it.serials.length > 0 && (
                            <span className="text-[10px] text-blue-700 font-mono block mt-0.5" dir="ltr">
                              السيريالات: {it.serials.join(', ')}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="bg-blue-100 text-blue-800 font-black px-2.5 py-1 rounded-lg font-mono">
                            {it.serials.length || 1} جهاز = {Number(it.cost_price * (it.serials.length || 1)).toLocaleString()} {currency}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveLineItem(idx)}
                            className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Financial Summary & Payment */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">طريقة سداد المورد</label>
                  <select
                    value={purchaseForm.payment_type}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, payment_type: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold"
                  >
                    <option value="cash">نقداً من الخزينة الرئيسية</option>
                    <option value="bank">تحويل بنكي من الحساب</option>
                    <option value="credit">آجل (على حساب المورد)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">المبلغ المسدد الآن</label>
                  <input
                    type="number"
                    placeholder={calculatePurchaseTotal().toString()}
                    value={purchaseForm.paid_amount}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, paid_amount: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">إجمالي الفاتورة</label>
                  <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 font-black text-sm text-blue-900 font-mono">
                    {calculatePurchaseTotal().toLocaleString()} {currency}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNewPurchaseModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={purchaseForm.items.length === 0}
                  className={`px-6 py-2.5 rounded-xl font-bold text-xs text-white shadow-md transition cursor-pointer ${
                    purchaseForm.items.length === 0 ? 'bg-slate-300 cursor-not-allowed shadow-none' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  تأكيد وحفظ فاتورة الشراء وتوريد الأجهزة للمخزن
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIEW PURCHASE DETAILS */}
      {selectedPurchase && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <h3 className="font-black text-base text-slate-800">تفاصيل فاتورة التوريد والشراء</h3>
                <p className="text-xs text-blue-700 font-mono font-bold mt-0.5">{selectedPurchase.invoice_no}</p>
              </div>
              <button onClick={() => setSelectedPurchase(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto pr-1 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[11px]">المورد:</span>
                  <span className="font-bold text-slate-900">{selectedPurchase.supplier_name} ({selectedPurchase.supplier_company})</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">المستودع المستلم:</span>
                  <span className="font-bold text-slate-900">{selectedPurchase.warehouse_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">إجمالي الفاتورة:</span>
                  <span className="font-black text-slate-900 font-mono">{Number(selectedPurchase.total).toLocaleString()} {currency}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">المدفوع للمورد:</span>
                  <span className="font-black text-emerald-700 font-mono">{Number(selectedPurchase.paid_amount).toLocaleString()} {currency}</span>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-700 block mb-2">الأجهزة والسيريالات الواردة ({selectedPurchase.items?.length || 0}):</span>
                <div className="space-y-1.5 max-h-52 overflow-y-auto">
                  {selectedPurchase.items?.map((it, idx) => (
                    <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900">{it.product_name}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-blue-700 font-bold" dir="ltr">
                            {it.serial_number}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">موديل: {it.model_number}</span>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-slate-800">{Number(it.cost_price).toLocaleString()} {currency}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: INVOICE AUDIT / REVIEW */}
      {auditTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-800">
                    تدقيق ومراجعة فاتورة {auditTarget.type === 'purchase' ? 'شراء' : 'بيع'}
                  </h3>
                  <p className="text-xs text-blue-700 font-mono font-bold">{auditTarget.item.invoice_no}</p>
                </div>
              </div>
              <button onClick={() => setAuditTarget(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAudit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">قرار التدقيق والمطابقة *</label>
                <select
                  value={auditForm.review_status}
                  onChange={(e) => setAuditForm({ ...auditForm, review_status: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-bold"
                >
                  <option value="reviewed">✅ معتمدة ومطابقة محاسبياً ومخزنياً</option>
                  <option value="flagged">🚨 بها ملاحظات تدقيق / غير مطابقة</option>
                  <option value="pending_review">⏳ إعادة لطور قيد المراجعة</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">اسم المراجع المالي</label>
                <input
                  type="text"
                  required
                  value={auditForm.reviewed_by}
                  onChange={(e) => setAuditForm({ ...auditForm, reviewed_by: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">ملاحظات التدقيق والمراجعة</label>
                <textarea
                  rows={3}
                  placeholder="مثال: تم مطابقة الفاتورة مع أصل الإذن المخزني وسلامة السيريالات وقيد الخزينة..."
                  value={auditForm.audit_notes}
                  onChange={(e) => setAuditForm({ ...auditForm, audit_notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setAuditTarget(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md cursor-pointer"
                >
                  اعتماد وتثبيت التدقيق
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
