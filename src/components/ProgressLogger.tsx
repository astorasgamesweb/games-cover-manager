import React, { useEffect, useRef, useMemo } from 'react';
import { ScrollText } from 'lucide-react';

interface ProgressLoggerProps {
  logs: string[];
}

export default function ProgressLogger({ logs }: ProgressLoggerProps) {
  const logEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Limitar los logs mostrados para evitar problemas de rendimiento
  const displayedLogs = useMemo(() => {
    // Mostrar solo los últimos 50 logs para evitar problemas de rendimiento
    return logs.slice(-50);
  }, [logs]);

  useEffect(() => {
    // Solo hacer scroll si hay nuevos logs y el usuario está cerca del final
    if (containerRef.current && logEndRef.current) {
      const container = containerRef.current;
      const isNearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 50;
      
      if (isNearBottom) {
        logEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [displayedLogs]);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center">
            <ScrollText className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Activity Log</h3>
          {logs.length > 0 && (
            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-medium px-2.5 py-1 rounded-full">
              {logs.length}
            </span>
          )}
          {logs.length > 50 && (
            <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-xs font-medium px-2.5 py-1 rounded-full">
              Showing last 50
            </span>
          )}
        </div>
      </div>
      
      <div 
        ref={containerRef}
        className="h-64 overflow-y-auto bg-gray-50 dark:bg-gray-800/50 font-mono text-sm"
      >
        {displayedLogs.length === 0 ? (
          <div className="p-4 text-gray-500 dark:text-gray-400 text-center">
            No activity yet. Upload a CSV to start.
          </div>
        ) : (
          <div className="p-4 space-y-1">
            {displayedLogs.map((log, index) => (
              <div 
                key={logs.length - displayedLogs.length + index}
                className={`${
                  log.includes('✓') ? 'text-green-600 dark:text-green-400' :
                  log.includes('✗') ? 'text-red-600 dark:text-red-400' :
                  log.includes('?') ? 'text-yellow-600 dark:text-yellow-400' :
                  'text-gray-700 dark:text-gray-300'
                }`}
              >
                {log}
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        )}
      </div>
    </div>
  );
}