import { convertToIsbn13 } from './bookService.js';

// Auto-export a single book row or full catalog to a downloadable CSV file automatically saved to device
export function exportBookToExternalCsvFile(book) {
  if (!book) return;

  const headers = [
    'ISBN',
    'Název',
    'Autor',
    'Nakladatelství',
    'Rok vydání',
    'Cílová skupina',
    'Jazyk',
    'Žánr',
    'Počet stran',
    'Zdroj dat',
    'Datum uložení'
  ];

  const row = [
    `"${book.isbn || ''}"`,
    `"${book.title || ''}"`,
    `"${book.author || ''}"`,
    `"${book.publisher || ''}"`,
    `"${book.year || ''}"`,
    `"${book.targetAgeGroup || ''}"`,
    `"${book.language || ''}"`,
    `"${book.genre || ''}"`,
    `"${book.pages || ''}"`,
    `"${book.addedBy || 'Bookstache'}"`,
    `"${new Date().toLocaleString('cs-CZ')}"`
  ];

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), row.join(';')].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `knihovna_externi_zaznam_${book.isbn || Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Send saved book to an external Webhook or online Google Sheets Apps Script endpoint
export async function sendBookToExternalEndpoint(endpointUrl, book, role) {
  if (!endpointUrl || !endpointUrl.trim() || !book) {
    return { success: false, error: 'Chybí URL adresa Webhooku / Google Apps Scriptu nebo data knihy.' };
  }

  const payload = {
    event: 'sync_book',
    timestamp: new Date().toISOString(),
    userRole: role || 'unknown',
    book: {
      id: book.id || `book-${book.isbn || Date.now()}`,
      isbn: book.isbn || '',
      barcode: book.barcode || book.isbn || '',
      title: book.title || '',
      author: book.author || '',
      publisher: book.publisher || '',
      year: book.year || '',
      language: book.language || 'Čeština',
      genre: book.genre || '',
      targetAgeGroup: book.targetAgeGroup || '',
      availabilityStatus: book.isAvailable ? 'Dostupná' : 'Vypůjčená',
      addedDate: book.addedDate || new Date().toISOString().split('T')[0],
      description: book.description || ''
    }
  };

  try {
    const response = await fetch(endpointUrl.trim(), {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8' // Compatible with Google Apps Script CORS
      },
      body: JSON.stringify(payload)
    });

    if (response.ok || response.type === 'opaque') {
      return { success: true };
    } else {
      return { success: false, error: `HTTP chyba ${response.status}: ${response.statusText}` };
    }
  } catch (err) {
    console.warn('Nepodařilo se odeslat záznam do Google Sheets / Webhooku:', err);
    return { success: false, error: err.message || 'Chyba při komunikaci s Webhookem' };
  }
}
