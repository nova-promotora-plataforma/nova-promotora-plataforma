'use client'

import { Accessibility } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useAccessibility, type FontScale } from '@/hooks/useAccessibility'
import { cn } from '@/lib/utils'

export function AccessibilityButton() {
  const { scale, setFontScale, scales } = useAccessibility()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="Opções de acessibilidade"
        aria-expanded={open}
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-sm border transition-nova',
          'border-[var(--nova-border)] text-[var(--nova-text-muted)]',
          'hover:bg-white/5 hover:text-[var(--nova-text)]',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--nova-blue)]',
        )}
      >
        <Accessibility size={16} />
      </button>

      {open && (
        <div
          className={cn(
            'absolute right-0 top-10 z-50 flex gap-1 rounded-md border p-1.5',
            'bg-[var(--nova-bg-elev)] border-[var(--nova-border)] shadow-lg',
          )}
          role="group"
          aria-label="Escala de texto"
        >
          {scales.map(s => (
            <button
              key={s}
              onClick={() => { setFontScale(s as FontScale); setOpen(false) }}
              aria-pressed={scale === s}
              className={cn(
                'px-2.5 py-1 rounded text-xs font-semibold transition-nova',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--nova-blue)]',
                scale === s
                  ? 'bg-[var(--btn-blue-bg)] border border-[var(--btn-blue-border)] text-[var(--btn-blue-text)]'
                  : 'text-[var(--nova-text-muted)] hover:text-[var(--nova-text)] hover:bg-white/5 border border-transparent',
              )}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
