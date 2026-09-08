import React from 'react';
import { Game } from '../types';
import { getConsoleTheme, CONDITION_LABELS, STATUS_LABELS } from '../utils/consoleThemes';
import { Barcode, Calendar, Trash2, Star, Eye, Gamepad2, Boxes } from 'lucide-react';

interface GameListViewProps {
  games: Game[];
  onSelect: (game: Game) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

export const GameListView: React.FC<GameListViewProps> = ({ games, onSelect, onDelete }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
      {games.map((game) => {
        const theme = getConsoleTheme(game.console);
        const conditionInfo = CONDITION_LABELS[game.condition] || { label: game.condition };
        const statusInfo = STATUS_LABELS[game.status] || { label: game.status, color: 'bg-slate-100 text-slate-700' };

        return (
          <div
            key={game.id}
            id={`game-list-item-${game.id}`}
            onClick={() => onSelect(game)}
            className="group flex items-center justify-between p-2.5 sm:p-3.5 hover:bg-slate-50/90 active:bg-slate-100/90 transition-colors cursor-pointer gap-2.5 sm:gap-4"
          >
            {/* Left: Compact Thumbnail & Main Info */}
            <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
              {/* Discrete Compact Miniature Cover (no big vignette) */}
              <div className="w-11 h-14 sm:w-13 sm:h-16 rounded-lg bg-slate-900 shrink-0 overflow-hidden relative shadow-xs border border-slate-200/70 flex items-center justify-center">
                {game.coverUrl ? (
                  <img
                    src={game.coverUrl}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-400">
                    <Gamepad2 className="w-4 h-4" />
                  </div>
                )}
                {game.barcode && (
                  <div
                    title={`Code-barres: ${game.barcode}`}
                    className="absolute bottom-0.5 right-0.5 p-0.5 rounded bg-black/75 text-white text-[7px]"
                  >
                    <Barcode className="w-2.5 h-2.5" />
                  </div>
                )}
              </div>

              {/* Title, Console, Metadata */}
              <div className="min-w-0 flex-1">
                {/* Console, Status, Quantity badges */}
                <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                  <span
                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] font-bold border ${theme.bgBadge} ${theme.borderBadge}`}
                  >
                    {game.console}
                  </span>

                  {(game.quantity || 1) > 1 && (
                    <span className="px-1.5 py-0.5 bg-indigo-600 text-white rounded text-[10px] font-black flex items-center gap-0.5 shadow-xs">
                      <Boxes className="w-2.5 h-2.5" />
                      x{game.quantity}
                    </span>
                  )}

                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border hidden xs:inline-block ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                </div>

                {/* Title */}
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm leading-tight truncate group-hover:text-indigo-600 transition-colors">
                  {game.title}
                </h4>

                {/* Secondary Meta: condition, year, rating */}
                <div className="flex items-center gap-x-2 text-[11px] text-slate-500 mt-0.5">
                  <span className="text-slate-600 font-medium">
                    {conditionInfo.label}
                  </span>
                  {game.releaseYear && (
                    <>
                      <span>•</span>
                      <span>{game.releaseYear}</span>
                    </>
                  )}
                  {game.genre && (
                    <>
                      <span className="hidden sm:inline">•</span>
                      <span className="hidden sm:inline truncate max-w-[120px]">{game.genre}</span>
                    </>
                  )}
                  {game.rating && game.rating > 0 ? (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-0.5 text-amber-500 font-semibold">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {game.rating}
                      </span>
                    </>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                type="button"
                title="Supprimer ce jeu"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(game.id, e);
                }}
                className="w-8 h-8 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
