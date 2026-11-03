import { convertToIsbn13, parseKnihovnyRecord } from './bookService';
import { shortBookDescription } from './bookDescription';

const normalize = (text) => String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export const sameBook = (a, b) => a.id === b.id || Boolean(a.isbn && b.isbn && convertToIsbn13(a.isbn) === convertToIsbn13(b.isbn));
const isbnFrom = (values = []) => values.map(value => convertToIsbn13(String(value))).find(value => /^\d{13}$/.test(value)) || '';
const defaults = () => ({ isbn: '', publisher: '', year: '', pages: '', genre: '', language: '', description: '', coverUrl: '', targetAgeGroup: 'Všechny věkové kategorie', isAvailable: true, borrowedBy: null, dueDate: null, isFound: true, createdAt: new Date().toISOString() });

async function readJson(url, signal) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) controller.abort();
  const timeout = setTimeout(abort, 8000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
  }
}

async function googleSearch(term, field, signal) {
  const q = field === 'all' ? term : `${field === 'title' ? 'intitle' : 'inauthor'}:${term}`;
  const params = new URLSearchParams({ q, maxResults: '20', printType: 'books' });
  const data = await readJson(`https://www.googleapis.com/books/v1/volumes?${params}`, signal);
  return (data.items || []).filter(item => item.id && item.volumeInfo?.title).map(item => {
    const info = item.volumeInfo;
    const identifiers = info.industryIdentifiers || [];
    const isbn = isbnFrom(identifiers.filter(i => ['ISBN_13', 'ISBN_10'].includes(i.type)).map(i => i.identifier));
    return {
      ...defaults(), id: isbn ? `book-${isbn}` : `google-${item.id}`, isbn,
      title: info.title, author: info.authors?.join(', ') || 'Neznámý autor',
      publisher: info.publisher || '', year: info.publishedDate?.slice(0, 4) || '',
      pages: info.pageCount || '', genre: info.categories?.[0] || '',
      language: info.language === 'cs' ? 'Čeština' : info.language === 'en' ? 'Angličtina' : info.language || '',
      targetAgeGroup: info.maturityRating === 'MATURE' ? 'Dospělí (18+)' : 'Všechny věkové kategorie',
      description: shortBookDescription(info.description),
      coverUrl: (info.imageLinks?.thumbnail || '').replace(/^http:/, 'https:'),
      apiSource: 'Google Books'
    };
  });
}

async function openLibrarySearch(term, field, signal) {
  const params = new URLSearchParams({ [field === 'all' ? 'q' : field]: term, limit: '20', fields: 'key,title,author_name,isbn,publisher,first_publish_year,language,cover_i' });
  const data = await readJson(`https://openlibrary.org/search.json?${params}`, signal);
  if (!Array.isArray(data.docs)) throw new Error('Invalid Open Library response');
  return data.docs.filter(doc => doc.key && doc.title).map(doc => {
    const isbn = isbnFrom(doc.isbn);
    return {
      ...defaults(), id: isbn ? `book-${isbn}` : `openlibrary-${doc.key}`, isbn,
      title: doc.title, author: doc.author_name?.join(', ') || 'Neznámý autor',
      publisher: doc.publisher?.[0] || '', year: String(doc.first_publish_year || ''),
      language: doc.language?.includes('cze') ? 'Čeština' : doc.language?.[0] || '',
      coverUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : '',
      apiSource: 'Open Library'
    };
  });
}

async function knihovnySearch(term, field, signal) {
  const params = new URLSearchParams({ lookfor: term, type: field === 'title' ? 'Title' : field === 'author' ? 'Author' : 'AllFields', limit: '20' });
  for (const name of ['id', 'title', 'authors', 'publishers', 'publicationDates', 'physicalDescriptions', 'isbns', 'summary']) params.append('field[]', name);
  const data = await readJson(`https://www.knihovny.cz/api/v1/search?${params}`, signal);
  if (!Array.isArray(data.records)) throw new Error('Invalid Knihovny.cz response');
  return data.records.filter(record => record.id && record.title).map(record => {
    const isbn = isbnFrom(record.isbns);
    return {
      ...parseKnihovnyRecord(record, isbn), isbn, apiSource: 'Knihovny.cz', coverUrl: '',
      year: String(record.publicationDates?.[0] || '').match(/\d{4}/)?.[0] || '',
      pages: /\d+\s*(s\.|stran|p\.)/i.test(record.physicalDescriptions?.[0] || '') ? parseKnihovnyRecord(record, isbn).pages : ''
    };
  });
}

export async function searchBooks(query, field = 'all', { signal, localBooks = [] } = {}) {
  const term = query.trim();
  if (term.length < 2) return { books: [], warning: '' };
  // Independent providers: Google rate limits or CORS failures must not reduce search to saved books.
  const providers = await Promise.allSettled([
    knihovnySearch(term, field, signal), openLibrarySearch(term, field, signal), googleSearch(term, field, signal)
  ]);
  if (signal?.aborted) throw new DOMException('Vyhledávání zrušeno', 'AbortError');
  const online = providers.filter(result => result.status === 'fulfilled');
  const words = normalize(term).split(/\s+/);
  const local = localBooks.filter(book => {
    const text = normalize(field === 'title' ? book.title : field === 'author' ? book.author : `${book.title} ${book.author}`);
    return words.every(word => text.includes(word));
  }).map(book => ({ ...book, apiSource: 'Váš katalog' }));
  const books = [...online.flatMap(result => result.value), ...local];
  return {
    books: books.filter((book, index) => books.findIndex(other => sameBook(book, other)) === index),
    warning: online.length === 0
      ? 'Online katalogy se nepodařilo načíst. Zobrazené knihy jsou pouze z vašeho katalogu. Zkuste hledání znovu nebo vložte novou knihu ručně.'
      : ''
  };
}
