import React, { useState, useEffect, useRef } from 'react';
import { shortBookDescription, fetchBookDescription, DESCRIPTION_MAX_LENGTH } from '../services/bookDescription';
import { useApp } from '../context/AppContext';
import {
  BookOpen,
  PlusCircle,
  Bookmark,
  X,
  Edit3,
  Image as ImageIcon,
  Barcode,
  Calendar,
  User,
  Building,
  Tag,
  Globe,
  Users,
  AlertCircle,
  Info
} from 'lucide-react';

export default function BookDetailModal({ book, isOpen, onClose, onSaved, readOnly = false }) {
  const { currentUser, addBookToPublicCatalog, addBookToReaderCollection } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(book || {});
  const [descriptionLoading, setDescriptionLoading] = useState(false);
  const descriptionEditedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    descriptionEditedRef.current = false;
    setDescriptionLoading(false);
    if (book && isOpen) {
      const description = shortBookDescription(book.description);
      setFormData({ ...book, description });
      if (!description && book.isbn) {
        setDescriptionLoading(true);
        fetchBookDescription(book.isbn).then(summary => {
          if (cancelled) return;
          if (!descriptionEditedRef.current) setFormData(prev => ({ ...prev, description: summary }));
          setDescriptionLoading(false);
        });
      }
      // Auto-enable edit mode if book details were not found automatically
      if (!readOnly && !book.isFound) {
        setIsEditing(true);
      } else {
        setIsEditing(false);
      }
    }
    return () => { cancelled = true; };
  }, [book, isOpen, readOnly]);

  if (!isOpen || !book) return null;

  const isLibrarian = currentUser?.role === 'librarian';

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveBook = (e) => {
    e.preventDefault();

    // Do not allow saving empty title/author
    if (!formData.title?.trim() || !formData.author?.trim()) {
      alert('Prosím vyplňte název knihy a autora.');
      return;
    }

    const finalBook = {
      ...book,
      ...formData,
      title: formData.title.trim(),
      author: formData.author.trim(),
      description: shortBookDescription(formData.description),
      isFound: true // User confirmed/edited the details
    };

    if (isLibrarian) {
      addBookToPublicCatalog(finalBook);
    } else {
      addBookToReaderCollection(currentUser.id, finalBook);
    }

    if (onSaved) onSaved(finalBook);
    onClose();
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="book-detail-title" className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-stone-900/70 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-parchment-200 w-full max-w-3xl overflow-hidden my-8">

        {/* Header Bar */}
        <div className="bg-forest-800 border-b-4 border-parchment-400 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl">
              <BookOpen className="w-6 h-6 text-parchment-100" />
            </div>
            <div>
              <h2 id="book-detail-title" className="text-xl font-bold">
                {readOnly ? 'Detail knihy' : book.isFound ? 'Nalezená kniha' : 'Kniha nenalezena v databázích'}
              </h2>
              <p className="text-xs text-parchment-100">
                {book.apiSource ? `Zdroj dat: ${book.apiSource}` : readOnly ? 'Informace o knize' : 'Můžete ručně doplnit potřebné údaje'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
            title="Zavřít"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Diagnostics banner */}
        {book.diagnostics && book.diagnostics.length > 0 && (
          <div className="bg-parchment-50 border-b border-parchment-200 p-3 px-6 text-xs text-parchment-900 flex items-start gap-2">
            <Info className="w-4 h-4 text-parchment-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Diagnostické informace vyhledače:</p>
              <ul className="list-disc list-inside space-y-0.5 mt-0.5 text-parchment-800">
                {book.diagnostics.map((diag, idx) => (
                  <li key={idx}>{diag}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Not Found Warning Banner */}
        {!readOnly && !book.isFound && (
          <div className="bg-wine-100 border-b border-wine-200 p-3 px-6 text-xs text-wine-900 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-wine-600 shrink-0" />
            <p className="font-semibold">
              Kniha s tímto ISBN nebyla automaticky nalezena. Prosím doplňte název a autora ručně.
            </p>
          </div>
        )}

          <form onSubmit={handleSaveBook} className="p-6">
            <div className="flex flex-col md:flex-row gap-6">

              {/* Cover & Quick Stats */}
              <div className="w-full md:w-1/3 flex flex-col items-center">
                <div className="w-44 h-64 rounded-xl shadow-lg border border-stone-200 overflow-hidden relative group bg-stone-100 mb-3">
                  <img
                    src={formData.coverUrl || book.coverUrl}
                    alt={formData.title || book.title || 'Obálka knihy'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                          e.target.src = `${import.meta.env.BASE_URL}book-cover.svg`;
                    }}
                  />
                  {isEditing && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-2">
                      <div className="text-center text-white text-xs">
                        <ImageIcon className="w-6 h-6 mx-auto mb-1 opacity-80" />
                        <span>Upravte URL obálky v poli níže</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="w-full bg-parchment-50/80 border border-parchment-200 p-3 rounded-xl text-xs space-y-2">
                  <div className="flex items-center justify-between text-stone-600">
                    <span className="font-semibold flex items-center gap-1">
                      <Barcode className="w-3.5 h-3.5 text-wine-600" /> ISBN:
                    </span>
                    <span className="font-mono font-bold text-stone-800">{book.isbn}</span>
                  </div>
                  <div className="flex items-center justify-between text-stone-600">
                    <span className="font-semibold flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 text-forest-600" /> Režim:
                    </span>
                    <span className="font-bold text-forest-800">
                      {isLibrarian ? 'Veřejný katalog' : 'Moje osobní knihovna'}
                    </span>
                  </div>
                </div>

                {!readOnly && <button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  className="mt-3 text-xs font-semibold text-wine-700 hover:text-wine-800 bg-wine-100/70 hover:bg-wine-100 px-3 py-1.5 rounded-lg border border-wine-200 flex items-center gap-1.5 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  {isEditing ? 'Ukončit úpravy' : 'Upravit zobrazené údaje'}
                </button>}
              </div>

              {/* Book Details Table / Editable Fields */}
              <div className="w-full md:w-2/3 space-y-4">

                {/* Title & Author */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase">Název knihy *</label>
                    {isEditing ? (
                      <input
                        type="text"
                        required
                        placeholder="Zadejte název knihy"
                        value={formData.title ?? ''}
                        onChange={(e) => handleChange('title', e.target.value)}
                        className="w-full mt-1 p-2 border border-stone-300 rounded-lg text-base font-bold focus:ring-2 focus:ring-wine-500"
                      />
                    ) : (
                      <h3 className="text-2xl font-black text-stone-900">{formData.title || 'Bez názvu'}</h3>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-wine-600" /> Autor / Autorka *
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        required
                        placeholder="Zadejte jméno autora"
                        value={formData.author ?? ''}
                        onChange={(e) => handleChange('author', e.target.value)}
                        className="w-full mt-1 p-2 border border-stone-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-wine-500"
                      />
                    ) : (
                      <p className="text-base font-semibold text-stone-800">{formData.author || 'Neznámý autor'}</p>
                    )}
                  </div>
                </div>

                {/* Grid Info Table */}
                <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">

                  {/* Publisher */}
                  <div>
                    <label className="text-xs font-semibold text-stone-500 flex items-center gap-1 mb-1">
                      <Building className="w-3.5 h-3.5 text-forest-600" /> Nakladatelství
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.publisher ?? ''}
                        onChange={(e) => handleChange('publisher', e.target.value)}
                        className="w-full p-1.5 border border-stone-300 rounded-md text-xs bg-white"
                      />
                    ) : (
                      <span className="font-semibold text-stone-800">{formData.publisher || 'Neuvedeno'}</span>
                    )}
                  </div>

                  {/* Year */}
                  <div>
                    <label className="text-xs font-semibold text-stone-500 flex items-center gap-1 mb-1">
                      <Calendar className="w-3.5 h-3.5 text-wine-600" /> Rok vydání
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.year ?? ''}
                        onChange={(e) => handleChange('year', e.target.value)}
                        className="w-full p-1.5 border border-stone-300 rounded-md text-xs bg-white"
                      />
                    ) : (
                      <span className="font-semibold text-stone-800">{formData.year || 'Neuvedeno'}</span>
                    )}
                  </div>

                  {/* Age Group */}
                  <div>
                    <label className="text-xs font-semibold text-stone-500 flex items-center gap-1 mb-1">
                      <Users className="w-3.5 h-3.5 text-forest-600" /> Cílová věková skupina
                    </label>
                    {isEditing ? (
                      <select
                        value={formData.targetAgeGroup ?? 'Pro všechny čtenáře'}
                        onChange={(e) => handleChange('targetAgeGroup', e.target.value)}
                        className="w-full p-1.5 border border-stone-300 rounded-md text-xs bg-white"
                      >
                        <option value="Děti (0-6 let)">Děti (0-6 let)</option>
                        <option value="Děti a mládež (7-15 let)">Děti a mládež (7-15 let)</option>
                        <option value="Mládež a dospělí (12+)">Mládež a dospělí (12+)</option>
                        <option value="Dospělí (18+)">Dospělí (18+)</option>
                        <option value="Pro všechny čtenáře">Pro všechny čtenáře</option>
                      </select>
                    ) : (
                      <span className="inline-block px-2 py-0.5 bg-forest-100 text-forest-800 font-bold text-xs rounded-full border border-forest-200">
                        {formData.targetAgeGroup || 'Pro všechny čtenáře'}
                      </span>
                    )}
                  </div>

                  {/* Language */}
                  <div>
                    <label className="text-xs font-semibold text-stone-500 flex items-center gap-1 mb-1">
                      <Globe className="w-3.5 h-3.5 text-wine-600" /> Jazyk
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.language ?? 'Čeština'}
                        onChange={(e) => handleChange('language', e.target.value)}
                        className="w-full p-1.5 border border-stone-300 rounded-md text-xs bg-white"
                      />
                    ) : (
                      <span className="font-semibold text-stone-800">{formData.language || 'Čeština'}</span>
                    )}
                  </div>

                  {/* Genre */}
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-stone-500 flex items-center gap-1 mb-1">
                      <Tag className="w-3.5 h-3.5 text-forest-600" /> Žánr / Kategorie
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.genre ?? 'Beletrie'}
                        onChange={(e) => handleChange('genre', e.target.value)}
                        className="w-full p-1.5 border border-stone-300 rounded-md text-xs bg-white"
                      />
                    ) : (
                      <span className="font-semibold text-parchment-900 bg-parchment-100 px-2 py-0.5 rounded-md text-xs border border-parchment-300">
                        {formData.genre || 'Beletrie'}
                      </span>
                    )}
                  </div>

                </div>

                {/* Description */}
                <div>
                  <label htmlFor="book-description" className="block text-xs font-bold text-stone-500 uppercase mb-1">Krátce o knize</label>
                  {isEditing ? (
                    <textarea
                      id="book-description"
                      placeholder="Stručně napište, o čem kniha je."
                      maxLength={DESCRIPTION_MAX_LENGTH}
                      rows={3}
                      value={formData.description ?? ''}
                      onChange={(e) => { descriptionEditedRef.current = true; handleChange('description', e.target.value); }}
                      className="w-full p-2 border border-stone-300 rounded-lg text-xs leading-relaxed focus:ring-2 focus:ring-wine-500"
                    />
                  ) : (
                    <p className="text-xs text-stone-600 leading-relaxed bg-white p-3 rounded-lg border border-stone-200">
                      {formData.description || (descriptionLoading ? 'Hledám krátký popis knihy…' : readOnly ? 'Krátký popis zatím není k dispozici.' : 'Krátký popis zatím není k dispozici. Můžete ho doplnit v úpravách.')}
                    </p>
                  )}
                </div>

                {isEditing && (
                  <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">URL Obálky</label>
                    <input
                      type="text"
                      value={formData.coverUrl ?? ''}
                      onChange={(e) => handleChange('coverUrl', e.target.value)}
                      className="w-full p-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-wine-500"
                    />
                  </div>
                )}

              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 pt-4 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-stone-300 font-semibold text-stone-700 hover:bg-stone-100 text-sm transition-colors"
              >
                {readOnly ? 'Zavřít detail' : 'Zrušit'}
              </button>

              {!readOnly && <button
                type="submit"
                className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
                  isLibrarian
                    ? 'bg-wine-600 hover:bg-wine-700 shadow-wine-600/20'
                    : 'bg-forest-600 hover:bg-forest-700 shadow-forest-600/20'
                }`}
              >
                {isLibrarian ? (
                  <>
                    <PlusCircle className="w-4 h-4" /> Uložit do veřejné knihovny
                  </>
                ) : (
                  <>
                    <Bookmark className="w-4 h-4" /> Uložit do osobní sbírky
                  </>
                )}
              </button>}
            </div>
          </form>

      </div>
    </div>
  );
}
