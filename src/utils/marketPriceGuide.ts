import type { GameCondition } from '../types.js';

/**
 * Information sur la source des cotes argus (France & Europe)
 */
export const COTE_SOURCE_INFO = {
  primary: 'Mister Game Price',
  primaryUrl: 'https://www.mistergameprice.com',
  secondary: 'eBay France (Ventes réussies)',
  secondaryUrl: 'https://www.ebay.fr',
  tertiary: 'Vinted & LeBonCoin',
  tertiaryUrl: 'https://www.leboncoin.fr',
  description:
    "Estimation locale indicative selon le titre, la console et la présence du jeu et de sa boîte. Les sites ci-dessous sont des liens de vérification manuelle, pas des données importées. Une consultation PriceCharting PAL, lorsqu’elle réussit, fournit une valeur distincte avec sa source et sa date; PAL ne garantit pas une édition française.",
};

/**
 * Nettoie une chaîne de titre pour la recherche
 */
function cleanQueryTerm(term: string): string {
  return term
    .trim()
    .replace(/[’']/g, "'")
    .replace(/[:\-–—]/g, ' ')
    .replace(/\s+/g, ' ');
}

/**
 * Génère le lien direct de recherche sur Mister Game Price (L'Argus français du jeu vidéo)
 */
export function getMisterGamePriceSearchUrl(title: string, consoleName?: string): string {
  const cleanTitle = cleanQueryTerm(title);
  // Sur Mister Game Price, chercher le titre permet de trouver la fiche exacte du jeu et ses cotes par état
  const query = encodeURIComponent(cleanTitle);
  return `https://www.mistergameprice.com/recherche?q=${query}`;
}

/**
 * Génère le lien direct de recherche sur eBay France filtré sur les VENTES RÉUSSIES ET TERMINÉES (Euros)
 * Le paramètre LH_Complete=1&LH_Sold=1 garantit d'afficher les transactions réelles effectives, pas les prix fantaisistes invendus !
 */
export function getEbayFranceSoldSearchUrl(title: string, consoleName?: string, condition?: GameCondition): string {
  const cleanTitle = cleanQueryTerm(title);
  let query = `${cleanTitle}`;
  if (consoleName) {
    // Adapter le nom de console pour eBay.fr
    const shortConsole = consoleName
      .replace('Super Nintendo (SNES)', 'SNES')
      .replace('Nintendo 64', 'N64')
      .replace('Nintendo GameCube', 'GameCube')
      .replace('Sega Mega Drive / Genesis', 'Megadrive')
      .replace('Sega Dreamcast / Saturn', 'Dreamcast')
      .replace('PlayStation Vita / PSP', 'PSP')
      .replace('Nintendo 3DS / DS', 'DS');
    query += ` ${shortConsole}`;
  }

  if (condition === 'complet') {
    query += ' complet';
  } else if (condition === 'neuf') {
    query += ' neuf blister';
  } else if (condition === 'loose') {
    query += ' loose';
  }

  return `https://www.ebay.fr/sch/i.html?_nkw=${encodeURIComponent(query)}&LH_Complete=1&LH_Sold=1&_sop=12`;
}

/**
 * Génère le lien direct de recherche sur LeBonCoin (Marché français d'occasion)
 */
export function getLeboncoinSearchUrl(title: string, consoleName?: string): string {
  const cleanTitle = cleanQueryTerm(title);
  const query = consoleName ? `${cleanTitle} ${consoleName}` : cleanTitle;
  return `https://www.leboncoin.fr/recherche?category=43&text=${encodeURIComponent(query)}`;
}

/**
 * Génère le lien direct de recherche sur Vinted France (Jeux vidéo d'occasion)
 */
export function getVintedSearchUrl(title: string, consoleName?: string): string {
  const cleanTitle = cleanQueryTerm(title);
  const query = consoleName ? `${cleanTitle} ${consoleName}` : cleanTitle;
  return `https://www.vinted.fr/catalog?search_text=${encodeURIComponent(query)}`;
}

/**
 * Lien PriceCharting (version européenne / PAL)
 */
export function getPriceChartingSearchUrl(title: string, consoleName: string): string {
  const cleanTitle = cleanQueryTerm(title);
  const query = encodeURIComponent(`${cleanTitle} ${consoleName}`);
  return `https://www.pricecharting.com/search-products?q=${query}&type=videogames`;
}

/**
 * Argus de référence des cotes du marché français & européen (en Euros €).
 * Base de référence pour un exemplaire "Complet en boîte" (CIB : Boîte originale française ou PAL, jaquette et notice).
 * Repères internes indicatifs, sans historique de ventes ni actualisation automatique.
 */
const KNOWN_COTES_CIB: Record<string, Record<string, number>> = {
  'Nintendo Switch': {
'the legend of zelda: breath of the wild': 42,
  'the legend of zelda breath of the wild': 42,
  'the legend of zelda: tears of the kingdom': 45,
  'the legend of zelda tears of the kingdom': 45,
  "the legend of zelda: link's awakening": 34,
  "the legend of zelda links awakening": 34,
  'the legend of zelda: skyward sword hd': 28,
  'the legend of zelda: echoes of wisdom': 42,
  'super mario odyssey': 35,
  'mario kart 8 deluxe': 38,
  'super smash bros. ultimate': 42,
  'super smash bros ultimate': 42,
  'super mario bros. wonder': 38,
  'super mario bros wonder': 38,
  'super mario 3d all-stars': 65,
  'super mario 3d world + bowser\'s fury': 35,
  'animal crossing: new horizons': 35,
  'animal crossing new horizons': 35,
  'metroid dread': 30,
  'metroid prime remastered': 28,
  'luigi\'s mansion 3': 35,
  'luigis mansion 3': 35,
  'pikmin 4': 35,
  'paper mario: la porte millenaire': 40,
  'paper mario la porte millenaire': 40,
  'paper mario: the origami king': 26,
  'pokemon epée': 32,
  'pokemon epee': 32,
  'pokemon bouclier': 32,
  'pokemon ecarlate': 36,
  'pokemon violet': 36,
  'pokemon legendes: arceus': 36,
  'pokemon legendes arceus': 36,
  'pokemon diamant etincelant': 28,
  'pokemon perle scintillante': 28,
  'pokemon let\'s go pikachu': 35,
  'pokemon let\'s go evoli': 35,
  'splatoon 3': 30,
  'splatoon 2': 16,
  'xenoblade chronicles 3': 38,
  'xenoblade chronicles definitive edition': 30,
  'xenoblade chronicles 2': 45,
  'kirby et le monde oublie': 35,
  'bayonetta 3': 32,
  'fire emblem: three houses': 35,
  'fire emblem engage': 28,
  },
  'PlayStation 5': {
'demon\'s souls': 28,
  'demons souls': 28,
  'god of war ragnarok': 35,
  'god of war ragnarök': 35,
  'marvel\'s spider-man 2': 40,
  'marvels spider-man 2': 40,
  'spider-man 2': 40,
  'marvel\'s spider-man miles morales': 22,
  'elden ring': 35,
  'final fantasy vii rebirth': 42,
  'final fantasy xvi': 28,
  'returnal': 25,
  'ratchet & clank: rift apart': 30,
  'ratchet and clank rift apart': 30,
  'gran turismo 7': 35,
  'the last of us part i': 38,
  'the last of us part 1': 38,
  'horizon forbidden west': 25,
  'astro bot': 45,
  'stellar blade': 42,
  'tekken 8': 38,
  'helldivers 2': 30,
  'dragons dogma 2': 38,
  'dragon\'s dogma 2': 38,
  'baldur\'s gate 3': 60,
  'baldurs gate 3': 60,
  'resident evil 4 remake': 32,
  'silent hill 2 remake': 45,
  'death stranding director\'s cut': 22,
  'ghost of tsushima director\'s cut': 35,
  },
  'PlayStation 4': {
'red dead redemption 2': 18,
  'the last of us part ii': 18,
  'the last of us part 2': 18,
  'the last of us remastered': 12,
  'bloodborne': 18,
  'god of war': 12,
  'ghost of tsushima': 22,
  'persona 5 royal': 28,
  'spider-man': 14,
  'the witcher 3: wild hunt': 14,
  'cyberpunk 2077': 18,
  'grand theft auto v': 15,
  'gta v': 15,
  'gta 5': 15,
  'uncharted 4: a thief\'s end': 10,
  'horizon zero dawn': 10,
  'dark souls iii': 16,
  'sekiro: shadows die twice': 28,
  'resident evil 2 remake': 18,
  'resident evil 7: biohazard': 12,
  'resident evil village': 18,
  'monster hunter: world': 10,
  'metal gear solid 4': 10,
  'metal gear solid 4 guns of the patriots': 10,
  'mgs 4': 10,
  'metal gear solid v: the phantom pain': 10,
  'metal gear solid v the phantom pain': 10,
  'metal gear solid 5': 10,
  'metal gear solid v': 10,
  'mgs 5': 10,
  'mgs v': 10,
  'metal gear solid v: ground zeroes': 8,
  'metal gear solid v ground zeroes': 8,
  'metal gear solid: master collection vol. 1': 32,
  'metal gear solid master collection vol 1': 32,
  },
  'Super Nintendo (SNES)': {
'chrono trigger': 190,
  'super mario world': 75,
  'the legend of zelda: a link to the past': 110,
  'the legend of zelda a link to the past': 110,
  'zelda a link to the past': 110,
  'super metroid': 150,
  'donkey kong country': 60,
  'donkey kong country 2': 75,
  'donkey kong country 3': 85,
  'secret of mana': 85,
  'super mario kart': 65,
  'super mario all-stars': 60,
  'street fighter ii': 45,
  'street fighter ii turbo': 55,
  'super street fighter ii': 65,
  'terranigma': 160,
  'illusion of time': 70,
  'secret of evermore': 75,
  'mega man x': 140,
  'f-zero': 45,
  'starwing': 40,
  'castlevania: vampire\'s kiss': 350,
  },
  'Nintendo 64': {
'super mario 64': 80,
  'the legend of zelda: ocarina of time': 95,
  'the legend of zelda ocarina of time': 95,
  'the legend of zelda: majora\'s mask': 125,
  'the legend of zelda majoras mask': 125,
  'goldeneye 007': 60,
  'mario kart 64': 70,
  'super smash bros.': 80,
  'super smash bros': 80,
  'banjo-kazooie': 70,
  'banjo kazooie': 70,
  'banjo-tooie': 95,
  'conker\'s bad fur day': 240,
  'paper mario': 140,
  'diddy kong racing': 45,
  'donkey kong 64': 65,
  'perfect dark': 50,
  'f-zero x': 55,
  'pokemon stadium': 60,
  'pokemon snap': 50,
  'rayman 2: the great escape': 45,
  },
  'Nintendo GameCube': {
'super smash bros. melee': 65,
  'super smash bros melee': 65,
  'the legend of zelda: the wind waker': 65,
  'the legend of zelda the wind waker': 65,
  'the legend of zelda: twilight princess': 95,
  'the legend of zelda: collector\'s edition': 85,
  'the legend of zelda: four swords adventures': 90,
  'super mario sunshine': 50,
  'mario kart: double dash!!': 50,
  'mario kart double dash': 50,
  'luigi\'s mansion': 50,
  'metroid prime': 35,
  'metroid prime 2: echoes': 45,
  'paper mario: la porte millénaire': 120,
  'fire emblem: path of radiance': 180,
  'pokemon colosseum': 65,
  'pokemon xd: gale of darkness': 140,
  'pokemon xd': 140,
  'f-zero gx': 65,
  'resident evil 4': 25,
  'resident evil rebirth': 30,
  'resident evil 0': 25,
  'resident evil code veronica x': 70,
  'pikmin': 35,
  'pikmin 2': 50,
  'star fox adventures': 30,
  'skies of arcadia legends': 110,
  },
  'Game Boy / Advance': {
'pokemon rouge': 120,
  'pokemon bleu': 120,
  'pokemon jaune': 140,
  'pokemon or': 130,
  'pokemon argent': 130,
  'pokemon cristal': 220,
  'pokemon rubis': 110,
  'pokemon saphir': 110,
  'pokemon emeraude': 190,
  'pokemon rouge feu': 130,
  'pokemon vert feuille': 130,
  'the legend of zelda: the minish cap': 110,
  'the legend of zelda the minish cap': 110,
  'the legend of zelda: link\'s awakening dx': 90,
  'the legend of zelda: oracle of seasons': 110,
  'the legend of zelda: oracle of ages': 110,
  'golden sun': 55,
  'golden sun: l\'age perdu': 60,
  'metroid fusion': 95,
  'metroid: zero mission': 120,
  'castlevania: aria of sorrow': 130,
  'super mario advance': 40,
  'super mario advance 2': 40,
  'super mario advance 4': 50,
  },
  'Nintendo 3DS / DS': {
'pokemon diamant': 40,
  'pokemon perle': 40,
  'pokemon platine': 95,
  'pokemon heartgold': 150,
  'pokemon soulsilver': 150,
  'pokemon noir': 65,
  'pokemon blanc': 65,
  'pokemon noir 2': 120,
  'pokemon blanc 2': 120,
  'pokemon x': 25,
  'pokemon y': 25,
  'pokemon rubis omega': 30,
  'pokemon saphir alpha': 30,
  'pokemon soleil': 22,
  'pokemon lune': 22,
  'pokemon ultra-soleil': 38,
  'pokemon ultra-lune': 38,
  'chrono trigger ds': 85,
  'dragon quest ix': 35,
  'dragon quest v': 110,
  'dragon quest iv': 90,
  'dragon quest vi': 95,
  'the legend of zelda: phantom hourglass': 35,
  'the legend of zelda: spirit tracks': 45,
  'the legend of zelda: ocarina of time 3d': 22,
  'the legend of zelda: majora\'s mask 3d': 30,
  'the legend of zelda: a link between worlds': 25,
  'mario kart ds': 15,
  'new super mario bros.': 15,
  },
  'PlayStation 1': {
'metal gear solid': 50,
  'silent hill': 140,
  'resident evil': 45,
  'resident evil 2': 50,
  'resident evil 3: nemesis': 55,
  'final fantasy vii': 40,
  'final fantasy viii': 25,
  'final fantasy ix': 28,
  'castlevania: symphony of the night': 300,
  'suikoden ii': 280,
  'crash bandicoot': 30,
  'crash bandicoot 2': 25,
  'crash bandicoot 3: warped': 25,
  'crash team racing': 30,
  'spyro the dragon': 25,
  'spyro 2: gateway to glimmer': 25,
  'tomb raider': 15,
  'tomb raider ii': 15,
  'tekken 3': 22,
  'medievil': 35,
  'dino crisis': 40,
  'dino crisis 2': 55,
  },
  'PlayStation 2': {
'silent hill 2': 70,
  'silent hill 3': 60,
  'silent hill 4: the room': 55,
  'rule of rose': 450,
  'kuon': 380,
  'haunting ground': 160,
  'dragon quest viii: l\'odyssee du roi maudit': 25,
  'final fantasy x': 12,
  'final fantasy xii': 10,
  'grand theft auto: san andreas': 15,
  'gta san andreas': 15,
  'grand theft auto: vice city': 12,
  'gta vice city': 12,
  'metal gear solid 2: sons of liberty': 12,
  'metal gear solid 3: snake eater': 18,
  'god of war ii': 15,
  'shadow of the colossus': 25,
  'ico': 22,
  'kingdom hearts': 14,
  'kingdom hearts ii': 15,
  'need for speed: most wanted': 15,
  'need for speed underground 2': 14,
  'burnout 3: takedown': 10,
  'gran turismo 4': 8,
  'tekken 5': 12,
  'okami': 25,
  },
  'PlayStation 3': {
'the last of us': 10,
  'red dead redemption': 10,
  'grand theft auto iv': 8,
  'gta iv': 8,
  'gta 4': 8,
  'metal gear solid 4: guns of the patriots': 10,
  'demon\'s souls ps3': 20,
  'dark souls': 15,
  'god of war iii': 8,
  'uncharted 2: among thieves': 6,
  'uncharted 3: drake\'s deception': 6,
  },
  'Xbox One': {
'forza horizon 5': 32,
  'halo infinite': 20,
  'forza horizon 4': 16,
  'halo: the master chief collection': 16,
  'halo master chief collection': 16,
  'gears 5': 14,
  'titanfall 2': 8,
  'halo 5: guardians': 10,
  'sunset overdrive': 10,
  'quantum break': 12,
  },
  'Xbox 360': {
  'halo 3': 8,
  'halo 4': 8,
  'forza motorsport 4': 10,
  'gears of war': 6,
  'gears of war 2': 6,
  'gears of war 3': 6,
  },
  'Xbox Original': {
  'star wars knights of the old republic': 25,
  },
  'Xbox Series X|S': {
'forza horizon 5': 32,
  'halo infinite': 20,
  'starfield': 24,
  },
};

/**
 * Valeurs de base moyennes réalistes par console pour les jeux courants non répertoriés
 * Repères internes génériques; aucune transaction récente importée
 */
const CONSOLE_BASE_VALUES: Record<string, number> = {
  'Super Nintendo (SNES)': 45,
  'Nintendo 64': 45,
  'Nintendo GameCube': 35,
  'NES': 35,
  'Game Boy / Advance': 32,
  'Nintendo Switch': 25,
  'PlayStation 5': 28,
  'PlayStation 1': 20,
  'PlayStation 2': 8,
  'PlayStation 4': 12,
  'Nintendo 3DS / DS': 18,
  'Sega Dreamcast / Saturn': 38,
  'Sega Mega Drive / Genesis': 25,
  'Xbox Series X|S': 22,
  'PlayStation Vita / PSP': 18,
  'PlayStation 3': 7,
  'Xbox 360': 6,
  'Xbox One': 8,
  'Xbox Original': 12,
  'Nintendo Wii': 8,
  'Nintendo Wii U': 18,
  'PC': 6,
  'Autre': 15,
};

function normalizePriceTitle(title: string): string {
  return title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ').replace(/^the /, '');
}

export function getConditionCoefficient(consoleName: string, condition: GameCondition): number {
  const cardboard = ['NES', 'Super Nintendo (SNES)', 'Nintendo 64', 'Game Boy / Advance'].includes(consoleName);
  if (condition === 'dematerialise') return 0;
  if (condition === 'complet') return 1;
  if (condition === 'loose') return cardboard ? 0.4 : 0.8;
  if (condition === 'boite_seule') return cardboard ? 0.4 : 0.1;
  // Sealed collectibles require an observed quote; these multipliers are only indicative.
  return cardboard ? 2 : 1.3;
}

export function estimateMarketValue(
  title: string,
  consoleName: string,
  condition: GameCondition = 'complet'
): number {
  if (condition === 'dematerialise') return 0;
  const normalized = normalizePriceTitle(title);
  const aliases: Record<string, string> = {'witcher 3': 'witcher 3 wild hunt'};
  const wanted = aliases[normalized] || normalized;
  const references = KNOWN_COTES_CIB[consoleName] || {};
  let base = Object.entries(references).find(([key]) => normalizePriceTitle(key) === wanted)?.[1];
  // A small explicit cross-platform reference: do not copy an entire platform's catalogue.
  if (base === undefined && consoleName === 'Xbox One' && wanted === 'witcher 3 wild hunt') base = 12;
  const sports = /\b(?:fifa|pes|ea sports fc|nba 2k|madden|nhl)\b/.test(normalized);
  const yearMatch = normalized.match(/\b(20\d{2}|\d{2})$/);
  const year = yearMatch ? (Number(yearMatch[1]) < 100 ? 2000 + Number(yearMatch[1]) : Number(yearMatch[1])) : null;
  if (sports && year !== null && year <= new Date().getFullYear() - 3) base = 3;
  // Unknown titles use a platform average, never a guessed rare-franchise premium.
  base ??= CONSOLE_BASE_VALUES[consoleName] || 15;
  return Math.max(0, Math.round(base * getConditionCoefficient(consoleName, condition)));
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
  if (game.condition === 'dematerialise') return 0;
  if (Number.isFinite(game.estimatedValue) && game.estimatedValue! >= 0) {
    return game.estimatedValue!;
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

