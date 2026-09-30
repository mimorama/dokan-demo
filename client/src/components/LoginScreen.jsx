import React, { useState } from 'react';
import { 
  Lock, 
  User, 
  KeyRound, 
  ShieldCheck, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Server
} from 'lucide-react';
import { api } from '../api';

export default function LoginScreen({ settings, onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const storeName = settings?.store_name || 'معرض دكان عبد العزيز للأجهزة الكهربائية';
  const logoUrl = settings?.logo_url || '/logo.svg';

  const handleLogin = async (e) => {
    e?.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('يرجى إدخال اسم المستخدم وكلمة المرور');
      return;
    }

    setLoading(true);
    try {
      const res = await api.login(username.trim(), password.trim());
      if (res && res.user) {
        onLoginSuccess(res.user);
      } else {
        setError('بيانات الدخول غير صحيحة، يرجى المحاولة مجدداً');
      }
    } catch (err) {
      setError(err.message || 'فشل تسجيل الدخول، تأكد من صحة اسم المستخدم وكلمة المرور');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col justify-between p-4 sm:p-6 text-slate-800 font-['Cairo',sans-serif]" dir="rtl">
      {/* Top Bar Indicator */}
      <div className="max-w-4xl w-full mx-auto flex items-center justify-between text-xs text-slate-400 pt-2 pb-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-bold text-slate-300">نظام التشغيل الآمن متصل</span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[11px] bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700">
          <Server className="w-3.5 h-3.5 text-blue-400" />
          <span>منفذ النظام: 5959</span>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200/80 my-auto">
        {/* Brand Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-6 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="w-20 h-20 mx-auto rounded-2xl bg-white/10 border border-white/20 p-3 flex items-center justify-center shadow-inner mb-3">
            <img 
              src={logoUrl} 
              alt={storeName} 
              className="max-h-full max-w-full object-contain drop-shadow"
              onError={(e) => { e.target.src = '/logo.svg'; }}
            />
          </div>

          <h1 className="text-xl font-black text-amber-400 tracking-tight">{storeName}</h1>
          <p className="text-xs text-blue-200 mt-1 font-medium">
            بوابة تسجيل الدخول والمصادقة الأمنية للنظام
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 space-y-5">
          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 text-xs text-rose-700 font-bold flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">اسم المستخدم *</label>
              <div className="relative">
                <div className="absolute right-3.5 top-3 text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="admin, cashier1, store1..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-10 pl-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">كلمة المرور *</label>
              <div className="relative">
                <div className="absolute right-3.5 top-3 text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-10 pl-10 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white font-black py-3 rounded-xl text-xs shadow-lg shadow-blue-500/25 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 mt-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>{loading ? 'جاري التحقق والمصادقة...' : 'دخول إلى النظام'}</span>
            </button>
          </form>

          {/* Security Information Box */}
          <div className="pt-3 border-t border-slate-200">
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex items-start gap-2.5 text-right">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="text-[11px] font-bold text-slate-700">دخول آمن ومشفر للنظام</p>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  يرجى كتابة اسم المستخدم وكلمة المرور الخاصة بك يدوياً. جميع عمليات الدخول مسجلة في سجل الرقابة وتتبع النشاط.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer System Info */}
      <footer className="text-center text-xs text-slate-500 py-4">
        <p className="font-bold text-slate-400">{storeName} &copy; 2026</p>
        <p className="text-[11px] text-slate-600 mt-0.5">
          منظومة إدارة المعارض، نقاط البيع، المخازن والمراجعة المالية • إصدار معتمد v3.1.0
        </p>
      </footer>
    </div>
  );
}
