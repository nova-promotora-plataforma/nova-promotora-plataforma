import { NextResponse } from 'next/server'
import { fetchAllPartners, MONTH_MAP } from '@/lib/sheets/partners'

export async function GET() {
  const partners = await fetchAllPartners()
  const eligible = partners.filter(p => p.isEligible)

  const now            = new Date()
  const ninetyDaysAgo = new Date(); ninetyDaysAgo.setDate(now.getDate() - 90)

  let ativos = 0, producaoTotal = 0
  const ufCount: Record<string, number> = {}

  // Coletar todos os meses únicos para calcular os últimos 12
  const allMonthKeys = new Set<string>()
  for (const p of eligible) {
    Object.keys(p.monthlyData).forEach(k => allMonthKeys.add(k))
  }
  const sortedMonths = Array.from(allMonthKeys)
    .map(label => {
      const [mon, yr] = label.split('/')
      const m = MONTH_MAP[mon]
      return m ? { label, ts: parseInt(`20${yr}${m}`) } : null
    })
    .filter(Boolean)
    .sort((a, b) => a!.ts - b!.ts) as { label: string; ts: number }[]

  const last12 = sortedMonths.slice(-12)
  const monthlyProd: Record<string, number> = {}
  last12.forEach(m => { monthlyProd[m.label] = 0 })

  const alertPartners: { nome: string; uf: string; lastMonth: string; total: number; status: string }[] = []

  for (const p of eligible) {
    if (p.status === 'ATIVO') ativos++
    producaoTotal += p.totalProducao

    if (p.uf) ufCount[p.uf] = (ufCount[p.uf] ?? 0) + 1

    last12.forEach(m => {
      monthlyProd[m.label] += p.monthlyData[m.label] ?? 0
    })

    if (
      p.status === 'INATIVO' &&
      p.lastProductionDate &&
      p.lastProductionDate >= ninetyDaysAgo &&
      alertPartners.length < 15
    ) {
      alertPartners.push({
        nome:      p.nome,
        uf:        p.uf ?? '—',
        lastMonth: p.lastProductionMonth ?? '—',
        total:     p.totalProducao,
        status:    'INATIVO',
      })
    }
  }

  return NextResponse.json({
    eligible:       eligible.length,
    ativos,
    producaoTotal:  Math.round(producaoTotal),
    mediaAtivo:     ativos > 0 ? Math.round(producaoTotal / ativos) : 0,
    taxaAtivos:     eligible.length > 0 ? ((ativos / eligible.length) * 100).toFixed(1) : '0',
    productionData: last12.map(m => ({ month: m.label, amount: Math.round(monthlyProd[m.label]) })),
    ufTop6:         Object.entries(ufCount).sort((a,b) => b[1]-a[1]).slice(0,6).map(([label,value]) => ({ label, value })),
    alertPartners,
  })
}
