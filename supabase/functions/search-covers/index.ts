import { corsHeaders } from '../_shared/cors.ts'

interface SteamGridDBGame {
  id: number;
  name: string;
  verified: boolean;
  logo?: string;
}

interface SteamGridDBCover {
  id: number;
  url: string;
  thumb: string;
  width: number;
  height: number;
  score: number;
  style: string;
  tags: string[];
}

interface IGDBGame {
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

const STEAMGRIDDB_API_KEY = Deno.env.get('STEAMGRIDDB_API_KEY');

// Fallback API key if environment variable is not set
const API_KEY = STEAMGRIDDB_API_KEY || '22e963790f455af9b1b0b57e1f9ee2f9';

const IGDB_CLIENT_ID = 'a78bukj82ys6jskweubwi6ihy06uml';
const IGDB_CLIENT_SECRET = 'f77p2e3mfbawxjbjs5snenczbsvrko';
const STEAMGRIDDB_BASE_URL = 'https://www.steamgriddb.com/api/v2';
const IGDB_BASE_URL = 'https://api.igdb.com/v4';

// Function to get IGDB access token
async function getIGDBAccessToken(): Promise<string | null> {
  try {
    const response = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `client_id=${IGDB_CLIENT_ID}&client_secret=${IGDB_CLIENT_SECRET}&grant_type=client_credentials`,
    });

