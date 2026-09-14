import React, { useState, useEffect } from 'react';
import { X, Barcode, PenTool, Sparkles, Check, AlertTriangle, Disc3, ShieldCheck, Boxes, Plus, Layers, ArrowRight, Coins, Search, Settings, Loader2, ExternalLink } from 'lucide-react';
import { Game, GameCondition, GameStatus } from '../types';
import { CONSOLE_LIST, INITIAL_GAMES, SAMPLE_BARCODES } from '../data/sampleGames';
import { BarcodeScanner } from './BarcodeScanner';
import { CONDITION_LABELS, STATUS_LABELS } from '../utils/consoleThemes';
import { estimateMarketValue } from '../utils/marketPriceGuide';
import { getGeminiAuthHeaders, hasStoredGeminiApiKey, getStoredGeminiApiKey, callDirectGeminiJson } from '../utils/geminiApiKey';

export function getSafeCoverUrl(url?: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('/api/covers/proxy') || trimmed.startsWith('data:image/')) {
    return trimmed;
  }
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return `/api/covers/proxy?url=${encodeURIComponent(trimmed)}`;
  }
  return trimmed;
}

interface AddGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddGame: (game: Omit<Game, 'id' | 'addedAt'>) => void;
  initialBarcodeMode?: boolean;
  initialBarcode?: string;
  existingGames?: Game[];
  onUpdateQuantity?: (gameId: string, newQuantity: number) => void;
  onUpdateGamePrice?: (gameId: string, newPrice: number) => void;
  onUpdateGame?: (updated: Game) => void;
  onOpenSettings?: () => void;
}

