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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="delete-confirm-modal"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
      >
        {/* Header strip */}
        <div className="p-4 bg-rose-50 border-b border-rose-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-rose-700">
            <div className="p-1.5 rounded-lg bg-rose-100 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold">Supprimer de la collection</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="flex items-start gap-3.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
            {/* Box Art Thumbnail */}
            <div className="w-14 aspect-[3/4] rounded-lg bg-slate-900 overflow-hidden shrink-0 border border-slate-300 shadow-sm flex items-center justify-center">
              {game.coverUrl ? (
                <img
                  src={game.coverUrl}
                  alt=""
                  className="w-full h-full object-contain p-0.5"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-[9px] text-slate-400 font-bold text-center px-1">
                  {game.console}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <span
                className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border mb-1 ${theme.bgBadge} ${theme.borderBadge}`}
              >
                {game.console}
              </span>
              <h4 className="text-sm font-bold text-slate-900 truncate leading-snug">
                {game.title}
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                État : <span className="font-semibold text-slate-700">{conditionLabel}</span>
                {game.releaseYear && <span> • {game.releaseYear}</span>}
              </p>
              {quantity > 1 && (
                <p className="text-xs font-bold text-indigo-700 flex items-center gap-1 mt-1">
                  <Boxes className="w-3.5 h-3.5" />
                  Stock actuel : {quantity} exemplaires
                </p>
              )}
            </div>
          </div>

          <div className="text-xs text-slate-600 space-y-1">
            <p>
              Êtes-vous certain de vouloir supprimer définitivement <strong className="text-slate-900">« {game.title} »</strong> de votre collection ?
            </p>
            {quantity > 1 && (
              <p className="text-rose-600 font-medium">
                Attention : la fiche complète ainsi que ses {quantity} exemplaires en stock seront retirés.
              </p>
            )}
            <p className="text-slate-400 text-[11px]">
              Vous pourrez annuler cette action immédiatement après la suppression si vous changez d'avis.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              id="btn-modal-confirm-delete"
              type="button"
              onClick={() => {
                onConfirm(game);
                onClose();
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Supprimer définitivement
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
