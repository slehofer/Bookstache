import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_MOCK_BOOKS } from '../services/bookService';

const AppContext = createContext();

export const DEFAULT_USERS = [
  {
    id: 'user-librarian-1',
    username: 'knihovnik',
    name: 'Eva Procházková',
    role: 'librarian', // 'librarian' | 'reader'
    email: 'knihovnice@knihovna.cz',
    avatar: '👩‍💼'
  },
  {
    id: 'user-reader-1',
    username: 'jan.novak',
    name: 'Jan Novák',
    role: 'reader',
    email: 'jan.novak@email.cz',
    avatar: '👨‍🎓'
  },
  {
    id: 'user-reader-2',
    username: 'petra.k',
    name: 'Petra Králová',
    role: 'reader',
    email: 'petra.kralova@seznam.cz',
    avatar: '👩‍🎨'
  }
];

export const AppProvider = ({ children }) => {
  // Current user state
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('bookstache_user');
    return saved ? JSON.parse(saved) : DEFAULT_USERS[0]; // default to Librarian for instant scan availability
  });

  // Main shared library catalog
  const [publicCatalog, setPublicCatalog] = useState(() => {
    const saved = localStorage.getItem('bookstache_public_catalog');
    return saved ? JSON.parse(saved) : INITIAL_MOCK_BOOKS;
  });

  // Reader personal collections: { userId: [Book] }
  const [readerCollections, setReaderCollections] = useState(() => {
    const saved = localStorage.getItem('bookstache_reader_collections');
    return saved ? JSON.parse(saved) : {
      'user-reader-1': [INITIAL_MOCK_BOOKS[1], INITIAL_MOCK_BOOKS[3]],
      'user-reader-2': [INITIAL_MOCK_BOOKS[0]]
    };
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
        borrowerEmail: 'jan.novak@email.cz',
        borrowedDate: '2025-02-01',
        dueDate: '2025-03-01',
        returned: false
      }
    ];
  });

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('bookstache_user', JSON.stringify(currentUser));
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

  // Actions
  const loginUser = (user) => {
    setCurrentUser(user);
  };

  const logoutUser = () => {
    setCurrentUser(null);
  };

  const addBookToPublicCatalog = (newBook) => {
    setPublicCatalog((prev) => [newBook, ...prev.filter(b => b.id !== newBook.id)]);
  };

  const updateBookInPublicCatalog = (updatedBook) => {
    setPublicCatalog((prev) => prev.map(b => b.id === updatedBook.id ? updatedBook : b));
  };

  const deleteBookFromPublicCatalog = (bookId) => {
    setPublicCatalog((prev) => prev.filter(b => b.id !== bookId));
  };

  const addBookToReaderCollection = (userId, book) => {
    setReaderCollections((prev) => {
      const userList = prev[userId] || [];
      if (userList.some(b => b.id === book.id || b.isbn === book.isbn)) {
        return prev;
      }
      return {
        ...prev,
        [userId]: [book, ...userList]
      };
    });
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

    // Update public book availability
    updateBookInPublicCatalog({
      ...book,
      isAvailable: false,
      borrowedBy: borrowerName,
      dueDate: dueDateStr
    });

    // Add loan record
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

    // Update loan
    setLoans((prev) => prev.map(l => l.id === loanId ? { ...l, returned: true } : l));

    // Update book status
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
        readerCollections,
        addBookToReaderCollection,
        removeBookFromReaderCollection,
        loans,
        borrowBook,
        returnBook
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
