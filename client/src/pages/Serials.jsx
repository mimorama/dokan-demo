import React, { useState, useEffect } from 'react';
import { 
  Barcode, 
  Search, 
  ShieldCheck, 
  ShieldAlert, 
  PhoneCall, 
  User, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  Wrench, 
  Filter
} from 'lucide-react';
import { api } from '../api';

export default function Serials({ settings }) {
  const [serials, setSerials] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Status Change Modal
  const [selectedSerial, setSelectedSerial] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');

  const currency = settings?.currency || 'ج.م';

  useEffect(() => {
    loadSerials();
  }, [statusFilter, search]);

  const loadSerials = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (search) params.append('search', search);

      const data = await api.getSerials(params.toString());
      setSerials(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedSerial) return;
    try {
      await api.updateSerial(selectedSerial.id, {
        status: newStatus,
        notes: statusNotes
      });
      setSelectedSerial(null);
      loadSerials();
    } catch (err) {
      alert(err.message || 'خطأ أثناء تحديث الحالة');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Barcode className="w-6 h-6 text-blue-600" />
            تتبع الأرقام التسلسلية (Serial Numbers) والضمان
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            فحص أصل الجهاز وسريان فترة الضمان، بيانات المشتري وتاريخ الفاتورة، وتوكيل الصيانة المعتمد
          </p>
        </div>

        {/* Quick Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="امسح أو اكتب السيريال نمبر..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono font-bold"
            dir="ltr"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
        {[
          { id: '', label: 'جميع الأرقام التسلسلية' },
          { id: 'in_stock', label: 'المتاحة بالمخزن (جاهزة للبيع)' },
          { id: 'sold', label: 'الأجهزة المباعة (تحت الضمان)' },
          { id: 'maintenance', label: 'في صيانة الوكيل' },
          { id: 'returned', label: 'أجهزة مرتجعة' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === tab.id
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Serials Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold">
                <th className="py-3 px-4">الرقم التسلسلي (Serial Number)</th>
                <th className="py-3 px-4">اسم الجهاز والموديل</th>
                <th className="py-3 px-4">الحالة</th>
                <th className="py-3 px-4">العميل والمشتري</th>
                <th className="py-3 px-4">تاريخ وفترة الضمان</th>
                <th className="py-3 px-4">وكيل الصيانة المعتمد</th>
                <th className="py-3 px-4 text-center">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {serials.map((s) => {
                const isUnderWarranty = s.warranty_end_date && new Date(s.warranty_end_date) >= new Date();
                return (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono font-black text-sm text-blue-700 bg-blue-50/80 px-2.5 py-1 rounded-lg border border-blue-200 inline-block" dir="ltr">
                        {s.serial_number}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{s.product_name}</p>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">{s.brand_name} | {s.model_number}</p>
                    </td>

                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full font-extrabold text-[11px] ${
                        s.status === 'in_stock'
                          ? 'bg-emerald-100 text-emerald-800'
                          : s.status === 'sold'
                          ? 'bg-blue-100 text-blue-800'
                          : s.status === 'maintenance'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {s.status === 'in_stock'
                          ? 'بالمخزن'
                          : s.status === 'sold'
                          ? 'مباع'
                          : s.status === 'maintenance'
                          ? 'بالصيانة'
                          : 'مرتجع'}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      {s.customer_name ? (
                        <div>
                          <p className="font-bold text-slate-800">{s.customer_name}</p>
                          <p className="text-[11px] text-slate-500 font-mono" dir="ltr">{s.customer_phone}</p>
                          {s.invoice_no && (
                            <span className="text-[10px] text-blue-600 font-mono">فاتورة: {s.invoice_no}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">---</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {s.warranty_end_date ? (
                        <div>
                          <div className="flex items-center gap-1 font-bold text-xs">
                            {isUnderWarranty ? (
                              <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <ShieldAlert className="w-4 h-4 text-rose-600" />
                            )}
                            <span className={isUnderWarranty ? 'text-emerald-700' : 'text-rose-600'}>
                              {isUnderWarranty ? 'ساري حتى:' : 'منتهي في:'} {s.warranty_end_date}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            بدء الضمان: {s.warranty_start_date || 'تاريخ البيع'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[11px]">ضمان المصنع ({s.warranty_months} شهر)</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-[11px]">
                      <p className="font-bold text-slate-700">{s.warranty_agency || 'الوكيل المعتمد'}</p>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => {
                          setSelectedSerial(s);
                          setNewStatus(s.status);
                          setStatusNotes(s.notes || '');
                        }}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        <span>تحديث الحالة</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Update Status Modal */}
      {selectedSerial && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="font-bold text-base text-slate-800 mb-1">
              تحديث حالة السيريال
            </h3>
            <p className="text-xs text-blue-600 font-mono font-bold mb-4" dir="ltr">
              {selectedSerial.serial_number} - {selectedSerial.product_name}
            </p>

            <form onSubmit={handleUpdateStatus} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">الحالة الجديدة</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800"
                >
                  <option value="in_stock">متاح في المخزن (جاهز للبيع)</option>
                  <option value="sold">جهاز مباع للعميل</option>
                  <option value="maintenance">في مركز صيانة الوكيل</option>
                  <option value="returned">مرتجع للمحل</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">ملاحظات الصيانة أو الإرجاع</label>
                <textarea
                  rows={3}
                  placeholder="مثال: تم إرسال الجهاز للتوكيل لوجود صوت بالموتور..."
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedSerial(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
                >
                  حفظ التعديل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
