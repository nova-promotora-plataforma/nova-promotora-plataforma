import { cn } from '@/lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean
  hoverable?: boolean
}

export function Card({ glass, hoverable, className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-md border transition-nova',
        glass
          ? 'glass'
          : 'bg-[var(--nova-bg-elev)] border-[var(--nova-border)]',
        hoverable && 'hover:-translate-y-0.5 hover:shadow-md cursor-pointer',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-4 py-3 border-b border-[var(--nova-border)]', className)} {...props}>
      {children}
    </div>
  )
}

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-4', className)} {...props}>
      {children}
    </div>
  )
}
