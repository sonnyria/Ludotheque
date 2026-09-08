import React from 'react';
import { Gamepad2, Barcode, Plus, BarChart3, HelpCircle, Search } from 'lucide-react';

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
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-safe"
    >
      <div className="grid grid-cols-5 items-center h-16 max-w-lg mx-auto px-1">
        {/* 1: Collection / Search */}
        <button
          type="button"
          onClick={onFocusSearch}
          className="flex flex-col items-center justify-center gap-1 text-slate-600 hover:text-indigo-600 transition active:scale-95 py-1 cursor-pointer"
        >
          <Search className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Chercher</span>
        </button>

        {/* 2: Stats */}
        <button
          type="button"
          onClick={onOpenStats}
          className="flex flex-col items-center justify-center gap-1 text-slate-600 hover:text-indigo-600 transition active:scale-95 py-1 cursor-pointer"
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Stats</span>
        </button>

        {/* 3: Center Scanner button (Highlighted) */}
        <div className="flex items-center justify-center -mt-5">
          <button
            id="mobile-nav-btn-scan"
            type="button"
            onClick={onOpenScanner}
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-indigo-700 via-indigo-600 to-indigo-500 text-white flex flex-col items-center justify-center shadow-lg shadow-indigo-600/35 border-4 border-white active:scale-95 transition-transform cursor-pointer"
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
          className="flex flex-col items-center justify-center gap-1 text-slate-600 hover:text-indigo-600 transition active:scale-95 py-1 cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Ajouter</span>
        </button>

        {/* 5: Guide / Aide */}
        <button
          id="mobile-nav-btn-guide"
          type="button"
          onClick={onOpenGuide}
          className="flex flex-col items-center justify-center gap-1 text-slate-600 hover:text-indigo-600 transition active:scale-95 py-1 cursor-pointer"
        >
          <HelpCircle className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Guide</span>
        </button>
      </div>
    </nav>
  );
};
