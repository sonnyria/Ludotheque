export interface CatalogGame {
  title: string;
  console: string;
  releaseYear?: number;
  publisher?: string;
  developer?: string;
  genre?: string;
  synopsis?: string;
  coverUrl?: string;
}

// Aucune base de données interne hardcodée.
// Toutes les résolutions de codes-barres s'effectuent en direct sur le web.
export const BARCODE_CATALOG: Record<string, CatalogGame> = {};

export function lookupBarcodeInCatalog(_rawCode: string): CatalogGame | null {
  // Aucune base interne : on retourne null pour forcer la recherche en direct sur le Web
  return null;
}

export function findGameInCatalog(_query: string, _preferredConsole?: string): CatalogGame | undefined {
  return undefined;
}

export function searchGamesInCatalog(_query: string, _max = 5): CatalogGame[] {
  return [];
}
