import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Gamepad2, X, Search, Filter } from 'lucide-react';
import { getConsoleTheme } from '../utils/consoleThemes';

interface ConsoleListSelectorProps {
  consolesWithCounts: { name: string; count: number }[];
  selectedConsole: string | 'ALL';
  onSelectConsole: (consoleName: string | 'ALL') => void;
  totalGames: number;
}

export const ConsoleListSelector: React.FC<ConsoleListSelectorProps> = ({
  consolesWithCounts,
  selectedConsole,
  onSelectConsole,
  totalGames,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close on outside click or Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      // Auto-focus search input if opened and has multiple consoles
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 50);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Selected console details
  const activeTheme = selectedConsole !== 'ALL' ? getConsoleTheme(selectedConsole) : null;
  const activeConsoleData = consolesWithCounts.find((c) => c.name === selectedConsole);
  const activeCount = selectedConsole === 'ALL' ? totalGames : activeConsoleData?.count || 0;

  // Filter consoles list inside dropdown
  const filteredConsoles = consolesWithCounts.filter((c) =>
    c.name.toLowerCase().includes(filterQuery.toLowerCase().trim())
  );

  return (
    <div className="relative w-full sm:w-auto" ref={dropdownRef}>
      <div className="flex items-center gap-2">
        {/* Label icon and text */}
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 shrink-0">
          <Gamepad2 className="w-4 h-4 text-indigo-600" />
          <span className="hidden xs:inline">Afficher par console :</span>
          <span className="xs:hidden">Console :</span>
        </div>

        {/* Dropdown Selector Button (List trigger) */}
        <div className="relative flex-1 sm:flex-initial min-w-[200px] max-w-full sm:max-w-xs">
          <button
            id="btn-console-list-selector"
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-xs ${
              isOpen
                ? 'bg-white border-indigo-500 ring-2 ring-indigo-500/20 text-indigo-950'
                : selectedConsole !== 'ALL'
                ? 'bg-white border-indigo-200 text-slate-900 hover:border-indigo-300'
                : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-slate-50/80'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0 truncate">
              {selectedConsole === 'ALL' ? (
                <div className="w-2.5 h-2.5 rounded-full bg-slate-900 shrink-0" />
              ) : (
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                  style={{ backgroundColor: activeTheme?.accentColor || '#6366f1' }}
                />
              )}
              <span className="truncate">
                {selectedConsole === 'ALL' ? 'Toutes les consoles' : selectedConsole}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 pl-1">
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                  selectedConsole !== 'ALL'
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {activeCount} {activeCount > 1 ? 'jeux' : 'jeu'}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                  isOpen ? 'rotate-180 text-indigo-600' : ''
                }`}
              />
            </div>
          </button>

          {/* Quick Reset Button if a specific console is selected */}
          {selectedConsole !== 'ALL' && (
            <button
              id="btn-reset-console-filter"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectConsole('ALL');
              }}
              title="Réinitialiser pour afficher toutes les consoles"
              className="absolute -right-7 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Dropdown Menu List */}
      {isOpen && (
        <div
          id="console-list-dropdown"
          role="listbox"
          aria-label="Liste des consoles"
          className="absolute left-0 sm:left-auto right-0 sm:right-auto sm:w-80 mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-fadeIn"
        >
          {/* Header */}
          <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-800">Sélectionner la console</p>
              <p className="text-[11px] text-slate-500">
                {consolesWithCounts.length} console{consolesWithCounts.length > 1 ? 's' : ''} répertoriée{consolesWithCounts.length > 1 ? 's' : ''}
              </p>
            </div>
            {selectedConsole !== 'ALL' && (
              <button
                type="button"
                onClick={() => {
                  onSelectConsole('ALL');
                  setIsOpen(false);
                }}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
              >
                Tout afficher
              </button>
            )}
          </div>

          {/* Search inside consoles if more than 4 consoles */}
          {consolesWithCounts.length > 4 && (
            <div className="p-2 border-b border-slate-100 bg-white">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Filtrer la liste des consoles..."
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                />
              </div>
            </div>
          )}

          {/* List of consoles */}
          <div className="p-1.5 max-h-72 overflow-y-auto space-y-0.5">
            {/* Option 0: ALL consoles */}
            {(!filterQuery || 'toutes les consoles'.includes(filterQuery.toLowerCase())) && (
              <button
                id="console-item-all"
                type="button"
                role="option"
                aria-selected={selectedConsole === 'ALL'}
                onClick={() => {
                  onSelectConsole('ALL');
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer min-h-[44px] ${
                  selectedConsole === 'ALL'
                    ? 'bg-indigo-50 text-indigo-950 font-bold'
                    : 'text-slate-700 hover:bg-slate-50 active:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-3 h-3 rounded-full bg-slate-900 shrink-0" />
                  <span className="truncate">Toutes les consoles</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-200/70 text-slate-700">
                    {totalGames}
                  </span>
                  {selectedConsole === 'ALL' && (
                    <Check className="w-4 h-4 text-indigo-600" />
                  )}
                </div>
              </button>
            )}

            {/* Separator */}
            <div className="h-px bg-slate-100 my-1" />

            {/* Individual Consoles */}
            {filteredConsoles.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                Aucune console ne correspond à « {filterQuery} »
              </div>
            ) : (
              filteredConsoles.map(({ name, count }) => {
                const isSelected = selectedConsole === name;
                const theme = getConsoleTheme(name);

                return (
                  <button
                    key={name}
                    id={`console-item-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onSelectConsole(name);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer min-h-[44px] ${
                      isSelected
                        ? 'bg-indigo-50 text-indigo-950 font-bold'
                        : 'text-slate-700 hover:bg-slate-50 active:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 truncate">
                      <div
                        className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: theme.accentColor }}
                      />
                      <span className="truncate">{name}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                          isSelected
                            ? 'bg-indigo-200/80 text-indigo-900 font-bold'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {count} {count > 1 ? 'jeux' : 'jeu'}
                      </span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-indigo-600" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
