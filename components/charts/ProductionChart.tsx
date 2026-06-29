'use client'

import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip,
} from 'recharts'
import { CHART_COLOR } from '@/config/design-tokens'
import { formatCurrency } from '@/lib/utils'

interface DataPoint { month: string; amount: number }

interface ProductionChartProps {
  data: DataPoint[]
  title: string
}

export function ProductionChart({ data, title }: ProductionChartProps) {
  return (
    <div className="rounded-md border border-[var(--nova-border)] bg-[var(--nova-bg-elev)] p-4">
      <p className="text-sm font-semibold text-[var(--nova-text)] mb-4">{title}</p>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={CHART_COLOR} stopOpacity={0.25} />
              <stop offset="100%" stopColor={CHART_COLOR} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(34,48,74,0.6)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fill: '#5D6880', fontSize: 10, fontFamily: 'var(--font-sora)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#5D6880', fontSize: 10, fontFamily: 'var(--font-sora)' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => `R$${(v / 1_000_000).toFixed(1)}M`}
            width={52}
          />
          <Tooltip
            contentStyle={{
              background: '#0E1421',
              border: '1px solid #22304A',
              borderRadius: 8,
              fontSize: 12,
              fontFamily: 'var(--font-sora)',
              color: '#EEF2F8',
            }}
            formatter={(v: number) => [formatCurrency(v), 'Produção']}
          />
          <Area
            type="monotone"
            dataKey="amount"
            stroke={CHART_COLOR}
            strokeWidth={2}
            fill="url(#blueGrad)"
            dot={false}
            activeDot={{ r: 4, fill: CHART_COLOR, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
