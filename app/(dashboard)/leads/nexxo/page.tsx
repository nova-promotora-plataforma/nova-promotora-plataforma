'use client'

import { TopBar } from '@/components/layout/TopBar'
import { KPICard } from '@/components/ui/KPICard'
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'

// ─── Dados apurados em 29/07/2026 ────────────────────────────────────────────
const DATA = {
  totalLeads:       3682,
  jaParceiros:      545,
  naoCadastrados:   3137,
  taxaConversao:    14.8,
  atualizadoEm:     '29/07/2026',
}

const pieData = [
  { name: 'Já são parceiros', value: DATA.jaParceiros,    color: '#34d399' },
  { name: 'Não cadastrados',  value: DATA.naoCadastrados,  color: '#60a5fa' },
]

const barData = [
  { label: 'Leads totais',       value: DATA.totalLeads,      color: '#94a3b8' },
  { label: 'Já são parceiros',   value: DATA.jaParceiros,     color: '#34d399' },
  { label: 'Não cadastrados',    value: DATA.naoCadastrados,  color: '#60a5fa' },
]

const RADIAN = Math.PI / 180
function CustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) {
  const r  = innerRadius + (outerRadius - innerRadius) * 0.55
  const x  = cx + r * Math.cos(-midAngle * RADIAN)
  const y  = cy + r * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
      {`${(percent * 100).toFixed(1)}%`}
    </text>
  )
}

export default function LeadsNexxoPage() {
  return (
    <>
      <TopBar title="Leads Nexxo — Cruzamento com Base de Parceiros" />
      <main className="flex-1 overflow-auto p-5 space-y-6">

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
            <p className="text-xs text-[var(--nova-text-dim)]">Atualizado em {DATA.atualizadoEm}</p>
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
          <p className="text-[0.625rem] font-medium uppercase tracking-widest text-[var(--nova-text-dim)] mb-3">Visão geral</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KPICard
              label="Leads na base"
              value={DATA.totalLeads.toLocaleString('pt-BR')}
              sub="com telefone válido"
            />
            <KPICard
              label="Já são parceiros"
              value={DATA.jaParceiros.toLocaleString('pt-BR')}
              sub={`${DATA.taxaConversao}% dos leads`}
            />
            <KPICard
              label="Não cadastrados"
              value={DATA.naoCadastrados.toLocaleString('pt-BR')}
              sub="ainda não viraram parceiros"
            />
            <KPICard
              label="Taxa de conversão"
              value={`${DATA.taxaConversao}%`}
              sub="lead → parceiro cadastrado"
            />
          </div>
        </section>

        {/* Gráficos */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Pizza */}
          <div className="rounded-md border border-[var(--nova-border)] bg-[var(--nova-bg-elev)] p-4">
            <p className="text-sm font-semibold text-[var(--nova-text)] mb-1">Distribuição da base de leads</p>
            <p className="text-xs text-[var(--nova-text-dim)] mb-4">Do total de leads, quantos já são parceiros</p>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="value"
                  labelLine={false}
                  label={CustomLabel}
                >
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#0E1421', border: '1px solid #22304A', borderRadius: 8, fontSize: 12, color: '#EEF2F8' }}
                  formatter={(v: number) => [v.toLocaleString('pt-BR'), 'Leads']}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Legenda */}
            <div className="flex justify-center gap-6 mt-2">
              {pieData.map(d => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                  <span className="text-xs text-[var(--nova-text-muted)]">{d.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Barras */}
          <div className="rounded-md border border-[var(--nova-border)] bg-[var(--nova-bg-elev)] p-4">
            <p className="text-sm font-semibold text-[var(--nova-text)] mb-1">Comparativo absoluto</p>
            <p className="text-xs text-[var(--nova-text-dim)] mb-4">Quantidade de leads por categoria</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="rgba(34,48,74,0.6)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#5D6880', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#5D6880', fontSize: 10 }} axisLine={false} tickLine={false} width={44}
                  tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                <Tooltip
                  contentStyle={{ background: '#0E1421', border: '1px solid #22304A', borderRadius: 8, fontSize: 12, color: '#EEF2F8' }}
                  formatter={(v: number) => [v.toLocaleString('pt-BR'), 'Leads']}
                />
                <Bar dataKey="value" radius={[4,4,0,0]}>
                  {barData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

        </section>

        {/* Oportunidade */}
        <div className="rounded-md border border-[var(--nova-blue)]/20 bg-[var(--nova-blue)]/5 p-4 flex gap-4 items-start">
          <div>
            <p className="text-sm font-semibold text-[var(--nova-text)] mb-1">
              {DATA.naoCadastrados.toLocaleString('pt-BR')} leads ainda não são parceiros
            </p>
            <p className="text-xs text-[var(--nova-text-muted)] leading-relaxed">
              Esses leads passaram pelo funil comercial mas ainda não foram cadastrados como parceiros.
              São candidatos para ações de conversão — disparo, ligação ou abordagem via comercial responsável.
            </p>
          </div>
        </div>

      </main>
    </>
  )
}