    if (!response.ok) {
      throw new Error(`Token request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error getting IGDB access token:', error);
    return null;
  }
}

async function searchGameByName(gameName: string): Promise<SteamGridDBGame[]> {
  try {
    const response = await fetch(`${STEAMGRIDDB_BASE_URL}/search/autocomplete/${encodeURIComponent(gameName)}`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'User-Agent': 'SteamGridDB CSV Manager/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`SteamGridDB API request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error searching game on SteamGridDB:', error);
    return [];
  }
}

async function getGameCovers(gameId: number): Promise<SteamGridDBCover[]> {
  try {
    const response = await fetch(`${STEAMGRIDDB_BASE_URL}/grids/game/${gameId}?dimensions=600x900`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'User-Agent': 'SteamGridDB CSV Manager/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`SteamGridDB API request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching covers from SteamGridDB:', error);
    return [];
  }
}

async function searchGameOnIGDB(gameName: string): Promise<IGDBGame[]> {
  const accessToken = await getIGDBAccessToken();
  if (!accessToken) {
    console.log('Could not get IGDB access token, skipping IGDB search');
    return [];
  }

  try {
    const body = `search "${gameName}"; fields name,cover.url,first_release_date,summary,storyline; limit 10;`;
    
    const response = await fetch(`${IGDB_BASE_URL}/games`, {
      method: 'POST',
      headers: {
        'Client-ID': IGDB_CLIENT_ID,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'text/plain',
      },
      body: body,
    });

    if (!response.ok) {
      throw new Error(`IGDB API request failed: ${response.status}`);
    }

    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error('Error searching game on IGDB:', error);
    return [];
  }
}

function formatIGDBCoverUrl(url: string): string {
  if (!url) return '';
  // Convert IGDB thumbnail URL to full size
  return url.replace('t_thumb', 't_cover_big');
}

function formatReleaseYear(timestamp?: number): string {
  if (!timestamp) return '';
  return new Date(timestamp * 1000).getFullYear().toString();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    let { gameName } = await req.json();

    if (!gameName || typeof gameName !== 'string') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Game name is required' 
        }),
        {
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          },
        }
      );
    }

    // Additional server-side cleaning for better search results
    const originalGameName = gameName;
    gameName = gameName
      .replace(/[®™©]/g, '') // Remove trademark symbols
      .replace(/\s+(PS[1-5]|Xbox|PC|Switch|Steam|Epic|GOG|Origin)(\s|$)/gi, ' ') // Remove platform suffixes
      .replace(/\s+(Edition|Deluxe|GOTY|Complete|Ultimate|Remastered|HD|Definitive)(\s|$)/gi, ' ') // Remove edition suffixes
      .replace(/\s+(Game\s+of\s+the\s+Year|Director's\s+Cut|Enhanced\s+Edition|Special\s+Edition)(\s|$)/gi, ' ') // Remove more edition types
      .replace(/[^\w\s\-:.']/g, '') // Remove other special characters except basic punctuation
      .replace(/\s+/g, ' ') // Normalize multiple spaces
      .trim();

    console.log(`Searching for: "${originalGameName}"${originalGameName !== gameName ? ` (cleaned: "${gameName}")` : ''}`);

    let steamGames: SteamGridDBGame[] = [];
    let exactSteamMatch: SteamGridDBGame | undefined;

    // First, try SteamGridDB if API key is available
    if (API_KEY) {
      console.log(`Using SteamGridDB API key: ${API_KEY.substring(0, 8)}...`);
      steamGames = await searchGameByName(gameName);

      // Try to find exact match on SteamGridDB first
      exactSteamMatch = steamGames.find(game => 
        game.name.toLowerCase() === gameName.toLowerCase()
      );

      if (exactSteamMatch) {
        console.log(`Found exact match on SteamGridDB: ${exactSteamMatch.name}`);
        const covers = await getGameCovers(exactSteamMatch.id);
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            covers: covers.slice(0, 20),
            game: exactSteamMatch,
            source: 'steamgriddb',
            gameData: {
              name: exactSteamMatch.name,
              verified: exactSteamMatch.verified
            }
          }),
          {
            headers: { 
              'Content-Type': 'application/json',
              ...corsHeaders 
            },
          }
        );
      }
    } else {
      console.log('No SteamGridDB API key available, skipping SteamGridDB search');
    }

    // If no exact match on SteamGridDB or SteamGridDB not available, try IGDB
    const igdbGames = await searchGameOnIGDB(gameName);

    // Try to find exact match on IGDB
    const exactIGDBMatch = igdbGames.find(game => 
      game.name.toLowerCase() === gameName.toLowerCase()
    );

    if (exactIGDBMatch && exactIGDBMatch.cover?.url) {
      console.log(`Found exact match on IGDB: ${exactIGDBMatch.name}`);
      
      const coverUrl = formatIGDBCoverUrl(exactIGDBMatch.cover.url);
      const releaseYear = formatReleaseYear(exactIGDBMatch.first_release_date);
      const description = exactIGDBMatch.summary || exactIGDBMatch.storyline || '';

      // Create a cover object compatible with SteamGridDB format
      const igdbCover = {
        id: exactIGDBMatch.id,
        url: coverUrl,
        thumb: coverUrl,
        width: 600,
        height: 900,
        score: 100,
        style: 'alternate',
        tags: ['igdb']
      };

      return new Response(
        JSON.stringify({ 
          success: true, 
          covers: [igdbCover],
          source: 'igdb',
          gameData: {
            name: exactIGDBMatch.name,
            year: releaseYear,
            description: description
          }
        }),
        {
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          },
        }
      );
    }

    // No exact matches found, return suggestions from both sources
    const suggestions = API_KEY ? steamGames.slice(0, 5) : [];
    const igdbSuggestions = igdbGames.slice(0, 5);

    if (suggestions.length === 0 && igdbSuggestions.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `No games found${API_KEY ? ' on SteamGridDB or IGDB' : ' on IGDB (SteamGridDB not configured)'}`,
          suggestions: [],
          igdbSuggestions: []
        }),
        {
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          },
        }
      );
    }

    console.log(`Returning ${suggestions.length} SteamGridDB suggestions and ${igdbSuggestions.length} IGDB suggestions`);

    return new Response(
      JSON.stringify({ 
        success: false, 
        suggestions: suggestions,
        igdbSuggestions: igdbSuggestions.map(game => ({
          ...game,
          coverUrl: game.cover?.url ? formatIGDBCoverUrl(game.cover.url) : null,
          year: formatReleaseYear(game.first_release_date),
          description: game.summary || game.storyline || ''
        })),
        message: `No exact match found. Found ${suggestions.length} SteamGridDB + ${igdbSuggestions.length} IGDB similar games`
      }),
      {
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        },
      }
    );

  } catch (error) {
    console.error('Error in search-covers function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error'
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        },
      }
    );
  }
});