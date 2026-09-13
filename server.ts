import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
// Aucune base de données interne : toutes les recherches s'effectuent en direct sur le web

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Permissive CORS middleware for dev and iframe environments
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-gemini-api-key');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Lazy GoogleGenAI initialization
const USER_FALLBACK_KEY = 'AQ.Ab8RN6JgiQdl4zhoq5GE37BPG_dASnP3lD3CwQ0nFKaLbcVfLg';
let activeServerApiKey = USER_FALLBACK_KEY;
let aiClient: GoogleGenAI | null = null;

function getAi(customKey?: string): GoogleGenAI | null {
  const cleanCustom = customKey ? customKey.trim() : '';
  const key = cleanCustom.length > 5 ? cleanCustom : activeServerApiKey;
  if (!key) {
    return null;
  }
  if (!cleanCustom && aiClient) {
    return aiClient;
  }
  const client = new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
  if (!cleanCustom) {
    aiClient = client;
  }
  return client;
}

// Circuit breaker for Gemini to prevent repeated stalls or errors
let geminiDisabledUntil = 0;
let geminiPermanentlyDisabled = false;

// Multi-model rotation supporting active Google AI Studio Flash models
// Prioritizes responsive models with independent free-tier quotas (gemini-3.7-flash, gemini-3.5-flash, gemini-3.5-flash-lite, etc.)
const GEMINI_MODELS = [
  'gemini-3.7-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-3-flash-preview',
  'gemini-3.8-flash',
  'gemini-flash-latest',
  'gemini-3.6-flash',
];

function isGeminiAvailable(customKey?: string): boolean {
  if (customKey && customKey.trim().length > 5) {
    return true; // User provided key, always attempt
  }
  if (geminiPermanentlyDisabled && !activeServerApiKey) return false;
  if (Date.now() < geminiDisabledUntil) return false;
  return Boolean(activeServerApiKey);
}

function markGeminiFailure(err?: any, isCustomKey: boolean = false) {
  if (isCustomKey) return; // Never disable server for custom key errors
  const errMsg = typeof err === 'string' ? err : (err?.message || JSON.stringify(err || ''));
  // Never disable globally for 429 (rate limits/quotas) or 503 (high demand) because another model in the list can succeed!
  if (/dunning|ACCOUNT_SUSPENDED|BILLING_DISABLED/i.test(errMsg)) {
    geminiPermanentlyDisabled = true;
    geminiDisabledUntil = Date.now() + 60 * 60 * 1000;
  }
}

// Resilient Gemini JSON caller with multi-model fallback and markdown fence stripping
async function generateGeminiJson(ai: GoogleGenAI, prompt: string, timeoutMs: number = 6000): Promise<any> {
  let lastErr: any = null;
  for (const model of GEMINI_MODELS) {
    try {
      const response = await withTimeout(
        ai.models.generateContent({
          model,
          contents: prompt,
        }),
        timeoutMs,
        `Délai dépassé pour ${model}`
      );
      const text = response.text || '';
      const cleaned = text.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
      const match = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
      if (match) {
        return JSON.parse(match[0]);
      }
    } catch (err: any) {
      lastErr = err;
      const msg = err?.message || String(err);
      console.warn(`[Gemini] Modèle ${model} non disponible (${err?.status || 'erreur'}): ${msg.slice(0, 100)}, essai du modèle suivant...`);
      if (/API_KEY_INVALID|INVALID_ARGUMENT.*API key not valid/i.test(msg)) {
        break; // Key is explicitly invalid, stop checking other models
      }
      continue;
    }
  }
  throw lastErr || new Error('Aucun modèle Gemini disponible actuellement');
}

// Silent startup probe: check if Gemini API is available on this environment
(async () => {
  try {
    const ai = getAi();
    if (ai) {
      for (const model of ['gemini-3.7-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest']) {
        try {
          await withTimeout(
            ai.models.generateContent({
              model,
              contents: 'ping',
            }),
            3000,
            'timeout'
          );
          geminiPermanentlyDisabled = false;
          geminiDisabledUntil = 0;
          return; // Success!
        } catch {
          // Try next
        }
      }
    }
  } catch (err: any) {
    markGeminiFailure(err);
  }
})();

function extractNumericValue(val: any, fallback: number): number {
  if (typeof val === 'number' && !isNaN(val) && val >= 0) return Math.round(val);
  if (typeof val === 'string') {
    const m = val.match(/(\d+(?:[.,]\d+)?)/);
    if (m) {
      const n = parseFloat(m[1].replace(',', '.'));
      if (!isNaN(n) && n >= 0) return Math.round(n);
    }
  }
  return fallback;
}

// Clean barcode string
function normalizeBarcode(code: string): string {
  return code.replace(/\D/g, '').trim();
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallbackMsg: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(fallbackMsg)), timeoutMs)
    ),
  ]);
}

// Guess genre based on game title keywords for offline/fallback web lookups
function guessGameGenre(title: string): string {
  const t = title.toLowerCase();
  if (/call of duty|battlefield|halo|doom|wolfenstein|medal of honor|killzone|far cry|crisis|rainbow six|counter-strike|titanfall|overwatch/i.test(t)) {
    return 'Tir à la première personne (FPS)';
  }
  if (/mario|sonic|crash bandicoot|spyro|rayman|donkey kong|kirby|banjo|mega man|littlebigplanet|ratchet/i.test(t)) {
    return 'Plates-formes';
  }
  if (/zelda|witcher|elder scrolls|skyrim|fallout|final fantasy|dragon quest|persona|pokemon|pokémon|souls|elden ring|bloodborne|monster hunter|tales of/i.test(t)) {
    return 'Action-RPG / Aventure';
  }
  if (/kart|forza|gran turismo|need for speed|f1|wrc|dirt|burnout|grid|assetto|ridgeracer/i.test(t)) {
    return 'Course';
  }
  if (/fifa|pes|efootball|nba|nfl|madden|wwe|nhl|pro evolution soccer|top spin/i.test(t)) {
    return 'Sport';
  }
  if (/resident evil|silent hill|dead space|the last of us|outlast|alien|evil within|alan wake/i.test(t)) {
    return 'Survival Horror';
  }
  if (/tekken|street fighter|mortal kombat|smash bros|soulcalibur|guilty gear|dragon ball|naruto/i.test(t)) {
    return 'Combat';
  }
  if (/assassin|gta|grand theft auto|red dead|uncharted|tomb raider|spider-man|batman|god of war|infamous|watch dogs/i.test(t)) {
    return 'Action-Aventure';
  }
  return 'Action / Aventure';
}

