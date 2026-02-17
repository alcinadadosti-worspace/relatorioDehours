import React from 'react';
import { ArrowLeft, User, Clock, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import type { CollaboratorSummary } from '../lib/types';
import { formatMinutesToHoursMinutes } from '../lib/types';
import { TimelineChart, CollaboratorClassificacaoChart } from './Charts';
import { RecordsTable } from './Tables';

interface CollaboratorDetailProps {
  summary: CollaboratorSummary;
  onBack: () => void;
}

export function CollaboratorDetail({ summary, onBack }: CollaboratorDetailProps) {
  const adjustments = summary.totalExtraBonusMinutes - summary.totalAtrasoPenaltyMinutes;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para lista
        </button>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-primary-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{summary.colaborador}</h1>
                <p className="text-gray-500">ID: {summary.id}</p>
                {summary.alternativeNames.length > 0 && (
                  <p className="text-sm text-yellow-600 flex items-center gap-1 mt-1">
                    <AlertTriangle className="w-4 h-4" />
                    Nomes alternativos: {summary.alternativeNames.join(', ')}
                  </p>
                )}
              </div>
            </div>

            <div className="text-right">
              <p className="text-sm text-gray-500">Total Ajustado</p>
              <p
                className={`text-3xl font-bold ${
                  summary.adjustedTotalMinutes >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {formatMinutesToHoursMinutes(summary.adjustedTotalMinutes)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs do colaborador */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-xs">Total Bruto</span>
          </div>
          <p
            className={`text-xl font-bold ${
              summary.totalDeltaMinutes >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {formatMinutesToHoursMinutes(summary.totalDeltaMinutes)}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs">Bônus H.Extra</span>
          </div>
          <p className="text-xl font-bold text-blue-600">
            +{formatMinutesToHoursMinutes(summary.totalExtraBonusMinutes)}
          </p>
          <p className="text-xs text-gray-400">{summary.countHoraExtra} registros</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <TrendingDown className="w-4 h-4" />
            <span className="text-xs">Penalidade Atraso</span>
          </div>
          <p className="text-xl font-bold text-orange-600">
            -{formatMinutesToHoursMinutes(summary.totalAtrasoPenaltyMinutes)}
          </p>
          <p className="text-xs text-gray-400">{summary.countAtraso} registros</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <span className="text-xs">Ajustes Total</span>
          </div>
          <p
            className={`text-xl font-bold ${
              adjustments >= 0 ? 'text-blue-600' : 'text-orange-600'
            }`}
          >
            {formatMinutesToHoursMinutes(adjustments)}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1">Registros</div>
          <p className="text-xl font-bold text-gray-800">{summary.countDias}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1">Sem Dados</div>
          <p
            className={`text-xl font-bold ${
              summary.countSemDados > 0 ? 'text-yellow-600' : 'text-gray-400'
            }`}
          >
            {summary.countSemDados}
          </p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Evolução por Data</h3>
          <TimelineChart records={summary.records} title="" />
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Distribuição por Classificação
          </h3>
          <CollaboratorClassificacaoChart summary={summary} />

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm text-gray-600">Normal: {summary.countNormal}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-sm text-gray-600">Hora Extra: {summary.countHoraExtra}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-sm text-gray-600">Atraso: {summary.countAtraso}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-400"></div>
              <span className="text-sm text-gray-600">Outros: {summary.countOutros}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de registros */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Registros Detalhados</h3>
        <RecordsTable records={summary.records} />
      </div>
    </div>
  );
}
