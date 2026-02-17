/**
 * Parser robusto para a coluna "Diferenca"
 *
 * Formatos aceitos:
 * - Apenas minutos: +5min, -7min, +1min, -28min
 * - Horas + minutos: +2h55min, -1h10min, +1h30min
 * - Apenas horas: +2h, -1h
 * - Traço ou vazio: "-", "", null, undefined (considerado sem dados)
 *
 * Retorna:
 * - deltaMinutes: número de minutos (positivo ou negativo)
 * - isMissing: true se o valor era vazio/traço
 * - parseError: true se não conseguiu fazer o parse
 */

export interface ParseDiferencaResult {
  deltaMinutes: number;
  isMissing: boolean;
  parseError: boolean;
}

export function parseDiferenca(value: unknown): ParseDiferencaResult {
  // Caso nulo/undefined
  if (value === null || value === undefined) {
    return { deltaMinutes: 0, isMissing: true, parseError: false };
  }

  // Converter para string e limpar
  const str = String(value).trim();

  // Caso vazio ou traço
  if (str === '' || str === '-' || str === '–' || str === '—') {
    return { deltaMinutes: 0, isMissing: true, parseError: false };
  }

  // Regex para capturar o formato:
  // ^([+-])           - sinal obrigatório
  // (?:(\d+)h)?       - horas opcionais (grupo 2)
  // (?:(\d+)min)?$    - minutos opcionais (grupo 3)
  //
  // Também aceita variações como "2h 30min", "2h30min", "30 min"
  const cleanStr = str.replace(/\s+/g, '').toLowerCase();

  // Padrão principal: +2h55min, -1h, +30min
  const mainRegex = /^([+-])(?:(\d+)h)?(?:(\d+)min)?$/;
  const match = cleanStr.match(mainRegex);

  if (match) {
    const sign = match[1] === '+' ? 1 : -1;
    const hours = match[2] ? parseInt(match[2], 10) : 0;
    const minutes = match[3] ? parseInt(match[3], 10) : 0;

    // Verifica se pelo menos horas ou minutos foi especificado
    if (hours === 0 && minutes === 0 && !match[2] && !match[3]) {
      // Apenas sinal, sem valor
      return { deltaMinutes: 0, isMissing: false, parseError: true };
    }

    const totalMinutes = sign * (hours * 60 + minutes);
    return { deltaMinutes: totalMinutes, isMissing: false, parseError: false };
  }

  // Padrão alternativo: tenta extrair números se houver
  // Ex: "2h", "30min", "2:30" (formato hora:minuto)
  const altRegex1 = /^([+-])?(\d+):(\d+)$/;
  const altMatch1 = cleanStr.match(altRegex1);

  if (altMatch1) {
    const sign = altMatch1[1] === '-' ? -1 : 1;
    const hours = parseInt(altMatch1[2], 10);
    const minutes = parseInt(altMatch1[3], 10);
    const totalMinutes = sign * (hours * 60 + minutes);
    return { deltaMinutes: totalMinutes, isMissing: false, parseError: false };
  }

  // Padrão alternativo: apenas número (assumir minutos)
  const altRegex2 = /^([+-])?(\d+)$/;
  const altMatch2 = cleanStr.match(altRegex2);

  if (altMatch2) {
    const sign = altMatch2[1] === '-' ? -1 : 1;
    const minutes = parseInt(altMatch2[2], 10);
    return { deltaMinutes: sign * minutes, isMissing: false, parseError: false };
  }

  // Não conseguiu fazer parse
  return { deltaMinutes: 0, isMissing: false, parseError: true };
}

/**
 * Parser de data no formato DD/MM/YYYY
 */
export function parseDate(value: unknown): Date | null {
  if (value === null || value === undefined) {
    return null;
  }

  // Se já for Date
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }

  // Se for número (Excel serial date)
  if (typeof value === 'number') {
    // Excel usa um sistema onde 1 = 1/1/1900
    // JavaScript Date usa milissegundos desde 1/1/1970
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
    return isNaN(date.getTime()) ? null : date;
  }

  const str = String(value).trim();

  if (str === '' || str === '-') {
    return null;
  }

  // Formato DD/MM/YYYY
  const brRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const brMatch = str.match(brRegex);

  if (brMatch) {
    const day = parseInt(brMatch[1], 10);
    const month = parseInt(brMatch[2], 10) - 1; // JavaScript mês é 0-indexed
    const year = parseInt(brMatch[3], 10);
    const date = new Date(year, month, day);

    // Verifica se a data é válida
    if (date.getDate() === day && date.getMonth() === month && date.getFullYear() === year) {
      return date;
    }
  }

  // Formato YYYY-MM-DD
  const isoRegex = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
  const isoMatch = str.match(isoRegex);

  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    const date = new Date(year, month, day);

    if (date.getDate() === day && date.getMonth() === month && date.getFullYear() === year) {
      return date;
    }
  }

  return null;
}

/**
 * Formata uma data para exibição
 */
export function formatDate(date: Date | null): string {
  if (!date) return '-';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

/**
 * Formata uma data para ordenação (YYYY-MM-DD)
 */
export function formatDateISO(date: Date | null): string {
  if (!date) return '';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${year}-${month}-${day}`;
}
