const db = require('./server/db');

db.prepare(`
  UPDATE settings SET
    store_name = 'معرض دكان عبد العزيز للأجهزة الكهربائية',
    tagline = 'ثلاجات - غسالات - شاشات - تكييفات - كاش وبالتقسيط المريح',
    address = 'شارع الأزهر - أمام مجمع المحاكم - القاهرة',
    phone = '01023456789',
    phone2 = '01123456789'
  WHERE id = 1
`).run();

console.log('✅ تم تحديث اسم المعرض وبياناته إلى دكان عبد العزيز بنجاح!');
