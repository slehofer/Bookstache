import { INITIAL_MOCK_BOOKS, convertToIsbn13 } from './bookService';
import { shortBookDescription } from './bookDescription';

const normalize = (text) => String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export const sameBook = (a, b) => a.id === b.id || Boolean(a.isbn && b.isbn && convertToIsbn13(a.isbn) === convertToIsbn13(b.isbn));

export async function searchBooks(query, field = 'all', { signal, localBooks = [] } = {}) {
  const term = query.trim();
  if (term.length < 2) return { books: [], warning: '' };
  const words = normalize(term).split(/\s+/);
  const books = [...localBooks, ...INITIAL_MOCK_BOOKS].filter(book => {
    const text = normalize(field === 'title' ? book.title : field === 'author' ? book.author : `${book.title} ${book.author}`);
    return words.every(word => text.includes(word));
  });
  let warning = '';
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) controller.abort();
  const timeout = setTimeout(abort, 10000);
  try {
    const q = field === 'all' ? term : `${field === 'title' ? 'intitle' : 'inauthor'}:${term}`;
    const params = new URLSearchParams({ q, maxResults: '20', printType: 'books' });
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?${params}`, { signal: controller.signal });
    if (!response.ok) throw new Error('Search unavailable');
    const data = await response.json();
    for (const item of data.items || []) {
      const info = item.volumeInfo;
      if (!info?.title || !item.id) continue;
      const identifiers = info.industryIdentifiers || [];
      const isbn = convertToIsbn13(identifiers.find(i => i.type === 'ISBN_13')?.identifier || identifiers.find(i => i.type === 'ISBN_10')?.identifier || '');
      books.push({
        id: isbn ? `book-${isbn}` : `google-${item.id}`, isbn,
        title: info.title, author: info.authors?.join(', ') || 'Neznámý autor',
        publisher: info.publisher || '', year: info.publishedDate?.slice(0, 4) || '',
        pages: info.pageCount || '', genre: info.categories?.[0] || '',
        language: info.language === 'cs' ? 'Čeština' : info.language === 'en' ? 'Angličtina' : info.language || '',
        targetAgeGroup: info.maturityRating === 'MATURE' ? 'Dospělí (18+)' : 'Všechny věkové kategorie',
        description: shortBookDescription(info.description),
        coverUrl: (info.imageLinks?.thumbnail || '').replace(/^http:/, 'https:'),
        isAvailable: true, borrowedBy: null, dueDate: null, isFound: true,
        apiSource: 'Google Books', createdAt: new Date().toISOString()
      });
    }
  } catch (error) {
    if (signal?.aborted) throw error;
    warning = 'Online vyhledávání není dostupné. Zobrazeny jsou pouze výsledky z místní databáze. Zkuste hledání znovu.';
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
  }
  return { books: books.filter((book, index) => books.findIndex(other => sameBook(book, other)) === index), warning };
}
