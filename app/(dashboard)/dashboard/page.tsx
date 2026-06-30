'use client'

import { useEffect, useState, useCallback } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { KPICard } from '@/components/ui/KPICard'
import { ProductionChart } from '@/components/charts/ProductionChart'
import { BarChart } from '@/components/charts/BarChart'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Megaphone, Loader2, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

function fmtCurrency(v: number) {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000)     return `R$ ${(v / 1_000).toFixed(1)}K`
  return `R$ ${v.toLocaleString('pt-BR')}`
}

interface KpiData {
  eligible:       number
  ativos:         number
  producaoTotal:  number
  mediaAtivo:     number
  taxaAtivos:     string
  productionData: { month: string; amount: number }[]
  ufTop6:         { label: string; value: number }[]
  alertPartners:  { nome: string; uf: string; lastMonth: string; total: number; status: string }[]
}

type SortDir = 'asc' | 'desc'
type SortCol = 'nome' | 'uf' | 'lastMonth' | 'total'

export default function DashboardPage() {
  const [data, setData]       = useState<KpiData | null>(null)
  const [loading, setLoading] = useState(true)
  const [sortCol, setSortCol] = useState<SortCol>('total')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  useEffect(() => {
    fetch('/api/dashboard/kpis')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  function toggleSort(col: SortCol) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  function SortIcon({ col }: { col: SortCol }) {
    if (sortCol !== col) return <ChevronsUpDown size={11} className="ml-1 opacity-30" />
    return sortDir === 'asc'
      ? <ChevronUp   size={11} className="ml-1 text-[var(--nova-blue)]" />
      : <ChevronDown size={11} className="ml-1 text-[var(--nova-blue)]" />
  }

  const sortedAlerts = useCallback(() => {
    if (!data?.alertPartners) return []
    return [...data.alertPartners].sort((a, b) => {
      let diff = 0
      if (sortCol === 'nome')      diff = a.nome.localeCompare(b.nome, 'pt-BR')
      else if (sortCol === 'uf')   diff = a.uf.localeCompare(b.uf)
      else if (sortCol === 'lastMonth') {
        const toNum = (m: string) => {
          const mm: Record<string,string> = { jan:'01',fev:'02',mar:'03',abr:'04',mai:'05',jun:'06',jul:'07',ago:'08',set:'09',out:'10',nov:'11',dez:'12' }
          const [mon, yr] = m.split('/')
          return parseInt(`20${yr}${mm[mon] ?? '00'}`) || 0
        }
        diff = toNum(a.lastMonth) - toNum(b.lastMonth)
      } else diff = a.total - b.total
      return sortDir === 'desc' ? -diff : diff
    })
  }, [data, sortCol, sortDir])()

  return (
    <>
      <TopBar title="Dashboard" />
      <main className="flex-1 overflow-auto p-5 space-y-5">

        {/* KPIs */}
        <section aria-label="Indicadores principais">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-md border border-[var(--nova-border)] bg-[var(--nova-bg-elev)] p-4 h-24 flex items-center justify-center">
                  <Loader2 size={18} className="animate-spin text-[var(--nova-text-dim)]" />
                </div>
              ))
            ) : data ? (
              <>
                <KPICard
                  label="Parceiros elegíveis"
                  value={data.eligible.toLocaleString('pt-BR')}
                  sub={`${data.ativos.toLocaleString('pt-BR')} ativos`}
                />
                <KPICard
                  label="Ativos (60 dias)"
                  value={data.ativos.toLocaleString('pt-BR')}
                  sub={`${data.taxaAtivos}% dos elegíveis`}
                />
                <KPICard
                  label="Produção total"
                  value={fmtCurrency(data.producaoTotal)}
                  sub={`${data.eligible.toLocaleString('pt-BR')} parceiros`}
                />
                <KPICard
                  label="Média por ativo"
                  value={fmtCurrency(data.mediaAtivo)}
                  sub={`${data.ativos.toLocaleString('pt-BR')} ativos`}
                />
              </>
            ) : (
              <p className="col-span-4 text-sm text-[var(--nova-text-dim)]">Erro ao carregar dados.</p>
            )}
          </div>
        </section>

        {/* Gráficos */}
        {data && (
          <section aria-label="Gráficos de produção">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ProductionChart data={data.productionData} title="Produção mensal (R$)" />
              <BarChart        data={data.ufTop6}         title="Parceiros por UF — top 6" />
            </div>
          </section>
        )}

        {/* Tabela de alertas */}
        <section aria-label="Parceiros em alerta de inatividade">
          <div className="rounded-md border border-[var(--nova-border)] bg-[var(--nova-bg-elev)] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--nova-border)]">
              <p className="text-sm font-semibold text-[var(--nova-text)]">
                Parceiros em alerta de inatividade
                <span className="ml-2 text-xs font-normal text-[var(--nova-text-dim)]">(últimos 30–90 dias)</span>
              </p>
              <Link href="/campanhas/nova">
                <Button variant="blue" size="sm">
                  <Megaphone size={14} /> Criar campanha
                </Button>
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm table-zebra" aria-label="Lista de parceiros em alerta">
                <thead>
                  <tr className="bg-[var(--nova-bg-elev-2)]">
                    {([
                      { label: 'Parceiro',        col: 'nome'      },
                      { label: 'UF',              col: 'uf'        },
                      { label: 'Último registro', col: 'lastMonth' },
                      { label: 'Total acumulado', col: 'total'     },
                      { label: 'Status',          col: null        },
                    ] as { label: string; col: SortCol | null }[]).map(({ label, col }) => (
                      <th
                        key={label}
                        onClick={col ? () => toggleSort(col) : undefined}
                        className={cn(
                          'px-4 py-2.5 text-left text-[0.625rem] font-medium uppercase tracking-wider text-[var(--nova-text-dim)]',
                          col && 'cursor-pointer hover:text-[var(--nova-text)] select-none'
                        )}
                      >
                        <span className="inline-flex items-center">
                          {label}{col && <SortIcon col={col} />}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--nova-border)]/50">
                  {loading ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-[var(--nova-text-dim)]">
                      <Loader2 size={16} className="animate-spin inline mr-2" />Carregando…
                    </td></tr>
                  ) : sortedAlerts.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-[var(--nova-text-dim)]">Nenhum parceiro em alerta.</td></tr>
                  ) : sortedAlerts.map((p, i) => (
                    <tr key={i} className="hover:bg-white/[0.02] transition-nova">
                      <td className="px-4 py-2.5 font-medium text-[var(--nova-text)]">{p.nome}</td>
                      <td className="px-4 py-2.5 text-[var(--nova-text-muted)]">{p.uf}</td>
                      <td className="px-4 py-2.5 text-[var(--nova-text-muted)]">{p.lastMonth}</td>
                      <td className="px-4 py-2.5 text-[var(--nova-text-muted)]">
                        {p.total.toLocaleString('pt-BR', { style:'currency', currency:'BRL', maximumFractionDigits:0 })}
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge variant="inativo" dot>Inativo</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

      </main>
    </>
  )
}
