import { sanitizeIsbn } from './barcodeScanner';

// Default mock database with realistic Czech library books for fallbacks
export const INITIAL_MOCK_BOOKS = [
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
    title: 'Maly princ',
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
  },
  {
    id: 'book-9788000058428',
    isbn: '9788000058428',
    title: 'R.U.R.',
    author: 'Karel Čapek',
    publisher: 'Albatros',
    year: '2020',
    targetAgeGroup: 'Mládež a dospělí (14+)',
    language: 'Čeština',
    genre: 'Divadelní hra & Sci-Fi',
    pages: 140,
    description: 'Vizionářská hra, která světu dala slovo "robot" a řeší otázku budoucnosti lidstva.',
    coverUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&q=80',
    isAvailable: true,
    borrowedBy: null,
    dueDate: null,
    addedBy: 'Librarian',
    createdAt: new Date('2024-03-12').toISOString()
  }
];

// Fetch book info from external APIs (Google Books / OpenLibrary) with realistic fallback
export async function fetchBookDetailsByIsbn(code) {
  const cleanCode = sanitizeIsbn(code);

  // First check if book already exists in local DB mock sample
  const existingMock = INITIAL_MOCK_BOOKS.find(b => b.isbn === cleanCode);
  if (existingMock) {
    return { ...existingMock, isFromApi: true };
  }

  try {
    // Attempt 1: Google Books API
    const googleRes = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanCode}`);
    if (googleRes.ok) {
      const data = await googleRes.json();
      if (data.totalItems > 0 && data.items[0].volumeInfo) {
        const info = data.items[0].volumeInfo;
        return {
          id: `book-${cleanCode || Date.now()}`,
          isbn: cleanCode || code,
          title: info.title || 'Neznámý název',
          author: info.authors ? info.authors.join(', ') : 'Neznámý autor',
          publisher: info.publisher || 'Neznámé nakladatelství',
          year: info.publishedDate ? info.publishedDate.substring(0, 4) : new Date().getFullYear().toString(),
          targetAgeGroup: info.maturityRating === 'MATURE' ? 'Dospělí (18+)' : 'Všechny věkové kategorie',
          language: info.language === 'cs' ? 'Čeština' : info.language === 'en' ? 'Angličtina' : info.language || 'Čeština',
          genre: info.categories ? info.categories[0] : 'Beletrie',
          pages: info.pageCount || 200,
          description: info.description || 'Popis knihy z veřejné databáze.',
          coverUrl: info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&q=80',
          isAvailable: true,
          borrowedBy: null,
          dueDate: null,
          addedBy: 'Scanner',
          createdAt: new Date().toISOString()
        };
      }
    }
  } catch (err) {
    console.warn('Google Books API lookup failed, trying OpenLibrary fallback:', err);
  }

  try {
    // Attempt 2: Open Library API
    const olRes = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${cleanCode}&format=json&jscmd=data`);
    if (olRes.ok) {
      const data = await olRes.json();
      const bookKey = `ISBN:${cleanCode}`;
      if (data[bookKey]) {
        const info = data[bookKey];
        return {
          id: `book-${cleanCode || Date.now()}`,
          isbn: cleanCode || code,
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
          addedBy: 'Scanner',
          createdAt: new Date().toISOString()
        };
      }
    }
  } catch (err) {
    console.warn('Open Library API lookup failed:', err);
  }

  // Graceful fallback for unlisted barcodes or custom barcodes
  return {
    id: `book-${cleanCode || Date.now()}`,
    isbn: cleanCode || code || '9780000000000',
    title: `Naskenovaná kniha (Kód: ${cleanCode || code})`,
    author: 'Nespecifikovaný autor',
    publisher: 'České nakladatelství',
    year: new Date().getFullYear().toString(),
    targetAgeGroup: 'Pro všechny čtenáře',
    language: 'Čeština',
    genre: 'Beletrie & Proza',
    pages: 220,
    description: 'Tato kniha byla naskenována pomocí čárového kódu. Parametry můžete ručně upravit před uložením do katalogu.',
    coverUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80',
    isAvailable: true,
    borrowedBy: null,
    dueDate: null,
    addedBy: 'Scanner',
    createdAt: new Date().toISOString()
  };
}
