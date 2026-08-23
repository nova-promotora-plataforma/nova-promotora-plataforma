'use client'

import { useState, useCallback, useEffect } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { ChevronDown, Send, CheckCheck, Eye, MessageSquare, XCircle, Users, Phone, Loader2, Search, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

interface LeadDisparo {
  nome:         string
  whatsapp:     string
  status:       string
  enviado_em:   string
  entregue_em:  string
  lido_em:      string
  respondeu_em: string
  erro:         string
}

function parseLeadsCSV(csv: string): LeadDisparo[] {
  const lines = csv.split('\n').filter(Boolean)
  if (lines.length < 2) return []
  return lines.slice(1).map(line => {
    const cols = line.split(',')
    return {
      nome:         cols[0]?.trim() ?? '',
      whatsapp:     cols[1]?.trim() ?? '',
      status:       cols[3]?.trim() ?? '',
      enviado_em:   cols[4]?.trim() ?? '',
      entregue_em:  cols[5]?.trim() ?? '',
      lido_em:      cols[6]?.trim() ?? '',
      respondeu_em: cols[7]?.trim() ?? '',
      erro:         cols[8]?.trim() ?? '',
    }
  }).filter(l => l.nome)
}

function fmtHorario(iso: string) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    read:      { label: 'Lido',       cls: 'bg-blue-500/15 text-blue-400' },
    delivered: { label: 'Entregue',   cls: 'bg-green-500/15 text-green-400' },
    sent:      { label: 'Enviado',    cls: 'bg-indigo-500/15 text-indigo-400' },
    failed:    { label: 'Falha',      cls: 'bg-red-500/15 text-red-400' },
    replied:   { label: 'Respondeu',  cls: 'bg-amber-500/15 text-amber-400' },
  }
  const s = status.toLowerCase()
  const cfg = map[s] ?? { label: status, cls: 'bg-white/10 text-[var(--nova-text-dim)]' }
  return (
    <span className={cn('inline-flex items-center text-[0.65rem] font-medium px-2 py-0.5 rounded-full', cfg.cls)}>
      {cfg.label}
    </span>
  )
}

interface Campanha {
  id: string
  nome: string
  data: string
  status: 'Concluída' | 'Em andamento'
  total: number
  enviados: number
  entregues: number
  lidos: number
  respostas: number
  falhas: number
}

const CAMPANHAS: Campanha[] = [
  {
    id: 'lancamento-powerhub-1',
    nome: 'Lançamento PowerHub 1',
    data: '27/05/2026',
    status: 'Concluída',
    total: 2675,
    enviados: 2264,
    entregues: 2246,
    lidos: 1486,
    respostas: 301,
    falhas: 412,
  },
  {
    id: 'elegiveis-sem-debito-20-50',
    nome: 'Elegíveis Sem Débito 3m/6m – R$20-50k',
    data: '04/08/2026',
    status: 'Concluída',
    total: 517,
    enviados: 420,
    entregues: 411,
    lidos: 258,
    respostas: 63,
    falhas: 97,
  },
  {
    id: 'elegiveis-sem-debito-50-100',
    nome: 'Elegíveis Sem Débito 3m/6m – R$50-100k',
    data: '10/08/2026',
    status: 'Concluída',
    total: 307,
    enviados: 226,
    entregues: 215,
    lidos: 58,
    respostas: 28,
    falhas: 80,
  },
  {
    id: 'elegiveis-sem-debito-2a-100-200',
    nome: 'Elegíveis Sem Débito 2 anos – R$100-200k',
    data: '20/08/2026',
    status: 'Concluída',
    total: 22,
    enviados: 16,
    entregues: 14,
    lidos: 3,
    respostas: 0,
    falhas: 6,
  },
  {
    id: 'elegiveis-sem-debito-2a-50-100',
    nome: 'Elegíveis Sem Débito 2 anos – R$50-100k',
    data: '19/08/2026',
    status: 'Concluída',
    total: 93,
    enviados: 68,
    entregues: 65,
    lidos: 15,
    respostas: 4,
    falhas: 25,
  },
  {
    id: 'elegiveis-sem-debito-2a-20-50',
    nome: 'Elegíveis Sem Débito 2 anos – R$20-50k',
    data: '18/08/2026',
    status: 'Concluída',
    total: 202,
    enviados: 133,
    entregues: 119,
    lidos: 25,
    respostas: 8,
    falhas: 69,
  },
  {
    id: 'elegiveis-sem-debito-1a-100-200',
    nome: 'Elegíveis Sem Débito 1 ano – R$100-200k',
    data: '17/08/2026',
    status: 'Concluída',
    total: 54,
    enviados: 46,
    entregues: 43,
    lidos: 8,
    respostas: 6,
    falhas: 8,
  },
  {
    id: 'elegiveis-sem-debito-1a-50-100',
    nome: 'Elegíveis Sem Débito 1 ano – R$50-100k',
    data: '13/08/2026',
    status: 'Concluída',
    total: 126,
    enviados: 104,
    entregues: 97,
    lidos: 11,
    respostas: 15,
    falhas: 22,
  },
  {
    id: 'elegiveis-sem-debito-1a-20-50',
    nome: 'Elegíveis Sem Débito 1 ano – R$20-50k',
    data: '12/08/2026',
    status: 'Concluída',
    total: 288,
    enviados: 239,
    entregues: 214,
    lidos: 25,
    respostas: 18,
    falhas: 49,
  },
  {
    id: 'elegiveis-sem-debito-100-200',
    nome: 'Elegíveis Sem Débito 3m/6m – R$100-200k',
    data: '11/08/2026',
    status: 'Concluída',
    total: 114,
    enviados: 91,
    entregues: 86,
    lidos: 25,
    respostas: 6,
    falhas: 23,
  },
]

