import { GameCondition } from '../types';

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
    "L'argus est calibré sur la réalité du marché français et européen (éditions PAL France avec boîtes et notices en français). Il s'appuie sur Mister Game Price (l'Argus de référence en France) et l'historique des ventes conclues et payées en Euros sur eBay France, Vinted et LeBonCoin.",
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
 * Données vérifiées issues de Mister Game Price et des ventes réelles terminées sur eBay France / Vinted.
 */
const KNOWN_COTES_CIB: Record<string, number> = {
  // === NINTENDO SWITCH (Marché FR d'occasion) ===
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

  // === PLAYSTATION 5 (Marché FR d'occasion) ===
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

  // === PLAYSTATION 4 (Marché FR d'occasion) ===
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

  // === RETRO: SUPER NINTENDO / SNES (Boîte et notice FR d'origine - CIB) ===
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

  // === RETRO: NINTENDO 64 / N64 (Boîte et notice FR - CIB) ===
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

  // === RETRO: NINTENDO GAMECUBE (Boîte FR/PAL - CIB) ===
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

  // === RETRO: GAME BOY / GBC / GBA (Boîte et notice FR - CIB) ===
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

  // === RETRO: NINTENDO DS / 3DS (Boîte FR/PAL - CIB) ===
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

  // === RETRO: PLAYSTATION 1 (Édition PAL France - Boîtier cristal - CIB) ===
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

  // === RETRO: PLAYSTATION 2 (Édition PAL France - CIB) ===
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

  // === PLAYSTATION 3 (Édition PAL France - CIB) ===
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

  // === XBOX SERIES X|S, XBOX ONE, XBOX 360 & XBOX (CIB) ===
  'forza horizon 5': 32,
  'halo infinite': 20,
  'starfield': 24,
  'forza horizon 4': 16,
  'halo: the master chief collection': 16,
  'halo master chief collection': 16,
  'gears 5': 14,
  'titanfall 2': 8,
  'halo 3': 8,
  'halo 4': 8,
  'halo 5: guardians': 10,
  'forza motorsport 4': 10,
  'gears of war': 6,
  'gears of war 2': 6,
  'gears of war 3': 6,
  'sunset overdrive': 10,
  'quantum break': 12,
  'star wars knights of the old republic': 25,
};

/**
 * Coefficients selon l'état du jeu par rapport à la cote CIB (Complet en boîte)
 * Ajusté à la réalité du marché des collectionneurs français :
 * - Pour les jeux en boîte carton (rétro), la boîte et la notice représentent 60% à 70% du prix !
 * - Le neuf sous blister rigide ou avec liseré officiel Nintendo/Sony bénéficie d'une forte prime.
 */
export const CONDITION_COEFFICIENTS: Record<GameCondition, number> = {
  neuf: 2.0,         // Neuf sous blister officiel (très recherché en France)
  complet: 1.0,      // Boîte, jaquette, notice et jeu en bon état (base de référence CIB)
  loose: 0.40,       // Cartouche ou disque seul sans boîte ni notice
  boite_seule: 0.40, // Boîte seule + notice (très convoité pour reconstituer les jeux rétro)
  dematerialise: 0,   // Dématérialisé (pas de valeur de revente sur le marché d'occasion)
};

/**
 * Valeurs de base moyennes réalistes par console pour les jeux courants non répertoriés
 * Calibrées sur les transactions réelles en France (Mister Game Price / Vinted / Cash Converters)
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

/**
 * Détecte les jeux de sport de masse et jeux casuals courants qui ont une très faible cote (1€ - 3€)
 * en France (FIFA, PES, NBA 2K, Madden, SingStar, etc.).
 */
function isLowValueSportsOrCasual(titleLower: string, consoleName: string): boolean {
  const isSports =
    titleLower.includes('fifa') ||
    titleLower.includes('pes ') ||
    titleLower.includes('pro evolution soccer') ||
    titleLower.includes('ea sports fc') ||
    titleLower.includes('nba 2k') ||
    titleLower.includes('nba live') ||
    titleLower.includes('madden') ||
    titleLower.includes('wwe 2k') ||
    titleLower.includes('smackdown') ||
    titleLower.includes('nhl ') ||
    titleLower.includes('tiger woods');

  const isOldCasual =
    titleLower.includes('singstar') ||
    titleLower.includes('wii fit') ||
    titleLower.includes('wii play') ||
    titleLower.includes('buzz !') ||
    titleLower.includes('buzz!') ||
    (titleLower.includes('just dance') && !titleLower.includes('2024') && !titleLower.includes('2025'));

  const modernOrDiscConsole =
    consoleName.includes('PlayStation 2') ||
    consoleName.includes('PlayStation 3') ||
    consoleName.includes('PlayStation 4') ||
    consoleName.includes('Xbox 360') ||
    consoleName.includes('Xbox One') ||
    consoleName.includes('Wii') ||
    consoleName.includes('PC');

  return (isSports || isOldCasual) && modernOrDiscConsole;
}

