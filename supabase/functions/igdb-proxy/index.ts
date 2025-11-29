// ✅ IGDB API PROXY - Secure game data fetching
// Date: January 2025
// Purpose: Proxy IGDB API requests with caching to prevent credential exposure

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

// ✅ SECURITY: Credentials stored in Supabase secrets (validated at runtime, not startup)
const IGDB_CLIENT_ID = Deno.env.get('IGDB_CLIENT_ID');
const IGDB_CLIENT_SECRET = Deno.env.get('IGDB_CLIENT_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Initialize Supabase client lazily (only when needed)
let supabaseClient: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!supabaseClient) {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase environment variables');
    }
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  }
  return supabaseClient;
}

// Twitch OAuth token cache with mutex for thread safety
let accessToken: string | null = null;
let tokenExpiry: number = 0;
let tokenRefreshPromise: Promise<string> | null = null; // Mutex to prevent concurrent refreshes

interface IGDBRequest {
  gameName: string;
  includeScreenshots?: boolean;
  includeArtworks?: boolean;
  includeSimilarGames?: boolean;
  includeVideos?: boolean;
}

interface IGDBGameData {
  id: number;
  name: string;
  summary?: string;
  storyline?: string;
  rating?: number;
  aggregated_rating?: number;
  total_rating?: number;
  first_release_date?: number;
  genres?: { id: number; name: string }[];
  platforms?: { id: number; name: string; abbreviation?: string }[];
  themes?: { id: number; name: string }[];
  game_modes?: { id: number; name: string }[];
  player_perspectives?: { id: number; name: string }[];
  involved_companies?: { id: number; company: { id: number; name: string }; developer?: boolean; publisher?: boolean }[];
  cover?: { id: number; url: string; image_id: string };
  screenshots?: { id: number; url: string; image_id: string }[];
  artworks?: { id: number; url: string; image_id: string }[];
  videos?: { id: number; video_id: string; name?: string }[];
  similar_games?: { id: number; name: string; cover?: { id: number; url: string; image_id: string } }[];
  websites?: { id: number; url: string; category: number }[];
  age_ratings?: { id: number; category: number; rating: number }[];
  franchises?: { id: number; name: string }[];
  collections?: { id: number; name: string }[];
  dlcs?: { id: number; name: string }[];
  expansions?: { id: number; name: string }[];
  game_engines?: { id: number; name: string }[];
  keywords?: { id: number; name: string }[];
  status?: number;
  category?: number;
}

