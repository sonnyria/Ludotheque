import React, { useState, useEffect, useMemo } from 'react';
import { Game, ViewMode } from './types';
import { INITIAL_GAMES } from './data/sampleGames';
import { Navbar } from './components/Navbar';
import { ConsoleFilterBar } from './components/ConsoleFilterBar';
import { GameListView } from './components/GameListView';
import { GameShelfView } from './components/GameShelfView';
import { GameTableView } from './components/GameTableView';
import { GameDetailsModal } from './components/GameDetailsModal';
import { AddGameModal } from './components/AddGameModal';
import { StatsDrawer } from './components/StatsDrawer';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { GuideModal } from './components/GuideModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { getConsoleTheme } from './utils/consoleThemes';
import { estimateMarketValue, getGameEstimatedValue, COTE_SOURCE_INFO } from './utils/marketPriceGuide';
import { Gamepad2, Plus, Barcode, Sparkles, FilterX, RotateCcw, Trash2, X, Coins, Layers, RefreshCw, ExternalLink, Info } from 'lucide-react';
import { UpdatePricesModal } from './components/UpdatePricesModal';

const STORAGE_KEY = 'collection_jeux_video_v1';
const VIEW_MODE_STORAGE_KEY = 'collection_jeux_video_view_mode_v1';

