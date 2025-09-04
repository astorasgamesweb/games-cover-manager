import React from 'react';
import { Play, Pause, Square } from 'lucide-react';

interface GameProcessorProps {
  isProcessing: boolean;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
  progress: number;
  currentGame?: string;
}

export default function GameProcessor({ 
  isProcessing, 
  onStart, 
  onPause, 
  onStop, 
  progress, 
  currentGame 
}: GameProcessorProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Processing Controls</h3>
      
      <div className="space-y-4">
        <div className="flex space-x-3">
          {!isProcessing ? (
            <button
              onClick={onStart}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Play className="w-4 h-4 mr-2" />
              Start Processing
            </button>
          ) : (
            <>
              <button
                onClick={onPause}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </button>
              <button
                onClick={onStop}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Square className="w-4 h-4 mr-2" />
                Stop
              </button>
            </>
          )}
        </div>

        {isProcessing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            {currentGame && (
              <p className="text-sm text-gray-500 truncate">
                Processing: {currentGame}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}