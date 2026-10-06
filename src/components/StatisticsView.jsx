import React from 'react';
import { useApp } from '../context/AppContext';
import { BarChart2, BookOpen, HandHeart, Users, CheckCircle, Tag } from 'lucide-react';

export default function StatisticsView() {
  const { publicCatalog, loans, readerCollections } = useApp();

  const totalBooks = publicCatalog.length;
  const availableBooks = publicCatalog.filter((b) => b.isAvailable).length;
  const borrowedBooks = totalBooks - availableBooks;

  // Genre breakdown
  const genreCounts = publicCatalog.reduce((acc, book) => {
    const g = book.genre || 'Nespecifikovaný';
    acc[g] = (acc[g] || 0) + 1;
    return acc;
  }, {});

  // Target Age Group breakdown
  const ageGroupCounts = publicCatalog.reduce((acc, book) => {
    const a = book.targetAgeGroup || 'Nespecifikovaná';
    acc[a] = (acc[a] || 0) + 1;
    return acc;
  }, {});

  // Total registered reader collections count
  const totalReaderCollections = Object.values(readerCollections).reduce(
    (sum, arr) => sum + arr.length,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-emerald-700 p-6 rounded-2xl text-white shadow-xl">
        <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-amber-100 mb-2">
          <BarChart2 className="w-4 h-4" /> Knihovní přehledy & Analýza
        </div>
        <h2 className="text-2xl font-black">Statistiky fondu a aktivity</h2>
        <p className="text-amber-100 text-xs mt-1">
          Přehledné grafické ukazatele složení knihovního fondu a čtenářského zájmu
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xl">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-stone-500 font-bold text-xs uppercase">Celkem titulů</p>
            <p className="text-2xl font-black text-stone-900">{totalBooks}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xl">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-stone-500 font-bold text-xs uppercase">Skladem k půjčení</p>
            <p className="text-2xl font-black text-emerald-700">{availableBooks}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xl">
            <HandHeart className="w-6 h-6" />
          </div>
          <div>
            <p className="text-stone-500 font-bold text-xs uppercase">Aktuálně vypůjčeno</p>
            <p className="text-2xl font-black text-amber-700">{borrowedBooks}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-stone-500 font-bold text-xs uppercase">Uloženo čtenáři</p>
            <p className="text-2xl font-black text-teal-800">{totalReaderCollections}</p>
          </div>
        </div>
      </div>

      {/* Breakdown Graphs Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Genre Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
          <h3 className="font-extrabold text-stone-900 text-base flex items-center gap-2">
            <Tag className="w-5 h-5 text-orange-600" /> Rozdělení podle žánru
          </h3>
          <div className="space-y-3">
            {Object.entries(genreCounts).map(([genre, count]) => {
              const percent = Math.round((count / (totalBooks || 1)) * 100);
              return (
                <div key={genre} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-stone-700">
                    <span>{genre}</span>
                    <span className="text-orange-700">{count} ks ({percent}%)</span>
                  </div>
                  <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Target Age Group Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
          <h3 className="font-extrabold text-stone-900 text-base flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" /> Cílové věkové skupiny
          </h3>
          <div className="space-y-3">
            {Object.entries(ageGroupCounts).map(([group, count]) => {
              const percent = Math.round((count / (totalBooks || 1)) * 100);
              return (
                <div key={group} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-stone-700">
                    <span>{group}</span>
                    <span className="text-emerald-700">{count} ks ({percent}%)</span>
                  </div>
                  <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
