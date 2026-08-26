'use client'

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { formatNumber } from '@/lib/utils'

interface DonutSlice { label: string; value: number; color: string }

interface DonutChartProps {
  data: DonutSlice[]
  title: string
  centerLabel?: string
}

export function DonutChart({ data, title, centerLabel = 'Total' }: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  const ROWS = 5
  const numCols = Math.ceil(data.length / ROWS)
  // colunas de conteúdo em trilhas ímpares, colunas-traço (1px) em trilhas pares
  const gridTemplateColumns = Array.from({ length: numCols }, (_, i) => (i > 0 ? '1px auto' : 'auto')).join(' ')

  return (
    <div className="rounded-md border border-[var(--nova-border)] bg-[var(--nova-bg-elev)] p-4">
      <p className="text-sm font-semibold text-[var(--nova-text)] mb-2">{title}</p>
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-shrink-0" style={{ width: 200, height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={62}
                outerRadius={92}
                paddingAngle={2}
                stroke="none"
              >
                {data.map(d => <Cell key={d.label} fill={d.color} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-xl font-bold text-[var(--nova-text)] leading-none">{formatNumber(total)}</p>
            <p className="text-[0.6875rem] text-[var(--nova-text-dim)] mt-1">{centerLabel}</p>
          </div>
        </div>

        <div
          className="w-full sm:w-auto grid gap-x-6 gap-y-2"
          style={{ gridTemplateColumns, gridTemplateRows: `repeat(${ROWS}, auto)` }}
        >
          {data.map((d, i) => {
            const col = Math.floor(i / ROWS)
            const row = i % ROWS
            return (
              <div
                key={d.label}
                style={{ gridColumn: col * 2 + 1, gridRow: row + 1 }}
                className="flex items-center gap-2.5"
              >
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} aria-hidden />
                <span className="text-sm text-[var(--nova-text)] font-medium flex-shrink-0 w-10">{d.label}</span>
                <span className="text-sm text-[var(--nova-text-muted)] w-16 text-right">{formatNumber(d.value)}</span>
                <span className="text-xs text-[var(--nova-text-dim)] w-12 text-right">
                  {total > 0 ? ((d.value / total) * 100).toFixed(1) : '0.0'}%
                </span>
              </div>
            )
          })}
          {Array.from({ length: numCols - 1 }, (_, ci) => (
            <div
              key={`divider-${ci}`}
              style={{ gridColumn: (ci + 1) * 2, gridRow: `1 / ${ROWS + 1}` }}
              className="w-px bg-[var(--nova-border)]"
              aria-hidden
            />
          ))}
        </div>
      </div>
    </div>
  )
}
