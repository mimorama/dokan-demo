import React, { useState, useEffect } from 'react';
import { 
  Users, 
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
  AlertCircle
} from 'lucide-react';
import { api } from '../api';

export default function UsersModal({ isOpen, onClose, currentUser }) {
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'cashier',
    branch_id: '',
    warehouse_id: '',
    phone: '',
    status: 'active',
    pin: ''
  });

  const roles = [
    { id: 'admin', title: 'المدير العام', desc: 'صلاحيات كاملة غير محدودة على كل شاشات النظام والمستخدمين والتقارير' },
    { id: 'manager', title: 'مدير فرع', desc: 'إدارة مبيعات الفرع، المخازن، التحويلات، الأقساط، العملاء والتقارير' },
    { id: 'cashier', title: 'كاشير ومبيعات', desc: 'إصدار فواتير البيع، تسجيل العملاء، والبحث عن السيريالات والأجهزة' },
    { id: 'storekeeper', title: 'أمين مخزن ومستودع', desc: 'جرد البضائع، استلام التوريدات، نقل البضائع، ومعالجة طلبات النواقص' },
    { id: 'accountant', title: 'مراجع حسابات ومالية', desc: 'تدقيق واعتماد فواتير البيع والشراء، الخزينة، البنوك، والتقارير المالية الرسمية' }
  ];

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

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

  if (!isOpen) return null;

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    try {
      if (editingUserId) {
        await api.updateUser(editingUserId, formData);
        setSuccessMsg('تم تحديث بيانات المستخدم بنجاح');
      } else {
        await api.createUser(formData);
        setSuccessMsg('تمت إضافة المستخدم بنجاح');
      }
      setShowAddForm(false);
      setEditingUserId(null);
      setFormData({
        username: '',
        password: '',
        name: '',
        role: 'cashier',
        branch_id: '',
        warehouse_id: '',
        phone: '',
        status: 'active'
      });
      loadData();
    } catch (err) {
      setError(err.message || 'حدث خطأ أثناء حفظ المستخدم');
    }
  };

  const handleEditClick = (u) => {
    setEditingUserId(u.id);
    setFormData({
      username: u.username,
      password: '',
      name: u.name,
      role: u.role,
      branch_id: u.branch_id || '',
      warehouse_id: u.warehouse_id || '',
      phone: u.phone || '',
      status: u.status || 'active'
    });
    setShowAddForm(true);
  };

  const handleDeleteUser = async (userId, name) => {
    if (userId === 1) {
      alert('لا يمكن حذف حساب المدير العام الرئيسي');
      return;
    }
    if (!window.confirm(`هل أنت متأكد من حذف حساب الموظف (${name}) نهائياً؟`)) return;

    try {
      await api.deleteUser(userId);
      setSuccessMsg('تم حذف المستخدم بنجاح');
      loadData();
    } catch (err) {
      setError(err.message || 'خطأ أثناء حذف المستخدم');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full p-6 max-h-[92vh] flex flex-col border border-slate-200 font-['Cairo',sans-serif]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900">إدارة المستخدمين وصلاحيات الموظفين</h3>
              <p className="text-xs text-slate-500">توزيع الأدوار الوظيفية (مدير، كاشير، أمين مخزن، مراجع مالي) وتعيين الفروع</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notifications */}
        {error && (
          <div className="mt-3 bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="mt-3 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-2 rounded-xl text-xs flex items-center gap-2">
            <Check className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {/* Action Row */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">قائمة حسابات طاقم العمل ({users.length}):</span>
            {!showAddForm && (
              <button
                onClick={() => {
                  setEditingUserId(null);
                  setFormData({
                    username: '',
                    password: '',
                    name: '',
                    role: 'cashier',
                    branch_id: branches[0]?.id || 1,
                    phone: '',
                    status: 'active'
                  });
                  setShowAddForm(true);
                }}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>إضافة موظف / مستخدم جديد</span>
              </button>
            )}
          </div>

          {/* Add / Edit Form */}
          {showAddForm && (
            <form onSubmit={handleSaveUser} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 font-bold text-slate-800">
                <span>{editingUserId ? 'تعديل بيانات المستخدم' : 'تسجيل موظف ومستخدم جديد في المنظومة'}</span>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  إلغاء
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">الاسم ثلاثي *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: محمود صابر السيد"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">اسم المستخدم (Login Username) *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingUserId}
                    placeholder="mahmoud_sales"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">
                    {editingUserId ? 'كلمة المرور (اتركها فارغة للتخطي)' : 'كلمة المرور *'}
                  </label>
                  <input
                    type="password"
                    required={!editingUserId}
                    placeholder="••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-mono"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">الدور الوظيفي والصلاحيات *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-blue-700"
                  >
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">الفرع المخصص</label>
                  <select
                    value={formData.branch_id || ''}
                    onChange={(e) => setFormData({ ...formData, branch_id: e.target.value ? Number(e.target.value) : '' })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold"
                  >
                    <option value="">🏢 جميع الفروع (صلاحية كاملة)</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">المستودع / المخزن</label>
                  <select
                    value={formData.warehouse_id || ''}
                    onChange={(e) => setFormData({ ...formData, warehouse_id: e.target.value ? Number(e.target.value) : '' })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold"
                  >
                    <option value="">📦 جميع المخازن (صلاحية كاملة)</option>
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">رقم الهاتف</label>
                  <input
                    type="text"
                    placeholder="010..."
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-mono"
                    dir="ltr"
                  />
                </div>

                {(formData.role === 'admin' || formData.role === 'manager') && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 sm:col-span-2">
                    <label className="block text-amber-950 font-bold mb-1">الرمز السري لتفويض المدير (PIN) *</label>
                    <input
                      type="text"
                      required
                      maxLength={8}
                      placeholder="1234"
                      value={formData.pin || ''}
                      onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                      className="w-32 bg-white border border-amber-400 rounded-xl px-3 py-1.5 font-mono font-bold text-center text-amber-900"
                      dir="ltr"
                    />
                  </div>
                )}
              </div>

              {/* Role explanation alert */}
              <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-xl text-[11px] text-blue-800">
                <span className="font-bold">الصلاحيات الممنوحة لهذا الدور: </span>
                {roles.find(r => r.id === formData.role)?.desc}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200 font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md cursor-pointer"
                >
                  {editingUserId ? 'تحديث البيانات' : 'حفظ الموظف الجديد'}
                </button>
              </div>
            </form>
          )}

          {/* Users Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">الموظف</th>
                  <th className="p-3">اسم الدخول</th>
                  <th className="p-3">الدور الوظيفي والصلاحيات</th>
                  <th className="p-3">الفرع والمستودع</th>
                  <th className="p-3">الهاتف</th>
                  <th className="p-3 text-center">الحالة</th>
                  <th className="p-3 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {users.map((u) => {
                  const roleObj = roles.find(r => r.id === u.role);
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70">
                      <td className="p-3 font-bold text-slate-800 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-[11px] text-slate-700">
                          {u.name?.charAt(0) || 'م'}
                        </div>
                        <span>{u.name}</span>
                      </td>
                      <td className="p-3 font-mono text-blue-700 font-bold" dir="ltr">{u.username}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black ${
                          u.role === 'admin' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                          u.role === 'manager' ? 'bg-blue-100 text-blue-900 border border-blue-300' :
                          u.role === 'cashier' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' :
                          u.role === 'storekeeper' ? 'bg-orange-100 text-orange-900 border border-orange-300' :
                          'bg-purple-100 text-purple-900 border border-purple-300'
                        }`}>
                          {roleObj?.title || u.role}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-slate-700">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-slate-900 font-bold">{u.branch_name ? `🏢 ${u.branch_name}` : '🏢 جميع الفروع'}</span>
                          <span className="text-[10px] text-slate-500">{u.warehouse_name ? `📦 ${u.warehouse_name}` : '📦 جميع المخازن'}</span>
                        </div>
                      </td>
                      <td className="p-3 font-mono" dir="ltr">{u.phone || '-'}</td>
                      <td className="p-3 text-center">
                        <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">
                          نشط
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEditClick(u)}
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 cursor-pointer"
                            title="تعديل"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {u.id !== 1 && (
                            <button
                              onClick={() => handleDeleteUser(u.id, u.name)}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer"
                              title="حذف"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
