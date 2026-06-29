'use client'

import { Search, Bell, Sun, Moon } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'
import { AccessibilityButton } from './AccessibilityButton'
import { cn } from '@/lib/utils'

interface TopBarProps {
  title: string
  actions?: React.ReactNode
}

export function TopBar({ title, actions }: TopBarProps) {
  const { theme, toggle } = useTheme()

  return (
    <header className="flex h-13 items-center gap-3 border-b border-[var(--nova-border)] bg-[var(--nova-bg-elev)] px-5 flex-shrink-0">
      <h1 className="text-[0.9375rem] font-semibold text-[var(--nova-text)] flex-1 truncate">{title}</h1>

      {/* Busca global */}
      <div
        role="search"
        className={cn(
          'hidden sm:flex items-center gap-2 rounded-sm border border-[var(--nova-border)]',
          'bg-white/[0.04] px-3 py-1.5 w-52 text-sm text-[var(--nova-text-dim)]',
          'focus-within:border-[var(--nova-blue)]/50 transition-nova',
        )}
      >
        <Search size={13} aria-hidden />
        <input
          type="search"
          placeholder="Busca global…"
          aria-label="Busca global"
          className="bg-transparent outline-none w-full text-xs text-[var(--nova-text)] placeholder:text-[var(--nova-text-dim)]"
        />
      </div>

      {/* Ações extras */}
      {actions}

      {/* Notificações */}
      <button
        aria-label="Notificações"
        className={cn(
          'relative flex h-8 w-8 items-center justify-center rounded-sm border border-[var(--nova-border)]',
          'text-[var(--nova-text-muted)] hover:bg-white/5 hover:text-[var(--nova-text)] transition-nova',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--nova-blue)]',
        )}
      >
        <Bell size={15} />
        {/* ponto de alerta */}
        <span
          className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-[var(--nova-red)] border border-[var(--nova-bg-elev)]"
          aria-hidden
        />
      </button>

      {/* Toggle tema */}
      <button
        onClick={toggle}
        aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-sm border border-[var(--nova-border)]',
          'text-[var(--nova-text-muted)] hover:bg-white/5 hover:text-[var(--nova-text)] transition-nova',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--nova-blue)]',
        )}
      >
        {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
      </button>

      {/* Acessibilidade */}
      <AccessibilityButton />
    </header>
  )
}
