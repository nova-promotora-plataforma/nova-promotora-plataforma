export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'

const ACTIVE_DAYS = 60

export async function GET() {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - ACTIVE_DAYS)

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  // Agrega no SQL — evita problema de comparação string vs Date no JS
  const totaisRaw = await prisma.$queryRawUnsafe<{
    eligible:      number
    ativos:        number
    producao_total: number
  }[]>(`
    SELECT
      COUNT(*)::int                                                                 AS eligible,
      COUNT(*) FILTER (WHERE ultima >= NOW() - INTERVAL '${ACTIVE_DAYS} days')::int AS ativos,
      SUM(total)::float                                                             AS producao_total
    FROM (
      SELECT cod_parceiro, MAX(data_pgto_cms) AS ultima, SUM(producao) AS total
      FROM proposals
      WHERE producao > 0
      GROUP BY cod_parceiro
    ) sub
  `)

  const eligible      = Number(totaisRaw[0]?.eligible      ?? 0)
  const ativos        = Number(totaisRaw[0]?.ativos        ?? 0)
  const producaoTotal = Number(totaisRaw[0]?.producao_total ?? 0)

  // Produção mensal — últimos 13 meses
  const monthlyRaw = await prisma.$queryRaw<{
    month_date: Date
    amount:     number
  }[]>`
    SELECT
      DATE_TRUNC('month', data_pgto_cms) AS month_date,
      SUM(producao)::float               AS amount
    FROM proposals
    WHERE data_pgto_cms >= NOW() - INTERVAL '13 months'
      AND data_pgto_cms IS NOT NULL
    GROUP BY 1
    ORDER BY 1
  `

  const MONTH_NAMES = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']
  const productionData = monthlyRaw.map(r => {
    const d   = new Date(r.month_date)
    const mon = MONTH_NAMES[d.getUTCMonth()]
    const yr  = String(d.getUTCFullYear()).slice(2)
    return { month: `${mon}/${yr}`, amount: Math.round(r.amount ?? 0) }
  })

  // Top 6 bancos por número de parceiros únicos
  const bancoRaw = await prisma.$queryRaw<{ banco: string; cnt: number }[]>`
    SELECT
      COALESCE(banco, 'Não informado') AS banco,
      COUNT(DISTINCT cod_parceiro)::int AS cnt
    FROM proposals
    WHERE producao > 0
    GROUP BY banco
    ORDER BY cnt DESC
    LIMIT 6
  `
  const ufTop6 = bancoRaw.map(r => ({ label: r.banco, value: r.cnt }))

  // Parceiros em alerta de inatividade (última produção entre 30 e 90 dias atrás)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const alertRaw = await prisma.$queryRaw<{
    cod_parceiro:    string
    nome:            string | null
    uf:              string | null
    ultima_producao: Date | null
    total_producao:  number
  }[]>`
    SELECT
      pr.cod_parceiro,
      pt.nome,
      pt.uf,
      MAX(pr.data_pgto_cms)   AS ultima_producao,
      SUM(pr.producao)::float AS total_producao
    FROM proposals pr
    LEFT JOIN partners pt ON pt.codigo = pr.cod_parceiro
    GROUP BY pr.cod_parceiro, pt.nome, pt.uf
    HAVING MAX(pr.data_pgto_cms) >= ${ninetyDaysAgo}
       AND MAX(pr.data_pgto_cms) <  ${thirtyDaysAgo}
    ORDER BY SUM(pr.producao) DESC
    LIMIT 15
  `

  const alertPartners = alertRaw.map(r => {
    const d    = r.ultima_producao ? new Date(r.ultima_producao) : null
    const mon  = d ? MONTH_NAMES[d.getUTCMonth()] : '—'
    const yr   = d ? String(d.getUTCFullYear()).slice(2) : ''
    return {
      nome:      r.nome ?? r.cod_parceiro,
      uf:        r.uf ?? '—',
      lastMonth: d ? `${mon}/${yr}` : '—',
      total:     Math.round(r.total_producao ?? 0),
      status:    'INATIVO',
    }
  })

  return NextResponse.json({
    eligible,
    ativos,
    producaoTotal:  Math.round(producaoTotal),
    mediaAtivo:     ativos > 0 ? Math.round(producaoTotal / ativos) : 0,
    taxaAtivos:     eligible > 0 ? ((ativos / eligible) * 100).toFixed(1) : '0',
    productionData,
    ufTop6,
    alertPartners,
  })
}
