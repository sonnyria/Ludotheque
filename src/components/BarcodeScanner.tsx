import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Camera,
  CameraOff,
  Upload,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Boxes,
  Zap,
  ZapOff,
  SwitchCamera,
  CheckCircle2
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { SAMPLE_BARCODES } from '../data/sampleGames';
import { Game } from '../types';

interface BarcodeScannerProps {
  onBarcodeDetected: (barcode: string) => void;
  isLoading?: boolean;
  existingGames?: Game[];
  autoStart?: boolean;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onBarcodeDetected,
  isLoading = false,
  existingGames = [],
  autoStart = true,
}) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [detectedCode, setDetectedCode] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'interactive-barcode-viewport';
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isStartingRef = useRef(false);

  // Play audio chime when barcode is scanned
  const playBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.12);
      }
    } catch {
      // Audio might be ignored if restricted
    }
  };

  // Haptic feedback
  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([40, 30, 40]);
      } catch {}
    }
  };

  // Live match check on manual input
  const cleanInput = manualCode.trim();
  const matchedInStock = cleanInput.length >= 8
    ? existingGames.find((g) => g.barcode && g.barcode.trim() === cleanInput)
    : undefined;

  const stopCamera = useCallback(async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
    }
    setCameraActive(false);
    setIsStartingCamera(false);
    setIsTorchOn(false);
    setTorchSupported(false);
    isStartingRef.current = false;
  }, []);

  const startCamera = useCallback(async (mode: 'environment' | 'user' = 'environment') => {
    if (isStartingRef.current) return;
    isStartingRef.current = true;
    setIsStartingCamera(true);
    setCameraError(null);

    try {
      // Ensure element exists in DOM
      const targetElement = document.getElementById(scannerContainerId);
      if (!targetElement) {
        throw new Error("Conteneur vidéo introuvable");
      }

      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(scannerContainerId);
      } else if (html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop();
      }

      await html5QrCodeRef.current.start(
        { facingMode: mode },
        {
          fps: 15,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            // Adaptive reticle that fits on small smartphones without overflow
            const width = Math.min(270, Math.floor(viewfinderWidth * 0.85));
            const height = Math.min(150, Math.floor(viewfinderHeight * 0.55));
            return {
              width: Math.max(120, width),
              height: Math.max(70, height),
            };
          },
          aspectRatio: 1.333333,
        },
        (decodedText) => {
          const clean = decodedText.replace(/\D/g, '');
          if (clean && clean !== lastScanned) {
            setLastScanned(clean);
            setDetectedCode(clean);
            playBeep();
            triggerHaptic();

            // Stop camera and notify parent with slight delay for visual confirmation
            setTimeout(() => {
              stopCamera();
              onBarcodeDetected(clean);
            }, 350);
          }
        },
        () => {
          // Normal frame misses while searching
        }
      );

      setCameraActive(true);
      setIsStartingCamera(false);
      isStartingRef.current = false;

      // Check if torch is supported on active video track
      setTimeout(() => {
        try {
          const videoEl = document.querySelector<HTMLVideoElement>(`#${scannerContainerId} video`);
          if (videoEl && videoEl.srcObject instanceof MediaStream) {
            const track = videoEl.srcObject.getVideoTracks()[0];
            const capabilities = (track.getCapabilities?.() || {}) as any;
            if (capabilities.torch) {
              setTorchSupported(true);
            }
          }
        } catch {
          // Ignore
        }
      }, 500);

    } catch (err: any) {
      console.warn('Camera start error:', err);
      setCameraError(
        'Impossible d\'activer la caméra directement (accès refusé ou indisponible). Vous pouvez saisir le code manuellement ci-dessous ou importer une photo.'
      );
      setCameraActive(false);
      setIsStartingCamera(false);
      isStartingRef.current = false;
    }
  }, [lastScanned, onBarcodeDetected, stopCamera]);

  // Auto-start camera when requested
  useEffect(() => {
    let active = true;
    if (autoStart) {
      const timer = setTimeout(() => {
        if (active) {
          startCamera(facingMode);
        }
      }, 100);
      return () => {
        active = false;
        clearTimeout(timer);
        stopCamera();
      };
    } else {
      return () => {
        active = false;
        stopCamera();
      };
    }
  }, [autoStart, facingMode, startCamera, stopCamera]);

  // Torch toggle handler
  const handleToggleTorch = async () => {
    const videoEl = document.querySelector<HTMLVideoElement>(`#${scannerContainerId} video`);
    if (videoEl && videoEl.srcObject instanceof MediaStream) {
      const track = videoEl.srcObject.getVideoTracks()[0];
      try {
        await (track as any).applyConstraints({
          advanced: [{ torch: !isTorchOn }],
        });
        setIsTorchOn((prev) => !prev);
      } catch (err) {
        console.warn('Torch failed', err);
      }
    }
  };

  // Switch between rear and front camera
  const handleToggleCamera = async () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    await stopCamera();
    startCamera(nextMode);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = manualCode.replace(/\D/g, '');
    if (clean.length >= 8) {
      stopCamera();
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
        playBeep();
        triggerHaptic();
        stopCamera();
        onBarcodeDetected(clean);
      }
    } catch {
      setCameraError('Aucun code-barres détecté dans l\'image. Essayez une photo plus nette ou la saisie manuelle.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div id="barcode-scanner-container" className="space-y-3.5">
      {/* Viewport for live camera (Compact & responsive on all phones) */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-950 text-white shadow-md flex flex-col items-center justify-center min-h-[210px] max-h-[260px] sm:min-h-[250px] sm:max-h-[300px]">
        {/* HTML5 QR Code DOM mount point */}
        <div
          id={scannerContainerId}
          className="w-full h-full flex items-center justify-center overflow-hidden"
        />

        {/* Viewfinder reticle overlay when active */}
        {cameraActive && !detectedCode && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
            {/* Target Box with Corner Brackets */}
            <div className="relative w-64 h-32 sm:w-72 sm:h-36 rounded-xl border border-white/40 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-indigo-400 -mt-0.5 -ml-0.5 rounded-tl-sm" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-indigo-400 -mt-0.5 -mr-0.5 rounded-tr-sm" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-indigo-400 -mb-0.5 -ml-0.5 rounded-bl-sm" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-indigo-400 -mb-0.5 -mr-0.5 rounded-br-sm" />

              {/* Laser scanning beam */}
              <div className="absolute left-1 right-1 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_8px_#34d399] animate-laser" />
            </div>

            {/* Instruction pill */}
            <div className="mt-2.5 px-3 py-1 bg-black/75 backdrop-blur-md rounded-full text-[11px] font-medium text-slate-200 border border-white/10 shadow-sm flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Pointez vers le code-barres (EAN-13 / UPC)</span>
            </div>
          </div>
        )}

        {/* Detected Code Flash Overlay */}
        {detectedCode && (
          <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center animate-fadeIn z-20">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mb-1.5 animate-bounce" />
            <p className="text-xs uppercase tracking-wider font-bold text-emerald-300">Code détecté !</p>
            <p className="text-base font-mono font-black text-white mt-0.5">{detectedCode}</p>
            <p className="text-[11px] text-emerald-200 mt-1 flex items-center gap-1">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Recherche des informations du jeu...
            </p>
          </div>
        )}

        {/* Starting Camera Loading State */}
        {isStartingCamera && !cameraActive && (
          <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-4 text-center z-10">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-3">
              <RefreshCw className="w-6 h-6 animate-spin" />
            </div>
            <p className="text-sm font-bold text-white">Lancement de la caméra...</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Veuillez autoriser l'accès à la caméra si votre navigateur vous le demande.
            </p>
          </div>
        )}

        {/* Idle / Camera Off State */}
        {!cameraActive && !isStartingCamera && !detectedCode && (
          <div className="absolute inset-0 p-4 text-center flex flex-col items-center justify-center space-y-2.5 z-10">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-indigo-300">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold text-sm text-slate-100">Scanner avec la caméra</p>
              <p className="text-xs text-slate-400 mt-0.5 max-w-xs">
                Activez la caméra pour scanner instantanément le code-barres au dos de votre jeu.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center pt-1">
              <button
                id="btn-start-camera"
                type="button"
                onClick={() => startCamera(facingMode)}
                disabled={isLoading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-600/30 active:scale-95"
              >
                <Camera className="w-4 h-4" />
                Démarrer la caméra
              </button>
              <button
                id="btn-upload-photo"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer border border-slate-700 active:scale-95"
              >
                <Upload className="w-3.5 h-3.5" />
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

        {/* Active Camera Action Controls Bar */}
        {cameraActive && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 z-20">
            {torchSupported && (
              <button
                type="button"
                onClick={handleToggleTorch}
                className={`p-2 rounded-full backdrop-blur-md text-xs font-semibold transition cursor-pointer ${
                  isTorchOn
                    ? 'bg-amber-400 text-slate-900 shadow-md shadow-amber-400/30'
                    : 'bg-black/60 hover:bg-black/80 text-white border border-white/20'
                }`}
                title={isTorchOn ? 'Éteindre la torche' : 'Allumer la torche'}
              >
                {isTorchOn ? <ZapOff className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
              </button>
            )}

            <button
              type="button"
              onClick={handleToggleCamera}
              className="p-2 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 backdrop-blur-md transition cursor-pointer"
              title="Changer de caméra"
            >
              <SwitchCamera className="w-4 h-4" />
            </button>

            <button
              id="btn-stop-camera"
              type="button"
              onClick={stopCamera}
              className="px-3 py-1.5 bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-semibold rounded-full flex items-center gap-1.5 backdrop-blur-md transition cursor-pointer shadow-sm active:scale-95"
              title="Mettre en pause la caméra"
            >
              <CameraOff className="w-3.5 h-3.5" />
              <span>Pause</span>
            </button>
          </div>
        )}
      </div>

      {/* Camera Error Message with direct retry & guidance */}
      {cameraError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start justify-between gap-2.5 text-rose-800 text-xs">
          <div className="flex items-start gap-2 min-w-0">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="leading-snug">{cameraError}</span>
          </div>
          <button
            type="button"
            onClick={() => startCamera(facingMode)}
            className="px-2.5 py-1 bg-rose-600 text-white rounded-lg font-bold text-[11px] shrink-0 hover:bg-rose-700 transition cursor-pointer"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Manual barcode input */}
      <form onSubmit={handleManualSubmit} className="space-y-1.5">
        <label htmlFor="manual-barcode-input" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
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
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white font-mono"
            />
            {manualCode && (
              <button
                type="button"
                onClick={() => setManualCode('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer p-1"
              >
                ✕
              </button>
            )}
          </div>
          <button
            id="btn-search-manual-barcode"
            type="submit"
            disabled={isLoading || manualCode.replace(/\D/g, '').length < 8}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shrink-0 shadow-sm"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Recherche...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Identifier</span>
              </>
            )}
          </button>
        </div>

        {matchedInStock && (
          <div
            onClick={() => {
              stopCamera();
              onBarcodeDetected(matchedInStock.barcode || manualCode);
            }}
            className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-950 flex items-center justify-between gap-2 cursor-pointer hover:bg-amber-100 transition"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Boxes className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="truncate">
                Déjà en stock : <strong>{matchedInStock.title}</strong> ({matchedInStock.console})
              </span>
            </div>
            <span className="text-[11px] font-bold text-amber-700 shrink-0">
              Voir / +1 stock →
            </span>
          </div>
        )}
      </form>

      {/* Quick sample barcodes for instant testing on mobile */}
      <div className="pt-2 border-t border-slate-100">
        <p className="text-[11px] text-slate-500 mb-1.5 flex items-center gap-1 font-medium">
          <span>Codes-barres d'exemple à tester en 1 clic :</span>
        </p>
        <div className="flex flex-wrap gap-1">
          {SAMPLE_BARCODES.map((item) => (
            <button
              key={item.code}
              type="button"
              onClick={() => {
                setManualCode(item.code);
                stopCamera();
                onBarcodeDetected(item.code);
              }}
              className="px-2 py-0.5 text-[11px] bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 border border-slate-200 rounded-lg text-slate-700 font-mono transition cursor-pointer truncate max-w-[140px] sm:max-w-none"
              title={`Tester avec ${item.name} (${item.code})`}
            >
              {item.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
