import React, { useState, useEffect } from 'react';
import {
  X,
  BookOpen,
  Barcode,
  Boxes,
  Filter,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  Settings,
  Key,
  ExternalLink,
  ShieldCheck,
  Eye,
  EyeOff,
  ClipboardPaste,
  RefreshCw,
  Trash2,
  AlertTriangle,
  Info,
  Check,
  Smartphone,
  Coins,
  Heart,
  Mail,
  Copy
} from 'lucide-react';
import {
  getStoredGeminiApiKey,
  setStoredGeminiApiKey,
  validateGeminiApiKey,
} from '../utils/geminiApiKey';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenScanner: () => void;
  initialTab?: 'settings' | 'guide' | 'support';
}

export const GuideModal: React.FC<GuideModalProps> = ({
  isOpen,
  onClose,
  onOpenScanner,
  initialTab = 'settings',
}) => {
  const [activeTab, setActiveTab] = useState<'settings' | 'guide' | 'support'>(initialTab);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [savedKey, setSavedKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    status: 'idle' | 'success' | 'error';
    message: string;
    details?: string;
  }>({ status: 'idle', message: '' });
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPaypal, setCopiedPaypal] = useState(false);

  // Sync stored key on modal open
  useEffect(() => {
    if (isOpen) {
      const stored = getStoredGeminiApiKey();
      setSavedKey(stored);
      setApiKeyInput(stored);
      setTestResult({ status: 'idle', message: '' });
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const handleSaveKey = () => {
    const clean = apiKeyInput.trim();
    setStoredGeminiApiKey(clean);
    setSavedKey(clean);
    setTestResult({
      status: 'success',
      message: clean
        ? 'Clé API Gemini enregistrée avec succès dans le stockage local de votre navigateur !'
        : 'Clé API Gemini supprimée.',
    });
  };

  const handleClearKey = () => {
    setStoredGeminiApiKey('');
    setSavedKey('');
    setApiKeyInput('');
    setTestResult({
      status: 'idle',
      message: '',
    });
  };

  const handlePasteKey = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setApiKeyInput(text.trim());
          setCopiedSuccess(true);
          setTimeout(() => setCopiedSuccess(false), 2000);
        }
      }
    } catch {
      // Ignore clipboard read permission denial
    }
  };

  const handleTestKey = async () => {
    const keyToTest = apiKeyInput.trim();
    if (!keyToTest) {
      setTestResult({
        status: 'error',
        message: 'Veuillez saisir ou coller une clé API avant de tester la connexion.',
      });
      return;
    }

    setTesting(true);
    setTestResult({ status: 'idle', message: '' });

    const result = await validateGeminiApiKey(keyToTest);
    setTesting(false);

    if (result.valid) {
      // Auto-save verified key
      setStoredGeminiApiKey(keyToTest);
      setSavedKey(keyToTest);
      setTestResult({
        status: 'success',
        message: result.message,
      });
    } else {
      setTestResult({
        status: 'error',
        message: result.message,
        details: result.error,
      });
    }
  };

  const maskKey = (key: string) => {
    if (!key || key.length < 10) return '••••••••••••';
    return `${key.slice(0, 6)}••••••••${key.slice(-4)}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-fadeIn overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="guide-and-settings-modal"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl bg-[#0f1423] rounded-2xl shadow-2xl border-2 border-slate-700/80 overflow-hidden my-auto max-h-[92vh] flex flex-col text-slate-200"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#0b0f19] via-[#161d31] to-[#0b0f19] text-white flex items-center justify-between border-b-2 border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center gap-1">
              <Settings className="w-5 h-5 text-amber-400" />
              <HelpCircle className="w-4 h-4 text-cyan-400 -ml-1" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold font-pixel text-amber-300 flex items-center gap-2 tracking-wide">
                <span>CONFIG & GUIDE</span>
                <span className="text-[9px] font-bold font-pixel bg-cyan-950/80 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/40">
                  RETROARGUS
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-retro mt-0.5">
                Clé IA Gemini, astuces argus & soutien au créateur
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-[#0b0e17] px-3 pt-2 shrink-0 gap-1.5 sm:gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-[10px] sm:text-[11px] font-bold font-pixel rounded-t-xl transition cursor-pointer border-t border-x whitespace-nowrap ${
              activeTab === 'settings'
                ? 'bg-[#0f1423] text-amber-300 border-amber-500/40 shadow-xs -mb-[1px]'
                : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900'
            }`}
          >
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span>Clé API Gemini</span>
            {savedKey ? (
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" title="Clé configurée" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_#f59e0b]" title="Clé non configurée" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-[10px] sm:text-[11px] font-bold font-pixel rounded-t-xl transition cursor-pointer border-t border-x whitespace-nowrap ${
              activeTab === 'guide'
                ? 'bg-[#0f1423] text-cyan-300 border-cyan-500/40 shadow-xs -mb-[1px]'
                : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span>Guide & Astuces</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('support')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-[10px] sm:text-[11px] font-bold font-pixel rounded-t-xl transition cursor-pointer border-t border-x whitespace-nowrap ${
              activeTab === 'support'
                ? 'bg-[#0f1423] text-rose-400 border-rose-500/40 shadow-xs -mb-[1px]'
                : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${activeTab === 'support' ? 'text-rose-500 fill-rose-500' : 'text-rose-400'}`} />
            <span>Soutenir le créateur</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-slate-700 text-xs sm:text-sm flex-1">
          {activeTab === 'settings' && (
            <div className="space-y-5">
              {/* Status Banner */}
              <div
                className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                  savedKey
                    ? 'bg-[#0b1f14] border-emerald-500/50 text-emerald-300'
                    : 'bg-[#241708] border-amber-500/50 text-amber-300'
                }`}
              >
                {savedKey ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div className="text-xs space-y-1 font-retro">
                  <div className="font-bold flex items-center gap-2">
                    <span className="font-pixel text-[11px]">
                      {savedKey
                        ? 'CLÉ GEMINI CONFIGURÉE & ACTIVE'
                        : "CLÉ GEMINI REQUISE POUR LE SCAN EN LIGNE"}
                    </span>
                    {savedKey && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-950 text-emerald-300 font-pixel border border-emerald-500/40">
                        {maskKey(savedKey)}
                      </span>
                    )}
                  </div>
                  <p className={savedKey ? 'text-emerald-200/90 text-xs' : 'text-amber-200/90 text-xs'}>
                    {savedKey
                      ? "Votre clé est enregistrée localement dans votre navigateur. Toutes les recherches automatiques de jeux, jaquettes et codes-barres sont pleinement opérationnelles."
                      : "En ligne ou partagée, l'application a besoin de votre propre clé d'accès Google Gemini pour identifier automatiquement les codes-barres inconnus et enrichir les fiches de jeux."}
                  </p>
                </div>
              </div>

              {/* Direct Link to Google AI Studio */}
              <div className="p-4 rounded-xl bg-[#131929] border border-cyan-500/30 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span className="font-bold text-slate-100 text-xs sm:text-sm font-retro">
                      Créer ou récupérer votre clé gratuitement
                    </span>
                  </div>
                  <span className="text-[9px] font-bold font-pixel px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                    100% GRATUIT
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-retro">
                  Google met à disposition une clé API <strong>totalement gratuite</strong> avec un quota très généreux (jusqu'à 15 requêtes par minute), amplement suffisant pour toute votre collection de jeux.
                </p>

                <div className="flex flex-wrap gap-2 pt-1">
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition cursor-pointer font-pixel shadow-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Créer ma clé sur Google AI Studio</span>
                  </a>

                  <a
                    href="https://ai.google.dev/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-retro text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
                  >
                    <span>Documentation officielle</span>
                  </a>
                </div>
              </div>

              {/* API Key Input Field & Actions */}
              <div className="space-y-2">
                <label
                  htmlFor="gemini-api-key-input"
                  className="block text-xs font-bold text-slate-200 flex items-center justify-between font-retro"
                >
                  <span className="flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-pixel text-[10px] text-amber-300">VOTRE CLÉ API GEMINI</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Format : AIzaSy...
                  </span>
                </label>

                <div className="relative flex items-center">
                  <input
                    id="gemini-api-key-input"
                    type={showKey ? 'text' : 'password'}
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="Collez votre clé ici (ex: AIzaSyD...)"
                    className="w-full pl-3 pr-20 py-2.5 bg-[#0a0e1a] border border-slate-700 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40 rounded-xl text-xs sm:text-sm font-mono text-cyan-300 placeholder:text-slate-600 transition outline-none"
                    autoComplete="off"
                    spellCheck={false}
                  />

                  <div className="absolute right-1.5 flex items-center gap-1">
                    {/* Paste button */}
                    <button
                      type="button"
                      onClick={handlePasteKey}
                      className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded-lg transition cursor-pointer"
                      title="Coller depuis le presse-papier"
                    >
                      {copiedSuccess ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <ClipboardPaste className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Toggle show/hide */}
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition cursor-pointer"
                      title={showKey ? 'Masquer la clé' : 'Afficher la clé'}
                    >
                      {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Buttons: Test, Save, Clear */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleTestKey}
                    disabled={testing || !apiKeyInput.trim()}
                    className="px-3 py-2 text-xs font-bold font-pixel text-cyan-300 hover:text-cyan-200 bg-[#162238] hover:bg-[#1c2c48] border border-cyan-500/40 rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin text-cyan-400' : ''}`} />
                    <span>{testing ? 'TEST EN COURS...' : 'TESTER CONNEXION'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveKey}
                    disabled={!apiKeyInput.trim() && !savedKey}
                    className="px-4 py-2 text-xs font-bold font-pixel text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>ENREGISTRER</span>
                  </button>

                  {savedKey && (
                    <button
                      type="button"
                      onClick={handleClearKey}
                      className="px-3 py-2 text-xs font-bold font-pixel text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-xl transition flex items-center gap-1 cursor-pointer ml-auto border border-rose-500/30"
                      title="Supprimer la clé enregistrée"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">SUPPRIMER</span>
                    </button>
                  )}
                </div>

                {/* Test Feedback */}
                {testResult.status === 'success' && (
                  <div className="p-3 rounded-xl bg-[#0a1e12] border border-emerald-500/50 text-emerald-300 flex items-start gap-2.5 text-xs animate-fadeIn font-retro">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold font-pixel text-[10px]">TEST RÉUSSI ! </span>
                      <span>{testResult.message}</span>
                    </div>
                  </div>
                )}

                {testResult.status === 'error' && (
                  <div className="p-3 rounded-xl bg-[#240c12] border border-rose-500/50 text-rose-300 flex items-start gap-2.5 text-xs animate-fadeIn font-retro">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <div className="font-bold font-pixel text-[10px]">ÉCHEC DU TEST :</div>
                      <p>{testResult.message}</p>
                      {testResult.details && (
                        <p className="text-[11px] font-mono text-rose-300 bg-rose-950/60 p-1 rounded mt-1 border border-rose-800">
                          {testResult.details}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Explanations & How-To in 3 Steps */}
              <div className="space-y-2.5 pt-2 border-t border-slate-800">
                <h4 className="font-bold text-amber-300 text-xs sm:text-sm flex items-center gap-1.5 font-retro">
                  <Info className="w-4 h-4 text-cyan-400" />
                  <span className="font-pixel text-[10px]">COMMENT RÉCUPÉRER SA CLÉ EN 3 ÉTAPES :</span>
                </h4>

                <div className="grid grid-cols-1 gap-2 text-xs font-retro">
                  <div className="p-2.5 rounded-lg bg-[#131929] border border-slate-800 flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center font-bold text-[10px] font-pixel shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      <p className="font-semibold text-slate-100 font-retro">
                        Ouvrez Google AI Studio
                      </p>
                      <p className="text-slate-400 text-[11px] mt-0.5">
                        Cliquez sur le bouton ci-dessus pour accéder à <code className="bg-slate-900 border border-slate-700 px-1 py-0.5 rounded text-cyan-300">aistudio.google.com/app/apikey</code> et connectez-vous avec votre compte Google ordinaire.
                      </p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#131929] border border-slate-800 flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center font-bold text-[10px] font-pixel shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      <p className="font-semibold text-slate-100 font-retro">
                        Créez la clé en 1 clic
                      </p>
                      <p className="text-slate-400 text-[11px] mt-0.5">
                        Cliquez sur le bouton <strong>« Create API key »</strong> (ou « Créer une clé API ») dans un projet existant ou nouveau.
                      </p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#131929] border border-slate-800 flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center font-bold text-[10px] font-pixel shrink-0 mt-0.5">
                      3
                    </div>
                    <div>
                      <p className="font-semibold text-slate-100 font-retro">
                        Collez et enregistrez
                      </p>
                      <p className="text-slate-400 text-[11px] mt-0.5">
                        Copiez la clé qui commence par <strong>AIzaSy...</strong>, collez-la dans le champ ci-dessus puis cliquez sur <strong>« ENREGISTRER »</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Privacy and Security Guarantee */}
              <div className="p-3 rounded-xl bg-[#111726] border border-slate-800 flex items-start gap-2.5 text-xs text-slate-400 font-retro">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong className="text-slate-200">Vie privée & Sécurité :</strong> Votre clé API est conservée <strong>uniquement sur votre propre appareil</strong> (dans le stockage local de votre navigateur). Elle ne transite jamais par un serveur externe autre que les requêtes directes et sécurisées vers Google.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="space-y-4">
              {/* Section 1: Scan */}
              <div className="p-3.5 rounded-xl bg-[#131929] border border-cyan-500/30 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-cyan-500 text-slate-950 shrink-0 mt-0.5">
                  <Barcode className="w-4 h-4" />
                </div>
                <div className="space-y-1 font-retro">
                  <h4 className="font-bold text-amber-300 text-sm font-pixel text-xs">Scanner par code-barres</h4>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    Pointez la caméra de votre mobile vers le code-barres EAN ou UPC au dos du boîtier de votre jeu, ou saisissez directement les chiffres. L'application identifie immédiatement le titre, la console, le studio, l'année et la jaquette officielle.
                  </p>
                </div>
              </div>

              {/* Section 2: Duplicate check & stock */}
              <div className="p-3.5 rounded-xl bg-[#131929] border border-slate-800 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-slate-800 text-amber-300 border border-slate-700 shrink-0 mt-0.5">
                  <Boxes className="w-4 h-4" />
                </div>
                <div className="space-y-1 font-retro">
                  <h4 className="font-bold text-slate-200 text-sm font-pixel text-xs">Détection de stock & doublons</h4>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    Lors de la saisie d'un titre ou du scan d'un code-barres, l'application vérifie instantanément s'il est déjà présent dans votre collection. Vous pouvez alors augmenter la quantité en 1 clic pour tenir votre stock à jour.
                  </p>
                </div>
              </div>

              {/* Section 3: Ergonomie mobile */}
              <div className="p-3.5 rounded-xl bg-[#131929] border border-slate-800 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-500 text-slate-950 shrink-0 mt-0.5">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div className="space-y-1 font-retro">
                  <h4 className="font-bold text-slate-200 text-sm font-pixel text-xs">Navigation fluide sur smartphone</h4>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    La liste optimisée permet de faire défiler vos jeux rapidement. Touchez simplement un jeu pour ouvrir sa <strong>grande jaquette officielle en haute définition</strong> et sa fiche technique complète.
                  </p>
                </div>
              </div>

              {/* Section 4: Filtres & Stats */}
              <div className="p-3.5 rounded-xl bg-[#131929] border border-slate-800 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-indigo-600 text-white shrink-0 mt-0.5">
                  <Filter className="w-4 h-4" />
                </div>
                <div className="space-y-1 font-retro">
                  <h4 className="font-bold text-slate-200 text-sm font-pixel text-xs">Filtres, tri & sauvegardes</h4>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    Filtrez par console, triez par cote d'occasion ou date d'ajout. Exportez votre collection en format CSV/JSON pour la conserver sur votre téléphone ou la restaurer à tout moment.
                  </p>
                </div>
              </div>

              {/* Section 5: Argus français & européen */}
              <div className="p-3.5 rounded-xl bg-[#0e2118] border border-emerald-500/40 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-500 text-slate-950 shrink-0 mt-0.5">
                  <Coins className="w-4 h-4" />
                </div>
                <div className="space-y-1 font-retro">
                  <h4 className="font-bold text-emerald-300 text-sm font-pixel text-xs">Argus réaliste français & européen</h4>
                  <p className="text-emerald-200/90 text-xs leading-relaxed">
                    Les cotes sont alignées sur le marché français (PAL FR) grâce aux données de référence de <strong>Mister Game Price</strong> et aux <strong>ventes conclues sur eBay France</strong> en Euros (€). Chaque fiche jeu propose des liens directs pour vérifier la valeur en direct.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'support' && (
            <div className="space-y-4">
              {/* Introduction Card */}
              <div className="bg-[#151221] border border-rose-500/40 rounded-2xl p-4 sm:p-5 space-y-3 shadow-2xs font-retro">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-rose-500 text-white shadow-xs">
                    <Heart className="w-5 h-5 fill-white" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black font-pixel text-rose-300 tracking-wide">
                      SOUTENIR RETROARGUS
                    </h3>
                    <p className="text-xs text-slate-400 font-retro">
                      Projet indépendant créé par un passionné pour la communauté rétro & gaming
                    </p>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Si le logiciel vous convient et vous aide à répertorier, organiser et estimer vos jeux vidéo au juste prix, vous pouvez soutenir son créateur en faisant un don.
                </p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Votre contribution aide directement à maintenir l'application, financer l'hébergement et les API, et permet de développer et rajouter continuellement de nouvelles fonctionnalités.
                </p>
              </div>

              {/* PayPal Donation Card */}
              <div className="bg-[#131929] border-2 border-indigo-500/40 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xs font-retro">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[9px] font-bold font-pixel uppercase tracking-wider text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/40">
                      DON SÉCURISÉ PAYPAL
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold font-pixel text-slate-100 mt-1.5">
                      Faire un don au créateur
                    </h4>
                  </div>
                  <span className="text-[9px] font-bold font-pixel text-emerald-300 bg-emerald-950/90 px-2.5 py-1 rounded-full border border-emerald-500/40">
                    MONTANT LIBRE
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Chaque don, même modeste, est une aide précieuse pour faire grandir le projet et soutenir son développement actif.
                </p>

                <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                  <a
                    href="https://paypal.me/computaur?locale.x=fr_FR&country.x=FR"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0070ba] hover:bg-[#005ea6] text-white font-bold font-pixel text-xs shadow-sm hover:shadow transition cursor-pointer"
                    title="Faire un don sécurisé via PayPal"
                  >
                    <Heart className="w-4 h-4 fill-white text-white" />
                    <span>Faire un don via PayPal</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText('https://paypal.me/computaur?locale.x=fr_FR&country.x=FR');
                        setCopiedPaypal(true);
                        setTimeout(() => setCopiedPaypal(false), 2000);
                      }
                    }}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-retro text-xs transition cursor-pointer border border-slate-700"
                    title="Copier le lien de don PayPal"
                  >
                    {copiedPaypal ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-300 font-bold font-pixel text-[10px]">Lien copié !</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Copier le lien PayPal</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 bg-[#0e1422] p-2.5 rounded-lg border border-slate-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Paiement sécurisé traité directement sur la plateforme officielle PayPal.</span>
                </div>
              </div>

              {/* Creator Contact Card */}
              <div className="bg-[#131929] border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3 font-retro">
                <div className="flex items-center gap-2 text-slate-200 font-bold text-sm font-pixel text-xs">
                  <Mail className="w-4 h-4 text-amber-400" />
                  <span>Contacter le créateur</span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Vous pouvez contacter directement le créateur pour échanger, proposer des fonctionnalités, signaler une anomalie ou poser une question :
                </p>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-[#0c101c] border border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30 font-mono text-xs sm:text-sm font-bold select-all">
                      computaur@free.fr
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href="mailto:computaur@free.fr?subject=Retour%20sur%20RetroArgus"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold font-pixel transition"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Écrire un e-mail</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        if (navigator.clipboard && navigator.clipboard.writeText) {
                          navigator.clipboard.writeText('computaur@free.fr');
                          setCopiedEmail(true);
                          setTimeout(() => setCopiedEmail(false), 2000);
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-retro transition cursor-pointer border border-slate-700"
                    >
                      {copiedEmail ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-300 font-bold font-pixel text-[10px]">Copié</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                          <span>Copier</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Development Roadmap */}
              <div className="p-3.5 rounded-xl bg-[#131929] border border-cyan-500/30 text-xs space-y-1.5 font-retro">
                <h5 className="font-bold text-cyan-300 flex items-center gap-1.5 font-pixel text-[10px]">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>ÉVOLUTIONS ET FONCTIONNALITÉS PRÉVUES :</span>
                </h5>
                <ul className="list-disc list-inside text-slate-300 space-y-1 pl-1 text-[11px]">
                  <li>Ajout de consoles et formats rétro complémentaires</li>
                  <li>Perfectionnement des algorithmes de détection d'argus français (Mister Game Price / eBay FR)</li>
                  <li>Historique graphique de l'évolution de valeur de votre collection</li>
                  <li>Options d'exports enrichis et partage de vitrine entre collectionneurs</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#0b0e17] border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold font-pixel text-slate-400 hover:text-slate-200 transition cursor-pointer"
          >
            Fermer
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenScanner();
            }}
            className="px-4 py-2 text-xs font-bold font-pixel text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
          >
            <Barcode className="w-4 h-4" />
            <span>OUVRIR LE SCANNER</span>
          </button>
        </div>
      </div>
    </div>
  );
};
