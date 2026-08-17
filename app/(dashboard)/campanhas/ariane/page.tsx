'use client'

import { useState, useCallback, useMemo } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { Badge } from '@/components/ui/Badge'
import { Loader2, Search, Users, Phone, CheckCircle2, XCircle, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

// Cidades da Grande Florianópolis (normalizadas sem acento para comparação)
const CIDADES_GF = ['florianopolis', 'sao jose', 'biguacu', 'palhoca']
const CIDADE_DISPLAY: Record<string, string> = {
  'florianopolis': 'Florianópolis',
  'sao jose':      'São José',
  'biguacu':       'Biguaçu',
  'palhoca':       'Palhoça',
}

function normCidade(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}

function pertenceGF(cidade: string | null): boolean {
  if (!cidade) return false
  const n = normCidade(cidade)
  return CIDADES_GF.some(c => n === c || n.includes(c))
}

function displayCidade(cidade: string): string {
  const n = normCidade(cidade)
  for (const [key, label] of Object.entries(CIDADE_DISPLAY)) {
    if (n === key || n.includes(key)) return label
  }
  return cidade
}

interface TelField { col: string; valor: string }

interface Partner {
  codigo:        string
  nome:          string
  telefones:     TelField[]
  uf:            string | null
  cidade:        string | null
  totalProducao: number
  mediaProducao: number
  diasInativo:   number
  tempoLabel:    string
  convenio:      string
}

const CIDADES_FILTRO = ['Todas', 'Florianópolis', 'São José', 'Palhoça', 'Biguaçu']

function melhorTelefone(telefones: TelField[]): string {
  const priority = ['celular', 'celular_comercial', 'telefone', 'telefone_com', 'telefone_comercial_1', 'telefone_comercial_2']
  const map = Object.fromEntries(telefones.map(t => [t.col, t.valor]))
  for (const col of priority) {
    const v = map[col] ?? ''
    if (v && v !== '.' && v.replace(/\D/g, '').length >= 8) return v
  }
  return ''
}

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

export default function ArianePage() {
  const [loading,    setLoading]    = useState(false)
  const [loaded,     setLoaded]     = useState(false)
  const [partners,   setPartners]   = useState<Partner[]>([])
  const [busca,      setBusca]      = useState('')
  const [cidadeF,    setCidadeF]    = useState('Todas')
  const [atendido,   setAtendido]   = useState<Record<string, boolean>>({})
  const [reativado,  setReativado]  = useState<Record<string, boolean>>({})
  const [obs,        setObs]        = useState<Record<string, string>>({})
  const [editObs,    setEditObs]    = useState<string | null>(null)

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      // Busca toda a base sem filtros de inatividade/produção
      const res = await fetch('/api/disparos')
      const data = await res.json()
      const todos: Partner[] = data.partners ?? data.parceiros ?? []
      // Filtra SC + cidades da Grande Florianópolis
      const gf = todos.filter(p => p.uf === 'SC' && pertenceGF(p.cidade ?? ''))
      setPartners(gf)
      setLoaded(true)
    } finally {
      setLoading(false)
    }
  }, [])

  const leads = useMemo(() => {
    const q = busca.toLowerCase()
    return partners.filter(p => {
      const matchBusca = !q
        || p.nome.toLowerCase().includes(q)
        || p.codigo.includes(q)
        || melhorTelefone(p.telefones).includes(q)
      const cidade = displayCidade(p.cidade ?? '')
      const matchCidade = cidadeF === 'Todas' || cidade === cidadeF
      return matchBusca && matchCidade
    })
  }, [partners, busca, cidadeF])

  const totalAtendidos  = Object.values(atendido).filter(Boolean).length
  const totalReativados = Object.values(reativado).filter(Boolean).length

  return (
    <>
      <TopBar title="Grande Florianópolis — Leads Ariane" />
      <main className="flex-1 overflow-auto p-5 space-y-4">

        {!loaded ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <p className="text-sm text-[var(--nova-text-muted)]">
              Clique para carregar os parceiros elegíveis da Grande Florianópolis
            </p>
            <button
              onClick={carregar}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-[var(--btn-blue-bg)] border border-[var(--btn-blue-border)] text-[var(--btn-blue-text)] text-sm font-medium hover:opacity-90 transition-nova disabled:opacity-50"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Users size={14} />}
              {loading ? 'Carregando…' : 'Carregar base'}
            </button>
          </div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Total de leads',  value: partners.length,  icon: Users,        color: 'text-[var(--nova-text)]', bg: 'bg-[var(--nova-bg-elev-2)]' },
                { label: 'Atendidos',       value: totalAtendidos,   icon: CheckCircle2, color: 'text-green-400',          bg: 'bg-green-500/10' },
                { label: 'Reativados',      value: totalReativados,  icon: RefreshCw,    color: 'text-indigo-400',         bg: 'bg-indigo-500/10' },
              ].map(k => {
                const Icon = k.icon
                return (
                  <div key={k.label} className="rounded-lg border border-[var(--nova-border)] bg-[var(--nova-bg-elev)] p-4 flex items-center gap-3">
                    <div className={cn('w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0', k.bg)}>
                      <Icon size={18} className={k.color} />
                    </div>
                    <div>
                      <p className="text-xs text-[var(--nova-text-dim)]">{k.label}</p>
                      <p className={cn('text-2xl font-bold', k.color)}>{k.value}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--nova-text-dim)]" />
                <input
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                  placeholder="Buscar por nome, código ou telefone…"
                  className="w-full pl-8 pr-3 py-2 text-sm rounded-md border border-[var(--nova-border)] bg-[var(--nova-bg-elev)] text-[var(--nova-text)] placeholder:text-[var(--nova-text-dim)] focus:outline-none focus:ring-1 focus:ring-[var(--nova-blue)]"
                />
              </div>
              <div className="flex gap-1 flex-wrap">
                {CIDADES_FILTRO.map(c => (
                  <button
                    key={c}
                    onClick={() => setCidadeF(c)}
                    className={cn(
                      'px-3 py-1.5 text-xs rounded-md border transition-nova',
                      cidadeF === c
                        ? 'bg-[var(--btn-blue-bg)] border-[var(--btn-blue-border)] text-[var(--btn-blue-text)]'
                        : 'border-[var(--nova-border)] text-[var(--nova-text-muted)] hover:text-[var(--nova-text)] hover:bg-white/[0.04]',
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Tabela */}
            <div className="rounded-lg border border-[var(--nova-border)] bg-[var(--nova-bg-elev)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[var(--nova-bg-elev-2)]">
                      {['Código', 'Nome', 'Telefone', 'Média/mês', 'Inatividade', 'Convênio', 'Cidade', 'Atendido?', 'Reativado?', 'Observações'].map(h => (
                        <th key={h} className="px-3 py-2.5 text-left text-[0.625rem] font-medium uppercase tracking-wider text-[var(--nova-text-dim)] whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--nova-border)]/50">
                    {leads.map(p => {
                      const tel = melhorTelefone(p.telefones)
                      const cidade = displayCidade(p.cidade ?? '')
                      return (
                        <tr key={p.codigo} className="hover:bg-white/[0.02]">
                          <td className="px-3 py-2.5 font-mono text-xs text-[var(--nova-text-dim)]">{p.codigo}</td>
                          <td className="px-3 py-2.5 font-medium text-[var(--nova-text)] whitespace-nowrap">{p.nome}</td>
                          <td className="px-3 py-2.5 text-[var(--nova-text-muted)] whitespace-nowrap">
                            {tel ? (
                              <a href={`tel:${tel}`} className="hover:text-[var(--nova-blue)] flex items-center gap-1">
                                <Phone size={11} /> {tel}
                              </a>
                            ) : '—'}
                          </td>
                          <td className="px-3 py-2.5 text-[var(--nova-text)] whitespace-nowrap">{fmt(p.mediaProducao)}/mês</td>
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <Badge variant="inativo" dot>{p.tempoLabel}</Badge>
                          </td>
                          <td className="px-3 py-2.5 text-[var(--nova-text-muted)] whitespace-nowrap">{p.convenio}</td>
                          <td className="px-3 py-2.5 text-[var(--nova-text-muted)] whitespace-nowrap">{cidade}</td>

                          <td className="px-3 py-2.5">
                            <button
                              onClick={() => setAtendido(prev => ({ ...prev, [p.codigo]: !prev[p.codigo] }))}
                              className={cn(
                                'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full transition-nova',
                                atendido[p.codigo]
                                  ? 'bg-green-500/15 text-green-400'
                                  : 'bg-[var(--nova-bg-elev-2)] text-[var(--nova-text-dim)] hover:text-[var(--nova-text)]',
                              )}
                            >
                              {atendido[p.codigo] ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                              {atendido[p.codigo] ? 'Sim' : 'Não'}
                            </button>
                          </td>

                          <td className="px-3 py-2.5">
                            <button
                              onClick={() => setReativado(prev => ({ ...prev, [p.codigo]: !prev[p.codigo] }))}
                              className={cn(
                                'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full transition-nova',
                                reativado[p.codigo]
                                  ? 'bg-indigo-500/15 text-indigo-400'
                                  : 'bg-[var(--nova-bg-elev-2)] text-[var(--nova-text-dim)] hover:text-[var(--nova-text)]',
                              )}
                            >
                              {reativado[p.codigo] ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                              {reativado[p.codigo] ? 'Sim' : 'Não'}
                            </button>
                          </td>

                          <td className="px-3 py-2.5 min-w-[160px]">
                            {editObs === p.codigo ? (
                              <input
                                autoFocus
                                value={obs[p.codigo] ?? ''}
                                onChange={e => setObs(prev => ({ ...prev, [p.codigo]: e.target.value }))}
                                onBlur={() => setEditObs(null)}
                                onKeyDown={e => e.key === 'Enter' && setEditObs(null)}
                                className="w-full text-xs px-2 py-1 rounded border border-[var(--nova-border)] bg-[var(--nova-bg-elev-2)] text-[var(--nova-text)] focus:outline-none focus:ring-1 focus:ring-[var(--nova-blue)]"
                              />
                            ) : (
                              <button
                                onClick={() => setEditObs(p.codigo)}
                                className="text-xs text-left w-full text-[var(--nova-text-dim)] hover:text-[var(--nova-text)] truncate max-w-[160px]"
                              >
                                {obs[p.codigo] || <span className="italic opacity-50">Adicionar…</span>}
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-2.5 border-t border-[var(--nova-border)] text-xs text-[var(--nova-text-dim)]">
                {leads.length} de {partners.length} leads exibidos
              </div>
            </div>
          </>
        )}

      </main>
    </>
  )
}
