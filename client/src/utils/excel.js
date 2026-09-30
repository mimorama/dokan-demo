import * as XLSX from 'xlsx';

/**
 * Exports data array of objects to an XLSX file and triggers browser download
 */
export function exportToExcel({ data, filename = 'export', sheetName = 'Sheet1', columnWidths = null }) {
  if (!data || data.length === 0) {
    throw new Error('لا توجد بيانات متاحة للتصدير');
  }

  // Create worksheet from JSON
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Set column widths if provided or calculate dynamically
  if (columnWidths) {
    worksheet['!cols'] = columnWidths;
  } else {
    // Dynamic column width calculation based on longest text
    const keys = Object.keys(data[0] || {});
    worksheet['!cols'] = keys.map(k => {
      let maxLen = k.length;
      for (const row of data) {
        const val = row[k] ? String(row[k]) : '';
        if (val.length > maxLen) maxLen = val.length;
      }
      return { wch: Math.min(Math.max(maxLen + 4, 12), 50) };
    });
  }

  // Create workbook and append sheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Write file
  const fullFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  XLSX.writeFile(workbook, fullFilename);
}

/**
 * Reads an uploaded XLSX/XLS file and returns parsed JSON array
 */
export function readExcelFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('الرجاء اختيار ملف Excel صالح'));
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          throw new Error('ملف Excel فارغ ولا يحتوي على صفحات عمل');
        }

        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!json || json.length === 0) {
          throw new Error('الصفحة الأولى بالملف فارغة أو لا تحتوي على صفوف بيانات صالحة');
        }

        resolve(json);
      } catch (err) {
        reject(new Error(`فشل قراءة ملف Excel: ${err.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('خطأ أثناء قراءة الملف من الجهاز'));
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Generates and triggers download of Sample Products XLSX Template
 */
export function downloadProductsTemplate() {
  const sampleProducts = [
    {
      'اسم الجهاز *': 'ثلاجة شارب 18 قدم نوفروست انفرتر ديجيتال',
      'الموديل': 'SJ-PC58A-ST',
      'الباركود': '4974019123456',
      'القسم / الفئة': 'ثلاجات وديب فريزر',
      'الماركة': 'شارب (Sharp)',
      'سعر التكلفة': 24000,
      'سعر الكاش': 28500,
      'سعر التقسيط': 33000,
      'مدة الضمان بالشهور': 120,
      'شركة الضمان والصيانة': 'العربي جروب (19319)',
      'الرصيد / الكمية الأولية': 5,
      'حد النواقص الأدنى': 2,
      'المواصفات الفنية': 'لون سيلفر - شاشة ديجيتال تحكم ذكي - تكنولوجيا البلازما كلاستر لمنع الروائح'
    },
    {
      'اسم الجهاز *': 'شاشة ال جي 55 بوصة سمارت 4K UHD ريسيفر داخلي',
      'الموديل': '55UQ75006LF',
      'الباركود': '8806091234567',
      'القسم / الفئة': 'شاشات وتلفزيونات',
      'الماركة': 'إل جي (LG)',
      'سعر التكلفة': 16500,
      'سعر الكاش': 19800,
      'سعر التقسيط': 22500,
      'مدة الضمان بالشهور': 24,
      'شركة الضمان والصيانة': 'توكيل ال جي مصر (19960)',
      'الرصيد / الكمية الأولية': 8,
      'حد النواقص الأدنى': 3,
      'المواصفات الفنية': 'معالج a5 Gen5 ذكي - نظام WebOS - ريموت ماجيك سحري - صوت محيطي Ultra Stadium'
    },
    {
      'اسم الجهاز *': 'غسالة ملابس تورنيدو 10 كيلو هاف أوتوماتيك حوضين',
      'الموديل': 'TWH-Z10DNE-W',
      'الباركود': '6221155098765',
      'القسم / الفئة': 'غسالات ملابس وأطباق',
      'الماركة': 'تورنيدو (Tornado)',
      'سعر التكلفة': 5200,
      'سعر الكاش': 6300,
      'سعر التقسيط': 7200,
      'مدة الضمان بالشهور': 60,
      'شركة الضمان والصيانة': 'العربي جروب (19319)',
      'الرصيد / الكمية الأولية': 4,
      'حد النواقص الأدنى': 2,
      'المواصفات الفنية': 'طلمبة صرف - مروحة مضادة للبكتيريا - هيكل بلاستيكي قوي مقاوم للصدمات والصدأ'
    }
  ];

  exportToExcel({
    data: sampleProducts,
    filename: 'نموذج_استيراد_الأجهزة_والأصناف_معرض_دكان_عبدالعزيز',
    sheetName: 'الأجهزة_والأصناف'
  });
}

/**
 * Generates and triggers download of Sample Suppliers XLSX Template
 */
export function downloadSuppliersTemplate() {
  const sampleSuppliers = [
    {
      'اسم المورد / المسؤول *': 'م. أحمد عبد الرحيم',
      'اسم الشركة الموزعة': 'مجموعة العربي للتجارة والصناعة',
      'رقم الهاتف *': '01012345678',
      'رقم هاتف إضافي': '0225789000',
      'العنوان / المقر': 'المنطقة الصناعية - قويسنا - المنوفية',
      'الرصيد المالي الحالي': 0,
      'ملاحظات': 'الموزع المعتمد لأجهزة توشيبا، شارب، تورنيدو، وسوني'
    },
    {
      'اسم المورد / المسؤول *': 'أ. طارق عبد الوهاب',
      'اسم الشركة الموزعة': 'شركة راية للتوزيع والتجارة',
      'رقم الهاتف *': '01198765432',
      'رقم هاتف إضافي': '19900',
      'العنوان / المقر': 'المبنى الإداري - السادس من أكتوبر - الجيزة',
      'الرصيد المالي الحالي': 15000,
      'ملاحظات': 'موزع رئيسي لشاشات وأجهزة سامسونج وإل جي وبيكو'
    },
    {
      'اسم المورد / المسؤول *': 'الحاج عزت السعيد',
      'اسم الشركة الموزعة': 'شركة فريش إليكتريك للأجهزة المنزلية',
      'رقم الهاتف *': '01234567890',
      'رقم هاتف إضافي': '19059',
      'العنوان / المقر': 'مدينة العاشر من رمضان - الشرقية',
      'الرصيد المالي الحالي': 0,
      'ملاحظات': 'توريد بوتاجازات، شفاطات، وسخانات فريش'
    }
  ];

  exportToExcel({
    data: sampleSuppliers,
    filename: 'نموذج_استيراد_الموردين_والشركات_معرض_دكان_عبدالعزيز',
    sheetName: 'الموردين'
  });
}
