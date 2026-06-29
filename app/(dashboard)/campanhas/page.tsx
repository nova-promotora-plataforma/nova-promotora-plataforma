import Link from 'next/link'
import { TopBar } from '@/components/layout/TopBar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Plus, Download } from 'lucide-react'

const CAMPAIGNS = [
  { id: '1', name: 'Reativação Nordeste mai/26', count: 632,   date: '28/05/26', status: 'exported' as const },
  { id: '2', name: 'Ativos SP Faixa 1',          count: 1840,  date: '12/05/26', status: 'active'   as const },
  { id: '3', name: 'Base Geral abr/26',           count: 8104,  date: '02/04/26', status: 'archived' as const },
]

const statusLabel: Record<string, string> = {
  draft:    'Rascunho',
  active:   'Ativa',
  exported: 'Exportada',
  archived: 'Arquivada',
}

const statusVariant: Record<string, 'default' | 'ativo' | 'blue' | 'archived'> = {
  draft:    'default',
  active:   'blue',
  exported: 'ativo',
  archived: 'archived',
}

export default function CampanhasPage() {
  return (
    <>
      <TopBar
        title="Campanhas"
        actions={
          <Link href="/campanhas/nova">
            <Button variant="primary" size="sm">
              <Plus size={14} /> Nova campanha
            </Button>
          </Link>
        }
      />
      <main className="flex-1 overflow-auto p-5">
        <div className="rounded-md border border-[var(--nova-border)] bg-[var(--nova-bg-elev)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-zebra" aria-label="Histórico de campanhas">
              <thead>
                <tr className="bg-[var(--nova-bg-elev-2)]">
                  {['Nome', 'Parceiros', 'Criada em', 'Status', ''].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[0.625rem] font-medium uppercase tracking-wider text-[var(--nova-text-dim)]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--nova-border)]/50">
                {CAMPAIGNS.map(c => (
                  <tr key={c.id} className="hover:bg-white/[0.02] transition-nova">
                    <td className="px-4 py-2.5 font-medium text-[var(--nova-text)]">{c.name}</td>
                    <td className="px-4 py-2.5 text-[var(--nova-text-muted)]">
                      {new Intl.NumberFormat('pt-BR').format(c.count)}
                    </td>
                    <td className="px-4 py-2.5 text-[var(--nova-text-muted)]">{c.date}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant={statusVariant[c.status] ?? 'default'} dot>
                        {statusLabel[c.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5">
                      <Button variant="ghost" size="sm" aria-label={`Baixar ${c.name}`}>
                        <Download size={14} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  )
}
