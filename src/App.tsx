import { useState, useCallback, useMemo, useEffect } from 'react';
import { Clock, FileSpreadsheet, BarChart3, FileText, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';

import type {
  AppState,
  FilterState,
  SheetInfo,
  ParsedRecord,
} from './lib/types';
import { readExcelFile, importSheets } from './lib/excel';
import {
  aggregateByCollaborator,
  calculateGlobalStats,
  applyFilters,
  DEFAULT_CONFIG,
} from './lib/aggregation';

import {
  Upload,
  Filters,
  KPI,
  RankingChart,
  ClassificacaoChart,
  SummaryTable,
  PDFReport,
  CollaboratorDetail,
} from './components';

// Nome do arquivo padrão na pasta public
const DEFAULT_DATA_FILE = '/dados.xlsx';

type ViewMode = 'dashboard' | 'detail' | 'report';

export default function App() {
  // Estados principais
  const [appState, setAppState] = useState<AppState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDefaultFile, setIsDefaultFile] = useState(false);

  // Dados do Excel
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [sheets, setSheets] = useState<SheetInfo[]>([]);
  const [records, setRecords] = useState<ParsedRecord[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  // Configuração e filtros
  const [config] = useState(DEFAULT_CONFIG);
  const [filters, setFilters] = useState<FilterState>({
    searchName: '',
    searchId: '',
    classificacao: 'todas',
    selectedCollaboratorId: null,
  });

  // View
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [showAllRanking, setShowAllRanking] = useState(false);

  // Carrega arquivo padrão ao iniciar
  const loadDefaultFile = useCallback(async () => {
    setAppState('loading');
    setError(null);
    setIsDefaultFile(true);

    try {
      const response = await fetch(DEFAULT_DATA_FILE);
      if (!response.ok) {
        throw new Error('Arquivo de dados não encontrado');
      }

      const arrayBuffer = await response.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);
      const wb = XLSX.read(data, { type: 'array', cellDates: true });

      setWorkbook(wb);
      setFileName('dados.xlsx');

      // Importa todas as abas válidas automaticamente
      const allSheets = wb.SheetNames;
      const result = importSheets(wb, allSheets);

      if (result.records.length > 0) {
        setRecords(result.records);
        setWarnings(result.warnings);
        setSheets(result.sheets);
        setAppState('ready');
        setViewMode('dashboard');
      } else {
        setError('Nenhum registro encontrado no arquivo');
        setAppState('error');
      }
    } catch (err) {
      // Se não encontrar arquivo padrão, mostra tela de upload
      setAppState('empty');
      setIsDefaultFile(false);
    }
  }, []);

  // Carrega arquivo padrão ao montar o componente
  useEffect(() => {
    loadDefaultFile();
  }, [loadDefaultFile]);

  // Calcula summaries e stats
  const summaries = useMemo(() => {
    if (records.length === 0) return [];
    return aggregateByCollaborator(records, config);
  }, [records, config]);

  const globalStats = useMemo(() => {
    if (records.length === 0 || summaries.length === 0) return null;
    return calculateGlobalStats(records, summaries);
  }, [records, summaries]);

  const filteredSummaries = useMemo(() => {
    return applyFilters(summaries, filters);
  }, [summaries, filters]);

  const selectedCollaborator = useMemo(() => {
    if (!filters.selectedCollaboratorId) return null;
    return summaries.find((s) => s.id === filters.selectedCollaboratorId) || null;
  }, [summaries, filters.selectedCollaboratorId]);

  // Handlers
  const handleFileSelect = useCallback(async (file: File) => {
    setAppState('loading');
    setError(null);
    setFileName(file.name);
    setIsDefaultFile(false);

    try {
      const result = await readExcelFile(file);
      setWorkbook(result.workbook);
      setSheets(result.sheets);

      // Se só tem uma aba válida, importa automaticamente
      const validSheets = result.sheets.filter((s) => s.hasRequiredColumns);
      if (validSheets.length === 1) {
        handleSheetsSelect(validSheets.map((s) => s.name), result.workbook);
      } else if (validSheets.length === 0) {
        setError('Nenhuma aba com as colunas obrigatórias foi encontrada.');
        setAppState('error');
      } else {
        setAppState('empty'); // Aguarda seleção de abas
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setAppState('error');
    }
  }, []);

  const handleSheetsSelect = useCallback(
    (sheetNames: string[], wb?: XLSX.WorkBook) => {
      const currentWorkbook = wb || workbook;
      if (!currentWorkbook) return;

      setAppState('loading');

      try {
        const result = importSheets(currentWorkbook, sheetNames);

        if (!result.success) {
          setError(result.errors.join('\n'));
          setAppState('error');
          return;
        }

        setRecords(result.records);
        setWarnings(result.warnings);
        setAppState('ready');
        setViewMode('dashboard');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao importar');
        setAppState('error');
      }
    },
    [workbook]
  );

  const handleFilterChange = useCallback((newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const handleSelectCollaborator = useCallback((id: string) => {
    setFilters((prev) => ({ ...prev, selectedCollaboratorId: id }));
    setViewMode('detail');
  }, []);

  const handleBackToList = useCallback(() => {
    setFilters((prev) => ({ ...prev, selectedCollaboratorId: null }));
    setViewMode('dashboard');
  }, []);

  const handleReset = useCallback(() => {
    setAppState('empty');
    setError(null);
    setFileName(null);
    setWorkbook(null);
    setSheets([]);
    setRecords([]);
    setWarnings([]);
    setFilters({
      searchName: '',
      searchId: '',
      classificacao: 'todas',
      selectedCollaboratorId: null,
    });
    setViewMode('dashboard');
    setIsDefaultFile(false);
  }, []);

  const handleRefresh = useCallback(() => {
    setFilters({
      searchName: '',
      searchId: '',
      classificacao: 'todas',
      selectedCollaboratorId: null,
    });
    loadDefaultFile();
  }, [loadDefaultFile]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Relatório de Horas</h1>
                <p className="text-xs text-gray-500">Análise de Ponto</p>
              </div>
            </div>

            {appState === 'ready' && (
              <div className="flex items-center gap-2">
                {/* Tabs de navegação */}
                <nav className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('dashboard')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      viewMode === 'dashboard'
                        ? 'bg-white text-primary-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    Dashboard
                  </button>
                  <button
                    onClick={() => setViewMode('report')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      viewMode === 'report'
                        ? 'bg-white text-primary-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    Relatório PDF
                  </button>
                </nav>

                <div className="w-px h-8 bg-gray-300 mx-2" />

                {isDefaultFile && (
                  <button
                    onClick={handleRefresh}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                    title="Recarregar dados"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Atualizar
                  </button>
                )}

                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  {isDefaultFile ? 'Outro arquivo' : 'Novo arquivo'}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estado carregando arquivo padrão */}
        {appState === 'loading' && isDefaultFile && (
          <div className="py-12 flex flex-col items-center justify-center">
            <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600">Carregando dados...</p>
          </div>
        )}

        {/* Estado vazio ou carregando upload manual */}
        {(appState === 'empty' || (appState === 'loading' && !isDefaultFile) || appState === 'error') && (
          <div className="py-12">
            <Upload
              onFileSelect={handleFileSelect}
              onSheetsSelect={handleSheetsSelect}
              sheets={sheets}
              isLoading={appState === 'loading'}
              error={error}
            />
          </div>
        )}

        {/* Dashboard */}
        {appState === 'ready' && viewMode === 'dashboard' && (
          <>
            {/* Warnings */}
            {warnings.length > 0 && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                <p className="font-medium text-yellow-800 mb-2">
                  Avisos durante a importação ({warnings.length})
                </p>
                <div className="max-h-32 overflow-y-auto">
                  {warnings.slice(0, 10).map((w, i) => (
                    <p key={i} className="text-sm text-yellow-700">
                      {w}
                    </p>
                  ))}
                  {warnings.length > 10 && (
                    <p className="text-sm text-yellow-600 mt-2">
                      ... e mais {warnings.length - 10} avisos
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* KPIs */}
            {globalStats && <KPI stats={globalStats} />}

            {/* Filtros */}
            <Filters
              filters={filters}
              stats={globalStats}
              onFilterChange={handleFilterChange}
            />

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-800">Ranking</h3>
                  <button
                    onClick={() => setShowAllRanking(!showAllRanking)}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    {showAllRanking ? 'Ver Top 10' : 'Ver todos'}
                  </button>
                </div>
                <RankingChart summaries={filteredSummaries} showAll={showAllRanking} title="" />
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-4">
                {globalStats && <ClassificacaoChart stats={globalStats} />}
              </div>
            </div>

            {/* Tabela */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Colaboradores ({filteredSummaries.length})
              </h3>
              <SummaryTable
                summaries={filteredSummaries}
                onSelectCollaborator={handleSelectCollaborator}
              />
            </div>
          </>
        )}

        {/* Detalhe do colaborador */}
        {appState === 'ready' && viewMode === 'detail' && selectedCollaborator && (
          <CollaboratorDetail summary={selectedCollaborator} onBack={handleBackToList} />
        )}

        {/* Relatório PDF */}
        {appState === 'ready' && viewMode === 'report' && globalStats && (
          <PDFReport
            summaries={summaries}
            stats={globalStats}
            fileName={fileName}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-sm text-gray-500 text-center">
            Relatório de Horas - Análise de Ponto &copy; {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
