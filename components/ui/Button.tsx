'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'blue' | 'red' | 'ghost' | 'destructive'
type Size    = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  fullWidth?: boolean
}

const variantStyles: Record<Variant, string> = {
  primary:     'glass border-white/15 text-[var(--nova-text)] hover:bg-white/10',
  blue:        'bg-[var(--btn-blue-bg)] border-[var(--btn-blue-border)] text-[var(--btn-blue-text)] hover:bg-blue-500/20',
  red:         'bg-[var(--btn-red-bg)] border-[var(--btn-red-border)] text-[var(--btn-red-text)] hover:bg-red-600/20',
  ghost:       'border-transparent text-[var(--nova-text-muted)] hover:text-[var(--nova-text)] hover:bg-white/5',
  destructive: 'bg-red-600/20 border-red-600/50 text-red-400 hover:bg-red-600/30',
}

const sizeStyles: Record<Size, string> = {
  sm: 'text-xs px-3 py-1.5 gap-1.5',
  md: 'text-sm px-4 py-2 gap-2',
  lg: 'text-base px-5 py-2.5 gap-2.5',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', fullWidth, className, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center rounded-sm border font-medium',
        'transition-nova select-none cursor-pointer',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--nova-blue)] focus-visible:outline-offset-2',
        'active:translate-y-px',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
)
Button.displayName = 'Button'
