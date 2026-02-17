import React, { useCallback, useState } from 'react';
import { Upload as UploadIcon, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import type { SheetInfo } from '../lib/types';

interface UploadProps {
  onFileSelect: (file: File) => void;
  onSheetsSelect: (sheets: string[]) => void;
  sheets: SheetInfo[];
  isLoading: boolean;
  error: string | null;
}

export function Upload({
  onFileSelect,
  onSheetsSelect,
  sheets,
  isLoading,
  error,
}: UploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedSheets, setSelectedSheets] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(true);

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

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        if (
          file.name.endsWith('.xlsx') ||
          file.name.endsWith('.xls') ||
          file.type.includes('spreadsheet')
        ) {
          onFileSelect(file);
        }
      }
    },
    [onFileSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        onFileSelect(files[0]);
      }
    },
    [onFileSelect]
  );

  const handleSheetToggle = (sheetName: string) => {
    const newSelected = new Set(selectedSheets);
    if (newSelected.has(sheetName)) {
      newSelected.delete(sheetName);
    } else {
      newSelected.add(sheetName);
    }
    setSelectedSheets(newSelected);
    setSelectAll(false);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedSheets(new Set());
    } else {
      setSelectedSheets(new Set(sheets.filter((s) => s.hasRequiredColumns).map((s) => s.name)));
    }
    setSelectAll(!selectAll);
  };

  const handleConfirmSheets = () => {
    if (selectAll) {
      onSheetsSelect(sheets.filter((s) => s.hasRequiredColumns).map((s) => s.name));
    } else {
      onSheetsSelect(Array.from(selectedSheets));
    }
  };

  const validSheets = sheets.filter((s) => s.hasRequiredColumns);
  const hasSelectedSheets = selectAll ? validSheets.length > 0 : selectedSheets.size > 0;

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Área de Upload */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200
          ${isDragging
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
          }
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
          <div
            className={`
              w-16 h-16 rounded-full flex items-center justify-center
              ${isDragging ? 'bg-primary-100' : 'bg-gray-100'}
            `}
          >
            {isLoading ? (
              <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <UploadIcon
                className={`w-8 h-8 ${isDragging ? 'text-primary-500' : 'text-gray-400'}`}
              />
            )}
          </div>

          <div>
            <p className="text-lg font-medium text-gray-700">
              {isLoading ? 'Processando arquivo...' : 'Arraste o arquivo Excel aqui'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              ou clique para selecionar (.xlsx, .xls)
            </p>
          </div>
        </div>
      </div>

      {/* Erro */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-800">Erro ao processar arquivo</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Seleção de Abas */}
      {sheets.length > 0 && !error && (
        <div className="mt-6 bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary-500" />
            Abas encontradas
          </h3>

          <div className="mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectAll}
                onChange={handleSelectAll}
                className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Consolidar todas as abas válidas
              </span>
            </label>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {sheets.map((sheet) => (
              <div
                key={sheet.name}
                className={`
                  flex items-center justify-between p-3 rounded-lg border
                  ${sheet.hasRequiredColumns
                    ? 'border-gray-200 bg-white'
                    : 'border-red-200 bg-red-50'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={
                      selectAll
                        ? sheet.hasRequiredColumns
                        : selectedSheets.has(sheet.name)
                    }
                    onChange={() => handleSheetToggle(sheet.name)}
                    disabled={!sheet.hasRequiredColumns || selectAll}
                    className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500 disabled:opacity-50"
                  />
                  <div>
                    <p className="font-medium text-gray-800">{sheet.name}</p>
                    <p className="text-xs text-gray-500">{sheet.rowCount} registros</p>
                  </div>
                </div>

                {sheet.hasRequiredColumns ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <div className="text-right">
                    <AlertCircle className="w-5 h-5 text-red-500 inline" />
                    <p className="text-xs text-red-600 mt-1">
                      Faltando: {sheet.missingColumns.join(', ')}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={handleConfirmSheets}
            disabled={!hasSelectedSheets}
            className={`
              mt-6 w-full py-3 px-4 rounded-lg font-medium transition-colors
              ${hasSelectedSheets
                ? 'bg-primary-500 text-white hover:bg-primary-600'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            Importar {selectAll ? validSheets.length : selectedSheets.size} aba(s)
          </button>
        </div>
      )}
    </div>
  );
}
