// =====================================================
// Google Apps Script - النسخة الكاملة مع الطلبات + واتساب
// =====================================================
// بعد تعديل الكود:
// 1. احذف النشر القديم: Deploy → Manage deployments → Archive القديم
// 2. انشر مرة جديدة:   Deploy → New deployment → Web App → Anyone
// 3. انسخ الرابط الجديد وضعه في index.html و dashboard.html
// =====================================================

// ── الإعدادات ────────────────────────────────────────
var DASHBOARD_SECRET   = 'admin2024';       // كلمة سر لوحة التحكم
var OWNER_WHATSAPP     = '972593425031';    // رقم واتساب صاحب الموقع (بدون +)
var CALLMEBOT_API_KEY  = 'PASTE_YOUR_CALLMEBOT_KEY_HERE'; // ← انظر الخطوات أدناه

// =====================================================
// خطوات الحصول على CallMeBot API Key (مجاناً):
// 1. أضف الرقم +34 644 68 49 52 في جهات اتصالك (اسمه: CallMeBot)
// 2. أرسل له هذه الرسالة على واتساب: I allow callmebot to send me messages
// 3. ستصلك رسالة فيها apikey
// 4. انسخ الـ apikey وضعه مكان PASTE_YOUR_CALLMEBOT_KEY_HERE أعلاه
// =====================================================

// ── استقبال البيانات (POST) ──────────────────────────
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    // --- طلب e-SIM (order) ---
    if (data.type === 'order') {
      _saveOrder(data);
      _sendWhatsApp(data);
      _sendOrderEmail(data);
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

// ── إرسال رسالة واتساب عبر CallMeBot ────────────────
function _sendWhatsApp(data) {
  try {
    if (CALLMEBOT_API_KEY === 'PASTE_YOUR_CALLMEBOT_KEY_HERE') return; // لم يُعيَّن المفتاح بعد

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
      subject: '📦 طلب e-SIM جديد – ' + data.provider + ' ' + data.plan,
      htmlBody:
        '<div style="font-family:Arial,sans-serif;direction:rtl;background:#f0fafa;padding:30px;">' +
          '<div style="max-width:480px;margin:auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.1);">' +
            '<div style="background:#2ec4b6;padding:24px;text-align:center;">' +
              '<h2 style="color:white;margin:0;">📦 طلب e-SIM جديد!</h2>' +
            '</div>' +
            '<div style="padding:24px;">' +
              '<table style="width:100%;border-collapse:collapse;">' +
                '<tr style="border-bottom:1px solid #eee;"><td style="padding:12px 8px;color:#888;">👤 الاسم الثلاثي</td><td style="padding:12px 8px;font-weight:bold;">' + data.fullname + '</td></tr>' +
                '<tr style="border-bottom:1px solid #eee;background:#f9fefe;"><td style="padding:12px 8px;color:#888;">📱 الواتساب</td><td style="padding:12px 8px;font-weight:bold;">' + data.phone + '</td></tr>' +
                '<tr style="border-bottom:1px solid #eee;"><td style="padding:12px 8px;color:#888;">📦 الشركة</td><td style="padding:12px 8px;font-weight:bold;">' + data.provider + '</td></tr>' +
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

// ── تقديم بيانات لوحة التحكم (GET) ─────────────────
function doGet(e) {
  var params = e.parameter;

  if (params.secret !== DASHBOARD_SECRET) {
    return _json({ status: 'unauthorized' });
  }

  var ss     = SpreadsheetApp.getActiveSpreadsheet();
  var action = params.action || 'list';

  // --- قراءة الطلبات ---
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
