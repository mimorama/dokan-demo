import React, { useState } from 'react';
import { Calculator, X, MessageSquare, Check, Copy } from 'lucide-react';

export default function CalculatorModal({ isOpen, onClose, settings }) {
  if (!isOpen) return null;

  const [cashPrice, setCashPrice] = useState(20000);
  const [downPayment, setDownPayment] = useState(4000);
  const [months, setMonths] = useState(12);
  const [profitRate, setProfitRate] = useState(20);
  const [copied, setCopied] = useState(false);

  const currency = settings?.currency || 'ج.م';
  const storeName = settings?.store_name || 'معرض دكان عبد العزيز للأجهزة الكهربائية';

  const priceVal = Number(cashPrice) || 0;
  const downVal = Number(downPayment) || 0;
  const financed = Math.max(0, priceVal - downVal);
  const profitAmount = (financed * Number(profitRate || 0)) / 100;
  const totalInstallment = financed + profitAmount;
  const monthly = months > 0 ? Math.round((totalInstallment / months) * 100) / 100 : 0;

  const handleQuickDownPercent = (pct) => {
    setDownPayment(Math.round((priceVal * pct) / 100));
  };

  const getOfferText = () => {
    return `*عـرض أسـعـار تـقـسـيـط - ${storeName}*
----------------------------------------
💵 سعر الجهاز كاش: ${priceVal.toLocaleString()} ${currency}
💰 المقدم المطلوب: ${downVal.toLocaleString()} ${currency}
📅 مدة التقسيط: ${months} شهر
✨ *القسط الشهري: ${monthly.toLocaleString()} ${currency}*
📊 إجمالي المبلغ بالتقسيط: ${(downVal + totalInstallment).toLocaleString()} ${currency}
----------------------------------------
📍 ${settings?.address || 'شارع الأزهر - القاهرة'}
📞 للاستفسار والحجز: ${settings?.phone || '01023456789'}`;
  };

  const handleCopyOffer = () => {
    navigator.clipboard.writeText(getOfferText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 text-slate-800 text-xs">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">حاسبة الأقساط السريعة للزبائن</h3>
              <p className="text-[11px] text-slate-500">حساب فوري للأقساط ومشاركة العرض مع العميل</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Inputs */}
        <div className="space-y-3.5">
          <div>
            <label className="block text-slate-600 font-bold mb-1">سعر الجهاز كاش ({currency})</label>
            <input
              type="number"
              value={cashPrice}
              onChange={(e) => setCashPrice(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-mono font-black text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              dir="ltr"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-600 font-bold">المقدم المسدد ({currency})</label>
              <div className="flex items-center gap-1">
                {[10, 20, 25, 30].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handleQuickDownPercent(pct)}
                    className="px-2 py-0.5 rounded bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-800 text-[10px] font-bold cursor-pointer"
                  >
                    %{pct}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="number"
              value={downPayment}
              onChange={(e) => setDownPayment(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              dir="ltr"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 font-bold mb-1">مدة التقسيط</label>
              <select
                value={months}
                onChange={(e) => setMonths(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 focus:outline-none"
              >
                <option value={6}>6 شهور</option>
                <option value={10}>10 شهور</option>
                <option value={12}>12 شهر (سنة)</option>
                <option value={18}>18 شهر</option>
                <option value={24}>24 شهر (سنتين)</option>
                <option value={36}>36 شهر (3 سنوات)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-bold mb-1">نسبة الفائدة / الربح %</label>
              <select
                value={profitRate}
                onChange={(e) => setProfitRate(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 focus:outline-none"
              >
                <option value={0}>بدون فوائد (0%)</option>
                <option value={10}>10%</option>
                <option value={15}>15%</option>
                <option value={20}>20% (المعتاد)</option>
                <option value={25}>25%</option>
                <option value={30}>30%</option>
              </select>
            </div>
          </div>

          {/* Result Card */}
          <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100/60 border border-amber-300 rounded-2xl p-4 text-center space-y-2">
            <span className="text-[11px] font-bold text-amber-800 block">القسط الشهري المستحق:</span>
            <div className="text-3xl font-black text-amber-950 tracking-tight" dir="ltr">
              {monthly.toLocaleString()} <span className="text-sm font-bold text-amber-800">{currency}</span>
            </div>
            <div className="flex justify-around text-[11px] text-amber-900/80 pt-2 border-t border-amber-200 font-semibold">
              <span>المبلغ المقسط: {financed.toLocaleString()} {currency}</span>
              <span>الأرباح المضافة: {profitAmount.toLocaleString()} {currency}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-4 border-t border-slate-200 mt-4">
          <button
            onClick={handleCopyOffer}
            className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-2.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'تم نسخ العرض بنجاح!' : 'نسخ عرض الأسعار للمشاركة'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
