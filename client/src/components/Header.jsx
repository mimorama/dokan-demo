import React from 'react';
import { ShoppingCart, Wallet, Wifi, Calendar, Bell, Users, ShieldCheck, LogOut, Building2, Clock, CheckCircle } from 'lucide-react';
import NotificationCenter from './NotificationCenter';

export default function Header({ 
  title, 
  onNewSale, 
  cashBalance = 0, 
  currency = 'ج.م',
  currentUser,
  currentShift,
  onOpenShiftModal,
  onSwitchUser,
  onLogout,
  onOpenUsersManagement,
  onNavigateTab,
  onViewTransfer
}) {
  const currentDate = new Intl.DateTimeFormat('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date());

  const canSell = !currentUser || ['admin', 'manager', 'cashier'].includes(currentUser.role);
  const canSeeCashbox = !currentUser || ['admin', 'manager', 'accountant'].includes(currentUser.role);
  const canManageShift = !currentUser || ['admin', 'manager', 'cashier'].includes(currentUser.role);

  return (
    <header className="h-18 bg-white border-b border-slate-200 px-6 sm:px-8 flex items-center justify-between shadow-xs sticky top-0 z-20 no-print">
      {/* Title & Date */}
      <div>
        <h2 className="text-xl font-bold text-slate-800">{title}</h2>
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mt-0.5">
          <Calendar className="w-3.5 h-3.5 text-blue-500" />
          <span>{currentDate}</span>
          {currentUser?.branch_name && (
            <>
              <span className="text-slate-300">•</span>
              <span className="text-blue-700 font-bold flex items-center gap-1">
                <Building2 className="w-3 h-3 text-blue-500" />
                {currentUser.branch_name}
              </span>
            </>
          )}
        </div>
      </div>

      {/* User Info & Action Buttons */}
      <div className="flex items-center gap-3">
        {/* Shift Badge & Action */}
        {canManageShift && onOpenShiftModal && (
          <button
            onClick={onOpenShiftModal}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              currentShift
                ? 'bg-blue-50/80 border-blue-200 text-blue-800 hover:bg-blue-100'
                : 'bg-amber-50/80 border-amber-200 text-amber-800 hover:bg-amber-100'
            }`}
            title={currentShift ? 'عرض تفاصيل الوردية الحالية أو إغلاقها' : 'بدء وفتح وردية عمل جديدة للكاشير'}
          >
            <div className={`w-2 h-2 rounded-full ${currentShift ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <div className="text-right leading-tight">
              <span className="block text-[10px] text-slate-500">
                {currentShift ? 'الوردية الحالية' : 'الوردية'}
              </span>
              <span className="block font-black">
                {currentShift ? (currentShift.shift_no || 'مفتوحة') : 'فتح وردية جديدة'}
              </span>
            </div>
          </button>
        )}

        {/* Notifications Center for Branches, Warehouses & Transfers */}
        <NotificationCenter
          currentUser={currentUser}
          onNavigateTab={onNavigateTab}
          onViewTransfer={onViewTransfer}
        />

        {/* User Profile Badge */}
        {currentUser && (
          <div className="hidden md:flex items-center gap-2.5 px-3 py-1.5 bg-slate-100/80 border border-slate-200 rounded-xl text-xs">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {currentUser.role === 'admin' ? '👑' : currentUser.role === 'manager' ? '🏬' : currentUser.role === 'cashier' ? '💻' : currentUser.role === 'storekeeper' ? '📦' : '⚖️'}
            </div>
            <div className="text-right">
              <span className="font-extrabold text-slate-800 block leading-tight">{currentUser.name}</span>
              <span className="text-[10px] text-blue-600 font-bold block">
                {currentUser.role === 'admin' ? 'المدير العام' :
                 currentUser.role === 'manager' ? 'مدير فرع' :
                 currentUser.role === 'cashier' ? 'كاشير ومبيعات' :
                 currentUser.role === 'storekeeper' ? 'أمين مستودع' : 'مراجع مالي'}
              </span>
            </div>

            {/* Admin Users Management Button */}
            {currentUser.role === 'admin' && (
              <button
                onClick={onOpenUsersManagement}
                className="mr-1.5 p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition cursor-pointer"
                title="إدارة المستخدمين والصلاحيات"
              >
                <Users className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Logout / Switch User Button */}
            <button
              onClick={onLogout || onSwitchUser}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-200/60 rounded-lg transition cursor-pointer"
              title="تسجيل الخروج من النظام"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Cashbox Balance Badge (if allowed) */}
        {canSeeCashbox && (
          <div className="flex items-center gap-2.5 px-4 py-2 bg-emerald-50 border border-emerald-200/80 rounded-xl text-emerald-800 shadow-xs">
            <Wallet className="w-4 h-4 text-emerald-600" />
            <div>
              <span className="text-[11px] block text-emerald-600 font-semibold leading-none">رصيد الخزينة</span>
              <span className="text-sm font-extrabold">{Number(cashBalance).toLocaleString()} {currency}</span>
            </div>
          </div>
        )}

        {/* Quick New Sale Button (if cashier, manager, admin) */}
        {canSell && (
          <button
            onClick={onNewSale}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-blue-500/20 transition-all duration-200 cursor-pointer active:scale-98"
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">فاتورة بيع جديدة</span>
          </button>
        )}
      </div>
    </header>
  );
}
