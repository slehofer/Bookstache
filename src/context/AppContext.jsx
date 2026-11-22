import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { INITIAL_MOCK_BOOKS } from '../services/bookService';
import { sendBookToExternalEndpoint } from '../services/externalSyncService';

const AppContext = createContext();

export const DEFAULT_USERS = [
  {
    id: 'user-librarian-1',
    name: 'Ukázkový profil',
    role: 'librarian',
    avatar: '👩‍💼'
  },
  {
    id: 'user-reader-1',
    name: 'Čtenář 1',
    role: 'reader',
    avatar: '👨‍🎓'
  },
  {
    id: 'user-reader-2',
    name: 'Čtenář 2',
    role: 'reader',
    avatar: '👩‍🎨'
  }
];

function localProfile(user) {
  if (typeof user?.id !== 'string' || !user.id) return null;
  const demo = DEFAULT_USERS.find(profile => profile.id === user.id);
  if (demo) return demo;
  if (user.role !== 'librarian' && user.role !== 'reader') return null;
  return {
    id: user.id,
    role: user.role,
    name: 'Místní profil',
    avatar: user.role === 'librarian' ? '👩‍💼' : '📖'
  };
}

function withoutProfileAttribution({ addedBy, ...book }) {
  return book;
}

export const AppProvider = ({ children }) => {
  // Current user state
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('bookstache_user');
    if (!saved) return DEFAULT_USERS[0];
    try {
      return localProfile(JSON.parse(saved));
    } catch {
      return null;
    }
  });

  // Main shared library catalog
  const [publicCatalog, setPublicCatalog] = useState(() => {
    const saved = localStorage.getItem('bookstache_public_catalog');
    return (saved ? JSON.parse(saved) : INITIAL_MOCK_BOOKS).map(withoutProfileAttribution);
  });

  // Reader personal collections: { userId: [Book] }
  const [readerCollections, setReaderCollections] = useState(() => {
    const saved = localStorage.getItem('bookstache_reader_collections');
    const collections = saved ? JSON.parse(saved) : {
      'user-reader-1': [INITIAL_MOCK_BOOKS[1], INITIAL_MOCK_BOOKS[3]],
      'user-reader-2': [INITIAL_MOCK_BOOKS[0]]
    };
    return Object.fromEntries(Object.entries(collections).map(([id, books]) => [id, books.map(withoutProfileAttribution)]));
  });

  // Active Loans list
  const [loans, setLoans] = useState(() => {
    const saved = localStorage.getItem('bookstache_loans');
    return saved ? JSON.parse(saved) : [
      {
        id: 'loan-1',
        bookId: 'book-9788073816216',
        bookTitle: 'Malý princ',
        borrowerName: 'Jan Novák',
        borrowerEmail: 'jan.novak@example.com',
        borrowedDate: '2025-02-01',
        dueDate: '2025-03-01',
        returned: false
      }
    ];
  });

  // External sync settings (Webhook URL)
  const [externalWebhookUrl, setExternalWebhookUrl] = useState(() => {
    return localStorage.getItem('bookstache_webhook_url') || '';
  });

  const [externalSyncStatus, setExternalSyncStatus] = useState(null);
  const syncRequestRef = useRef(0);

  useEffect(() => {
    syncRequestRef.current += 1;
    setExternalSyncStatus(null);
  }, [externalWebhookUrl]);

  // Persistence
  useEffect(() => {
    const profile = currentUser && { id: currentUser.id, role: currentUser.role };
    localStorage.setItem('bookstache_user', JSON.stringify(profile));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('bookstache_public_catalog', JSON.stringify(publicCatalog));
  }, [publicCatalog]);

  useEffect(() => {
    localStorage.setItem('bookstache_reader_collections', JSON.stringify(readerCollections));
  }, [readerCollections]);

  useEffect(() => {
    localStorage.setItem('bookstache_loans', JSON.stringify(loans));
  }, [loans]);

  useEffect(() => {
    localStorage.setItem('bookstache_webhook_url', externalWebhookUrl);
  }, [externalWebhookUrl]);

  // Actions
  const loginUser = (user) => {
    setCurrentUser(localProfile(user));
  };

  const logoutUser = () => {
    setCurrentUser(null);
  };

  const triggerExternalSync = async (book, role) => {
    if (externalWebhookUrl) {
      const requestId = ++syncRequestRef.current;
      setExternalSyncStatus({ state: 'sending', message: 'Odesílám knihu do externí tabulky…' });
      const result = await sendBookToExternalEndpoint(externalWebhookUrl, book, role);
      if (requestId === syncRequestRef.current) {
        setExternalSyncStatus({ state: result.ok ? 'success' : 'error', message: result.message });
      }
    }
  };

  const addBookToPublicCatalog = (book) => {
    const newBook = withoutProfileAttribution(book);
    setPublicCatalog((prev) => [newBook, ...prev.filter(b => b.id !== newBook.id)]);
    triggerExternalSync(newBook, 'knihovnik');
  };

  const updateBookInPublicCatalog = (updatedBook) => {
    setPublicCatalog((prev) => prev.map(b => b.id === updatedBook.id ? updatedBook : b));
  };

  const deleteBookFromPublicCatalog = (bookId) => {
    setPublicCatalog((prev) => prev.filter(b => b.id !== bookId));
  };

  const addBookToReaderCollection = (userId, newBook) => {
    const book = withoutProfileAttribution(newBook);
    setReaderCollections((prev) => {
      const userList = prev[userId] || [];
      if (userList.some(b => b.id === book.id || (book.isbn && b.isbn === book.isbn))) {
        return prev;
      }
      return {
        ...prev,
        [userId]: [book, ...userList]
      };
    });
    triggerExternalSync(book, 'ctenar');
  };

  // A duplicate is another physical copy: keep bibliographic data and ISBN,
  // but give it its own identity and availability, independent of the original loan.
  const createBookCopy = (book) => ({
    ...book,
    id: `copy-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`}`,
    duplicatedFrom: book.duplicatedFrom || book.id,
    createdAt: new Date().toISOString(),
    isAvailable: true,
    borrowedBy: null,
    dueDate: null
  });

  const duplicateBookInPublicCatalog = (bookId) => {
    if (currentUser?.role !== 'librarian') return null;
    const original = publicCatalog.find(book => book.id === bookId);
    if (!original) return null;
    const copy = createBookCopy(original);
    addBookToPublicCatalog(copy);
    return copy;
  };

  const duplicateBookInReaderCollection = (bookId) => {
    if (!currentUser) return null;
    const original = (readerCollections[currentUser.id] || []).find(book => book.id === bookId);
    if (!original) return null;
    const copy = createBookCopy(original);
    // Only deliberate duplication bypasses the normal ISBN duplicate check.
    setReaderCollections(prev => ({
      ...prev,
      [currentUser.id]: [copy, ...(prev[currentUser.id] || [])]
    }));
    triggerExternalSync(copy, 'ctenar');
    return copy;
  };

  const removeBookFromReaderCollection = (userId, bookId) => {
    setReaderCollections((prev) => ({
      ...prev,
      [userId]: (prev[userId] || []).filter(b => b.id !== bookId)
    }));
  };

  const borrowBook = (bookId, borrowerName, borrowerEmail, days = 30) => {
    const today = new Date();
    const due = new Date();
    due.setDate(today.getDate() + days);

    const dueDateStr = due.toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];

    const book = publicCatalog.find(b => b.id === bookId);
    if (!book) return;

    updateBookInPublicCatalog({
      ...book,
      isAvailable: false,
      borrowedBy: borrowerName,
      dueDate: dueDateStr
    });

    const newLoan = {
      id: `loan-${Date.now()}`,
      bookId,
      bookTitle: book.title,
      borrowerName,
      borrowerEmail,
      borrowedDate: todayStr,
      dueDate: dueDateStr,
      returned: false
    };

    setLoans((prev) => [newLoan, ...prev]);
  };

  const returnBook = (loanId) => {
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return;

    setLoans((prev) => prev.map(l => l.id === loanId ? { ...l, returned: true } : l));

    const book = publicCatalog.find(b => b.id === loan.bookId);
    if (book) {
      updateBookInPublicCatalog({
        ...book,
        isAvailable: true,
        borrowedBy: null,
        dueDate: null
      });
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        loginUser,
        logoutUser,
        publicCatalog,
        addBookToPublicCatalog,
        updateBookInPublicCatalog,
        deleteBookFromPublicCatalog,
        duplicateBookInPublicCatalog,
        readerCollections,
        addBookToReaderCollection,
        removeBookFromReaderCollection,
        duplicateBookInReaderCollection,
        loans,
        borrowBook,
        returnBook,
        externalSyncStatus,
        externalWebhookUrl,
        setExternalWebhookUrl
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
