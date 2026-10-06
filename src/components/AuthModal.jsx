import React, { useState } from 'react';
import { DEFAULT_USERS, useApp } from '../context/AppContext';
import { UserCheck, Shield, BookOpen, UserPlus, LogIn, Sparkles } from 'lucide-react';

export default function AuthModal({ isOpen, onClose }) {
  const { loginUser } = useApp();
  const [activeTab, setActiveTab] = useState('select'); // 'select' | 'custom'
  const [customName, setCustomName] = useState('');
  const [customRole, setCustomRole] = useState('reader');
  const [customEmail, setCustomEmail] = useState('');

  if (!isOpen) return null;

  const handleSelectUser = (user) => {
    loginUser(user);
    onClose();
  };

  const handleCreateCustomUser = (e) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const newUser = {
      id: `user-custom-${Date.now()}`,
      username: customName.toLowerCase().replace(/\s+/g, '.'),
      name: customName,
      role: customRole,
      email: customEmail || `${customName.toLowerCase().replace(/\s+/g, '.')}@knihovna-user.cz`,
      avatar: customRole === 'librarian' ? '👩‍💼' : '📖'
    };

    loginUser(newUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-amber-200 w-full max-w-lg overflow-hidden">
        {/* Header with Orange/Green Branding */}
        <div className="bg-gradient-to-r from-orange-500 via-amber-600 to-emerald-600 p-6 text-white text-center relative">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl mx-auto flex items-center justify-center mb-3 shadow-inner">
            <Sparkles className="w-9 h-9 text-amber-100" />
          </div>
          <h2 className="text-2xl font-bold">Přihlášení do Bookstache</h2>
          <p className="text-amber-100 text-sm mt-1">
            Vyberte si profil pro přístup ke službám knihovny
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-stone-200 bg-stone-50">
          <button
            onClick={() => setActiveTab('select')}
            className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === 'select'
                ? 'border-orange-500 text-orange-600 bg-white'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Rychlé účty (Demo)
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === 'custom'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            Vytvořit účet
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {activeTab === 'select' ? (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
                Zvolte roli pro otestování aplikace:
              </p>

              {DEFAULT_USERS.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  className={`w-full p-4 rounded-xl border text-left transition-all flex items-center justify-between group hover:shadow-md ${
                    user.role === 'librarian'
                      ? 'border-orange-200 hover:border-orange-500 bg-orange-50/50 hover:bg-orange-50'
                      : 'border-emerald-200 hover:border-emerald-500 bg-emerald-50/50 hover:bg-emerald-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{user.avatar}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-800 group-hover:text-orange-600">
                          {user.name}
                        </span>
                        {user.role === 'librarian' ? (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-bold bg-orange-100 text-orange-800 border border-orange-300">
                            <Shield className="w-3 h-3" /> Knihovník
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <BookOpen className="w-3 h-3" /> Čtenář
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-500 mt-0.5">{user.email}</p>
                      <p className="text-xs text-stone-600 mt-1 italic">
                        {user.role === 'librarian'
                          ? 'Okamžité skenování, správa celého katalogu a výpůjček'
                          : 'Prohlížení knih, skenování do vlastní čtenářské sbírky'}
                      </p>
                    </div>
                  </div>
                  <LogIn className="w-5 h-5 text-stone-400 group-hover:text-stone-700 group-hover:translate-x-1 transition-transform" />
                </button>
              ))}
            </div>
          ) : (
            <form onSubmit={handleCreateCustomUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Jméno a příjmení
                </label>
                <input
                  type="text"
                  required
                  placeholder="např. Marie Svobodová"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  E-mailová adresa (volitelné)
                </label>
                <input
                  type="email"
                  placeholder="marie@seznam.cz"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-2">
                  Role v aplikaci
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCustomRole('reader')}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                      customRole === 'reader'
                        ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-500'
                        : 'border-stone-200 hover:border-stone-300 bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-800">
                      <BookOpen className="w-4 h-4" /> Čtenář
                    </div>
                    <span className="text-[11px] text-stone-500">
                      Ukládá si knihy do své osobní sbírky
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCustomRole('librarian')}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                      customRole === 'librarian'
                        ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-500'
                        : 'border-stone-200 hover:border-stone-300 bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-orange-800">
                      <Shield className="w-4 h-4" /> Knihovník
                    </div>
                    <span className="text-[11px] text-stone-500">
                      Přidává knihy do veřejné knihovny
                    </span>
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <LogIn className="w-4 h-4" /> Vstoupit do aplikace
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
