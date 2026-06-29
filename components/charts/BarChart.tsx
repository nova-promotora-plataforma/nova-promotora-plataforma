'use client'

import {
  ResponsiveContainer, BarChart as RechartsBarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'
import { CHART_COLOR } from '@/config/design-tokens'
import { formatNumber } from '@/lib/utils'

interface DataPoint { label: string; value: number }

interface BarChartProps {
  data: DataPoint[]
  title: string
}

export function BarChart({ data, title }: BarChartProps) {
  return (
    <div className="rounded-md border border-[var(--nova-border)] bg-[var(--nova-bg-elev)] p-4">
      <p className="text-sm font-semibold text-[var(--nova-text)] mb-4">{title}</p>
      <ResponsiveContainer width="100%" height={160}>
        <RechartsBarChart data={data} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="rgba(34,48,74,0.6)" strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: '#5D6880', fontSize: 10, fontFamily: 'var(--font-sora)' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={formatNumber}
          />
          <YAxis
            type="category"
            dataKey="label"
            tick={{ fill: '#9AA6BA', fontSize: 11, fontFamily: 'var(--font-sora)' }}
            axisLine={false}
            tickLine={false}
            width={32}
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
            formatter={(v: number) => [formatNumber(v), 'Parceiros']}
          />
          <Bar
            dataKey="value"
            fill={CHART_COLOR}
            opacity={0.85}
            radius={[0, 4, 4, 0]}
          />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  )
}