// Get Twitch OAuth token with mutex to prevent race conditions
async function getTwitchToken(): Promise<string> {
  // Validate credentials at runtime
  if (!IGDB_CLIENT_ID || !IGDB_CLIENT_SECRET) {
    throw new Error('IGDB credentials not configured');
  }

  const now = Date.now();
  
  // Return cached token if still valid (with 5min buffer)
  if (accessToken && tokenExpiry > now + 300000) {
    return accessToken;
  }

  // If another request is already refreshing the token, wait for it
  if (tokenRefreshPromise) {
    return tokenRefreshPromise;
  }

  // Create refresh promise (mutex)
  tokenRefreshPromise = (async () => {
    try {
      console.log('Requesting new Twitch OAuth token...');
      console.log('Using client_id:', IGDB_CLIENT_ID?.substring(0, 8) + '...');
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch('https://id.twitch.tv/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: IGDB_CLIENT_ID!,
          client_secret: IGDB_CLIENT_SECRET!,
          grant_type: 'client_credentials'
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Twitch OAuth failed:', response.status, errorText);
        throw new Error(`Failed to get Twitch token: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Twitch OAuth success, token expires in:', data.expires_in, 'seconds');
      accessToken = data.access_token;
      tokenExpiry = Date.now() + (data.expires_in * 1000);
      
      return accessToken!;
    } catch (error) {
      console.error('Twitch OAuth error:', error);
      throw error;
    } finally {
      tokenRefreshPromise = null; // Release mutex
    }
  })();

  return tokenRefreshPromise;
}

// Convert IGDB image URL to high-quality version
function getHighQualityImageUrl(url: string, size: 'cover_big' | 'screenshot_huge' | '1080p' = 'cover_big'): string {
  if (!url) return '';
  // IGDB returns //images.igdb.com/... URLs, we need to add https: and change size
  return url.replace('t_thumb', `t_${size}`).replace('//', 'https://');
}

// Search for game by name (with timeout)
async function searchGame(gameName: string, token: string): Promise<IGDBGameData | null> {
  // Use name-based search instead of search query for better results
  // IGDB's search endpoint can be finicky - using where clause with name matching works better
  const escapedName = gameName.replace(/"/g, '\\"');
  
  const body = `
    fields id, name, summary, storyline, rating, aggregated_rating, total_rating,
           first_release_date, genres.*, platforms.*, themes.*, game_modes.*,
           player_perspectives.*, involved_companies.*, involved_companies.company.*,
           cover.*, screenshots.*, artworks.*, videos.*, similar_games.*,
           similar_games.cover.*, websites.*, age_ratings.*, franchises.*,
           collections.*, dlcs.name, expansions.name, game_engines.name,
           keywords.*, status, category;
    search "${escapedName}";
    limit 5;
  `;

  console.log('IGDB search query for:', gameName);
  console.log('Full query body:', body.replace(/\s+/g, ' ').trim());
  console.log('Using Client-ID:', IGDB_CLIENT_ID?.substring(0, 8) + '...');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

  try {
    const response = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        'Client-ID': IGDB_CLIENT_ID!,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'text/plain'
      },
      body,
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('IGDB search failed:', response.status, errorText);
      return null;
    }

    const games = await response.json();
    console.log('IGDB search results count:', games?.length || 0);
    return games[0] || null;
  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('IGDB search timed out for:', gameName);
    } else {
      console.error('IGDB search error:', error);
    }
    return null;
  }
}

// Get game by ID (for similar games, with timeout)
async function getGameById(gameId: number, token: string): Promise<IGDBGameData | null> {
  const body = `
    fields id, name, summary, storyline, rating, aggregated_rating, total_rating,
           first_release_date, genres.*, platforms.*, themes.*, game_modes.*,
           player_perspectives.*, involved_companies.*, involved_companies.company.*,
           cover.*, screenshots.*, artworks.*, videos.*, similar_games.*,
           similar_games.cover.*, websites.*, age_ratings.*, franchises.*,
           collections.*, dlcs.name, expansions.name, game_engines.name,
           keywords.*, status, category;
    where id = ${gameId};
    limit 1;
  `;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

  try {
    const response = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        'Client-ID': IGDB_CLIENT_ID!,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'text/plain'
      },
      body,
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.error('IGDB get by ID failed:', response.status);
      return null;
    }

    const games = await response.json();
    return games[0] || null;
  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('IGDB get by ID timed out for:', gameId);
    } else {
      console.error('IGDB get by ID error:', error);
    }
    return null;
  }
}

// Process and enhance game data with high-quality image URLs
function processGameData(game: IGDBGameData): IGDBGameData {
  const processed = { ...game };
  
  // Convert cover image
  if (processed.cover?.url) {
    processed.cover.url = getHighQualityImageUrl(processed.cover.url, 'cover_big');
  }
  
  // Convert screenshots
  if (processed.screenshots) {
    processed.screenshots = processed.screenshots.map(ss => ({
      ...ss,
      url: getHighQualityImageUrl(ss.url, 'screenshot_huge')
    }));
  }
  
  // Convert artworks
  if (processed.artworks) {
    processed.artworks = processed.artworks.map(art => ({
      ...art,
      url: getHighQualityImageUrl(art.url, '1080p')
    }));
  }
  
  // Convert similar games covers
  if (processed.similar_games) {
    processed.similar_games = processed.similar_games.map(sg => ({
      ...sg,
      cover: sg.cover ? {
        ...sg.cover,
        url: getHighQualityImageUrl(sg.cover.url, 'cover_big')
      } : undefined
    }));
  }
  
  return processed;
}

serve(async (req: Request) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // ✅ Early validation of IGDB credentials
    if (!IGDB_CLIENT_ID || !IGDB_CLIENT_SECRET) {
      console.error('IGDB credentials not configured. Please set IGDB_CLIENT_ID and IGDB_CLIENT_SECRET in Supabase secrets.');
      return new Response(
        JSON.stringify({ 
          error: 'IGDB service not configured. Please contact support.', 
          success: false,
          code: 'IGDB_NOT_CONFIGURED'
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Supabase client (validates env vars)
    const supabase = getSupabaseClient();

    // Parse request - handle both string and object body
    let body: IGDBRequest;
    const rawBody = await req.text();
    console.log('Raw request body:', rawBody?.substring(0, 200));
    
    try {
      body = JSON.parse(rawBody);
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request body - expected JSON', 
          success: false,
          received: rawBody?.substring(0, 100)
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { gameName } = body;

    if (!gameName) {
      return new Response(
        JSON.stringify({ error: 'Game name is required', success: false }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check cache first (24 hour TTL) - don't block on cache errors
    const cacheKey = gameName.toLowerCase().trim();
    let cached = null;
    try {
      const { data } = await supabase
        .from('igdb_game_cache')
        .select('*')
        .eq('game_name_key', cacheKey)
        .gte('expires_at', new Date().toISOString())
        .single();
      cached = data;
    } catch (cacheError) {
      console.warn('Cache lookup failed, proceeding without cache:', cacheError);
    }

    if (cached) {
      console.log('IGDB cache hit:', gameName);
      return new Response(
        JSON.stringify({ success: true, data: cached.game_data, cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Twitch token
    const token = await getTwitchToken();

    // Check if request is for a specific game ID (for similar games)
    const gameIdMatch = gameName.match(/^id:(\d+)$/);
    let gameData: IGDBGameData | null;

    if (gameIdMatch) {
      const gameId = parseInt(gameIdMatch[1]);
      gameData = await getGameById(gameId, token);
    } else {
      gameData = await searchGame(gameName, token);
    }

    if (!gameData) {
      return new Response(
        JSON.stringify({ success: false, data: null, message: 'Game not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process data with high-quality images
    const processedData = processGameData(gameData);

    // Cache the result (24 hour TTL) - don't block on cache errors
    try {
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      await supabase
        .from('igdb_game_cache')
        .upsert({
          game_name_key: cacheKey,
          game_data: processedData,
          igdb_id: processedData.id,
          expires_at: expiresAt,
          created_at: new Date().toISOString()
        }, {
          onConflict: 'game_name_key'
        });
    } catch (cacheError) {
      console.warn('Failed to cache IGDB result:', cacheError);
      // Continue anyway - caching is not critical
    }

    return new Response(
      JSON.stringify({ success: true, data: processedData, cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('IGDB Proxy Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error', 
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
