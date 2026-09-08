export interface ConsoleTheme {
  name: string;
  bgBadge: string;
  textBadge: string;
  borderBadge: string;
  accentColor: string;
  category: 'nintendo' | 'playstation' | 'xbox' | 'sega' | 'retro' | 'pc' | 'autre';
}

export function getConsoleTheme(consoleName: string): ConsoleTheme {
  const c = consoleName.toLowerCase();
  
  if (c.includes('switch')) {
    return {
      name: consoleName,
      bgBadge: 'bg-red-500/10 text-red-600 dark:text-red-400',
      textBadge: 'text-red-600 dark:text-red-400',
      borderBadge: 'border-red-500/30',
      accentColor: '#e60012',
      category: 'nintendo',
    };
  }
  if (c.includes('nintendo') || c.includes('nes') || c.includes('snes') || c.includes('gamecube') || c.includes('wii') || c.includes('game boy') || c.includes('3ds') || c.includes('ds')) {
    return {
      name: consoleName,
      bgBadge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
      textBadge: 'text-rose-600 dark:text-rose-400',
      borderBadge: 'border-rose-500/30',
      accentColor: '#d62246',
      category: 'nintendo',
    };
  }
  if (c.includes('playstation 5') || c.includes('ps5')) {
    return {
      name: consoleName,
      bgBadge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      textBadge: 'text-blue-600 dark:text-blue-400',
      borderBadge: 'border-blue-500/30',
      accentColor: '#0070d1',
      category: 'playstation',
    };
  }
  if (c.includes('playstation') || c.includes('ps4') || c.includes('ps3') || c.includes('ps2') || c.includes('ps1') || c.includes('vita') || c.includes('psp')) {
    return {
      name: consoleName,
      bgBadge: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
      textBadge: 'text-indigo-600 dark:text-indigo-400',
      borderBadge: 'border-indigo-500/30',
      accentColor: '#003791',
      category: 'playstation',
    };
  }
  if (c.includes('xbox')) {
    return {
      name: consoleName,
      bgBadge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      textBadge: 'text-emerald-600 dark:text-emerald-400',
      borderBadge: 'border-emerald-500/30',
      accentColor: '#107c10',
      category: 'xbox',
    };
  }
  if (c.includes('sega') || c.includes('dreamcast') || c.includes('mega drive') || c.includes('saturn')) {
    return {
      name: consoleName,
      bgBadge: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
      textBadge: 'text-sky-600 dark:text-sky-400',
      borderBadge: 'border-sky-500/30',
      accentColor: '#0089cf',
      category: 'sega',
    };
  }
  if (c.includes('pc') || c.includes('steam')) {
    return {
      name: consoleName,
      bgBadge: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
      textBadge: 'text-purple-600 dark:text-purple-400',
      borderBadge: 'border-purple-500/30',
      accentColor: '#6e44ff',
      category: 'pc',
    };
  }

  return {
    name: consoleName,
    bgBadge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    textBadge: 'text-amber-600 dark:text-amber-400',
    borderBadge: 'border-amber-500/30',
    accentColor: '#d97706',
    category: 'autre',
  };
}

export const CONDITION_LABELS: Record<string, { label: string; desc: string }> = {
  neuf: { label: 'Neuf sous blister', desc: 'Jeu scellé d\'origine' },
  complet: { label: 'Complet (CIB)', desc: 'Boîte, jeu et notice d\'origine' },
  loose: { label: 'Loose (Cartouche/CD)', desc: 'Jeu seul sans boîte' },
  boite_seule: { label: 'Boîte seule', desc: 'Sans le jeu' },
  dematerialise: { label: 'Dématérialisé', desc: 'Achat digital (eShop, PSN, etc.)' },
};

export const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  completed: { label: 'Terminé', color: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30' },
  playing: { label: 'En cours', color: 'bg-amber-500/15 text-amber-700 border-amber-500/30' },
  backlog: { label: 'À faire', color: 'bg-slate-500/15 text-slate-700 border-slate-500/30' },
  wishlist: { label: 'Liste d\'envies', color: 'bg-purple-500/15 text-purple-700 border-purple-500/30' },
};
