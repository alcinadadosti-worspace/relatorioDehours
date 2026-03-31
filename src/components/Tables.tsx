import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import type { ColaboradorRecord } from '../lib/types';
import { formatMinutos } from '../lib/types';

type SortKey = 'nome' | 'gestor' | 'minutos';
type SortDir = 'asc' | 'desc';

interface ColaboradoresTableProps {
  records: ColaboradorRecord[];
}

export function ColaboradoresTable({ records }: ColaboradoresTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('minutos');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const sorted = useMemo(() => {
    return [...records].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'nome') cmp = a.nome.localeCompare(b.nome);
      else if (sortKey === 'gestor') cmp = a.gestor.localeCompare(b.gestor);
      else cmp = a.minutos - b.minutos;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [records, sortKey, sortDir]);

  const totalPages = Math.ceil(sorted.length / pageSize);
  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(1);
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronsUpDown className="w-3.5 h-3.5 text-dark-500" />;
    return sortDir === 'asc'
      ? <ChevronUp className="w-3.5 h-3.5 text-primary-400" />
      : <ChevronDown className="w-3.5 h-3.5 text-primary-400" />;
  };

  return (
    <div className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-dark-700 bg-dark-900/50">
              <th className="text-left px-4 py-3 text-dark-400 font-medium w-8">#</th>
              <th className="text-left px-4 py-3">
                <button
                  onClick={() => toggleSort('nome')}
                  className="flex items-center gap-1.5 text-dark-400 hover:text-white font-medium"
                >
                  Nome <SortIcon col="nome" />
                </button>
              </th>
              <th className="text-left px-4 py-3">
                <button
                  onClick={() => toggleSort('gestor')}
                  className="flex items-center gap-1.5 text-dark-400 hover:text-white font-medium"
                >
                  Gestor <SortIcon col="gestor" />
                </button>
              </th>
              <th className="text-right px-4 py-3">
                <button
                  onClick={() => toggleSort('minutos')}
                  className="flex items-center gap-1.5 text-dark-400 hover:text-white font-medium ml-auto"
                >
                  Saldo Total <SortIcon col="minutos" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((r, i) => {
              const globalIndex = (page - 1) * pageSize + i + 1;
              const isNeg = r.minutos < 0;
              const isPos = r.minutos > 0;
              return (
                <tr key={`${r.nome}-${i}`} className="border-b border-dark-700/50 hover:bg-dark-700/30 transition-colors">
                  <td className="px-4 py-3 text-dark-500 text-xs">{globalIndex}</td>
                  <td className="px-4 py-3 text-white font-medium">{r.nome}</td>
                  <td className="px-4 py-3 text-dark-300">{r.gestor}</td>
                  <td className={`px-4 py-3 text-right font-mono font-semibold ${isNeg ? 'text-red-400' : isPos ? 'text-green-400' : 'text-dark-400'}`}>
                    {r.saldoTotal || formatMinutos(r.minutos)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-dark-700 text-sm">
          <span className="text-dark-400">
            {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, sorted.length)} de {sorted.length}
          </span>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                  p === page
                    ? 'bg-primary-600 text-white'
                    : 'text-dark-400 hover:text-white hover:bg-dark-700'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
