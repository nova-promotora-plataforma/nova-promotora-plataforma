import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KPICardProps {
  label: string
  value: string
  sub?: string
  trend?: 'up' | 'down' | 'neutral'
  className?: string
}

export function KPICard({ label, value, sub, trend, className }: KPICardProps) {
  return (
    <div
      className={cn(
        'rounded-md border bg-[var(--nova-bg-elev)] border-[var(--nova-border)] p-4 flex flex-col gap-2',
        className,
      )}
    >
      <p className="text-[0.625rem] font-medium uppercase tracking-widest text-[var(--nova-text-dim)]">
        {label}
      </p>
      <p className="text-2xl font-bold text-[var(--nova-text)] leading-none">{value}</p>
      {sub && (
        <p
          className={cn(
            'text-xs flex items-center gap-1',
            trend === 'up'   && 'text-emerald-400',
            trend === 'down' && 'text-red-400',
            !trend           && 'text-[var(--nova-text-muted)]',
          )}
        >
          {trend === 'up'      && <TrendingUp  size={12} aria-hidden />}
          {trend === 'down'    && <TrendingDown size={12} aria-hidden />}
          {trend === 'neutral' && <Minus       size={12} aria-hidden />}
          {sub}
        </p>
      )}
    </div>
  )
}
