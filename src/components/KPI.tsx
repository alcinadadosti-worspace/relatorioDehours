import { Users, TrendingUp, TrendingDown } from 'lucide-react';
import type { GlobalStats } from '../lib/types';
import { formatMinutos } from '../lib/types';

interface KPIProps {
  stats: GlobalStats;
}

export function KPI({ stats }: KPIProps) {
  const pctNegativos =
    stats.totalColaboradores > 0
      ? Math.round((stats.negativosCount / stats.totalColaboradores) * 100)
      : 0;

  const cards = [
    {
      label: 'Colaboradores',
      value: stats.totalColaboradores.toString(),
      sub: `em ${stats.totalGestores} equipes`,
      icon: Users,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Saldo Geral',
      value: formatMinutos(stats.totalMinutos),
      sub: `média ${formatMinutos(stats.mediaMinutos)} por pessoa`,
      icon: stats.totalMinutos >= 0 ? TrendingUp : TrendingDown,
      color: stats.totalMinutos >= 0 ? 'text-green-400' : 'text-red-400',
      bg: stats.totalMinutos >= 0 ? 'bg-green-500/10' : 'bg-red-500/10',
    },
    {
      label: 'Saldo Positivo',
      value: stats.positivosCount.toString(),
      sub: `${Math.round((stats.positivosCount / stats.totalColaboradores) * 100)}% dos colaboradores`,
      icon: TrendingUp,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
    },
    {
      label: 'Saldo Negativo',
      value: stats.negativosCount.toString(),
      sub: `${pctNegativos}% dos colaboradores`,
      icon: TrendingDown,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="bg-dark-800 border border-dark-700 rounded-xl p-5 flex items-start gap-4"
          >
            <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-dark-400">{card.label}</p>
              <p className={`text-2xl font-bold mt-0.5 ${card.color}`}>{card.value}</p>
              <p className="text-xs text-dark-500 mt-1 truncate">{card.sub}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
