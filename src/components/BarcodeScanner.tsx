import React, { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, Upload, Sparkles, AlertCircle, RefreshCw, Check, Boxes } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { SAMPLE_BARCODES } from '../data/sampleGames';
import { Game } from '../types';

interface BarcodeScannerProps {
  onBarcodeDetected: (barcode: string) => void;
  isLoading?: boolean;
  existingGames?: Game[];
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onBarcodeDetected,
  isLoading = false,
  existingGames = [],
}) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'interactive-barcode-viewport';
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Live match check on manual input
  const cleanInput = manualCode.trim();
  const matchedInStock = cleanInput.length >= 8
    ? existingGames.find((g) => g.barcode && g.barcode.trim() === cleanInput)
    : undefined;

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(scannerContainerId);
      }

      // Check camera permission and devices
      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 12,
          qrbox: { width: 280, height: 160 },
          aspectRatio: 1.777778,
        },
        (decodedText) => {
          const clean = decodedText.replace(/\D/g, '');
          if (clean && clean !== lastScanned) {
            setLastScanned(clean);
            stopCamera();
            onBarcodeDetected(clean);
          }
        },
        () => {
          // Frame errors during scan can be ignored
        }
      );
      setCameraActive(true);
    } catch (err: any) {
      console.warn('Camera error:', err);
      setCameraError(
        'Impossible d\'activer la caméra. Vérifiez les autorisations ou saisissez le code-barres manuellement.'
      );
      setCameraActive(false);
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = manualCode.replace(/\D/g, '');
    if (clean.length >= 8) {
      onBarcodeDetected(clean);
    } else {
      setCameraError('Le code-barres doit comporter au moins 8 chiffres (EAN/UPC).');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(scannerContainerId);
      }
      setCameraError(null);
      const decodedText = await html5QrCodeRef.current.scanFile(file, true);
      const clean = decodedText.replace(/\D/g, '');
      if (clean) {
        onBarcodeDetected(clean);
      }
    } catch (err) {
      setCameraError('Aucun code-barres détecté dans l\'image. Essayez une image plus nette ou la saisie manuelle.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div id="barcode-scanner-container" className="space-y-4">
      {/* Viewport for live camera */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 text-white min-h-[220px] flex flex-col items-center justify-center">
        <div
          id={scannerContainerId}
          className={`w-full max-w-sm aspect-video ${cameraActive ? 'block' : 'hidden'}`}
        />

        {!cameraActive && (
          <div className="p-6 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mx-auto text-indigo-300">
              <Camera className="w-7 h-7" />
            </div>
            <div>
              <p className="font-semibold text-slate-100">Scanner avec la caméra</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Pointez la caméra vers le code-barres situé au dos du boîtier de votre jeu.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center pt-2">
              <button
                id="btn-start-camera"
                type="button"
                onClick={startCamera}
                disabled={isLoading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Camera className="w-4 h-4" />
                Démarrer la caméra
              </button>
              <button
                id="btn-upload-photo"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl transition flex items-center gap-2 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                Importer photo
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          </div>
        )}

        {cameraActive && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center">
            <button
              id="btn-stop-camera"
              type="button"
              onClick={stopCamera}
              className="px-3 py-1.5 bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-semibold rounded-full flex items-center gap-1.5 backdrop-blur cursor-pointer"
            >
              <CameraOff className="w-3.5 h-3.5" />
              Arrêter la caméra
            </button>
          </div>
        )}
      </div>

      {cameraError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-800 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{cameraError}</span>
        </div>
      )}

      {/* Manual barcode input */}
      <form onSubmit={handleManualSubmit} className="space-y-2">
        <label htmlFor="manual-barcode-input" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
          Ou saisissez le numéro de code-barres (EAN-13 / UPC)
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              id="manual-barcode-input"
              type="text"
              placeholder="Ex: 0045496420079 ou 0711719541172"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white font-mono"
            />
            {manualCode && (
              <button
                type="button"
                onClick={() => setManualCode('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>
          <button
            id="btn-search-manual-barcode"
            type="submit"
            disabled={isLoading || manualCode.replace(/\D/g, '').length < 8}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-medium text-sm rounded-xl transition flex items-center gap-1.5 cursor-pointer shrink-0 shadow-sm"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Recherche...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                Identifier
              </>
            )}
          </button>
        </div>

        {matchedInStock && (
          <div
            onClick={() => onBarcodeDetected(matchedInStock.barcode || manualCode)}
            className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-950 flex items-center justify-between gap-2 cursor-pointer hover:bg-amber-100/80 transition"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Boxes className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="truncate">
                Déjà dans votre stock : <strong>{matchedInStock.title}</strong> ({matchedInStock.console}) — {matchedInStock.quantity || 1} ex.
              </span>
            </div>
            <span className="text-[11px] font-bold text-amber-700 shrink-0">
              Mettre à jour le stock →
            </span>
          </div>
        )}
      </form>

      {/* Quick sample barcodes for instant testing */}
      <div className="pt-2 border-t border-slate-100">
        <p className="text-xs text-slate-500 mb-2 flex items-center gap-1 font-medium">
          <span>Codes-barres d'exemple à tester en 1 clic :</span>
        </p>
        <div className="flex flex-wrap gap-1.5">
          {SAMPLE_BARCODES.map((item) => (
            <button
              key={item.code}
              type="button"
              onClick={() => {
                setManualCode(item.code);
                onBarcodeDetected(item.code);
              }}
              className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 border border-slate-200 rounded-lg text-slate-700 font-mono transition cursor-pointer"
              title={`Tester avec ${item.name}`}
            >
              {item.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
