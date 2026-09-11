import React from 'react';
import { AlertTriangle, Trash2, X, Boxes } from 'lucide-react';
import { Game } from '../types';
import { getConsoleTheme, CONDITION_LABELS } from '../utils/consoleThemes';

interface DeleteConfirmModalProps {
  game: Game | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (game: Game) => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  game,
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !game) return null;

  const theme = getConsoleTheme(game.console);
  const conditionLabel = CONDITION_LABELS[game.condition]?.label || game.condition;
  const quantity = game.quantity || 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn font-retro"
      onClick={onClose}
    >
      <div
        id="delete-confirm-modal"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-[#0f1423] rounded-2xl shadow-2xl border-2 border-red-500/50 overflow-hidden"
      >
        {/* Header strip */}
        <div className="p-4 bg-red-950/40 border-b border-red-900/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-red-400">
            <div className="p-1.5 rounded-lg bg-red-900/50 text-red-300 border border-red-700/50">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold font-pixel tracking-wide text-red-400">SUPPRIMER DU CATALOGUE</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="flex items-start gap-3.5 p-3 rounded-xl bg-[#0b0e18] border border-slate-800">
            {/* Box Art Thumbnail */}
            <div className="w-14 aspect-[3/4] rounded-lg bg-black overflow-hidden shrink-0 border border-slate-700 shadow-sm flex items-center justify-center">
              {game.coverUrl ? (
                <img
                  src={game.coverUrl}
                  alt=""
                  className="w-full h-full object-contain p-0.5"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-[9px] text-slate-400 font-bold text-center px-1 font-pixel">
                  {game.console}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <span
                className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border mb-1 font-pixel ${theme.bgBadge} ${theme.borderBadge}`}
              >
                {game.console}
              </span>
              <h4 className="text-sm font-bold text-slate-100 truncate leading-snug">
                {game.title}
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                État : <span className="font-semibold text-amber-400">{conditionLabel}</span>
                {game.releaseYear && <span> • {game.releaseYear}</span>}
              </p>
              {quantity > 1 && (
                <p className="text-xs font-bold text-amber-300 flex items-center gap-1 mt-1 font-pixel">
                  <Boxes className="w-3.5 h-3.5" />
                  Stock : {quantity} ex.
                </p>
              )}
            </div>
          </div>

          <div className="text-xs text-slate-300 space-y-1">
            <p>
              Êtes-vous certain de vouloir supprimer définitivement <strong className="text-white">« {game.title} »</strong> de votre collection ?
            </p>
            {quantity > 1 && (
              <p className="text-red-400 font-medium font-pixel text-[11px]">
                ATTENTION : La fiche et ses {quantity} exemplaires seront supprimés.
              </p>
            )}
            <p className="text-slate-400 text-[11px]">
              Vous pourrez annuler cette action immédiatement après la suppression si besoin.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800 font-pixel">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer"
            >
              ANNULER
            </button>
            <button
              id="btn-modal-confirm-delete"
              type="button"
              onClick={() => {
                onConfirm(game);
                onClose();
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-sm border border-red-500 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              SUPPRIMER
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
