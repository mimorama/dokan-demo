import React, { useState, useEffect } from 'react';
import { 
  Users as UsersIcon, 
  UserPlus, 
  ShieldCheck, 
  Building2, 
  Trash2, 
  Edit3, 
  X, 
  Check, 
  KeyRound, 
  Phone, 
  Lock,
  UserCheck,
  AlertCircle,
  Shield,
  Search,
  CheckCircle2,
  XCircle,
  Power,
  RotateCcw,
  Sparkles,
  Sliders,
  Eye,
  EyeOff
} from 'lucide-react';
import { api } from '../api';

export default function Users({ currentUser, settings }) {
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'cashier',
    branch_id: '',
    warehouse_id: '',
    phone: '',
    status: 'active',
    pin: '',
    permissions: []
  });

  const roles = [
    { 
      id: 'admin', 
      title: 'المدير العام', 
      desc: 'صلاحيات كاملة غير محدودة على كل شاشات النظام والمستخدمين والتقارير المالية والنسخ الاحتياطي',
      defaultPerms: [
        'pos_create_sales', 'pos_discount', 'pos_return_sales', 'pos_shifts', 'sales_view', 'reconciliation_view',
        'installments_view', 'installments_create', 'installments_collect', 'installments_reschedule',
        'products_manage', 'serials_track', 'inventory_transfers', 'inventory_audit', 'stock_requests',
        'purchases_manage', 'cashbox_manage', 'reports_view', 'customers_manage', 'suppliers_manage',
        'settings_manage', 'users_manage'
      ]
    },
    { 
      id: 'manager', 
      title: 'مدير فرع', 
      desc: 'إدارة عمليات الفرع، المخازن، التحويلات، الأقساط، العملاء والتقارير بدون إعدادات النظام',
      defaultPerms: [
        'pos_create_sales', 'pos_discount', 'pos_return_sales', 'pos_shifts', 'sales_view', 'reconciliation_view',
        'installments_view', 'installments_create', 'installments_collect', 'installments_reschedule',
        'products_manage', 'serials_track', 'inventory_transfers', 'inventory_audit', 'stock_requests',
        'purchases_manage', 'cashbox_manage', 'reports_view', 'customers_manage', 'suppliers_manage'
      ]
    },
    { 
      id: 'cashier', 
      title: 'كاشير ومبيعات', 
      desc: 'إصدار فواتير البيع، تسجيل العملاء، تحصيل الأقساط، فواتير المبيعات، ومراجعة اليومية',
      defaultPerms: [
        'pos_create_sales', 'pos_shifts', 'sales_view', 'reconciliation_view', 'installments_view', 'installments_create',
        'installments_collect', 'customers_manage', 'serials_track'
      ]
    },
    { 
      id: 'storekeeper', 
      title: 'أمين مخزن ومستودع', 
      desc: 'جرد البضائع، أذونات الصرف والتحويل، استلام المشتريات، والجرد بالباركود',
      defaultPerms: [
        'products_manage', 'serials_track', 'inventory_transfers', 'inventory_audit',
        'stock_requests', 'purchases_manage', 'suppliers_manage'
      ]
    },
    { 
      id: 'accountant', 
      title: 'مراجع حسابات ومالية', 
      desc: 'تدقيق فواتير الشراء والبيع، مراجعة اليومية، متابعة حركة الخزينة، الأقساط والتقارير المالية الرسمية',
      defaultPerms: [
        'sales_view', 'reconciliation_view', 'purchases_manage', 'cashbox_manage', 'reports_view', 'customers_manage',
        'suppliers_manage', 'installments_view', 'installments_collect'
      ]
    }
  ];

  const availablePermissions = [
    {
      group: 'المبيعات ونقاط البيع (POS & Cashier)',
      items: [
        { id: 'pos_create_sales', label: 'إصدار فواتير البيع والكاش' },
        { id: 'pos_discount', label: 'منح خصومات نقدية على الفواتير' },
        { id: 'pos_return_sales', label: 'تسجيل مرتجعات الأجهزة واسترداد النقدية (RMA)' },
        { id: 'pos_shifts', label: 'إدارة الوردية والتقفيل اليومي (Z-Report)' },
        { id: 'sales_view', label: 'استعراض فواتير البيع وإعادة الطباعة والمشاركة عبر الواتساب' },
        { id: 'reconciliation_view', label: 'شاشة مراجعة اليومية وطرق الدفع والتدقيق المحاسبي' }
      ]
    },
    {
      group: 'التقسيط والتمويل الاستهلاكي (Installments)',
      items: [
        { id: 'installments_view', label: 'استعراض سجل عقود وأقساط العملاء' },
        { id: 'installments_create', label: 'إنشاء عقود تقسيط مباشر وتقسيط شركات' },
        { id: 'installments_collect', label: 'تحصيل الأقساط وطباعة إيصالات السداد' },
        { id: 'installments_reschedule', label: 'إعادة جدولة وهيكلة الأقساط المتأخرة' }
      ]
    },
    {
      group: 'الأجهزة والمستودعات والجرد (Inventory & Serials)',
      items: [
        { id: 'products_manage', label: 'إضافة وتعديل بيانات الأجهزة والأسعار' },
        { id: 'serials_track', label: 'تتبع السيريالات وشهادات الضمان' },
        { id: 'inventory_transfers', label: 'إجراء أذونات تحويل بين المخازن' },
        { id: 'inventory_audit', label: 'تنفيذ الجرد الفعلي بالباركود' },
        { id: 'stock_requests', label: 'عمل واعتماد طلبات النواقص والإمداد' }
      ]
    },
    {
      group: 'المالية والمشتريات والإدارة (Financial & Admin)',
      items: [
        { id: 'purchases_manage', label: 'تسجيل المشتريات ومراجعة فواتير التوريد' },
        { id: 'cashbox_manage', label: 'الخزينة والمصروفات والتحويلات النقدية' },
        { id: 'reports_view', label: 'الاطلاع على التقارير المالية والأرباح الرسمية' },
        { id: 'customers_manage', label: 'إدارة العملاء وتصنيف الجدارة الائتمانية' },
        { id: 'suppliers_manage', label: 'سجل الموردين والشركات الموزعة' },
        { id: 'settings_manage', label: 'إعدادات المعرض والنسخ الاحتياطي' },
        { id: 'users_manage', label: 'إدارة المستخدمين والصلاحيات' }
      ]
    }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [uData, bData, wData] = await Promise.all([
        api.getUsers().catch(() => []),
        api.getBranches().catch(() => []),
        api.getWarehouses().catch(() => [])
      ]);
      setUsers(uData);
      setBranches(bData);
      setWarehouses(wData);
    } catch (err) {
      setError(err.message || 'خطأ في جلب بيانات المستخدمين');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (newRole) => {
    const roleDef = roles.find(r => r.id === newRole);
    setFormData(prev => ({
      ...prev,
      role: newRole,
      permissions: roleDef ? [...roleDef.defaultPerms] : []
    }));
  };

  const handleTogglePermission = (permId) => {
    setFormData(prev => {
      const exists = prev.permissions.includes(permId);
      return {
        ...prev,
        permissions: exists 
          ? prev.permissions.filter(p => p !== permId)
          : [...prev.permissions, permId]
      };
    });
  };

  const handleSelectAllPerms = () => {
    const all = [];
    availablePermissions.forEach(g => g.items.forEach(i => all.push(i.id)));
    setFormData(prev => ({ ...prev, permissions: all }));
  };

  const handleClearAllPerms = () => {
    setFormData(prev => ({ ...prev, permissions: [] }));
  };

  const handleResetToRoleDefault = () => {
    const roleDef = roles.find(r => r.id === formData.role);
    if (roleDef) {
      setFormData(prev => ({ ...prev, permissions: [...roleDef.defaultPerms] }));
    }
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    try {
      if (editingUserId) {
        await api.updateUser(editingUserId, formData);
        setSuccessMsg('تم تحديث بيانات وصلاحيات المستخدم بنجاح');
      } else {
        await api.createUser(formData);
        setSuccessMsg('تم إضافة المستخدم الجديد ومنحه الصلاحيات بنجاح');
      }
      setShowAddForm(false);
      setEditingUserId(null);
      resetForm();
      loadData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'حدث خطأ أثناء حفظ المستخدم');
    }
  };

  const handleEditClick = (u) => {
    setEditingUserId(u.id);
    const roleDef = roles.find(r => r.id === u.role);
    const existingPerms = Array.isArray(u.permissions) && u.permissions.length > 0 
      ? u.permissions 
      : (roleDef?.defaultPerms || []);

    setFormData({
      username: u.username,
      password: '',
      name: u.name,
      role: u.role,
      branch_id: u.branch_id || '',
      warehouse_id: u.warehouse_id || '',
      phone: u.phone || '',
      status: u.status || 'active',
      pin: u.pin || '',
      permissions: existingPerms
    });
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleStatus = async (user) => {
    if (user.id === 1) {
      alert('لا يمكن إيقاف حساب المدير العام الرئيسي للنظام');
      return;
    }

    const nextStatus = user.status === 'active' ? 'suspended' : 'active';
    const actionLabel = nextStatus === 'active' ? 'تنشيط' : 'إيقاف وتعطيل';

    if (!window.confirm(`هل أنت متأكد من ${actionLabel} حساب المستخدم (${user.name})؟`)) return;

    try {
      await api.toggleUserStatus(user.id, nextStatus);
      setSuccessMsg(`تم ${actionLabel} حساب (${user.name}) بنجاح`);
      loadData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.message || 'خطأ أثناء تعديل حالة المستخدم');
    }
  };

  const handleDeleteUser = async (userId, name) => {
    if (userId === 1) {
      alert('لا يمكن حذف حساب المدير العام الرئيسي للنظام');
      return;
    }
    if (!window.confirm(`تحذير نهائي: هل أنت متأكد تماماً من حذف حساب الموظف (${name}) وإلغاء صلاحياته من قاعدة البيانات؟`)) return;

    try {
      await api.deleteUser(userId);
      setSuccessMsg(`تم حذف المستخدم (${name}) بنجاح`);
      loadData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.message || 'خطأ أثناء حذف المستخدم');
    }
  };

  const resetForm = () => {
    const defRole = 'cashier';
    const roleDef = roles.find(r => r.id === defRole);
    setFormData({
      username: '',
      password: '',
      name: '',
      role: defRole,
      branch_id: '',
      warehouse_id: '',
      phone: '',
      status: 'active',
      permissions: roleDef?.defaultPerms || []
    });
  };

  // Filter users
  const filteredUsers = users.filter(u => {
    const matchesSearch = !search || 
      (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.username || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.phone || '').includes(search);
    const matchesRole = selectedRoleFilter === 'all' || u.role === selectedRoleFilter;
    return matchesSearch && matchesRole;
  });

  const activeCount = users.filter(u => u.status === 'active').length;
  const suspendedCount = users.filter(u => u.status === 'suspended').length;

  return (
    <div className="space-y-6">
      {/* Top Banner & KPIs */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-blue-200 text-xs font-bold mb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>نظام الأمان والرقابة الإدارية</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">إدارة المستخدمين والصلاحيات</h1>
          <p className="text-xs sm:text-sm text-blue-200 mt-1 max-w-xl leading-relaxed">
            إنشاء حسابات الموظفين، منح وتخصيص الصلاحيات الدقيقة لكل شاشة، تجميد أو إيقاف الحسابات، وتعديل وتعيين الفروع
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {!showAddForm && (
            <button
              onClick={() => {
                setEditingUserId(null);
                resetForm();
                setShowAddForm(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-6 py-3 rounded-2xl shadow-lg transition-all duration-200 cursor-pointer flex items-center gap-2 active:scale-98"
            >
              <UserPlus className="w-5 h-5" />
              <span>إضافة موظف / مستخدم جديد</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <UsersIcon className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-bold block">إجمالي المستخدمين</span>
            <span className="text-xl font-black text-slate-900">{users.length}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-bold block">حسابات نشطة</span>
            <span className="text-xl font-black text-emerald-600">{activeCount}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-bold block">حسابات موقوفة</span>
            <span className="text-xl font-black text-rose-600">{suspendedCount}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-bold block">الفروع والمخازن</span>
            <span className="text-xl font-black text-amber-700">{branches.length}</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs font-bold flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Create / Edit Form Card */}
      {showAddForm && (
        <div className="bg-white rounded-3xl border-2 border-blue-500/40 shadow-xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base text-slate-900">
                  {editingUserId ? `تعديل بيانات وصلاحيات المستخدم: ${formData.name}` : 'إنشاء وتعيين موظف جديد بالمنظومة'}
                </h3>
                <p className="text-[11px] text-slate-500">حدد بيانات الدخول والدور الوظيفي والصلاحيات المخصصة</p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowAddForm(false);
                setEditingUserId(null);
              }}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSaveUser} className="space-y-6 text-xs">
            {/* Basic Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-700 font-extrabold mb-1">الاسم ثلاثي *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: محمود صابر السيد"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-extrabold mb-1">اسم المستخدم (Login Username) *</label>
                <input
                  type="text"
                  required
                  disabled={!!editingUserId}
                  placeholder="cashier_faisal, ahmed99..."
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-extrabold mb-1">
                  {editingUserId ? 'كلمة المرور الجديدة (اتركها فارغة للإبقاء على الحالية)' : 'كلمة المرور *'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required={!editingUserId}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-3.5 pl-10 py-2.5 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-extrabold mb-1">الدور الوظيفي الرئيسي *</label>
                <select
                  value={formData.role}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 font-extrabold text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-extrabold mb-1">الفرع المخصص للعمل به</label>
                <select
                  value={formData.branch_id || ''}
                  onChange={(e) => setFormData({ ...formData, branch_id: e.target.value ? Number(e.target.value) : '' })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">🏢 جميع الفروع (صلاحية كاملة على كل الفروع والمعارض)</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-extrabold mb-1">المستودع / المخزن التابع له</label>
                <select
                  value={formData.warehouse_id || ''}
                  onChange={(e) => setFormData({ ...formData, warehouse_id: e.target.value ? Number(e.target.value) : '' })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">📦 جميع المخازن (صلاحية كاملة على كل المستودعات)</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-extrabold mb-1">حالة الحساب *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className={`w-full border rounded-xl px-3.5 py-2.5 font-black focus:outline-none ${
                    formData.status === 'active' 
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                      : 'bg-rose-50 border-rose-300 text-rose-800'
                  }`}
                >
                  <option value="active">نشط (مسموح بالدخول للنظام)</option>
                  <option value="suspended">موقوف / معطل (ممنوع من تسجيل الدخول)</option>
                </select>
              </div>

              {/* Personal Manager PIN Field (Requirement 17) */}
              {(formData.role === 'admin' || formData.role === 'manager') && (
                <div className="bg-amber-50/90 border border-amber-300 rounded-2xl p-4 sm:col-span-2 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <label className="block text-amber-950 font-black text-xs mb-1 flex items-center gap-1.5">
                        <KeyRound className="w-4 h-4 text-amber-700" />
                        <span>الرمز السري الشخصي لتفويض المدير (PIN) *</span>
                      </label>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        يخصص هذا الرمز السري لهذا المدير حصراً لاعتماد الخصومات، المرتجعات، وإلغاء/تعديل أذونات التحويل بدقة دون مشاركة رمز عام
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        required
                        maxLength={8}
                        placeholder="1234"
                        value={formData.pin || ''}
                        onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                        className="w-36 bg-white border-2 border-amber-400 focus:border-amber-600 rounded-xl px-3 py-2 font-mono font-black text-base text-amber-950 text-center tracking-widest focus:outline-none shadow-inner"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Granular Permissions Section */}
            <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/60 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div>
                  <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-600" />
                    <span>مصفوفة الصلاحيات المخصصة لهذا المستخدم</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    يمكنك اعتماد الصلاحيات الافتراضية للدور أو اختيار الصلاحيات المحددة بدقة
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetToRoleDefault}
                    className="px-2.5 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg text-[10px] font-bold cursor-pointer"
                  >
                    استعادة افتراضي الدور ({formData.role})
                  </button>
                  <button
                    type="button"
                    onClick={handleSelectAllPerms}
                    className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-[10px] font-bold cursor-pointer"
                  >
                    تحديد الكل
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAllPerms}
                    className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-[10px] font-bold cursor-pointer"
                  >
                    إلغاء التحديد
                  </button>
                </div>
              </div>

              {/* Permissions Checkboxes Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availablePermissions.map((group, gIdx) => (
                  <div key={gIdx} className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <span className="font-extrabold text-blue-900 text-xs block border-b border-slate-100 pb-1.5">
                      {group.group}
                    </span>
                    <div className="space-y-1.5 pt-1">
                      {group.items.map(item => {
                        const isChecked = formData.permissions.includes(item.id);
                        return (
                          <label
                            key={item.id}
                            className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer transition ${
                              isChecked ? 'bg-blue-50/70 text-slate-900 font-bold' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleTogglePermission(item.id)}
                              className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                            />
                            <span className="text-[11px]">{item.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingUserId(null);
                }}
                className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-7 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold shadow-lg shadow-blue-500/25 cursor-pointer flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>{editingUserId ? 'تحديث بيانات وصلاحيات المستخدم' : 'حفظ وإنشاء الحساب'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users List & Filter */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            <input
              type="text"
              placeholder="ابحث بالاسم، اسم المستخدم، أو رقم الهاتف..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pr-10 pl-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-bold">تصفية حسب الدور:</span>
            <select
              value={selectedRoleFilter}
              onChange={(e) => setSelectedRoleFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold"
            >
              <option value="all">جميع الأدوار</option>
              {roles.map(r => (
                <option key={r.id} value={r.id}>{r.title}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-600 font-extrabold border-b border-slate-200">
              <tr>
                <th className="p-3.5">الموظف / الاسم</th>
                <th className="p-3.5">اسم الدخول</th>
                <th className="p-3.5">الدور الوظيفي</th>
                <th className="p-3.5">الفرع والمستودع</th>
                <th className="p-3.5">الصلاحيات الممنوحة</th>
                <th className="p-3.5 text-center">الحالة</th>
                <th className="p-3.5 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u) => {
                  const roleObj = roles.find(r => r.id === u.role);
                  const permsCount = Array.isArray(u.permissions) ? u.permissions.length : 0;
                  const isActive = u.status === 'active';

                  return (
                    <tr key={u.id} className={`hover:bg-slate-50/70 transition ${!isActive ? 'bg-rose-50/20' : ''}`}>
                      <td className="p-3.5 font-bold text-slate-800">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                            isActive ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'
                          }`}>
                            {u.role === 'admin' ? '👑' : u.role === 'manager' ? '🏬' : u.role === 'cashier' ? '💻' : u.role === 'storekeeper' ? '📦' : '⚖️'}
                          </div>
                          <div>
                            <span className="block font-black text-slate-900">{u.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono" dir="ltr">{u.phone || 'بدون هاتف'}</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5 font-mono text-blue-700 font-extrabold" dir="ltr">
                        {u.username}
                      </td>

                      <td className="p-3.5">
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black inline-block ${
                            u.role === 'admin' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                            u.role === 'manager' ? 'bg-blue-100 text-blue-900 border border-blue-300' :
                            u.role === 'cashier' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' :
                            u.role === 'storekeeper' ? 'bg-orange-100 text-orange-900 border border-orange-300' :
                            'bg-purple-100 text-purple-900 border border-purple-300'
                          }`}>
                            {roleObj?.title || u.role}
                          </span>
                          {(u.role === 'admin' || u.role === 'manager') && (
                            <span className="inline-flex items-center gap-1 text-[9.5px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded" title="رمز التفويض السري">
                              <KeyRound className="w-2.5 h-2.5 text-amber-600" />
                              <span>PIN: {u.pin || '1234'}</span>
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-3.5 font-bold text-slate-700">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-slate-900 font-bold">{u.branch_name ? `🏢 ${u.branch_name}` : '🏢 جميع الفروع'}</span>
                          <span className="text-[10px] text-slate-500">{u.warehouse_name ? `📦 ${u.warehouse_name}` : '📦 جميع المخازن'}</span>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">
                          {permsCount > 0 ? `${permsCount} صلاحية مفعلة` : 'صلاحيات الدور الافتراضية'}
                        </span>
                      </td>

                      <td className="p-3.5 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black inline-flex items-center gap-1 ${
                          isActive 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          {isActive ? 'نشط' : 'موقوف'}
                        </span>
                      </td>

                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Toggle Status (Suspend / Activate) */}
                          {u.id !== 1 && (
                            <button
                              onClick={() => handleToggleStatus(u)}
                              className={`p-1.5 rounded-lg font-bold text-xs transition cursor-pointer ${
                                isActive 
                                  ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' 
                                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              }`}
                              title={isActive ? 'إيقاف وتعطيل الحساب مؤقتاً' : 'تنشيط وإعادة تفعيل الحساب'}
                            >
                              <Power className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Edit Button */}
                          <button
                            onClick={() => handleEditClick(u)}
                            className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer transition"
                            title="تعديل البيانات والصلاحيات"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Button */}
                          {u.id !== 1 && (
                            <button
                              onClick={() => handleDeleteUser(u.id, u.name)}
                              className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition"
                              title="حذف الحساب نهائياً"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    {loading ? 'جاري تحميل بيانات المستخدمين...' : 'لا يوجد مستخدمين مطابقين لمعايير البحث'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
