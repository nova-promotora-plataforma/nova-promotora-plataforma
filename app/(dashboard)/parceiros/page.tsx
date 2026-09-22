'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { TopBar } from '@/components/layout/TopBar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Megaphone, Eye, ChevronLeft, ChevronRight, Filter, Loader2, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 20

const ANOS  = Array.from({ length: 2026 - 2022 + 1 }, (_, i) => 2022 + i)
const MESES = [
  { v: 1, l: 'Janeiro' }, { v: 2, l: 'Fevereiro' }, { v: 3, l: 'Março' },
  { v: 4, l: 'Abril' },   { v: 5, l: 'Maio' },       { v: 6, l: 'Junho' },
  { v: 7, l: 'Julho' },   { v: 8, l: 'Agosto' },     { v: 9, l: 'Setembro' },
  { v: 10, l: 'Outubro' },{ v: 11, l: 'Novembro' },  { v: 12, l: 'Dezembro' },
]

interface Partner {
  id: string
  codigo: string
  nome: string
  funcionarioCidade: string | null
  uf: string | null
  status: 'ATIVO' | 'INATIVO'
  totalProducao: number
  lastProductionMonth: string | null
}

interface ApiResponse {
  data: Partner[]
  total: number
  page: number
  pages: number
  totalAtivos: number
  totalInativos: number
}

const UFS = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO']

function formatCurrency(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
}

const SELECT_CLS = cn(
  'rounded-sm border bg-[var(--nova-bg-elev)] px-3 py-2 text-sm text-[var(--nova-text)]',
  'border-[var(--nova-border)] outline-none transition-nova cursor-pointer',
  'focus:border-[var(--nova-blue)]/50',
)

