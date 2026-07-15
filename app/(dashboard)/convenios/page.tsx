'use client'

import { useEffect, useState } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { KPICard } from '@/components/ui/KPICard'
import { ProductionChart } from '@/components/charts/ProductionChart'
import { Badge } from '@/components/ui/Badge'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

function fmtShort(v: number) {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000)     return `R$ ${(v / 1_000).toFixed(0)}K`
  return fmt(v)
}

interface TopPartner {
  codigo: string
  nome: string
  uf: string | null
  total: number
  lastMonth: string | null
}

interface ConvenioData {
  key: string
  label: string
  totalProducao: number
  ativos: number
  inativos: number
  mediaAtivo: number
  taxaAtivos: string
  productionData: { month: string; amount: number }[]
  topPartners: TopPartner[]
}

const TAB_COLORS: Record<string, string> = {
  inss:                'var(--nova-blue)',
  fgts:                '#34d399',
  credito_trabalhador: '#f59e0b',
  demais:              '#a78bfa',
}

export default function ConveniosPage() {
  const [data, setData]       = useState<ConvenioData[]>([])
  const [loading, setLoading] = useState(true)
  const [active, setActive]   = useState(0)

  useEffect(() => {
    fetch('/api/dashboard/convenios')
      .then(r => r.json())
      .then(d => { setData(d.convenios ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const conv = data[active]

  return (
    <>
      <TopBar title="Dashboard por Convênio" />
      <main className="flex-1 overflow-auto p-5 space-y-5">

        {/* Abas */}
        <div className="flex gap-1 border-b border-[var(--nova-border)]">
          {loading
            ? ['INSS', 'FGTS', 'Crédito Trabalhador', 'Demais Convênios'].map(l => (
                <div key={l} className="px-4 py-2.5 text-sm text-[var(--nova-text-dim)] opacity-40">{l}</div>
              ))
            : data.map((c, i) => (
                <button
                  key={c.key}
                  onClick={() => setActive(i)}
                  className={cn(
                    'px-4 py-2.5 text-sm font-medium transition-nova border-b-2 -mb-px',
                    active === i
                      ? 'text-[var(--nova-text)] border-current'
                      : 'text-[var(--nova-text-muted)] border-transparent hover:text-[var(--nova-text)]',
                  )}
                  style={active === i ? { color: TAB_COLORS[c.key], borderColor: TAB_COLORS[c.key] } : undefined}
                >
                  {c.label}
                </button>
              ))
          }
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48 text-[var(--nova-text-dim)]">
            <Loader2 size={20} className="animate-spin mr-2" /> Carregando dados…
          </div>
        ) : !conv ? null : (
          <>
            {/* KPIs */}
            <section>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <KPICard
                  label="Produção total"
                  value={fmtShort(conv.totalProducao)}
                  sub={`${conv.ativos + conv.inativos} parceiros elegíveis`}
                />
                <KPICard
                  label="Parceiros ativos"
                  value={conv.ativos.toLocaleString('pt-BR')}
                  sub={`${conv.taxaAtivos}% dos elegíveis`}
                />
                <KPICard
                  label="Inativos"
                  value={conv.inativos.toLocaleString('pt-BR')}
                  sub="sem produção nos últimos 60 dias"
                />
                <KPICard
                  label="Média por ativo"
                  value={fmtShort(conv.mediaAtivo)}
                  sub={`${conv.ativos} ativos`}
                />
              </div>
            </section>

            {/* Gráfico + Top parceiros */}
            <section>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                <ProductionChart
                  data={conv.productionData}
                  title={`Produção mensal — ${conv.label} (últimos 12 meses)`}
                />

                {/* Top 10 parceiros */}
                <div className="rounded-md border border-[var(--nova-border)] bg-[var(--nova-bg-elev)] overflow-hidden">
                  <div className="px-4 py-3 border-b border-[var(--nova-border)]">
                    <p className="text-sm font-semibold text-[var(--nova-text)]">
                      Top 10 parceiros — {conv.label}
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[var(--nova-bg-elev-2)]">
                          <th className="px-4 py-2 text-left text-[0.625rem] font-medium uppercase tracking-wider text-[var(--nova-text-dim)] w-8">#</th>
                          <th className="px-4 py-2 text-left text-[0.625rem] font-medium uppercase tracking-wider text-[var(--nova-text-dim)]">Parceiro</th>
                          <th className="px-4 py-2 text-left text-[0.625rem] font-medium uppercase tracking-wider text-[var(--nova-text-dim)]">UF</th>
                          <th className="px-4 py-2 text-left text-[0.625rem] font-medium uppercase tracking-wider text-[var(--nova-text-dim)]">Último prod.</th>
                          <th className="px-4 py-2 text-right text-[0.625rem] font-medium uppercase tracking-wider text-[var(--nova-text-dim)]">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--nova-border)]/50">
                        {conv.topPartners.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-[var(--nova-text-dim)]">
                              Sem dados de produção.
                            </td>
                          </tr>
                        ) : conv.topPartners.map((p, i) => (
                          <tr key={p.codigo} className="hover:bg-white/[0.02] transition-nova">
                            <td className="px-4 py-2.5 text-[var(--nova-text-dim)] text-xs font-mono">{i + 1}</td>
                            <td className="px-4 py-2.5">
                              <p className="font-medium text-[var(--nova-text)] truncate max-w-[160px]">{p.nome}</p>
                              <p className="text-[0.625rem] text-[var(--nova-text-dim)] font-mono">{p.codigo}</p>
                            </td>
                            <td className="px-4 py-2.5 text-[var(--nova-text-muted)]">{p.uf ?? '—'}</td>
                            <td className="px-4 py-2.5">
                              <Badge variant={p.lastMonth ? 'ativo' : 'inativo'} dot>
                                {p.lastMonth ?? '—'}
                              </Badge>
                            </td>
                            <td className="px-4 py-2.5 text-right font-semibold text-[var(--nova-text)]">
                              {fmt(p.total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </section>
          </>
        )}

      </main>
    </>
  )
}
