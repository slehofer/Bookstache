import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Search,
  Filter,
  Download,
  Trash2,
  HandHeart,
  CheckCircle,
  XCircle,
  ArrowUpDown,
  BookOpen,
  Tag,
  Building,
  Calendar,
  Globe,
  Users
} from 'lucide-react';

export default function BookCatalogTable({ isReaderOnly = false }) {
  const {
    currentUser,
    publicCatalog,
    deleteBookFromPublicCatalog,
    readerCollections,
    removeBookFromReaderCollection,
    borrowBook
  } = useApp();

  const isLibrarian = currentUser?.role === 'librarian';

  // State filters
  const [searchTerm, setSearchTerm] = useState('');
  const [genreFilter, setGenreFilter] = useState('ALL');
  const [ageGroupFilter, setAgeGroupFilter] = useState('ALL');
  const [availabilityFilter, setAvailabilityFilter] = useState('ALL');
  const [sortField, setSortField] = useState('title');
  const [sortOrder, setSortOrder] = useState('asc');

  // Borrower modal state
  const [borrowModalBook, setBorrowModalBook] = useState(null);
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerEmail, setBorrowerEmail] = useState('');

  // Source list
  const sourceBooks = useMemo(() => {
    if (isReaderOnly && currentUser) {
      return readerCollections[currentUser.id] || [];
    }
    return publicCatalog;
  }, [isReaderOnly, currentUser, readerCollections, publicCatalog]);

  // Unique genres and age groups for filter dropdowns
  const availableGenres = useMemo(() => {
    const set = new Set(sourceBooks.map((b) => b.genre).filter(Boolean));
    return Array.from(set);
  }, [sourceBooks]);

  const availableAgeGroups = useMemo(() => {
    const set = new Set(sourceBooks.map((b) => b.targetAgeGroup).filter(Boolean));
    return Array.from(set);
  }, [sourceBooks]);

  // Filtered & Sorted books
  const filteredBooks = useMemo(() => {
    return sourceBooks
      .filter((book) => {
        // Search query (title, author, isbn, publisher)
        const q = searchTerm.toLowerCase();
        const matchesSearch =
          !searchTerm ||
          book.title?.toLowerCase().includes(q) ||
          book.author?.toLowerCase().includes(q) ||
          book.isbn?.toLowerCase().includes(q) ||
          book.publisher?.toLowerCase().includes(q);

        // Genre filter
        const matchesGenre = genreFilter === 'ALL' || book.genre === genreFilter;

        // Age group filter
        const matchesAge = ageGroupFilter === 'ALL' || book.targetAgeGroup === ageGroupFilter;

        // Availability filter
        const matchesAvail =
          availabilityFilter === 'ALL' ||
          (availabilityFilter === 'AVAILABLE' && book.isAvailable) ||
          (availabilityFilter === 'BORROWED' && !book.isAvailable);

        return matchesSearch && matchesGenre && matchesAge && matchesAvail;
      })
      .sort((a, b) => {
        let valA = a[sortField] || '';
        let valB = b[sortField] || '';

        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [sourceBooks, searchTerm, genreFilter, ageGroupFilter, availabilityFilter, sortField, sortOrder]);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Export Table Data to CSV
  const handleExportCSV = () => {
    if (filteredBooks.length === 0) return;

    const headers = [
      'ISBN',
      'Název',
      'Autor',
      'Nakladatelství',
      'Rok vydání',
      'Cílová skupina',
      'Jazyk',
      'Žánr',
      'Stav'
    ];

    const rows = filteredBooks.map((b) => [
      `"${b.isbn || ''}"`,
      `"${b.title || ''}"`,
      `"${b.author || ''}"`,
      `"${b.publisher || ''}"`,
      `"${b.year || ''}"`,
      `"${b.targetAgeGroup || ''}"`,
      `"${b.language || ''}"`,
      `"${b.genre || ''}"`,
      `"${b.isAvailable ? 'Dostupná' : 'Vypůjčená'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `knihy_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Table Data to JSON
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredBooks, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `knihy_export_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleConfirmBorrow = (e) => {
    e.preventDefault();
    if (!borrowModalBook || !borrowerName.trim()) return;

    borrowBook(borrowModalBook.id, borrowerName, borrowerEmail);
    setBorrowModalBook(null);
    setBorrowerName('');
    setBorrowerEmail('');
  };

  return (
    <div className="space-y-6">

      {/* Catalog Header */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-stone-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-orange-600" />
            {isReaderOnly ? 'Moje osobně uložená sbírka' : 'Kompletní katalog knihovny'}
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Přehledná tabulka s vyhledáváním, filtry podle žánru a věkových skupin
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={handleExportCSV}
            className="flex-1 md:flex-none px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-colors"
            title="Stáhnout tabulku v CSV"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button
            onClick={handleExportJSON}
            className="flex-1 md:flex-none px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-colors"
            title="Stáhnout v JSON"
          >
            <Download className="w-4 h-4" /> Export JSON
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200/80 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

          {/* Search Field */}
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
            <input
              type="text"
              placeholder="Hledat název, autor, ISBN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
          </div>

          {/* Genre Filter */}
          <div>
            <select
              value={genreFilter}
              onChange={(e) => setGenreFilter(e.target.value)}
              className="w-full p-2 bg-white border border-stone-300 rounded-xl text-xs font-semibold text-stone-700 focus:ring-2 focus:ring-orange-500"
            >
              <option value="ALL">Všechny žánry ({availableGenres.length})</option>
              {availableGenres.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* Age Group Filter */}
          <div>
            <select
              value={ageGroupFilter}
              onChange={(e) => setAgeGroupFilter(e.target.value)}
              className="w-full p-2 bg-white border border-stone-300 rounded-xl text-xs font-semibold text-stone-700 focus:ring-2 focus:ring-orange-500"
            >
              <option value="ALL">Všechny věkové skupiny</option>
              {availableAgeGroups.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          {/* Availability Filter */}
          {!isReaderOnly && (
            <div>
              <select
                value={availabilityFilter}
                onChange={(e) => setAvailabilityFilter(e.target.value)}
                className="w-full p-2 bg-white border border-stone-300 rounded-xl text-xs font-semibold text-stone-700 focus:ring-2 focus:ring-orange-500"
              >
                <option value="ALL">Všechny stavové výpůjčky</option>
                <option value="AVAILABLE">Pouze dostupné skladem</option>
                <option value="BORROWED">Pouze vypůjčené</option>
              </select>
            </div>
          )}

        </div>
      </div>

      {/* Main Responsive Data Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">

            {/* Table Header */}
            <thead>
              <tr className="bg-gradient-to-r from-stone-800 to-stone-900 text-stone-200 uppercase tracking-wider font-bold">
                <th className="py-3.5 px-4">Obálka</th>
                <th
                  onClick={() => toggleSort('title')}
                  className="py-3.5 px-4 cursor-pointer hover:text-orange-400 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Název a Autor <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('publisher')}
                  className="py-3.5 px-4 cursor-pointer hover:text-orange-400 transition-colors hidden md:table-cell"
                >
                  <div className="flex items-center gap-1">
                    Nakladatelství / Rok <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('genre')}
                  className="py-3.5 px-4 cursor-pointer hover:text-orange-400 transition-colors hidden lg:table-cell"
                >
                  <div className="flex items-center gap-1">
                    Žánr <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3.5 px-4 hidden xl:table-cell">Věková skupina</th>
                <th className="py-3.5 px-4">Stav / Akce</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-stone-200">
              {filteredBooks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-500">
                    <BookOpen className="w-10 h-10 mx-auto text-stone-300 mb-2" />
                    <p className="font-bold text-sm">Žádné knihy neodpovídají zadaným filtrům.</p>
                    <p className="text-xs text-stone-400 mt-0.5">Naskenujte novou knihu nebo upravte vyhledávací pole.</p>
                  </td>
                </tr>
              ) : (
                filteredBooks.map((book) => (
                  <tr key={book.id} className="hover:bg-amber-50/40 transition-colors">

                    {/* Cover */}
                    <td className="py-3 px-4">
                      <img
                        src={book.coverUrl}
                        alt={book.title}
                        className="w-10 h-14 object-cover rounded-md shadow-sm border border-stone-200"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80';
                        }}
                      />
                    </td>

                    {/* Title & Author */}
                    <td className="py-3 px-4">
                      <p className="font-extrabold text-stone-900 text-sm leading-tight">{book.title}</p>
                      <p className="text-stone-600 font-semibold mt-0.5">{book.author}</p>
                      <p className="text-[10px] font-mono text-stone-400 mt-1">ISBN: {book.isbn}</p>
                    </td>

                    {/* Publisher / Year */}
                    <td className="py-3 px-4 hidden md:table-cell">
                      <p className="font-semibold text-stone-800">{book.publisher}</p>
                      <p className="text-stone-500 font-mono mt-0.5">{book.year}</p>
                    </td>

                    {/* Genre */}
                    <td className="py-3 px-4 hidden lg:table-cell">
                      <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-900 font-bold rounded-md border border-amber-300">
                        {book.genre}
                      </span>
                    </td>

                    {/* Target Age Group */}
                    <td className="py-3 px-4 hidden xl:table-cell">
                      <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full border border-emerald-300">
                        {book.targetAgeGroup}
                      </span>
                    </td>

                    {/* Availability / Actions */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                        {!isReaderOnly && (
                          book.isAvailable ? (
                            <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                              <CheckCircle className="w-3.5 h-3.5" /> Skladem
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-300">
                              <XCircle className="w-3.5 h-3.5" /> Vypůjčeno
                            </span>
                          )
                        )}

                        {/* Librarian specific action */}
                        {isLibrarian && !isReaderOnly && (
                          <div className="flex items-center gap-1">
                            {book.isAvailable && (
                              <button
                                onClick={() => setBorrowModalBook(book)}
                                className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                                title="Vytvořit výpůjčku"
                              >
                                <HandHeart className="w-4 h-4" />
                              </button>
                            )}

                            <button
                              onClick={() => {
                                if (confirm(`Opravdu chcete odebrat knihu "${book.title}" z katalogu?`)) {
                                  deleteBookFromPublicCatalog(book.id);
                                }
                              }}
                              className="p-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors"
                              title="Smazat knihu"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}

                        {/* Reader specific action */}
                        {isReaderOnly && currentUser && (
                          <button
                            onClick={() => removeBookFromReaderCollection(currentUser.id, book.id)}
                            className="p-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors flex items-center gap-1 font-bold text-xs"
                            title="Odebrat z mé sbírky"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Odebrat
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 text-xs font-semibold text-stone-600 flex justify-between items-center">
          <span>Zobrazeno {filteredBooks.length} z celkem {sourceBooks.length} záznamů</span>
          <span className="text-amber-800 font-bold">Bookstache verze 1.0</span>
        </div>
      </div>

      {/* Borrow Modal for Librarian */}
      {borrowModalBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-emerald-200 w-full max-w-md p-6 space-y-4">
            <h3 className="text-xl font-bold text-stone-900 flex items-center gap-2">
              <HandHeart className="w-5 h-5 text-emerald-600" /> Vypůjčit knihu čtenáři
            </h3>
            <p className="text-xs text-stone-500">
              Kniha: <strong className="text-stone-800">{borrowModalBook.title}</strong> ({borrowModalBook.author})
            </p>

            <form onSubmit={handleConfirmBorrow} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Jméno a příjmení vypůjčitele *
                </label>
                <input
                  type="text"
                  required
                  placeholder="např. Jan Novák"
                  value={borrowerName}
                  onChange={(e) => setBorrowerName(e.target.value)}
                  className="w-full p-2.5 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  E-mail čtenáře
                </label>
                <input
                  type="email"
                  placeholder="jan.novak@email.cz"
                  value={borrowerEmail}
                  onChange={(e) => setBorrowerEmail(e.target.value)}
                  className="w-full p-2.5 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setBorrowModalBook(null)}
                  className="px-4 py-2 border border-stone-300 rounded-xl font-semibold text-xs text-stone-700 hover:bg-stone-100"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  Potvrdit výpůjčku
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
