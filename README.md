# SteamGridDB CSV Manager

A comprehensive web application for automatically fetching game covers from SteamGridDB and updating CSV files with image URLs.

## Features

### Core Functionality
- **Enhanced CSV Support**: Import/export CSV files with fields: Nombre, Nuevo Nombre, Portada, Año, Descripción
- **Dual API Integration**: Searches SteamGridDB first, then IGDB as fallback for comprehensive coverage
- **Automated Data Enrichment**: Populates game names, covers, release years, and descriptions automatically
- **Smart Matching**: Prioritizes exact matches and provides suggestions from both databases
- **Manual Selection**: Interactive cover selection interface with thumbnails
- **Progress Tracking**: Real-time progress bar and detailed activity logging
- **Multi-source Results**: Clear indication of data source (SteamGridDB vs IGDB)

### Technical Features
- **Dual API Backend**: Secure integration with both SteamGridDB and IGDB APIs via Supabase Edge Functions
- **Error Handling**: Comprehensive error management and graceful degradation
- **Enhanced CSV Processing**: Support for structured game data with multiple fields
- **Responsive Design**: Mobile-friendly interface with modern design principles
- **Type Safety**: Full TypeScript implementation for better reliability
- **Dark Mode**: Complete dark/light theme support with system preference detection

## Getting Started

### Prerequisites
- Node.js 18+ 
- Supabase account
- SteamGridDB API key

### Installation

1. Clone and install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Configure your environment variables:
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
   - `STEAMGRIDDB_API_KEY`: Your SteamGridDB API key (for Edge Functions)

4. Start the development server:
```bash
npm run dev
```

### SteamGridDB API Key

1. Go to [SteamGridDB](https://www.steamgriddb.com/) and create an account
2. Navigate to [API Settings](https://www.steamgriddb.com/profile/preferences/api)
3. Generate a new API key
4. Add it to your environment variables

-H 'Content-Type: application/x-www-form-urlencoded' \
-d 'client_id=YOUR_CLIENT_ID&client_secret=YOUR_CLIENT_SECRET&grant_type=client_credentials'
**Note**: IGDB credentials are already integrated into the application and access tokens are generated automatically.

### Supabase Setup

The application uses Supabase Edge Functions for secure API communication with both SteamGridDB and IGDB:

1. Create a new Supabase project
2. Deploy the included Edge Functions
3. Configure environment variable in your Supabase dashboard:
   - `STEAMGRIDDB_API_KEY`

## Usage

### CSV Format Requirements

Your CSV file should follow this structure:
- **Required**: "Nombre" column with game names
- **Optional**: "Nuevo Nombre", "Portada", "Año", "Descripción" columns

Example CSV structure:
```csv
Nombre,Nuevo Nombre,Portada,Año,Descripción
"The Legend of Zelda: Breath of the Wild","","","",""
"Super Mario Odyssey","","","",""
```

### Processing Workflow

1. **Upload CSV**: Drag and drop or select your CSV file
2. **Review Games**: Check the imported games list
3. **Start Processing**: Click "Start Processing" to begin automatic search
4. **Automatic Enrichment**: 
   - Searches SteamGridDB first for covers and game data
   - Falls back to IGDB if not found on SteamGridDB
   - Populates "Nuevo Nombre", "Año", and "Descripción" automatically
5. **Handle Suggestions**: For games without exact matches, select from similar games from both databases
5. **Monitor Progress**: Watch real-time progress and activity logs
6. **Download Results**: Export the updated CSV with all populated fields

### Manual Override Options

- **Multi-source Selection**: Choose from similar games from both SteamGridDB and IGDB
- **Manual URL Input**: Enter image URLs directly
- **SteamGridDB Browser**: Open SteamGridDB in browser with pre-filled search terms
- **Source Indication**: Clear labels showing whether data comes from SteamGridDB or IGDB

## Architecture

### Frontend Components
- `CSVUploader`: File upload and parsing
- `GameProcessor`: Processing controls with dual-API progress tracking
- `GameSelector`: Enhanced selection modal with multi-source results
- `ProgressLogger`: Real-time activity logging
- `DarkModeToggle`: Theme switching component

### Backend Functions
- `search-covers`: Searches SteamGridDB first, then IGDB for comprehensive results
- `get-covers`: Retrieves covers for specific games
- `get-igdb-covers`: Retrieves covers and game data from IGDB

### API Integration
- Secure API key management for both SteamGridDB and IGDB via Edge Functions
- Intelligent fallback system (SteamGridDB → IGDB)
- Rate limiting and comprehensive error handling
- Data enrichment from multiple sources

## Development

### Project Structure
```
src/
├── components/          # React components
├── hooks/              # Custom React hooks (dark mode, etc.)
├── types/              # TypeScript definitions
└── App.tsx             # Main application component

supabase/functions/     # Edge Functions for API integration
├── search-covers/      # Game search functionality
├── get-covers/         # SteamGridDB cover retrieval
└── get-igdb-covers/    # IGDB cover and data retrieval
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [SteamGridDB](https://www.steamgriddb.com/) for providing the game cover database
- [IGDB](https://www.igdb.com/) for comprehensive game information and additional cover sources
- [Steam ROM Manager](https://github.com/SteamGridDB/steam-rom-manager) for inspiration and reference