export default function App() {
  const [games, setGames] = useState<Game[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Upgrade any legacy games with covers & estimated values
          return parsed.map((game: Game) => {
            const matchingSample = INITIAL_GAMES.find(
              (s) => s.id === game.id || s.title.toLowerCase() === game.title.toLowerCase()
            );
            let updatedGame = { ...game };
            if (game.coverUrl && game.coverUrl.includes('images.unsplash.com')) {
              if (matchingSample && matchingSample.coverUrl) {
                updatedGame.coverUrl = matchingSample.coverUrl;
              }
            }
            if (updatedGame.estimatedValue === undefined) {
              updatedGame.estimatedValue = matchingSample?.estimatedValue ?? estimateMarketValue(updatedGame.title, updatedGame.console, updatedGame.condition);
            }
            if (updatedGame.purchasePrice === undefined && matchingSample?.purchasePrice !== undefined) {
              updatedGame.purchasePrice = matchingSample.purchasePrice;
            }
            return updatedGame;
          });
        }
      }
    } catch (e) {
      console.error('Erreur chargement localStorage:', e);
    }
    return INITIAL_GAMES;
  });

  // Filters & sorting
  const [selectedConsole, setSelectedConsole] = useState<string | 'ALL'>('ALL');
  const [groupByConsole, setGroupByConsole] = useState<boolean>(true);
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    try {
      const savedMode = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
      if (savedMode === 'list' || savedMode === 'shelf' || savedMode === 'table') {
        return savedMode;
      }
      if (savedMode === 'grid') {
        return 'list';
      }
    } catch (e) {
      console.error('Erreur chargement viewMode:', e);
    }
    return 'list';
  });

  // Save viewMode
  useEffect(() => {
    try {
      localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode);
    } catch (e) {
      console.error('Erreur sauvegarde viewMode:', e);
    }
  }, [viewMode]);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalBarcodeMode, setAddModalBarcodeMode] = useState(false);
  const [addModalInitialBarcode, setAddModalInitialBarcode] = useState('');
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isUpdatePricesModalOpen, setIsUpdatePricesModalOpen] = useState(false);
  const [showCoteSourceBanner, setShowCoteSourceBanner] = useState(false);
  const [gameToDelete, setGameToDelete] = useState<Game | null>(null);
  const [deletedToast, setDeletedToast] = useState<{ game: Game; index: number } | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
    } catch (e) {
      console.error('Erreur sauvegarde localStorage:', e);
    }
  }, [games]);

  // Compute consoles with counts
  const consolesWithCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    games.forEach((g) => {
      counts[g.console] = (counts[g.console] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }));
  }, [games]);

  // Filtered & sorted games
  const filteredGames = useMemo(() => {
    let result = [...games];

    // Filter by console
    if (selectedConsole !== 'ALL') {
      result = result.filter((g) => g.console === selectedConsole);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const qDigits = q.replace(/\D/g, '');
      const qUnpadded = qDigits.replace(/^0+/, '');
      result = result.filter((g) => {
        const barcodeDigits = g.barcode ? g.barcode.replace(/\D/g, '') : '';
        const barcodeUnpadded = barcodeDigits.replace(/^0+/, '');
        const barcodeMatch = g.barcode && (
          g.barcode.toLowerCase().includes(q) ||
          (qDigits.length >= 6 && barcodeDigits.includes(qDigits)) ||
          (qUnpadded.length >= 6 && barcodeUnpadded.includes(qUnpadded))
        );

        return (
          g.title.toLowerCase().includes(q) ||
          g.console.toLowerCase().includes(q) ||
          barcodeMatch ||
          (g.genre && g.genre.toLowerCase().includes(q)) ||
          (g.publisher && g.publisher.toLowerCase().includes(q)) ||
          (g.developer && g.developer.toLowerCase().includes(q))
        );
      });
    }

    // Alphabetical sort (always enforced)
    result.sort((a, b) => {
      const comp = a.title.localeCompare(b.title, 'fr', { sensitivity: 'base' });
      return sortAsc ? comp : -comp;
    });

    return result;
  }, [games, selectedConsole, searchQuery, sortAsc]);

  // Total estimated value of entire collection
  const totalEstimatedValue = useMemo(() => {
    return games.reduce((acc, game) => {
      const val = game.estimatedValue !== undefined
        ? game.estimatedValue
        : estimateMarketValue(game.title, game.console, game.condition);
      const qty = game.quantity || 1;
      return acc + val * qty;
    }, 0);
  }, [games]);

  // Estimated value of current filtered view
  const filteredEstimatedValue = useMemo(() => {
    return filteredGames.reduce((acc, game) => {
      const val = game.estimatedValue !== undefined
        ? game.estimatedValue
        : estimateMarketValue(game.title, game.console, game.condition);
      const qty = game.quantity || 1;
      return acc + val * qty;
    }, 0);
  }, [filteredGames]);

  // Group games by console if groupByConsole is active and ALL consoles is selected
  const groupedByConsoleGames = useMemo(() => {
    if (!groupByConsole || selectedConsole !== 'ALL') {
      return null;
    }

    const groups: Record<string, Game[]> = {};
    filteredGames.forEach((game) => {
      if (!groups[game.console]) {
        groups[game.console] = [];
      }
      groups[game.console].push(game);
    });

    // Sort consoles alphabetically or by custom order
    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b, 'fr', { sensitivity: 'base' }))
      .map(([consoleName, consoleGames]) => {
        const consoleEstimatedValue = consoleGames.reduce(
          (sum, g) => sum + getGameEstimatedValue(g) * (g.quantity || 1),
          0
        );
        return {
          consoleName,
          games: consoleGames, // already sorted alphabetically
          estimatedValue: consoleEstimatedValue,
        };
      });
  }, [filteredGames, groupByConsole, selectedConsole]);

  // Handlers
  const handleOpenAddModal = (barcodeMode: boolean = false, initialBarcode: string = '') => {
    setAddModalBarcodeMode(barcodeMode);
    setAddModalInitialBarcode(initialBarcode);
    setIsAddModalOpen(true);
  };

  const handleAddGame = (newGameData: Omit<Game, 'id' | 'addedAt'>) => {
    const newGame: Game = {
      ...newGameData,
      id: 'game-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      addedAt: new Date().toISOString(),
    };
    setGames((prev) => [newGame, ...prev]);
  };

  const handleUpdateGame = (updated: Game) => {
    setGames((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
    setSelectedGame(updated);
  };

  const handleUpdateQuantity = (gameId: string, newQuantity: number) => {
    setGames((prev) =>
      prev.map((g) => (g.id === gameId ? { ...g, quantity: Math.max(1, newQuantity) } : g))
    );
  };

  const handleUpdateGamePrice = (gameId: string, newPrice: number) => {
    setGames((prev) =>
      prev.map((g) => (g.id === gameId ? { ...g, estimatedValue: Math.max(0, Math.round(newPrice)) } : g))
    );
    if (selectedGame && selectedGame.id === gameId) {
      setSelectedGame((prev) => (prev ? { ...prev, estimatedValue: Math.max(0, Math.round(newPrice)) } : null));
    }
  };

  const handleResetGamePrice = (gameId: string) => {
    setGames((prev) =>
      prev.map((g) => {
        if (g.id === gameId) {
          const { estimatedValue, ...rest } = g;
          return rest as Game;
        }
        return g;
      })
    );
  };

  const handleRecalculateAllPrices = () => {
    setGames((prev) =>
      prev.map((g) => ({
        ...g,
        estimatedValue: estimateMarketValue(g.title, g.console, g.condition),
      }))
    );
  };

  const handleApplyPercentage = (percent: number) => {
    setGames((prev) =>
      prev.map((g) => {
        const cur = getGameEstimatedValue(g);
        const newVal = Math.max(1, Math.round(cur * (1 + percent / 100)));
        return { ...g, estimatedValue: newVal };
      })
    );
  };

  const handleResetCustomPrices = () => {
    setGames((prev) =>
      prev.map((g) => {
        const { estimatedValue, ...rest } = g;
        return rest as Game;
      })
    );
  };

  // Request deletion with confirmation modal
  const handleRequestDelete = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const target = games.find((g) => g.id === id);
    if (target) {
      setGameToDelete(target);
    }
  };

  // Confirmed deletion execution
  const handleConfirmDelete = (game: Game) => {
    const idx = games.findIndex((g) => g.id === game.id);
    setGames((prev) => prev.filter((g) => g.id !== game.id));
    if (selectedGame?.id === game.id) {
      setSelectedGame(null);
      setIsDetailsOpen(false);
    }
    setGameToDelete(null);

    // Show undo toast notification
    setDeletedToast({ game, index: idx >= 0 ? idx : 0 });
  };

  // Direct deletion from GameDetailsModal inline confirmation
  const handleDeleteFromDetails = (id: string) => {
    const target = games.find((g) => g.id === id);
    if (target) {
      handleConfirmDelete(target);
    } else {
      setGames((prev) => prev.filter((g) => g.id !== id));
      if (selectedGame?.id === id) {
        setSelectedGame(null);
        setIsDetailsOpen(false);
      }
    }
  };

  // Undo delete
  const handleUndoDelete = () => {
    if (!deletedToast) return;
    const { game, index } = deletedToast;
    setGames((prev) => {
      if (prev.some((g) => g.id === game.id)) return prev;
      const copy = [...prev];
      copy.splice(Math.min(index, copy.length), 0, game);
      return copy;
    });
    setDeletedToast(null);
  };

  // Auto-dismiss undo toast after 6 seconds
  useEffect(() => {
    if (!deletedToast) return;
    const timer = setTimeout(() => {
      setDeletedToast(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [deletedToast]);

  const handleImportGames = (imported: Game[]) => {
    setGames(imported);
  };

  const handleResetSample = () => {
    setGames(INITIAL_GAMES);
  };

  const renderGamesView = (gamesList: Game[], isSubSection: boolean = false) => {
    switch (viewMode) {
      case 'list':
        return (
          <GameListView
            games={gamesList}
            onSelect={(g) => {
              setSelectedGame(g);
              setIsDetailsOpen(true);
            }}
            onDelete={handleRequestDelete}
          />
        );
      case 'table':
        return (
          <GameTableView
            games={gamesList}
            onSelect={(g) => {
              setSelectedGame(g);
              setIsDetailsOpen(true);
            }}
            onDelete={handleRequestDelete}
            onSelectConsole={(c) => setSelectedConsole(c)}
            isSubSection={isSubSection}
            onUpdateGamePrice={handleUpdateGamePrice}
            onRecalculateAllPrices={handleRecalculateAllPrices}
            onResetGamePrice={handleResetGamePrice}
          />
        );
      case 'shelf':
      default:
        return (
          <GameShelfView
            games={gamesList}
            onSelect={(g) => {
              setSelectedGame(g);
              setIsDetailsOpen(true);
            }}
            onDelete={handleRequestDelete}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Header / Navbar */}
      <Navbar
        totalGames={games.length}
        totalEstimatedValue={totalEstimatedValue}
        onOpenAddModal={handleOpenAddModal}
        onOpenStats={() => setIsStatsOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
      />

      {/* Main Content Area (Compact, mobile-ergonomic layout) */}
      <main
        style={{ backgroundColor: '#010000' }}
        className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6 space-y-3 sm:space-y-5 pb-24 md:pb-8"
      >
        {/* Filter, Consoles and Sorting Controls */}
        <ConsoleFilterBar
          consolesWithCounts={consolesWithCounts}
          selectedConsole={selectedConsole}
          onSelectConsole={setSelectedConsole}
          groupByConsole={groupByConsole}
          onToggleGroupByConsole={() => setGroupByConsole((prev) => !prev)}
          sortAsc={sortAsc}
          onToggleSort={() => setSortAsc((prev) => !prev)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          totalGames={games.length}
          filteredGamesCount={filteredGames.length}
          totalEstimatedValue={totalEstimatedValue}
          filteredEstimatedValue={filteredEstimatedValue}
          viewMode={viewMode}
          onChangeViewMode={setViewMode}
          onOpenBarcodeScanner={(code) => handleOpenAddModal(true, code || '')}
        />

        {/* Game List Display */}
        {filteredGames.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs space-y-4 my-8">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <Gamepad2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Aucun jeu trouvé</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                {searchQuery
                  ? `Aucun résultat correspondant à "${searchQuery}". Essayez un autre mot-clé ou réinitialisez les filtres.`
                  : selectedConsole !== 'ALL'
                  ? `Aucun jeu enregistré pour ${selectedConsole}. Ajoutez votre premier titre !`
                  : 'Votre collection est actuellement vide. Commencez par ajouter un jeu !'}
              </p>
            </div>
            {searchQuery.replace(/\D/g, '').length >= 6 && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleOpenAddModal(true, searchQuery.trim())}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition inline-flex items-center gap-2 shadow-sm cursor-pointer active:scale-95"
                >
                  <Barcode className="w-4 h-4" />
                  <span>Identifier le code-barres « {searchQuery.trim()} »</span>
                </button>
              </div>
            )}
            <div className="flex justify-center gap-2 pt-2">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
                >
                  Effacer la recherche
                </button>
              )}
              <button
                type="button"
                onClick={() => handleOpenAddModal(true)}
                className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Barcode className="w-4 h-4" />
                Scanner un code-barres
              </button>
            </div>
          </div>
        ) : groupedByConsoleGames ? (
          /* View 1: Grouped sections by Console (Alphabetical inside each console) */
          <div className="space-y-8">
            {/* When viewMode === 'table', show overall Cote Totale & Cote par Console summary at top */}
            {viewMode === 'table' && (
              <div
                id="tableau-grouped-cote-summary"
                className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 flex items-center justify-center shrink-0">
                      <Coins className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Cote Totale de la Collection
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200/60">
                          {filteredGames.length} jeux
                        </span>
                      </div>
                      <div className="text-xl sm:text-2xl font-black font-mono text-emerald-950 tracking-tight">
                        {filteredEstimatedValue.toLocaleString('fr-FR')} €
                      </div>
                    </div>
                  </div>

                  {/* Actions & Source Info Buttons */}
                  <div className="flex items-center flex-wrap gap-2 sm:justify-end">
                    <button
                      type="button"
                      onClick={() => setIsUpdatePricesModalOpen(true)}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                      title="Mettre à jour les cotes ou ajuster les prix de la collection"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Mettre à jour les prix</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowCoteSourceBanner((prev) => !prev)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                      title="Afficher les détails de la source PriceCharting"
                    >
                      <Info className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Source : PriceCharting</span>
                    </button>
                  </div>
                </div>

                {/* Source information details */}
                {showCoteSourceBanner && (
                  <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 text-xs text-emerald-950 space-y-1.5 animate-fadeIn">
                    <div className="flex items-center justify-between font-bold text-emerald-900">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        Sur quel site est établie la cote ?
                      </span>
                      <div className="flex items-center gap-3">
                        <a
                          href={COTE_SOURCE_INFO.primaryUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-emerald-700 hover:underline flex items-center gap-1 font-semibold"
                        >
                          PriceCharting.com <ExternalLink className="w-3 h-3" />
                        </a>
                        <a
                          href={COTE_SOURCE_INFO.secondaryUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-indigo-700 hover:underline flex items-center gap-1 font-semibold"
                        >
                          MisterGamePrice.com <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                    <p className="text-[11px] leading-relaxed text-emerald-900/90">
                      {COTE_SOURCE_INFO.description} Vous pouvez modifier individuellement le prix de chaque jeu avec l'icône ✏️ ou cliquer sur « Mettre à jour les prix » pour recalculer automatiquement l'ensemble.
                    </p>
                  </div>
                )}

                {/* Cote par console bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-indigo-500" />
                      Cote par console ({groupedByConsoleGames.length} consoles) :
                    </span>
                    <span className="text-[10px] text-slate-400">Cliquez pour voir une console</span>
                  </div>
                  <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {groupedByConsoleGames.map(({ consoleName, games: cGames, estimatedValue: cVal }) => {
                      const theme = getConsoleTheme(consoleName);
                      return (
                        <div
                          key={consoleName}
                          onClick={() => setSelectedConsole(consoleName)}
                          className="flex items-center justify-between p-2 rounded-xl border bg-slate-50/60 hover:bg-indigo-50/40 hover:border-indigo-200 transition-colors text-xs cursor-pointer"
                          title={`Cote ${consoleName}: ${cVal.toLocaleString('fr-FR')} €`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: theme.accentColor }}
                            />
                            <span className="font-bold text-slate-800 truncate text-[11px]">
                              {consoleName}
                            </span>
                          </div>
                          <div className="text-right shrink-0 ml-2">
                            <span className="font-black font-mono text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.5 rounded text-[11px]">
                              {cVal.toLocaleString('fr-FR')} €
                            </span>
                            <span className="block text-[9px] text-slate-400">
                              {cGames.length} jeu{cGames.length > 1 ? 'x' : ''}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {groupedByConsoleGames.map(({ consoleName, games: cGames, estimatedValue: cEstimatedValue }) => {
              const theme = getConsoleTheme(consoleName);
              return (
                <section
                  key={consoleName}
                  id={`section-console-${consoleName.toLowerCase().replace(/\s+/g, '-')}`}
                  className="space-y-3"
                >
                  {/* Console Section Header */}
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: theme.accentColor }}
                      />
                      <h3
                        style={consoleName.toLowerCase().replace(/\s+/g, '-') === 'playstation-3' ? { color: '#717b9d' } : undefined}
                        className="text-base sm:text-lg font-black text-slate-900 tracking-tight"
                      >
                        {consoleName}
                      </h3>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-700 font-mono">
                        {cGames.length} jeu{cGames.length > 1 ? 'x' : ''} (A-Z)
                      </span>
                      {viewMode === 'table' && (
                        <span
                          id={`badge-console-cote-${consoleName.toLowerCase().replace(/\s+/g, '-')}`}
                          className="inline-flex items-center gap-1 text-xs font-black font-mono text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md shadow-2xs"
                          title={`Cote cumulée de tous les jeux ${consoleName}`}
                        >
                          <Coins className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>Cote console : {cEstimatedValue.toLocaleString('fr-FR')} €</span>
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedConsole(consoleName)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                    >
                      Voir uniquement cette console →
                    </button>
                  </div>

                  {/* Games for this console according to selected viewMode */}
                  {renderGamesView(cGames, true)}
                </section>
              );
            })}
          </div>
        ) : (
          /* View 2: Flat List (Selected console or ungrouped, strictly alphabetical) */
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 pb-1">
              <span>
                {filteredGames.length} jeu{filteredGames.length > 1 ? 'x' : ''} classé
                {filteredGames.length > 1 ? 's' : ''} par ordre alphabétique ({sortAsc ? 'A à Z' : 'Z à A'})
                {selectedConsole !== 'ALL' && ` sur ${selectedConsole}`}
              </span>
            </div>

            {renderGamesView(filteredGames)}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        <p>Collection de Jeux Vidéo • Recherche code-barres physique, saisie manuelle & classement par console</p>
      </footer>

      {/* Modals */}
      <DeleteConfirmModal
        game={gameToDelete}
        isOpen={Boolean(gameToDelete)}
        onClose={() => setGameToDelete(null)}
        onConfirm={handleConfirmDelete}
      />

      <AddGameModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setAddModalInitialBarcode('');
        }}
        onAddGame={handleAddGame}
        initialBarcodeMode={addModalBarcodeMode}
        initialBarcode={addModalInitialBarcode}
        existingGames={games}
        onUpdateQuantity={handleUpdateQuantity}
        onUpdateGamePrice={handleUpdateGamePrice}
        onUpdateGame={handleUpdateGame}
        onOpenSettings={() => setIsGuideOpen(true)}
      />

      <GameDetailsModal
        game={selectedGame}
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedGame(null);
        }}
        onUpdateGame={handleUpdateGame}
        onDeleteGame={handleDeleteFromDetails}
      />

      <StatsDrawer
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        games={games}
        onImportGames={handleImportGames}
        onResetSample={handleResetSample}
      />

      <GuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onOpenScanner={() => {
          setIsGuideOpen(false);
          handleOpenAddModal(true);
        }}
        games={games}
        onImportGames={handleImportGames}
        onResetSample={handleResetSample}
      />

      <UpdatePricesModal
        isOpen={isUpdatePricesModalOpen}
        onClose={() => setIsUpdatePricesModalOpen(false)}
        games={games}
        onRecalculateAll={handleRecalculateAllPrices}
        onApplyPercentage={handleApplyPercentage}
        onUpdateSinglePrice={handleUpdateGamePrice}
        onResetCustomPrices={handleResetCustomPrices}
      />

      {/* Mobile Bottom Navigation Dock (Ergonomic thumb reach on smartphones) */}
      <MobileBottomNav
        totalGames={games.length}
        totalEstimatedValue={totalEstimatedValue}
        onOpenScanner={() => handleOpenAddModal(true)}
        onOpenAdd={() => handleOpenAddModal(false)}
        onOpenStats={() => setIsStatsOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
        onFocusSearch={() => {
          const input = document.getElementById('search-input');
          if (input) {
            input.focus();
            input.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }}
      />

      {/* Undo Toast notification */}
      {deletedToast && (
        <div
          id="toast-deleted-game"
          className="fixed bottom-20 md:bottom-6 left-3 right-3 md:left-auto md:right-6 z-50 flex items-center justify-between gap-3 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-800 animate-fadeIn text-sm max-w-md md:max-w-sm ml-auto"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 shrink-0">
              <Trash2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-xs truncate">« {deletedToast.game.title} » supprimé</p>
              <p className="text-[11px] text-slate-400">Jeu retiré de votre collection</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-700 shrink-0">
            <button
              id="btn-undo-delete"
              type="button"
              onClick={handleUndoDelete}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer transition py-1 px-2 rounded-lg hover:bg-white/10"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Annuler
            </button>
            <button
              type="button"
              onClick={() => setDeletedToast(null)}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
