import React, { useState, useRef, useEffect } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { decodeBarcodeFromImageFile } from '../services/barcodeScanner';
import { fetchBookDetailsByIsbn } from '../services/bookService';
import BookSearch from './BookSearch';
import BookDetailModal from './BookDetailModal';
import ExternalSyncConfigBanner from './ExternalSyncConfigBanner';
import { Camera, Upload, Keyboard, AlertCircle, Loader2, Sparkles, Scan, ArrowRight, BookOpen, Bookmark, Search } from 'lucide-react';

export default function QuickScannerView() {
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' | 'upload' | 'manual'
  const [manualIsbn, setManualIsbn] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [scannedBook, setScannedBook] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [awaitingNewCode, setAwaitingNewCode] = useState(false);

  const fileInputRef = useRef(null);
  const cameraBlockedRef = useRef(false);
  const cameraPauseRef = useRef(null);
  const cameraQueueRef = useRef(Promise.resolve());
  const [cameraRetry, setCameraRetry] = useState(0);

  // Serialize start/stop, including starts still waiting for camera permission.
  // Each effect owns its scanner so an old cleanup cannot stop a new session.
  useEffect(() => {
    if (activeTab !== 'camera') return;

    let cancelled = false;
    let lastCode = null;
    let lastSeen = 0;
    let scanner;
    let started = false;
    setCameraActive(false);
    setErrorMsg('');
    setAwaitingNewCode(false);

    const syncPause = () => {
      if (!started || cancelled) return;
      if (cameraBlockedRef.current && scanner.getState() === Html5QrcodeScannerState.SCANNING) {
        // Keep the video and its MediaStream alive; pause decoding only.
        scanner.pause(false);
      } else if (!cameraBlockedRef.current && scanner.getState() === Html5QrcodeScannerState.PAUSED) {
        lastSeen = Date.now();
        scanner.resume();
      }
    };
    cameraPauseRef.current = syncPause;

    const start = cameraQueueRef.current.then(async () => {
      if (cancelled) return;
      try {
        scanner = new Html5Qrcode('qr-reader-region');
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 280, height: 160 } },
          (decodedText) => {
            if (cancelled || cameraBlockedRef.current) return;
            lastSeen = Date.now();
            if (decodedText === lastCode) return;
            lastCode = decodedText;
            setAwaitingNewCode(true);
            cameraBlockedRef.current = true;
            syncPause();
            handleCodeDetected(decodedText);
          },
          () => {
            if (cancelled || cameraBlockedRef.current) return;
            // Re-arm the same ISBN only after it has left the viewfinder.
            if (lastCode && Date.now() - lastSeen > 1200) {
              lastCode = null;
              setAwaitingNewCode(false);
            }
          }
        );
        started = true;
        if (!cancelled) {
          syncPause();
          setCameraActive(true);
        }
      } catch (err) {
        if (!cancelled) {
          setCameraActive(false);
          setErrorMsg('Kamera nebyla nalezena nebo přístup k ní byl odmítnut. Můžete nahrát fotku z galerie nebo zadat ISBN ručně.');
        }
      }
    });
    cameraQueueRef.current = start;

    return () => {
      cancelled = true;
      if (cameraPauseRef.current === syncPause) cameraPauseRef.current = null;
      setCameraActive(false);
      cameraQueueRef.current = start.then(async () => {
        if (!scanner) return;
        if (started) await scanner.stop();
        scanner.clear();
      }).catch(() => {
        // Keep the queue usable if a disconnected camera fails to stop.
      });
    };
  }, [activeTab, cameraRetry]);

  useEffect(() => {
    cameraBlockedRef.current = loading || isModalOpen;
    cameraPauseRef.current?.();
  }, [loading, isModalOpen]);

  const handleCodeDetected = async (code) => {
    if (!code) return;
    cameraBlockedRef.current = true;
    cameraPauseRef.current?.();
    setLoading(true);
    setErrorMsg('');
    try {
      const bookData = await fetchBookDetailsByIsbn(code);
      setScannedBook(bookData);
      setIsModalOpen(true);
    } catch (err) {
      setErrorMsg('Chyba při stahování informací o knize. Zkuste to prosím znovu.');
    } finally {
      setLoading(false);
    }
  };

  // Upload image from device / gallery
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setErrorMsg('');
    try {
      const code = await decodeBarcodeFromImageFile(file);
      await handleCodeDetected(code);
    } catch (err) {
      setErrorMsg(err.message || 'Nepodařilo se načíst kód z vloženého obrázku.');
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Manual ISBN submit
  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualIsbn.trim()) return;
    handleCodeDetected(manualIsbn);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      <section className="library-hero relative overflow-hidden rounded-2xl border border-parchment-200 p-5 sm:p-10">
        <div className="relative z-10 max-w-xl md:max-w-[65%]">
          <p className="mb-4 text-[10px] sm:text-xs font-extrabold tracking-[0.2em] uppercase text-wine-700 flex items-center gap-2">
            <span className="h-px w-8 bg-wine-400" /> Vaše osobní čítárna
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl leading-[1.18] text-forest-900">
            Každá kniha má<br /><em className="text-wine-700">svůj příběh.</em>
          </h1>
          <p className="mt-4 max-w-md text-sm sm:text-base leading-relaxed text-stone-600">
            Naskenujte ISBN, objevte knihu a najděte jí místo ve své knihovně.
          </p>
          <div className="mt-6 hidden sm:flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold text-forest-700">
            <span className="flex items-center gap-1.5"><Scan className="w-4 h-4" /> Naskenovat</span>
            <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4" /> Objevit</span>
            <span className="flex items-center gap-1.5"><Bookmark className="w-4 h-4" /> Uchovat</span>
          </div>
        </div>
        <div className="library-illustration hidden md:block" aria-hidden="true">
          <div className="library-stamp">EX LIBRIS<span>Bookstache</span><BookOpen size={22} /></div>
          <div className="book-spine spine-one"><span>Příběhy</span></div>
          <div className="book-spine spine-two"><span>Malé radosti</span></div>
          <div className="book-spine spine-three"><span>Nové světy</span></div>
          <div className="book-stack"><span>Ještě jednu kapitolu…</span></div>
          <div className="book-shelf" />
        </div>
      </section>

      {/* Tabs */}
      <div className="library-tabs bg-white rounded-2xl border border-stone-200 p-2 shadow-sm grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          onClick={() => setActiveTab('camera')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
            activeTab === 'camera'
              ? 'bg-wine-700 text-white shadow-md'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <Camera className="w-4 h-4" /> Živá kamera
        </button>

        <button
          onClick={() => setActiveTab('upload')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
            activeTab === 'upload'
              ? 'bg-forest-700 text-white shadow-md'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <Upload className="w-4 h-4" /> Nahrát fotku ze zařízení
        </button>

        <button
          onClick={() => setActiveTab('manual')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
            activeTab === 'manual'
              ? 'bg-parchment-700 text-white shadow-md'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <Keyboard className="w-4 h-4" /> Ruční zadání ISBN
        </button>
        <button onClick={() => setActiveTab('search')} className={`py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 ${activeTab === 'search' ? 'bg-wine-700 text-white' : 'text-stone-600 hover:bg-stone-100'}`}>
          <Search className="w-4 h-4" /> Hledat podle názvu / autora
        </button>
      </div>

      {/* Main Scanner Container */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-md relative min-h-[340px] flex flex-col items-center justify-center">

        {activeTab === 'search' && <BookSearch />}

        {loading && (
          <div className="absolute inset-0 z-20 bg-white/90 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-12 h-12 text-wine-600 animate-spin" />
            <p className="font-bold text-stone-800 text-base">Hledám informace o knize...</p>
            <p className="text-xs text-stone-500">Dotazuji se v databázích dat a připravuji tabulku</p>
          </div>
        )}

        {/* Tab 1: Live Camera Scanner */}
        <div hidden={activeTab !== 'camera'} className="w-full">
          <div className="w-full flex flex-col items-center">
            <div className="relative w-full max-w-md overflow-hidden rounded-xl border-2 border-dashed border-wine-400 bg-stone-900 shadow-inner">
              <div id="qr-reader-region" className="w-full min-h-[250px]" />

              {!cameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-stone-900/90 text-white space-y-3">
                  <Camera className="w-12 h-12 text-wine-400 animate-pulse" />
                  <p className="text-sm font-semibold">Připravuji kameru...</p>
                  <button
                    onClick={() => setCameraRetry((retry) => retry + 1)}
                    className="px-4 py-2 bg-wine-600 hover:bg-wine-700 text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    Zapnout kameru znova
                  </button>
                </div>
              )}
            </div>
            <p className="text-xs text-stone-500 mt-3 font-medium">
              {awaitingNewCode
                ? 'Kód načten. Odsuňte knihu z obrazu a přiložte další.'
                : 'Zamiřte kamerou na čárový nebo ISBN kód na zadní straně knihy.'}
            </p>
          </div>
        </div>

        {/* Tab 2: Upload Photo */}
        {activeTab === 'upload' && (
          <div className="w-full max-w-md text-center p-8 border-2 border-dashed border-forest-400 rounded-2xl bg-forest-50/50 hover:bg-forest-50 transition-colors">
            <div className="w-16 h-16 bg-forest-100 rounded-full flex items-center justify-center mx-auto mb-4 text-forest-700 shadow-inner">
              <Upload className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-stone-800 text-base mb-1">
              Vyberte fotku s čárovým kódem
            </h3>
            <p className="text-xs text-stone-500 mb-6">
              Podporuje snímky z mobilu i z fotoaparátu (JPG, PNG, WEBP)
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload-input"
            />
            <label
              htmlFor="file-upload-input"
              className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 bg-forest-600 hover:bg-forest-700 text-white font-bold rounded-xl shadow-md transition-colors text-sm"
            >
              <Upload className="w-4 h-4" /> Vybrat obrázek z galerie
            </label>
          </div>
        )}

        {/* Tab 3: Manual Input */}
        {activeTab === 'manual' && (
          <form onSubmit={handleManualSubmit} className="w-full max-w-md space-y-4">
            <div className="text-center mb-2">
              <div className="w-12 h-12 bg-parchment-100 rounded-full flex items-center justify-center mx-auto mb-2 text-parchment-700">
                <Keyboard className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-stone-800 text-base">Ruční zadání ISBN kódu</h3>
              <p className="text-xs text-stone-500">Zadejte 10 nebo 13-místný ISBN kód knihy</p>
            </div>

            <div>
              <input
                type="text"
                placeholder="např. 9788020719805"
                value={manualIsbn}
                onChange={(e) => setManualIsbn(e.target.value)}
                className="w-full px-4 py-3 border-2 border-parchment-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-parchment-500 text-center font-mono font-bold text-lg tracking-widest"
              />
            </div>

            <button
              type="submit"
              disabled={!manualIsbn.trim()}
              className="w-full py-3 bg-parchment-600 hover:bg-parchment-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 text-sm"
            >
              Vyhledat knihu <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Error Message Alert */}
        {errorMsg && (
          <div className="mt-4 w-full max-w-md p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
            <div>
              <p className="font-bold">Chyba skenování</p>
              <p>{errorMsg}</p>
            </div>
          </div>
        )}

      </div>

      <ExternalSyncConfigBanner />

      {/* Quick Test Demo Barcodes */}
      <div className="bg-parchment-50/70 border border-parchment-200 rounded-xl p-4 text-xs">
        <p className="font-bold text-stone-700 mb-2 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-parchment-600" /> Rychlé vyzkoušení s příkladovými kódy:
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            { isbn: '9788020719805', label: 'Babička (Němcová)' },
            { isbn: '9788073816216', label: 'Malý princ' },
            { isbn: '9788025726242', label: '1984 (Orwell)' },
            { isbn: '9788074914101', label: 'Hobit (Tolkien)' }
          ].map((sample) => (
            <button
              key={sample.isbn}
              onClick={() => {
                setManualIsbn(sample.isbn);
                handleCodeDetected(sample.isbn);
              }}
              className="px-2.5 py-1.5 bg-white border border-parchment-300 rounded-lg hover:bg-parchment-100 text-stone-800 font-mono font-semibold transition-colors shadow-sm"
            >
              {sample.label} <span className="text-stone-400 font-normal">({sample.isbn})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Book Detail Modal */}
      <BookDetailModal
        book={scannedBook}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={() => {
          setIsModalOpen(false);
          setScannedBook(null);
          setManualIsbn('');
          setActiveTab('camera');
          requestAnimationFrame(() => {
            document.getElementById('qr-reader-region')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          });
        }}
      />
    </div>
  );
}
