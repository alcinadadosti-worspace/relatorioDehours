// Tipos principais da aplicação

export interface RawRecord {
  // Colunas obrigatórias
  Colaborador: string;
  ID: string | number;
  Classificacao: string;
  Diferenca: string;

  // Colunas opcionais
  Gestor?: string;
  Data?: string;
  Dia?: string;
  Entrada?: string;
  Intervalo?: string;
  Retorno?: string;
  Saida?: string;
  'Diferenca (min)'?: string | number;

  // Metadados adicionados pelo parser
  sourceSheet?: string;
  [key: string]: unknown;
}

export interface ParsedRecord {
  id: string;
  colaborador: string;
  classificacao: string;
  diferencaRaw: string;
  deltaMinutes: number;
  isMissing: boolean;
  parseError: boolean;

  // Flag de ajuste: entrada após 10h não contabiliza
  isAjuste: boolean;

  // Campos opcionais parseados
  data?: Date;
  dataString?: string;
  gestor?: string;
  dia?: string;
  entrada?: string;
  intervalo?: string;
  retorno?: string;
  saida?: string;

  // Metadados
  sourceSheet: string;
  rowIndex: number;
}

export interface CollaboratorSummary {
  id: string;
  colaborador: string;
  alternativeNames: string[];

  // Totais brutos (não inclui registros com isAjuste)
  totalDeltaMinutes: number;
  countDias: number;
  countSemDados: number;
  countParseErrors: number;

  // Contagem de ajustes (entrada após 10h - não contabilizados)
  countAjuste: number;

  // Ajustes por classificação
  countHoraExtra: number;
  countAtraso: number;
  countNormal: number;
  countOutros: number;

  totalExtraBonusMinutes: number;
  totalAtrasoPenaltyMinutes: number;

  // Total ajustado
  adjustedTotalMinutes: number;

  // Registros originais
  records: ParsedRecord[];
}

export interface AggregationConfig {
  extraBonusHours: number;    // Bônus para Hora Extra (em horas)
  atrasoPenaltyHours: number; // Penalidade para Atraso (em horas)
}

export interface GlobalStats {
  totalCollaborators: number;
  totalRecords: number;
  totalBrutoMinutes: number;
  totalAjustadoMinutes: number;
  totalSemDados: number;
  totalParseErrors: number;
  totalAjuste: number;  // Registros com entrada após 10h (não contabilizados)

  countHoraExtra: number;
  countAtraso: number;
  countNormal: number;
  countOutros: number;

  byClassificacao: Record<string, number>;
}

export interface SheetInfo {
  name: string;
  rowCount: number;
  hasRequiredColumns: boolean;
  missingColumns: string[];
}

export interface ImportResult {
  success: boolean;
  sheets: SheetInfo[];
  records: ParsedRecord[];
  errors: string[];
  warnings: string[];
}

export type AppState = 'empty' | 'loading' | 'error' | 'ready';

export interface FilterState {
  searchName: string;
  searchId: string;
  classificacao: string;
  selectedCollaboratorId: string | null;
}

export interface AppData {
  state: AppState;
  error: string | null;
  importResult: ImportResult | null;
  records: ParsedRecord[];
  summaries: CollaboratorSummary[];
  globalStats: GlobalStats | null;
  config: AggregationConfig;
  filters: FilterState;
  fileName: string | null;
}

// Helpers para formatação
export function formatMinutesToHoursMinutes(minutes: number): string {
  const sign = minutes < 0 ? '-' : '+';
  const absMinutes = Math.abs(minutes);
  const hours = Math.floor(absMinutes / 60);
  const mins = absMinutes % 60;

  if (hours === 0) {
    return `${sign}${mins}min`;
  }
  if (mins === 0) {
    return `${sign}${hours}h`;
  }
  return `${sign}${hours}h ${mins}min`;
}

export function formatMinutesToDecimalHours(minutes: number): string {
  const hours = minutes / 60;
  return hours.toFixed(2) + 'h';
}
