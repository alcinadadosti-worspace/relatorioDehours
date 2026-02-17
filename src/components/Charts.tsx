import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { CollaboratorSummary, GlobalStats, ParsedRecord } from '../lib/types';
import { formatDate } from '../lib/time';

interface RankingChartProps {
  summaries: CollaboratorSummary[];
  showAll?: boolean;
  title?: string;
}

export function RankingChart({ summaries, showAll = false, title = 'Ranking por Total Ajustado' }: RankingChartProps) {
  const option = useMemo(() => {
    // Ordena e pega top/bottom
    const sorted = [...summaries].sort((a, b) => b.adjustedTotalMinutes - a.adjustedTotalMinutes);

    let data: CollaboratorSummary[];
    if (showAll) {
      data = sorted;
    } else {
      const top10 = sorted.filter((s) => s.adjustedTotalMinutes > 0).slice(0, 10);
      const bottom10 = sorted.filter((s) => s.adjustedTotalMinutes < 0).slice(-10);
      data = [...top10, ...bottom10];
    }

    const names = data.map((s) => `${s.colaborador} (${s.id})`);
    const values = data.map((s) => Math.round(s.adjustedTotalMinutes));

    return {
      title: {
        text: title,
        left: 'center',
        textStyle: {
          fontSize: 14,
          fontWeight: 600,
        },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: unknown[]) => {
          const p = params[0] as { name: string; value: number };
          const hours = Math.abs(p.value) / 60;
          const sign = p.value >= 0 ? '+' : '-';
          return `${p.name}<br/>${sign}${hours.toFixed(1)}h (${p.value}min)`;
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '50px',
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value: number) => {
            const hours = value / 60;
            return `${hours.toFixed(0)}h`;
          },
        },
      },
      yAxis: {
        type: 'category',
        data: names.reverse(),
        axisLabel: {
          width: 150,
          overflow: 'truncate',
          fontSize: 11,
        },
      },
      series: [
        {
          type: 'bar',
          data: values.reverse().map((v) => ({
            value: v,
            itemStyle: {
              color: v >= 0 ? '#22c55e' : '#ef4444',
              borderRadius: v >= 0 ? [0, 4, 4, 0] : [4, 0, 0, 4],
            },
          })),
          label: {
            show: true,
            position: 'right',
            formatter: (params: { value: number }) => {
              const hours = Math.abs(params.value) / 60;
              return `${hours.toFixed(1)}h`;
            },
            fontSize: 10,
          },
        },
      ],
    };
  }, [summaries, showAll, title]);

  const height = showAll
    ? Math.max(400, summaries.length * 25)
    : Math.max(300, Math.min(20, summaries.length) * 25);

  return <ReactECharts option={option} style={{ height: `${height}px` }} />;
}

interface ClassificacaoChartProps {
  stats: GlobalStats;
  title?: string;
}

export function ClassificacaoChart({ stats, title = 'Distribuição por Classificação' }: ClassificacaoChartProps) {
  const option = useMemo(() => {
    const data = Object.entries(stats.byClassificacao)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return {
      title: {
        text: title,
        left: 'center',
        textStyle: {
          fontSize: 14,
          fontWeight: 600,
        },
      },
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)',
      },
      legend: {
        orient: 'vertical',
        right: '5%',
        top: 'middle',
        type: 'scroll',
      },
      series: [
        {
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['35%', '55%'],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 6,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: {
            show: false,
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 'bold',
            },
          },
          data: data.map((d, i) => ({
            ...d,
            itemStyle: {
              color: getChartColor(i),
            },
          })),
        },
      ],
    };
  }, [stats, title]);

  return <ReactECharts option={option} style={{ height: '300px' }} />;
}

interface TimelineChartProps {
  records: ParsedRecord[];
  title?: string;
}

