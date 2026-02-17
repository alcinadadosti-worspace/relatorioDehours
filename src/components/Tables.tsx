import { useState, useMemo } from 'react';
import {
  ChevronUp,
  ChevronDown,
  Eye,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { CollaboratorSummary, ParsedRecord } from '../lib/types';
import { formatMinutesToHoursMinutes } from '../lib/types';
import { formatDate } from '../lib/time';

interface SummaryTableProps {
  summaries: CollaboratorSummary[];
  onSelectCollaborator: (id: string) => void;
}

type SortField =
  | 'id'
  | 'colaborador'
  | 'totalDeltaMinutes'
  | 'adjustedTotalMinutes'
  | 'countDias'
  | 'countSemDados';
type SortDirection = 'asc' | 'desc';

export function SummaryTable({ summaries, onSelectCollaborator }: SummaryTableProps) {
  const [sortField, setSortField] = useState<SortField>('adjustedTotalMinutes');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const sortedSummaries = useMemo(() => {
    return [...summaries].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'id':
          const aNum = parseInt(a.id, 10);
          const bNum = parseInt(b.id, 10);
          if (!isNaN(aNum) && !isNaN(bNum)) {
            comparison = aNum - bNum;
          } else {
            comparison = a.id.localeCompare(b.id);
          }
          break;
        case 'colaborador':
          comparison = a.colaborador.localeCompare(b.colaborador);
          break;
        case 'totalDeltaMinutes':
          comparison = a.totalDeltaMinutes - b.totalDeltaMinutes;
          break;
        case 'adjustedTotalMinutes':
          comparison = a.adjustedTotalMinutes - b.adjustedTotalMinutes;
          break;
        case 'countDias':
          comparison = a.countDias - b.countDias;
          break;
        case 'countSemDados':
          comparison = a.countSemDados - b.countSemDados;
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [summaries, sortField, sortDirection]);

  const paginatedSummaries = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedSummaries.slice(start, start + itemsPerPage);
  }, [sortedSummaries, currentPage]);

  const totalPages = Math.ceil(sortedSummaries.length / itemsPerPage);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ChevronUp className="w-4 h-4 text-gray-300" />;
    }
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4 text-primary-500" />
    ) : (
      <ChevronDown className="w-4 h-4 text-primary-500" />
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('id')}
              >
                <div className="flex items-center gap-1">
                  ID
                  <SortIcon field="id" />
                </div>
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('colaborador')}
              >
                <div className="flex items-center gap-1">
                  Colaborador
                  <SortIcon field="colaborador" />
                </div>
              </th>
              <th
                className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('totalDeltaMinutes')}
              >
                <div className="flex items-center justify-end gap-1">
                  Total Bruto
                  <SortIcon field="totalDeltaMinutes" />
                </div>
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Ajustes
              </th>
              <th
                className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('adjustedTotalMinutes')}
              >
                <div className="flex items-center justify-end gap-1">
                  Total Ajustado
                  <SortIcon field="adjustedTotalMinutes" />
                </div>
              </th>
              <th
                className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('countDias')}
              >
                <div className="flex items-center justify-center gap-1">
                  Registros
                  <SortIcon field="countDias" />
                </div>
              </th>
              <th
                className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('countSemDados')}
              >
                <div className="flex items-center justify-center gap-1">
                  S/ Dados
                  <SortIcon field="countSemDados" />
                </div>
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedSummaries.map((summary) => {
              const adjustments =
                summary.totalExtraBonusMinutes - summary.totalAtrasoPenaltyMinutes;

              return (
                <tr
                  key={summary.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {summary.id}
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {summary.colaborador}
                      </p>
                      {summary.alternativeNames.length > 0 && (
                        <p className="text-xs text-yellow-600 flex items-center gap-1 mt-0.5">
                          <AlertCircle className="w-3 h-3" />
                          Também: {summary.alternativeNames.join(', ')}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-mono">
                    <span
                      className={
                        summary.totalDeltaMinutes >= 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }
                    >
                      {formatMinutesToHoursMinutes(summary.totalDeltaMinutes)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-mono">
                    {adjustments !== 0 && (
                      <span
                        className={adjustments >= 0 ? 'text-blue-600' : 'text-orange-600'}
                      >
                        {formatMinutesToHoursMinutes(adjustments)}
                      </span>
                    )}
                    {adjustments === 0 && <span className="text-gray-400">-</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-mono font-semibold">
                    <span
                      className={
                        summary.adjustedTotalMinutes >= 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }
                    >
                      {formatMinutesToHoursMinutes(summary.adjustedTotalMinutes)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600">
                    {summary.countDias}
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    {summary.countSemDados > 0 ? (
                      <span className="text-yellow-600">{summary.countSemDados}</span>
                    ) : (
                      <span className="text-gray-400">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => onSelectCollaborator(summary.id)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                      title="Ver detalhes"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between bg-gray-50">
          <p className="text-sm text-gray-600">
            Mostrando {(currentPage - 1) * itemsPerPage + 1} a{' '}
            {Math.min(currentPage * itemsPerPage, sortedSummaries.length)} de{' '}
            {sortedSummaries.length}
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-gray-300 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-sm text-gray-600">
              Página {currentPage} de {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-gray-300 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface RecordsTableProps {
  records: ParsedRecord[];
}

export function RecordsTable({ records }: RecordsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => {
      if (a.data && b.data) return a.data.getTime() - b.data.getTime();
      return a.rowIndex - b.rowIndex;
    });
  }, [records]);

  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedRecords.slice(start, start + itemsPerPage);
  }, [sortedRecords, currentPage]);

  const totalPages = Math.ceil(sortedRecords.length / itemsPerPage);

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Data
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Dia
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Classificação
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Entrada
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Saída
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Diferença
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Aba
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedRecords.map((record, idx) => (
              <tr
                key={`${record.sourceSheet}-${record.rowIndex}-${idx}`}
                className={`hover:bg-gray-50 ${record.parseError ? 'bg-red-50' : ''} ${
                  record.isMissing ? 'bg-yellow-50' : ''
                }`}
              >
                <td className="px-4 py-2.5 text-sm text-gray-900">
                  {record.data ? formatDate(record.data) : record.dataString || '-'}
                </td>
                <td className="px-4 py-2.5 text-sm text-gray-600">{record.dia || '-'}</td>
                <td className="px-4 py-2.5">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getClassificacaoBadge(
                      record.classificacao
                    )}`}
                  >
                    {record.classificacao || 'N/A'}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-sm text-center text-gray-600">
                  {record.entrada || '-'}
                </td>
                <td className="px-4 py-2.5 text-sm text-center text-gray-600">
                  {record.saida || '-'}
                </td>
                <td className="px-4 py-2.5 text-sm text-right font-mono">
                  {record.isMissing ? (
                    <span className="text-yellow-600">Sem dados</span>
                  ) : record.parseError ? (
                    <span className="text-red-600" title={record.diferencaRaw}>
                      Erro: {record.diferencaRaw}
                    </span>
                  ) : (
                    <span
                      className={record.deltaMinutes >= 0 ? 'text-green-600' : 'text-red-600'}
                    >
                      {formatMinutesToHoursMinutes(record.deltaMinutes)}
                    </span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-xs text-gray-500">{record.sourceSheet}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between bg-gray-50">
          <p className="text-sm text-gray-600">
            Mostrando {(currentPage - 1) * itemsPerPage + 1} a{' '}
            {Math.min(currentPage * itemsPerPage, sortedRecords.length)} de {sortedRecords.length}
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-gray-300 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-sm text-gray-600">
              Página {currentPage} de {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-gray-300 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function getClassificacaoBadge(classificacao: string): string {
  const normalized = classificacao.toLowerCase().trim();

  if (normalized === 'normal') {
    return 'bg-green-100 text-green-800';
  }
  if (normalized === 'hora extra' || normalized === 'horaextra') {
    return 'bg-blue-100 text-blue-800';
  }
  if (normalized === 'atraso') {
    return 'bg-red-100 text-red-800';
  }
  return 'bg-gray-100 text-gray-800';
}
