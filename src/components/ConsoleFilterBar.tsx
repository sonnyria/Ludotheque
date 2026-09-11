import React from 'react';
import { Layers, ArrowDownAZ, ArrowUpZA, Search, List, Library, Coins, Barcode } from 'lucide-react';
import { getConsoleTheme } from '../utils/consoleThemes';
import { ViewMode } from '../types';
import { ConsoleListSelector } from './ConsoleListSelector';

interface ConsoleFilterBarProps {
  consolesWithCounts: { name: string; count: number }[];
  selectedConsole: string | 'ALL';
  onSelectConsole: (consoleName: string | 'ALL') => void;
  groupByConsole: boolean;
  onToggleGroupByConsole: () => void;
  sortAsc: boolean;
  onToggleSort: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalGames: number;
  filteredGamesCount?: number;
  totalEstimatedValue?: number;
  filteredEstimatedValue?: number;
  viewMode: ViewMode;
  onChangeViewMode: (mode: ViewMode) => void;
  onOpenBarcodeScanner?: (code?: string) => void;
}

export const ConsoleFilterBar: React.FC<ConsoleFilterBarProps> = ({
  consolesWithCounts,
  selectedConsole,
  onSelectConsole,
  groupByConsole,
  onToggleGroupByConsole,
  sortAsc,
  onToggleSort,
  searchQuery,
  onSearchChange,
  totalGames,
  filteredGamesCount,
  totalEstimatedValue = 0,
  filteredEstimatedValue = 0,
  viewMode,
  onChangeViewMode,
  onOpenBarcodeScanner,
}) => {
  return (
    <div id="filter-controls-bar" className="space-y-3 font-retro">
      {/* Top row: Search & View Options */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="search-input"
            type="text"
            placeholder="Rechercher jeu, console, genre, code..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-16 py-2 bg-[#0d1222] border-2 border-slate-700/90 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400 shadow-inner"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="text-slate-400 hover:text-amber-400 text-xs p-1 cursor-pointer"
                title="Effacer la recherche"
              >
                ✕
              </button>
            )}
            {onOpenBarcodeScanner && (
              <button
                type="button"
                onClick={() => onOpenBarcodeScanner(searchQuery)}
                className="p-1 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/60 rounded-lg transition cursor-pointer"
                title="Rechercher par code-barres ou scanner"
              >
                <Barcode className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Controls: Display mode selector & sort/group options */}
        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2.5">
          {/* View Mode Switcher Pill Group */}
          <div
            id="view-mode-selector"
            className="inline-flex items-center p-1 bg-[#0a0d18] rounded-xl border border-slate-800 shadow-inner"
          >
            <button
              id="view-mode-list"
              type="button"
              onClick={() => onChangeViewMode('list')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-pixel font-bold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Affichage en liste détaillée"
            >
              <List className="w-3.5 h-3.5" />
              <span>LISTE</span>
            </button>

            <button
              id="view-mode-shelf"
              type="button"
              onClick={() => onChangeViewMode('shelf')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-pixel font-bold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'shelf'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Affichage en vitrine / étagère de boîtiers"
            >
              <Library className="w-3.5 h-3.5" />
              <span>ÉTAGÈRE</span>
            </button>

            <button
              id="view-mode-table"
              type="button"
              onClick={() => onChangeViewMode('table')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-pixel font-bold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-emerald-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Affichage Cote Argus (valeurs estimées et cotes d'occasion)"
            >
              <Coins className="w-3.5 h-3.5 text-emerald-400" />
              <span>ARGUS</span>
            </button>
          </div>

          <div className="flex items-center gap-2 font-pixel">
            {/* Alphabetical sort toggle */}
            <button
              id="btn-toggle-sort"
              type="button"
              onClick={onToggleSort}
              className="px-3 py-1.5 bg-[#12182b] hover:bg-[#182138] border border-slate-700 text-slate-200 rounded-xl text-[10px] font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              title={sortAsc ? 'Tri alphabétique : A à Z' : 'Tri alphabétique : Z à A'}
            >
              {sortAsc ? (
                <>
                  <ArrowDownAZ className="w-4 h-4 text-amber-400" />
                  <span>A → Z</span>
                </>
              ) : (
                <>
                  <ArrowUpZA className="w-4 h-4 text-amber-400" />
                  <span>Z → A</span>
                </>
              )}
            </button>

            {/* Group by console toggle */}
            <button
              id="btn-toggle-group-console"
              type="button"
              onClick={onToggleGroupByConsole}
              className={`px-3 py-1.5 border rounded-xl text-[10px] font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer ${
                groupByConsole
                  ? 'bg-amber-400 text-slate-950 border-amber-400'
                  : 'bg-[#12182b] border-slate-700 text-slate-300 hover:bg-[#182138]'
              }`}
              title="Afficher en sections séparées par console"
            >
              <Layers className="w-4 h-4" />
              <span className="hidden xs:inline">GROUPER</span>
            </button>
          </div>
        </div>
      </div>

      {/* Console selection as a dedicated list selector & Cote indicators */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
        <div className="flex flex-wrap items-center gap-2">
          <ConsoleListSelector
            consolesWithCounts={consolesWithCounts}
            selectedConsole={selectedConsole}
            onSelectConsole={onSelectConsole}
            totalGames={totalGames}
          />
        </div>

        {/* Quick status message when filtered */}
        {selectedConsole !== 'ALL' && (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Filtre actif : <strong className="text-amber-300">{selectedConsole}</strong></span>
            <button
              type="button"
              onClick={() => onSelectConsole('ALL')}
              className="text-xs font-bold font-pixel text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
            >
              TOUT AFFICHER
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
