import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  X, 
  Check, 
  CheckCheck, 
  Trash2, 
  ArrowLeftRight, 
  ClipboardList, 
  AlertTriangle, 
  Package, 
  Warehouse, 
  Building2, 
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { api } from '../api';

export default function NotificationCenter({ 
  currentUser, 
  onNavigateTab, 
  onViewTransfer 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('all'); // 'all', 'stock_transfer', 'stock_request', 'unread'
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const branchId = currentUser?.branch_id || '';
      const res = await api.getNotifications(branchId ? `branch_id=${branchId}` : '');
      if (res) {
        setNotifications(res.notifications || []);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll notifications every 25 seconds
    const interval = setInterval(fetchNotifications, 25000);
    return () => clearInterval(interval);
  }, [currentUser?.branch_id]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setLoading(true);
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNotification = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await api.deleteNotification(id);
      setNotifications(prev => {
        const item = prev.find(n => n.id === id);
        if (item && !item.is_read) {
          setUnreadCount(c => Math.max(0, c - 1));
        }
        return prev.filter(n => n.id !== id);
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearRead = async () => {
    try {
      setLoading(true);
      await api.clearReadNotifications();
      setNotifications(prev => prev.filter(n => !n.is_read));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.is_read) {
      handleMarkAsRead(notif.id);
    }

    if (notif.type === 'stock_transfer') {
      if (onViewTransfer && notif.entity_id) {
        onViewTransfer(notif.entity_id);
      } else if (onNavigateTab) {
        onNavigateTab('branches', 'transfers');
      }
      setIsOpen(false);
    } else if (notif.type === 'stock_request') {
      if (onNavigateTab) {
        onNavigateTab('branches', 'requests');
      }
      setIsOpen(false);
    }
  };

  // Filtered notifications
  const filteredList = notifications.filter(n => {
    if (filterType === 'unread') return !n.is_read;
    if (filterType === 'stock_transfer') return n.type === 'stock_transfer';
    if (filterType === 'stock_request') return n.type === 'stock_request';
    return true;
  });

  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffSecs = Math.floor((now - date) / 1000);

    if (diffSecs < 60) return 'الآن';
    if (diffSecs < 3600) return `منذ ${Math.floor(diffSecs / 60)} دقيقة`;
    if (diffSecs < 86400) return `منذ ${Math.floor(diffSecs / 3600)} ساعة`;
    return date.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition cursor-pointer shadow-2xs"
        title="مركز الإشعارات والتنبيهات بين الفروع والمخازن"
      >
        <Bell className="w-4 h-4 text-slate-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 px-1 items-center justify-center rounded-full bg-rose-600 text-white font-mono font-bold text-[10px] shadow-xs animate-pulse">
            {unreadCount > 99 ? '+99' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Flyout */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150 text-right">
          {/* Header */}
          <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-xs">إشعارات الفروع والمخازن</h4>
                <p className="text-[10px] text-slate-300">
                  {unreadCount > 0 ? `${unreadCount} إشعار جديد غير مقروء` : 'جميع الإشعارات مقروءة'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={fetchNotifications}
                className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                title="تحديث الإشعارات"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-1 p-2 bg-slate-50 border-b border-slate-200 text-[11px] overflow-x-auto">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${
                filterType === 'all'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              الكل ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('unread')}
              className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${
                filterType === 'unread'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              الجديد ({unreadCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('stock_transfer')}
              className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                filterType === 'stock_transfer'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              <ArrowLeftRight className="w-3 h-3" />
              <span>التحويلات</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterType('stock_request')}
              className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                filterType === 'stock_request'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              <ClipboardList className="w-3 h-3" />
              <span>النواقص</span>
            </button>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-80">
            {filteredList.length === 0 ? (
              <div className="py-10 text-center text-slate-400 p-4">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
                <p className="text-xs font-bold text-slate-600">لا توجد إشعارات تطابق التحديد</p>
                <p className="text-[10px] text-slate-400 mt-0.5">ستصلك إشعارات فورية عند إجراء تحويلات أو إرسال طلبات نواقص</p>
              </div>
            ) : (
              filteredList.map((notif) => {
                const isTransfer = notif.type === 'stock_transfer';
                const isRequest = notif.type === 'stock_request';

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-3 transition-colors cursor-pointer text-xs relative group ${
                      !notif.is_read ? 'bg-blue-50/50 hover:bg-blue-50' : 'bg-white hover:bg-slate-50'
                    }`}
                  >
                    {/* Unread indicator dot */}
                    {!notif.is_read && (
                      <span className="absolute top-3.5 right-2 w-2 h-2 rounded-full bg-blue-600" />
                    )}

                    <div className="flex items-start gap-2.5 pr-2">
                      {/* Icon */}
                      <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center shadow-2xs ${
                        isTransfer ? 'bg-emerald-100 text-emerald-700' :
                        isRequest ? 'bg-amber-100 text-amber-800' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {isTransfer ? <ArrowLeftRight className="w-4 h-4" /> :
                         isRequest ? <ClipboardList className="w-4 h-4" /> :
                         <Bell className="w-4 h-4" />}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <h5 className={`font-bold text-xs truncate ${!notif.is_read ? 'text-slate-900 font-extrabold' : 'text-slate-800'}`}>
                            {notif.title}
                          </h5>
                          <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                            {formatRelativeTime(notif.created_at)}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-600 leading-relaxed mb-1.5">
                          {notif.message}
                        </p>

                        {/* Location / Warehouses badges if available */}
                        {(notif.from_warehouse_name || notif.to_warehouse_name || notif.from_branch_name) && (
                          <div className="flex flex-wrap items-center gap-1.5 text-[9px] text-slate-500 font-medium">
                            {notif.from_warehouse_name && (
                              <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                من: {notif.from_warehouse_name}
                              </span>
                            )}
                            {notif.to_warehouse_name && (
                              <span className="bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-200">
                                إلى: {notif.to_warehouse_name}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Action hints */}
                        <div className="mt-2 flex items-center justify-between text-[10px]">
                          <span className="text-blue-600 font-bold flex items-center gap-1 group-hover:underline">
                            {isTransfer ? 'عرض إذن التحويل' : isRequest ? 'معاينة طلب النواقص' : 'عرض التفاصيل'}
                            <ExternalLink className="w-2.5 h-2.5" />
                          </span>

                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            {!notif.is_read && (
                              <button
                                type="button"
                                onClick={(e) => handleMarkAsRead(notif.id, e)}
                                title="تحديد كمقروء"
                                className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={(e) => handleDeleteNotification(notif.id, e)}
                              title="حذف الإشعار"
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Actions */}
          {notifications.length > 0 && (
            <div className="p-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px]">
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={unreadCount === 0}
                className="text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>تحديد الكل كمقروء</span>
              </button>

              <button
                type="button"
                onClick={handleClearRead}
                className="text-slate-500 hover:text-rose-700 font-medium flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>مسح المقروء</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
