import React, { useState, useEffect } from 'react';
import { 
  RotateCcw, 
  Search, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  DollarSign, 
  Package, 
  Receipt, 
  User, 
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { api } from '../api';

export default function ReturnModal({ isOpen, onClose, initialSale = null, currentUser, settings, onReturnSuccess }) {
  if (!isOpen) return null;

  const [searchInvoice, setSearchInvoice] = useState('');
  const [sale, setSale] = useState(initialSale);
  const [loadingSale, setLoadingSale] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Selected items to return: { [sale_item_id]: { selected: boolean, restock_status: string, refund_price: number, serial_number: string, product_id: number } }
  const [returnItems, setReturnItems] = useState({});
  const [refundMethod, setRefundMethod] = useState('cash'); // 'cash' or 'credit'
  const [returnReason, setReturnReason] = useState('رغبة العميل');
  const [customReason, setCustomReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const currency = settings?.currency || 'ج.م';

  useEffect(() => {
    if (initialSale) {
      if (initialSale.items && initialSale.items.length > 0) {
        initSaleItems(initialSale);
      } else if (initialSale.id) {
        setLoadingSale(true);
        setErrorMsg('');
        api.getSale(initialSale.id)
          .then((fullSale) => {
            initSaleItems(fullSale);
          })
          .catch((err) => {
            console.error(err);
            setErrorMsg('تعذر تحميل أجهزة الفاتورة، يرجى المحاولة مرة أخرى');
          })
          .finally(() => {
            setLoadingSale(false);
          });
      }
    }
  }, [initialSale]);

  const initSaleItems = (saleData) => {
    setSale(saleData);
    const initialMap = {};
    if (saleData?.items) {
      saleData.items.forEach(it => {
        initialMap[it.id] = {
          selected: false,
          sale_item_id: it.id,
          product_id: it.product_id,
          serial_number: it.serial_number || '',
          restock_status: 'in_stock', // 'in_stock', 'damaged', 'outlet'
          refund_price: it.unit_price || 0,
          product_name: it.product_name,
          model_number: it.model_number
        };
      });
    }
    setReturnItems(initialMap);
  };

  const handleSearchInvoice = async (e) => {
    e?.preventDefault();
    if (!searchInvoice.trim()) return;
    setLoadingSale(true);
    setErrorMsg('');
    try {
      // Find sale by invoice_no
      const res = await api.getSales();
      const target = res.find(s => s.invoice_no?.toLowerCase() === searchInvoice.trim().toLowerCase());
      if (target) {
        const fullSale = await api.getSale(target.id);
        initSaleItems(fullSale);
      } else {
        setErrorMsg('لم يتم العثور على فاتورة بهذا الرقم');
      }
    } catch (err) {
      setErrorMsg('خطأ أثناء البحث عن الفاتورة');
    } finally {
      setLoadingSale(false);
    }
  };

  const toggleItemSelection = (itemId) => {
    setReturnItems(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        selected: !prev[itemId]?.selected
      }
    }));
  };

  const updateItemField = (itemId, field, value) => {
    setReturnItems(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value
      }
    }));
  };

  const selectedList = Object.values(returnItems).filter(i => i.selected);
  const totalRefundAmount = selectedList.reduce((sum, i) => sum + Number(i.refund_price || 0), 0);

  const handleSubmitReturn = async () => {
    if (selectedList.length === 0) {
      alert('يرجى اختيار جهاز واحد على الأقل للمرتجع');
      return;
    }

    if (totalRefundAmount <= 0) {
      alert('مبلغ الاسترداد غير صالح');
      return;
    }

    const finalReason = returnReason === 'أخرى' ? customReason : returnReason;

    if (!window.confirm(`هل أنت متأكد من تنفيذ عملية المرتجع واسترداد مبلغ ${Number(totalRefundAmount).toLocaleString()} ${currency}؟`)) {
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        sale_id: sale.id,
        items: selectedList.map(item => ({
          sale_item_id: item.sale_item_id,
          product_id: item.product_id,
          serial_number: item.serial_number,
          restock_status: item.restock_status,
          refund_price: Number(item.refund_price),
          notes: finalReason
        })),
        refund_amount: totalRefundAmount,
        refund_method: refundMethod,
        reason: finalReason,
        processed_by: currentUser?.name || 'مسؤول المبيعات'
      };

      const res = await api.returnSale(sale.id, payload);
      alert(res.message || 'تم تسجيل المرتجع بنجاح وتحديث حركة المخزون والخزينة!');
      if (onReturnSuccess) onReturnSuccess(res);
      onClose();
    } catch (err) {
      alert(err.message || 'خطأ أثناء تسجيل المرتجع');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full p-6 text-slate-800 text-xs flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">مرتجع مبيعات واسترداد أجهزة (RMA)</h3>
              <p className="text-[11px] text-slate-500">إرجاع الأجهزة إلى المخزون كجديد أو أوتلت أو تالف مع تسوية النقدية</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search for Invoice if no sale selected */}
        {!sale && (
          <div className="p-6 text-center space-y-4">
            <form onSubmit={handleSearchInvoice} className="max-w-md mx-auto flex gap-2">
              <input
                type="text"
                placeholder="أدخل رقم الفاتورة (مثال: INV-2026-0001)..."
                value={searchInvoice}
                onChange={(e) => setSearchInvoice(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <button
                type="submit"
                disabled={loadingSale}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-5 py-2.5 rounded-xl cursor-pointer flex items-center gap-1.5"
              >
                <Search className="w-4 h-4" />
                <span>بحث</span>
              </button>
            </form>
            {errorMsg && <p className="text-rose-600 font-bold text-xs">{errorMsg}</p>}
          </div>
        )}

        {/* Sale Details & Items Selection */}
        {sale && (
          <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-1">
            {/* Invoice Info Strip */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-[10px] text-slate-500 block">رقم الفاتورة:</span>
                <span className="font-mono font-black text-sm text-blue-700">{sale.invoice_no}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">العميل:</span>
                <span className="font-bold text-slate-800">{sale.customer_name || 'عميل نقدي'} ({sale.customer_phone || '-'})</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">تاريخ الشراء:</span>
                <span className="font-bold text-slate-700">{new Date(sale.created_at).toLocaleDateString('ar-EG')}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">إجمالي الفاتورة:</span>
                <span className="font-extrabold text-slate-900">{Number(sale.total).toLocaleString()} {currency}</span>
              </div>
              <button
                onClick={() => setSale(null)}
                className="text-xs text-rose-600 hover:underline font-bold"
              >
                تغيير الفاتورة
              </button>
            </div>

            {/* Items Table */}
            <div>
              <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-blue-600" />
                حدد الأجهزة المراد إرجاعها وحالتها:
              </h4>

              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100/80 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">اختيار</th>
                      <th className="py-2.5 px-3">الجهاز والموديل</th>
                      <th className="py-2.5 px-3">السيريال نمبر</th>
                      <th className="py-2.5 px-3">سعر البيع</th>
                      <th className="py-2.5 px-3">حالة الاسترجاع</th>
                      <th className="py-2.5 px-3">مبلغ الاسترداد</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loadingSale ? (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-blue-600 font-bold">
                          جاري تحميل أجهزة وسيريالات الفاتورة من السيرفر...
                        </td>
                      </tr>
                    ) : sale.items && sale.items.length > 0 ? (
                      sale.items.map((item) => {
                        const returnState = returnItems[item.id] || {};
                        const isSelected = returnState.selected;

                        return (
                          <tr key={item.id} className={isSelected ? 'bg-rose-50/50' : 'hover:bg-slate-50/70'}>
                            <td className="py-2.5 px-3 text-center">
                              <input
                                type="checkbox"
                                checked={!!isSelected}
                                onChange={() => toggleItemSelection(item.id)}
                                className="w-4 h-4 text-rose-600 rounded cursor-pointer"
                              />
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="font-bold text-slate-800 block">{item.product_name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{item.model_number || '-'}</span>
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-700">
                              {item.serial_number || 'بدون سيريال'}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-slate-700">
                              {Number(item.unit_price).toLocaleString()} {currency}
                            </td>
                            <td className="py-2.5 px-3">
                              <select
                                disabled={!isSelected}
                                value={returnState.restock_status || 'in_stock'}
                                onChange={(e) => updateItemField(item.id, 'restock_status', e.target.value)}
                                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 disabled:opacity-40"
                              >
                                <option value="in_stock">سليم (يعود لمخزن الجديد)</option>
                                <option value="outlet">أوتلت / فرز ثاني (سعر مخفض)</option>
                                <option value="damaged">تالف / عيب صناعة (صيانة/وكيل)</option>
                              </select>
                            </td>
                            <td className="py-2.5 px-3">
                              <input
                                type="number"
                                disabled={!isSelected}
                                value={returnState.refund_price}
                                onChange={(e) => updateItemField(item.id, 'refund_price', e.target.value)}
                                className="w-24 bg-white border border-slate-200 rounded-lg px-2 py-1 font-bold text-xs text-rose-700 font-mono disabled:opacity-40"
                              />
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-slate-400 font-bold">
                          لا توجد أجهزة مسجلة في هذه الفاتورة
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Return Settings & Reason */}
            {selectedList.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">طريقة الاسترداد المالي:</label>
                  <select
                    value={refundMethod}
                    onChange={(e) => setRefundMethod(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                  >
                    <option value="cash">استرداد نقدي فوري من الخزينة</option>
                    <option value="credit">إضافة كرصيد دائن لحساب العميل</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">سبب الاسترجاع:</label>
                  <select
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                  >
                    <option value="رغبة العميل">رغبة العميل (خلال مهلة الاسترجاع القانونية)</option>
                    <option value="عيب صناعة بالجهاز">عيب صناعة بالجهاز</option>
                    <option value="تلف الكرتونة والتغليف">تلف الكرتونة والتغليف</option>
                    <option value="استبدال بموديل آخر">استبدال بموديل آخر</option>
                    <option value="أخرى">سبب آخر...</option>
                  </select>
                  {returnReason === 'أخرى' && (
                    <input
                      type="text"
                      placeholder="اكتب السبب بالتفصيل..."
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      className="mt-2 w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs"
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Summary & Action */}
        {sale && (
          <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 mt-auto">
            <div>
              <span className="text-slate-500 block text-[11px]">إجمالي المبلغ المسترد للعميل:</span>
              <span className="text-xl font-black text-rose-600 font-mono">
                {Number(totalRefundAmount).toLocaleString()} {currency}
              </span>
              <span className="text-slate-400 text-[10px] mr-2">({selectedList.length} أجهزة محددة)</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSubmitReturn}
                disabled={submitting || selectedList.length === 0}
                className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold px-6 py-2.5 rounded-xl shadow cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{submitting ? 'جاري المعالجة...' : 'تأكيد المرتجع واسترداد المبلغ'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
