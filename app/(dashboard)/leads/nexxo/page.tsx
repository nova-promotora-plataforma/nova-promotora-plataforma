'use client'

import { useEffect, useState } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { KPICard } from '@/components/ui/KPICard'
import { Badge } from '@/components/ui/Badge'
import { Loader2 } from 'lucide-react'

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

interface Parceiro {
  codigo:     string
  nome:       string
  cidade:     string | null
  uf:         string | null
  ultimaProd: string | null
  total:      number
  status:     'ATIVO' | 'INATIVO'
}

interface Stats {
  totalLeads:     number
  jaParceiros:    number
  naoCadastrados: number
  taxaConversao:  number
}

export default function LeadsNexxoPage() {
  const [parceiros, setParceiros] = useState<Parceiro[]>([])
  const [stats,     setStats]     = useState<Stats | null>(null)
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    fetch('/api/leads/nexxo')
      .then(r => r.json())
      .then(d => { setParceiros(d.parceiros ?? []); setStats(d.stats ?? null) })
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <TopBar title="Leads Nexxo — Cruzamento com Parceiros" />
      <main className="flex-1 overflow-auto p-5 space-y-5">

        {/* Cabeçalho */}
        <div className="rounded-md border border-[var(--nova-border)] bg-[var(--nova-bg-elev)] px-5 py-4">
          <p className="text-sm font-semibold text-[var(--nova-text)]">Leads Nexxo × Base de Parceiros</p>
          <p className="text-xs text-[var(--nova-text-dim)] mt-0.5">
            Cruzamento por telefone — leads enviados ao comercial identificados na base atual de parceiros
          </p>
        </div>

        {/* KPIs */}
        {loading ? (
          <div className="flex items-center justify-center h-24 text-[var(--nova-text-dim)]">
            <Loader2 size={18} className="animate-spin mr-2" /> Cruzando bases…
          </div>
        ) : stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KPICard label="Leads na base"      value={stats.totalLeads.toLocaleString('pt-BR')}     sub="com telefone válido" />
            <KPICard label="Já são parceiros"   value={stats.jaParceiros.toLocaleString('pt-BR')}    sub={`${stats.taxaConversao}% dos leads`} />
            <KPICard label="Não cadastrados"    value={stats.naoCadastrados.toLocaleString('pt-BR')} sub="ainda não viraram parceiros" />
            <KPICard label="Taxa de conversão"  value={`${stats.taxaConversao}%`}                    sub="lead → parceiro cadastrado" />
          </div>
        )}

        {/* Tabela */}
        {!loading && (
          <div className="rounded-md border border-[var(--nova-border)] bg-[var(--nova-bg-elev)] overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--nova-border)]">
              <p className="text-sm font-semibold text-[var(--nova-text)]">
                {parceiros.length} parceiros identificados na base de leads
              </p>
              <p className="text-xs text-[var(--nova-text-dim)] mt-0.5">Ordenados por produção total acumulada</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--nova-bg-elev-2)]">
                    {['Código', 'Nome', 'Cidade / UF', 'Último prod.', 'Total acumulado', 'Status'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-[0.625rem] font-medium uppercase tracking-wider text-[var(--nova-text-dim)]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--nova-border)]/50">
                  {parceiros.map(p => (
                    <tr key={p.codigo} className="hover:bg-white/[0.02] transition-nova">
                      <td className="px-4 py-2.5 text-xs font-mono text-[var(--nova-text-dim)]">{p.codigo}</td>
                      <td className="px-4 py-2.5">
                        <p className="font-medium text-[var(--nova-text)] truncate max-w-[220px]">{p.nome}</p>
                      </td>
                      <td className="px-4 py-2.5 text-[var(--nova-text-muted)]">
                        {p.cidade && p.uf ? `${p.cidade} / ${p.uf}` : p.uf ?? '—'}
                      </td>
                      <td className="px-4 py-2.5 text-[var(--nova-text-muted)]">
                        {p.ultimaProd ?? '—'}
                      </td>
                      <td className="px-4 py-2.5 font-semibold text-[var(--nova-text)]">
                        {fmt(p.total)}
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge variant={p.status === 'ATIVO' ? 'ativo' : 'inativo'} dot>
                          {p.status === 'ATIVO' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </>
  )
}
