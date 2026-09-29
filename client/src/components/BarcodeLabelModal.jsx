import React, { useState } from 'react';
import { Barcode, Printer, X, Tag } from 'lucide-react';

export default function BarcodeLabelModal({ product, serial, settings, onClose }) {
  if (!product) return null;

  const [quantity, setQuantity] = useState(1);
  const currency = settings?.currency || 'ج.م';
  const storeName = settings?.store_name || 'دكان عبد العزيز';

  const barcodeValue = serial ? serial.serial_number : (product.barcode || product.model_number || `PRD-${product.id}`);

  const handlePrint = () => {
    window.print();
  };

  // Simple clean SVG barcode generator (pseudo Code128 pattern based on string hash)
  const generateBarcodeLines = (str) => {
    const bars = [];
    const seed = str.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    // Fixed start pattern
    bars.push({ width: 2, fill: true });
    bars.push({ width: 1, fill: false });
    bars.push({ width: 3, fill: true });

    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i) + seed;
      const b1 = (code % 3) + 1;
      const b2 = ((code >> 1) % 2) + 1;
      const b3 = ((code >> 2) % 3) + 1;
      const b4 = ((code >> 3) % 2) + 1;

      bars.push({ width: b1, fill: true });
      bars.push({ width: b2, fill: false });
      bars.push({ width: b3, fill: true });
      bars.push({ width: b4, fill: false });
    }

    // Stop pattern
    bars.push({ width: 2, fill: true });
    bars.push({ width: 1, fill: false });
    bars.push({ width: 3, fill: true });
    return bars;
  };

  const barcodeBars = generateBarcodeLines(barcodeValue);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 text-slate-800 text-xs">
        {/* Controls */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4 no-print">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">طباعة ملصق وباركود الجهاز</h3>
              <p className="text-[11px] text-slate-500">ملصق للمخزن وكرتونة الجهاز ومعاينة الرف</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-1.5 rounded-xl shadow cursor-pointer flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة الملصق</span>
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Label Preview Container */}
        <div className="bg-slate-100 p-6 rounded-2xl flex justify-center items-center">
          <div
            id="printable-area"
            className="w-[70mm] min-h-[45mm] bg-white p-3 border-2 border-dashed border-slate-400 rounded-lg shadow-sm text-center flex flex-col justify-between"
          >
            {/* Store Name & Device */}
            <div>
              <div className="flex justify-between items-center border-b border-slate-200 pb-1 mb-1">
                <span className="font-black text-[11px] text-blue-900">{storeName}</span>
                <span className="text-[9px] font-bold text-slate-500">ضمان: {product.warranty_months} شهر</span>
              </div>
              <h4 className="font-black text-xs text-slate-900 line-clamp-1">{product.name}</h4>
              <p className="text-[10px] text-slate-500 font-mono" dir="ltr">موديل: {product.model_number || '---'}</p>
            </div>

            {/* Barcode SVG */}
            <div className="my-2 flex flex-col items-center justify-center">
              <div className="flex items-center justify-center h-10 w-full overflow-hidden px-2">
                {barcodeBars.map((bar, idx) => (
                  <div
                    key={idx}
                    className={`h-full ${bar.fill ? 'bg-black' : 'bg-transparent'}`}
                    style={{ width: `${bar.width * 2}px` }}
                  ></div>
                ))}
              </div>
              <span className="font-mono font-black text-xs tracking-widest text-slate-900 mt-1 block" dir="ltr">
                {barcodeValue}
              </span>
            </div>

            {/* Pricing */}
            <div className="border-t border-slate-200 pt-1 flex justify-between items-center text-[10px] font-bold">
              <div>
                <span className="text-slate-500 block text-[9px]">سعر الكاش:</span>
                <span className="font-black text-slate-900 text-xs" dir="ltr">
                  {Number(product.cash_price).toLocaleString()} {currency}
                </span>
              </div>
              {product.installment_price > 0 && (
                <div className="text-left">
                  <span className="text-slate-500 block text-[9px]">سعر التقسيط:</span>
                  <span className="font-extrabold text-blue-700" dir="ltr">
                    {Number(product.installment_price).toLocaleString()} {currency}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-400 mt-3 no-print">
          * متوافق مع جميع طابعات الباركود الحرارية (Xprinter, Zebra, Bixolon) مقاس 50×30 مم و 70×45 مم
        </p>
      </div>
    </div>
  );
}
