import { Search, Filter } from 'lucide-react';
import type { FilterState, GlobalStats } from '../lib/types';

interface FiltersProps {
  filters: FilterState;
  stats: GlobalStats | null;
  onFilterChange: (filters: Partial<FilterState>) => void;
}

export function Filters({
  filters,
  stats,
  onFilterChange,
}: FiltersProps) {
  const classificacoes = stats ? Object.keys(stats.byClassificacao) : [];

  return (
    <div className="bg-dark-800 border border-dark-700 rounded-xl p-4 mb-6">
      <div className="flex flex-wrap gap-4 items-end">
        {/* Busca por Nome */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-dark-200 mb-1.5">
            Buscar por Nome
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input
              type="text"
              value={filters.searchName}
              onChange={(e) => onFilterChange({ searchName: e.target.value })}
              placeholder="Digite o nome..."
              className="w-full pl-10 pr-4 py-2 border border-dark-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-dark-700 text-white"
            />
          </div>
        </div>

        {/* Busca por ID */}
        <div className="w-32">
          <label className="block text-sm font-medium text-dark-200 mb-1.5">
            Buscar por ID
          </label>
          <input
            type="text"
            value={filters.searchId}
            onChange={(e) => onFilterChange({ searchId: e.target.value })}
            placeholder="ID"
            className="w-full px-3 py-2 border border-dark-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-dark-700 text-white"
          />
        </div>

        {/* Filtro por Classificação */}
        <div className="w-48">
          <label className="block text-sm font-medium text-dark-200 mb-1.5 flex items-center gap-1">
            <Filter className="w-4 h-4" />
            Classificação
          </label>
          <select
            value={filters.classificacao}
            onChange={(e) => onFilterChange({ classificacao: e.target.value })}
            className="w-full px-3 py-2 border border-dark-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-dark-700 text-white"
          >
            <option value="todas">Todas</option>
            {classificacoes.map((c) => (
              <option key={c} value={c}>
                {c} ({stats?.byClassificacao[c]})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Limpar filtros */}
      {(filters.searchName || filters.searchId || filters.classificacao !== 'todas') && (
        <div className="mt-3 pt-3 border-t border-dark-700">
          <button
            onClick={() =>
              onFilterChange({
                searchName: '',
                searchId: '',
                classificacao: 'todas',
                selectedCollaboratorId: null,
              })
            }
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Limpar filtros
          </button>
        </div>
      )}
    </div>
  );
}
