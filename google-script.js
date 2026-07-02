// =====================================================
// Google Apps Script - النسخة الكاملة مع الطلبات + واتساب + تعديل الأسعار
// =====================================================

// ── الإعدادات ────────────────────────────────────────
var DASHBOARD_SECRET   = 'admin2024';       // كلمة سر لوحة التحكم
var OWNER_WHATSAPP     = '972593425031';    // رقم واتساب صاحب الموقع (بدون +)
var CALLMEBOT_API_KEY  = 'PASTE_YOUR_CALLMEBOT_KEY_HERE'; 

// ── استقبال البيانات (POST) ──────────────────────────
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    // --- طلب e-SIM أو SIM (order) ---
    if (data.type === 'order') {
      _saveOrder(data);
      _sendWhatsApp(data);
      _sendOrderEmail(data);
      return _json({ status: 'success' });
    }

    // --- تجديد اشتراك (renew_sim) ---
    if (data.type === 'renew_sim') {
      _saveRenewal(data);
      _sendRenewalWhatsApp(data);
      return _json({ status: 'success' });
    }

    // --- تسجيل عادي (registration) ---
    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = _getOrCreateSheet(ss, 'التسجيلات', ['ID','اسم المستخدم','البريد الإلكتروني','رقم الهاتف','التاريخ'], '#E05555');

    var id   = Utilities.getUuid();
    var date = data.date || new Date().toLocaleString('ar-SA');
    sheet.appendRow([id, data.username, data.email, data.phone || 'لم يُدخل', date]);
    _colorRow(sheet, sheet.getLastRow(), 5);
    _sendRegEmail(data, id);

    return _json({ status: 'success', id: id });

  } catch (err) {
    return _json({ status: 'error', message: err.toString() });
  }
}

// ── حفظ الطلب في شيت "الطلبات" ──────────────────────
function _saveOrder(data) {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = _getOrCreateSheet(ss, 'الطلبات',
    ['ID','الاسم الثلاثي','رقم الواتساب','الشركة','الباقة','السعر','التاريخ'],
    '#2ec4b6');

  var id   = Utilities.getUuid();
  var date = new Date().toLocaleString('ar-SA');
  sheet.appendRow([id, data.fullname, data.phone, data.provider, data.plan, data.price, date]);
  _colorRow(sheet, sheet.getLastRow(), 7);
}

// ── حفظ طلب التجديد في شيت "التجديدات" ─────────────────
function _saveRenewal(data) {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = _getOrCreateSheet(ss, 'التجديدات',
    ['ID', 'الرقم السري (Serial)', 'رقم الهاتف', 'التاريخ'],
    '#2ec4b6');

  var id   = Utilities.getUuid();
  var date = new Date().toLocaleString('ar-SA');
  sheet.appendRow([id, data.serial, data.phone, date]);
  _colorRow(sheet, sheet.getLastRow(), 4);
}

// ── إرسال إشعار تجديد عبر واتساب CallMeBot ─────────────
function _sendRenewalWhatsApp(data) {
  try {
    if (CALLMEBOT_API_KEY === 'PASTE_YOUR_CALLMEBOT_KEY_HERE') return;

    var msg =
      '🔄 *طلب تجديد اشتراك الشريحة*\n' +
      '━━━━━━━━━━━━━━\n' +
      '🔢 *الرقم السري (Serial):* ' + data.serial + '\n' +
      '📱 *رقم الهاتف:* ' + data.phone + '\n' +
      '💰 *السعر:* 70 ₪\n' +
      '🕐 *التاريخ:* ' + new Date().toLocaleString('ar-SA') + '\n' +
      '━━━━━━━━━━━━━━';

    var url = 'https://api.callmebot.com/whatsapp.php' +
              '?phone='  + OWNER_WHATSAPP +
              '&text='   + encodeURIComponent(msg) +
              '&apikey=' + CALLMEBOT_API_KEY;

    UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  } catch(err) { /* تجاهل */ }
}

