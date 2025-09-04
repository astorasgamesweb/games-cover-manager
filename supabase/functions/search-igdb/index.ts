import { corsHeaders } from '../_shared/cors.ts'

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

const IGDB_CLIENT_ID = 'a78bukj82ys6jskweubwi6ihy06uml';
const IGDB_CLIENT_SECRET = 'f77p2e3mfbawxjbjs5snenczbsvrko';
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

async function searchGameOnIGDB(gameName: string): Promise<IGDBGame[]> {
  const accessToken = await getIGDBAccessToken();
  if (!accessToken) {
    throw new Error('Could not get IGDB access token');
  }

  try {
    const body = `search "${gameName}"; fields name,cover.url,first_release_date,summary,storyline; limit 20;`;
    
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

    console.log(`Searching IGDB for: "${gameName}" (hasImage: ${hasImage}, hasYear: ${hasYear}, hasDescription: ${hasDescription})`);

    const igdbGames = await searchGameOnIGDB(gameName);

    // Try to find exact match
    const exactMatch = igdbGames.find(game => 
      game.name.toLowerCase() === gameName.toLowerCase()
    );

    if (exactMatch) {
      console.log(`Found exact match on IGDB: ${exactMatch.name}`);
      
      let covers = [];
      
      // Only include cover if image is missing and cover exists
      if (!hasImage && exactMatch.cover?.url) {
        const coverUrl = formatIGDBCoverUrl(exactMatch.cover.url);
        covers = [{
          id: exactMatch.id,
          url: coverUrl,
          thumb: coverUrl,
          width: 600,
          height: 900,
          score: 100,
          style: 'alternate',
          tags: ['igdb']
        }];
      }
      
      const releaseYear = formatReleaseYear(exactMatch.first_release_date);
      const description = exactMatch.summary || exactMatch.storyline || '';

      // Prepare game data, only including fields that are missing
      const gameData: any = {};
      if (!hasYear && releaseYear) gameData.year = releaseYear;
      if (!hasDescription && description) gameData.description = description;
      gameData.name = exactMatch.name; // Always include name for "nuevo nombre" field

      return new Response(
        JSON.stringify({ 
          success: true, 
          covers: covers, // Will be empty if hasImage is true
          gameData: gameData
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
    if (igdbGames.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No games found on IGDB',
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

    console.log(`Returning ${igdbGames.length} IGDB suggestions`);

    return new Response(
      JSON.stringify({ 
        success: false, 
        suggestions: igdbGames.map(game => ({
          id: game.id,
          name: game.name,
          logo: game.cover?.url ? formatIGDBCoverUrl(game.cover.url) : null,
          year: formatReleaseYear(game.first_release_date),
          description: game.summary || game.storyline || '',
          verified: false // IGDB doesn't have verification like SteamGridDB
        })),
        message: `No exact match found. Found ${igdbGames.length} similar games on IGDB`
      }),
      {
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        },
      }
    );

  } catch (error) {
    console.error('Error in search-igdb function:', error);
    
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