import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  User, 
  KeyRound, 
  ShieldCheck, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Server,
  Tv,
  Wind,
  CreditCard,
  Barcode,
  Sparkles,
  ArrowRight,
  Clock,
  Users
} from 'lucide-react';
import { api } from '../api';

export default function LoginScreen({ settings, onLoginSuccess }) {
  const [username, setUsername] = useState(() => {
    return localStorage.getItem('dokan_remembered_username') || '';
  });
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(() => {
    return !!localStorage.getItem('dokan_remembered_username');
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedQuickRole, setSelectedQuickRole] = useState(null);

  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        new Intl.DateTimeFormat('ar-EG', {
          timeZone: 'Africa/Cairo',
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }).format(now)
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const storeName = settings?.store_name || 'معرض دكان عبد العزيز للأجهزة الكهربائية';
  const tagline = settings?.tagline || 'ثلاجات • غسالات • شاشات • تكييفات • كاش وبالتقسيط المريح';
  const logoUrl = settings?.logo_url || '/logo.png';

  const quickAccounts = [
    { username: 'admin', pass: '123', label: 'المدير العام', role: 'إدارة كاملة', color: 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 hover:border-amber-400' },
    { username: 'cashier1', pass: '123', label: 'كاشير ومبيعات', role: 'نقطة البيع POS', color: 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400' },
    { username: 'faisal_mgr', pass: '123', label: 'مدير فرع فيصل', role: 'إدارة الفرع', color: 'bg-blue-50 text-blue-900 border-blue-300 hover:bg-blue-100 hover:border-blue-400' },
    { username: 'store1', pass: '123', label: 'أمين المستودع', role: 'المخازن والتحويلات', color: 'bg-purple-50 text-purple-900 border-purple-300 hover:bg-purple-100 hover:border-purple-400' },
    { username: 'accountant1', pass: '123', label: 'مراجع الحسابات', role: 'المالية والخزينة', color: 'bg-cyan-50 text-cyan-900 border-cyan-300 hover:bg-cyan-100 hover:border-cyan-400' },
  ];

  const handleSelectQuickAccount = (acc) => {
    setUsername(acc.username);
    setPassword(acc.pass);
    setSelectedQuickRole(acc.username);
    setError('');
  };

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
        if (rememberMe) {
          localStorage.setItem('dokan_remembered_username', username.trim());
        } else {
          localStorage.removeItem('dokan_remembered_username');
        }
        onLoginSuccess(res.user);
      } else {
        setError('بيانات الدخول غير صحيحة، يرجى مراجعة اسم المستخدم أو كلمة المرور');
      }
    } catch (err) {
      setError(err.message || 'فشل تسجيل الدخول، تأكد من صحة اسم المستخدم وكلمة المرور');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50/50 to-indigo-50/40 text-slate-800 flex flex-col justify-between relative overflow-x-hidden font-['Cairo',sans-serif] selection:bg-blue-600 selection:text-white" dir="rtl">
      {/* Background Decorative Soft Lighting & Grid Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[550px] h-[550px] bg-blue-300/20 rounded-full blur-[140px] transform-gpu"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[550px] h-[550px] bg-indigo-300/20 rounded-full blur-[140px] transform-gpu"></div>
        <div className="absolute top-[35%] left-[20%] w-[400px] h-[400px] bg-amber-300/15 rounded-full blur-[130px] transform-gpu"></div>
        {/* Subtle grid pattern for modern touch */}
        <div className="absolute inset-0 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:24px_24px] opacity-35"></div>
      </div>

      {/* Top Bar / Status Strip */}
      <header className="relative z-10 w-full border-b border-slate-200/90 bg-white/85 backdrop-blur-md px-4 sm:px-8 py-3 shadow-xs">
        <div className="max-w-6xl w-full mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-300/80 text-emerald-800 font-bold shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>السيرفر متصل ومؤمن</span>
            </span>
            <span className="hidden sm:flex items-center gap-1.5 text-slate-600 font-mono text-[11px] bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
              <Server className="w-3.5 h-3.5 text-blue-600" />
              <span>منفذ النظام: 5959</span>
            </span>
          </div>

          <div className="flex items-center gap-3 text-slate-600">
            {currentTime && (
              <span className="hidden md:flex items-center gap-1.5 text-[11.5px] font-medium text-slate-700">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>{currentTime}</span>
              </span>
            )}
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10.5px] font-mono font-bold tracking-wider">
              v3.1.0
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area: Split 2-Column Showcase & Login in Light Theme */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8 my-auto">
        <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Right Showcase Column (Appliances Retail Experience) */}
          <div className="lg:col-span-6 flex flex-col justify-between bg-white/90 border border-slate-200/90 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/60 relative overflow-hidden group">
            {/* Ambient light glow in card */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-100/50 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-100/40 rounded-full blur-3xl pointer-events-none"></div>

            <div className="space-y-6 relative z-10">
              {/* Brand Header */}
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white border border-slate-200 p-2.5 flex items-center justify-center shadow-md shadow-slate-100 flex-shrink-0 group-hover:border-blue-400 transition duration-300">
                  <img 
                    src={logoUrl} 
                    alt={storeName} 
                    className="max-h-full max-w-full object-contain drop-shadow"
                    onError={(e) => { e.target.src = '/logo.svg'; }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-extrabold mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>المنظومة السحابية والمحلية المعتمدة</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
                    {storeName}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1 leading-relaxed">
                    {tagline}
                  </p>
                </div>
              </div>

              {/* Showroom Features Grid in Light Colors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="bg-slate-50/80 border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 rounded-2xl p-3.5 transition duration-200 flex items-start gap-3 shadow-2xs">
                  <div className="w-9 h-9 rounded-xl bg-blue-100/80 border border-blue-200 flex items-center justify-center flex-shrink-0 text-blue-700">
                    <Tv className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900">شاشات وتلفزيونات 4K</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed font-medium">
                      تتبع السيريالات وضمان الوكلاء المعتمدين (سامسونج، إل جي، توشيبا).
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50/80 border border-slate-200 hover:border-cyan-300 hover:bg-cyan-50/40 rounded-2xl p-3.5 transition duration-200 flex items-start gap-3 shadow-2xs">
                  <div className="w-9 h-9 rounded-xl bg-cyan-100/80 border border-cyan-200 flex items-center justify-center flex-shrink-0 text-cyan-700">
                    <Wind className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900">تكييفات وثلاجات إنفرتر</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed font-medium">
                      إدارة المخزون متعدد الفروع والتحويلات وأذون الصرف اللحظية.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50/80 border border-slate-200 hover:border-amber-300 hover:bg-amber-50/40 rounded-2xl p-3.5 transition duration-200 flex items-start gap-3 shadow-2xs">
                  <div className="w-9 h-9 rounded-xl bg-amber-100/80 border border-amber-200 flex items-center justify-center flex-shrink-0 text-amber-700">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900">كاش وبالتقسيط المريح</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed font-medium">
                      تقسيط مباشر بعقود وإيصالات أمانة، وتمويل (فاليو، كونتاكت، سهولة).
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50/80 border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 rounded-2xl p-3.5 transition duration-200 flex items-start gap-3 shadow-2xs">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100/80 border border-emerald-200 flex items-center justify-center flex-shrink-0 text-emerald-700">
                    <Barcode className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900">نقاط بيع سريعة (POS)</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed font-medium">
                      إصدار فواتير حرارية وكبيرة، وتقفيل ورديات الكاشير والدرج (Z-Report).
                    </p>
                  </div>
                </div>
              </div>

              {/* Fast Account Selector for Easy Demo & Quick Switch in Light Theme */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    <span>اختيار سريع لحسابات النظام والتجربة:</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">اضغط لتعبئة الحساب</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {quickAccounts.map((acc) => {
                    const isSelected = selectedQuickRole === acc.username;
                    return (
                      <button
                        key={acc.username}
                        type="button"
                        onClick={() => handleSelectQuickAccount(acc)}
                        className={`text-right px-2.5 py-1.5 rounded-xl border text-[11px] transition-all cursor-pointer flex items-center gap-2 ${
                          isSelected 
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/25 scale-102 font-bold' 
                            : `${acc.color} shadow-2xs`
                        }`}
                      >
                        <span className="font-bold">{acc.label}</span>
                        <span className="text-[9.5px] opacity-75 font-mono">({acc.username})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom Warranty & Agency Trust Badge */}
            <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
              <span className="flex items-center gap-1 text-emerald-700 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>ضمان معتمد للأجهزة</span>
              </span>
              <span className="text-slate-500 font-mono text-[10.5px]">
                شارب • توشيبا • فريش • زانوسي • تورنيدو
              </span>
            </div>
          </div>

          {/* Left Form Column (Authentication Card in Crisp Light Theme) */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-blue-900/5 backdrop-blur-xl relative">
              
              {/* Form Header */}
              <div className="mb-6">
                <div className="inline-flex p-3 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 mb-3 shadow-xs">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">تسجيل الدخول للمنظومة</h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium leading-relaxed">
                  أدخل بيانات الاعتماد الخاصة بك للوصول إلى لوحة المبيعات وإدارة المعرض
                </p>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="mb-5 bg-rose-50 border border-rose-200 rounded-2xl p-3.5 text-xs text-rose-800 font-bold flex items-center gap-2.5 animate-shake shadow-xs">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
                  <span className="leading-relaxed">{error}</span>
                </div>
              )}

              {/* Form Elements */}
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                    اسم المستخدم (Username)
                  </label>
                  <div className="relative">
                    <div className="absolute right-3.5 top-3.5 text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      autoFocus
                      placeholder="admin, cashier1, store1..."
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-slate-50/80 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-xl pr-10 pl-3 py-3 text-xs sm:text-sm font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-100 transition duration-150"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-extrabold text-slate-700">
                      كلمة المرور (Password)
                    </label>
                  </div>
                  <div className="relative">
                    <div className="absolute right-3.5 top-3.5 text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-50/80 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-xl pr-10 pl-10 py-3 text-xs sm:text-sm font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-100 transition duration-150"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3.5 top-3.5 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                      title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 font-bold select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 bg-white border-slate-300 focus:ring-blue-500 cursor-pointer"
                    />
                    <span>تذكر اسم المستخدم على هذا الجهاز</span>
                  </label>
                  <span className="text-[11px] text-blue-600 font-bold">
                    تسجيل دخول مشفر
                  </span>
                </div>

                {/* Submit CTA Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-3 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-700 text-white font-black py-3.5 rounded-xl text-xs sm:text-sm shadow-lg shadow-blue-500/25 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2.5 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>جاري التحقق والمصادقة الأمنية...</span>
                    </>
                  ) : (
                    <>
                      <span>دخول إلى المنظومة</span>
                      <ArrowRight className="w-4 h-4 transform rotate-180" />
                    </>
                  )}
                </button>
              </form>

              {/* Security & Audit Verification Note */}
              <div className="mt-6 pt-5 border-t border-slate-200 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0 text-emerald-600 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <h5 className="text-xs font-extrabold text-slate-800">جلسة عمل موثوقة ومحمية</h5>
                  <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                    يتم تسجيل كافة الأنشطة والمبيعات في سجل الرقابة والتدقيق (Audit Trail) مع كشف الصلاحيات حسب دور المستخدم.
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* Global Footer */}
      <footer className="relative z-10 w-full border-t border-slate-200/90 bg-white/80 backdrop-blur-sm py-4 px-4 text-center text-xs text-slate-600">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[11.5px]">
          <p className="font-bold text-slate-700">
            {storeName} &copy; 2026 • جميع الحقوق محفوظة
          </p>
          <p className="text-slate-500 font-medium">
            منظومة إدارة معارض الأجهزة الكهربائية والتقسيط الذكية • إصدار معتمد <span className="font-mono text-blue-600 font-bold">v3.1.0</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
