import { sanitizeIsbn } from './barcodeScanner.js';

// Global cache and pending requests map to prevent duplicate requests
const isbnCache = new Map();
const pendingRequests = new Map();
let googleBooksThrottledUntil = 0;

// Convert ISBN-10 to 13-digit ISBN or return clean 13-digit ISBN
export function convertToIsbn13(isbnStr) {
  const clean = sanitizeIsbn(isbnStr);
  if (!clean) return '';

  if (clean.length === 13) {
    return clean;
  }

  if (clean.length === 10) {
    const base = '978' + clean.substring(0, 9);
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(base[i], 10);
      sum += (i % 2 === 0) ? digit : digit * 3;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return base + checkDigit;
  }

  return clean;
}

// Clean cataloguing punctuation from string (e.g., "Argo,", "Praha :")
export function cleanPunctuation(str) {
  if (!str) return '';
  return str
    .replace(/^[\s,:/;\-[\]]+/, '')
    .replace(/[\s,:/;\-[\]]+$/, '')
    .trim();
}

// Clean author name
export function cleanAuthorName(authorKey) {
  if (!authorKey) return '';
  return authorKey
    .replace(/,?\s*(asi\s*)?\d{3,4}\s*-\s*\d{0,4}.*$/i, '')
    .replace(/,?\s*\d{3,4}-.*$/i, '')
    .replace(/,?\s*\d{3,4}$/i, '')
    .trim();
}

// Extract 4-digit year from string
export function extractYear(dateStr) {
  if (!dateStr) return new Date().getFullYear().toString();
  const match = dateStr.match(/\d{4}/);
  return match ? match[0] : new Date().getFullYear().toString();
}

// Extract page count
export function extractPageCount(descStr) {
  if (!descStr) return 200;
  const match = descStr.match(/(\d+)\s*(s\.|stran|p\.)/i);
  return match ? parseInt(match[1], 10) : 200;
}

// Default mock database with realistic Czech library books
export const INITIAL_MOCK_BOOKS = [
  {
    id: 'book-9788025703670',
    isbn: '9788025703670',
    title: 'Životy slavných a starých provensálských básníků',
    author: 'Jean de Nostredame',
    publisher: 'Argo',
    year: '2011',
    targetAgeGroup: 'Mládež a dospělí (12+)',
    language: 'Čeština',
    genre: 'Klasická literatura & Historie',
    pages: 218,
    description: 'Životy slavných a starých provensálských básníků, kteří žili v dobách hrabat z kraje Provença.',
    coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80',
    isAvailable: true,
    borrowedBy: null,
    dueDate: null,
    addedBy: 'Librarian',
    createdAt: new Date('2024-01-15').toISOString()
  },
  {
    id: 'book-9788020719805',
    isbn: '9788020719805',
    title: 'Babička',
    author: 'Božena Němcová',
    publisher: 'Odeon',
    year: '2020',
    targetAgeGroup: 'Mládež a dospělí (12+)',
    language: 'Čeština',
    genre: 'Klasická literatura',
    pages: 280,
    description: 'Nezapomenutelný obraz české vesnice 19. století a moudré babičky, která ovlivnila životy lidí v údolí.',
    coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80',
    isAvailable: true,
    borrowedBy: null,
    dueDate: null,
    addedBy: 'Librarian',
    createdAt: new Date('2024-01-15').toISOString()
  },
  {
    id: 'book-9788073816216',
    isbn: '9788073816216',
    title: 'Malý princ',
    author: 'Antoine de Saint-Exupéry',
    publisher: 'Albatros',
    year: '2019',
    targetAgeGroup: 'Děti a mládež (7-15 let)',
    language: 'Čeština',
    genre: 'Pohádky & Filosofie',
    pages: 96,
    description: 'Příběh malého prince, který putuje po planetách a učí lidi vidět srdcem to, co je očím neviditelné.',
    coverUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80',
    isAvailable: false,
    borrowedBy: 'Jan Novák',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    addedBy: 'Librarian',
    createdAt: new Date('2024-02-01').toISOString()
  },
  {
    id: 'book-9788025726242',
    isbn: '9788025726242',
    title: '1984',
    author: 'George Orwell',
    publisher: 'Argo',
    year: '2021',
    targetAgeGroup: 'Dospělí (18+)',
    language: 'Čeština',
    genre: 'Sci-Fi & Dystopie',
    pages: 320,
    description: 'Slavný antiutopický román o totalitním režimu pod dohledem Velkého bratra.',
    coverUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&q=80',
    isAvailable: true,
    borrowedBy: null,
    dueDate: null,
    addedBy: 'Librarian',
    createdAt: new Date('2024-02-10').toISOString()
  },
  {
    id: 'book-9788074914101',
    isbn: '9788074914101',
    title: 'Hobit aneb Cesta tam a zase zpátky',
    author: 'J. R. R. Tolkien',
    publisher: 'Argo',
    year: '2018',
    targetAgeGroup: 'Mládež a dospělí (10+)',
    language: 'Čeština',
    genre: 'Fantasy',
    pages: 350,
    description: 'Předchůdce Pána prstenů sleduje dobrodružnou výpravu hobita Bilba Pytlíka k Osamělé hoře.',
    coverUrl: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=400&q=80',
    isAvailable: true,
    borrowedBy: null,
    dueDate: null,
    addedBy: 'Librarian',
    createdAt: new Date('2024-03-05').toISOString()
  }
];

