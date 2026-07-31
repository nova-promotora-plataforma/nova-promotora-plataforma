'use client'

import { useEffect, useState } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { Badge } from '@/components/ui/Badge'
import { KPICard } from '@/components/ui/KPICard'
import { Loader2 } from 'lucide-react'
import {
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'

// ─── Dados estáticos (apurado 29/07/2026) ─────────────────────────────────────
const STATS = {
  totalLeads:     3682,
  jaParceiros:    545,
  naoCadastrados: 3137,
  taxaConversao:  14.8,
}

const pieData = [
  { name: 'Já são parceiros', value: STATS.jaParceiros,    color: '#34d399' },
  { name: 'Não cadastrados',  value: STATS.naoCadastrados, color: '#60a5fa' },
]

const barData = [
  { name: 'Leads totais',    value: STATS.totalLeads,     color: '#94a3b8' },
  { name: 'Já são parceiros', value: STATS.jaParceiros,   color: '#34d399' },
  { name: 'Não cadastrados',  value: STATS.naoCadastrados, color: '#60a5fa' },
]

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

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

export default function LeadsNexxoPage() {
  const [parceiros, setParceiros] = useState<Parceiro[]>([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    fetch('/api/leads/nexxo')
      .then(r => r.json())
      .then(d => setParceiros(d.parceiros ?? []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <TopBar title="Leads Nexxo — Cruzamento com Parceiros" />
      <main className="flex-1 overflow-auto p-5 space-y-5">

        {/* Cabeçalho */}
        <div className="rounded-md border border-[var(--nova-border)] bg-[var(--nova-bg-elev)] p-5">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <p className="text-xs text-[var(--nova-text-dim)] uppercase tracking-widest mb-1">Base de Leads</p>
              <h2 className="text-base font-bold text-[var(--nova-text)]">Leads Nexxo × Parceiros Nova Promotora</h2>
              <p className="text-sm text-[var(--nova-text-muted)] mt-0.5">
                PROCV por telefone — leads enviados ao comercial cruzados com a base atual de parceiros
              </p>
            </div>
            <p className="text-xs text-[var(--nova-text-dim)]">Atualizado em 29/07/2026</p>
          </div>

          <div className="mt-4 rounded-sm border border-[var(--nova-border)] bg-[var(--nova-bg-elev-2)] px-4 py-3">
            <p className="text-[0.625rem] font-medium uppercase tracking-widest text-[var(--nova-text-dim)] mb-1">Metodologia</p>
            <p className="text-xs text-[var(--nova-text-muted)] leading-relaxed">
              Cruzamento realizado por número de telefone (normalizado — somente dígitos, remoção do código +55).
              Os 6 campos de telefone do cadastro de parceiros foram verificados para cada lead.
              Leads sem telefone válido foram desconsiderados.
            </p>
          </div>
        </div>

        {/* KPIs */}
        <section>
          <p className="text-[0.625rem] font-medium uppercase tracking-widest text-[var(--nova-text-dim)] mb-3">Visão Geral</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KPICard label="Leads na base"      value={STATS.totalLeads.toLocaleString('pt-BR')}     sub="com telefone válido" />
            <KPICard label="Já são parceiros"   value={STATS.jaParceiros.toLocaleString('pt-BR')}    sub={`${STATS.taxaConversao}% dos leads`} />
            <KPICard label="Não cadastrados"    value={STATS.naoCadastrados.toLocaleString('pt-BR')} sub="ainda não viraram parceiros" />
            <KPICard label="Taxa de conversão"  value={`${STATS.taxaConversao}%`}                    sub="lead → parceiro cadastrado" />
          </div>
        </section>

        {/* Gráficos */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-md border border-[var(--nova-border)] bg-[var(--nova-bg-elev)] p-4">
            <p className="text-sm font-semibold text-[var(--nova-text)] mb-1">Distribuição da base de leads</p>
            <p className="text-xs text-[var(--nova-text-dim)] mb-4">Do total de leads, quantos já são parceiros</p>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ percent }) => `${(percent * 100).toFixed(1)}%`}>
                  {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ color: '#8898AA', fontSize: 12 }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-md border border-[var(--nova-border)] bg-[var(--nova-bg-elev)] p-4">
            <p className="text-sm font-semibold text-[var(--nova-text)] mb-1">Comparativo absoluto</p>
            <p className="text-xs text-[var(--nova-text-dim)] mb-4">Quantidade de leads por categoria</p>
            <ResponsiveContainer width="100%" height={220}>
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
        </section>

        {/* Nota de oportunidade */}
        <div className="rounded-md border border-[var(--nova-border)] bg-[var(--nova-bg-elev)] px-5 py-4">
          <p className="text-sm font-semibold text-[var(--nova-text)]">
            {STATS.naoCadastrados.toLocaleString('pt-BR')} leads ainda não são parceiros
          </p>
          <p className="text-xs text-[var(--nova-text-muted)] mt-1">
            Esses leads passaram pelo funil comercial mas ainda não foram cadastrados como parceiros.
            São candidatos para ações de conversão — disparo, ligação ou abordagem via comercial responsável.
          </p>
        </div>

        {/* Tabela de parceiros identificados */}
        <section>
          <p className="text-[0.625rem] font-medium uppercase tracking-widest text-[var(--nova-text-dim)] mb-3">
            Parceiros identificados na base de leads
          </p>

          {loading ? (
            <div className="flex items-center justify-center h-24 text-[var(--nova-text-dim)]">
              <Loader2 size={18} className="animate-spin mr-2" /> Cruzando bases…
            </div>
          ) : (
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
                    {parceiros.map(p => (
                      <tr key={p.codigo} className="hover:bg-white/[0.02] transition-nova">
                        <td className="px-4 py-2.5 text-xs font-mono text-[var(--nova-text-dim)]">{p.codigo}</td>
                        <td className="px-4 py-2.5">
                          <p className="font-medium text-[var(--nova-text)] truncate max-w-[220px]">{p.nome}</p>
                        </td>
                        <td className="px-4 py-2.5 text-[var(--nova-text-muted)]">
                          {p.cidade && p.uf ? `${p.cidade} / ${p.uf}` : p.uf ?? '—'}
                        </td>
                        <td className="px-4 py-2.5 text-[var(--nova-text-muted)]">
                          {p.ultimaProd ?? '—'}
                        </td>
                        <td className="px-4 py-2.5 font-semibold text-[var(--nova-text)]">
                          {fmt(p.total)}
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
          )}
        </section>

      </main>
    </>
  )
}