export default function ParceirosPage() {
  const [data, setData]         = useState<Partner[]>([])
  const [total, setTotal]       = useState(0)
  const [pages, setPages]       = useState(1)
  const [page, setPage]         = useState(1)
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState<string[]>([])
  const [totalAtivos, setTotalAtivos]     = useState(0)
  const [totalInativos, setTotalInativos] = useState(0)

  // filtros
  const [busca, setBusca]   = useState('')
  const [status, setStatus] = useState('')
  const [uf, setUf]         = useState('')
  const [ano, setAno]       = useState('')
  const [mes, setMes]       = useState('')
  const [applied, setApplied] = useState({ busca: '', status: '', uf: '', ano: '', mes: '' })
  const [sortBy,  setSortBy]  = useState('totalProducao')
  const [sortDir, setSortDir] = useState('desc')

  function toggleSort(col: string) {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(col); setSortDir('asc') }
  }

  function SortIcon({ col }: { col: string }) {
    if (sortBy !== col) return <ChevronsUpDown size={11} className="ml-1 opacity-30" />
    return sortDir === 'asc'
      ? <ChevronUp   size={11} className="ml-1 text-[var(--nova-blue)]" />
      : <ChevronDown size={11} className="ml-1 text-[var(--nova-blue)]" />
  }

  const load = useCallback(async (p: number, filters: typeof applied, sb = sortBy, sd = sortDir) => {
    setLoading(true)
    setSelected([])
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(PAGE_SIZE), sortBy: sb, sortDir: sd })
      if (filters.busca)  params.set('q', filters.busca)
      if (filters.status) params.set('status', filters.status)
      if (filters.uf)     params.set('uf', filters.uf)
      if (filters.ano)    params.set('ano', filters.ano)
      if (filters.ano && filters.mes) params.set('mes', filters.mes)

      const res  = await fetch(`/api/parceiros?${params}`)
      if (!res.ok) throw new Error('Erro ao carregar parceiros')
      const json: ApiResponse = await res.json()
      setData(json.data)
      setTotal(json.total)
      setPages(json.pages)
      setPage(json.page)
      setTotalAtivos(json.totalAtivos ?? 0)
      setTotalInativos(json.totalInativos ?? 0)
    } catch {
      setData([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(1, applied, sortBy, sortDir) }, [load, applied, sortBy, sortDir])

  function applyFilters() {
    setApplied({ busca, status, uf, ano, mes: ano ? mes : '' })
  }

  function clearPeriodo() {
    setAno('')
    setMes('')
    setApplied(a => ({ ...a, ano: '', mes: '' }))
  }

  function goTo(p: number) { load(p, applied, sortBy, sortDir) }

  function toggleSelect(id: string) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }
  function toggleAll() {
    setSelected(prev => prev.length === data.length ? [] : data.map(p => p.id))
  }

  const pageNumbers = () => {
    const nums: (number | '...')[] = []
    if (pages <= 7) {
      for (let i = 1; i <= pages; i++) nums.push(i)
    } else {
      nums.push(1)
      if (page > 3) nums.push('...')
      for (let i = Math.max(2, page - 1); i <= Math.min(pages - 1, page + 1); i++) nums.push(i)
      if (page < pages - 2) nums.push('...')
      nums.push(pages)
    }
    return nums
  }

  const totalGeral = totalAtivos + totalInativos
  const pctAtivos  = totalGeral > 0 ? ((totalAtivos / totalGeral) * 100).toFixed(1) : '0'
  const pctInativos = totalGeral > 0 ? ((totalInativos / totalGeral) * 100).toFixed(1) : '0'

  const periodoLabel = applied.ano
    ? applied.mes
      ? `${MESES.find(m => String(m.v) === applied.mes)?.l ?? applied.mes}/${applied.ano}`
      : String(applied.ano)
    : null

  return (
    <>
      <TopBar
        title="Parceiros"
        actions={
          selected.length > 0 ? (
            <Link href="/campanhas/nova">
              <Button variant="blue" size="sm">
                <Megaphone size={14} />
                Campanha com {selected.length} selecionado{selected.length > 1 ? 's' : ''}
              </Button>
            </Link>
          ) : undefined
        }
      />

      <main className="flex-1 overflow-auto p-5">

        {/* Cards de resumo */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <button
            onClick={() => { setStatus(s => s === 'ATIVO' ? '' : 'ATIVO'); setApplied(a => ({ ...a, status: a.status === 'ATIVO' ? '' : 'ATIVO' })) }}
            className={cn(
              'text-left rounded-md border p-4 transition-nova cursor-pointer',
              applied.status === 'ATIVO'
                ? 'border-emerald-500/50 bg-emerald-500/10'
                : 'border-[var(--nova-border)] bg-[var(--nova-bg-elev)] hover:border-emerald-500/30',
            )}
          >
            <p className="text-xs font-medium text-[var(--nova-text-dim)] mb-1">Ativos</p>
            <div className="flex items-baseline gap-3">
              <p className={cn('text-2xl font-bold', applied.status === 'ATIVO' ? 'text-emerald-400' : 'text-emerald-500')}>
                {loading ? '—' : totalAtivos.toLocaleString('pt-BR')}
              </p>
              {!loading && totalGeral > 0 && (
                <span className="text-sm font-medium text-emerald-500/70">{pctAtivos}%</span>
              )}
            </div>
            <p className="text-xs text-[var(--nova-text-dim)] mt-0.5">pagamento nos últimos 60 dias</p>
          </button>
          <button
            onClick={() => { setStatus(s => s === 'INATIVO' ? '' : 'INATIVO'); setApplied(a => ({ ...a, status: a.status === 'INATIVO' ? '' : 'INATIVO' })) }}
            className={cn(
              'text-left rounded-md border p-4 transition-nova cursor-pointer',
              applied.status === 'INATIVO'
                ? 'border-amber-500/50 bg-amber-500/10'
                : 'border-[var(--nova-border)] bg-[var(--nova-bg-elev)] hover:border-amber-500/30',
            )}
          >
            <p className="text-xs font-medium text-[var(--nova-text-dim)] mb-1">Inativos</p>
            <div className="flex items-baseline gap-3">
              <p className={cn('text-2xl font-bold', applied.status === 'INATIVO' ? 'text-amber-400' : 'text-amber-500')}>
                {loading ? '—' : totalInativos.toLocaleString('pt-BR')}
              </p>
              {!loading && totalGeral > 0 && (
                <span className="text-sm font-medium text-amber-500/70">{pctInativos}%</span>
              )}
            </div>
            <p className="text-xs text-[var(--nova-text-dim)] mt-0.5">sem pagamento há mais de 60 dias</p>
          </button>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-2 mb-4" role="search" aria-label="Filtros de parceiros">
          <input
            type="search"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && applyFilters()}
            placeholder="Nome ou código…"
            aria-label="Buscar por nome ou código"
            className={cn(
              'rounded-sm border bg-white/[0.04] px-3 py-2 text-sm text-[var(--nova-text)]',
              'placeholder:text-[var(--nova-text-dim)] border-[var(--nova-border)] outline-none',
              'focus:border-[var(--nova-blue)]/50 transition-nova w-48',
            )}
          />
          <select value={applied.status} onChange={e => { setStatus(e.target.value); setApplied(a => ({ ...a, status: e.target.value })) }} aria-label="Filtrar por status" className={SELECT_CLS}>
            <option value="">Todos status</option>
            <option value="ATIVO">Ativo</option>
            <option value="INATIVO">Inativo</option>
          </select>
          <select value={uf} onChange={e => setUf(e.target.value)} aria-label="Filtrar por UF" className={SELECT_CLS}>
            <option value="">Todos UFs</option>
            {UFS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>

          {/* Filtro de período */}
          <select value={ano} onChange={e => { setAno(e.target.value); if (!e.target.value) setMes('') }} aria-label="Filtrar por ano" className={SELECT_CLS}>
            <option value="">Todos anos</option>
            {ANOS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          {ano && (
            <select value={mes} onChange={e => setMes(e.target.value)} aria-label="Filtrar por mês" className={SELECT_CLS}>
              <option value="">Todos meses</option>
              {MESES.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
            </select>
          )}

          <Button variant="blue" size="sm" onClick={applyFilters}>
            <Filter size={14} /> Filtrar
          </Button>
          <div className="ml-auto">
            <Link href="/campanhas/nova">
              <Button variant="primary" size="sm">
                <Megaphone size={14} /> Nova campanha
              </Button>
            </Link>
          </div>
        </div>

        {/* Contagem */}
        <p className="text-xs text-[var(--nova-text-dim)] mb-3">
          {loading ? 'Carregando…' : (
            <>
              {total.toLocaleString('pt-BR')} parceiros
              {applied.status ? ` ${applied.status === 'ATIVO' ? 'ativos' : 'inativos'}` : ''}
              {periodoLabel ? <> · período: <span className="text-[var(--nova-text)]">{periodoLabel}</span> <button onClick={clearPeriodo} className="text-[var(--nova-blue)] hover:underline ml-1">limpar</button></> : ''}
            </>
          )}
        </p>

        {/* Tabela */}
        <div className="rounded-md border border-[var(--nova-border)] bg-[var(--nova-bg-elev)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-zebra" aria-label="Lista de parceiros">
              <thead>
                <tr className="bg-[var(--nova-bg-elev-2)]">
                  <th className="px-4 py-2.5 w-10">
                    <input
                      type="checkbox"
                      checked={data.length > 0 && selected.length === data.length}
                      onChange={toggleAll}
                      aria-label="Selecionar todos"
                      className="accent-[var(--nova-blue)] cursor-pointer"
                    />
                  </th>
                  {([
                    { label: 'Código',         col: 'codigo' },
                    { label: 'Nome',            col: 'nome' },
                    { label: 'Cidade / UF',     col: 'funcionarioCidade' },
                    { label: periodoLabel ? `Prod. ${periodoLabel}` : 'Total acumulado', col: 'totalProducao' },
                    { label: 'Último prod.',    col: 'lastProductionMonth' },
                    { label: 'Status',          col: 'status' },
                    { label: '',                col: null },
                  ] as { label: string; col: string | null }[]).map(({ label, col }) => (
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
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-[var(--nova-text-dim)]">
                      <Loader2 size={20} className="animate-spin inline mr-2" />
                      Carregando parceiros…
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-[var(--nova-text-dim)]">
                      Nenhum parceiro encontrado com os filtros aplicados.
                    </td>
                  </tr>
                ) : data.map(p => (
                  <tr key={p.id} className="hover:bg-white/[0.02] transition-nova">
                    <td className="px-4 py-2.5">
                      <input
                        type="checkbox"
                        checked={selected.includes(p.id)}
                        onChange={() => toggleSelect(p.id)}
                        aria-label={`Selecionar ${p.nome}`}
                        className="accent-[var(--nova-blue)] cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-2.5 text-[0.6875rem] text-[var(--nova-text-dim)] font-mono">
                      {p.codigo}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-[var(--nova-text)]">{p.nome}</td>
                    <td className="px-4 py-2.5 text-[var(--nova-text-muted)]">
                      {p.funcionarioCidade ?? '—'}{p.uf ? ` / ${p.uf}` : ''}
                    </td>
                    <td className="px-4 py-2.5 text-[var(--nova-text-muted)] font-medium">
                      {formatCurrency(Number(p.totalProducao))}
                    </td>
                    <td className="px-4 py-2.5 text-[var(--nova-text-muted)]">
                      {p.lastProductionMonth ?? '—'}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge variant={p.status === 'ATIVO' ? 'ativo' : 'inativo'} dot>
                        {p.status === 'ATIVO' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5">
                      <Link href={`/parceiros/${p.id}`}>
                        <Button variant="ghost" size="sm" aria-label={`Ver perfil de ${p.nome}`}>
                          <Eye size={14} />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--nova-border)]">
            <span className="text-xs text-[var(--nova-text-dim)]">
              Página {page} de {pages} · {total.toLocaleString('pt-BR')} registros
            </span>
            <div className="flex gap-1 flex-wrap">
              <Button variant="ghost" size="sm" onClick={() => goTo(page - 1)} disabled={page <= 1} aria-label="Página anterior">
                <ChevronLeft size={14} />
              </Button>
              {pageNumbers().map((n, i) =>
                n === '...' ? (
                  <span key={`e${i}`} className="px-2 py-1 text-xs text-[var(--nova-text-dim)]">…</span>
                ) : (
                  <Button
                    key={n}
                    variant={n === page ? 'blue' : 'ghost'}
                    size="sm"
                    onClick={() => goTo(n as number)}
                    aria-label={`Página ${n}`}
                    aria-current={n === page ? 'page' : undefined}
                  >
                    {n}
                  </Button>
                )
              )}
              <Button variant="ghost" size="sm" onClick={() => goTo(page + 1)} disabled={page >= pages} aria-label="Próxima página">
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
