import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { BARCODE_CATALOG, lookupBarcodeInCatalog, findGameInCatalog } from './src/data/barcodeCatalog.js';

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
let aiClient: GoogleGenAI | null = null;
function getAi(customKey?: string): GoogleGenAI | null {
  const cleanCustom = customKey ? customKey.trim() : '';
  const key = cleanCustom.length > 5 ? cleanCustom : process.env.GEMINI_API_KEY;
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

// Circuit breaker for Gemini to prevent repeated stalls or errors when quota/auth/dunning is unavailable
let geminiDisabledUntil = 0;
let geminiPermanentlyDisabled = false;

function isGeminiAvailable(customKey?: string): boolean {
  if (customKey && customKey.trim().length > 5) {
    return true; // User provided key, always attempt
  }
  if (geminiPermanentlyDisabled) return false;
  if (Date.now() < geminiDisabledUntil) return false;
  return Boolean(process.env.GEMINI_API_KEY);
}

function markGeminiFailure(err?: any, isCustomKey: boolean = false) {
  if (isCustomKey) return;
  const errMsg = typeof err === 'string' ? err : (err?.message || JSON.stringify(err || ''));
  if (/dunning|PERMISSION_DENIED|403|billing|API_KEY_INVALID|quota/i.test(errMsg)) {
    geminiPermanentlyDisabled = true;
  } else {
    geminiDisabledUntil = Date.now() + 15 * 60 * 1000;
  }
}

// Silent startup probe: check if Gemini API is available on this environment
(async () => {
  if (!process.env.GEMINI_API_KEY) {
    geminiPermanentlyDisabled = true;
    return;
  }
  try {
    const ai = getAi();
    if (ai) {
      await withTimeout(
        ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: 'ping',
        }),
        3000,
        'timeout'
      );
    }
  } catch (err: any) {
    markGeminiFailure(err);
  }
})();

// Combined barcodes database (internal + catalog)
const ALL_BARCODES = BARCODE_CATALOG;

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

