import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BookOpen, CheckCircle, PlusCircle, Bookmark, X, Edit3, Image as ImageIcon, Barcode, Calendar, User, Building, Tag, Globe, Users } from 'lucide-react';

export default function BookDetailModal({ book, isOpen, onClose, onSaved }) {
  const { currentUser, addBookToPublicCatalog, addBookToReaderCollection } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(book || {});
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen || !book) return null;

  const isLibrarian = currentUser?.role === 'librarian';

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveBook = (e) => {
    e.preventDefault();
    const finalBook = { ...book, ...formData };

    if (isLibrarian) {
      addBookToPublicCatalog(finalBook);
    } else {
      addBookToReaderCollection(currentUser.id, finalBook);
    }

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      if (onSaved) onSaved(finalBook);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-amber-200 w-full max-w-3xl overflow-hidden my-8">

        {/* Header Bar */}
        <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-emerald-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl">
              <BookOpen className="w-6 h-6 text-amber-100" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Naskenovaná kniha</h2>
              <p className="text-xs text-amber-100">Detailní informace získané z čárového / ISBN kódu</p>
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

        {/* Saved Toast Overlay */}
        {saveSuccess ? (
          <div className="p-12 text-center bg-emerald-50 flex flex-col items-center justify-center space-y-3">
            <CheckCircle className="w-16 h-16 text-emerald-600 animate-bounce" />
            <h3 className="text-2xl font-bold text-emerald-800">
              {isLibrarian ? 'Kniha uložena do veřejné knihovny!' : 'Kniha přidána do vaší osobní sbírky!'}
            </h3>
            <p className="text-emerald-700 text-sm">
              Údaje byly úspěšně zaznamenány.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSaveBook} className="p-6">
            <div className="flex flex-col md:flex-row gap-6">

              {/* Cover & Quick Stats */}
              <div className="w-full md:w-1/3 flex flex-col items-center">
                <div className="w-44 h-64 rounded-xl shadow-lg border border-stone-200 overflow-hidden relative group bg-stone-100 mb-3">
                  <img
                    src={formData.coverUrl || book.coverUrl}
                    alt={formData.title || book.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80';
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

                <div className="w-full bg-amber-50/80 border border-amber-200 p-3 rounded-xl text-xs space-y-2">
                  <div className="flex items-center justify-between text-stone-600">
                    <span className="font-semibold flex items-center gap-1">
                      <Barcode className="w-3.5 h-3.5 text-orange-600" /> ISBN / Barcode:
                    </span>
                    <span className="font-mono font-bold text-stone-800">{book.isbn}</span>
                  </div>
                  <div className="flex items-center justify-between text-stone-600">
                    <span className="font-semibold flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 text-emerald-600" /> Cílový režim:
                    </span>
                    <span className="font-bold text-emerald-800">
                      {isLibrarian ? 'Veřejný katalog' : 'Moje osobní knihovna'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  className="mt-3 text-xs font-semibold text-orange-700 hover:text-orange-800 bg-orange-100/70 hover:bg-orange-100 px-3 py-1.5 rounded-lg border border-orange-200 flex items-center gap-1.5 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  {isEditing ? 'Ukončit úpravy' : 'Upravit zobrazené údaje'}
                </button>
              </div>

              {/* Book Details Table / Editable Fields */}
              <div className="w-full md:w-2/3 space-y-4">

                {/* Title & Author */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase">Název knihy</label>
                    {isEditing ? (
                      <input
                        type="text"
                        required
                        value={formData.title ?? book.title}
                        onChange={(e) => handleChange('title', e.target.value)}
                        className="w-full mt-1 p-2 border border-stone-300 rounded-lg text-base font-bold focus:ring-2 focus:ring-orange-500"
                      />
                    ) : (
                      <h3 className="text-2xl font-black text-stone-900">{formData.title ?? book.title}</h3>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-orange-600" /> Autor / Autorka
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        required
                        value={formData.author ?? book.author}
                        onChange={(e) => handleChange('author', e.target.value)}
                        className="w-full mt-1 p-2 border border-stone-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-orange-500"
                      />
                    ) : (
                      <p className="text-base font-semibold text-stone-800">{formData.author ?? book.author}</p>
                    )}
                  </div>
                </div>

                {/* Grid Info Table */}
                <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">

                  {/* Publisher */}
                  <div>
                    <label className="text-xs font-semibold text-stone-500 flex items-center gap-1 mb-1">
                      <Building className="w-3.5 h-3.5 text-emerald-600" /> Nakladatelství
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.publisher ?? book.publisher}
                        onChange={(e) => handleChange('publisher', e.target.value)}
                        className="w-full p-1.5 border border-stone-300 rounded-md text-xs"
                      />
                    ) : (
                      <span className="font-semibold text-stone-800">{formData.publisher ?? book.publisher}</span>
                    )}
                  </div>

                  {/* Year */}
                  <div>
                    <label className="text-xs font-semibold text-stone-500 flex items-center gap-1 mb-1">
                      <Calendar className="w-3.5 h-3.5 text-orange-600" /> Rok vydání
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.year ?? book.year}
                        onChange={(e) => handleChange('year', e.target.value)}
                        className="w-full p-1.5 border border-stone-300 rounded-md text-xs"
                      />
                    ) : (
                      <span className="font-semibold text-stone-800">{formData.year ?? book.year}</span>
                    )}
                  </div>

                  {/* Age Group */}
                  <div>
                    <label className="text-xs font-semibold text-stone-500 flex items-center gap-1 mb-1">
                      <Users className="w-3.5 h-3.5 text-emerald-600" /> Cílová věková skupina
                    </label>
                    {isEditing ? (
                      <select
                        value={formData.targetAgeGroup ?? book.targetAgeGroup}
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
                      <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full border border-emerald-200">
                        {formData.targetAgeGroup ?? book.targetAgeGroup}
                      </span>
                    )}
                  </div>

                  {/* Language */}
                  <div>
                    <label className="text-xs font-semibold text-stone-500 flex items-center gap-1 mb-1">
                      <Globe className="w-3.5 h-3.5 text-orange-600" /> Jazyk
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.language ?? book.language}
                        onChange={(e) => handleChange('language', e.target.value)}
                        className="w-full p-1.5 border border-stone-300 rounded-md text-xs"
                      />
                    ) : (
                      <span className="font-semibold text-stone-800">{formData.language ?? book.language}</span>
                    )}
                  </div>

                  {/* Genre */}
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-stone-500 flex items-center gap-1 mb-1">
                      <Tag className="w-3.5 h-3.5 text-emerald-600" /> Žánr / Kategorie
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.genre ?? book.genre}
                        onChange={(e) => handleChange('genre', e.target.value)}
                        className="w-full p-1.5 border border-stone-300 rounded-md text-xs"
                      />
                    ) : (
                      <span className="font-semibold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md text-xs border border-amber-300">
                        {formData.genre ?? book.genre}
                      </span>
                    )}
                  </div>

                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Anotace / Popis</label>
                  {isEditing ? (
                    <textarea
                      rows={3}
                      value={formData.description ?? book.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      className="w-full p-2 border border-stone-300 rounded-lg text-xs leading-relaxed focus:ring-2 focus:ring-orange-500"
                    />
                  ) : (
                    <p className="text-xs text-stone-600 leading-relaxed bg-white p-3 rounded-lg border border-stone-200">
                      {formData.description ?? book.description}
                    </p>
                  )}
                </div>

                {isEditing && (
                  <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">URL Obálky</label>
                    <input
                      type="text"
                      value={formData.coverUrl ?? book.coverUrl}
                      onChange={(e) => handleChange('coverUrl', e.target.value)}
                      className="w-full p-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-orange-500"
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
                Zrušit
              </button>

              <button
                type="submit"
                className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
                  isLibrarian
                    ? 'bg-orange-600 hover:bg-orange-700 shadow-orange-600/20'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
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
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