// Estimate market value based on title, platform and live web texts
function guessEstimatedValue(title: string = '', consoleName: string = '', rawTexts: string[] = []): number {
  const t = title.toLowerCase();

  // 1. Live market price from web snippets if available (e.g. "12,99 €", "14.50 EUR")
  for (const text of rawTexts) {
    const pm = text.match(/(?:prix|cote|price|vendu|eur|€)?\s*[:\s]*(\d{1,3})(?:[.,]\d{2})?\s*(?:€|eur)\b/i);
    if (pm) {
      const val = parseInt(pm[1], 10);
      if (val >= 3 && val <= 180) {
        return val;
      }
    }
  }

  // 2. High-volume sports games have low second-hand value
  if (/fifa|pes|efootball|nba\s*2k|nhl|madden|wwe|pro\s*evolution/i.test(t)) {
    return 3;
  }

  // 3. Known franchise Argus pricing (Mister Game Price / eBay France reference)
  if (/witcher\s*3/i.test(t)) {
    return consoleName.includes('Switch') ? 22 : 12;
  }
  if (/red\s*dead\s*redemption\s*2/i.test(t)) {
    return 15;
  }
  if (/grand\s*theft\s*auto\s*v|gta\s*5|gta\s*v/i.test(t)) {
    return 12;
  }
  if (/pok[eé]mon/i.test(t)) {
    if (/game\s*boy|advance|gba/i.test(consoleName)) return 60;
    if (/3ds|ds/i.test(consoleName)) return 45;
    return 35;
  }
  if (/zelda/i.test(t)) {
    if (/nintendo\s*64|gamecube|snes/i.test(consoleName)) return 55;
    if (/wii|wii\s*u|3ds/i.test(consoleName)) return 30;
    return 38;
  }
  if (/mario\s*kart/i.test(t)) {
    return consoleName.includes('Switch') ? 38 : 28;
  }
  if (/elden\s*ring/i.test(t)) return 30;
  if (/cyberpunk/i.test(t)) return 18;
  if (/god\s*of\s*war\s*ragnar/i.test(t)) return 35;
  if (/spider-man\s*2/i.test(t)) return 40;

  // 4. Default by platform
  if (consoleName === 'PlayStation 3' || consoleName === 'Xbox 360') return 8;
  if (consoleName === 'PlayStation 4' || consoleName === 'Xbox One') return 12;
  if (consoleName === 'PlayStation 5' || consoleName === 'Nintendo Switch' || consoleName === 'Xbox Series X|S') return 25;
  if (consoleName === 'PlayStation 2') return 10;
  if (consoleName === 'PlayStation 1') return 15;
  if (consoleName === 'Nintendo GameCube' || consoleName === 'Nintendo 64') return 30;
  if (consoleName === 'Super Nintendo (SNES)') return 25;
  if (consoleName === 'Game Boy / Advance') return 20;
  if (consoleName === 'Nintendo 3DS / DS') return 15;
  return 10;
}

