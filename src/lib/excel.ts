import * as XLSX from 'xlsx';
import type { ColaboradorRecord } from './types';

const REQUIRED_COLUMNS = ['Nome', 'Gestor', 'Minutos'];

function normalizeHeader(h: string): string {
  return h.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function findColumn(headers: string[], target: string): string | null {
  const norm = normalizeHeader(target);
  return headers.find((h) => normalizeHeader(h) === norm) ?? null;
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
  // Procura a primeira aba que tenha as colunas obrigatórias
  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

    if (rows.length === 0) continue;

    const headers = Object.keys(rows[0]);
    const missing = REQUIRED_COLUMNS.filter((c) => !findColumn(headers, c));

    if (missing.length > 0) continue;

    const colNome = findColumn(headers, 'Nome')!;
    const colGestor = findColumn(headers, 'Gestor')!;
    const colSaldo = findColumn(headers, 'Saldo Total');
    const colMinutos = findColumn(headers, 'Minutos')!;

    const records: ColaboradorRecord[] = [];

    for (const row of rows) {
      const nome = String(row[colNome] ?? '').trim();
      const gestor = String(row[colGestor] ?? '').trim() || 'Sem Gestor';
      const saldoTotal = colSaldo ? String(row[colSaldo] ?? '').trim() : '';
      const minutos = Number(row[colMinutos] ?? 0);

      if (!nome) continue;

      records.push({ nome, gestor, saldoTotal, minutos });
    }

    return records;
  }

  throw new Error(
    `Nenhuma aba com as colunas obrigatórias foi encontrada. Colunas necessárias: ${REQUIRED_COLUMNS.join(', ')}`
  );
}
