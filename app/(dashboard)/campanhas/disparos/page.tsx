'use client'

import { useState } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { ChevronDown, Send, CheckCheck, Eye, MessageSquare, XCircle, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

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

export default function DisparosDashboardPage() {
  const [selectedId, setSelectedId] = useState(CAMPANHAS[0].id)
  const [open, setOpen] = useState(false)

  const c = CAMPANHAS.find(x => x.id === selectedId) ?? CAMPANHAS[0]

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
                <Bar dataKey="valor" radius={[0, 4, 4, 0]}>
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