// ── إرسال رسالة واتساب عبر CallMeBot ────────────────
function _sendWhatsApp(data) {
  try {
    if (CALLMEBOT_API_KEY === 'PASTE_YOUR_CALLMEBOT_KEY_HERE') return;

    var msg =
      '🔔 *طلب جديد!*\n' +
      '━━━━━━━━━━━━━━\n' +
      '👤 *الاسم:* ' + data.fullname + '\n' +
      '📱 *الواتساب:* ' + data.phone + '\n' +
      '📦 *الباقة:* ' + data.provider + '\n' +
      '💾 *الحجم:* ' + data.plan + '\n' +
      '💰 *السعر:* ' + data.price + '\n' +
      '🕐 *التاريخ:* ' + new Date().toLocaleString('ar-SA') + '\n' +
      '━━━━━━━━━━━━━━';

    var url = 'https://api.callmebot.com/whatsapp.php' +
              '?phone='  + OWNER_WHATSAPP +
              '&text='   + encodeURIComponent(msg) +
              '&apikey=' + CALLMEBOT_API_KEY;

    UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  } catch(err) { /* تجاهل أخطاء الواتساب */ }
}

// ── إرسال إيميل الطلب ────────────────────────────────
function _sendOrderEmail(data) {
  try {
    var ownerEmail = Session.getActiveUser().getEmail();
    var sheetUrl   = 'https://docs.google.com/spreadsheets/d/' +
                     SpreadsheetApp.getActiveSpreadsheet().getId();

    MailApp.sendEmail({
      to: ownerEmail,
      subject: '📦 طلب شريحة جديد – ' + data.provider + ' ' + data.plan,
      htmlBody:
        '<div style="font-family:Arial,sans-serif;direction:rtl;background:#f0fafa;padding:30px;">' +
          '<div style="max-width:480px;margin:auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.1);">' +
            '<div style="background:#2ec4b6;padding:24px;text-align:center;">' +
              '<h2 style="color:white;margin:0;">📦 طلب شريحة جديد!</h2>' +
            '</div>' +
            '<div style="padding:24px;">' +
              '<table style="width:100%;border-collapse:collapse;">' +
                '<tr style="border-bottom:1px solid #eee;"><td style="padding:12px 8px;color:#888;">👤 الاسم الثلاثي</td><td style="padding:12px 8px;font-weight:bold;">' + data.fullname + '</td></tr>' +
                '<tr style="border-bottom:1px solid #eee;background:#f9fefe;"><td style="padding:12px 8px;color:#888;">📱 الواتساب</td><td style="padding:12px 8px;font-weight:bold;">' + data.phone + '</td></tr>' +
                '<tr style="border-bottom:1px solid #eee;"><td style="padding:12px 8px;color:#888;">📦 الشركة (النوع)</td><td style="padding:12px 8px;font-weight:bold;">' + data.provider + '</td></tr>' +
                '<tr style="border-bottom:1px solid #eee;background:#f9fefe;"><td style="padding:12px 8px;color:#888;">💾 الباقة</td><td style="padding:12px 8px;font-weight:bold;">' + data.plan + '</td></tr>' +
                '<tr><td style="padding:12px 8px;color:#888;">💰 السعر</td><td style="padding:12px 8px;font-weight:bold;color:#2ec4b6;">' + data.price + '</td></tr>' +
              '</table>' +
            '</div>' +
            '<div style="padding:0 24px 28px;text-align:center;">' +
              '<a href="' + sheetUrl + '" style="display:inline-block;background:#2ec4b6;color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:bold;">📊 افتح الشيت</a>' +
            '</div>' +
          '</div>' +
        '</div>'
    });
  } catch(e) { /* تجاهل أخطاء الإيميل */ }
}

