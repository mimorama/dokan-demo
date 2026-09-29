import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  Building2, 
  Sparkles, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle,
  X
} from 'lucide-react';
import { api } from '../api';

export default function LoginModal({ isOpen, onClose, onLoginSuccess, currentLoggedInUser }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const quickUsers = [
    {
      role: 'admin',
      roleTitle: 'المدير العام (صلاحيات كاملة)',
      name: 'الحاج عبد العزيز',
      branch: 'الإدارة العامة والفرع الرئيسي',
      username: 'admin',
      pass: '123',
      color: 'from-amber-600 to-amber-800',
      badgeBg: 'bg-amber-100 text-amber-900 border-amber-300'
    },
    {
      role: 'manager',
      roleTitle: 'مدير فرع فيصل',
      name: 'أحمد عبد العزيز',
      branch: 'فرع فيصل الرئيسي',
      username: 'faisal_mgr',
      pass: '123',
      color: 'from-blue-600 to-blue-800',
      badgeBg: 'bg-blue-100 text-blue-900 border-blue-300'
    },
    {
      role: 'cashier',
      roleTitle: 'كاشير ومبيعات',
      name: 'محمود صابر',
      branch: 'صالة العرض - فيصل',
      username: 'cashier1',
      pass: '123',
      color: 'from-emerald-600 to-emerald-800',
      badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300'
    },
    {
      role: 'storekeeper',
      roleTitle: 'أمين المستودع المركزي',
      name: 'سعيد النجار',
      branch: 'المستودع الرئيسي - المنطقة الصناعية',
      username: 'store1',
      pass: '123',
      color: 'from-orange-600 to-orange-800',
      badgeBg: 'bg-orange-100 text-orange-900 border-orange-300'
    },
    {
      role: 'accountant',
      roleTitle: 'مراجع الحسابات والمالية',
      name: 'أ / سامح حسني',
      branch: 'الإدارة المالية المركزية',
      username: 'accountant1',
      pass: '123',
      color: 'from-purple-600 to-purple-800',
      badgeBg: 'bg-purple-100 text-purple-900 border-purple-300'
    }
  ];

  const handleLogin = async (u = username, p = password) => {
    setError('');
    setLoading(true);
    try {
      const res = await api.login(u, p);
      if (res.user) {
        localStorage.setItem('dokan_user', JSON.stringify(res.user));
        onLoginSuccess(res.user);
      }
    } catch (err) {
      setError(err.message || 'فشل تسجيل الدخول، تأكد من اسم المستخدم وكلمة المرور');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (qu) => {
    setUsername(qu.username);
    setPassword(qu.pass);
    handleLogin(qu.username, qu.pass);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Header with Luxury Brand Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-white text-center relative">
          {currentLoggedInUser && (
            <button
              onClick={onClose}
              className="absolute left-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-800/80 border border-slate-700 p-2 flex items-center justify-center shadow-lg mb-3">
            <img src="/logo.svg" alt="دكان عبد العزيز" className="w-full h-full object-contain" />
          </div>

          <h2 className="text-xl font-black text-amber-400">معرض دكان عبد العزيز للأجهزة الكهربائية</h2>
          <p className="text-xs text-slate-300 mt-1 font-medium">
            منظومة إدارة المعارض، نقاط البيع، المخازن والمراجعة المالية
          </p>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Preset 1-Click Role Accounts */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                الدخول السريع بحسابات الموظفين والإدارة (اختر دورك):
              </span>
              <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded font-mono">
                تجريبي / 1-Click
              </span>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {quickUsers.map((qu) => {
                const isCurrent = currentLoggedInUser?.username === qu.username;
                return (
                  <button
                    key={qu.username}
                    type="button"
                    onClick={() => handleQuickLogin(qu)}
                    disabled={loading}
                    className={`w-full text-right p-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                      isCurrent 
                        ? 'border-blue-500 bg-blue-50/70 shadow-xs ring-1 ring-blue-400' 
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${qu.color} text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-xs`}>
                        {qu.role === 'admin' ? '👑' : qu.role === 'manager' ? '🏬' : qu.role === 'cashier' ? '💻' : qu.role === 'storekeeper' ? '📦' : '⚖️'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 truncate">{qu.name}</span>
                          <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded border ${qu.badgeBg}`}>
                            {qu.roleTitle}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 block truncate">{qu.branch}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      {isCurrent && (
                        <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold">
                          الحساب الحالي
                        </span>
                      )}
                      <span className="text-xs text-blue-600 font-bold hover:underline">دخول ⬅</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-3 text-slate-400 text-[11px] font-bold">أو تسجيل الدخول اليدوي</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Manual Login Form */}
          <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">اسم المستخدم</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="admin, cashier1..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2 text-xs font-bold focus:outline-none focus:border-blue-500"
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">كلمة المرور</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                <input
                  type="password"
                  required
                  placeholder="••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2 text-xs font-bold focus:outline-none focus:border-blue-500"
                  dir="ltr"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>{loading ? 'جاري التحقق...' : 'تسجيل الدخول'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
