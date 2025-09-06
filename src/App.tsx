import React, { useState, useEffect } from 'react';
import { Moon, Sun, Upload, Download, MessageCircle } from 'lucide-react';
import { useDarkMode } from './hooks/useDarkMode';
import CSVUploader from './components/CSVUploader';
import ProgressLogger from './components/ProgressLogger';
import GameProcessor from './components/GameProcessor';
import DarkModeToggle from './components/DarkModeToggle';

interface Game {
  name: string;
  genre?: string;
  size?: string;
  year?: string;
  cover?: string;
}

function App() {
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [games, setGames] = useState<Game[]>([]);
  const [processedGames, setProcessedGames] = useState<Game[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleCSVUpload = (uploadedGames: Game[]) => {
    setGames(uploadedGames);
    setProcessedGames([]);
    setLogs([]);
    addLog(`CSV cargado con ${uploadedGames.length} juegos`);
  };

  const handleProcessComplete = (processed: Game[]) => {
    setProcessedGames(processed);
    setIsProcessing(false);
    addLog(`Procesamiento completado: ${processed.length} juegos procesados`);
  };

  const sendToWhatsApp = () => {
    if (processedGames.length === 0) {
      addLog('No hay juegos procesados para enviar');
      return;
    }

    processedGames.forEach((game, index) => {
      setTimeout(() => {
        let message = '';
        
        // Agregar imagen si está disponible
        if (game.cover) {
          message += `${game.cover}%0A%0A`;
        }
        
        // Formato del mensaje
        message += `🌟🌟🌟 ESTRENO 🌟🌟🌟%0A`;
        message += `NOMBRE: ${game.name}%0A`;
        
        if (game.genre) {
          message += `GÉNERO: ${game.genre}%0A`;
        }
        
        if (game.size) {
          message += `TAMAÑO: ${game.size}%0A`;
        }
        
        if (game.year) {
          message += `AÑO: ${game.year}`;
        }

        const whatsappUrl = `https://wa.me/?text=${message}`;
        window.open(whatsappUrl, '_blank');
        
        addLog(`Mensaje ${index + 1}/${processedGames.length} enviado a WhatsApp: ${game.name}`);
      }, index * 2000); // 2 segundos de delay entre mensajes
    });

    addLog(`Iniciando envío de ${processedGames.length} mensajes a WhatsApp...`);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
              <Upload className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Game Cover Processor</h1>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Procesa tu CSV de juegos y obtén portadas automáticamente
              </p>
            </div>
          </div>
          <DarkModeToggle isDarkMode={isDarkMode} onToggle={toggleDarkMode} />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* CSV Upload */}
            <div className={`p-6 rounded-xl border ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200 shadow-sm'
            }`}>
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Upload className="w-5 h-5 mr-2 text-blue-500" />
                Subir CSV
              </h2>
              <CSVUploader onUpload={handleCSVUpload} />
              
              {games.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    ✅ {games.length} juegos cargados desde CSV
                  </p>
                </div>
              )}
            </div>

            {/* Game Processor */}
            {games.length > 0 && (
              <div className={`p-6 rounded-xl border ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-white border-gray-200 shadow-sm'
              }`}>
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <Download className="w-5 h-5 mr-2 text-green-500" />
                  Procesar Juegos
                </h2>
                <GameProcessor 
                  games={games}
                  onProcessComplete={handleProcessComplete}
                  onLog={addLog}
                  isProcessing={isProcessing}
                  setIsProcessing={setIsProcessing}
                />
              </div>
            )}

            {/* WhatsApp Export */}
            {processedGames.length > 0 && (
              <div className={`p-6 rounded-xl border ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-white border-gray-200 shadow-sm'
              }`}>
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <MessageCircle className="w-5 h-5 mr-2 text-green-500" />
                  Enviar a WhatsApp
                </h2>
                <button
                  onClick={sendToWhatsApp}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>Enviar {processedGames.length} juegos a WhatsApp</span>
                </button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Se abrirá una ventana de WhatsApp por cada juego (delay de 2s entre mensajes)
                </p>
              </div>
            )}
          </div>

          {/* Right Column - Logs */}
          <div className={`p-6 rounded-xl border ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200 shadow-sm'
          }`}>
            <ProgressLogger logs={logs} />
          </div>
        </div>

        {/* Processed Games Preview */}
        {processedGames.length > 0 && (
          <div className={`mt-8 p-6 rounded-xl border ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200 shadow-sm'
          }`}>
            <h2 className="text-lg font-semibold mb-4">
              Juegos Procesados ({processedGames.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {processedGames.map((game, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  {game.cover && (
                    <img
                      src={game.cover}
                      alt={game.name}
                      className="w-full h-32 object-cover rounded-lg mb-3"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  <h3 className="font-medium text-sm mb-2">{game.name}</h3>
                  {game.genre && (
                    <p className="text-xs text-gray-500 mb-1">Género: {game.genre}</p>
                  )}
                  {game.size && (
                    <p className="text-xs text-gray-500 mb-1">Tamaño: {game.size}</p>
                  )}
                  {game.year && (
                    <p className="text-xs text-gray-500">Año: {game.year}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;