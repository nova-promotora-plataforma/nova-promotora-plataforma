'use client'

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { formatNumber, cn } from '@/lib/utils'

interface DonutSlice { label: string; value: number; color: string }

interface DonutChartProps {
  data: DonutSlice[]
  title: string
  centerLabel?: string
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

export function DonutChart({ data, title, centerLabel = 'Total' }: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  const columns = chunk(data, 5)

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

        <div className="w-full sm:w-auto flex flex-wrap">
          {columns.map((col, ci) => (
            <div
              key={ci}
              className={cn(
                'flex flex-col gap-2 pr-6',
                ci > 0 && 'pl-6 border-l border-[var(--nova-border)]',
              )}
            >
              {col.map(d => (
                <div key={d.label} className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} aria-hidden />
                  <span className="text-sm text-[var(--nova-text)] font-medium flex-shrink-0 w-10">{d.label}</span>
                  <span className="text-sm text-[var(--nova-text-muted)] w-16 text-right">{formatNumber(d.value)}</span>
                  <span className="text-xs text-[var(--nova-text-dim)] w-12 text-right">
                    {total > 0 ? ((d.value / total) * 100).toFixed(1) : '0.0'}%
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
