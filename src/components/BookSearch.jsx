import React, { useEffect, useRef, useState } from 'react';
import { Search, PlusCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { searchBooks, sameBook } from '../services/bookSearch';
import BookDetailModal from './BookDetailModal';

export default function BookSearch() {
  const { currentUser, publicCatalog, readerCollections, addBookToPublicCatalog, addBookToReaderCollection } = useApp();
  const [query, setQuery] = useState('');
  const [field, setField] = useState('all');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [message, setMessage] = useState('');
  const request = useRef(null);
  useEffect(() => () => request.current?.abort(), []);
  const collection = currentUser?.role === 'librarian' ? publicCatalog : readerCollections[currentUser?.id] || [];
  const reset = () => {
    request.current?.abort();
    request.current = null;
    setLoading(false);
    setResult(null);
    setMessage('');
  };
  const submit = async (event) => {
    event.preventDefault();
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    setResult(null);
    setMessage('');
    try {
      const next = await searchBooks(query, field, { signal: controller.signal, localBooks: publicCatalog });
      if (!controller.signal.aborted) setResult(next);
    } catch (error) {
      if (!controller.signal.aborted) setResult({ books: [], warning: 'Vyhledávání se nezdařilo. Zkuste to znovu.' });
    } finally {
      if (request.current === controller) setLoading(false);
    }
  };
  const add = (book) => {
    if (!currentUser || collection.some(other => sameBook(book, other))) return;
    const saved = { ...book, addedBy: currentUser.name, createdAt: new Date().toISOString() };
    if (currentUser.role === 'librarian') addBookToPublicCatalog(saved);
    else addBookToReaderCollection(currentUser.id, saved);
    setMessage(`Kniha „${book.title}“ byla přidána ${currentUser.role === 'librarian' ? 'do veřejného katalogu' : 'do vaší sbírky'}.`);
  };
  return <section className="w-full space-y-5">
    <div>
      <h2 className="text-2xl font-serif text-forest-900">Najděte další příběh</h2>
      <p className="text-sm text-stone-600 mt-1">Hledejte podle názvu knihy nebo jména autora. ISBN nepotřebujete.</p>
    </div>
    <form onSubmit={submit} className="flex flex-col sm:flex-row gap-3">
      <label className="text-xs font-bold text-stone-600">Hledat podle
        <select value={field} onChange={e => { reset(); setField(e.target.value); }} className="block w-full border border-stone-300 rounded-xl p-3 mt-1 bg-white text-sm">
          <option value="all">Názvu nebo autora</option><option value="title">Názvu knihy</option><option value="author">Jména autora</option>
        </select>
      </label>
      <label className="flex-1 text-xs font-bold text-stone-600">Název nebo autor
        <input value={query} onChange={e => { reset(); setQuery(e.target.value); }} placeholder="např. Malý princ nebo Karel Čapek" minLength={2} required className="block w-full border border-stone-300 rounded-xl p-3 mt-1 text-sm focus:ring-2 focus:ring-wine-500" />
      </label>
      <button disabled={loading || query.trim().length < 2} className="self-end w-full sm:w-auto px-5 py-3 bg-wine-700 text-white rounded-xl font-bold flex justify-center items-center gap-2 disabled:opacity-50">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Hledat knihy
      </button>
    </form>
    {!currentUser && <p className="text-sm text-wine-700">Pro přidání knihy do sbírky se přihlaste.</p>}
    <div role="status" aria-live="polite" className="text-sm text-forest-700">
      {loading && 'Hledám knihy…'}{message}
      {result && <p>Nalezeno knih: {result.books.length}{result.books.length === 0 && '. Zkuste jiný název nebo autora.'}</p>}
    </div>
    {result?.warning && <p role="alert" className="text-sm text-parchment-900 bg-parchment-50 p-3 rounded-xl">{result.warning}</p>}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {result?.books.map(book => {
        const exists = collection.some(other => sameBook(book, other));
        return <article key={book.id} className="flex gap-4 border border-stone-200 rounded-xl p-4">
          <img src={book.coverUrl || `${import.meta.env.BASE_URL}book-cover.svg`} alt="" onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = `${import.meta.env.BASE_URL}book-cover.svg`; }} className="w-16 h-24 object-cover rounded shadow-sm" />
          <div className="min-w-0 flex-1">
            <button onClick={() => setDetail(book)} className="font-serif text-lg text-left text-forest-900 hover:underline">{book.title}</button>
            <p className="text-sm text-stone-600">{book.author}</p>
            <p className="text-xs text-stone-500 mt-1">{[book.publisher, book.year].filter(Boolean).join(' · ')}{book.isbn && ` · ISBN ${book.isbn}`}</p>
            <button onClick={() => add(book)} disabled={!currentUser || exists} className="mt-3 text-xs font-bold text-wine-700 flex items-center gap-1 disabled:text-stone-500">
              {exists ? <CheckCircle size={16} /> : <PlusCircle size={16} />}
              {exists ? 'Již uloženo' : currentUser?.role === 'librarian' ? 'Přidat do katalogu' : 'Přidat do sbírky'}
            </button>
          </div>
        </article>;
      })}
    </div>
    <BookDetailModal book={detail} isOpen={!!detail} readOnly onClose={() => setDetail(null)} />
  </section>;
}
