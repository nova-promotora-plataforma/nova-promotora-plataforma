'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, Megaphone, RefreshCw,
  Settings, ChevronLeft, ChevronRight, Building2, Layers,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { label: 'Principal', items: [
    { href: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/convenios',  icon: Layers,           label: 'Convênios' },
    { href: '/parceiros',  icon: Users,            label: 'Parceiros' },
    { href: '/campanhas',  icon: Megaphone,        label: 'Campanhas' },
  ]},
  { label: 'Sistema', items: [
    { href: '/sync',   icon: RefreshCw, label: 'Sincronização' },
    { href: '/admin',  icon: Settings,  label: 'Admin' },
  ]},
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      aria-label="Menu de navegação"
      className={cn(
        'flex h-screen flex-col border-r border-[var(--nova-border)] bg-[var(--nova-bg-elev)]',
        'transition-all duration-300 ease-in-out flex-shrink-0',
        collapsed ? 'w-14' : 'w-56',
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center border-b border-[var(--nova-border)] h-13',
        collapsed ? 'justify-center px-0 py-4' : 'px-4 py-4 gap-2',
      )}>
        <Building2 size={20} className="text-[var(--nova-blue)] flex-shrink-0" aria-hidden />
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-[var(--nova-text)] leading-none">Nova Promotora</p>
            <p className="text-[0.5625rem] font-medium uppercase tracking-widest text-[var(--nova-text-dim)] mt-0.5">
              Plataforma Comercial
            </p>
          </div>
        )}
      </div>

      {/* Navegação */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {NAV.map(section => (
          <div key={section.label}>
            {!collapsed && (
              <p className="px-2 pt-3 pb-1 text-[0.5625rem] font-medium uppercase tracking-widest text-[var(--nova-text-dim)]">
                {section.label}
              </p>
            )}
            {collapsed && <div className="h-3" />}
            {section.items.map(({ href, icon: Icon, label }) => {
              const active = pathname === href || pathname.startsWith(href + '/')
              return (
                <Link
                  key={href}
                  href={href}
                  aria-label={collapsed ? label : undefined}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-2.5 rounded-sm px-2 py-2 text-sm transition-nova',
                    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--nova-blue)]',
                    collapsed && 'justify-center',
                    active
                      ? 'bg-[var(--btn-blue-bg)] border border-[var(--btn-blue-border)] text-[var(--btn-blue-text)]'
                      : 'border border-transparent text-[var(--nova-text-muted)] hover:bg-white/[0.04] hover:text-[var(--nova-text)]',
                  )}
                >
                  <Icon size={16} className="flex-shrink-0" aria-hidden />
                  {!collapsed && <span className="truncate">{label}</span>}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Rodapé — avatar e colapso */}
      <div className="border-t border-[var(--nova-border)] p-2 flex flex-col gap-1">
        {!collapsed && (
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div
              className="h-7 w-7 flex-shrink-0 rounded-full bg-[var(--btn-blue-bg)] border border-[var(--btn-blue-border)] flex items-center justify-center text-[0.625rem] font-bold text-[var(--btn-blue-text)]"
              aria-hidden
            >
              MK
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-[var(--nova-text)] truncate">Marketing</p>
              <p className="text-[0.625rem] text-[var(--nova-text-dim)] truncate">Analista</p>
            </div>
          </div>
        )}
        <button
          onClick={onToggle}
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          className={cn(
            'flex items-center justify-center h-7 w-full rounded-sm border border-transparent',
            'text-[var(--nova-text-dim)] hover:text-[var(--nova-text)] hover:bg-white/5 transition-nova',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--nova-blue)]',
          )}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>
    </aside>
  )
}
