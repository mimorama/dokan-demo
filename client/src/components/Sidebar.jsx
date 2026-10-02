import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Barcode, 
  CalendarClock, 
  Users, 
  Wallet, 
  BarChart3, 
  Settings, 
  Tv, 
  Truck,
  Calculator,
  ShieldCheck,
  Building2,
  ShoppingBag,
  LogOut,
  User,
  Receipt,
  Coins,
  BookOpen
} from 'lucide-react';

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  overdueCount = 0, 
  onOpenCalculator, 
  storeName, 
  tagline,
  logoUrl,
  logoIconUrl = '/logo_icon.png',
  currentUser,
  onSwitchUser,
  onLogout
}) {
  const allMenuItems = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
    { id: 'pos', label: 'نقطة البيع (فاتورة جديدة)', icon: ShoppingCart, highlight: true },
    { id: 'sales', label: 'فواتير البيع والمراجعة', icon: Receipt },
    { id: 'reconciliation', label: 'مراجعة اليومية وطرق الدفع', icon: Coins },
    { id: 'accounting', label: 'النظام المحاسبي العام', icon: BookOpen },
    { id: 'purchases', label: 'المشتريات وتدقيق الفواتير', icon: ShoppingBag, purchasesHighlight: true },
    { id: 'products', label: 'الأجهزة والمخزون', icon: Package },
    { id: 'branches', label: 'الفروع والمخازن', icon: Building2 },
    { id: 'serials', label: 'السيريال والضمان', icon: Barcode },
    { 
      id: 'installments', 
      label: 'إدارة الأقساط والعقود', 
      icon: CalendarClock,
      badge: overdueCount > 0 ? overdueCount : null
    },
    { id: 'customers', label: 'العملاء والضامنون', icon: Users },
    { id: 'cashbox', label: 'الخزينة والمصروفات', icon: Wallet },
    { id: 'suppliers', label: 'الموردين والشركات', icon: Truck },
    { id: 'reports', label: 'التقارير والأرباح الرسمية', icon: BarChart3, reportHighlight: true },
    { id: 'users', label: 'المستخدمين والصلاحيات', icon: ShieldCheck },
    { id: 'settings', label: 'إعدادات المعرض', icon: Settings },
  ];

  // Role permissions
  const rolePermissions = {
    admin: ['dashboard', 'pos', 'sales', 'reconciliation', 'accounting', 'purchases', 'products', 'branches', 'serials', 'installments', 'customers', 'cashbox', 'suppliers', 'reports', 'users', 'settings'],
    manager: ['dashboard', 'pos', 'sales', 'reconciliation', 'accounting', 'purchases', 'products', 'branches', 'serials', 'installments', 'customers', 'cashbox', 'suppliers', 'reports', 'users'],
    cashier: ['pos', 'sales', 'reconciliation', 'customers', 'serials', 'installments'],
    storekeeper: ['products', 'branches', 'purchases', 'serials', 'suppliers'],
    accountant: ['dashboard', 'sales', 'reconciliation', 'accounting', 'purchases', 'cashbox', 'customers', 'suppliers', 'reports']
  };

  const allowedTabs = rolePermissions[currentUser?.role || 'admin'] || rolePermissions.admin;
  const menuItems = allMenuItems.filter(item => allowedTabs.includes(item.id));

  const [headerMode, setHeaderMode] = React.useState(() => {
    return localStorage.getItem('dokan_sidebar_header_mode') || 'banner';
  });

  const toggleHeaderMode = () => {
    const next = headerMode === 'banner' ? 'compact' : 'banner';
    setHeaderMode(next);
    localStorage.setItem('dokan_sidebar_header_mode', next);
  };

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col flex-shrink-0 min-h-screen border-l border-slate-800 shadow-xl select-none no-print">
      {/* Brand Header */}
      {headerMode === 'banner' ? (
        <div className="p-3 border-b border-slate-800/80 bg-slate-950/40 flex-shrink-0">
          <div
            onClick={toggleHeaderMode}
            title="انقر للتبديل إلى النمط المصغر (أيقونة + نص)"
            className="group relative w-full h-15 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 hover:from-slate-800 hover:to-slate-800 rounded-xl border border-slate-700/60 hover:border-blue-500/50 p-1.5 flex items-center justify-center shadow-inner overflow-hidden cursor-pointer transition-all"
          >
            <img
              src={logoUrl || "/logo.png"}
              alt={storeName || "دكان عبد العزيز"}
              className="max-h-12 w-auto max-w-[210px] object-contain filter drop-shadow group-hover:scale-102 transition-transform"
              onError={(e) => {
                e.target.src = "/logo.svg";
              }}
            />
            <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800/90 text-[9px] text-slate-300 px-1 py-0.5 rounded font-mono">
              تغيير النمط
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between px-1 text-[10.5px]">
            <span className="text-amber-400 font-bold truncate">
              {tagline || 'للأجهزة الكهربائية والتقسيط'}
            </span>
            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20 flex-shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              متصل
            </span>
          </div>
        </div>
      ) : (
        <div className="p-3 border-b border-slate-800/80 bg-slate-950/40 flex-shrink-0">
          <div
            onClick={toggleHeaderMode}
            title="انقر للتبديل إلى نمط الشعار العريض (Banner)"
            className="group flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-800/50 cursor-pointer transition-colors"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-1 flex items-center justify-center shadow-md flex-shrink-0 overflow-hidden group-hover:border-blue-500/50 transition-colors">
              <img
                src={logoIconUrl || "/logo_icon.png"}
                alt="DA"
                className="w-full h-full object-contain filter drop-shadow"
                onError={(e) => {
                  e.target.src = logoUrl || "/logo.png";
                }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <h1 className="font-black text-sm text-white leading-tight">
                  دكان عبد العزيز
                </h1>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" title="النظام متصل"></span>
              </div>
              <p className="text-[10px] text-amber-400 font-bold truncate mt-0.5">
                {tagline || 'للأجهزة الكهربائية والتقسيط'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Calculator Shortcut for Staff */}
      <div className="px-3 pt-2.5 pb-1 flex-shrink-0">
        <button
          onClick={onOpenCalculator}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 hover:border-amber-400 transition-all cursor-pointer shadow-xs"
        >
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-amber-400" />
            <span>حاسبة الأقساط للزبائن</span>
          </div>
          <span className="text-[10px] bg-amber-500/20 border border-amber-400/30 px-1.5 py-0.5 rounded text-amber-200 font-bold">سريعة</span>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto sidebar-scroll">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-black'
                  : item.highlight
                  ? 'bg-blue-950/40 text-blue-300 hover:bg-blue-900/60 border border-blue-800/40'
                  : item.reportHighlight
                  ? 'text-indigo-300 hover:bg-indigo-950/50'
                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.highlight ? 'text-blue-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full animate-pulse shadow-xs">
                  {item.badge} متأخر
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Current User Card */}
      {currentUser && (
        <div className="p-2.5 border-t border-slate-800/80 bg-slate-950/60 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-500/40 text-blue-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                {currentUser.role === 'admin' ? '👑' : currentUser.role === 'manager' ? '🏬' : currentUser.role === 'cashier' ? '💻' : currentUser.role === 'storekeeper' ? '📦' : '⚖️'}
              </div>
              <div className="min-w-0">
                <span className="block font-bold text-xs text-white truncate">{currentUser.name}</span>
                <span className="text-[10px] text-amber-400 font-bold block truncate">
                  {currentUser.role === 'admin' ? 'المدير العام' :
                   currentUser.role === 'manager' ? 'مدير فرع' :
                   currentUser.role === 'cashier' ? 'كاشير ومبيعات' :
                   currentUser.role === 'storekeeper' ? 'أمين مستودع' : 'مراجع مالي'}
                </span>
              </div>
            </div>
            <button
              onClick={onLogout || onSwitchUser}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition cursor-pointer"
              title="تسجيل الخروج من النظام"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="px-3 py-2 border-t border-slate-800/80 bg-slate-950/40 text-[10.5px] text-slate-400 flex items-center justify-between flex-shrink-0">
        <div>
          <span className="text-emerald-400 flex items-center gap-1.5 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
            قاعدة البيانات متصلة
          </span>
        </div>
        <span className="px-2 py-0.5 bg-blue-950/80 border border-blue-500/40 rounded text-[10px] text-blue-300 font-mono font-bold tracking-wider" title="إصدار المنظومة v3.1.0">v3.1.0</span>
      </div>
    </aside>
  );
}
