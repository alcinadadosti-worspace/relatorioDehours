import type {
  ParsedRecord,
  CollaboratorSummary,
  AggregationConfig,
  GlobalStats,
} from './types';

/**
 * Configuração padrão (sem bônus/penalidade)
 */
export const DEFAULT_CONFIG: AggregationConfig = {
  extraBonusHours: 0,      // Sem bônus
  atrasoPenaltyHours: 0,   // Sem penalidade
};

/**
 * Encontra o nome mais frequente para um conjunto de registros
 */
function getMostFrequentName(records: ParsedRecord[]): {
  mainName: string;
  alternativeNames: string[];
} {
  const nameCount: Record<string, number> = {};

  for (const record of records) {
    const name = record.colaborador.trim();
    if (name) {
      nameCount[name] = (nameCount[name] || 0) + 1;
    }
  }

  const names = Object.entries(nameCount).sort((a, b) => b[1] - a[1]);

  if (names.length === 0) {
    return { mainName: '', alternativeNames: [] };
  }

  const mainName = names[0][0];
  const alternativeNames = names.slice(1).map(([name]) => name);

  return { mainName, alternativeNames };
}

/**
 * Normaliza classificação para comparação
 */
function normalizeClassificacao(classificacao: string): string {
  return classificacao
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/**
 * Verifica se a classificação é "Hora Extra"
 */
function isHoraExtra(classificacao: string): boolean {
  const normalized = normalizeClassificacao(classificacao);
  return (
    normalized === 'hora extra' ||
    normalized === 'horaextra' ||
    normalized === 'extra' ||
    normalized === 'overtime'
  );
}

/**
 * Verifica se a classificação é "Atraso"
 */
function isAtraso(classificacao: string): boolean {
  const normalized = normalizeClassificacao(classificacao);
  return (
    normalized === 'atraso' ||
    normalized === 'late' ||
    normalized === 'atrasado'
  );
}

/**
 * Verifica se a classificação é "Normal"
 */
function isNormal(classificacao: string): boolean {
  const normalized = normalizeClassificacao(classificacao);
  return (
    normalized === 'normal' ||
    normalized === 'regular' ||
    normalized === 'ok'
  );
}

/**
 * Agrupa registros por colaborador e calcula totais
 */
export function aggregateByCollaborator(
  records: ParsedRecord[],
  config: AggregationConfig
): CollaboratorSummary[] {
  // Agrupa por ID
  const groups: Record<string, ParsedRecord[]> = {};

  for (const record of records) {
    const id = record.id;
    if (!groups[id]) {
      groups[id] = [];
    }
    groups[id].push(record);
  }

  // Processa cada grupo
  const summaries: CollaboratorSummary[] = [];

  for (const [id, groupRecords] of Object.entries(groups)) {
    const { mainName, alternativeNames } = getMostFrequentName(groupRecords);

    // Contadores
    let totalDeltaMinutes = 0;
    let countDias = 0;
    let countSemDados = 0;
    let countParseErrors = 0;
    let countHoraExtra = 0;
    let countAtraso = 0;
    let countNormal = 0;
    let countOutros = 0;
    let totalExtraBonusMinutes = 0;
    let totalAtrasoPenaltyMinutes = 0;

    for (const record of groupRecords) {
      // Soma diferença bruta
      totalDeltaMinutes += record.deltaMinutes;

      // Contadores
      if (record.isMissing) {
        countSemDados++;
      } else {
        countDias++;
      }

      if (record.parseError) {
        countParseErrors++;
      }

      // Classificação e ajustes
      const classificacao = record.classificacao;

      if (isHoraExtra(classificacao)) {
        countHoraExtra++;
        totalExtraBonusMinutes += config.extraBonusHours * 60;
      } else if (isAtraso(classificacao)) {
        countAtraso++;
        totalAtrasoPenaltyMinutes += config.atrasoPenaltyHours * 60;
      } else if (isNormal(classificacao)) {
        countNormal++;
      } else {
        countOutros++;
      }
    }

    // Total ajustado
    const adjustedTotalMinutes =
      totalDeltaMinutes + totalExtraBonusMinutes - totalAtrasoPenaltyMinutes;

    summaries.push({
      id,
      colaborador: mainName,
      alternativeNames,
      totalDeltaMinutes,
      countDias,
      countSemDados,
      countParseErrors,
      countHoraExtra,
      countAtraso,
      countNormal,
      countOutros,
      totalExtraBonusMinutes,
      totalAtrasoPenaltyMinutes,
      adjustedTotalMinutes,
      records: groupRecords,
    });
  }

  // Ordena por ID
  summaries.sort((a, b) => {
    const aNum = parseInt(a.id, 10);
    const bNum = parseInt(b.id, 10);
    if (!isNaN(aNum) && !isNaN(bNum)) {
      return aNum - bNum;
    }
    return a.id.localeCompare(b.id);
  });

  return summaries;
}

/**
 * Calcula estatísticas globais
 */
export function calculateGlobalStats(
  records: ParsedRecord[],
  summaries: CollaboratorSummary[]
): GlobalStats {
  let totalBrutoMinutes = 0;
  let totalAjustadoMinutes = 0;
  let totalSemDados = 0;
  let totalParseErrors = 0;
  let countHoraExtra = 0;
  let countAtraso = 0;
  let countNormal = 0;
  let countOutros = 0;

  const byClassificacao: Record<string, number> = {};

  for (const record of records) {
    totalBrutoMinutes += record.deltaMinutes;

    if (record.isMissing) {
      totalSemDados++;
    }

    if (record.parseError) {
      totalParseErrors++;
    }

    const classificacao = record.classificacao.trim() || 'Não informado';
    byClassificacao[classificacao] = (byClassificacao[classificacao] || 0) + 1;

    if (isHoraExtra(record.classificacao)) {
      countHoraExtra++;
    } else if (isAtraso(record.classificacao)) {
      countAtraso++;
    } else if (isNormal(record.classificacao)) {
      countNormal++;
    } else {
      countOutros++;
    }
  }

  for (const summary of summaries) {
    totalAjustadoMinutes += summary.adjustedTotalMinutes;
  }

  return {
    totalCollaborators: summaries.length,
    totalRecords: records.length,
    totalBrutoMinutes,
    totalAjustadoMinutes,
    totalSemDados,
    totalParseErrors,
    countHoraExtra,
    countAtraso,
    countNormal,
    countOutros,
    byClassificacao,
  };
}

/**
 * Retorna top N colaboradores por total ajustado (positivos)
 */
export function getTopPositive(
  summaries: CollaboratorSummary[],
  n: number = 10
): CollaboratorSummary[] {
  return [...summaries]
    .filter((s) => s.adjustedTotalMinutes > 0)
    .sort((a, b) => b.adjustedTotalMinutes - a.adjustedTotalMinutes)
    .slice(0, n);
}

/**
 * Retorna top N colaboradores por total ajustado (negativos)
 */
export function getTopNegative(
  summaries: CollaboratorSummary[],
  n: number = 10
): CollaboratorSummary[] {
  return [...summaries]
    .filter((s) => s.adjustedTotalMinutes < 0)
    .sort((a, b) => a.adjustedTotalMinutes - b.adjustedTotalMinutes)
    .slice(0, n);
}

/**
 * Filtra colaboradores por nome (busca parcial)
 */
export function filterByName(
  summaries: CollaboratorSummary[],
  searchTerm: string
): CollaboratorSummary[] {
  if (!searchTerm.trim()) {
    return summaries;
  }

  const term = searchTerm.toLowerCase().trim();

  return summaries.filter((s) => {
    const mainMatch = s.colaborador.toLowerCase().includes(term);
    const altMatch = s.alternativeNames.some((name) =>
      name.toLowerCase().includes(term)
    );
    return mainMatch || altMatch;
  });
}

/**
 * Filtra colaboradores por ID
 */
export function filterById(
  summaries: CollaboratorSummary[],
  searchId: string
): CollaboratorSummary[] {
  if (!searchId.trim()) {
    return summaries;
  }

  const term = searchId.trim();

  return summaries.filter((s) => s.id.includes(term));
}

/**
 * Aplica todos os filtros
 */
export function applyFilters(
  summaries: CollaboratorSummary[],
  filters: {
    searchName?: string;
    searchId?: string;
    classificacao?: string;
  }
): CollaboratorSummary[] {
  let result = summaries;

  if (filters.searchName) {
    result = filterByName(result, filters.searchName);
  }

  if (filters.searchId) {
    result = filterById(result, filters.searchId);
  }

  if (filters.classificacao && filters.classificacao !== 'todas') {
    // Filtra colaboradores que têm pelo menos um registro com essa classificação
    result = result.filter((s) =>
      s.records.some((r) => {
        const normalized = normalizeClassificacao(r.classificacao);
        const filterNormalized = normalizeClassificacao(filters.classificacao!);
        return normalized === filterNormalized;
      })
    );
  }

  return result;
}
