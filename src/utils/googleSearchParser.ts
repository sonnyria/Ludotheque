/**
 * Utilities for cleaning and parsing titles extracted from Google search results,
 * product listing URLs, and marketplace copy-paste strings (Fnac, Amazon, Micromania, etc.)
 */

export interface ParsedGoogleResult {
  title: string;
  console?: string;
  releaseYear?: number;
  publisher?: string;
}

const CONSOLE_PATTERNS: { name: string; regex: RegExp }[] = [
  { name: 'PlayStation 5', regex: /\b(?:PlayStation\s*5|PS5)\b/i },
  { name: 'PlayStation 4', regex: /\b(?:PlayStation\s*4|PS4)\b/i },
  { name: 'PlayStation 3', regex: /\b(?:PlayStation\s*3|PS3)\b/i },
  { name: 'PlayStation 2', regex: /\b(?:PlayStation\s*2|PS2)\b/i },
  { name: 'PlayStation 1', regex: /\b(?:PlayStation\s*1|PS1|PSX)\b/i },
  { name: 'Nintendo Switch', regex: /\b(?:Nintendo\s*Switch|Switch)\b/i },
  { name: 'Xbox Series X|S', regex: /\b(?:Xbox\s*Series|Series\s*X|Series\s*S)\b/i },
  { name: 'Xbox One', regex: /\b(?:Xbox\s*One|XOne)\b/i },
  { name: 'Xbox 360', regex: /\b(?:Xbox\s*360|X360)\b/i },
  { name: 'Nintendo 3DS / DS', regex: /\b(?:Nintendo\s*3DS|3DS|Nintendo\s*DS|NDS)\b/i },
  { name: 'Game Boy / Advance', regex: /\b(?:Game\s*Boy\s*Advance|GBA|Game\s*Boy\s*Color|GBC|Game\s*Boy)\b/i },
  { name: 'Nintendo GameCube', regex: /\b(?:GameCube|NGC)\b/i },
  { name: 'Nintendo 64', regex: /\b(?:Nintendo\s*64|N64)\b/i },
  { name: 'Super Nintendo (SNES)', regex: /\b(?:Super\s*Nintendo|SNES)\b/i },
  { name: 'PC', regex: /\b(?:PC\s*CD-ROM|PC\s*DVD|Windows)\b/i },
];

export function parseGoogleResultText(raw: string): ParsedGoogleResult {
  if (!raw) return { title: '' };

  let text = raw.trim();

  // Strip HTTP(S) URLs
  text = text.replace(/https?:\/\/[^\s]+/gi, ' ').trim();

  // Detect console first
  let detectedConsole: string | undefined = undefined;
  for (const cp of CONSOLE_PATTERNS) {
    if (cp.regex.test(text)) {
      detectedConsole = cp.name;
      break;
    }
  }

  // Detect release year
  let detectedYear: number | undefined = undefined;
  const yearMatch = text.match(/\b(19[89]\d|20[0-2]\d)\b/);
  if (yearMatch) {
    const y = parseInt(yearMatch[1], 10);
    if (y >= 1980 && y <= 2026) {
      detectedYear = y;
    }
  }

  // Split on common delimiters: " - ", " : ", " | ", " • ", " — ", " / "
  const parts = text.split(/\s*[-:|•–—]\s*/);
  let bestPart = parts[0] || text;

  // If first segment is just a store or noisy prefix, pick the second segment
  if (/^(?:fnac|micromania|amazon(?:\.fr)?|cdiscount|rakuten|le\s*bon\s*coin|vinted|google|recherche)/i.test(bestPart.trim()) && parts[1]) {
    bestPart = parts[1];
  }

  // Clean title
  let cleanTitle = bestPart
    // Remove store names
    .replace(/\b(?:Fnac|Micromania|Amazon(?:\.fr)?|Cdiscount|Rakuten|Le Bon Coin|Vinted|Boulanger|Auchan|Carrefour|E\.Leclerc)\b/gi, '')
    // Remove product descriptions
    .replace(/\b(?:jeux?\s*vid[eé]o|video\s*games?|occasion|neuf|complet|en\s*bo[iî]te|d['’]occasion|standard\s*edition|edition\s*standard|jeu\s*seul)\b/gi, '')
    // Remove console keywords
    .replace(/\b(?:playstation\s*5|playstation\s*4|playstation\s*3|playstation\s*2|playstation\s*1|ps5|ps4|ps3|ps2|ps1|nintendo\s*switch|\bswitch\b|xbox\s*series|xbox\s*one|xbox\s*360|\b3ds\b|\bds\b|\bgame\s*boy\b|\bgba\b)\b/gi, '')
    // Remove brackets / parenthesis content like [PS4], (Nintendo Switch)
    .replace(/[\[\(\{].*?[\]\)\}]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // If cleanTitle became empty, fallback to trimmed bestPart
  if (!cleanTitle || cleanTitle.length < 2) {
    cleanTitle = bestPart.trim();
  }

  // Remove leading or trailing punctuation
  cleanTitle = cleanTitle.replace(/^[-:;,./]+|[-:;,./]+$/g, '').trim();

  return {
    title: cleanTitle,
    console: detectedConsole,
    releaseYear: detectedYear,
  };
}
