'use client'

import { TopBar } from '@/components/layout/TopBar'
import { Badge } from '@/components/ui/Badge'
import { KPICard } from '@/components/ui/KPICard'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Cell,
} from 'recharts'

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

function fmtShort(v: number) {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000)     return `R$ ${(v / 1_000).toFixed(0)}K`
  return fmt(v)
}

// ─── Dados apurados em 29/07/2026 ────────────────────────────────────────────

const DISPARO = {
  data:     '26/05/2026',
  base:     2873,
  encontrados: 2800,
  naoEncontrados: 73,
}

const STATUS_ATUAL = {
  ativos:   1557,
  inativos: 1243,
}

const INSS = {
  antes:        1575,  // produziam INSS fev–mai/26
  depois:       715,   // produzem INSS jun–jul/26
  cresceram:    173,
  reduziram:    1438,
  estavel:      14,
  novosNoInss:  50,
  mediaMensalAntes:  92031578,
  mediaMensalDepois: 23654863,
}

const reativacaoRate = ((STATUS_ATUAL.ativos / DISPARO.encontrados) * 100).toFixed(1)
const crescimentoRate = ((INSS.cresceram / INSS.antes) * 100).toFixed(1)
const variacaoInss = (((INSS.mediaMensalDepois - INSS.mediaMensalAntes) / INSS.mediaMensalAntes) * 100).toFixed(1)

const chartStatusData = [
  { name: 'Ativos hoje',   value: STATUS_ATUAL.ativos,   color: '#34d399' },
  { name: 'Inativos hoje', value: STATUS_ATUAL.inativos, color: '#f87171' },
]

const chartInssData = [
  { name: 'Cresceram',      value: INSS.cresceram,   color: '#34d399' },
  { name: 'Novos no INSS',  value: INSS.novosNoInss, color: '#60a5fa' },
  { name: 'Estável',        value: INSS.estavel,     color: '#94a3b8' },
  { name: 'Reduziram',      value: INSS.reduziram,   color: '#f87171' },
]

const chartProducaoData = [
  { periodo: 'Antes (fev–mai/26)', valor: INSS.mediaMensalAntes  },
  { periodo: 'Depois (jun–jul/26)', valor: INSS.mediaMensalDepois },
]

const COPY = `Olá, [Nome]. A sua operação não precisa parar com as mudanças do INSS!

O Powerhub acabou de lançar uma ferramenta com IA integrada que:

✔️ Analisa sua carteira inteira, cliente por cliente e contrato por contrato.
✔️ E entrega clientes segmentados para: Refin com redução de parcela/Troco, Margem Livre e/ou Refin Troco

Você sobe a base (ou gera por filtro), a IA higieniza e qualifica, e você baixa o CSV pronto pra discadora ou CRM.

Se quer ver funcionando, peça pro seu comercial AGORA.`

