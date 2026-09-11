import React, { useState, useMemo } from 'react';
import { Game } from '../types';
import { getConsoleTheme, CONDITION_LABELS, STATUS_LABELS } from '../utils/consoleThemes';
import {
  Barcode,
  Star,
  Trash2,
  Eye,
  Gamepad2,
  Coins,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Layers,
  Sparkles,
  ExternalLink,
  Pencil,
  Check,
  X,
  RefreshCw,
  Info,
} from 'lucide-react';
import {
  getGameEstimatedValue,
  formatCurrency,
  getPriceChartingSearchUrl,
  COTE_SOURCE_INFO,
} from '../utils/marketPriceGuide';
import { UpdatePricesModal } from './UpdatePricesModal';

interface GameTableViewProps {
  games: Game[];
  onSelect: (game: Game) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onSelectConsole?: (consoleName: string) => void;
  isSubSection?: boolean;
  onUpdateGamePrice?: (gameId: string, newPrice: number) => void;
  onRecalculateAllPrices?: () => void;
  onResetGamePrice?: (gameId: string) => void;
}

type SortField = 'title' | 'console' | 'quantity' | 'releaseYear' | 'value' | 'rating';
type SortDirection = 'asc' | 'desc';

export const GameTableView: React.FC<GameTableViewProps> = ({
  games,
  onSelect,
  onDelete,
  onSelectConsole,
  isSubSection = false,
  onUpdateGamePrice,
  onRecalculateAllPrices,
  onResetGamePrice,
}) => {
  const [sortField, setSortField] = useState<SortField>('title');
  const [sortDir, setSortDir] = useState<SortDirection>('asc');
  const [editingPriceGameId, setEditingPriceGameId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<number>(0);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState<boolean>(false);
  const [showSourceBanner, setShowSourceBanner] = useState<boolean>(false);

  const handleSavePrice = (gameId: string) => {
    if (onUpdateGamePrice) {
      onUpdateGamePrice(gameId, Math.max(0, Math.round(tempPrice)));
    }
    setEditingPriceGameId(null);
  };

  const handleApplyPercentage = (percent: number) => {
    if (onUpdateGamePrice) {
      games.forEach((g) => {
        const cur = getGameEstimatedValue(g);
        const newVal = Math.max(1, Math.round(cur * (1 + percent / 100)));
        onUpdateGamePrice(g.id, newVal);
      });
    }
  };

  const handleResetCustomPrices = () => {
    if (onResetGamePrice) {
      games.forEach((g) => onResetGamePrice(g.id));
    }
  };

  // Compute total cote and breakdown per console for this table's dataset
  const { totalCote, totalCopies, consoleBreakdown } = useMemo(() => {
    let total = 0;
    let copies = 0;
    const consolesMap: Record<
      string,
      { count: number; copies: number; totalValue: number }
    > = {};

    games.forEach((g) => {
      const unitValue = getGameEstimatedValue(g);
      const qty = g.quantity || 1;
      const lineValue = unitValue * qty;

      total += lineValue;
      copies += qty;

      if (!consolesMap[g.console]) {
        consolesMap[g.console] = { count: 0, copies: 0, totalValue: 0 };
      }
      consolesMap[g.console].count += 1;
      consolesMap[g.console].copies += qty;
      consolesMap[g.console].totalValue += lineValue;
    });

    const breakdown = Object.entries(consolesMap)
      .map(([consoleName, stats]) => ({
        consoleName,
        count: stats.count,
        copies: stats.copies,
        totalValue: stats.totalValue,
        percent: total > 0 ? Math.round((stats.totalValue / total) * 100) : 0,
        theme: getConsoleTheme(consoleName),
      }))
      .sort((a, b) => b.totalValue - a.totalValue); // Sorted by highest cote

    return {
      totalCote: total,
      totalCopies: copies,
      consoleBreakdown: breakdown,
    };
  }, [games]);

  // Handle column sort toggle
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      // For value and rating, default to descending (highest first)
      setSortDir(field === 'value' || field === 'rating' ? 'desc' : 'asc');
    }
  };

  // Sorted games list
  const sortedGames = useMemo(() => {
    return [...games].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'title':
          comparison = a.title.localeCompare(b.title, 'fr', { sensitivity: 'base' });
          break;
        case 'console':
          comparison = a.console.localeCompare(b.console, 'fr', { sensitivity: 'base' });
          break;
        case 'quantity':
          comparison = (a.quantity || 1) - (b.quantity || 1);
          break;
        case 'releaseYear':
          comparison = (a.releaseYear || 0) - (b.releaseYear || 0);
          break;
        case 'value': {
          const valA = getGameEstimatedValue(a) * (a.quantity || 1);
          const valB = getGameEstimatedValue(b) * (b.quantity || 1);
          comparison = valA - valB;
          break;
        }
        case 'rating':
          comparison = (a.rating || 0) - (b.rating || 0);
          break;
        default:
          comparison = 0;
      }
      return sortDir === 'asc' ? comparison : -comparison;
    });
  }, [games, sortField, sortDir]);

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-500" />;
    }
    return sortDir === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-indigo-600 font-bold" />
    ) : (
      <ArrowDown className="w-3 h-3 text-indigo-600 font-bold" />
    );
  };

  return (
    <div className="space-y-3.5">
      {/* 1. Synthesis Header: Cote Totale & Cote par Console (shown only in Cote Argus) */}
      {!isSubSection && games.length > 0 && (
        <div
          id="cote-argus-summary"
          className="bg-[#121727]/90 rounded-2xl border-2 border-emerald-500/30 p-3.5 sm:p-4 shadow-xl shadow-black/40 space-y-3"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
            {/* Cote Totale Highlight */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold font-pixel text-slate-400 uppercase tracking-wider">
                    Cote Totale Argus
                  </span>
                  <span className="text-[9px] font-bold font-pixel text-emerald-300 bg-emerald-950/90 px-1.5 py-0.5 rounded border border-emerald-500/40">
                    {games.length} jeu{games.length > 1 ? 'x' : ''} • {totalCopies} ex.
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black font-pixel text-emerald-400 tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  {totalCote.toLocaleString('fr-FR')} €
                </div>
              </div>
            </div>

            {/* Actions & Source Indicators */}
            <div className="flex items-center flex-wrap gap-2 sm:justify-end">
              <button
                type="button"
                onClick={() => setIsUpdateModalOpen(true)}
                className="btn-retro-arcade px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 border-t border-x border-emerald-400 border-b-emerald-900 text-slate-950 rounded-xl text-xs font-bold font-retro flex items-center gap-1.5 shadow-sm transition cursor-pointer active:translate-y-0.5"
                title="Mettre à jour les cotes ou ajuster les prix"
              >
                <RefreshCw className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="font-black">Mettre à jour les prix</span>
              </button>

              <button
                type="button"
                onClick={() => setShowSourceBanner((prev) => !prev)}
                className="btn-retro-arcade px-2.5 py-1.5 bg-[#1a2133] hover:bg-[#232c44] border-t border-x border-slate-700 border-b-slate-950 text-slate-300 rounded-xl text-xs font-semibold font-retro flex items-center gap-1 transition cursor-pointer active:translate-y-0.5"
                title="Afficher les informations sur les sources PriceCharting & Mister Game Price"
              >
                <Info className="w-3.5 h-3.5 text-cyan-400" />
                <span>Source : PriceCharting</span>
              </button>
            </div>
          </div>

          {/* Expandable Source attribution & method banner */}
          {showSourceBanner && (
            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 text-xs text-emerald-950 space-y-1.5 animate-fadeIn">
              <div className="flex items-center justify-between font-bold text-emerald-900">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Origine et calcul de la cote
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

          {/* Cote par Console (Breakdown Cards / Pills) */}
          {consoleBreakdown.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                <span className="flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-indigo-500" />
                  Cote par console ({consoleBreakdown.length} console{consoleBreakdown.length > 1 ? 's' : ''})
                </span>
                <span className="text-[10px] text-slate-400">Classées par valeur décroissante</span>
              </div>

              <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {consoleBreakdown.map((item) => (
                  <div
                    key={item.consoleName}
                    onClick={() => onSelectConsole && onSelectConsole(item.consoleName)}
                    className={`flex items-center justify-between p-2 rounded-xl border border-slate-700/70 bg-[#161e31] hover:bg-[#1f2b45] hover:border-amber-400/50 transition-colors text-xs ${
                      onSelectConsole ? 'cursor-pointer' : ''
                    }`}
                    title={`${item.consoleName} : ${item.totalValue} € (${item.count} jeux, ${item.copies} exemplaires)`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.theme.accentColor }}
                      />
                      <span className="font-bold text-slate-200 truncate text-[11px] font-retro">
                        {item.consoleName}
                      </span>
                    </div>

                    <div className="text-right shrink-0 ml-2">
                      <span className="font-bold font-pixel text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-1.5 py-0.5 rounded text-[10px]">
                        {item.totalValue.toLocaleString('fr-FR')} €
                      </span>
                      <span className="block text-[9px] text-slate-400 font-retro">
                        {item.count} j. ({item.percent}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. Interactive Data Table with 80's / 90's styling */}
      <div className="bg-[#121727]/90 rounded-2xl border-2 border-slate-800 shadow-xl shadow-black/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#182238] border-b-2 border-slate-800 text-amber-300 font-bold font-pixel tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-3 w-12 text-center">Aperçu</th>

                {/* Titre (sortable) */}
                <th
                  onClick={() => handleSort('title')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-800/80 transition-colors group select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Titre</span>
                    {renderSortIndicator('title')}
                  </div>
                </th>

                {/* Console (sortable) */}
                <th
                  onClick={() => handleSort('console')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-800/80 transition-colors group select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Console</span>
                    {renderSortIndicator('console')}
                  </div>
                </th>

                {/* Stock / Qté (sortable) */}
                <th
                  onClick={() => handleSort('quantity')}
                  className="py-3 px-3 text-center cursor-pointer hover:bg-slate-800/80 transition-colors group select-none"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Stock</span>
                    {renderSortIndicator('quantity')}
                  </div>
                </th>

                {/* Année (sortable) */}
                <th
                  onClick={() => handleSort('releaseYear')}
                  className="py-3 px-3 text-center cursor-pointer hover:bg-slate-800/80 transition-colors group select-none"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Année</span>
                    {renderSortIndicator('releaseYear')}
                  </div>
                </th>

                <th className="py-3 px-4">Code-barres</th>
                <th className="py-3 px-4">Genre</th>
                <th className="py-3 px-3 text-center">État</th>

                {/* Cote Occasion (sortable, prominent) */}
                <th
                  onClick={() => handleSort('value')}
                  className="py-3 px-3 text-right cursor-pointer bg-emerald-950/70 hover:bg-emerald-900/70 text-emerald-300 border-x border-emerald-500/30 transition-colors group select-none"
                  title="Trier par valeur de la cote estimée"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Cote Occasion</span>
                    {renderSortIndicator('value')}
                  </div>
                </th>

                <th className="py-3 px-3 text-center">Statut</th>

                {/* Note (sortable) */}
                <th
                  onClick={() => handleSort('rating')}
                  className="py-3 px-3 text-center cursor-pointer hover:bg-slate-800/80 transition-colors group select-none"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Note</span>
                    {renderSortIndicator('rating')}
                  </div>
                </th>

                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {sortedGames.map((game) => {
                const theme = getConsoleTheme(game.console);
                const conditionInfo = CONDITION_LABELS[game.condition] || { label: game.condition };
                const statusInfo = STATUS_LABELS[game.status] || { label: game.status, color: 'bg-slate-100 text-slate-700' };
                const unitEstimatedValue = getGameEstimatedValue(game);
                const qty = game.quantity || 1;
                const lineTotalValue = unitEstimatedValue * qty;

                return (
                  <tr
                    key={game.id}
                    id={`game-row-${game.id}`}
                    onClick={() => onSelect(game)}
                    className="hover:bg-[#1a233b] transition-colors cursor-pointer"
                  >
                    {/* Miniature */}
                    <td className="py-2 px-3 text-center">
                      <div className="w-9 h-11 rounded bg-slate-950 mx-auto overflow-hidden border border-slate-700/80 shrink-0 flex items-center justify-center shadow-xs">
                        {game.coverUrl ? (
                          <img
                            src={game.coverUrl}
                            alt={game.title}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <Gamepad2 className="w-4 h-4 text-slate-500" />
                        )}
                      </div>
                    </td>

                    {/* Title & publisher */}
                    <td className="py-2 px-4 font-bold text-slate-100 max-w-xs font-retro">
                      <span className="hover:text-amber-300 transition-colors line-clamp-1 text-xs">
                        {game.title}
                      </span>
                      {game.publisher && (
                        <span className="block text-[10px] font-normal text-slate-400 truncate mt-0.5">
                          {game.publisher}
                        </span>
                      )}
                    </td>

                    {/* Console */}
                    <td className="py-2 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold font-pixel border ${theme.bgBadge} ${theme.borderBadge}`}
                      >
                        {game.console}
                      </span>
                    </td>

                    {/* Stock Quantity */}
                    <td className="py-2 px-3 text-center whitespace-nowrap">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-pixel ${
                          qty > 1
                            ? 'bg-amber-400 text-slate-950 shadow-xs'
                            : 'bg-slate-800 text-slate-300 border border-slate-700/60'
                        }`}
                      >
                        {qty}
                      </span>
                    </td>

                    {/* Year */}
                    <td className="py-2 px-3 text-center whitespace-nowrap font-pixel text-[10px] text-cyan-300">
                      {game.releaseYear || '-'}
                    </td>

                    {/* Barcode */}
                    <td className="py-2 px-4 whitespace-nowrap font-mono text-[10px]">
                      {game.barcode ? (
                        <span className="inline-flex items-center gap-1 text-slate-300 bg-[#182136] border border-slate-700/70 px-1.5 py-0.5 rounded">
                          <Barcode className="w-3 h-3 text-amber-400" />
                          {game.barcode}
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>

                    {/* Genre */}
                    <td className="py-2 px-4 whitespace-nowrap text-slate-400 font-retro text-xs">
                      {game.genre || '-'}
                    </td>

                    {/* Condition */}
                    <td className="py-2 px-3 text-center whitespace-nowrap">
                      <span className="px-1.5 py-0.5 rounded bg-[#182136] border border-slate-700/70 text-cyan-300 text-[10px] font-retro">
                        {conditionInfo.label}
                      </span>
                    </td>

                    {/* Cote Occasion (Game specific cote) with inline editing and PriceCharting lookup */}
                    <td
                      className="py-2 px-3 text-right whitespace-nowrap bg-emerald-950/40 border-x border-emerald-500/20"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {editingPriceGameId === game.id ? (
                        <div className="flex items-center justify-end gap-1">
                          <input
                            type="number"
                            min={0}
                            value={tempPrice}
                            onChange={(e) => setTempPrice(Math.max(0, parseInt(e.target.value) || 0))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSavePrice(game.id);
                              if (e.key === 'Escape') setEditingPriceGameId(null);
                            }}
                            autoFocus
                            className="w-16 px-1.5 py-0.5 bg-[#0a1810] border border-emerald-500 rounded font-pixel font-bold text-xs text-right text-emerald-300 shadow-inner focus:outline-none"
                          />
                          <span className="text-xs font-bold text-emerald-400 font-pixel">€</span>
                          <button
                            type="button"
                            onClick={() => handleSavePrice(game.id)}
                            className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-2xs"
                            title="Enregistrer ce prix"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingPriceGameId(null)}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                            title="Annuler"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          {onResetGamePrice && (
                            <button
                              type="button"
                              onClick={() => {
                                onResetGamePrice(game.id);
                                setEditingPriceGameId(null);
                              }}
                              className="px-1.5 py-0.5 text-[9px] bg-emerald-900/90 hover:bg-emerald-800 text-emerald-300 rounded font-pixel cursor-pointer border border-emerald-600/50"
                              title="Réinitialiser à la cote auto PriceCharting"
                            >
                              Auto
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-end group/price">
                          <div className="flex items-center justify-end gap-1">
                            <span
                              onClick={() => {
                                setEditingPriceGameId(game.id);
                                setTempPrice(unitEstimatedValue);
                              }}
                              className="font-bold font-pixel text-emerald-400 bg-[#0c2217] border border-emerald-500/50 hover:border-emerald-400 hover:bg-[#122e1f] px-2 py-0.5 rounded text-[10px] shadow-2xs cursor-pointer transition"
                              title="Cliquer pour modifier directement ce prix"
                            >
                              {unitEstimatedValue} €
                            </span>

                            {/* Quick edit button */}
                            {onUpdateGamePrice && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingPriceGameId(game.id);
                                  setTempPrice(unitEstimatedValue);
                                }}
                                className="p-1 rounded text-slate-400 hover:text-emerald-300 hover:bg-emerald-950/60 transition cursor-pointer"
                                title="Modifier manuellement la cote de ce jeu"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                            )}

                            {/* Direct link to PriceCharting */}
                            <a
                              href={getPriceChartingSearchUrl(game.title, game.console)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded text-slate-400 hover:text-emerald-300 hover:bg-emerald-950/60 transition cursor-pointer"
                              title={`Consulter la cote sur PriceCharting.com (${game.title})`}
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>

                          <div className="flex items-center gap-1 mt-0.5">
                            {game.estimatedValue !== undefined && (
                              <span
                                className="text-[8px] font-bold font-pixel text-cyan-300 bg-cyan-950/90 px-1 rounded border border-cyan-500/40"
                                title="Prix personnalisé manuellement"
                              >
                                FIXÉ
                              </span>
                            )}
                            {qty > 1 && (
                              <span className="text-[9px] text-emerald-400 font-pixel">
                                Total: {lineTotalValue} € ({qty} ex.)
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-2 px-3 text-center whitespace-nowrap">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-pixel border ${statusInfo.color}`}
                      >
                        {statusInfo.label}
                      </span>
                    </td>

                    {/* Rating */}
                    <td className="py-2 px-3 text-center whitespace-nowrap font-pixel text-[10px]">
                      {game.rating && game.rating > 0 ? (
                        <span className="inline-flex items-center gap-0.5 text-amber-400">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          {game.rating}
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-2 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          title="Détails du jeu"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelect(game);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-cyan-950/50 transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          title="Supprimer ce jeu"
                          onClick={(e) => onDelete(game.id, e)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/50 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* 3. Table Footer: Grand Total Row */}
            <tfoot className="bg-[#101524] border-t-2 border-slate-700 font-bold text-slate-200 font-pixel text-[10px]">
              <tr>
                <td colSpan={3} className="py-3 px-4 text-left">
                  <span className="uppercase tracking-wider text-amber-300">
                    TOTAL : {games.length} JEU{games.length > 1 ? 'X' : ''}
                  </span>
                </td>
                <td className="py-3 px-3 text-center">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                    {totalCopies} ex.
                  </span>
                </td>
                <td colSpan={4}></td>
                {/* Total Cote Col */}
                <td className="py-3 px-3 text-right bg-emerald-950/80 border-x border-emerald-500/30">
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] uppercase tracking-wider text-emerald-400 font-pixel">
                      COTE TOTALE
                    </span>
                    <span className="text-sm font-black font-pixel text-emerald-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                      {totalCote.toLocaleString('fr-FR')} €
                    </span>
                  </div>
                </td>
                <td colSpan={3}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Update Prices Modal */}
      <UpdatePricesModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        games={games}
        onRecalculateAll={() => onRecalculateAllPrices && onRecalculateAllPrices()}
        onApplyPercentage={handleApplyPercentage}
        onUpdateSinglePrice={(id, price) => onUpdateGamePrice && onUpdateGamePrice(id, price)}
        onResetCustomPrices={handleResetCustomPrices}
      />
    </div>
  );
};