export const AddGameModal: React.FC<AddGameModalProps> = ({
  isOpen,
  onClose,
  onAddGame,
  initialBarcodeMode = false,
  initialBarcode = '',
  existingGames = [],
  onUpdateQuantity,
  onUpdateGamePrice,
  onUpdateGame,
  onOpenSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'barcode' | 'manual'>(
    initialBarcodeMode ? 'barcode' : 'manual'
  );

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialBarcodeMode ? 'barcode' : 'manual');
      if (initialBarcode) {
        setBarcode(initialBarcode);
      }
    }
  }, [isOpen, initialBarcodeMode, initialBarcode]);

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
  const [isSearchingCover, setIsSearchingCover] = useState(false);
  const [coverAlternatives, setCoverAlternatives] = useState<any[]>([]);
  const [lookupMessage, setLookupMessage] = useState<{ type: 'success' | 'warning' | 'error'; text: string } | null>(null);
  const [titleSuggestions, setTitleSuggestions] = useState<any[]>([]);

  if (!isOpen) return null;

  const applyGameDetails = (g: {
    title: string;
    console?: string;
    releaseYear?: number;
    publisher?: string;
    developer?: string;
    genre?: string;
    synopsis?: string;
    estimatedValue?: number;
    coverUrl?: string;
    barcode?: string;
  }) => {
    if (g.title) setTitle(g.title);
    if (g.console) {
      if (CONSOLE_LIST.includes(g.console as any)) {
        setConsoleName(g.console);
      } else {
        setConsoleName('Autre');
        setCustomConsole(g.console);
      }
    }
    if (g.barcode && !barcode) setBarcode(g.barcode);
    if (g.releaseYear) setReleaseYear(g.releaseYear);
    if (g.publisher) setPublisher(g.publisher);
    if (g.developer) setDeveloper(g.developer);
    if (g.genre) setGenre(g.genre);
    if (g.synopsis && !notes) setNotes(g.synopsis);
    const targetConsole = g.console || consoleName;
    const marketCote = estimateMarketValue(g.title, targetConsole, condition);
    const finalEstimated = (typeof g.estimatedValue === 'number' && g.estimatedValue > 0)
      ? g.estimatedValue
      : marketCote;
    setEstimatedValue(finalEstimated);
    if (g.coverUrl) {
      setCoverUrl(getSafeCoverUrl(g.coverUrl));
    } else {
      fetch(`/api/games/find-cover?title=${encodeURIComponent(g.title)}&console=${encodeURIComponent(targetConsole)}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.coverUrl) setCoverUrl(getSafeCoverUrl(d.coverUrl));
          if (d.covers && d.covers.length > 0) setCoverAlternatives(d.covers);
        })
        .catch(() => {});
    }
    setTitleSuggestions([]);
  };

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
    setCoverAlternatives([]);
    setIsSearchingCover(false);
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
    setTitleSuggestions([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleBarcodeDetected = async (code: string) => {
    if (!code) return;
    const cleanCode = code.trim();
    setBarcode(cleanCode);
    setIsSearching(true);
    setLookupMessage(null);
    setStockUpdatedSuccess(null);

    const codeDigits = cleanCode.replace(/\D/g, '');
    const codeUnpadded = codeDigits.replace(/^0+/, '');

    // 1. Fast check: is this barcode already present in our existing stock?
    const localMatch = existingGames.find((g) => {
      if (!g.barcode) return false;
      const bClean = g.barcode.trim();
      if (bClean === cleanCode) return true;
      const bDigits = bClean.replace(/\D/g, '');
      if (bDigits && bDigits === codeDigits) return true;
      const bUnpadded = bDigits.replace(/^0+/, '');
      return bUnpadded && bUnpadded === codeUnpadded && codeUnpadded.length >= 7;
    });

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
      if (localMatch.condition) setCondition(localMatch.condition);
      if (localMatch.status) setStatus(localMatch.status);
      if (localMatch.rating) setRating(localMatch.rating);
      if (typeof localMatch.purchasePrice === 'number') setPurchasePrice(localMatch.purchasePrice);

      // Calculer et mettre à jour immédiatement la cote d'occasion actuelle
      const freshCote = estimateMarketValue(localMatch.title, localMatch.console, localMatch.condition);
      setEstimatedValue(freshCote);

      // Mettre à jour automatiquement la cote occasion du jeu existant dans la collection
      if (onUpdateGamePrice) {
        onUpdateGamePrice(localMatch.id, freshCote);
      }

      setLookupMessage({
        type: 'success',
        text: `Jeu déjà en stock : "${localMatch.title}" (${localMatch.console}) • Cote occasion actualisée à ${freshCote} € (${localMatch.quantity || 1} exemplaire${(localMatch.quantity || 1) > 1 ? 's' : ''})`,
      });
      setIsSearching(false);
      setActiveTab('manual');
      return;
    }

    // 2. Pure live web search for this barcode
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 18000);
      const userKey = getStoredGeminiApiKey();

      const res = await fetch('/api/games/lookup-barcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getGeminiAuthHeaders() },
        body: JSON.stringify({ barcode: cleanCode, apiKey: userKey || undefined }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await res.json();

      if (data.found && data.game) {
        applyGameDetails({ ...data.game, barcode: cleanCode });

        const freshCote = (typeof data.game.estimatedValue === 'number' && data.game.estimatedValue > 0)
          ? data.game.estimatedValue
          : estimateMarketValue(data.game.title, data.game.console, condition);

        // Si ce jeu existait déjà sous un autre format/code dans le stock, actualiser sa cote
        const alreadyInStock = existingGames.find(
          (g) => g.title.toLowerCase().trim() === data.game.title.toLowerCase().trim() &&
                 g.console.toLowerCase().trim() === (data.game.console || '').toLowerCase().trim()
        );
        if (alreadyInStock) {
          if (onUpdateGamePrice) {
            onUpdateGamePrice(alreadyInStock.id, freshCote);
          }
          if (onUpdateGame && !alreadyInStock.barcode) {
            onUpdateGame({ ...alreadyInStock, barcode: cleanCode, estimatedValue: freshCote });
          }
        }

        setLookupMessage({
          type: 'success',
          text: `Jeu identifié en direct sur le web : "${data.game.title}" (${data.game.console}) • Cote occasion actualisée : ${freshCote} €`,
        });
        setIsSearching(false);
        setActiveTab('manual');
        return;
      }

      // Si le serveur n'a rien trouvé mais que l'utilisateur a configuré sa clé Gemini, tenter un secours direct
      if (!data.found && hasStoredGeminiApiKey()) {
        try {
          const directPrompt = `Tu es un expert mondial en jeux vidéo physiques. Le code-barres EAN/UPC suivant se trouve sur la boîte d'un jeu vidéo console : "${cleanCode}".
Identifie avec exactitude le jeu vidéo correspondant. Réponds avec un JSON strict :
{
  "title": "titre officiel du jeu",
  "console": "console (ex: Nintendo Switch, PlayStation 4, Xbox One, etc.)",
  "releaseYear": 2018,
  "publisher": "éditeur",
  "genre": "genre en français",
  "synopsis": "résumé en 1 phrase",
  "estimatedValue": 15
}`;
          const directData = await callDirectGeminiJson(directPrompt, userKey);
          if (directData && directData.title) {
            applyGameDetails({ ...directData, barcode: cleanCode });
            setLookupMessage({
              type: 'success',
              text: `Jeu identifié par IA Gemini : "${directData.title}" (${directData.console || 'Jeu vidéo'})`,
            });
            setIsSearching(false);
            setActiveTab('manual');
            return;
          }
        } catch {
          // ignore
        }
      }
    } catch {
      // Fallback secours direct navigateur si le serveur est inaccessible
      if (hasStoredGeminiApiKey()) {
        try {
          const directPrompt = `Tu es un expert mondial en jeux vidéo physiques. Le code-barres EAN/UPC suivant se trouve sur la boîte d'un jeu vidéo console : "${cleanCode}".
Identifie avec exactitude le jeu vidéo correspondant. Réponds avec un JSON strict :
{
  "title": "titre officiel du jeu",
  "console": "console (ex: Nintendo Switch, PlayStation 4, Xbox One, etc.)",
  "releaseYear": 2018,
  "publisher": "éditeur",
  "genre": "genre en français",
  "synopsis": "résumé en 1 phrase",
  "estimatedValue": 15
}`;
          const directData = await callDirectGeminiJson(directPrompt);
          if (directData && directData.title) {
            applyGameDetails({ ...directData, barcode: cleanCode });
            setLookupMessage({
              type: 'success',
              text: `Jeu identifié par IA Gemini : "${directData.title}" (${directData.console || 'Jeu vidéo'})`,
            });
            setIsSearching(false);
            setActiveTab('manual');
            return;
          }
        } catch {
          // ignore
        }
      }
    }

    // Aucun jeu trouvé via la recherche web en direct : on n'utilise aucune base interne
    setLookupMessage({
      type: 'warning',
      text: `Recherche web effectuée pour "${cleanCode}" : aucun jeu vidéo trouvé directement. Entrez le titre du jeu ci-dessous ou consultez la recherche Google.`,
    });
    setActiveTab('manual');
    setIsSearching(false);
  };

  const handleAiEnrich = async (overrideTitle?: string, overrideConsole?: string) => {
    const searchTitle = (overrideTitle || title).trim();
    if (!searchTitle) return;
    setIsSearching(true);
    setLookupMessage(null);
    setTitleSuggestions([]);

    const targetConsole = overrideConsole || (consoleName === 'Autre' ? customConsole : consoleName);
    const userKey = getStoredGeminiApiKey();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      const res = await fetch('/api/games/search-gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getGeminiAuthHeaders() },
        body: JSON.stringify({
          query: searchTitle,
          console: targetConsole,
          barcode: barcode || undefined,
          apiKey: userKey || undefined,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const best = data.results[0];
        applyGameDetails(best);
        setLookupMessage({
          type: 'success',
          text: `Détails et jaquette enrichis automatiquement pour "${best.title}" !`,
        });
        return;
      }

      // Si le serveur n'a rien renvoyé mais que l'utilisateur a sa clé Gemini
      if (hasStoredGeminiApiKey()) {
        const directPrompt = `Tu es une encyclopédie de jeux vidéo. L'utilisateur veut enrichir la fiche du jeu suivant :
Titre : "${searchTitle}"
${targetConsole ? `Console : "${targetConsole}"` : ''}
Réponds EXCLUSIVEMENT avec un objet JSON strict :
{
  "title": "titre officiel complet",
  "console": "${targetConsole || 'console principale'}",
  "releaseYear": 2018,
  "publisher": "éditeur",
  "developer": "développeur",
  "genre": "genre en français",
  "synopsis": "résumé en français en 1 ou 2 phrases",
  "estimatedValue": 15
}`;
        const directData = await callDirectGeminiJson(directPrompt, userKey);
        if (directData && directData.title) {
          applyGameDetails(directData);
          setLookupMessage({
            type: 'success',
            text: `Fiche enrichie par IA Gemini pour "${directData.title}" !`,
          });
          return;
        }
      }

      setLookupMessage({
        type: 'warning',
        text: data.message || 'Aucun détail supplémentaire trouvé automatiquement pour ce titre.',
      });
    } catch {
      // Secours direct client
      if (hasStoredGeminiApiKey()) {
        try {
          const directPrompt = `Tu es une encyclopédie de jeux vidéo. L'utilisateur veut enrichir la fiche du jeu suivant :
Titre : "${searchTitle}"
${targetConsole ? `Console : "${targetConsole}"` : ''}
Réponds EXCLUSIVEMENT avec un objet JSON strict :
{
  "title": "titre officiel complet",
  "console": "${targetConsole || 'console principale'}",
  "releaseYear": 2018,
  "publisher": "éditeur",
  "developer": "développeur",
  "genre": "genre en français",
  "synopsis": "résumé en français en 1 ou 2 phrases",
  "estimatedValue": 15
}`;
          const directData = await callDirectGeminiJson(directPrompt, userKey);
          if (directData && directData.title) {
            applyGameDetails(directData);
            setLookupMessage({
              type: 'success',
              text: `Fiche enrichie avec succès par IA Gemini pour "${directData.title}" !`,
            });
            return;
          }
        } catch {
          // ignore
        }
      }

      setLookupMessage({
        type: 'warning',
        text: 'Informations en ligne non trouvées automatiquement. Vous pouvez compléter la fiche manuellement.',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleFetchCover = async () => {
    if (!title.trim()) return;
    setIsSearchingCover(true);
    setLookupMessage(null);

    const targetConsole = consoleName === 'Autre' ? customConsole : consoleName;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 9000);

      const res = await fetch(`/api/games/find-cover?title=${encodeURIComponent(title)}&console=${encodeURIComponent(targetConsole)}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await res.json();
      if (data.coverUrl) {
        setCoverUrl(getSafeCoverUrl(data.coverUrl));
        if (data.covers && Array.isArray(data.covers) && data.covers.length > 0) {
          setCoverAlternatives(data.covers);
        }
        setLookupMessage({
          type: 'success',
          text: 'Jaquette trouvée ! Vous pouvez aussi sélectionner une autre proposition ci-dessous.',
        });
      } else {
        setLookupMessage({
          type: 'warning',
          text: 'Aucune jaquette trouvée automatiquement. Utilisez le bouton Google Images ci-dessous pour choisir une illustration.',
        });
      }
    } catch {
      setLookupMessage({
        type: 'warning',
        text: 'La recherche automatique a pris trop de temps. Utilisez le bouton Google Images ci-dessous pour coller une image.',
      });
    } finally {
      setIsSearchingCover(false);
    }
  };

  const handleIncrementStock = (targetGame: Game) => {
    const currentQty = targetGame.quantity || 1;
    const newQty = currentQty + quantityToAdd;
    const freshCote = typeof estimatedValue === 'number' && estimatedValue > 0
      ? estimatedValue
      : estimateMarketValue(targetGame.title, targetGame.console, targetGame.condition);

    if (onUpdateGame) {
      onUpdateGame({
        ...targetGame,
        quantity: newQty,
        estimatedValue: freshCote,
        barcode: targetGame.barcode || (barcode.trim() || undefined),
      });
    } else {
      if (onUpdateQuantity) onUpdateQuantity(targetGame.id, newQty);
      if (onUpdateGamePrice) onUpdateGamePrice(targetGame.id, freshCote);
    }

    setStockUpdatedSuccess(
      `Stock et cote mis à jour ! "${targetGame.title}" (${targetGame.console}) compte désormais ${newQty} exemplaire${newQty > 1 ? 's' : ''} (Cote : ${freshCote} €).`
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

    // Si le jeu existe déjà en stock, mettre à jour la quantité et la cote
    if (primaryStockMatch && onUpdateGame) {
      onUpdateGame({
        ...primaryStockMatch,
        quantity: (primaryStockMatch.quantity || 1) + (quantity > 0 ? quantity : 1),
        estimatedValue: calculatedEstimatedValue,
        barcode: primaryStockMatch.barcode || (barcode.trim() || undefined),
        condition,
        status,
        rating,
        notes: notes.trim() || primaryStockMatch.notes,
      });
      handleClose();
      return;
    }

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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-hidden">
      <div
        id="add-game-modal"
        className="relative w-full h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:max-w-xl bg-[#0f1423] text-slate-200 rounded-t-2xl sm:rounded-2xl shadow-2xl border-2 border-slate-700/80 flex flex-col overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b-2 border-slate-800 bg-gradient-to-r from-[#0b0e17] via-[#141b2d] to-[#0b0e17] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-sm shrink-0 font-bold border border-amber-300">
              <Disc3 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            <div className="min-w-0 font-retro">
              <h2 className="text-xs sm:text-sm font-pixel font-bold text-amber-300 truncate">AJOUTER UN JEU</h2>
              <p className="text-[10px] sm:text-xs text-slate-400 truncate">Scan direct caméra ou saisie manuelle</p>
            </div>
          </div>
          <button
            id="btn-close-modal"
            type="button"
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer active:scale-95"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-800 bg-[#0b0e17] p-1.5 gap-1.5 shrink-0">
          <button
            id="tab-barcode"
            type="button"
            onClick={() => setActiveTab('barcode')}
            className={`flex-1 py-2 text-[10px] sm:text-xs font-pixel font-bold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'barcode'
                ? 'bg-[#1a233a] text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            {isSearching ? (
              <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            ) : (
              <Barcode className="w-3.5 h-3.5 text-cyan-400" />
            )}
            <span>{isSearching ? 'RECHERCHE EN COURS...' : 'SCANNER CODE-BARRES'}</span>
          </button>
          <button
            id="tab-manual"
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-2 text-[10px] sm:text-xs font-pixel font-bold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'manual'
                ? 'bg-[#1a233a] text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <PenTool className="w-3.5 h-3.5 text-amber-400" />
            <span>SAISIE MANUELLE {barcode ? '(CODE LIÉ)' : ''}</span>
          </button>
        </div>

        {/* Searching Indicator Banner */}
        {isSearching && (
          <div className="mx-4 sm:mx-6 mt-3 p-3 rounded-xl text-xs flex items-center gap-3 border bg-amber-950/80 text-amber-200 border-amber-500/60 font-medium shrink-0 font-retro animate-pulse shadow-md">
            <div className="w-7 h-7 rounded-lg bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0 border border-amber-400/40">
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-amber-300 flex items-center gap-1.5">
                <span>RECHERCHE EN COURS...</span>
                <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              </p>
              <p className="text-[11px] text-amber-200/80 truncate">
                {barcode ? `Code-barres : ${barcode} — Interrogation des bases de données de jeux...` : 'Analyse et identification du jeu vidéo en cours...'}
              </p>
            </div>
          </div>
        )}

        {/* Feedback message */}
        {stockUpdatedSuccess ? (
          <div className="mx-4 sm:mx-6 mt-3 p-3 rounded-xl text-xs flex items-center gap-2 border bg-emerald-950/80 text-emerald-300 border-emerald-500/50 font-medium shrink-0 font-retro">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{stockUpdatedSuccess}</span>
          </div>
        ) : lookupMessage && (
          <div
            className={`mx-4 sm:mx-6 mt-3 p-3 rounded-xl text-xs flex items-start gap-2 border shrink-0 font-retro ${
              lookupMessage.type === 'success'
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                : lookupMessage.type === 'warning'
                ? 'bg-amber-950/70 text-amber-200 border-amber-500/50'
                : 'bg-rose-950/80 text-rose-200 border-rose-500/50'
            }`}
          >
            {lookupMessage.type === 'success' ? (
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 space-y-1.5">
              <span>{lookupMessage.text}</span>
              {lookupMessage.type === 'warning' && (title || barcode) && (
                <div className="pt-1 flex flex-wrap items-center gap-2">
                  {barcode && (
                    <a
                      href={`https://www.google.com/search?q=${encodeURIComponent(barcode)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold font-pixel text-[9px] transition cursor-pointer shadow-2xs"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Google Code-barres ({barcode})</span>
                    </a>
                  )}
                  {title && (
                    <a
                      href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(`${title} ${finalConsole !== 'Autre' ? finalConsole : ''} jaquette box art`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-bold font-pixel text-[9px] transition cursor-pointer shadow-2xs"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Google Images ({title})</span>
                    </a>
                  )}
                </div>
              )}
              {lookupMessage.type !== 'success' && !hasStoredGeminiApiKey() && onOpenSettings && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenSettings();
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg font-bold font-pixel text-[9px] transition cursor-pointer shadow-2xs"
                  >
                    <Settings className="w-3 h-3 text-slate-950" />
                    <span>Ajouter votre clé API Gemini pour l'IA en ligne</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {activeTab === 'barcode' ? (
            <BarcodeScanner
              onBarcodeDetected={handleBarcodeDetected}
              onTitleSearch={(searchedTitle) => {
                setTitle(searchedTitle);
                setActiveTab('manual');
                handleAiEnrich(searchedTitle);
              }}
              isLoading={isSearching}
              existingGames={existingGames}
              autoStart={true}
              initialCode={barcode}
            />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Primary Stock Match Alert Banner */}
              {primaryStockMatch && (
                <div className="p-4 rounded-2xl bg-[#1c1809] border-2 border-amber-500/60 shadow-sm animate-fadeIn font-retro">
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 aspect-[3/4] rounded-lg bg-slate-950 overflow-hidden shrink-0 border border-amber-400/80 shadow flex items-center justify-center">
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
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-pixel font-bold uppercase tracking-wider bg-amber-400 text-slate-950 shadow-2xs">
                          <Boxes className="w-3 h-3" />
                          DÉJÀ EN STOCK
                        </span>
                        <span className="text-xs font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded-md border border-amber-500/40">
                          Stock actuel : {primaryStockMatch.quantity || 1} exemplaire{(primaryStockMatch.quantity || 1) > 1 ? 's' : ''}
                        </span>
                        <span className="text-xs font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-500/40 flex items-center gap-1">
                          <Coins className="w-3 h-3 text-emerald-400" />
                          Cote : {typeof estimatedValue === 'number' && estimatedValue > 0 ? `${estimatedValue} €` : `${primaryStockMatch.estimatedValue || estimateMarketValue(primaryStockMatch.title, primaryStockMatch.console, primaryStockMatch.condition)} €`}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-100 truncate">
                        {primaryStockMatch.title}{' '}
                        <span className="text-slate-400 font-normal">({primaryStockMatch.console})</span>
                      </h4>
                      <p className="text-xs text-slate-300 mt-0.5">
                        État : <span className="font-semibold text-amber-300">{CONDITION_LABELS[primaryStockMatch.condition]?.label || primaryStockMatch.condition}</span>
                        {primaryStockMatch.barcode && <span> • Code : <code className="font-mono text-cyan-300">{primaryStockMatch.barcode}</code></span>}
                      </p>
                    </div>
                  </div>

                  {/* Stock Update Controls */}
                  {onUpdateQuantity && (
                    <div className="mt-3 pt-3 border-t border-amber-500/30 flex flex-wrap items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-amber-200">Quantité à ajouter :</span>
                        <div className="inline-flex items-center bg-[#0c101c] border border-amber-400/50 rounded-lg shadow-2xs overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setQuantityToAdd(Math.max(1, quantityToAdd - 1))}
                            className="px-2.5 py-1 text-slate-300 hover:bg-slate-800 font-bold text-xs cursor-pointer"
                          >
                            -
                          </button>
                          <span className="px-2.5 py-1 text-xs font-black text-amber-300 font-mono">
                            +{quantityToAdd}
                          </span>
                          <button
                            type="button"
                            onClick={() => setQuantityToAdd(quantityToAdd + 1)}
                            className="px-2.5 py-1 text-slate-300 hover:bg-slate-800 font-bold text-xs cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleIncrementStock(primaryStockMatch)}
                          className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold font-pixel shadow-sm flex items-center gap-1.5 cursor-pointer transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Mettre à jour le stock (Passer à {(primaryStockMatch.quantity || 1) + quantityToAdd} ex.) & la cote
                        </button>
                        {onUpdateGamePrice && (
                          <button
                            type="button"
                            onClick={() => {
                              const freshVal = typeof estimatedValue === 'number' && estimatedValue > 0
                                ? estimatedValue
                                : estimateMarketValue(primaryStockMatch.title, primaryStockMatch.console, primaryStockMatch.condition);
                              onUpdateGamePrice(primaryStockMatch.id, freshVal);
                              setStockUpdatedSuccess(`Cote occasion actualisée à ${freshVal} € !`);
                              setTimeout(() => handleClose(), 1200);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold font-pixel shadow-sm flex items-center gap-1.5 cursor-pointer transition"
                          >
                            <Coins className="w-3.5 h-3.5" />
                            Actualiser la cote ({typeof estimatedValue === 'number' && estimatedValue > 0 ? estimatedValue : estimateMarketValue(primaryStockMatch.title, primaryStockMatch.console, primaryStockMatch.condition)} €)
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Cross-Console Matches Pill */}
              {crossConsoleMatches.length > 0 && (
                <div className="p-2.5 rounded-xl bg-[#131929] border border-cyan-500/30 text-xs text-cyan-200 flex items-center gap-2 font-retro">
                  <Layers className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>
                    Également en stock sur :{' '}
                    {crossConsoleMatches.map((m, idx) => (
                      <strong key={m.id} className="font-semibold text-amber-300">
                        {m.console} ({m.quantity || 1} ex.){idx < crossConsoleMatches.length - 1 ? ', ' : ''}
                      </strong>
                    ))}
                  </span>
                </div>
              )}

              {/* Title & AI Autofill */}
              <div className="font-retro relative">
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="game-title" className="text-xs font-bold font-pixel text-slate-300">
                    NOM DU JEU *
                  </label>
                  <button
                    type="button"
                    onClick={() => handleAiEnrich()}
                    disabled={!title.trim() || isSearching}
                    className="text-[10px] text-amber-400 hover:text-amber-300 font-pixel font-medium flex items-center gap-1 cursor-pointer disabled:opacity-40"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Compléter avec l'IA
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="game-title"
                    type="text"
                    required
                    placeholder="Ex: Need for Speed The Run, Super Mario Odyssey..."
                    value={title}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTitle(val);
                      if (lookupMessage?.type === 'warning') setLookupMessage(null);
                      if (val.trim().length >= 2) {
                        const q = val.toLowerCase().trim();
                        const matched = existingGames
                          .filter((g) => g.title.toLowerCase().includes(q))
                          .slice(0, 5)
                          .map((g) => ({
                            title: g.title,
                            console: g.console,
                            coverUrl: g.coverUrl,
                            genre: g.genre,
                            releaseYear: g.releaseYear,
                            publisher: g.publisher,
                            developer: g.developer,
                          }));
                        setTitleSuggestions(matched);
                      } else {
                        setTitleSuggestions([]);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAiEnrich();
                      }
                    }}
                    className="w-full px-3.5 py-2.5 bg-[#151c2e] border border-slate-700 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  />
                  {title && (
                    <button
                      type="button"
                      onClick={() => {
                        setTitle('');
                        setTitleSuggestions([]);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs cursor-pointer p-1"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Instant Title Suggestions Dropdown */}
                {titleSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-[#0d121f] border border-amber-500/50 rounded-xl shadow-2xl overflow-hidden p-1.5 space-y-1">
                    <div className="text-[10px] font-pixel text-amber-400/80 px-2 py-1 flex items-center gap-1.5 border-b border-slate-800">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>SUGGESTIONS AUTOMATIQUES (CLIQUEZ POUR REMPLIR) :</span>
                    </div>
                    {titleSuggestions.map((sug, idx) => (
                      <button
                        key={`${sug.title}-${sug.console}-${idx}`}
                        type="button"
                        onClick={() => applyGameDetails(sug)}
                        className="w-full text-left p-2 rounded-lg hover:bg-amber-400/10 hover:border-amber-400/40 border border-transparent transition flex items-center justify-between gap-2 cursor-pointer group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {sug.coverUrl && (
                            <img
                              src={getSafeCoverUrl(sug.coverUrl)}
                              alt=""
                              className="w-7 h-9 object-contain bg-black/40 rounded border border-slate-700/60 shrink-0"
                              referrerPolicy="no-referrer"
                            />
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-200 group-hover:text-amber-300 truncate">
                              {sug.title}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {sug.console} {sug.releaseYear ? `• ${sug.releaseYear}` : ''} {sug.genre ? `• ${sug.genre}` : ''}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-pixel text-amber-400 shrink-0 opacity-80 group-hover:opacity-100">
                          Sélectionner →
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Console selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-retro">
                <div>
                  <label htmlFor="game-console" className="block text-xs font-bold font-pixel text-slate-300 mb-1">
                    CONSOLE / PLATEFORME *
                  </label>
                  <select
                    id="game-console"
                    value={consoleName}
                    onChange={(e) => {
                      const newCons = e.target.value;
                      setConsoleName(newCons);
                      if (title.trim()) {
                        const targetC = newCons === 'Autre' ? customConsole : newCons;
                        const val = estimateMarketValue(title, targetC, condition);
                        setEstimatedValue(val);
                      }
                    }}
                    className="w-full px-3 py-2.5 bg-[#151c2e] border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 cursor-pointer"
                  >
                    {CONSOLE_LIST.map((c) => (
                      <option key={c} value={c} className="bg-[#151c2e] text-slate-100">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {consoleName === 'Autre' ? (
                  <div>
                    <label htmlFor="custom-console" className="block text-xs font-bold font-pixel text-slate-300 mb-1">
                      NOM DE LA CONSOLE
                    </label>
                    <input
                      id="custom-console"
                      type="text"
                      placeholder="Ex: Atari 2600, Neo-Geo..."
                      value={customConsole}
                      onChange={(e) => setCustomConsole(e.target.value)}
                      className="w-full px-3 py-2.5 bg-[#151c2e] border border-slate-700 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                    />
                  </div>
                ) : (
                  <div>
                    <label htmlFor="game-year" className="block text-xs font-bold font-pixel text-slate-300 mb-1">
                      ANNÉE DE SORTIE
                    </label>
                    <input
                      id="game-year"
                      type="number"
                      min={1970}
                      max={2035}
                      placeholder="Ex: 2021"
                      value={releaseYear}
                      onChange={(e) => setReleaseYear(e.target.value ? parseInt(e.target.value, 10) : '')}
                      className="w-full px-3 py-2.5 bg-[#151c2e] border border-slate-700 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                    />
                  </div>
                )}
              </div>

              {/* Barcode & Genre */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-retro">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="game-barcode" className="text-xs font-bold font-pixel text-slate-300">
                      CODE-BARRES (EAN/UPC)
                    </label>
                    <div className="flex items-center gap-2">
                      {barcode.trim().length >= 4 && (
                        <a
                          href={`https://www.google.com/search?q=${encodeURIComponent(barcode.trim())}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-slate-400 hover:text-amber-300 font-pixel flex items-center gap-1 transition"
                          title="Ouvrir la recherche Google pour ce code-barres"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Voir sur Google</span>
                        </a>
                      )}
                      {barcode.replace(/\D/g, '').length >= 6 && (
                        <button
                          type="button"
                          onClick={() => handleBarcodeDetected(barcode)}
                          disabled={isSearching}
                          className="text-[10px] text-cyan-400 hover:text-cyan-300 font-pixel font-bold flex items-center gap-1 cursor-pointer"
                          title="Lancer la recherche web en direct pour ce code-barres"
                        >
                          <Search className="w-3 h-3" />
                          <span>Rechercher sur le web</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      id="game-barcode"
                      type="text"
                      placeholder="Ex: 5026555358996..."
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (barcode.replace(/\D/g, '').length >= 6) {
                            handleBarcodeDetected(barcode);
                          }
                        }
                      }}
                      className="flex-1 px-3 py-2 bg-[#151c2e] border border-slate-700 rounded-xl text-sm font-mono text-cyan-300 focus:outline-none focus:border-amber-400"
                    />
                    <button
                      type="button"
                      onClick={() => handleBarcodeDetected(barcode)}
                      disabled={isSearching || barcode.replace(/\D/g, '').length < 6}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-amber-300 font-pixel text-[10px] rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer shrink-0"
                      title="Lancer la recherche web en direct avec ce code-barres"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Identifier (Web)</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Recherche en direct sur internet pour chaque code entré (aucune base interne fixe).
                  </p>
                </div>
                <div>
                  <label htmlFor="game-genre" className="block text-xs font-bold font-pixel text-slate-300 mb-1">
                    GENRE
                  </label>
                  <input
                    id="game-genre"
                    type="text"
                    placeholder="Ex: Action-RPG, Plateforme..."
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="w-full px-3 py-2 bg-[#151c2e] border border-slate-700 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Publisher & Developer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-retro">
                <div>
                  <label htmlFor="game-publisher" className="block text-xs font-bold font-pixel text-slate-300 mb-1">
                    ÉDITEUR
                  </label>
                  <input
                    id="game-publisher"
                    type="text"
                    placeholder="Ex: Nintendo, Sony, Capcom..."
                    value={publisher}
                    onChange={(e) => setPublisher(e.target.value)}
                    className="w-full px-3 py-2 bg-[#151c2e] border border-slate-700 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label htmlFor="game-developer" className="block text-xs font-bold font-pixel text-slate-300 mb-1">
                    DÉVELOPPEUR
                  </label>
                  <input
                    id="game-developer"
                    type="text"
                    placeholder="Ex: FromSoftware, Square Enix..."
                    value={developer}
                    onChange={(e) => setDeveloper(e.target.value)}
                    className="w-full px-3 py-2 bg-[#151c2e] border border-slate-700 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Condition, Status & Quantity */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-retro">
                <div>
                  <label htmlFor="game-condition" className="block text-xs font-bold font-pixel text-slate-300 mb-1">
                    ÉTAT PHYSIQUE
                  </label>
                  <select
                    id="game-condition"
                    value={condition}
                    onChange={(e) => {
                      const newCond = e.target.value as GameCondition;
                      setCondition(newCond);
                      if (title.trim()) {
                        const val = estimateMarketValue(title, finalConsole, newCond);
                        setEstimatedValue(val);
                      }
                    }}
                    className="w-full px-3 py-2 bg-[#151c2e] border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    {Object.entries(CONDITION_LABELS).map(([k, v]) => (
                      <option key={k} value={k} className="bg-[#151c2e] text-slate-100">
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="game-status" className="block text-xs font-bold font-pixel text-slate-300 mb-1">
                    STATUT
                  </label>
                  <select
                    id="game-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as GameStatus)}
                    className="w-full px-3 py-2 bg-[#151c2e] border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    {Object.entries(STATUS_LABELS).map(([k, v]) => (
                      <option key={k} value={k} className="bg-[#151c2e] text-slate-100">
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="game-quantity" className="block text-xs font-bold font-pixel text-slate-300 mb-1">
                    QUANTITÉ
                  </label>
                  <div className="flex items-center bg-[#151c2e] border border-slate-700 rounded-xl overflow-hidden h-[38px]">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 h-full text-slate-300 hover:bg-slate-800 font-bold cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      id="game-quantity"
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full text-center bg-transparent font-bold text-amber-300 text-sm focus:outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-3 h-full text-slate-300 hover:bg-slate-800 font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Cote Argus d'occasion & Prix d'achat */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-[#0e2118] rounded-2xl border border-emerald-500/40 font-retro">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="game-estimated-value" className="block text-xs font-bold font-pixel text-emerald-300 flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5 text-emerald-400" />
                      COTE OCCASION (€)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const val = estimateMarketValue(title, finalConsole, condition);
                        setEstimatedValue(val);
                      }}
                      className="text-[10px] font-pixel font-bold text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
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
                      className="w-full pl-3 pr-8 py-2 bg-[#0c1813] border border-emerald-500/50 rounded-xl text-sm font-mono font-bold text-emerald-300 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                    />
                    <span className="absolute right-3 top-2 text-xs font-bold text-emerald-400 font-mono">€</span>
                  </div>
                  <span className="text-[10px] text-emerald-200/80 mt-1 block">
                    Argus Mister Game Price & Ventes eBay France (PAL FR)
                  </span>
                </div>

                <div>
                  <label htmlFor="game-purchase-price" className="block text-xs font-bold font-pixel text-slate-300 mb-1">
                    PRIX PAYÉ (€) <span className="text-slate-400 font-normal font-retro">(optionnel)</span>
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
                      className="w-full pl-3 pr-8 py-2 bg-[#151c2e] border border-slate-700 rounded-xl text-sm font-mono text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                    />
                    <span className="absolute right-3 top-2 text-xs font-bold text-slate-400 font-mono">€</span>
                  </div>
                </div>
              </div>

              {/* Rating */}
              <div className="font-retro">
                <label className="block text-xs font-bold font-pixel text-slate-300 mb-1">
                  NOTE PERSONNELLE : {rating}/5
                </label>
                <div className="flex gap-2 items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`text-xl transition cursor-pointer ${
                        star <= rating ? 'text-amber-400 scale-110' : 'text-slate-700 hover:text-amber-300'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="font-retro">
                <label htmlFor="game-notes" className="block text-xs font-bold font-pixel text-slate-300 mb-1">
                  NOTES OU DESCRIPTION
                </label>
                <textarea
                  id="game-notes"
                  rows={2}
                  placeholder="Notes, édition collector, souvenirs..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-[#151c2e] border border-slate-700 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400 resize-none"
                />
              </div>

              {/* Cover URL with live preview and auto-search */}
              <div className="font-retro">
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="game-cover" className="text-xs font-bold font-pixel text-slate-300">
                    JAQUETTE DU JEU (BOX ART)
                  </label>
                  <div className="flex items-center gap-2.5">
                    {title.trim() && (
                      <a
                        href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(`${title} ${finalConsole !== 'Autre' ? finalConsole : ''} jaquette box art`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-sky-400 hover:text-sky-300 font-pixel flex items-center gap-1 cursor-pointer transition hover:underline"
                        title="Rechercher des images sur Google dans un nouvel onglet"
                      >
                        <ExternalLink className="w-3 h-3 text-sky-400" />
                        Google Images
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={handleFetchCover}
                      disabled={!title.trim() || isSearchingCover}
                      className="text-[10px] text-amber-400 hover:text-amber-300 font-pixel font-bold flex items-center gap-1 cursor-pointer disabled:opacity-40"
                    >
                      {isSearchingCover ? (
                        <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      )}
                      {isSearchingCover ? 'Recherche...' : 'Rechercher jaquette'}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <input
                    id="game-cover"
                    type="text"
                    placeholder="URL de la jaquette ou cliquez sur Rechercher..."
                    value={coverUrl}
                    onChange={(e) => setCoverUrl(e.target.value)}
                    className="flex-1 px-3 py-2 bg-[#151c2e] border border-slate-700 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                  />
                  {coverUrl && (
                    <div className="w-12 h-16 rounded-lg bg-slate-950 overflow-hidden shrink-0 border-2 border-amber-400/80 shadow-sm relative flex items-center justify-center">
                      <img
                        src={getSafeCoverUrl(coverUrl)}
                        alt="Aperçu jaquette"
                        className="w-full h-full object-contain p-0.5"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (!target.src.includes('/api/covers/proxy') && (coverUrl.startsWith('http://') || coverUrl.startsWith('https://'))) {
                            target.src = `/api/covers/proxy?url=${encodeURIComponent(coverUrl)}`;
                          }
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Proposals / alternatives found */}
                {coverAlternatives.length > 1 && (
                  <div className="mt-2.5 p-2 bg-slate-900/80 rounded-xl border border-slate-800">
                    <div className="text-[10px] text-slate-400 font-pixel mb-1.5 flex items-center justify-between">
                      <span className="text-amber-400/90 font-bold">Autres jaquettes trouvées sur le web (cliquez pour choisir) :</span>
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                      {coverAlternatives.slice(0, 8).map((alt, idx) => {
                        const isSelected = coverUrl === alt.url || coverUrl === alt.rawUrl;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setCoverUrl(alt.url || alt.rawUrl);
                            }}
                            className={`w-12 h-16 rounded-lg border overflow-hidden shrink-0 transition cursor-pointer hover:scale-105 bg-slate-950 flex items-center justify-center p-0.5 ${
                              isSelected ? 'border-amber-400 ring-2 ring-amber-400/80 shadow-md' : 'border-slate-700 opacity-60 hover:opacity-100 hover:border-slate-500'
                            }`}
                            title={alt.title || 'Choisir cette jaquette'}
                          >
                            <img
                              src={alt.thumb || alt.url}
                              alt=""
                              className="w-full h-full object-contain"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                if (alt.url && target.src !== alt.url) {
                                  target.src = alt.url;
                                }
                              }}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-xs font-bold font-pixel text-slate-400 hover:text-slate-200 transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  id="btn-submit-game"
                  type="submit"
                  disabled={!title.trim()}
                  className="px-5 py-2.5 text-xs font-bold font-pixel text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  AJOUTER AU CATALOGUE
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
