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
  screenshots?: Array<{
    id: number;
    url: string;
  }>;
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

async function getIGDBGameDetails(gameId: number): Promise<IGDBGame | null> {
  const accessToken = await getIGDBAccessToken();
  if (!accessToken) {
    throw new Error('Could not get IGDB access token');
  }

  try {
    const body = `fields name,cover.url,first_release_date,summary,storyline,screenshots.url; where id = ${gameId};`;
    
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
    return data[0] || null;
  } catch (error) {
    console.error('Error fetching IGDB game details:', error);
    return null;
  }
}

function formatIGDBCoverUrl(url: string): string {
  if (!url) return '';
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

    const gameDetails = await getIGDBGameDetails(gameId);
    
    if (!gameDetails) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Game not found on IGDB'
        }),
        {
          status: 404,
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          },
        }
      );
    }

    const covers = [];
    
    // Add main cover if available
    if (gameDetails.cover?.url) {
      covers.push({
        id: gameDetails.cover.id,
        url: formatIGDBCoverUrl(gameDetails.cover.url),
        thumb: formatIGDBCoverUrl(gameDetails.cover.url),
        width: 600,
        height: 900,
        score: 100,
        style: 'official',
        tags: ['igdb', 'cover']
      });
    }

    // Add screenshots as alternative covers
    if (gameDetails.screenshots) {
      gameDetails.screenshots.slice(0, 10).forEach((screenshot, index) => {
        covers.push({
          id: screenshot.id,
          url: formatIGDBCoverUrl(screenshot.url),
          thumb: formatIGDBCoverUrl(screenshot.url),
          width: 600,
          height: 900,
          score: 90 - index,
          style: 'screenshot',
          tags: ['igdb', 'screenshot']
        });
      });
    }

    const releaseYear = formatReleaseYear(gameDetails.first_release_date);
    const description = gameDetails.summary || gameDetails.storyline || '';

    return new Response(
      JSON.stringify({ 
        success: true, 
        covers: covers,
        gameData: {
          name: gameDetails.name,
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

  } catch (error) {
    console.error('Error in get-igdb-covers function:', error);
    
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