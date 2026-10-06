import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import QuickScannerView from './components/QuickScannerView';
import BookCatalogTable from './components/BookCatalogTable';
import LoansView from './components/LoansView';
import StatisticsView from './components/StatisticsView';
import AuthModal from './components/AuthModal';

function MainLayout() {
  const { currentUser } = useApp();
  const [activeView, setActiveView] = useState('scan'); // 'scan' | 'catalog' | 'my-collection' | 'loans' | 'stats'
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-stone-100/70 text-stone-800">

      {/* Top Navbar */}
      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeView === 'scan' && <QuickScannerView />}
        {activeView === 'catalog' && <BookCatalogTable isReaderOnly={false} />}
        {activeView === 'my-collection' && <BookCatalogTable isReaderOnly={true} />}
        {activeView === 'loans' && <LoansView />}
        {activeView === 'stats' && <StatisticsView />}
      </main>

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-400 text-xs border-t border-stone-800 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-2">
          <p className="font-bold text-stone-200">
            Bookstache 📚 - Aplikace pro knihovníky a čtenáře
          </p>
          <p className="text-stone-500">
            Oranžovo-zelená verze s podporou živého skenování čárových kódů, vyhledávání ISBN a správy výpůjček.
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
