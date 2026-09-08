export type GameConsole = 
  | 'Nintendo Switch'
  | 'Nintendo Wii U'
  | 'Nintendo Wii'
  | 'Nintendo GameCube'
  | 'Nintendo 64'
  | 'Super Nintendo (SNES)'
  | 'NES'
  | 'Game Boy / Advance'
  | 'Nintendo 3DS / DS'
  | 'PlayStation 5'
  | 'PlayStation 4'
  | 'PlayStation 3'
  | 'PlayStation 2'
  | 'PlayStation 1'
  | 'PlayStation Vita / PSP'
  | 'Xbox Series X|S'
  | 'Xbox One'
  | 'Xbox 360'
  | 'Xbox Original'
  | 'Sega Mega Drive / Genesis'
  | 'Sega Dreamcast / Saturn'
  | 'PC'
  | 'Autre';

export type GameCondition = 'neuf' | 'complet' | 'loose' | 'boite_seule' | 'dematerialise';

export type GameStatus = 'backlog' | 'playing' | 'completed' | 'wishlist';

export type ViewMode = 'list' | 'shelf' | 'table';

export interface Game {
  id: string;
  title: string;
  console: GameConsole | string;
  barcode?: string;
  releaseYear?: number;
  publisher?: string;
  developer?: string;
  genre?: string;
  coverUrl?: string;
  condition: GameCondition;
  status: GameStatus;
  rating?: number; // 0-5
  notes?: string;
  purchasePrice?: number;
  estimatedValue?: number;
  addedAt: string;
  quantity?: number;
}

export interface GameLookupResult {
  title: string;
  console: string;
  releaseYear?: number;
  publisher?: string;
  developer?: string;
  genre?: string;
  synopsis?: string;
  coverUrl?: string;
  barcode?: string;
  confidence?: 'high' | 'medium' | 'low';
}