// Parse Knihovny.cz record
export function parseKnihovnyRecord(record, targetIsbn13) {
  if (!record) return null;

  const rawTitle = record.title || 'Neznámý název';
  const title = cleanPunctuation(rawTitle);

  let primaryAuthors = [];
  if (record.authors?.primary) {
    primaryAuthors = Object.keys(record.authors.primary).map(cleanAuthorName).filter(Boolean);
  }
  let secondaryAuthors = [];
  if (record.authors?.secondary) {
    secondaryAuthors = Object.keys(record.authors.secondary).map(cleanAuthorName).filter(Boolean);
  }

  const author = primaryAuthors.length > 0
    ? primaryAuthors.join(', ')
    : secondaryAuthors.length > 0
      ? secondaryAuthors.join(', ')
      : 'Neznámý autor';

  const rawPublisher = record.publishers?.[0] || 'Neznámé nakladatelství';
  const publisher = cleanPunctuation(rawPublisher);
  const year = extractYear(record.publicationDates?.[0]);
  const pages = extractPageCount(record.physicalDescriptions?.[0]);

  let isbn = targetIsbn13 || '9780000000000';
  if (record.isbns && record.isbns.length > 0) {
    const matched = record.isbns.find(i => convertToIsbn13(i) === targetIsbn13);
    if (matched) {
      isbn = convertToIsbn13(matched);
    } else {
      isbn = convertToIsbn13(record.isbns[0]) || targetIsbn13;
    }
  }

  return {
    id: record.id ? `book-${record.id.replace(/[^a-zA-Z0-9]/g, '-')}` : `book-${Date.now()}`,
    isbn,
    title,
    author,
    publisher,
    year,
    targetAgeGroup: 'Mládež a dospělí (12+)',
    language: 'Čeština',
    genre: 'Knihovny.cz katalog',
    pages,
    description: `Záznam z veřejného katalogu Knihovny.cz (ID: ${record.id || 'N/A'}).`,
    coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80',
    isAvailable: true,
    borrowedBy: null,
    dueDate: null,
    addedBy: 'Knihovny.cz API',
    createdAt: new Date().toISOString(),
    isFound: true,
    apiSource: 'Knihovny.cz API'
  };
}

