import { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import type { AuthSession } from '../lib/auth';
import { gestorMatches } from '../lib/auth';

interface FlaggedColab {
  nome: string;
  gestor: string;
}

const DIVERGENCIA_SOLIDES: FlaggedColab[] = [
  { nome: 'Clara Matos', gestor: 'Romulo Jose Santos Lisboa' },
  { nome: 'Jonathan Henrique', gestor: 'Romulo Jose Santos Lisboa' },
];

const DIVERGENCIA_AJUSTE_GESTOR: FlaggedColab[] = [
  { nome: 'Emanoelle Vieira', gestor: 'Joao Antonio Tavares Santos' },
  { nome: 'Danrley', gestor: 'Alberto Luiz Marinho Batista' },
  { nome: 'Ludmylla Wolpert', gestor: 'Alberto Luiz Marinho Batista' },
  { nome: 'Márcio Alif', gestor: 'Alberto Luiz Marinho Batista' },
  { nome: 'Paulo Cesar', gestor: 'Alberto Luiz Marinho Batista' },
  { nome: 'Rosilene Martins', gestor: 'Alberto Luiz Marinho Batista' },
  { nome: 'Maria Nobre', gestor: 'Tomás Azevedo Santos' },
  { nome: 'Erick Café', gestor: 'Romulo Jose Santos Lisboa' },
  { nome: 'Bruna Rayane', gestor: 'Maria Taciane Pereira Barbosa' },
  { nome: 'Caroline Leite', gestor: 'Kemilly Rafaelly Souza Silva' },
  { nome: 'Deise Gislane', gestor: 'Maria Taciane Pereira Barbosa' },
  { nome: 'Eliene', gestor: 'Maria Taciane Pereira Barbosa' },
  { nome: 'Joanna Queiroz', gestor: 'Maria Taciane Pereira Barbosa' },
  { nome: 'Fernanda Vieira', gestor: 'Maria Taciane Pereira Barbosa' },
  { nome: 'Rayanne Ferreira', gestor: 'Kemilly Rafaelly Souza Silva' },
];

function visibleFor(list: FlaggedColab[], auth: AuthSession): FlaggedColab[] {
  if (auth.isMaster) return list;
  return list.filter((c) => gestorMatches(c.gestor, auth.gestorName));
}

function NameChips({ colabs, showGestor }: { colabs: FlaggedColab[]; showGestor: boolean }) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {colabs.map((c) => (
        <span
          key={c.nome}
          className="px-2 py-0.5 text-xs rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20"
        >
          {c.nome}
          {showGestor && <span className="text-amber-500/60"> · {c.gestor}</span>}
        </span>
      ))}
    </div>
  );
}

interface ObservacoesProps {
  auth: AuthSession;
}

export function Observacoes({ auth }: ObservacoesProps) {
  const [open, setOpen] = useState(true);

  const solides = visibleFor(DIVERGENCIA_SOLIDES, auth);
  const ajuste = visibleFor(DIVERGENCIA_AJUSTE_GESTOR, auth);

  // Gestor sem colaboradores afetados não vê a seção
  if (solides.length === 0 && ajuste.length === 0) return null;

  return (
    <div className="bg-amber-500/5 border border-amber-500/30 rounded-xl mb-6 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-amber-500/10 transition-colors"
      >
        <span className="flex items-center gap-2 text-amber-400 font-semibold">
          <AlertTriangle className="w-5 h-5" />
          Observações
        </span>
        {open ? (
          <ChevronUp className="w-5 h-5 text-amber-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-amber-400" />
        )}
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4">
          {solides.length > 0 && (
            <div>
              <p className="text-sm text-dark-300">
                {solides.length === 1 ? 'O colaborador abaixo vai' : 'Os colaboradores abaixo vão'}{' '}
                apresentar divergência em seus saldos de horas devido a problema na Solides:
              </p>
              <NameChips colabs={solides} showGestor={auth.isMaster} />
            </div>
          )}

          {ajuste.length > 0 && (
            <div>
              <p className="text-sm text-dark-300">
                {ajuste.length === 1 ? 'O colaborador abaixo irá' : 'Os colaboradores abaixo irão'}{' '}
                apresentar divergência por conta de falta de ajustes{' '}
                {auth.isMaster ? 'de seus gestores' : 'do gestor'}:
              </p>
              <NameChips colabs={ajuste} showGestor={auth.isMaster} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
