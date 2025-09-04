import { corsHeaders } from '../_shared/cors.ts'

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

const BASE_URL = 'https://www.steamgriddb.com/api/v2';

async function getGameCovers(gameId: number): Promise<SteamGridDBCover[]> {
  try {
    const response = await fetch(`${BASE_URL}/grids/game/${gameId}`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'User-Agent': 'SteamGridDB CSV Manager/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching covers:', error);
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

    const { gameId } = await req.json();

    if (!gameId || typeof gameId !== 'number') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Game ID is required and must be a number' 
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

    // Get covers for the game
    const allCovers = await getGameCovers(gameId);
    
    // Filter and sort covers - prioritize 600x900, then by score
    const covers = allCovers
      .filter(cover => cover.url && cover.thumb)
      .sort((a, b) => {
        // Prioritize 600x900 dimension
        const aPriority = (a.width === 600 && a.height === 900) ? 1000 : 0;
        const bPriority = (b.width === 600 && b.height === 900) ? 1000 : 0;
        
        // Then sort by score
        return (bPriority + b.score) - (aPriority + a.score);
      })
      .slice(0, 50); // Limit to first 50 covers

    return new Response(
      JSON.stringify({ 
        success: true, 
        covers: covers
      }),
      {
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        },
      }
    );

  } catch (error) {
    console.error('Error in get-covers function:', error);
    
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