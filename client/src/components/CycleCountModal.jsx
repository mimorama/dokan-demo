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

  const inputRef = useRef(null);
  const currency = settings?.currency || 'ج.م';
  const storeName = settings?.store_name || 'معرض دكان عبد العزيز للأجهزة الكهربائية';

  useEffect(() => {
    loadWarehouses();
  }, []);

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
        setSelectedWarehouseId(userWh ? userWh.id : data[0].id);
      }
    } catch (err) {
      console.error(err);
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
            {/* Top KPIs Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
                <span className="text-[10px] text-slate-500 font-bold block">المسجل بالدفاتر</span>
                <span className="text-2xl font-black text-slate-800">{auditResult.summary?.db_count || 0}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">جهاز مسجل مسبقاً</span>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3">
                <span className="text-[10px] text-emerald-700 font-bold block">مطابق تماماً</span>
                <span className="text-2xl font-black text-emerald-600">{auditResult.summary?.matched_count || 0}</span>
                <span className="text-[10px] text-emerald-600 block mt-0.5">موجود بالرف والدفاتر</span>
              </div>

              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3">
                <span className="text-[10px] text-rose-700 font-bold block">عجز ونواقص</span>
                <span className="text-2xl font-black text-rose-600">{auditResult.summary?.missing_count || 0}</span>
                <span className="text-[10px] text-rose-600 block mt-0.5">مسجل ولم يُعثر عليه</span>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3">
                <span className="text-[10px] text-amber-700 font-bold block">زيادة وفائض</span>
                <span className="text-2xl font-black text-amber-600">{auditResult.summary?.surplus_count || 0}</span>
                <span className="text-[10px] text-amber-600 block mt-0.5">غير مسجل بهذا المخزن</span>
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
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditResult.missing?.length > 0 ? (
                      auditResult.missing.map((it, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-bold text-slate-800">{it.product_name}</td>
                          <td className="py-2 px-3 text-slate-500">{it.model_number || '-'}</td>
                          <td className="py-2 px-3 font-mono font-bold text-rose-600" dir="ltr">{it.serial_number}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="py-6 text-center text-emerald-600 font-bold">
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
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditResult.surplus?.length > 0 ? (
                      auditResult.surplus.map((it, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-mono font-bold text-amber-800" dir="ltr">{it.serial_number}</td>
                          <td className="py-2 px-3 font-bold text-slate-700">{it.product_name ? `${it.product_name} (${it.status})` : 'غير مسجل بقاعدة البيانات'}</td>
                          <td className="py-2 px-3 text-slate-500">{it.warehouse_name || 'غير محدد'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="py-6 text-center text-slate-500 font-bold">
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
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditResult.matched?.length > 0 ? (
                      auditResult.matched.map((it, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-bold text-slate-800">{it.product_name}</td>
                          <td className="py-2 px-3 text-slate-500">{it.model_number || '-'}</td>
                          <td className="py-2 px-3 font-mono font-bold text-emerald-700" dir="ltr">{it.serial_number}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="py-6 text-center text-slate-400">
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
              <button
                type="button"
                onClick={() => {
                  setAuditResult(null);
                  setScannedSerials([]);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold cursor-pointer"
              >
                جرد مستودع آخر
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-5 py-2.5 rounded-xl cursor-pointer flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة محضر الجرد</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
