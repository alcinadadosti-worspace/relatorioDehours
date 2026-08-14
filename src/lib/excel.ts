import * as XLSX from 'xlsx';
import type { ColaboradorRecord } from './types';

const REQUIRED_COLUMNS = ['Gestor', 'Minutos'];

const EXCLUDED_NAMES = new Set([
  'leidiane souza',
  'luiz henrique martins tavares',
  'moises santiago',
  'cledjon dias dos santos',
  'paulo rogerio santos',
  'millena sthefany dos santos cruz',
  'anderson rosalvo rocha dos santos',
  'samyra anchieta bispo',
  'cristielle pereira lima da silva',
  'maria tatiane basto cardoso',
  'lianda melinda santos calixto',
]);

const NON_NAME_PREFIXES = [
  'relatorio', 'periodo', 'empregador', 'cpf', 'competencia',
  'saldo', 'dias', 'total', 'validade', 'horas praticadas', 'hora excedente',
];

function normalizeForExclusion(name: string): string {
  return name.trim().normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function isExcluded(nome: string): boolean {
  return EXCLUDED_NAMES.has(normalizeForExclusion(nome));
}

function normalizeHeader(h: string): string {
  return h.trim().normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
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

function isNameRow(row: unknown[]): boolean {
  const cell0 = row[0];
  if (!cell0 || typeof cell0 !== 'string' || !cell0.trim()) return false;
  const nonNullCount = row.filter((c) => c !== null && c !== undefined && c !== '').length;
  if (nonNullCount !== 1) return false;
  const norm = normalizeHeader(cell0);
  return !NON_NAME_PREFIXES.some((prefix) => norm.startsWith(prefix));
}

/** Lê o arquivo Saldos_por_Gestor_Ajustado e retorna mapa nome → gestor */
export function parseGestorMapFromBuffer(data: Uint8Array): Record<string, string> {
  const wb = XLSX.read(data, { type: 'array' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });
  const map: Record<string, string> = {};
  for (const row of rows.slice(1)) {
    const gestor = String(row[0] ?? '').trim();
    const colaborador = String(row[1] ?? '').trim();
    if (colaborador && gestor) {
      map[normalizeForExclusion(colaborador)] = gestor;
    }
  }
  return map;
}

function parseReportFormat(rows: unknown[][], gestorMap: Record<string, string>): ColaboradorRecord[] {
  const records: ColaboradorRecord[] = [];
  let currentName: string | null = null;

  for (const row of rows) {
    const cell0 = row[0];

    if (isNameRow(row)) {
      currentName = String(cell0).trim();
      continue;
    }

    if (
      currentName &&
      typeof cell0 === 'string' &&
      normalizeHeader(cell0).startsWith('total praticado hora excedente')
    ) {
      const rawBalance = String(row[12] ?? '').trim();
      const minutos = parseTimeToMinutes(rawBalance);
      const saldoTotal = formatTimeString(rawBalance);

      if (!isExcluded(currentName)) {
        const gestor = gestorMap[normalizeForExclusion(currentName)] ?? 'Sem Gestor';
        records.push({ nome: currentName, gestor, saldoTotal, minutos });
      }
      currentName = null;
    }
  }

  return records;
}

export async function readExcelFile(file: File, gestorMap: Record<string, string>): Promise<ColaboradorRecord[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        resolve(parseWorkbook(XLSX.read(data, { type: 'array' }), gestorMap));
      } catch (err) {
        reject(new Error(`Erro ao ler arquivo: ${err}`));
      }
    };

    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsArrayBuffer(file);
  });
}

export function parseWorkbookBuffer(data: Uint8Array, gestorMap: Record<string, string>): ColaboradorRecord[] {
  return parseWorkbook(XLSX.read(data, { type: 'array' }), gestorMap);
}

function parseWorkbook(wb: XLSX.WorkBook, gestorMap: Record<string, string>): ColaboradorRecord[] {
  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];

    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null });
    if (rows.length > 0) {
      const firstCell = String(rows[0]?.[0] ?? '');
      if (firstCell.includes('Banco de Horas')) {
        return parseReportFormat(rows, gestorMap);
      }
    }

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
      const gestor = !gestorRaw ? 'Sem Gestor' : gestorRaw;
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
