import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Database, Link, Check, FileSpreadsheet, Settings } from 'lucide-react';

export default function ExternalSyncConfigBanner() {
  const { externalWebhookUrl, setExternalWebhookUrl, autoExportCsv, setAutoExportCsv } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [tempUrl, setTempUrl] = useState(externalWebhookUrl);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setExternalWebhookUrl(tempUrl);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="bg-emerald-900 text-emerald-100 rounded-2xl p-4 shadow-md border border-emerald-700/60 text-xs my-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-800 rounded-xl text-emerald-300">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <p className="font-extrabold text-white text-sm flex items-center gap-2">
              Automatické ukládání do externí tabulky
              <span className="px-2 py-0.5 bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 rounded-full text-[10px]">
                Aktivní
              </span>
            </p>
            <p className="text-emerald-300 mt-0.5">
              Každá naskenovaná kniha se automaticky generuje do externí CSV tabulky zařízení nebo odesílá na Google Sheets / Webhook.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-xl border border-emerald-600 transition-colors flex items-center gap-1.5 shrink-0"
        >
          <Settings className="w-3.5 h-3.5 text-emerald-300" />
          {isOpen ? 'Skrýt nastavení' : 'Nastavit Webhook / Google Sheets'}
        </button>
      </div>

      {isOpen && (
        <form onSubmit={handleSaveSettings} className="mt-4 pt-4 border-t border-emerald-800 space-y-3 animate-fadeIn">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-white">
              <input
                type="checkbox"
                checked={autoExportCsv}
                onChange={(e) => setAutoExportCsv(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-emerald-700 focus:ring-emerald-500"
              />
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
              Automaticky vytvářet CSV soubor tabulky po uložení knihy
            </label>
          </div>

          <div>
            <label className="block font-bold text-white mb-1 flex items-center gap-1">
              <Link className="w-3.5 h-3.5 text-emerald-300" /> URL externí tabulky / Webhooku (Google Sheets Script, Make, Zapier):
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://script.google.com/macros/s/.../exec"
                value={tempUrl}
                onChange={(e) => setTempUrl(e.target.value)}
                className="flex-1 p-2 rounded-xl bg-emerald-950 border border-emerald-700 text-white placeholder-emerald-600 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors flex items-center gap-1"
              >
                {savedSuccess ? <Check className="w-4 h-4" /> : 'Uložit'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