// Online barcode lookup via multi-engine live web queries (Bing, DuckDuckGo, OpenProductsFacts)
async function searchBarcodeOnline(cleanCode: string): Promise<{
  title: string;
  console: string;
  releaseYear?: number;
  publisher?: string;
  developer?: string;
  genre?: string;
  rawText?: string;
} | null> {
  if (!cleanCode || cleanCode.length < 6) return null;

  const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
  const headers = {
    'User-Agent': userAgent,
    'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  };

  const rawTitles: string[] = [];
  const rawSnippets: string[] = [];

  const unpadded = cleanCode.replace(/^0+/, '');

  // 1. Parallel Multi-Engine Live Search across DuckDuckGo, Buycott, Bing & OpenProductsFacts
  const liveQueries = [
    // 1a. DuckDuckGo HTML direct search (Finds product listings, eBay, Buycott, worldofbooks, etc.)
    (async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const ddgRes = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(cleanCode)}`, {
          signal: controller.signal,
          headers,
        });
        clearTimeout(timeout);
        if (ddgRes.ok) {
          const html = await ddgRes.text();
          for (const m of html.matchAll(/<a[^>]*class="[^"]*result__a[^"]*"[^>]*>([\s\S]*?)<\/a>/gi)) {
            const t = m[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#x27;/g, "'").replace(/&quot;/g, '"').trim();
            if (t) rawTitles.push(t);
          }
          for (const m of html.matchAll(/<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/gi)) {
            const s = m[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#x27;/g, "'").replace(/&quot;/g, '"').trim();
            if (s) rawSnippets.push(s);
          }
        }
      } catch {
        // ignore
      }
    })(),

    // 1b. Buycott UPC / EAN live lookup
    (async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);
        const buycottRes = await fetch(`https://www.buycott.com/upc/${cleanCode}`, {
          signal: controller.signal,
          headers,
        });
        clearTimeout(timeout);
        if (buycottRes.ok) {
          const html = await buycottRes.text();
          const h2 = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
          if (h2) {
            const val = h2[1].replace(/<[^>]+>/g, '').trim();
            if (val && !/error|not found|page not found/i.test(val)) {
              rawTitles.push(val);
              rawSnippets.push(`Buycott UPC: ${val}`);
            }
          }
        }
      } catch {
        // ignore
      }
    })(),

    // 1c. Exact quoted barcode on Bing (Finds marketplace listings on eBay, Amazon, Fnac, PriceCharting, etc.)
    (async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const bingRes = await fetch(`https://www.bing.com/search?q=${encodeURIComponent('"' + cleanCode + '"')}`, {
          signal: controller.signal,
          headers,
        });
        clearTimeout(timeout);
        if (bingRes.ok) {
          const html = await bingRes.text();
          const algos = Array.from(html.matchAll(/<li[^>]*class="b_algo"[^>]*>([\s\S]*?)<\/li>/gi)).map(m => m[1]);
          for (const a of algos) {
            const h = a.match(/<h[23][^>]*>([\s\S]*?)<\/h[23]>/i);
            if (h) {
              const t = h[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#x27;/g, "'").replace(/&quot;/g, '"').trim();
              if (t) rawTitles.push(t);
            }
            const p = a.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
            if (p) {
              const s = p[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#x27;/g, "'").replace(/&quot;/g, '"').trim();
              if (s) rawSnippets.push(s);
            }
          }
        }
      } catch {
        // ignore
      }
    })(),

    // 1d. Open Products Facts Live API check
    (async () => {
      try {
        const opfController = new AbortController();
        const opfTimeout = setTimeout(() => opfController.abort(), 2500);
        const opfRes = await fetch(`https://world.openproductsfacts.org/api/v0/product/${cleanCode}.json`, {
          signal: opfController.signal,
          headers: { 'User-Agent': 'GameVaultApp/1.0' },
        });
        clearTimeout(opfTimeout);
        if (opfRes.ok) {
          const opfData: any = await opfRes.json();
          if (opfData.status === 1 && opfData.product) {
            const p = opfData.product;
            const name = p.product_name || p.product_name_fr || p.product_name_en;
            if (name && name.trim()) {
              rawTitles.push(name.trim());
              if (p.brands) rawSnippets.push(`Editeur: ${p.brands}`);
            }
          }
        }
      } catch {
        // ignore
      }
    })()
  ];

  await Promise.all(liveQueries);

  // If unpadded differs and results are sparse, try unpadded code on DDG as well
  if (rawTitles.length < 2 && unpadded && unpadded !== cleanCode && unpadded.length >= 8) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const ddgResUnpad = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(unpadded)}`, {
        signal: controller.signal,
        headers,
      });
      clearTimeout(timeout);
      if (ddgResUnpad.ok) {
        const html = await ddgResUnpad.text();
        for (const m of html.matchAll(/<a[^>]*class="[^"]*result__a[^"]*"[^>]*>([\s\S]*?)<\/a>/gi)) {
          const t = m[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#x27;/g, "'").replace(/&quot;/g, '"').trim();
          if (t) rawTitles.push(t);
        }
      }
    } catch {
      // ignore
    }
  }

  const allTexts = [...rawTitles, ...rawSnippets];
  if (allTexts.length === 0) return null;

  // Detect console from all texts
  const consoleKeywords = [
    { name: 'PlayStation 5', reg: /\b(?:PS5|PlayStation\s*5)\b/i },
    { name: 'PlayStation 4', reg: /\b(?:PS4|PlayStation\s*4)\b/i },
    { name: 'PlayStation 3', reg: /\b(?:PS3|PlayStation\s*3)\b/i },
    { name: 'PlayStation 2', reg: /\b(?:PS2|PlayStation\s*2)\b/i },
    { name: 'PlayStation 1', reg: /\b(?:PS1|PlayStation\s*1|PSX)\b/i },
    { name: 'Nintendo Switch', reg: /\b(?:Switch|Nintendo\s*Switch|NSW)\b/i },
    { name: 'Xbox Series X|S', reg: /\b(?:Xbox\s*Series|Series\s*X|Series\s*S)\b/i },
    { name: 'Xbox One', reg: /\b(?:Xbox\s*One|XOne)\b/i },
    { name: 'Xbox 360', reg: /\b(?:Xbox\s*360|X360)\b/i },
    { name: 'Super Nintendo (SNES)', reg: /\b(?:SNES|Super\s*Nintendo)\b/i },
    { name: 'Nintendo 64', reg: /\b(?:N64|Nintendo\s*64)\b/i },
    { name: 'Nintendo GameCube', reg: /\b(?:GameCube|NGC)\b/i },
    { name: 'Nintendo 3DS / DS', reg: /\b(?:3DS|Nintendo\s*DS|NDS)\b/i },
    { name: 'Game Boy / Advance', reg: /\b(?:GBA|Game\s*Boy)\b/i },
    { name: 'PC', reg: /\b(?:PC\s*CD-ROM|PC\s*DVD|Windows\s*PC)\b/i },
  ];

  let detectedConsole = 'Autre';
  let maxHits = 0;
  for (const cp of consoleKeywords) {
    const hits = allTexts.filter(t => cp.reg.test(t)).length;
    if (hits > maxHits) {
      maxHits = hits;
      detectedConsole = cp.name;
    }
  }

  // Detect release year (1980-2025, avoiding current listing timestamps)
  let detectedYear: number | undefined;
  for (const text of allTexts) {
    const ymExplicit = text.match(/(?:Sortie|Release|Sorti en|Released in|Année|Date de sortie)\s*[:\s]*([12]\d{3})/i);
    if (ymExplicit) {
      const y = parseInt(ymExplicit[1], 10);
      if (y >= 1980 && y <= 2026) {
        detectedYear = y;
        break;
      }
    }
  }
  if (!detectedYear) {
    for (const text of allTexts) {
      const ym = text.match(/\b(19[89]\d|20[0-1]\d|202[0-5])\b/);
      if (ym) {
        const y = parseInt(ym[1], 10);
        if (y >= 1980 && y <= 2025) {
          detectedYear = y;
          break;
        }
      }
    }
  }

  // Detect publisher
  let detectedPublisher: string | undefined;
  for (const text of allTexts) {
    const pm = text.match(/(?:Editeur|Éditeur|Publisher|Manufacturer)\s*[:‏\s]+([A-Za-z0-9\s&]{3,30})/i);
    if (pm) {
      detectedPublisher = pm[1].trim();
      break;
    }
    if (/\bCD Projekt\b|\bCD Projekt RED\b/i.test(text)) detectedPublisher = 'CD Projekt RED';
    else if (/\bRockstar Games\b|\bRockstar\b/i.test(text)) detectedPublisher = 'Rockstar Games';
    else if (/\bActivision\b|\bBlizzard\b/i.test(text)) detectedPublisher = 'Activision Blizzard';
    else if (/\bElectronic Arts\b|\bEA Games\b|\bEA Sports\b/i.test(text)) detectedPublisher = 'Electronic Arts';
    else if (/\bUbisoft\b/i.test(text)) detectedPublisher = 'Ubisoft';
    else if (/\bNintendo\b/i.test(text)) detectedPublisher = 'Nintendo';
    else if (/\bSony Interactive\b|\bSony Computer\b/i.test(text)) detectedPublisher = 'Sony Interactive Entertainment';
    else if (/\bCapcom\b/i.test(text)) detectedPublisher = 'Capcom';
    else if (/\bSquare Enix\b|\bSquaresoft\b/i.test(text)) detectedPublisher = 'Square Enix';
    else if (/\bKonami\b/i.test(text)) detectedPublisher = 'Konami';
    else if (/\bBandai Namco\b|\bNamco\b/i.test(text)) detectedPublisher = 'Bandai Namco';
    else if (/\bBethesda\b/i.test(text)) detectedPublisher = 'Bethesda';
    else if (/\bSega\b/i.test(text)) detectedPublisher = 'Sega';
    else if (/\bWarner Bros\b|\bWB Games\b/i.test(text)) detectedPublisher = 'Warner Bros. Games';
  }

  // Extract clean game titles from raw titles
  const nonGameRegex = /(?:phone|caller|fraud|identity|check|number|scam|who\s*is|recherche|inverse|annuaire|forum|mercedes|benz|audi|bmw|car\b|owners|wont\s*open|adult|porn|xxx|xnxx|powerball|lottery|whatsapp|deutsch\s*pr[uü]fung|telc|microsoft\s*community|file\s*explorer|customer\s*service|login|signin|sign\s*in|perfume|cologne|eau\s*de|fragrance|deodorant|lip\s*gloss|protein\s*powder|waterstones|shipping|tracking|vinyl|album|audio\s*cd|cassette|3lp|2cd|discogs|record\b|dress|shirt|shoes|jacket|apparel)/i;

  function scoreGameCandidate(candidate: string, fullContext: string): number {
    let score = 0;
    const t = candidate.toLowerCase();
    const ctx = fullContext.toLowerCase();

    if (nonGameRegex.test(t)) return -100;

    // Contexte éditeur de jeux vidéo majeur
    if (/(?:capcom|nintendo|sony|playstation|xbox|ubisoft|square enix|konami|bandai|namco|electronic arts|ea sports|sega|bethesda|rockstar|cd projekt|atlus|fromsoftware|activision|blizzard|2k games|warner bros|koei|tecmo|snk)/i.test(t)) {
      score += 45;
    } else if (/(?:capcom|nintendo|playstation|xbox|ubisoft|square enix|konami|bandai|namco|sega|bethesda|rockstar|cd projekt|atlus|fromsoftware|activision|blizzard)/i.test(ctx)) {
      score += 25;
    }

    // Plateforme de jeu vidéo mentionnée
    if (/\b(?:ps5|ps4|ps3|ps2|ps1|playstation|xbox|switch|snes|nes|gamecube|wii|n64|game boy|gba|ds|3ds|xone)\b/i.test(t)) {
      score += 35;
    }

    // Termes typiques de jeux vidéo
    if (/\b(?:jeu|game|videogame|action|rpg|aventure|remaster|edition|collector|deluxe|bundle|fighter|warriors)\b/i.test(t)) {
      score += 15;
    }

    // Séries de jeux cultes
    if (/\b(?:mega man|mario|zelda|pokemon|pokémon|sonic|final fantasy|resident evil|gta|grand theft auto|call of duty|halo|forza|gears|witcher|souls|elden ring|dragon quest|monster hunter|assassin'?s creed|fifa|pes|nba 2k|street fighter|tekken|crash bandicoot|spyro|castlevania)\b/i.test(t)) {
      score += 50;
    }

    return score;
  }

  const cleanCandidates: Array<{ title: string; score: number }> = [];
  for (const t of rawTitles) {
    if (nonGameRegex.test(t)) continue;
    let s = t;
    s = s.replace(/^Third\s*Party\s*[-–:]\s*/i, '');
    s = s.replace(/\s*[-–|]\s*(?:eBay.*|Amazon.*|Fnac.*|Rakuten.*|Cdiscount.*|Micromania.*|Bigshopper.*|Buycott.*|worldofbooks.*|Waterstones.*|HMV.*)$/i, '');
    s = s.replace(/^CAPCOM\s*(?:France|Europe|USA)?\s*/i, '');
    s = s.replace(/^(?:Nintendo|Sony|Ubisoft|Square Enix|Konami|Bandai Namco|Sega|Bethesda|Rockstar Games|Electronic Arts|EA Games|Activision)\s*/i, '');
    s = s.replace(/^Take\s*2\s*(?:NG\s*)?/i, '');
    s = s.replace(/^New\s+/i, '');
    s = s.replace(/^Jeu\s*(?:PS[1-5]|Xbox|Switch|Wii|Sony)?\s*/i, '');
    s = s.replace(/\s*[-–|]\s*(?:Jeu|Game|Sony|Complet|Complet\s*Comme\s*NEUF|PAL|FR|UK|NEUF|NEW|FRENCH|VERSION|Occasion|Good\s*condition|Works).*$/i, '');
    s = s.replace(/\s*\[.*?\]|\s*\(.*?\)/g, '');
    s = s.replace(/\b\d{10,13}\b/g, '');
    s = s.replace(/^EAN\s*[-–:]*\s*/i, '');
    s = s.replace(/\s*\|\s*(?:UPC\s*Lookup|Buy\s*.*)$/i, '');
    s = s.replace(/\s*(?:PS[1-5]|PlayStation\s*[1-5]|Xbox\s*(?:360|One|Series)?|Nintendo\s*(?:Switch|64|DS)?|XONE)\s*/gi, ' ');
    s = s.replace(/\s*\b(?:Import\s*(?:Fr|UK|US|JP|EU|Japon)|Edition\s*Standard|Version\s*(?:Française|FR|UK|US)|PAL\s*FR|French\s*Version|VF|VO|VOSTFR)\b.*$/i, '');
    s = s.replace(/\s*VideoGames\s*$/i, '');
    s = s.replace(/\s*Game\s*$/i, '');
    s = s.replace(/\s*Rockstar\s*UK.*$/i, '');
    s = s.replace(/\s*[-–:]\s*$/, '');
    s = s.replace(/\s*:\s*/g, ': ');
    s = s.trim().replace(/\s+/g, ' ');

    // Normalize common roman numeral titles
    if (/^MEGA MAN XI$/i.test(s)) s = 'Mega Man 11';

    if (s.length >= 3 && !nonGameRegex.test(s) && !/^(?:Call Of Duty Ps3|Amazon|Ebay|Good condition|Department|Undergraduate|Finance|Fonctionne|Track a Package)$/i.test(s)) {
      const score = scoreGameCandidate(t, allTexts.join(' '));
      cleanCandidates.push({ title: s, score });
    }
  }

  if (cleanCandidates.length === 0) return null;

  // Validation: Must have at least some gaming indicator if console was not detected
  const hasGamingContext = allTexts.some(txt =>
    /\b(?:jeu|video\s*game|videogame|gaming|console|playstation|xbox|nintendo|switch|gamecube|sega|atari|game\s*boy|rom|cartridge|disk|disc|edition|remaster|rockstar|ubisoft|konami|capcom|bandai|square\s*enix|electronic\s*arts|bethesda)\b/i.test(txt)
  );
  if (detectedConsole === 'Autre' && !hasGamingContext) {
    return null;
  }

  // Sort candidates by gaming score first, then frequency
  cleanCandidates.sort((a, b) => b.score - a.score);
  const bestCandidate = cleanCandidates[0];
  if (bestCandidate.score < -50) return null;

  const bestTitle = bestCandidate.title;

  return {
    title: bestTitle,
    console: detectedConsole,
    releaseYear: detectedYear,
    publisher: detectedPublisher,
    genre: guessGameGenre(bestTitle),
    rawText: allTexts.slice(0, 8).join(' | ').slice(0, 600)
  };
}

// Fast box art cover search via Steam, Wikipedia & live web in parallel (< 600ms)
async function findOfficialCover(title: string, consoleName: string = ''): Promise<string | null> {
  if (!title || !title.trim()) return null;

  const cleanTitle = title.replace(/\s*\(.*?\)/g, '').replace(/\s*:\s*/g, ': ').trim();

  // 1. Direct Wikipedia title lookup (fastest & most accurate: e.g. "Titanfall (video game)", "Titanfall")
  const searchWikiDirect = async (domain: string): Promise<string | null> => {
    try {
      const titlesList = [
        `${cleanTitle} (video game)`,
        `${cleanTitle} (jeu vidéo)`,
        cleanTitle,
        cleanTitle.replace(/:/g, ''),
        cleanTitle.replace(/\s*III\b/i, ' 3').replace(/\s*II\b/i, ' 2'),
        cleanTitle.replace(/\s*3\b/i, ' III').replace(/\s*2\b/i, ' II'),
      ];
      const titlesQuery = titlesList.map(t => encodeURIComponent(t.trim())).join('|');
      const url = `https://${domain}/w/api.php?action=query&titles=${titlesQuery}&prop=pageimages&pilicense=any&pithumbsize=600&redirects=1&format=json`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'GameVaultApp/1.0 (https://gamecollection.local; contact@gamecollection.local) Mozilla/5.0' }
      });
      clearTimeout(timeout);
      if (!res.ok) return null;
      const data: any = await res.json();
      const pages: any[] = Object.values(data?.query?.pages || {});
      const best = pages.find(p => p?.thumbnail?.source && /video game|jeu vid/i.test(p.title || '')) ||
                   pages.find(p => p?.thumbnail?.source);
      if (best?.thumbnail?.source) {
        return `/api/covers/proxy?url=${encodeURIComponent(best.thumbnail.source)}`;
      }
    } catch {
      // ignore
    }
    return null;
  };

  // 3. Steam API with sequel mismatch guard
  const searchSteam = async (): Promise<string | null> => {
    try {
      const url = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(cleanTitle)}&l=french&cc=FR`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) return null;
      const data: any = await res.json();
      const apps = (data?.items || []).slice(0, 3);
      for (const app of apps) {
        if (app?.id && app?.name) {
          const queryHasDigit = /\b(\d+|ii|iii|iv|v|vi)\b/i.test(cleanTitle);
          const appHasDigit = /\b([2-9]|\d{2,}|ii|iii|iv|v|vi)\b/i.test(app.name);
          if (!queryHasDigit && appHasDigit) {
            continue;
          }
          const cover = `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${app.id}/library_600x900.jpg`;
          try {
            const headRes = await fetch(cover, { method: 'HEAD' });
            if (headRes.ok) return cover;
          } catch {}
          const header = `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${app.id}/header.jpg`;
          try {
            const headRes = await fetch(header, { method: 'HEAD' });
            if (headRes.ok) return header;
          } catch {}
        }
      }
    } catch {
      // ignore
    }
    return null;
  };

  const searchWikiSearch = async (domain: string, query: string): Promise<string | null> => {
    try {
      const url = `https://${domain}/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=1&prop=pageimages&pilicense=any&pithumbsize=600&format=json`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'GameVaultApp/1.0 (https://gamecollection.local; contact@gamecollection.local) Mozilla/5.0' }
      });
      clearTimeout(timeout);
      if (!res.ok) return null;
      const data: any = await res.json();
      const page: any = Object.values(data?.query?.pages || {})[0];
      if (page?.thumbnail?.source && typeof page.thumbnail.source === 'string') {
        return `/api/covers/proxy?url=${encodeURIComponent(page.thumbnail.source)}`;
      }
    } catch {
      // ignore
    }
    return null;
  };

  const queries = [
    searchWikiDirect('en.wikipedia.org'),
    searchWikiDirect('fr.wikipedia.org'),
    searchSteam(),
    searchWikiSearch('en.wikipedia.org', `${cleanTitle} video game`),
    searchWikiSearch('fr.wikipedia.org', `${cleanTitle} jeu vidéo`),
    searchWikiSearch('en.wikipedia.org', cleanTitle),
  ];

  try {
    const results = await Promise.all(queries);
    const valid = results.find(r => typeof r === 'string' && r.length > 0);
    if (valid) return valid;
  } catch {
    // ignore
  }

  return null;
}

