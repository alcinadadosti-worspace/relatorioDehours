// Mapa de códigos → nomes de gestores
// '7776' é a chave master (acesso total)

export const MASTER_CODE = '7776';

export const AUTH_MAP: Record<string, string[]> = {
  '8080': ['Alberto Luiz Marinho Batista'],
  '1010': [
    'Leidiane Souza',
    'Erick Café Santos Júnior',
    'Romulo Jose Santos Lisboa',
    'Joao Antonio Tavarares Santos',
    'Ana Clara de Matos Chagas',
    'Jonathan Henrique da Conceição Silva',
    'Kemilly Rafaelly Souza Silva',
    'Maria Taciane Pereira Barbosa',
  ],
  '1212': ['Michaell Jean Nunes De Carvalho'],
  '1515': ['Suzana Martins Tavares'],
  '3232': ['Rafaela Alves Mendes'],
};

export type AuthSession =
  | { isMaster: true; gestorName: null }
  | { isMaster: false; gestorName: string };

export function validateCode(code: string): 'master' | string[] | null {
  if (code.trim() === MASTER_CODE) return 'master';
  const names = AUTH_MAP[code.trim()];
  return names ?? null;
}

// Normaliza string para comparação (sem acento, lowercase)
function normalize(s: string): string {
  return s.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

// Verifica se o gestor do registro bate com o gestor autenticado
export function gestorMatches(recordGestor: string, authGestor: string): boolean {
  return normalize(recordGestor) === normalize(authGestor);
}
