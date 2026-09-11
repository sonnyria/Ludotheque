import React, { useRef, useState } from 'react';
import { X, BarChart3, Download, Upload, RefreshCw, Trophy, Gamepad2, Disc3, ShieldCheck, AlertTriangle, Coins, TrendingUp, TrendingDown, Sparkles } from 'lucide-react';
import { Game } from '../types';
import { getConsoleTheme, CONDITION_LABELS, STATUS_LABELS } from '../utils/consoleThemes';
import { estimateMarketValue, calculateValueMargin } from '../utils/marketPriceGuide';

interface StatsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  games: Game[];
  onImportGames: (imported: Game[]) => void;
  onResetSample: () => void;
}

export const StatsDrawer: React.FC<StatsDrawerProps> = ({
  isOpen,
  onClose,
  games,
  onImportGames,
  onResetSample,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);

  if (!isOpen) return null;

  // Compute stats
  const total = games.length;
  const totalUnits = games.reduce((acc, g) => acc + (g.quantity || 1), 0);
  const consoleCounts: Record<string, number> = {};
  const consoleValues: Record<string, number> = {};
  const statusCounts: Record<string, number> = { completed: 0, playing: 0, backlog: 0, wishlist: 0 };
  const conditionCounts: Record<string, number> = {};

  let totalEstimatedValue = 0;
  let totalPurchaseCost = 0;
  let pricedUnitsCount = 0;
  let pricedEstimatedValue = 0;
  let mostValuableGame: { game: Game; value: number } | null = null;

  games.forEach((g) => {
    const qty = g.quantity || 1;
    const estVal = g.estimatedValue !== undefined ? g.estimatedValue : estimateMarketValue(g.title, g.console, g.condition);
    const lineVal = estVal * qty;

    totalEstimatedValue += lineVal;
    consoleCounts[g.console] = (consoleCounts[g.console] || 0) + qty;
    consoleValues[g.console] = (consoleValues[g.console] || 0) + lineVal;

    if (g.purchasePrice !== undefined) {
      totalPurchaseCost += g.purchasePrice * qty;
      pricedUnitsCount += qty;
      pricedEstimatedValue += lineVal;
    }

    if (!mostValuableGame || estVal > mostValuableGame.value) {
      mostValuableGame = { game: g, value: estVal };
    }

    if (statusCounts[g.status] !== undefined) {
      statusCounts[g.status] += qty;
    }
    conditionCounts[g.condition] = (conditionCounts[g.condition] || 0) + qty;
  });

  const sortedConsoles = Object.entries(consoleCounts).sort((a, b) => b[1] - a[1]);
  const completedRate = totalUnits > 0 ? Math.round((statusCounts.completed / totalUnits) * 100) : 0;
  const gamesWithBarcode = games.filter((g) => !!g.barcode).length;
  const avgGameValue = totalUnits > 0 ? Math.round(totalEstimatedValue / totalUnits) : 0;
  const collectionMargin = pricedUnitsCount > 0 ? calculateValueMargin(pricedEstimatedValue, totalPurchaseCost) : null;

  const exportToJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(games, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `collection_jeux_video_${new Date().toISOString().slice(0, 10)}.json`);
    dlAnchor.click();
  };

  const exportToCsv = () => {
    const headers = ['Titre', 'Console', 'Quantite', 'Cote Occasion (€)', 'Prix Achat (€)', 'Code-barres', 'Annee', 'Editeur', 'Developpeur', 'Genre', 'Etat', 'Statut', 'Note'];
    const rows = games.map((g) => {
      const estVal = g.estimatedValue !== undefined ? g.estimatedValue : estimateMarketValue(g.title, g.console, g.condition);
      return [
        `"${(g.title || '').replace(/"/g, '""')}"`,
        `"${(g.console || '').replace(/"/g, '""')}"`,
        g.quantity || 1,
        estVal,
        g.purchasePrice !== undefined ? g.purchasePrice : '',
        `"${g.barcode || ''}"`,
        g.releaseYear || '',
        `"${(g.publisher || '').replace(/"/g, '""')}"`,
        `"${(g.developer || '').replace(/"/g, '""')}"`,
        `"${(g.genre || '').replace(/"/g, '""')}"`,
        `"${g.condition || ''}"`,
        `"${g.status || ''}"`,
        g.rating || '',
      ];
    });
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', encodeURI(csvContent));
    dlAnchor.setAttribute('download', `collection_jeux_video_${new Date().toISOString().slice(0, 10)}.csv`);
    dlAnchor.click();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json)) {
          onImportGames(json);
          alert(`${json.length} jeux importés avec succès !`);
          onClose();
        } else {
          alert('Format JSON invalide (un tableau de jeux est attendu).');
        }
      } catch (err) {
        alert('Erreur lors de la lecture du fichier JSON.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto font-retro">
      <div
        id="stats-drawer-modal"
        className="relative w-full max-w-xl bg-[#0f1423] rounded-2xl shadow-2xl border-2 border-slate-700 overflow-hidden my-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0b0e18]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-sm font-bold">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-pixel text-slate-100">STATISTIQUES & SAUVEGARDE</h2>
              <p className="text-xs text-slate-400">Vue d'ensemble et gestion des données</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Collection Market Value Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 border border-emerald-500/30 text-white shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-400/30 shadow-xs">
                  <Coins className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-pixel uppercase tracking-wider text-emerald-300">
                      COTE GLOBALE ARGUS
                    </span>
                    <span className="text-[10px] font-bold font-pixel bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 px-1.5 py-0.2 rounded">
                      ESTIMATION
                    </span>
                  </div>
                  <p className="text-3xl font-black font-mono tracking-tight text-white mt-0.5">
                    {totalEstimatedValue.toLocaleString('fr-FR')} €
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 text-xs font-retro">
                <div className="px-3 py-1.5 rounded-xl bg-black/40 backdrop-blur border border-white/10">
                  <span className="text-emerald-300/80 block text-[10px] font-medium">Moyenne par titre</span>
                  <span className="font-mono font-bold text-white text-sm">~{avgGameValue} €</span>
                </div>
                {pricedUnitsCount > 0 && collectionMargin && (
                  <div className="px-3 py-1.5 rounded-xl bg-black/40 backdrop-blur border border-white/10">
                    <span className="text-emerald-300/80 block text-[10px] font-medium">
                      Bilan ({pricedUnitsCount} suivis)
                    </span>
                    <div className="flex items-center gap-1 font-mono font-bold text-sm">
                      {collectionMargin.isPositive ? <TrendingUp className="w-3.5 h-3.5 text-emerald-300" /> : <TrendingDown className="w-3.5 h-3.5 text-rose-300" />}
                      <span className={collectionMargin.isPositive ? 'text-emerald-300' : 'text-rose-300'}>
                        {collectionMargin.isPositive ? '+' : ''}{collectionMargin.diff} € ({collectionMargin.percentage}%)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Most valuable game highlight */}
            {mostValuableGame && (
              <div className="pt-3 border-t border-white/15 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-emerald-200/90 truncate mr-2">
                  <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="truncate">
                    Plus haute cote : <strong className="text-amber-300">{mostValuableGame.game.title}</strong> ({mostValuableGame.game.console})
                  </span>
                </div>
                <span className="font-mono font-extrabold text-amber-300 shrink-0 bg-amber-400/20 px-2 py-0.5 rounded-md border border-amber-400/40">
                  {mostValuableGame.value} €
                </span>
              </div>
            )}
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-retro">
            <div className="p-3 bg-[#131a2c] border border-slate-700 rounded-xl text-center">
              <p className="text-xs text-amber-400 font-pixel font-bold">TITRES</p>
              <p className="text-2xl font-black text-slate-100 mt-0.5">{total}</p>
            </div>
            <div className="p-3 bg-[#131a2c] border border-slate-700 rounded-xl text-center">
              <p className="text-xs text-cyan-400 font-pixel font-bold">STOCK</p>
              <p className="text-2xl font-black text-slate-100 mt-0.5">{totalUnits}</p>
              <p className="text-[10px] text-slate-400">exemplaires</p>
            </div>
            <div className="p-3 bg-[#131a2c] border border-slate-700 rounded-xl text-center">
              <p className="text-xs text-emerald-400 font-pixel font-bold">TERMINÉS</p>
              <p className="text-2xl font-black text-slate-100 mt-0.5">{statusCounts.completed}</p>
              <p className="text-[10px] text-slate-400">{completedRate}% du total</p>
            </div>
            <div className="p-3 bg-[#131a2c] border border-slate-700 rounded-xl text-center">
              <p className="text-xs text-amber-300 font-pixel font-bold">CODES-BARRES</p>
              <p className="text-2xl font-black text-slate-100 mt-0.5">{gamesWithBarcode}</p>
              <p className="text-[10px] text-slate-400">
                {total > 0 ? Math.round((gamesWithBarcode / total) * 100) : 0}% scannés
              </p>
            </div>
          </div>

          {/* Consoles breakdown */}
          <div>
            <h3 className="text-xs font-bold font-pixel text-amber-400 uppercase tracking-wider mb-3">
              RÉPARTITION PAR CONSOLE
            </h3>
            <div className="space-y-2.5">
              {sortedConsoles.map(([cName, count]) => {
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                const theme = getConsoleTheme(cName);
                return (
                  <div key={cName} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-200">
                      <span className="flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: theme.accentColor }}
                        />
                        {cName}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-emerald-400 font-bold">
                          {(consoleValues[cName] || 0).toLocaleString('fr-FR')} €
                        </span>
                        <span className="text-slate-400 font-normal font-mono">
                          • {count} jeu{count > 1 ? 'x' : ''} ({pct}%)
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: theme.accentColor }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Status Breakdown */}
          <div>
            <h3 className="text-xs font-bold font-pixel text-amber-400 uppercase tracking-wider mb-3">
              STATUTS DE JEU
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(STATUS_LABELS).map(([k, info]) => {
                const count = statusCounts[k] || 0;
                return (
                  <div key={k} className="p-2.5 rounded-xl border border-slate-700 bg-[#0b0e18] text-center">
                    <p className="text-xs font-semibold text-slate-300">{info.label}</p>
                    <p className="text-lg font-bold font-pixel text-amber-400 mt-0.5">{count}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Backup / Export / Import */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <h3 className="text-xs font-bold font-pixel text-amber-400 uppercase tracking-wider">
              SAUVEGARDE & EXPORTATION
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={exportToJson}
                className="px-3.5 py-2 bg-[#141b2e] hover:bg-[#1a233b] text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                Exporter en JSON
              </button>
              <button
                type="button"
                onClick={exportToCsv}
                className="px-3.5 py-2 bg-[#141b2e] hover:bg-[#1a233b] text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                Exporter en CSV (Excel)
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 bg-[#141b2e] hover:bg-[#1a233b] text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-cyan-400" />
                Importer un JSON
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImportFile}
              />
            </div>
            <div className="pt-2">
              {isConfirmingReset ? (
                <div className="p-3 bg-amber-950/40 border border-amber-500/50 rounded-xl space-y-2 text-left">
                  <div className="flex items-center gap-2 text-amber-300 text-xs font-bold font-pixel">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Remplacer par les jeux d'exemple ?</span>
                  </div>
                  <p className="text-[11px] text-amber-200/90">
                    Vos jeux et modifications actuels seront écrasés par le catalogue d'exemple initial.
                  </p>
                  <div className="flex items-center justify-end gap-2 pt-1 font-pixel">
                    <button
                      type="button"
                      onClick={() => setIsConfirmingReset(false)}
                      className="px-2.5 py-1 text-xs font-semibold text-slate-300 hover:bg-slate-800 border border-slate-700 rounded-lg cursor-pointer"
                    >
                      ANNULER
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsConfirmingReset(false);
                        onResetSample();
                        onClose();
                      }}
                      className="px-2.5 py-1 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg cursor-pointer border border-amber-500"
                    >
                      RESTAURER
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsConfirmingReset(true)}
                  className="text-xs text-slate-400 hover:text-amber-400 underline transition cursor-pointer flex items-center gap-1 font-retro"
                >
                  <RefreshCw className="w-3 h-3" />
                  Restaurer les jeux d'exemple
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
