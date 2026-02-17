import { Search, Filter, Settings2 } from 'lucide-react';
import type { FilterState, AggregationConfig, GlobalStats } from '../lib/types';

interface FiltersProps {
  filters: FilterState;
  config: AggregationConfig;
  stats: GlobalStats | null;
  onFilterChange: (filters: Partial<FilterState>) => void;
  onConfigChange: (config: Partial<AggregationConfig>) => void;
}

export function Filters({
  filters,
  config,
  stats,
  onFilterChange,
  onConfigChange,
}: FiltersProps) {
  const classificacoes = stats ? Object.keys(stats.byClassificacao) : [];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
      <div className="flex flex-wrap gap-4 items-end">
        {/* Busca por Nome */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Buscar por Nome
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={filters.searchName}
              onChange={(e) => onFilterChange({ searchName: e.target.value })}
              placeholder="Digite o nome..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>
        </div>

        {/* Busca por ID */}
        <div className="w-32">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Buscar por ID
          </label>
          <input
            type="text"
            value={filters.searchId}
            onChange={(e) => onFilterChange({ searchId: e.target.value })}
            placeholder="ID"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          />
        </div>

        {/* Filtro por Classificação */}
        <div className="w-48">
          <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
            <Filter className="w-4 h-4" />
            Classificação
          </label>
          <select
            value={filters.classificacao}
            onChange={(e) => onFilterChange({ classificacao: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white"
          >
            <option value="todas">Todas</option>
            {classificacoes.map((c) => (
              <option key={c} value={c}>
                {c} ({stats?.byClassificacao[c]})
              </option>
            ))}
          </select>
        </div>

        {/* Separador */}
        <div className="hidden lg:block w-px h-10 bg-gray-300" />

        {/* Configurações de Bônus/Penalidade */}
        <div className="flex items-center gap-3">
          <Settings2 className="w-4 h-4 text-gray-500" />

          <div className="w-32">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Bônus H.Extra (h)
            </label>
            <input
              type="number"
              value={config.extraBonusHours}
              onChange={(e) =>
                onConfigChange({ extraBonusHours: parseFloat(e.target.value) || 0 })
              }
              min="0"
              step="0.5"
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>

          <div className="w-32">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Penalidade Atraso (h)
            </label>
            <input
              type="number"
              value={config.atrasoPenaltyHours}
              onChange={(e) =>
                onConfigChange({ atrasoPenaltyHours: parseFloat(e.target.value) || 0 })
              }
              min="0"
              step="0.5"
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Limpar filtros */}
      {(filters.searchName || filters.searchId || filters.classificacao !== 'todas') && (
        <div className="mt-3 pt-3 border-t border-gray-200">
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
