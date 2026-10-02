import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Layers, 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart, 
  Plus, 
  Search, 
  Printer, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Filter, 
  X, 
  ArrowRightLeft,
  Landmark,
  Building,
  Scale
} from 'lucide-react';
import { api } from '../api';

export default function Accounting({ settings, currentUser }) {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'chart', 'journal', 'ledger', 'trial', 'income', 'balance_sheet'
  const [loading, setLoading] = useState(false);

  const currency = settings?.currency || 'ج.م';
  const storeName = settings?.store_name || 'معرض دكان عبد العزيز للأجهزة الكهربائية';

  // State across tabs
  const [dashboardData, setDashboardData] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [journalEntries, setJournalEntries] = useState([]);
  const [ledgerData, setLedgerData] = useState(null);
  const [selectedLedgerAccount, setSelectedLedgerAccount] = useState('');
  const [ledgerDateFrom, setLedgerDateFrom] = useState('');
  const [ledgerDateTo, setLedgerDateTo] = useState('');
  const [trialBalanceData, setTrialBalanceData] = useState(null);
  const [incomeStatementData, setIncomeStatementData] = useState(null);
  const [balanceSheetData, setBalanceSheetData] = useState(null);

  // Official Print States (Requirement 12)
  const [selectedJournalVoucher, setSelectedJournalVoucher] = useState(null);
  const [printFinancialReport, setPrintFinancialReport] = useState(null); // 'trial', 'ledger', 'income', 'balance_sheet', 'chart', 'dashboard'

  // New Account Modal State
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [newAccountForm, setNewAccountForm] = useState({
    code: '',
    name: '',
    type: 'asset',
    normal_balance: 'debit',
    parent_id: '',
    opening_balance: 0,
    description: ''
  });

  // New Journal Entry Modal State
  const [showNewEntryModal, setShowNewEntryModal] = useState(false);
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [entryDescription, setEntryDescription] = useState('');
  const [entryLines, setEntryLines] = useState([
    { account_id: '', debit: 0, credit: 0, description: '' },
    { account_id: '', debit: 0, credit: 0, description: '' }
  ]);

  useEffect(() => {
    loadAccounts();
    loadDashboard();
  }, []);

  useEffect(() => {
    if (activeTab === 'dashboard') loadDashboard();
    else if (activeTab === 'chart') loadAccounts();
    else if (activeTab === 'journal') loadJournalEntries();
    else if (activeTab === 'ledger') loadLedger();
    else if (activeTab === 'trial') loadTrialBalance();
    else if (activeTab === 'income') loadIncomeStatement();
    else if (activeTab === 'balance_sheet') loadBalanceSheet();
  }, [activeTab]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const data = await api.getAccountingDashboard();
      setDashboardData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const data = await api.getAccountingAccounts();
      setAccounts(data || []);
      if (data && data.length > 0 && !selectedLedgerAccount) {
        setSelectedLedgerAccount(data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadJournalEntries = async () => {
    setLoading(true);
    try {
      const data = await api.getAccountingEntries();
      setJournalEntries(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadLedger = async (accId = selectedLedgerAccount) => {
    if (!accId) return;
    setLoading(true);
    try {
      let query = `account_id=${accId}`;
      if (ledgerDateFrom) query += `&date_from=${ledgerDateFrom}`;
      if (ledgerDateTo) query += `&date_to=${ledgerDateTo}`;
      const data = await api.getAccountingLedger(query);
      setLedgerData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadTrialBalance = async () => {
    setLoading(true);
    try {
      const data = await api.getTrialBalance();
      setTrialBalanceData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadIncomeStatement = async () => {
    setLoading(true);
    try {
      const data = await api.getIncomeStatement();
      setIncomeStatementData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadBalanceSheet = async () => {
    setLoading(true);
    try {
      const data = await api.getBalanceSheet();
      setBalanceSheetData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Add Account
  const handleSaveAccount = async (e) => {
    e.preventDefault();
    try {
      await api.createAccountingAccount(newAccountForm);
      alert('تم إضافة الحساب بنجاح إلى شجرة الحسابات');
      setShowAddAccountModal(false);
      setNewAccountForm({
        code: '',
        name: '',
        type: 'asset',
        normal_balance: 'debit',
        parent_id: '',
        opening_balance: 0,
        description: ''
      });
      loadAccounts();
    } catch (err) {
      alert(err.message || 'خطأ أثناء إضافة الحساب');
    }
  };

  // New Journal Entry Lines Handling
  const handleAddEntryLine = () => {
    setEntryLines([...entryLines, { account_id: '', debit: 0, credit: 0, description: '' }]);
  };

  const handleRemoveEntryLine = (idx) => {
    if (entryLines.length <= 2) {
      alert('يجب أن يحتوي القيد على طرفين على الأقل (مدين ودائن)');
      return;
    }
    setEntryLines(entryLines.filter((_, i) => i !== idx));
  };

  const handleLineChange = (index, field, value) => {
    const updated = [...entryLines];
    updated[index][field] = value;
    if (field === 'debit' && Number(value) > 0) {
      updated[index].credit = 0;
    } else if (field === 'credit' && Number(value) > 0) {
      updated[index].debit = 0;
    }
    setEntryLines(updated);
  };

  const totalEntryDebit = entryLines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
  const totalEntryCredit = entryLines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
  const isEntryBalanced = Math.abs(totalEntryDebit - totalEntryCredit) < 0.001 && totalEntryDebit > 0;

  const handleSaveJournalEntry = async (e) => {
    e.preventDefault();
    if (!isEntryBalanced) {
      alert('القيد المحاسبي غير متوازن! يجب أن يتساوى إجمالي المدين مع إجمالي الدائن تماماً.');
      return;
    }
    const hasEmptyAccounts = entryLines.some(l => !l.account_id || (Number(l.debit) === 0 && Number(l.credit) === 0));
    if (hasEmptyAccounts) {
      alert('يرجى اختيار الحساب وتحديد المبلغ لكل سطر في القيد');
      return;
    }

    try {
      await api.createAccountingEntry({
        entry_date: entryDate,
        description: entryDescription,
        created_by: currentUser?.id || 1,
        lines: entryLines.map(l => ({
          account_id: Number(l.account_id),
          debit: Number(l.debit) || 0,
          credit: Number(l.credit) || 0,
          description: l.description || entryDescription
        }))
      });
      alert('تم تسجيل القيد المحاسبي المزدوج وترحيله إلى دفتر الأستاذ بنجاح!');
      setShowNewEntryModal(false);
      setEntryDescription('');
      setEntryLines([
        { account_id: '', debit: 0, credit: 0, description: '' },
        { account_id: '', debit: 0, credit: 0, description: '' }
      ]);
      loadJournalEntries();
    } catch (err) {
      alert(err.message || 'خطأ أثناء حفظ القيد المحاسبي');
    }
  };

  const getAccountTypeName = (type) => {
    switch (type) {
      case 'asset': return 'أصول (Assets)';
      case 'liability': return 'خصوم والتزامات (Liabilities)';
      case 'equity': return 'حقوق الملكية ورأس المال (Equity)';
      case 'revenue': return 'إيرادات ومبيعات (Revenue)';
      case 'expense': return 'مصروفات وأعباء (Expense)';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <span>النظام المحاسبي المتكامل والقيود المزدوجة</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            شجرة الحسابات، قيود اليومية الآلية واليدوية، دفتر الأستاذ، ميزان المراجعة، قائمة الدخل، والميزانية العمومية
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'chart' && (
            <button
              onClick={() => setShowAddAccountModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة حساب جديد</span>
            </button>
          )}

          {activeTab === 'journal' && (
            <button
              onClick={() => setShowNewEntryModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>إنشاء قيد يومية يدوي</span>
            </button>
          )}

          <button
            onClick={() => setPrintFinancialReport(activeTab)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 no-print"
            title="طباعة التقرير المحاسبي الرسمي الحالي (A4)"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة التقرير الرسمي (A4)</span>
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold no-print">
        {[
          { id: 'dashboard', label: 'المؤشرات والملخص', icon: PieChart },
          { id: 'chart', label: 'دليل وشجرة الحسابات', icon: Layers },
          { id: 'journal', label: 'دفتر اليومية العامة', icon: FileText },
          { id: 'ledger', label: 'دفتر الأستاذ العام', icon: BookOpen },
          { id: 'trial', label: 'ميزان المراجعة', icon: Scale },
          { id: 'income', label: 'قائمة الدخل (الأرباح والخسائر)', icon: TrendingUp },
          { id: 'balance_sheet', label: 'الميزانية العمومية والمركز المالي', icon: Landmark }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Landmark className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-bold block">إجمالي الأصول (Assets)</span>
                <span className="text-xl font-black text-slate-900" dir="ltr">
                  {Number(dashboardData?.totals?.assets || 0).toLocaleString()} {currency}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">النقدية، البنوك، المخزون، والعملاء</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                <Building className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-bold block">إجمالي الخصوم (Liabilities)</span>
                <span className="text-xl font-black text-slate-900" dir="ltr">
                  {Number(dashboardData?.totals?.liabilities || 0).toLocaleString()} {currency}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">مديونيات الموردين والالتزامات</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Scale className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-bold block">حقوق الملكية ورأس المال</span>
                <span className="text-xl font-black text-indigo-700" dir="ltr">
                  {Number(dashboardData?.totals?.equity || 0).toLocaleString()} {currency}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">رأس المال والأرباح المحتجزة</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-bold block">إجمالي الإيرادات (Revenues)</span>
                <span className="text-xl font-black text-blue-700" dir="ltr">
                  {Number(dashboardData?.totals?.revenues || 0).toLocaleString()} {currency}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">إيراد المبيعات وفوائد التقسيط</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <TrendingDown className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-bold block">إجمالي المصروفات (Expenses)</span>
                <span className="text-xl font-black text-amber-700" dir="ltr">
                  {Number(dashboardData?.totals?.expenses || 0).toLocaleString()} {currency}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">المصاريف، الإيجارات، ورسوم التحصيل</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-bold block">صافي الربح المحاسبي للفترة</span>
                <span className={`text-xl font-black ${Number(dashboardData?.totals?.net_profit || 0) >= 0 ? 'text-emerald-700' : 'text-rose-600'}`} dir="ltr">
                  {Number(dashboardData?.totals?.net_profit || 0).toLocaleString()} {currency}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">الإيرادات - المصروفات</span>
              </div>
            </div>
          </div>

          {/* Balance Checker Note */}
          <div className="bg-indigo-50/80 border border-indigo-200 rounded-3xl p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                ✓
              </div>
              <div>
                <h4 className="font-extrabold text-indigo-950 text-sm">نظام القيد المزدوج الآلي نشط (Double-entry Ledger)</h4>
                <p className="text-xs text-indigo-800 mt-0.5">
                  كل عملية بيع، شراء، مرتجع، سداد موردين، أو صرف مصروفات يتم توليد قيد محاسبي آلي متوازن لها فوراً.
                </p>
              </div>
            </div>
            <div className="text-left font-mono text-xs font-bold text-indigo-900">
              إجمالي القيود المسجلة: {dashboardData?.entries_count || 0} قيد
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CHART OF ACCOUNTS */}
      {activeTab === 'chart' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <h3 className="font-extrabold text-sm text-slate-800">دليل الحسابات الموحد (Chart of Accounts)</h3>
            <span className="text-xs text-slate-500 font-mono">إجمالي الحسابات: {accounts.length} حساب</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-700 font-extrabold">
                <tr>
                  <th className="py-3 px-4">كود الحساب</th>
                  <th className="py-3 px-4">اسم الحساب</th>
                  <th className="py-3 px-4">نوع الحساب</th>
                  <th className="py-3 px-4">الطبيعة المحاسبية</th>
                  <th className="py-3 px-4">الرصيد الحالي</th>
                  <th className="py-3 px-4">الوصف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {accounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700" dir="ltr">
                      {acc.code}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {acc.name}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        acc.type === 'asset' ? 'bg-emerald-100 text-emerald-800' :
                        acc.type === 'liability' ? 'bg-rose-100 text-rose-800' :
                        acc.type === 'equity' ? 'bg-indigo-100 text-indigo-800' :
                        acc.type === 'revenue' ? 'bg-blue-100 text-blue-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {getAccountTypeName(acc.type)}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-600">
                      {acc.normal_balance === 'debit' ? 'مدين (Debit)' : 'دائن (Credit)'}
                    </td>
                    <td className="py-3 px-4 font-bold font-mono text-slate-900" dir="ltr">
                      {Number(acc.current_balance || 0).toLocaleString()} {currency}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {acc.description || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: GENERAL JOURNAL */}
      {activeTab === 'journal' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-800">دفتر قيود اليومية العامة (General Journal)</h3>
              <p className="text-xs text-slate-500 mt-0.5">سجل تاريخي كامل لجميع القيود المزدوجة المتوازنة (مدين = دائن)</p>
            </div>
            <button
              onClick={() => setShowNewEntryModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة قيد يدوي</span>
            </button>
          </div>

          <div className="space-y-3">
            {journalEntries.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
                لا توجد قيود يومية مسجلة حتى الآن
              </div>
            ) : (
              journalEntries.map((entry) => (
                <div key={entry.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                  <div className="p-3.5 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg" dir="ltr">
                        {entry.entry_no}
                      </span>
                      <span className="font-bold text-slate-800">{entry.description}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                      <span>التاريخ: {entry.entry_date}</span>
                      {entry.reference_type && (
                        <span className="bg-slate-200/80 px-2 py-0.5 rounded text-slate-700 font-mono font-bold">
                          {entry.reference_type} #{entry.reference_id}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => setSelectedJournalVoucher(entry)}
                        className="flex items-center gap-1 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-lg font-bold text-[11px] transition shadow-2xs cursor-pointer"
                        title="عرض وطباعة سند قيد محاسبي مزدوج رسمي A4"
                      >
                        <Printer className="w-3.5 h-3.5 text-indigo-600" />
                        <span>طباعة سند القيد (A4)</span>
                      </button>
                    </div>
                  </div>

                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 text-[11px]">
                      <tr>
                        <th className="py-2 px-4">الحساب</th>
                        <th className="py-2 px-4">البيان والتفصيل</th>
                        <th className="py-2 px-4 text-center w-32">مدين ({currency})</th>
                        <th className="py-2 px-4 text-center w-32">دائن ({currency})</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {entry.lines?.map((line, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-4 font-bold text-slate-800">
                            <span className="font-mono text-indigo-600 ml-1.5" dir="ltr">[{line.account_code}]</span>
                            {line.account_name}
                          </td>
                          <td className="py-2.5 px-4 text-slate-600 text-[11px]">
                            {line.description || '-'}
                          </td>
                          <td className="py-2.5 px-4 text-center font-mono font-bold text-emerald-700" dir="ltr">
                            {Number(line.debit) > 0 ? Number(line.debit).toLocaleString() : '-'}
                          </td>
                          <td className="py-2.5 px-4 text-center font-mono font-bold text-rose-700" dir="ltr">
                            {Number(line.credit) > 0 ? Number(line.credit).toLocaleString() : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 font-black text-slate-900 border-t border-slate-200">
                      <tr>
                        <td colSpan="2" className="py-2 px-4 text-left">الإجمالي:</td>
                        <td className="py-2 px-4 text-center font-mono text-emerald-800" dir="ltr">
                          {Number(entry.total_debit).toLocaleString()}
                        </td>
                        <td className="py-2 px-4 text-center font-mono text-rose-800" dir="ltr">
                          {Number(entry.total_credit).toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: GENERAL LEDGER */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-3xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">اختر الحساب:</span>
              <select
                value={selectedLedgerAccount}
                onChange={(e) => {
                  setSelectedLedgerAccount(e.target.value);
                  loadLedger(e.target.value);
                }}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold focus:border-indigo-600 focus:outline-none"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.code} - {acc.name} ({getAccountTypeName(acc.type)})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-bold">من:</span>
              <input
                type="date"
                value={ledgerDateFrom}
                onChange={(e) => setLedgerDateFrom(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 font-mono"
              />
              <span className="text-slate-500 font-bold">إلى:</span>
              <input
                type="date"
                value={ledgerDateTo}
                onChange={(e) => setLedgerDateTo(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 font-mono"
              />
              <button
                type="button"
                onClick={() => loadLedger()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3.5 py-2 rounded-xl transition cursor-pointer"
              >
                تطبيق الفلترة
              </button>
            </div>
          </div>

          {ledgerData && (
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="p-4 bg-indigo-50 border-b border-indigo-200 flex items-center justify-between">
                <div>
                  <h3 className="font-black text-sm text-indigo-950">
                    كشف حساب: {ledgerData.account?.code} - {ledgerData.account?.name}
                  </h3>
                  <span className="text-xs text-indigo-700">
                    الطبيعة المحاسبية: {ledgerData.account?.normal_balance === 'debit' ? 'مدين' : 'دائن'}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-left font-mono font-black text-indigo-900">
                    الرصيد الختامي: {Number(ledgerData.account?.current_balance || 0).toLocaleString()} {currency}
                  </div>
                  <button
                    type="button"
                    onClick={() => setPrintFinancialReport('ledger')}
                    className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-xl font-bold text-xs shadow-xs cursor-pointer transition no-print"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>طباعة كشف الحساب (A4)</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-extrabold">
                    <tr>
                      <th className="py-3 px-4">التاريخ</th>
                      <th className="py-3 px-4">رقم القيد</th>
                      <th className="py-3 px-4">البيان</th>
                      <th className="py-3 px-4 text-center">مدين</th>
                      <th className="py-3 px-4 text-center">دائن</th>
                      <th className="py-3 px-4 text-center">الرصيد المتراكم</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ledgerData.lines?.map((line, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60">
                        <td className="py-3 px-4 text-slate-600">{line.entry_date}</td>
                        <td className="py-3 px-4 font-mono font-bold text-indigo-700" dir="ltr">{line.entry_no}</td>
                        <td className="py-3 px-4 font-medium text-slate-800">{line.description}</td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-emerald-700" dir="ltr">
                          {Number(line.debit) > 0 ? Number(line.debit).toLocaleString() : '-'}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-rose-700" dir="ltr">
                          {Number(line.credit) > 0 ? Number(line.credit).toLocaleString() : '-'}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-black text-slate-900" dir="ltr">
                          {Number(line.running_balance).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: TRIAL BALANCE */}
      {activeTab === 'trial' && trialBalanceData && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-800">ميزان المراجعة بالأرصدة (Trial Balance)</h3>
              <span className="text-xs text-slate-500">حتى تاريخ: {new Date().toISOString().slice(0, 10)}</span>
            </div>
            <button
              type="button"
              onClick={() => setPrintFinancialReport('trial')}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-xs cursor-pointer transition no-print"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة ميزان المراجعة الرسمي (A4)</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-extrabold">
                <tr>
                  <th className="py-3 px-4">كود الحساب</th>
                  <th className="py-3 px-4">اسم الحساب</th>
                  <th className="py-3 px-4">النوع</th>
                  <th className="py-3 px-4 text-center">أرصدة مدينة ({currency})</th>
                  <th className="py-3 px-4 text-center">أرصدة دائنة ({currency})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {trialBalanceData.rows?.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700" dir="ltr">{row.code}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{row.name}</td>
                    <td className="py-3 px-4 text-[11px] text-slate-500">{getAccountTypeName(row.type)}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-emerald-700" dir="ltr">
                      {Number(row.debit_balance) > 0 ? Number(row.debit_balance).toLocaleString() : '-'}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-rose-700" dir="ltr">
                      {Number(row.credit_balance) > 0 ? Number(row.credit_balance).toLocaleString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-300 text-sm">
                <tr>
                  <td colSpan="3" className="py-3 px-4">إجمالي ميزان المراجعة:</td>
                  <td className="py-3 px-4 text-center font-mono text-emerald-800" dir="ltr">
                    {Number(trialBalanceData.total_debit).toLocaleString()} {currency}
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-rose-800" dir="ltr">
                    {Number(trialBalanceData.total_credit).toLocaleString()} {currency}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: INCOME STATEMENT */}
      {activeTab === 'income' && incomeStatementData && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-lg font-black text-slate-900">قائمة الدخل والأرباح والخسائر</h3>
              <p className="text-xs text-slate-500 mt-1">{storeName} - عن الفترة المنتهية في {new Date().toISOString().slice(0, 10)}</p>
            </div>
            <button
              type="button"
              onClick={() => setPrintFinancialReport('income')}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-xs cursor-pointer transition no-print"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة قائمة الدخل الرسمية (A4)</span>
            </button>
          </div>

          <div className="space-y-4 text-xs">
            {/* Revenues */}
            <div>
              <h4 className="font-extrabold text-sm text-emerald-900 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200 mb-2">
                1. الإيرادات التشغيلية (Revenues)
              </h4>
              <div className="space-y-1.5 pr-3">
                {incomeStatementData.revenues?.map((r, i) => (
                  <div key={i} className="flex justify-between py-1 border-b border-slate-100">
                    <span className="font-bold text-slate-700">{r.code} - {r.name}</span>
                    <span className="font-mono font-bold text-emerald-700" dir="ltr">
                      {Number(r.amount).toLocaleString()} {currency}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between pt-2 font-black text-sm text-emerald-950">
                  <span>إجمالي الإيرادات:</span>
                  <span dir="ltr">{Number(incomeStatementData.total_revenue).toLocaleString()} {currency}</span>
                </div>
              </div>
            </div>

            {/* Expenses */}
            <div className="pt-2">
              <h4 className="font-extrabold text-sm text-rose-900 bg-rose-50 px-3 py-2 rounded-xl border border-rose-200 mb-2">
                2. المصروفات التشغيلية والعمومية (Expenses)
              </h4>
              <div className="space-y-1.5 pr-3">
                {incomeStatementData.expenses?.map((e, i) => (
                  <div key={i} className="flex justify-between py-1 border-b border-slate-100">
                    <span className="font-bold text-slate-700">{e.code} - {e.name}</span>
                    <span className="font-mono font-bold text-rose-700" dir="ltr">
                      {Number(e.amount).toLocaleString()} {currency}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between pt-2 font-black text-sm text-rose-950">
                  <span>إجمالي المصروفات:</span>
                  <span dir="ltr">{Number(incomeStatementData.total_expense).toLocaleString()} {currency}</span>
                </div>
              </div>
            </div>

            {/* Net Income */}
            <div className="pt-4 border-t-2 border-slate-300">
              <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between text-base font-black">
                <span>صافي الربح / (الخسارة) للفترة:</span>
                <span className="font-mono text-emerald-400" dir="ltr">
                  {Number(incomeStatementData.net_income).toLocaleString()} {currency}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: BALANCE SHEET */}
      {activeTab === 'balance_sheet' && balanceSheetData && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-lg font-black text-slate-900">الميزانية العمومية وقائمة المركز المالي</h3>
              <p className="text-xs text-slate-500 mt-1">{storeName} - كما هي في {new Date().toISOString().slice(0, 10)}</p>
            </div>
            <button
              type="button"
              onClick={() => setPrintFinancialReport('balance_sheet')}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-xs cursor-pointer transition no-print"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة الميزانية العمومية الرسمية (A4)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Assets */}
            <div className="space-y-3">
              <h4 className="font-extrabold text-sm text-indigo-950 bg-indigo-50 p-2.5 rounded-xl border border-indigo-200">
                جانب الأصول (Assets)
              </h4>
              <div className="space-y-1.5">
                {balanceSheetData.assets?.map((a, i) => (
                  <div key={i} className="flex justify-between py-1 border-b border-slate-100">
                    <span className="font-bold text-slate-700">{a.code} - {a.name}</span>
                    <span className="font-mono font-bold text-slate-900" dir="ltr">
                      {Number(a.amount).toLocaleString()} {currency}
                    </span>
                  </div>
                ))}
              </div>
              <div className="pt-3 border-t-2 border-indigo-200 flex justify-between font-black text-sm text-indigo-900">
                <span>مجموع الأصول:</span>
                <span dir="ltr">{Number(balanceSheetData.total_assets).toLocaleString()} {currency}</span>
              </div>
            </div>

            {/* Liabilities & Equity */}
            <div className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-extrabold text-sm text-rose-950 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                  جانب الخصوم (Liabilities)
                </h4>
                <div className="space-y-1.5">
                  {balanceSheetData.liabilities?.map((l, i) => (
                    <div key={i} className="flex justify-between py-1 border-b border-slate-100">
                      <span className="font-bold text-slate-700">{l.code} - {l.name}</span>
                      <span className="font-mono font-bold text-slate-900" dir="ltr">
                        {Number(l.amount).toLocaleString()} {currency}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-xs text-rose-900">
                  <span>مجموع الخصوم:</span>
                  <span dir="ltr">{Number(balanceSheetData.total_liabilities).toLocaleString()} {currency}</span>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <h4 className="font-extrabold text-sm text-emerald-950 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                  حقوق الملكية (Equity)
                </h4>
                <div className="space-y-1.5">
                  {balanceSheetData.equity?.map((e, i) => (
                    <div key={i} className="flex justify-between py-1 border-b border-slate-100">
                      <span className="font-bold text-slate-700">{e.code} - {e.name}</span>
                      <span className="font-mono font-bold text-slate-900" dir="ltr">
                        {Number(e.amount).toLocaleString()} {currency}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between py-1 border-b border-slate-100 font-bold text-indigo-700">
                    <span>أرباح / (خسائر) الفترة المرحّلة:</span>
                    <span className="font-mono" dir="ltr">
                      {Number(balanceSheetData.current_year_earnings || 0).toLocaleString()} {currency}
                    </span>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-xs text-emerald-900">
                  <span>مجموع حقوق الملكية:</span>
                  <span dir="ltr">{Number(balanceSheetData.total_equity).toLocaleString()} {currency}</span>
                </div>
              </div>

              <div className="pt-3 border-t-2 border-slate-900 flex justify-between font-black text-sm text-slate-900 bg-slate-50 p-2.5 rounded-xl">
                <span>مجموع الخصوم وحقوق الملكية:</span>
                <span dir="ltr">{Number(balanceSheetData.total_liabilities_and_equity).toLocaleString()} {currency}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD ACCOUNT */}
      {showAddAccountModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 text-xs text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-600" />
                إضافة حساب جديد إلى دليل الحسابات
              </h3>
              <button onClick={() => setShowAddAccountModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAccount} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">كود الحساب *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: 1105"
                    value={newAccountForm.code}
                    onChange={(e) => setNewAccountForm({ ...newAccountForm, code: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">نوع الحساب *</label>
                  <select
                    value={newAccountForm.type}
                    onChange={(e) => {
                      const t = e.target.value;
                      setNewAccountForm({
                        ...newAccountForm,
                        type: t,
                        normal_balance: ['asset', 'expense'].includes(t) ? 'debit' : 'credit'
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                  >
                    <option value="asset">أصول (Asset)</option>
                    <option value="liability">خصوم (Liability)</option>
                    <option value="equity">حقوق ملكية (Equity)</option>
                    <option value="revenue">إيراد (Revenue)</option>
                    <option value="expense">مصروف (Expense)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">اسم الحساب *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: حساب بنك مصر جاري / عهدة الفرع"
                  value={newAccountForm.name}
                  onChange={(e) => setNewAccountForm({ ...newAccountForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">الطبيعة المحاسبية</label>
                  <select
                    value={newAccountForm.normal_balance}
                    onChange={(e) => setNewAccountForm({ ...newAccountForm, normal_balance: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                  >
                    <option value="debit">مدين (Debit)</option>
                    <option value="credit">دائن (Credit)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">الرصيد الافتتاحي</label>
                  <input
                    type="number"
                    step="any"
                    value={newAccountForm.opening_balance}
                    onChange={(e) => setNewAccountForm({ ...newAccountForm, opening_balance: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">وصف أو ملاحظات</label>
                <input
                  type="text"
                  placeholder="ملاحظات حول طبيعة واستخدام الحساب..."
                  value={newAccountForm.description}
                  onChange={(e) => setNewAccountForm({ ...newAccountForm, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddAccountModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer"
                >
                  حفظ الحساب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NEW JOURNAL ENTRY */}
      {showNewEntryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 text-xs text-slate-800 flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                إنشاء قيد يومية يدوي متوازن (قيد مزدوج)
              </h3>
              <button onClick={() => setShowNewEntryModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveJournalEntry} className="space-y-4 flex-1 overflow-y-auto pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">تاريخ القيد *</label>
                  <input
                    type="date"
                    required
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">البيان العام للقيد *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: تسوية عهدة / سداد مصروفات استثنائية"
                    value={entryDescription}
                    onChange={(e) => setEntryDescription(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                  />
                </div>
              </div>

              {/* Entry Lines */}
              <div className="space-y-2 border border-slate-200 rounded-2xl p-3 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs">أطراف وسطور القيد:</span>
                  <button
                    type="button"
                    onClick={handleAddEntryLine}
                    className="text-indigo-600 hover:text-indigo-800 font-bold text-[11px] bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-200 cursor-pointer"
                  >
                    + إضافة سطر آخر
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {entryLines.map((line, idx) => (
                    <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-white p-2.5 rounded-xl border border-slate-200">
                      <div className="sm:col-span-5">
                        <select
                          required
                          value={line.account_id}
                          onChange={(e) => handleLineChange(idx, 'account_id', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 font-bold text-[11px]"
                        >
                          <option value="">-- اختر الحساب --</option>
                          {accounts.map((acc) => (
                            <option key={acc.id} value={acc.id}>
                              {acc.code} - {acc.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-3">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          placeholder="مدين (Debit)"
                          value={line.debit || ''}
                          onChange={(e) => handleLineChange(idx, 'debit', e.target.value)}
                          className="w-full bg-slate-50 border border-emerald-300 rounded-lg px-2 py-1.5 font-mono font-bold text-emerald-800 text-left text-xs"
                          dir="ltr"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          placeholder="دائن (Credit)"
                          value={line.credit || ''}
                          onChange={(e) => handleLineChange(idx, 'credit', e.target.value)}
                          className="w-full bg-slate-50 border border-rose-300 rounded-lg px-2 py-1.5 font-mono font-bold text-rose-800 text-left text-xs"
                          dir="ltr"
                        />
                      </div>

                      <div className="sm:col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveEntryLine(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Balance validation bar */}
                <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-mono font-black ${
                  isEntryBalanced ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-rose-50 border-rose-300 text-rose-900'
                }`}>
                  <div>
                    <span>إجمالي المدين: {totalEntryDebit.toLocaleString()} {currency}</span>
                  </div>
                  <div>
                    <span>إجمالي الدائن: {totalEntryCredit.toLocaleString()} {currency}</span>
                  </div>
                  <div>
                    {isEntryBalanced ? '✓ القيد متوازن' : `⚠️ الفارق: ${Math.abs(totalEntryDebit - totalEntryCredit).toLocaleString()} ${currency}`}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNewEntryModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={!isEntryBalanced}
                  className={`px-6 py-2 rounded-xl font-bold text-white shadow-md transition ${
                    isEntryBalanced ? 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer' : 'bg-slate-300 cursor-not-allowed shadow-none'
                  }`}
                >
                  ترحيل وحفظ القيد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PRINTABLE JOURNAL VOUCHER (Requirement 12) */}
      {selectedJournalVoucher && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          {/* Isolated Print Styles */}
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
              #journal-voucher-printable-area,
              #journal-voucher-printable-area * {
                visibility: visible !important;
              }
              #journal-voucher-printable-area {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                box-shadow: none !important;
                border: none !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `}</style>

          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Controls Bar */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-3 no-print">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm">سند قيد محاسبي مزدوج معتمد</h3>
                  <p className="text-[11px] text-slate-500 font-mono">رقم القيد: {selectedJournalVoucher.entry_no}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-98"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة سند القيد (A4)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedJournalVoucher(null)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Content */}
            <div className="p-6 overflow-y-auto" dir="rtl">
              <div id="journal-voucher-printable-area" className="border-2 border-slate-900 rounded-2xl p-6 bg-white space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
                  <div className="flex items-center gap-3">
                    {settings?.logo_url && (
                      <img src={settings.logo_url} alt="Logo" className="h-12 w-auto object-contain" />
                    )}
                    <div>
                      <h2 className="text-base font-black text-slate-900">{storeName}</h2>
                      <p className="text-[11px] text-slate-600">الإدارة المالية - قسم الحسابات العامة وشجرة الحسابات</p>
                    </div>
                  </div>
                  <div className="text-left font-mono text-xs space-y-0.5" dir="ltr">
                    <div className="font-black text-slate-900">JOURNAL VOUCHER</div>
                    <div className="text-slate-800 font-bold">Entry: {selectedJournalVoucher.entry_no}</div>
                    <div className="text-slate-600">Date: {selectedJournalVoucher.entry_date}</div>
                  </div>
                </div>

                {/* Title */}
                <div className="text-center py-1.5 bg-slate-100 rounded-xl border border-slate-300">
                  <span className="font-black text-sm text-slate-900 tracking-wide">
                    سند قيد محاسبي مزدوج (اليومية العامة)
                  </span>
                </div>

                {/* Voucher Meta */}
                <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                  <div className="col-span-2">
                    <span className="text-slate-500 font-bold block text-[11px]">البيان العام للقيد:</span>
                    <span className="font-black text-slate-900 text-xs">{selectedJournalVoucher.description}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block text-[11px]">المرجع المحاسبي:</span>
                    <span className="font-mono font-bold text-slate-800 text-xs">
                      {selectedJournalVoucher.reference_type ? `${selectedJournalVoucher.reference_type} #${selectedJournalVoucher.reference_id}` : 'قيد تسوية يدوي'}
                    </span>
                  </div>
                </div>

                {/* Lines Table */}
                <div className="border border-slate-300 rounded-xl overflow-hidden">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-800 text-white font-bold">
                      <tr>
                        <th className="p-2 text-center w-8">#</th>
                        <th className="p-2 w-24">كود الحساب</th>
                        <th className="p-2 w-48">اسم الحساب</th>
                        <th className="p-2">البيان التحليلي</th>
                        <th className="p-2 w-28 text-left">مدين ({currency})</th>
                        <th className="p-2 w-28 text-left">دائن ({currency})</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {selectedJournalVoucher.lines?.map((line, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                          <td className="p-2 text-center font-bold text-slate-500">{idx + 1}</td>
                          <td className="p-2 font-mono font-bold text-indigo-700" dir="ltr">{line.account_code}</td>
                          <td className="p-2 font-extrabold text-slate-900">{line.account_name}</td>
                          <td className="p-2 text-slate-600 text-[11px]">{line.description || selectedJournalVoucher.description}</td>
                          <td className="p-2 font-mono font-bold text-emerald-700 text-left" dir="ltr">
                            {Number(line.debit) > 0 ? Number(line.debit).toLocaleString() : '—'}
                          </td>
                          <td className="p-2 font-mono font-bold text-rose-700 text-left" dir="ltr">
                            {Number(line.credit) > 0 ? Number(line.credit).toLocaleString() : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-black text-xs">
                      <tr>
                        <td colSpan="4" className="p-2.5 text-slate-900 font-bold text-center">
                          الإجمالي العام للقيد المحاسبي (متوازن ومعتمد)
                        </td>
                        <td className="p-2.5 text-left font-mono text-emerald-800" dir="ltr">
                          {Number(selectedJournalVoucher.total_debit).toLocaleString()} {currency}
                        </td>
                        <td className="p-2.5 text-left font-mono text-rose-800" dir="ltr">
                          {Number(selectedJournalVoucher.total_credit).toLocaleString()} {currency}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t-2 border-slate-900 text-center text-xs">
                  <div className="space-y-8">
                    <span className="font-bold text-slate-700 block">إعداد المحاسب المختص</span>
                    <div className="text-[11px] text-slate-400">............................................</div>
                  </div>
                  <div className="space-y-8">
                    <span className="font-bold text-slate-700 block">مراجعة رئيس الحسابات</span>
                    <div className="text-[11px] text-slate-400">............................................</div>
                  </div>
                  <div className="space-y-8">
                    <span className="font-bold text-slate-700 block">اعتماد المدير المالي والإدارة</span>
                    <div className="text-[11px] text-slate-400">............................................</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PRINTABLE FINANCIAL REPORT (Requirement 12) */}
      {printFinancialReport && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          {/* Isolated Print Styles */}
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
              #financial-report-printable-area,
              #financial-report-printable-area * {
                visibility: visible !important;
              }
              #financial-report-printable-area {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                box-shadow: none !important;
                border: none !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `}</style>

          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Controls Bar */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-3 no-print">
              <div className="flex items-center gap-2.5">
                <Printer className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm">
                    {printFinancialReport === 'trial' ? 'طباعة ميزان المراجعة الرسمي المعمد' :
                     printFinancialReport === 'ledger' ? 'طباعة كشف حساب دفتر الأستاذ العام' :
                     printFinancialReport === 'income' ? 'طباعة قائمة الدخل والأرباح والخسائر' :
                     printFinancialReport === 'balance_sheet' ? 'طباعة الميزانية العمومية والمركز المالي' :
                     printFinancialReport === 'chart' ? 'طباعة دليل وشجرة الحسابات الموحدة' :
                     'طباعة تقرير قيود اليومية العامة'}
                  </h3>
                  <p className="text-[11px] text-slate-500">جاهز للطباعة على ورق قياس A4 بمواصفات معتمدة</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-98"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة فورية (A4)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintFinancialReport(null)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Content */}
            <div className="p-6 overflow-y-auto" dir="rtl">
              <div id="financial-report-printable-area" className="border-2 border-slate-900 rounded-2xl p-6 bg-white space-y-4 text-xs">
                {/* Header */}
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
                  <div className="flex items-center gap-3">
                    {settings?.logo_url && (
                      <img src={settings.logo_url} alt="Logo" className="h-12 w-auto object-contain" />
                    )}
                    <div>
                      <h2 className="text-base font-black text-slate-900">{storeName}</h2>
                      <p className="text-[11px] text-slate-600">الإدارة المالية والحسابات الختامية العامة</p>
                    </div>
                  </div>
                  <div className="text-left font-mono text-xs space-y-0.5" dir="ltr">
                    <div className="font-black text-slate-900">FINANCIAL REPORT</div>
                    <div className="text-slate-600">Date: {new Date().toLocaleDateString('ar-EG', { timeZone: 'Africa/Cairo' })}</div>
                    <div className="text-[11px] text-slate-500">Currency: Egyptian Pound (EGP)</div>
                  </div>
                </div>

                {/* Report Title */}
                <div className="text-center py-2 bg-slate-100 rounded-xl border border-slate-300">
                  <span className="font-black text-sm text-slate-900 tracking-wide block">
                    {printFinancialReport === 'trial' ? 'ميزان المراجعة بالأرصدة والمجاميع المعتمد' :
                     printFinancialReport === 'ledger' ? `كشف حساب دفتر الأستاذ العام: ${ledgerData?.account?.code} - ${ledgerData?.account?.name}` :
                     printFinancialReport === 'income' ? 'قائمة الدخل والأرباح والخسائر عن الفترة المنتهية' :
                     printFinancialReport === 'balance_sheet' ? 'الميزانية العمومية وقائمة المركز المالي' :
                     printFinancialReport === 'chart' ? 'دليل وشجرة الحسابات المالية الموحدة' :
                     'دفتر قيود اليومية العامة المزدوجة'}
                  </span>
                  <span className="text-[11px] text-slate-600 block mt-0.5">
                    تاريخ التقرير: {new Date().toISOString().slice(0, 10)}
                  </span>
                </div>

                {/* 1. Trial Balance Report */}
                {printFinancialReport === 'trial' && trialBalanceData && (
                  <div className="border border-slate-300 rounded-xl overflow-hidden">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-800 text-white font-bold">
                        <tr>
                          <th className="p-2 w-24">كود الحساب</th>
                          <th className="p-2">اسم الحساب</th>
                          <th className="p-2 w-32">نوع الحساب</th>
                          <th className="p-2 w-32 text-left">أرصدة مدينة ({currency})</th>
                          <th className="p-2 w-32 text-left">أرصدة دائنة ({currency})</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {trialBalanceData.rows?.map((row, idx) => (
                          <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                            <td className="p-2 font-mono font-bold text-indigo-700" dir="ltr">{row.code}</td>
                            <td className="p-2 font-bold text-slate-900">{row.name}</td>
                            <td className="p-2 text-slate-600 text-[11px]">{getAccountTypeName(row.type)}</td>
                            <td className="p-2 font-mono font-bold text-emerald-700 text-left" dir="ltr">
                              {Number(row.debit_balance) > 0 ? Number(row.debit_balance).toLocaleString() : '—'}
                            </td>
                            <td className="p-2 font-mono font-bold text-rose-700 text-left" dir="ltr">
                              {Number(row.credit_balance) > 0 ? Number(row.credit_balance).toLocaleString() : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-100 border-t-2 border-slate-400 font-black text-xs">
                        <tr>
                          <td colSpan="3" className="p-2.5 text-center text-slate-900">إجمالي ميزان المراجعة (متوازن)</td>
                          <td className="p-2.5 text-left font-mono text-emerald-800" dir="ltr">
                            {Number(trialBalanceData.total_debit).toLocaleString()} {currency}
                          </td>
                          <td className="p-2.5 text-left font-mono text-rose-800" dir="ltr">
                            {Number(trialBalanceData.total_credit).toLocaleString()} {currency}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}

                {/* 2. Ledger Statement Report */}
                {printFinancialReport === 'ledger' && ledgerData && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                      <div>
                        <span className="text-slate-500 font-bold block">كود واسم الحساب:</span>
                        <span className="font-extrabold text-slate-900">{ledgerData.account?.code} - {ledgerData.account?.name}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-bold block">الطبيعة المحاسبية:</span>
                        <span className="font-bold text-slate-800">{ledgerData.account?.normal_balance === 'debit' ? 'مدين (Debit)' : 'دائن (Credit)'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-bold block">الرصيد الختامي الحالي:</span>
                        <span className="font-mono font-black text-indigo-900" dir="ltr">
                          {Number(ledgerData.account?.current_balance || 0).toLocaleString()} {currency}
                        </span>
                      </div>
                    </div>

                    <div className="border border-slate-300 rounded-xl overflow-hidden">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-slate-800 text-white font-bold">
                          <tr>
                            <th className="p-2 w-24">التاريخ</th>
                            <th className="p-2 w-28">رقم القيد</th>
                            <th className="p-2">البيان والتفصيل</th>
                            <th className="p-2 w-24 text-left">مدين</th>
                            <th className="p-2 w-24 text-left">دائن</th>
                            <th className="p-2 w-28 text-left">الرصيد المتراكم</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {ledgerData.lines?.map((line, idx) => (
                            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                              <td className="p-2 font-mono text-[11px]" dir="ltr">{line.entry_date}</td>
                              <td className="p-2 font-mono font-bold text-indigo-700" dir="ltr">{line.entry_no}</td>
                              <td className="p-2 text-slate-800">{line.description}</td>
                              <td className="p-2 font-mono font-bold text-emerald-700 text-left" dir="ltr">
                                {Number(line.debit) > 0 ? Number(line.debit).toLocaleString() : '—'}
                              </td>
                              <td className="p-2 font-mono font-bold text-rose-700 text-left" dir="ltr">
                                {Number(line.credit) > 0 ? Number(line.credit).toLocaleString() : '—'}
                              </td>
                              <td className="p-2 font-mono font-black text-slate-900 text-left" dir="ltr">
                                {Number(line.running_balance).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 3. Income Statement Report */}
                {printFinancialReport === 'income' && incomeStatementData && (
                  <div className="space-y-4">
                    <div className="border border-emerald-300 rounded-xl p-3 bg-emerald-50/30 space-y-2">
                      <div className="font-black text-emerald-950 pb-1 border-b border-emerald-200">1. الإيرادات التشغيلية (Revenues)</div>
                      <div className="space-y-1">
                        {incomeStatementData.revenues?.map((r, i) => (
                          <div key={i} className="flex justify-between py-1 border-b border-slate-100">
                            <span className="font-bold text-slate-700">{r.code} - {r.name}</span>
                            <span className="font-mono font-bold text-emerald-700" dir="ltr">{Number(r.amount).toLocaleString()} {currency}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between pt-1 font-black text-emerald-900 text-sm">
                        <span>إجمالي الإيرادات:</span>
                        <span dir="ltr">{Number(incomeStatementData.total_revenue).toLocaleString()} {currency}</span>
                      </div>
                    </div>

                    <div className="border border-rose-300 rounded-xl p-3 bg-rose-50/30 space-y-2">
                      <div className="font-black text-rose-950 pb-1 border-b border-rose-200">2. المصروفات التشغيلية والعمومية (Expenses)</div>
                      <div className="space-y-1">
                        {incomeStatementData.expenses?.map((e, i) => (
                          <div key={i} className="flex justify-between py-1 border-b border-slate-100">
                            <span className="font-bold text-slate-700">{e.code} - {e.name}</span>
                            <span className="font-mono font-bold text-rose-700" dir="ltr">{Number(e.amount).toLocaleString()} {currency}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between pt-1 font-black text-rose-900 text-sm">
                        <span>إجمالي المصروفات:</span>
                        <span dir="ltr">{Number(incomeStatementData.total_expense).toLocaleString()} {currency}</span>
                      </div>
                    </div>

                    <div className="bg-slate-900 text-white p-3.5 rounded-xl flex items-center justify-between text-sm font-black">
                      <span>صافي الأرباح المحاسبية المعتمدة للفترة:</span>
                      <span className="font-mono text-emerald-400 text-base" dir="ltr">
                        {Number(incomeStatementData.net_income).toLocaleString()} {currency}
                      </span>
                    </div>
                  </div>
                )}

                {/* 4. Balance Sheet Report */}
                {printFinancialReport === 'balance_sheet' && balanceSheetData && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Assets */}
                      <div className="border border-indigo-200 rounded-xl p-3 bg-indigo-50/20 space-y-2">
                        <div className="font-black text-indigo-950 pb-1 border-b border-indigo-200">الأصول (Assets)</div>
                        <div className="space-y-1">
                          {balanceSheetData.assets?.map((a, i) => (
                            <div key={i} className="flex justify-between py-1 border-b border-slate-100">
                              <span className="font-bold text-slate-700">{a.code} - {a.name}</span>
                              <span className="font-mono font-bold text-slate-900" dir="ltr">{Number(a.amount).toLocaleString()} {currency}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between pt-2 border-t border-indigo-300 font-black text-indigo-900 text-sm">
                          <span>مجموع الأصول:</span>
                          <span dir="ltr">{Number(balanceSheetData.total_assets).toLocaleString()} {currency}</span>
                        </div>
                      </div>

                      {/* Liabilities & Equity */}
                      <div className="border border-slate-300 rounded-xl p-3 bg-slate-50/40 space-y-3">
                        <div>
                          <div className="font-black text-rose-950 pb-1 border-b border-rose-200">الخصوم (Liabilities)</div>
                          <div className="space-y-1 mt-1">
                            {balanceSheetData.liabilities?.map((l, i) => (
                              <div key={i} className="flex justify-between py-0.5 border-b border-slate-100">
                                <span className="font-bold text-slate-700">{l.code} - {l.name}</span>
                                <span className="font-mono font-bold text-slate-900" dir="ltr">{Number(l.amount).toLocaleString()} {currency}</span>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-between pt-1 font-bold text-rose-900">
                            <span>مجموع الخصوم:</span>
                            <span dir="ltr">{Number(balanceSheetData.total_liabilities).toLocaleString()} {currency}</span>
                          </div>
                        </div>

                        <div>
                          <div className="font-black text-emerald-950 pb-1 border-b border-emerald-200">حقوق الملكية (Equity)</div>
                          <div className="space-y-1 mt-1">
                            {balanceSheetData.equity?.map((e, i) => (
                              <div key={i} className="flex justify-between py-0.5 border-b border-slate-100">
                                <span className="font-bold text-slate-700">{e.code} - {e.name}</span>
                                <span className="font-mono font-bold text-slate-900" dir="ltr">{Number(e.amount).toLocaleString()} {currency}</span>
                              </div>
                            ))}
                            <div className="flex justify-between py-0.5 border-b border-slate-100 font-bold text-indigo-700">
                              <span>أرباح الفترة:</span>
                              <span className="font-mono" dir="ltr">{Number(balanceSheetData.current_year_earnings || 0).toLocaleString()} {currency}</span>
                            </div>
                          </div>
                          <div className="flex justify-between pt-1 font-bold text-emerald-900">
                            <span>مجموع حقوق الملكية:</span>
                            <span dir="ltr">{Number(balanceSheetData.total_equity).toLocaleString()} {currency}</span>
                          </div>
                        </div>

                        <div className="flex justify-between pt-2 border-t-2 border-slate-900 font-black text-slate-900 text-sm">
                          <span>مجموع الخصوم وحقوق الملكية:</span>
                          <span dir="ltr">{Number(balanceSheetData.total_liabilities_and_equity).toLocaleString()} {currency}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. Chart of Accounts Report */}
                {printFinancialReport === 'chart' && (
                  <div className="border border-slate-300 rounded-xl overflow-hidden">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-800 text-white font-bold">
                        <tr>
                          <th className="p-2 w-24">كود الحساب</th>
                          <th className="p-2">اسم الحساب</th>
                          <th className="p-2 w-32">نوع الحساب</th>
                          <th className="p-2 w-32">الطبيعة</th>
                          <th className="p-2 w-36 text-left">الرصيد الحالي ({currency})</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {accounts.map((acc, idx) => (
                          <tr key={acc.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                            <td className="p-2 font-mono font-bold text-indigo-700" dir="ltr">{acc.code}</td>
                            <td className="p-2 font-bold text-slate-900">{acc.name}</td>
                            <td className="p-2 text-slate-600 text-[11px]">{getAccountTypeName(acc.type)}</td>
                            <td className="p-2 text-slate-600">{acc.normal_balance === 'debit' ? 'مدين' : 'دائن'}</td>
                            <td className="p-2 font-mono font-bold text-slate-900 text-left" dir="ltr">
                              {Number(acc.current_balance || 0).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Signatures */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t-2 border-slate-900 text-center text-xs">
                  <div className="space-y-8">
                    <span className="font-bold text-slate-700 block">إعداد المحاسب القانوني</span>
                    <div className="text-[11px] text-slate-400">............................................</div>
                  </div>
                  <div className="space-y-8">
                    <span className="font-bold text-slate-700 block">مراجعة رئيس الحسابات</span>
                    <div className="text-[11px] text-slate-400">............................................</div>
                  </div>
                  <div className="space-y-8">
                    <span className="font-bold text-slate-700 block">اعتماد المدير العام والختم الرسمي</span>
                    <div className="text-[11px] text-slate-400">............................................</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