export function TimelineChart({ records, title = 'Evolução por Data' }: TimelineChartProps) {
  const option = useMemo(() => {
    // Agrupa por data
    const byDate: Record<string, { total: number; count: number }> = {};

    const sortedRecords = [...records].sort((a, b) => {
      if (a.data && b.data) return a.data.getTime() - b.data.getTime();
      return a.rowIndex - b.rowIndex;
    });

    for (const record of sortedRecords) {
      const key = record.data ? formatDate(record.data) : `Registro ${record.rowIndex}`;
      if (!byDate[key]) {
        byDate[key] = { total: 0, count: 0 };
      }
      byDate[key].total += record.deltaMinutes;
      byDate[key].count++;
    }

    const dates = Object.keys(byDate);
    const values = dates.map((d) => byDate[d].total);

    // Calcula acumulado
    let accumulated = 0;
    const accumulatedValues = values.map((v) => {
      accumulated += v;
      return accumulated;
    });

    return {
      title: {
        text: title,
        left: 'center',
        textStyle: {
          fontSize: 14,
          fontWeight: 600,
        },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        formatter: (params: unknown[]) => {
          const p = params as { seriesName: string; name: string; value: number }[];
          let result = p[0].name + '<br/>';
          for (const item of p) {
            const hours = item.value / 60;
            const sign = item.value >= 0 ? '+' : '';
            result += `${item.seriesName}: ${sign}${hours.toFixed(1)}h<br/>`;
          }
          return result;
        },
      },
      legend: {
        data: ['Diferença do Dia', 'Acumulado'],
        top: '30px',
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '80px',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: {
          rotate: 45,
          fontSize: 10,
        },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value: number) => `${(value / 60).toFixed(0)}h`,
        },
      },
      series: [
        {
          name: 'Diferença do Dia',
          type: 'bar',
          data: values.map((v) => ({
            value: v,
            itemStyle: {
              color: v >= 0 ? '#22c55e' : '#ef4444',
            },
          })),
        },
        {
          name: 'Acumulado',
          type: 'line',
          smooth: true,
          data: accumulatedValues,
          lineStyle: {
            color: '#3b82f6',
            width: 2,
          },
          itemStyle: {
            color: '#3b82f6',
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
                { offset: 1, color: 'rgba(59, 130, 246, 0.05)' },
              ],
            },
          },
        },
      ],
    };
  }, [records, title]);

  return <ReactECharts option={option} style={{ height: '350px' }} />;
}

interface CollaboratorClassificacaoChartProps {
  summary: CollaboratorSummary;
}

export function CollaboratorClassificacaoChart({ summary }: CollaboratorClassificacaoChartProps) {
  const option = useMemo(() => {
    const data = [
      { name: 'Normal', value: summary.countNormal },
      { name: 'Hora Extra', value: summary.countHoraExtra },
      { name: 'Atraso', value: summary.countAtraso },
      { name: 'Outros', value: summary.countOutros },
    ].filter((d) => d.value > 0);

    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)',
      },
      series: [
        {
          type: 'pie',
          radius: ['45%', '75%'],
          center: ['50%', '50%'],
          itemStyle: {
            borderRadius: 6,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: {
            show: true,
            formatter: '{b}: {c}',
            fontSize: 11,
          },
          data: data.map((d) => ({
            ...d,
            itemStyle: {
              color: getPieColor(d.name),
            },
          })),
        },
      ],
    };
  }, [summary]);

  return <ReactECharts option={option} style={{ height: '250px' }} />;
}

// Cores para gráficos
function getChartColor(index: number): string {
  const colors = [
    '#3b82f6', // blue
    '#22c55e', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#84cc16', // lime
    '#f97316', // orange
    '#6366f1', // indigo
  ];
  return colors[index % colors.length];
}

function getPieColor(name: string): string {
  const colorMap: Record<string, string> = {
    Normal: '#22c55e',
    'Hora Extra': '#3b82f6',
    Atraso: '#ef4444',
    Outros: '#9ca3af',
  };
  return colorMap[name] || '#6b7280';
}
