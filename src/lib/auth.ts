// Mapa de códigos → nomes de gestores
// '7776' é a chave master (acesso total)

export const MASTER_CODE = '7776';

export const AUTH_MAP: Record<string, string[]> = {
  '8080': ['Alberto Luiz Marinho Batista'],
  '1010': [
    'Leidiane Souza',
    'Erick Café Santos Júnior',
    'Romulo Jose Santos Lisboa',
    'Joao Antonio Tavares Santos',       // corrigido: Tavarares → Tavares
    'Ana Clara de Matos Chagas',
    'Jonathan Henrique da Conceição Silva',
    'Kemilly Rafaelly Souza Silva',
    'Maria Taciane Pereira Barbosa',
  ],
  '1212': ['Michaell Jean Nunes De Carvalho'],
  '1515': ['Suzana Martins Tavares'],
  '3232': ['Rafaela Alves Mendes'],
  '7777': ['Carlos Eduardo Silva De Oliveira'],
};

// Mapa de nome do gestor → número do mês de aniversário (1–12)
// Gestores sem mês cadastrado pulam a etapa 3
export const BIRTH_MONTH: Record<string, number> = {
  'Alberto Luiz Marinho Batista':         2,  // fevereiro
  'Leidiane Souza':                       5,  // maio
  'Erick Café Santos Júnior':             5,  // maio
  'Romulo Jose Santos Lisboa':            7,  // julho
  'Joao Antonio Tavares Santos':          7,  // julho
  'Ana Clara de Matos Chagas':           12,  // dezembro
  'Jonathan Henrique da Conceição Silva': 8,  // agosto
  'Kemilly Rafaelly Souza Silva':         5,  // maio
  'Maria Taciane Pereira Barbosa':        5,  // maio
  'Michaell Jean Nunes De Carvalho':      2,  // fevereiro
  'Suzana Martins Tavares':               4,  // abril
  'Rafaela Alves Mendes':                 5,  // maio
  'Carlos Eduardo Silva De Oliveira':     1,  // janeiro
};

export const MONTH_NAMES = [
  '', // índice 0 não usado
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export type AuthSession =
  | { isMaster: true; gestorName: null }
  | { isMaster: false; gestorName: string };

export function validateCode(code: string): 'master' | string[] | null {
  if (code.trim() === MASTER_CODE) return 'master';
  const names = AUTH_MAP[code.trim()];
  return names ?? null;
}

export function validateBirthMonth(gestorName: string, monthNumber: number): boolean {
  const expected = BIRTH_MONTH[gestorName];
  if (expected === undefined) return true; // sem mês cadastrado → passa direto
  return expected === monthNumber;
}

export function requiresBirthMonth(gestorName: string): boolean {
  return BIRTH_MONTH[gestorName] !== undefined;
}

// Normaliza string para comparação (sem acento, lowercase)
function normalize(s: string): string {
  return s.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

// Verifica se o gestor do registro bate com o gestor autenticado
export function gestorMatches(recordGestor: string, authGestor: string): boolean {
  return normalize(recordGestor) === normalize(authGestor);
}
