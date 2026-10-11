import { sanitizeIsbn } from './barcodeScanner.js';

// Convert ISBN-10 to 13-digit ISBN or return clean 13-digit ISBN
export function convertToIsbn13(isbnStr) {
  const clean = sanitizeIsbn(isbnStr);
  if (!clean) return '';

  // If already 13 digits
  if (clean.length === 13) {
    return clean;
  }

  // If 10 digits, convert to 13-digit format (prepend 978 and recalculate check digit)
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

// Clean cataloguing punctuation from string (e.g., "Argo,", "Praha :", "[Praha] :")
export function cleanPunctuation(str) {
  if (!str) return '';
  return str
    .replace(/^[\s,:/;\-[\]]+/, '')
    .replace(/[\s,:/;\-[\]]+$/, '')
    .trim();
}

// Clean author name (strip birth/death years like "Josef Prokop, 1971-" -> "Josef Prokop")
export function cleanAuthorName(authorKey) {
  if (!authorKey) return '';
  return authorKey
    .replace(/,?\s*(asi\s*)?\d{3,4}\s*-\s*\d{0,4}.*$/i, '')
    .replace(/,?\s*\d{3,4}-.*$/i, '')
    .replace(/,?\s*\d{3,4}$/i, '')
    .trim();
}

// Extract 4-digit year from string ("c2010" -> "2010", "[2025]" -> "2025")
export function extractYear(dateStr) {
  if (!dateStr) return new Date().getFullYear().toString();
  const match = dateStr.match(/\d{4}/);
  return match ? match[0] : new Date().getFullYear().toString();
}

// Extract page count from physical descriptions ("218 s. : il." -> 218)
export function extractPageCount(descStr) {
  if (!descStr) return 200;
  const match = descStr.match(/(\d+)\s*(s\.|stran|p\.)/i);
  return match ? parseInt(match[1], 10) : 200;
}

// Default mock database with realistic Czech library books for fallbacks
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

// Parse Knihovny.cz record into normalized Book object
export function parseKnihovnyRecord(record, targetIsbn13) {
  if (!record) return null;

  // Title
  const rawTitle = record.title || 'Neznámý název';
  const title = cleanPunctuation(rawTitle);

  // Authors (Primary + Secondary)
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

  // Publisher
  const rawPublisher = record.publishers?.[0] || 'Neznámé nakladatelství';
  const publisher = cleanPunctuation(rawPublisher);

  // Year
  const year = extractYear(record.publicationDates?.[0]);

  // Pages
  const pages = extractPageCount(record.physicalDescriptions?.[0]);

  // ISBN
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
    createdAt: new Date().toISOString()
  };
}

// Fetch book details from Knihovny.cz API directly from browser
export async function fetchBookDetailsByIsbn(code) {
  const isbn13 = convertToIsbn13(code);

  // Check mock database first for sample ISBNs or immediate hits
  const existingMock = INITIAL_MOCK_BOOKS.find(b => b.isbn === isbn13);
  if (existingMock) {
    return { ...existingMock };
  }

  // Attempt to fetch from Knihovny.cz API directly from browser
  const API_FIELDS = [
    'id',
    'title',
    'authors',
    'publishers',
    'placesOfPublication',
    'publicationDates',
    'physicalDescriptions',
    'isbns',
    'issns',
    'cnb',
    'formats'
  ];

  const params = new URLSearchParams({
    lookfor: isbn13,
    type: 'ISN',
    limit: '10'
  });

  for (const f of API_FIELDS) {
    params.append('field[]', f);
  }

  const url = 'https://www.knihovny.cz/api/v1/search?' + params.toString();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const records = data.records ?? [];

      if (records.length > 0) {
        // Find record whose isbns array actually contains searched 13-digit ISBN
        const matchingRecord = records.find(r =>
          Array.isArray(r.isbns) && r.isbns.some(i => convertToIsbn13(i) === isbn13)
        );

        if (matchingRecord) {
          return parseKnihovnyRecord(matchingRecord, isbn13);
        } else {
          // If none explicitly matched, take the first record if records exist
          return parseKnihovnyRecord(records[0], isbn13);
        }
      }
    }
  } catch (err) {
    console.warn('Knihovny.cz API fetch attempt ended (network or timeout):', err);
  }

  // Fallback for unlisted / offline barcodes
  return {
    id: `book-${isbn13 || Date.now()}`,
    isbn: isbn13 || '9780000000000',
    title: `Naskenovaná kniha (Kód: ${isbn13 || code})`,
    author: 'Nespecifikovaný autor',
    publisher: 'České nakladatelství',
    year: new Date().getFullYear().toString(),
    targetAgeGroup: 'Pro všechny čtenáře',
    language: 'Čeština',
    genre: 'Beletrie',
    pages: 200,
    description: 'Detailní parametry knihy můžete před uložením upravit.',
    coverUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80',
    isAvailable: true,
    borrowedBy: null,
    dueDate: null,
    addedBy: 'Scanner',
    createdAt: new Date().toISOString()
  };
}
