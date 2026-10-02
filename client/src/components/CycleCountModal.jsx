import React, { useState, useEffect, useRef } from 'react';
import { 
  Barcode, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Scan, 
  Warehouse, 
  Trash2, 
  Printer, 
  FileText, 
  Layers,
  ArrowRight,
  ShieldCheck,
  AlertOctagon
} from 'lucide-react';
import { api } from '../api';

export default function CycleCountModal({ isOpen, onClose, currentUser, settings, onAuditSaved }) {
  if (!isOpen) return null;

  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [scanInput, setScanInput] = useState('');
  const [batchInput, setBatchInput] = useState('');
  const [showBatchMode, setShowBatchMode] = useState(false);
  const [scannedSerials, setScannedSerials] = useState([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [auditResult, setAuditResult] = useState(null);
  const [activeResultTab, setActiveResultTab] = useState('summary'); // 'summary', 'missing', 'surplus', 'matched'

  // Pre-audit expected stock & reconciliation (Requirement 8)
  const [expectedStock, setExpectedStock] = useState({ totalCount: 0, totalCost: 0, items: [] });
  const [loadingExpected, setLoadingExpected] = useState(false);
  const [isReconciling, setIsReconciling] = useState(false);
  const [reconciledSuccess, setReconciledSuccess] = useState(false);

  const inputRef = useRef(null);
  const currency = settings?.currency || 'ج.م';
  const storeName = settings?.store_name || 'معرض دكان عبد العزيز للأجهزة الكهربائية';

  useEffect(() => {
    loadWarehouses();
  }, []);

  useEffect(() => {
    if (selectedWarehouseId) {
      loadExpectedStock(selectedWarehouseId);
    }
  }, [selectedWarehouseId]);

  useEffect(() => {
    if (inputRef.current && !showBatchMode && !auditResult) {
      inputRef.current.focus();
    }
  }, [showBatchMode, auditResult]);

  const loadWarehouses = async () => {
    try {
      const data = await api.getWarehouses();
      setWarehouses(data);
      if (data.length > 0) {
        // default to user's branch warehouse or first
        const userWh = data.find(w => w.branch_id === currentUser?.branch_id);
        const whId = userWh ? userWh.id : data[0].id;
        setSelectedWarehouseId(whId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadExpectedStock = async (whId) => {
    setLoadingExpected(true);
    try {
      const data = await api.getExpectedWarehouseStock(whId);
      setExpectedStock(data || { totalCount: 0, totalCost: 0, items: [] });
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingExpected(false);
    }
  };

  const handleReconcileAudit = async () => {
    if (!auditResult?.audit_id) return;
    if (!window.confirm('هل أنت متأكد من اعتماد وتسوية فروق هذا الجرد تلقائياً وتحديث حالات الأجهزة الناقصة بالمخزون؟')) {
      return;
    }
    setIsReconciling(true);
    try {
      const res = await api.reconcileInventoryAudit(auditResult.audit_id);
      alert(res.message || 'تم اعتماد وتسوية فروق الجرد بنجاح');
      setReconciledSuccess(true);
      if (onAuditSaved) onAuditSaved({ ...auditResult, status: 'reconciled' });
    } catch (err) {
      alert(err.message || 'خطأ أثناء تسوية فروق الجرد');
    } finally {
      setIsReconciling(false);
    }
  };

  const handleAddSingleSerial = (e) => {
    e?.preventDefault();
    const clean = scanInput.trim().toUpperCase();
    if (!clean) return;

    if (scannedSerials.includes(clean)) {
      alert(`السيريال (${clean}) تم مسحه مسبقاً!`);
      setScanInput('');
      return;
    }

    setScannedSerials(prev => [clean, ...prev]);
    setScanInput('');
    if (inputRef.current) inputRef.current.focus();
  };

  const handleApplyBatchInput = () => {
    const lines = batchInput
      .split(/[\n,;\s]+/)
      .map(s => s.trim().toUpperCase())
      .filter(s => s.length > 0);

    if (lines.length === 0) return;

    const uniqueSet = new Set([...scannedSerials, ...lines]);
    setScannedSerials(Array.from(uniqueSet));
    setBatchInput('');
    setShowBatchMode(false);
  };

  const handleRemoveSerial = (sn) => {
    setScannedSerials(prev => prev.filter(s => s !== sn));
  };

  const handleExecuteAudit = async () => {
    if (!selectedWarehouseId) {
      alert('يرجى تحديد المستودع / المخزن المراد جرده');
      return;
    }
    if (scannedSerials.length === 0) {
      alert('يرجى مسح أو إدخال سيريال واحد على الأقل قبل بدء المطابقة');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        warehouse_id: Number(selectedWarehouseId),
        auditor_name: currentUser?.name || 'مسؤول الجرد',
        scanned_serials: scannedSerials,
        notes: notes || 'جرد دوري بالباركود'
      };

      const result = await api.createInventoryAudit(payload);
      setAuditResult(result);
      if (onAuditSaved) onAuditSaved(result);
    } catch (err) {
      alert(err.message || 'خطأ أثناء تنفيذ المطابقة والجرد');
    } finally {
      setLoading(false);
    }
  };

  const selectedWhObj = warehouses.find(w => w.id === Number(selectedWarehouseId));

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full p-6 text-slate-800 text-xs flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Scan className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">الجرد الفعلي الدوري بالباركود (Cycle Counting)</h3>
              <p className="text-[11px] text-slate-500">مسح الأجهزة بالسيريال ومطابقتها آلياً مع المخزون المسجل بالدفاتر</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Audit Form & Scanning Area */}
        {!auditResult ? (
          <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-1">
            {/* Top Config: Warehouse & Mode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div>
                <label className="block text-slate-700 font-bold mb-1">المستودع / المخزن الخاضع للجرد:</label>
                <select
                  value={selectedWarehouseId}
                  onChange={(e) => setSelectedWarehouseId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                >
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name} ({w.branch_name || 'مستودع عام'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">ملاحظات الجرد أو رقم الرف:</label>
                <input
                  type="text"
                  placeholder="مثال: جرد رف الغسالات - الربع الأول..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>
            </div>

            {/* Pre-Audit Expected Stock Banner (Requirement 8) */}
            <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-extrabold text-indigo-950 block">
                    الرصيد الدفتري المسجل في هذا المخزن:
                  </span>
                  <span className="text-[11px] text-indigo-700">
                    {loadingExpected ? 'جاري فحص رصيد المستودع...' : `إجمالي المتوقع وجوده على الرفوف: (${expectedStock.totalCount} جهاز)`}
                  </span>
                </div>
              </div>
              <div className="font-mono text-xs font-black text-indigo-900 bg-white px-3 py-1.5 rounded-xl border border-indigo-200 shadow-2xs" dir="ltr">
                القيمة التقديرية بالتكلفة: {Number(expectedStock.totalCost || 0).toLocaleString()} {currency}
              </div>
            </div>

            {/* Barcode Scanner Box */}
            <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-blue-900 text-xs flex items-center gap-1.5">
                  <Barcode className="w-4 h-4 text-blue-600" />
                  ماسح الباركود المباشر:
                </span>
                <button
                  type="button"
                  onClick={() => setShowBatchMode(!showBatchMode)}
                  className="text-[11px] font-bold text-blue-700 hover:underline cursor-pointer"
                >
                  {showBatchMode ? 'العودة للمسح الفردي المباشر' : 'إدخال دفعة سيريال جملة (Batch Paste)'}
                </button>
              </div>

              {!showBatchMode ? (
                <form onSubmit={handleAddSingleSerial} className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="امسح باركود الجهاز الآن بقارئ الباركود أو اكتب السيريال واضغط Enter..."
                    value={scanInput}
                    onChange={(e) => setScanInput(e.target.value)}
                    className="flex-1 bg-white border-2 border-blue-400 rounded-xl px-4 py-2.5 font-mono text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-600"
                    dir="ltr"
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl cursor-pointer"
                  >
                    إضافة
                  </button>
                </form>
              ) : (
                <div className="space-y-2">
                  <textarea
                    rows={4}
                    placeholder="الصق قائمة السيريالات هنا (كل سيريال في سطر أو مفصولة بفواصل)..."
                    value={batchInput}
                    onChange={(e) => setBatchInput(e.target.value)}
                    className="w-full bg-white border border-blue-300 rounded-xl p-3 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={handleApplyBatchInput}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl cursor-pointer"
                  >
                    إضافة جميع السيريالات
                  </button>
                </div>
              )}
            </div>

            {/* Scanned List Display */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-800 text-xs">
                  السيريالات الممسوحة حالياً ({scannedSerials.length} جهاز):
                </span>
                {scannedSerials.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('هل تريد مسح القائمة الحالية بالكامل؟')) setScannedSerials([]);
                    }}
                    className="text-[11px] text-rose-600 hover:underline font-bold"
                  >
                    مسح الكل
                  </button>
                )}
              </div>

              {scannedSerials.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-slate-400">
                  <Scan className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>لم يتم مسح أي جهاز حتى الآن</p>
                  <p className="text-[11px] text-slate-400 mt-1">ابدأ بمسح الأجهزة الموضوعة على الرف في هذا المخزن</p>
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50 flex flex-wrap gap-2">
                  {scannedSerials.map((sn, idx) => (
                    <div
                      key={sn}
                      className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 flex items-center gap-2 shadow-2xs font-mono text-xs"
                      dir="ltr"
                    >
                      <span className="text-[10px] text-slate-400 font-sans">#{scannedSerials.length - idx}</span>
                      <span className="font-bold text-slate-800">{sn}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSerial(sn)}
                        className="text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Audit Results Presentation */
          <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-1">
            {/* Top KPIs Summary - 5 Cards (Requirement 8) */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2.5">
                <span className="text-[10px] text-slate-500 font-bold block">المتوقع بالدفاتر</span>
                <span className="text-xl font-black text-slate-800">{auditResult.summary?.total_expected || auditResult.summary?.db_count || 0}</span>
                <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                  {Number(auditResult.summary?.total_expected_cost || 0).toLocaleString()} {currency}
                </span>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-2.5">
                <span className="text-[10px] text-blue-700 font-bold block">الممسوح فعلياً</span>
                <span className="text-xl font-black text-blue-800">{auditResult.summary?.total_scanned || scannedSerials.length}</span>
                <span className="text-[10px] text-blue-600 block mt-0.5">جرد عيني مباشر</span>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-2.5">
                <span className="text-[10px] text-emerald-700 font-bold block">مطابق تماماً</span>
                <span className="text-xl font-black text-emerald-600">{auditResult.summary?.matched_count || 0}</span>
                <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">
                  دقة: {auditResult.summary?.accuracy_rate ?? 100}%
                </span>
              </div>

              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-2.5">
                <span className="text-[10px] text-rose-700 font-bold block">عجز ونواقص</span>
                <span className="text-xl font-black text-rose-600">{auditResult.summary?.missing_count || 0}</span>
                <span className="text-[10px] text-rose-700 font-mono font-bold block mt-0.5">
                  -{Number(auditResult.summary?.missing_cost || 0).toLocaleString()} {currency}
                </span>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-2.5">
                <span className="text-[10px] text-amber-700 font-bold block">زيادة وفائض</span>
                <span className="text-xl font-black text-amber-600">{auditResult.summary?.surplus_count || 0}</span>
                <span className="text-[10px] text-amber-700 font-mono font-bold block mt-0.5">
                  +{Number(auditResult.summary?.surplus_cost || 0).toLocaleString()} {currency}
                </span>
              </div>
            </div>

            {/* Audit Reference Strip */}
            <div className="bg-slate-100 p-3 rounded-xl flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-600">رقم محضر الجرد: </span>
                <span className="font-mono font-black text-blue-700">{auditResult.audit_no}</span>
              </div>
              <div>
                <span className="font-bold text-slate-600">المستودع: </span>
                <span className="font-bold text-slate-800">{selectedWhObj?.name}</span>
              </div>
              <div>
                <span className="font-bold text-slate-600">مسؤول الجرد: </span>
                <span className="font-bold text-slate-800">{auditResult.auditor_name || currentUser?.name}</span>
              </div>
              <div>
                <span className="font-bold text-slate-600">حالة الاعتماد: </span>
                <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${reconciledSuccess ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                  {reconciledSuccess ? 'معتمد ومسوى بالمخزون' : 'مسودة محضر جرد'}
                </span>
              </div>
            </div>

            {/* Tabs for Results */}
            <div className="flex border-b border-slate-200">
              <button
                type="button"
                onClick={() => setActiveResultTab('missing')}
                className={`py-2 px-4 font-bold border-b-2 transition-all cursor-pointer ${
                  activeResultTab === 'missing'
                    ? 'border-rose-600 text-rose-700 bg-rose-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                الأجهزة الناقصة ({auditResult.missing?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setActiveResultTab('surplus')}
                className={`py-2 px-4 font-bold border-b-2 transition-all cursor-pointer ${
                  activeResultTab === 'surplus'
                    ? 'border-amber-600 text-amber-700 bg-amber-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                الأجهزة الزائدة وغير المسجلة ({auditResult.surplus?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setActiveResultTab('matched')}
                className={`py-2 px-4 font-bold border-b-2 transition-all cursor-pointer ${
                  activeResultTab === 'matched'
                    ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                الأجهزة المطابقة ({auditResult.matched?.length || 0})
              </button>
            </div>

            {/* Tab Content Tables */}
            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
              {activeResultTab === 'missing' && (
                <table className="w-full text-right text-xs">
                  <thead className="bg-rose-50 text-rose-800 font-bold sticky top-0">
                    <tr>
                      <th className="py-2 px-3">الجهاز</th>
                      <th className="py-2 px-3">الموديل</th>
                      <th className="py-2 px-3">السيريال المسجل</th>
                      <th className="py-2 px-3 text-left">سعر التكلفة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditResult.missing?.length > 0 ? (
                      auditResult.missing.map((it, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-bold text-slate-800">{it.product_name}</td>
                          <td className="py-2 px-3 text-slate-500">{it.model_number || '-'}</td>
                          <td className="py-2 px-3 font-mono font-bold text-rose-600" dir="ltr">{it.serial_number}</td>
                          <td className="py-2 px-3 font-mono font-bold text-slate-800 text-left" dir="ltr">
                            {Number(it.buy_price || 0).toLocaleString()} {currency}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-emerald-600 font-bold">
                          🎉 ممتاز! لا يوجد أي عجز في هذا المخزن، جميع الأجهزة موجودة.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}

              {activeResultTab === 'surplus' && (
                <table className="w-full text-right text-xs">
                  <thead className="bg-amber-50 text-amber-800 font-bold sticky top-0">
                    <tr>
                      <th className="py-2 px-3">السيريال المفحوص</th>
                      <th className="py-2 px-3">الحالة بالنظام</th>
                      <th className="py-2 px-3">الموقع الفعلي بالدفاتر</th>
                      <th className="py-2 px-3 text-left">التكلفة التقديرية</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditResult.surplus?.length > 0 ? (
                      auditResult.surplus.map((it, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-mono font-bold text-amber-800" dir="ltr">{it.serial_number}</td>
                          <td className="py-2 px-3 font-bold text-slate-700">{it.product_name ? `${it.product_name}` : 'غير مسجل بقاعدة البيانات'}</td>
                          <td className="py-2 px-3 text-slate-500">{it.status || it.warehouse_name || 'غير محدد'}</td>
                          <td className="py-2 px-3 font-mono font-bold text-slate-800 text-left" dir="ltr">
                            {it.buy_price ? `${Number(it.buy_price).toLocaleString()} ${currency}` : '-'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-slate-500 font-bold">
                          لا توجد أي أجهزة زائدة أو خارجة عن العهدة.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}

              {activeResultTab === 'matched' && (
                <table className="w-full text-right text-xs">
                  <thead className="bg-emerald-50 text-emerald-800 font-bold sticky top-0">
                    <tr>
                      <th className="py-2 px-3">الجهاز</th>
                      <th className="py-2 px-3">الموديل</th>
                      <th className="py-2 px-3">السيريال المطابق</th>
                      <th className="py-2 px-3 text-left">سعر التكلفة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditResult.matched?.length > 0 ? (
                      auditResult.matched.map((it, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-bold text-slate-800">{it.product_name}</td>
                          <td className="py-2 px-3 text-slate-500">{it.model_number || '-'}</td>
                          <td className="py-2 px-3 font-mono font-bold text-emerald-700" dir="ltr">{it.serial_number}</td>
                          <td className="py-2 px-3 font-mono font-bold text-slate-800 text-left" dir="ltr">
                            {Number(it.buy_price || 0).toLocaleString()} {currency}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-slate-400">
                          لا توجد عناصر مطابقة.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3 mt-auto">
          {!auditResult ? (
            <>
              <span className="text-slate-500 text-xs">
                إجمالي الأجهزة الجاهزة للمطابقة: <strong className="text-blue-700">{scannedSerials.length}</strong>
              </span>

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
                  onClick={handleExecuteAudit}
                  disabled={loading || scannedSerials.length === 0}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-6 py-2.5 rounded-xl shadow cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{loading ? 'جاري التحليل والمطابقة...' : 'بدء المطابقة وحفظ محضر الجرد'}</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuditResult(null);
                    setScannedSerials([]);
                    setReconciledSuccess(false);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold cursor-pointer text-xs"
                >
                  جرد مستودع آخر
                </button>

                {/* Auto Reconcile Action Button */}
                {reconciledSuccess ? (
                  <div className="flex items-center gap-1.5 text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs">
                    <ShieldCheck className="w-4 h-4" />
                    <span>تم اعتماد وتسوية فروق الجرد آلياً بالمخزون</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleReconcileAudit}
                    disabled={isReconciling}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl cursor-pointer flex items-center gap-1.5 text-xs shadow-sm disabled:opacity-50"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{isReconciling ? 'جاري الاعتماد والتسوية...' : 'اعتماد وتسوية فروق الجرد آلياً'}</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2.5 rounded-xl cursor-pointer flex items-center gap-1.5 text-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة محضر الجرد (A4)</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl cursor-pointer text-xs"
                >
                  إغلاق
                </button>
              </div>
            </>
          )}
        </div>

        {/* Printable Official A4 Inventory Audit Minute (Requirement 8) */}
        {auditResult && (
          <>
            <style>{`
              @media print {
                @page {
                  size: A4 portrait;
                  margin: 8mm 10mm;
                }
                html, body {
                  background: #ffffff !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                body * {
                  visibility: hidden !important;
                }
                #audit-printable-area,
                #audit-printable-area * {
                  visibility: visible !important;
                }
                #audit-printable-area {
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  display: block !important;
                }
              }
            `}</style>

            <div id="audit-printable-area" className="hidden bg-white text-slate-900 p-8 font-sans" dir="rtl">
              {/* Header */}
              <div className="border-b-2 border-slate-900 pb-4 mb-5 flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-black text-slate-900">{storeName}</h1>
                  <p className="text-xs text-slate-600 mt-0.5">قسم الرقابة المخزنية والتدقيق الداخلي للعهد</p>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    تاريخ وساعة الجرد: {new Date().toLocaleDateString('ar-EG')} - {new Date().toLocaleTimeString('ar-EG')}
                  </p>
                </div>
                <div className="text-left">
                  <div className="inline-block border-2 border-slate-900 px-4 py-2 rounded-xl text-center bg-slate-50">
                    <span className="block text-[10px] text-slate-600 font-bold">محضر جرد فعلي وتدقيق عهدة</span>
                    <span className="block text-base font-black text-slate-900 font-mono">{auditResult.audit_no}</span>
                    <span className={`block text-[9px] font-bold mt-0.5 ${reconciledSuccess ? 'text-emerald-700' : 'text-slate-600'}`}>
                      {reconciledSuccess ? 'معتمد ومسوى بالمخزون' : 'محضر جرد دوري'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Meta Info */}
              <div className="grid grid-cols-3 gap-3 bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs mb-5">
                <div>
                  <span className="text-slate-500 font-bold block text-[11px]">المستودع / المخزن:</span>
                  <span className="font-black text-slate-800 text-sm">{selectedWhObj?.name || 'مخزن رئيسي'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block text-[11px]">رئيس لجنة الجرد:</span>
                  <span className="font-bold text-slate-800 text-sm">{auditResult.auditor_name || currentUser?.name}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block text-[11px]">طريقة الجرد:</span>
                  <span className="font-bold text-slate-800 text-sm">مسح عيني باركود وسيريال (100%)</span>
                </div>
              </div>

              {/* KPI Summary Grid */}
              <div className="grid grid-cols-5 gap-2 text-center mb-5">
                <div className="border border-slate-300 rounded-lg p-2 bg-slate-50">
                  <span className="text-[10px] text-slate-500 font-bold block">المتوقع بالدفاتر</span>
                  <span className="text-base font-black text-slate-900">{auditResult.summary?.total_expected || auditResult.summary?.db_count || 0}</span>
                  <span className="text-[9px] text-slate-600 font-mono block mt-0.5">
                    {Number(auditResult.summary?.total_expected_cost || 0).toLocaleString()} {currency}
                  </span>
                </div>
                <div className="border border-blue-300 rounded-lg p-2 bg-blue-50">
                  <span className="text-[10px] text-blue-800 font-bold block">الممسوح بالرف</span>
                  <span className="text-base font-black text-blue-900">{auditResult.summary?.total_scanned || scannedSerials.length}</span>
                  <span className="text-[9px] text-blue-700 block mt-0.5">جرد فعلي</span>
                </div>
                <div className="border border-emerald-300 rounded-lg p-2 bg-emerald-50">
                  <span className="text-[10px] text-emerald-800 font-bold block">مطابق تماماً</span>
                  <span className="text-base font-black text-emerald-900">{auditResult.summary?.matched_count || 0}</span>
                  <span className="text-[9px] text-emerald-800 font-bold block mt-0.5">
                    دقة {auditResult.summary?.accuracy_rate ?? 100}%
                  </span>
                </div>
                <div className="border border-rose-300 rounded-lg p-2 bg-rose-50">
                  <span className="text-[10px] text-rose-800 font-bold block">عجز ونواقص</span>
                  <span className="text-base font-black text-rose-900">{auditResult.summary?.missing_count || 0}</span>
                  <span className="text-[9px] text-rose-800 font-mono font-bold block mt-0.5">
                    -{Number(auditResult.summary?.missing_cost || 0).toLocaleString()} {currency}
                  </span>
                </div>
                <div className="border border-amber-300 rounded-lg p-2 bg-amber-50">
                  <span className="text-[10px] text-amber-800 font-bold block">زيادة وفائض</span>
                  <span className="text-base font-black text-amber-900">{auditResult.summary?.surplus_count || 0}</span>
                  <span className="text-[9px] text-amber-800 font-mono font-bold block mt-0.5">
                    +{Number(auditResult.summary?.surplus_cost || 0).toLocaleString()} {currency}
                  </span>
                </div>
              </div>

              {/* Missing Items Table */}
              <div className="mb-5">
                <h3 className="text-xs font-black text-rose-800 border-b border-rose-300 pb-1 mb-2 flex items-center justify-between">
                  <span>جدول تفريغ العجز والنواقص (أجهزة مسجلة بالدفاتر ولم تظهر بالرف)</span>
                  <span className="text-[11px] font-mono">العدد: {auditResult.missing?.length || 0} جهاز</span>
                </h3>
                <table className="w-full text-right text-xs border border-slate-300">
                  <thead className="bg-slate-100 text-slate-800 font-bold">
                    <tr>
                      <th className="py-1.5 px-2 border-b border-l border-slate-300 w-10 text-center">م</th>
                      <th className="py-1.5 px-2 border-b border-l border-slate-300">بيان الصنف والموديل</th>
                      <th className="py-1.5 px-2 border-b border-l border-slate-300">السيريال المسجل</th>
                      <th className="py-1.5 px-2 border-b border-slate-300 text-left">تكلفة الصنف الدفترية</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditResult.missing?.length > 0 ? (
                      auditResult.missing.map((it, idx) => (
                        <tr key={idx} className="border-b border-slate-200">
                          <td className="py-1 px-2 border-l border-slate-200 text-center font-mono text-[11px]">{idx + 1}</td>
                          <td className="py-1 px-2 border-l border-slate-200 font-bold">{it.product_name} {it.model_number ? `(${it.model_number})` : ''}</td>
                          <td className="py-1 px-2 border-l border-slate-200 font-mono text-rose-700 font-bold" dir="ltr">{it.serial_number}</td>
                          <td className="py-1 px-2 font-mono text-left" dir="ltr">{Number(it.buy_price || 0).toLocaleString()} {currency}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-3 text-center text-emerald-700 font-bold">
                          مطابق بالكامل - لا يوجد أي عجز مسجل بهذا المستودع.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Surplus Items Table */}
              {auditResult.surplus?.length > 0 && (
                <div className="mb-5">
                  <h3 className="text-xs font-black text-amber-800 border-b border-amber-300 pb-1 mb-2 flex items-center justify-between">
                    <span>جدول تفريغ الفائض والزيادة (أجهزة ممسوحة بالرف غير مقيدة بهذا المستودع)</span>
                    <span className="text-[11px] font-mono">العدد: {auditResult.surplus.length} جهاز</span>
                  </h3>
                  <table className="w-full text-right text-xs border border-slate-300">
                    <thead className="bg-slate-100 text-slate-800 font-bold">
                      <tr>
                        <th className="py-1.5 px-2 border-b border-l border-slate-300 w-10 text-center">م</th>
                        <th className="py-1.5 px-2 border-b border-l border-slate-300">السيريال المفحوص</th>
                        <th className="py-1.5 px-2 border-b border-l border-slate-300">بيان الجهاز والحالة</th>
                        <th className="py-1.5 px-2 border-b border-slate-300 text-left">التكلفة التقديرية</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditResult.surplus.map((it, idx) => (
                        <tr key={idx} className="border-b border-slate-200">
                          <td className="py-1 px-2 border-l border-slate-200 text-center font-mono text-[11px]">{idx + 1}</td>
                          <td className="py-1 px-2 border-l border-slate-200 font-mono text-amber-800 font-bold" dir="ltr">{it.serial_number}</td>
                          <td className="py-1 px-2 border-l border-slate-200">{it.product_name} - {it.status}</td>
                          <td className="py-1 px-2 font-mono text-left" dir="ltr">{it.buy_price ? `${Number(it.buy_price).toLocaleString()} ${currency}` : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Notes */}
              <div className="border border-slate-300 rounded-lg p-2.5 text-xs mb-6 bg-slate-50">
                <span className="font-bold text-slate-700 block mb-1">ملاحظات وقرار لجنة الجرد:</span>
                <p className="text-slate-600">
                  {notes || 'تمت أعمال الجرد الفعلي لكافة الأجهزة والكراتين الموجودة على أرفف المستودع ومطابقتها دفترياً بنظام السيريال نمبر.'}
                </p>
              </div>

              {/* 4 Signatures */}
              <div className="grid grid-cols-4 gap-4 text-center border-t-2 border-slate-900 pt-4 text-xs">
                <div>
                  <span className="block text-slate-500 font-bold mb-8">أمين المستودع / العهدة</span>
                  <div className="border-b border-dotted border-slate-400 mx-4"></div>
                  <span className="block text-[10px] text-slate-400 mt-1">الاسم والتوقيع</span>
                </div>
                <div>
                  <span className="block text-slate-500 font-bold mb-8">مسؤول لجنة الجرد</span>
                  <div className="border-b border-dotted border-slate-400 mx-4"></div>
                  <span className="block text-[10px] text-slate-400 mt-1">{auditResult.auditor_name || currentUser?.name}</span>
                </div>
                <div>
                  <span className="block text-slate-500 font-bold mb-8">المراجع الداخلي / المحاسب</span>
                  <div className="border-b border-dotted border-slate-400 mx-4"></div>
                  <span className="block text-[10px] text-slate-400 mt-1">الاسم والتوقيع</span>
                </div>
                <div>
                  <span className="block text-slate-500 font-bold mb-8">اعتماد مدير الإدارة</span>
                  <div className="border-b border-dotted border-slate-400 mx-4"></div>
                  <span className="block text-[10px] text-slate-400 mt-1">خاتم المعرض والاعتماد</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
