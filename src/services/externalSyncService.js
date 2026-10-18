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

// Send saved book to an external Webhook or online Google Sheets script endpoint
export async function sendBookToExternalEndpoint(endpointUrl, book, role) {
  if (!endpointUrl || !endpointUrl.trim() || !book) return false;

  const payload = {
    event: 'book_added',
    timestamp: new Date().toISOString(),
    userRole: role || 'unknown',
    book: {
      isbn: book.isbn,
      title: book.title,
      author: book.author,
      publisher: book.publisher,
      year: book.year,
      targetAgeGroup: book.targetAgeGroup,
      language: book.language,
      genre: book.genre,
      pages: book.pages,
      description: book.description,
      addedBy: book.addedBy || role
    }
  };

  try {
    const response = await fetch(endpointUrl.trim(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    return response.ok;
  } catch (err) {
    console.warn('Nepodařilo se odeslat záznam na externí Webhook:', err);
    return false;
  }
}