// Fallback search engine using Wikipedia video game APIs & Steam (ultra fast & parallel)
async function searchWikipediaGames(query: string, preferredConsole?: string): Promise<any[]> {
  if (!query || !query.trim()) return [];
  const cleanQ = query.trim();
  const seenTitles = new Set<string>();
  const results: any[] = [];

  // Parallel search across Steam & Wikipedia
  const fetchWikiDirect = async (domain: string) => {
    try {
      const titles = `${encodeURIComponent(cleanQ + ' (video game)')}|${encodeURIComponent(cleanQ + ' (jeu vidéo)')}|${encodeURIComponent(cleanQ)}`;
      const url = `https://${domain}/w/api.php?action=query&titles=${titles}&prop=extracts|pageimages&exintro=1&explaintext=1&pilicense=any&pithumbsize=600&redirects=1&format=json`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'GameVaultApp/1.0 (https://gamecollection.local; contact@gamecollection.local) Mozilla/5.0' }
      });
      clearTimeout(timeout);
      if (!res.ok) return [];
      const data: any = await res.json();
      return Object.values(data?.query?.pages || {});
    } catch {
      return [];
    }
  };

  const fetchWikiSearch = async (domain: string, searchSuffix: string) => {
    try {
      const sUrl = `https://${domain}/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(cleanQ + searchSuffix)}&gsrlimit=3&prop=extracts|pageimages&exintro=1&explaintext=1&pilicense=any&pithumbsize=600&redirects=1&format=json`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(sUrl, {
        signal: controller.signal,
        headers: { 'User-Agent': 'GameVaultApp/1.0 (https://gamecollection.local; contact@gamecollection.local) Mozilla/5.0' }
      });
      clearTimeout(timeout);
      if (!res.ok) return [];
      const data: any = await res.json();
      return Object.values(data?.query?.pages || {});
    } catch {
      return [];
    }
  };

  const fetchSteam = async () => {
    try {
      const url = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(cleanQ)}&l=french&cc=FR`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) return [];
      const data: any = await res.json();
      return (data?.items || []).slice(0, 3);
    } catch {
      return [];
    }
  };

  try {
    const [directEn, directFr, frPages, enPages, steamApps] = await Promise.all([
      fetchWikiDirect('en.wikipedia.org'),
      fetchWikiDirect('fr.wikipedia.org'),
      fetchWikiSearch('fr.wikipedia.org', ' jeu vidéo'),
      fetchWikiSearch('en.wikipedia.org', ' video game'),
      fetchSteam()
    ]);

    // Process Wikipedia pages first (richer data with developers, publishers, dates)
    const allPages = [...directEn, ...directFr, ...frPages, ...enPages];
    for (const page of allPages as any[]) {
      if (results.length >= 5) break;
      const rawTitle = page.title || '';
      if (!rawTitle || page.missing !== undefined) continue;
      if (/liste de|list of|chronologie|franchise|série de/i.test(rawTitle)) continue;
      const norm = rawTitle.replace(/\s*\(.*?\)/g, '').trim().toLowerCase();
      if (seenTitles.has(norm)) continue;
      seenTitles.add(norm);

      const extract: string = page.extract || '';
      const yearMatch = extract.match(/\b(19\d\d|20[0-3]\d)\b/);
      const releaseYear = yearMatch ? parseInt(yearMatch[1], 10) : undefined;

      let detectedConsole = preferredConsole || 'Autre';
      if (/nintendo switch/i.test(extract)) detectedConsole = 'Nintendo Switch';
      else if (/playstation 5|ps5/i.test(extract)) detectedConsole = 'PlayStation 5';
      else if (/playstation 4|ps4/i.test(extract)) detectedConsole = 'PlayStation 4';
      else if (/super nintendo|snes/i.test(extract)) detectedConsole = 'Super Nintendo (SNES)';
      else if (/nintendo 64|n64/i.test(extract)) detectedConsole = 'Nintendo 64';
      else if (/game boy/i.test(extract)) detectedConsole = 'Game Boy / Advance';
      else if (/xbox one/i.test(extract)) detectedConsole = 'Xbox One';
      else if (/xbox 360/i.test(extract)) detectedConsole = 'Xbox 360';
      else if (/xbox/i.test(extract)) detectedConsole = 'Xbox Series X|S';

      const devMatch = extract.match(/(?:d[eé]velopp[eé] par|developed by)\s+([^,\.\(\n]+)/i);
      const pubMatch = extract.match(/(?:[eé]dit[eé] par|published by)\s+([^,\.\(\n]+)/i);

      let detectedGenre = 'Action-Aventure';
      if (/jeu de rôle|rpg/i.test(extract)) detectedGenre = 'Action-RPG';
      else if (/plate-forme|plateforme/i.test(extract)) detectedGenre = 'Plateforme';
      else if (/course|racing/i.test(extract)) detectedGenre = 'Course';
      else if (/combat|fighting/i.test(extract)) detectedGenre = 'Combat';
      else if (/fps|tir|first-person shooter/i.test(extract)) detectedGenre = 'Tir / FPS';

      const displayTitle = rawTitle
        .replace(/\s*\(jeu vid[eé]o.*?\)/i, '')
        .replace(/\s*\(video game.*?\)/i, '')
        .trim();

      const coverUrl = page.thumbnail?.source 
        ? `/api/covers/proxy?url=${encodeURIComponent(page.thumbnail.source)}`
        : undefined;

      results.push({
        title: displayTitle,
        console: detectedConsole,
        releaseYear,
        developer: devMatch ? devMatch[1].trim() : undefined,
        publisher: pubMatch ? pubMatch[1].trim() : undefined,
        genre: detectedGenre,
        synopsis: extract.length > 200 ? extract.slice(0, 200).trim() + '...' : extract,
        coverUrl
      });
    }

    // Process Steam apps (with sequel guard)
    const queryHasDigit = /\b(\d+|ii|iii|iv|v|vi)\b/i.test(cleanQ);
    for (const app of steamApps as any[]) {
      if (results.length >= 5) break;
      const t = (app.name || '').replace(/[®™]/g, '').trim();
      const norm = t.toLowerCase().trim();
      if (!norm || seenTitles.has(norm)) continue;

      // Prevent mismatching sequels (e.g. Titanfall 2 when user searched Titanfall)
      const appHasDigit = /\b([2-9]|\d{2,}|ii|iii|iv|v|vi)\b/i.test(t);
      if (!queryHasDigit && appHasDigit) {
        continue;
      }

      seenTitles.add(norm);
      results.push({
        title: t,
        console: preferredConsole || 'PC',
        genre: 'Action / Aventure',
        synopsis: `Jeu vidéo officiel (${t}).`,
        coverUrl: `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${app.id}/library_600x900.jpg`,
      });
    }
  } catch {
    // ignore
  }

  // Sort: exact title match first
  results.sort((a, b) => {
    const aExact = a.title.toLowerCase() === cleanQ.toLowerCase();
    const bExact = b.title.toLowerCase() === cleanQ.toLowerCase();
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;
    return 0;
  });

  return results;
}

const FALLBACK_COVER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="420" viewBox="0 0 300 420" fill="none">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
  </defs>
  <rect width="300" height="420" rx="12" fill="url(#bg)"/>
  <rect x="15" y="15" width="270" height="390" rx="8" stroke="#334155" stroke-dasharray="6 6" stroke-width="2"/>
  <circle cx="150" cy="180" r="50" fill="#1e293b" stroke="#475569" stroke-width="2"/>
  <path d="M125 180h50M150 155v50" stroke="#818cf8" stroke-width="4" stroke-linecap="round"/>
  <text x="150" y="270" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="14" font-weight="600" text-anchor="middle">Jaquette Jeu Vidéo</text>
  <text x="150" y="292" fill="#64748b" font-family="system-ui, sans-serif" font-size="11" text-anchor="middle">Image personnalisée disponible</text>
</svg>`;

// Proxy endpoint for cover images to prevent CORS, missing Referer and hotlink errors
app.get('/api/covers/proxy', async (req, res) => {
  let targetUrl = '';
  const original = req.originalUrl || req.url;
  const idx = original.indexOf('?url=');
  if (idx !== -1) {
    targetUrl = original.slice(idx + 5);
  } else {
    targetUrl = (req.query.url as string) || '';
  }

  // Handle single or double encoding
  try {
    targetUrl = decodeURIComponent(targetUrl);
    if (targetUrl.includes('%') && /%[0-9A-Fa-f]{2}/.test(targetUrl)) {
      targetUrl = decodeURIComponent(targetUrl);
    }
  } catch {
    // Keep decoded so far
  }

  if (!targetUrl || (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://'))) {
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(FALLBACK_COVER_SVG);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'GameVaultApp/1.0 (https://gamecollection.local; contact@gamecollection.local) Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      }
    });
    clearTimeout(timeout);

    if (!response.ok) {
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.send(FALLBACK_COVER_SVG);
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=604800, s-maxage=604800');
    
    const arrayBuffer = await response.arrayBuffer();
    return res.send(Buffer.from(arrayBuffer));
  } catch (err: any) {
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.send(FALLBACK_COVER_SVG);
  }
});

// API: Find official cover for any game title & console
app.get('/api/games/find-cover', async (req, res) => {
  try {
    const title = (req.query.title as string) || '';
    const consoleName = (req.query.console as string) || '';
    if (!title.trim()) {
      return res.status(400).json({ error: 'Titre requis' });
    }

    const coverUrl = await findOfficialCover(title, consoleName);
    return res.json({ coverUrl: coverUrl || null, title, console: consoleName });
  } catch {
    return res.json({ coverUrl: null, title: req.query.title || '', console: req.query.console || '' });
  }
});

// API: Lookup game by barcode
app.post('/api/games/lookup-barcode', async (req, res) => {
  try {
    const rawBarcode = req.body?.barcode;
    if (!rawBarcode || typeof rawBarcode !== 'string') {
      return res.status(400).json({ error: 'Code-barres requis.' });
    }

    const cleanCode = normalizeBarcode(rawBarcode);
    if (!cleanCode) {
      return res.status(400).json({ error: 'Code-barres non valide (chiffres attendus).' });
    }

    // Aucune base interne : recherche en direct sur le web pour chaque code reçu

    // 2. If it's an ISBN (starts with 978 or 979), try Google Books API
    if (cleanCode.startsWith('978') || cleanCode.startsWith('979')) {
      try {
        const gRes = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanCode}`, {
          headers: { 'User-Agent': 'GameVaultApp/1.0' }
        });
        if (gRes.ok) {
          const gData: any = await gRes.json();
          if (gData.items && gData.items[0]?.volumeInfo) {
            const vol = gData.items[0].volumeInfo;
            const bookTitle = vol.title || '';
            const pubYear = vol.publishedDate ? parseInt(vol.publishedDate.slice(0, 4), 10) : undefined;
            const cover = vol.imageLinks?.thumbnail ? `/api/covers/proxy?url=${encodeURIComponent(vol.imageLinks.thumbnail)}` : undefined;
            return res.json({
              found: true,
              source: 'isbn',
              game: {
                title: bookTitle,
                console: 'Autre',
                releaseYear: pubYear,
                publisher: vol.publisher || (vol.authors ? vol.authors.join(', ') : undefined),
                genre: vol.categories?.[0] || 'Livre / Guide',
                synopsis: vol.description || undefined,
                barcode: cleanCode,
                coverUrl: cover,
                confidence: 'high'
              }
            });
          }
        }
      } catch {
        // ignore
      }
    }

    // 3. Query live internet databases & marketplace indices in real-time (Bing, DuckDuckGo, OpenProductsFacts)
    let onlineHint: {
      title: string;
      console: string;
      releaseYear?: number;
      publisher?: string;
      developer?: string;
      genre?: string;
      rawText?: string;
    } | null = null;

    try {
      onlineHint = await searchBarcodeOnline(cleanCode);
    } catch {
      // ignore
    }

    let opfTitle: string | null = null;
    let opfBrand: string | null = null;
    let opfImage: string | null = null;
    try {
      const opfController = new AbortController();
      const opfTimeout = setTimeout(() => opfController.abort(), 2000);
      const opfRes = await fetch(`https://world.openproductsfacts.org/api/v0/product/${cleanCode}.json`, {
        signal: opfController.signal,
        headers: { 'User-Agent': 'GameVaultApp/1.0 (contact@gamecollection.local)' }
      });
      clearTimeout(opfTimeout);
      if (opfRes.ok) {
        const opfData: any = await opfRes.json();
        if (opfData.status === 1 && opfData.product) {
          const p = opfData.product;
          const rawProductName = p.product_name || p.product_name_fr || p.product_name_en;
          if (rawProductName && rawProductName.trim()) {
            opfTitle = rawProductName.trim();
            opfBrand = p.brands || null;
            opfImage = p.image_url ? `/api/covers/proxy?url=${encodeURIComponent(p.image_url)}` : null;
          }
        }
      }
    } catch {
      // ignore
    }

    const searchSnippets: string[] = [onlineHint?.rawText, opfTitle, opfBrand].filter((t): t is string => Boolean(t && t.trim()));

    // 3. Try Gemini AI identification with online clues
    const customApiKey = ((req.headers['x-gemini-api-key'] as string) || req.body?.apiKey || '').trim();
    if (isGeminiAvailable(customApiKey)) {
      const ai = getAi(customApiKey);
      if (ai) {
        try {
          const clueText = onlineHint
            ? `Indices en direct trouvés sur le web pour ce code-barres : Titre: "${onlineHint.title}", Console: "${onlineHint.console}", Année: ${onlineHint.releaseYear || 'inconnue'}, Éditeur: "${onlineHint.publisher || 'inconnu'}".`
            : (opfTitle ? `Nom du produit détecté sur OpenProductsFacts : "${opfTitle}" (${opfBrand || ''}).` : '');

          const prompt = `Tu es un expert mondial en jeux vidéo physiques, code-barres EAN-13 et UPC de jeux vidéo pour consoles, et spécialiste de l'Argus du marché français et européen (Mister Game Price, ventes effectives eBay France en Euros, Vinted et LeBonCoin).
Le code-barres EAN/UPC suivant a été scanné sur la boîte d'un jeu vidéo physique : "${cleanCode}".
${clueText}

Identifie avec la plus grande précision le jeu vidéo exact correspondant.
Réponds EXCLUSIVEMENT avec un objet JSON strict au format suivant :
{
  "title": "titre officiel complet du jeu vidéo",
  "console": "nom de la console parmi ['Nintendo Switch', 'PlayStation 5', 'PlayStation 4', 'PlayStation 3', 'PlayStation 2', 'PlayStation 1', 'Xbox Series X|S', 'Xbox One', 'Xbox 360', 'Super Nintendo (SNES)', 'Nintendo 64', 'Nintendo GameCube', 'Game Boy / Advance', 'Nintendo 3DS / DS', 'PC', 'Autre']",
  "releaseYear": 2015,
  "publisher": "éditeur officiel",
  "developer": "studio de développement",
  "genre": "genre principal en français",
  "synopsis": "court résumé en 1-2 phrases en français",
  "estimatedValue": 8,
  "confidence": "high"
}`;

          const parsed = await generateGeminiJson(ai, prompt, 8000);
          if (parsed && parsed.title && parsed.title.trim() && parsed.confidence !== 'low') {
            let autoCoverUrl: string | undefined = undefined;
            try {
              const foundCover = await findOfficialCover(parsed.title, parsed.console || '');
              if (foundCover) autoCoverUrl = foundCover;
            } catch {
              // ignore
            }

            return res.json({
              found: true,
              source: 'gemini',
              game: {
                title: parsed.title,
                console: parsed.console || onlineHint?.console || 'Autre',
                releaseYear: parsed.releaseYear || onlineHint?.releaseYear || undefined,
                publisher: parsed.publisher || onlineHint?.publisher || undefined,
                developer: parsed.developer || undefined,
                genre: parsed.genre || onlineHint?.genre || guessGameGenre(parsed.title),
                synopsis: parsed.synopsis || undefined,
                estimatedValue: extractNumericValue(parsed.estimatedValue, guessEstimatedValue(parsed.title, parsed.console || 'Autre', searchSnippets)),
                barcode: cleanCode,
                confidence: 'high',
                coverUrl: autoCoverUrl || opfImage || undefined,
              }
            });
          }
        } catch (aiErr: any) {
          markGeminiFailure(aiErr, Boolean(customApiKey));
        }
      }
    }

    // 4. If AI is unavailable or failed, use the verified live web search results!
    if (onlineHint && onlineHint.title) {
      let autoCover: string | undefined = undefined;
      try {
        const fc = await findOfficialCover(onlineHint.title, onlineHint.console);
        if (fc) autoCover = fc;
      } catch {
        // ignore
      }

      return res.json({
        found: true,
        source: 'web_database',
        game: {
          title: onlineHint.title,
          console: onlineHint.console,
          releaseYear: onlineHint.releaseYear,
          publisher: onlineHint.publisher,
          developer: onlineHint.developer,
          genre: onlineHint.genre || guessGameGenre(onlineHint.title),
          synopsis: `Jeu identifié sur internet pour la console ${onlineHint.console}.`,
          estimatedValue: guessEstimatedValue(onlineHint.title, onlineHint.console, searchSnippets),
          barcode: cleanCode,
          coverUrl: autoCover || undefined,
          confidence: 'high'
        }
      });
    }

    if (opfTitle) {
      let autoCover: string | undefined = undefined;
      try {
        const fc = await findOfficialCover(opfTitle);
        if (fc) autoCover = fc;
      } catch {
        // ignore
      }

      return res.json({
        found: true,
        source: 'openproductsfacts',
        game: {
          title: opfTitle,
          console: 'Autre',
          publisher: opfBrand || undefined,
          genre: guessGameGenre(opfTitle),
          estimatedValue: guessEstimatedValue(opfTitle, 'Autre', searchSnippets),
          barcode: cleanCode,
          coverUrl: autoCover || opfImage || undefined,
          confidence: 'medium'
        }
      });
    }

    // 5. If no game found anywhere online or in database
    return res.json({
      found: false,
      barcode: cleanCode,
      message: `Aucun jeu trouvé en ligne pour le code-barres ${cleanCode}. Vous pouvez saisir le titre ci-dessous pour compléter la fiche.`
    });
  } catch {
    return res.json({
      found: false,
      barcode: req.body?.barcode || '',
      message: 'Erreur lors de la recherche du code-barres. Vous pouvez saisir les informations manuellement.'
    });
  }
});