const pct = (num: number, den: number) =>
  den > 0 ? ((num / den) * 100).toFixed(1) + '%' : '—'

const fmtN = (v: number) => new Intl.NumberFormat('pt-BR').format(v)

const FUNNEL_COLORS = ['#6366f1', '#22c55e', '#3b82f6', '#f59e0b', '#ef4444']

function BenchmarkBar({ campanhas }: { campanhas: Campanha[] }) {
  const agg = campanhas.reduce(
    (acc, c) => ({
      total:     acc.total     + c.total,
      enviados:  acc.enviados  + c.enviados,
      entregues: acc.entregues + c.entregues,
      lidos:     acc.lidos     + c.lidos,
      respostas: acc.respostas + c.respostas,
      falhas:    acc.falhas    + c.falhas,
    }),
    { total: 0, enviados: 0, entregues: 0, lidos: 0, respostas: 0, falhas: 0 },
  )

  const p = (num: number, den: number) => den > 0 ? (num / den) * 100 : 0

  const metricas = [
    { label: 'Taxa de envio',     value: p(agg.enviados,  agg.total),     color: '#6366f1', ref: `${fmtN(agg.enviados)} de ${fmtN(agg.total)}` },
    { label: 'Taxa de entrega',   value: p(agg.entregues, agg.enviados),  color: '#22c55e', ref: `${fmtN(agg.entregues)} de ${fmtN(agg.enviados)}` },
    { label: 'Taxa de leitura',   value: p(agg.lidos,     agg.entregues), color: '#3b82f6', ref: `${fmtN(agg.lidos)} de ${fmtN(agg.entregues)}` },
    { label: 'Taxa de resposta',  value: p(agg.respostas, agg.entregues), color: '#f59e0b', ref: `${fmtN(agg.respostas)} de ${fmtN(agg.entregues)}` },
    { label: 'Taxa de falha',     value: p(agg.falhas,    agg.total),     color: '#ef4444', ref: `${fmtN(agg.falhas)} de ${fmtN(agg.total)}` },
  ]

  return (
    <div className="rounded-lg border border-[var(--nova-border)] bg-[var(--nova-bg-elev)] overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--nova-border)] flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--nova-text)]">Benchmark — média geral</p>
          <p className="text-xs text-[var(--nova-text-dim)] mt-0.5">
            Consolidado de {campanhas.length} disparo{campanhas.length !== 1 ? 's' : ''} · {fmtN(agg.total)} contatos no total
          </p>
        </div>
        <span className="text-[0.625rem] font-medium uppercase tracking-wider text-[var(--nova-text-dim)] bg-[var(--nova-bg-elev-2)] px-2 py-1 rounded">
          Base histórica
        </span>
      </div>
      <div className="grid grid-cols-5 divide-x divide-[var(--nova-border)]">
        {metricas.map(m => (
          <div key={m.label} className="px-4 py-4 space-y-2">
            <p className="text-[0.65rem] text-[var(--nova-text-dim)] uppercase tracking-wide">{m.label}</p>
            <p className="text-2xl font-bold" style={{ color: m.color }}>
              {m.value.toFixed(1)}%
            </p>
            <div className="h-1 rounded-full bg-[var(--nova-bg-elev-2)] overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: Math.min(m.value, 100) + '%', background: m.color }}
              />
            </div>
            <p className="text-[0.6rem] text-[var(--nova-text-dim)]">{m.ref}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

type FiltroLead = 'todos' | 'respondeu' | 'lido' | 'entregue' | 'falha'

export default function DisparosDashboardPage() {
  const [selectedId, setSelectedId] = useState(CAMPANHAS[0].id)
  const [open, setOpen]             = useState(false)
  const [leads, setLeads]           = useState<LeadDisparo[]>([])
  const [leadsLoading, setLeadsLoading] = useState(false)
  const [leadsError, setLeadsError] = useState<'none' | 'not_found' | 'error'>('none')
  const [buscaLead, setBuscaLead]   = useState('')
  const [filtroLead, setFiltroLead] = useState<FiltroLead>('todos')

  const c = CAMPANHAS.find(x => x.id === selectedId) ?? CAMPANHAS[0]

  const carregarLeads = useCallback(async (id: string) => {
    setLeadsLoading(true)
    setLeadsError('none')
    setLeads([])
    setBuscaLead('')
    setFiltroLead('todos')
    try {
      const res = await fetch(`/campanhas/${id}.csv`, { cache: 'no-store' })
      if (res.status === 404) { setLeadsError('not_found'); return }
      if (!res.ok)            { setLeadsError('error'); return }
      const text = await res.text()
      setLeads(parseLeadsCSV(text))
    } catch {
      setLeadsError('error')
    } finally {
      setLeadsLoading(false)
    }
  }, [])

  useEffect(() => { carregarLeads(selectedId) }, [selectedId, carregarLeads])

  const leadsFiltrados = leads.filter(l => {
    const q = buscaLead.toLowerCase()
    const matchBusca = !q || l.nome.toLowerCase().includes(q) || l.whatsapp.includes(q)
    const s = l.status.toLowerCase()
    const matchFiltro =
      filtroLead === 'todos'     ? true :
      filtroLead === 'respondeu' ? !!l.respondeu_em :
      filtroLead === 'lido'      ? s === 'read' :
      filtroLead === 'entregue'  ? s === 'delivered' :
      filtroLead === 'falha'     ? s === 'failed' : true
    return matchBusca && matchFiltro
  })

  const kpis = [
    {
      label: 'Total na base',
      value: fmtN(c.total),
      sub: null,
      icon: Users,
      color: 'text-[var(--nova-text)]',
      bg: 'bg-[var(--nova-bg-elev-2)]',
    },
    {
      label: 'Enviados',
      value: fmtN(c.enviados),
      sub: pct(c.enviados, c.total) + ' do total',
      icon: Send,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
    },
    {
      label: 'Entregues',
      value: fmtN(c.entregues),
      sub: pct(c.entregues, c.enviados) + ' dos enviados',
      icon: CheckCheck,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
    },
    {
      label: 'Lidos',
      value: fmtN(c.lidos),
      sub: pct(c.lidos, c.entregues) + ' dos entregues',
      icon: Eye,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Respostas',
      value: fmtN(c.respostas),
      sub: pct(c.respostas, c.entregues) + ' dos entregues',
      icon: MessageSquare,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
    {
      label: 'Falhas',
      value: fmtN(c.falhas),
      sub: pct(c.falhas, c.total) + ' do total',
      icon: XCircle,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
    },
  ]

  const funnelData = [
    { name: 'Total',     valor: c.total,     fill: '#6366f1' },
    { name: 'Enviados',  valor: c.enviados,  fill: '#22c55e' },
    { name: 'Entregues', valor: c.entregues, fill: '#3b82f6' },
    { name: 'Lidos',     valor: c.lidos,     fill: '#f59e0b' },
    { name: 'Respostas', valor: c.respostas, fill: '#a855f7' },
  ]

  return (
    <>
      <TopBar title="Dashboard de Disparos" />
      <main className="flex-1 overflow-auto p-5 space-y-5">

        {/* Seletor de campanha */}
        <div className="relative inline-block">
          <button
            onClick={() => setOpen(o => !o)}
            className="flex items-center gap-2 rounded-md border border-[var(--nova-border)] bg-[var(--nova-bg-elev)] px-3 py-2 text-sm text-[var(--nova-text)] hover:bg-[var(--nova-bg-elev-2)] transition-nova"
          >
            <span className="font-medium">{c.nome}</span>
            <span className="text-[var(--nova-text-dim)] text-xs">{c.data}</span>
            <ChevronDown size={14} className={cn('text-[var(--nova-text-dim)] transition-transform', open && 'rotate-180')} />
          </button>

          {open && (
            <div className="absolute top-full mt-1 left-0 z-50 min-w-[280px] rounded-md border border-[var(--nova-border)] bg-[var(--nova-bg-elev)] shadow-lg py-1">
              {CAMPANHAS.map(cam => (
                <button
                  key={cam.id}
                  onClick={() => { setSelectedId(cam.id); setOpen(false) }}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-[var(--nova-bg-elev-2)] transition-nova',
                    cam.id === selectedId && 'bg-[var(--nova-bg-elev-2)]',
                  )}
                >
                  <div className="text-left">
                    <p className="font-medium text-[var(--nova-text)]">{cam.nome}</p>
                    <p className="text-xs text-[var(--nova-text-dim)]">{cam.data} · {cam.status}</p>
                  </div>
                  {cam.id === selectedId && (
                    <span className="text-indigo-400 text-xs font-semibold">✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Status badge */}
        <div className="flex items-center gap-2 -mt-2">
          <span className={cn(
            'inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full',
            c.status === 'Concluída'
              ? 'bg-green-500/10 text-green-400'
              : 'bg-amber-500/10 text-amber-400',
          )}>
            <span className={cn('w-1.5 h-1.5 rounded-full', c.status === 'Concluída' ? 'bg-green-400' : 'bg-amber-400')} />
            {c.status}
          </span>
          <span className="text-xs text-[var(--nova-text-dim)]">Disparo realizado em {c.data}</span>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {kpis.map(k => {
            const Icon = k.icon
            return (
              <div
                key={k.label}
                className="rounded-lg border border-[var(--nova-border)] bg-[var(--nova-bg-elev)] p-4 space-y-2"
              >
                <div className={cn('w-8 h-8 rounded-md flex items-center justify-center', k.bg)}>
                  <Icon size={16} className={k.color} />
                </div>
                <p className="text-xs text-[var(--nova-text-dim)]">{k.label}</p>
                <p className={cn('text-2xl font-bold', k.color)}>{k.value}</p>
                {k.sub && <p className="text-[0.65rem] text-[var(--nova-text-dim)]">{k.sub}</p>}
              </div>
            )
          })}
        </div>

        {/* Funil + taxas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Gráfico de funil (barras horizontais) */}
          <div className="lg:col-span-2 rounded-lg border border-[var(--nova-border)] bg-[var(--nova-bg-elev)] p-4">
            <p className="text-sm font-semibold text-[var(--nova-text)] mb-4">Funil de disparo</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={funnelData} layout="vertical" barCategoryGap={12}>
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={70}
                  tick={{ fontSize: 12, fill: 'var(--nova-text-muted)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(v: number) => [fmtN(v), 'Contatos']}
                  contentStyle={{
                    background: 'var(--nova-bg-elev-2)',
                    border: '1px solid var(--nova-border)',
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="valor" radius={[0, 4, 4, 0]} label={{ position: 'insideRight', formatter: (v: number) => fmtN(v), fill: '#fff', fontSize: 11, fontWeight: 600, dx: -8 }}>
                  {funnelData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Taxas */}
          <div className="rounded-lg border border-[var(--nova-border)] bg-[var(--nova-bg-elev)] p-4 space-y-3">
            <p className="text-sm font-semibold text-[var(--nova-text)] mb-2">Taxas de conversão</p>
            {[
              { label: 'Envio',     value: c.enviados,  den: c.total,     color: '#6366f1' },
              { label: 'Entrega',   value: c.entregues, den: c.enviados,  color: '#22c55e' },
              { label: 'Leitura',   value: c.lidos,     den: c.entregues, color: '#3b82f6' },
              { label: 'Resposta',  value: c.respostas, den: c.entregues, color: '#f59e0b' },
              { label: 'Falha',     value: c.falhas,    den: c.total,     color: '#ef4444' },
            ].map(r => {
              const p = (den: number) => den > 0 ? (r.value / den) * 100 : 0
              const perc = p(r.den)
              return (
                <div key={r.label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--nova-text-muted)]">{r.label}</span>
                    <span className="font-semibold" style={{ color: r.color }}>{perc.toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[var(--nova-bg-elev-2)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: Math.min(perc, 100) + '%', background: r.color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Base de leads do disparo */}
        <div className="rounded-lg border border-[var(--nova-border)] bg-[var(--nova-bg-elev)] overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--nova-border)] flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--nova-text)]">Base de leads</p>
              <p className="text-xs text-[var(--nova-text-dim)] mt-0.5">Resultado individual por contato</p>
            </div>
            {leads.length > 0 && (
              <span className="text-[0.625rem] font-medium text-[var(--nova-text-dim)] bg-[var(--nova-bg-elev-2)] px-2 py-1 rounded">
                {leadsFiltrados.length} de {leads.length} leads
              </span>
            )}
          </div>

          {leadsLoading && (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-[var(--nova-text-dim)]">
              <Loader2 size={16} className="animate-spin" /> Carregando leads…
            </div>
          )}

          {!leadsLoading && leadsError === 'not_found' && (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-[var(--nova-text-dim)]">
              <AlertCircle size={20} className="opacity-40" />
              <p className="text-sm">Dados detalhados não disponíveis para este disparo</p>
              <p className="text-xs opacity-60">Suba o CSV do disparo para visualizar lead a lead</p>
            </div>
          )}

          {!leadsLoading && leadsError === 'none' && leads.length > 0 && (
            <>
              {/* Filtros de lead */}
              <div className="px-4 py-3 border-b border-[var(--nova-border)] flex flex-wrap gap-2 items-center">
                <div className="relative flex-1 min-w-[200px]">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--nova-text-dim)]" />
                  <input
                    value={buscaLead}
                    onChange={e => setBuscaLead(e.target.value)}
                    placeholder="Buscar por nome ou telefone…"
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-[var(--nova-border)] bg-[var(--nova-bg-elev-2)] text-[var(--nova-text)] placeholder:text-[var(--nova-text-dim)] focus:outline-none focus:ring-1 focus:ring-[var(--nova-blue)]"
                  />
                </div>
                <div className="flex gap-1">
                  {([
                    { k: 'todos',     label: 'Todos' },
                    { k: 'respondeu', label: 'Responderam' },
                    { k: 'lido',      label: 'Lidos' },
                    { k: 'entregue',  label: 'Entregues' },
                    { k: 'falha',     label: 'Falhas' },
                  ] as { k: FiltroLead; label: string }[]).map(f => (
                    <button key={f.k} onClick={() => setFiltroLead(f.k)}
                      className={cn('px-3 py-1.5 text-xs rounded-md border transition-nova',
                        filtroLead === f.k
                          ? 'bg-[var(--btn-blue-bg)] border-[var(--btn-blue-border)] text-[var(--btn-blue-text)]'
                          : 'border-[var(--nova-border)] text-[var(--nova-text-muted)] hover:text-[var(--nova-text)] hover:bg-white/[0.04]',
                      )}
                    >{f.label}</button>
                  ))}
                </div>
              </div>

              {/* Tabela */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[var(--nova-bg-elev-2)]">
                      {['Nome', 'Telefone', 'Status', 'Enviado', 'Entregue', 'Lido', 'Respondeu', 'Erro'].map(h => (
                        <th key={h} className="px-3 py-2.5 text-left text-[0.625rem] font-medium uppercase tracking-wider text-[var(--nova-text-dim)] whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--nova-border)]/50">
                    {leadsFiltrados.slice(0, 200).map((l, i) => (
                      <tr key={i} className={cn('hover:bg-white/[0.02]', l.respondeu_em && 'bg-amber-500/[0.03]')}>
                        <td className="px-3 py-2 font-medium text-[var(--nova-text)] whitespace-nowrap max-w-[220px] truncate" title={l.nome}>{l.nome}</td>
                        <td className="px-3 py-2 text-[var(--nova-text-muted)] whitespace-nowrap">
                          <a href={`tel:+${l.whatsapp}`} className="hover:text-[var(--nova-blue)] flex items-center gap-1">
                            <Phone size={10} />
                            {l.whatsapp.replace(/^55/, '+55 ').replace(/(\d{2})(\d{5})(\d{4})$/, '$1 $2-$3')}
                          </a>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap"><StatusBadge status={l.respondeu_em ? 'replied' : l.status} /></td>
                        <td className="px-3 py-2 text-xs text-[var(--nova-text-dim)] whitespace-nowrap">{fmtHorario(l.enviado_em)}</td>
                        <td className="px-3 py-2 text-xs text-[var(--nova-text-dim)] whitespace-nowrap">{fmtHorario(l.entregue_em)}</td>
                        <td className="px-3 py-2 text-xs text-[var(--nova-text-dim)] whitespace-nowrap">{fmtHorario(l.lido_em)}</td>
                        <td className="px-3 py-2 text-xs whitespace-nowrap">
                          {l.respondeu_em
                            ? <span className="text-amber-400 font-medium">{fmtHorario(l.respondeu_em)}</span>
                            : <span className="text-[var(--nova-text-dim)]">—</span>}
                        </td>
                        <td className="px-3 py-2 text-xs text-red-400 max-w-[160px] truncate" title={l.erro}>{l.erro || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {leadsFiltrados.length > 200 && (
                <div className="px-4 py-2.5 border-t border-[var(--nova-border)] text-xs text-[var(--nova-text-dim)]">
                  Exibindo 200 de {leadsFiltrados.length} leads
                </div>
              )}
            </>
          )}
        </div>

        {/* Benchmark médio de todos os disparos */}
        <BenchmarkBar campanhas={CAMPANHAS} />

        {/* Tabela resumo */}
        <div className="rounded-lg border border-[var(--nova-border)] bg-[var(--nova-bg-elev)] overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--nova-border)]">
            <p className="text-sm font-semibold text-[var(--nova-text)]">Resumo numérico</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--nova-bg-elev-2)]">
                  {['Métrica', 'Valor absoluto', 'Referência', 'Taxa'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[0.625rem] font-medium uppercase tracking-wider text-[var(--nova-text-dim)]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--nova-border)]/50">
                {[
                  { label: 'Total na base', value: c.total,     ref: '—',             taxa: '—' },
                  { label: 'Enviados',      value: c.enviados,  ref: 'do total',       taxa: pct(c.enviados, c.total) },
                  { label: 'Entregues',     value: c.entregues, ref: 'dos enviados',   taxa: pct(c.entregues, c.enviados) },
                  { label: 'Lidos',         value: c.lidos,     ref: 'dos entregues',  taxa: pct(c.lidos, c.entregues) },
                  { label: 'Respostas',     value: c.respostas, ref: 'dos entregues',  taxa: pct(c.respostas, c.entregues) },
                  { label: 'Falhas',        value: c.falhas,    ref: 'do total',       taxa: pct(c.falhas, c.total) },
                ].map(row => (
                  <tr key={row.label} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-2.5 font-medium text-[var(--nova-text)]">{row.label}</td>
                    <td className="px-4 py-2.5 text-[var(--nova-text)]">{fmtN(row.value)}</td>
                    <td className="px-4 py-2.5 text-[var(--nova-text-dim)] text-xs">{row.ref}</td>
                    <td className="px-4 py-2.5 font-semibold text-[var(--nova-text)]">{row.taxa}</td>
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
