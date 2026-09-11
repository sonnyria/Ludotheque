import React from 'react';
import { Gamepad2, Barcode, Plus, BarChart3, HelpCircle, Settings, Search } from 'lucide-react';

interface MobileBottomNavProps {
  totalGames: number;
  totalEstimatedValue?: number;
  onOpenScanner: () => void;
  onOpenAdd: () => void;
  onOpenStats: () => void;
  onOpenGuide: () => void;
  onFocusSearch: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  totalGames,
  totalEstimatedValue,
  onOpenScanner,
  onOpenAdd,
  onOpenStats,
  onOpenGuide,
  onFocusSearch,
}) => {
  return (
    <nav
      id="mobile-bottom-nav"
      aria-label="Navigation mobile principale"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0b0e17]/95 backdrop-blur-lg border-t-2 border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.5)] pb-safe font-retro"
    >
      <div className="grid grid-cols-5 items-center h-16 max-w-lg mx-auto px-1">
        {/* 1: Collection / Search */}
        <button
          type="button"
          onClick={onFocusSearch}
          className="flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-amber-400 transition active:scale-95 py-1 cursor-pointer"
        >
          <Search className="w-5 h-5" />
          <span className="text-[9px] font-pixel font-bold">Chercher</span>
        </button>

        {/* 2: Stats */}
        <button
          type="button"
          onClick={onOpenStats}
          className="flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-amber-400 transition active:scale-95 py-1 cursor-pointer"
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-[9px] font-pixel font-bold">Stats</span>
        </button>

        {/* 3: Center Scanner button (Highlighted) */}
        <div className="flex items-center justify-center -mt-5">
          <button
            id="mobile-nav-btn-scan"
            type="button"
            onClick={onOpenScanner}
            className="w-13 h-13 rounded-full bg-amber-400 text-slate-950 flex flex-col items-center justify-center shadow-lg shadow-amber-400/30 border-4 border-[#0b0e17] active:scale-95 transition-transform cursor-pointer font-bold"
            title="Scanner un code-barres"
          >
            <Barcode className="w-6 h-6" />
          </button>
        </div>

        {/* 4: Ajouter */}
        <button
          id="mobile-nav-btn-add"
          type="button"
          onClick={onOpenAdd}
          className="flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-amber-400 transition active:scale-95 py-1 cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span className="text-[9px] font-pixel font-bold">Ajouter</span>
        </button>

        {/* 5: Guide / Paramètres */}
        <button
          id="mobile-nav-btn-guide"
          type="button"
          onClick={onOpenGuide}
          className="flex flex-col items-center justify-center gap-0.5 text-slate-400 hover:text-amber-400 transition active:scale-95 py-1 cursor-pointer"
          title="Paramètres, Clé API & Guide"
        >
          <div className="relative flex items-center justify-center">
            <HelpCircle className="w-5 h-5 text-amber-400" />
            <Settings className="w-3 h-3 text-slate-400 absolute -bottom-1 -right-1 bg-[#0b0e17] rounded-full ring-1 ring-slate-700" />
          </div>
          <span className="text-[9px] font-pixel font-bold">Config</span>
        </button>
      </div>
    </nav>
  );
};
