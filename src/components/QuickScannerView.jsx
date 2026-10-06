import React, { useState, useRef, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { decodeBarcodeFromImageFile } from '../services/barcodeScanner';
import { fetchBookDetailsByIsbn } from '../services/bookService';
import BookDetailModal from './BookDetailModal';
import { Camera, Upload, Keyboard, AlertCircle, Loader2, Sparkles, Scan, ArrowRight } from 'lucide-react';

export default function QuickScannerView() {
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' | 'upload' | 'manual'
  const [manualIsbn, setManualIsbn] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [scannedBook, setScannedBook] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);

  const fileInputRef = useRef(null);
  const scannerRef = useRef(null);

  // Initialize html5-qrcode for live camera
  const startCameraScanner = async () => {
    setErrorMsg('');
    setCameraActive(true);
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop().catch(() => {});
      }

      const html5QrCode = new Html5Qrcode('qr-reader-region');
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 280, height: 160 }
        },
        async (decodedText) => {
          // On successful code detected
          await html5QrCode.stop();
          setCameraActive(false);
          handleCodeDetected(decodedText);
        },
        () => {
          // ignore scan errors per frame
        }
      );
    } catch (err) {
      setCameraActive(false);
      setErrorMsg('Kamera nebyla nalezena nebo přístup k ní byl odmítnut. Můžete nahrát fotku z galerie nebo zadat ISBN ručně.');
    }
  };

  const stopCameraScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (err) {
        // ignore
      }
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (activeTab === 'camera') {
      startCameraScanner();
    } else {
      stopCameraScanner();
    }

    return () => {
      stopCameraScanner();
    };
  }, [activeTab]);

  const handleCodeDetected = async (code) => {
    if (!code) return;
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
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-600 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-amber-100 mb-2 border border-white/30">
            <Scan className="w-3.5 h-3.5" /> Okamžitý skener knižních kódů
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold">Naskenujte čárový nebo ISBN kód</h1>
          <p className="text-amber-100 text-sm mt-1 max-w-xl">
            Aplikace ihned vyhledá autora, název, nakladatelství, žánr i věkovou skupinu a připraví knihu k uložení.
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 bg-white/10 p-3 rounded-2xl backdrop-blur-sm border border-white/20">
          <div className="text-3xl">📚</div>
          <div className="text-xs">
            <p className="font-bold">Podpora EAN-13 & ISBN</p>
            <p className="text-amber-100">Kamera, soubory i ruční zadání</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-stone-200 p-2 shadow-sm flex flex-col sm:flex-row gap-2">
        <button
          onClick={() => setActiveTab('camera')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
            activeTab === 'camera'
              ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <Camera className="w-4 h-4" /> Živá kamera
        </button>

        <button
          onClick={() => setActiveTab('upload')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
            activeTab === 'upload'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <Upload className="w-4 h-4" /> Nahrát fotku ze zařízení
        </button>

        <button
          onClick={() => setActiveTab('manual')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
            activeTab === 'manual'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <Keyboard className="w-4 h-4" /> Ruční zadání ISBN
        </button>
      </div>

      {/* Main Scanner Container */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-md relative min-h-[340px] flex flex-col items-center justify-center">

        {loading && (
          <div className="absolute inset-0 z-20 bg-white/90 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-12 h-12 text-orange-600 animate-spin" />
            <p className="font-bold text-stone-800 text-base">Hledám informace o knize...</p>
            <p className="text-xs text-stone-500">Dotazuji se v databázích dat a připravuji tabulku</p>
          </div>
        )}

        {/* Tab 1: Live Camera Scanner */}
        {activeTab === 'camera' && (
          <div className="w-full flex flex-col items-center">
            <div className="relative w-full max-w-md overflow-hidden rounded-xl border-2 border-dashed border-orange-400 bg-stone-900 shadow-inner">
              <div id="qr-reader-region" className="w-full min-h-[250px]" />

              {!cameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-stone-900/90 text-white space-y-3">
                  <Camera className="w-12 h-12 text-orange-400 animate-pulse" />
                  <p className="text-sm font-semibold">Připravuji kameru...</p>
                  <button
                    onClick={startCameraScanner}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    Zapnout kameru znova
                  </button>
                </div>
              )}
            </div>
            <p className="text-xs text-stone-500 mt-3 font-medium">
              Zamiřte kamerou na čárový nebo ISBN kód na zadní straně knihy.
            </p>
          </div>
        )}

        {/* Tab 2: Upload Photo */}
        {activeTab === 'upload' && (
          <div className="w-full max-w-md text-center p-8 border-2 border-dashed border-emerald-400 rounded-2xl bg-emerald-50/50 hover:bg-emerald-50 transition-colors">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-700 shadow-inner">
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
              className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-colors text-sm"
            >
              <Upload className="w-4 h-4" /> Vybrat obrázek z galerie
            </label>
          </div>
        )}

        {/* Tab 3: Manual Input */}
        {activeTab === 'manual' && (
          <form onSubmit={handleManualSubmit} className="w-full max-w-md space-y-4">
            <div className="text-center mb-2">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-2 text-amber-700">
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
                className="w-full px-4 py-3 border-2 border-amber-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-center font-mono font-bold text-lg tracking-widest"
              />
            </div>

            <button
              type="submit"
              disabled={!manualIsbn.trim()}
              className="w-full py-3 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 text-sm"
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

      {/* Quick Test Demo Barcodes */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 text-xs">
        <p className="font-bold text-stone-700 mb-2 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-600" /> Rychlé vyzkoušení s příkladovými kódy:
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
              className="px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg hover:bg-amber-100 text-stone-800 font-mono font-semibold transition-colors shadow-sm"
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
          if (activeTab === 'camera') {
            startCameraScanner();
          }
        }}
      />
    </div>
  );
}
