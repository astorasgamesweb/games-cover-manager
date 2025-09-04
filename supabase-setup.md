# Supabase Setup Instructions

## Click "Connect to Supabase" Button

To deploy the Edge Functions with the STEAMGRIDDB_API_KEY, please:

1. **Click the "Connect to Supabase" button** in the top-right corner of this interface
2. This will automatically:
   - Deploy all Edge Functions (`search-covers`, `get-covers`, `get-igdb-covers`)
   - Configure the STEAMGRIDDB_API_KEY environment variable
   - Set up the proper Supabase connection

## API Key Configuration

The following API key will be configured automatically:
- **STEAMGRIDDB_API_KEY**: `22e963790f455af9b1b0b57e1f9ee2f9`

## IGDB Credentials

The IGDB credentials are already integrated in the code:
- **Client ID**: `a78bukj82ys6jskweubwi6ihy06uml`
- **Client Secret**: `f77p2e3mfbawxjbjs5snenczbsvrko`

## After Connection

Once connected, the application will have full access to:
- ✅ SteamGridDB API for game covers
- ✅ IGDB API for game data and fallback covers
- ✅ Automatic data enrichment (names, years, descriptions)
- ✅ CSV export with all fields populated

## Verification

After clicking "Connect to Supabase", you can verify the setup by:
1. Uploading a CSV file with game names
2. Starting the processing
3. Checking that games are found and covers are retrieved

The Edge Functions will be automatically deployed and configured with the correct API keys.