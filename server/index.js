const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const os = require('os');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 5959;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API Routes
app.use('/api', routes);

// Serve frontend build if it exists (robust check for release & dev structures)
const possibleDistPaths = [
  path.join(__dirname, '..', 'client', 'dist'),
  path.join(__dirname, '..', 'public'),
  path.join(__dirname, '..', 'dist'),
  path.join(__dirname, 'public'),
  path.join(__dirname, 'dist')
];
const distPath = possibleDistPaths.find(p => fs.existsSync(p)) || possibleDistPaths[0];
app.use(express.static(distPath));

// For SPA routing fallback to index.html (Express 5 compatible)
app.use((req, res, next) => {
  if (req.method !== 'GET' || req.path.startsWith('/api')) {
    return next();
  }
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.status(200).send(`
    <html dir="rtl" style="font-family: sans-serif; text-align: center; padding: 50px;">
      <h2>نظام إدارة معرض الأجهزة الكهربائية (Backend API شغال بنجاح)</h2>
      <p>واجهة المستخدم قيد التشغيل عبر Vite على الرابط: <a href="http://localhost:5173">http://localhost:5173</a></p>
    </html>
  `);
});

// Helper to find Local IP on Wi-Fi/LAN
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

const server = app.listen(PORT, '0.0.0.0', () => {
  const localIp = getLocalIp();
  console.log('====================================================');
  console.log('🚀 خادم نظام معرض الأجهزة الكهربائية يعمل بنجاح!');
  console.log(`💻 من هذا الكمبيوتر: http://localhost:${PORT}`);
  console.log(`📱 من هواتف وكمبيوترات المحل (على نفس شبكة الواي فاي): http://${localIp}:${PORT}`);
  console.log('====================================================');
});
