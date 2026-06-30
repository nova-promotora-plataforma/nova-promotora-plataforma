'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { TopBar } from '@/components/layout/TopBar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Megaphone, Eye, ChevronLeft, ChevronRight, Filter, Loader2, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 20

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
}

const UFS = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO']

function formatCurrency(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
}


export default function ParceirosPage() {
  const [data, setData]       = useState<Partner[]>([])
  const [total, setTotal]     = useState(0)
  const [pages, setPages]     = useState(1)
  const [page, setPage]       = useState(1)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string[]>([])

  // filtros
  const [busca, setBusca]   = useState('')
  const [status, setStatus] = useState('')
  const [uf, setUf]         = useState('')
  const [applied, setApplied] = useState({ busca: '', status: '', uf: '' })
  const [sortBy,  setSortBy]  = useState('nome')
  const [sortDir, setSortDir] = useState('asc')

  function toggleSort(col: string) {
    if (sortBy === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(col)
      setSortDir('asc')
    }
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

      const res = await fetch(`/api/parceiros?${params}`)
      if (!res.ok) throw new Error('Erro ao carregar parceiros')
      const json: ApiResponse = await res.json()
      setData(json.data)
      setTotal(json.total)
      setPages(json.pages)
      setPage(json.page)
    } catch {
      setData([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(1, applied, sortBy, sortDir) }, [load, applied, sortBy, sortDir])

  function applyFilters() {
    const next = { busca, status, uf }
    setApplied(next)
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
              'focus:border-[var(--nova-blue)]/50 transition-nova w-52',
            )}
          />
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            aria-label="Filtrar por status"
            className={cn(
              'rounded-sm border bg-[var(--nova-bg-elev)] px-3 py-2 text-sm text-[var(--nova-text)]',
              'border-[var(--nova-border)] outline-none transition-nova cursor-pointer',
              'focus:border-[var(--nova-blue)]/50',
            )}
          >
            <option value="">Todos os status</option>
            <option value="ATIVO">Ativo</option>
            <option value="INATIVO">Inativo</option>
          </select>
          <select
            value={uf}
            onChange={e => setUf(e.target.value)}
            aria-label="Filtrar por UF"
            className={cn(
              'rounded-sm border bg-[var(--nova-bg-elev)] px-3 py-2 text-sm text-[var(--nova-text)]',
              'border-[var(--nova-border)] outline-none transition-nova cursor-pointer',
              'focus:border-[var(--nova-blue)]/50',
            )}
          >
            <option value="">Todos UFs</option>
            {UFS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
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
              {total.toLocaleString('pt-BR')} parceiros elegíveis ·{' '}
              <span className="text-[var(--btn-blue-text)]">filtro ativo: is_eligible = true</span>
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
                    { label: 'Código',          col: null },
                    { label: 'Nome',             col: 'nome' },
                    { label: 'Cidade / UF',      col: null },
                    { label: 'Último prod.',     col: 'lastProductionMonth' },
                    { label: 'Total acumulado',  col: 'totalProducao' },
                    { label: 'Status',           col: null },
                    { label: '',                 col: null },
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
                    <td className="px-4 py-2.5 text-[var(--nova-text-muted)]">
                      {p.lastProductionMonth ?? '—'}
                    </td>
                    <td className="px-4 py-2.5 text-[var(--nova-text-muted)]">
                      {formatCurrency(Number(p.totalProducao))}
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
              <Button
                variant="ghost" size="sm"
                onClick={() => goTo(page - 1)}
                disabled={page <= 1}
                aria-label="Página anterior"
              >
                <ChevronLeft size={14} />
              </Button>
              {pageNumbers().map((n, i) =>
                n === '...' ? (
                  <span key={`ellipsis-${i}`} className="px-2 py-1 text-xs text-[var(--nova-text-dim)]">…</span>
                ) : (
                  <Button
                    key={n}
                    variant={n === page ? 'blue' : 'ghost'}
                    size="sm"
                    onClick={() => goTo(n as number)}
                    aria-label={`Ir para página ${n}`}
                    aria-current={n === page ? 'page' : undefined}
                  >
                    {n}
                  </Button>
                )
              )}
              <Button
                variant="ghost" size="sm"
                onClick={() => goTo(page + 1)}
                disabled={page >= pages}
                aria-label="Próxima página"
              >
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
