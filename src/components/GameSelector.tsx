import React, { useState } from 'react';
import { X, ExternalLink, Search, Check } from 'lucide-react';
import { Game, SteamGridDBGame, SteamGridDBCover } from '../types';

interface GameSelectorProps {
  game: Game;
  suggestions: SteamGridDBGame[];
  onSelect: (cover: SteamGridDBCover, gameData?: any) => void;
  onSkip: () => void;
  onManualInput: (imageUrl: string) => void;
  provider: 'steamgriddb' | 'igdb';
}

export default function GameSelector({ 
  game, 
  suggestions, 
  onSelect, 
  onSkip, 
  onManualInput,
  provider
}: GameSelectorProps) {
  const [selectedGame, setSelectedGame] = useState<SteamGridDBGame | null>(null);
  const [covers, setCovers] = useState<SteamGridDBCover[]>([]);
  const [loadingCovers, setLoadingCovers] = useState(false);
  const [manualUrl, setManualUrl] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [selectedGameData, setSelectedGameData] = useState<any>(null);

  const translateDescription = async (text: string): Promise<string> => {
    if (!text || text.length < 10) return text;
    
    try {
      // Simple translation using a free API or basic rules
      // For now, we'll use a basic approach - in production you'd use Google Translate API
      const response = await fetch('https://api.mymemory.translated.net/get', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.substring(0, 500))}&langpair=en|es`;
      const translationResponse = await fetch(url);
      
      if (translationResponse.ok) {
        const data = await translationResponse.json();
        if (data.responseData && data.responseData.translatedText) {
          return data.responseData.translatedText;
        }
      }
    } catch (error) {
      console.log('Translation failed, using original text');
    }
    
    return text;
  };

  const loadCovers = async (selectedGame: any) => {
    setLoadingCovers(true);
    let gameData = null;
    
    try {
      const endpoint = provider === 'igdb' ? 'get-igdb-covers' : 'get-covers';
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gameId: selectedGame.id }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API request failed (${response.status}):`, errorText);
        return;
      }

      let result;
      try {
        const responseText = await response.text();
        if (!responseText.trim()) {
          console.error('Empty response from server');
          return;
        }
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Invalid JSON response:', parseError);
        return;
      }
      
      if (result.success && result.covers) {
        setCovers(result.covers);
        if (result.gameData) {
          gameData = result.gameData;
          
          // Translate description if it's from IGDB  
          if (provider === 'igdb' && gameData.description) {
            gameData.description = await translateDescription(gameData.description);
          }
          
          setSelectedGameData(gameData);
        }
      }
    } catch (error) {
      console.error('Error loading covers:', error);
    } finally {
      setLoadingCovers(false);
    }
  };

  const handleGameSelect = (selectedGame: SteamGridDBGame) => {
    setSelectedGame(selectedGame);
    loadCovers(selectedGame);
  };

  const openSearchSite = () => {
    const searchUrl = provider === 'steamgriddb'
      ? `https://www.steamgriddb.com/search/grids?term=${encodeURIComponent(game.name)}`
      : `https://www.igdb.com/search?type=1&q=${encodeURIComponent(game.name)}`;
    window.open(searchUrl, '_blank');
  };

  const handleManualSubmit = () => {
    if (manualUrl.trim()) {
      // Create a cover object for manual input
      const manualCover = {
        id: Date.now(), // Use timestamp as unique ID
        url: manualUrl.trim(),
        thumb: manualUrl.trim(),
        width: 600,
        height: 900,
        score: 100,
        style: 'manual',
        tags: ['manual']
      };
      
      // Call onSelect instead of onManualInput to ensure proper data handling
      onSelect(manualCover);
    }
  };

  const handleCoverSelect = (cover: SteamGridDBCover) => {
    onSelect(cover, selectedGameData);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-800 animate-slide-up">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Select Cover for: {game.name} ({provider === 'steamgriddb' ? 'SteamGridDB' : 'IGDB'})
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                No exact match found on {provider === 'steamgriddb' ? 'SteamGridDB' : 'IGDB'}. Please select from similar games or enter manually.
              </p>
            </div>
            <button
              onClick={onSkip}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {!selectedGame ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Juegos Similares en {provider === 'steamgriddb' ? 'SteamGridDB' : 'IGDB'}:
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {suggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    onClick={() => handleGameSelect(suggestion)}
                    className={`p-4 border rounded-xl cursor-pointer transition-all duration-200 hover:shadow-lg ${
                      provider === 'steamgriddb'
                        ? 'border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/20'
                        : 'border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/20'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {suggestion.logo && (
                        <img
                          src={suggestion.logo}
                          alt={suggestion.name}
                          className="w-12 h-12 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">{suggestion.name}</p>
                        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 mt-1">
                          {provider === 'steamgriddb' && suggestion.verified && (
                            <div className="flex items-center space-x-2">
                              <span className="inline-flex items-center text-xs text-green-600 dark:text-green-400">
                                <Check className="w-3 h-3 mr-1" />
                                Verificado
                              </span>
                            </div>
                          )}
                          {provider === 'igdb' && (
                            <>
                              {suggestion.year && <p>📅 {suggestion.year}</p>}
                              {suggestion.description && (
                                <p className="line-clamp-2">
                                  📝 {suggestion.description.substring(0, 100)}...
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Otras Opciones:</h4>
                <div className="space-y-2">
                  <button
                    onClick={() => setShowManualInput(!showManualInput)}
                    className="w-full p-3 text-left border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <Search className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                      <span className="text-gray-700 dark:text-gray-300">Introducir URL de imagen manualmente</span>
                    </div>
                  </button>
                  
                  <button
                    onClick={openSearchSite}
                    className="w-full p-3 text-left border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <ExternalLink className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                      <span className="text-gray-700 dark:text-gray-300">
                        Buscar manualmente en {provider === 'steamgriddb' ? 'SteamGridDB' : 'IGDB'}
                      </span>
                    </div>
                  </button>
                </div>

                {showManualInput && (
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      URL de Imagen:
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="url"
                        value={manualUrl}
                        onChange={(e) => setManualUrl(e.target.value)}
                        placeholder="https://..."
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <button
                        onClick={handleManualSubmit}
                        disabled={!manualUrl.trim()}
                        className={`px-4 py-2 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ${
                          provider === 'steamgriddb'
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                            : 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700'
                        }`}
                      >
                        Agregar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                    Select Cover for: {selectedGame.name}
                  </h3>
                  {selectedGameData && (
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {selectedGameData.year && <span>📅 {selectedGameData.year}</span>}
                      {selectedGameData.description && (
                        <p className="mt-1 text-xs line-clamp-2">{selectedGameData.description}</p>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setSelectedGame(null)}
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                >
                  ← Volver a juegos
                </button>
              </div>

              {loadingCovers ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                  <p className="mt-2 text-gray-500 dark:text-gray-400">Cargando portadas...</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {covers.map((cover) => (
                    <div
                      key={cover.id}
                      onClick={() => handleCoverSelect(cover)}
                      className="group cursor-pointer rounded-xl overflow-hidden hover:shadow-xl transition-all duration-200 border border-gray-200 dark:border-gray-700"
                    >
                      <div className="aspect-[2/3] bg-gray-100">
                        <img
                          src={cover.thumb}
                          alt="Game cover"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="p-2 text-center">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {cover.width}×{cover.height}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex justify-end space-x-3">
          <button
            onClick={onSkip}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            Saltar Este Juego
          </button>
        </div>
      </div>
    </div>
  );
}