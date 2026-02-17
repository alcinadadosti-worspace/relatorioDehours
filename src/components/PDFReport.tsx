import React, { useRef, useCallback } from 'react';
import { FileDown, Printer } from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import type { CollaboratorSummary, GlobalStats, AggregationConfig } from '../lib/types';
import { formatMinutesToHoursMinutes, formatMinutesToDecimalHours } from '../lib/types';

interface PDFReportProps {
  summaries: CollaboratorSummary[];
  stats: GlobalStats;
  config: AggregationConfig;
  fileName: string | null;
}

export function PDFReport({ summaries, stats, config, fileName }: PDFReportProps) {
  const reportRef = useRef<HTMLDivElement>(null);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  // Ordena summaries
  const sortedByAdjusted = [...summaries].sort(
    (a, b) => b.adjustedTotalMinutes - a.adjustedTotalMinutes
  );

  // Top 10 positivos e negativos para o gráfico
  const top10Positive = sortedByAdjusted.filter((s) => s.adjustedTotalMinutes > 0).slice(0, 10);
  const top10Negative = sortedByAdjusted.filter((s) => s.adjustedTotalMinutes < 0).slice(-10);
  const chartData = [...top10Positive, ...top10Negative];

  // Opções do gráfico de barras
  const barChartOption = {
    grid: {
      left: '3%',
      right: '15%',
      bottom: '3%',
      top: '10px',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      axisLabel: {
        formatter: (value: number) => `${(value / 60).toFixed(0)}h`,
      },
    },
    yAxis: {
      type: 'category',
      data: chartData.map((s) => s.colaborador).reverse(),
      axisLabel: {
        width: 120,
        overflow: 'truncate',
        fontSize: 9,
      },
    },
    series: [
      {
        type: 'bar',
        data: chartData
          .map((s) => ({
            value: s.adjustedTotalMinutes,
            itemStyle: {
              color: s.adjustedTotalMinutes >= 0 ? '#22c55e' : '#ef4444',
            },
          }))
          .reverse(),
        label: {
          show: true,
          position: 'right',
          formatter: (params: { value: number }) => {
            const hours = Math.abs(params.value) / 60;
            return `${hours.toFixed(1)}h`;
          },
          fontSize: 8,
        },
      },
    ],
  };

  // Opções do gráfico de pizza
  const pieChartOption = {
    series: [
      {
        type: 'pie',
        radius: ['30%', '60%'],
        center: ['50%', '50%'],
        itemStyle: {
          borderRadius: 4,
          borderColor: '#fff',
          borderWidth: 1,
        },
        label: {
          show: true,
          formatter: '{b}: {c}',
          fontSize: 9,
        },
        data: Object.entries(stats.byClassificacao)
          .map(([name, value], i) => ({
            name,
            value,
            itemStyle: {
              color: getChartColor(i),
            },
          }))
          .sort((a, b) => b.value - a.value),
      },
    ],
  };

  return (
    <>
      {/* Botão de exportar */}
      <div className="flex gap-2 mb-4 print:hidden">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          <FileDown className="w-4 h-4" />
          Exportar PDF
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Printer className="w-4 h-4" />
          Imprimir
        </button>
      </div>

      {/* Relatório para impressão */}
      <div ref={reportRef} className="print-report">
        {/* Capa */}
        <div className="report-page report-cover">
          <div className="cover-content">
            <div className="cover-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <h1 className="cover-title">Relatório de Horas</h1>
            <p className="cover-subtitle">Análise Consolidada de Ponto</p>

            <div className="cover-meta">
              <div className="cover-meta-item">
                <span className="label">Arquivo:</span>
                <span className="value">{fileName || 'N/A'}</span>
              </div>
              <div className="cover-meta-item">
                <span className="label">Gerado em:</span>
                <span className="value">
                  {dateStr} às {timeStr}
                </span>
              </div>
              <div className="cover-meta-item">
                <span className="label">Colaboradores:</span>
                <span className="value">{stats.totalCollaborators}</span>
              </div>
              <div className="cover-meta-item">
                <span className="label">Registros:</span>
                <span className="value">{stats.totalRecords}</span>
              </div>
            </div>

            <div className="cover-config">
              <p className="config-title">Configuração de Ajustes</p>
              <p>Bônus Hora Extra: +{config.extraBonusHours}h por registro</p>
              <p>Penalidade Atraso: -{config.atrasoPenaltyHours}h por registro</p>
            </div>
          </div>
        </div>

        {/* Página de Resumo */}
        <div className="report-page">
          <div className="page-header">
            <h2>Resumo Executivo</h2>
          </div>

          <div className="kpi-grid">
            <div className="kpi-card">
              <span className="kpi-label">Colaboradores</span>
              <span className="kpi-value">{stats.totalCollaborators}</span>
            </div>
            <div className="kpi-card">
              <span className="kpi-label">Total de Registros</span>
              <span className="kpi-value">{stats.totalRecords}</span>
            </div>
            <div className="kpi-card">
              <span className="kpi-label">Total Bruto</span>
              <span className="kpi-value">
                {formatMinutesToHoursMinutes(stats.totalBrutoMinutes)}
              </span>
              <span className="kpi-sub">{formatMinutesToDecimalHours(stats.totalBrutoMinutes)}</span>
            </div>
            <div className="kpi-card">
              <span className="kpi-label">Total Ajustado</span>
              <span className="kpi-value">
                {formatMinutesToHoursMinutes(stats.totalAjustadoMinutes)}
              </span>
              <span className="kpi-sub">
                {formatMinutesToDecimalHours(stats.totalAjustadoMinutes)}
              </span>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-dot green"></span>
              <span>Normal: {stats.countNormal}</span>
            </div>
            <div className="stat-item">
              <span className="stat-dot blue"></span>
              <span>Hora Extra: {stats.countHoraExtra}</span>
            </div>
            <div className="stat-item">
              <span className="stat-dot red"></span>
              <span>Atraso: {stats.countAtraso}</span>
            </div>
            <div className="stat-item">
              <span className="stat-dot yellow"></span>
              <span>Sem Dados: {stats.totalSemDados}</span>
            </div>
          </div>

          {/* Gráfico de Classificações */}
          <div className="chart-container">
            <h3>Distribuição por Classificação</h3>
            <ReactECharts option={pieChartOption} style={{ height: '200px' }} />
          </div>
        </div>

        {/* Página de Ranking */}
        <div className="report-page">
          <div className="page-header">
            <h2>Ranking de Colaboradores</h2>
          </div>

          <div className="chart-container full">
            <h3>Top Positivos e Negativos</h3>
            <ReactECharts
              option={barChartOption}
              style={{ height: `${Math.max(250, chartData.length * 20)}px` }}
            />
          </div>
        </div>

        {/* Tabela de Colaboradores */}
        <div className="report-page">
          <div className="page-header">
            <h2>Detalhamento por Colaborador</h2>
          </div>

          <table className="report-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Colaborador</th>
                <th className="right">Bruto</th>
                <th className="right">Ajustes</th>
                <th className="right">Total</th>
                <th className="center">Reg.</th>
                <th className="center">S/D</th>
              </tr>
            </thead>
            <tbody>
              {sortedByAdjusted.map((s) => {
                const adjustments = s.totalExtraBonusMinutes - s.totalAtrasoPenaltyMinutes;
                return (
                  <tr key={s.id}>
                    <td>{s.id}</td>
                    <td>{s.colaborador}</td>
                    <td className="right mono">
                      {formatMinutesToHoursMinutes(s.totalDeltaMinutes)}
                    </td>
                    <td className="right mono">
                      {adjustments !== 0 ? formatMinutesToHoursMinutes(adjustments) : '-'}
                    </td>
                    <td className={`right mono bold ${s.adjustedTotalMinutes >= 0 ? 'green' : 'red'}`}>
                      {formatMinutesToHoursMinutes(s.adjustedTotalMinutes)}
                    </td>
                    <td className="center">{s.countDias}</td>
                    <td className="center">{s.countSemDados || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Rodapé */}
        <div className="report-footer">
          <p>Relatório de Horas - {fileName || 'N/A'}</p>
          <p>
            Gerado em {dateStr} às {timeStr}
          </p>
        </div>
      </div>

      {/* Estilos de impressão */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }

          .print-report,
          .print-report * {
            visibility: visible;
          }

          .print-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }

          .print:hidden {
            display: none !important;
          }
        }

        .print-report {
          font-family: 'Inter', system-ui, sans-serif;
          color: #1f2937;
          line-height: 1.5;
        }

        .report-page {
          page-break-after: always;
          padding: 40px;
          min-height: 100vh;
          box-sizing: border-box;
        }

        .report-page:last-of-type {
          page-break-after: avoid;
        }

        /* Capa */
        .report-cover {
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
          color: white;
        }

        .cover-content {
          text-align: center;
        }

        .cover-icon {
          margin-bottom: 24px;
          opacity: 0.9;
        }

        .cover-title {
          font-size: 36px;
          font-weight: 700;
          margin: 0 0 8px;
        }

        .cover-subtitle {
          font-size: 18px;
          opacity: 0.9;
          margin: 0 0 48px;
        }

        .cover-meta {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          max-width: 400px;
          margin: 0 auto 32px;
          text-align: left;
        }

        .cover-meta-item {
          display: flex;
          flex-direction: column;
        }

        .cover-meta-item .label {
          font-size: 12px;
          opacity: 0.8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .cover-meta-item .value {
          font-size: 16px;
          font-weight: 600;
        }

        .cover-config {
          margin-top: 32px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
        }

        .cover-config .config-title {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
          opacity: 0.8;
        }

        .cover-config p {
          margin: 4px 0;
          font-size: 14px;
        }

        /* Cabeçalho de página */
        .page-header {
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 12px;
          margin-bottom: 24px;
        }

        .page-header h2 {
          font-size: 20px;
          font-weight: 600;
          margin: 0;
          color: #0284c7;
        }

        /* KPIs */
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .kpi-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
          display: flex;
          flex-direction: column;
        }

        .kpi-label {
          font-size: 11px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .kpi-value {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
          margin-top: 4px;
        }

        .kpi-sub {
          font-size: 12px;
          color: #94a3b8;
        }

        /* Stats */
        .stats-grid {
          display: flex;
          gap: 24px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
        }

        .stat-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        .stat-dot.green { background: #22c55e; }
        .stat-dot.blue { background: #3b82f6; }
        .stat-dot.red { background: #ef4444; }
        .stat-dot.yellow { background: #eab308; }

        /* Gráficos */
        .chart-container {
          margin-bottom: 24px;
        }

        .chart-container.full {
          margin-bottom: 0;
        }

        .chart-container h3 {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 12px;
          color: #374151;
        }

        /* Tabela */
        .report-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
        }

        .report-table th,
        .report-table td {
          padding: 8px 12px;
          border-bottom: 1px solid #e5e7eb;
          text-align: left;
        }

        .report-table th {
          background: #f8fafc;
          font-weight: 600;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-size: 10px;
        }

        .report-table .right { text-align: right; }
        .report-table .center { text-align: center; }
        .report-table .mono { font-family: monospace; }
        .report-table .bold { font-weight: 600; }
        .report-table .green { color: #16a34a; }
        .report-table .red { color: #dc2626; }

        .report-table tbody tr:hover {
          background: #f8fafc;
        }

        /* Rodapé */
        .report-footer {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 12px 40px;
          background: #f8fafc;
          border-top: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          color: #64748b;
        }

        @media print {
          .report-page {
            padding: 20mm;
            min-height: auto;
          }

          .report-cover {
            min-height: 100vh;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .kpi-card,
          .stat-dot {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </>
  );
}

function getChartColor(index: number): string {
  const colors = [
    '#22c55e', // green
    '#3b82f6', // blue
    '#ef4444', // red
    '#f59e0b', // amber
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#84cc16', // lime
  ];
  return colors[index % colors.length];
}
