import { useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import type { ColaboradorRecord, GestorSummary } from '../lib/types';
import { formatMinutos } from '../lib/types';

// ─── Gráfico por gestor ──────────────────────────────────────────────────────

interface GestorChartProps {
  gestores: GestorSummary[];
}

export function GestorChart({ gestores }: GestorChartProps) {
  const option = useMemo(() => {
    const sorted = [...gestores].sort((a, b) => a.totalMinutos - b.totalMinutos);
    const names = sorted.map((g) => g.gestor);
    const hours = sorted.map((g) => parseFloat((g.totalMinutos / 60).toFixed(1)));

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: '#1e293b',
        borderColor: '#334155',
        textStyle: { color: '#e2e8f0' },
        formatter: (params: { name: string; value: number }[]) => {
          const p = params[0];
          const gestor = sorted.find((g) => g.gestor === p.name);
          if (!gestor) return '';
          return `
            <div style="font-weight:600;margin-bottom:4px">${p.name}</div>
            <div>Saldo: <b>${formatMinutos(gestor.totalMinutos)}</b></div>
            <div>Colaboradores: <b>${gestor.colaboradores.length}</b></div>
            <div>Média: <b>${formatMinutos(gestor.mediaMinutos)}</b></div>
            <div style="color:#4ade80">Positivos: ${gestor.positivosCount}</div>
            <div style="color:#f87171">Negativos: ${gestor.negativosCount}</div>
          `;
        },
      },
      grid: { left: '2%', right: '8%', top: '4%', bottom: '2%', containLabel: true },
      xAxis: {
        type: 'value',
        axisLabel: { color: '#94a3b8', formatter: (v: number) => `${v}h` },
        splitLine: { lineStyle: { color: '#1e293b' } },
      },
      yAxis: {
        type: 'category',
        data: names,
        axisLabel: {
          color: '#94a3b8',
          width: 160,
          overflow: 'truncate',
          fontSize: 11,
        },
      },
      series: [
        {
          type: 'bar',
          data: hours.map((v, i) => ({
            value: v,
            itemStyle: { color: sorted[i].totalMinutos >= 0 ? '#4ade80' : '#f87171', borderRadius: [0, 4, 4, 0] },
          })),
          label: {
            show: true,
            position: 'right',
            color: '#94a3b8',
            fontSize: 11,
            formatter: (p: { dataIndex: number }) => formatMinutos(sorted[p.dataIndex].totalMinutos),
          },
        },
      ],
    };
  }, [gestores]);

  return (
    <ReactECharts
      option={option}
      style={{ height: Math.max(300, gestores.length * 48) }}
      opts={{ renderer: 'svg' }}
    />
  );
}

// ─── Ranking de colaboradores ────────────────────────────────────────────────

interface RankingChartProps {
  records: ColaboradorRecord[];
}

export function RankingChart({ records }: RankingChartProps) {
  const [mode, setMode] = useState<'piores' | 'melhores'>('piores');

  const sorted = useMemo(() => {
    const s = [...records].sort((a, b) =>
      mode === 'piores' ? a.minutos - b.minutos : b.minutos - a.minutos
    );
    return s.slice(0, 15);
  }, [records, mode]);

  const option = useMemo(() => {
    const names = sorted.map((r) => r.nome);
    const hours = sorted.map((r) => parseFloat((r.minutos / 60).toFixed(1)));

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: '#1e293b',
        borderColor: '#334155',
        textStyle: { color: '#e2e8f0' },
        formatter: (params: { name: string; dataIndex: number }[]) => {
          const p = params[0];
          const r = sorted[p.dataIndex];
          return `
            <div style="font-weight:600;margin-bottom:4px">${r.nome}</div>
            <div>Gestor: ${r.gestor}</div>
            <div>Saldo: <b>${r.saldoTotal || formatMinutos(r.minutos)}</b></div>
          `;
        },
      },
      grid: { left: '2%', right: '8%', top: '4%', bottom: '2%', containLabel: true },
      xAxis: {
        type: 'value',
        axisLabel: { color: '#94a3b8', formatter: (v: number) => `${v}h` },
        splitLine: { lineStyle: { color: '#1e293b' } },
      },
      yAxis: {
        type: 'category',
        data: [...names].reverse(),
        axisLabel: {
          color: '#94a3b8',
          width: 160,
          overflow: 'truncate',
          fontSize: 11,
        },
      },
      series: [
        {
          type: 'bar',
          data: [...hours].reverse().map((v, i) => ({
            value: v,
            itemStyle: {
              color: [...sorted].reverse()[i].minutos >= 0 ? '#4ade80' : '#f87171',
              borderRadius: [0, 4, 4, 0],
            },
          })),
          label: {
            show: true,
            position: 'right',
            color: '#94a3b8',
            fontSize: 11,
            formatter: (p: { dataIndex: number }) => {
              const r = [...sorted].reverse()[p.dataIndex];
              return r.saldoTotal || formatMinutos(r.minutos);
            },
          },
        },
      ],
    };
  }, [sorted]);

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setMode('piores')}
          className={`px-3 py-1 text-sm rounded-md font-medium transition-colors ${
            mode === 'piores'
              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
              : 'text-dark-400 hover:text-white'
          }`}
        >
          15 Piores
        </button>
        <button
          onClick={() => setMode('melhores')}
          className={`px-3 py-1 text-sm rounded-md font-medium transition-colors ${
            mode === 'melhores'
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'text-dark-400 hover:text-white'
          }`}
        >
          15 Melhores
        </button>
      </div>
      <ReactECharts
        option={option}
        style={{ height: Math.max(300, sorted.length * 40) }}
        opts={{ renderer: 'svg' }}
      />
    </div>
  );
}
