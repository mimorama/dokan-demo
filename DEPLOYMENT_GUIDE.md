# 🌐 Dokan Appliances Management System - Free Online Demo Deployment Guide

This guide provides two easy ways to publish and host this system online as a live demo for **100% Free** with no credit card required.

---

## ⚡ Option 1: Instant 30-Second Public Demo (From your local machine)
If you want to immediately share the app with a client, partner, or test on your smartphone:

1. Make sure the app is running locally:
   Run `تشغيل_البرنامج.bat` or `npm start` (port 5959).
2. Double-click the new shortcut:
   `مشاركة_رابط_تجريبي_أونلاين.bat`
3. A secure public HTTPS URL will be displayed (e.g. `https://funny-falcon-42.loca.lt`).
4. Share this link to open the app on mobile or desktop anywhere in the world.
   *(Note: The first time the link opens, it asks for the tunnel password. Get it in 1 click at [https://loca.lt/mytunnelpassword](https://loca.lt/mytunnelpassword))*.

---

## ☁️ Option 2: 24/7 Free Cloud Hosting on Render.com
Host the system continuously on cloud infrastructure with your own custom HTTPS subdomain (e.g., `https://dokan-demo.onrender.com`).

### Step 1: Push to a free GitHub repository
1. Create a repository on [GitHub](https://github.com).
2. Push your project:
   ```bash
   git add .
   git commit -m "Initial commit for online demo"
   git remote add origin https://github.com/YOUR_USERNAME/dokan-demo.git
   git push -u origin main
   ```

---

### Step 2: Deploy on Render.com
1. Log in to [Render.com](https://render.com) using your GitHub account.
2. Click **New +** -> **Web Service**.
3. Select your repository `dokan-demo`.
4. Fill in or verify the following configuration:
   - **Name**: `dokan-demo`
   - **Environment**: `Node`
   - **Region**: `Frankfurt (EU)`
   - **Branch**: `main`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: `Free` ($0/month)
5. Click **Deploy Web Service**.

Your live demo URL will be available in 2-3 minutes!

---

## 🔑 Pre-seeded Demo Accounts

| Role | Username | Password | Permissions |
|---|---|---|---|
| **General Manager (Admin)** | `admin` | `123` | Full access to all modules, settings & users |
| **Branch Manager** | `faisal_mgr` | `123` | Sales, warehouses & approvals |
| **Cashier / POS** | `cashier1` | `123` | POS terminal, cash & installment sales |
| **Storekeeper** | `store1` | `123` | Serial tracking, stock transfers |
| **Accountant & Auditor** | `accountant1` | `123` | Shift reconciliations, audit logs & reports |
