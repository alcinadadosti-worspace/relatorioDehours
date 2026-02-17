import { ArrowLeft, User, Clock, AlertTriangle } from 'lucide-react';
import type { CollaboratorSummary } from '../lib/types';
import { formatMinutesToHoursMinutes } from '../lib/types';
import { TimelineChart, CollaboratorClassificacaoChart } from './Charts';
import { RecordsTable } from './Tables';

interface CollaboratorDetailProps {
  summary: CollaboratorSummary;
  onBack: () => void;
}

export function CollaboratorDetail({ summary, onBack }: CollaboratorDetailProps) {
  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-dark-300 hover:text-primary-400 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para lista
        </button>

        <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{summary.colaborador}</h1>
                <p className="text-dark-400">ID: {summary.id}</p>
                {summary.alternativeNames.length > 0 && (
                  <p className="text-sm text-yellow-600 flex items-center gap-1 mt-1">
                    <AlertTriangle className="w-4 h-4" />
                    Nomes alternativos: {summary.alternativeNames.join(', ')}
                  </p>
                )}
              </div>
            </div>

            <div className="text-right">
              <p className="text-sm text-dark-400">Total</p>
              <p
                className={`text-3xl font-bold ${
                  summary.totalDeltaMinutes >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {formatMinutesToHoursMinutes(summary.totalDeltaMinutes)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs do colaborador */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-dark-800 border border-dark-700 rounded-xl p-4">
          <div className="flex items-center gap-2 text-dark-400 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-xs">Total</span>
          </div>
          <p
            className={`text-xl font-bold ${
              summary.totalDeltaMinutes >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {formatMinutesToHoursMinutes(summary.totalDeltaMinutes)}
          </p>
        </div>

        <div className="bg-dark-800 border border-dark-700 rounded-xl p-4">
          <div className="text-xs text-dark-400 mb-1">Registros</div>
          <p className="text-xl font-bold text-white">{summary.countDias}</p>
        </div>

        <div className="bg-dark-800 border border-dark-700 rounded-xl p-4">
          <div className="text-xs text-dark-400 mb-1">Ajustes</div>
          <p
            className={`text-xl font-bold ${
              summary.countAjuste > 0 ? 'text-orange-600' : 'text-dark-500'
            }`}
          >
            {summary.countAjuste}
          </p>
        </div>

        <div className="bg-dark-800 border border-dark-700 rounded-xl p-4">
          <div className="text-xs text-dark-400 mb-1">Sem Dados</div>
          <p
            className={`text-xl font-bold ${
              summary.countSemDados > 0 ? 'text-yellow-600' : 'text-dark-500'
            }`}
          >
            {summary.countSemDados}
          </p>
        </div>

        <div className="bg-dark-800 border border-dark-700 rounded-xl p-4">
          <div className="text-xs text-dark-400 mb-1">Hora Extra</div>
          <p className="text-xl font-bold text-blue-600">{summary.countHoraExtra}</p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-dark-800 border border-dark-700 rounded-xl p-4">
          <h3 className="text-lg font-semibold text-white mb-4">Evolução por Data</h3>
          <TimelineChart records={summary.records} title="" />
        </div>

        <div className="bg-dark-800 border border-dark-700 rounded-xl p-4">
          <h3 className="text-lg font-semibold text-white mb-4">
            Distribuição por Classificação
          </h3>
          <CollaboratorClassificacaoChart summary={summary} />

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm text-dark-300">Normal: {summary.countNormal}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-sm text-dark-300">Hora Extra: {summary.countHoraExtra}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-sm text-dark-300">Atraso: {summary.countAtraso}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-dark-500"></div>
              <span className="text-sm text-dark-300">Outros: {summary.countOutros}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de registros */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Registros Detalhados</h3>
        <RecordsTable records={summary.records} />
      </div>
    </div>
  );
}
