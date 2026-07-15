import { NextRequest, NextResponse } from 'next/server'
import { CONVENIOS, fetchSheetByGid, parseCSV } from '@/lib/sheets/client'
import { norm, parseBRL, MONTH_MAP } from '@/lib/sheets/partners'

const MONTH_RE = /^[a-z]{3}\/\d{2}$/i

async function getTotalForPartner(gid: string, codigo: string): Promise<number> {
  try {
    const csv  = await fetchSheetByGid(gid)
    const rows = parseCSV(csv)
    if (rows.length < 2) return 0

    const headers  = rows[0]
    const idxCodigo = headers.findIndex(h => norm(h) === 'codigo')
    const idxTotal  = headers.findIndex(h => norm(h) === 'total' || norm(h).includes('total em produ'))

    const monthCols: number[] = []
    headers.forEach((h, i) => {
      if (MONTH_RE.test(h.trim())) monthCols.push(i)
    })

    const row = rows.slice(1).find(r => r[idxCodigo]?.trim() === codigo)
    if (!row) return 0

    if (idxTotal >= 0) return parseBRL(row[idxTotal])

    return monthCols.reduce((sum, i) => sum + parseBRL(row[i]), 0)
  } catch {
    return 0
  }
}

async function getMonthlyForPartner(
  gid: string,
  codigo: string,
): Promise<Record<string, number>> {
  try {
    const csv  = await fetchSheetByGid(gid)
    const rows = parseCSV(csv)
    if (rows.length < 2) return {}

    const headers   = rows[0]
    const idxCodigo = headers.findIndex(h => norm(h) === 'codigo')

    const monthCols: { idx: number; label: string }[] = []
    headers.forEach((h, i) => {
      const t = h.trim()
      if (!MONTH_RE.test(t)) return
      monthCols.push({ idx: i, label: t.toLowerCase() })
    })

    const row = rows.slice(1).find(r => r[idxCodigo]?.trim() === codigo)
    if (!row) return {}

    const result: Record<string, number> = {}
    for (const mc of monthCols) {
      const v = parseBRL(row[mc.idx])
      if (v > 0) result[mc.label] = v
    }
    return result
  } catch {
    return {}
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const codigo = params.id

  // Busca totais de todas as abas de convênio (exceto "Todos") em paralelo
  const convenioAbas = CONVENIOS.filter(c => c.key !== 'todos')

  const [totals, monthly] = await Promise.all([
    Promise.all(convenioAbas.map(c => getTotalForPartner(c.gid, codigo))),
    getMonthlyForPartner(CONVENIOS[0].gid, codigo), // mensal da aba Todos
  ])

  const ranking = convenioAbas
    .map((c, i) => ({ key: c.key, label: c.label, total: totals[i] }))
    .filter(c => c.total > 0)
    .sort((a, b) => b.total - a.total)

  const grandTotal = ranking.reduce((s, c) => s + c.total, 0)

  const rankingWithPct = ranking.map(c => ({
    ...c,
    pct: grandTotal > 0 ? Math.round((c.total / grandTotal) * 100) : 0,
  }))

  // Últimos 12 meses da aba Todos
  const allMonths = Object.keys(monthly)
    .map(label => {
      const [mon, yr] = label.split('/')
      const m = MONTH_MAP[mon]
      return m ? { label, ts: parseInt(`20${yr}${m}`), amount: monthly[label] } : null
    })
    .filter(Boolean)
    .sort((a, b) => a!.ts - b!.ts) as { label: string; ts: number; amount: number }[]

  const last12 = allMonths.slice(-12).map(({ label, amount }) => ({ month: label, amount }))

  return NextResponse.json({ ranking: rankingWithPct, monthlyData: last12 })
}