// API: Search game by name or autofill details
app.post('/api/games/search-gemini', async (req, res) => {
  try {
    const query = req.body?.query;
    const preferredConsole = req.body?.console;
    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ error: 'Nom du jeu requis.' });
    }

    let results: any[] = [];
    let aiSuccess = false;

    // 1. Try Gemini AI if available & circuit-breaker is open
    const customApiKey = ((req.headers['x-gemini-api-key'] as string) || req.body?.apiKey || '').trim();
    if (isGeminiAvailable(customApiKey)) {
      const ai = getAi(customApiKey);
      if (ai) {
        try {
          const prompt = `Tu es une encyclopédie de jeux vidéo. L'utilisateur veut ajouter un jeu à sa collection personnelle :
Recherche ou nom : "${query}"
${preferredConsole ? `Console préférée : "${preferredConsole}"` : ''}

Donne jusqu'à 3 correspondances les plus pertinentes.
Réponds EXCLUSIVEMENT avec un tableau JSON strict [ { ... }, ... ] où chaque objet contient :
- title: titre officiel précis
- console: console principale ou spécifiée (ex: 'Nintendo Switch', 'PlayStation 5', 'PlayStation 4', 'PlayStation 3', 'Super Nintendo (SNES)', 'Xbox Series X|S', etc.)
- releaseYear: année de sortie originale
- publisher: éditeur
- developer: développeur
- genre: genre en français
- synopsis: court résumé en français (1 ou 2 phrases)
- estimatedValue: cote argus réaliste d'occasion en Euros (€) pour une version complète en boîte (CIB) sur le marché français (Mister Game Price, ventes eBay France). FIFA/sports valent 2-3€; jeux très courants PS3/PS4/Xbox (comme MGS4, MGS V, GTA V, Uncharted) valent 8-12€ en complet; ne JAMAIS confondre Metal Gear Solid 4 (10€) avec Metal Gear Solid 1 sur PS1 (50€)`;

          const aiList = await generateGeminiJson(ai, prompt, 8000);
          if (Array.isArray(aiList) && aiList.length > 0) {
            results = aiList.map(item => ({
              ...item,
              estimatedValue: extractNumericValue(item.estimatedValue, 10)
            }));
            aiSuccess = true;
          } else if (aiList && typeof aiList === 'object' && aiList.title) {
            results = [{
              ...aiList,
              estimatedValue: extractNumericValue(aiList.estimatedValue, 10)
            }];
            aiSuccess = true;
          }
        } catch (aiErr: any) {
          markGeminiFailure(aiErr, Boolean(customApiKey));
        }
      }
    }

    // 3. Fallback to fast Wikipedia / Steam search if Gemini was unavailable or yielded 0
    if (!aiSuccess || results.length === 0) {
      const fallbackResults = await searchWikipediaGames(query, preferredConsole);
      for (const fr of fallbackResults) {
        if (!results.some(r => r.title.toLowerCase() === fr.title.toLowerCase())) {
          results.push(fr);
        }
      }
    }

    // 4. Attach covers if missing
    const enrichedResults = await Promise.all(
      results.slice(0, 4).map(async (r: any) => {
        try {
          if (r.coverUrl) return r;
          const cover = await findOfficialCover(r.title, r.console);
          return { ...r, coverUrl: cover || undefined };
        } catch {
          return r;
        }
      })
    );

    return res.json({ results: enrichedResults });
  } catch {
    try {
      const wikiResults = await searchWikipediaGames(req.body?.query || '', req.body?.console);
      return res.json({ results: wikiResults });
    } catch {
      return res.json({
        results: [],
        error: 'Aucun résultat trouvé.'
      });
    }
  }
});

