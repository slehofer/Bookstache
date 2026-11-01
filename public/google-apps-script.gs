// Bookstache: paste into Extensions > Apps Script in your Google spreadsheet.
// Set the spreadsheet ID, then deploy as a web app: execute as yourself,
// access: Anyone. Keep the deployment URL private; it permits appending rows.
const SPREADSHEET_ID = 'VLOZTE_ID_TABULKY';

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.event !== 'book_added' || !data.book ||
        typeof data.book.title !== 'string' || !data.book.title.trim()) {
      throw new Error('Invalid book payload');
    }
    lock.waitLock(10000);
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName('Bookstache') || spreadsheet.insertSheet('Bookstache');
    const headers = ['ISBN', 'Název', 'Autor', 'Nakladatelství', 'Rok vydání',
      'Cílová skupina', 'Jazyk', 'Žánr', 'Počet stran', 'Popis', 'Zdroj dat', 'Datum uložení'];
    if (sheet.getLastRow() === 0) sheet.appendRow(headers);
    const b = data.book;
    const values = [b.isbn, b.title, b.author, b.publisher, b.year,
      b.targetAgeGroup, b.language, b.genre, b.pages, b.description, b.addedBy, data.timestamp];
    // Keep ISBNs as text and prevent metadata being interpreted as formulas.
    const row = values.map(function (value) {
      return "'" + String(value == null ? '' : value);
    });
    sheet.getRange(sheet.getLastRow() + 1, 1, 1, row.length).setValues([row]);
    SpreadsheetApp.flush();
    return jsonResponse({ ok: true });
  } catch (error) {
    console.error(error);
    return jsonResponse({ ok: false });
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
