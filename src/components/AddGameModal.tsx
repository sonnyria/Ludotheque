import React, { useState, useEffect } from 'react';
import { X, Barcode, PenTool, Sparkles, Check, AlertTriangle, Disc3, ShieldCheck, Boxes, Plus, Layers, ArrowRight, Coins } from 'lucide-react';
import { Game, GameCondition, GameStatus } from '../types';
import { CONSOLE_LIST } from '../data/sampleGames';
import { BarcodeScanner } from './BarcodeScanner';
import { CONDITION_LABELS, STATUS_LABELS } from '../utils/consoleThemes';
import { estimateMarketValue } from '../utils/marketPriceGuide';

interface AddGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddGame: (game: Omit<Game, 'id' | 'addedAt'>) => void;
  initialBarcodeMode?: boolean;
  existingGames?: Game[];
  onUpdateQuantity?: (gameId: string, newQuantity: number) => void;
}

export const AddGameModal: React.FC<AddGameModalProps> = ({
  isOpen,
  onClose,
  onAddGame,
  initialBarcodeMode = false,
  existingGames = [],
  onUpdateQuantity,
}) => {
  const [activeTab, setActiveTab] = useState<'barcode' | 'manual'>(
    initialBarcodeMode ? 'barcode' : 'manual'
  );

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialBarcodeMode ? 'barcode' : 'manual');
    }
  }, [isOpen, initialBarcodeMode]);

  // Form states
  const [title, setTitle] = useState('');
  const [consoleName, setConsoleName] = useState<string>('Nintendo Switch');
  const [customConsole, setCustomConsole] = useState('');
  const [barcode, setBarcode] = useState('');
  const [releaseYear, setReleaseYear] = useState<number | ''>('');
  const [publisher, setPublisher] = useState('');
  const [developer, setDeveloper] = useState('');
  const [genre, setGenre] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [condition, setCondition] = useState<GameCondition>('complet');
  const [status, setStatus] = useState<GameStatus>('completed');
  const [rating, setRating] = useState<number>(5);
  const [notes, setNotes] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [quantityToAdd, setQuantityToAdd] = useState<number>(1);
  const [estimatedValue, setEstimatedValue] = useState<number | ''>('');
  const [purchasePrice, setPurchasePrice] = useState<number | ''>('');
  const [stockUpdatedSuccess, setStockUpdatedSuccess] = useState<string | null>(null);

  // Lookup state
  const [isSearching, setIsSearching] = useState(false);
  const [lookupMessage, setLookupMessage] = useState<{ type: 'success' | 'warning' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setTitle('');
    setConsoleName('Nintendo Switch');
    setCustomConsole('');
    setBarcode('');
    setReleaseYear('');
    setPublisher('');
    setDeveloper('');
    setGenre('');
    setCoverUrl('');
    setCondition('complet');
    setStatus('completed');
    setRating(5);
    setNotes('');
    setQuantity(1);
    setQuantityToAdd(1);
    setEstimatedValue('');
    setPurchasePrice('');
    setStockUpdatedSuccess(null);
    setLookupMessage(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleBarcodeDetected = async (code: string) => {
    setBarcode(code);
    setIsSearching(true);
    setLookupMessage(null);
    setStockUpdatedSuccess(null);

    // Fast check: is this barcode already present in our existing stock?
    const localMatch = existingGames.find(
      (g) => g.barcode && g.barcode.trim() === code.trim()
    );

    if (localMatch) {
      setTitle(localMatch.title || '');
      if (CONSOLE_LIST.includes(localMatch.console as any)) {
        setConsoleName(localMatch.console);
      } else {
        setConsoleName('Autre');
        setCustomConsole(localMatch.console || '');
      }
      if (localMatch.releaseYear) setReleaseYear(localMatch.releaseYear);
      if (localMatch.publisher) setPublisher(localMatch.publisher);
      if (localMatch.developer) setDeveloper(localMatch.developer);
      if (localMatch.genre) setGenre(localMatch.genre);
      if (localMatch.coverUrl) setCoverUrl(localMatch.coverUrl);
      if (localMatch.notes) setNotes(localMatch.notes);

      setLookupMessage({
        type: 'warning',
        text: `Ce jeu est déjà dans votre stock (${localMatch.quantity || 1} exemplaire${(localMatch.quantity || 1) > 1 ? 's' : ''}). Vous pouvez mettre à jour la quantité directement ci-dessous !`,
      });
      setIsSearching(false);
      setActiveTab('manual');
      return;
    }

    try {
      const res = await fetch('/api/games/lookup-barcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode: code }),
      });

      const data = await res.json();

      if (data.found && data.game) {
        const g = data.game;
        setTitle(g.title || '');
        if (CONSOLE_LIST.includes(g.console)) {
          setConsoleName(g.console);
        } else {
          setConsoleName('Autre');
          setCustomConsole(g.console || '');
        }
        if (g.releaseYear) setReleaseYear(g.releaseYear);
        if (g.publisher) setPublisher(g.publisher);
        if (g.developer) setDeveloper(g.developer);
        if (g.genre) setGenre(g.genre);
        if (g.synopsis && !notes) setNotes(g.synopsis);
        if (g.coverUrl) {
          setCoverUrl(g.coverUrl);
        } else {
          // Auto-fetch official cover
          fetch(`/api/games/find-cover?title=${encodeURIComponent(g.title)}&console=${encodeURIComponent(g.console || '')}`)
            .then((r) => r.json())
            .then((d) => {
              if (d.coverUrl) setCoverUrl(d.coverUrl);
            })
            .catch(() => {});
        }

        setLookupMessage({
          type: 'success',
          text: `Jeu identifié : "${g.title}" sur ${g.console}. Vérifiez les informations ci-dessous et enregistrez !`,
        });
        setActiveTab('manual');
      } else {
        setLookupMessage({
          type: 'warning',
          text: data.message || 'Code-barres inconnu. Vous pouvez renseigner le nom et la console manuellement.',
        });
        setActiveTab('manual');
      }
    } catch (err: any) {
      setLookupMessage({
        type: 'error',
        text: 'Erreur réseau lors de la recherche du code-barres. Saisie manuelle disponible.',
      });
      setActiveTab('manual');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAiEnrich = async () => {
    if (!title.trim()) return;
    setIsSearching(true);
    setLookupMessage(null);

    try {
      const targetConsole = consoleName === 'Autre' ? customConsole : consoleName;
      const res = await fetch('/api/games/search-gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: title, console: targetConsole }),
      });
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const best = data.results[0];
        if (!releaseYear && best.releaseYear) setReleaseYear(best.releaseYear);
        if (!publisher && best.publisher) setPublisher(best.publisher);
        if (!developer && best.developer) setDeveloper(best.developer);
        if (!genre && best.genre) setGenre(best.genre);
        if (!notes && best.synopsis) setNotes(best.synopsis);
        if (best.coverUrl) {
          setCoverUrl(best.coverUrl);
        } else {
          // Attempt to find cover
          fetch(`/api/games/find-cover?title=${encodeURIComponent(best.title)}&console=${encodeURIComponent(best.console || targetConsole)}`)
            .then((r) => r.json())
            .then((d) => {
              if (d.coverUrl) setCoverUrl(d.coverUrl);
            })
            .catch(() => {});
        }
        setLookupMessage({
          type: 'success',
          text: `Détails enrichis automatiquement pour "${best.title}" !`,
        });
      }
    } catch (err) {
      setLookupMessage({
        type: 'error',
        text: 'Impossible d\'enrichir avec l\'IA pour le moment.',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleFetchCover = async () => {
    if (!title.trim()) return;
    setIsSearching(true);
    try {
      const targetConsole = consoleName === 'Autre' ? customConsole : consoleName;
      const res = await fetch(`/api/games/find-cover?title=${encodeURIComponent(title)}&console=${encodeURIComponent(targetConsole)}`);
      const data = await res.json();
      if (data.coverUrl) {
        setCoverUrl(data.coverUrl);
        setLookupMessage({
          type: 'success',
          text: 'Jaquette officielle trouvée avec succès !',
        });
      } else {
        setLookupMessage({
          type: 'warning',
          text: 'Aucune jaquette officielle trouvée automatiquement. Vous pouvez coller une URL d\'image.',
        });
      }
    } catch (err) {
      setLookupMessage({
        type: 'error',
        text: 'Erreur lors de la recherche de la jaquette.',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleIncrementStock = (targetGame: Game) => {
    if (!onUpdateQuantity) return;
    const currentQty = targetGame.quantity || 1;
    const newQty = currentQty + quantityToAdd;
    onUpdateQuantity(targetGame.id, newQty);
    setStockUpdatedSuccess(
      `Stock mis à jour ! "${targetGame.title}" (${targetGame.console}) compte désormais ${newQty} exemplaire${newQty > 1 ? 's' : ''}.`
    );
    setTimeout(() => {
      handleClose();
    }, 1400);
  };

  const finalConsole = consoleName === 'Autre' && customConsole.trim() ? customConsole.trim() : consoleName;

  // Real-time detection in existing stock
  const barcodeClean = barcode.trim();
  const existingByBarcode = barcodeClean
    ? existingGames.find((g) => g.barcode && g.barcode.trim() === barcodeClean)
    : undefined;

  const titleClean = title.trim().toLowerCase();
  const existingByTitleAndConsole = titleClean.length >= 2
    ? existingGames.find((g) => {
        if (existingByBarcode && g.id === existingByBarcode.id) return false;
        const gTitle = g.title.trim().toLowerCase();
        const sameTitle = gTitle === titleClean;
        const sameConsole = g.console.trim().toLowerCase() === finalConsole.trim().toLowerCase();
        return sameTitle && sameConsole;
      })
    : undefined;

  const primaryStockMatch = existingByBarcode || existingByTitleAndConsole;

  // Cross-console matches (same game on another platform)
  const crossConsoleMatches = titleClean.length >= 2
    ? existingGames.filter((g) => {
        if (primaryStockMatch && g.id === primaryStockMatch.id) return false;
        const gTitle = g.title.trim().toLowerCase();
        const sameTitle = gTitle === titleClean;
        const differentConsole = g.console.trim().toLowerCase() !== finalConsole.trim().toLowerCase();
        return sameTitle && differentConsole;
      })
    : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const calculatedEstimatedValue = typeof estimatedValue === 'number'
      ? estimatedValue
      : estimateMarketValue(title.trim(), finalConsole, condition);

    onAddGame({
      title: title.trim(),
      console: finalConsole,
      barcode: barcode.trim() || undefined,
      releaseYear: typeof releaseYear === 'number' ? releaseYear : undefined,
      publisher: publisher.trim() || undefined,
      developer: developer.trim() || undefined,
      genre: genre.trim() || undefined,
      coverUrl: coverUrl.trim() || undefined,
      condition,
      status,
      rating,
      notes: notes.trim() || undefined,
      quantity: quantity > 0 ? quantity : 1,
      estimatedValue: calculatedEstimatedValue,
      purchasePrice: typeof purchasePrice === 'number' ? purchasePrice : undefined,
    });

    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/70 backdrop-blur-sm overflow-hidden">
      <div
        id="add-game-modal"
        className="relative w-full h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:max-w-xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-100 bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm shrink-0">
              <Disc3 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">Ajouter un jeu vidéo</h2>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate">Par scan caméra direct ou saisie manuelle</p>
            </div>
          </div>
          <button
            id="btn-close-modal"
            type="button"
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer active:scale-95"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 bg-slate-100/80 p-1.5 gap-1 shrink-0">
          <button
            id="tab-barcode"
            type="button"
            onClick={() => setActiveTab('barcode')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'barcode'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Barcode className="w-4 h-4" />
            <span>Scanner code-barres</span>
          </button>
          <button
            id="tab-manual"
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'manual'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PenTool className="w-4 h-4" />
            <span>Saisie manuelle {barcode ? '(Code associé)' : ''}</span>
          </button>
        </div>

        {/* Feedback message */}
        {stockUpdatedSuccess ? (
          <div className="mx-4 sm:mx-6 mt-3 p-3 rounded-xl text-xs flex items-center gap-2 border bg-emerald-50 text-emerald-900 border-emerald-300 font-medium shrink-0">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{stockUpdatedSuccess}</span>
          </div>
        ) : lookupMessage && (
          <div
            className={`mx-4 sm:mx-6 mt-3 p-3 rounded-xl text-xs flex items-start gap-2 border shrink-0 ${
              lookupMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : lookupMessage.type === 'warning'
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {lookupMessage.type === 'success' ? (
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            )}
            <span>{lookupMessage.text}</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {activeTab === 'barcode' ? (
            <BarcodeScanner
              onBarcodeDetected={handleBarcodeDetected}
              isLoading={isSearching}
              existingGames={existingGames}
              autoStart={true}
            />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Primary Stock Match Alert Banner */}
              {primaryStockMatch && (
                <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300/90 shadow-sm animate-fadeIn">
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 aspect-[3/4] rounded-lg bg-slate-900 overflow-hidden shrink-0 border border-amber-300 shadow flex items-center justify-center">
                      {primaryStockMatch.coverUrl ? (
                        <img
                          src={primaryStockMatch.coverUrl}
                          alt=""
                          className="w-full h-full object-contain p-0.5"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <Boxes className="w-5 h-5 text-amber-400" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white shadow-2xs">
                          <Boxes className="w-3 h-3" />
                          Déjà en stock
                        </span>
                        <span className="text-xs font-bold text-amber-950 bg-amber-200/70 px-2 py-0.5 rounded-md border border-amber-300">
                          Stock actuel : {primaryStockMatch.quantity || 1} exemplaire{(primaryStockMatch.quantity || 1) > 1 ? 's' : ''}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 truncate">
                        {primaryStockMatch.title}{' '}
                        <span className="text-slate-500 font-normal">({primaryStockMatch.console})</span>
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        État : <span className="font-semibold text-slate-800">{CONDITION_LABELS[primaryStockMatch.condition]?.label || primaryStockMatch.condition}</span>
                        {primaryStockMatch.barcode && <span> • Code : <code className="font-mono">{primaryStockMatch.barcode}</code></span>}
                      </p>
                    </div>
                  </div>

                  {/* Stock Update Controls */}
                  {onUpdateQuantity && (
                    <div className="mt-3 pt-3 border-t border-amber-200 flex flex-wrap items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-amber-900">Quantité à ajouter :</span>
                        <div className="inline-flex items-center bg-white border border-amber-300 rounded-lg shadow-2xs overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setQuantityToAdd(Math.max(1, quantityToAdd - 1))}
                            className="px-2.5 py-1 text-slate-700 hover:bg-slate-100 font-bold text-xs cursor-pointer"
                          >
                            -
                          </button>
                          <span className="px-2.5 py-1 text-xs font-black text-slate-900 font-mono">
                            +{quantityToAdd}
                          </span>
                          <button
                            type="button"
                            onClick={() => setQuantityToAdd(quantityToAdd + 1)}
                            className="px-2.5 py-1 text-slate-700 hover:bg-slate-100 font-bold text-xs cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleIncrementStock(primaryStockMatch)}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Mettre à jour le stock (Passer à {(primaryStockMatch.quantity || 1) + quantityToAdd} ex.)
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Cross-Console Matches Pill */}
              {crossConsoleMatches.length > 0 && (
                <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-200/80 text-xs text-indigo-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>
                    Également en stock sur :{' '}
                    {crossConsoleMatches.map((m, idx) => (
                      <strong key={m.id} className="font-semibold">
                        {m.console} ({m.quantity || 1} ex.){idx < crossConsoleMatches.length - 1 ? ', ' : ''}
                      </strong>
                    ))}
                  </span>
                </div>
              )}

              {/* Title & AI Autofill */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="game-title" className="text-xs font-bold text-slate-700">
                    Nom du jeu *
                  </label>
                  <button
                    type="button"
                    onClick={handleAiEnrich}
                    disabled={!title.trim() || isSearching}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 cursor-pointer disabled:opacity-40"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Compléter avec l'IA
                  </button>
                </div>
                <input
                  id="game-title"
                  type="text"
                  required
                  placeholder="Ex: Super Mario Odyssey, Elden Ring..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              {/* Console selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="game-console" className="block text-xs font-bold text-slate-700 mb-1">
                    Console / Plateforme *
                  </label>
                  <select
                    id="game-console"
                    value={consoleName}
                    onChange={(e) => setConsoleName(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {CONSOLE_LIST.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {consoleName === 'Autre' ? (
                  <div>
                    <label htmlFor="custom-console" className="block text-xs font-bold text-slate-700 mb-1">
                      Nom de la console
                    </label>
                    <input
                      id="custom-console"
                      type="text"
                      placeholder="Ex: Atari 2600, Neo-Geo..."
                      value={customConsole}
                      onChange={(e) => setCustomConsole(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                ) : (
                  <div>
                    <label htmlFor="game-year" className="block text-xs font-bold text-slate-700 mb-1">
                      Année de sortie
                    </label>
                    <input
                      id="game-year"
                      type="number"
                      min={1970}
                      max={2035}
                      placeholder="Ex: 2021"
                      value={releaseYear}
                      onChange={(e) => setReleaseYear(e.target.value ? parseInt(e.target.value, 10) : '')}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}
              </div>

              {/* Barcode & Genre */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="game-barcode" className="block text-xs font-bold text-slate-700 mb-1">
                    Code-barres (EAN / UPC)
                  </label>
                  <input
                    id="game-barcode"
                    type="text"
                    placeholder="Ex: 0045496420079"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="game-genre" className="block text-xs font-bold text-slate-700 mb-1">
                    Genre
                  </label>
                  <input
                    id="game-genre"
                    type="text"
                    placeholder="Ex: Action-RPG, Plateforme..."
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Publisher & Developer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="game-publisher" className="block text-xs font-bold text-slate-700 mb-1">
                    Éditeur
                  </label>
                  <input
                    id="game-publisher"
                    type="text"
                    placeholder="Ex: Nintendo, Sony, Capcom..."
                    value={publisher}
                    onChange={(e) => setPublisher(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="game-developer" className="block text-xs font-bold text-slate-700 mb-1">
                    Développeur
                  </label>
                  <input
                    id="game-developer"
                    type="text"
                    placeholder="Ex: FromSoftware, Square Enix..."
                    value={developer}
                    onChange={(e) => setDeveloper(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Condition, Status & Quantity */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="game-condition" className="block text-xs font-bold text-slate-700 mb-1">
                    État physique
                  </label>
                  <select
                    id="game-condition"
                    value={condition}
                    onChange={(e) => setCondition(e.target.value as GameCondition)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {Object.entries(CONDITION_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="game-status" className="block text-xs font-bold text-slate-700 mb-1">
                    Statut
                  </label>
                  <select
                    id="game-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as GameStatus)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {Object.entries(STATUS_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="game-quantity" className="block text-xs font-bold text-slate-700 mb-1">
                    Quantité
                  </label>
                  <div className="flex items-center bg-slate-50 border border-slate-300 rounded-xl overflow-hidden h-[38px]">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 h-full text-slate-600 hover:bg-slate-200 font-bold cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      id="game-quantity"
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full text-center bg-transparent font-bold text-slate-900 text-sm focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-3 h-full text-slate-600 hover:bg-slate-200 font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Cote Argus d'occasion & Prix d'achat */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-200/80">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="game-estimated-value" className="block text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5 text-emerald-600" />
                      Cote occasion estimée (€)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const val = estimateMarketValue(title, finalConsole, condition);
                        setEstimatedValue(val);
                      }}
                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
                    >
                      Estimer auto
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id="game-estimated-value"
                      type="number"
                      min={0}
                      step={1}
                      placeholder={title ? `${estimateMarketValue(title, finalConsole, condition)} € (auto)` : 'ex: 35'}
                      value={estimatedValue}
                      onChange={(e) => setEstimatedValue(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full pl-3 pr-8 py-2 bg-white border border-emerald-300/80 rounded-xl text-sm font-mono font-bold text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="absolute right-3 top-2 text-xs font-bold text-emerald-700">€</span>
                  </div>
                </div>

                <div>
                  <label htmlFor="game-purchase-price" className="block text-xs font-bold text-slate-700 mb-1">
                    Prix d'achat payé (€) <span className="text-slate-400 font-normal">(optionnel)</span>
                  </label>
                  <div className="relative">
                    <input
                      id="game-purchase-price"
                      type="number"
                      min={0}
                      step={1}
                      placeholder="ex: 20"
                      value={purchasePrice}
                      onChange={(e) => setPurchasePrice(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full pl-3 pr-8 py-2 bg-white border border-slate-300 rounded-xl text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">€</span>
                  </div>
                </div>
              </div>

              {/* Rating */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Note personnelle : {rating}/5
                </label>
                <div className="flex gap-2 items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`text-xl transition cursor-pointer ${
                        star <= rating ? 'text-amber-400 scale-110' : 'text-slate-200 hover:text-amber-300'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="game-notes" className="block text-xs font-bold text-slate-700 mb-1">
                  Notes ou description
                </label>
                <textarea
                  id="game-notes"
                  rows={2}
                  placeholder="Notes, édition collector, souvenirs..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* Cover URL with live preview and auto-search */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="game-cover" className="text-xs font-bold text-slate-700">
                    Jaquette du jeu (Box Art)
                  </label>
                  <button
                    type="button"
                    onClick={handleFetchCover}
                    disabled={!title.trim() || isSearching}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-40"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Rechercher la jaquette
                  </button>
                </div>

                <div className="flex gap-3 items-start">
                  <input
                    id="game-cover"
                    type="url"
                    placeholder="URL de la jaquette ou cliquez sur Rechercher..."
                    value={coverUrl}
                    onChange={(e) => setCoverUrl(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {coverUrl && (
                    <div className="w-12 h-16 rounded-lg bg-slate-950 overflow-hidden shrink-0 border border-slate-300 shadow-sm relative flex items-center justify-center">
                      <img
                        src={coverUrl}
                        alt="Aperçu jaquette"
                        className="w-full h-full object-contain p-0.5"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  id="btn-submit-game"
                  type="submit"
                  disabled={!title.trim()}
                  className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  Ajouter à ma collection
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
