import { useState, useCallback, useMemo, useEffect } from 'react';
import { BarChart3, RefreshCw, LogOut } from 'lucide-react';

import type { AppState, ColaboradorRecord, FilterState } from './lib/types';
import type { AuthSession } from './lib/auth';
import { gestorMatches } from './lib/auth';
import { readExcelFile, parseWorkbookBuffer } from './lib/excel';
import { groupByGestor, calculateGlobalStats, applyFilters } from './lib/aggregation';

import { Login, Upload, Filters, KPI, GestorChart, RankingChart, ColaboradoresTable } from './components';

const DEFAULT_FILE = '/saldo_por_gestor.xlsx';

export default function App() {
  const [auth, setAuth] = useState<AuthSession | null>(null);
  const [appState, setAppState] = useState<AppState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [, setFileName] = useState<string | null>(null);
  const [allRecords, setAllRecords] = useState<ColaboradorRecord[]>([]);
  const [filters, setFilters] = useState<FilterState>({ searchNome: '', searchGestor: '' });

  const loadDefaultFile = useCallback(async () => {
    setAppState('loading');
    setError(null);
    try {
      const res = await fetch(DEFAULT_FILE);
      if (!res.ok) throw new Error('not found');
      const buf = new Uint8Array(await res.arrayBuffer());
      const data = parseWorkbookBuffer(buf);
      setAllRecords(data);
      setFileName('saldo_por_gestor.xlsx');
      setAppState('ready');
    } catch (err) {
      console.error('[loadDefaultFile] erro:', err);
      setAppState('empty');
    }
  }, []);

  useEffect(() => { loadDefaultFile(); }, [loadDefaultFile]);

  const handleFileSelect = useCallback(async (file: File) => {
    setAppState('loading');
    setError(null);
    setFileName(file.name);
    try {
      const data = await readExcelFile(file);
      setAllRecords(data);
      setFilters({ searchNome: '', searchGestor: '' });
      setAppState('ready');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setAppState('error');
    }
  }, []);

  const handleFilterChange = useCallback((f: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...f }));
  }, []);

  const handleLogin = useCallback((session: AuthSession) => {
    setAuth(session);
    setFilters({ searchNome: '', searchGestor: '' });
  }, []);

  const handleLogout = useCallback(() => {
    setAuth(null);
    setFilters({ searchNome: '', searchGestor: '' });
  }, []);

  // Registros filtrados pela sessão do gestor (se não for master)
  const sessionRecords = useMemo(() => {
    if (!auth) return [];
    if (auth.isMaster) return allRecords;
    return allRecords.filter((r) => gestorMatches(r.gestor, auth.gestorName));
  }, [allRecords, auth]);

  // Gestores disponíveis para o dropdown (apenas master vê todos)
  const allGestores = useMemo(() => groupByGestor(sessionRecords), [sessionRecords]);

  // Registros após filtros adicionais (nome/gestor)
  const filteredRecords = useMemo(
    () => applyFilters(sessionRecords, filters),
    [sessionRecords, filters]
  );

  const globalStats = useMemo(
    () => (sessionRecords.length > 0 ? calculateGlobalStats(sessionRecords) : null),
    [sessionRecords]
  );

  const filteredGestores = useMemo(
    () => groupByGestor(filteredRecords),
    [filteredRecords]
  );

  // Tela de login (antes de autenticar)
  if (!auth) {
    return <Login onLogin={handleLogin} />;
  }

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
                  {auth.isMaster ? 'Visão geral' : auth.gestorName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {appState === 'ready' && (
                <button
                  onClick={loadDefaultFile}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-primary-400 hover:text-primary-300 hover:bg-dark-700 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Atualizar
                </button>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-dark-300 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {appState === 'loading' && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-12 h-12 border-4 border-dark-700 border-t-primary-500 rounded-full animate-spin mb-4" />
            <p className="text-dark-400">Carregando dados...</p>
          </div>
        )}

        {(appState === 'empty' || appState === 'error') && (
          <div className="py-16">
            <Upload onFileSelect={handleFileSelect} isLoading={false} error={error} />
          </div>
        )}

        {appState === 'ready' && globalStats && (
          <>
            <KPI stats={globalStats} />

            <Filters
              filters={filters}
              gestores={allGestores}
              isMaster={auth.isMaster}
              onFilterChange={handleFilterChange}
            />

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
              <div className="bg-dark-800 border border-dark-700 rounded-xl p-5">
                <h3 className="text-base font-semibold text-white mb-4">
                  Saldo por Equipe
                  <span className="ml-2 text-sm font-normal text-dark-400">
                    ({filteredGestores.length} {filteredGestores.length === 1 ? 'gestor' : 'gestores'})
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
