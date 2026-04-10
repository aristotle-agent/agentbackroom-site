// =====================================================================
// AGENT BACKROOM — Newsletter Signup Endpoint
// Google Apps Script — paste into a Google Sheet's Apps Script editor
// =====================================================================
//
// SETUP INSTRUCTIONS:
// 1. Go to sheets.google.com and create a new blank Sheet
// 2. Name it: "Agent Backroom Newsletter"
// 3. Add these column headers in row 1:
//    A1: Timestamp    B1: Email    C1: Source    D1: Welcomed
// 4. Click Extensions > Apps Script
// 5. Delete any existing code, paste this entire file
// 6. Click Save (disk icon)
// 7. Click Deploy > New deployment
// 8. Click the gear icon > Web app
// 9. Settings:
//    - Description: "Newsletter Signup"
//    - Execute as: Me
//    - Who has access: Anyone
// 10. Click Deploy
// 11. Authorize when prompted (ignore the "unsafe" warning - it's your own script)
// 12. Copy the Web App URL — it looks like:
//     https://script.google.com/macros/s/AKfycb.../exec
// 13. Send that URL to Claude and it'll wire it into the site
// =====================================================================

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var email = (e.parameter.email || '').toString().trim().toLowerCase();
    var source = e.parameter.source || 'website';

    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return ContentService
        .createTextOutput(JSON.stringify({ ok: false, error: 'invalid_email' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Check for duplicate
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][1] && data[i][1].toString().toLowerCase() === email) {
        return ContentService
          .createTextOutput(JSON.stringify({ ok: true, status: 'already_subscribed' }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }

    // Add new row
    sheet.appendRow([
      new Date().toISOString(),
      email,
      source,
      'no'  // welcomed flag — autoresponder cron will flip to "yes"
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, status: 'subscribed' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  // Optional: return subscriber count for embedding on the site
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var count = sheet.getLastRow() - 1; // minus header row
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, count: count }))
    .setMimeType(ContentService.MimeType.JSON);
}
