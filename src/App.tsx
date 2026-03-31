import { useState, useCallback, useMemo, useEffect } from 'react';
import { BarChart3, FileSpreadsheet, RefreshCw } from 'lucide-react';

import type { AppState, ColaboradorRecord, FilterState } from './lib/types';
import { readExcelFile, parseWorkbookBuffer } from './lib/excel';
import { groupByGestor, calculateGlobalStats, applyFilters } from './lib/aggregation';

import { Upload, Filters, KPI, GestorChart, RankingChart, ColaboradoresTable } from './components';

const DEFAULT_FILE = '/saldo_por_gestor.xlsx';

export default function App() {
  const [appState, setAppState] = useState<AppState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDefaultFile, setIsDefaultFile] = useState(false);
  const [records, setRecords] = useState<ColaboradorRecord[]>([]);
  const [filters, setFilters] = useState<FilterState>({ searchNome: '', searchGestor: '' });

  const loadDefaultFile = useCallback(async () => {
    setAppState('loading');
    setError(null);
    setIsDefaultFile(true);
    try {
      const res = await fetch(DEFAULT_FILE);
      if (!res.ok) throw new Error('not found');
      const buf = new Uint8Array(await res.arrayBuffer());
      const data = parseWorkbookBuffer(buf);
      setRecords(data);
      setFileName('saldo_por_gestor.xlsx');
      setAppState('ready');
    } catch {
      setAppState('empty');
      setIsDefaultFile(false);
    }
  }, []);

  useEffect(() => { loadDefaultFile(); }, [loadDefaultFile]);

  const handleFileSelect = useCallback(async (file: File) => {
    setAppState('loading');
    setError(null);
    setFileName(file.name);
    setIsDefaultFile(false);
    try {
      const data = await readExcelFile(file);
      setRecords(data);
      setFilters({ searchNome: '', searchGestor: '' });
      setAppState('ready');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setAppState('error');
    }
  }, []);

  const handleReset = useCallback(() => {
    setAppState('empty');
    setError(null);
    setFileName(null);
    setRecords([]);
    setFilters({ searchNome: '', searchGestor: '' });
    setIsDefaultFile(false);
  }, []);

  const handleFilterChange = useCallback((f: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...f }));
  }, []);

  // Todos os gestores (sem filtro de nome, para popular o dropdown)
  const allGestores = useMemo(() => groupByGestor(records), [records]);

  // Registros filtrados
  const filteredRecords = useMemo(() => applyFilters(records, filters), [records, filters]);

  // Stats globais (sobre todos os registros)
  const globalStats = useMemo(
    () => (records.length > 0 ? calculateGlobalStats(records) : null),
    [records]
  );

  // Gestores filtrados (para gráfico)
  const filteredGestores = useMemo(() => {
    if (!filters.searchGestor) return groupByGestor(filteredRecords);
    return groupByGestor(filteredRecords);
  }, [filteredRecords, filters.searchGestor]);

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col">
      {/* Header */}
      <header className="bg-dark-800 border-b border-dark-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Saldo de Horas</h1>
                <p className="text-xs text-dark-400">
                  {fileName ? fileName : 'Análise por Gestor'}
                </p>
              </div>
            </div>

            {appState === 'ready' && (
              <div className="flex items-center gap-2">
                {isDefaultFile && (
                  <button
                    onClick={loadDefaultFile}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-primary-400 hover:text-primary-300 hover:bg-dark-700 rounded-lg transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Atualizar
                  </button>
                )}
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-dark-300 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  {isDefaultFile ? 'Outro arquivo' : 'Novo arquivo'}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* Carregando */}
        {appState === 'loading' && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-12 h-12 border-4 border-dark-700 border-t-primary-500 rounded-full animate-spin mb-4" />
            <p className="text-dark-400">Carregando dados...</p>
          </div>
        )}

        {/* Upload */}
        {(appState === 'empty' || appState === 'error') && (
          <div className="py-16">
            <Upload
              onFileSelect={handleFileSelect}
              isLoading={false}
              error={error}
            />
          </div>
        )}

        {/* Dashboard */}
        {appState === 'ready' && globalStats && (
          <>
            <KPI stats={globalStats} />

            <Filters
              filters={filters}
              gestores={allGestores}
              onFilterChange={handleFilterChange}
            />

            {/* Gráficos */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
              <div className="bg-dark-800 border border-dark-700 rounded-xl p-5">
                <h3 className="text-base font-semibold text-white mb-4">
                  Saldo por Equipe
                  <span className="ml-2 text-sm font-normal text-dark-400">
                    ({filteredGestores.length} gestores)
                  </span>
                </h3>
                <GestorChart gestores={filteredGestores} />
              </div>

              <div className="bg-dark-800 border border-dark-700 rounded-xl p-5">
                <h3 className="text-base font-semibold text-white mb-1">
                  Ranking de Colaboradores
                  <span className="ml-2 text-sm font-normal text-dark-400">
                    ({filteredRecords.length} pessoas)
                  </span>
                </h3>
                <RankingChart records={filteredRecords} />
              </div>
            </div>

            {/* Tabela */}
            <div>
              <h3 className="text-base font-semibold text-white mb-3">
                Todos os Colaboradores
                <span className="ml-2 text-sm font-normal text-dark-400">
                  ({filteredRecords.length})
                </span>
              </h3>
              <ColaboradoresTable records={filteredRecords} />
            </div>
          </>
        )}
      </main>

      <footer className="border-t border-dark-700 bg-dark-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <p className="text-sm text-dark-400 text-center">
            Relatório de Saldo de Horas &copy; {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