// Internal implementation of ISBN search with multi-source fallback, HTTP 429 bypass, and deduplication
async function performIsbnLookup(code) {
  const isbn13 = convertToIsbn13(code);
  const diagnostics = [];

  // Check mock database first
  const existingMock = INITIAL_MOCK_BOOKS.find(b => b.isbn === isbn13);
  if (existingMock) {
    return {
      ...existingMock,
      isFound: true,
      apiSource: 'Místní databáze',
      diagnostics: ['Kniha nalezena v místní databázi.']
    };
  }

  // 1. Google Books API
  if (Date.now() < googleBooksThrottledUntil) {
    diagnostics.push('Google Books API je dočasně pozastaveno z důvodu překročení limitu požadavků (HTTP 429). Byla využita záloha.');
  } else {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const googleRes = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn13}`, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (googleRes.status === 429) {
        googleBooksThrottledUntil = Date.now() + 60000; // throttle Google Books for 60 seconds
        diagnostics.push('Google Books API vrátilo HTTP 429 (Too Many Requests). Automaticky přepínám na alternativní zdroj.');
      } else if (googleRes.ok) {
        const data = await googleRes.json();
        if (data.totalItems > 0 && data.items[0].volumeInfo) {
          const info = data.items[0].volumeInfo;
          return {
            id: `book-${isbn13 || Date.now()}`,
            isbn: isbn13 || code,
            title: info.title || 'Neznámý název',
            author: info.authors ? info.authors.join(', ') : 'Neznámý autor',
            publisher: info.publisher || 'Neznámé nakladatelství',
            year: info.publishedDate ? info.publishedDate.substring(0, 4) : new Date().getFullYear().toString(),
            targetAgeGroup: info.maturityRating === 'MATURE' ? 'Dospělí (18+)' : 'Všechny věkové kategorie',
            language: info.language === 'cs' ? 'Čeština' : info.language === 'en' ? 'Angličtina' : info.language || 'Čeština',
            genre: info.categories ? info.categories[0] : 'Beletrie',
            pages: info.pageCount || 200,
            description: info.description || 'Popis knihy z veřejné databáze Google Books.',
            coverUrl: info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&q=80',
            isAvailable: true,
            borrowedBy: null,
            dueDate: null,
            addedBy: 'Google Books API',
            createdAt: new Date().toISOString(),
            isFound: true,
            apiSource: 'Google Books API',
            diagnostics
          };
        } else {
          diagnostics.push('Google Books API: Kniha nebyla v databázi nalezena.');
        }
      } else {
        diagnostics.push(`Google Books API nebylo dostupné (HTTP ${googleRes.status}).`);
      }
    } catch (err) {
      diagnostics.push('Google Books API selhalo nebo vypršel časový limit.');
    }
  }

  // 2. Open Library API
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const olRes = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn13}&format=json&jscmd=data`, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (olRes.ok) {
      const data = await olRes.json();
      const bookKey = `ISBN:${isbn13}`;
      if (data[bookKey]) {
        const info = data[bookKey];
        return {
          id: `book-${isbn13 || Date.now()}`,
          isbn: isbn13 || code,
          title: info.title || 'Neznámý název',
          author: info.authors ? info.authors.map(a => a.name).join(', ') : 'Neznámý autor',
          publisher: info.publishers ? info.publishers.map(p => p.name).join(', ') : 'Neznámé nakladatelství',
          year: info.publish_date ? info.publish_date.slice(-4) : new Date().getFullYear().toString(),
          targetAgeGroup: 'Mládež a dospělí',
          language: 'Čeština',
          genre: info.subjects ? info.subjects[0].name : 'Všeobecná literatura',
          pages: info.number_of_pages || 180,
          description: 'Informace získány z databáze Open Library.',
          coverUrl: info.cover?.large || info.cover?.medium || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80',
          isAvailable: true,
          borrowedBy: null,
          dueDate: null,
          addedBy: 'Open Library API',
          createdAt: new Date().toISOString(),
          isFound: true,
          apiSource: 'Open Library API',
          diagnostics
        };
      } else {
        diagnostics.push('Open Library API: Kniha nebyla v databázi nalezena.');
      }
    } else {
      diagnostics.push(`Open Library API nebylo dostupné (HTTP ${olRes.status}).`);
    }
  } catch (err) {
    diagnostics.push('Open Library API selhalo nebo vypršel časový limit.');
  }

  // 3. Knihovny.cz API
  const API_FIELDS = [
    'id', 'title', 'authors', 'publishers', 'placesOfPublication',
    'publicationDates', 'physicalDescriptions', 'isbns', 'issns', 'cnb', 'formats'
  ];
  const params = new URLSearchParams({ lookfor: isbn13, type: 'ISN', limit: '10' });
  for (const f of API_FIELDS) params.append('field[]', f);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const kniRes = await fetch('https://www.knihovny.cz/api/v1/search?' + params.toString(), { signal: controller.signal });
    clearTimeout(timeoutId);

    if (kniRes.ok) {
      const data = await kniRes.json();
      const records = data.records ?? [];
      if (records.length > 0) {
        const matchingRecord = records.find(r =>
          Array.isArray(r.isbns) && r.isbns.some(i => convertToIsbn13(i) === isbn13)
        );
        const recordToUse = matchingRecord || records[0];
        const parsed = parseKnihovnyRecord(recordToUse, isbn13);
        if (parsed) {
          return {
            ...parsed,
            diagnostics
          };
        }
      } else {
        diagnostics.push('Knihovny.cz API: Kniha nebyla v databázi nalezena.');
      }
    } else {
      diagnostics.push(`Knihovny.cz API nebylo dostupné (HTTP ${kniRes.status}).`);
    }
  } catch (err) {
    diagnostics.push('Knihovny.cz API selhalo nebo vypršel časový limit.');
  }

  // If no API found real metadata, explicitly mark as NOT found so app does NOT present generic record as successful match
  return {
    id: `book-${isbn13 || Date.now()}`,
    isbn: isbn13 || code || '9780000000000',
    title: '',
    author: '',
    publisher: '',
    year: new Date().getFullYear().toString(),
    targetAgeGroup: 'Pro všechny čtenáře',
    language: 'Čeština',
    genre: 'Beletrie',
    pages: 200,
    description: '',
    coverUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80',
    isAvailable: true,
    borrowedBy: null,
    dueDate: null,
    addedBy: 'Ruční vložení',
    createdAt: new Date().toISOString(),
    isFound: false,
    diagnostics
  };
}

// Public fetchBookDetailsByIsbn with request deduplication and result caching
export async function fetchBookDetailsByIsbn(code) {
  const isbn13 = convertToIsbn13(code);

  if (isbnCache.has(isbn13)) {
    return isbnCache.get(isbn13);
  }

  if (pendingRequests.has(isbn13)) {
    return pendingRequests.get(isbn13);
  }

  const promise = performIsbnLookup(code)
    .then((result) => {
      isbnCache.set(isbn13, result);
      pendingRequests.delete(isbn13);
      return result;
    })
    .catch((err) => {
      pendingRequests.delete(isbn13);
      throw err;
    });

  pendingRequests.set(isbn13, promise);
  return promise;
}
