import React, { useCallback, useState } from 'react';
import { Upload, FileText, AlertTriangle } from 'lucide-react';
import { Game } from '../types';

interface CSVUploaderProps {
  onUpload: (games: Game[]) => void;
}

export default function CSVUploader({ onUpload }: CSVUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseCSV = useCallback((content: string): Game[] => {
    const lines = content.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV must have at least 2 lines (header + data)');
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const nameIndex = headers.findIndex(h => 
      h.toLowerCase() === 'nombre' || h.toLowerCase() === 'name'
    );
    const newNameIndex = headers.findIndex(h => 
      h.toLowerCase() === 'nuevo nombre' || h.toLowerCase() === 'new name'
    );
    const coverIndex = headers.findIndex(h => 
      h.toLowerCase() === 'portada' || h.toLowerCase() === 'cover'
    );
    const yearIndex = headers.findIndex(h => 
      h.toLowerCase() === 'año' || h.toLowerCase() === 'year'
    );
    const descriptionIndex = headers.findIndex(h => 
      h.toLowerCase() === 'descripción' || h.toLowerCase() === 'description'
    );

    if (nameIndex === -1) {
      throw new Error('CSV must contain a column named "Nombre" or "Name"');
    }

    const games: Game[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length >= headers.length) {
        const game: Game = { status: 'pending' };
        
        headers.forEach((header, index) => {
          const value = values[index]?.trim().replace(/^"|"$/g, '') || '';
          game[header] = value;
        });
        
        game.name = game[headers[nameIndex]] as string;
        if (newNameIndex !== -1) {
          game['nuevo nombre'] = game[headers[newNameIndex]] as string;
        }
        if (coverIndex !== -1) {
          game.portada = game[headers[coverIndex]] as string;
          game.image = game[headers[coverIndex]] as string; // Keep for compatibility
        }
        if (yearIndex !== -1) {
          game.año = game[headers[yearIndex]] as string;
        }
        if (descriptionIndex !== -1) {
          game.descripción = game[headers[descriptionIndex]] as string;
        }
        
        if (game.name) {
          games.push(game);
        }
      }
    }

    return games;
  }, []);

  const parseCSVLine = (line: string): string[] => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"' && !inQuotes) {
        inQuotes = true;
      } else if (char === '"' && inQuotes) {
        if (nextChar === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = false;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    return result;
  };

  const handleFile = useCallback((file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const games = parseCSV(content);
        setError(null);
        onUpload(games);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error parsing CSV file');
      }
    };
    
    reader.readAsText(file);
  }, [parseCSV, onLoad]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  }, [handleFile]);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 animate-slide-up">
      <div className="p-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <FileText className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Upload CSV File</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Import your games list to start processing covers
          </p>
        </div>

        <div
          className={`mt-6 border-2 border-dashed rounded-2xl p-8 transition-all duration-200 ${
            dragActive
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-400'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="text-center">
            <Upload className={`mx-auto h-8 w-8 ${dragActive ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} />
            <div className="mt-4">
              <label htmlFor="file-upload" className="cursor-pointer">
                <span className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                  Click to upload
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400"> or drag and drop</span>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  accept=".csv"
                  className="sr-only"
                  onChange={handleChange}
                />
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">CSV files only</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-500 dark:text-red-400 flex-shrink-0" />
              <div className="ml-3">
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 text-xs text-gray-500 dark:text-gray-400">
          <p className="font-medium mb-2 text-gray-700 dark:text-gray-300">CSV Requirements:</p>
          <ul className="space-y-1 ml-4">
            <li>• Must contain a "Nombre" column with game names</li>
            <li>• Can contain "Nuevo Nombre", "Portada", "Año", "Descripción" columns (optional)</li>
            <li>• First row should be headers</li>
            <li>• Supports comma-separated values with quotes</li>
          </ul>
          <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">Expected CSV format:</p>
            <code className="text-xs text-blue-600 dark:text-blue-400">
              Nombre,Nuevo Nombre,Portada,Año,Descripción
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}