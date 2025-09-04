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

const STEAMGRIDDB_API_KEY = Deno.env.get('STEAMGRIDDB_API_KEY');

// Fallback API key if environment variable is not set
const API_KEY = STEAMGRIDDB_API_KEY || '22e963790f455af9b1b0b57e1f9ee2f9';

const STEAMGRIDDB_BASE_URL = 'https://www.steamgriddb.com/api/v2';

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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    if (!API_KEY) {
      throw new Error('SteamGridDB API key not configured');
    }

    console.log(`Using SteamGridDB API key: ${API_KEY.substring(0, 8)}...`);

    let { gameName, hasImage, hasYear, hasDescription } = await req.json();

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
      .replace(/[._]/g, ' ') // Convert dots and underscores to spaces
      .replace(/[®™©]/g, '') // Remove trademark symbols
      .replace(/\s+(PS[1-5]|Xbox|PC|Switch|Steam|Epic|GOG|Origin)(\s|$)/gi, ' ') // Remove platform suffixes

    console.log(`Searching SteamGridDB for: "${gameName}" (hasImage: ${hasImage}, hasYear: ${hasYear}, hasDescription: ${hasDescription})`);

    const steamGames = await searchGameByName(gameName);

    // Try to find exact match
    const exactMatch = steamGames.find(game => 
      game.name.toLowerCase() === gameName.toLowerCase()
    );

    if (exactMatch) {
      console.log(`Found exact match on SteamGridDB: ${exactMatch.name}`);
      
      // Only get covers if image is missing
      let covers = [];
      if (!hasImage) {
        covers = await getGameCovers(exactMatch.id);
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          covers: covers.slice(0, 20), // Will be empty array if hasImage is true
          game: exactMatch,
          gameData: {
            name: exactMatch.name,
            verified: exactMatch.verified
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

    // No exact match found, return suggestions
    if (steamGames.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No games found on SteamGridDB',
          suggestions: []
        }),
        {
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          },
        }
      );
    }

    console.log(`Returning ${steamGames.length} SteamGridDB suggestions`);

    return new Response(
      JSON.stringify({ 
        success: false, 
        suggestions: steamGames.slice(0, 10),
        message: `No exact match found. Found ${steamGames.length} similar games on SteamGridDB`
      }),
      {
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        },
      }
    );

  } catch (error) {
    console.error('Error in search-steamgriddb function:', error);
    
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