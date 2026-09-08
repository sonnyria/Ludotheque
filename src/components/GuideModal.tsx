import React from 'react';
import { X, BookOpen, Barcode, Boxes, Filter, Download, Sparkles, CheckCircle2, ChevronRight, HelpCircle } from 'lucide-react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenScanner: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose, onOpenScanner }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="guide-modal"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 ring-1 ring-white/10">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Guide & Fonctionnalités</h3>
              <p className="text-xs text-indigo-200">Comment utiliser votre ludothèque mobile</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-slate-700 text-xs sm:text-sm">
          {/* Section 1: Scan */}
          <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-indigo-600 text-white shrink-0 mt-0.5">
              <Barcode className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-indigo-950 text-sm">Scanner par code-barres</h4>
              <p className="text-slate-600 text-xs leading-relaxed">
                Pointez la caméra de votre mobile vers le code-barres EAN ou UPC au dos du boîtier de votre jeu. 
                L'application recherche automatiquement la fiche du jeu et pré-remplit le titre, la console, le studio et l'année.
              </p>
            </div>
          </div>

          {/* Section 2: Duplicate check & stock */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-slate-800 text-white shrink-0 mt-0.5">
              <Boxes className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-slate-900 text-sm">Détection de stock & doublons</h4>
              <p className="text-slate-600 text-xs leading-relaxed">
                Lors de la saisie d'un titre ou du scan d'un code-barres, l'application vérifie instantanément s'il est déjà présent dans votre collection. Vous pouvez alors augmenter la quantité en 1 clic pour tenir votre stock à jour.
              </p>
            </div>
          </div>

          {/* Section 3: Ergonomie mobile */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-600 text-white shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-slate-900 text-sm">Navigation fluide sur mobile</h4>
              <p className="text-slate-600 text-xs leading-relaxed">
                La liste optimisée permet de faire défiler vos jeux rapidement sans charger de lourdes vignettes.
                Touchez simplement un jeu pour ouvrir sa <strong>grande vignette officielle</strong> et sa fiche technique complète.
              </p>
            </div>
          </div>

          {/* Section 4: Filtres & Stats */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-600 text-white shrink-0 mt-0.5">
              <Filter className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-slate-900 text-sm">Filtres et sauvegardes</h4>
              <p className="text-slate-600 text-xs leading-relaxed">
                Sélectionnez la console souhaitée directement depuis la <strong>liste de sélection</strong>, regroupez par plateforme, triez de A à Z. Accédez aux statistiques et exportez votre collection en format CSV/JSON pour la sauvegarder sur votre téléphone.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition cursor-pointer"
          >
            Fermer
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenScanner();
            }}
            className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
          >
            <Barcode className="w-4 h-4" />
            Ouvrir le scanner
          </button>
        </div>
      </div>
    </div>
  );
};
