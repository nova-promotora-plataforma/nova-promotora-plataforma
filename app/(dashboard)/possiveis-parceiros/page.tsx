'use client'

import { useState, useEffect, useCallback } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ChevronLeft, ChevronRight, Filter, Loader2, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 20

interface PossiblePartner {
  id: string
  cnpj: string
  razaoSocial: string
  nomeFantasia: string | null
  camada: 'NUCLEO' | 'AMPLO'
  cnaePrincipal: string
  cnaeDesc: string | null
  porte: string | null
  cidade: string | null
  uf: string | null
  telefone: string | null
  email: string | null
  jaParceiro: boolean
  raizNaCarteira: boolean
}

interface ApiResponse {
  data: PossiblePartner[]
  total: number
  page: number
  pages: number
}

const UFS = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO']

function formatCnpj(cnpj: string) {
  if (cnpj.length !== 14) return cnpj
  return `${cnpj.slice(0,2)}.${cnpj.slice(2,5)}.${cnpj.slice(5,8)}/${cnpj.slice(8,12)}-${cnpj.slice(12)}`
}

export default function PossiveisParceirosPage() {
  const [data, setData]       = useState<PossiblePartner[]>([])
  const [total, setTotal]     = useState(0)
  const [pages, setPages]     = useState(1)
  const [page, setPage]       = useState(1)
  const [loading, setLoading] = useState(true)

  // filtros
  const [busca, setBusca]           = useState('')
  const [uf, setUf]                 = useState('')
  const [camada, setCamada]         = useState('')
  const [jaParceiro, setJaParceiro] = useState('')
  const [applied, setApplied] = useState({ busca: '', uf: '', camada: '', jaParceiro: '' })
  const [sortBy,  setSortBy]  = useState('razaoSocial')
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
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(PAGE_SIZE), sortBy: sb, sortDir: sd })
      if (filters.busca)      params.set('q', filters.busca)
      if (filters.uf)         params.set('uf', filters.uf)
      if (filters.camada)     params.set('camada', filters.camada)
      if (filters.jaParceiro) params.set('jaParceiro', filters.jaParceiro)

      const res = await fetch(`/api/possiveis-parceiros?${params}`)
      if (!res.ok) throw new Error('Erro ao carregar possíveis parceiros')
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
    setApplied({ busca, uf, camada, jaParceiro })
  }

  function goTo(p: number) { load(p, applied, sortBy, sortDir) }

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
      <TopBar title="Possíveis Parceiros" />

      <main className="flex-1 overflow-auto p-5">

        {/* Filtros */}
        <div className="flex flex-wrap gap-2 mb-4" role="search" aria-label="Filtros de possíveis parceiros">
          <input
            type="search"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && applyFilters()}
            placeholder="Razão social, fantasia ou CNPJ…"
            aria-label="Buscar por razão social, fantasia ou CNPJ"
            className={cn(
              'rounded-sm border bg-white/[0.04] px-3 py-2 text-sm text-[var(--nova-text)]',
              'placeholder:text-[var(--nova-text-dim)] border-[var(--nova-border)] outline-none',
              'focus:border-[var(--nova-blue)]/50 transition-nova w-64',
            )}
          />
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
          <select
            value={camada}
            onChange={e => setCamada(e.target.value)}
            aria-label="Filtrar por camada"
            className={cn(
              'rounded-sm border bg-[var(--nova-bg-elev)] px-3 py-2 text-sm text-[var(--nova-text)]',
              'border-[var(--nova-border)] outline-none transition-nova cursor-pointer',
              'focus:border-[var(--nova-blue)]/50',
            )}
          >
            <option value="">Todas camadas</option>
            <option value="NUCLEO">Núcleo</option>
            <option value="AMPLO">Amplo</option>
          </select>
          <select
            value={jaParceiro}
            onChange={e => setJaParceiro(e.target.value)}
            aria-label="Filtrar por já é parceiro"
            className={cn(
              'rounded-sm border bg-[var(--nova-bg-elev)] px-3 py-2 text-sm text-[var(--nova-text)]',
              'border-[var(--nova-border)] outline-none transition-nova cursor-pointer',
              'focus:border-[var(--nova-blue)]/50',
            )}
          >
            <option value="">Já parceiro: todos</option>
            <option value="nao">Só novos prospects</option>
            <option value="sim">Só já parceiros</option>
          </select>
          <Button variant="blue" size="sm" onClick={applyFilters}>
            <Filter size={14} /> Filtrar
          </Button>
        </div>

        {/* Contagem */}
        <p className="text-xs text-[var(--nova-text-dim)] mb-3">
          {loading ? 'Carregando…' : `${total.toLocaleString('pt-BR')} possíveis parceiros`}
        </p>

        {/* Tabela */}
        <div className="rounded-md border border-[var(--nova-border)] bg-[var(--nova-bg-elev)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-zebra" aria-label="Lista de possíveis parceiros">
              <thead>
                <tr className="bg-[var(--nova-bg-elev-2)]">
                  {([
                    { label: 'Razão social',  col: 'razaoSocial' },
                    { label: 'CNPJ',           col: null },
                    { label: 'CNAE',           col: null },
                    { label: 'Porte',          col: null },
                    { label: 'Cidade / UF',    col: 'cidade' },
                    { label: 'Camada',         col: 'camada' },
                    { label: 'Já parceiro',    col: null },
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
                    <td colSpan={7} className="px-4 py-12 text-center text-[var(--nova-text-dim)]">
                      <Loader2 size={20} className="animate-spin inline mr-2" />
                      Carregando possíveis parceiros…
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-[var(--nova-text-dim)]">
                      Nenhum possível parceiro encontrado com os filtros aplicados.
                    </td>
                  </tr>
                ) : data.map(p => (
                  <tr key={p.id} className="hover:bg-white/[0.02] transition-nova">
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-[var(--nova-text)]">{p.razaoSocial}</p>
                      {p.nomeFantasia && (
                        <p className="text-[0.6875rem] text-[var(--nova-text-dim)]">{p.nomeFantasia}</p>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-[0.6875rem] text-[var(--nova-text-dim)] font-mono">
                      {formatCnpj(p.cnpj)}
                    </td>
                    <td className="px-4 py-2.5 text-[var(--nova-text-muted)]">
                      <p className="font-mono text-[0.6875rem]">{p.cnaePrincipal}</p>
                      {p.cnaeDesc && p.cnaeDesc !== '(secundária)' && (
                        <p className="text-[0.6875rem] text-[var(--nova-text-dim)]">{p.cnaeDesc}</p>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-[var(--nova-text-muted)]">{p.porte ?? '—'}</td>
                    <td className="px-4 py-2.5 text-[var(--nova-text-muted)]">
                      {p.cidade ?? '—'}{p.uf ? ` / ${p.uf}` : ''}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge variant={p.camada === 'NUCLEO' ? 'blue' : 'default'}>
                        {p.camada === 'NUCLEO' ? 'Núcleo' : 'Amplo'}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5">
                      {p.jaParceiro ? (
                        <Badge variant="ativo" dot>Já é parceiro</Badge>
                      ) : p.raizNaCarteira ? (
                        <Badge variant="amber" dot>Raiz na carteira</Badge>
                      ) : (
                        <Badge variant="default">Novo prospect</Badge>
                      )}
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
