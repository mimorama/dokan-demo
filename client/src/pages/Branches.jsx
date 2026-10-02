import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Warehouse, 
  ArrowLeftRight, 
  Plus, 
  Search, 
  MapPin, 
  Phone, 
  User, 
  Package, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  FileText, 
  Printer, 
  X,
  Layers,
  ArrowRight,
  ClipboardList,
  Check,
  Clock,
  AlertTriangle,
  ShieldCheck,
  Sparkles,
  Trash2,
  Scan,
  Edit2,
  Lock
} from 'lucide-react';
import { api } from '../api';
import CycleCountModal from '../components/CycleCountModal';
import TransferPrint from '../components/TransferPrint';

export default function Branches({ settings, currentUser, onPrintTransfer, initialTab }) {
  const [activeTab, setActiveTab] = useState(initialTab || 'branches'); // 'branches', 'warehouses', 'transfers', 'requests', 'matrix'
  const [localPrintTransfer, setLocalPrintTransfer] = useState(null);
  const [branches, setBranches] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [stockRequests, setStockRequests] = useState([]);
  const [showCycleCountModal, setShowCycleCountModal] = useState(false);
  const [inventoryMatrix, setInventoryMatrix] = useState({ products: [], warehouses: [] });
  const [allProductsList, setAllProductsList] = useState([]);
  const [loading, setLoading] = useState(true);

  const handlePrintTransfer = (t) => {
    if (onPrintTransfer) {
      onPrintTransfer(t);
    } else {
      setLocalPrintTransfer(t);
    }
  };

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Modals
  const [showAddBranchModal, setShowAddBranchModal] = useState(false);
  const [showAddWarehouseModal, setShowAddWarehouseModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [printShortageRequest, setPrintShortageRequest] = useState(null);
  const [selectedWarehouseSerials, setSelectedWarehouseSerials] = useState(null);
  const [warehouseSerialsList, setWarehouseSerialsList] = useState([]);

  // Forms
  const [branchForm, setBranchForm] = useState({
    name: '', code: '', phone: '', address: '', manager_name: '', is_main: false, notes: ''
  });

  const [warehouseForm, setWarehouseForm] = useState({
    branch_id: '', name: '', code: '', location: '', manager_name: '', phone: '', is_default: false, notes: ''
  });

  // Shortage Request Form
  const [requestForm, setRequestForm] = useState({
    branch_id: '',
    from_warehouse_id: '',
    requested_by: 'مسؤول المعرض',
    urgency: 'normal',
    notes: '',
    items: []
  });
  const [reqSelectedItem, setReqSelectedItem] = useState({ product_id: '', quantity: 1, notes: '' });

  // Matrix Filter State
  const [matrixSearch, setMatrixSearch] = useState('');
  const [matrixCategory, setMatrixCategory] = useState('all');

  // Transfer Wizard State
  const [fromWarehouseId, setFromWarehouseId] = useState('');
  const [toWarehouseId, setToWarehouseId] = useState('');
  const [transferMode, setTransferMode] = useState('quantity'); // 'quantity' or 'serials'
  const [productQuantities, setProductQuantities] = useState({}); // { [productId]: quantity }
  const [sourceSerials, setSourceSerials] = useState([]);
  const [selectedSerialIds, setSelectedSerialIds] = useState([]);
  const [transferNotes, setTransferNotes] = useState('');
  const [transferCreatedBy, setTransferCreatedBy] = useState('مسؤول المخزن');
  const [transferSearch, setTransferSearch] = useState('');

  // Transfer View / Edit / Delete Modals & Manager PIN
  const [viewTransferModal, setViewTransferModal] = useState(null);
  const [editTransferModal, setEditTransferModal] = useState(null);
  const [deleteTransferModal, setDeleteTransferModal] = useState(null);
  const [managerPin, setManagerPin] = useState('');
  const [managerName, setManagerName] = useState(currentUser?.name || 'مدير الفرع');
  const [deleteReason, setDeleteReason] = useState('إلغاء وعكس إذن التحويل');

  const currency = settings?.currency || 'ج.م';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bData, wData, tData, rData, mData, pData] = await Promise.all([
        api.getBranches().catch(() => []),
        api.getWarehouses().catch(() => []),
        api.getStockTransfers().catch(() => []),
        api.getStockRequests().catch(() => []),
        api.getInventoryMatrix().catch(() => ({ products: [], warehouses: [] })),
        api.getProducts().catch(() => [])
      ]);
      setBranches(bData);
      setWarehouses(wData);
      setTransfers(tData);
      setStockRequests(rData);
      setInventoryMatrix(mData);
      setAllProductsList(pData);

      if (wData.length > 0 && !fromWarehouseId) {
        setFromWarehouseId(wData[0].id);
        if (wData.length > 1) {
          setToWarehouseId(wData[1].id);
        }
      }

      if (bData.length > 0 && !requestForm.branch_id) {
        setRequestForm(prev => ({ ...prev, branch_id: bData[0].id, from_warehouse_id: wData[0]?.id || '' }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!requestForm.branch_id) {
      alert('الرجاء اختيار الفرع الطالب');
      return;
    }
    if (requestForm.items.length === 0) {
      alert('يجب إضافة صنف واحد على الأقل لطلب النواقص');
      return;
    }

    try {
      await api.createStockRequest(requestForm);
      alert('تم إرسال طلب النواقص والإمداد إلى المستودع بنجاح');
      setShowNewRequestModal(false);
      setRequestForm({
        branch_id: branches[0]?.id || '',
        from_warehouse_id: warehouses[0]?.id || '',
        requested_by: 'مسؤول المعرض',
        urgency: 'normal',
        notes: '',
        items: []
      });
      loadData();
    } catch (err) {
      alert(err.message || 'خطأ أثناء إرسال طلب النواقص');
    }
  };

  const handleUpdateRequestStatus = async (reqId, status) => {
    const confirmMsg = status === 'fulfilled' 
      ? 'هل تم توريد وتسليم هذه النواقص للفرع بالفعل؟'
      : status === 'approved'
      ? 'الموافقة على طلب النواقص وتجهيزه للصرف؟'
      : 'رفض طلب النواقص؟';
    if (!window.confirm(confirmMsg)) return;

    try {
      await api.updateStockRequestStatus(reqId, status);
      loadData();
    } catch (err) {
      alert(err.message || 'خطأ أثناء تحديث حالة الطلب');
    }
  };

  const addItemToRequest = () => {
    if (!reqSelectedItem.product_id) {
      alert('الرجاء اختيار الجهاز المطلوب');
      return;
    }
    const product = allProductsList.find(p => p.id === Number(reqSelectedItem.product_id));
    if (!product) return;

    setRequestForm(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          product_id: product.id,
          product_name: product.name,
          model_number: product.model_number,
          quantity: Number(reqSelectedItem.quantity) || 1,
          notes: reqSelectedItem.notes
        }
      ]
    }));

    setReqSelectedItem({ product_id: '', quantity: 1, notes: '' });
  };

  const removeItemFromRequest = (index) => {
    setRequestForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  // Load serials when fromWarehouseId changes in transfer modal
  useEffect(() => {
    if (fromWarehouseId && showTransferModal) {
      loadSourceSerials(fromWarehouseId);
    }
  }, [fromWarehouseId, showTransferModal]);

  const loadSourceSerials = async (whId) => {
    try {
      const data = await api.getWarehouseSerials(whId);
      setSourceSerials(data);
      setSelectedSerialIds([]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenWarehouseSerials = async (wh) => {
    setSelectedWarehouseSerials(wh);
    try {
      const serials = await api.getWarehouseSerials(wh.id);
      setWarehouseSerialsList(serials);
    } catch (err) {
      alert('خطأ أثناء جلب سيريالات المخزن');
    }
  };

  const handleSaveBranch = async (e) => {
    e.preventDefault();
    try {
      await api.createBranch(branchForm);
      setShowAddBranchModal(false);
      setBranchForm({ name: '', code: '', phone: '', address: '', manager_name: '', is_main: false, notes: '' });
      loadData();
    } catch (err) {
      alert(err.message || 'خطأ أثناء حفظ الفرع');
    }
  };

  const handleSaveWarehouse = async (e) => {
    e.preventDefault();
    try {
      await api.createWarehouse(warehouseForm);
      setShowAddWarehouseModal(false);
      setWarehouseForm({ branch_id: '', name: '', code: '', location: '', manager_name: '', phone: '', is_default: false, notes: '' });
      loadData();
    } catch (err) {
      alert(err.message || 'خطأ أثناء حفظ المخزن');
    }
  };

  const sourceProductsGrouped = React.useMemo(() => {
    const map = {};
    sourceSerials.forEach(s => {
      if (!map[s.product_id]) {
        map[s.product_id] = {
          product_id: s.product_id,
          product_name: s.product_name,
          model_number: s.model_number,
          cash_price: s.cash_price,
          brand_name: s.brand_name,
          available_count: 0
        };
      }
      map[s.product_id].available_count += 1;
    });
    return Object.values(map);
  }, [sourceSerials]);

  const updateProductQuantity = (productId, delta, maxAvailable) => {
    setProductQuantities(prev => {
      const current = Number(prev[productId]) || 0;
      const next = Math.max(0, Math.min(maxAvailable, current + delta));
      return { ...prev, [productId]: next };
    });
  };

  const setDirectProductQuantity = (productId, val, maxAvailable) => {
    const num = Math.max(0, Math.min(maxAvailable, Number(val) || 0));
    setProductQuantities(prev => ({ ...prev, [productId]: num }));
  };

  const totalQuantitySelected = transferMode === 'quantity'
    ? Object.values(productQuantities).reduce((sum, q) => sum + (Number(q) || 0), 0)
    : selectedSerialIds.length;

  const handleExecuteTransfer = async (e) => {
    e.preventDefault();
    if (!fromWarehouseId || !toWarehouseId) {
      alert('الرجاء اختيار المخزن المصدر والمستقبل');
      return;
    }
    if (Number(fromWarehouseId) === Number(toWarehouseId)) {
      alert('لا يمكن التحويل لنفس المخزن!');
      return;
    }

    if (transferMode === 'quantity') {
      const items = Object.entries(productQuantities)
        .filter(([_, qty]) => Number(qty) > 0)
        .map(([pid, qty]) => ({ product_id: Number(pid), quantity: Number(qty) }));

      if (items.length === 0) {
        alert('يجب تحديد كمية صالحة لجهاز واحد على الأقل للتحويل');
        return;
      }

      try {
        await api.transferStock({
          from_warehouse_id: Number(fromWarehouseId),
          to_warehouse_id: Number(toWarehouseId),
          items,
          notes: transferNotes,
          created_by: transferCreatedBy
        });

        alert('تم تنفيذ إذن التحويل المخزني بنجاح بالكميات المحددة وتحديث الأرصدة');
        setShowTransferModal(false);
        setProductQuantities({});
        setSelectedSerialIds([]);
        setTransferNotes('');
        loadData();
      } catch (err) {
        alert(err.message || 'خطأ أثناء تنفيذ التحويل المخزني');
      }
    } else {
      if (selectedSerialIds.length === 0) {
        alert('يجب تحديد جهاز واحد على الأقل للتحويل');
        return;
      }

      try {
        await api.transferStock({
          from_warehouse_id: Number(fromWarehouseId),
          to_warehouse_id: Number(toWarehouseId),
          serial_ids: selectedSerialIds,
          notes: transferNotes,
          created_by: transferCreatedBy
        });

        alert('تم تنفيذ إذن التحويل المخزني بنجاح وتحديث مواقع الأجهزة');
        setShowTransferModal(false);
        setSelectedSerialIds([]);
        setProductQuantities({});
        setTransferNotes('');
        loadData();
      } catch (err) {
        alert(err.message || 'خطأ أثناء تنفيذ التحويل المخزني');
      }
    }
  };

  const handleOpenEditTransfer = (t) => {
    const itemsMap = new Map();
    if (t.items && Array.isArray(t.items)) {
      for (const it of t.items) {
        if (!itemsMap.has(it.product_id)) {
          itemsMap.set(it.product_id, {
            product_id: it.product_id,
            product_name: it.product_name || 'جهاز كهربائي',
            model_number: it.model_number || '',
            quantity: 1,
            serials: it.serial_number ? [it.serial_number] : []
          });
        } else {
          const existing = itemsMap.get(it.product_id);
          existing.quantity += 1;
          if (it.serial_number) existing.serials.push(it.serial_number);
        }
      }
    }
    const transferItems = Array.from(itemsMap.values());

    setEditTransferModal({
      ...t,
      from_warehouse_id: t.from_warehouse_id,
      to_warehouse_id: t.to_warehouse_id,
      transfer_items: transferItems.length > 0 ? transferItems : [{
        product_id: t.product_id || (allProductsList[0]?.id || 1),
        product_name: t.product_name || allProductsList[0]?.name || 'جهاز كهربائي',
        model_number: t.model_number || '',
        quantity: t.total_items || 1,
        serials: []
      }],
      add_product_id: '',
      add_product_qty: 1
    });
    setManagerPin('');
  };

  const handleUpdateEditItemQty = (prodId, delta) => {
    setEditTransferModal(prev => {
      if (!prev) return null;
      const updated = (prev.transfer_items || []).map(it => {
        if (it.product_id === prodId) {
          const newQty = Math.max(1, Number(it.quantity) + delta);
          return { ...it, quantity: newQty };
        }
        return it;
      });
      return { ...prev, transfer_items: updated };
    });
  };

  const handleSetEditItemQty = (prodId, qty) => {
    const parsed = Math.max(1, parseInt(qty) || 1);
    setEditTransferModal(prev => {
      if (!prev) return null;
      const updated = (prev.transfer_items || []).map(it => {
        if (it.product_id === prodId) {
          return { ...it, quantity: parsed };
        }
        return it;
      });
      return { ...prev, transfer_items: updated };
    });
  };

  const handleRemoveEditItem = (prodId) => {
    if ((editTransferModal?.transfer_items || []).length <= 1) {
      alert('يجب الإبقاء على صنف واحد على الأقل في إذن التحويل');
      return;
    }
    setEditTransferModal(prev => {
      if (!prev) return null;
      return {
        ...prev,
        transfer_items: (prev.transfer_items || []).filter(it => it.product_id !== prodId)
      };
    });
  };

  const handleAddProductToEditTransfer = () => {
    if (!editTransferModal?.add_product_id) {
      alert('يرجى اختيار الصنف المطلوب إضافته للإذن');
      return;
    }
    const pId = Number(editTransferModal.add_product_id);
    const addQty = Math.max(1, parseInt(editTransferModal.add_product_qty) || 1);
    const prodObj = allProductsList.find(p => p.id === pId);

    setEditTransferModal(prev => {
      if (!prev) return null;
      const items = [...(prev.transfer_items || [])];
      const existingIndex = items.findIndex(it => it.product_id === pId);

      if (existingIndex >= 0) {
        items[existingIndex] = {
          ...items[existingIndex],
          quantity: items[existingIndex].quantity + addQty
        };
      } else {
        items.push({
          product_id: pId,
          product_name: prodObj?.name || 'جهاز جديد',
          model_number: prodObj?.model_number || '',
          quantity: addQty,
          serials: []
        });
      }

      return {
        ...prev,
        transfer_items: items,
        add_product_id: '',
        add_product_qty: 1
      };
    });
  };

  const handleSaveEditTransfer = async (e) => {
    e.preventDefault();
    if (!editTransferModal) return;

    if (Number(editTransferModal.from_warehouse_id) === Number(editTransferModal.to_warehouse_id)) {
      alert('لا يمكن أن يكون المخزن المصدر هو نفس المخزن المستقبل');
      return;
    }

    const validItems = (editTransferModal.transfer_items || []).filter(it => Number(it.quantity) > 0);
    if (validItems.length === 0) {
      alert('يجب أن يحتوي إذن التحويل على صنف واحد على الأقل بكمية صالحة');
      return;
    }

    try {
      const res = await api.updateStockTransfer(editTransferModal.id, {
        from_warehouse_id: Number(editTransferModal.from_warehouse_id),
        to_warehouse_id: Number(editTransferModal.to_warehouse_id),
        items: validItems.map(it => ({
          product_id: it.product_id,
          quantity: Number(it.quantity)
        })),
        notes: editTransferModal.notes,
        transfer_date: editTransferModal.transfer_date,
        created_by: editTransferModal.created_by,
        manager_pin: managerPin,
        manager_name: managerName || currentUser?.name || 'مدير الفرع'
      });
      alert(res?.message || 'تم حفظ تعديل إذن التحويل بنجاح');
      setEditTransferModal(null);
      setManagerPin('');
      loadData();
    } catch (err) {
      alert(err.message || 'خطأ أثناء تعديل إذن التحويل');
    }
  };

  const handleDeleteTransfer = async (e) => {
    e.preventDefault();
    if (!deleteTransferModal) return;
    try {
      await api.deleteStockTransfer(deleteTransferModal.id, {
        manager_pin: managerPin,
        manager_name: managerName || currentUser?.name || 'المدير العام',
        reason: deleteReason || 'إلغاء وعكس إذن التحويل'
      });
      alert('تم إلغاء وعكس إذن التحويل بنجاح وإعادة الأجهزة للمخزن المصدر');
      setDeleteTransferModal(null);
      setManagerPin('');
      setDeleteReason('');
      loadData();
    } catch (err) {
      alert(err.message || 'خطأ أثناء إلغاء التحويل');
    }
  };

  const toggleSelectSerial = (sId) => {
    if (selectedSerialIds.includes(sId)) {
      setSelectedSerialIds(selectedSerialIds.filter(id => id !== sId));
    } else {
      setSelectedSerialIds([...selectedSerialIds, sId]);
    }
  };

  const selectAllSourceSerials = () => {
    if (selectedSerialIds.length === filteredSourceSerials.length) {
      setSelectedSerialIds([]);
    } else {
      setSelectedSerialIds(filteredSourceSerials.map(s => s.id));
    }
  };

  const filteredSourceSerials = sourceSerials.filter(s => 
    !transferSearch || 
    s.product_name?.toLowerCase().includes(transferSearch.toLowerCase()) ||
    s.serial_number?.toLowerCase().includes(transferSearch.toLowerCase()) ||
    s.model_number?.toLowerCase().includes(transferSearch.toLowerCase())
  );

  const filteredSourceProducts = sourceProductsGrouped.filter(p =>
    !transferSearch ||
    p.product_name?.toLowerCase().includes(transferSearch.toLowerCase()) ||
    p.model_number?.toLowerCase().includes(transferSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600" />
            نظام الفروع والمستودعات والمخازن التابعة
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            إدارة شبكة فروع المعرض، مخازن صالات العرض والمستودعات المركزية، وتتبع حركة نقل الأجهزة بين المخازن
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowNewRequestModal(true)}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <ClipboardList className="w-4 h-4" />
            <span>عمل طلب نواقص وإمداد</span>
          </button>

          <button
            onClick={() => {
              if (warehouses.length > 0) {
                setFromWarehouseId(warehouses[0].id);
                loadSourceSerials(warehouses[0].id);
              }
              setShowTransferModal(true);
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>إذن تحويل بضائع بين المخازن</span>
          </button>

          <button
            onClick={() => setShowCycleCountModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <Scan className="w-4 h-4" />
            <span>جرد دوري بالباركود (مطابقة المخزون)</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap bg-slate-200/70 p-1 rounded-2xl text-xs font-bold gap-1">
        <button
          onClick={() => setActiveTab('branches')}
          className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'branches' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>الفروع ({branches.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('warehouses')}
          className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'warehouses' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Warehouse className="w-4 h-4" />
          <span>المخازن والمستودعات ({warehouses.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('transfers')}
          className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'transfers' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4" />
          <span>سجل التحويلات ({transfers.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'requests' ? 'bg-white text-rose-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>طلبات النواقص والإمداد ({stockRequests.length})</span>
          {stockRequests.filter(r => r.status === 'pending').length > 0 && (
            <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {stockRequests.filter(r => r.status === 'pending').length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('matrix')}
          className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'matrix' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>خريطة تتبع المخزون اللحظية</span>
        </button>
      </div>

      {/* TAB 1: BRANCHES */}
      {activeTab === 'branches' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500 font-bold">قائمة فروع معرض دكان عبد العزيز:</span>
            <button
              onClick={() => setShowAddBranchModal(true)}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl font-bold text-xs shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة فرع جديد</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {branches.map((b) => (
              <div key={b.id} className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:border-blue-400 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-sm text-slate-800">{b.name}</h3>
                      {b.is_main === 1 && (
                        <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-md border border-amber-300">
                          الفرع الرئيسي
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 font-bold mt-0.5 block">{b.code}</span>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{b.address || 'العنوان غير مدون'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span dir="ltr">{b.phone || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>المدير: {b.manager_name || 'غير محدد'}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700 bg-slate-50 -mx-5 -mb-5 p-3 rounded-b-2xl">
                  <div>
                    <span className="text-[11px] text-slate-400 block">المخازن التابعة:</span>
                    <span>{b.warehouses_count} مخازن</span>
                  </div>
                  <div className="text-left">
                    <span className="text-[11px] text-slate-400 block">إجمالي المبيعات:</span>
                    <span className="text-emerald-700" dir="ltr">{Number(b.total_sales_amount || 0).toLocaleString()} {currency}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: WAREHOUSES */}
      {activeTab === 'warehouses' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500 font-bold">المخازن والمستودعات المسجلة:</span>
            <button
              onClick={() => setShowAddWarehouseModal(true)}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl font-bold text-xs shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة مخزن جديد</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {warehouses.map((w) => (
              <div key={w.id} className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-800">{w.name}</h4>
                      <p className="text-[11px] text-blue-600 font-bold mt-0.5">فرع: {w.branch_name || 'مركزي'}</p>
                    </div>
                    {w.is_default === 1 && (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                        افتراضي
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
                    <p>📍 {w.location || 'الموقع غير مدون'}</p>
                    <p>👤 أمين المخزن: {w.manager_name || 'غير محدد'}</p>
                    <p>📞 {w.phone || '-'}</p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">الأجهزة بالمخزن:</span>
                    <span className="font-black text-slate-900 bg-blue-50 px-2 py-0.5 rounded text-blue-700">
                      {w.items_count} جهاز
                    </span>
                  </div>

                  <button
                    onClick={() => handleOpenWarehouseSerials(w)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>عرض السيريالات المخزنة</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: STOCK TRANSFERS */}
      {activeTab === 'transfers' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-blue-600" />
                سجل أذونات التحويل المخزني بين الفروع
              </h3>
              <span className="text-xs text-slate-500">إجمالي {transfers.length} عملية نقل</span>
            </div>

            {transfers.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <ArrowLeftRight className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="font-bold text-sm">لا توجد عمليات تحويل مخزني سابقة</p>
                <p className="text-xs mt-1">اضغط على زر "إذن تحويل بضائع" بالأعلى لنقل أجهزة بين المخازن</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">رقم الإذن</th>
                      <th className="p-3">التاريخ</th>
                      <th className="p-3">من مخزن</th>
                      <th className="p-3">إلى مخزن</th>
                      <th className="p-3 text-center">عدد الأجهزة</th>
                      <th className="p-3">المسؤول</th>
                      <th className="p-3">ملاحظات</th>
                      <th className="p-3 text-center">إجراءات التحويل</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {transfers.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/70">
                        <td className="p-3 font-mono font-bold text-blue-700">{t.transfer_no}</td>
                        <td className="p-3">{t.transfer_date}</td>
                        <td className="p-3 font-bold text-slate-800">
                          {t.from_warehouse_name}
                          <span className="block text-[10px] text-slate-400 font-normal">{t.from_branch_name}</span>
                        </td>
                        <td className="p-3 font-bold text-emerald-700">
                          {t.to_warehouse_name}
                          <span className="block text-[10px] text-slate-400 font-normal">{t.to_branch_name}</span>
                        </td>
                        <td className="p-3 text-center">
                          <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                            {t.total_items}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600">{t.created_by}</td>
                        <td className="p-3 text-slate-400">{t.notes || '-'}</td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setViewTransferModal(t)}
                              title="مشاهدة وتدقيق تفاصيل إذن التحويل"
                              className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition cursor-pointer flex items-center gap-1 font-bold text-[11px]"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>مشاهدة</span>
                            </button>
                            <button
                              onClick={() => handlePrintTransfer(t)}
                              title="طباعة إذن التحويل المخزني الرسمي (A4)"
                              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition cursor-pointer flex items-center gap-1 font-bold text-[11px]"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>طباعة</span>
                            </button>
                            <button
                              onClick={() => handleOpenEditTransfer(t)}
                              title="تعديل بيانات وملاحظات التحويل (بموافقة المدير)"
                              className="p-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition cursor-pointer flex items-center gap-1 font-bold text-[11px]"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>تعديل</span>
                            </button>
                            <button
                              onClick={() => {
                                setDeleteTransferModal(t);
                                setManagerPin('');
                                setDeleteReason('إلغاء وعكس إذن التحويل وإرجاع الأجهزة للمخزن المصدر');
                              }}
                              title="إلغاء وحذف التحويل وإرجاع الأجهزة لمخزنها الأصلي (بموافقة المدير)"
                              className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 transition cursor-pointer flex items-center gap-1 font-bold text-[11px]"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>إلغاء/حذف</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: SHORTAGE & SUPPLY REQUESTS (طلبات النواقص) */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200">
            <div>
              <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-rose-600" />
                طلبات النواقص والإمداد بين الفروع والمخازن
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                متابعة احتياجات صالات العرض وإرسال طلبات تعزيز المخزون إلى المستودعات المركزية
              </p>
            </div>
            <button
              onClick={() => setShowNewRequestModal(true)}
              className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-md transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إنشاء طلب نواقص جديد</span>
            </button>
          </div>

          {stockRequests.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
              <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30 text-rose-500" />
              <p className="font-bold text-sm text-slate-700">لا توجد طلبات نواقص مسجلة حالياً</p>
              <p className="text-xs text-slate-400 mt-1">اضغط على زر "إنشاء طلب نواقص جديد" لطلب أجهزة من المستودع للفرع</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stockRequests.map((req) => (
                <div key={req.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-black text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                        {req.request_no}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-slate-800">فرع: {req.branch_name}</span>
                          <span className="text-xs text-slate-400">⬅</span>
                          <span className="text-xs font-bold text-slate-600">المستودع المزوّد: {req.from_warehouse_name}</span>
                        </div>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          الطالب: {req.requested_by} | التاريخ: {req.created_at?.slice(0, 10)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Urgency Badge */}
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                        req.urgency === 'critical' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                        req.urgency === 'urgent' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {req.urgency === 'critical' ? '🚨 عاجل جداً' : req.urgency === 'urgent' ? '⚡ عاجل' : 'عادي'}
                      </span>

                      {/* Status Badge */}
                      <span className={`px-3 py-1 rounded-lg text-xs font-extrabold ${
                        req.status === 'fulfilled' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                        req.status === 'approved' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                        req.status === 'rejected' ? 'bg-slate-200 text-slate-700' :
                        'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                      }`}>
                        {req.status === 'fulfilled' ? '✅ تم التوريد والاستلام' :
                         req.status === 'approved' ? '📦 تمت الموافقة والتجهيز' :
                         req.status === 'rejected' ? '❌ مرفوض' : '⏳ قيد المراجعة'}
                      </span>

                      {/* Print Button (Requirement 3) */}
                      <button
                        type="button"
                        onClick={() => setPrintShortageRequest(req)}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-300 transition cursor-pointer"
                        title="طباعة إذن وطلب النواقص الرسمي"
                      >
                        <Printer className="w-3.5 h-3.5 text-blue-600" />
                        <span>طباعة طلب النواقص</span>
                      </button>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="py-3">
                    <span className="text-[11px] font-bold text-slate-500 block mb-2">الأجهزة المطلوبة:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {req.items?.map((it, idx) => (
                        <div key={idx} className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-slate-800 block">{it.product_name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">موديل: {it.model_number}</span>
                          </div>
                          <div className="text-left">
                            <span className="bg-rose-100 text-rose-800 font-black px-2 py-0.5 rounded text-xs block font-mono">
                              مطلوب: {it.quantity}
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              المتوفر بالمخزن: {it.total_in_stock}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {req.notes && (
                      <p className="text-xs text-slate-500 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        💬 <span className="font-bold">ملاحظات:</span> {req.notes}
                      </p>
                    )}
                  </div>

                  {/* Action buttons */}
                  {req.status === 'pending' && (
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
                      <button
                        onClick={() => handleUpdateRequestStatus(req.id, 'rejected')}
                        className="px-3 py-1.5 rounded-lg text-slate-500 hover:bg-slate-100 font-bold transition cursor-pointer"
                      >
                        رفض الطلب
                      </button>
                      <button
                        onClick={() => handleUpdateRequestStatus(req.id, 'approved')}
                        className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-xs cursor-pointer"
                      >
                        الموافقة والبدء بالتجهيز
                      </button>
                    </div>
                  )}

                  {req.status === 'approved' && (
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
                      <button
                        onClick={() => handleUpdateRequestStatus(req.id, 'fulfilled')}
                        className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>تأكيد صرف وتوريد الأجهزة للفرع</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: CONSOLIDATED INVENTORY MATRIX (خريطة تتبع المخزون) */}
      {activeTab === 'matrix' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-600" />
                خريطة تتبع المخزون اللحظية عبر الفروع والمستودعات
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                جدول مصفوفي فوري يوضح أرصدة كل جهاز في كل صالة عرض ومستودع مركزي لتجنب نفاد الأجهزة
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative w-64">
                <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="ابحث باسم الجهاز أو الموديل..."
                  value={matrixSearch}
                  onChange={(e) => setMatrixSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2 text-xs font-bold"
                />
              </div>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-900 text-white font-bold">
                  <tr>
                    <th className="p-3 w-12 text-center">م</th>
                    <th className="p-3 min-w-[180px]">اسم الجهاز والموديل</th>
                    <th className="p-3">التصنيف / الماركة</th>
                    <th className="p-3 text-left">سعر البيع ({currency})</th>
                    {inventoryMatrix.warehouses?.map(w => (
                      <th key={w.id} className="p-3 text-center border-r border-slate-800 bg-slate-800/80">
                        {w.name}
                        <span className="block text-[10px] text-amber-300 font-normal">{w.branch_name || 'مركزي'}</span>
                      </th>
                    ))}
                    <th className="p-3 text-center bg-blue-900">إجمالي المخزون</th>
                    <th className="p-3 text-center">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {inventoryMatrix.products
                    ?.filter(p => !matrixSearch || p.name?.toLowerCase().includes(matrixSearch.toLowerCase()) || p.model_number?.toLowerCase().includes(matrixSearch.toLowerCase()))
                    .map((p, idx) => {
                      const totalStock = p.total_in_stock || 0;
                      const isLow = totalStock > 0 && totalStock <= 2;
                      const isOut = totalStock === 0;

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/80 transition">
                          <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                          <td className="p-3">
                            <span className="font-extrabold text-slate-900 block">{p.name}</span>
                            <span className="font-mono text-[10px] text-slate-400 font-bold">{p.model_number}</span>
                          </td>
                          <td className="p-3 text-slate-600">
                            <span>{p.category_name || '-'}</span>
                            <span className="block text-[10px] text-slate-400">{p.brand_name || '-'}</span>
                          </td>
                          <td className="p-3 text-left font-mono font-bold text-slate-800" dir="ltr">
                            {Number(p.cash_price).toLocaleString()}
                          </td>

                          {/* Quantities per warehouse */}
                          {inventoryMatrix.warehouses?.map(w => {
                            const count = p.warehouse_counts?.[w.id] || 0;
                            return (
                              <td key={w.id} className="p-3 text-center border-r border-slate-100 font-mono">
                                {count > 0 ? (
                                  <span className="font-black text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                                    {count}
                                  </span>
                                ) : (
                                  <span className="text-slate-300 text-[11px]">-</span>
                                )}
                              </td>
                            );
                          })}

                          {/* Total Stock */}
                          <td className="p-3 text-center bg-blue-50/50 border-r border-blue-100">
                            <span className={`font-black text-sm px-2.5 py-0.5 rounded-full font-mono ${
                              isOut ? 'bg-rose-100 text-rose-700' :
                              isLow ? 'bg-amber-100 text-amber-800' :
                              'bg-emerald-100 text-emerald-800'
                            }`}>
                              {totalStock}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="p-3 text-center">
                            {isOut ? (
                              <span className="bg-rose-100 text-rose-800 text-[10px] font-black px-2 py-0.5 rounded">
                                نفد من المخزن
                              </span>
                            ) : isLow ? (
                              <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded">
                                رصيد منخفض
                              </span>
                            ) : (
                              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded">
                                متوفر ومستقر
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                  <ArrowLeftRight className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-800">إذن تحويل بضائع وأجهزة بين المخازن</h3>
                  <p className="text-xs text-slate-500">اختر المخزن المصدر والمستقبل، وحدد الأجهزة المطلوب نقلها بالسيريال</p>
                </div>
              </div>
              <button onClick={() => setShowTransferModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteTransfer} className="space-y-4 flex-1 overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">المخزن المصدر (من) *</label>
                  <select
                    value={fromWarehouseId}
                    onChange={(e) => setFromWarehouseId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 focus:outline-none"
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.branch_name}) - متوفر: {w.items_count} جهاز
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">المخزن المستقبل (إلى) *</label>
                  <select
                    value={toWarehouseId}
                    onChange={(e) => setToWarehouseId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 focus:outline-none"
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.branch_name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Devices selection: Mode toggle and list */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                  <div className="flex bg-slate-200 p-0.5 rounded-lg text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setTransferMode('quantity')}
                      className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                        transferMode === 'quantity' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      📦 تحديد بالكميات المباشرة للأصناف
                    </button>
                    <button
                      type="button"
                      onClick={() => setTransferMode('serials')}
                      className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                        transferMode === 'serials' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      🔢 تحديد فردي بالسيريال
                    </button>
                  </div>

                  <span className="text-[11px] bg-blue-100 text-blue-800 px-2.5 py-1 rounded-lg font-black">
                    إجمالي الكمية المختارة: {totalQuantitySelected} جهاز
                  </span>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="ابحث باسم الجهاز، الموديل، السيريال..."
                    value={transferSearch}
                    onChange={(e) => setTransferSearch(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg pr-8 pl-3 py-1.5 text-xs font-medium"
                  />
                </div>

                {/* QUANTITY MODE */}
                {transferMode === 'quantity' ? (
                  <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
                    {filteredSourceProducts.length === 0 ? (
                      <p className="text-center py-6 text-xs text-slate-400 font-bold">
                        لا توجد أصناف متوفرة في هذا المخزن حالياً
                      </p>
                    ) : (
                      filteredSourceProducts.map((p) => {
                        const qty = Number(productQuantities[p.product_id]) || 0;
                        return (
                          <div
                            key={p.product_id}
                            className={`p-2.5 rounded-xl border text-xs flex flex-wrap items-center justify-between gap-2 transition-all ${
                              qty > 0 ? 'bg-blue-50/70 border-blue-300' : 'bg-white border-slate-200'
                            }`}
                          >
                            <div className="flex-1 min-w-[180px]">
                              <p className="font-extrabold text-slate-900">{p.product_name}</p>
                              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                                <span>موديل: {p.model_number || '-'}</span>
                                {p.brand_name && <span>| {p.brand_name}</span>}
                                <span className="text-emerald-700 font-bold">
                                  (المتوفر بالمخزن: {p.available_count} جهاز)
                                </span>
                              </div>
                            </div>

                            {/* Quantity Controls */}
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-500 font-bold">الكمية للتحويل:</span>
                              <button
                                type="button"
                                onClick={() => updateProductQuantity(p.product_id, -1, p.available_count)}
                                className="w-6 h-6 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-black flex items-center justify-center cursor-pointer"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="0"
                                max={p.available_count}
                                value={qty}
                                onChange={(e) => setDirectProductQuantity(p.product_id, e.target.value, p.available_count)}
                                className="w-14 text-center bg-white border border-slate-300 rounded-lg py-1 font-mono font-black text-xs text-blue-700"
                              />
                              <button
                                type="button"
                                onClick={() => updateProductQuantity(p.product_id, 1, p.available_count)}
                                className="w-6 h-6 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-black flex items-center justify-center cursor-pointer"
                              >
                                +
                              </button>
                              <button
                                type="button"
                                onClick={() => setDirectProductQuantity(p.product_id, p.available_count, p.available_count)}
                                className="text-[10px] text-blue-600 hover:underline font-bold px-1 cursor-pointer"
                              >
                                الكل
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                ) : (
                  /* SERIALS MODE */
                  <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                    <div className="flex justify-end pb-1">
                      <button
                        type="button"
                        onClick={selectAllSourceSerials}
                        className="text-[11px] text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
                      >
                        {selectedSerialIds.length === filteredSourceSerials.length ? 'إلغاء التحديد' : 'تحديد الكل'}
                      </button>
                    </div>
                    {filteredSourceSerials.length === 0 ? (
                      <p className="text-center py-6 text-xs text-slate-400 font-bold">
                        لا توجد أجهزة متوفرة في هذا المخزن حالياً
                      </p>
                    ) : (
                      filteredSourceSerials.map((s) => {
                        const isSelected = selectedSerialIds.includes(s.id);
                        return (
                          <div
                            key={s.id}
                            onClick={() => toggleSelectSerial(s.id)}
                            className={`p-2 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-all ${
                              isSelected ? 'bg-blue-50 border-blue-400 shadow-xs' : 'bg-white border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                className="rounded text-blue-600 cursor-pointer"
                              />
                              <div>
                                <p className="font-bold text-slate-800">{s.product_name}</p>
                                <p className="text-[10px] text-slate-500 font-mono">سيريال: {s.serial_number}</p>
                              </div>
                            </div>
                            <span className="font-mono text-slate-700 font-bold">{Number(s.cash_price).toLocaleString()} {currency}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">المسؤول عن النقل</label>
                  <input
                    type="text"
                    value={transferCreatedBy}
                    onChange={(e) => setTransferCreatedBy(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">ملاحظات التحويل</label>
                  <input
                    type="text"
                    placeholder="مثال: تعزيز معروضات الصالة قبل موسم العيد"
                    value={transferNotes}
                    onChange={(e) => setTransferNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={totalQuantitySelected === 0}
                  className={`px-6 py-2 rounded-xl font-bold text-xs text-white shadow-md transition-all cursor-pointer ${
                    totalQuantitySelected === 0 ? 'bg-slate-300 cursor-not-allowed shadow-none' : 'bg-orange-600 hover:bg-orange-700'
                  }`}
                >
                  تأكيد التحويل المخزني ({totalQuantitySelected} جهاز)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: VIEW TRANSFER DETAILS & OFFICIAL PRINTING              */}
      {/* ============================================================ */}
      {viewTransferModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div id="printable-area" className="printable-area bg-white rounded-3xl shadow-2xl max-w-xl w-full p-6 text-xs text-slate-800 flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:border-none print:p-0">
            {/* Formal Printable Document Header (shown ONLY during print) */}
            <div className="hidden print:block border-b-2 border-slate-900 pb-3 mb-4 text-right">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-base font-black text-slate-900">{settings?.store_name || 'معرض دكان عبد العزيز للأجهزة الكهربائية'}</h2>
                  <p className="text-[10px] text-slate-500 font-bold">{settings?.tagline || 'تجارة وتوزيع الأجهزة الكهربائية والمنزلية'}</p>
                  <p className="text-[9px] text-slate-500">السجل التجاري (س.ت): <span className="font-mono font-bold">{settings?.commercial_reg || '123456'}</span> | البطاقة الضريبية (ب.ض): <span className="font-mono font-bold">{settings?.tax_number || '987-654-321'}</span> | هاتف: {settings?.phone || '01023456789'}</p>
                </div>
                <div className="text-left font-mono text-[10px] space-y-0.5" dir="ltr">
                  <p>Transfer No: <strong className="text-xs text-blue-900">{viewTransferModal.transfer_no}</strong></p>
                  <p>Date: {viewTransferModal.transfer_date}</p>
                  <p>Staff: {viewTransferModal.created_by}</p>
                </div>
              </div>
              <div className="text-center py-1.5 bg-slate-100 border border-slate-300 rounded font-black text-sm text-slate-900">
                إذن تحويل بضائع وأجهزة بين المخازن (مستند نقل ومطابقة رسمي)
              </div>
            </div>

            {/* Screen Header (hidden on print) */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4 no-print">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <ArrowLeftRight className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    إذن تحويل بضائع رقم: {viewTransferModal.transfer_no}
                  </h3>
                  <p className="text-[11px] text-slate-500">تفاصيل الأجهزة المنقولة وحالة التحويل</p>
                </div>
              </div>
              <button onClick={() => setViewTransferModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto pr-1 print:overflow-visible print:pr-0">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs print:bg-white print:border-slate-300">
                <div>
                  <span className="text-slate-500 block text-[11px]">من المخزن:</span>
                  <span className="font-extrabold text-slate-900">{viewTransferModal.from_warehouse_name}</span>
                  <span className="text-[10px] text-slate-400 block font-normal">({viewTransferModal.from_branch_name})</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">إلى المخزن:</span>
                  <span className="font-extrabold text-emerald-700">{viewTransferModal.to_warehouse_name}</span>
                  <span className="text-[10px] text-slate-400 block font-normal">({viewTransferModal.to_branch_name})</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">تاريخ ووقت التحويل:</span>
                  <span className="font-bold text-slate-800">{viewTransferModal.transfer_date}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">المسؤول عن النقل:</span>
                  <span className="font-bold text-slate-800">{viewTransferModal.created_by}</span>
                </div>
                {viewTransferModal.manager_approved_by && (
                  <div className="col-span-2 bg-emerald-50 text-emerald-800 p-2 rounded-xl border border-emerald-200 font-bold">
                    ✓ اعتماد وموافقة الإدارة: {viewTransferModal.manager_approved_by}
                  </div>
                )}
                {viewTransferModal.notes && (
                  <div className="col-span-2">
                    <span className="text-slate-500 block text-[11px]">ملاحظات:</span>
                    <p className="font-medium text-slate-700">{viewTransferModal.notes}</p>
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-extrabold text-slate-800 mb-2 flex items-center justify-between">
                  <span>الأجهزة والقطع المشمولة بالإذن ({viewTransferModal.items?.length || viewTransferModal.total_items} جهاز):</span>
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden print:border-slate-300">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-bold print:bg-slate-200 print:text-black">
                      <tr>
                        <th className="p-2 w-8 text-center border-b border-slate-200">#</th>
                        <th className="p-2 border-b border-slate-200">الجهاز والموديل</th>
                        <th className="p-2 border-b border-slate-200">السيريال نمبر</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 print:divide-slate-200">
                      {viewTransferModal.items && viewTransferModal.items.length > 0 ? (
                        viewTransferModal.items.map((it, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2 text-center font-bold text-slate-400 print:text-black">{idx + 1}</td>
                            <td className="p-2 font-bold text-slate-800 print:text-black">
                              {it.product_name}
                              {it.model_number && <span className="block text-[10px] text-slate-400 font-mono font-normal print:text-slate-600">موديل: {it.model_number}</span>}
                            </td>
                            <td className="p-2 font-mono font-bold text-blue-700 print:text-black" dir="ltr">
                              {it.serial_number || 'بدون سيريال'}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="p-4 text-center text-slate-400">
                            إجمالي الأجهزة المحولة: {viewTransferModal.total_items} جهاز
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Formal Signatures and Confirmation (shown ONLY during print) */}
              <div className="hidden print:grid grid-cols-4 gap-3 pt-6 mt-6 border-t-2 border-slate-800 text-center text-[10px]">
                <div className="space-y-6">
                  <p className="font-bold text-slate-800">أمين المخزن المسلّم</p>
                  <p className="text-[9px] text-slate-500">{viewTransferModal.from_warehouse_name}</p>
                  <p className="text-[9px] text-slate-400 border-b border-dashed border-slate-400 mx-2 pb-1">التوقيع: .....................</p>
                </div>
                <div className="space-y-6">
                  <p className="font-bold text-slate-800">السائق / مندوب النقل</p>
                  <p className="text-[9px] text-slate-500">{viewTransferModal.created_by}</p>
                  <p className="text-[9px] text-slate-400 border-b border-dashed border-slate-400 mx-2 pb-1">التوقيع: .....................</p>
                </div>
                <div className="space-y-6">
                  <p className="font-bold text-slate-800">أمين المخزن المستلم</p>
                  <p className="text-[9px] text-slate-500">{viewTransferModal.to_warehouse_name}</p>
                  <p className="text-[9px] text-slate-400 border-b border-dashed border-slate-400 mx-2 pb-1">التوقيع: .....................</p>
                </div>
                <div className="space-y-6">
                  <p className="font-bold text-slate-800">اعتماد إدارة المعرض</p>
                  <p className="text-[9px] text-slate-500">{viewTransferModal.manager_approved_by || 'معتمد'}</p>
                  <p className="text-[9px] text-slate-400 border-b border-dashed border-slate-400 mx-2 pb-1">الختم: .....................</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 mt-4 no-print">
              <button
                type="button"
                onClick={() => {
                  const t = viewTransferModal;
                  setViewTransferModal(null);
                  handlePrintTransfer(t);
                }}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 cursor-pointer text-xs shadow-md transition-all"
              >
                <Printer className="w-4 h-4 text-emerald-200" />
                <span>طباعة الإذن الرسمي (A4)</span>
              </button>
              <button
                onClick={() => setViewTransferModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold cursor-pointer text-xs"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: EDIT TRANSFER WITH MANAGER APPROVAL                   */}
      {/* ============================================================ */}
      {editTransferModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full p-6 text-xs text-slate-800 flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    تعديل إذن التحويل: {editTransferModal.transfer_no}
                  </h3>
                  <p className="text-[11px] text-slate-500">تعديل المخازن، تغيير الكميات، إضافة أو حذف أصناف، واعتماد الإذن</p>
                </div>
              </div>
              <button onClick={() => setEditTransferModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditTransfer} className="space-y-4 overflow-y-auto pr-1 flex-1">
              {/* Warehouse Selection: From and To */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-[11px] flex items-center gap-1.5">
                    <Warehouse className="w-3.5 h-3.5 text-blue-600" />
                    <span>من المخزن (المصدر) *</span>
                  </label>
                  <select
                    required
                    value={editTransferModal.from_warehouse_id || ''}
                    onChange={(e) => setEditTransferModal({ ...editTransferModal, from_warehouse_id: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-hidden"
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>
                        {w.name} {w.branch_name ? `(${w.branch_name})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-[11px] flex items-center gap-1.5">
                    <Warehouse className="w-3.5 h-3.5 text-emerald-600" />
                    <span>إلى المخزن (المستقبل) *</span>
                  </label>
                  <select
                    required
                    value={editTransferModal.to_warehouse_id || ''}
                    onChange={(e) => setEditTransferModal({ ...editTransferModal, to_warehouse_id: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  >
                    {warehouses.map(w => (
                      <option 
                        key={w.id} 
                        value={w.id} 
                        disabled={Number(w.id) === Number(editTransferModal.from_warehouse_id)}
                      >
                        {w.name} {w.branch_name ? `(${w.branch_name})` : ''} {Number(w.id) === Number(editTransferModal.from_warehouse_id) ? '(المخزن المصدر)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Items Management in Transfer */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-slate-700" />
                    <span className="font-extrabold text-slate-800 text-xs">الأصناف والكميات في إذن التحويل</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px]">
                      {(editTransferModal.transfer_items || []).reduce((acc, it) => acc + Number(it.quantity || 0), 0)} جهاز إجمالي
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">تعديل الكميات أو حذف أصناف</span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white max-h-52 overflow-y-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-bold sticky top-0 z-10">
                      <tr>
                        <th className="p-2 w-8 text-center border-b border-slate-200">#</th>
                        <th className="p-2 border-b border-slate-200">الصنف / الجهاز</th>
                        <th className="p-2 border-b border-slate-200 text-center w-36">الكمية المحولة</th>
                        <th className="p-2 border-b border-slate-200 w-12 text-center">إجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {(editTransferModal.transfer_items || []).map((it, idx) => (
                        <tr key={it.product_id || idx} className="hover:bg-slate-50/80">
                          <td className="p-2 text-center font-bold text-slate-400">{idx + 1}</td>
                          <td className="p-2">
                            <div className="font-bold text-slate-900">{it.product_name}</div>
                            {it.model_number && (
                              <div className="text-[10px] text-slate-400 font-mono">موديل: {it.model_number}</div>
                            )}
                            {it.serials && it.serials.length > 0 && (
                              <div className="text-[9px] text-blue-600 mt-0.5 font-mono">
                                سيريالات حالية: {it.serials.slice(0, 3).join(', ')}{it.serials.length > 3 ? ` (+${it.serials.length - 3})` : ''}
                              </div>
                            )}
                          </td>
                          <td className="p-2 text-center">
                            <div className="inline-flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden shadow-xs">
                              <button
                                type="button"
                                onClick={() => handleUpdateEditItemQty(it.product_id, -1)}
                                disabled={Number(it.quantity) <= 1}
                                className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 active:bg-slate-200 font-bold cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="1"
                                value={it.quantity}
                                onChange={(e) => handleSetEditItemQty(it.product_id, e.target.value)}
                                className="w-14 text-center font-mono font-bold text-xs py-1 border-x border-slate-200 focus:outline-hidden"
                              />
                              <button
                                type="button"
                                onClick={() => handleUpdateEditItemQty(it.product_id, 1)}
                                className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 active:bg-slate-200 font-bold cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveEditItem(it.product_id)}
                              title="حذف الصنف من الإذن"
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Add Another Product Section */}
                <div className="pt-2 border-t border-slate-200">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                    + إضافة صنف آخر للإذن:
                  </label>
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                    <select
                      value={editTransferModal.add_product_id || ''}
                      onChange={(e) => setEditTransferModal({ ...editTransferModal, add_product_id: e.target.value })}
                      className="flex-1 min-w-[200px] bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-hidden"
                    >
                      <option value="">-- اختر صنفاً لإضافته للإذن --</option>
                      {allProductsList.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} {p.model_number ? `(${p.model_number})` : ''}
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center gap-1 w-28">
                      <label className="text-[10px] text-slate-500 font-semibold whitespace-nowrap">الكمية:</label>
                      <input
                        type="number"
                        min="1"
                        value={editTransferModal.add_product_qty || 1}
                        onChange={(e) => setEditTransferModal({ ...editTransferModal, add_product_qty: Math.max(1, parseInt(e.target.value) || 1) })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-2 py-1.5 text-xs text-center font-mono font-bold"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddProductToEditTransfer}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-xs whitespace-nowrap"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة للإذن</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Editable Fields: Transfer Date, Staff, and Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-[11px]">تاريخ ووقت التحويل</label>
                  <input
                    type="text"
                    value={editTransferModal.transfer_date || ''}
                    onChange={(e) => setEditTransferModal({ ...editTransferModal, transfer_date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold"
                    placeholder="YYYY-MM-DD HH:MM:SS"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-[11px]">المسؤول عن النقل والتسجيل</label>
                  <input
                    type="text"
                    value={editTransferModal.created_by || ''}
                    onChange={(e) => setEditTransferModal({ ...editTransferModal, created_by: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 text-[11px]">ملاحظات وبيان التحويل</label>
                <textarea
                  rows="2"
                  value={editTransferModal.notes || ''}
                  onChange={(e) => setEditTransferModal({ ...editTransferModal, notes: e.target.value })}
                  placeholder="اكتب ملاحظات التحويل أو سبب التعديل..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              {/* Manager Security Approval Box */}
              <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200 space-y-2">
                <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                  <Lock className="w-4 h-4 text-amber-700" />
                  <span>موافقة واعتماد المدير (شرط أساسي لحفظ التعديلات)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1 text-[11px]">اسم المدير المعتمد *</label>
                    <input
                      type="text"
                      required
                      value={managerName}
                      onChange={(e) => setManagerName(e.target.value)}
                      className="w-full bg-white border border-amber-300 rounded-lg px-2.5 py-1.5 font-bold text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1 text-[11px]">رمز مرور المدير (PIN) *</label>
                    <input
                      type="password"
                      required
                      placeholder="رمز PIN المدير..."
                      value={managerPin}
                      onChange={(e) => setManagerPin(e.target.value)}
                      className="w-full bg-white border border-amber-300 rounded-lg px-2.5 py-1.5 font-mono font-bold text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditTransferModal(null)}
                  className="px-4 py-2 font-bold cursor-pointer text-slate-600 hover:text-slate-800"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer shadow-md transition-all"
                >
                  حفظ التعديلات واعتماد الإذن
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: DELETE / REVERSE TRANSFER WITH MANAGER APPROVAL       */}
      {/* ============================================================ */}
      {deleteTransferModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 text-xs text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="font-extrabold text-sm text-rose-700 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                إلغاء وعكس إذن التحويل: {deleteTransferModal.transfer_no}
              </h3>
              <button onClick={() => setDeleteTransferModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDeleteTransfer} className="space-y-3">
              <div className="bg-rose-50 border border-rose-200 p-3 rounded-2xl text-rose-900 leading-relaxed text-[11px]">
                <p className="font-bold mb-1">⚠️ تنبيه هام لرقابة المخزون:</p>
                <p>
                  إلغاء هذا الإذن سيقوم فورياً بعكس حركة المخزون وإرجاع جميع الأجهزة (<strong>{deleteTransferModal.total_items} جهاز</strong>) من المخزن المستقبل (<strong>{deleteTransferModal.to_warehouse_name}</strong>) إلى المخزن المصدر (<strong>{deleteTransferModal.from_warehouse_name}</strong>).
                </p>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">سبب الإلغاء أو الحذف *</label>
                <input
                  type="text"
                  required
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                />
              </div>

              <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200 space-y-2">
                <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                  <Lock className="w-4 h-4 text-amber-700" />
                  <span>تأكيد وموافقة المدير العام (إلزامي)</span>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-[11px]">اسم المدير المصادق *</label>
                  <input
                    type="text"
                    required
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    className="w-full bg-white border border-amber-300 rounded-lg px-2.5 py-1.5 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-[11px]">رمز مرور المدير (PIN) *</label>
                  <input
                    type="password"
                    required
                    placeholder="رمز PIN المدير..."
                    value={managerPin}
                    onChange={(e) => setManagerPin(e.target.value)}
                    className="w-full bg-white border border-amber-300 rounded-lg px-2.5 py-1.5 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setDeleteTransferModal(null)}
                  className="px-4 py-2 font-bold cursor-pointer"
                >
                  تراجع
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer shadow-md"
                >
                  تأكيد الحذف وعكس النقل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIEW WAREHOUSE SERIALS */}
      {selectedWarehouseSerials && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-800">الأجهزة المخزنة حالياً</h3>
                <p className="text-xs text-blue-600 font-bold">{selectedWarehouseSerials.name} ({selectedWarehouseSerials.branch_name})</p>
              </div>
              <button onClick={() => setSelectedWarehouseSerials(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {warehouseSerialsList.length === 0 ? (
                <p className="text-center py-10 text-slate-400 text-xs font-bold">لا توجد أجهزة متوفرة في هذا المخزن</p>
              ) : (
                warehouseSerialsList.map((s, idx) => (
                  <div key={s.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800">{idx + 1}. {s.product_name}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-blue-700 font-bold" dir="ltr">
                          {s.serial_number}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">موديل: {s.model_number}</span>
                      </div>
                    </div>
                    <span className="font-black text-slate-900" dir="ltr">{Number(s.cash_price).toLocaleString()} {currency}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD BRANCH */}
      {showAddBranchModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="font-bold text-base text-slate-800">إضافة فرع جديد للمعرض</h3>
              <button onClick={() => setShowAddBranchModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBranch} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">اسم الفرع *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: فرع الهرم الرئيسي"
                  value={branchForm.name}
                  onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">كود الفرع</label>
                  <input
                    type="text"
                    placeholder="BR-04"
                    value={branchForm.code}
                    onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">رقم الهاتف</label>
                  <input
                    type="text"
                    placeholder="010..."
                    value={branchForm.phone}
                    onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">العنوان بالتفصيل</label>
                <input
                  type="text"
                  placeholder="شارع فيصل الرئيسي..."
                  value={branchForm.address}
                  onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">اسم مدير الفرع</label>
                <input
                  type="text"
                  placeholder="أ / أحمد عبد العزيز"
                  value={branchForm.manager_name}
                  onChange={(e) => setBranchForm({ ...branchForm, manager_name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="is_main_branch"
                  checked={branchForm.is_main}
                  onChange={(e) => setBranchForm({ ...branchForm, is_main: e.target.checked })}
                  className="rounded text-blue-600"
                />
                <label htmlFor="is_main_branch" className="text-slate-700 font-bold cursor-pointer">
                  تعيين كمقر وفرع رئيسي للمعرض
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddBranchModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md cursor-pointer"
                >
                  حفظ الفرع
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD WAREHOUSE */}
      {showAddWarehouseModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="font-bold text-base text-slate-800">إضافة مخزن جديد</h3>
              <button onClick={() => setShowAddWarehouseModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWarehouse} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">الفرع التابع له المخزن *</label>
                <select
                  required
                  value={warehouseForm.branch_id}
                  onChange={(e) => setWarehouseForm({ ...warehouseForm, branch_id: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                >
                  <option value="">اختر الفرع...</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">اسم المخزن *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: مخزن صالة العرض"
                  value={warehouseForm.name}
                  onChange={(e) => setWarehouseForm({ ...warehouseForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">كود المخزن</label>
                  <input
                    type="text"
                    placeholder="WH-05"
                    value={warehouseForm.code}
                    onChange={(e) => setWarehouseForm({ ...warehouseForm, code: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">أمين المخزن</label>
                  <input
                    type="text"
                    placeholder="محمد..."
                    value={warehouseForm.manager_name}
                    onChange={(e) => setWarehouseForm({ ...warehouseForm, manager_name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">مكان / موقع المخزن</label>
                <input
                  type="text"
                  placeholder="بدروم المعرض أو المستودع الخلفي"
                  value={warehouseForm.location}
                  onChange={(e) => setWarehouseForm({ ...warehouseForm, location: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddWarehouseModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md cursor-pointer"
                >
                  حفظ المخزن
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE SHORTAGE REQUEST */}
      {showNewRequestModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                  <ClipboardList className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-800">إنشاء طلب نواقص وإمداد بضائع جديد</h3>
                  <p className="text-xs text-slate-500">اختر الفرع الطالب والمستودع المزوّد، وحدد الأجهزة والكميات المطلوبة</p>
                </div>
              </div>
              <button onClick={() => setShowNewRequestModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-4 flex-1 overflow-y-auto pr-1">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">الفرع الطالب *</label>
                  <select
                    required
                    value={requestForm.branch_id}
                    onChange={(e) => setRequestForm({ ...requestForm, branch_id: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                  >
                    <option value="">اختر الفرع...</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">المستودع المزوّد *</label>
                  <select
                    required
                    value={requestForm.from_warehouse_id}
                    onChange={(e) => setRequestForm({ ...requestForm, from_warehouse_id: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                  >
                    <option value="">اختر المستودع...</option>
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name} ({w.branch_name || 'مركزي'})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">درجة الأهمية / الاستعجال</label>
                  <select
                    value={requestForm.urgency}
                    onChange={(e) => setRequestForm({ ...requestForm, urgency: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-rose-700"
                  >
                    <option value="normal">عادي (إمداد روتيني)</option>
                    <option value="urgent">⚡ عاجل (نقص شديد)</option>
                    <option value="critical">🚨 عاجل جداً (عميل ينتظر)</option>
                  </select>
                </div>
              </div>

              {/* Add item to requisition row */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <span className="text-xs font-bold text-slate-700 block mb-2">إضافة جهاز لقائمة النواقص:</span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                  <div className="sm:col-span-2">
                    <select
                      value={reqSelectedItem.product_id}
                      onChange={(e) => setReqSelectedItem({ ...reqSelectedItem, product_id: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 font-bold"
                    >
                      <option value="">اختر الجهاز الكهربائي...</option>
                      {allProductsList.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.model_number})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <input
                      type="number"
                      min="1"
                      placeholder="الكمية"
                      value={reqSelectedItem.quantity}
                      onChange={(e) => setReqSelectedItem({ ...reqSelectedItem, quantity: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-center font-bold"
                    />
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={addItemToRequest}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 font-bold cursor-pointer transition shadow-xs"
                    >
                      + إضافة للطلب
                    </button>
                  </div>
                </div>
              </div>

              {/* Items Selected in Requisition */}
              <div className="border border-slate-200 rounded-xl p-3 bg-white">
                <span className="text-xs font-bold text-slate-700 block mb-2">
                  الأجهزة المحددة بالطلب ({requestForm.items.length}):
                </span>
                {requestForm.items.length === 0 ? (
                  <p className="text-center py-4 text-xs text-slate-400">لم تقم بإضافة أي أجهزة بعد</p>
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {requestForm.items.map((it, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                        <div>
                          <span className="font-bold text-slate-800">{it.product_name}</span>
                          <span className="text-[10px] text-slate-500 font-mono block">موديل: {it.model_number}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="bg-rose-100 text-rose-800 font-black px-2 py-0.5 rounded font-mono">
                            العدد: {it.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeItemFromRequest(idx)}
                            className="text-rose-500 hover:text-rose-700 cursor-pointer p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">اسم مقدم الطلب</label>
                  <input
                    type="text"
                    value={requestForm.requested_by}
                    onChange={(e) => setRequestForm({ ...requestForm, requested_by: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">ملاحظات إضافية</label>
                  <input
                    type="text"
                    placeholder="مثال: يرجى التوريد قبل عطلة نهاية الأسبوع"
                    value={requestForm.notes}
                    onChange={(e) => setRequestForm({ ...requestForm, notes: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNewRequestModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={requestForm.items.length === 0}
                  className={`px-6 py-2 rounded-xl font-bold text-xs text-white shadow-md transition cursor-pointer ${
                    requestForm.items.length === 0 ? 'bg-slate-300 cursor-not-allowed shadow-none' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  إرسال طلب النواقص للمستودع ({requestForm.items.length} أجهزة)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Physical Inventory Cycle Count Modal */}
      <CycleCountModal
        isOpen={showCycleCountModal}
        onClose={() => setShowCycleCountModal(false)}
        currentUser={currentUser}
        settings={settings}
        onAuditSaved={() => loadData()}
      />

      {/* Fallback Transfer Printable Modal */}
      {localPrintTransfer && (
        <TransferPrint
          transfer={localPrintTransfer}
          settings={settings}
          onClose={() => setLocalPrintTransfer(null)}
        />
      )}

      {/* Printable Stock Shortage Request Modal (Requirement 3) */}
      {printShortageRequest && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto print:static print:inset-auto print:bg-transparent print:backdrop-blur-none print:p-0 print:m-0 print:overflow-visible print:block print:w-full">
          <style>{`
            @media print {
              @page {
                size: A4 portrait;
                margin: 10mm;
              }
              body * {
                visibility: hidden !important;
              }
              #shortage-printable-area,
              #shortage-printable-area * {
                visibility: visible !important;
              }
              #shortage-printable-area {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                box-shadow: none !important;
                border: none !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `}</style>
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden print:max-h-none print:shadow-none print:border-none print:rounded-none">
            {/* Header controls bar */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between no-print">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-slate-800 text-sm">
                  معاينة وطباعة إذن طلب النواقص والإمداد ({printShortageRequest.request_no})
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-md transition cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة إذن النواقص (A4)</span>
                </button>
                <button
                  onClick={() => setPrintShortageRequest(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Printable Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-100 flex justify-center print:p-0 print:bg-white print:overflow-visible">
              <div
                id="shortage-printable-area"
                className="bg-white text-slate-900 w-[210mm] max-w-full p-8 shadow-md rounded-xl border border-slate-200 text-xs leading-relaxed print:shadow-none print:border-none print:p-0"
              >
                {/* Formal Document Header */}
                <div className="border-b-2 border-slate-900 pb-3 mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={settings?.logo_url || '/logo.svg'}
                      alt="شعار المعرض"
                      className="h-12 max-w-[200px] object-contain"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <div>
                      <h2 className="text-base font-black text-slate-900">
                        {settings?.store_name || 'معرض دكان عبد العزيز للأجهزة الكهربائية'}
                      </h2>
                      <p className="text-[11px] text-slate-600 font-bold">
                        إدارة الإمداد والتموين وحركة المخازن والفروع
                      </p>
                    </div>
                  </div>
                  <div className="text-left font-mono text-[11px]">
                    <p className="font-bold text-rose-700 text-sm">{printShortageRequest.request_no}</p>
                    <p className="text-slate-500">التاريخ: {printShortageRequest.created_at?.slice(0, 10)}</p>
                  </div>
                </div>

                <div className="text-center my-3 bg-rose-50 border border-rose-200 p-2.5 rounded-xl">
                  <h3 className="text-base font-black text-rose-900">
                    إذن طلب نواقص وتعزيز مخزون صالة العرض
                  </h3>
                  <p className="text-[11px] text-rose-700 font-semibold mt-0.5">
                    درجة الأهمية: {printShortageRequest.urgency === 'critical' ? '🚨 عاجل جداً وفوري' : printShortageRequest.urgency === 'urgent' ? '⚡ عاجل' : 'عادي'} | الحالة: {printShortageRequest.status === 'fulfilled' ? 'تم التوريد' : printShortageRequest.status === 'approved' ? 'معتمد للتجهيز' : 'قيد المراجعة'}
                  </p>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 mb-4 text-xs">
                  <div>
                    <span className="text-slate-500 font-bold">الفرع الطالب (المعرض): </span>
                    <strong className="text-slate-900 font-extrabold">{printShortageRequest.branch_name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold">المستودع المزوّد المطلوب منه: </span>
                    <strong className="text-slate-900 font-extrabold">{printShortageRequest.from_warehouse_name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold">الموظف / المسؤول الطالب: </span>
                    <strong className="text-slate-900">{printShortageRequest.requested_by}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold">تاريخ وتوقيت الطلب: </span>
                    <strong className="text-slate-900 font-mono" dir="ltr">{printShortageRequest.created_at}</strong>
                  </div>
                </div>

                {/* Items Table */}
                <div className="mb-4">
                  <h4 className="font-black text-slate-800 text-xs mb-2">بيان الأجهزة والموديلات المطلوبة:</h4>
                  <table className="w-full border-collapse border border-slate-300 text-xs">
                    <thead>
                      <tr className="bg-slate-100 font-bold text-slate-700">
                        <th className="border border-slate-300 p-2 text-center w-10">#</th>
                        <th className="border border-slate-300 p-2 text-right">اسم الجهاز والصنف</th>
                        <th className="border border-slate-300 p-2 text-center">الموديل / الكود</th>
                        <th className="border border-slate-300 p-2 text-center w-24">الكمية المطلوبة</th>
                        <th className="border border-slate-300 p-2 text-center w-28">المتوفر بالمخزن</th>
                      </tr>
                    </thead>
                    <tbody>
                      {printShortageRequest.items?.map((it, idx) => (
                        <tr key={idx} className="border-b border-slate-200 text-center">
                          <td className="border border-slate-300 p-2 font-mono">{idx + 1}</td>
                          <td className="border border-slate-300 p-2 text-right font-bold text-slate-900">
                            {it.product_name}
                          </td>
                          <td className="border border-slate-300 p-2 font-mono text-slate-600">
                            {it.model_number || '-'}
                          </td>
                          <td className="border border-slate-300 p-2 font-black text-rose-700 text-sm">
                            {it.quantity}
                          </td>
                          <td className="border border-slate-300 p-2 font-bold text-slate-600">
                            {it.total_in_stock ?? '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {printShortageRequest.notes && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-5 text-xs">
                    <strong className="text-slate-800 block mb-1">ملاحظات وأسباب طلب النواقص:</strong>
                    <p className="text-slate-600">{printShortageRequest.notes}</p>
                  </div>
                )}

                {/* Signatures */}
                <div className="grid grid-cols-3 gap-6 pt-6 border-t-2 border-slate-300 text-center text-xs mt-8">
                  <div>
                    <p className="font-bold text-slate-800 mb-8">مسؤول مبيعات الفرع الطالب</p>
                    <div className="border-b border-dashed border-slate-400"></div>
                    <p className="text-[10px] text-slate-500 mt-1">الاسم والتوقيع</p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 mb-8">أمين المستودع المزوّد (الصرف)</p>
                    <div className="border-b border-dashed border-slate-400"></div>
                    <p className="text-[10px] text-slate-500 mt-1">الاسم والتوقيع</p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 mb-8">اعتماد إدارة المعارض والرقابة</p>
                    <div className="border-b border-dashed border-slate-400"></div>
                    <p className="text-[10px] text-slate-500 mt-1">الختم والتوقيع الرسمي</p>
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
