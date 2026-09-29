import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Save, 
  Store, 
  ShieldCheck, 
  FileText, 
  CheckCircle2, 
  History, 
  Database, 
  Download, 
  Lock, 
  KeyRound, 
  AlertTriangle, 
  RefreshCw,
  Clock,
  Shield,
  User,
  HardDrive,
  Upload
} from 'lucide-react';
import { api } from '../api';

export default function Settings({ onSettingsUpdated }) {
  const [activeTab, setActiveTab] = useState('general'); // 'general', 'security', 'backups'

  const [formData, setFormData] = useState({
    store_name: '',
    tagline: '',
    phone: '',
    phone2: '',
    address: '',
    commercial_reg: '',
    tax_number: '',
    currency: 'ج.م',
    warranty_policy: '',
    installment_terms: '',
    max_cashier_discount_percent: 10,
    max_cashier_discount_amount: 500,
    manager_override_pin: '1234',
    logo_url: '/logo.png'
  });

  const [loading, setLoading] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Security Activity Logs state
  const [activityLogs, setActivityLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logFilter, setLogFilter] = useState('');

  // Backups state
  const [backups, setBackups] = useState([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (activeTab === 'security') {
      loadActivityLogs();
    } else if (activeTab === 'backups') {
      loadBackupsList();
    }
  }, [activeTab]);

  const loadSettings = async () => {
    try {
      const data = await api.getSettings();
      if (data) {
        setFormData(prev => ({
          ...prev,
          ...data,
          max_cashier_discount_percent: data.max_cashier_discount_percent ?? 10,
          max_cashier_discount_amount: data.max_cashier_discount_amount ?? 500,
          manager_override_pin: data.manager_override_pin || '1234'
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadActivityLogs = async () => {
    setLoadingLogs(true);
    try {
      const logs = await api.getActivityLogs();
      setActivityLogs(logs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const loadBackupsList = async () => {
    setLoadingBackups(true);
    try {
      const list = await api.getBackups();
      setBackups(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBackups(false);
    }
  };

  const handleCreateBackup = async () => {
    setCreatingBackup(true);
    try {
      const res = await api.createBackup();
      const fn = res?.backup_filename || res?.filename || 'dokan_backup.db';
      alert(`تم إنشاء نسخة احتياطية بنجاح بنظام WAL Checkpoint!\nاسم الملف: ${fn}`);
      loadBackupsList();
    } catch (err) {
      alert(err.message || 'خطأ أثناء إنشاء النسخة الاحتياطية');
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleLogoFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('يرجى اختيار ملف صورة صالح (PNG, JPG, SVG, WebP)');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 2 ميجابايت');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData(prev => ({
        ...prev,
        logo_url: event.target.result
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.updateSettings(formData);
      setSavedSuccess(true);
      const updated = res?.settings || formData;
      setFormData(prev => ({ ...prev, ...updated }));
      if (onSettingsUpdated) onSettingsUpdated(updated);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      alert(err.message || 'خطأ أثناء حفظ الإعدادات');
    }
  };

  const filteredLogs = activityLogs.filter(log => {
    if (!logFilter) return true;
    const q = logFilter.toLowerCase();
    const actionStr = (log.action_type || log.action || '').toLowerCase();
    const userStr = (log.user_name || '').toLowerCase();
    const descStr = (log.description || '').toLowerCase();
    const detailsStr = (typeof log.details === 'string' ? log.details : JSON.stringify(log.details || '')).toLowerCase();
    return (
      actionStr.includes(q) ||
      userStr.includes(q) ||
      descStr.includes(q) ||
      detailsStr.includes(q)
    );
  });

  return (
    <div className="max-w-4xl space-y-6">
      {/* Page Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-blue-600" />
            إعدادات النظام والرقابة والنسخ الاحتياطي
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            تخصيص المعرض، سقوف الخصومات ورمز المدير، سجل الرقابة والأمان، والنسخ الاحتياطي
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold animate-bounce">
            <CheckCircle2 className="w-4 h-4" />
            <span>تم الحفظ بنجاح!</span>
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex bg-slate-200/70 p-1 rounded-2xl text-xs font-bold gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'general' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>إعدادات المعرض وسقوف الخصم</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'security' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>سجل الرقابة وتتبع النشاط (Audit Logs)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('backups')}
          className={`flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'backups' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>النسخ الاحتياطي الذكي (Backups)</span>
        </button>
      </div>

      {/* Tab 1: General Settings & Ceilings */}
      {activeTab === 'general' && (
        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          {/* Store Profile */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Store className="w-4 h-4 text-blue-600" />
              بيانات المعرض والترويسة
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-600 font-bold mb-1">اسم المعرض / المحل *</label>
                <input
                  type="text"
                  required
                  value={formData.store_name}
                  onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-bold text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-1">الشعار والوصف المختصر</label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-600 font-bold mb-1">رقم الهاتف الأساسي</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-1">رقم هاتف إضافي / واتساب</label>
                <input
                  type="text"
                  value={formData.phone2}
                  onChange={(e) => setFormData({ ...formData, phone2: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-1">العملة الافتراضية</label>
                <input
                  type="text"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-center"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-slate-600 font-bold mb-1">العنوان بالتفصيل</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-1">السجل التجاري والبطاقة الضريبية</label>
                <input
                  type="text"
                  placeholder="س.ت: 123 | ب.ض: 456"
                  value={formData.tax_number}
                  onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>
            </div>

            {/* Logo Section */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-slate-700 font-extrabold text-xs">شعار المعرض (Logo)</label>
                {formData.logo_url && formData.logo_url !== '/logo.png' && (
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, logo_url: '/logo.png' }))}
                    className="text-[11px] text-rose-600 hover:text-rose-700 font-bold cursor-pointer"
                  >
                    استعادة الشعار الرسمي (/logo.png)
                  </button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-52 h-20 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-2 flex items-center justify-center overflow-hidden shadow-xs shrink-0">
                  <img
                    src={formData.logo_url || '/logo.png'}
                    alt="لوجو المعرض"
                    className="max-h-full max-w-full object-contain"
                    onError={(e) => { e.target.src = '/logo.png'; }}
                  />
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 transition">
                      <Upload className="w-4 h-4 text-white" />
                      <span>اختيار لوجو من جهاز الكمبيوتر</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoFileUpload}
                        className="hidden"
                      />
                    </label>

                    <span className="text-slate-400 text-xs">أو كتابة رابط/مسار اللوجو:</span>
                  </div>

                  <input
                    type="text"
                    placeholder="رابط أو مسار الشعار (مثال: /logo.svg أو https://...)"
                    value={formData.logo_url || ''}
                    onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-xs"
                    dir="ltr"
                  />
                  <p className="text-[11px] text-slate-400">
                    يظهر هذا الشعار تلقائياً على رأس الفواتير المطبوعة A4، الإيصالات الحرارية (80mm)، عقود التقسيط، تقارير الجرد المعتمدة، وبوابة النظام.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Discount Limits & Manager Override Authorization */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Lock className="w-4 h-4 text-rose-600" />
              سقوف خصومات الكاشير ورمز تفويض الإدارة (Manager Override)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-600 font-bold mb-1">أقصى خصم مسموح به للكاشير ({formData.currency})</label>
                <input
                  type="number"
                  value={formData.max_cashier_discount_amount}
                  onChange={(e) => setFormData({ ...formData, max_cashier_discount_amount: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold"
                />
                <span className="text-[10px] text-slate-400 block mt-1">أي خصم يتجاوز هذا المبلغ يتطلب موافقة المدير</span>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">أقصى نسبة خصم للكاشير (%)</label>
                <input
                  type="number"
                  value={formData.max_cashier_discount_percent}
                  onChange={(e) => setFormData({ ...formData, max_cashier_discount_percent: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold"
                />
                <span className="text-[10px] text-slate-400 block mt-1">النسبة المئوية القصوى المسموح بها للكاشير</span>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">الرمز السري لتفويض المدير (PIN) *</label>
                <input
                  type="text"
                  required
                  value={formData.manager_override_pin}
                  onChange={(e) => setFormData({ ...formData, manager_override_pin: e.target.value })}
                  className="w-full bg-slate-50 border border-rose-200 rounded-xl px-3 py-2 font-mono font-bold text-center tracking-widest text-sm text-rose-700"
                />
                <span className="text-[10px] text-slate-400 block mt-1">يُدخل هذا الرمز لتمرير الخصومات واستثناءات القائمة السوداء</span>
              </div>
            </div>
          </div>

          {/* Legal Policies & Prints */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              شروط الضمان وسياسة الاستبدال بالفاتورة
            </h3>

            <div>
              <label className="block text-slate-600 font-bold mb-1">نص شروط الضمان المطبوع بأسفل الفاتورة</label>
              <textarea
                rows={3}
                value={formData.warranty_policy}
                onChange={(e) => setFormData({ ...formData, warranty_policy: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-bold mb-1">نص إقرار واستلام جهاز وإيصال الأمانة بعقد التقسيط</label>
              <textarea
                rows={3}
                value={formData.installment_terms}
                onChange={(e) => setFormData({ ...formData, installment_terms: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 leading-relaxed"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm px-8 py-3 rounded-2xl shadow-lg transition-all cursor-pointer flex items-center gap-2 active:scale-98"
            >
              <Save className="w-5 h-5" />
              <span>حفظ جميع الإعدادات</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Activity Logs & Security Audit Trail */}
      {activeTab === 'security' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <input
                type="text"
                placeholder="ابحث في سجل العمليات باسم الموظف أو نوع الإجراء..."
                value={logFilter}
                onChange={(e) => setLogFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
              />
            </div>
            <button
              onClick={loadActivityLogs}
              disabled={loadingLogs}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin' : ''}`} />
              <span>تحديث السجل</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold">
                  <tr>
                    <th className="py-3 px-4">التاريخ والوقت</th>
                    <th className="py-3 px-4">الموظف / المستخدم</th>
                    <th className="py-3 px-4">نوع العملية</th>
                    <th className="py-3 px-4">تفاصيل العملية</th>
                    <th className="py-3 px-4">عنوان IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredLogs.length > 0 ? (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap" dir="ltr">
                          {new Date(log.created_at).toLocaleString('ar-EG')}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block">{log.user_name || 'النظام'}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] inline-block ${
                            (log.action_type || log.action || '').includes('REFUND') ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                            (log.action_type || log.action || '').includes('SHIFT') ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                            (log.action_type || log.action || '').includes('LOGIN') ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                            (log.action_type || log.action || '').includes('SALE') ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                            (log.action_type || log.action || '').includes('INSTALLMENT') ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                            (log.action_type || log.action || '').includes('USER') ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
                            (log.action_type || log.action || '').includes('BACKUP') ? 'bg-cyan-100 text-cyan-800 border border-cyan-200' :
                            (log.action_type || log.action || '').includes('CASH') ? 'bg-teal-100 text-teal-800 border border-teal-200' :
                            'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                            {log.action_type || log.action || 'عملية نظام'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-slate-800 font-bold">{log.description || '-'}</div>
                          {log.details && log.details !== '{}' && (
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5 max-w-md truncate" dir="ltr">
                              {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-400 text-[11px]" dir="ltr">{log.ip_address || '-'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        {loadingLogs ? 'جاري تحميل السجل الرقابي...' : 'لا توجد عمليات مسجلة في السجل الرقابي'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Database Backups */}
      {activeTab === 'backups' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-3xl p-6 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <HardDrive className="w-5 h-5 text-blue-300" />
                <h3 className="font-extrabold text-base">النسخ الاحتياطي الذكي وقواعد البيانات</h3>
              </div>
              <p className="text-blue-100 text-xs max-w-lg leading-relaxed">
                إنشاء لقطات فورية وآمنة لقاعدة بيانات المعرض كاملة تشمل الفواتير والأقساط والمخزون وحركات الخزينة بنظام التحقق ونقطة تفتيش WAL Checkpoint.
              </p>
            </div>

            <button
              onClick={handleCreateBackup}
              disabled={creatingBackup}
              className="bg-white hover:bg-slate-100 text-blue-900 font-extrabold px-6 py-3 rounded-2xl shadow-md cursor-pointer flex items-center gap-2 whitespace-nowrap self-start sm:self-auto"
            >
              <Database className="w-4 h-4 text-blue-600" />
              <span>{creatingBackup ? 'جاري إنشاء النسخة...' : 'إنشاء نسخة احتياطية فورية الآن'}</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h4 className="font-extrabold text-xs text-slate-800">النسخ الاحتياطية المتوفرة على السيرفر ({backups.length}):</h4>
              <button
                onClick={loadBackupsList}
                className="text-xs text-blue-600 hover:underline font-bold"
              >
                تحديث القائمة
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold">
                  <tr>
                    <th className="py-3 px-4">اسم ملف النسخة</th>
                    <th className="py-3 px-4">حجم الملف</th>
                    <th className="py-3 px-4">تاريخ الإنشاء</th>
                    <th className="py-3 px-4 text-center">تحميل وتنزيل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {backups.length > 0 ? (
                    backups.map((b, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-mono font-bold text-blue-700" dir="ltr">{b.filename}</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-700" dir="ltr">{b.size}</td>
                        <td className="py-3 px-4 font-mono text-slate-500" dir="ltr">
                          {new Date(b.created_at).toLocaleString('ar-EG')}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <a
                            href={`/api/backup/download/${b.filename}`}
                            download={b.filename}
                            className="bg-slate-100 hover:bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold transition inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>تحميل لقطة DB</span>
                          </a>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">
                        {loadingBackups ? 'جاري فحص مجلد النسخ الاحتياطية...' : 'لا توجد نسخ احتياطية محفوظة حتى الآن'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
