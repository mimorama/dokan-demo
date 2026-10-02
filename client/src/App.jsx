import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import InvoicePrint from './components/InvoicePrint';
import ContractPrint from './components/ContractPrint';
import ReceiptPrint from './components/ReceiptPrint';
import CalculatorModal from './components/CalculatorModal';
import LoginModal from './components/LoginModal';
import LoginScreen from './components/LoginScreen';
import UsersModal from './components/UsersModal';
import ShiftModal from './components/ShiftModal';
import ZReportPrint from './components/ZReportPrint';
import ReturnModal from './components/ReturnModal';
import TransferPrint from './components/TransferPrint';

// Pages
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Purchases from './pages/Purchases';
import Products from './pages/Products';
import Serials from './pages/Serials';
import Installments from './pages/Installments';
import Customers from './pages/Customers';
import Branches from './pages/Branches';
import Cashbox from './pages/Cashbox';
import Suppliers from './pages/Suppliers';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Users from './pages/Users';
import Sales from './pages/Sales';
import DailyReconciliation from './pages/DailyReconciliation';
import Accounting from './pages/Accounting';

import { api } from './api';

export default function App() {
  // STRICT: No automatic login fallback! Must be explicitly authenticated.
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = sessionStorage.getItem('dokan_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [settings, setSettings] = useState(null);
  const [cashBalance, setCashBalance] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);

  // Cashier Shift State
  const [currentShift, setCurrentShift] = useState(null);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [printableZReport, setPrintableZReport] = useState(null);

  // Sales Returns & RMA State
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [selectedSaleForReturn, setSelectedSaleForReturn] = useState(null);

  // Other Modals
  const [printableSale, setPrintableSale] = useState(null);
  const [printableContract, setPrintableContract] = useState(null);
  const [printableReceipt, setPrintableReceipt] = useState(null);
  const [printableTransfer, setPrintableTransfer] = useState(null);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);

  // Load store settings always (for branding on login screen as well)
  useEffect(() => {
    api.getSettings().then(s => setSettings(s)).catch(() => {});
  }, []);

  // Load global data only when user is authenticated
  useEffect(() => {
    if (currentUser) {
      loadGlobalData();
    }
  }, [activeTab, currentUser]);

  // Role permissions check on tab switch or login
  useEffect(() => {
    if (!currentUser) return;

    const rolePermissions = {
      admin: ['dashboard', 'pos', 'sales', 'reconciliation', 'accounting', 'purchases', 'products', 'branches', 'serials', 'installments', 'customers', 'cashbox', 'suppliers', 'reports', 'users', 'settings'],
      manager: ['dashboard', 'pos', 'sales', 'reconciliation', 'accounting', 'purchases', 'products', 'branches', 'serials', 'installments', 'customers', 'cashbox', 'suppliers', 'reports', 'users'],
      cashier: ['pos', 'sales', 'reconciliation', 'customers', 'serials', 'installments'],
      storekeeper: ['products', 'branches', 'purchases', 'serials', 'suppliers'],
      accountant: ['dashboard', 'sales', 'reconciliation', 'accounting', 'purchases', 'cashbox', 'customers', 'suppliers', 'reports']
    };
    const allowed = rolePermissions[currentUser.role] || rolePermissions.admin;
    if (!allowed.includes(activeTab)) {
      setActiveTab(allowed[0] || 'pos');
    }
  }, [currentUser]);

  const loadGlobalData = async () => {
    try {
      const [sett, cash, due, shift] = await Promise.all([
        api.getSettings(),
        api.getCashbox().catch(() => ({ balance: 0 })),
        api.getDueInstallments(true).catch(() => []),
        api.getCurrentShift(currentUser?.id || 1).catch(() => null)
      ]);
      setSettings(sett);
      setCashBalance(cash.balance);
      setOverdueCount(due.length);
      setCurrentShift(shift?.hasOpenShift ? shift.shift : null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('dokan_user');
    localStorage.removeItem('dokan_user');
    setCurrentUser(null);
    setCurrentShift(null);
  };

  const handleSaleCompleted = (fullSale) => {
    setPrintableSale(fullSale);
    if (fullSale.sale_type === 'installment') {
      setActiveTab('installments');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleViewSale = async (saleId) => {
    try {
      const sale = await api.getSale(saleId);
      setPrintableSale(sale);
    } catch (err) {
      alert('خطأ أثناء جلب الفاتورة');
    }
  };

  const handleViewTransferById = async (transferId) => {
    try {
      const transfer = await api.getStockTransfer(transferId);
      if (transfer) {
        setPrintableTransfer(transfer);
      }
    } catch (err) {
      console.error('Failed to view transfer:', err);
      setActiveTab('branches');
    }
  };

  const handleReturnSale = (sale) => {
    setSelectedSaleForReturn(sale);
    setIsReturnModalOpen(true);
  };

  // If NOT logged in: strictly block access and display full-page LoginScreen
  if (!currentUser) {
    return (
      <LoginScreen
        settings={settings}
        onLoginSuccess={(user) => {
          sessionStorage.setItem('dokan_user', JSON.stringify(user));
          setCurrentUser(user);
        }}
      />
    );
  }

  const titles = {
    dashboard: 'لوحة التحكم الرئيسية',
    pos: 'نقطة البيع - إصدار فاتورة جديدة',
    purchases: 'المشتريات والتوريدات ومراجعة الفواتير',
    products: 'الأجهزة والمخزون',
    branches: 'الفروع والمستودعات والمخازن التابعة',
    serials: 'تتبع السيريال والضمان وخدمة ما بعد البيع',
    installments: 'إدارة عقود البيع بالتقسيط والأقساط الشهرية',
    customers: 'سجل العملاء والضامنين والتصنيف الائتماني',
    cashbox: 'الخزينة والمصروفات وحركة النقدية',
    suppliers: 'سجل الموردين والشركات الموزعة',
    reports: 'التقارير المالية والأرباح والمبيعات الرسمية',
    users: 'إدارة المستخدمين وصلاحيات الموظفين',
    settings: 'إعدادات المعرض والرقابة والنسخ الاحتياطي'
  };

  const storeName = settings?.store_name || 'معرض دكان عبد العزيز للأجهزة الكهربائية';

  return (
    <div className="flex min-h-screen bg-slate-50 font-['Cairo',sans-serif] text-slate-900" dir="rtl">
      {/* Sidebar */}
      <div className="print:hidden">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          overdueCount={overdueCount}
          storeName={storeName}
          tagline={settings?.tagline}
          logoUrl={settings?.logo_url}
          logoIconUrl="/logo_icon.png"
          currentUser={currentUser}
          onSwitchUser={() => setIsLoginModalOpen(true)}
          onLogout={handleLogout}
          onOpenCalculator={() => setIsCalculatorOpen(true)}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 print:hidden">
        <Header
          title={titles[activeTab] || storeName}
          onNewSale={() => setActiveTab('pos')}
          cashBalance={cashBalance}
          currency={settings?.currency || 'ج.م'}
          currentUser={currentUser}
          currentShift={currentShift}
          onOpenShiftModal={() => setIsShiftModalOpen(true)}
          onSwitchUser={() => setIsLoginModalOpen(true)}
          onLogout={handleLogout}
          onOpenUsersManagement={() => setActiveTab('users')}
          onNavigateTab={(tab) => setActiveTab(tab)}
          onViewTransfer={handleViewTransferById}
        />

        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <Dashboard
              onNewSale={() => setActiveTab('pos')}
              onPayInstallment={() => setActiveTab('installments')}
              onViewSale={handleViewSale}
              onReturnSale={handleReturnSale}
              settings={settings}
            />
          )}

          {activeTab === 'pos' && (
            <POS
              onSaleCompleted={handleSaleCompleted}
              settings={settings}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'sales' && (
            <Sales
              settings={settings}
              currentUser={currentUser}
              onViewInvoice={(sale) => setPrintableSale(sale)}
              onInitiateReturn={(sale) => {
                setSelectedSaleForReturn(sale);
                setIsReturnModalOpen(true);
              }}
            />
          )}

          {activeTab === 'reconciliation' && (
            <DailyReconciliation
              settings={settings}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'purchases' && (
            <Purchases
              settings={settings}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'products' && (
            <Products
              settings={settings}
            />
          )}

          {activeTab === 'branches' && (
            <Branches
              settings={settings}
              currentUser={currentUser}
              onPrintTransfer={(transfer) => setPrintableTransfer(transfer)}
            />
          )}

          {activeTab === 'serials' && (
            <Serials
              settings={settings}
            />
          )}

          {activeTab === 'installments' && (
            <Installments
              onPrintContract={(plan) => setPrintableContract(plan)}
              onPrintReceipt={(receipt) => setPrintableReceipt(receipt)}
              settings={settings}
            />
          )}

          {activeTab === 'customers' && (
            <Customers
              settings={settings}
            />
          )}

          {activeTab === 'cashbox' && (
            <Cashbox
              settings={settings}
            />
          )}

          {activeTab === 'suppliers' && (
            <Suppliers
              settings={settings}
            />
          )}

          {activeTab === 'reports' && (
            <Reports
              settings={settings}
            />
          )}

          {activeTab === 'accounting' && (
            <Accounting
              currentUser={currentUser}
              settings={settings}
            />
          )}

          {activeTab === 'users' && (
            <Users
              currentUser={currentUser}
              settings={settings}
            />
          )}

          {activeTab === 'settings' && (
            <Settings
              onSettingsUpdated={(newSettings) => setSettings(newSettings)}
            />
          )}
        </main>
      </div>

      {/* Cashier Shift Modal */}
      <ShiftModal
        isOpen={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
        currentUser={currentUser}
        settings={settings}
        onShiftClosed={(report) => {
          setCurrentShift(null);
          setPrintableZReport(report);
          loadGlobalData();
        }}
        onShiftOpened={(shift) => {
          setCurrentShift(shift);
          loadGlobalData();
        }}
      />

      {/* Printable Z-Report Slip */}
      {printableZReport && (
        <ZReportPrint
          reportData={printableZReport}
          settings={settings}
          onClose={() => setPrintableZReport(null)}
        />
      )}

      {/* Sales Return / Refund Modal */}
      <ReturnModal
        isOpen={isReturnModalOpen}
        onClose={() => {
          setIsReturnModalOpen(false);
          setSelectedSaleForReturn(null);
        }}
        initialSale={selectedSaleForReturn}
        currentUser={currentUser}
        settings={settings}
        onReturnSuccess={() => loadGlobalData()}
      />

      {/* Calculator Modal */}
      <CalculatorModal
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
        settings={settings}
      />

      {/* Switch User Modal (when already logged in) */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        currentLoggedInUser={currentUser}
        onLoginSuccess={(user) => {
          sessionStorage.setItem('dokan_user', JSON.stringify(user));
          setCurrentUser(user);
          setIsLoginModalOpen(false);
        }}
      />

      {/* Users & Permissions Management Modal (Admin Only) */}
      <UsersModal
        isOpen={isUsersModalOpen}
        onClose={() => setIsUsersModalOpen(false)}
        currentUser={currentUser}
      />

      {/* Modals for Printing */}
      {printableSale && (
        <InvoicePrint
          sale={printableSale}
          settings={settings}
          onClose={() => setPrintableSale(null)}
        />
      )}

      {printableContract && (
        <ContractPrint
          plan={printableContract}
          settings={settings}
          onClose={() => setPrintableContract(null)}
        />
      )}

      {printableReceipt && (
        <ReceiptPrint
          receiptData={printableReceipt}
          settings={settings}
          onClose={() => setPrintableReceipt(null)}
        />
      )}

      {/* Printable Warehouse Stock Transfer Order */}
      {printableTransfer && (
        <TransferPrint
          transfer={printableTransfer}
          settings={settings}
          onClose={() => setPrintableTransfer(null)}
        />
      )}
    </div>
  );
}
