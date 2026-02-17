import * as XLSX from 'xlsx';
import type { RawRecord, ParsedRecord, SheetInfo, ImportResult } from './types';
import { parseDiferenca, parseDate, isRegistroAjuste } from './time';

// Colunas obrigatórias
const REQUIRED_COLUMNS = ['Colaborador', 'ID', 'Classificacao', 'Diferenca'];

// Mapeamento de nomes alternativos para colunas (normalização)
const COLUMN_ALIASES: Record<string, string[]> = {
  Colaborador: ['colaborador', 'nome', 'funcionario', 'funcionário', 'employee'],
  ID: ['id', 'codigo', 'código', 'matricula', 'matrícula'],
  Classificacao: ['classificacao', 'classificação', 'tipo', 'type', 'status'],
  Diferenca: ['diferenca', 'diferença', 'diff', 'delta'],
};

/**
 * Normaliza o nome de uma coluna
 */
function normalizeColumnName(name: string): string {
  return name
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .toLowerCase();
}

/**
 * Mapeia nome de coluna para o nome padronizado
 */
function mapColumnName(name: string): string {
  const normalized = normalizeColumnName(name);

  for (const [standard, aliases] of Object.entries(COLUMN_ALIASES)) {
    if (normalized === normalizeColumnName(standard)) {
      return standard;
    }
    for (const alias of aliases) {
      if (normalized === normalizeColumnName(alias)) {
        return standard;
      }
    }
  }

  return name.trim();
}

/**
 * Converte uma linha do Excel para objeto com colunas normalizadas
 */
function normalizeRow(row: Record<string, unknown>): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(row)) {
    const mappedKey = mapColumnName(key);
    normalized[mappedKey] = value;
  }

  return normalized;
}

/**
 * Verifica se uma planilha tem as colunas obrigatórias
 */
function checkRequiredColumns(headers: string[]): { hasAll: boolean; missing: string[] } {
  const normalizedHeaders = headers.map((h) => mapColumnName(h));
  const missing: string[] = [];

  for (const required of REQUIRED_COLUMNS) {
    if (!normalizedHeaders.includes(required)) {
      missing.push(required);
    }
  }

  return { hasAll: missing.length === 0, missing };
}

/**
 * Lê um arquivo Excel e retorna informações sobre as abas
 */
export async function readExcelFile(file: File): Promise<{
  workbook: XLSX.WorkBook;
  sheets: SheetInfo[];
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });

        const sheets: SheetInfo[] = workbook.SheetNames.map((name) => {
          const sheet = workbook.Sheets[name];
          const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
            defval: '',
          });

          // Pega os headers da primeira linha
          const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
          const headers: string[] = [];
          for (let col = range.s.c; col <= range.e.c; col++) {
            const cellRef = XLSX.utils.encode_cell({ r: range.s.r, c: col });
            const cell = sheet[cellRef];
            if (cell && cell.v !== undefined) {
              headers.push(String(cell.v));
            }
          }

          const { hasAll, missing } = checkRequiredColumns(headers);

          return {
            name,
            rowCount: json.length,
            hasRequiredColumns: hasAll,
            missingColumns: missing,
          };
        });

        resolve({ workbook, sheets });
      } catch (error) {
        reject(new Error(`Erro ao ler arquivo Excel: ${error}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Erro ao ler arquivo'));
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Importa dados de abas selecionadas do Excel
 */
export function importSheets(
  workbook: XLSX.WorkBook,
  sheetNames: string[]
): ImportResult {
  const records: ParsedRecord[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];
  const sheets: SheetInfo[] = [];

  for (const sheetName of sheetNames) {
    const sheet = workbook.Sheets[sheetName];

    if (!sheet) {
      errors.push(`Aba "${sheetName}" não encontrada`);
      continue;
    }

    const rawData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: '',
    });

    // Pega os headers
    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
    const headers: string[] = [];
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: range.s.r, c: col });
      const cell = sheet[cellRef];
      if (cell && cell.v !== undefined) {
        headers.push(String(cell.v));
      }
    }

    const { hasAll, missing } = checkRequiredColumns(headers);

    sheets.push({
      name: sheetName,
      rowCount: rawData.length,
      hasRequiredColumns: hasAll,
      missingColumns: missing,
    });

    if (!hasAll) {
      errors.push(`Aba "${sheetName}": Colunas obrigatórias faltando: ${missing.join(', ')}`);
      continue;
    }

    // Processa cada linha
    for (let i = 0; i < rawData.length; i++) {
      const rawRow = normalizeRow(rawData[i]) as RawRecord;
      const rowIndex = i + 2; // +2 porque a linha 1 é header e índice começa em 0

      // Extrai valores
      const id = String(rawRow.ID ?? '').trim();
      const colaborador = String(rawRow.Colaborador ?? '').trim();
      const classificacao = String(rawRow.Classificacao ?? '').trim();
      const diferencaRaw = String(rawRow.Diferenca ?? '');

      // Valida campos obrigatórios
      if (!id) {
        warnings.push(`Aba "${sheetName}", linha ${rowIndex}: ID vazio, registro ignorado`);
        continue;
      }

      if (!colaborador) {
        warnings.push(`Aba "${sheetName}", linha ${rowIndex}: Colaborador vazio`);
      }

      // Parse da diferença
      const { deltaMinutes, isMissing, parseError } = parseDiferenca(diferencaRaw);

      if (parseError) {
        warnings.push(
          `Aba "${sheetName}", linha ${rowIndex}: Formato inválido de Diferenca: "${diferencaRaw}"`
        );
      }

      // Parse da data (se existir)
      const dataValue = rawRow.Data;
      const data = parseDate(dataValue);
      const dataString = dataValue ? String(dataValue) : undefined;

      // Verifica se deve ser marcado como ajuste (não contabiliza)
      // Regras: Entrada > 10h, Intervalo > 17h, Retorno > 17h
      const entradaValue = rawRow.Entrada;
      const intervaloValue = rawRow.Intervalo;
      const retornoValue = rawRow.Retorno;
      const isAjuste = isRegistroAjuste(entradaValue, intervaloValue, retornoValue);

      // Cria o registro parseado
      const record: ParsedRecord = {
        id,
        colaborador,
        classificacao,
        diferencaRaw,
        deltaMinutes,
        isMissing,
        parseError,
        isAjuste,
        data: data ?? undefined,
        dataString,
        gestor: rawRow.Gestor ? String(rawRow.Gestor).trim() : undefined,
        dia: rawRow.Dia ? String(rawRow.Dia).trim() : undefined,
        entrada: rawRow.Entrada ? String(rawRow.Entrada).trim() : undefined,
        intervalo: rawRow.Intervalo ? String(rawRow.Intervalo).trim() : undefined,
        retorno: rawRow.Retorno ? String(rawRow.Retorno).trim() : undefined,
        saida: rawRow.Saida ? String(rawRow.Saida).trim() : undefined,
        sourceSheet: sheetName,
        rowIndex,
      };

      records.push(record);
    }
  }

  return {
    success: errors.length === 0,
    sheets,
    records,
    errors,
    warnings,
  };
}

/**
 * Importa todas as abas válidas de um workbook
 */
export function importAllSheets(workbook: XLSX.WorkBook): ImportResult {
  return importSheets(workbook, workbook.SheetNames);
}
