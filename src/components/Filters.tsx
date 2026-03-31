import { Search, X } from 'lucide-react';
import type { FilterState, GestorSummary } from '../lib/types';

interface FiltersProps {
  filters: FilterState;
  gestores: GestorSummary[];
  isMaster: boolean;
  onFilterChange: (f: Partial<FilterState>) => void;
}

export function Filters({ filters, gestores, isMaster, onFilterChange }: FiltersProps) {
  const hasFilters = filters.searchNome || (isMaster && filters.searchGestor);

  return (
    <div className="bg-dark-800 border border-dark-700 rounded-xl p-4 mb-6 flex flex-wrap gap-3 items-center">
      {/* Busca por nome */}
      <div className="relative flex-1 min-w-48">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar colaborador..."
          value={filters.searchNome}
          onChange={(e) => onFilterChange({ searchNome: e.target.value })}
          className="w-full pl-9 pr-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-sm text-white placeholder-dark-400 focus:outline-none focus:border-primary-500"
        />
      </div>

      {/* Filtro por gestor — apenas para master */}
      {isMaster && (
        <select
          value={filters.searchGestor}
          onChange={(e) => onFilterChange({ searchGestor: e.target.value })}
          className="flex-1 min-w-48 px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-sm text-white focus:outline-none focus:border-primary-500"
        >
          <option value="">Todos os gestores</option>
          {gestores.map((g) => (
            <option key={g.gestor} value={g.gestor}>
              {g.gestor} ({g.colaboradores.length})
            </option>
          ))}
        </select>
      )}

      {/* Limpar filtros */}
      {hasFilters && (
        <button
          onClick={() => onFilterChange({ searchNome: '', searchGestor: '' })}
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-dark-300 hover:text-white bg-dark-700 hover:bg-dark-600 border border-dark-600 rounded-lg transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          Limpar
        </button>
      )}
    </div>
  );
}
