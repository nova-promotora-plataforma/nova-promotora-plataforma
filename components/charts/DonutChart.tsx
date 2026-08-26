'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { formatNumber } from '@/lib/utils'

interface DonutSlice { label: string; value: number; color: string }

interface DonutChartProps {
  data: DonutSlice[]
  title: string
}

function renderLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) {
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 1.35
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  if (percent < 0.02) return null
  return (
    <text
      x={x} y={y}
      fill="#9AA6BA"
      fontSize={11}
      fontFamily="var(--font-sora)"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export function DonutChart({ data, title }: DonutChartProps) {
  return (
    <div className="rounded-md border border-[var(--nova-border)] bg-[var(--nova-bg-elev)] p-4">
      <p className="text-sm font-semibold text-[var(--nova-text)] mb-2">{title}</p>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={2}
            label={renderLabel}
            labelLine={false}
          >
            {data.map(d => <Cell key={d.label} fill={d.color} />)}
          </Pie>
          <Tooltip
            contentStyle={{
              background: '#0E1421',
              border: '1px solid #22304A',
              borderRadius: 8,
              fontSize: 12,
              fontFamily: 'var(--font-sora)',
              color: '#EEF2F8',
            }}
            formatter={(v: number, n: string) => [formatNumber(v), n]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 justify-center mt-1">
        {data.map(d => (
          <span key={d.label} className="inline-flex items-center gap-1.5 text-xs text-[var(--nova-text-muted)]">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} aria-hidden />
            {d.label}
          </span>
        ))}
      </div>
    </div>
  )
}
