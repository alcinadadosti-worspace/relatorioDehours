import { useState, useMemo } from 'react';
import { ArrowLeft, User, Clock, AlertTriangle, Calendar } from 'lucide-react';
import type { CollaboratorSummary } from '../lib/types';
import { formatMinutesToHoursMinutes } from '../lib/types';
import { TimelineChart, CollaboratorClassificacaoChart } from './Charts';
import { RecordsTable } from './Tables';

interface CollaboratorDetailProps {
  summary: CollaboratorSummary;
  onBack: () => void;
}

export function CollaboratorDetail({ summary, onBack }: CollaboratorDetailProps) {
  const [dataInicio, setDataInicio] = useState<string>('');
  const [dataFim, setDataFim] = useState<string>('');

  // Filtra registros por data
  const filteredRecords = useMemo(() => {
    if (!dataInicio && !dataFim) {
      return summary.records;
    }

    const inicio = dataInicio ? new Date(dataInicio + 'T00:00:00') : null;
    const fim = dataFim ? new Date(dataFim + 'T23:59:59') : null;

    return summary.records.filter((r) => {
      if (!r.data) return true;
      if (inicio && r.data < inicio) return false;
      if (fim && r.data > fim) return false;
      return true;
    });
  }, [summary.records, dataInicio, dataFim]);

  // Recalcula totais com registros filtrados
  const filteredStats = useMemo(() => {
    let totalDeltaMinutes = 0;
    let countDias = 0;
    let countSemDados = 0;
    let countAjuste = 0;
    let countHoraExtra = 0;
    let countAtraso = 0;
    let countNormal = 0;
    let countOutros = 0;

    for (const record of filteredRecords) {
      if (record.isAjuste) {
        countAjuste++;
        continue;
      }
      if (Math.abs(record.deltaMinutes) <= 10) {
        continue;
      }
      totalDeltaMinutes += record.deltaMinutes;
      if (record.isMissing) {
        countSemDados++;
      } else {
        countDias++;
      }

      // Classificação
      const c = record.classificacao.toLowerCase().trim();
      if (c === 'hora extra' || c === 'horaextra') {
        countHoraExtra++;
      } else if (c === 'atraso') {
        countAtraso++;
      } else if (c === 'normal') {
        countNormal++;
      } else {
        countOutros++;
      }
    }

    return {
      totalDeltaMinutes,
      countDias,
      countSemDados,
      countAjuste,
      countHoraExtra,
      countAtraso,
      countNormal,
      countOutros,
    };
  }, [filteredRecords]);

  // Cria um summary filtrado para os gráficos
  const filteredSummary: CollaboratorSummary = useMemo(() => ({
    ...summary,
    records: filteredRecords,
    totalDeltaMinutes: filteredStats.totalDeltaMinutes,
    adjustedTotalMinutes: filteredStats.totalDeltaMinutes,
    countDias: filteredStats.countDias,
    countSemDados: filteredStats.countSemDados,
    countAjuste: filteredStats.countAjuste,
    countHoraExtra: filteredStats.countHoraExtra,
    countAtraso: filteredStats.countAtraso,
    countNormal: filteredStats.countNormal,
    countOutros: filteredStats.countOutros,
  }), [summary, filteredRecords, filteredStats]);

  const hasDateFilter = dataInicio || dataFim;

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
              <p className="text-sm text-dark-400">Total {hasDateFilter ? '(filtrado)' : ''}</p>
              <p
                className={`text-3xl font-bold ${
                  filteredStats.totalDeltaMinutes >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {formatMinutesToHoursMinutes(filteredStats.totalDeltaMinutes)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtro de Data */}
      <div className="bg-dark-800 border border-dark-700 rounded-xl p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex items-center gap-2 text-dark-300">
            <Calendar className="w-4 h-4" />
            <span className="text-sm font-medium">Filtrar por período:</span>
          </div>

          <div className="w-40">
            <label className="block text-xs font-medium text-dark-400 mb-1">
              Data Início
            </label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-full px-3 py-2 border border-dark-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-dark-700 text-white text-sm"
            />
          </div>

          <div className="w-40">
            <label className="block text-xs font-medium text-dark-400 mb-1">
              Data Fim
            </label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="w-full px-3 py-2 border border-dark-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-dark-700 text-white text-sm"
            />
          </div>

          {hasDateFilter && (
            <button
              onClick={() => {
                setDataInicio('');
                setDataFim('');
              }}
              className="text-sm text-primary-400 hover:text-primary-300 font-medium"
            >
              Limpar datas
            </button>
          )}

          {hasDateFilter && (
            <span className="text-sm text-dark-400">
              ({filteredRecords.length} de {summary.records.length} registros)
            </span>
          )}
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
              filteredStats.totalDeltaMinutes >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {formatMinutesToHoursMinutes(filteredStats.totalDeltaMinutes)}
          </p>
        </div>

        <div className="bg-dark-800 border border-dark-700 rounded-xl p-4">
          <div className="text-xs text-dark-400 mb-1">Registros</div>
          <p className="text-xl font-bold text-white">{filteredStats.countDias}</p>
        </div>

        <div className="bg-dark-800 border border-dark-700 rounded-xl p-4">
          <div className="text-xs text-dark-400 mb-1">Ajustes</div>
          <p
            className={`text-xl font-bold ${
              filteredStats.countAjuste > 0 ? 'text-orange-600' : 'text-dark-500'
            }`}
          >
            {filteredStats.countAjuste}
          </p>
        </div>

        <div className="bg-dark-800 border border-dark-700 rounded-xl p-4">
          <div className="text-xs text-dark-400 mb-1">Sem Dados</div>
          <p
            className={`text-xl font-bold ${
              filteredStats.countSemDados > 0 ? 'text-yellow-600' : 'text-dark-500'
            }`}
          >
            {filteredStats.countSemDados}
          </p>
        </div>

        <div className="bg-dark-800 border border-dark-700 rounded-xl p-4">
          <div className="text-xs text-dark-400 mb-1">Hora Extra</div>
          <p className="text-xl font-bold text-blue-600">{filteredStats.countHoraExtra}</p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-dark-800 border border-dark-700 rounded-xl p-4">
          <h3 className="text-lg font-semibold text-white mb-4">Evolução por Data</h3>
          <TimelineChart records={filteredRecords} title="" />
        </div>

        <div className="bg-dark-800 border border-dark-700 rounded-xl p-4">
          <h3 className="text-lg font-semibold text-white mb-4">
            Distribuição por Classificação
          </h3>
          <CollaboratorClassificacaoChart summary={filteredSummary} />

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm text-dark-300">Normal: {filteredStats.countNormal}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-sm text-dark-300">Hora Extra: {filteredStats.countHoraExtra}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-sm text-dark-300">Atraso: {filteredStats.countAtraso}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-dark-500"></div>
              <span className="text-sm text-dark-300">Outros: {filteredStats.countOutros}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de registros */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">
          Registros Detalhados {hasDateFilter ? `(${filteredRecords.length})` : ''}
        </h3>
        <RecordsTable records={filteredRecords} />
      </div>
    </div>
  );
}
