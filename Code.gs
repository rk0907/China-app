/**
 * ============================================================
 *  KAYA — Google Apps Script Backend
 * ============================================================
 *  HOW TO USE:
 *  1. Create a Google Sheet (see SETUP steps in SETUP.md)
 *  2. Extensions → Apps Script
 *  3. Delete any default code, paste THIS ENTIRE FILE
 *  4. Save → Deploy → New deployment → Web app
 *     - Execute as: Me
 *     - Who has access: Anyone
 *  5. Copy the Web App URL
 *  6. Paste that URL into request.html and admin.html
 *     where it says: const API = '...'
 * ============================================================
 */

// Sheet tab names — must match exactly
var REQUESTS_SHEET = 'Requests';
var ORDERS_SHEET = 'Orders';

// Column headers for Requests (row 1)
var REQUEST_HEADERS = [
  'id', 'created', 'status', 'name', 'whatsapp', 'location',
  'category', 'item', 'description', 'quantity', 'budget',
  'size', 'colour', 'items'
];

// Column headers for Orders (row 1)
var ORDER_HEADERS = [
  'id', 'created', 'request_id', 'customer', 'whatsapp', 'item',
  'quantity', 'amount', 'product_ghs', 'commission_ghs', 'airfreight_ghs',
  'cost_china', 'cost_currency', 'payment_status'
];

/**
 * GET  ?action=listRequests
 * GET  ?action=listOrders
 * POST body JSON: { action: 'submitRequest' | 'updateStatus' | 'createOrder' | 'confirmPayment', ... }
 */
function doGet(e) {
  return handleRequest(e, null);
}

function doPost(e) {
  var body = null;
  try {
    if (e && e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }
  } catch (err) {
    return json_({ success: false, error: 'Invalid JSON body' });
  }
  return handleRequest(e, body);
}

function handleRequest(e, body) {
  try {
    var action = (body && body.action) || (e && e.parameter && e.parameter.action) || '';

    if (action === 'listRequests') {
      return json_({ success: true, requests: listRows_(REQUESTS_SHEET, REQUEST_HEADERS) });
    }
    if (action === 'listOrders') {
      return json_({ success: true, orders: listRows_(ORDERS_SHEET, ORDER_HEADERS) });
    }
    if (action === 'submitRequest') {
      return json_(submitRequest_(body));
    }
    if (action === 'updateStatus') {
      return json_(updateStatus_(body));
    }
    if (action === 'createOrder') {
      return json_(createOrder_(body));
    }
    if (action === 'confirmPayment') {
      return json_(confirmPayment_(body));
    }
    if (action === 'ping') {
      return json_({ success: true, message: 'KAYA API is live' });
    }

    return json_({ success: false, error: 'Unknown action: ' + action });
  } catch (err) {
    return json_({ success: false, error: String(err) });
  }
}

// ─── Requests ───────────────────────────────────────────────

function submitRequest_(data) {
  ensureSheet_(REQUESTS_SHEET, REQUEST_HEADERS);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(REQUESTS_SHEET);

  var id = 'SR-' + new Date().getFullYear() + '-' + String(Date.now()).slice(-6);
  var itemsVal = data.items || '';
  if (itemsVal && typeof itemsVal !== 'string') {
    try { itemsVal = JSON.stringify(itemsVal); } catch (e) { itemsVal = ''; }
  }
  var row = [
    id,
    new Date().toISOString(),
    'NEW',
    data.name || '',
    data.whatsapp || '',
    data.location || '',
    data.category || '',
    data.item || data.item_summary || '',
    data.description || '',
    Number(data.quantity) || 1,
    data.budget || data.budget_ghs || '',
    data.size || '',
    data.colour || '',
    itemsVal
  ];
  sheet.appendRow(row);

  return { success: true, requestId: id };
}

function updateStatus_(data) {
  if (!data.id || !data.status) {
    return { success: false, error: 'id and status required' };
  }
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(REQUESTS_SHEET);
  if (!sheet) return { success: false, error: 'Requests sheet missing' };

  var values = sheet.getDataRange().getValues();
  var headers = values[0];
  var idCol = headers.indexOf('id');
  var statusCol = headers.indexOf('status');
  if (idCol < 0 || statusCol < 0) return { success: false, error: 'Missing columns' };

  for (var i = 1; i < values.length; i++) {
    if (String(values[i][idCol]) === String(data.id)) {
      sheet.getRange(i + 1, statusCol + 1).setValue(data.status);
      return { success: true };
    }
  }
  return { success: false, error: 'Request not found' };
}

// ─── Orders ─────────────────────────────────────────────────

function createOrder_(data) {
  ensureSheet_(ORDERS_SHEET, ORDER_HEADERS);
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ORDERS_SHEET);

  var id = data.id || ('ORD-' + new Date().getFullYear() + '-' + String(Date.now()).slice(-5));
  var row = [
    id,
    new Date().toISOString(),
    data.request_id || '',
    data.customer || '',
    data.whatsapp || '',
    data.item || '',
    Number(data.quantity) || 1,
    Number(data.amount) || 0,
    Number(data.product_ghs) || 0,
    Number(data.commission_ghs) || 0,
    Number(data.airfreight_ghs) || 0,
    Number(data.cost_china) || 0,
    data.cost_currency || 'RMB',
    data.payment_status || 'AWAITING'
  ];
  sheet.appendRow(row);

  // Also mark request as ACCEPTED if request_id provided
  if (data.request_id) {
    updateStatus_({ id: data.request_id, status: 'ACCEPTED' });
  }

  return { success: true, orderId: id };
}

function confirmPayment_(data) {
  if (!data.id) return { success: false, error: 'id required' };
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ORDERS_SHEET);
  if (!sheet) return { success: false, error: 'Orders sheet missing' };

  var values = sheet.getDataRange().getValues();
  var headers = values[0];
  var idCol = headers.indexOf('id');
  var payCol = headers.indexOf('payment_status');
  if (idCol < 0 || payCol < 0) return { success: false, error: 'Missing columns' };

  for (var i = 1; i < values.length; i++) {
    if (String(values[i][idCol]) === String(data.id)) {
      sheet.getRange(i + 1, payCol + 1).setValue('CONFIRMED');
      return { success: true };
    }
  }
  return { success: false, error: 'Order not found' };
}

// ─── Helpers ────────────────────────────────────────────────

function listRows_(sheetName, expectedHeaders) {
  ensureSheet_(sheetName, expectedHeaders);
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];

  var headers = values[0].map(function (h) { return String(h).trim(); });
  var rows = [];
  for (var i = 1; i < values.length; i++) {
    var obj = {};
    for (var c = 0; c < headers.length; c++) {
      var key = headers[c];
      if (!key) continue;
      var val = values[i][c];
      // Dates → ISO string
      if (Object.prototype.toString.call(val) === '[object Date]') {
        val = val.toISOString();
      }
      obj[key] = val;
    }
    // Normalise common field aliases for frontend
    if (obj.budget !== undefined && obj.budget_ghs === undefined) obj.budget_ghs = obj.budget;
    if (obj.item && !obj.item_summary) obj.item_summary = obj.item;
    rows.push(obj);
  }
  // Newest first
  rows.reverse();
  return rows;
}

function ensureSheet_(name, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    return;
  }
  // If empty, add headers
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  }
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