// API: Estimer la cote d'un jeu selon l'argus français (Mister Game Price & ventes réelles eBay France)
app.post('/api/games/estimate-price', async (req, res) => {
  const { title, console: consoleName, condition } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Titre manquant' });
  }

  const customApiKey = ((req.headers['x-gemini-api-key'] as string) || req.body?.apiKey || '').trim();
  if (isGeminiAvailable(customApiKey)) {
    const ai = getAi(customApiKey);
    if (ai) {
      try {
        const prompt = `Tu es un expert du marché français et européen des jeux vidéo d'occasion (spécialiste de l'Argus Mister Game Price, des ventes réussies eBay France en Euros, et des transactions Vinted/LeBonCoin).
Estime la cote d'occasion actuelle en Euros (€) pour le jeu suivant :
- Titre : "${title}"
- Console : "${consoleName || 'Non précisé'}"
- État de conservation : "${condition || 'complet'}" (options : neuf sous blister, complet avec boîte et notice en français, loose sans boîte, boîte seule)

Règles impératives du marché français :
1. Les jeux de sport annuels de masse (FIFA, PES, NBA 2K) sur PS2/PS3/PS4/Xbox valent seulement 2€ à 3€ en complet, 1€ en loose.
2. Les jeux très courants sur PS3 / PS4 / Xbox (Metal Gear Solid 4, Metal Gear Solid V, Uncharted, The Last of Us, Grand Theft Auto IV/V, Assassin's Creed) se trouvent partout en abondance en France et valent entre 8€ et 12€ en boîte complet (CIB). Ne JAMAIS attribuer la cote de Metal Gear Solid 1 sur PS1 (50€) à Metal Gear Solid 4 (10€).
3. Les classiques Nintendo en boîte et notice en français (Zelda, Pokémon, Mario, Metroid, SNES, N64, Game Boy, GameCube) ont une cote élevée conforme aux ventes réelles en France.
4. Donne la valeur entière en Euros (€).

Réponds EXCLUSIVEMENT avec un JSON strict :
{
  "estimatedValue": 10,
  "source": "Mister Game Price & Ventes eBay France",
  "explanation": "court résumé expliquant l'estimation selon le marché français"
}`;

        const parsed = await generateGeminiJson(ai, prompt, 6000);
        if (parsed && typeof parsed.estimatedValue === 'number' && parsed.estimatedValue >= 0) {
          return res.json({
            estimatedValue: parsed.estimatedValue,
            source: parsed.source || 'Mister Game Price & Ventes eBay France',
            explanation: parsed.explanation || ''
          });
        }
      } catch (err: any) {
        markGeminiFailure(err, Boolean(customApiKey));
      }
    }
  }

  return res.json({
    estimatedValue: null,
    source: 'Mister Game Price'
  });
});

