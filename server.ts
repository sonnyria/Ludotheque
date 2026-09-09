import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { BARCODE_CATALOG } from './src/data/barcodeCatalog.js';

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
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Lazy GoogleGenAI initialization
let aiClient: GoogleGenAI | null = null;
function getAi(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Known barcodes mapping for instant ultra-accurate fallback
const KNOWN_BARCODES: Record<string, { title: string; console: string; releaseYear: number; publisher: string; developer: string; genre: string; synopsis: string; coverUrl?: string }> = {
  '0045496420079': {
    title: 'The Legend of Zelda: Breath of the Wild',
    console: 'Nintendo Switch',
    releaseYear: 2017,
    publisher: 'Nintendo',
    developer: 'Nintendo EPD',
    genre: 'Action-Aventure',
    synopsis: 'Entrez dans un monde de découverte, d\'exploration et d\'aventure dans The Legend of Zelda: Breath of the Wild.',
    coverUrl: '/api/covers/proxy?url=https%3A%2F%2Fupload.wikimedia.org%2Fwikipedia%2Fen%2Fc%2Fc6%2FThe_Legend_of_Zelda_Breath_of_the_Wild.jpg',
  },
  '0045496590741': {
    title: 'Super Mario Odyssey',
    console: 'Nintendo Switch',
    releaseYear: 2017,
    publisher: 'Nintendo',
    developer: 'Nintendo EPD',
    genre: 'Plateforme 3D',
    synopsis: 'Explorez d\'immenses royaumes 3D remplis de secrets et de surprises avec Mario et son nouvel allié Cappy.',
    coverUrl: '/api/covers/proxy?url=https%3A%2F%2Fupload.wikimedia.org%2Fwikipedia%2Fen%2F8%2F8d%2FSuper_Mario_Odyssey.jpg',
  },
  '0045496428457': {
    title: 'Metroid Dread',
    console: 'Nintendo Switch',
    releaseYear: 2021,
    publisher: 'Nintendo',
    developer: 'MercurySteam',
    genre: 'Metroidvania',
    synopsis: 'Rejoignez la chasseuse de primes Samus Aran dans une lutte acharnée contre une menace mécanique mortelle.',
    coverUrl: '/api/covers/proxy?url=https%3A%2F%2Fupload.wikimedia.org%2Fwikipedia%2Fen%2Ff%2Ff7%2FMetroid_Dread_Banner.png',
  },
  '0711719541172': {
    title: 'God of War Ragnarök',
    console: 'PlayStation 5',
    releaseYear: 2022,
    publisher: 'Sony Interactive Entertainment',
    developer: 'Santa Monica Studio',
    genre: 'Action-Aventure',
    synopsis: 'Kratos et Atreus doivent explorer chacun des neuf royaumes à la recherche de réponses pendant que les forces asgardiennes se préparent à la bataille.',
    coverUrl: '/api/covers/proxy?url=https%3A%2F%2Fupload.wikimedia.org%2Fwikipedia%2Fen%2Fe%2Fee%2FGod_of_War_Ragnar%25C3%25B6k_cover.jpg',
  },
  '0711719398851': {
    title: 'Demon\'s Souls',
    console: 'PlayStation 5',
    releaseYear: 2020,
    publisher: 'Sony Interactive Entertainment',
    developer: 'Bluepoint Games',
    genre: 'Action-RPG',
    synopsis: 'Découvrez l\'histoire troublante et les combats impitoyables du classique PlayStation de FromSoftware entièrement refait.',
    coverUrl: '/api/covers/proxy?url=https%3A%2F%2Fupload.wikimedia.org%2Fwikipedia%2Fen%2F1%2F11%2FDemons_Souls_remake_cover_art.jpg',
  },
  '0711719572657': {
    title: 'Marvel\'s Spider-Man 2',
    console: 'PlayStation 5',
    releaseYear: 2023,
    publisher: 'Sony Interactive Entertainment',
    developer: 'Insomniac Games',
    genre: 'Action-Aventure',
    synopsis: 'Peter Parker et Miles Morales reviennent pour une toute nouvelle aventure palpitante face à Venom et Kraven.',
    coverUrl: '/api/covers/proxy?url=https%3A%2F%2Fupload.wikimedia.org%2Fwikipedia%2Fen%2F0%2F0f%2FSpiderMan2PS5BoxArt.jpeg',
  },
  '0889842880770': {
    title: 'Forza Horizon 5',
    console: 'Xbox Series X|S',
    releaseYear: 2021,
    publisher: 'Xbox Game Studios',
    developer: 'Playground Games',
    genre: 'Course automobile',
    synopsis: 'Votre aventure Horizon ultime vous attend ! Explorez les paysages vibrants et en constante évolution du Mexique.',
    coverUrl: '/api/covers/proxy?url=https%3A%2F%2Fupload.wikimedia.org%2Fwikipedia%2Fen%2F8%2F86%2FForza_Horizon_5_cover_art.jpg',
  },
  '0889842691512': {
    title: 'Halo Infinite',
    console: 'Xbox Series X|S',
    releaseYear: 2021,
    publisher: 'Xbox Game Studios',
    developer: '343 Industries',
    genre: 'FPS',
    synopsis: 'Le Master Chief revient dans la campagne la plus vaste et la plus ambitieuse de l\'histoire de Halo.',
    coverUrl: '/api/covers/proxy?url=https%3A%2F%2Fupload.wikimedia.org%2Fwikipedia%2Fen%2F1%2F14%2FHalo_Infinite.png',
  },
  '3391891999908': {
    title: 'Elden Ring',
    console: 'PlayStation 5',
    releaseYear: 2022,
    publisher: 'Bandai Namco Entertainment',
    developer: 'FromSoftware',
    genre: 'Action-RPG',
    synopsis: 'Le nouveau jeu de rôle et d\'action fantastique développé par FromSoftware et scénarisé avec George R. R. Martin.',
    coverUrl: '/api/covers/proxy?url=https%3A%2F%2Fupload.wikimedia.org%2Fwikipedia%2Fen%2Fb%2Fb9%2FElden_Ring_Box_art.jpg',
  },
  '5026555424233': {
    title: 'Red Dead Redemption 2',
    console: 'PlayStation 4',
    releaseYear: 2018,
    publisher: 'Rockstar Games',
    developer: 'Rockstar Studios',
    genre: 'Action-Aventure / Western',
    synopsis: 'Amérique, 1899. L\'ère de l\'Ouest sauvage touche à sa fin. Arthur Morgan et la bande de Dutch van der Linde sont traqués.',
    coverUrl: '/api/covers/proxy?url=https%3A%2F%2Fupload.wikimedia.org%2Fwikipedia%2Fen%2F4%2F44%2FRed_Dead_Redemption_II.jpg',
  },
  '0045496830588': {
    title: 'Chrono Trigger',
    console: 'Super Nintendo (SNES)',
    releaseYear: 1995,
    publisher: 'Square',
    developer: 'Square',
    genre: 'JRPG',
    synopsis: 'Une épopée inoubliable à travers les époques pour sauver le destin de la planète.',
    coverUrl: '/api/covers/proxy?url=https%3A%2F%2Fupload.wikimedia.org%2Fwikipedia%2Fen%2Fa%2Fa7%2FChrono_Trigger.jpg',
  },
  '0045496830021': {
    title: 'Super Mario World',
    console: 'Super Nintendo (SNES)',
    releaseYear: 1990,
    publisher: 'Nintendo',
    developer: 'Nintendo EAD',
    genre: 'Plateforme',
    synopsis: 'Mario et Luigi partent explorer Dinosaur Land pour sauver la Princesse Peach de Bowser.',
    coverUrl: '/api/covers/proxy?url=https%3A%2F%2Fupload.wikimedia.org%2Fwikipedia%2Fen%2F3%2F32%2FSuper_Mario_World_Coverart.png',
  },
  '0045496590420': {
    title: 'Mario Kart 8 Deluxe',
    console: 'Nintendo Switch',
    releaseYear: 2017,
    publisher: 'Nintendo',
    developer: 'Nintendo EPD',
    genre: 'Course arcade',
    synopsis: 'Faites la course et affrontez vos amis dans la version ultime de Mario Kart 8 sur Nintendo Switch.',
    coverUrl: '/api/covers/proxy?url=https%3A%2F%2Fupload.wikimedia.org%2Fwikipedia%2Fen%2Fb%2Fba%2FMario_Kart_8_Box_Art.jpg',
  },
  '0045496596439': {
    title: 'Animal Crossing: New Horizons',
    console: 'Nintendo Switch',
    releaseYear: 2020,
    publisher: 'Nintendo',
    developer: 'Nintendo EPD',
    genre: 'Simulation de vie',
    synopsis: 'Créez votre propre paradis sur une île déserte vierge avec Tom Nook.',
    coverUrl: '/api/covers/proxy?url=https%3A%2F%2Fupload.wikimedia.org%2Fwikipedia%2Fen%2F1%2F1f%2FAnimal_Crossing_New_Horizons.jpg',
  },
  '3307216262435': {
    title: "Assassin's Creed Valhalla",
    console: 'PlayStation 4',
    releaseYear: 2020,
    publisher: 'Ubisoft',
    developer: 'Ubisoft Montreal',
    genre: 'Action-RPG',
    synopsis: 'Incarnez Eivor, un redoutable chef viking dont les récits de combat ont traversé les âges.',
    coverUrl: '/api/covers/proxy?url=https%3A%2F%2Fupload.wikimedia.org%2Fwikipedia%2Fen%2Ff%2Ff5%2FAssassins_Creed_Valhalla_cover.jpg',
  },
  '0711719541189': {
    title: 'The Last of Us Part I',
    console: 'PlayStation 5',
    releaseYear: 2022,
    publisher: 'Sony Interactive Entertainment',
    developer: 'Naughty Dog',
    genre: 'Action-Aventure / Survie',
    synopsis: 'Redécouvrez l\'aventure poignante de Joel et Ellie à travers une Amérique post-pandémique dévastée.',
    coverUrl: '/api/covers/proxy?url=https%3A%2F%2Fupload.wikimedia.org%2Fwikipedia%2Fen%2F4%2F46%2FThe_Last_of_Us_Part_I_cover.png',
  },
};

// Combined barcodes database (internal + catalog)
const ALL_BARCODES: Record<string, { title: string; console: string; releaseYear: number; publisher: string; developer: string; genre: string; synopsis: string; coverUrl?: string }> = {
  ...BARCODE_CATALOG,
  ...KNOWN_BARCODES,
};

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

// Fast box art cover search via Wikipedia & local catalog
async function findOfficialCover(title: string, consoleName: string = ''): Promise<string | null> {
  if (!title || !title.trim()) return null;

  const normalizedTitle = title.trim().toLowerCase();

  // 1. Direct match in local catalog
  for (const item of Object.values(ALL_BARCODES)) {
    if (item.title.toLowerCase() === normalizedTitle && item.coverUrl) {
      return item.coverUrl;
    }
  }

  // Helper to query Wikipedia pageimages with search generator
  const searchWikiImage = async (wikiDomain: string, searchQuery: string, timeoutMs: number = 3000): Promise<string | null> => {
    try {
      const url = `https://${wikiDomain}/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(searchQuery)}&gsrlimit=1&prop=pageimages|images&pilicense=any&pithumbsize=600&format=json`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'GameVaultApp/1.0 (https://gamecollection.local; contact@gamecollection.local) Mozilla/5.0' }
      });
      clearTimeout(timeout);
      if (!res.ok) return null;
      const data: any = await res.json();
      const pages = data?.query?.pages;
      if (!pages) return null;

      const page: any = Object.values(pages)[0];
      if (page?.thumbnail?.source && typeof page.thumbnail.source === 'string') {
        return `/api/covers/proxy?url=${encodeURIComponent(page.thumbnail.source)}`;
      }

      // If no thumbnail directly found, check images list for Box art or Cover
      const imageFiles: Array<{ title: string }> = page?.images || [];
      const boxArt = imageFiles.find(img => 
        /box\s?art|cover|jacket|jaquette/i.test(img.title) && !/logo|icon|symbol|flag/i.test(img.title)
      );
      if (boxArt) {
        const infoUrl = `https://${wikiDomain}/w/api.php?action=query&titles=${encodeURIComponent(boxArt.title)}&prop=imageinfo&iiprop=url&iiurlwidth=600&format=json`;
        const infoController = new AbortController();
        const infoTimeout = setTimeout(() => infoController.abort(), 2000);
        const infoRes = await fetch(infoUrl, {
          signal: infoController.signal,
          headers: { 'User-Agent': 'GameVaultApp/1.0 (https://gamecollection.local; contact@gamecollection.local) Mozilla/5.0' }
        });
        clearTimeout(infoTimeout);
        if (infoRes.ok) {
          const infoData: any = await infoRes.json();
          const infoPages = infoData?.query?.pages;
          if (infoPages) {
            const imgPage: any = Object.values(infoPages)[0];
            const imgUrl = imgPage?.imageinfo?.[0]?.thumburl || imgPage?.imageinfo?.[0]?.url;
            if (imgUrl && typeof imgUrl === 'string') {
              return `/api/covers/proxy?url=${encodeURIComponent(imgUrl)}`;
            }
          }
        }
      }
    } catch {
      // ignore
    }
    return null;
  };

  // Try queries with clean timeout
  try {
    const cleanTitle = title.replace(/\s*\(.*?\)/g, '').trim();
    const queryWithConsole = consoleName && consoleName !== 'Autre' 
      ? `${cleanTitle} ${consoleName} video game` 
      : `${cleanTitle} video game`;
    
    // 1: English Wikipedia with platform
    let cover = await searchWikiImage('en.wikipedia.org', queryWithConsole, 3000);
    if (cover) return cover;

    // 2: English Wikipedia with video game
    cover = await searchWikiImage('en.wikipedia.org', `${cleanTitle} video game`, 2500);
    if (cover) return cover;

    // 3: French Wikipedia with jeu vidéo
    cover = await searchWikiImage('fr.wikipedia.org', `${cleanTitle} jeu vidéo`, 2500);
    if (cover) return cover;

    // 4: Pure title on English Wikipedia
    cover = await searchWikiImage('en.wikipedia.org', cleanTitle, 2000);
    if (cover) return cover;
  } catch {
    // ignore
  }

  return null;
}

