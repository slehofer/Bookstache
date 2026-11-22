import React, { useEffect, useState } from 'react';
import { AppProvider } from './context/AppContext';
import Navbar from './components/Navbar';
import DailyBookView from './components/DailyBookView';
import QuickScannerView from './components/QuickScannerView';
import BookCatalogTable from './components/BookCatalogTable';
import LoansView from './components/LoansView';
import StatisticsView from './components/StatisticsView';
import AuthModal from './components/AuthModal';

function MainLayout() {
  const viewFromHash = () => {
    const view = window.location.hash.slice(1);
    return ['search', 'catalog', 'daily-book', 'my-collection', 'loans', 'stats'].includes(view) ? view : 'add-books';
  };
  const [activeView, updateActiveView] = useState(viewFromHash);
  const setActiveView = (view) => {
    updateActiveView(view);
    window.location.hash = view;
  };
  useEffect(() => {
    const onHashChange = () => updateActiveView(viewFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const addingBooks = activeView === 'add-books' || activeView === 'search';

  return (
    <div className="library-shell min-h-screen flex flex-col text-stone-800">

      {/* Top Navbar */}
      <Navbar
        activeView={addingBooks ? 'add-books' : activeView}
        setActiveView={setActiveView}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {addingBooks && <QuickScannerView key={activeView} initialTab={activeView === 'search' ? 'search' : 'camera'} />}
        {activeView === 'daily-book' && <DailyBookView />}
        {activeView === 'catalog' && <BookCatalogTable isReaderOnly={false} />}
        {activeView === 'my-collection' && <BookCatalogTable isReaderOnly={true} />}
        {activeView === 'loans' && <LoansView />}
        {activeView === 'stats' && <StatisticsView />}
      </main>

      {/* Footer */}
      <footer className="library-footer text-stone-600 text-xs border-t border-stone-200 py-7 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-2">
          <p className="font-serif text-lg text-forest-900">
            Bookstache · Místo pro vaše příběhy
          </p>
          <p className="text-stone-500">
            Od prvního naskenování po poslední dočtenou stránku.
          </p>
        </div>
      </footer>

      {/* Authentication & Role Switcher Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