export default function DisparoMaio2026Page() {
  return (
    <>
      <TopBar title="Análise — Disparo Powerhub INSS (maio/26)" />
      <main className="flex-1 overflow-auto p-5 space-y-6">

        {/* Cabeçalho da campanha */}
        <div className="rounded-md border border-[var(--nova-border)] bg-[var(--nova-bg-elev)] p-5">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <p className="text-xs text-[var(--nova-text-dim)] uppercase tracking-widest mb-1">Campanha</p>
              <h2 className="text-base font-bold text-[var(--nova-text)]">Disparo WhatsApp — Powerhub INSS</h2>
              <p className="text-sm text-[var(--nova-text-muted)] mt-0.5">
                Enviado em <span className="font-semibold text-[var(--nova-text)]">{DISPARO.data}</span> ·{' '}
                Base de parceiros ativos
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="ativo" dot>Encerrado</Badge>
              <Badge variant="amber">INSS</Badge>
            </div>
          </div>

          {/* Copy da campanha */}
          <div className="mt-4 rounded-sm border border-[var(--nova-border)] bg-[var(--nova-bg-elev-2)] p-4">
            <p className="text-[0.625rem] font-medium uppercase tracking-widest text-[var(--nova-text-dim)] mb-2">Mensagem enviada</p>
            <pre className="text-xs text-[var(--nova-text-muted)] whitespace-pre-wrap leading-relaxed font-sans">{COPY}</pre>
          </div>
        </div>

        {/* KPIs — Alcance */}
        <section>
          <p className="text-[0.625rem] font-medium uppercase tracking-widest text-[var(--nova-text-dim)] mb-3">Alcance da base</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KPICard label="Base disparada"          value={DISPARO.base.toLocaleString('pt-BR')}              sub="parceiros ativos em 26/05" />
            <KPICard label="No sistema hoje"         value={DISPARO.encontrados.toLocaleString('pt-BR')}       sub={`${((DISPARO.encontrados/DISPARO.base)*100).toFixed(1)}% da base disparada`} />
            <KPICard label="Ativos após disparo"     value={STATUS_ATUAL.ativos.toLocaleString('pt-BR')}       sub={`${reativacaoRate}% continuaram produzindo`} />
            <KPICard label="Inativos hoje"           value={STATUS_ATUAL.inativos.toLocaleString('pt-BR')}     sub="não produziram nos últimos 60 dias" />
          </div>
        </section>

        {/* Gráfico status + KPIs INSS */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Status atual */}
          <div className="rounded-md border border-[var(--nova-border)] bg-[var(--nova-bg-elev)] p-4">
            <p className="text-sm font-semibold text-[var(--nova-text)] mb-4">Status atual da base disparada</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartStatusData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="rgba(34,48,74,0.6)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#5D6880', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#5D6880', fontSize: 10 }} axisLine={false} tickLine={false} width={48} />
                <Tooltip
                  contentStyle={{ background: '#0E1421', border: '1px solid #22304A', borderRadius: 8, fontSize: 12, color: '#EEF2F8' }}
                  formatter={(v: number) => [v.toLocaleString('pt-BR'), 'Parceiros']}
                />
                <Bar dataKey="value" radius={[4,4,0,0]}>
                  {chartStatusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* KPIs INSS */}
          <div className="grid grid-cols-2 gap-3 content-start">
            <KPICard label="Produziam INSS antes"   value={INSS.antes.toLocaleString('pt-BR')}       sub="fev–mai/26" />
            <KPICard label="Produzem INSS depois"   value={INSS.depois.toLocaleString('pt-BR')}      sub="jun–jul/26" />
            <KPICard label="Cresceram no INSS"      value={INSS.cresceram.toLocaleString('pt-BR')}   sub={`${crescimentoRate}% dos que produziam antes`} />
            <KPICard label="Novos no INSS"          value={INSS.novosNoInss.toLocaleString('pt-BR')} sub="não produziam antes do disparo" />
          </div>
        </section>

        {/* Variação de produção INSS */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Comportamento INSS */}
          <div className="rounded-md border border-[var(--nova-border)] bg-[var(--nova-bg-elev)] p-4">
            <p className="text-sm font-semibold text-[var(--nova-text)] mb-4">Comportamento no INSS após o disparo</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartInssData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="rgba(34,48,74,0.6)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#5D6880', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#5D6880', fontSize: 10 }} axisLine={false} tickLine={false} width={48} />
                <Tooltip
                  contentStyle={{ background: '#0E1421', border: '1px solid #22304A', borderRadius: 8, fontSize: 12, color: '#EEF2F8' }}
                  formatter={(v: number) => [v.toLocaleString('pt-BR'), 'Parceiros']}
                />
                <Bar dataKey="value" radius={[4,4,0,0]}>
                  {chartInssData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Produção média mensal INSS */}
          <div className="rounded-md border border-[var(--nova-border)] bg-[var(--nova-bg-elev)] p-4">
            <p className="text-sm font-semibold text-[var(--nova-text)] mb-1">Produção média mensal — INSS</p>
            <p className="text-xs text-[var(--nova-text-dim)] mb-4">Comparativo da média mensal da base disparada</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={chartProducaoData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="rgba(34,48,74,0.6)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="periodo" tick={{ fill: '#5D6880', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#5D6880', fontSize: 10 }} axisLine={false} tickLine={false}
                  tickFormatter={v => `R$${(v/1_000_000).toFixed(0)}M`} width={52} />
                <Tooltip
                  contentStyle={{ background: '#0E1421', border: '1px solid #22304A', borderRadius: 8, fontSize: 12, color: '#EEF2F8' }}
                  formatter={(v: number) => [fmt(v), 'Média mensal INSS']}
                />
                <Bar dataKey="valor" radius={[4,4,0,0]}>
                  <Cell fill="#60a5fa" />
                  <Cell fill={Number(variacaoInss) >= 0 ? '#34d399' : '#f87171'} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-3 flex items-center justify-between text-xs">
              <div>
                <p className="text-[var(--nova-text-dim)]">Antes</p>
                <p className="font-semibold text-[var(--nova-text)]">{fmtShort(INSS.mediaMensalAntes)}/mês</p>
              </div>
              <div className="text-center">
                <p className={`text-lg font-bold ${Number(variacaoInss) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {variacaoInss}%
                </p>
                <p className="text-[var(--nova-text-dim)] text-[0.625rem]">variação</p>
              </div>
              <div className="text-right">
                <p className="text-[var(--nova-text-dim)]">Depois</p>
                <p className="font-semibold text-[var(--nova-text)]">{fmtShort(INSS.mediaMensalDepois)}/mês</p>
              </div>
            </div>
          </div>

        </section>

        {/* Nota metodológica */}
        <div className="rounded-sm border border-[var(--nova-border)]/50 bg-[var(--nova-bg-elev-2)] px-4 py-3">
          <p className="text-[0.625rem] text-[var(--nova-text-dim)] leading-relaxed">
            <span className="font-semibold">Metodologia:</span> Dados apurados em 29/07/2026.
            Período pré-disparo: fev–mai/26 (média de 4 meses). Período pós-disparo: jun–jul/26 (média de 2 meses — julho ainda em andamento).
            Crescimento definido como variação {">"} 5% na média mensal INSS. Parceiros cruzados pela coluna <code className="font-mono">codigo_nova</code> do CSV com a planilha do sistema.
          </p>
        </div>

      </main>
    </>
  )
}
