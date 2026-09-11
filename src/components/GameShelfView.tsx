import React from 'react';
import { Game } from '../types';
import { getConsoleTheme, STATUS_LABELS } from '../utils/consoleThemes';
import { Barcode, Star, Gamepad2, Trash2 } from 'lucide-react';
import { getSafeCoverUrl, handleImageError } from '../utils/imageUtils';

interface GameShelfViewProps {
  games: Game[];
  onSelect: (game: Game) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

export const GameShelfView: React.FC<GameShelfViewProps> = ({ games, onSelect, onDelete }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8">
        {games.map((game) => {
          const theme = getConsoleTheme(game.console);
          const statusInfo = STATUS_LABELS[game.status] || { label: game.status, color: 'bg-slate-100 text-slate-700' };

          return (
            <div
              key={game.id}
              id={`game-shelf-box-${game.id}`}
              onClick={() => onSelect(game)}
              className="group flex flex-col cursor-pointer"
            >
              {/* 3D-styled Game Box */}
              <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-slate-900 shadow-md group-hover:shadow-2xl group-hover:shadow-amber-500/10 group-hover:-translate-y-1.5 transition-all duration-300 border-2 border-slate-700/50 group-hover:border-amber-400/80 group-hover:ring-2 group-hover:ring-amber-400/20">
                {/* 3D Spine Highlight Illusion (left spine reflection) */}
                <div className="absolute inset-y-0 left-0 w-2.5 bg-gradient-to-r from-black/40 via-white/20 to-transparent z-10 pointer-events-none" />

                {/* Top Console Brand Strip */}
                <div
                  className="h-6 px-2 flex items-center justify-between text-[10px] font-bold tracking-wider text-white uppercase shadow-inner z-10 relative font-pixel"
                  style={{ backgroundColor: theme.accentColor }}
                >
                  <span className="truncate pr-1">{game.console}</span>
                  {game.barcode && (
                    <span title={`Code-barres: ${game.barcode}`} className="opacity-80">
                      <Barcode className="w-3 h-3" />
                    </span>
                  )}
                </div>

                {/* Box Cover Image */}
                <div className="relative w-full h-[calc(100%-1.5rem)] overflow-hidden bg-slate-950 flex items-center justify-center">
                  {game.coverUrl && (
                    <img
                      src={getSafeCoverUrl(game.coverUrl)}
                      alt=""
                      aria-hidden="true"
                      className="absolute inset-0 w-full h-full object-cover blur-md opacity-30 scale-125 pointer-events-none"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  {game.coverUrl ? (
                    <img
                      src={getSafeCoverUrl(game.coverUrl)}
                      alt={game.title}
                      className="relative z-10 w-full h-full object-contain p-1 group-hover:scale-105 transition-transform duration-300 drop-shadow-md"
                      referrerPolicy="no-referrer"
                      onError={(e) => handleImageError(e, game.coverUrl)}
                    />
                  ) : (
                    <div className="w-full h-full p-3 bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col items-center justify-center text-center">
                      <Gamepad2 className="w-8 h-8 text-slate-400 mb-1.5" />
                      <span className="text-xs font-bold text-slate-200 line-clamp-3 font-retro">
                        {game.title}
                      </span>
                    </div>
                  )}

                  {/* Status badge pill overlay & quick delete on hover */}
                  <div className="absolute top-1.5 right-1.5 z-10 flex items-center gap-1">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-pixel border backdrop-blur-md bg-slate-950/90 shadow-xs ${statusInfo.color}`}
                    >
                      {statusInfo.label}
                    </span>
                    <button
                      type="button"
                      title="Supprimer de la collection"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(game.id, e);
                      }}
                      className="p-1 rounded bg-black/80 hover:bg-rose-600 text-white/80 hover:text-white backdrop-blur shadow-xs opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Quantity badge if > 1 */}
                  {(game.quantity || 1) > 1 && (
                    <div className="absolute top-1.5 left-1.5 z-10">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold font-pixel bg-amber-400 text-black shadow-xs">
                        x{game.quantity}
                      </span>
                    </div>
                  )}

                  {/* Star rating overlay if present */}
                  {game.rating && game.rating > 0 && (
                    <div className="absolute bottom-1.5 left-1.5 z-10 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-xs text-amber-300 text-[9px] font-pixel">
                      <Star className="w-3 h-3 fill-amber-400" />
                      <span>{game.rating}</span>
                    </div>
                  )}

                  {/* Release year overlay */}
                  {game.releaseYear && (
                    <div className="absolute bottom-1.5 right-1.5 z-10 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-xs text-cyan-300 text-[9px] font-pixel">
                      {game.releaseYear}
                    </div>
                  )}
                </div>
              </div>

              {/* Shelf Base illusion (retro arcade wood / console rack plank) */}
              <div className="mt-1.5 h-2.5 bg-gradient-to-r from-[#2c1d11] via-[#4a331e] to-[#2c1d11] rounded-sm shadow-md border-t border-amber-900/40" />
              <div className="h-1 bg-black/50 blur-[1px] -mt-0.5 mx-1" />

              {/* Title & Console caption underneath the shelf */}
              <div className="mt-1 px-1">
                <p className="text-xs font-bold text-slate-100 truncate group-hover:text-amber-300 transition-colors font-retro tracking-wide" title={game.title}>
                  {game.title}
                </p>
                <p className="text-[10px] text-cyan-400/80 truncate mt-0.5 font-retro">
                  {game.genre || game.console}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
