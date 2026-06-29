import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-[var(--nova-text-muted)] uppercase tracking-wider">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          aria-invalid={!!error}
          className={cn(
            'w-full rounded-sm border bg-white/[0.04] px-3 py-2 text-sm text-[var(--nova-text)]',
            'placeholder:text-[var(--nova-text-dim)] outline-none',
            'transition-nova',
            error
              ? 'border-red-500/60 focus:border-red-500'
              : 'border-[var(--nova-border)] focus:border-[var(--nova-blue)]/50',
            'focus-visible:ring-2 focus-visible:ring-[var(--nova-blue)]/30',
            className,
          )}
          {...props}
        />
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-xs text-[var(--nova-text-dim)]">{hint}</p>
        )}
        {error && (
          <p id={`${inputId}-error`} role="alert" className="text-xs text-red-400">{error}</p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className, id, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-xs font-medium text-[var(--nova-text-muted)] uppercase tracking-wider">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          aria-invalid={!!error}
          className={cn(
            'w-full rounded-sm border bg-[var(--nova-bg-elev)] px-3 py-2 text-sm text-[var(--nova-text)]',
            'outline-none transition-nova cursor-pointer',
            error
              ? 'border-red-500/60'
              : 'border-[var(--nova-border)] focus:border-[var(--nova-blue)]/50',
            'focus-visible:ring-2 focus-visible:ring-[var(--nova-blue)]/30',
            className,
          )}
          {...props}
        >
          {options.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {error && <p role="alert" className="text-xs text-red-400">{error}</p>}
      </div>
    )
  }
)
Select.displayName = 'Select'