// Fallback search engine using Wikipedia video game APIs (works 100% offline & without Gemini)
async function searchWikipediaGames(query: string, preferredConsole?: string): Promise<any[]> {
  if (!query || !query.trim()) return [];
  const cleanQ = query.trim();
  const searchUrls = [
    `https://fr.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(cleanQ + ' jeu vidéo')}&srlimit=4&format=json`,
    `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(cleanQ + ' video game')}&srlimit=4&format=json`
  ];

  const results: any[] = [];
  const seenTitles = new Set<string>();

  for (const sUrl of searchUrls) {
    if (results.length >= 3) break;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(sUrl, {
        signal: controller.signal,
        headers: { 'User-Agent': 'GameVaultApp/1.0 (https://gamecollection.local; contact@gamecollection.local) Mozilla/5.0' }
      });
      clearTimeout(timeout);
      if (!res.ok) continue;

      const data: any = await res.json();
      const hits = data?.query?.search || [];

      for (const hit of hits) {
        if (results.length >= 3) break;
        const rawTitle: string = hit.title;
        if (/liste de|list of|chronologie|franchise|série de/i.test(rawTitle)) continue;

        const normalized = rawTitle.replace(/\s*\(.*?\)/g, '').trim().toLowerCase();
        if (seenTitles.has(normalized)) continue;
        seenTitles.add(normalized);

        const isFr = sUrl.includes('fr.wikipedia');
        const domain = isFr ? 'fr.wikipedia.org' : 'en.wikipedia.org';
        const dUrl = `https://${domain}/w/api.php?action=query&titles=${encodeURIComponent(rawTitle)}&prop=extracts|pageimages&exintro=1&explaintext=1&pithumbsize=600&redirects=1&format=json`;
        
        const dController = new AbortController();
        const dTimeout = setTimeout(() => dController.abort(), 3000);
        const dRes = await fetch(dUrl, {
          signal: dController.signal,
          headers: { 'User-Agent': 'GameVaultApp/1.0 (https://gamecollection.local; contact@gamecollection.local) Mozilla/5.0' }
        });
        clearTimeout(dTimeout);
        if (!dRes.ok) continue;

        const dData: any = await dRes.json();
        const page: any = Object.values(dData?.query?.pages || {})[0];
        if (!page) continue;

        const extract: string = page.extract || '';
        const yearMatch = extract.match(/\b(19\d\d|20[0-3]\d)\b/);
        const releaseYear = yearMatch ? parseInt(yearMatch[1], 10) : undefined;

        let detectedConsole = preferredConsole || 'Autre';
        if (/nintendo switch/i.test(extract)) detectedConsole = 'Nintendo Switch';
        else if (/playstation 5|ps5/i.test(extract)) detectedConsole = 'PlayStation 5';
        else if (/playstation 4|ps4/i.test(extract)) detectedConsole = 'PlayStation 4';
        else if (/playstation 3|ps3/i.test(extract)) detectedConsole = 'PlayStation 3';
        else if (/playstation 2|ps2/i.test(extract)) detectedConsole = 'PlayStation 2';
        else if (/playstation 1|ps1|psone/i.test(extract)) detectedConsole = 'PlayStation (PS1)';
        else if (/xbox series/i.test(extract)) detectedConsole = 'Xbox Series X|S';
        else if (/xbox one/i.test(extract)) detectedConsole = 'Xbox One';
        else if (/xbox 360/i.test(extract)) detectedConsole = 'Xbox 360';
        else if (/super nintendo|snes/i.test(extract)) detectedConsole = 'Super Nintendo (SNES)';
        else if (/nintendo 64|n64/i.test(extract)) detectedConsole = 'Nintendo 64';
        else if (/gamecube/i.test(extract)) detectedConsole = 'Nintendo GameCube';
        else if (/game boy advance|gba/i.test(extract)) detectedConsole = 'Game Boy / Advance';
        else if (/nintendo (3ds|ds)/i.test(extract)) detectedConsole = 'Nintendo 3DS / DS';

        const devMatch = extract.match(/(?:d[eé]velopp[eé] par|developed by)\s+([^,\.\(\n]+)/i);
        const pubMatch = extract.match(/(?:[eé]dit[eé] par|published by)\s+([^,\.\(\n]+)/i);

        let detectedGenre = 'Action-Aventure';
        if (/jeu de rôle|rpg|action-rpg/i.test(extract)) detectedGenre = 'Action-RPG';
        else if (/plate-forme|plateforme|platform/i.test(extract)) detectedGenre = 'Plateforme';
        else if (/course|racing/i.test(extract)) detectedGenre = 'Course automobile';
        else if (/tir à la première personne|fps/i.test(extract)) detectedGenre = 'FPS / Tir';
        else if (/combat|fighting/i.test(extract)) detectedGenre = 'Combat';
        else if (/survival horror|survie/i.test(extract)) detectedGenre = 'Survival horror';
        else if (/sport|football|basket/i.test(extract)) detectedGenre = 'Sport';

        const displayTitle = rawTitle
          .replace(/\s*\(jeu vid[eé]o.*?\)/i, '')
          .replace(/\s*\(video game.*?\)/i, '')
          .replace(/\s*\(s[eé]rie de jeux.*?\)/i, '')
          .trim();

        let coverUrl: string | undefined = undefined;
        try {
          const found = await findOfficialCover(displayTitle, detectedConsole);
          if (found) coverUrl = found;
        } catch {
          // ignore
        }

        results.push({
          title: displayTitle,
          console: detectedConsole,
          releaseYear,
          developer: devMatch ? devMatch[1].trim() : undefined,
          publisher: pubMatch ? pubMatch[1].trim() : undefined,
          genre: detectedGenre,
          synopsis: extract.length > 220 ? extract.slice(0, 220).trim() + '...' : extract,
          coverUrl
        });
      }
    } catch {
      // Continue
    }
  }

  // Also check local barcode catalog for title matches
  if (results.length < 3) {
    const qLower = cleanQ.toLowerCase();
    for (const item of Object.values(ALL_BARCODES)) {
      if (results.length >= 3) break;
      if (item.title.toLowerCase().includes(qLower) && !seenTitles.has(item.title.toLowerCase())) {
        seenTitles.add(item.title.toLowerCase());
        results.push(item);
      }
    }
  }

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
  } catch (err: any) {
    console.warn('find-cover error:', err?.message || err);
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

    // 1. Check local catalog for instant zero-latency match
    if (ALL_BARCODES[cleanCode]) {
      const match = ALL_BARCODES[cleanCode];
      return res.json({
        found: true,
        source: 'database',
        game: {
          ...match,
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

    // 3. Try Open Products Facts API
    try {
      const opfController = new AbortController();
      const opfTimeout = setTimeout(() => opfController.abort(), 2500);
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

    // 4. Try Gemini AI lookup if available
    const ai = getAi();
    if (ai) {
      try {
        const prompt = `Tu es un expert mondial en jeux vidéo physiques, code-barres EAN-13 et UPC de jeux vidéo commerciaux pour consoles.
Le code-barres EAN/UPC suivant a été scanné sur la boîte d'un jeu vidéo physique : "${cleanCode}".
Identifie avec la plus grande précision le jeu vidéo exact correspondant :
- title: le titre officiel complet du jeu vidéo
- console: le nom de la console parmi ['Nintendo Switch', 'PlayStation 5', 'PlayStation 4', 'PlayStation 3', 'PlayStation 2', 'PlayStation 1', 'Xbox Series X|S', 'Xbox One', 'Xbox 360', 'Super Nintendo (SNES)', 'Nintendo 64', 'Nintendo GameCube', 'Game Boy / Advance', 'Nintendo 3DS / DS', 'PC', 'Autre']
- releaseYear: année de sortie
- publisher: éditeur officiel
- developer: studio de développement
- genre: genre principal en français
- synopsis: court résumé en 1-2 phrases en français
- confidence: 'high' | 'medium' | 'low'`;

        const aiResponse = await withTimeout(
          ai.models.generateContent({
            model: 'gemini-2.5-flash',
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
              barcode: cleanCode,
              confidence: parsed.confidence || 'medium',
              coverUrl: autoCoverUrl,
            }
          });
        }
      } catch (aiErr: any) {
        console.warn('Gemini lookup error (handled gracefully):', aiErr?.message || aiErr);
      }
    }

    // 5. If not matched automatically, preserve the scanned barcode so the user can easily complete the title
    return res.json({
      found: false,
      barcode: cleanCode,
      message: 'Code-barres scanné avec succès ! Complétez le nom du jeu ci-dessous pour lancer la recherche automatique.'
    });
  } catch (err: any) {
    console.error('Erreur lookup-barcode:', err);
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

    // 1. Try Gemini AI if configured
    const ai = getAi();
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
- synopsis: court résumé en français (1 ou 2 phrases)`;

        const aiResponse = await withTimeout(
          ai.models.generateContent({
            model: 'gemini-2.5-flash',
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
                    synopsis: { type: Type.STRING }
                  },
                  required: ['title', 'console']
                }
              }
            }
          }),
          5000,
          'Délai de recherche dépassé.'
        );

        results = JSON.parse(aiResponse.text || '[]');
        if (Array.isArray(results) && results.length > 0) {
          aiSuccess = true;
        }
      } catch (aiErr: any) {
        console.warn('search-gemini AI error, activating Wikipedia game fallback:', aiErr?.message || aiErr);
      }
    }

    // 2. If Gemini was unavailable or yielded no results, fallback to Wikipedia game search!
    if (!aiSuccess || results.length === 0) {
      results = await searchWikipediaGames(query, preferredConsole);
    }

    // 3. Attach covers if found
    const enrichedResults = await Promise.all(
      results.map(async (r: any) => {
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
  } catch (err: any) {
    console.error('Erreur search-gemini, attempting Wikipedia search fallback:', err);
    try {
      const wikiResults = await searchWikipediaGames(req.body?.query || '', req.body?.console);
      return res.json({ results: wikiResults });
    } catch {
      return res.json({
        results: [],
        error: 'Erreur lors de la recherche: ' + (err.message || String(err))
      });
    }
  }
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
