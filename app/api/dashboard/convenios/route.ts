export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'

const ACTIVE_DAYS    = 60
const MONTH_NAMES    = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']

// Mapeia o valor bruto do campo `convenio` para uma das 4 abas
function classifyConvenio(v: string | null): 'inss' | 'fgts' | 'credito_trabalhador' | 'demais' {
  if (!v) return 'demais'
  const u = v.toUpperCase().trim()
  if (u.includes('INSS'))                                   return 'inss'
  if (u.includes('FGTS'))                                   return 'fgts'
  if (u.includes('CR') && (u.includes('DIT') || u.includes('TRAB'))) return 'credito_trabalhador'
  return 'demais'
}

const CONVENIO_LABELS: Record<string, string> = {
  inss:                'INSS',
  fgts:                'FGTS',
  credito_trabalhador: 'Crédito Trabalhador',
  demais:              'Demais Convênios',
}

export async function GET() {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - ACTIVE_DAYS)

  // Produção mensal por convenio — últimos 13 meses
  const monthlyRaw = await prisma.$queryRaw<{
    convenio:   string | null
    month_date: Date
    amount:     number
  }[]>`
    SELECT
      convenio,
      DATE_TRUNC('month', data_pgto_cms) AS month_date,
      SUM(producao)::float               AS amount
    FROM proposals
    WHERE data_pgto_cms >= NOW() - INTERVAL '13 months'
      AND data_pgto_cms IS NOT NULL
    GROUP BY 1, 2
    ORDER BY 2
  `

  // Agregação por parceiro × convenio
  const partnerRaw = await prisma.$queryRaw<{
    cod_parceiro:    string
    convenio:        string | null
    nome:            string | null
    uf:              string | null
    total_producao:  number
    ultima_producao: Date | null
  }[]>`
    SELECT
      pr.cod_parceiro,
      pr.convenio,
      pt.nome,
      pt.uf,
      SUM(pr.producao)::float AS total_producao,
      MAX(pr.data_pgto_cms)   AS ultima_producao
    FROM proposals pr
    LEFT JOIN partners pt ON pt.codigo = pr.cod_parceiro
    WHERE pr.producao > 0
    GROUP BY pr.cod_parceiro, pr.convenio, pt.nome, pt.uf
  `

  // Estrutura por aba
  type ConvenioKey = 'inss' | 'fgts' | 'credito_trabalhador' | 'demais'
  const keys: ConvenioKey[] = ['inss', 'fgts', 'credito_trabalhador', 'demais']

  const monthly: Record<ConvenioKey, Map<string, number>> = {
    inss: new Map(), fgts: new Map(), credito_trabalhador: new Map(), demais: new Map(),
  }

  // Meses únicos nos últimos 12
  const allDates = new Set<string>()
  for (const r of monthlyRaw) {
    const d   = new Date(r.month_date)
    const mon = MONTH_NAMES[d.getUTCMonth()]
    const yr  = String(d.getUTCFullYear()).slice(2)
    const key = `${mon}/${yr}`
    allDates.add(key)
    const tab = classifyConvenio(r.convenio)
    monthly[tab].set(key, (monthly[tab].get(key) ?? 0) + (r.amount ?? 0))
  }
  const sortedMonths = Array.from(allDates).sort((a, b) => {
    const [am, ay] = a.split('/')
    const [bm, by] = b.split('/')
    const ai = MONTH_NAMES.indexOf(am) + parseInt(`20${ay}`) * 12
    const bi = MONTH_NAMES.indexOf(bm) + parseInt(`20${by}`) * 12
    return ai - bi
  }).slice(-12)

  const stats: Record<ConvenioKey, {
    totalProducao: number
    ativos:        number
    inativos:      number
    partners:      { codigo: string; nome: string; uf: string | null; total: number; lastMonth: string | null }[]
  }> = {
    inss:                { totalProducao: 0, ativos: 0, inativos: 0, partners: [] },
    fgts:                { totalProducao: 0, ativos: 0, inativos: 0, partners: [] },
    credito_trabalhador: { totalProducao: 0, ativos: 0, inativos: 0, partners: [] },
    demais:              { totalProducao: 0, ativos: 0, inativos: 0, partners: [] },
  }

  // Parceiro pode ter múltiplos convênios — agrupamos por tab × cod_parceiro
  const partnerByTab: Record<ConvenioKey, Map<string, { nome: string; uf: string | null; total: number; ultimaProd: Date | null }>> = {
    inss: new Map(), fgts: new Map(), credito_trabalhador: new Map(), demais: new Map(),
  }

  for (const r of partnerRaw) {
    const tab = classifyConvenio(r.convenio)
    const existing = partnerByTab[tab].get(r.cod_parceiro)
    const prod    = r.ultima_producao ? new Date(r.ultima_producao) : null
    if (!existing) {
      partnerByTab[tab].set(r.cod_parceiro, {
        nome:      r.nome ?? r.cod_parceiro,
        uf:        r.uf ?? null,
        total:     r.total_producao ?? 0,
        ultimaProd: prod,
      })
    } else {
      existing.total += r.total_producao ?? 0
      if (prod && (!existing.ultimaProd || prod > existing.ultimaProd)) existing.ultimaProd = prod
    }
  }

  for (const tab of keys) {
    for (const [codigo, p] of Array.from(partnerByTab[tab])) {
      const isAtivo = p.ultimaProd ? p.ultimaProd >= cutoff : false
      stats[tab].totalProducao += p.total
      if (isAtivo) stats[tab].ativos++
      else stats[tab].inativos++

      const d    = p.ultimaProd
      const mon  = d ? MONTH_NAMES[d.getUTCMonth()] : null
      const yr   = d ? String(d.getUTCFullYear()).slice(2) : null
      stats[tab].partners.push({
        codigo,
        nome:      p.nome,
        uf:        p.uf,
        total:     Math.round(p.total),
        lastMonth: d && mon ? `${mon}/${yr}` : null,
      })
    }
  }

  const convenios = keys.map(tab => {
    const s = stats[tab]
    const topPartners = s.partners
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)

    return {
      key:           tab,
      label:         CONVENIO_LABELS[tab],
      totalProducao: Math.round(s.totalProducao),
      ativos:        s.ativos,
      inativos:      s.inativos,
      mediaAtivo:    s.ativos > 0 ? Math.round(s.totalProducao / s.ativos) : 0,
      taxaAtivos:    (s.ativos + s.inativos) > 0
        ? ((s.ativos / (s.ativos + s.inativos)) * 100).toFixed(1)
        : '0',
      productionData: sortedMonths.map(m => ({
        month:  m,
        amount: Math.round(monthly[tab].get(m) ?? 0),
      })),
      topPartners,
    }
  })

  return NextResponse.json({ convenios })
}
