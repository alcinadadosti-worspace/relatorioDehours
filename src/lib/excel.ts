import * as XLSX from 'xlsx';
import type { ColaboradorRecord } from './types';

const REQUIRED_COLUMNS = ['Gestor', 'Minutos'];

// Mapa nome normalizado → gestor (baseado em Saldos_por_Gestor_Ajustado.xlsx)
const GESTOR_MAP: Record<string, string> = {
  'alberto guilherme da silva martins': 'Sem Gestor',
  'amanda santos costa': 'Michaell Jean Nunes De Carvalho',
  'ana clara de matos chagas': 'Romulo Jose Santos Lisboa',
  'ana luiza dos santos': 'Erick Café Santos Júnior',
  'ana paula amaral santos ismerim': 'Maria Taciane Pereira Barbosa',
  'ane caroline pereira marter': 'Ana Clara de Matos Chagas',
  'anny karoline andrade santos': 'Mariane Santos Sousa',
  'bruna candido de lima': 'Jonathan Henrique da Conceição Silva',
  'bruna rayane oliveira dos santos': 'Maria Taciane Pereira Barbosa',
  'brunna isabelly silva lima': 'Ana Clara de Matos Chagas',
  'caique dos santos da silva': 'Alberto Luiz Marinho Batista',
  'camilla emanuelle lopes de almeida': 'Jonathan Henrique da Conceição Silva',
  'camille kauane da silva nunes': 'Maria Taciane Pereira Barbosa',
  'carlos eduardo silva de oliveira': 'Carlos Eduardo Silva De Oliveira',
  'claudio bispo dos santos': 'Alberto Luiz Marinho Batista',
  'cristielle pereira lima da silva': 'Maria Taciane Pereira Barbosa',
  'danielle dos santos silva': 'Jonathan Henrique da Conceição Silva',
  'danrley firmino dos santos': 'Alberto Luiz Marinho Batista',
  'deise gislaine silva vitor': 'Maria Taciane Pereira Barbosa',
  'edna lopes da silva': 'Jonathan Henrique da Conceição Silva',
  'eduarda pereira costa silva': 'Kemilly Rafaelly Souza Silva',
  'eliene da silva santos': 'Maria Taciane Pereira Barbosa',
  'emanoelle feitosa vieira santos': 'Joao Antonio Tavares Santos',
  'erick cafe santos junior': 'Romulo Jose Santos Lisboa',
  'fabia batista da silva': 'Joao Antonio Tavares Santos',
  'gessica aparecida dos santos': 'Erick Café Santos Júnior',
  'gessyca nayara rocha santos': 'Joao Antonio Tavares Santos',
  'giselle dos santos roberto': 'Erick Café Santos Júnior',
  'hugo castro lopes': 'Alberto Luiz Marinho Batista',
  'jaine mariana rodrigues mendonca': 'Joao Antonio Tavares Santos',
  'joanna roberta de queiroz viana': 'Ana Clara de Matos Chagas',
  'joao antonio tavares santos': 'Romulo Jose Santos Lisboa',
  'joao ricardo dantas albuquerque': 'Suzana Martins Tavares',
  'joao victor santos da silva': 'Alberto Luiz Marinho Batista',
  'jonathan henrique da conceicao silva': 'Romulo Jose Santos Lisboa',
  'jordelle meygre costa de oliveira': 'Jonathan Henrique da Conceição Silva',
  'josimara ferreira monteiro': 'Ana Clara de Matos Chagas',
  'juliene bezerra': 'Ana Clara de Matos Chagas',
  'kamilla santos da silva': 'Ana Clara de Matos Chagas',
  'karine celestino evangelista dos santos': 'Erick Café Santos Júnior',
  'kauanne iwashita da silva': 'Erick Café Santos Júnior',
  'lais manuelle santos pereira': 'Erick Café Santos Júnior',
  'larissa alexia da silva souza': 'Kemilly Rafaelly Souza Silva',
  'lays da silva vieira': 'Jonathan Henrique da Conceição Silva',
  'leticia seixas santos': 'Erick Café Santos Júnior',
  'leticia soares belo': 'Rafaela Alves Mendes',
  'luan santos de oliveira': 'Jonathan Henrique da Conceição Silva',
  'luciane da silva nascimento': 'Erick Café Santos Júnior',
  'luciene da silva nascimento': 'Erick Café Santos Júnior',
  'luciano torres': 'Alberto Luiz Marinho Batista',
  'ludmylla wolpert melo': 'Alberto Luiz Marinho Batista',
  'luiz fellipe guedes santos silva': 'Alberto Luiz Marinho Batista',
  'marcio alif santos silva': 'Alberto Luiz Marinho Batista',
  'mariane santos sousa': 'Leidiane Souza',
  'marilia alice dos santos silva': 'Jonathan Henrique da Conceição Silva',
  'maria cicilia brito veiga': 'Kemilly Rafaelly Souza Silva',
  'maria jeane da silva santos': 'Ana Clara de Matos Chagas',
  'maria nobre farias de franca': 'Michaell Jean Nunes De Carvalho',
  'maria taciane pereira barbosa': 'Sem Gestor',
  'maria tatiane basto cardoso': 'Maria Taciane Pereira Barbosa',
  'maria tatiane oliveira santos': 'Joao Antonio Tavares Santos',
  'maria victoria souza araujo ferro': 'Jonathan Henrique da Conceição Silva',
  'maryanna francielly trajano da silva': 'Kemilly Rafaelly Souza Silva',
  'natali de souza gonzaga': 'Erick Café Santos Júnior',
  'nathalia vieira lima': 'Erick Café Santos Júnior',
  'paulo cesar da silva santos junior': 'Alberto Luiz Marinho Batista',
  'pedro lucas rocha da fonseca': 'Alberto Luiz Marinho Batista',
  'ravy thiago vieira da silva': 'Suzana Martins Tavares',
  'roberia gilo da silva': 'Alberto Luiz Marinho Batista',
  'rodrigo augusto teixeira dos santos': 'Ana Clara de Matos Chagas',
  'romulo jose santos lisboa': 'Sem Gestor',
  'rosilene martins da silva': 'Alberto Luiz Marinho Batista',
  'sabrina domingos santos': 'Erick Café Santos Júnior',
  'samyra anchieta bispo': 'Maria Taciane Pereira Barbosa',
  'sandra da conceicao freitas': 'Ana Clara de Matos Chagas',
  'thalys gomes dos santos': 'Alberto Luiz Marinho Batista',
  'thamires emanuelle da silva': 'Ana Clara de Matos Chagas',
  'thamirys silvestrini morales': 'Maria Taciane Pereira Barbosa',
  'thayane mayara dos santos': 'Suzana Martins Tavares',
  'tomas azevedo santos': 'Michaell Jean Nunes De Carvalho',
  'valesca meirelle bezerra vitoria': 'Kemilly Rafaelly Souza Silva',
  'yasmim da rocha bezerra barbosa': 'Jonathan Henrique da Conceição Silva',
  'yasmin abilia ferro da silva': 'Kemilly Rafaelly Souza Silva',
};

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
  'samyra anchieta bispo',
  'cristielle pereira lima da silva',
  'maria tatiane basto cardoso',
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
        const gestor = GESTOR_MAP[normalizeForExclusion(currentName)] ?? 'Sem Gestor';
        records.push({ nome: currentName, gestor, saldoTotal, minutos });
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
