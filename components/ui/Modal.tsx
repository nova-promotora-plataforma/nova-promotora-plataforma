'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './Button'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const sizeMap = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl' }

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    panelRef.current?.focus()
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal
      aria-labelledby="modal-title"
    >
      {/* overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      {/* panel */}
      <div
        ref={panelRef}
        tabIndex={-1}
        className={cn(
          'relative w-full rounded-lg border bg-[var(--nova-bg-elev)] border-[var(--nova-border)]',
          'shadow-2xl outline-none',
          sizeMap[size],
        )}
      >
        <div className="flex items-center justify-between border-b border-[var(--nova-border)] px-5 py-4">
          <h2 id="modal-title" className="text-base font-semibold text-[var(--nova-text)]">{title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Fechar">
            <X size={16} />
          </Button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