// ── تقديم بيانات لوحة التحكم والأسعار العامة (GET) ───
function doGet(e) {
  var params = e.parameter;
  var action = params.action || 'list';
  var ss     = SpreadsheetApp.getActiveSpreadsheet();

  // --- 1. جلب الأسعار بشكل علني للموقع الرئيسي (لا يتطلب كلمة سر) ---
  if (action === 'get_prices') {
    var sheet = _initPricesSheet(ss);
    var rows = sheet.getDataRange().getValues();
    var prices = {};
    for (var i = 1; i < rows.length; i++) {
      prices[rows[i][0]] = rows[i][4]; // Map ID -> Price
    }
    return _json({ status: 'success', prices: prices });
  }

  // --- 2. التحقق من أمان لوحة التحكم للعمليات الأخرى ---
  if (params.secret !== DASHBOARD_SECRET) {
    return _json({ status: 'unauthorized' });
  }

  // --- قراءة الطلبات المسجلة ---
  if (action === 'list') {
    var sheet = ss.getSheetByName('الطلبات');
    var data  = [];

    if (sheet && sheet.getLastRow() > 1) {
      var rows = sheet.getDataRange().getValues();
      for (var i = 1; i < rows.length; i++) {
        data.push({
          id:       rows[i][0],
          fullname: rows[i][1],
          phone:    rows[i][2],
          provider: rows[i][3],
          plan:     rows[i][4],
          price:    rows[i][5],
          date:     rows[i][6]
        });
      }
    }

    var today      = new Date().toLocaleDateString('ar-SA');
    var todayCount = data.filter(function(r) {
      return r.date && r.date.toString().indexOf(today) !== -1;
    }).length;

    return _json({
      status:     'success',
      total:      data.length,
      todayCount: todayCount,
      data:       data
    });
  }

  // --- قراءة التجديدات المسجلة ---
  if (action === 'list_renewals') {
    var sheet = ss.getSheetByName('التجديدات');
    var data  = [];

    if (sheet && sheet.getLastRow() > 1) {
      var rows = sheet.getDataRange().getValues();
      for (var i = 1; i < rows.length; i++) {
        data.push({
          id:     rows[i][0],
          serial: rows[i][1],
          phone:  rows[i][2],
          date:   rows[i][3]
        });
      }
    }

    return _json({
      status: 'success',
      data:   data
    });
  }

  // --- حذف طلب ---
  if (action === 'delete' && params.id) {
    var sheetName = params.sheet || 'الطلبات';
    var s = ss.getSheetByName(sheetName);
    if (!s) return _json({ status: 'not_found' });
    var rows2 = s.getDataRange().getValues();
    for (var j = 1; j < rows2.length; j++) {
      if (rows2[j][0] === params.id) {
        s.deleteRow(j + 1);
        return _json({ status: 'deleted' });
      }
    }
    return _json({ status: 'not_found' });
  }

  // --- جلب تفاصيل الأسعار للوحة الأدمن ---
  if (action === 'list_prices') {
    var sheet = _initPricesSheet(ss);
    var rows = sheet.getDataRange().getValues();
    var list = [];
    for (var i = 1; i < rows.length; i++) {
      list.push({
        id:       rows[i][0],
        type:     rows[i][1],
        provider: rows[i][2],
        plan:     rows[i][3],
        price:    rows[i][4]
      });
    }
    return _json({ status: 'success', data: list });
  }

  // --- تعديل سعر باقة معينة ---
  if (action === 'update_price' && params.id && params.price) {
    var sheet = _initPricesSheet(ss);
    var rows = sheet.getDataRange().getValues();
    for (var k = 1; k < rows.length; k++) {
      if (rows[k][0] === params.id) {
        sheet.getRange(k + 1, 5).setValue(params.price);
        return _json({ status: 'success' });
      }
    }
    return _json({ status: 'not_found' });
  }

  return _json({ status: 'invalid_action' });
}

