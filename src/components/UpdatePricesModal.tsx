import React, { useState } from 'react';
import { Game } from '../types';
import {
  Coins,
  RefreshCw,
  ExternalLink,
  Info,
  Check,
  X,
  Sparkles,
  Sliders,
  RotateCcw,
} from 'lucide-react';
import {
  COTE_SOURCE_INFO,
  estimateMarketValue,
  getMisterGamePriceSearchUrl,
  getEbayFranceSoldSearchUrl,
  getLeboncoinSearchUrl,
  getVintedSearchUrl,
} from '../utils/marketPriceGuide';

interface UpdatePricesModalProps {
  isOpen: boolean;
  onClose: () => void;
  games: Game[];
  onRecalculateAll: () => void;
  onApplyPercentage: (percent: number) => void;
  onUpdateSinglePrice: (gameId: string, newPrice: number) => void;
  onResetCustomPrices: () => void;
}

export const UpdatePricesModal: React.FC<UpdatePricesModalProps> = ({
  isOpen,
  onClose,
  games,
  onRecalculateAll,
  onApplyPercentage,
  onUpdateSinglePrice,
  onResetCustomPrices,
}) => {
  const [activeTab, setActiveTab] = useState<'source' | 'actions' | 'edit'>('source');
  const [percentAdjust, setPercentAdjust] = useState<number>(10);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<number>(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const handleExecuteRecalculate = () => {
    onRecalculateAll();
    showToast('Toutes les cotes ont été recalculées selon l’argus français Mister Game Price.');
  };

  const handleExecutePercentage = (positive: boolean) => {
    const val = positive ? Math.abs(percentAdjust) : -Math.abs(percentAdjust);
    onApplyPercentage(val);
    showToast(`Un ajustement de ${val > 0 ? '+' : ''}${val}% a été appliqué à toutes les cotes.`);
  };

  const handleExecuteReset = () => {
    onResetCustomPrices();
    showToast('Toutes les cotes personnalisées ont été réinitialisées aux valeurs de référence.');
  };

  const handleSaveInline = (gameId: string) => {
    onUpdateSinglePrice(gameId, Math.max(0, Math.round(tempPrice)));
    setEditingId(null);
    showToast('Prix mis à jour avec succès.');
  };

  const filteredGames = games.filter((g) =>
    g.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.console.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm overflow-hidden font-retro">
      <div
        id="modal-update-prices"
        className="relative w-full h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:max-w-2xl bg-[#0f1423] rounded-t-2xl sm:rounded-2xl shadow-2xl border-2 border-slate-700 overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-[#0b0e18] border-b border-slate-800 text-white p-5 sm:p-6 flex items-start justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-sm shrink-0 font-bold">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold font-pixel text-slate-100">
                  COTE ARGUS & PRIX
                </h2>
                <span className="text-[10px] uppercase font-bold font-pixel px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  {games.length} JEUX
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Origine des cours, sources de référence et gestion des cotes
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer shrink-0"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-[#0d1220] px-4 pt-2 gap-2 text-xs font-semibold shrink-0 font-pixel">
          <button
            type="button"
            onClick={() => setActiveTab('source')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'source'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>SOURCES</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('actions')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'actions'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>ACTUALISATION</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('edit')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'edit'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>AJUSTER ({games.length})</span>
          </button>
        </div>

        {/* Feedback message toast */}
        {successMessage && (
          <div className="bg-emerald-700 text-white text-xs px-4 py-2 font-medium flex items-center justify-between animate-fade-in shrink-0">
            <span className="flex items-center gap-1.5 font-retro">
              <Check className="w-4 h-4" />
              {successMessage}
            </span>
            <button
              type="button"
              onClick={() => setSuccessMessage(null)}
              className="text-white/80 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* TAB 1: SITES DE RÉFÉRENCE */}
          {activeTab === 'source' && (
            <div className="space-y-4">
              <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm font-pixel">
                  <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>ARGUS MARCHÉ FRANÇAIS & EUROPÉEN</span>
                </div>
                <p className="text-xs text-emerald-200/90 leading-relaxed">
                  L'argus de l'application est aligné sur les transactions effectives du marché français et européen (éditions <strong>PAL France</strong> avec boîte, jaquette et notice en français). Il se base en priorité sur <strong className="text-amber-300">Mister Game Price</strong> (l'Argus français de référence) et l'historique des <strong className="text-amber-300">ventes terminées et payées en Euros sur eBay France</strong>, complété par <strong className="text-amber-300">LeBonCoin & Vinted</strong>.
                </p>
              </div>

              {/* Source cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Mister Game Price */}
                <div className="bg-[#0b0e18] rounded-xl border border-emerald-500/40 p-4 shadow-sm space-y-2.5 relative">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold font-pixel text-emerald-300 uppercase tracking-wider bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                        ARGUS PAL & FRANCE
                      </span>
                      <h3 className="text-base font-bold text-slate-100 mt-1">Mister Game Price</h3>
                    </div>
                    <a
                      href={COTE_SOURCE_INFO.primaryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-emerald-900/40 hover:bg-emerald-900/60 text-emerald-300 transition"
                      title="Visiter Mister Game Price"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Argus spécialisé dédié aux éditions françaises et européennes. Prend en compte la valeur des jaquettes FR, notices francophones, rééditions et éditions collectors PAL.
                  </p>
                  <a
                    href={COTE_SOURCE_INFO.primaryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 hover:underline"
                  >
                    Consulter mistergameprice.com <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* eBay France - Ventes Réussies */}
                <div className="bg-[#0b0e18] rounded-xl border border-slate-700 p-4 shadow-sm space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold font-pixel text-cyan-300 uppercase tracking-wider bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                        TRANSACTIONS RÉELLES (€)
                      </span>
                      <h3 className="text-base font-bold text-slate-100 mt-1">eBay France (Ventes réussies)</h3>
                    </div>
                    <a
                      href="https://www.ebay.fr"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                      title="Visiter eBay.fr"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Historique des ventes conclues et payées en France et en Europe. Reflète fidèlement le cours réel du marché sans être faussé par les annonces invendues à prix excessifs.
                  </p>
                  <a
                    href="https://www.ebay.fr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-cyan-400 hover:text-cyan-300 hover:underline"
                  >
                    Voir ebay.fr en direct <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Barème d'état & réalité économique */}
              <div className="bg-[#0b0e18] rounded-xl border border-slate-700 p-4 space-y-2">
                <h4 className="text-xs font-bold font-pixel text-amber-400 uppercase tracking-wider">
                  BARÈME DE VALORISATION PAR ÉTAT :
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                  <div className="p-2.5 rounded-lg bg-[#141b2e] border border-slate-700">
                    <span className="block font-bold text-slate-200">Neuf sous blister</span>
                    <span className="text-emerald-400 font-mono font-bold">+100% (x2.0)</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#141b2e] border border-slate-700">
                    <span className="block font-bold text-slate-200">Complet (CIB)</span>
                    <span className="text-cyan-400 font-mono font-bold">100% (Ref)</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#141b2e] border border-slate-700">
                    <span className="block font-bold text-slate-200">Loose (sans boîte)</span>
                    <span className="text-amber-400 font-mono font-bold">40% (x0.40)</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#141b2e] border border-slate-700">
                    <span className="block font-bold text-slate-200">Boîte + notice</span>
                    <span className="text-slate-300 font-mono font-bold">40% (x0.40)</span>
                  </div>
                </div>
                <div className="bg-amber-950/40 border border-amber-500/40 rounded-lg p-2.5 text-[11px] text-amber-200 space-y-1 mt-2">
                  <p className="font-semibold font-pixel text-amber-300">SPÉCIFICITÉS MARCHÉ FR :</p>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                    <li><strong>Jeux de sport annuels (FIFA, PES, NBA 2K) :</strong> plafonnés à <strong>2€ - 3€</strong> complets (1€ loose), conformément au marché réel de l'occasion en France.</li>
                    <li><strong>Rétrogaming en boîte carton :</strong> la boîte et notice FR d'origine font 60 à 70% de la cote globale.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ACTIONS GLOBALES */}
          {activeTab === 'actions' && (
            <div className="space-y-4">
              <div className="space-y-3">
                {/* Action 1: Recalculer tout selon Mister Game Price */}
                <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold font-pixel text-emerald-300 flex items-center gap-1.5">
                      <RefreshCw className="w-4 h-4 text-emerald-400" />
                      RECALCULER SELON L'ARGUS FRANÇAIS
                    </h4>
                    <p className="text-xs text-slate-300 mt-1">
                      Réapplique les cotes officielles de Mister Game Price et des ventes réelles en France à l'ensemble des {games.length} jeux selon leur état et leur édition.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExecuteRecalculate}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold font-pixel shadow-xs transition flex items-center gap-1.5 shrink-0 cursor-pointer border border-emerald-400"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    RECALCULER TOUT
                  </button>
                </div>

                {/* Action 2: Ajuster en pourcentage */}
                <div className="p-4 rounded-xl border border-slate-700 bg-[#0b0e18] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold font-pixel text-slate-100 flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-amber-400" />
                      AJUSTER GLOBALEMENT LES COTES (%)
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Applique une hausse ou une décote uniforme sur tous les prix de la collection (ex: inflation, marché local).
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 font-pixel">
                    <div className="flex items-center bg-[#151c2e] border border-slate-700 rounded-lg px-2 py-1">
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={percentAdjust}
                        onChange={(e) => setPercentAdjust(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-12 text-center text-xs font-bold text-amber-400 focus:outline-none bg-transparent"
                      />
                      <span className="text-xs text-slate-400 font-bold">%</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleExecutePercentage(true)}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      +{percentAdjust}%
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExecutePercentage(false)}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      -{percentAdjust}%
                    </button>
                  </div>
                </div>

                {/* Action 3: Réinitialiser */}
                <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold font-pixel text-amber-300 flex items-center gap-1.5">
                      <RotateCcw className="w-4 h-4 text-amber-400" />
                      RÉINITIALISER LES COTES PERSONNALISÉES
                    </h4>
                    <p className="text-xs text-amber-200/90 mt-1">
                      Supprime les modifications manuelles de prix et réinitialise les cotes calculées par défaut.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExecuteReset}
                    className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold font-pixel shadow-xs transition flex items-center gap-1.5 shrink-0 cursor-pointer border border-amber-500"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    RÉINITIALISER
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AJUSTEMENT PAR JEU */}
          {activeTab === 'edit' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <input
                  type="text"
                  placeholder="Rechercher un jeu à ajuster..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0b0e18] border border-slate-700 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                />
                <span className="text-[11px] text-slate-400 font-pixel font-bold whitespace-nowrap">
                  {filteredGames.length} JEUX
                </span>
              </div>

              <div className="divide-y divide-slate-800 border border-slate-700 rounded-xl max-h-72 overflow-y-auto bg-[#0b0e18]">
                {filteredGames.map((game) => {
                  const isEditingThis = editingId === game.id;
                  const currentVal = game.estimatedValue !== undefined
                    ? game.estimatedValue
                    : estimateMarketValue(game.title, game.console, game.condition);

                  return (
                    <div
                      key={game.id}
                      className="p-2.5 flex items-center justify-between gap-2 hover:bg-slate-800/60 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-slate-100 truncate">{game.title}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span className="font-pixel text-amber-300">{game.console}</span>
                          <span>•</span>
                          <span className="capitalize">{game.condition}</span>
                          {game.estimatedValue !== undefined && (
                            <span className="text-[9px] font-bold font-pixel text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-1.5 py-0.2 rounded">
                              PERSO
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isEditingThis ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min={0}
                              value={tempPrice}
                              onChange={(e) => setTempPrice(Math.max(0, parseInt(e.target.value) || 0))}
                              className="w-16 px-2 py-1 bg-[#141b2e] border border-amber-400 rounded font-mono font-bold text-xs text-right text-slate-100 focus:outline-none"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveInline(game.id);
                                if (e.key === 'Escape') setEditingId(null);
                              }}
                            />
                            <span className="font-bold text-amber-400">€</span>
                            <button
                              type="button"
                              onClick={() => handleSaveInline(game.id)}
                              className="p-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                              title="Valider"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 cursor-pointer"
                              title="Annuler"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
                              {currentVal} €
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(game.id);
                                setTempPrice(currentVal);
                              }}
                              className="px-2 py-1 rounded bg-[#151c2e] hover:bg-[#1d2740] border border-slate-700 text-slate-200 font-pixel font-bold text-[10px] cursor-pointer"
                              title="Modifier ce prix"
                            >
                              ÉDITER
                            </button>
                            <a
                              href={getMisterGamePriceSearchUrl(game.title, game.console)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded bg-[#151c2e] hover:bg-[#1d2740] border border-slate-700 text-slate-400 hover:text-amber-400 cursor-pointer"
                              title="Consulter la cote sur Mister Game Price (FR)"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#0b0e18] border-t border-slate-800 px-5 py-3 flex items-center justify-between text-xs shrink-0">
          <div className="text-slate-400 font-retro">
            Source : <strong className="text-amber-300">PriceCharting</strong> & <strong className="text-emerald-400">Mister Game Price</strong>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-pixel font-bold rounded-xl transition cursor-pointer border border-slate-600"
          >
            FERMER
          </button>
        </div>
      </div>
    </div>
  );
};
