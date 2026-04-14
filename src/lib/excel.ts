import * as XLSX from 'xlsx';
import type { ColaboradorRecord } from './types';

const REQUIRED_COLUMNS = ['Gestor', 'Minutos'];

// Pessoas excluídas da análise (comparação sem acento e sem maiúsculas)
const EXCLUDED_NAMES = new Set([
  'leidiane souza',
  'luiz henrique martins tavares',
  'moises santiago',
  'cledjon dias dos santos',
  'paulo rogerio santos',
  'millena sthefany dos santos cruz',
  'raquele fragoso da silva',
  'lianda melinda santos calixto',
  'luis henrique batista dos santos',
  'anderson rosalvo rocha dos santos',
  'yuri castro gomes',
]);

// Prefixos que identificam linhas de dados/cabeçalho (não são nomes de colaboradores)
const NON_NAME_PREFIXES = [
  'relatorio', 'periodo', 'empregador', 'cpf', 'competencia',
  'saldo', 'dias', 'total', 'validade', 'horas praticadas', 'hora excedente',
];

function normalizeForExclusion(name: string): string {
  return name.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function isExcluded(nome: string): boolean {
  return EXCLUDED_NAMES.has(normalizeForExclusion(nome));
}

function normalizeHeader(h: string): string {
  return h.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function findColumn(headers: string[], target: string): string | null {
  const norm = normalizeHeader(target);
  return headers.find((h) => normalizeHeader(h) === norm) ?? null;
}

/** Converte string "[-]HH:MM" para minutos (ex: "-27:11" → -1631) */
function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr || timeStr === '-' || timeStr.trim() === '') return 0;
  const str = timeStr.trim();
  const negative = str.startsWith('-');
  const parts = str.replace('-', '').split(':');
  if (parts.length !== 2) return 0;
  const hours = parseInt(parts[0], 10) || 0;
  const mins = parseInt(parts[1], 10) || 0;
  const total = hours * 60 + mins;
  return negative ? -total : total;
}

/** Converte string "[-]HH:MM" para formato de exibição (ex: "-27:11" → "-27h11min") */
function formatTimeString(timeStr: string): string {
  if (!timeStr || timeStr === '-' || timeStr.trim() === '') return '0min';
  const str = timeStr.trim();
  const negative = str.startsWith('-');
  const parts = str.replace('-', '').split(':');
  if (parts.length !== 2) return timeStr;
  const hours = parseInt(parts[0], 10) || 0;
  const mins = parseInt(parts[1], 10) || 0;
  if (hours === 0 && mins === 0) return '0min';
  const sign = negative ? '-' : '+';
  if (hours === 0) return `${sign}${mins}min`;
  if (mins === 0) return `${sign}${hours}h`;
  return `${sign}${hours}h${mins}min`;
}

/**
 * Detecta se uma linha é o nome de um colaborador no formato de relatório.
 * Critérios: única célula preenchida (índice 0) e não bate com prefixos de dados.
 */
function isNameRow(row: unknown[]): boolean {
  const cell0 = row[0];
  if (!cell0 || typeof cell0 !== 'string' || !cell0.trim()) return false;
  const nonNullCount = row.filter((c) => c !== null && c !== undefined && c !== '').length;
  if (nonNullCount !== 1) return false;
  const norm = normalizeHeader(cell0);
  return !NON_NAME_PREFIXES.some((prefix) => norm.startsWith(prefix));
}

/**
 * Parseia o formato de relatório "Banco de Horas Colaboradores" onde cada
 * colaborador tem um bloco de linhas, e o saldo acumulado fica na linha
 * "Total Praticado Hora Excedente:" na coluna de índice 12.
 */
function parseReportFormat(rows: unknown[][]): ColaboradorRecord[] {
  const records: ColaboradorRecord[] = [];
  let currentName: string | null = null;

  for (const row of rows) {
    const cell0 = row[0];

    // Detecta linha de nome do colaborador
    if (isNameRow(row)) {
      currentName = String(cell0).trim();
      continue;
    }

    // Detecta linha com saldo acumulado
    if (
      currentName &&
      typeof cell0 === 'string' &&
      normalizeHeader(cell0).startsWith('total praticado hora excedente')
    ) {
      const rawBalance = String(row[12] ?? '').trim();
      const minutos = parseTimeToMinutes(rawBalance);
      const saldoTotal = formatTimeString(rawBalance);

      if (!isExcluded(currentName)) {
        records.push({
          nome: currentName,
          gestor: 'Fernando Ramos',
          saldoTotal,
          minutos,
        });
      }
      currentName = null;
    }
  }

  return records;
}

export async function readExcelFile(file: File): Promise<ColaboradorRecord[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        resolve(parseWorkbook(XLSX.read(data, { type: 'array' })));
      } catch (err) {
        reject(new Error(`Erro ao ler arquivo: ${err}`));
      }
    };

    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsArrayBuffer(file);
  });
}

export function parseWorkbookBuffer(data: Uint8Array): ColaboradorRecord[] {
  return parseWorkbook(XLSX.read(data, { type: 'array' }));
}

function parseWorkbook(wb: XLSX.WorkBook): ColaboradorRecord[] {
  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];

    // Detecta formato de relatório Banco de Horas (célula A1 contém "Banco de Horas")
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null });
    if (rows.length > 0) {
      const firstCell = String(rows[0]?.[0] ?? '');
      if (firstCell.includes('Banco de Horas')) {
        return parseReportFormat(rows);
      }
    }

    // Formato tabular legado (colunas Gestor + Minutos)
    const tabRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
    if (tabRows.length === 0) continue;

    const headers = Object.keys(tabRows[0]);
    const missing = REQUIRED_COLUMNS.filter((c) => !findColumn(headers, c));
    if (missing.length > 0) continue;

    const colNome = findColumn(headers, 'Nome') ?? findColumn(headers, 'Colaborador') ?? '';
    const colGestor = findColumn(headers, 'Gestor')!;
    const colSaldo = findColumn(headers, 'Saldo Total');
    const colMinutos = findColumn(headers, 'Minutos')!;

    const records: ColaboradorRecord[] = [];

    for (const row of tabRows) {
      const nome = String(row[colNome] ?? '').trim();
      const gestorRaw = String(row[colGestor] ?? '').trim();
      const gestor =
        !gestorRaw || gestorRaw.toLowerCase() === 'sem gestor'
          ? 'Fernando Ramos'
          : gestorRaw;
      const saldoTotal = colSaldo ? String(row[colSaldo] ?? '').trim() : '';
      const minutos = Number(row[colMinutos] ?? 0);

      if (!colNome || !nome || isExcluded(nome)) continue;

      records.push({ nome, gestor, saldoTotal, minutos });
    }

    return records;
  }

  throw new Error(
    `Formato de planilha não reconhecido. Envie o "Relatório Banco de Horas Colaboradores" ou uma planilha com as colunas: ${REQUIRED_COLUMNS.join(', ')}`
  );
}
