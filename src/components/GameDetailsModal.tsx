import React, { useState } from 'react';
import { X, Trash2, Edit3, Barcode, Calendar, Building, Code2, Tag, Star, Clock, Check, Sparkles, Boxes, Plus, Minus, AlertTriangle, Coins, TrendingUp, TrendingDown, RefreshCw, ExternalLink, Loader2 } from 'lucide-react';
import { Game, GameCondition, GameStatus } from '../types';
import { getConsoleTheme, CONDITION_LABELS, STATUS_LABELS } from '../utils/consoleThemes';
import { CONSOLE_LIST } from '../data/sampleGames';
import {
  estimateMarketValue,
  calculateValueMargin,
  getMisterGamePriceSearchUrl,
  getEbayFranceSoldSearchUrl,
  getLeboncoinSearchUrl,
  getVintedSearchUrl,
  getPriceChartingSearchUrl,
  COTE_SOURCE_INFO,
} from '../utils/marketPriceGuide';
import { getSafeCoverUrl, handleImageError } from '../utils/imageUtils';

interface GameDetailsModalProps {
  game: Game | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateGame: (game: Game) => void;
  onDeleteGame: (id: string) => void;
}

export const GameDetailsModal: React.FC<GameDetailsModalProps> = ({
  game,
  isOpen,
  onClose,
  onUpdateGame,
  onDeleteGame,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedConsole, setEditedConsole] = useState('');
  const [editedBarcode, setEditedBarcode] = useState('');
  const [editedYear, setEditedYear] = useState<number | ''>('');
  const [editedPublisher, setEditedPublisher] = useState('');
  const [editedDeveloper, setEditedDeveloper] = useState('');
  const [editedGenre, setEditedGenre] = useState('');
  const [editedCondition, setEditedCondition] = useState<GameCondition>('complet');
  const [editedStatus, setEditedStatus] = useState<GameStatus>('completed');
  const [editedRating, setEditedRating] = useState<number>(5);
  const [editedNotes, setEditedNotes] = useState('');
  const [editedCoverUrl, setEditedCoverUrl] = useState('');
  const [isSearchingCover, setIsSearchingCover] = useState(false);
  const [coverAlternatives, setCoverAlternatives] = useState<any[]>([]);
  const [editedQuantity, setEditedQuantity] = useState<number>(1);
  const [editedEstimatedValue, setEditedEstimatedValue] = useState<number | ''>('');
  const [editedPurchasePrice, setEditedPurchasePrice] = useState<number | ''>('');
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  if (!isOpen || !game) return null;

  const startEdit = () => {
    setEditedTitle(game.title);
    setEditedConsole(game.console);
    setEditedBarcode(game.barcode || '');
    setEditedYear(game.releaseYear || '');
    setEditedPublisher(game.publisher || '');
    setEditedDeveloper(game.developer || '');
    setEditedGenre(game.genre || '');
    setEditedCondition(game.condition);
    setEditedStatus(game.status);
    setEditedRating(game.rating || 5);
    setEditedNotes(game.notes || '');
    setEditedCoverUrl(game.coverUrl || '');
    setCoverAlternatives([]);
    setIsSearchingCover(false);
    setEditedQuantity(game.quantity || 1);
    setEditedEstimatedValue(
      game.estimatedValue !== undefined
        ? game.estimatedValue
        : estimateMarketValue(game.title, game.console, game.condition)
    );
    setEditedPurchasePrice(game.purchasePrice !== undefined ? game.purchasePrice : '');
    setIsEditing(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editedTitle.trim()) return;

    onUpdateGame({
      ...game,
      title: editedTitle.trim(),
      console: editedConsole,
      barcode: editedBarcode.trim() || undefined,
      releaseYear: typeof editedYear === 'number' ? editedYear : undefined,
      publisher: editedPublisher.trim() || undefined,
      developer: editedDeveloper.trim() || undefined,
      genre: editedGenre.trim() || undefined,
      condition: editedCondition,
      status: editedStatus,
      rating: editedRating,
      notes: editedNotes.trim() || undefined,
      coverUrl: editedCoverUrl.trim() || undefined,
      quantity: editedQuantity > 0 ? editedQuantity : 1,
      estimatedValue: typeof editedEstimatedValue === 'number' ? editedEstimatedValue : undefined,
      purchasePrice: typeof editedPurchasePrice === 'number' ? editedPurchasePrice : undefined,
    });
    setIsEditing(false);
  };

  const theme = getConsoleTheme(game.console);
  const conditionInfo = CONDITION_LABELS[game.condition] || { label: game.condition, desc: '' };
  const statusInfo = STATUS_LABELS[game.status] || { label: game.status, color: '' };
  const currentEstimatedValue = game.estimatedValue !== undefined
    ? game.estimatedValue
    : estimateMarketValue(game.title, game.console, game.condition);
  const margin = game.purchasePrice !== undefined
    ? calculateValueMargin(game.purchasePrice, currentEstimatedValue)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-hidden">
      <div
        id="game-details-modal"
        className="relative w-full h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:max-w-2xl bg-[#0f1423] text-slate-200 rounded-t-2xl sm:rounded-2xl shadow-2xl border-2 border-slate-700/80 overflow-y-auto flex flex-col font-retro"
      >
        {/* Header Cover Banner */}
        <div className="relative min-h-56 bg-gradient-to-r from-[#0a0d18] via-[#12182b] to-[#0a0d18] overflow-hidden flex items-center p-6 border-b-2 border-slate-800">
          {/* Ambient blurred backdrop */}
          {game.coverUrl && (
            <img
              src={game.coverUrl}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-25 scale-125 pointer-events-none"
              referrerPolicy="no-referrer"
            />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-[#0f1423] via-[#0f1423]/70 to-transparent" />

          {/* Close & Edit buttons */}
          <div className="absolute top-3.5 right-3.5 z-20 flex items-center gap-2">
            {!isEditing && (
              <button
                type="button"
                onClick={startEdit}
                className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-[10px] sm:text-xs font-bold font-pixel shadow-sm transition flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                MODIFIER
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer border border-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Showcase Box Art + Title */}
          <div className="relative z-10 flex items-center gap-3.5 sm:gap-5 w-full pr-12 sm:pr-16">
            {/* Box Art Thumbnail */}
            <div className="relative w-20 sm:w-28 aspect-[3/4] shrink-0 rounded-lg overflow-hidden bg-slate-950 shadow-2xl border-2 border-amber-400/70 flex items-center justify-center">
              {/* Left spine reflection */}
              <div className="absolute inset-y-0 left-0 w-2 bg-gradient-to-r from-white/30 via-white/10 to-transparent z-20 pointer-events-none" />
              {game.coverUrl ? (
                <img
                  src={getSafeCoverUrl(game.coverUrl)}
                  alt={`Jaquette de ${game.title}`}
                  className="w-full h-full object-contain p-1"
                  referrerPolicy="no-referrer"
                  onError={(e) => handleImageError(e, game.coverUrl)}
                />
              ) : (
                <span className="text-[10px] text-slate-400 font-pixel font-bold p-2 text-center">{game.console}</span>
              )}
            </div>

            {/* Title on banner */}
            <div className="min-w-0 flex-1">
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-pixel font-bold border backdrop-blur-md bg-slate-900/90 text-amber-300 border-amber-400/50 shadow-sm mb-1.5"
              >
                {game.console}
              </span>
              <h2 className="text-base sm:text-xl font-pixel font-bold text-slate-100 leading-tight drop-shadow-md line-clamp-3">
                {game.title}
              </h2>
              {game.publisher && (
                <p className="text-[11px] sm:text-xs text-slate-400 mt-1 truncate">
                  Édité par <span className="text-amber-300 font-medium">{game.publisher}</span>
                  {game.releaseYear ? ` (${game.releaseYear})` : ''}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Modal body */}
        <div className="p-6">
          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold font-pixel text-slate-300 mb-1">TITRE *</label>
                <input
                  type="text"
                  required
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#151c2e] border border-slate-700 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold font-pixel text-slate-300 mb-1">CONSOLE</label>
                  <select
                    value={editedConsole}
                    onChange={(e) => setEditedConsole(e.target.value)}
                    className="w-full px-3 py-2 bg-[#151c2e] border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    {CONSOLE_LIST.map((c) => (
                      <option key={c} value={c} className="bg-[#151c2e] text-slate-100">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold font-pixel text-slate-300 mb-1">ANNÉE</label>
                  <input
                    type="number"
                    value={editedYear}
                    onChange={(e) => setEditedYear(e.target.value ? parseInt(e.target.value, 10) : '')}
                    className="w-full px-3 py-2 bg-[#151c2e] border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold font-pixel text-slate-300 mb-1">CODE-BARRES</label>
                  <input
                    type="text"
                    value={editedBarcode}
                    onChange={(e) => setEditedBarcode(e.target.value)}
                    className="w-full px-3 py-2 bg-[#151c2e] border border-slate-700 rounded-xl text-sm font-mono text-cyan-300 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold font-pixel text-slate-300 mb-1">GENRE</label>
                  <input
                    type="text"
                    value={editedGenre}
                    onChange={(e) => setEditedGenre(e.target.value)}
                    className="w-full px-3 py-2 bg-[#151c2e] border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold font-pixel text-slate-300 mb-1">ÉDITEUR</label>
                  <input
                    type="text"
                    value={editedPublisher}
                    onChange={(e) => setEditedPublisher(e.target.value)}
                    className="w-full px-3 py-2 bg-[#151c2e] border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold font-pixel text-slate-300 mb-1">DÉVELOPPEUR</label>
                  <input
                    type="text"
                    value={editedDeveloper}
                    onChange={(e) => setEditedDeveloper(e.target.value)}
                    className="w-full px-3 py-2 bg-[#151c2e] border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold font-pixel text-slate-300 mb-1">ÉTAT PHYSIQUE</label>
                  <select
                    value={editedCondition}
                    onChange={(e) => setEditedCondition(e.target.value as GameCondition)}
                    className="w-full px-3 py-2 bg-[#151c2e] border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    {Object.entries(CONDITION_LABELS).map(([k, v]) => (
                      <option key={k} value={k} className="bg-[#151c2e] text-slate-100">
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold font-pixel text-slate-300 mb-1">STATUT</label>
                  <select
                    value={editedStatus}
                    onChange={(e) => setEditedStatus(e.target.value as GameStatus)}
                    className="w-full px-3 py-2 bg-[#151c2e] border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    {Object.entries(STATUS_LABELS).map(([k, v]) => (
                      <option key={k} value={k} className="bg-[#151c2e] text-slate-100">
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold font-pixel text-slate-300 mb-1">QUANTITÉ</label>
                  <div className="flex items-center bg-[#151c2e] border border-slate-700 rounded-xl overflow-hidden h-[38px]">
                    <button
                      type="button"
                      onClick={() => setEditedQuantity(Math.max(1, editedQuantity - 1))}
                      className="px-3 h-full text-slate-300 hover:bg-slate-800 font-bold cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      value={editedQuantity}
                      onChange={(e) => setEditedQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full text-center bg-transparent font-bold text-amber-300 text-sm focus:outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setEditedQuantity(editedQuantity + 1)}
                      className="px-3 h-full text-slate-300 hover:bg-slate-800 font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Cote d'occasion & Prix d'achat */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-[#0e2118] rounded-xl border border-emerald-500/40">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold font-pixel text-emerald-300 flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5 text-emerald-400" />
                      COTE ESTIMÉE (€)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const autoVal = estimateMarketValue(editedTitle, editedConsole, editedCondition);
                        setEditedEstimatedValue(autoVal);
                      }}
                      className="text-[10px] font-pixel font-bold text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
                    >
                      Calcul auto
                    </button>
                  </div>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={editedEstimatedValue}
                    onChange={(e) => setEditedEstimatedValue(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="ex: 45"
                    className="w-full px-3 py-2 bg-[#0c1813] border border-emerald-500/50 rounded-xl text-sm font-mono font-bold text-emerald-300 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold font-pixel text-slate-300 mb-1">
                    PRIX D'ACHAT PAYÉ (€) <span className="text-slate-400 font-normal font-retro">(optionnel)</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={editedPurchasePrice}
                    onChange={(e) => setEditedPurchasePrice(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="ex: 20"
                    className="w-full px-3 py-2 bg-[#151c2e] border border-slate-700 rounded-xl text-sm font-mono text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold font-pixel text-slate-300 mb-1">NOTE ({editedRating}/5)</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setEditedRating(star)}
                      className={`text-xl cursor-pointer ${
                        star <= editedRating ? 'text-amber-400' : 'text-slate-700'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold font-pixel text-slate-300 mb-1">NOTES PERSONNELLES</label>
                <textarea
                  rows={2}
                  value={editedNotes}
                  onChange={(e) => setEditedNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-[#151c2e] border border-slate-700 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400 resize-none"
                />
              </div>

              {/* Cover URL field & Search */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold font-pixel text-slate-300">
                    URL DE LA JAQUETTE
                  </label>
                  <div className="flex items-center gap-2.5">
                    {editedTitle.trim() && (
                      <a
                        href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(`${editedTitle} ${editedConsole} jaquette box art`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-sky-400 hover:text-sky-300 font-pixel flex items-center gap-1 cursor-pointer transition hover:underline"
                        title="Rechercher des images sur Google dans un nouvel onglet"
                      >
                        <ExternalLink className="w-3 h-3 text-sky-400" />
                        Google Images
                      </a>
                    )}
                    <button
                      type="button"
                      disabled={!editedTitle.trim() || isSearchingCover}
                      onClick={async () => {
                        if (!editedTitle.trim()) return;
                        setIsSearchingCover(true);
                        try {
                          const res = await fetch(`/api/games/find-cover?title=${encodeURIComponent(editedTitle)}&console=${encodeURIComponent(editedConsole)}`);
                          const d = await res.json();
                          if (d.coverUrl) setEditedCoverUrl(getSafeCoverUrl(d.coverUrl));
                          if (d.covers && Array.isArray(d.covers) && d.covers.length > 0) {
                            setCoverAlternatives(d.covers);
                          }
                        } catch {
                          // ignore
                        } finally {
                          setIsSearchingCover(false);
                        }
                      }}
                      className="text-[10px] text-amber-400 hover:text-amber-300 font-pixel font-bold flex items-center gap-1 cursor-pointer disabled:opacity-40"
                    >
                      {isSearchingCover ? (
                        <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      )}
                      {isSearchingCover ? 'Recherche...' : 'Trouver jaquette'}
                    </button>
                  </div>
                </div>
                <div className="flex gap-3 items-center">
                  <input
                    type="text"
                    value={editedCoverUrl}
                    onChange={(e) => setEditedCoverUrl(e.target.value)}
                    placeholder="URL de l'image de jaquette..."
                    className="flex-1 px-3 py-2 bg-[#151c2e] border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                  {editedCoverUrl && (
                    <div className="w-10 h-12 rounded bg-slate-950 border border-amber-400/60 overflow-hidden shrink-0 flex items-center justify-center">
                      <img
                        src={getSafeCoverUrl(editedCoverUrl)}
                        alt="Aperçu"
                        className="w-full h-full object-contain p-0.5"
                        referrerPolicy="no-referrer"
                        onError={(e) => handleImageError(e, editedCoverUrl)}
                      />
                    </div>
                  )}
                </div>

                {/* Alternatives */}
                {coverAlternatives.length > 1 && (
                  <div className="mt-2.5 p-2 bg-slate-900/80 rounded-xl border border-slate-800">
                    <div className="text-[10px] text-slate-400 font-pixel mb-1.5 flex items-center justify-between">
                      <span className="text-amber-400/90 font-bold">Autres jaquettes trouvées :</span>
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                      {coverAlternatives.slice(0, 8).map((alt, idx) => {
                        const isSelected = editedCoverUrl === alt.url || editedCoverUrl === alt.rawUrl;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setEditedCoverUrl(alt.url || alt.rawUrl)}
                            className={`w-10 h-14 rounded-lg border overflow-hidden shrink-0 transition cursor-pointer hover:scale-105 bg-slate-950 flex items-center justify-center p-0.5 ${
                              isSelected ? 'border-amber-400 ring-2 ring-amber-400/80' : 'border-slate-700 opacity-60 hover:opacity-100'
                            }`}
                            title={alt.title || 'Choisir cette jaquette'}
                          >
                            <img
                              src={alt.thumb || alt.url}
                              alt=""
                              className="w-full h-full object-contain"
                              referrerPolicy="no-referrer"
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-xs font-bold font-pixel text-slate-400 hover:text-slate-200 rounded-xl cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 text-xs font-bold font-pixel text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  ENREGISTRER
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Cote de l'occasion & Argus Card */}
              <div className="p-4 rounded-2xl bg-[#0a1c14] border border-emerald-500/40 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center shadow-xs shrink-0 font-bold border border-emerald-400">
                      <Coins className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-pixel uppercase tracking-wider text-emerald-300">
                          COTE OCCASION
                        </span>
                        <span className="text-[9px] font-pixel font-semibold text-emerald-300 bg-emerald-950 border border-emerald-500/60 px-1.5 py-0.2 rounded">
                          ARGUS
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-2xl font-black font-mono text-emerald-400">
                          {currentEstimatedValue} €
                        </span>
                        <span className="text-xs text-slate-400 font-medium font-retro">
                          (état {conditionInfo.label.toLowerCase()})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Purchase price and profit margin */}
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end font-retro">
                    {game.purchasePrice !== undefined ? (
                      <div className="flex items-center gap-2.5 bg-[#131c2e] border border-slate-700 rounded-xl px-3 py-1.5 shadow-2xs">
                        <div className="text-left">
                          <p className="text-[10px] text-slate-400 font-medium leading-tight">Prix payé</p>
                          <p className="text-xs font-mono font-bold text-slate-200">{game.purchasePrice} €</p>
                        </div>
                        {margin && (
                          <div
                            className={`pl-2 border-l border-slate-700 flex items-center gap-1 text-xs font-mono font-extrabold ${
                              margin.isPositive ? 'text-emerald-400' : margin.diff < 0 ? 'text-rose-400' : 'text-slate-400'
                            }`}
                            title={margin.isPositive ? 'Plus-value latente' : margin.diff < 0 ? 'Moins-value latente' : 'Neutre'}
                          >
                            {margin.isPositive ? <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> : <TrendingDown className="w-3.5 h-3.5 text-rose-400" />}
                            <span>{margin.isPositive ? '+' : ''}{margin.diff} € ({margin.percentage}%)</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={startEdit}
                        className="text-xs text-emerald-300 hover:text-emerald-200 bg-emerald-950/60 border border-emerald-500/40 px-2.5 py-1.5 rounded-xl font-semibold shadow-2xs flex items-center gap-1 transition cursor-pointer"
                      >
                        + Renseigner le prix d'achat
                      </button>
                    )}
                  </div>
                </div>

                {/* Sources & Liens de vérification du marché français & européen */}
                <div className="pt-2.5 border-t border-emerald-500/20 space-y-2">
                  <div className="flex items-center justify-between gap-2 text-[11px] text-emerald-300">
                    <span className="font-semibold flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5 text-emerald-400" />
                      Argus de référence : <strong className="text-emerald-300 font-bold">Mister Game Price</strong> & <strong className="text-emerald-300 font-bold">eBay France</strong> (Euros)
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1 font-pixel text-[9px]">
                    <a
                      href={getMisterGamePriceSearchUrl(game.title, game.console)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-cyan-300 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 px-2.5 py-1 rounded-lg transition"
                      title="Consulter la fiche argus et les cotes françaises sur Mister Game Price"
                    >
                      <span>MISTER GAME PRICE (FR)</span>
                      <ExternalLink className="w-3 h-3 text-cyan-400" />
                    </a>

                    <a
                      href={getEbayFranceSoldSearchUrl(game.title, game.console, game.condition)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-emerald-300 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 px-2.5 py-1 rounded-lg transition"
                      title="Voir les réelles transactions conclues et payées en Euros sur eBay France"
                    >
                      <span>EBAY.FR (VENTES RÉUSSIES €)</span>
                      <ExternalLink className="w-3 h-3 text-emerald-400" />
                    </a>

                    <a
                      href={getLeboncoinSearchUrl(game.title, game.console)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-amber-300 bg-amber-950/80 hover:bg-amber-900 border border-amber-500/40 px-2.5 py-1 rounded-lg transition"
                      title="Rechercher sur LeBonCoin"
                    >
                      <span>LEBONCOIN</span>
                      <ExternalLink className="w-3 h-3 text-amber-400" />
                    </a>

                    <a
                      href={getVintedSearchUrl(game.title, game.console)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-teal-300 bg-teal-950/80 hover:bg-teal-900 border border-teal-500/40 px-2.5 py-1 rounded-lg transition"
                      title="Rechercher sur Vinted"
                    >
                      <span>VINTED</span>
                      <ExternalLink className="w-3 h-3 text-teal-400" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Metadata grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-[#13192a] rounded-2xl border border-slate-700/80">
                <div>
                  <span className="text-[10px] font-pixel text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                    <Tag className="w-3.5 h-3.5 text-amber-400" /> ÉTAT
                  </span>
                  <p className="text-sm font-bold text-slate-100">{conditionInfo.label}</p>
                </div>

                <div>
                  <span className="text-[10px] font-pixel text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" /> STATUT
                  </span>
                  <span className="inline-block px-2 py-0.5 rounded text-xs font-bold border border-slate-600 bg-slate-800 text-slate-200">
                    {statusInfo.label}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-pixel text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                    <Star className="w-3.5 h-3.5 text-amber-400" /> NOTE
                  </span>
                  <p className="text-sm font-bold text-amber-400 font-pixel">
                    {game.rating ? `${game.rating} / 5 ★` : 'Non noté'}
                  </p>
                </div>

                {game.releaseYear && (
                  <div>
                    <span className="text-[10px] font-pixel text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" /> ANNÉE
                    </span>
                    <p className="text-sm font-bold text-slate-100 font-mono">{game.releaseYear}</p>
                  </div>
                )}

                {game.genre && (
                  <div>
                    <span className="text-[10px] font-pixel text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                      GENRE
                    </span>
                    <p className="text-sm font-bold text-slate-100">{game.genre}</p>
                  </div>
                )}

                {game.publisher && (
                  <div>
                    <span className="text-[10px] font-pixel text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                      <Building className="w-3.5 h-3.5 text-slate-400" /> ÉDITEUR
                    </span>
                    <p className="text-sm font-bold text-slate-100">{game.publisher}</p>
                  </div>
                )}

                <div>
                  <span className="text-[10px] font-pixel text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                    <Boxes className="w-3.5 h-3.5 text-amber-400" /> STOCK
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold font-mono text-amber-300 bg-amber-950/80 border border-amber-500/40 px-2 py-0.5 rounded-lg shadow-2xs">
                      {game.quantity || 1} ex.
                    </span>
                    <div className="inline-flex items-center bg-[#0c101c] border border-slate-700 rounded-lg shadow-2xs overflow-hidden">
                      <button
                        type="button"
                        title="Diminuer la quantité"
                        onClick={() => onUpdateGame({ ...game, quantity: Math.max(1, (game.quantity || 1) - 1) })}
                        className="px-2 py-0.5 text-xs text-slate-300 hover:bg-slate-800 font-bold cursor-pointer"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        title="Ajouter un exemplaire au stock"
                        onClick={() => onUpdateGame({ ...game, quantity: (game.quantity || 1) + 1 })}
                        className="px-2 py-0.5 text-xs text-slate-300 hover:bg-slate-800 font-bold cursor-pointer border-l border-slate-700"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Barcode section */}
              {game.barcode && (
                <div className="p-3.5 bg-[#0b0e17] rounded-xl text-white flex items-center justify-between border border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-800 text-cyan-400">
                      <Barcode className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-pixel uppercase tracking-wider text-slate-400">CODE-BARRES EAN / UPC</p>
                      <p className="font-mono text-base font-bold tracking-widest text-cyan-300">{game.barcode}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-pixel text-emerald-400 font-medium px-2 py-0.5 bg-emerald-950 border border-emerald-500/40 rounded">
                    IDENTIFIÉ
                  </span>
                </div>
              )}

              {/* Notes or Description */}
              {game.notes && (
                <div>
                  <h4 className="text-[10px] font-pixel font-bold text-slate-300 uppercase tracking-wider mb-2">
                    NOTES DU COLLECTIONNEUR
                  </h4>
                  <div className="p-3.5 bg-[#14182b] rounded-xl border border-slate-700 text-slate-200 text-sm leading-relaxed">
                    {game.notes}
                  </div>
                </div>
              )}

              {/* Added date and delete footer */}
              {isConfirmingDelete ? (
                <div className="pt-4 border-t border-rose-900/60">
                  <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-600 space-y-3">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold font-pixel text-rose-200">
                          SUPPRIMER « {game.title} » ({game.console}) ?
                        </p>
                        <p className="text-[11px] text-rose-300 mt-0.5">
                          {(game.quantity || 1) > 1
                            ? `Ce jeu compte actuellement ${game.quantity} exemplaires en stock. Tous les exemplaires seront retirés de votre collection.`
                            : 'Ce jeu sera retiré de votre collection.'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsConfirmingDelete(false)}
                        className="px-3 py-1.5 rounded-lg text-xs font-pixel font-semibold text-slate-300 hover:bg-slate-800 border border-slate-600 transition cursor-pointer"
                      >
                        Annuler
                      </button>
                      <button
                        id="btn-confirm-delete-game"
                        type="button"
                        onClick={() => {
                          setIsConfirmingDelete(false);
                          onDeleteGame(game.id);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-pixel font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Confirmer la suppression
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>Ajouté le {new Date(game.addedAt).toLocaleDateString('fr-FR')}</span>
                  <button
                    id="btn-delete-game"
                    type="button"
                    onClick={() => setIsConfirmingDelete(true)}
                    className="text-rose-400 hover:text-rose-300 font-medium font-pixel text-[10px] flex items-center gap-1.5 cursor-pointer px-2.5 py-1 rounded-lg hover:bg-rose-950/60 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Supprimer de la collection
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
