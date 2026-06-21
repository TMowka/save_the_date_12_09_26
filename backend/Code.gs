/**
 * Save-the-date RSVP backend (Google Apps Script).
 *
 * Receives a POST with the RSVP form from the wedding site, appends a row
 * to a Google Sheet and emails the submission.
 *
 * Deploy and wiring to the site — see backend/SETUP.md.
 */

/* ============================== CONFIG ============================== */

// Where to send emails with new submissions.
var NOTIFY_EMAIL = "YOUR_EMAIL@example.com";

// Sheet name (created automatically if missing).
var SHEET_NAME = "RSVP";

// Form fields: [key from the form, label in the sheet/email].
// Order defines the column order. menu and drinks arrive as arrays.
var FIELDS = [
  ["name",         "Имя"],
  ["attendance",   "Присутствие"],
  ["transfer",     "Трансфер"],
  ["menu",         "Меню"],
  ["menu_other",   "Меню (другое)"],
  ["allergy",      "Аллергия"],
  ["allergy_text", "Аллергия (детали)"],
  ["drinks",       "Напитки"],
  ["drinks_other", "Напитки (другое)"],
  ["wishes",       "Пожелания"]
];

/* =============================== LOGIC ============================== */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    saveToSheet(data);
    sendEmail(data);
    return jsonOut({ ok: true });
  } catch (err) {
    return jsonOut({ ok: false, error: String(err) });
  }
}

// Field value as a string (arrays joined by comma).
function val(data, key) {
  var v = data[key];
  if (Array.isArray(v)) return v.join(", ");
  return v == null ? "" : String(v);
}

function saveToSheet(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

  // Header row on first run.
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Дата"].concat(FIELDS.map(function (f) { return f[1]; })));
  }

  var row = [new Date()].concat(FIELDS.map(function (f) { return val(data, f[0]); }));
  sheet.appendRow(row);
}

function sendEmail(data) {
  var lines = FIELDS.map(function (f) {
    return f[1] + ": " + (val(data, f[0]) || "—");
  }).join("\n");

  var name = val(data, "name") || "Гость";
  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    subject: "RSVP: " + name,
    body: "Новая анкета со свадебного сайта:\n\n" + lines
  });
}

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
