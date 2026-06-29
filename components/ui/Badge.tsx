import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'ativo' | 'inativo' | 'blue' | 'amber' | 'draft' | 'exported' | 'archived'

const variants: Record<BadgeVariant, string> = {
  default:  'bg-[var(--nova-bg-elev-2)] border-[var(--nova-border)] text-[var(--nova-text-muted)]',
  ativo:    'bg-emerald-500/10 border-emerald-500/25 text-emerald-400',
  inativo:  'bg-red-600/10 border-red-600/25 text-red-400',
  blue:     'bg-[var(--btn-blue-bg)] border-[var(--btn-blue-border)] text-[var(--btn-blue-text)]',
  amber:    'bg-amber-500/10 border-amber-500/25 text-amber-400',
  draft:    'bg-[var(--nova-bg-elev-2)] border-[var(--nova-border)] text-[var(--nova-text-muted)]',
  exported: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400',
  archived: 'bg-[var(--nova-bg-elev-2)] border-[var(--nova-border)] text-[var(--nova-text-dim)]',
}

interface BadgeProps {
  variant?: BadgeVariant
  dot?: boolean
  className?: string
  children: React.ReactNode
}

export function Badge({ variant = 'default', dot, className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[0.6875rem] font-medium',
        variants[variant],
        className,
      )}
    >
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" aria-hidden />
      )}
      {children}
    </span>
  )
}
