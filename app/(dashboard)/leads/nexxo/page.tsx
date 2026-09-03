'use client'

import { useEffect, useState } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { Badge } from '@/components/ui/Badge'
import { KPICard } from '@/components/ui/KPICard'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface Parceiro {
  codigo:     string
  nome:       string
  cidade:     string | null
  uf:         string | null
  ultimaProd: string | null
  total:      number
  status:     'ATIVO' | 'INATIVO'
}
interface Stats {
  totalLeads:     number
  jaParceiros:    number
  naoCadastrados: number
  taxaConversao:  number
}
interface BaseData { parceiros: Parceiro[]; stats: Stats | null; loading: boolean }

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

const BASES = [
  { id: 'nexxo',         label: 'Nexxo',                    endpoint: '/api/leads/nexxo' },
  { id: 'bot-alexandre', label: 'Bot Alexandre Matos',       endpoint: '/api/leads/bot-alexandre' },
  { id: 'bot',           label: 'Bot',                       endpoint: '/api/leads/bot' },
]

// ─── Sub-componente: visão de uma base ───────────────────────────────────────
function BaseView({ data, label }: { data: BaseData; label: string }) {
  const { parceiros, stats, loading } = data

  if (loading) return (
    <div className="flex items-center justify-center h-40 text-[var(--nova-text-dim)]">
      <Loader2 size={18} className="animate-spin mr-2" /> Cruzando base {label}…
    </div>
  )

  if (!stats) return null

  const pieData = [
    { name: 'Já são parceiros', value: stats.jaParceiros,    color: '#34d399' },
    { name: 'Não cadastrados',  value: stats.naoCadastrados, color: '#60a5fa' },
  ]
  const barData = [
    { name: 'Leads totais',     value: stats.totalLeads,     color: '#94a3b8' },
    { name: 'Já são parceiros', value: stats.jaParceiros,    color: '#34d399' },
    { name: 'Não cadastrados',  value: stats.naoCadastrados, color: '#60a5fa' },
  ]

  return (
    <div className="space-y-5">
      {/* KPIs da base */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard label="Leads na base"     value={stats.totalLeads.toLocaleString('pt-BR')}     sub="com telefone válido" />
        <KPICard label="Já são parceiros"  value={stats.jaParceiros.toLocaleString('pt-BR')}    sub={`${stats.taxaConversao}% dos leads`} />
        <KPICard label="Não cadastrados"   value={stats.naoCadastrados.toLocaleString('pt-BR')} sub="ainda não viraram parceiros" />
        <KPICard label="Taxa de conversão" value={`${stats.taxaConversao}%`}                    sub="lead → parceiro cadastrado" />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-md border border-[var(--nova-border)] bg-[var(--nova-bg-elev)] p-4">
          <p className="text-sm font-semibold text-[var(--nova-text)] mb-1">Distribuição da base</p>
          <p className="text-xs text-[var(--nova-text-dim)] mb-4">Quantos leads já são parceiros</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75}
                label={({ percent }) => `${(percent * 100).toFixed(1)}%`}>
                {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Legend iconType="circle" iconSize={8}
                formatter={(v) => <span style={{ color: '#8898AA', fontSize: 12 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-md border border-[var(--nova-border)] bg-[var(--nova-bg-elev)] p-4">
          <p className="text-sm font-semibold text-[var(--nova-text)] mb-1">Comparativo absoluto</p>
          <p className="text-xs text-[var(--nova-text-dim)] mb-4">Quantidade de leads por categoria</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="rgba(34,48,74,0.6)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#5D6880', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#5D6880', fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
              <Tooltip
                contentStyle={{ background: '#0E1421', border: '1px solid #22304A', borderRadius: 8, fontSize: 12, color: '#EEF2F8' }}
                formatter={(v: number) => [v.toLocaleString('pt-BR'), 'Leads']}
              />
              <Bar dataKey="value" radius={[4,4,0,0]}>
                {barData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabela de parceiros */}
      <div className="rounded-md border border-[var(--nova-border)] bg-[var(--nova-bg-elev)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--nova-border)]">
          <p className="text-sm font-semibold text-[var(--nova-text)]">
            {parceiros.length} parceiros identificados
          </p>
          <p className="text-xs text-[var(--nova-text-dim)] mt-0.5">Ordenados por produção total acumulada</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--nova-bg-elev-2)]">
                {['Código', 'Nome', 'Cidade / UF', 'Último prod.', 'Total acumulado', 'Status'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[0.625rem] font-medium uppercase tracking-wider text-[var(--nova-text-dim)]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--nova-border)]/50">
              {parceiros.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-xs text-[var(--nova-text-dim)]">
                    Nenhum parceiro identificado nessa base
                  </td>
                </tr>
              ) : parceiros.map(p => (
                <tr key={p.codigo} className="hover:bg-white/[0.02] transition-nova">
                  <td className="px-4 py-2.5 text-xs font-mono text-[var(--nova-text-dim)]">{p.codigo}</td>
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-[var(--nova-text)] truncate max-w-[220px]">{p.nome}</p>
                  </td>
                  <td className="px-4 py-2.5 text-[var(--nova-text-muted)]">
                    {p.cidade && p.uf ? `${p.cidade} / ${p.uf}` : p.uf ?? '—'}
                  </td>
                  <td className="px-4 py-2.5 text-[var(--nova-text-muted)]">{p.ultimaProd ?? '—'}</td>
                  <td className="px-4 py-2.5 font-semibold text-[var(--nova-text)]">{fmt(p.total)}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant={p.status === 'ATIVO' ? 'ativo' : 'inativo'} dot>
                      {p.status === 'ATIVO' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Aba consolidada ──────────────────────────────────────────────────────────
function TodasAsBasesView({ bases }: { bases: Record<string, BaseData> }) {
  const allLoading = Object.values(bases).some(b => b.loading)

  if (allLoading) return (
    <div className="flex items-center justify-center h-40 text-[var(--nova-text-dim)]">
      <Loader2 size={18} className="animate-spin mr-2" /> Cruzando todas as bases…
    </div>
  )

  // Merge: deduplicar por codigo, somar total, manter status mais recente, agregar origens
  const merged = new Map<string, Parceiro & { origens: string[] }>()
  for (const base of BASES) {
    for (const p of bases[base.id]?.parceiros ?? []) {
      if (merged.has(p.codigo)) {
        const ex = merged.get(p.codigo)!
        ex.total += p.total
        ex.origens.push(base.label)
      } else {
        merged.set(p.codigo, { ...p, origens: [base.label] })
      }
    }
  }
  const parceiros = Array.from(merged.values()).sort((a, b) => b.total - a.total)

  return (
    <div className="space-y-5">
      <div className="rounded-md border border-[var(--nova-border)] bg-[var(--nova-bg-elev)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--nova-border)]">
          <p className="text-sm font-semibold text-[var(--nova-text)]">
            {parceiros.length} parceiros identificados em todas as bases
          </p>
          <p className="text-xs text-[var(--nova-text-dim)] mt-0.5">
            Parceiros presentes em múltiplas bases aparecem uma vez com produção somada · ordenados por total acumulado
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--nova-bg-elev-2)]">
                {['Código', 'Nome', 'Cidade / UF', 'Último prod.', 'Total acumulado', 'Bases', 'Status'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[0.625rem] font-medium uppercase tracking-wider text-[var(--nova-text-dim)]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--nova-border)]/50">
              {parceiros.map(p => (
                <tr key={p.codigo} className="hover:bg-white/[0.02] transition-nova">
                  <td className="px-4 py-2.5 text-xs font-mono text-[var(--nova-text-dim)]">{p.codigo}</td>
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-[var(--nova-text)] truncate max-w-[200px]">{p.nome}</p>
                  </td>
                  <td className="px-4 py-2.5 text-[var(--nova-text-muted)]">
                    {p.cidade && p.uf ? `${p.cidade} / ${p.uf}` : p.uf ?? '—'}
                  </td>
                  <td className="px-4 py-2.5 text-[var(--nova-text-muted)]">{p.ultimaProd ?? '—'}</td>
                  <td className="px-4 py-2.5 font-semibold text-[var(--nova-text)]">{fmt(p.total)}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {p.origens.map(o => (
                        <span key={o} className="text-[0.5625rem] px-1.5 py-0.5 rounded-sm bg-[var(--nova-bg-elev-2)] border border-[var(--nova-border)] text-[var(--nova-text-dim)]">
                          {o}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge variant={p.status === 'ATIVO' ? 'ativo' : 'inativo'} dot>
                      {p.status === 'ATIVO' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function LeadsPage() {
  const [activeTab, setActiveTab] = useState('nexxo')
  const [bases, setBases] = useState<Record<string, BaseData>>(
    Object.fromEntries(BASES.map(b => [b.id, { parceiros: [], stats: null, loading: true }]))
  )

  useEffect(() => {
    BASES.forEach(b => {
      fetch(b.endpoint)
        .then(r => r.json())
        .then(d => setBases(prev => ({
          ...prev,
          [b.id]: { parceiros: d.parceiros ?? [], stats: d.stats ?? null, loading: false },
        })))
        .catch(() => setBases(prev => ({ ...prev, [b.id]: { parceiros: [], stats: null, loading: false } })))
    })
  }, [])

  // Consolidado
  const allLoading = Object.values(bases).some(b => b.loading)
  const totalLeads     = Object.values(bases).reduce((s, b) => s + (b.stats?.totalLeads ?? 0), 0)
  const totalParceiros = Object.values(bases).reduce((s, b) => s + (b.stats?.jaParceiros ?? 0), 0)
  const totalNaoCad    = Object.values(bases).reduce((s, b) => s + (b.stats?.naoCadastrados ?? 0), 0)
  const taxaGeral      = totalLeads > 0 ? +((totalParceiros / totalLeads) * 100).toFixed(1) : 0

  return (
    <>
      <TopBar title="Leads — Cruzamento com Parceiros" />
      <main className="flex-1 overflow-auto p-5 space-y-5">

        {/* Cabeçalho */}
        <div className="rounded-md border border-[var(--nova-border)] bg-[var(--nova-bg-elev)] px-5 py-4">
          <p className="text-xs text-[var(--nova-text-dim)] uppercase tracking-widest mb-1">Base de Leads</p>
          <h2 className="text-base font-bold text-[var(--nova-text)]">Leads × Parceiros Nova Promotora</h2>
          <p className="text-sm text-[var(--nova-text-muted)] mt-0.5">
            PROCV por telefone — leads de múltiplas origens cruzados com a base atual de parceiros
          </p>
        </div>

        {/* KPIs consolidados */}
        <section>
          <p className="text-[0.625rem] font-medium uppercase tracking-widest text-[var(--nova-text-dim)] mb-3">
            Consolidado — todas as bases
          </p>
          {allLoading ? (
            <div className="flex items-center gap-2 text-xs text-[var(--nova-text-dim)]">
              <Loader2 size={14} className="animate-spin" /> Carregando…
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <KPICard label="Total de leads"    value={totalLeads.toLocaleString('pt-BR')}     sub={`${BASES.length} bases`} />
              <KPICard label="Já são parceiros"  value={totalParceiros.toLocaleString('pt-BR')} sub={`${taxaGeral}% dos leads`} />
              <KPICard label="Não cadastrados"   value={totalNaoCad.toLocaleString('pt-BR')}    sub="oportunidades de conversão" />
              <KPICard label="Taxa consolidada"  value={`${taxaGeral}%`}                        sub="lead → parceiro cadastrado" />
            </div>
          )}
        </section>

        {/* Abas por base */}
        <section>
          <div className="flex gap-1 border-b border-[var(--nova-border)] mb-5">
            {BASES.map(b => (
              <button
                key={b.id}
                onClick={() => setActiveTab(b.id)}
                className={cn(
                  'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-nova',
                  activeTab === b.id
                    ? 'border-[var(--nova-blue)] text-[var(--nova-text)]'
                    : 'border-transparent text-[var(--nova-text-dim)] hover:text-[var(--nova-text)]'
                )}
              >
                {b.label}
                {!bases[b.id].loading && bases[b.id].stats && (
                  <span className="ml-2 text-[0.625rem] font-normal text-[var(--nova-text-dim)]">
                    {bases[b.id].stats!.jaParceiros} parceiros
                  </span>
                )}
              </button>
            ))}
            <button
              onClick={() => setActiveTab('todas')}
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-nova',
                activeTab === 'todas'
                  ? 'border-[var(--nova-blue)] text-[var(--nova-text)]'
                  : 'border-transparent text-[var(--nova-text-dim)] hover:text-[var(--nova-text)]'
              )}
            >
              Todas as bases
            </button>
          </div>

          {BASES.map(b => activeTab === b.id && (
            <BaseView key={b.id} data={bases[b.id]} label={b.label} />
          ))}
          {activeTab === 'todas' && <TodasAsBasesView bases={bases} />}
        </section>

      </main>
    </>
  )
}
