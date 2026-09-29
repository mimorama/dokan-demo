# 🏪 معرض دكان للأجهزة الكهربائية والتقسيط (Dokan Appliances POS & Management)

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/mimorama/dokan-demo)

نظام متكامل لإدارة معارض ومحلات الأجهزة الكهربائية، يدعم تتبع السيريال نمبر، المبيعات كاش وبالتقسيط المباشر والبنكي، إدارة الفروع والمخازن، الورديات، والتقارير المالية.

---

## ⚡ التشغيل المباشر من GitHub (Direct Run on GitHub)

يمكنك تشغيل هذا المشروع مباشرة من متصفحك داخل **GitHub** مجاناً بالكامل عبر خدمة **GitHub Codespaces**:

1. اضغط على الزر أعلاه **[Open in GitHub Codespaces](https://codespaces.new/mimorama/dokan-demo)** (أو اضغط على زر **Code** الأخضر ثم اختر تبويب **Codespaces** ثم **Create codespace on main**).
2. سيقوم GitHub تلقائياً بإنشاء بيئة سحابية وتثبيت الحزم وبناء المشروع.
3. في نافذة الأوامر (Terminal) بالأسفل، اكتب الأمر:
   ```bash
   npm start
   ```
4. ستظهر لك نافذة منبثقة فوراً بها زر **"Open in Browser"** لفتح واجهة البرنامج وتجربتها كاملة!

---

## 🔑 حسابات الدخول التجريبية (Demo Logins)

| الدور (Role) | اسم المستخدم (Username) | كلمة المرور (Password) |
|---|---|---|
| **المدير العام (Admin)** | `admin` | `123` |
| **مدير فرع (Manager)** | `faisal_mgr` | `123` |
| **الكاشير (Cashier)** | `cashier1` | `123` |
| **أمين المستودع (Storekeeper)** | `store1` | `123` |
| **المحاسب (Accountant)** | `accountant1` | `123` |

---

## 💻 التشغيل محلياً على جهازك (Run Locally)

```bash
# تثبيت الحزم
npm install
npm --prefix client install

# بناء واجهة المستخدم
npm run build

# تشغيل الخادم
npm start
```

الرابط المحلي: [http://localhost:5959](http://localhost:5959)
