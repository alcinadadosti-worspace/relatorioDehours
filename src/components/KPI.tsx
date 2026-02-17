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
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    gray: 'bg-gray-50 text-gray-600 border-gray-200',
  };

  const iconColorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    gray: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className={`bg-white border rounded-xl p-4 ${colorClasses[color]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold mt-1 text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
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
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Resumo Geral</h2>

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
        <div className="bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Normal</p>
            <p className="text-lg font-semibold text-gray-800">{stats.countNormal}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Hora Extra</p>
            <p className="text-lg font-semibold text-gray-800">{stats.countHoraExtra}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
            <TrendingDown className="w-4 h-4 text-red-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Atraso</p>
            <p className="text-lg font-semibold text-gray-800">{stats.countAtraso}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <FileText className="w-4 h-4 text-gray-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Outros</p>
            <p className="text-lg font-semibold text-gray-800">{stats.countOutros}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