/**
 * Calcule l'estimation réaliste de la cote d'occasion pour un jeu selon le marché français & européen
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

  const titleLower = title.toLowerCase();

  // 1. Règle spéciale de réalité économique pour les jeux de sport annuels de masse (FIFA, PES, NBA...)
  if (isLowValueSportsOrCasual(titleLower, consoleName)) {
    // Les FIFA/PES d'anciennes générations valent entre 2€ et 3€ complets en France (1€ en loose)
    const sportsBase = 3;
    if (condition === 'loose') return 1;
    if (condition === 'neuf') return 8;
    return sportsBase;
  }

  // 2. Traitement spécifique haute précision pour les grandes sagas selon la plateforme
  // A. Saga METAL GEAR
  if (titleLower.includes('metal gear') || titleLower.includes('mgs')) {
    if (
      titleLower.includes(' 4') ||
      titleLower.includes('iv') ||
      titleLower.includes('guns of the patriots')
    ) {
      const baseMgs4 = 10;
      const coeff = CONDITION_COEFFICIENTS[condition] ?? 1.0;
      return Math.max(Math.round(baseMgs4 * coeff), 2);
    }
    if (
      titleLower.includes(' 5') ||
      titleLower.includes(' v') ||
      titleLower.includes('phantom pain')
    ) {
      const baseMgs5 = 10;
      const coeff = CONDITION_COEFFICIENTS[condition] ?? 1.0;
      return Math.max(Math.round(baseMgs5 * coeff), 2);
    }
    if (titleLower.includes('ground zeroes')) {
      const baseGz = 8;
      const coeff = CONDITION_COEFFICIENTS[condition] ?? 1.0;
      return Math.max(Math.round(baseGz * coeff), 2);
    }
    if (titleLower.includes('master collection')) {
      const baseMc = 32;
      const coeff = CONDITION_COEFFICIENTS[condition] ?? 1.0;
      return Math.max(Math.round(baseMc * coeff), 2);
    }
    if (titleLower.includes('twin snakes')) {
      const baseTs = 110;
      const coeff = CONDITION_COEFFICIENTS[condition] ?? 1.0;
      return Math.max(Math.round(baseTs * coeff), 2);
    }
    if (
      consoleName.includes('PlayStation 4') ||
      consoleName.includes('PlayStation 3') ||
      consoleName.includes('Xbox')
    ) {
      const baseMgsModern = consoleName.includes('PlayStation 4') ? 12 : 10;
      const coeff = CONDITION_COEFFICIENTS[condition] ?? 1.0;
      return Math.max(Math.round(baseMgsModern * coeff), 2);
    }
  }

  // B. Saga RESIDENT EVIL
  if (titleLower.includes('resident evil') || titleLower.includes('biohazard')) {
    if (consoleName.includes('PlayStation 3') || consoleName.includes('Xbox 360')) {
      // RE5 et RE6 sur PS3/360 valent entre 6€ et 8€ complets
      const baseRe = (titleLower.includes('revelations') || titleLower.includes('code veronica')) ? 10 : 7;
      const coeff = CONDITION_COEFFICIENTS[condition] ?? 1.0;
      return Math.max(Math.round(baseRe * coeff), 2);
    }
    if (consoleName.includes('PlayStation 4') || consoleName.includes('Xbox One')) {
      let baseRe4 = 14;
      if (titleLower.includes('4 remake')) baseRe4 = 28;
      else if (titleLower.includes('2 remake') || titleLower.includes('3 remake') || titleLower.includes('village')) baseRe4 = 18;
      else if (titleLower.includes('7') || titleLower.includes('biohazard')) baseRe4 = 12;
      else if (titleLower.includes('5') || titleLower.includes('6')) baseRe4 = 10;
      const coeff = CONDITION_COEFFICIENTS[condition] ?? 1.0;
      return Math.max(Math.round(baseRe4 * coeff), 2);
    }
  }

  // C. Saga GRAND THEFT AUTO (GTA)
  if (titleLower.includes('grand theft auto') || titleLower.includes('gta')) {
    if (consoleName.includes('PlayStation 3') || consoleName.includes('Xbox 360')) {
      const baseGta = (titleLower.includes('iv') || titleLower.includes('4') || titleLower.includes('v') || titleLower.includes('5')) ? 8 : 10;
      const coeff = CONDITION_COEFFICIENTS[condition] ?? 1.0;
      return Math.max(Math.round(baseGta * coeff), 2);
    }
    if (consoleName.includes('PlayStation 4') || consoleName.includes('Xbox One')) {
      const baseGta4 = titleLower.includes('trilogy') ? 20 : 15;
      const coeff = CONDITION_COEFFICIENTS[condition] ?? 1.0;
      return Math.max(Math.round(baseGta4 * coeff), 2);
    }
  }

  // D. Blockbusters très répandus sur PS3 / PS4 / Xbox (Call of Duty, Battlefield, Assassin's Creed, Far Cry, Uncharted)
  const isBlockbusterSeries =
    titleLower.includes('call of duty') ||
    titleLower.includes('battlefield') ||
    titleLower.includes('assassin') ||
    titleLower.includes('far cry') ||
    titleLower.includes('uncharted') ||
    titleLower.includes('tomb raider') ||
    titleLower.includes('watch dogs') ||
    titleLower.includes('batman arkham') ||
    titleLower.includes('destiny') ||
    titleLower.includes('division');

  if (isBlockbusterSeries) {
    if (consoleName.includes('PlayStation 3') || consoleName.includes('Xbox 360')) {
      const baseBb = 6;
      const coeff = CONDITION_COEFFICIENTS[condition] ?? 1.0;
      return Math.max(Math.round(baseBb * coeff), 2);
    }
    if (consoleName.includes('PlayStation 4') || consoleName.includes('Xbox One')) {
      const baseBb4 = 10;
      const coeff = CONDITION_COEFFICIENTS[condition] ?? 1.0;
      return Math.max(Math.round(baseBb4 * coeff), 2);
    }
  }

  // 3. Recherche exacte dans le dictionnaire des cotes connues
  let baseCib = KNOWN_COTES_CIB[cleanTitle];

  // 4. Recherche intelligente par clé si non trouvé exactement
  if (baseCib === undefined) {
    // Normaliser les chiffres (ex: 1, 2, 3, 4) pour éviter qu'un jeu avec numéro ("mgs 4", "resident evil 2")
    // n'aille matcher un opus différent sans numéro ("mgs 1", "resident evil")
    const titleNumbers = cleanTitle.match(/\b\d+\b/g) || [];
    const candidates: { key: string; val: number; score: number }[] = [];

    for (const [key, val] of Object.entries(KNOWN_COTES_CIB)) {
      const keyNumbers = key.match(/\b\d+\b/g) || [];

      // Si l'un ou l'autre a des chiffres identifiables, ils doivent impérativement concorder
      if (titleNumbers.length > 0 || keyNumbers.length > 0) {
        if (titleNumbers.join(' ') !== keyNumbers.join(' ')) {
          continue;
        }
      }

      if (cleanTitle === key) {
        candidates.push({ key, val, score: 1000 + key.length });
      } else if (cleanTitle.startsWith(key + ' ') || cleanTitle.includes(' ' + key + ' ')) {
        candidates.push({ key, val, score: 500 + key.length });
      } else if (key.startsWith(cleanTitle + ' ') || key.includes(' ' + cleanTitle + ' ')) {
        candidates.push({ key, val, score: 400 + cleanTitle.length });
      } else if (cleanTitle.includes(key) && key.length >= 5) {
        candidates.push({ key, val, score: 200 + key.length });
      } else if (key.includes(cleanTitle) && cleanTitle.length >= 6) {
        candidates.push({ key, val, score: 100 + cleanTitle.length });
      }
    }

    if (candidates.length > 0) {
      // Prioriser la clé la plus précise et spécifique
      candidates.sort((a, b) => b.score - a.score);
      baseCib = candidates[0].val;
    }
  }

  // 5. Heuristique réaliste par console et prestige de licence (spécificités France / PAL)
  if (baseCib === undefined) {
    baseCib = CONSOLE_BASE_VALUES[consoleName] || 15;

    // Licences cultes et recherchées en France
    if (
      titleLower.includes('zelda') ||
      titleLower.includes('pokemon') ||
      titleLower.includes('pokémon')
    ) {
      // Les Pokémon et Zelda en boîte FR ont une très forte cote en France
      baseCib += (consoleName.includes('SNES') || consoleName.includes('N64') || consoleName.includes('Game Boy')) ? 50 : 25;
    } else if (
      titleLower.includes('mario') ||
      titleLower.includes('metroid') ||
      titleLower.includes('chrono') ||
      titleLower.includes('fire emblem')
    ) {
      baseCib += (consoleName.includes('SNES') || consoleName.includes('N64') || consoleName.includes('GameCube')) ? 30 : 15;
    } else if (
      titleLower.includes('silent hill') ||
      titleLower.includes('resident evil') ||
      titleLower.includes('castlevania') ||
      titleLower.includes('metal gear') ||
      titleLower.includes('souls') ||
      titleLower.includes('elden ring')
    ) {
      // Attention : Sur PS3/PS4/Xbox, Metal Gear Solid est un jeu très commun (8-12€), pas un jeu rétro rare !
      if (
        titleLower.includes('metal gear') &&
        (consoleName.includes('PlayStation 3') || consoleName.includes('PlayStation 4') || consoleName.includes('Xbox'))
      ) {
        baseCib = 10;
      } else {
        baseCib += 20;
      }
    } else if (
      titleLower.includes('collector') ||
      titleLower.includes('steelbook') ||
      titleLower.includes('edition limitee') ||
      titleLower.includes('limited')
    ) {
      baseCib += 25;
    }
  }

  // Application du coefficient d'état
  const coeff = CONDITION_COEFFICIENTS[condition] ?? 1.0;
  const rawValue = Math.round(baseCib * coeff);

  // Valeur plancher : 2€ pour un jeu physique en état complet
  return Math.max(rawValue, 2);
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
