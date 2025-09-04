export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'error' | 'no-results';

export interface Game {
  name: string;
  'nuevo nombre'?: string;
  portada?: string;
  año?: string;
  descripción?: string;
  image?: string;
  status?: ProcessingStatus;
  [key: string]: any;
}

export interface SteamGridDBCover {
  id: number;
  url: string;
  thumb: string;
  width: number;
  height: number;
  score: number;
  style: string;
  tags: string[];
}

export interface SteamGridDBGame {
  id: number;
  name: string;
  verified: boolean;
  logo: string;
}

export interface IGDBGame {
  id: number;
  name: string;
  cover?: {
    id: number;
    url: string;
  };
  first_release_date?: number;
  summary?: string;
  storyline?: string;
}

export interface SearchResult {
  success: boolean;
  covers?: SteamGridDBCover[];
  suggestions?: SteamGridDBGame[];
  igdbSuggestions?: IGDBGame[];
  source?: 'steamgriddb' | 'igdb';
  error?: string;
}