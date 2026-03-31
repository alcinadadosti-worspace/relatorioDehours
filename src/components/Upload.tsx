import React, { useCallback, useState } from 'react';
import { Upload as UploadIcon, AlertCircle } from 'lucide-react';

interface UploadProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
  error: string | null;
}

export function Upload({ onFileSelect, isLoading, error }: UploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onFileSelect(file);
    },
    [onFileSelect]
  );

  return (
    <div className="w-full max-w-lg mx-auto">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-16 text-center transition-all duration-200
          ${isDragging ? 'border-primary-500 bg-primary-500/5' : 'border-dark-600 hover:border-primary-400 hover:bg-dark-700/50'}
          ${isLoading ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isLoading}
        />
        <div className="flex flex-col items-center gap-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isDragging ? 'bg-primary-500/20' : 'bg-dark-700'}`}>
            {isLoading ? (
              <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <UploadIcon className={`w-8 h-8 ${isDragging ? 'text-primary-400' : 'text-dark-500'}`} />
            )}
          </div>
          <div>
            <p className="text-lg font-medium text-dark-200">
              {isLoading ? 'Processando...' : 'Arraste a planilha aqui'}
            </p>
            <p className="text-sm text-dark-400 mt-1">ou clique para selecionar (.xlsx, .xls)</p>
            <p className="text-xs text-dark-500 mt-3">
              Colunas necessárias: <span className="text-dark-300">Nome, Gestor, Saldo Total, Minutos</span>
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-900/30 border border-red-700/50 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-300">Erro ao processar arquivo</p>
            <p className="text-sm text-red-400 mt-1">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
