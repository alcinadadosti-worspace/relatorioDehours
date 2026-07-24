import { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

const DIVERGENCIA_SOLIDES = ['Clara Matos', 'Jonathan Henrique'];

const DIVERGENCIA_AJUSTE_GESTOR = [
  'Emanoelle Vieira',
  'Danrley',
  'Ludmylla Wolpert',
  'Márcio Alif',
  'Paulo Cesar',
  'Rosilene Martins',
  'Maria Nobre',
  'Erick Café',
  'Bruna Rayane',
  'Caroline Leite',
  'Deise Gislane',
  'Eliene',
  'Joanna Queiroz',
  'Fernanda Vieira',
  'Rayanne Ferreira',
];

function NameChips({ names }: { names: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {names.map((nome) => (
        <span
          key={nome}
          className="px-2 py-0.5 text-xs rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20"
        >
          {nome}
        </span>
      ))}
    </div>
  );
}

export function Observacoes() {
  const [open, setOpen] = useState(true);

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
          <div>
            <p className="text-sm text-dark-300">
              Alguns colaboradores vão apresentar divergência em seus saldos de horas devido a
              problema na Solides:
            </p>
            <NameChips names={DIVERGENCIA_SOLIDES} />
          </div>

          <div>
            <p className="text-sm text-dark-300">
              Já os colaboradores abaixo irão apresentar divergência por conta de falta de ajustes
              de seus gestores:
            </p>
            <NameChips names={DIVERGENCIA_AJUSTE_GESTOR} />
          </div>
        </div>
      )}
    </div>
  );
}
