'use client'

import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { UserPlus, RefreshCw, Edit, CheckCircle } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'

const USERS = [
  { id: '1', name: 'Admin Sistema',      email: 'admin@novapromotora.com',     role: 'ADMINISTRADOR',     initials: 'AD', color: 'red' },
  { id: '2', name: 'Gestor Comercial',   email: 'gestor@novapromotora.com',    role: 'GESTOR_COMERCIAL',  initials: 'GC', color: 'blue' },
  { id: '3', name: 'Marketing Analista', email: 'marketing3@novapromotora.com',role: 'ANALISTA',          initials: 'MK', color: 'green' },
  { id: '4', name: 'Executivo Comercial',email: 'exec@novapromotora.com',      role: 'EXECUTIVO_COMERCIAL', initials: 'EC', color: 'amber' },
]

const roleLabels: Record<string, string> = {
  ADMINISTRADOR:      'Administrador',
  GESTOR_COMERCIAL:   'Gestor Comercial',
  ANALISTA:           'Analista',
  EXECUTIVO_COMERCIAL:'Exec. Comercial',
  SOMENTE_LEITURA:    'Somente Leitura',
}

const roleColors: Record<string, string> = {
  ADMINISTRADOR:       'bg-red-600/10 border-red-600/25 text-red-400',
  GESTOR_COMERCIAL:    'bg-[var(--btn-blue-bg)] border-[var(--btn-blue-border)] text-[var(--btn-blue-text)]',
  ANALISTA:            'bg-emerald-500/10 border-emerald-500/25 text-emerald-400',
  EXECUTIVO_COMERCIAL: 'bg-amber-500/10 border-amber-500/25 text-amber-400',
  SOMENTE_LEITURA:     'bg-[var(--nova-bg-elev-2)] border-[var(--nova-border)] text-[var(--nova-text-dim)]',
}

const avatarColors: Record<string, string> = {
  red:   'bg-red-600/15 border-red-600/30 text-red-400',
  blue:  'bg-[var(--btn-blue-bg)] border-[var(--btn-blue-border)] text-[var(--btn-blue-text)]',
  green: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
  amber: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
}

const AUDIT_LOGS = [
  { id: '1', user: 'marketing3', action: 'EXPORT',  entity: 'campaign',  detail: '"Reativação Nordeste"', date: '28/05/26 14:17' },
  { id: '2', user: 'gestor',     action: 'SYNC',    entity: 'partner',   detail: '11.204 registros',     date: '28/05/26 08:32' },
  { id: '3', user: 'marketing3', action: 'CREATE',  entity: 'campaign',  detail: '"Ativos SP Faixa 1"',  date: '12/05/26 10:04' },
]

const actionColors: Record<string, string> = {
  EXPORT: 'text-[var(--btn-blue-text)]',
  SYNC:   'text-emerald-400',
  CREATE: 'text-[var(--nova-text-muted)]',
  UPDATE: 'text-amber-400',
  DELETE: 'text-red-400',
}

export default function AdminPage() {
  const { add: addToast } = useToast()

  return (
    <>
      <TopBar
        title="Administração"
        actions={
          <Button variant="primary" size="sm" onClick={() => addToast('info', 'Funcionalidade de convite em breve.')}>
            <UserPlus size={14} /> Novo usuário
          </Button>
        }
      />
      <main className="flex-1 overflow-auto p-5 space-y-5">

        {/* Cards de status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Sincronização Sheets */}
          <div className="rounded-md border border-[var(--nova-border)] bg-[var(--nova-bg-elev)] p-4">
            <p className="text-[0.625rem] font-medium uppercase tracking-widest text-[var(--nova-text-dim)] mb-3">
              Sincronização Google Sheets
            </p>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={14} className="text-emerald-400 flex-shrink-0" />
              <span className="text-sm font-semibold text-[var(--nova-text)]">Conectado</span>
            </div>
            <p className="text-xs text-[var(--nova-text-muted)] mb-3">
              Última sync: hoje, 08:32 ·{' '}
              <span className="text-emerald-400">Sucesso (11.204 linhas)</span>
            </p>
            <Button
              variant="blue"
              size="sm"
              onClick={() => addToast('info', 'Sync iniciada — acompanhe o progresso no log.')}
            >
              <RefreshCw size={14} /> Forçar sync
            </Button>
          </div>

          {/* Audit log summary */}
          <div className="rounded-md border border-[var(--nova-border)] bg-[var(--nova-bg-elev)] p-4">
            <p className="text-[0.625rem] font-medium uppercase tracking-widest text-[var(--nova-text-dim)] mb-3">
              Audit Log
            </p>
            <p className="text-xs text-[var(--nova-text-muted)] mb-2">3.842 eventos registrados</p>
            <p className="text-xs text-[var(--nova-text-muted)] mb-1">
              <span className="text-[var(--nova-text-dim)]">Último evento:</span>{' '}
              Exportação "Reativação Nordeste" — marketing3
            </p>
            <p className="text-[0.625rem] text-[var(--nova-text-dim)]">28/05/26 às 14:17</p>
          </div>
        </div>

        {/* Usuários */}
        <section aria-label="Usuários do sistema">
          <p className="text-sm font-semibold text-[var(--nova-text)] mb-3">Usuários do sistema</p>
          <div className="flex flex-col gap-2">
            {USERS.map(u => (
              <div
                key={u.id}
                className="flex items-center gap-3 rounded-md border border-[var(--nova-border)] bg-[var(--nova-bg-elev)] px-4 py-3"
              >
                <div
                  className={cn(
                    'h-9 w-9 flex-shrink-0 rounded-full border flex items-center justify-center text-xs font-bold',
                    avatarColors[u.color],
                  )}
                  aria-hidden
                >
                  {u.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--nova-text)] truncate">{u.name}</p>
                  <p className="text-xs text-[var(--nova-text-dim)] truncate">{u.email}</p>
                </div>
                <span className={cn('px-2 py-0.5 rounded-full border text-[0.625rem] font-medium flex-shrink-0', roleColors[u.role])}>
                  {roleLabels[u.role]}
                </span>
                <Button variant="ghost" size="sm" aria-label={`Editar ${u.name}`}>
                  <Edit size={14} />
                </Button>
              </div>
            ))}
          </div>
        </section>

        {/* Log recente */}
        <section aria-label="Últimas ações no audit log">
          <p className="text-sm font-semibold text-[var(--nova-text)] mb-3">Últimas ações</p>
          <div className="rounded-md border border-[var(--nova-border)] bg-[var(--nova-bg-elev)] overflow-hidden">
            <table className="w-full text-sm table-zebra" aria-label="Audit log">
              <thead>
                <tr className="bg-[var(--nova-bg-elev-2)]">
                  {['Usuário', 'Ação', 'Entidade', 'Detalhe', 'Data'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[0.625rem] font-medium uppercase tracking-wider text-[var(--nova-text-dim)]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--nova-border)]/50">
                {AUDIT_LOGS.map(log => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-nova">
                    <td className="px-4 py-2.5 text-[var(--nova-text-muted)] font-mono text-xs">{log.user}</td>
                    <td className="px-4 py-2.5">
                      <span className={cn('text-xs font-semibold', actionColors[log.action])}>{log.action}</span>
                    </td>
                    <td className="px-4 py-2.5 text-[var(--nova-text-dim)] text-xs">{log.entity}</td>
                    <td className="px-4 py-2.5 text-[var(--nova-text-muted)] text-xs">{log.detail}</td>
                    <td className="px-4 py-2.5 text-[var(--nova-text-dim)] text-xs">{log.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </main>
    </>
  )
}
