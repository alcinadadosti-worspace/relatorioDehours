import {
  Users,
  FileText,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import type { GlobalStats } from '../lib/types';
import { formatMinutesToHoursMinutes } from '../lib/types';

interface KPIProps {
  stats: GlobalStats;
}

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'gray';
}

function KPICard({ title, value, subtitle, icon, color = 'blue' }: KPICardProps) {
  const colorClasses = {
    blue: 'border-blue-500/30',
    green: 'border-green-500/30',
    red: 'border-red-500/30',
    yellow: 'border-yellow-500/30',
    gray: 'border-dark-600',
  };

  const iconColorClasses = {
    blue: 'bg-blue-500/20 text-blue-400',
    green: 'bg-green-500/20 text-green-400',
    red: 'bg-red-500/20 text-red-400',
    yellow: 'bg-yellow-500/20 text-yellow-400',
    gray: 'bg-dark-600 text-dark-300',
  };

  const valueColorClasses = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    red: 'text-red-400',
    yellow: 'text-yellow-400',
    gray: 'text-white',
  };

  return (
    <div className={`bg-dark-800 border rounded-xl p-4 ${colorClasses[color]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-dark-400">{title}</p>
          <p className={`text-2xl font-bold mt-1 ${valueColorClasses[color]}`}>{value}</p>
          {subtitle && <p className="text-xs text-dark-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconColorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export function KPI({ stats }: KPIProps) {
  const totalFormatted = formatMinutesToHoursMinutes(stats.totalBrutoMinutes);

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-white mb-4">Resumo Geral</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard
          title="Colaboradores"
          value={stats.totalCollaborators}
          icon={<Users className="w-5 h-5" />}
          color="blue"
        />

        <KPICard
          title="Registros"
          value={stats.totalRecords}
          icon={<FileText className="w-5 h-5" />}
          color="gray"
        />

        <KPICard
          title="Total Geral"
          value={totalFormatted}
          subtitle="Soma das diferenças"
          icon={
            stats.totalBrutoMinutes >= 0 ? (
              <TrendingUp className="w-5 h-5" />
            ) : (
              <TrendingDown className="w-5 h-5" />
            )
          }
          color={stats.totalBrutoMinutes >= 0 ? 'green' : 'red'}
        />

        <KPICard
          title="Ajustes"
          value={stats.totalAjuste}
          subtitle="Não contabilizados"
          icon={<Clock className="w-5 h-5" />}
          color={stats.totalAjuste > 0 ? 'yellow' : 'gray'}
        />

        <KPICard
          title="Sem Dados"
          value={stats.totalSemDados}
          subtitle="Registros sem diferença"
          icon={<AlertTriangle className="w-5 h-5" />}
          color="yellow"
        />

        <KPICard
          title="Erros de Parse"
          value={stats.totalParseErrors}
          subtitle="Formato inválido"
          icon={<XCircle className="w-5 h-5" />}
          color={stats.totalParseErrors > 0 ? 'red' : 'gray'}
        />
      </div>

      {/* Classificações */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-dark-800 border border-dark-700 rounded-lg p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle className="w-4 h-4 text-green-400" />
          </div>
          <div>
            <p className="text-xs text-dark-400">Normal</p>
            <p className="text-lg font-semibold text-white">{stats.countNormal}</p>
          </div>
        </div>

        <div className="bg-dark-800 border border-dark-700 rounded-lg p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-dark-400">Hora Extra</p>
            <p className="text-lg font-semibold text-white">{stats.countHoraExtra}</p>
          </div>
        </div>

        <div className="bg-dark-800 border border-dark-700 rounded-lg p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
            <TrendingDown className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <p className="text-xs text-dark-400">Atraso</p>
            <p className="text-lg font-semibold text-white">{stats.countAtraso}</p>
          </div>
        </div>

        <div className="bg-dark-800 border border-dark-700 rounded-lg p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-dark-600 flex items-center justify-center">
            <FileText className="w-4 h-4 text-dark-300" />
          </div>
          <div>
            <p className="text-xs text-dark-400">Outros</p>
            <p className="text-lg font-semibold text-white">{stats.countOutros}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
