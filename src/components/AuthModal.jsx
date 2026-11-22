import React, { useState } from 'react';
import { DEFAULT_USERS, useApp } from '../context/AppContext';
import { UserCheck, Shield, BookOpen, UserPlus, LogIn, Sparkles, X } from 'lucide-react';

export default function AuthModal({ isOpen, onClose }) {
  const { loginUser } = useApp();
  const [activeTab, setActiveTab] = useState('select'); // 'select' | 'custom'
  const [customRole, setCustomRole] = useState('reader');

  if (!isOpen) return null;

  const handleSelectUser = (user) => {
    loginUser(user);
    onClose();
  };

  const handleCreateCustomUser = (e) => {
    e.preventDefault();
    const id = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    handleSelectUser({ id: `user-custom-${id}`, role: customRole });
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="local-profile-title" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-parchment-200 w-full max-w-lg max-h-[90dvh] overflow-y-auto">
        {/* Header with Orange/Green Branding */}
        <div className="bg-forest-800 border-b-4 border-parchment-400 p-6 text-white text-center relative">
          <button type="button" onClick={onClose} aria-label="Zavřít" className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-white/20">
            <X className="w-5 h-5" />
          </button>
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl mx-auto flex items-center justify-center mb-3 shadow-inner">
            <Sparkles className="w-9 h-9 text-parchment-100" />
          </div>
          <h2 id="local-profile-title" className="text-2xl font-bold">Místní profily</h2>
          <p className="text-parchment-100 text-sm mt-1">
            Profily a sbírky se ukládají v tomto prohlížeči.
          </p>
        </div>

        <div className="border-b border-stone-200 bg-parchment-50 px-6 py-4">
          <a href="https://bookstache-ctenari.jauntydoor33.chatgpt.site/" className="inline-flex items-center gap-2 text-sm font-bold text-wine-700 underline">
            <LogIn className="h-4 w-4" /> Účet čtenáře na více zařízeních
          </a>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-stone-200 bg-stone-50">
          <button
            onClick={() => setActiveTab('select')}
            className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === 'select'
                ? 'border-wine-500 text-wine-600 bg-white'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Ukázkové profily
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === 'custom'
                ? 'border-forest-600 text-forest-700 bg-white'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            Vytvořit místní profil
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
                      ? 'border-wine-200 hover:border-wine-500 bg-wine-50/50 hover:bg-wine-50'
                      : 'border-forest-200 hover:border-forest-500 bg-forest-50/50 hover:bg-forest-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{user.avatar}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-800 group-hover:text-wine-600">
                          {user.name}
                        </span>
                        {user.role === 'librarian' ? (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-bold bg-wine-100 text-wine-800 border border-wine-300">
                            <Shield className="w-3 h-3" /> Knihovník
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-bold bg-forest-100 text-forest-800 border border-forest-300">
                            <BookOpen className="w-3 h-3" /> Čtenář
                          </span>
                        )}
                      </div>
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
                <label className="block text-xs font-semibold text-stone-700 mb-2">
                  Role v aplikaci
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    aria-pressed={customRole === 'reader'}
                    onClick={() => setCustomRole('reader')}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                      customRole === 'reader'
                        ? 'border-forest-600 bg-forest-50 ring-2 ring-forest-500'
                        : 'border-stone-200 hover:border-stone-300 bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-forest-800">
                      <BookOpen className="w-4 h-4" /> Čtenář
                    </div>
                    <span className="text-[11px] text-stone-500">
                      Ukládá si knihy do své osobní sbírky
                    </span>
                  </button>

                  <button
                    type="button"
                    aria-pressed={customRole === 'librarian'}
                    onClick={() => setCustomRole('librarian')}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                      customRole === 'librarian'
                        ? 'border-wine-500 bg-wine-50 ring-2 ring-wine-500'
                        : 'border-stone-200 hover:border-stone-300 bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-wine-800">
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
                  className="w-full py-3 px-4 bg-wine-600 hover:bg-wine-700 text-white font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <LogIn className="w-4 h-4" /> Použít místní profil
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
