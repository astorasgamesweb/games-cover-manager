import React, { useState, useCallback } from 'react';
import { Play, Pause, Square, Download } from 'lucide-react';
import { Game, SearchResult, SteamGridDBCover, SteamGridDBGame, IGDBGame } from '../types';
import GameSelector from './GameSelector';

interface GameProcessorProps {
  games: Game[];
  onProcessComplete: (processedGames: Game[]) => void;
  onLog: (message: string) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
}

export default function GameProcessor({ 
  games, 
  onProcessComplete, 
  onLog, 
  isProcessing, 
  setIsProcessing 
}: GameProcessorProps) {
  const [processedGames, setProcessedGames] = useState<Game[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showSelector, setShowSelector] = useState(false);
  const [currentGame, setCurrentGame] = useState<Game | null>(null);
  const [suggestions, setSuggestions] = useState<SteamGridDBGame[]>([]);
  const [igdbSuggestions, setIgdbSuggestions] = useState<IGDBGame[]>([]);
  const [currentProvider, setCurrentProvider] = useState<'steamgriddb' | 'igdb'>('steamgriddb');

  const cleanGameName = (name: string): string => {
    return name
      .replace(/[®™©]/g, '')
      .replace(/\s+(PS[1-5]|Xbox|PC|Switch|Steam|Epic|GOG|Origin)(\s|$)/gi, ' ')
      .replace(/\s+(Edition|Deluxe|GOTY|Complete|Ultimate|Remastered|HD|Definitive)(\s|$)/gi, ' ')
      .replace(/\s+(Game\s+of\s+the\s+Year|Director's\s+Cut|Enhanced\s+Edition|Special\s+Edition)(\s|$)/gi, ' ')
      .replace(/[^\w\s\-:.']/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const hasExistingData = (game: Game): { hasImage: boolean; hasYear: boolean; hasDescription: boolean } => {
    return {
      hasImage: !!(game.portada || game.image),
      hasYear: !!game.año,
      hasDescription: !!game.descripción
    };
  };

  const searchGame = async (game: Game): Promise<SearchResult> => {
    try {
      const cleanedName = cleanGameName(game.name);
      const { hasImage, hasYear, hasDescription } = hasExistingData(game);
      
      onLog(`🔍 Buscando: ${game.name}${cleanedName !== game.name ? ` (limpio: ${cleanedName})` : ''}`);

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-covers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          gameName: cleanedName,
          hasImage,
          hasYear,
          hasDescription
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      onLog(`✗ Error buscando ${game.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  const processNextGame = useCallback(async () => {
    if (isPaused || currentIndex >= games.length) {
      if (currentIndex >= games.length) {
        setIsProcessing(false);
        // Deduplicate processedGames by game name before completing
        const uniqueProcessedGames = processedGames.filter((game, index, self) =>
          index === self.findIndex(g => g.name === game.name)
        );
        onProcessComplete(uniqueProcessedGames);
        onLog(`✅ Procesamiento completado: ${uniqueProcessedGames.length}/${games.length} juegos procesados`);
      }
      return;
    }

    const game = games[currentIndex];

    // Verificar si el juego ya fue procesado exitosamente
    const alreadyProcessed = processedGames.find(pg => pg.name === game.name);
    if (alreadyProcessed) {
      onLog(`⏭️ Saltando ${game.name} (ya procesado exitosamente)`);
      setCurrentIndex(prev => prev + 1);
      return;
    }

    setCurrentGame(game);

    try {
      const result = await searchGame(game);

      if (result.success && result.covers && result.covers.length > 0) {
        // Encontrado automáticamente
        const bestCover = result.covers[0];
        const updatedGame = {
          ...game,
          portada: bestCover.url,
          image: bestCover.url,
          status: 'completed' as const
        };

        // Agregar datos adicionales si están disponibles
        if (result.gameData) {
          if (result.gameData.name && !game['nuevo nombre']) {
            updatedGame['nuevo nombre'] = result.gameData.name;
          }
          if (result.gameData.year && !game.año) {
            updatedGame.año = result.gameData.year;
          }
          if (result.gameData.description && !game.descripción) {
            updatedGame.descripción = result.gameData.description;
          }
        }

        // Add to processedGames only if not already present
        setProcessedGames(prev => {
          const exists = prev.find(g => g.name === updatedGame.name);
          if (!exists) {
            return [...prev, updatedGame];
          }
          return prev;
        });
        onLog(`✓ ${game.name} - Encontrado automáticamente (${result.source || 'unknown'})`);
        setCurrentIndex(prev => prev + 1);
      } else if (result.suggestions || result.igdbSuggestions) {
        // Mostrar selector para sugerencias
        setSuggestions(result.suggestions || []);
        setIgdbSuggestions(result.igdbSuggestions || []);
        setCurrentProvider(result.suggestions && result.suggestions.length > 0 ? 'steamgriddb' : 'igdb');
        setShowSelector(true);
        setIsPaused(true);
        onLog(`? ${game.name} - Requiere selección manual (${(result.suggestions?.length || 0) + (result.igdbSuggestions?.length || 0)} opciones)`);
      } else {
        // No encontrado, marcar como fallido y continuar
        const failedGame = {
          ...game,
          status: 'no-results' as const
        };
        // Add to processedGames only if not already present
        setProcessedGames(prev => {
          const exists = prev.find(g => g.name === failedGame.name);
          if (!exists) {
            return [...prev, failedGame];
          }
          return prev;
        });
        onLog(`✗ ${game.name} - No encontrado en ninguna fuente`);
        setCurrentIndex(prev => prev + 1);
      }
    } catch (error) {
      // Error en la búsqueda, marcar como fallido y continuar
      const errorGame = {
        ...game,
        status: 'error' as const
      };
      // Add to processedGames only if not already present
      setProcessedGames(prev => {
        const exists = prev.find(g => g.name === errorGame.name);
        if (!exists) {
          return [...prev, errorGame];
        }
        return prev;
      });
      onLog(`✗ ${game.name} - Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, games, processedGames, isPaused, onLog, onProcessComplete, setIsProcessing]);

  const handleStart = () => {
    if (processedGames.length === 0) {
      // Primer inicio
      setProcessedGames([]);
      setCurrentIndex(0);
      onLog(`🚀 Iniciando procesamiento de ${games.length} juegos...`);
    } else {
      // Continuando desde donde se pausó
      onLog(`▶️ Continuando procesamiento desde el juego ${currentIndex + 1}/${games.length}...`);
    }
    setIsProcessing(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    setIsPaused(true);
    onLog(`⏸️ Procesamiento pausado en el juego ${currentIndex + 1}/${games.length}`);
  };

  const handleStop = () => {
    setIsProcessing(false);
    setIsPaused(false);
    onLog(`⏹️ Procesamiento detenido. Procesados: ${processedGames.length}/${games.length}`);
  };

  const handleReset = () => {
    setProcessedGames([]);
    setCurrentIndex(0);
    setIsProcessing(false);
    setIsPaused(false);
    setShowSelector(false);
    onLog(`🔄 Procesamiento reiniciado`);
  };

  const handleCoverSelect = (cover: SteamGridDBCover, gameData?: any) => {
    if (!currentGame) return;

    const updatedGame = {
      ...currentGame,
      portada: cover.url,
      image: cover.url,
      status: 'completed' as const
    };

    // Agregar datos adicionales si están disponibles
    if (gameData) {
      if (gameData.name && !currentGame['nuevo nombre']) {
        updatedGame['nuevo nombre'] = gameData.name;
      }
      if (gameData.year && !currentGame.año) {
        updatedGame.año = gameData.year;
      }
      if (gameData.description && !currentGame.descripción) {
        updatedGame.descripción = gameData.description;
      }
    }

    setProcessedGames(prev => [...prev, updatedGame]);
    onLog(`✓ ${currentGame.name} - Seleccionado manualmente (${currentProvider})`);
    
    setShowSelector(false);
    setCurrentIndex(prev => prev + 1);
    setIsPaused(false);
  };

  const handleSkip = () => {
    if (!currentGame) return;

    const skippedGame = {
      ...currentGame,
      status: 'no-results' as const
    };
    setProcessedGames(prev => [...prev, skippedGame]);
    onLog(`⏭️ ${currentGame.name} - Saltado manualmente`);
    
    setShowSelector(false);
    setCurrentIndex(prev => prev + 1);
    setIsPaused(false);
  };

  const handleManualInput = (imageUrl: string) => {
    if (!currentGame) return;

    const updatedGame = {
      ...currentGame,
      portada: imageUrl,
      image: imageUrl,
      status: 'completed' as const
    };

    setProcessedGames(prev => [...prev, updatedGame]);
    onLog(`✓ ${currentGame.name} - URL manual agregada`);
    
    setShowSelector(false);
    setCurrentIndex(prev => prev + 1);
    setIsPaused(false);
  };

  const exportCSV = () => {
    if (processedGames.length === 0) return;

    // Crear un mapa para evitar duplicados basado en el nombre del juego
    const gameMap = new Map();
    
    // Primero agregar todos los juegos procesados
    processedGames.forEach(game => {
      if (!gameMap.has(game.name)) {
        gameMap.set(game.name, game);
      }
    });
    
    // Luego agregar juegos no procesados que no estén en el mapa
    games.forEach(game => {
      if (!gameMap.has(game.name)) {
        gameMap.set(game.name, {
          ...game,
          status: 'pending'
        });
      }
    });
    
    const allGames = Array.from(gameMap.values());

    const headers = ['Nombre', 'Nuevo Nombre', 'Portada', 'Año', 'Descripción'];
    const csvContent = [
      headers.join(','),
      ...allGames.map(game => [
        `"${game.name || ''}"`,
        `"${game['nuevo nombre'] || ''}"`,
        `"${game.portada || ''}"`,
        `"${game.año || ''}"`,
        `"${game.descripción || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `games_processed_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    onLog(`📥 CSV exportado con ${allGames.length} juegos (${processedGames.length} procesados)`);
  };

  // Efecto para procesar automáticamente
  React.useEffect(() => {
    if (isProcessing && !isPaused && !showSelector) {
      const timer = setTimeout(processNextGame, 100);
      return () => clearTimeout(timer);
    }
  }, [isProcessing, isPaused, showSelector, processNextGame]);

  const progress = games.length > 0 ? ((currentIndex) / games.length) * 100 : 0;
  const currentGameName = currentGame?.name || (games[currentIndex]?.name);

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {!isProcessing ? (
            <button
              onClick={handleStart}
              disabled={games.length === 0}
              className="flex-1 min-w-[120px] inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Play className="w-4 h-4 mr-2" />
              {processedGames.length > 0 ? 'Continuar' : 'Iniciar'}
            </button>
          ) : (
            <>
              <button
                onClick={handlePause}
                className="flex-1 min-w-[120px] inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-xl hover:from-yellow-600 hover:to-yellow-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Pause className="w-4 h-4 mr-2" />
                Pausar
              </button>
              <button
                onClick={handleStop}
                className="flex-1 min-w-[120px] inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Square className="w-4 h-4 mr-2" />
                Detener
              </button>
            </>
          )}
          
          {processedGames.length > 0 && (
            <>
              <button
                onClick={handleReset}
                disabled={isProcessing}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-200"
              >
                Reiniciar
              </button>
              <button
                onClick={exportCSV}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
              </button>
            </>
          )}
        </div>

        {/* Progress Bar */}
        {games.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Progreso: {currentIndex}/{games.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300 shadow-sm"
                style={{ width: `${progress}%` }}
              />
            </div>
            {currentGameName && isProcessing && (
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {isPaused ? 'Pausado en' : 'Procesando'}: {currentGameName}
              </p>
            )}
          </div>
        )}

        {/* Stats */}
        {processedGames.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-xl text-center">
              <div className="text-green-600 dark:text-green-400 font-bold text-lg">
                {processedGames.filter(g => g.status === 'completed').length}
              </div>
              <div className="text-green-700 dark:text-green-300">Exitosos</div>
            </div>
            <div className="bg-red-50 dark:bg-red-950/20 p-3 rounded-xl text-center">
              <div className="text-red-600 dark:text-red-400 font-bold text-lg">
                {processedGames.filter(g => g.status === 'error').length}
              </div>
              <div className="text-red-700 dark:text-red-300">Errores</div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-950/20 p-3 rounded-xl text-center">
              <div className="text-yellow-600 dark:text-yellow-400 font-bold text-lg">
                {processedGames.filter(g => g.status === 'no-results').length}
              </div>
              <div className="text-yellow-700 dark:text-yellow-300">Sin resultados</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-xl text-center">
              <div className="text-blue-600 dark:text-blue-400 font-bold text-lg">
                {games.length - currentIndex}
              </div>
              <div className="text-blue-700 dark:text-blue-300">Pendientes</div>
            </div>
          </div>
        )}
      </div>

      {/* Game Selector Modal */}
      {showSelector && currentGame && (
        <GameSelector
          game={currentGame}
          suggestions={currentProvider === 'steamgriddb' ? suggestions : igdbSuggestions}
          onSelect={handleCoverSelect}
          onSkip={handleSkip}
          onManualInput={handleManualInput}
          provider={currentProvider}
        />
      )}
    </>
  );
}