import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Database, Link, Check, FileSpreadsheet, Settings, Send, AlertTriangle, Info, Code } from 'lucide-react';
import { sendBookToExternalEndpoint } from '../services/externalSyncService';

export default function ExternalSyncConfigBanner() {
  const { externalWebhookUrl, setExternalWebhookUrl, autoExportCsv, setAutoExportCsv, publicCatalog } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [tempUrl, setTempUrl] = useState(externalWebhookUrl);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [testStatus, setTestStatus] = useState(null); // null | 'testing' | { success: bool, msg: string }

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setExternalWebhookUrl(tempUrl);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleTestConnection = async () => {
    if (!tempUrl || !tempUrl.trim()) {
      setTestStatus({ success: false, msg: 'Zadejte platnou URL adresu Google Apps Scriptu nebo Webhooku.' });
      return;
    }

    setTestStatus('testing');
    const sampleBook = publicCatalog[0] || {
      id: 'test-book-1',
      isbn: '9788025726242',
      title: 'Testovací kniha',
      author: 'Testovací autor',
      publisher: 'Test Publisher',
      year: '2025',
      language: 'Čeština',
      genre: 'Test',
      targetAgeGroup: 'Pro všechny',
      isAvailable: true,
      addedDate: new Date().toISOString().split('T')[0]
    };

    const res = await sendBookToExternalEndpoint(tempUrl, sampleBook, 'knihovnik_test');
    if (res.success) {
      setTestStatus({ success: true, msg: 'Testovací záznam byl úspěšně odeslán do Google Sheets / Webhooku!' });
    } else {
      setTestStatus({ success: false, msg: res.error || 'Nepodařilo se navázat spojení.' });
    }
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
                {savedSuccess ? <Check className="w-4 h-4" /> : 'Uložit URL'}
              </button>
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testStatus === 'testing'}
                className="px-3 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold rounded-xl transition-colors flex items-center gap-1"
                title="Otestovat odeslání testovacího řádku"
              >
                <Send className="w-3.5 h-3.5" />
                {testStatus === 'testing' ? 'Odesílám...' : 'Test'}
              </button>
            </div>
          </div>

          {testStatus && typeof testStatus === 'object' && (
            <div className={`p-2.5 rounded-xl text-xs flex items-center gap-2 border ${testStatus.success ? 'bg-emerald-950 border-emerald-500 text-emerald-200' : 'bg-red-950 border-red-500 text-red-200'}`}>
              {testStatus.success ? <Check className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />}
              <span>{testStatus.msg}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              className="text-xs text-amber-300 hover:text-amber-200 underline font-semibold flex items-center gap-1"
            >
              <Code className="w-3.5 h-3.5" /> Jak nastavit bezplatný Google Sheets Webhook za 2 minuty
            </button>

            {showGuide && (
              <div className="mt-3 p-3 bg-emerald-950/80 border border-emerald-700/80 rounded-xl space-y-2 text-emerald-200 text-xs leading-relaxed">
                <p className="font-bold text-white flex items-center gap-1">
                  <Info className="w-4 h-4 text-amber-400" /> Návod pro správce k propojení Google Tabulky:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-emerald-300">
                  <li>Otevřete vaši Google Tabulku (Google Sheets).</li>
                  <li>V menu klikněte na <strong>Rozšíření &gt; Apps Script</strong>.</li>
                  <li>Vložte kód skriptu, který zpracuje příchozí JSON z Bookstache a zapíše řádek podle <code>book.id</code> (brání duplicitám).</li>
                  <li>Klikněte na <strong>Nasadit &gt; Nové nasazení</strong>, zvolte typ <strong>Webová aplikace</strong>, Přístup: <strong>Kdo koli (Anyone)</strong>.</li>
                  <li>Zkopírujte vygenerované URL (končící na <code>/exec</code>) a vložte ho do pole výše.</li>
                </ol>
              </div>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
