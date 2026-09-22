export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'

const ACTIVE_DAYS = 60

export async function GET() {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - ACTIVE_DAYS)

  // Status global por parceiro
  const partnerStatus = await prisma.$queryRaw<{
    cod_parceiro:    string
    ultima_producao: Date | null
  }[]>`
    SELECT cod_parceiro, MAX(data_pgto_cms) AS ultima_producao
    FROM proposals
    GROUP BY cod_parceiro
  `

  let totalAtivos = 0, totalInativos = 0
  for (const p of partnerStatus) {
    if (p.ultima_producao && p.ultima_producao >= cutoff) totalAtivos++
    else totalInativos++
  }

  // Agrega por convênio: número de parceiros únicos e produção total
  const convenioRaw = await prisma.$queryRaw<{
    convenio:      string | null
    parceiros:     number
    producao:      number
  }[]>`
    SELECT
      convenio,
      COUNT(DISTINCT cod_parceiro)::int AS parceiros,
      SUM(producao)::float              AS producao
    FROM proposals
    WHERE producao > 0
    GROUP BY convenio
    ORDER BY parceiros DESC
  `

  // Classifica e agrupa em 4 categorias
  type ConvKey = 'INSS' | 'FGTS' | 'Cred. Trab.' | 'Demais'
  const convMap: Record<ConvKey, { parceiros: number; producao: number }> = {
    'INSS':        { parceiros: 0, producao: 0 },
    'FGTS':        { parceiros: 0, producao: 0 },
    'Cred. Trab.': { parceiros: 0, producao: 0 },
    'Demais':      { parceiros: 0, producao: 0 },
  }
  for (const r of convenioRaw) {
    const u = (r.convenio ?? '').toUpperCase()
    let key: ConvKey
    if (u.includes('INSS')) key = 'INSS'
    else if (u.includes('FGTS')) key = 'FGTS'
    else if (u.includes('CR') && (u.includes('DIT') || u.includes('TRAB'))) key = 'Cred. Trab.'
    else key = 'Demais'
    convMap[key].parceiros += r.parceiros
    convMap[key].producao  += r.producao ?? 0
  }

  const CONV_COLORS: Record<ConvKey, string> = {
    'INSS':        'var(--nova-blue)',
    'FGTS':        '#34d399',
    'Cred. Trab.': '#f59e0b',
    'Demais':      '#a78bfa',
  }
  const porConvenio = (Object.entries(convMap) as [ConvKey, { parceiros: number; producao: number }][])
    .filter(([, v]) => v.parceiros > 0)
    .map(([label, v]) => ({
      label,
      parceiros: v.parceiros,
      producao:  Math.round(v.producao),
      color:     CONV_COLORS[label],
    }))

  // Agrega por banco: top 10 por número de parceiros
  const bancoRaw = await prisma.$queryRaw<{
    banco:     string | null
    parceiros: number
    producao:  number
  }[]>`
    SELECT
      COALESCE(banco, 'Não informado') AS banco,
      COUNT(DISTINCT cod_parceiro)::int AS parceiros,
      SUM(producao)::float              AS producao
    FROM proposals
    WHERE producao > 0
    GROUP BY banco
    ORDER BY parceiros DESC
    LIMIT 10
  `

  const BANCO_COLORS = [
    '#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6',
    '#06b6d4','#f97316','#84cc16','#ec4899','#6b7280',
  ]
  const porBanco = bancoRaw.map((r, i) => ({
    label:     r.banco ?? 'Não informado',
    parceiros: r.parceiros,
    producao:  Math.round(r.producao ?? 0),
    color:     BANCO_COLORS[i] ?? '#6b7280',
  }))

  return NextResponse.json({
    totalAtivos,
    totalInativos,
    total: totalAtivos + totalInativos,
    porConvenio,
    porBanco,
  })
}
