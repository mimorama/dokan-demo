import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Plus, 
  Trash2, 
  ShoppingCart, 
  ShieldCheck, 
  Barcode, 
  User, 
  FileText, 
  CheckCircle, 
  CheckCircle2, 
  Calculator, 
  ArrowRight, 
  Tv, 
  Building2, 
  CreditCard, 
  Zap, 
  Check, 
  AlertCircle, 
  Phone, 
  MapPin, 
  UserPlus, 
  Lock, 
  ShieldAlert, 
  KeyRound,
  Camera,
  Image as ImageIcon,
  Eye,
  Clock,
  Printer,
  Edit,
  Landmark,
  Smartphone,
  DollarSign,
  Wallet,
  RefreshCw,
  X
} from 'lucide-react';
import { api } from '../api';
import ContractPrint from '../components/ContractPrint';

export default function POS({ onSaleCompleted, settings, currentUser }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Branches & Warehouses
  const [branches, setBranches] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');

  // Barcode Scanner State
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scanStatus, setScanStatus] = useState(null); // { type: 'success' | 'error', message: '' }
  const barcodeInputRef = useRef(null);

  // Cart: Array of items { product, serial_id, serial_number, unit_price, availableSerials: [] }
  const [cart, setCart] = useState([]);
  const [saleType, setSaleType] = useState('cash'); // 'cash', 'bank', 'finance_company', 'installment'
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash', 'visa', 'instapay', 'wallet'
  const [discount, setDiscount] = useState(0);

  // Customer Credit / Balance Usage (المرتجعات السابقة)
  const [useCustomerCredit, setUseCustomerCredit] = useState(false);
  const [paidFromCredit, setPaidFromCredit] = useState(0);

  // Quick Customer Edit Modal
  const [showCustomerEditModal, setShowCustomerEditModal] = useState(false);
  const [customerEditData, setCustomerEditData] = useState({
    name: '',
    phone: '',
    phone2: '',
    national_id: '',
    address: '',
    workplace: '',
    notes: '',
    guarantor_name: '',
    guarantor_phone: '',
    guarantor_national_id: '',
    guarantor_relation: 'أخ'
  });
  const [savingCustomerEdit, setSavingCustomerEdit] = useState(false);

  // Direct Installment Contract Approval Gate (طباعة العقد + الموافقة الإلزامية)
  const [showContractApprovalModal, setShowContractApprovalModal] = useState(false);
  const [contractPrinted, setContractPrinted] = useState(false);
  const [showDraftPrintModal, setShowDraftPrintModal] = useState(false);

  // Customer Form & Mobile Lookup
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [selectedCustomerObj, setSelectedCustomerObj] = useState(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinReason, setPinReason] = useState('');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [customerSearchResults, setCustomerSearchResults] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [customerMode, setCustomerMode] = useState('search'); // 'search' or 'new'
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerPhone2, setCustomerPhone2] = useState('');
  const [customerNationalId, setCustomerNationalId] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [idCardImage, setIdCardImage] = useState(null);

  // Consumer Finance (فاليو، كونتاكت، أمان، تقسيط فيزا بنوك)
  const [financeCompanies, setFinanceCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [approvalCode, setApprovalCode] = useState('');
  const [cashDownPayment, setCashDownPayment] = useState(0);

  // Direct Store Installment Details (عقود وإيصالات أمانة)
  const [downPayment, setDownPayment] = useState(0);
  const [installmentsCount, setInstallmentsCount] = useState(12);
  const [profitRate, setProfitRate] = useState(20);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [guarantorName, setGuarantorName] = useState('');
  const [guarantorPhone, setGuarantorPhone] = useState('');
  const [guarantorNationalId, setGuarantorNationalId] = useState('');
  const [guarantorRelation, setGuarantorRelation] = useState('أخ');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const currency = settings?.currency || 'ج.م';

  useEffect(() => {
    loadBranchesAndWarehouses();
  }, []);

  const loadBranchesAndWarehouses = async () => {
    try {
      const [bData, wData] = await Promise.all([
        api.getBranches().catch(() => []),
        api.getWarehouses().catch(() => [])
      ]);
      setBranches(bData);
      setWarehouses(wData);
      if (bData.length > 0) setSelectedBranchId(bData[0].id);
      if (wData.length > 0) setSelectedWarehouseId(wData[0].id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCustomerSearchChange = async (val) => {
    setCustomerSearchQuery(val);
    if (!val || val.trim().length === 0) {
      setCustomerSearchResults([]);
      setShowCustomerDropdown(false);
      return;
    }
    try {
      const results = await api.lookupCustomers(val.trim());
      setCustomerSearchResults(results);
      setShowCustomerDropdown(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectCustomer = (cust) => {
    setSelectedCustomerId(cust.id);
    setSelectedCustomerObj(cust);
    setCustomerName(cust.name);
    setCustomerPhone(cust.phone);
    setCustomerPhone2(cust.phone2 || '');
    setCustomerNationalId(cust.national_id || '');
    setCustomerAddress(cust.address || '');
    setIdCardImage(cust.id_card_image || null);
    if (cust.guarantor_name) {
      setGuarantorName(cust.guarantor_name);
      setGuarantorPhone(cust.guarantor_phone || '');
      setGuarantorRelation(cust.guarantor_relation || 'أخ');
    }
    setShowCustomerDropdown(false);
    setCustomerSearchQuery('');
  };

  const handleClearCustomer = () => {
    setSelectedCustomerId(null);
    setSelectedCustomerObj(null);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerPhone2('');
    setCustomerNationalId('');
    setCustomerAddress('');
    setIdCardImage(null);
    setGuarantorName('');
    setGuarantorPhone('');
    setCustomerSearchQuery('');
    setCustomerSearchResults([]);
  };

  const handleIdCardUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('يرجى اختيار صورة صحيحة للبطاقة أو جواز السفر');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('حجم الصورة كبير جداً، الحد الأقصى 5 ميجابايت');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setIdCardImage(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    loadProductsAndCategories();
    loadFinanceCompanies();
  }, [selectedCategory, search]);

  const loadFinanceCompanies = async () => {
    try {
      const companies = await api.getFinanceCompanies();
      setFinanceCompanies(companies);
      if (companies.length > 0) {
        if (!selectedCompanyId) {
          setSelectedCompanyId(companies[0].id);
          if (companies[0].plans && companies[0].plans.length > 0) {
            setSelectedPlanId(companies[0].plans[0].id);
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadProductsAndCategories = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category_id', selectedCategory);
      if (search) params.append('search', search);

      const [prods, cats] = await Promise.all([
        api.getProducts(params.toString()),
        api.getCategories()
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Barcode Scanner Handler (Direct scan of serial or product barcode)
  const handleBarcodeSubmit = async (e) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    try {
      const result = await api.lookupBarcode(barcodeInput.trim());

      if (result.type === 'serial') {
        const s = result.serial;
        const p = result.product;

        // Check if already in cart
        if (cart.some(item => item.serial_id === s.id)) {
          setScanStatus({ type: 'error', message: `الجهاز بالسيريال ${s.serial_number} موجود بالفعل في الفاتورة` });
          setBarcodeInput('');
          return;
        }

        if (s.status !== 'in_stock') {
          setScanStatus({ type: 'error', message: `الجهاز بالسيريال ${s.serial_number} حالته: ${s.status === 'sold' ? 'مباع سابقاً' : 'بالصيانة'}` });
          setBarcodeInput('');
          return;
        }

        const price = saleType === 'installment' && p.installment_price > 0 ? p.installment_price : p.cash_price;

        setCart(prev => [
          ...prev,
          {
            product: p,
            serial_id: s.id,
            serial_number: s.serial_number,
            availableSerials: [s],
            unit_price: price
          }
        ]);

        setScanStatus({ type: 'success', message: `تمت إضافة: ${p.name} (سيريال: ${s.serial_number})` });
        setBarcodeInput('');
      } else if (result.type === 'product') {
        const p = result.product;
        const available = result.availableSerials;

        if (available.length === 0) {
          setScanStatus({ type: 'error', message: `لا توجد أجهزة متاحة في المخزن للموديل: ${p.name}` });
          setBarcodeInput('');
          return;
        }

        const usedSerialIds = cart.map(i => i.serial_id).filter(Boolean);
        const remaining = available.filter(s => !usedSerialIds.includes(s.id));

        if (remaining.length === 0) {
          setScanStatus({ type: 'error', message: `تم اختيار جميع الأجهزة المتاحة لهذا الصنف` });
          setBarcodeInput('');
          return;
        }

        const chosenSerial = remaining[0];
        const price = saleType === 'installment' && p.installment_price > 0 ? p.installment_price : p.cash_price;

        setCart(prev => [
          ...prev,
          {
            product: p,
            serial_id: chosenSerial.id,
            serial_number: chosenSerial.serial_number,
            availableSerials: remaining,
            unit_price: price
          }
        ]);

        setScanStatus({ type: 'success', message: `تمت إضافة: ${p.name} بالسيريال ${chosenSerial.serial_number}` });
        setBarcodeInput('');
      }
    } catch (err) {
      setScanStatus({ type: 'error', message: err.message || 'لم يتم العثور على الجهاز بالباركود المدخل' });
      setBarcodeInput('');
    }

    setTimeout(() => setScanStatus(null), 3500);
  };

  // Add product to cart manually from list
  const addToCart = async (product) => {
    if (product.in_stock_count <= 0) {
      alert('عذراً، هذا الجهاز غير متوفر حالياً في المخزن');
      return;
    }

    try {
      const availableSerials = await api.getAvailableSerials(product.id);
      if (availableSerials.length === 0) {
        alert('لا توجد أرقام تسلسلية متاحة لهذا الجهاز');
        return;
      }

      const usedSerialIds = cart.map(i => i.serial_id).filter(Boolean);
      const remainingSerials = availableSerials.filter(s => !usedSerialIds.includes(s.id));

      if (remainingSerials.length === 0) {
        alert('تم اختيار جميع أجهزة هذا الموديل المتوفرة بالسيريال بالفعل في السلة');
        return;
      }

      const initialSerial = remainingSerials[0];
      const initialPrice = saleType === 'installment' && product.installment_price > 0
        ? product.installment_price
        : product.cash_price;

      setCart([
        ...cart,
        {
          product,
          serial_id: initialSerial.id,
          serial_number: initialSerial.serial_number,
          availableSerials: remainingSerials,
          unit_price: initialPrice
        }
      ]);
    } catch (err) {
      console.error(err);
      alert('خطأ أثناء جلب السيريال نمبر');
    }
  };

  const removeFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const updateCartSerial = (index, serialId) => {
    const item = cart[index];
    const selected = item.availableSerials.find(s => s.id === Number(serialId));
    if (selected) {
      const updated = [...cart];
      updated[index].serial_id = selected.id;
      updated[index].serial_number = selected.serial_number;
      setCart(updated);
    }
  };

  const handleSaleTypeChange = (type) => {
    setSaleType(type);
    setCart(cart.map(item => ({
      ...item,
      unit_price: type === 'installment' && item.product.installment_price > 0
        ? item.product.installment_price
        : item.product.cash_price
    })));

    if (type === 'bank') {
      const bList = financeCompanies.filter(c => c.company_type === 'bank' || c.name.includes('بنك') || c.name.includes('أهلي') || c.name.includes('مصر') || c.name.includes('CIB') || c.name.includes('QNB'));
      if (bList.length > 0) {
        setSelectedCompanyId(bList[0].id);
        if (bList[0].plans && bList[0].plans.length > 0) setSelectedPlanId(bList[0].plans[0].id);
      }
    } else if (type === 'finance_company') {
      const fList = financeCompanies.filter(c => c.company_type !== 'bank' && !c.name.includes('بنك'));
      if (fList.length > 0) {
        setSelectedCompanyId(fList[0].id);
        if (fList[0].plans && fList[0].plans.length > 0) setSelectedPlanId(fList[0].plans[0].id);
      }
    }
  };

  // Financial calculations
  const subtotal = cart.reduce((sum, item) => sum + (Number(item.unit_price) || 0), 0);
  const total = Math.max(0, subtotal - Number(discount || 0));

  // Instant payment collection fee calculation (visa 2%, instapay 1 EGP / 1000 EGP, wallet 1%)
  let collectionFee = 0;
  if (saleType === 'cash') {
    if (paymentMethod === 'visa') {
      collectionFee = Math.round(total * 0.02 * 100) / 100;
    } else if (paymentMethod === 'instapay') {
      collectionFee = Math.round(Math.max(1, (total / 1000) * 1) * 100) / 100;
    } else if (paymentMethod === 'wallet') {
      collectionFee = Math.round((total * 0.01) * 100) / 100;
    }
  }

  // Customer Credit / Balance Deduction (from past returns)
  const customerMaxCredit = Number(selectedCustomerObj?.balance || 0);
  const effectiveCreditPaid = useCustomerCredit ? Math.min(customerMaxCredit, Math.min(total, Number(paidFromCredit) || 0)) : 0;
  const netDueAfterCredit = Math.max(0, total - effectiveCreditPaid);

  // Banks vs Consumer Finance Companies Filtering
  const bankCompanies = financeCompanies.filter(c => c.company_type === 'bank' || c.name.includes('بنك') || c.name.includes('أهلي') || c.name.includes('مصر') || c.name.includes('CIB') || c.name.includes('QNB'));
  const consumerFinanceCompanies = financeCompanies.filter(c => c.company_type !== 'bank' && !c.name.includes('بنك'));
  const activeCompaniesList = saleType === 'bank' ? bankCompanies : consumerFinanceCompanies;

  // Active Company and Plans
  const currentFinanceCompany = activeCompaniesList.find(c => c.id === Number(selectedCompanyId)) || activeCompaniesList[0] || null;
  const currentPlans = currentFinanceCompany?.plans || [];
  const selectedPlan = currentPlans.find(p => p.id === Number(selectedPlanId)) || currentPlans[0] || null;

  const feeRate = selectedPlan ? Number(selectedPlan.merchant_fee_rate ?? currentFinanceCompany?.merchant_fee_rate ?? 0) : (currentFinanceCompany?.merchant_fee_rate || 0);
  const customerInterestRate = selectedPlan ? Number(selectedPlan.customer_interest_rate || 0) : 0;
  const planDuration = selectedPlan ? Number(selectedPlan.duration_months || 12) : 12;

  const cashDownPaymentVal = Number(cashDownPayment || 0);
  const financedByCompany = Math.max(0, total - cashDownPaymentVal);
  const customerInterestAmount = Math.round(((financedByCompany * customerInterestRate) / 100) * 100) / 100;
  const totalWithInterest = financedByCompany + customerInterestAmount;
  const companyMonthlyInstallment = planDuration > 0 ? Math.round((totalWithInterest / planDuration) * 100) / 100 : 0;

  const merchantFeeAmount = Math.round(((total * feeRate) / 100) * 100) / 100;
  const netStorePayout = Math.max(0, total - merchantFeeAmount);

  // Direct Installment calculations
  const downPaymentVal = Number(downPayment || 0);
  const financedAmount = Math.max(0, total - downPaymentVal);
  const profitAmount = (financedAmount * Number(profitRate || 0)) / 100;
  const totalInstallmentAmount = financedAmount + profitAmount;
  const monthlyAmount = installmentsCount > 0 ? Math.round((totalInstallmentAmount / installmentsCount) * 100) / 100 : 0;

  const handleCompanyChange = (companyId) => {
    setSelectedCompanyId(companyId);
    const comp = activeCompaniesList.find(c => c.id === Number(companyId));
    if (comp && comp.plans && comp.plans.length > 0) {
      setSelectedPlanId(comp.plans[0].id);
    } else {
      setSelectedPlanId('');
    }
  };

  // Execute Sale Submission to DB
  const executeSaleSubmission = async () => {
    setSubmitting(true);
    try {
      const payload = {
        sale_type: saleType,
        payment_method: saleType === 'cash' ? paymentMethod : saleType,
        collection_fee: collectionFee,
        paid_by_customer_credit: effectiveCreditPaid,
        customer_id: selectedCustomerId || null,
        branch_id: Number(selectedBranchId) || 1,
        warehouse_id: Number(selectedWarehouseId) || 1,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_phone2: customerPhone2,
        customer_national_id: saleType === 'installment' ? customerNationalId : null,
        customer_address: saleType === 'installment' ? customerAddress : null,
        id_card_image: saleType === 'installment' ? (idCardImage || null) : null,
        customer_id_card_image: saleType === 'installment' ? (idCardImage || null) : null,
        discount: Number(discount || 0),
        sales_rep_id: currentUser?.id || 1,
        sales_rep_name: currentUser?.name || 'كاشير المعرض',
        items: cart.map(i => ({
          product_id: i.product.id,
          serial_id: i.serial_id,
          serial_number: i.serial_number,
          unit_price: i.unit_price
        }))
      };

      if (saleType === 'cash') {
        payload.paid_amount = netDueAfterCredit;
      } else if (saleType === 'finance_company' || saleType === 'bank') {
        payload.finance_company_id = Number(currentFinanceCompany?.id || selectedCompanyId);
        payload.finance_company_name = currentFinanceCompany?.name || (saleType === 'bank' ? 'بنك' : 'شركة تقسيط');
        payload.finance_approval_code = approvalCode;
        payload.merchant_fee_rate = feeRate;
        payload.cash_down_payment = cashDownPaymentVal;
        payload.installment_plan_name = selectedPlan 
          ? `${currentFinanceCompany?.name || 'تمويل'} - ${selectedPlan.name} (${planDuration} شهر)`
          : (currentFinanceCompany?.name || (saleType === 'bank' ? 'تقسيط بنكي' : 'شركات تمويل'));
        payload.installment_duration_months = planDuration;
      } else if (saleType === 'installment') {
        payload.paid_amount = downPaymentVal;
        payload.installment_plan_name = `تقسيط مباشر - ${installmentsCount} شهر`;
        payload.installment_duration_months = Number(installmentsCount);
        payload.installment_data = {
          down_payment: downPaymentVal,
          financed_amount: financedAmount,
          profit_rate: Number(profitRate),
          profit_amount: profitAmount,
          total_installment_amount: totalInstallmentAmount,
          installments_count: Number(installmentsCount),
          monthly_amount: monthlyAmount,
          start_date: startDate,
          guarantor_name: guarantorName,
          guarantor_phone: guarantorPhone,
          guarantor_national_id: guarantorNationalId,
          guarantor_relation: guarantorRelation
        };
      }

      const res = await api.createSale(payload);
      const fullSale = await api.getSale(res.saleId);
      onSaleCompleted(fullSale);
    } catch (err) {
      setErrorMsg(err.message || 'حدث خطأ أثناء حفظ الفاتورة');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Sale with Manager Override & Contract Approval Checks
  const handleSubmitSale = async () => {
    setErrorMsg('');

    if (cart.length === 0) {
      setErrorMsg('الرجاء إضافة جهاز واحد على الأقل في الفاتورة');
      return;
    }

    if (saleType === 'finance_company' || saleType === 'bank') {
      if (!currentFinanceCompany && !selectedCompanyId) {
        setErrorMsg(saleType === 'bank' ? 'الرجاء اختيار البنك الممول' : 'الرجاء اختيار شركة التمويل (مثل فاليو أو كونتاكت)');
        return;
      }
      if (!approvalCode) {
        setErrorMsg('الرجاء إدخال رقم الموافقة / العملية من تطبيق الشركة أو ماكينة الفيزا');
        return;
      }
    }

    if (saleType === 'installment') {
      if (!customerName || !customerPhone) {
        setErrorMsg('الرجاء كتابة اسم العميل ورقم الهاتف لإنشاء عقد التقسيط');
        return;
      }
      if (!customerNationalId) {
        setErrorMsg('الرقم القومي للعميل إلزامي في عقود التقسيط المباشر');
        return;
      }
      if (!customerAddress) {
        setErrorMsg('عنوان العميل بالتفصيل إلزامي في عقود التقسيط المباشر');
        return;
      }
    }

    // 1. Discount Ceiling Authorization Check
    const maxDiscountAllowed = Number(settings?.max_cashier_discount_amount || 500);
    const isOverDiscount = Number(discount || 0) > maxDiscountAllowed;
    const isCashierRole = currentUser && ['cashier'].includes(currentUser.role);
    
    // 2. Blacklisted Customer Installment Check
    const isBlacklistedInstallment = saleType === 'installment' && selectedCustomerObj?.is_blacklisted;

    if ((isOverDiscount && isCashierRole) || isBlacklistedInstallment) {
      setPinReason(isBlacklistedInstallment 
        ? `العميل (${customerName}) مدرج بالقائمة السوداء. تفويض المدير مطلوب لتمرير البيع بالتقسيط.`
        : `قيمة الخصم (${discount} ج.م) تتجاوز الحد المسموح للكاشير (${maxDiscountAllowed} ج.م). تفويض المدير مطلوب.`);
      setShowPinModal(true);
      return;
    }

    // 3. Direct Installment Contract Printing & Final Approval Gate (Requirement 9)
    if (saleType === 'installment') {
      setContractPrinted(false);
      setShowContractApprovalModal(true);
      return;
    }

    executeSaleSubmission();
  };

  const handleConfirmManagerPin = (e) => {
    e?.preventDefault();
    const correctPin = String(settings?.manager_override_pin || '1234');
    if (pinInput.trim() !== correctPin) {
      alert('رمز تفويض المدير غير صحيح!');
      return;
    }
    setShowPinModal(false);
    setPinInput('');
    executeSaleSubmission();
  };

  const handleSaveCustomerEdit = async (e) => {
    e?.preventDefault();
    if (!customerEditData.name || !customerEditData.phone) {
      alert('الرجاء كتابة اسم العميل ورقم الهاتف على الأقل');
      return;
    }
    setSavingCustomerEdit(true);
    try {
      if (selectedCustomerId) {
        await api.updateCustomer(selectedCustomerId, customerEditData);
        setCustomerName(customerEditData.name);
        setCustomerPhone(customerEditData.phone);
        setCustomerPhone2(customerEditData.phone2 || '');
        setCustomerNationalId(customerEditData.national_id || '');
        setCustomerAddress(customerEditData.address || '');
        if (customerEditData.guarantor_name) {
          setGuarantorName(customerEditData.guarantor_name);
          setGuarantorPhone(customerEditData.guarantor_phone || '');
          setGuarantorNationalId(customerEditData.guarantor_national_id || '');
          setGuarantorRelation(customerEditData.guarantor_relation || 'أخ');
        }
        const custs = await api.lookupCustomers(customerEditData.phone);
        const updated = custs.find(c => c.id === selectedCustomerId);
        if (updated) setSelectedCustomerObj(updated);
      } else {
        const res = await api.createCustomer(customerEditData);
        setSelectedCustomerId(res.id);
        setCustomerName(customerEditData.name);
        setCustomerPhone(customerEditData.phone);
        setCustomerPhone2(customerEditData.phone2 || '');
        setCustomerNationalId(customerEditData.national_id || '');
        setCustomerAddress(customerEditData.address || '');
        if (customerEditData.guarantor_name) {
          setGuarantorName(customerEditData.guarantor_name);
          setGuarantorPhone(customerEditData.guarantor_phone || '');
          setGuarantorNationalId(customerEditData.guarantor_national_id || '');
          setGuarantorRelation(customerEditData.guarantor_relation || 'أخ');
        }
        const custs = await api.lookupCustomers(customerEditData.phone);
        const updated = custs.find(c => c.id === res.id) || res;
        setSelectedCustomerObj(updated);
      }
      setShowCustomerEditModal(false);
      alert('تم تحديث وحفظ بيانات العميل بنجاح!');
    } catch (err) {
      alert('خطأ أثناء حفظ بيانات العميل: ' + (err.message || 'حدث خطأ غير متوقع'));
    } finally {
      setSavingCustomerEdit(false);
    }
  };

  const draftPlan = {
    id: 'DRAFT',
    invoice_no: 'مسودة عقد تقسيط مباشر',
    sale_date: new Date().toISOString().slice(0, 10),
    start_date: startDate,
    customer_name: customerName,
    customer_national_id: customerNationalId,
    customer_phone: customerPhone,
    customer_address: customerAddress,
    customer_workplace: selectedCustomerObj?.workplace || '',
    guarantor_name: guarantorName,
    guarantor_phone: guarantorPhone,
    guarantor_national_id: guarantorNationalId,
    guarantor_relation: guarantorRelation,
    items: cart.map(i => ({
      name: i.product.name,
      model: i.product.model_number,
      serial_number: i.serial_number,
      unit_price: i.unit_price,
      warranty_months: i.product.warranty_months || 12,
      warranty_agency: i.product.warranty_agency || 'الوكيل الرسمي'
    })),
    total_cash_price: total,
    down_payment: downPaymentVal,
    financed_amount: financedAmount,
    profit_rate: Number(profitRate),
    profit_amount: profitAmount,
    total_installment_amount: totalInstallmentAmount,
    total_amount: totalInstallmentAmount,
    installments_count: Number(installmentsCount),
    monthly_amount: monthlyAmount,
    remaining_balance: totalInstallmentAmount
  };

  return (
    <div className="space-y-4">
      {/* Branch & Warehouse Active Badge Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <span className="font-extrabold text-slate-800">فرع ومخزن نقطة البيع:</span>
            <span className="text-[11px] text-slate-400 block">حدد الفرع والمخزن المخصوم منه الأجهزة بالفاتورة</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-semibold">الفرع:</span>
            <select
              value={selectedBranchId}
              onChange={(e) => {
                const bId = e.target.value;
                setSelectedBranchId(bId);
                const matchedWh = warehouses.find(w => w.branch_id === Number(bId));
                if (matchedWh) setSelectedWarehouseId(matchedWh.id);
              }}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-semibold">المخزن:</span>
            <select
              value={selectedWarehouseId}
              onChange={(e) => setSelectedWarehouseId(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {warehouses.filter(w => !selectedBranchId || w.branch_id === Number(selectedBranchId)).map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Products Catalog & Barcode Scanner (7 Cols) */}
        <div className="xl:col-span-7 space-y-4">
        {/* Fast Barcode Scanner Input */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-950 p-4 rounded-2xl text-white shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-blue-200 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400 animate-bounce" />
              الماسح الضوئي الذكي (Barcode & Serial Scanner)
            </span>
            <span className="text-[10px] bg-blue-800 text-blue-200 px-2 py-0.5 rounded font-mono">
              مسدس باركود USB / Wireless
            </span>
          </div>

          <form onSubmit={handleBarcodeSubmit} className="relative">
            <Barcode className="w-5 h-5 absolute right-3.5 top-3.5 text-blue-300" />
            <input
              ref={barcodeInputRef}
              type="text"
              placeholder="وجّه مسدس الباركود على كرتونة الجهاز أو السيريال، أو اكتب الباركود واضغط Enter..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl pr-11 pl-20 py-2.5 text-xs text-white placeholder-blue-300/70 focus:outline-none focus:ring-2 focus:ring-amber-400 font-mono font-bold"
              dir="ltr"
            />
            <button
              type="submit"
              className="absolute left-2 top-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-3 py-1.5 rounded-lg cursor-pointer"
            >
              مسح
            </button>
          </form>

          {scanStatus && (
            <div className={`mt-2 p-2 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
              scanStatus.type === 'success' ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-200 border border-rose-500/40'
            }`}>
              {scanStatus.type === 'success' ? <Check className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
              <span>{scanStatus.message}</span>
            </div>
          )}
        </div>

        {/* Search & Category Filter */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
          <div className="relative">
            <Search className="w-5 h-5 absolute right-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="ابحث باسم الجهاز، الموديل، الماركة..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-11 pl-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          {/* Categories Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === '' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              جميع الأجهزة
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  selectedCategory === c.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {products.map((p) => {
            const hasStock = p.in_stock_count > 0;
            const currentPrice = saleType === 'installment' && p.installment_price > 0 ? p.installment_price : p.cash_price;

            return (
              <div
                key={p.id}
                className={`bg-white rounded-2xl p-4 border transition-all duration-200 flex flex-col justify-between ${
                  hasStock
                    ? 'border-slate-200/90 hover:border-blue-400 hover:shadow-md cursor-pointer'
                    : 'border-slate-200 opacity-60 bg-slate-50'
                }`}
                onClick={() => hasStock && addToCart(p)}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                      {p.brand_name || 'عام'}
                    </span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      hasStock ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {hasStock ? `${p.in_stock_count} متاح بالسيريال` : 'نفد من المخزن'}
                    </span>
                  </div>

                  <h4 className="font-extrabold text-sm text-slate-900 line-clamp-2 leading-snug">
                    {p.name}
                  </h4>
                  {p.model_number && (
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">موديل: {p.model_number}</p>
                  )}
                  {p.specifications && (
                    <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-relaxed bg-slate-50 p-1.5 rounded">
                      {p.specifications}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">
                      {saleType === 'installment' ? 'سعر التقسيط' : 'سعر الكاش'}
                    </span>
                    <span className="text-base font-black text-blue-700" dir="ltr">
                      {Number(currentPrice).toLocaleString()} {currency}
                    </span>
                  </div>

                  <button
                    disabled={!hasStock}
                    className={`p-2 rounded-xl flex items-center gap-1 text-xs font-bold transition-all ${
                      hasStock
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cart & Invoicing Panel (5 Cols) */}
      <div className="xl:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-md p-5 sticky top-24 space-y-4">
        {/* 4-Mode Sale Selector (Requirement 1) */}
        <div>
          <span className="block text-[11px] font-bold text-slate-500 mb-1.5">نوع الفاتورة وطريقة البيع:</span>
          <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold text-center">
            <button
              type="button"
              onClick={() => handleSaleTypeChange('cash')}
              className={`py-2 rounded-lg transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                saleType === 'cash' ? 'bg-white text-emerald-700 shadow-xs border border-emerald-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>💵 دفع فوري</span>
            </button>

            <button
              type="button"
              onClick={() => handleSaleTypeChange('bank')}
              className={`py-2 rounded-lg transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                saleType === 'bank' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🏛️ البنوك</span>
            </button>

            <button
              type="button"
              onClick={() => handleSaleTypeChange('finance_company')}
              className={`py-2 rounded-lg transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                saleType === 'finance_company' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🏢 شركات التمويل</span>
            </button>

            <button
              type="button"
              onClick={() => handleSaleTypeChange('installment')}
              className={`py-2 rounded-lg transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                saleType === 'installment' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>📑 تقسيط مباشر</span>
            </button>
          </div>

          {/* Instant Payment Methods Breakdown (Requirement 2) */}
          {saleType === 'cash' && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-2 mt-2">
              <span className="text-[11px] font-bold text-slate-600 block">طريقة التحصيل والوسيلة الإلكترونية:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-center">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    paymentMethod === 'cash'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className="block text-sm mb-0.5">💵</span>
                  <span>نقدي</span>
                  <span className="block text-[9px] opacity-80 mt-0.5">بدون رسوم</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('visa')}
                  className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    paymentMethod === 'visa'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className="block text-sm mb-0.5">💳</span>
                  <span>فيزا POS</span>
                  <span className="block text-[9px] opacity-80 mt-0.5">رسم 2% مصروف</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('instapay')}
                  className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    paymentMethod === 'instapay'
                      ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className="block text-sm mb-0.5">⚡</span>
                  <span>إنستاباي</span>
                  <span className="block text-[9px] opacity-80 mt-0.5">1 ج / 1000 ج</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('wallet')}
                  className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    paymentMethod === 'wallet'
                      ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className="block text-sm mb-0.5">📱</span>
                  <span>محفظة ذكية</span>
                  <span className="block text-[9px] opacity-80 mt-0.5">رسم 1% مصروف</span>
                </button>
              </div>

              {collectionFee > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 flex items-center justify-between text-[11px] font-bold text-amber-900">
                  <span>رسم التحصيل الإلكتروني المخصوم (كمصروف):</span>
                  <span className="font-mono text-rose-600 font-extrabold" dir="ltr">-{collectionFee.toLocaleString()} {currency}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cart Items List */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
              <ShoppingCart className="w-4 h-4 text-blue-600" />
              الأجهزة المختارة ({cart.length})
            </h4>
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                className="text-[11px] text-rose-500 hover:text-rose-700 font-bold cursor-pointer"
              >
                تفريغ الفاتورة
              </button>
            )}
          </div>

          {cart.length === 0 ? (
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-400">
              <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs font-bold">الفاتورة فارغة</p>
              <p className="text-[11px] mt-0.5">امسح الباركود بالمسدس الضوئي أو اختر الأجهزة من القائمة</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
              {cart.map((item, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h5 className="font-bold text-slate-800">{item.product.name}</h5>
                      <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold mt-0.5">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>ضمان {item.product.warranty_months} شهر ({item.product.warranty_agency})</span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Serial Number Picker */}
                  <div className="mt-2.5 pt-2 border-t border-slate-200/80 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-1">
                      <Barcode className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                      <select
                        value={item.serial_id}
                        onChange={(e) => updateCartSerial(idx, e.target.value)}
                        className="bg-white border border-slate-200 rounded px-2 py-1 text-[11px] font-mono font-bold text-blue-800 w-full focus:outline-none"
                      >
                        {item.availableSerials.map((s) => (
                          <option key={s.id} value={s.id}>
                            سيريال: {s.serial_number}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="font-extrabold text-slate-900 text-sm whitespace-nowrap" dir="ltr">
                      {Number(item.unit_price).toLocaleString()} {currency}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bank & Consumer Finance Details (Requirements 1 & 2) */}
        {(saleType === 'finance_company' || saleType === 'bank') && (
          <div className={`border rounded-2xl p-4 text-xs space-y-3 ${
            saleType === 'bank' ? 'bg-blue-50/70 border-blue-200' : 'bg-indigo-50/70 border-indigo-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`font-extrabold flex items-center gap-1.5 ${
                saleType === 'bank' ? 'text-blue-950' : 'text-indigo-950'
              }`}>
                {saleType === 'bank' ? <Landmark className="w-4 h-4 text-blue-600" /> : <CreditCard className="w-4 h-4 text-indigo-600" />}
                {saleType === 'bank' ? 'بيانات التقسيط البنكي المعتمد' : 'بيانات تقسيط شركات التمويل (فاليو / كونتاكت / أمان)'}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                saleType === 'bank' ? 'bg-blue-200 text-blue-900' : 'bg-indigo-200 text-indigo-900'
              }`}>
                {saleType === 'bank' ? 'تمويل بنكي' : 'BNPL تمويل شركات'}
              </span>
            </div>

            <div>
              <label className="block text-slate-600 font-bold mb-1">
                {saleType === 'bank' ? 'البنك الممول *' : 'شركة التمويل *'}
              </label>
              <select
                value={selectedCompanyId}
                onChange={(e) => handleCompanyChange(e.target.value)}
                className={`w-full bg-white border rounded-xl px-3 py-2 font-bold focus:outline-none ${
                  saleType === 'bank' ? 'border-blue-200 text-blue-950' : 'border-indigo-200 text-indigo-950'
                }`}
              >
                {activeCompaniesList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.plans?.length ? `(${c.plans.length} خطط تقسيط)` : `(عمولة التاجر: ${c.merchant_fee_rate}%)`}
                  </option>
                ))}
              </select>
            </div>

            {/* Duration Plan Selector */}
            {currentPlans.length > 0 && (
              <div>
                <label className="block text-slate-600 font-bold mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    خطة ومدة التقسيط المعتمدة *
                  </span>
                  {selectedPlan && (
                    <span className="text-[10px] bg-indigo-100 text-indigo-800 font-black px-2 py-0.5 rounded">
                      مدة {selectedPlan.duration_months} شهر
                    </span>
                  )}
                </label>
                <select
                  value={selectedPlan?.id || ''}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="w-full bg-white border border-indigo-200 rounded-xl px-3 py-2 font-bold text-indigo-950 focus:outline-none"
                >
                  {currentPlans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} - مدة {p.duration_months} شهر (فائدة العميل: {p.customer_interest_rate}% | عمولة التاجر: {p.merchant_fee_rate}%)
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-600 font-bold mb-1">مقدم كاش بالمعرض (اختياري)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={cashDownPayment}
                  onChange={(e) => setCashDownPayment(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">كود العملية (Approval Code) *</label>
                <input
                  type="text"
                  required
                  placeholder={saleType === 'bank' ? 'مثال: POS-B-8831' : 'مثال: VALU-994120'}
                  value={approvalCode}
                  onChange={(e) => setApprovalCode(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5">
              <div className="flex justify-between text-slate-600">
                <span>إجمالي الفاتورة:</span>
                <span className="font-bold">{total.toLocaleString()} {currency}</span>
              </div>
              {cashDownPaymentVal > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>المقدم النقدي المدفوع:</span>
                  <span className="font-bold">+{cashDownPaymentVal.toLocaleString()} {currency}</span>
                </div>
              )}
              <div className="flex justify-between text-indigo-900 font-bold">
                <span>المبلغ الممول بالتقسيط:</span>
                <span>{financedByCompany.toLocaleString()} {currency}</span>
              </div>
              {selectedPlan && (
                <div className="flex justify-between text-indigo-700 bg-indigo-50/80 px-2 py-1 rounded font-bold">
                  <span>القسط الشهري للعميل ({planDuration} شهر):</span>
                  <span dir="ltr">{companyMonthlyInstallment.toLocaleString()} {currency} / شهر</span>
                </div>
              )}
              <div className="flex justify-between text-rose-600">
                <span>عمولة التاجر المستقطعة ({feeRate}%):</span>
                <span>-{merchantFeeAmount.toLocaleString()} {currency}</span>
              </div>
              <div className="flex justify-between font-black text-slate-900 border-t border-slate-100 pt-1.5">
                <span>الصافي المودع لحساب المعرض:</span>
                <span className="text-sm font-mono text-blue-800" dir="ltr">{netStorePayout.toLocaleString()} {currency}</span>
              </div>
            </div>
          </div>
        )}

        {/* Direct Store Installment Plan Calculator */}
        {saleType === 'installment' && (
          <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3 text-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-900 flex items-center gap-1">
                <Calculator className="w-3.5 h-3.5" />
                حاسبة ونظام خطة التقسيط المباشر
              </span>
              <span className="text-[10px] bg-amber-200/70 text-amber-900 px-2 py-0.5 rounded font-bold">
                إيصالات أمانة
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] text-slate-500 mb-1 font-semibold">المقدم المدفوع</label>
                <input
                  type="number"
                  value={downPayment}
                  onChange={(e) => setDownPayment(e.target.value)}
                  className="w-full bg-white border border-amber-200 rounded px-2 py-1 text-center font-bold font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 mb-1 font-semibold">عدد الشهور</label>
                <select
                  value={installmentsCount}
                  onChange={(e) => setInstallmentsCount(e.target.value)}
                  className="w-full bg-white border border-amber-200 rounded px-2 py-1 font-bold text-center"
                >
                  <option value={6}>6 شهور</option>
                  <option value={12}>12 شهر (سنة)</option>
                  <option value={18}>18 شهر</option>
                  <option value={24}>24 شهر (سنتين)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 mb-1 font-semibold">نسبة الربح %</label>
                <input
                  type="number"
                  value={profitRate}
                  onChange={(e) => setProfitRate(e.target.value)}
                  className="w-full bg-white border border-amber-200 rounded px-2 py-1 text-center font-bold font-mono"
                />
              </div>
            </div>

            <div className="bg-amber-100/80 border border-amber-300 rounded-lg p-2 flex items-center justify-between">
              <span className="text-[11px] text-amber-800 font-bold">القسط الشهري المستحق:</span>
              <span className="text-base font-black text-amber-950" dir="ltr">
                {monthlyAmount.toLocaleString()} {currency}
              </span>
            </div>

            {/* Guarantor Details */}
            <div className="pt-2 border-t border-amber-200 space-y-1.5">
              <span className="font-bold text-amber-950 block text-[11px]">بيانات الضامن:</span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="اسم الضامن"
                  value={guarantorName}
                  onChange={(e) => setGuarantorName(e.target.value)}
                  className="bg-white border border-amber-200 rounded px-2 py-1 text-xs"
                />
                <input
                  type="text"
                  placeholder="هاتف الضامن"
                  value={guarantorPhone}
                  onChange={(e) => setGuarantorPhone(e.target.value)}
                  className="bg-white border border-amber-200 rounded px-2 py-1 text-xs font-mono"
                  dir="ltr"
                />
              </div>
            </div>
          </div>
        )}

        {/* Customer Information & Mobile Search */}
        <div className="border-t border-slate-200 pt-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <h5 className="font-bold text-xs text-slate-700 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-600" />
              بيانات المشتري {saleType !== 'cash' && <span className="text-rose-500 font-bold">*</span>}
            </h5>
            {!selectedCustomerId && (
              <div className="flex bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setCustomerMode('search')}
                  className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                    customerMode === 'search' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  🔍 بحث برقم الهاتف
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerMode('new')}
                  className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                    customerMode === 'new' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  + عميل جديد
                </button>
              </div>
            )}
          </div>

          {/* Selected Registered Customer Card */}
          {selectedCustomerId ? (
            <div className="space-y-2">
              <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 text-xs flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 font-black text-emerald-950">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>{customerName}</span>
                    <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded font-semibold">
                      عميل مسجل
                    </span>
                    {selectedCustomerObj && (
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        selectedCustomerObj.is_blacklisted
                          ? 'bg-rose-100 text-rose-800'
                          : selectedCustomerObj.credit_score === 'A'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {selectedCustomerObj.is_blacklisted ? '🚫 محظور' : `تصنيف ${selectedCustomerObj.credit_score || 'A'}`}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-emerald-800 mt-1">
                    <span dir="ltr">📞 {customerPhone}</span>
                    {customerAddress && <span>📍 {customerAddress}</span>}
                    {customerNationalId && <span dir="ltr">🪪 {customerNationalId}</span>}
                  </div>
                  {idCardImage && (
                    <div className="mt-2 flex items-center gap-2">
                      <img
                        src={idCardImage}
                        alt="بطاقة العميل"
                        className="w-12 h-8 object-cover rounded border border-emerald-300 shadow-xs cursor-pointer"
                        onClick={() => window.open(idCardImage, '_blank')}
                        title="انقر لفتح صورة البطاقة"
                      />
                      <span className="text-[10px] text-emerald-700 font-bold">🪪 صورة إثبات الشخصية مرفقة</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <button
                    type="button"
                    onClick={() => {
                      setCustomerEditData({
                        name: customerName,
                        phone: customerPhone,
                        phone2: customerPhone2,
                        national_id: customerNationalId,
                        address: customerAddress,
                        workplace: selectedCustomerObj?.workplace || '',
                        notes: selectedCustomerObj?.notes || '',
                        guarantor_name: guarantorName,
                        guarantor_phone: guarantorPhone,
                        guarantor_national_id: guarantorNationalId,
                        guarantor_relation: guarantorRelation
                      });
                      setShowCustomerEditModal(true);
                    }}
                    className="text-[11px] text-blue-700 hover:text-blue-900 bg-blue-100/80 hover:bg-blue-200/80 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>تعديل بيانات العميل</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleClearCustomer}
                    className="text-[10px] text-rose-600 hover:text-rose-800 hover:bg-rose-100 px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer"
                  >
                    تغيير العميل
                  </button>
                </div>
              </div>

              {/* Customer Balance Credit Card (Requirement 4) */}
              {selectedCustomerObj && Number(selectedCustomerObj.balance) > 0 && (
                <div className="bg-emerald-50/90 border border-emerald-300 rounded-xl p-3 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-black text-emerald-950">
                      <Wallet className="w-4 h-4 text-emerald-600" />
                      <span>رصيد متاح في حساب العميل:</span>
                      <span className="font-mono text-emerald-700 font-extrabold" dir="ltr">{Number(selectedCustomerObj.balance).toLocaleString()} {currency}</span>
                    </div>
                    <label className="flex items-center gap-1.5 cursor-pointer font-bold text-emerald-900 text-[11px]">
                      <input
                        type="checkbox"
                        checked={useCustomerCredit}
                        onChange={(e) => {
                          setUseCustomerCredit(e.target.checked);
                          if (e.target.checked) {
                            setPaidFromCredit(Math.min(selectedCustomerObj.balance, total));
                          } else {
                            setPaidFromCredit(0);
                          }
                        }}
                        className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                      />
                      <span>استخدام الرصيد في السداد</span>
                    </label>
                  </div>

                  {useCustomerCredit && (
                    <div className="flex items-center justify-between pt-1 border-t border-emerald-200">
                      <span className="text-slate-600 font-bold text-[11px]">المبلغ المخصوم من رصيد العميل:</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          max={Math.min(selectedCustomerObj.balance, total)}
                          value={paidFromCredit}
                          onChange={(e) => setPaidFromCredit(Math.min(selectedCustomerObj.balance, Math.min(total, Number(e.target.value) || 0)))}
                          className="w-24 bg-white border border-emerald-300 rounded-lg px-2 py-1 text-center font-mono font-bold text-emerald-800 text-xs"
                        />
                        <span className="font-bold text-emerald-900">{currency}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedCustomerObj?.is_blacklisted && (
                <div className="p-2.5 rounded-xl bg-rose-100 border border-rose-300 text-rose-900 text-xs font-bold flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                  <div>
                    <span className="block font-black">تحذير أمان: هذا العميل مدرج بالقائمة السوداء!</span>
                    <span className="text-[10px] text-rose-700 block">سبب الحظر: {selectedCustomerObj.blacklist_reason || 'تعثر سابق في سداد الأقساط'} (يتطلب موافقة المدير)</span>
                  </div>
                </div>
              )}
            </div>
          ) : customerMode === 'search' ? (
            /* Search Mode */
            <div className="relative">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="ابحث برقم الموبايل أو الاسم أو الرقم القومي..."
                  value={customerSearchQuery}
                  onChange={(e) => handleCustomerSearchChange(e.target.value)}
                  onFocus={() => { if (customerSearchResults.length > 0) setShowCustomerDropdown(true); }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-8 pl-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                />
              </div>

              {/* Autocomplete Dropdown */}
              {showCustomerDropdown && customerSearchResults.length > 0 && (
                <div className="absolute z-20 top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-100 text-xs">
                  {customerSearchResults.map((cust) => (
                    <div
                      key={cust.id}
                      onClick={() => handleSelectCustomer(cust)}
                      className="p-2.5 hover:bg-blue-50/70 cursor-pointer flex items-center justify-between transition-all"
                    >
                      <div>
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          <span>{cust.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono" dir="ltr">({cust.phone})</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {cust.address ? `📍 ${cust.address} | ` : ''}
                          مشتريات: {cust.sales_count} فواتير
                        </p>
                      </div>
                      <span className="text-[11px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">
                        اختيار
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Or switch to manual input */}
              <div className="mt-2 text-center">
                <button
                  type="button"
                  onClick={() => setCustomerMode('new')}
                  className="text-[11px] text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
                >
                  العميل غير مسجل؟ اضغط هنا لإدخال بيانات عميل جديد
                </button>
              </div>
            </div>
          ) : (
            /* New Customer Manual Input */
            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="اسم العميل *"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="رقم الموبايل *"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  dir="ltr"
                />
              </div>

              {/* If NOT direct installment (i.e. Cash or Finance Company), hide Address, National ID, and ID Card Image */}
              {saleType !== 'installment' ? (
                <div>
                  <input
                    type="text"
                    placeholder="رقم هاتف إضافي (اختياري)"
                    value={customerPhone2}
                    onChange={(e) => setCustomerPhone2(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                    dir="ltr"
                  />
                  <p className="text-[10.5px] text-slate-400 mt-1">
                    {saleType === 'cash' 
                      ? '✓ بيع نقدي (كاش): لا يتطلب إدخال العنوان أو الرقم القومي أو إثبات الشخصية.'
                      : '✓ تقسيط بنوك وشركات: يتم فحص هوية العميل والائتمان عبر تطبيق الشركة المعتمدة.'}
                  </p>
                </div>
              ) : (
                /* Direct Installment only: Show Phone 2, Address, National ID, and ID Card Image */
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="رقم هاتف إضافي (اختياري)"
                      value={customerPhone2}
                      onChange={(e) => setCustomerPhone2(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                      dir="ltr"
                    />
                    <input
                      type="text"
                      placeholder="العنوان بالتفصيل *"
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <input
                    type="text"
                    placeholder="الرقم القومي (14 رقم) *"
                    value={customerNationalId}
                    onChange={(e) => setCustomerNationalId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                    dir="ltr"
                  />

                  {/* Customer ID Card / Passport Scan / Upload */}
                  <div className="border border-dashed border-amber-300 bg-amber-50/40 rounded-xl p-2.5">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-slate-700 text-[11px] flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-amber-600" />
                        صورة بطاقة الرقم القومي (إثبات الشخصية)
                      </span>
                      {idCardImage && (
                        <button
                          type="button"
                          onClick={() => setIdCardImage(null)}
                          className="text-[10px] text-rose-600 hover:text-rose-800 font-bold cursor-pointer"
                        >
                          إلغاء الصورة
                        </button>
                      )}
                    </div>

                    {idCardImage ? (
                      <div className="flex items-center gap-2.5 bg-white p-2 rounded-lg border border-amber-200">
                        <img
                          src={idCardImage}
                          alt="صورة البطاقة"
                          className="w-14 h-10 object-cover rounded border border-slate-200 cursor-pointer shadow-xs"
                          onClick={() => window.open(idCardImage, '_blank')}
                          title="انقر للعرض بالحجم الكامل"
                        />
                        <div className="text-right flex-1">
                          <span className="text-xs font-bold text-emerald-700 block">✓ تم حفظ صورة إثبات الهوية</span>
                          <span className="text-[10px] text-slate-400">ستسجل وترفق مع ملف العميل وعقد التقسيط المباشر</span>
                        </div>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center gap-2 p-2 border border-dashed border-amber-300 rounded-lg bg-white hover:bg-amber-50 cursor-pointer transition-all">
                        <Camera className="w-4 h-4 text-amber-600" />
                        <span className="text-[11px] font-bold text-amber-700">اضغط لرفع صورة بطاقة الرقم القومي</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleIdCardUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Financial Summary */}
        <div className="border-t border-slate-200 pt-3 space-y-2 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>إجمالي الأجهزة:</span>
            <span className="font-bold" dir="ltr">{subtotal.toLocaleString()} {currency}</span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-600">خصم نقدي:</span>
            <input
              type="number"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              className="w-24 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-left font-mono font-bold text-xs"
              placeholder="0"
            />
          </div>

          {effectiveCreditPaid > 0 && (
            <div className="flex justify-between text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-300">
              <span>✓ خصم من رصيد المرتجعات:</span>
              <span dir="ltr">-{effectiveCreditPaid.toLocaleString()} {currency}</span>
            </div>
          )}

          {saleType === 'cash' && collectionFee > 0 && (
            <div className="flex justify-between text-amber-900 font-semibold bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-300 text-[11px]">
              <span>رسوم تحصيل إلكتروني (تخصم كمصروف):</span>
              <span dir="ltr">+{collectionFee.toLocaleString()} {currency}</span>
            </div>
          )}

          <div className="flex justify-between text-sm font-black text-slate-900 border-t border-slate-200 pt-2">
            <span>الصافي المطلوب تحصيله:</span>
            <span className="text-blue-700 text-base" dir="ltr">{netDueAfterCredit.toLocaleString()} {currency}</span>
          </div>
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
            {errorMsg}
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmitSale}
          disabled={submitting || cart.length === 0}
          className={`w-full py-3.5 rounded-xl font-black text-sm text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
            submitting || cart.length === 0
              ? 'bg-slate-300 shadow-none cursor-not-allowed'
              : saleType === 'finance_company'
              ? 'bg-gradient-to-r from-indigo-600 to-blue-700 hover:from-indigo-700 hover:to-blue-800 shadow-indigo-500/20'
              : saleType === 'installment'
              ? 'bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-700 hover:to-indigo-700 shadow-amber-500/20'
              : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
          }`}
        >
          {submitting ? (
            <span>جاري معالجة الفاتورة...</span>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              <span>
                {saleType === 'finance_company'
                  ? 'إتمام تقسيط الشركة وطباعة الفاتورة'
                  : saleType === 'installment'
                  ? 'تأكيد البيع بالتقسيط وطباعة العقد'
                  : 'إتمام البيع الكاش وطباعة الفاتورة'}
              </span>
            </>
          )}
        </button>
      </div>
    </div>

    {/* Manager Override PIN Modal */}
    {showPinModal && (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 text-slate-800 text-xs">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-200 mb-4">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-900">موافقة وتفويض المدير</h4>
              <p className="text-[11px] text-slate-500">مطلوب إدخال الرمز السري للإدارة لتمرير العملية</p>
            </div>
          </div>

          <p className="text-slate-700 font-bold mb-3 bg-amber-50 border border-amber-200 p-2.5 rounded-xl">
            {pinReason}
          </p>

          <form onSubmit={handleConfirmManagerPin} className="space-y-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">رمز التفويض السري (PIN):</label>
              <input
                type="password"
                autoFocus
                required
                placeholder="••••"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full text-center tracking-widest font-mono text-lg font-black bg-slate-50 border-2 border-slate-300 rounded-xl py-2 focus:border-rose-600 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowPinModal(false);
                  setPinInput('');
                }}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer"
              >
                تأكيد وتمرير الفاتورة
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

    {/* Quick Customer Edit Modal (Requirement 7) */}
    {showCustomerEditModal && (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 text-slate-800 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <Edit className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">
                  {selectedCustomerId ? 'تعديل وتحديث بيانات العميل' : 'تسجيل بيانات عميل جديد'}
                </h4>
                <p className="text-[11px] text-slate-500">حفظ فوري دون مغادرة شاشة إصدار الفاتورة</p>
              </div>
            </div>
            <button
              onClick={() => setShowCustomerEditModal(false)}
              className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSaveCustomerEdit} className="space-y-3 max-h-[75vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">اسم العميل *</label>
                <input
                  type="text"
                  required
                  value={customerEditData.name}
                  onChange={(e) => setCustomerEditData({ ...customerEditData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold focus:border-blue-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">رقم الموبايل الأساسي *</label>
                <input
                  type="text"
                  required
                  dir="ltr"
                  value={customerEditData.phone}
                  onChange={(e) => setCustomerEditData({ ...customerEditData, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold font-mono focus:border-blue-600 focus:outline-none text-right"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">رقم هاتف إضافي</label>
                <input
                  type="text"
                  dir="ltr"
                  value={customerEditData.phone2 || ''}
                  onChange={(e) => setCustomerEditData({ ...customerEditData, phone2: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-right"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">الرقم القومي (14 رقم)</label>
                <input
                  type="text"
                  dir="ltr"
                  maxLength={14}
                  value={customerEditData.national_id || ''}
                  onChange={(e) => setCustomerEditData({ ...customerEditData, national_id: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-right"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">العنوان بالتفصيل</label>
              <input
                type="text"
                value={customerEditData.address || ''}
                onChange={(e) => setCustomerEditData({ ...customerEditData, address: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                placeholder="المحافظة - المركز - الشارع - رقم العقار"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">جهة العمل أو الوظيفة</label>
                <input
                  type="text"
                  value={customerEditData.workplace || ''}
                  onChange={(e) => setCustomerEditData({ ...customerEditData, workplace: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">ملاحظات عن العميل</label>
                <input
                  type="text"
                  value={customerEditData.notes || ''}
                  onChange={(e) => setCustomerEditData({ ...customerEditData, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 mt-2">
              <span className="font-extrabold text-slate-800 block text-xs">بيانات الضامن المتضامن (للتقسيط المباشر):</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-600 mb-0.5">اسم الضامن</label>
                  <input
                    type="text"
                    value={customerEditData.guarantor_name || ''}
                    onChange={(e) => setCustomerEditData({ ...customerEditData, guarantor_name: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 mb-0.5">رقم هاتف الضامن</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={customerEditData.guarantor_phone || ''}
                    onChange={(e) => setCustomerEditData({ ...customerEditData, guarantor_phone: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono text-right"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-600 mb-0.5">قومي الضامن</label>
                  <input
                    type="text"
                    dir="ltr"
                    maxLength={14}
                    value={customerEditData.guarantor_national_id || ''}
                    onChange={(e) => setCustomerEditData({ ...customerEditData, guarantor_national_id: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono text-right"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 mb-0.5">صلة القرابة</label>
                  <select
                    value={customerEditData.guarantor_relation || 'أخ'}
                    onChange={(e) => setCustomerEditData({ ...customerEditData, guarantor_relation: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 font-bold"
                  >
                    <option value="أب">أب</option>
                    <option value="أم">أم</option>
                    <option value="أخ">أخ</option>
                    <option value="أخت">أخت</option>
                    <option value="زوج">زوج / زوجة</option>
                    <option value="ابن">ابن / ابنة</option>
                    <option value="قريب">قريب / نسيب</option>
                    <option value="صديق / زميل عمل">صديق / زميل عمل</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowCustomerEditModal(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={savingCustomerEdit}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer transition shadow-md"
              >
                {savingCustomerEdit ? 'جاري الحفظ...' : 'حفظ بيانات العميل'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

    {/* Direct Installment Contract Printing & Mandatory Approval Gate (Requirement 9) */}
    {showContractApprovalModal && (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-6 text-slate-800 text-xs">
          {/* Header */}
          <div className="flex items-center gap-3 pb-3 border-b border-slate-200 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-base text-slate-900">
                إجراءات إتمام عقد التقسيط المباشر وإيصالات الأمانة
              </h4>
              <p className="text-[11px] text-slate-500">
                المرحلة الإلزامية: طباعة مسودة العقد والموافقة القانونية قبل الحفظ النهائي
              </p>
            </div>
          </div>

          {/* Contract Summary Box */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 mb-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 text-xs">
              <span className="font-extrabold text-slate-800">العميل (المشتري): {customerName}</span>
              <span className="font-mono text-slate-500" dir="ltr">{customerPhone}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
              <div>
                <span className="text-slate-400 block">إجمالي كاش:</span>
                <span className="font-bold text-slate-800" dir="ltr">{total.toLocaleString()} {currency}</span>
              </div>
              <div>
                <span className="text-slate-400 block">المقدم المسدد:</span>
                <span className="font-bold text-emerald-700" dir="ltr">{downPaymentVal.toLocaleString()} {currency}</span>
              </div>
              <div>
                <span className="text-slate-400 block">المبلغ المقسط:</span>
                <span className="font-bold text-blue-700" dir="ltr">{financedAmount.toLocaleString()} {currency}</span>
              </div>
              <div>
                <span className="text-slate-400 block">نسبة الفائدة:</span>
                <span className="font-bold text-slate-800">{profitRate}%</span>
              </div>
              <div>
                <span className="text-slate-400 block">عدد الشهور:</span>
                <span className="font-bold text-slate-800">{installmentsCount} شهر</span>
              </div>
              <div>
                <span className="text-slate-400 block">القسط الشهري:</span>
                <span className="font-black text-rose-700 text-xs" dir="ltr">{monthlyAmount.toLocaleString()} {currency}</span>
              </div>
            </div>
            {guarantorName && (
              <div className="pt-2 border-t border-slate-200 text-[11px] flex justify-between">
                <span className="text-slate-500">الضامن المتضامن: <strong className="text-slate-800">{guarantorName}</strong> ({guarantorRelation})</span>
                <span className="font-mono text-slate-600" dir="ltr">{guarantorPhone}</span>
              </div>
            )}
          </div>

          {/* Action Step 1: Print Contract */}
          <div className="mb-5 bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between gap-3">
            <div>
              <span className="font-extrabold text-blue-900 block text-xs">
                {contractPrinted ? '✓ تم فتح / طباعة مسودة العقد' : 'الخطوة الأولى: طباعة مسودة العقد وإيصالات الأمانة'}
              </span>
              <span className="text-[11px] text-blue-700 block mt-0.5">
                يجب طباعة العقد ومراجعته وتوقيعه من العميل والضامن قبل الاعتماد
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowDraftPrintModal(true);
                setContractPrinted(true);
              }}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-black text-xs transition-all shadow-md cursor-pointer whitespace-nowrap ${
                contractPrinted
                  ? 'bg-blue-700 hover:bg-blue-800 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white animate-pulse'
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>{contractPrinted ? 'إعادة طباعة العقد' : 'طباعة مسودة العقد الآن'}</span>
            </button>
          </div>

          {/* Action Step 2: Confirmation Prompt */}
          <div className="border-t border-slate-200 pt-4 space-y-3">
            <div className="bg-amber-50 border border-amber-300 p-3 rounded-xl text-center">
              <p className="font-black text-slate-900 text-xs mb-1">
                هل تم الانتهاء من الموافقة على شروط عقد التقسيط والتوقيع على إيصالات الأمانة بالكامل؟
              </p>
              <p className="text-[11px] text-slate-500">
                في حالة اختيار (نعم) سيتم خصم الأجهزة من المخزن واعتماد الفاتورة نهائياً. في حالة (لا) سيتم إلغاء الإتمام والاحتفاظ بالفاتورة.
              </p>
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowContractApprovalModal(false);
                }}
                className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 font-bold border border-slate-200 hover:border-rose-300 transition cursor-pointer text-center"
              >
                لا - لم تتم الموافقة (إلغاء إتمام العملية)
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!contractPrinted) {
                    alert('تنبيه: يجب أولاً الضغط على زر (طباعة مسودة العقد الآن) لمراجعته مع العميل قبل التأكيد.');
                    return;
                  }
                  setShowContractApprovalModal(false);
                  executeSaleSubmission();
                }}
                className={`flex-1 py-3 rounded-xl font-black text-white shadow-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  contractPrinted
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                    : 'bg-emerald-600/60 hover:bg-emerald-600 shadow-none'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>نعم - تمت الموافقة وتوقيع العقد (إتمام البيع)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Printable Draft Contract Viewer */}
    {showDraftPrintModal && (
      <ContractPrint
        plan={draftPlan}
        settings={settings}
        onClose={() => setShowDraftPrintModal(false)}
      />
    )}
  </div>
  );
}
