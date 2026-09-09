import React, { useState } from 'react';
import { X, Trash2, Edit3, Barcode, Calendar, Building, Code2, Tag, Star, Clock, Check, Sparkles, Boxes, Plus, Minus, AlertTriangle, Coins, TrendingUp, TrendingDown, RefreshCw, ExternalLink } from 'lucide-react';
import { Game, GameCondition, GameStatus } from '../types';
import { getConsoleTheme, CONDITION_LABELS, STATUS_LABELS } from '../utils/consoleThemes';
import { CONSOLE_LIST } from '../data/sampleGames';
import { estimateMarketValue, calculateValueMargin, getPriceChartingSearchUrl, COTE_SOURCE_INFO } from '../utils/marketPriceGuide';
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/70 backdrop-blur-sm overflow-hidden">
      <div
        id="game-details-modal"
        className="relative w-full h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:max-w-2xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-y-auto flex flex-col"
      >
        {/* Header Cover Banner */}
        <div className="relative min-h-56 bg-slate-950 overflow-hidden flex items-center p-6 border-b border-slate-100">
          {/* Ambient blurred backdrop */}
          {game.coverUrl && (
            <img
              src={game.coverUrl}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-35 scale-125 pointer-events-none"
              referrerPolicy="no-referrer"
            />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-black/50" />

          {/* Close & Edit buttons */}
          <div className="absolute top-3.5 right-3.5 z-20 flex items-center gap-2">
            {!isEditing && (
              <button
                type="button"
                onClick={startEdit}
                className="px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white text-slate-800 text-xs font-semibold backdrop-blur shadow-sm transition flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Modifier
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-black/60 hover:bg-black/80 text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Showcase Box Art + Title */}
          <div className="relative z-10 flex items-center gap-3.5 sm:gap-5 w-full pr-12 sm:pr-16">
            {/* Box Art Thumbnail */}
            <div className="relative w-20 sm:w-28 aspect-[3/4] shrink-0 rounded-lg overflow-hidden bg-slate-900 shadow-2xl border border-white/20 flex items-center justify-center">
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
                <span className="text-[10px] text-slate-400 font-bold p-2 text-center">{game.console}</span>
              )}
            </div>

            {/* Title on banner */}
            <div className="min-w-0 flex-1">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] sm:text-xs font-bold border backdrop-blur-md bg-white/95 shadow-sm mb-1.5 ${theme.bgBadge} ${theme.borderBadge}`}
              >
                {game.console}
              </span>
              <h2 className="text-base sm:text-xl md:text-2xl font-black text-white leading-tight drop-shadow-md line-clamp-3">
                {game.title}
              </h2>
              {game.publisher && (
                <p className="text-[11px] sm:text-xs text-slate-300 mt-1 truncate">
                  Édité par <span className="text-white font-medium">{game.publisher}</span>
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
                <label className="block text-xs font-bold text-slate-700 mb-1">Titre</label>
                <input
                  type="text"
                  required
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Console</label>
                  <select
                    value={editedConsole}
                    onChange={(e) => setEditedConsole(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                  >
                    {CONSOLE_LIST.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Année</label>
                  <input
                    type="number"
                    value={editedYear}
                    onChange={(e) => setEditedYear(e.target.value ? parseInt(e.target.value, 10) : '')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Code-barres</label>
                  <input
                    type="text"
                    value={editedBarcode}
                    onChange={(e) => setEditedBarcode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Genre</label>
                  <input
                    type="text"
                    value={editedGenre}
                    onChange={(e) => setEditedGenre(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Éditeur</label>
                  <input
                    type="text"
                    value={editedPublisher}
                    onChange={(e) => setEditedPublisher(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Développeur</label>
                  <input
                    type="text"
                    value={editedDeveloper}
                    onChange={(e) => setEditedDeveloper(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">État physique</label>
                  <select
                    value={editedCondition}
                    onChange={(e) => setEditedCondition(e.target.value as GameCondition)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                  >
                    {Object.entries(CONDITION_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Statut</label>
                  <select
                    value={editedStatus}
                    onChange={(e) => setEditedStatus(e.target.value as GameStatus)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                  >
                    {Object.entries(STATUS_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Quantité en stock</label>
                  <div className="flex items-center bg-slate-50 border border-slate-300 rounded-xl overflow-hidden h-[38px]">
                    <button
                      type="button"
                      onClick={() => setEditedQuantity(Math.max(1, editedQuantity - 1))}
                      className="px-3 h-full text-slate-600 hover:bg-slate-200 font-bold cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      value={editedQuantity}
                      onChange={(e) => setEditedQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full text-center bg-transparent font-bold text-slate-900 text-sm focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setEditedQuantity(editedQuantity + 1)}
                      className="px-3 h-full text-slate-600 hover:bg-slate-200 font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Cote d'occasion & Prix d'achat */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-emerald-950 flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5 text-emerald-600" />
                      Cote estimée (€)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const autoVal = estimateMarketValue(editedTitle, editedConsole, editedCondition);
                        setEditedEstimatedValue(autoVal);
                      }}
                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
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
                    className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-xl text-sm font-mono font-bold text-emerald-950 focus:outline-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Prix d'achat payé (€) <span className="text-slate-400 font-normal">(optionnel)</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={editedPurchasePrice}
                    onChange={(e) => setEditedPurchasePrice(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="ex: 20"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-mono text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Note ({editedRating}/5)</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setEditedRating(star)}
                      className={`text-xl cursor-pointer ${
                        star <= editedRating ? 'text-amber-400' : 'text-slate-200'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notes personnelles</label>
                <textarea
                  rows={2}
                  value={editedNotes}
                  onChange={(e) => setEditedNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              {/* Cover URL field & Search */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    URL de la jaquette
                  </label>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!editedTitle.trim()) return;
                      try {
                        const res = await fetch(`/api/games/find-cover?title=${encodeURIComponent(editedTitle)}&console=${encodeURIComponent(editedConsole)}`);
                        const d = await res.json();
                        if (d.coverUrl) setEditedCoverUrl(getSafeCoverUrl(d.coverUrl));
                      } catch (e) {
                        // ignore
                      }
                    }}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Trouver la jaquette officielle
                  </button>
                </div>
                <div className="flex gap-3 items-center">
                  <input
                    type="text"
                    value={editedCoverUrl}
                    onChange={(e) => setEditedCoverUrl(e.target.value)}
                    placeholder="URL de l'image de jaquette..."
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                  />
                  {editedCoverUrl && (
                    <div className="w-10 h-12 rounded bg-slate-900 border border-slate-300 overflow-hidden shrink-0 flex items-center justify-center">
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
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Enregistrer les modifications
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Cote de l'occasion & Argus Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50/40 to-slate-50 border border-emerald-200/80 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                      <Coins className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                          Cote estimée d'occasion
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/80 border border-emerald-300/60 px-1.5 py-0.2 rounded">
                          Argus
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-2xl font-black font-mono text-emerald-950">
                          {currentEstimatedValue} €
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          (pour état {conditionInfo.label.toLowerCase()})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Purchase price and profit margin */}
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    {game.purchasePrice !== undefined ? (
                      <div className="flex items-center gap-2.5 bg-white/95 border border-slate-200/90 rounded-xl px-3 py-1.5 shadow-2xs">
                        <div className="text-left">
                          <p className="text-[10px] text-slate-400 font-medium leading-tight">Prix payé</p>
                          <p className="text-xs font-mono font-bold text-slate-700">{game.purchasePrice} €</p>
                        </div>
                        {margin && (
                          <div
                            className={`pl-2 border-l border-slate-200 flex items-center gap-1 text-xs font-mono font-extrabold ${
                              margin.isPositive ? 'text-emerald-700' : margin.diff < 0 ? 'text-rose-600' : 'text-slate-600'
                            }`}
                            title={margin.isPositive ? 'Plus-value latente' : margin.diff < 0 ? 'Moins-value latente' : 'Neutre'}
                          >
                            {margin.isPositive ? <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> : <TrendingDown className="w-3.5 h-3.5 text-rose-500" />}
                            <span>{margin.isPositive ? '+' : ''}{margin.diff} € ({margin.percentage}%)</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={startEdit}
                        className="text-xs text-emerald-700 hover:text-emerald-900 bg-white/80 border border-emerald-200/80 px-2.5 py-1.5 rounded-xl font-semibold shadow-2xs flex items-center gap-1 transition cursor-pointer"
                      >
                        + Renseigner le prix d'achat
                      </button>
                    )}
                  </div>
                </div>

                {/* PriceCharting verification link & source mention */}
                <div className="pt-2 border-t border-emerald-100/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-[11px] text-emerald-900/80">
                    Cote établie d'après <strong className="font-semibold text-emerald-950">PriceCharting</strong> & <strong className="font-semibold text-emerald-950">Mister Game Price</strong>
                  </span>
                  <a
                    href={getPriceChartingSearchUrl(game.title, game.console)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 hover:underline ml-auto"
                    title="Consulter les transactions eBay et cours mondial sur PriceCharting"
                  >
                    <span>Vérifier sur PriceCharting</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Metadata grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                    <Tag className="w-3.5 h-3.5" /> État
                  </span>
                  <p className="text-sm font-semibold text-slate-900">{conditionInfo.label}</p>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                    <Clock className="w-3.5 h-3.5" /> Statut
                  </span>
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold border ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                    <Star className="w-3.5 h-3.5" /> Note
                  </span>
                  <p className="text-sm font-semibold text-amber-500">
                    {game.rating ? `${game.rating} / 5 ★` : 'Non noté'}
                  </p>
                </div>

                {game.releaseYear && (
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                      <Calendar className="w-3.5 h-3.5" /> Année
                    </span>
                    <p className="text-sm font-semibold text-slate-900">{game.releaseYear}</p>
                  </div>
                )}

                {game.genre && (
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                      Genre
                    </span>
                    <p className="text-sm font-semibold text-slate-900">{game.genre}</p>
                  </div>
                )}

                {game.publisher && (
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                      <Building className="w-3.5 h-3.5" /> Éditeur
                    </span>
                    <p className="text-sm font-semibold text-slate-900">{game.publisher}</p>
                  </div>
                )}

                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                    <Boxes className="w-3.5 h-3.5" /> Quantité en stock
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg shadow-2xs">
                      {game.quantity || 1} ex.
                    </span>
                    <div className="inline-flex items-center bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
                      <button
                        type="button"
                        title="Diminuer la quantité"
                        onClick={() => onUpdateGame({ ...game, quantity: Math.max(1, (game.quantity || 1) - 1) })}
                        className="px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        title="Ajouter un exemplaire au stock"
                        onClick={() => onUpdateGame({ ...game, quantity: (game.quantity || 1) + 1 })}
                        className="px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-100 font-bold cursor-pointer border-l border-slate-200"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Barcode section */}
              {game.barcode && (
                <div className="p-3.5 bg-slate-900 rounded-xl text-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white/10 text-indigo-300">
                      <Barcode className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">Code-barres EAN / UPC</p>
                      <p className="font-mono text-base font-bold tracking-widest text-slate-100">{game.barcode}</p>
                    </div>
                  </div>
                  <span className="text-[11px] text-emerald-400 font-medium px-2 py-0.5 bg-emerald-500/15 border border-emerald-500/30 rounded">
                    Identifié
                  </span>
                </div>
              )}

              {/* Notes or Description */}
              {game.notes && (
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Notes du collectionneur
                  </h4>
                  <div className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100 text-slate-700 text-sm leading-relaxed">
                    {game.notes}
                  </div>
                </div>
              )}

              {/* Added date and delete footer */}
              {isConfirmingDelete ? (
                <div className="pt-4 border-t border-rose-200">
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 space-y-3">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-rose-950">
                          Supprimer définitivement « {game.title} » ({game.console}) ?
                        </p>
                        <p className="text-[11px] text-rose-700 mt-0.5">
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
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-white border border-slate-200 transition cursor-pointer"
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
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Confirmer la suppression
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>Ajouté le {new Date(game.addedAt).toLocaleDateString('fr-FR')}</span>
                  <button
                    id="btn-delete-game"
                    type="button"
                    onClick={() => setIsConfirmingDelete(true)}
                    className="text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1.5 cursor-pointer px-2.5 py-1 rounded-lg hover:bg-rose-50 transition"
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
