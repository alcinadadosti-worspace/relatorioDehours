// Tipos da aplicação - Relatório de Saldo por Gestor

export interface ColaboradorRecord {
  nome: string;
  gestor: string;
  saldoTotal: string; // ex: "-27h11min"
  minutos: number;    // ex: -1631
}

export interface GestorSummary {
  gestor: string;
  colaboradores: ColaboradorRecord[];
  totalMinutos: number;
  mediaMinutos: number;
  positivosCount: number;
  negativosCount: number;
  zeradosCount: number;
}

export interface GlobalStats {
  totalColaboradores: number;
  totalGestores: number;
  totalMinutos: number;
  positivosCount: number;
  negativosCount: number;
  zeradosCount: number;
  mediaMinutos: number;
}

export interface FilterState {
  searchNome: string;
  searchGestor: string;
}

export type AppState = 'empty' | 'loading' | 'error' | 'ready';

export function formatMinutos(minutos: number): string {
  if (minutos === 0) return '0min';
  const sign = minutos < 0 ? '-' : '+';
  const abs = Math.abs(minutos);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  if (h === 0) return `${sign}${m}min`;
  if (m === 0) return `${sign}${h}h`;
  return `${sign}${h}h${m}min`;
}
