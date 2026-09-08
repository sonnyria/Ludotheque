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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div
        id="stats-drawer-modal"
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Statistiques & Sauvegarde</h2>
              <p className="text-xs text-slate-500">Vue d'ensemble et gestion des données</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Collection Market Value Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 text-white shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur text-emerald-200 flex items-center justify-center shrink-0 border border-white/20 shadow-xs">
                  <Coins className="w-6 h-6 text-emerald-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                      Cote globale estimée
                    </span>
                    <span className="text-[10px] font-bold bg-emerald-400/20 text-emerald-200 border border-emerald-300/30 px-1.5 py-0.2 rounded">
                      Argus occasion
                    </span>
                  </div>
                  <p className="text-3xl font-black font-mono tracking-tight text-white mt-0.5">
                    {totalEstimatedValue.toLocaleString('fr-FR')} €
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                <div className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur border border-white/10">
                  <span className="text-emerald-200/80 block text-[10px] font-medium">Moyenne par jeu</span>
                  <span className="font-mono font-bold text-white text-sm">~{avgGameValue} €</span>
                </div>
                {pricedUnitsCount > 0 && collectionMargin && (
                  <div className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur border border-white/10">
                    <span className="text-emerald-200/80 block text-[10px] font-medium">
                      Bilan ({pricedUnitsCount} suivis)
                    </span>
                    <div className="flex items-center gap-1 font-mono font-bold text-sm">
                      {collectionMargin.isPositive ? <TrendingUp className="w-3.5 h-3.5 text-emerald-300" /> : <TrendingDown className="w-3.5 h-3.5 text-rose-300" />}
                      <span className={collectionMargin.isPositive ? 'text-emerald-200' : 'text-rose-200'}>
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
                <div className="flex items-center gap-1.5 text-emerald-100/90 truncate mr-2">
                  <Trophy className="w-4 h-4 text-amber-300 shrink-0" />
                  <span className="truncate">
                    Plus haute cote : <strong className="text-white">{mostValuableGame.game.title}</strong> ({mostValuableGame.game.console})
                  </span>
                </div>
                <span className="font-mono font-extrabold text-amber-300 shrink-0 bg-white/10 px-2 py-0.5 rounded-md">
                  {mostValuableGame.value} €
                </span>
              </div>
            )}
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl text-center">
              <p className="text-xs text-indigo-700 font-medium">Titres</p>
              <p className="text-2xl font-black text-indigo-900 mt-0.5">{total}</p>
            </div>
            <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl text-center">
              <p className="text-xs text-blue-700 font-medium">En stock</p>
              <p className="text-2xl font-black text-blue-900 mt-0.5">{totalUnits}</p>
              <p className="text-[10px] text-blue-600">exemplaires</p>
            </div>
            <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl text-center">
              <p className="text-xs text-emerald-700 font-medium">Terminés</p>
              <p className="text-2xl font-black text-emerald-900 mt-0.5">{statusCounts.completed}</p>
              <p className="text-[10px] text-emerald-600">{completedRate}% du total</p>
            </div>
            <div className="p-3 bg-amber-50/60 border border-amber-100 rounded-xl text-center">
              <p className="text-xs text-amber-700 font-medium">Code-barres</p>
              <p className="text-2xl font-black text-amber-900 mt-0.5">{gamesWithBarcode}</p>
              <p className="text-[10px] text-amber-600">
                {total > 0 ? Math.round((gamesWithBarcode / total) * 100) : 0}% scannés
              </p>
            </div>
          </div>

          {/* Consoles breakdown */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              Répartition par Console
            </h3>
            <div className="space-y-2.5">
              {sortedConsoles.map(([cName, count]) => {
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                const theme = getConsoleTheme(cName);
                return (
                  <div key={cName} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span className="flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: theme.accentColor }}
                        />
                        {cName}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-emerald-700 font-bold">
                          {(consoleValues[cName] || 0).toLocaleString('fr-FR')} €
                        </span>
                        <span className="text-slate-400 font-normal">
                          • {count} jeu{count > 1 ? 'x' : ''} ({pct}%)
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
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
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              Statuts de Jeu
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(STATUS_LABELS).map(([k, info]) => {
                const count = statusCounts[k] || 0;
                return (
                  <div key={k} className={`p-2.5 rounded-xl border text-center ${info.color}`}>
                    <p className="text-xs font-semibold">{info.label}</p>
                    <p className="text-lg font-bold mt-0.5">{count}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Backup / Export / Import */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Sauvegarde & Exportation
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={exportToJson}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Exporter en JSON
              </button>
              <button
                type="button"
                onClick={exportToCsv}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Exporter en CSV (Excel)
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
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
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-left">
                  <div className="flex items-center gap-2 text-amber-800 text-xs font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Remplacer par les jeux d'exemple ?</span>
                  </div>
                  <p className="text-[11px] text-amber-700">
                    Vos jeux et modifications actuels seront écrasés par le catalogue d'exemple initial.
                  </p>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsConfirmingReset(false)}
                      className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-white border border-slate-200 rounded-lg cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsConfirmingReset(false);
                        onResetSample();
                        onClose();
                      }}
                      className="px-2.5 py-1 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg cursor-pointer"
                    >
                      Restaurer
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsConfirmingReset(true)}
                  className="text-xs text-slate-500 hover:text-slate-800 underline transition cursor-pointer flex items-center gap-1"
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
