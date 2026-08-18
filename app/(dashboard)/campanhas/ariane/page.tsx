'use client'

import { useState, useCallback, useMemo } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { Badge } from '@/components/ui/Badge'
import {
  Loader2, Search, Users, Phone, CheckCircle2, XCircle, RefreshCw,
  ArrowUpDown, ArrowUp, ArrowDown, MapPin, TrendingUp, UserCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const SHEET_ID = '104gzMOGUgku7Wnx7rLKfHvz2HckdZvX-vEWdEJgzSNA'

interface Lead {
  codigo:            string
  nome:              string
  telefonePrincipal: string
  telefoneFixo:      string
  celular:           string
  media:             string
  inatividade:       string
  cidade:            string
  uf:                string
  atendido:          string
  dataAtendimento:   string
  reativado:         string
  dataReativacao:    string
  observacoes:       string
}

function parseCSV(csv: string): string[][] {
  const rows: string[][] = []
  let row: string[] = [], cur = '', inQ = false
  for (let i = 0; i < csv.length; i++) {
    const ch = csv[i]
    if (ch === '"') { if (inQ && csv[i+1] === '"') { cur += '"'; i++ } else inQ = !inQ }
    else if (ch === ',' && !inQ) { row.push(cur); cur = '' }
    else if (ch === '\r' && !inQ) {}
    else if (ch === '\n' && !inQ) { row.push(cur); cur = ''; if (row.length) rows.push(row); row = [] }
    else cur += ch
  }
  if (cur || row.length) { row.push(cur); rows.push(row) }
  return rows
}

function sim(v: string) { return v?.toLowerCase().trim() === 'sim' }

const INATIVIDADE_ORDER: Record<string, number> = {
  '3 meses': 1, '6 meses': 2, '1 ano': 3, '2 anos': 4, '3 anos ou mais': 5,
}

function parseData(s: string): number {
  if (!s) return 0
  const [d, m, a] = s.split('/')
  if (!d || !m || !a) return 0
  return new Date(`${a}-${m}-${d}`).getTime() || 0
}

type SortKey = 'inatividade' | 'cidade' | 'atendido' | 'dataAtendimento' | 'reativado' | 'dataReativacao'
type SortDir = 'asc' | 'desc'

const CIDADES_FILTRO = ['Todas', 'Florianópolis', 'São José', 'Palhoça', 'Biguaçu']

function SortBtn({ col, sortKey, sortDir, onSort }: {
  col: SortKey; sortKey: SortKey | null; sortDir: SortDir; onSort: (k: SortKey) => void
}) {
  const active = sortKey === col
  return (
    <button onClick={() => onSort(col)} className="ml-1 inline-flex opacity-60 hover:opacity-100 transition-nova">
      {!active ? <ArrowUpDown size={11} /> : sortDir === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
    </button>
  )
}

function ProgressBar({ value, color = 'bg-[var(--nova-blue)]' }: { value: number; color?: string }) {
  return (
    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mt-1">
      <div className={cn('h-full rounded-full transition-all duration-500', color)} style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  )
}

export default function ArianePage() {
  const [loading, setLoading]   = useState(false)
  const [leads, setLeads]       = useState<Lead[]>([])
  const [loaded, setLoaded]     = useState(false)
  const [busca, setBusca]       = useState('')
  const [cidadeF, setCidadeF]   = useState('Todas')
  const [apenasNaoAtendidos, setApenasNaoAtendidos] = useState(false)
  const [sortKey, setSortKey]   = useState<SortKey | null>(null)
  const [sortDir, setSortDir]   = useState<SortDir>('asc')

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`
      const res = await fetch(url, { cache: 'no-store' })
      const buf = await res.arrayBuffer()
      const text = new TextDecoder('utf-8').decode(buf)
      const rows = parseCSV(text)
      if (rows.length < 2) return
      const parsed: Lead[] = rows.slice(1).map(r => ({
        codigo:            r[0]?.trim()  ?? '',
        nome:              r[1]?.trim()  ?? '',
        telefonePrincipal: r[2]?.trim()  ?? '',
        telefoneFixo:      r[3]?.trim()  ?? '',
        celular:           r[4]?.trim()  ?? '',
        media:             r[5]?.trim()  ?? '',
        inatividade:       r[6]?.trim()  ?? '',
        cidade:            r[7]?.trim()  ?? '',
        uf:                r[8]?.trim()  ?? '',
        atendido:          r[9]?.trim()  ?? '',
        dataAtendimento:   r[10]?.trim() ?? '',
        reativado:         r[11]?.trim() ?? '',
        dataReativacao:    r[12]?.trim() ?? '',
        observacoes:       r[13]?.trim() ?? '',
      })).filter(l => l.codigo)
      setLeads(parsed)
      setLoaded(true)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const filtrados = useMemo(() => {
    const q = busca.toLowerCase()
    let list = leads.filter(l => {
      const matchBusca  = !q || l.nome.toLowerCase().includes(q) || l.codigo.includes(q) || l.telefonePrincipal.includes(q)
      const matchCidade = cidadeF === 'Todas' || l.cidade === cidadeF
      const matchFiltro = !apenasNaoAtendidos || !sim(l.atendido)
      return matchBusca && matchCidade && matchFiltro
    })
    if (sortKey) {
      list = [...list].sort((a, b) => {
        let va: number | string = 0, vb: number | string = 0
        if (sortKey === 'inatividade') { va = INATIVIDADE_ORDER[a.inatividade] ?? 0; vb = INATIVIDADE_ORDER[b.inatividade] ?? 0 }
        else if (sortKey === 'cidade') { va = a.cidade; vb = b.cidade }
        else if (sortKey === 'atendido') { va = a.atendido.toLowerCase(); vb = b.atendido.toLowerCase() }
        else if (sortKey === 'reativado') { va = a.reativado.toLowerCase(); vb = b.reativado.toLowerCase() }
        else if (sortKey === 'dataAtendimento') { va = parseData(a.dataAtendimento); vb = parseData(b.dataAtendimento) }
        else if (sortKey === 'dataReativacao') { va = parseData(a.dataReativacao); vb = parseData(b.dataReativacao) }
        const cmp = typeof va === 'number' ? va - (vb as number) : (va as string).localeCompare(vb as string, 'pt-BR')
        return sortDir === 'asc' ? cmp : -cmp
      })
    }
    return list
  }, [leads, busca, cidadeF, apenasNaoAtendidos, sortKey, sortDir])

  const base = useMemo(() => {
    const q = busca.toLowerCase()
    return leads.filter(l => {
      const matchBusca  = !q || l.nome.toLowerCase().includes(q) || l.codigo.includes(q) || l.telefonePrincipal.includes(q)
      const matchCidade = cidadeF === 'Todas' || l.cidade === cidadeF
      return matchBusca && matchCidade
    })
  }, [leads, busca, cidadeF])

  const totalAtendidos  = base.filter(l => sim(l.atendido)).length
  const totalReativados = base.filter(l => sim(l.reativado)).length
  const preenchidos     = leads.filter(l => l.atendido !== '').length

  const pct    = (n: number, d: number) => d > 0 ? ((n / d) * 100) : 0
  const pctStr = (n: number, d: number) => d > 0 ? `${pct(n, d).toFixed(1)}%` : '—'

  const taxaAtendimento  = pct(totalAtendidos, base.length)
  const taxaReativacao   = pct(totalReativados, totalAtendidos)
  const taxaNaoAtendidos = pct(base.length - totalAtendidos, base.length)

  return (
    <>
      <TopBar title="Grande Florianópolis — Leads Ariane" />
      <main className="flex-1 overflow-auto p-5 space-y-4">

        {/* Hero: perfil + KPIs */}
        <div className="grid grid-cols-[260px_1fr] gap-4">

          {/* Card de perfil */}
          <div className="rounded-xl border border-[var(--nova-border)] bg-[var(--nova-bg-elev)] overflow-hidden relative flex flex-col">
            <div className="h-20 bg-gradient-to-br from-blue-600/30 to-indigo-700/20" />
            <div className="px-5 pb-5 flex flex-col items-center text-center -mt-10 flex-1">
              <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-[var(--nova-bg-elev)] bg-[var(--nova-bg-elev-2)] flex-shrink-0">
                {/* Salve a foto em public/ariane.jpg */}
                <img
                  src="/ariane.jpg"
                  alt="Ariane"
                  className="w-full h-full object-cover object-top"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              </div>
              <h2 className="mt-3 font-semibold text-[var(--nova-text)] text-base leading-tight">Ariane</h2>
              <p className="text-xs text-[var(--nova-text-dim)] mt-0.5">Comercial</p>
              <div className="flex items-center gap-1 mt-1">
                <MapPin size={11} className="text-[var(--nova-blue)]" />
                <span className="text-[0.65rem] text-[var(--nova-text-dim)]">Grande Florianópolis</span>
              </div>

              <div className="mt-4 w-full space-y-3">
                <div className="text-left">
                  <div className="flex justify-between items-center">
                    <span className="text-[0.65rem] text-[var(--nova-text-dim)] uppercase tracking-wider">Atendimento</span>
                    <span className="text-[0.65rem] font-semibold text-green-400">{pctStr(totalAtendidos, base.length)}</span>
                  </div>
                  <ProgressBar value={taxaAtendimento} color="bg-green-500" />
                </div>
                <div className="text-left">
                  <div className="flex justify-between items-center">
                    <span className="text-[0.65rem] text-[var(--nova-text-dim)] uppercase tracking-wider">Reativação</span>
                    <span className="text-[0.65rem] font-semibold text-indigo-400">{pctStr(totalReativados, totalAtendidos)}</span>
                  </div>
                  <ProgressBar value={taxaReativacao} color="bg-indigo-500" />
                </div>
                <div className="text-left">
                  <div className="flex justify-between items-center">
                    <span className="text-[0.65rem] text-[var(--nova-text-dim)] uppercase tracking-wider">Pendentes</span>
                    <span className="text-[0.65rem] font-semibold text-amber-400">{pctStr(base.length - totalAtendidos, base.length)}</span>
                  </div>
                  <ProgressBar value={taxaNaoAtendidos} color="bg-amber-500" />
                </div>
              </div>

              {loaded && (
                <button onClick={carregar} disabled={loading}
                  className="mt-4 w-full flex items-center justify-center gap-1.5 py-1.5 text-xs rounded-md border border-[var(--nova-border)] text-[var(--nova-text-muted)] hover:text-[var(--nova-text)] hover:bg-white/[0.04] transition-nova disabled:opacity-50"
                >
                  <RefreshCw size={11} className={loading ? 'animate-spin' : ''} /> Atualizar dados
                </button>
              )}
            </div>
          </div>

          {/* KPIs + funil */}
          <div className="flex flex-col gap-4">
            {/* KPI cards */}
            <div className="grid grid-cols-4 gap-3">
              {[
                {
                  label: 'Total na seleção',
                  value: loaded ? base.length : '—',
                  sub: cidadeF !== 'Todas' ? `${pctStr(base.length, leads.length)} da base` : `${leads.length} na base`,
                  color: 'text-[var(--nova-text)]',
                  accent: 'from-blue-500/20 to-blue-600/5',
                  icon: Users,
                  iconColor: 'text-[var(--nova-blue)]',
                  iconBg: 'bg-blue-500/10',
                },
                {
                  label: 'Atendidos',
                  value: loaded ? totalAtendidos : '—',
                  sub: loaded ? `${pctStr(totalAtendidos, base.length)} do total` : 'aguardando dados',
                  color: 'text-green-400',
                  accent: 'from-green-500/20 to-green-600/5',
                  icon: UserCheck,
                  iconColor: 'text-green-400',
                  iconBg: 'bg-green-500/10',
                },
                {
                  label: 'Não atendidos',
                  value: loaded ? base.length - totalAtendidos : '—',
                  sub: loaded ? `${pctStr(base.length - totalAtendidos, base.length)} do total` : 'aguardando dados',
                  color: 'text-amber-400',
                  accent: 'from-amber-500/20 to-amber-600/5',
                  icon: XCircle,
                  iconColor: 'text-amber-400',
                  iconBg: 'bg-amber-500/10',
                },
                {
                  label: 'Reativados',
                  value: loaded ? totalReativados : '—',
                  sub: loaded ? `${pctStr(totalReativados, totalAtendidos)} dos atendidos` : 'aguardando dados',
                  color: 'text-indigo-400',
                  accent: 'from-indigo-500/20 to-indigo-600/5',
                  icon: TrendingUp,
                  iconColor: 'text-indigo-400',
                  iconBg: 'bg-indigo-500/10',
                },
              ].map(k => {
                const Icon = k.icon
                return (
                  <div key={k.label} className={cn('rounded-xl border border-[var(--nova-border)] bg-gradient-to-br p-4 flex flex-col gap-2', k.accent, 'bg-[var(--nova-bg-elev)]')}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--nova-text-dim)]">{k.label}</span>
                      <div className={cn('w-7 h-7 rounded-md flex items-center justify-center', k.iconBg)}>
                        <Icon size={14} className={k.iconColor} />
                      </div>
                    </div>
                    <p className={cn('text-3xl font-bold leading-none', k.color)}>{k.value}</p>
                    <p className="text-[0.65rem] text-[var(--nova-text-dim)]">{k.sub}</p>
                  </div>
                )
              })}
            </div>

            {/* Funil visual por cidade */}
            {loaded && (
              <div className="rounded-xl border border-[var(--nova-border)] bg-[var(--nova-bg-elev)] p-4 flex-1">
                <p className="text-xs font-medium text-[var(--nova-text-dim)] uppercase tracking-wider mb-3">Distribuição por cidade</p>
                <div className="space-y-2">
                  {CIDADES_FILTRO.filter(c => c !== 'Todas').map(cidade => {
                    const count = leads.filter(l => l.cidade === cidade).length
                    const atend = leads.filter(l => l.cidade === cidade && sim(l.atendido)).length
                    const pctCidade = pct(count, leads.length)
                    return (
                      <div key={cidade}>
                        <div className="flex justify-between text-xs mb-0.5">
                          <span className="text-[var(--nova-text-muted)]">{cidade}</span>
                          <span className="text-[var(--nova-text-dim)]">{atend}/{count} · <span className="text-[var(--nova-blue)]">{pctCidade.toFixed(0)}%</span></span>
                        </div>
                        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-[var(--nova-blue)] to-blue-400/60" style={{ width: `${pctCidade}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Estado inicial: não carregado */}
        {!loaded && (
          <div className="flex flex-col items-center justify-center h-48 gap-4">
            <p className="text-sm text-[var(--nova-text-muted)]">
              Clique para carregar os dados da planilha da Ariane
            </p>
            <button
              onClick={carregar}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--btn-blue-bg)] border border-[var(--btn-blue-border)] text-[var(--btn-blue-text)] text-sm font-medium hover:opacity-90 transition-nova disabled:opacity-50"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Users size={14} />}
              {loading ? 'Carregando…' : 'Carregar base de leads'}
            </button>
          </div>
        )}

        {loaded && (
          <>
            {preenchidos === 0 && (
              <p className="text-xs text-[var(--nova-text-dim)] italic">
                Planilha ainda não preenchida — os dados aparecerão aqui conforme a Ariane for atualizando.
              </p>
            )}

            {/* Filtros */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[220px]">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--nova-text-dim)]" />
                <input
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                  placeholder="Buscar por nome, código ou telefone…"
                  className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-[var(--nova-border)] bg-[var(--nova-bg-elev)] text-[var(--nova-text)] placeholder:text-[var(--nova-text-dim)] focus:outline-none focus:ring-1 focus:ring-[var(--nova-blue)]"
                />
              </div>
              <div className="flex gap-1 flex-wrap">
                {CIDADES_FILTRO.map(c => (
                  <button key={c} onClick={() => setCidadeF(c)}
                    className={cn('px-3 py-1.5 text-xs rounded-lg border transition-nova',
                      cidadeF === c
                        ? 'bg-[var(--btn-blue-bg)] border-[var(--btn-blue-border)] text-[var(--btn-blue-text)]'
                        : 'border-[var(--nova-border)] text-[var(--nova-text-muted)] hover:text-[var(--nova-text)] hover:bg-white/[0.04]',
                    )}
                  >{c}</button>
                ))}
              </div>
              <button onClick={() => setApenasNaoAtendidos(v => !v)}
                className={cn('px-3 py-1.5 text-xs rounded-lg border transition-nova',
                  apenasNaoAtendidos
                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                    : 'border-[var(--nova-border)] text-[var(--nova-text-muted)] hover:text-[var(--nova-text)] hover:bg-white/[0.04]',
                )}
              >Não atendidos</button>
            </div>

            {/* Tabela */}
            <div className="rounded-xl border border-[var(--nova-border)] bg-[var(--nova-bg-elev)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[var(--nova-bg-elev-2)]">
                      {(['Código','Nome','Telefone','Média/mês'] as const).map(h => (
                        <th key={h} className="px-3 py-2.5 text-left text-[0.625rem] font-medium uppercase tracking-wider text-[var(--nova-text-dim)] whitespace-nowrap">{h}</th>
                      ))}
                      <th className="px-3 py-2.5 text-left text-[0.625rem] font-medium uppercase tracking-wider text-[var(--nova-text-dim)] whitespace-nowrap">
                        Inatividade <SortBtn col="inatividade" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                      </th>
                      <th className="px-3 py-2.5 text-left text-[0.625rem] font-medium uppercase tracking-wider text-[var(--nova-text-dim)] whitespace-nowrap">
                        Cidade <SortBtn col="cidade" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                      </th>
                      <th className="px-3 py-2.5 text-left text-[0.625rem] font-medium uppercase tracking-wider text-[var(--nova-text-dim)] whitespace-nowrap">
                        Atendido? <SortBtn col="atendido" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                      </th>
                      <th className="px-3 py-2.5 text-left text-[0.625rem] font-medium uppercase tracking-wider text-[var(--nova-text-dim)] whitespace-nowrap">
                        Data Atend. <SortBtn col="dataAtendimento" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                      </th>
                      <th className="px-3 py-2.5 text-left text-[0.625rem] font-medium uppercase tracking-wider text-[var(--nova-text-dim)] whitespace-nowrap">
                        Reativado? <SortBtn col="reativado" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                      </th>
                      <th className="px-3 py-2.5 text-left text-[0.625rem] font-medium uppercase tracking-wider text-[var(--nova-text-dim)] whitespace-nowrap">
                        Data Reat. <SortBtn col="dataReativacao" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                      </th>
                      <th className="px-3 py-2.5 text-left text-[0.625rem] font-medium uppercase tracking-wider text-[var(--nova-text-dim)]">Observações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--nova-border)]/50">
                    {filtrados.map(l => (
                      <tr key={l.codigo} className={cn('hover:bg-white/[0.02]', sim(l.reativado) && 'bg-indigo-500/[0.04]')}>
                        <td className="px-3 py-2.5 font-mono text-xs text-[var(--nova-text-dim)]">{l.codigo}</td>
                        <td className="px-3 py-2.5 font-medium text-[var(--nova-text)] whitespace-nowrap">{l.nome}</td>
                        <td className="px-3 py-2.5 text-[var(--nova-text-muted)] whitespace-nowrap">
                          {l.telefonePrincipal
                            ? <a href={`tel:${l.telefonePrincipal}`} className="hover:text-[var(--nova-blue)] flex items-center gap-1"><Phone size={11} />{l.telefonePrincipal}</a>
                            : '—'}
                        </td>
                        <td className="px-3 py-2.5 text-[var(--nova-text)] whitespace-nowrap">{l.media}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <Badge variant="inativo" dot>{l.inatividade}</Badge>
                        </td>
                        <td className="px-3 py-2.5 text-[var(--nova-text-muted)] whitespace-nowrap">{l.cidade}</td>
                        <td className="px-3 py-2.5">
                          {l.atendido === '' ? (
                            <span className="text-xs text-[var(--nova-text-dim)] italic">—</span>
                          ) : (
                            <span className={cn('inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
                              sim(l.atendido) ? 'bg-green-500/15 text-green-400' : 'bg-red-500/10 text-red-400',
                            )}>
                              {sim(l.atendido) ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                              {l.atendido}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-xs text-[var(--nova-text-dim)] whitespace-nowrap">{l.dataAtendimento || '—'}</td>
                        <td className="px-3 py-2.5">
                          {l.reativado === '' ? (
                            <span className="text-xs text-[var(--nova-text-dim)] italic">—</span>
                          ) : (
                            <span className={cn('inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
                              sim(l.reativado) ? 'bg-indigo-500/15 text-indigo-400' : 'bg-red-500/10 text-red-400',
                            )}>
                              {sim(l.reativado) ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                              {l.reativado}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-xs text-[var(--nova-text-dim)] whitespace-nowrap">{l.dataReativacao || '—'}</td>
                        <td className="px-3 py-2.5 text-xs text-[var(--nova-text-muted)] max-w-[200px] truncate" title={l.observacoes}>
                          {l.observacoes || <span className="italic opacity-40">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-2.5 border-t border-[var(--nova-border)] text-xs text-[var(--nova-text-dim)]">
                {filtrados.length} de {leads.length} leads · dados da planilha compartilhada
              </div>
            </div>
          </>
        )}
      </main>
    </>
  )
}
