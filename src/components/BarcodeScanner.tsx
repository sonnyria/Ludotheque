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
  CheckCircle2,
  Barcode,
  Search,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { SAMPLE_BARCODES } from '../data/sampleGames';
import { Game } from '../types';

interface BarcodeScannerProps {
  onBarcodeDetected: (barcode: string) => void;
  onTitleSearch?: (title: string) => void;
  isLoading?: boolean;
  existingGames?: Game[];
  autoStart?: boolean;
  initialCode?: string;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onBarcodeDetected,
  onTitleSearch,
  isLoading = false,
  existingGames = [],
  autoStart = false,
  initialCode = '',
}) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [detectedCode, setDetectedCode] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState(initialCode);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  useEffect(() => {
    if (initialCode) {
      setManualCode(initialCode);
    }
  }, [initialCode]);

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

  const handleManualSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = manualCode.trim();
    if (!clean) return;
    const digits = clean.replace(/\D/g, '');
    stopCamera();
    if (digits.length >= 6) {
      onBarcodeDetected(digits);
    } else if (onTitleSearch && clean.length >= 2) {
      onTitleSearch(clean);
    } else {
      onBarcodeDetected(clean);
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
      const clean = decodedText.trim();
      if (clean) {
        playBeep();
        triggerHaptic();
        stopCamera();
        onBarcodeDetected(clean);
      }
    } catch {
      setCameraError('Aucun code-barres détecté dans l\'image. Essayez une photo plus nette ou la saisie directe.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div id="barcode-scanner-container" className="space-y-4">
      {/* 1. CAMERA / SCANNER SECTION (Placed at the top for immediate visibility) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-indigo-600" />
            <span>Caméra & scan de la boîte</span>
          </span>

          {!cameraActive && (
            <button
              id="btn-start-camera-link"
              type="button"
              onClick={() => startCamera(facingMode)}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1 cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Activer la caméra</span>
            </button>
          )}
        </div>

        {/* Camera Viewport */}
        <div className="relative rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-950 text-white shadow-md flex flex-col items-center justify-center min-h-[210px] max-h-[270px] sm:min-h-[240px] sm:max-h-[300px]">
          <div
            id={scannerContainerId}
            className="w-full h-full flex items-center justify-center overflow-hidden"
          />

          {cameraActive && !detectedCode && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
              <div className="relative w-64 h-28 sm:w-72 sm:h-32 rounded-xl border border-white/40 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-indigo-400 -mt-0.5 -ml-0.5 rounded-tl-sm" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-indigo-400 -mt-0.5 -mr-0.5 rounded-tr-sm" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-indigo-400 -mb-0.5 -ml-0.5 rounded-bl-sm" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-indigo-400 -mb-0.5 -mr-0.5 rounded-br-sm" />
                <div className="absolute left-1 right-1 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_8px_#34d399] animate-laser" />
              </div>

              <div className="mt-2 px-3 py-0.5 bg-black/75 backdrop-blur-md rounded-full text-[11px] font-medium text-slate-200 border border-white/10 shadow-sm flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Pointez vers le code-barres (EAN-13 / UPC)</span>
              </div>
            </div>
          )}

          {detectedCode && (
            <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center animate-fadeIn z-20">
              <CheckCircle2 className="w-9 h-9 text-emerald-400 mb-1 animate-bounce" />
              <p className="text-xs uppercase tracking-wider font-bold text-emerald-300">Code détecté !</p>
              <p className="text-base font-mono font-black text-white mt-0.5">{detectedCode}</p>
              <p className="text-[11px] text-emerald-200 mt-1 flex items-center gap-1.5 font-bold">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-300" />
                Recherche web du jeu en cours...
              </p>
            </div>
          )}

          {isLoading && !detectedCode && (
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center animate-fadeIn z-20">
              <div className="w-12 h-12 rounded-2xl bg-amber-400/20 text-amber-400 border border-amber-400/40 flex items-center justify-center mb-2 shadow-lg">
                <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
              </div>
              <p className="text-xs uppercase tracking-wider font-bold text-amber-300">Recherche web directe...</p>
              <p className="text-sm font-mono font-bold text-white mt-0.5">{manualCode || 'Code-barres'}</p>
              <p className="text-[11px] text-slate-300 mt-1 max-w-xs">
                Interrogation directe des bases de données et des fiches jeux vidéo...
              </p>
            </div>
          )}

          {isStartingCamera && !cameraActive && (
            <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-4 text-center z-10">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-2">
                <RefreshCw className="w-5 h-5 animate-spin" />
              </div>
              <p className="text-xs font-bold text-white">Lancement de la caméra...</p>
              <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs">
                Veuillez autoriser l'accès à la caméra dans votre navigateur.
              </p>
            </div>
          )}

          {!cameraActive && !isStartingCamera && !detectedCode && (
            <div className="absolute inset-0 p-4 text-center flex flex-col items-center justify-center space-y-2 z-10">
              <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-indigo-300">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-xs text-slate-100">Visuel caméra (haut d'écran)</p>
                <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs">
                  Pointez votre objectif sur le code-barres au dos du boîtier.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center pt-0.5">
                <button
                  id="btn-start-camera"
                  type="button"
                  onClick={() => startCamera(facingMode)}
                  disabled={isLoading}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/30 active:scale-95"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Démarrer la caméra
                </button>
                <button
                  id="btn-upload-photo"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition flex items-center gap-1 cursor-pointer border border-slate-700 active:scale-95"
                >
                  <Upload className="w-3 h-3" />
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
                className="px-3 py-1 bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-semibold rounded-full flex items-center gap-1.5 backdrop-blur-md transition cursor-pointer shadow-sm active:scale-95"
                title="Mettre en pause la caméra"
              >
                <CameraOff className="w-3.5 h-3.5" />
                <span>Pause</span>
              </button>
            </div>
          )}
        </div>

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
      </div>

      {/* 2. DIRECT SEARCH BY BARCODE OR TITLE */}
      <div className="bg-indigo-50/50 border border-indigo-200/80 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Barcode className="w-4.5 h-4.5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 leading-tight">
              Recherche directe par code-barres ou saisie
            </h4>
            <p className="text-xs text-slate-500">
              Saisissez ou collez un code (EAN-13, UPC) pour trouver le jeu directement
            </p>
          </div>
        </div>

        <form onSubmit={handleManualSubmit} className="space-y-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Barcode className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="manual-barcode-input"
                type="text"
                autoFocus
                placeholder="Code-barres (ex: 5030931103650) ou nom du jeu..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono shadow-xs"
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

            {manualCode.trim().length >= 4 && (
              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(manualCode.trim())}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl border border-slate-300 transition flex items-center gap-1 shrink-0"
                title="Consulter directement les résultats Google dans un nouvel onglet"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Google</span>
              </a>
            )}

            <button
              id="btn-search-manual-barcode"
              type="submit"
              disabled={isLoading || manualCode.trim().length < 2}
              className={`px-4 py-2.5 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shrink-0 shadow-sm active:scale-95 ${
                isLoading
                  ? 'bg-amber-500 text-slate-950 font-black animate-pulse'
                  : 'bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Recherche en direct...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Rechercher sur le web</span>
                </>
              )}
            </button>
          </div>

          {isLoading && (
            <div className="p-3 bg-amber-50 border-2 border-amber-300 rounded-xl flex items-center gap-2.5 text-xs text-amber-950 font-semibold animate-pulse shadow-sm">
              <Loader2 className="w-4.5 h-4.5 text-amber-600 animate-spin shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="font-bold text-amber-900">Recherche web en direct...</span>
                <p className="text-[11px] text-amber-700 font-normal">Recherche sur le web et identification automatique du jeu vidéo pour ce code.</p>
              </div>
            </div>
          )}

          {matchedInStock && (
            <div
              onClick={() => {
                stopCamera();
                onBarcodeDetected(matchedInStock.barcode || manualCode);
              }}
              className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-950 flex items-center justify-between gap-2 cursor-pointer hover:bg-amber-100 transition shadow-2xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Boxes className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="truncate">
                  Déjà en stock : <strong>{matchedInStock.title}</strong> ({matchedInStock.console})
                </span>
              </div>
              <span className="text-[11px] font-bold text-amber-700 shrink-0">
                Gérer le stock →
              </span>
            </div>
          )}
        </form>

        {/* 1-click popular barcode chips */}
        <div className="pt-2 border-t border-indigo-100">
          <p className="text-[11px] text-slate-600 mb-1.5 flex items-center gap-1 font-semibold">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Exemples de codes-barres à tester en 1 clic :</span>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {SAMPLE_BARCODES.map((item) => (
              <button
                key={item.code}
                type="button"
                onClick={() => {
                  setManualCode(item.code);
                  stopCamera();
                  onBarcodeDetected(item.code);
                }}
                className="px-2.5 py-1 text-[11px] bg-white hover:bg-indigo-100/70 hover:text-indigo-800 hover:border-indigo-300 border border-slate-200 rounded-lg text-slate-700 font-medium transition cursor-pointer shadow-2xs"
                title={`Tester ${item.name} (${item.code})`}
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
