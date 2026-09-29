import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Minus, 
  FileText, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Building2, 
  ArrowRightLeft, 
  CreditCard, 
  CheckCircle2, 
  X,
  AlertCircle,
  AlertTriangle,
  Edit2,
  Trash2,
  Calendar,
  Percent,
  Clock
} from 'lucide-react';
import { api } from '../api';

export default function Cashbox({ settings }) {
  const [activeSubTab, setActiveSubTab] = useState('cashbox'); // 'cashbox', 'banks', 'transfers', 'finance'
  
  // Data State
  const [cashData, setCashData] = useState({ balance: 0, totalIn: 0, totalOut: 0, transactions: [] });
  const [accountsData, setAccountsData] = useState({ cashboxBalance: 0, accounts: [], totalBankBalance: 0, totalLiquidAssets: 0 });
  const [transfers, setTransfers] = useState([]);
  const [financeCompanies, setFinanceCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showFinanceModal, setShowFinanceModal] = useState(false);

  // Edit states for Banks & Finance Partners
  const [editingAccount, setEditingAccount] = useState(null);
  const [editingFinance, setEditingFinance] = useState(null);

  // Plan Modal state for Finance Companies
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedCompanyForPlan, setSelectedCompanyForPlan] = useState(null);
  const [planForm, setPlanForm] = useState({
    id: null,
    name: '',
    duration_months: 12,
    customer_interest_rate: 0,
    merchant_fee_rate: 0,
    min_downpayment_rate: 0,
    notes: ''
  });

  // Forms
  const [expenseForm, setExpenseForm] = useState({
    category: 'إيجار',
    title: '',
    amount: '',
    notes: '',
    expense_date: new Date().toISOString().slice(0, 10)
  });

  const [manualForm, setManualForm] = useState({
    type: 'in',
    category: 'إيداع نقدي',
    amount: '',
    description: ''
  });

  const [transferForm, setTransferForm] = useState({
    from_type: 'cashbox',
    from_account_id: '',
    to_type: 'bank',
    to_account_id: '',
    amount: '',
    fee: 0,
    reference_no: '',
    notes: ''
  });

  const [accountForm, setAccountForm] = useState({
    name: '',
    bank_name: '',
    account_number: '',
    type: 'bank',
    balance: 0,
    notes: ''
  });

  const [financeForm, setFinanceForm] = useState({
    name: '',
    merchant_fee_rate: 2.0,
    bank_account_id: '',
    phone: '',
    notes: ''
  });

  const currency = settings?.currency || 'ج.م';

  useEffect(() => {
    loadAllData();
  }, [activeSubTab]);

  const loadAllData = async () => {
    try {
      const [cash, accs, trans, comps] = await Promise.all([
        api.getCashbox(),
        api.getAccounts(),
        api.getTransfers(),
        api.getFinanceCompanies()
      ]);
      setCashData(cash);
      setAccountsData(accs);
      setTransfers(trans);
      setFinanceCompanies(comps);

      if (accs.accounts.length > 0) {
        setTransferForm(prev => ({
          ...prev,
          to_account_id: prev.to_account_id || accs.accounts[0].id,
          from_account_id: prev.from_account_id || accs.accounts[0].id
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveExpense = async (e) => {
    e.preventDefault();
    try {
      await api.createExpense(expenseForm);
      setShowExpenseModal(false);
      setExpenseForm({ category: 'إيجار', title: '', amount: '', notes: '', expense_date: new Date().toISOString().slice(0, 10) });
      loadAllData();
    } catch (err) {
      alert(err.message || 'خطأ أثناء تسجيل المصروف');
    }
  };

  const handleSaveManual = async (e) => {
    e.preventDefault();
    try {
      await api.addCashTransaction(manualForm);
      setShowManualModal(false);
      setManualForm({ type: 'in', category: 'إيداع نقدي', amount: '', description: '' });
      loadAllData();
    } catch (err) {
      alert(err.message || 'خطأ أثناء إضافة الحركة');
    }
  };

  const handleExecuteTransfer = async (e) => {
    e.preventDefault();
    try {
      if (transferForm.from_type === transferForm.to_type && 
          transferForm.from_type === 'bank' && 
          Number(transferForm.from_account_id) === Number(transferForm.to_account_id)) {
        alert('لا يمكن التحويل لنفس الحساب');
        return;
      }

      const amt = Number(transferForm.amount) || 0;
      const fee = Number(transferForm.fee) || 0;
      const totalNeeded = amt + fee;
      if (amt <= 0) {
        alert('يرجى إدخال مبلغ صحيح للتحويل');
        return;
      }

      const sourceBalance = transferForm.from_type === 'cashbox'
        ? Number(cashData.balance)
        : Number(accountsData.accounts.find(a => String(a.id) === String(transferForm.from_account_id))?.balance || 0);

      if (totalNeeded > sourceBalance) {
        alert(`عفواً، المبلغ المطلوب تحويله مع المصاريف (${totalNeeded.toLocaleString()} ${currency}) يتجاوز الرصيد المتاح في جهة الإرسال (${sourceBalance.toLocaleString()} ${currency})!`);
        return;
      }

      await api.transferFunds(transferForm);
      setShowTransferModal(false);
      setTransferForm({
        from_type: 'cashbox',
        from_account_id: accountsData.accounts[0]?.id || '',
        to_type: 'bank',
        to_account_id: accountsData.accounts[0]?.id || '',
        amount: '',
        fee: 0,
        reference_no: '',
        notes: ''
      });
      loadAllData();
    } catch (err) {
      alert(err.message || 'خطأ أثناء تنفيذ التحويل');
    }
  };

  const handleOpenAddPlan = (company) => {
    setSelectedCompanyForPlan(company);
    setPlanForm({
      id: null,
      name: `نظام تقسيط ${company.name}`,
      duration_months: 12,
      customer_interest_rate: 0,
      merchant_fee_rate: company.merchant_fee_rate || 2.0,
      min_downpayment_rate: 0,
      notes: ''
    });
    setShowPlanModal(true);
  };

  const handleOpenEditPlan = (company, plan) => {
    setSelectedCompanyForPlan(company);
    setPlanForm({
      id: plan.id,
      name: plan.name,
      duration_months: plan.duration_months,
      customer_interest_rate: plan.customer_interest_rate,
      merchant_fee_rate: plan.merchant_fee_rate,
      min_downpayment_rate: plan.min_downpayment_rate,
      notes: plan.notes || ''
    });
    setShowPlanModal(true);
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    if (!selectedCompanyForPlan) return;
    try {
      if (planForm.id) {
        await api.updateFinancePlan(planForm.id, planForm);
      } else {
        await api.createFinancePlan(selectedCompanyForPlan.id, planForm);
      }
      setShowPlanModal(false);
      loadAllData();
    } catch (err) {
      alert(err.message || 'خطأ أثناء حفظ خطة التقسيط');
    }
  };

  const handleDeletePlan = async (plan) => {
    if (!window.confirm(`هل أنت متأكد من حذف نظام التقسيط "${plan.name}"؟`)) return;
    try {
      await api.deleteFinancePlan(plan.id);
      loadAllData();
    } catch (err) {
      alert(err.message || 'خطأ أثناء حذف خطة التقسيط');
    }
  };

  const handleSaveAccount = async (e) => {
    e.preventDefault();
    try {
      await api.createAccount(accountForm);
      setShowAccountModal(false);
      setAccountForm({ name: '', bank_name: '', account_number: '', type: 'bank', balance: 0, notes: '' });
      loadAllData();
    } catch (err) {
      alert(err.message || 'خطأ أثناء فتح الحساب');
    }
  };

  const handleSaveFinanceCompany = async (e) => {
    e.preventDefault();
    try {
      await api.createFinanceCompany(financeForm);
      setShowFinanceModal(false);
      setFinanceForm({ name: '', merchant_fee_rate: 2.0, bank_account_id: '', phone: '', notes: '' });
      loadAllData();
    } catch (err) {
      alert(err.message || 'خطأ أثناء حفظ شركة التمويل');
    }
  };

  const handleUpdateAccount = async (e) => {
    e.preventDefault();
    if (!editingAccount) return;
    try {
      await api.updateAccount(editingAccount.id, editingAccount);
      setEditingAccount(null);
      loadAllData();
    } catch (err) {
      alert(err.message || 'خطأ أثناء تعديل بيانات الحساب');
    }
  };

  const handleDeleteAccount = async (acc) => {
    if (!window.confirm(`هل أنت متأكد من حذف الحساب البنكي "${acc.name}"؟`)) return;
    try {
      await api.deleteAccount(acc.id);
      loadAllData();
    } catch (err) {
      alert(err.message || 'خطأ أثناء حذف الحساب');
    }
  };

  const handleUpdateFinanceCompany = async (e) => {
    e.preventDefault();
    if (!editingFinance) return;
    try {
      await api.updateFinanceCompany(editingFinance.id, editingFinance);
      setEditingFinance(null);
      loadAllData();
    } catch (err) {
      alert(err.message || 'خطأ أثناء تحديث بيانات وسياسة شركة التمويل');
    }
  };

  const handleDeleteFinanceCompany = async (fc) => {
    if (!window.confirm(`هل أنت متأكد من حذف شركة التمويل "${fc.name}"؟`)) return;
    try {
      await api.deleteFinanceCompany(fc.id);
      loadAllData();
    } catch (err) {
      alert(err.message || 'خطأ أثناء حذف شركة التمويل');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Liquidity Overview Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold text-blue-300 block mb-1">إجمالي السيولة والأصول النقدية للمحل</span>
          <div className="text-3xl font-black text-white tracking-tight" dir="ltr">
            {Number(accountsData.totalLiquidAssets).toLocaleString()} <span className="text-sm font-bold text-blue-300">{currency}</span>
          </div>
          <p className="text-xs text-blue-200 mt-1 font-medium">
            (خزينة الكاش: {Number(cashData.balance).toLocaleString()} {currency} + الأرصدة البنكية والشركات: {Number(accountsData.totalBankBalance).toLocaleString()} {currency})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowTransferModal(true)}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-5 py-3 rounded-2xl shadow-lg transition-all cursor-pointer flex items-center gap-2"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>تحويل أموال (خزينة / بنك)</span>
          </button>
        </div>
      </div>

      {/* Sub-tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs">
        {[
          { id: 'cashbox', label: '💵 الخزينة النقدية والمصروفات', icon: Wallet },
          { id: 'banks', label: '🏦 الحسابات البنكية والمحافظ', icon: Building2 },
          { id: 'transfers', label: '🔄 سجل التحويلات البنكية', icon: ArrowRightLeft },
          { id: 'finance', label: '🏢 شركات التمويل (فاليو / كونتاكت)', icon: CreditCard },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeSubTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ============================================================ */}
      {/* 1. CASHBOX VIEW */}
      {/* ============================================================ */}
      {activeSubTab === 'cashbox' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500">رصيد الخزينة النقدية (الكاش)</span>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Wallet className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 tracking-tight" dir="ltr">
                {Number(cashData.balance).toLocaleString()} <span className="text-xs font-normal text-slate-500">{currency}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500">إجمالي المقبوضات (الوارد)</span>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-black text-emerald-600 tracking-tight" dir="ltr">
                +{Number(cashData.totalIn).toLocaleString()} <span className="text-xs font-normal text-slate-500">{currency}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500">إجمالي المدفوعات (المنصرف)</span>
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <TrendingDown className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-black text-rose-600 tracking-tight" dir="ltr">
                -{Number(cashData.totalOut).toLocaleString()} <span className="text-xs font-normal text-slate-500">{currency}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowExpenseModal(true)}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Minus className="w-4 h-4" />
              <span>تسجيل مصروف جديد</span>
            </button>

            <button
              onClick={() => setShowManualModal(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>حركة خزينة يدوية (إيداع / سحب)</span>
            </button>
          </div>

          {/* Transactions Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-800">دفتر يومية الخزينة النقدية</h3>
              <span className="text-xs text-slate-400">آخر 100 حركة مسجلة</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold">
                    <th className="py-3 px-4">نوع الحركة</th>
                    <th className="py-3 px-4">التصنيف</th>
                    <th className="py-3 px-4">البيان والتفاصيل</th>
                    <th className="py-3 px-4">المبلغ</th>
                    <th className="py-3 px-4">التاريخ والوقت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {cashData.transactions.map((t) => {
                    const isIn = t.type === 'in';
                    return (
                      <tr key={t.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[10px] ${
                            isIn ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {isIn ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                            {isIn ? 'وارد' : 'منصرف'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800">{t.category}</td>
                        <td className="py-3 px-4 text-slate-600">{t.description}</td>
                        <td className={`py-3 px-4 font-black text-sm ${isIn ? 'text-emerald-700' : 'text-rose-600'}`} dir="ltr">
                          {isIn ? '+' : '-'}{Number(t.amount).toLocaleString()} {currency}
                        </td>
                        <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{t.created_at}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. BANK ACCOUNTS & RECEIVABLES VIEW */}
      {/* ============================================================ */}
      {activeSubTab === 'banks' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-slate-800">
              قائمة الحسابات البنكية والمحافظ الإلكترونية ({accountsData.accounts.length})
            </h3>
            <button
              onClick={() => setShowAccountModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة حساب بنكي جديد</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {accountsData.accounts.map((acc) => (
              <div key={acc.id} className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                      {acc.type === 'wallet' ? 'محفظة إلكترونية' : acc.type === 'finance_partner' ? 'مستحقات تمويل' : 'حساب بنكي'}
                    </span>
                    <h4 className="font-extrabold text-sm text-slate-900 mt-1">{acc.name}</h4>
                    {acc.bank_name && <p className="text-xs text-slate-500">{acc.bank_name}</p>}
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                    <Building2 className="w-5 h-5" />
                  </div>
                </div>

                {acc.account_number && (
                  <div className="bg-slate-50 p-2 rounded-lg font-mono text-xs font-bold text-slate-700" dir="ltr">
                    #{acc.account_number}
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-bold">الرصيد المتاح:</span>
                  <span className="text-lg font-black text-blue-700" dir="ltr">
                    {Number(acc.balance).toLocaleString()} {currency}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
                  <button
                    onClick={() => setEditingAccount({ ...acc })}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold transition cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>تعديل</span>
                  </button>
                  <button
                    onClick={() => handleDeleteAccount(acc)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. TRANSFERS LEDGER VIEW */}
      {/* ============================================================ */}
      {activeSubTab === 'transfers' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-slate-800">
              سجل التحويلات بين الخزينة والحسابات البنكية ({transfers.length})
            </h3>
            <button
              onClick={() => setShowTransferModal(true)}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-4 py-2 rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>تنفيذ تحويل جديد</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-extrabold">
                    <th className="py-3 px-4">من (المصدر)</th>
                    <th className="py-3 px-4">إلى (الوجهة)</th>
                    <th className="py-3 px-4">المبلغ المحول</th>
                    <th className="py-3 px-4">عمولة التحويل</th>
                    <th className="py-3 px-4">المرجع / الإيصال</th>
                    <th className="py-3 px-4">التاريخ والوقت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {transfers.map((tr) => (
                    <tr key={tr.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-bold text-rose-700">
                        {tr.from_type === 'cashbox' ? '💵 الخزينة النقدية' : `🏦 ${tr.from_account_name || 'حساب بنكي'}`}
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-700">
                        {tr.to_type === 'cashbox' ? '💵 الخزينة النقدية' : `🏦 ${tr.to_account_name || 'حساب بنكي'}`}
                      </td>
                      <td className="py-3 px-4 font-black text-sm text-slate-900" dir="ltr">
                        {Number(tr.amount).toLocaleString()} {currency}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono" dir="ltr">
                        {tr.fee > 0 ? `${Number(tr.fee).toLocaleString()} ${currency}` : 'بدون عمولة'}
                      </td>
                      <td className="py-3 px-4 font-mono text-blue-700" dir="ltr">{tr.reference_no || '---'}</td>
                      <td className="py-3 px-4 font-mono text-slate-400">{tr.created_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. FINANCE PARTNERS (valU / Contact) VIEW */}
      {/* ============================================================ */}
      {activeSubTab === 'finance' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-slate-800">
                شركات التمويل الاستهلاكي والتقسيط البنكي
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                إدارة شركاء التقسيط مثل فاليو، كونتاكت، سهولة، أمان، ونسب عمولات التاجر
              </p>
            </div>
            <button
              onClick={() => setShowFinanceModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة شريك تمويل جديد</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {financeCompanies.map((fc) => (
              <div key={fc.id} className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">{fc.name}</h4>
                    <span className="text-[11px] text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded mt-1 inline-block">
                      عمولة التاجر الافتراضية: {fc.merchant_fee_rate}%
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                    <CreditCard className="w-5 h-5" />
                  </div>
                </div>

                <div className="space-y-1 text-xs text-slate-600 pt-2 border-t border-slate-100">
                  <p>الحساب المودع به: <span className="font-bold text-slate-800">{fc.bank_account_name || 'الحساب الرئيسي'}</span></p>
                  {fc.phone && <p>الخط الساخن: <span className="font-mono font-bold text-blue-700" dir="ltr">{fc.phone}</span></p>}
                  {fc.notes && <p className="text-[11px] text-slate-500 italic">{fc.notes}</p>}
                </div>

                {/* Duration Plans List */}
                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-slate-700 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-indigo-600" />
                      <span>خطط ومدد التقسيط ({fc.plans?.length || 0}):</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenAddPlan(fc)}
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-md cursor-pointer flex items-center gap-0.5 transition"
                    >
                      <Plus className="w-3 h-3" />
                      <span>إضافة مدة</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-1.5 max-h-44 overflow-y-auto pr-0.5">
                    {(!fc.plans || fc.plans.length === 0) ? (
                      <p className="text-[10px] text-slate-400 italic">لا توجد مدد تقسيط مسجلة بعد</p>
                    ) : (
                      fc.plans.map(p => (
                        <div key={p.id} className="flex items-center justify-between p-1.5 bg-slate-50 hover:bg-slate-100/80 rounded-lg text-[10px] border border-slate-100 transition">
                          <div className="flex items-center gap-1.5">
                            <span className="font-black px-1.5 py-0.5 rounded bg-indigo-600 text-white font-mono text-[10px]">{p.duration_months} ش</span>
                            <div>
                              <span className="font-bold text-slate-800 block">{p.name}</span>
                              <span className="text-[9px] text-slate-500">
                                فائدة: {p.customer_interest_rate}% | عمولة: {p.merchant_fee_rate}% | مقدم: {p.min_downpayment_rate}%
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditPlan(fc, p)}
                              className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded cursor-pointer"
                              title="تعديل الخطة"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePlan(p)}
                              className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded cursor-pointer"
                              title="حذف الخطة"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
                  <button
                    onClick={() => setEditingFinance({ ...fc })}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold transition cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>تعديل التعاقد</span>
                  </button>
                  <button
                    onClick={() => handleDeleteFinanceCompany(fc)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: FUND TRANSFER (Between Cash & Banks) */}
      {/* ============================================================ */}
      {showTransferModal && (() => {
        const selectedFromAcc = transferForm.from_type === 'bank'
          ? accountsData.accounts.find(a => String(a.id) === String(transferForm.from_account_id))
          : null;
        const availableBal = transferForm.from_type === 'cashbox'
          ? Number(cashData.balance)
          : Number(selectedFromAcc?.balance || 0);
        const totalTransferAmount = (Number(transferForm.amount) || 0) + (Number(transferForm.fee) || 0);
        const isOverLimit = Number(transferForm.amount) > 0 && totalTransferAmount > availableBal;

        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 text-xs text-slate-800">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
                <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-amber-500" />
                  تحويل أموال بين الخزينة والحسابات البنكية
                </h3>
                <button onClick={() => setShowTransferModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleExecuteTransfer} className="space-y-3.5">
                {/* Source (From) */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-slate-700 font-extrabold text-xs">من (حساب المصدر) *</label>
                    <span className={`text-[11px] font-black px-2 py-0.5 rounded-lg ${availableBal <= 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'}`}>
                      الرصيد المتاح: {availableBal.toLocaleString()} {currency}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTransferForm({ ...transferForm, from_type: 'cashbox' })}
                      className={`py-2 rounded-xl font-bold text-xs cursor-pointer border ${
                        transferForm.from_type === 'cashbox' ? 'bg-blue-600 text-white border-blue-600 shadow-xs' : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      💵 الخزينة النقدية (الكاش)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTransferForm({ ...transferForm, from_type: 'bank' })}
                      className={`py-2 rounded-xl font-bold text-xs cursor-pointer border ${
                        transferForm.from_type === 'bank' ? 'bg-blue-600 text-white border-blue-600 shadow-xs' : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      🏦 حساب بنكي
                    </button>
                  </div>

                  {transferForm.from_type === 'bank' && (
                    <select
                      value={transferForm.from_account_id}
                      onChange={(e) => setTransferForm({ ...transferForm, from_account_id: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-xs"
                    >
                      {accountsData.accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} (رصيد: {Number(a.balance).toLocaleString()} {currency})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Destination (To) */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                  <label className="block text-slate-700 font-extrabold text-xs">إلى (حساب المستلم) *</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTransferForm({ ...transferForm, to_type: 'bank' })}
                      className={`py-2 rounded-xl font-bold text-xs cursor-pointer border ${
                        transferForm.to_type === 'bank' ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      🏦 حساب بنكي
                    </button>
                    <button
                      type="button"
                      onClick={() => setTransferForm({ ...transferForm, to_type: 'cashbox' })}
                      className={`py-2 rounded-xl font-bold text-xs cursor-pointer border ${
                        transferForm.to_type === 'cashbox' ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      💵 الخزينة النقدية (الكاش)
                    </button>
                  </div>

                  {transferForm.to_type === 'bank' && (
                    <select
                      value={transferForm.to_account_id}
                      onChange={(e) => setTransferForm({ ...transferForm, to_account_id: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-xs"
                    >
                      {accountsData.accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} (رصيد: {Number(a.balance).toLocaleString()} {currency})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Amount & Fee */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">المبلغ المحول *</label>
                    <input
                      type="number"
                      required
                      placeholder="0"
                      value={transferForm.amount}
                      onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-sm"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">مصاريف التحويل (إن وجدت)</label>
                    <input
                      type="number"
                      value={transferForm.fee}
                      onChange={(e) => setTransferForm({ ...transferForm, fee: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-sm"
                      dir="ltr"
                    />
                  </div>
                </div>

                {isOverLimit && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 p-2.5 rounded-xl font-bold flex items-center gap-2 text-xs">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>تنبيه: إجمالي المطلوب ({totalTransferAmount.toLocaleString()} {currency}) يتجاوز الرصيد المتاح ({availableBal.toLocaleString()} {currency})!</span>
                  </div>
                )}

                <div>
                  <label className="block text-slate-600 font-bold mb-1">رقم الإيصال أو المرجع البنكي</label>
                  <input
                    type="text"
                    placeholder="مثال: REF-990214 أو رقم إيصال الإيداع"
                    value={transferForm.reference_no}
                    onChange={(e) => setTransferForm({ ...transferForm, reference_no: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowTransferModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 font-bold cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={isOverLimit}
                    className={`px-6 py-2.5 rounded-xl font-black shadow-md flex items-center gap-1.5 transition ${
                      isOverLimit 
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                        : 'bg-amber-500 hover:bg-amber-600 text-slate-950 cursor-pointer'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>تأكيد التحويل الآن</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* ============================================================ */}
      {/* MODAL: ADD BANK ACCOUNT */}
      {/* ============================================================ */}
      {showAccountModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 text-xs text-slate-800">
            <h3 className="font-extrabold text-sm text-slate-900 mb-4">فتح حساب بنكي أو محفظة إلكترونية جديدة</h3>
            <form onSubmit={handleSaveAccount} className="space-y-3">
              <div>
                <label className="block text-slate-600 font-bold mb-1">اسم الحساب في النظام *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: حساب بنك القاهرة الرئيسي"
                  value={accountForm.name}
                  onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">اسم البنك أو الجهة المالية</label>
                <input
                  type="text"
                  placeholder="مثال: بنك القاهرة / فودافون كاش / بنك مصر"
                  value={accountForm.bank_name}
                  onChange={(e) => setAccountForm({ ...accountForm, bank_name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">رقم الحساب أو الآيبان IBAN / رقم المحفظة</label>
                <input
                  type="text"
                  placeholder="EG..."
                  value={accountForm.account_number}
                  onChange={(e) => setAccountForm({ ...accountForm, account_number: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono"
                  dir="ltr"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">نوع الحساب</label>
                  <select
                    value={accountForm.type}
                    onChange={(e) => setAccountForm({ ...accountForm, type: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                  >
                    <option value="bank">حساب بنكي جاري</option>
                    <option value="wallet">محفظة إلكترونية (انستاباي / كاش)</option>
                    <option value="finance_partner">مستحقات شركة تمويل</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">الرصيد الافتتاحي</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={accountForm.balance}
                    onChange={(e) => setAccountForm({ ...accountForm, balance: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">ملاحظات الحساب</label>
                <input
                  type="text"
                  placeholder="ملاحظات أو فرع الحساب..."
                  value={accountForm.notes}
                  onChange={(e) => setAccountForm({ ...accountForm, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button type="button" onClick={() => setShowAccountModal(false)} className="px-4 py-2 font-bold cursor-pointer text-slate-600">
                  إلغاء
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold cursor-pointer shadow-md hover:bg-blue-700">
                  حفظ الحساب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: ADD FINANCE PARTNER */}
      {/* ============================================================ */}
      {showFinanceModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 text-xs text-slate-800">
            <h3 className="font-extrabold text-sm text-slate-900 mb-4">إضافة شريك تقسيط أو تمويل استهلاكي جديد</h3>
            <form onSubmit={handleSaveFinanceCompany} className="space-y-3">
              <div>
                <label className="block text-slate-600 font-bold mb-1">اسم جهة / شركة التمويل *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: ڤاليو ValU / كونتاكت Contact / سهولة"
                  value={financeForm.name}
                  onChange={(e) => setFinanceForm({ ...financeForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">عمولة التاجر الافتراضية % *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="2.0"
                    value={financeForm.merchant_fee_rate}
                    onChange={(e) => setFinanceForm({ ...financeForm, merchant_fee_rate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">الخط الساخن / الهاتف</label>
                  <input
                    type="text"
                    placeholder="16xxx"
                    value={financeForm.phone}
                    onChange={(e) => setFinanceForm({ ...financeForm, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">الحساب المودع به مبالغ المبيعات</label>
                <select
                  value={financeForm.bank_account_id}
                  onChange={(e) => setFinanceForm({ ...financeForm, bank_account_id: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                >
                  <option value="">الحساب البنكي الرئيسي للمحل</option>
                  {accountsData.accounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} ({a.bank_name || 'بنك'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">شروط وسياسات التعاقد / الملاحظات</label>
                <textarea
                  rows="2"
                  value={financeForm.notes}
                  onChange={(e) => setFinanceForm({ ...financeForm, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  placeholder="مدة السداد، المستندات المطلوبة، كود التاجر..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button type="button" onClick={() => setShowFinanceModal(false)} className="px-4 py-2 font-bold cursor-pointer text-slate-600">
                  إلغاء
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold cursor-pointer shadow-md hover:bg-indigo-700">
                  حفظ الشريك
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: ADD / EDIT FINANCE PLAN */}
      {/* ============================================================ */}
      {showPlanModal && selectedCompanyForPlan && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 text-xs text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                {planForm.id ? 'تعديل خطة تقسيط' : `إضافة خطة تقسيط جديدة - ${selectedCompanyForPlan.name}`}
              </h3>
              <button onClick={() => setShowPlanModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-3">
              <div>
                <label className="block text-slate-600 font-bold mb-1">اسم الخطة / العرض *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: تقسيط 12 شهر بفائدة مخفضة / عرض بدون فوائد 6 أشهر"
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">مدة التقسيط (بالأشهر) *</label>
                  <select
                    value={planForm.duration_months}
                    onChange={(e) => setPlanForm({ ...planForm, duration_months: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold"
                  >
                    <option value={3}>3 أشهر</option>
                    <option value={6}>6 أشهر</option>
                    <option value={9}>9 أشهر</option>
                    <option value={12}>12 شهر (سنة)</option>
                    <option value={18}>18 شهر (سنة ونصف)</option>
                    <option value={24}>24 شهر (سنتان)</option>
                    <option value={36}>36 شهر (3 سنوات)</option>
                    <option value={48}>48 شهر (4 سنوات)</option>
                    <option value={60}>60 شهر (5 سنوات)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">فائدة العميل السنوية %</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="0"
                    value={planForm.customer_interest_rate}
                    onChange={(e) => setPlanForm({ ...planForm, customer_interest_rate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-blue-700"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">عمولة التاجر المحسومة %</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="0"
                    value={planForm.merchant_fee_rate}
                    onChange={(e) => setPlanForm({ ...planForm, merchant_fee_rate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-rose-700"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">الحد الأدنى للمقدم %</label>
                  <input
                    type="number"
                    step="1"
                    placeholder="0"
                    value={planForm.min_downpayment_rate}
                    onChange={(e) => setPlanForm({ ...planForm, min_downpayment_rate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-emerald-700"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">ملاحظات وشروط الخطة</label>
                <input
                  type="text"
                  placeholder="مثال: يتطلب بطاقة ائتمانية سارية..."
                  value={planForm.notes}
                  onChange={(e) => setPlanForm({ ...planForm, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowPlanModal(false)}
                  className="px-4 py-2 font-bold cursor-pointer text-slate-600"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{planForm.id ? 'حفظ التعديل' : 'إضافة الخطة'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: EXPENSE */}
      {/* ============================================================ */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6 text-xs">
            <h3 className="font-bold text-base text-slate-800 mb-4">تسجيل مصروف للمعرض</h3>
            <form onSubmit={handleSaveExpense} className="space-y-3">
              <div>
                <label className="block text-slate-600 font-bold mb-1">بند المصروف</label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                >
                  <option value="إيجار">إيجار المعرض والمخزن</option>
                  <option value="كهرباء">كهرباء ومرافق</option>
                  <option value="مرتبات">رواتب ومكافآت العاملين</option>
                  <option value="نقل وشحن">نقل وتوصيل أجهزة لمنازل العملاء</option>
                  <option value="صيانة">صيانة وتجهيزات المعرض</option>
                  <option value="بوفيه وضيافة">بوفيه واستقبال عملاء</option>
                  <option value="أخرى">مصروفات إدارية أخرى</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">بيان المصروف *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: فاتورة كهرباء شهر سبتمبر"
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">المبلغ المدفوع *</label>
                <input
                  type="number"
                  required
                  placeholder="0"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-rose-600"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button type="button" onClick={() => setShowExpenseModal(false)} className="px-4 py-2 font-bold cursor-pointer">
                  إلغاء
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-rose-600 text-white font-bold cursor-pointer">
                  صرف من الخزينة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: MANUAL CASHBOX ENTRY */}
      {/* ============================================================ */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6 text-xs">
            <h3 className="font-bold text-base text-slate-800 mb-4">حركة خزينة يدوية</h3>
            <form onSubmit={handleSaveManual} className="space-y-3">
              <div>
                <label className="block text-slate-600 font-bold mb-1">نوع الحركة</label>
                <select
                  value={manualForm.type}
                  onChange={(e) => setManualForm({ ...manualForm, type: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                >
                  <option value="in">إيداع نقدي في الخزينة (وارد +)</option>
                  <option value="out">سحب نقدي من الخزينة (منصرف -)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">المبلغ *</label>
                <input
                  type="number"
                  required
                  placeholder="0"
                  value={manualForm.amount}
                  onChange={(e) => setManualForm({ ...manualForm, amount: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">السبب / البيان</label>
                <input
                  type="text"
                  placeholder="مثال: تغذية الخزينة من الحساب الشخصي..."
                  value={manualForm.description}
                  onChange={(e) => setManualForm({ ...manualForm, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button type="button" onClick={() => setShowManualModal(false)} className="px-4 py-2 font-bold cursor-pointer">
                  إلغاء
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold cursor-pointer">
                  تأكيد الحركة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: EDIT BANK ACCOUNT */}
      {/* ============================================================ */}
      {editingAccount && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 text-xs text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-600" />
                تعديل بيانات الحساب البنكي / المحفظة
              </h3>
              <button onClick={() => setEditingAccount(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateAccount} className="space-y-3">
              <div>
                <label className="block text-slate-600 font-bold mb-1">اسم الحساب *</label>
                <input
                  type="text"
                  required
                  value={editingAccount.name || ''}
                  onChange={(e) => setEditingAccount({ ...editingAccount, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-1">اسم البنك / الجهة</label>
                <input
                  type="text"
                  value={editingAccount.bank_name || ''}
                  onChange={(e) => setEditingAccount({ ...editingAccount, bank_name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-1">رقم الحساب أو IBAN</label>
                <input
                  type="text"
                  value={editingAccount.account_number || ''}
                  onChange={(e) => setEditingAccount({ ...editingAccount, account_number: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-1">نوع الحساب</label>
                <select
                  value={editingAccount.type || 'bank'}
                  onChange={(e) => setEditingAccount({ ...editingAccount, type: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                >
                  <option value="bank">حساب بنكي</option>
                  <option value="wallet">محفظة إلكترونية (انستاباي / كاش)</option>
                  <option value="finance_partner">مستحقات شركة تمويل</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-1">ملاحظات الحساب</label>
                <input
                  type="text"
                  value={editingAccount.notes || ''}
                  onChange={(e) => setEditingAccount({ ...editingAccount, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button type="button" onClick={() => setEditingAccount(null)} className="px-4 py-2 font-bold cursor-pointer">
                  إلغاء
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer">
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: EDIT FINANCE PARTNER */}
      {/* ============================================================ */}
      {editingFinance && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 text-xs text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-indigo-600" />
                تعديل سياسات وتعاقد شركة التمويل
              </h3>
              <button onClick={() => setEditingFinance(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateFinanceCompany} className="space-y-3">
              <div>
                <label className="block text-slate-600 font-bold mb-1">اسم شركة / جهة التمويل *</label>
                <input
                  type="text"
                  required
                  value={editingFinance.name || ''}
                  onChange={(e) => setEditingFinance({ ...editingFinance, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">عمولة التاجر % *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={editingFinance.merchant_fee_rate || 0}
                    onChange={(e) => setEditingFinance({ ...editingFinance, merchant_fee_rate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">الخط الساخن / الهاتف</label>
                  <input
                    type="text"
                    value={editingFinance.phone || ''}
                    onChange={(e) => setEditingFinance({ ...editingFinance, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono"
                    dir="ltr"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-1">الحساب البنكي المودع به المبالغ</label>
                <select
                  value={editingFinance.bank_account_id || ''}
                  onChange={(e) => setEditingFinance({ ...editingFinance, bank_account_id: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                >
                  <option value="">-- بدون ربط بحساب بنكي --</option>
                  {accountsData.accounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} ({a.bank_name || 'بنك'})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-1">شروط وسياسات التعاقد / الملاحظات</label>
                <textarea
                  rows="2"
                  value={editingFinance.notes || ''}
                  onChange={(e) => setEditingFinance({ ...editingFinance, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  placeholder="مدة التقسيط، المستندات المطلوبة، رقم التاجر..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button type="button" onClick={() => setEditingFinance(null)} className="px-4 py-2 font-bold cursor-pointer">
                  إلغاء
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer">
                  حفظ السياسات والتعاقد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
