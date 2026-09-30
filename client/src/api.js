const API_BASE = '/api';

export async function fetchApi(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;

  // Attach authenticated staff identity to requests for audit logs
  let authHeaders = {};
  try {
    const rawUser = sessionStorage.getItem('dokan_user') || localStorage.getItem('dokan_user');
    if (rawUser) {
      const u = JSON.parse(rawUser);
      if (u) {
        if (u.id) authHeaders['x-user-id'] = String(u.id);
        if (u.name || u.username) authHeaders['x-user-name'] = encodeURIComponent(u.name || u.username);
        if (u.role) authHeaders['x-user-role'] = u.role;
      }
    }
  } catch (e) {}

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `خطأ في الخادم: ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Dashboard
  getDashboard: () => fetchApi('/dashboard'),

  // Settings
  getSettings: () => fetchApi('/settings'),
  updateSettings: (data) => fetchApi('/settings', { method: 'POST', body: JSON.stringify(data) }),

  // Categories & Brands
  getCategories: () => fetchApi('/categories'),
  createCategory: (data) => fetchApi('/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id, data) => fetchApi(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCategory: (id) => fetchApi(`/categories/${id}`, { method: 'DELETE' }),
  getBrands: () => fetchApi('/brands'),
  createBrand: (data) => fetchApi('/brands', { method: 'POST', body: JSON.stringify(data) }),

  // Products
  getProducts: (params = '') => fetchApi(`/products${params ? '?' + params : ''}`),
  getProduct: (id) => fetchApi(`/products/${id}`),
  createProduct: (data) => fetchApi('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id, data) => fetchApi(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id) => fetchApi(`/products/${id}`, { method: 'DELETE' }),
  getAvailableSerials: (productId) => fetchApi(`/products/${productId}/available-serials`),
  bulkImportProducts: (products) => fetchApi('/products/bulk', { method: 'POST', body: JSON.stringify(products) }),

  // Serials & Warranty
  getSerials: (params = '') => fetchApi(`/serials${params ? '?' + params : ''}`),
  addSerialsBatch: (data) => fetchApi('/serials/batch', { method: 'POST', body: JSON.stringify(data) }),
  updateSerial: (id, data) => fetchApi(`/serials/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Sales & POS
  createSale: (data) => fetchApi('/sales', { method: 'POST', body: JSON.stringify(data) }),
  getSales: (params = '') => fetchApi(`/sales${params ? '?' + params : ''}`),
  getSale: (id) => fetchApi(`/sales/${id}`),

  // Installments
  getInstallments: (params = '') => fetchApi(`/installments${params ? '?' + params : ''}`),
  getInstallmentPlan: (id) => fetchApi(`/installments/${id}`),
  payInstallment: (paymentId, data) => fetchApi(`/installments/pay/${paymentId}`, { method: 'POST', body: JSON.stringify(data) }),
  getDueInstallments: (overdueOnly = false) => fetchApi(`/installments-due?overdue_only=${overdueOnly}`),

  // Customers
  getCustomers: (params = '') => fetchApi(`/customers${params ? '?' + params : ''}`),
  getCustomer: (id) => fetchApi(`/customers/${id}`),
  lookupCustomers: (q) => fetchApi(`/customers/lookup?q=${encodeURIComponent(q)}`),
  createCustomer: (data) => fetchApi('/customers', { method: 'POST', body: JSON.stringify(data) }),
  updateCustomer: (id, data) => fetchApi(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCustomer: (id) => fetchApi(`/customers/${id}`, { method: 'DELETE' }),

  // Branches & Warehouses
  getBranches: () => fetchApi('/branches'),
  createBranch: (data) => fetchApi('/branches', { method: 'POST', body: JSON.stringify(data) }),
  updateBranch: (id, data) => fetchApi(`/branches/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getWarehouses: () => fetchApi('/warehouses'),
  createWarehouse: (data) => fetchApi('/warehouses', { method: 'POST', body: JSON.stringify(data) }),
  updateWarehouse: (id, data) => fetchApi(`/warehouses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getWarehouseSerials: (warehouseId) => fetchApi(`/warehouses/${warehouseId}/serials`),
  getStockTransfers: () => fetchApi('/transfers/stock'),
  transferStock: (data) => fetchApi('/transfers/stock', { method: 'POST', body: JSON.stringify(data) }),

  // Suppliers
  getSuppliers: () => fetchApi('/suppliers'),
  createSupplier: (data) => fetchApi('/suppliers', { method: 'POST', body: JSON.stringify(data) }),
  updateSupplier: (id, data) => fetchApi(`/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSupplier: (id) => fetchApi(`/suppliers/${id}`, { method: 'DELETE' }),
  bulkImportSuppliers: (suppliers) => fetchApi('/suppliers/bulk', { method: 'POST', body: JSON.stringify(suppliers) }),

  // Cashbox & Expenses
  getCashbox: () => fetchApi('/cashbox'),
  addCashTransaction: (data) => fetchApi('/cashbox/transaction', { method: 'POST', body: JSON.stringify(data) }),
  getExpenses: (params = '') => fetchApi(`/expenses${params ? '?' + params : ''}`),
  createExpense: (data) => fetchApi('/expenses', { method: 'POST', body: JSON.stringify(data) }),

  // Reports
  getReports: (period = 'month') => fetchApi(`/reports?period=${period}`),
  getAdvancedReport: ({ reportType, startDate, endDate }) => 
    fetchApi(`/reports/advanced?reportType=${reportType || 'sales'}&startDate=${startDate || ''}&endDate=${endDate || ''}`),

  // Purchases
  getPurchases: (params = '') => fetchApi(`/purchases${params ? '?' + params : ''}`),
  getPurchase: (id) => fetchApi(`/purchases/${id}`),
  createPurchase: (data) => fetchApi('/purchases', { method: 'POST', body: JSON.stringify(data) }),

  // Auditing
  auditSale: (id, data) => fetchApi(`/sales/${id}/audit`, { method: 'PUT', body: JSON.stringify(data) }),
  auditPurchase: (id, data) => fetchApi(`/purchases/${id}/audit`, { method: 'PUT', body: JSON.stringify(data) }),

  // Authentication & Users
  login: (username, password) => fetchApi('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  getUsers: () => fetchApi('/users'),
  createUser: (data) => fetchApi('/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id, data) => fetchApi(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  toggleUserStatus: (id, status) => fetchApi(`/users/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  deleteUser: (id) => fetchApi(`/users/${id}`, { method: 'DELETE' }),

  // Stock Shortage Requests & Matrix
  getStockRequests: () => fetchApi('/stock-requests'),
  createStockRequest: (data) => fetchApi('/stock-requests', { method: 'POST', body: JSON.stringify(data) }),
  updateStockRequestStatus: (id, status, notes) => fetchApi(`/stock-requests/${id}/status`, { method: 'PUT', body: JSON.stringify({ status, notes }) }),
  getInventoryMatrix: () => fetchApi('/inventory/matrix'),

  // Bank Accounts & Transfers
  getAccounts: () => fetchApi('/accounts'),
  createAccount: (data) => fetchApi('/accounts', { method: 'POST', body: JSON.stringify(data) }),
  updateAccount: (id, data) => fetchApi(`/accounts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAccount: (id) => fetchApi(`/accounts/${id}`, { method: 'DELETE' }),
  transferFunds: (data) => fetchApi('/transfers', { method: 'POST', body: JSON.stringify(data) }),
  getTransfers: () => fetchApi('/transfers'),

  // Finance Companies & Multi-duration Plans
  getFinanceCompanies: () => fetchApi('/finance-companies'),
  createFinanceCompany: (data) => fetchApi('/finance-companies', { method: 'POST', body: JSON.stringify(data) }),
  updateFinanceCompany: (id, data) => fetchApi(`/finance-companies/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteFinanceCompany: (id) => fetchApi(`/finance-companies/${id}`, { method: 'DELETE' }),
  createFinancePlan: (companyId, data) => fetchApi(`/finance-companies/${companyId}/plans`, { method: 'POST', body: JSON.stringify(data) }),
  updateFinancePlan: (planId, data) => fetchApi(`/finance-companies/plans/${planId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteFinancePlan: (planId) => fetchApi(`/finance-companies/plans/${planId}`, { method: 'DELETE' }),

  // Stock Transfers Management
  updateStockTransfer: (id, data) => fetchApi(`/transfers/stock/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteStockTransfer: (id, data) => fetchApi(`/transfers/stock/${id}`, { method: 'DELETE', body: JSON.stringify(data) }),

  // Daily Payment Reconciliation
  getDailyReconciliation: (params = '') => fetchApi(`/reconciliation/daily${params ? '?' + params : ''}`),

  // Barcode Scanner Fast Lookup
  lookupBarcode: (code) => fetchApi(`/barcode/lookup?code=${encodeURIComponent(code)}`),

  // Cashier Shifts & Z-Report
  getCurrentShift: (userId) => fetchApi(`/shifts/current?user_id=${userId || 1}`),
  openShift: (data) => fetchApi('/shifts/open', { method: 'POST', body: JSON.stringify(data) }),
  closeShift: (data) => fetchApi('/shifts/close', { method: 'POST', body: JSON.stringify(data) }),
  getShiftHistory: () => fetchApi('/shifts/history'),

  // Activity Audit Logs
  getActivityLogs: (params = '') => fetchApi(`/activity-logs${params ? '?' + params : ''}`),

  // Sales Returns & Refunds
  returnSale: (id, data) => fetchApi(`/sales/${id}/return`, { method: 'POST', body: JSON.stringify(data) }),
  getReturns: () => fetchApi('/returns'),

  // Physical Inventory Cycle Counting
  createInventoryAudit: (data) => fetchApi('/inventory/audit', { method: 'POST', body: JSON.stringify(data) }),
  getInventoryAudits: () => fetchApi('/inventory/audits'),
  getInventoryAudit: (id) => fetchApi(`/inventory/audits/${id}`),

  // Customer Credit Score & Blacklist
  updateCustomerCredit: (id, data) => fetchApi(`/customers/${id}/credit-status`, { method: 'PUT', body: JSON.stringify(data) }),

  // Installment Rescheduling
  rescheduleInstallment: (id, data) => fetchApi(`/installments/${id}/reschedule`, { method: 'POST', body: JSON.stringify(data) }),

  // Smart Backups
  createBackup: () => fetchApi('/backup/create', { method: 'POST' }),
  getBackups: () => fetchApi('/backup/list'),

  // Outlet & Dead Stock
  getDeadStock: () => fetchApi('/inventory/dead-stock'),
  getOutletProducts: () => fetchApi('/products/outlet')
};