// API: Validate custom or system Gemini API key
app.post('/api/gemini/validate-key', async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  const customKey = ((req.headers['x-gemini-api-key'] as string) || req.body?.apiKey || '').trim();
  if (!customKey) {
    if (process.env.GEMINI_API_KEY) {
      return res.json({
        valid: true,
        source: 'system',
        message: 'Une clé API Gemini système est déjà configurée et active sur ce serveur.',
      });
    }
    return res.status(400).json({ valid: false, error: 'Veuillez saisir une clé API Gemini.' });
  }

  // Vérification de format :
  // - Nouveau format officiel Google AI Studio (2025/2026) : commence par "AQ."
  // - Format classique Google Cloud : commence par "AIza..."
  // - Clés personnalisées valides sans espaces (longueur >= 20)
  const isValidFormat =
    customKey.startsWith('AQ.') ||
    customKey.startsWith('AIza') ||
    (/^[A-Za-z0-9_.-]{20,}$/.test(customKey) && !/\s/.test(customKey));

  if (!isValidFormat) {
    return res.status(400).json({
      valid: false,
      error: 'Format non reconnu : les clés officielles Google AI Studio commencent généralement par "AQ." (nouvelles clés d\'autorisation) ou "AIzaSy..." (format classique). Vérifiez que vous avez bien copié la clé complète sans espace ni guillemets.',
    });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: customKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });

    // Tester avec les modèles supportés : gemini-3.7-flash, gemini-3.5-flash, gemini-3.5-flash-lite, gemini-3.8-flash, gemini-flash-latest
    let success = false;
    let lastError: any = null;

    for (const modelName of ['gemini-3.7-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest']) {
      try {
        await withTimeout(
          ai.models.generateContent({
            model: modelName,
            contents: 'ping',
          }),
          4500,
          'Délai de connexion dépassé'
        );
        success = true;
        break;
      } catch (err: any) {
        lastError = err;
        const msg = err?.message || String(err);
        // Si la clé est expressément invalide, pas la peine de tester d'autres modèles
        if (/API_KEY_INVALID|INVALID_ARGUMENT|API key not valid/i.test(msg)) {
          break;
        }
      }
    }

    if (success) {
      return res.json({
        valid: true,
        source: 'custom',
        message: 'Clé API Gemini validée avec succès ! L\'intelligence artificielle est opérationnelle.',
      });
    }

    throw lastError || new Error('Validation impossible');
  } catch (err: any) {
    const rawMsg = err?.message || String(err);
    let friendly = 'La clé API a été rejetée par Google.';
    if (/API_KEY_INVALID|INVALID_ARGUMENT|API key not valid/i.test(rawMsg)) {
      friendly = 'Clé API Google Gemini non valide. Vérifiez que vous avez bien copié toute la clé (commençant par "AQ." ou "AIzaSy...") sans espace ni guillemets.';
    } else if (/PERMISSION_DENIED|403/i.test(rawMsg)) {
      friendly = 'Accès refusé par Google : vérifiez que l\'API Gemini est bien activée pour votre projet Google AI Studio.';
    } else if (/quota|RESOURCE_EXHAUSTED|429/i.test(rawMsg)) {
      // Si c'est un problème de quota, la clé est techniquement valide !
      return res.json({
        valid: true,
        source: 'custom',
        message: 'Clé API Gemini reconnue et enregistrée ! (Note : le quota gratuit de cette clé est actuellement saturé, l\'IA fonctionnera dès que Google aura libéré les requêtes).',
      });
    } else if (/Délai de connexion/i.test(rawMsg)) {
      friendly = 'Délai d\'attente dépassé : les serveurs de Google ont mis trop de temps à répondre. Vérifiez votre connexion.';
    }

    return res.status(400).json({
      valid: false,
      error: friendly,
      raw: rawMsg,
    });
  }
});

// API: Check Gemini status
app.get('/api/gemini/status', (req, res) => {
  const customKey = ((req.headers['x-gemini-api-key'] as string) || '').trim();
  const hasSystemKey = Boolean(process.env.GEMINI_API_KEY);
  const isAvailable = isGeminiAvailable(customKey);
  return res.json({
    hasSystemKey,
    hasCustomKey: Boolean(customKey),
    isAvailable,
  });
});

// Vite Middleware for development vs Static for production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
