import React from 'react';
import { Gamepad2, Plus, Barcode, BarChart3, HelpCircle } from 'lucide-react';

interface NavbarProps {
  totalGames: number;
  totalEstimatedValue?: number;
  onOpenAddModal: (barcodeMode?: boolean) => void;
  onOpenStats: () => void;
  onOpenGuide: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  totalGames,
  onOpenAddModal,
  onOpenStats,
  onOpenGuide,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-700 via-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
            <Gamepad2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-lg font-black text-slate-900 tracking-tight truncate">
                Ludothèque
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                {totalGames} {totalGames > 1 ? 'jeux' : 'jeu'}
              </span>
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Guide button */}
          <button
            id="btn-open-guide"
            type="button"
            onClick={onOpenGuide}
            className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-semibold text-slate-700 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            title="Guide, explications & aide"
          >
            <HelpCircle className="w-4 h-4 text-indigo-600" />
            <span className="hidden sm:inline">Guide</span>
          </button>

          {/* Stats button */}
          <button
            id="btn-open-stats"
            type="button"
            onClick={onOpenStats}
            className="hidden xs:flex p-1.5 sm:px-3 sm:py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition items-center gap-1.5 cursor-pointer"
            title="Statistiques et sauvegarde"
          >
            <BarChart3 className="w-4 h-4 text-slate-600" />
            <span className="hidden md:inline">Statistiques</span>
          </button>

          {/* Scanner shortcut button */}
          <button
            id="btn-scan-barcode-nav"
            type="button"
            onClick={() => onOpenAddModal(true)}
            className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Barcode className="w-4 h-4 text-indigo-600" />
            <span className="hidden sm:inline">Scanner</span>
          </button>

          {/* Ajouter button */}
          <button
            id="btn-add-game-nav"
            type="button"
            onClick={() => onOpenAddModal(false)}
            className="px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Ajouter</span>
          </button>
        </div>
      </div>
    </header>
  );
};
