import React, { useState } from 'react';
import { validateExternalEndpoint } from '../services/externalSyncService';
import { useApp } from '../context/AppContext';
import { Database, Link, Check, FileSpreadsheet, Settings } from 'lucide-react';

export default function ExternalSyncConfigBanner() {
  const { externalWebhookUrl, setExternalWebhookUrl, autoExportCsv, setAutoExportCsv, externalSyncStatus } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [tempUrl, setTempUrl] = useState(externalWebhookUrl);
  const [settingsError, setSettingsError] = useState('');
  const endpointError = validateExternalEndpoint(externalWebhookUrl);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveSettings = (e) => {
    e.preventDefault();
    const error = validateExternalEndpoint(tempUrl);
    setSettingsError(error);
    setSavedSuccess(false);
    if (error) return;
    setExternalWebhookUrl(tempUrl.trim());
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
                {externalWebhookUrl && !endpointError ? 'Odesílání nastaveno' : autoExportCsv ? 'Pouze CSV' : 'Nenastaveno'}
              </span>
            </p>
            <p className="text-emerald-300 mt-0.5">
              Po uložení knihy lze stáhnout CSV soubor nebo odeslat záznam do propojené online tabulky. CSV soubor sám online tabulku neaktualizuje.
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

      {endpointError && <p role="alert" className="mt-3 text-amber-200">{endpointError}</p>}
      {externalSyncStatus && (
        <p role={externalSyncStatus.state === 'error' ? 'alert' : 'status'} className={`mt-3 ${externalSyncStatus.state === 'error' ? 'text-amber-200' : 'text-white'}`}>
          {externalSyncStatus.message}
          {externalSyncStatus.state === 'error' && ' Kniha zůstává uložená v aplikaci.'}
        </p>
      )}

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
            <label htmlFor="external-endpoint-url" className="block font-bold text-white mb-1 flex items-center gap-1">
              <Link className="w-3.5 h-3.5 text-emerald-300" /> Adresa webové aplikace Apps Script nebo webhooku (Make, Zapier):
            </label>
            <div className="flex gap-2">
              <input
                id="external-endpoint-url"
                aria-describedby="external-endpoint-help"
                type="url"
                placeholder="https://script.google.com/macros/s/.../exec"
                value={tempUrl}
                onChange={(e) => { setTempUrl(e.target.value); setSettingsError(''); setSavedSuccess(false); }}
                className="flex-1 p-2 rounded-xl bg-emerald-950 border border-emerald-700 text-white placeholder-emerald-600 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors flex items-center gap-1"
              >
                {savedSuccess ? <><Check className="w-4 h-4" /> Nastavení uloženo</> : 'Uložit'}
              </button>
            </div>
          </div>
          <p id="external-endpoint-help" className="text-emerald-200">
            Běžný odkaz na Google tabulku sem nepatří. Uložení nastavení pouze uloží adresu; data se odešlou při příštím uložení knihy.
            Prázdnou adresou odesílání vypnete.
          </p>
          {settingsError && <p role="alert" className="text-amber-200">{settingsError}</p>}
          <details className="rounded-xl bg-emerald-950 p-3 text-emerald-100">
            <summary className="cursor-pointer font-bold">Jak propojit Google tabulku</summary>
            <ol className="list-decimal pl-5 space-y-2 mt-3">
              <li>Otevřete cílovou tabulku a zvolte Rozšíření → Apps Script.</li>
              <li><a className="underline" href={`${import.meta.env.BASE_URL}google-apps-script.gs`} download>Stáhněte připravený skript</a>, vložte jeho obsah do editoru a doplňte ID tabulky z její adresy (část mezi /d/ a /edit).</li>
              <li>Zvolte Nasadit → Nové nasazení → Webová aplikace. Spouštět jako: Já. Kdo má přístup: Kdokoli. Potvrďte oprávnění ke své tabulce. Pokud váš účet tuto volbu nepovoluje, použijte webhook schválený správcem.</li>
              <li>Zkopírujte adresu webové aplikace končící /exec, vložte ji výše a uložte nastavení. Při změně skriptu aktualizujte i nasazení.</li>
              <li>Uložte knihu v aplikaci a zkontrolujte potvrzení odeslání i nový řádek na listu Bookstache v Google tabulce.</li>
            </ol>
            <p className="mt-3">Adresu nasazení nesdílejte: kdo ji zná, může přidávat řádky do vyhrazeného listu Bookstache. Skript nevrací obsah tabulky.</p>
          </details>
        </form>
      )}
    </div>
  );
}
