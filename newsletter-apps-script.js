// =====================================================================
// AGENT BACKROOM — Newsletter Signup Endpoint v2 (Phase 2)
// Google Apps Script — paste into the same Sheet's Apps Script editor
// =====================================================================
//
// V2 ADDS:
// - GET ?action=list&since=N — return rows starting at index N (for autoresponder polling)
// - GET ?action=unwelcomed   — return all rows where Welcomed=no (compact form)
// - POST ?action=mark_welcomed&email=... — mark a row as welcomed
//
// SETUP:
// 1. Open the Sheet → Extensions → Apps Script
// 2. REPLACE the existing code with this entire file
// 3. Click Save
// 4. Click Deploy → Manage deployments
// 5. Click the pencil (edit) icon on the existing Web App
// 6. Change Version to "New version", description "v2 — list + mark"
// 7. Click Deploy
// 8. The URL stays the same — no need to update the site
// =====================================================================

function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var action = (e.parameter.action || '').toString();

  // Default: just return count
  if (!action) {
    var count = Math.max(0, sheet.getLastRow() - 1);
    return jsonResponse({ ok: true, count: count });
  }

  if (action === 'list') {
    var since = parseInt(e.parameter.since || '0', 10) || 0;
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var rows = data.slice(1 + since); // skip header + offset
    var out = rows.map(function(r, i) {
      var record = {};
      headers.forEach(function(h, idx) { record[h] = r[idx]; });
      record._index = since + i;
      return record;
    });
    return jsonResponse({ ok: true, count: out.length, rows: out });
  }

  if (action === 'unwelcomed') {
    var data2 = sheet.getDataRange().getValues();
    var headers2 = data2[0];
    var welcomedCol = headers2.indexOf('Welcomed');
    var emailCol = headers2.indexOf('Email');
    if (welcomedCol === -1 || emailCol === -1) {
      return jsonResponse({ ok: false, error: 'missing_columns' });
    }
    var unwelcomed = [];
    for (var i = 1; i < data2.length; i++) {
      var w = (data2[i][welcomedCol] || '').toString().toLowerCase();
      if (w !== 'yes') {
        unwelcomed.push({
          row: i + 1,
          email: data2[i][emailCol],
          timestamp: data2[i][0],
          source: data2[i][2] || 'website'
        });
      }
    }
    return jsonResponse({ ok: true, count: unwelcomed.length, rows: unwelcomed });
  }

  return jsonResponse({ ok: false, error: 'unknown_action' });
}

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var action = (e.parameter.action || '').toString();

    // Mark welcomed action (used by autoresponder)
    if (action === 'mark_welcomed') {
      var email = (e.parameter.email || '').toString().trim().toLowerCase();
      if (!email) return jsonResponse({ ok: false, error: 'missing_email' });

      var data = sheet.getDataRange().getValues();
      var headers = data[0];
      var welcomedCol = headers.indexOf('Welcomed');
      var emailCol = headers.indexOf('Email');
      if (welcomedCol === -1 || emailCol === -1) {
        return jsonResponse({ ok: false, error: 'missing_columns' });
      }

      for (var i = 1; i < data.length; i++) {
        var rowEmail = (data[i][emailCol] || '').toString().toLowerCase();
        if (rowEmail === email) {
          sheet.getRange(i + 1, welcomedCol + 1).setValue('yes');
          return jsonResponse({ ok: true, status: 'marked', row: i + 1 });
        }
      }
      return jsonResponse({ ok: false, error: 'email_not_found' });
    }

    // Default: signup action (from website form)
    var newEmail = (e.parameter.email || '').toString().trim().toLowerCase();
    var source = e.parameter.source || 'website';

    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      return jsonResponse({ ok: false, error: 'invalid_email' });
    }

    var existing = sheet.getDataRange().getValues();
    for (var j = 1; j < existing.length; j++) {
      if (existing[j][1] && existing[j][1].toString().toLowerCase() === newEmail) {
        return jsonResponse({ ok: true, status: 'already_subscribed' });
      }
    }

    sheet.appendRow([
      new Date().toISOString(),
      newEmail,
      source,
      'no'
    ]);

    return jsonResponse({ ok: true, status: 'subscribed' });
  } catch (err) {
    return jsonResponse({ ok: false, error: err.toString() });
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
