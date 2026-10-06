import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Scan,
  BookOpen,
  Bookmark,
  HandHeart,
  BarChart2,
  Shield,
  User,
  LogOut,
  UserCheck,
  Sparkles,
  LogIn
} from 'lucide-react';

export default function Navbar({ activeView, setActiveView, onOpenAuthModal }) {
  const { currentUser, logoutUser, publicCatalog, readerCollections, loans } = useApp();

  const isLibrarian = currentUser?.role === 'librarian';
  const readerCount = currentUser && !isLibrarian ? (readerCollections[currentUser.id] || []).length : 0;
  const activeLoansCount = loans.filter((l) => !l.returned).length;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">

          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveView('scan')}
              className="flex items-center gap-3 group text-left focus:outline-none"
            >
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-orange-500 via-amber-500 to-emerald-600 p-0.5 shadow-md group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-stone-900 rounded-[14px] flex items-center justify-center text-amber-400">
                  <BookOpen className="w-6 h-6" />
                </div>
              </div>
              <div>
                <span className="text-2xl font-black tracking-tight text-stone-900 flex items-center gap-1">
                  Bookstache <span className="text-orange-600 text-3xl font-serif">.</span>
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block -mt-1">
                  Systém pro knihovníky & čtenáře
                </span>
              </div>
            </button>
          </div>

          {/* Main Desktop Navigation Menu */}
          <nav className="hidden md:flex items-center gap-1 bg-stone-100/80 p-1.5 rounded-2xl border border-stone-200/80">
            <button
              onClick={() => setActiveView('scan')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeView === 'scan'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-sm'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
              }`}
            >
              <Scan className="w-4 h-4" />
              Skener & Vložení
            </button>

            <button
              onClick={() => setActiveView('catalog')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeView === 'catalog'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-sm'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Veřejný katalog
              <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-stone-200 text-stone-700">
                {publicCatalog.length}
              </span>
            </button>

            {!isLibrarian && (
              <button
                onClick={() => setActiveView('my-collection')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeView === 'my-collection'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-sm'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
                }`}
              >
                <Bookmark className="w-4 h-4" />
                Moje sbírka
                <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                  {readerCount}
                </span>
              </button>
            )}

            {isLibrarian && (
              <button
                onClick={() => setActiveView('loans')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeView === 'loans'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-sm'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
                }`}
              >
                <HandHeart className="w-4 h-4" />
                Výpůjčky
                {activeLoansCount > 0 && (
                  <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white">
                    {activeLoansCount}
                  </span>
                )}
              </button>
            )}

            <button
              onClick={() => setActiveView('stats')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeView === 'stats'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-sm'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              Statistiky
            </button>
          </nav>

          {/* User Profile / Role Toggle Bar */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-2">
                <div className="p-1.5 pl-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-2.5">
                  <span className="text-xl">{currentUser.avatar}</span>
                  <div className="text-left hidden lg:block">
                    <p className="text-xs font-extrabold text-stone-800 leading-none">
                      {currentUser.name}
                    </p>
                    <p className="text-[10px] font-bold text-orange-700 flex items-center gap-1 mt-0.5">
                      {isLibrarian ? (
                        <>
                          <Shield className="w-3 h-3 text-orange-600" /> Knihovník
                        </>
                      ) : (
                        <>
                          <User className="w-3 h-3 text-emerald-600" /> Čtenář
                        </>
                      )}
                    </p>
                  </div>

                  <button
                    onClick={onOpenAuthModal}
                    className="p-1.5 hover:bg-amber-100 rounded-xl text-stone-600 transition-colors"
                    title="Přepnout profil / změnit roli"
                  >
                    <UserCheck className="w-4 h-4 text-orange-600" />
                  </button>
                </div>

                <button
                  onClick={logoutUser}
                  className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                  title="Odhlásit se"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                Přihlásit se
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Mobile Submenu Nav Bar */}
      <div className="md:hidden border-t border-stone-200 bg-stone-50 px-4 py-2 flex items-center justify-around overflow-x-auto text-xs">
        <button
          onClick={() => setActiveView('scan')}
          className={`py-1.5 px-3 rounded-lg font-bold flex items-center gap-1.5 whitespace-nowrap ${
            activeView === 'scan' ? 'bg-orange-500 text-white' : 'text-stone-600'
          }`}
        >
          <Scan className="w-3.5 h-3.5" /> Skener
        </button>

        <button
          onClick={() => setActiveView('catalog')}
          className={`py-1.5 px-3 rounded-lg font-bold flex items-center gap-1.5 whitespace-nowrap ${
            activeView === 'catalog' ? 'bg-orange-500 text-white' : 'text-stone-600'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" /> Katalog ({publicCatalog.length})
        </button>

        {!isLibrarian && (
          <button
            onClick={() => setActiveView('my-collection')}
            className={`py-1.5 px-3 rounded-lg font-bold flex items-center gap-1.5 whitespace-nowrap ${
              activeView === 'my-collection' ? 'bg-emerald-600 text-white' : 'text-stone-600'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" /> Moje sbírka ({readerCount})
          </button>
        )}

        {isLibrarian && (
          <button
            onClick={() => setActiveView('loans')}
            className={`py-1.5 px-3 rounded-lg font-bold flex items-center gap-1.5 whitespace-nowrap ${
              activeView === 'loans' ? 'bg-emerald-600 text-white' : 'text-stone-600'
            }`}
          >
            <HandHeart className="w-3.5 h-3.5" /> Výpůjčky
          </button>
        )}

        <button
          onClick={() => setActiveView('stats')}
          className={`py-1.5 px-3 rounded-lg font-bold flex items-center gap-1.5 whitespace-nowrap ${
            activeView === 'stats' ? 'bg-emerald-600 text-white' : 'text-stone-600'
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5" /> Statistiky
        </button>
      </div>
    </header>
  );
}
