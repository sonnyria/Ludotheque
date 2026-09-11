import React from 'react';
import { Gamepad2, Plus, Barcode, BarChart3, HelpCircle, Settings } from 'lucide-react';

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
    <header className="sticky top-0 z-30 bg-[#0f1422]/95 backdrop-blur-md border-b-2 border-indigo-900/60 shadow-lg shadow-black/40">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-15 sm:h-16 flex items-center justify-between gap-3">
        {/* Brand: RetroArgus 80's/90's */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-rose-600 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-rose-600/30 ring-2 ring-amber-400/40 shrink-0">
            <Gamepad2 className="w-5 h-5 text-amber-200" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-wider text-amber-400 font-pixel drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] truncate">
                RetroArgus
              </h1>
              <span className="px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-bold font-pixel bg-indigo-950 text-cyan-300 border border-cyan-500/40 shadow-xs">
                {totalGames} {totalGames > 1 ? 'JEUX' : 'JEU'}
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] font-retro text-slate-400 hidden sm:block tracking-wide">
              Argus & Gestionnaire de Collection 80's & 90's
            </p>
          </div>
        </div>

        {/* Header Actions: Retro Arcade Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Guide & Paramètres (Clé API) button */}
          <button
            id="btn-open-guide"
            type="button"
            onClick={onOpenGuide}
            className="btn-retro-arcade px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-bold text-slate-200 hover:text-amber-300 bg-[#1a2133] hover:bg-[#232c44] border-t border-x border-slate-700 border-b-slate-950 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm active:translate-y-0.5"
            title="Paramètres, Clé API & Guide"
          >
            <div className="relative flex items-center justify-center">
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <Settings className="w-2.5 h-2.5 text-cyan-400 absolute -bottom-1 -right-1 bg-[#1a2133] rounded-full ring-1 ring-slate-700" />
            </div>
            <span className="hidden sm:inline font-retro">Paramètres & Aide</span>
          </button>

          {/* Stats button */}
          <button
            id="btn-open-stats"
            type="button"
            onClick={onOpenStats}
            className="btn-retro-arcade hidden xs:flex p-1.5 sm:px-3 sm:py-2 text-xs font-bold text-slate-200 hover:text-cyan-300 bg-[#1a2133] hover:bg-[#232c44] border-t border-x border-slate-700 border-b-slate-950 rounded-xl transition items-center gap-1.5 cursor-pointer shadow-sm active:translate-y-0.5"
            title="Statistiques et sauvegarde"
          >
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            <span className="hidden md:inline font-retro">Statistiques</span>
          </button>

          {/* Scanner shortcut button */}
          <button
            id="btn-scan-barcode-nav"
            type="button"
            onClick={() => onOpenAddModal(true)}
            className="btn-retro-arcade px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-bold text-cyan-200 bg-cyan-950/80 hover:bg-cyan-900 border-t border-x border-cyan-500/50 border-b-cyan-950 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm active:translate-y-0.5"
          >
            <Barcode className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline font-retro">Scanner</span>
          </button>

          {/* Ajouter button */}
          <button
            id="btn-add-game-nav"
            type="button"
            onClick={() => onOpenAddModal(false)}
            className="btn-retro-arcade px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-bold text-slate-900 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 border-t border-x border-amber-300 border-b-amber-700 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20 active:translate-y-0.5"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span className="hidden sm:inline font-retro tracking-wide font-black">Ajouter</span>
          </button>
        </div>
      </div>
    </header>
  );
};
