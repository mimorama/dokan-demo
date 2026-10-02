const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = __dirname;
const stagingDir = path.join(rootDir, 'staging_release');
const zipOutput = path.join(rootDir, 'Dokan_Release_v3.2.zip');

console.log('🚀 Preparing Offline Release v3.2.0...');

if (fs.existsSync(stagingDir)) {
  fs.rmSync(stagingDir, { recursive: true, force: true });
}
if (fs.existsSync(zipOutput)) {
  fs.rmSync(zipOutput, { force: true });
}

fs.mkdirSync(stagingDir, { recursive: true });

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const child of fs.readdirSync(src)) {
      copyRecursive(path.join(src, child), path.join(dest, child));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

// 1. Copy client/dist
console.log('📦 Copying client/dist...');
fs.mkdirSync(path.join(stagingDir, 'client'), { recursive: true });
copyRecursive(path.join(rootDir, 'client', 'dist'), path.join(stagingDir, 'client', 'dist'));

// 2. Copy server/
console.log('📦 Copying server files...');
copyRecursive(path.join(rootDir, 'server'), path.join(stagingDir, 'server'));

// 3. Copy node_modules/
console.log('📦 Copying production node_modules...');
copyRecursive(path.join(rootDir, 'node_modules'), path.join(stagingDir, 'node_modules'));

// 4. Copy individual files
const filesToCopy = [
  'dokan.db',
  'package.json',
  'package-lock.json',
  'README.md',
  'DEPLOYMENT_GUIDE.md',
  'Logo.png',
  'Run_Dokan.bat',
  'Run_LAN_Server.bat',
  'Configure_Firewall_Port_5959.bat',
  'تشغيل_البرنامج.bat',
  'تشغيل_السيرفر_المحلي.bat',
  'دليل_الاستخدام.md',
  'دليل_التشغيل_على_سيرفر_محلي.md',
  'دليل_النشر_المجاني_أونلاين.md',
  'فتح_منفذ_جدار_الحماية_Firewall.bat',
  'مشاركة_رابط_تجريبي_أونلاين.bat'
];

for (const file of filesToCopy) {
  const src = path.join(rootDir, file);
  if (fs.existsSync(src)) {
    console.log(`📄 Copying ${file}...`);
    fs.copyFileSync(src, path.join(stagingDir, file));
  } else {
    console.warn(`⚠️ Warning: ${file} not found!`);
  }
}

// 5. Compress using PowerShell System.IO.Compression.ZipFile with UTF-8 encoding
console.log('🗜️ Compressing into Dokan_Release_v3.2.zip (with UTF-8 file names)...');
const psCommand = `powershell -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::CreateFromDirectory('${stagingDir}', '${zipOutput}', [System.IO.Compression.CompressionLevel]::Optimal, $false, [System.Text.Encoding]::UTF8)"`;
execSync(psCommand, { stdio: 'inherit' });

// 6. Clean up staging
console.log('🧹 Cleaning up staging directory...');
fs.rmSync(stagingDir, { recursive: true, force: true });

const sizeMB = (fs.statSync(zipOutput).size / (1024 * 1024)).toFixed(2);
console.log(`✅ Success! Created Dokan_Release_v3.2.zip (${sizeMB} MB)`);
