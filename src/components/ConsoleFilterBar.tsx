import React from 'react';
import { Layers, ArrowDownAZ, ArrowUpZA, Search, List, Library, Coins } from 'lucide-react';
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
}) => {
  return (
    <div id="filter-controls-bar" className="space-y-3">
      {/* Top row: Search & View Options */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="search-input"
            type="text"
            placeholder="Rechercher par titre, console, genre, code-barres..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs p-1 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Controls: Display mode selector & sort/group options */}
        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2.5">
          {/* View Mode Switcher Pill Group */}
          <div
            id="view-mode-selector"
            className="inline-flex items-center p-1 bg-slate-200/80 rounded-xl border border-slate-200 shadow-inner"
          >
            <button
              id="view-mode-list"
              type="button"
              onClick={() => onChangeViewMode('list')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Affichage en liste détaillée"
            >
              <List className="w-3.5 h-3.5" />
              <span>Liste</span>
            </button>

            <button
              id="view-mode-shelf"
              type="button"
              onClick={() => onChangeViewMode('shelf')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'shelf'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Affichage en vitrine / étagère de boîtiers"
            >
              <Library className="w-3.5 h-3.5" />
              <span>Étagère</span>
            </button>

            <button
              id="view-mode-table"
              type="button"
              onClick={() => onChangeViewMode('table')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Affichage Cote Argus (valeurs estimées et cotes d'occasion)"
            >
              <Coins className="w-3.5 h-3.5 text-emerald-600" />
              <span>Cote Argus</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Alphabetical sort toggle */}
            <button
              id="btn-toggle-sort"
              type="button"
              onClick={onToggleSort}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              title={sortAsc ? 'Tri alphabétique : A à Z' : 'Tri alphabétique : Z à A'}
            >
              {sortAsc ? (
                <>
                  <ArrowDownAZ className="w-4 h-4 text-indigo-600" />
                  <span>A → Z</span>
                </>
              ) : (
                <>
                  <ArrowUpZA className="w-4 h-4 text-indigo-600" />
                  <span>Z → A</span>
                </>
              )}
            </button>

            {/* Group by console toggle */}
            <button
              id="btn-toggle-group-console"
              type="button"
              onClick={onToggleGroupByConsole}
              className={`px-3 py-1.5 border rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer ${
                groupByConsole
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
              title="Afficher en sections séparées par console"
            >
              <Layers className="w-4 h-4 text-indigo-600" />
              <span className="hidden xs:inline">Grouper</span>
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
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Affichage filtré sur <strong className="text-slate-800">{selectedConsole}</strong></span>
            <button
              type="button"
              onClick={() => onSelectConsole('ALL')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
            >
              Tout réafficher
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
