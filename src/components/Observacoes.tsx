import { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import type { AuthSession } from '../lib/auth';
import { gestorMatches } from '../lib/auth';

interface FlaggedColab {
  nome: string;
  gestor: string;
}

const EM_MANUTENCAO: FlaggedColab[] = [];

const DIVERGENCIA_AJUSTE_GESTOR: FlaggedColab[] = [
  { nome: 'Danrley', gestor: 'Alberto Luiz Marinho Batista' },
  { nome: 'Ludmylla Wolpert', gestor: 'Alberto Luiz Marinho Batista' },
  { nome: 'Márcio Alif', gestor: 'Alberto Luiz Marinho Batista' },
  { nome: 'Paulo Cesar', gestor: 'Alberto Luiz Marinho Batista' },
  { nome: 'Rosilene Martins', gestor: 'Alberto Luiz Marinho Batista' },
];

interface AvisoGestor {
  gestor: string;
  mensagem: string;
}

const AVISOS_GESTOR: AvisoGestor[] = [
  { gestor: 'Kemilly Rafaelly Souza Silva', mensagem: 'precisa fazer os ajustes do time de Taciane' },
  // Times reprocessados com o export de 01/07 a 02/08 — os demais seguem em 26/07
  { gestor: 'Carlos Eduardo Silva De Oliveira', mensagem: 'está com os pontos da equipe ajustados até o dia 02/08' },
  { gestor: 'Erick Café Santos Júnior', mensagem: 'está com os pontos da equipe ajustados até o dia 02/08' },
  { gestor: 'Joao Antonio Tavares Santos', mensagem: 'está com os pontos da equipe ajustados até o dia 02/08' },
  {
    gestor: 'Ana Clara de Matos Chagas',
    mensagem: 'está com os pontos da equipe ajustados até o dia 02/08, exceto Brunna Isabelly, que segue em 26/07',
  },
  {
    gestor: 'Jonathan Henrique da Conceição Silva',
    mensagem: 'está com o próprio ponto ajustado até o dia 02/08; a equipe segue ajustada até 26/07',
  },
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

  const manutencao = visibleFor(EM_MANUTENCAO, auth);
  const ajuste = visibleFor(DIVERGENCIA_AJUSTE_GESTOR, auth);
  const avisos = auth.isMaster
    ? AVISOS_GESTOR
    : AVISOS_GESTOR.filter((a) => gestorMatches(a.gestor, auth.gestorName));

  // Gestor sem colaboradores afetados não vê a seção
  if (manutencao.length === 0 && ajuste.length === 0 && avisos.length === 0) return null;

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
          {manutencao.length > 0 && (
            <div>
              <p className="text-sm text-dark-300">
                {manutencao.length === 1
                  ? 'O saldo do colaborador abaixo está'
                  : 'Os saldos dos colaboradores abaixo estão'}{' '}
                em manutenção:
              </p>
              <NameChips colabs={manutencao} showGestor={auth.isMaster} />
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

          {avisos.map((a) => (
            <div key={a.gestor}>
              <p className="text-sm text-dark-300">
                {auth.isMaster ? `${a.gestor} ${a.mensagem}.` : `Você ${a.mensagem}.`}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
