import { GameCondition } from '../types';

/**
 * Information sur la source des cotes argus
 */
export const COTE_SOURCE_INFO = {
  primary: 'PriceCharting',
  primaryUrl: 'https://www.pricecharting.com',
  secondary: 'Mister Game Price',
  secondaryUrl: 'https://www.mistergameprice.com',
  tertiary: 'Ventes réussies eBay',
  description:
    "Les cotes sont établies sur la base de PriceCharting (historique des ventes conclues sur eBay, boutiques spécialisées et conventions) complétées par Mister Game Price pour les éditions spécifiques du marché français/européen.",
};

/**
 * Génère le lien direct de recherche sur PriceCharting
 */
export function getPriceChartingSearchUrl(title: string, consoleName: string): string {
  const cleanTitle = title.trim().replace(/[’']/g, "'");
  const query = encodeURIComponent(`${cleanTitle} ${consoleName}`);
  return `https://www.pricecharting.com/search-products?q=${query}&type=videogames`;
}

/**
 * Génère le lien direct de recherche sur Mister Game Price (France)
 */
export function getMisterGamePriceSearchUrl(title: string): string {
  const query = encodeURIComponent(title.trim());
  return `https://www.mistergameprice.com/recherche?q=${query}`;
}

/**
 * Cote de l'occasion des jeux vidéo (Argus du marché de l'occasion physique).
 * Les valeurs de base correspondent à un jeu "Complet en boîte" (CIB - Boîte, Jaquette, Notice).
 */
const KNOWN_COTES_CIB: Record<string, number> = {
  // Nintendo Switch
  'super mario odyssey': 35,
  'the legend of zelda: breath of the wild': 45,
  'the legend of zelda breath of the wild': 45,
  'metroid dread': 32,
  'mario kart 8 deluxe': 38,
  'super smash bros. ultimate': 42,
  'animal crossing: new horizons': 35,
  'pokemon epee': 35,
  'pokemon bouclier': 35,
  'pokemon ecarlate': 38,
  'pokemon violet': 38,
  'the legend of zelda: tears of the kingdom': 48,
  'luigi\'s mansion 3': 35,
  'splatoon 3': 32,
  'xenoblade chronicles 3': 38,

  // PlayStation 5
  'demon\'s souls': 28,
  'demons souls': 28,
  'god of war ragnarok': 35,
  'god of war ragnarök': 35,
  'marvel\'s spider-man 2': 42,
  'marvels spider-man 2': 42,
  'spider-man 2': 42,
  'elden ring': 36,
  'horizon forbidden west': 28,
  'returnal': 26,
  'ratchet & clank: rift apart': 30,
  'final fantasy vii rebirth': 45,
  'final fantasy xvi': 32,
  'gran turismo 7': 35,
  'the last of us part i': 40,

  // Retro: Super Nintendo (SNES)
  'chrono trigger': 220,
  'super mario world': 75,
  'the legend of zelda: a link to the past': 95,
  'super metroid': 140,
  'donkey kong country': 60,
  'donkey kong country 2': 70,
  'secret of mana': 85,
  'super mario kart': 65,
  'street fighter ii': 45,

  // PlayStation 4
  'red dead redemption 2': 22,
  'the last of us part ii': 18,
  'bloodborne': 20,
  'god of war': 15,
  'ghost of tsushima': 25,
  'persona 5 royal': 30,
  'spider-man': 16,

  // Xbox Series X|S & Xbox One
  'forza horizon 5': 28,
  'halo infinite': 20,
  'starfield': 26,
  'gears 5': 14,
  'forza motorsport': 32,

  // Retro: N64 / GameCube / GBA / PS1 / PS2
  'super mario 64': 75,
  'the legend of zelda: ocarina of time': 90,
  'the legend of zelda: majora\'s mask': 110,
  'goldeneye 007': 55,
  'super smash bros. melee': 70,
  'the legend of zelda: the wind waker': 65,
  'pokemon emeraude': 130,
  'pokemon rouge feu': 110,
  'pokemon vert feuille': 110,
  'metal gear solid': 55,
  'silent hill': 120,
  'silent hill 2': 95,
  'final fantasy vii': 45,
  'castlevania: symphony of the night': 180,
  'resident evil 4': 35,
};

/**
 * Coefficient selon l'état du jeu par rapport à la cote CIB (Complet en boîte)
 */
export const CONDITION_COEFFICIENTS: Record<GameCondition, number> = {
  neuf: 1.8,         // Neuf sous blister d'origine (rare et recherché)
  complet: 1.0,      // Boîte, notice et jeu en bon état (base de référence)
  loose: 0.45,       // Cartouche ou disque seul sans boîte
  boite_seule: 0.35, // Boîte seule sans le jeu (très recherché pour compléter un loose)
  dematerialise: 0,   // Dématérialisé (pas de valeur de revente d'occasion)
};

/**
 * Valeur de base moyenne estimée par console (pour jeux non répertoriés)
 */
const CONSOLE_BASE_VALUES: Record<string, number> = {
  'Super Nintendo (SNES)': 45,
  'Nintendo 64': 40,
  'Nintendo GameCube': 35,
  'NES': 35,
  'Game Boy / Advance': 32,
  'Nintendo Switch': 32,
  'PlayStation 5': 32,
  'PlayStation 1': 26,
  'PlayStation 2': 18,
  'PlayStation 4': 18,
  'Nintendo 3DS / DS': 22,
  'Sega Dreamcast / Saturn': 42,
  'Sega Mega Drive / Genesis': 28,
  'Xbox Series X|S': 25,
  'PlayStation Vita / PSP': 22,
  'PlayStation 3': 14,
  'Xbox 360': 12,
  'Xbox One': 14,
  'Xbox Original': 16,
  'Nintendo Wii': 14,
  'Nintendo Wii U': 22,
  'PC': 10,
  'Autre': 20,
};

/**
 * Calcule l'estimation de la cote d'occasion pour un jeu
 */
export function estimateMarketValue(
  title: string,
  consoleName: string,
  condition: GameCondition = 'complet'
): number {
  if (condition === 'dematerialise') {
    return 0;
  }

  const cleanTitle = title
    .toLowerCase()
    .trim()
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9\s:']/g, '');

  // 1. Recherche exacte dans le dictionnaire des cotes connues
  let baseCib = KNOWN_COTES_CIB[cleanTitle];

  // 2. Recherche partielle si pas trouvé exactement
  if (baseCib === undefined) {
    for (const [key, val] of Object.entries(KNOWN_COTES_CIB)) {
      if (cleanTitle.includes(key) || key.includes(cleanTitle)) {
        baseCib = val;
        break;
      }
    }
  }

  // 3. Heuristique intelligente par franchise et console
  if (baseCib === undefined) {
    baseCib = CONSOLE_BASE_VALUES[consoleName] || 20;

    // Bonus franchise culte (les jeux Nintendo, RPG et survival-horror conservent une cote très haute)
    const upperTitle = title.toLowerCase();
    if (
      upperTitle.includes('zelda') ||
      upperTitle.includes('pokemon') ||
      upperTitle.includes('pokémon')
    ) {
      baseCib += 30;
    } else if (
      upperTitle.includes('mario') ||
      upperTitle.includes('metroid') ||
      upperTitle.includes('chrono') ||
      upperTitle.includes('fire emblem')
    ) {
      baseCib += 20;
    } else if (
      upperTitle.includes('final fantasy') ||
      upperTitle.includes('dragon quest') ||
      upperTitle.includes('silent hill') ||
      upperTitle.includes('resident evil') ||
      upperTitle.includes('castlevania') ||
      upperTitle.includes('souls') ||
      upperTitle.includes('elden')
    ) {
      baseCib += 15;
    } else if (
      upperTitle.includes('collector') ||
      upperTitle.includes('steelbook') ||
      upperTitle.includes('limited')
    ) {
      baseCib += 25;
    }
  }

  // Application du coefficient d'état
  const coeff = CONDITION_COEFFICIENTS[condition] ?? 1.0;
  const rawValue = Math.round(baseCib * coeff);

  // Valeur minimum symbolique pour un jeu physique
  return Math.max(rawValue, 5);
}

/**
 * Obtient la valeur estimée (cote argus) d'un jeu
 */
export function getGameEstimatedValue(game: {
  title: string;
  console: string;
  condition: GameCondition;
  estimatedValue?: number;
}): number {
  if (game.estimatedValue !== undefined && game.estimatedValue !== null && !isNaN(game.estimatedValue)) {
    return game.estimatedValue;
  }
  return estimateMarketValue(game.title, game.console, game.condition);
}

/**
 * Formate un montant en Euros selon les conventions françaises
 */
export function formatCurrency(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '0 €';
  }
  return `${amount.toLocaleString('fr-FR')} €`;
}

export interface ValueMargin {
  diff: number;
  percent: number;
  percentage: number;
  isPositive: boolean;
}

/**
 * Calcule la plus-value ou moins-value entre la cote actuelle et le prix d'achat
 */
export function calculateValueMargin(
  currentValue: number | undefined,
  purchasePrice: number | undefined
): ValueMargin | null {
  if (
    currentValue === undefined ||
    purchasePrice === undefined ||
    purchasePrice <= 0 ||
    currentValue < 0
  ) {
    return null;
  }

  const diff = currentValue - purchasePrice;
  const percent = Math.round((diff / purchasePrice) * 100);
  return {
    diff,
    percent,
    percentage: percent,
    isPositive: diff >= 0,
  };
}