// ── إرسال إيميل التسجيل العادي ───────────────────────
function _sendRegEmail(data, id) {
  try {
    var ownerEmail = Session.getActiveUser().getEmail();
    var sheetUrl   = 'https://docs.google.com/spreadsheets/d/' +
                     SpreadsheetApp.getActiveSpreadsheet().getId();

    MailApp.sendEmail({
      to: ownerEmail,
      subject: '🔔 تسجيل جديد في Workshop!',
      htmlBody:
        '<div style="font-family:Arial,sans-serif;direction:rtl;background:#f8f8f8;padding:30px;">' +
          '<div style="max-width:480px;margin:auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.1);">' +
            '<div style="background:#E05555;padding:24px;text-align:center;">' +
              '<h2 style="color:white;margin:0;">📋 تسجيل جديد!</h2>' +
            '</div>' +
            '<div style="padding:24px;">' +
              '<table style="width:100%;border-collapse:collapse;">' +
                '<tr><td style="padding:12px 8px;color:#888;">👤 اسم المستخدم</td><td style="padding:12px 8px;font-weight:bold;">' + data.username + '</td></tr>' +
                '<tr style="background:#fafafa;"><td style="padding:12px 8px;color:#888;">📧 البريد</td><td style="padding:12px 8px;font-weight:bold;">' + data.email + '</td></tr>' +
                '<tr><td style="padding:12px 8px;color:#888;">📞 الهاتف</td><td style="padding:12px 8px;font-weight:bold;">' + (data.phone || 'لم يُدخل') + '</td></tr>' +
              '</table>' +
            '</div>' +
            '<div style="padding:0 24px 28px;text-align:center;">' +
              '<a href="' + sheetUrl + '" style="display:inline-block;background:#E05555;color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:bold;">📊 افتح الشيت</a>' +
            '</div>' +
          '</div>' +
        '</div>'
    });
  } catch(e) { /* تجاهل */ }
}

// ── مساعد: إنشاء/جلب شيت ───────────────────────────
function _getOrCreateSheet(ss, name, headers, color) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length)
         .setFontWeight('bold')
         .setBackground(color)
         .setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// ── مساعد: تلوين الصفوف بالتناوب ────────────────────
function _colorRow(sheet, rowNum, cols) {
  if (rowNum % 2 === 0) {
    sheet.getRange(rowNum, 1, 1, cols).setBackground('#f0fafa');
  }
}

// ── مساعد: إرجاع JSON ───────────────────────────────
function _json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── تهيئة وتحديث شيت الأسعار بالقيم الافتراضية ───────
function _initPricesSheet(ss) {
  var sheet = ss.getSheetByName('الأسعار');
  if (!sheet) {
    sheet = ss.insertSheet('الأسعار');
    sheet.appendRow(['معرف الباقة', 'النوع', 'الشركة', 'الباقة', 'السعر']);
    sheet.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#2ec4b6').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
    
    var defaults = [
      ['esim_cellcom_400', 'esim', 'Cellcom', '400 GB', '65'],
      ['esim_cellcom_500', 'esim', 'Cellcom', '500 GB', '70'],
      ['esim_hotmobile_150', 'esim', 'Hot Mobile', '150 GB', '55'],
      ['esim_hotmobile_500', 'esim', 'Hot Mobile', '500 GB', '75'],
      ['esim_pelephone_150', 'esim', 'Pelephone', '150 GB', '50'],
      ['esim_pelephone_300', 'esim', 'Pelephone', '300 GB', '65'],
      ['esim_partner_400', 'esim', 'Partner', '400 GB', '65'],
      ['esim_partner_500', 'esim', 'Partner', '500 GB', '70'],
      ['esim_we_500', 'esim', 'we', '500 GB', '65'],
      ['esim_we_inf', 'esim', 'we', '∞ GB', '80'],
      ['esim_019_100', 'esim', '019', '100 GB', '45'],
      ['esim_019_250', 'esim', '019', '250 GB', '60'],
      
      ['sim_cellcom_400', 'sim', 'Cellcom', '400 GB', '70'],
      ['sim_hotmobile_400', 'sim', 'Hot Mobile', '400 GB', '180'],
      ['sim_pelephone_400', 'sim', 'Pelephone', '400 GB', '180'],
      ['sim_partner_400', 'sim', 'Partner', '400 GB', '150'],
      ['sim_we_400', 'sim', 'we', '400 GB', '80'],
      ['sim_019_400', 'sim', '019', '400 GB', '150']
    ];
    for (var i = 0; i < defaults.length; i++) {
      sheet.appendRow(defaults[i]);
    }
  }
  return sheet;
}
