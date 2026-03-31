import type { ColaboradorRecord, GestorSummary, GlobalStats, FilterState } from './types';

export function groupByGestor(records: ColaboradorRecord[]): GestorSummary[] {
  const map = new Map<string, ColaboradorRecord[]>();

  for (const r of records) {
    const arr = map.get(r.gestor) ?? [];
    arr.push(r);
    map.set(r.gestor, arr);
  }

  return Array.from(map.entries())
    .map(([gestor, colaboradores]) => {
      const totalMinutos = colaboradores.reduce((s, c) => s + c.minutos, 0);
      return {
        gestor,
        colaboradores,
        totalMinutos,
        mediaMinutos: Math.round(totalMinutos / colaboradores.length),
        positivosCount: colaboradores.filter((c) => c.minutos > 0).length,
        negativosCount: colaboradores.filter((c) => c.minutos < 0).length,
        zeradosCount: colaboradores.filter((c) => c.minutos === 0).length,
      };
    })
    .sort((a, b) => b.totalMinutos - a.totalMinutos);
}

export function calculateGlobalStats(records: ColaboradorRecord[]): GlobalStats {
  const gestores = new Set(records.map((r) => r.gestor));
  const totalMinutos = records.reduce((s, r) => s + r.minutos, 0);

  return {
    totalColaboradores: records.length,
    totalGestores: gestores.size,
    totalMinutos,
    positivosCount: records.filter((r) => r.minutos > 0).length,
    negativosCount: records.filter((r) => r.minutos < 0).length,
    zeradosCount: records.filter((r) => r.minutos === 0).length,
    mediaMinutos: records.length > 0 ? Math.round(totalMinutos / records.length) : 0,
  };
}

export function applyFilters(
  records: ColaboradorRecord[],
  filters: FilterState
): ColaboradorRecord[] {
  return records.filter((r) => {
    if (filters.searchNome && !r.nome.toLowerCase().includes(filters.searchNome.toLowerCase()))
      return false;
    if (filters.searchGestor && r.gestor !== filters.searchGestor) return false;
    return true;
  });
}
