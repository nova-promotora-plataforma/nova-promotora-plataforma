'use client'

import { useEffect, useState, useMemo } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { KPICard } from '@/components/ui/KPICard'
import { ProductionChart } from '@/components/charts/ProductionChart'
import { Badge } from '@/components/ui/Badge'
import { Loader2, Search, ChevronLeft, ChevronRight, Download } from 'lucide-react'
import { cn } from '@/lib/utils'

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

function fmtShort(v: number) {
  if (v >= 1_000_000_000) return `R$ ${(v / 1_000_000_000).toFixed(1)}B`
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000)     return `R$ ${(v / 1_000).toFixed(0)}K`
  return fmt(v)
}

const PAGE_SIZE = 50

interface Partner {
  rank: number
  codigo: string
  nome: string
  uf: string | null
  total: number
  lastMonth: string | null
  status: 'ativo' | 'inativo'
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
  partners: Partner[]
}

const TAB_COLORS: Record<string, string> = {
  inss:                'var(--nova-blue)',
  fgts:                '#34d399',
  credito_trabalhador: '#f59e0b',
  demais:              '#a78bfa',
}

type StatusFilter = 'todos' | 'ativo' | 'inativo'

export default function ConveniosPage() {
  const [data, setData]         = useState<ConvenioData[]>([])
  const [loading, setLoading]   = useState(true)
  const [active, setActive]     = useState(0)
  const [busca, setBusca]       = useState('')
  const [statusFiltro, setStatusFiltro] = useState<StatusFilter>('todos')
  const [page, setPage]         = useState(1)

  useEffect(() => {
    fetch('/api/dashboard/convenios')
      .then(r => r.json())
      .then(d => { setData(d.convenios ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  // Reset paginação ao trocar aba ou filtro
  useEffect(() => { setPage(1); setBusca(''); setStatusFiltro('todos') }, [active])
  useEffect(() => { setPage(1) }, [busca, statusFiltro])

  const conv = data[active]

  const filtered = useMemo(() => {
    if (!conv) return []
    return conv.partners.filter(p => {
      const q = busca.toLowerCase()
      const matchBusca = !q || p.nome.toLowerCase().includes(q) || p.codigo.includes(q) || (p.uf ?? '').toLowerCase().includes(q)
      const matchStatus = statusFiltro === 'todos' || p.status === statusFiltro
      return matchBusca && matchStatus
    })
  }, [conv, busca, statusFiltro])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function exportCSV() {
    if (!conv) return
    const src = statusFiltro !== 'todos' || busca ? filtered : conv.partners
    const header = ['Rank', 'Código', 'Nome', 'UF', 'Último Prod.', 'Status', 'Total (R$)']
    const rows = src.map(p => [
      p.rank, p.codigo, p.nome, p.uf ?? '', p.lastMonth ?? '', p.status, p.total,
    ])
    const csv = [header, ...rows]
      .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';'))
      .join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `parceiros_${conv.key}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const tabColor = conv ? TAB_COLORS[conv.key] : 'var(--nova-blue)'

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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <KPICard
                label="Produção total"
                value={fmtShort(conv.totalProducao)}
                sub={`${(conv.ativos + conv.inativos).toLocaleString('pt-BR')} parceiros elegíveis`}
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
                sub={`${conv.ativos.toLocaleString('pt-BR')} ativos`}
              />
            </div>

            {/* Gráfico */}
            <ProductionChart
              data={conv.productionData}
              title={`Produção mensal — ${conv.label} (últimos 12 meses)`}
            />

            {/* Tabela de parceiros */}
            <div className="rounded-md border border-[var(--nova-border)] bg-[var(--nova-bg-elev)] overflow-hidden">

              {/* Header da tabela */}
              <div className="px-4 py-3 border-b border-[var(--nova-border)] flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--nova-text)]">
                    Parceiros — {conv.label}
                  </p>
                  <p className="text-xs text-[var(--nova-text-dim)] mt-0.5">
                    {filtered.length.toLocaleString('pt-BR')} de {conv.partners.length.toLocaleString('pt-BR')} parceiros
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Busca */}
                  <div className="relative">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--nova-text-dim)]" />
                    <input
                      type="text"
                      placeholder="Nome, código, UF…"
                      value={busca}
                      onChange={e => setBusca(e.target.value)}
                      className="pl-8 pr-3 py-1.5 text-xs rounded-sm border border-[var(--nova-border)] bg-[var(--nova-bg-elev-2)] text-[var(--nova-text)] placeholder:text-[var(--nova-text-dim)] focus:outline-none focus:border-[var(--nova-blue)]/60 w-48"
                    />
                  </div>

                  {/* Filtro status */}
                  <div className="flex gap-1">
                    {(['todos', 'ativo', 'inativo'] as StatusFilter[]).map(s => (
                      <button
                        key={s}
                        onClick={() => setStatusFiltro(s)}
                        className={cn(
                          'px-3 py-1.5 text-xs rounded-sm border transition-nova capitalize',
                          statusFiltro === s
                            ? 'bg-[var(--btn-blue-bg)] border-[var(--btn-blue-border)] text-[var(--btn-blue-text)]'
                            : 'border-[var(--nova-border)] text-[var(--nova-text-muted)] hover:text-[var(--nova-text)] hover:border-[var(--nova-blue)]/40',
                        )}
                      >
                        {s === 'todos' ? 'Todos' : s === 'ativo' ? 'Ativos' : 'Inativos'}
                      </button>
                    ))}
                  </div>

                  {/* Export */}
                  <button
                    onClick={exportCSV}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-sm border border-[var(--nova-border)] text-[var(--nova-text-muted)] hover:text-[var(--nova-text)] hover:bg-[var(--nova-bg-elev-2)] transition-nova"
                  >
                    <Download size={12} /> Exportar CSV
                  </button>
                </div>
              </div>

              {/* Tabela */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[var(--nova-bg-elev-2)]">
                      <th className="px-4 py-2.5 text-left text-[0.625rem] font-medium uppercase tracking-wider text-[var(--nova-text-dim)] w-10">#</th>
                      <th className="px-4 py-2.5 text-left text-[0.625rem] font-medium uppercase tracking-wider text-[var(--nova-text-dim)]">Parceiro</th>
                      <th className="px-4 py-2.5 text-left text-[0.625rem] font-medium uppercase tracking-wider text-[var(--nova-text-dim)]">UF</th>
                      <th className="px-4 py-2.5 text-left text-[0.625rem] font-medium uppercase tracking-wider text-[var(--nova-text-dim)]">Status</th>
                      <th className="px-4 py-2.5 text-left text-[0.625rem] font-medium uppercase tracking-wider text-[var(--nova-text-dim)]">Último prod.</th>
                      <th className="px-4 py-2.5 text-right text-[0.625rem] font-medium uppercase tracking-wider text-[var(--nova-text-dim)]">Total acumulado</th>
                      <th className="px-4 py-2.5 text-right text-[0.625rem] font-medium uppercase tracking-wider text-[var(--nova-text-dim)]">% do total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--nova-border)]/50">
                    {paged.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-10 text-center text-sm text-[var(--nova-text-dim)]">
                          Nenhum parceiro encontrado
                        </td>
                      </tr>
                    ) : paged.map(p => (
                      <tr key={`${p.codigo}-${p.rank}`} className="hover:bg-white/[0.02] transition-nova">
                        <td className="px-4 py-2.5 text-xs text-[var(--nova-text-dim)] font-mono">{p.rank}</td>
                        <td className="px-4 py-2.5">
                          <p className="font-medium text-[var(--nova-text)] truncate max-w-[200px]">{p.nome}</p>
                          <p className="text-[0.625rem] text-[var(--nova-text-dim)] font-mono mt-0.5">{p.codigo}</p>
                        </td>
                        <td className="px-4 py-2.5 text-[var(--nova-text-muted)] text-xs">{p.uf ?? '—'}</td>
                        <td className="px-4 py-2.5">
                          <Badge variant={p.status === 'ativo' ? 'ativo' : 'inativo'} dot>
                            {p.status === 'ativo' ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-[var(--nova-text-muted)]">
                          {p.lastMonth ?? '—'}
                        </td>
                        <td className="px-4 py-2.5 text-right font-semibold text-[var(--nova-text)] text-xs">
                          {fmt(p.total)}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-1 rounded-full bg-[var(--nova-bg-elev-2)] overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: conv.totalProducao > 0
                                    ? Math.min((p.total / conv.totalProducao) * 100, 100) + '%'
                                    : '0%',
                                  background: tabColor,
                                }}
                              />
                            </div>
                            <span className="text-[0.625rem] text-[var(--nova-text-dim)] w-10 text-right">
                              {conv.totalProducao > 0
                                ? ((p.total / conv.totalProducao) * 100).toFixed(2) + '%'
                                : '—'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="px-4 py-3 border-t border-[var(--nova-border)] flex items-center justify-between">
                  <span className="text-xs text-[var(--nova-text-dim)]">
                    Página {page} de {totalPages} · {filtered.length.toLocaleString('pt-BR')} parceiros
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-1.5 rounded border border-[var(--nova-border)] text-[var(--nova-text-muted)] hover:text-[var(--nova-text)] hover:bg-[var(--nova-bg-elev-2)] disabled:opacity-30 disabled:cursor-not-allowed transition-nova"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let p: number
                      if (totalPages <= 5) p = i + 1
                      else if (page <= 3) p = i + 1
                      else if (page >= totalPages - 2) p = totalPages - 4 + i
                      else p = page - 2 + i
                      return (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={cn(
                            'w-8 h-8 rounded border text-xs transition-nova',
                            page === p
                              ? 'border-[var(--nova-blue)]/60 text-[var(--nova-text)] font-semibold'
                              : 'border-[var(--nova-border)] text-[var(--nova-text-muted)] hover:text-[var(--nova-text)] hover:bg-[var(--nova-bg-elev-2)]',
                          )}
                          style={page === p ? { background: `${tabColor}18`, borderColor: tabColor } : undefined}
                        >
                          {p}
                        </button>
                      )
                    })}
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="p-1.5 rounded border border-[var(--nova-border)] text-[var(--nova-text-muted)] hover:text-[var(--nova-text)] hover:bg-[var(--nova-bg-elev-2)] disabled:opacity-30 disabled:cursor-not-allowed transition-nova"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

      </main>
    </>
  )
}