// Fast box art cover search via Steam, Wikipedia & local catalog in parallel (< 600ms)
async function findOfficialCover(title: string, consoleName: string = ''): Promise<string | null> {
  if (!title || !title.trim()) return null;

  const cleanTitle = title.replace(/\s*\(.*?\)/g, '').trim();

  // 1. Direct match in local catalog (0ms)
  const localMatch = findGameInCatalog(cleanTitle, consoleName);
  if (localMatch?.coverUrl) {
    return localMatch.coverUrl;
  }

  // 2. Direct Wikipedia title lookup (fastest & most accurate: e.g. "Titanfall (video game)", "Titanfall")
  const searchWikiDirect = async (domain: string): Promise<string | null> => {
    try {
      const titles = `${encodeURIComponent(cleanTitle + ' (video game)')}|${encodeURIComponent(cleanTitle + ' (jeu vidéo)')}|${encodeURIComponent(cleanTitle)}`;
      const url = `https://${domain}/w/api.php?action=query&titles=${titles}&prop=pageimages&pilicense=any&pithumbsize=600&redirects=1&format=json`;
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
      const app = data?.items?.[0];
      if (app?.id && app?.name) {
        const queryHasDigit = /\b(\d+|ii|iii|iv|v|vi)\b/i.test(cleanTitle);
        const appHasDigit = /\b([2-9]|\d{2,}|ii|iii|iv|v|vi)\b/i.test(app.name);
        if (!queryHasDigit && appHasDigit) {
          return null;
        }
        const cover = `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${app.id}/library_600x900.jpg`;
        const headRes = await fetch(cover, { method: 'HEAD' });
        if (headRes.ok) return cover;
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

  // 1. Instant check in local catalog (0ms)
  const localMatch = findGameInCatalog(cleanQ, preferredConsole);
  if (localMatch) {
    seenTitles.add(localMatch.title.toLowerCase());
    results.push(localMatch);
  }

  // 2. Parallel search across Steam & Wikipedia
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

    // 1. Check local catalog first for instant zero-latency match (UPC/EAN/fuzzy)
    const catalogMatch = lookupBarcodeInCatalog(cleanCode);
    if (catalogMatch) {
      return res.json({
        found: true,
        source: 'database',
        game: {
          ...catalogMatch,
          barcode: cleanCode,
          confidence: 'high'
        }
      });
    }

    // 2. If it's an ISBN (starts with 978 or 979), try Google Books
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

    // 3. Try Open Products Facts API with 2s timeout
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
            let autoCover: string | undefined = undefined;
            try {
              const fc = await findOfficialCover(rawProductName);
              if (fc) autoCover = fc;
            } catch {
              // ignore
            }
            return res.json({
              found: true,
              source: 'openproductsfacts',
              game: {
                title: rawProductName.trim(),
                console: 'Autre',
                publisher: p.brands || undefined,
                barcode: cleanCode,
                coverUrl: autoCover || (p.image_url ? `/api/covers/proxy?url=${encodeURIComponent(p.image_url)}` : undefined),
                confidence: 'medium'
              }
            });
          }
        }
      }
    } catch {
      // ignore
    }

    // 4. Try Gemini AI lookup if available & circuit-breaker is open
    const customApiKey = ((req.headers['x-gemini-api-key'] as string) || req.body?.apiKey || '').trim();
    if (isGeminiAvailable(customApiKey)) {
      const ai = getAi(customApiKey);
      if (ai) {
        try {
          const prompt = `Tu es un expert mondial en jeux vidéo physiques, code-barres EAN-13 et UPC de jeux vidéo commerciaux pour consoles, et spécialiste de l'Argus du marché français et européen (Mister Game Price, ventes effectives eBay France en Euros, Vinted et LeBonCoin).
Le code-barres EAN/UPC suivant a été scanné sur la boîte d'un jeu vidéo physique : "${cleanCode}".
Identifie avec la plus grande précision le jeu vidéo exact correspondant :
- title: le titre officiel complet du jeu vidéo
- console: le nom de la console parmi ['Nintendo Switch', 'PlayStation 5', 'PlayStation 4', 'PlayStation 3', 'PlayStation 2', 'PlayStation 1', 'Xbox Series X|S', 'Xbox One', 'Xbox 360', 'Super Nintendo (SNES)', 'Nintendo 64', 'Nintendo GameCube', 'Game Boy / Advance', 'Nintendo 3DS / DS', 'PC', 'Autre']
- releaseYear: année de sortie
- publisher: éditeur officiel
- developer: studio de développement
- genre: genre principal en français
- synopsis: court résumé en 1-2 phrases en français
- estimatedValue: cote argus réaliste d'occasion en Euros (€) pour une version complète en boîte (CIB) sur le marché français (Mister Game Price & ventes conclues eBay France). Attention : les jeux de sport annuels de masse (FIFA, PES, NBA) valent entre 2€ et 3€, tandis que les classiques Nintendo en boîte française (Zelda, Pokémon, Mario) ou RPG rares ont une cote élevée.
- confidence: 'high' | 'medium' | 'low'`;

          const aiResponse = await withTimeout(
            ai.models.generateContent({
              model: 'gemini-3.8-flash',
              contents: prompt,
              config: {
                responseMimeType: 'application/json',
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    console: { type: Type.STRING },
                    releaseYear: { type: Type.INTEGER },
                    publisher: { type: Type.STRING },
                    developer: { type: Type.STRING },
                    genre: { type: Type.STRING },
                    synopsis: { type: Type.STRING },
                    estimatedValue: { type: Type.INTEGER },
                    confidence: { type: Type.STRING }
                  },
                  required: ['title', 'console', 'confidence']
                }
              }
            }),
            5000,
            'Délai de recherche dépassé.'
          );

          const parsed = JSON.parse(aiResponse.text || '{}');
          if (parsed.title && parsed.title.trim() && parsed.confidence !== 'low') {
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
                console: parsed.console || 'Autre',
                releaseYear: parsed.releaseYear || undefined,
                publisher: parsed.publisher || undefined,
                developer: parsed.developer || undefined,
                genre: parsed.genre || undefined,
                synopsis: parsed.synopsis || undefined,
                estimatedValue: typeof parsed.estimatedValue === 'number' && parsed.estimatedValue >= 0 ? parsed.estimatedValue : undefined,
                barcode: cleanCode,
                confidence: parsed.confidence || 'medium',
                coverUrl: autoCoverUrl,
              }
            });
          }
        } catch (aiErr: any) {
          markGeminiFailure(aiErr, Boolean(customApiKey));
        }
      }
    }

    // 5. If not matched automatically, preserve the scanned barcode so the user can easily complete the title
    return res.json({
      found: false,
      barcode: cleanCode,
      message: 'Code-barres scanné avec succès ! Complétez le nom du jeu ci-dessous pour lancer la recherche automatique.'
    });
  } catch {
    return res.json({
      found: false,
      barcode: req.body?.barcode || '',
      message: 'Code-barres scanné. Complétez les informations ci-dessous.'
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

    // 1. First check local catalog for instant zero-latency match
    const localMatch = findGameInCatalog(query, preferredConsole);
    if (localMatch) {
      results.push(localMatch);
    }

    // 2. Try Gemini AI if available & circuit-breaker is open
    const customApiKey = ((req.headers['x-gemini-api-key'] as string) || req.body?.apiKey || '').trim();
    if (isGeminiAvailable(customApiKey)) {
      const ai = getAi(customApiKey);
      if (ai) {
        try {
          const prompt = `Tu es une encyclopédie de jeux vidéo. L'utilisateur veut ajouter un jeu à sa collection personnelle :
Recherche ou nom : "${query}"
${preferredConsole ? `Console préférée : "${preferredConsole}"` : ''}

Donne jusqu'à 3 correspondances les plus pertinentes. Pour chaque jeu, donne :
- title: titre officiel précis
- console: console principale ou spécifiée (ex: 'Nintendo Switch', 'PlayStation 5', 'PlayStation 4', 'Super Nintendo (SNES)', 'Xbox Series X|S', etc.)
- releaseYear: année de sortie originale
- publisher: éditeur
- developer: développeur
- genre: genre en français
- synopsis: court résumé en français (1 ou 2 phrases)
- estimatedValue: cote argus réaliste d'occasion en Euros (€) pour une version complète en boîte (CIB) sur le marché français (Mister Game Price, ventes eBay France). FIFA/sports valent 2-3€; jeux très courants PS3/PS4/Xbox (comme MGS4, MGS V, GTA V, Uncharted) valent 8-12€ en complet; ne JAMAIS confondre Metal Gear Solid 4 (10€) avec Metal Gear Solid 1 sur PS1 (50€)`;

          const aiResponse = await withTimeout(
            ai.models.generateContent({
              model: 'gemini-3.8-flash',
              contents: prompt,
              config: {
                responseMimeType: 'application/json',
                responseSchema: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      console: { type: Type.STRING },
                      releaseYear: { type: Type.INTEGER },
                      publisher: { type: Type.STRING },
                      developer: { type: Type.STRING },
                      genre: { type: Type.STRING },
                      synopsis: { type: Type.STRING },
                      estimatedValue: { type: Type.INTEGER }
                    },
                    required: ['title', 'console']
                  }
                }
              }
            }),
            5000,
            'Délai de recherche dépassé.'
          );

          const aiList = JSON.parse(aiResponse.text || '[]');
          if (Array.isArray(aiList) && aiList.length > 0) {
            results = aiList;
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

Format de réponse JSON attendu :
{
  "estimatedValue": nombre entier en Euros,
  "source": "Mister Game Price & Ventes eBay France",
  "explanation": "court résumé expliquant l'estimation selon le marché français"
}`;

        const aiResponse = await withTimeout(
          ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  estimatedValue: { type: Type.INTEGER },
                  source: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                },
                required: ['estimatedValue']
              }
            }
          }),
          4000,
          'Délai dépassé'
        );

        const parsed = JSON.parse(aiResponse.text || '{}');
        if (typeof parsed.estimatedValue === 'number' && parsed.estimatedValue >= 0) {
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

    // Tester avec le modèle standard gemini-2.5-flash ou gemini-3.8-flash
    let success = false;
    let lastError: any = null;

    for (const modelName of ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-3.8-flash']) {
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
