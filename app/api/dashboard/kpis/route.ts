import { NextResponse } from 'next/server'
import { fetchSheetCSV, parseCSV } from '@/lib/sheets/client'

const MONTH_RE = /^[a-z]{3}\/\d{2}$/i
const MONTH_MAP: Record<string, string> = {
  jan:'01',fev:'02',mar:'03',abr:'04',mai:'05',jun:'06',
  jul:'07',ago:'08',set:'09',out:'10',nov:'11',dez:'12',
}

function norm(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}
function parseBRL(raw: string | undefined): number {
  if (!raw) return 0
  return parseFloat(raw.replace(/[R$\s.]/g, '').replace(',', '.')) || 0
}
export function toTitleCase(s: string): string {
  const minors = new Set(['de','da','do','das','dos','e','a','o','em','na','no'])
  return s.toLowerCase().split(' ').map((w, i) =>
    i === 0 || !minors.has(w) ? w.charAt(0).toUpperCase() + w.slice(1) : w
  ).join(' ')
}

export async function GET() {
  const csv  = await fetchSheetCSV()
  const rows = parseCSV(csv)
  if (rows.length < 2) return NextResponse.json({ error: 'Sem dados' }, { status: 500 })

  const headers  = rows[0]
  const dataRows = rows.slice(1)

  const idxCodigo = headers.findIndex(h => norm(h) === 'codigo')
  const idxNome   = headers.findIndex(h => norm(h) === 'nome')
  const idxUF     = headers.findIndex(h => norm(h) === 'uf')
  const idxTotal  = headers.findIndex(h => norm(h).includes('total em produ'))

  const monthCols: { idx: number; label: string; date: Date }[] = []
  headers.forEach((h, i) => {
    const t = h.trim()
    if (!MONTH_RE.test(t)) return
    const [mon, yr] = t.toLowerCase().split('/')
    const m = MONTH_MAP[mon]
    if (m) monthCols.push({ idx: i, label: t, date: new Date(`20${yr}-${m}-01`) })
  })
  monthCols.sort((a, b) => a.date.getTime() - b.date.getTime())

  const sixtyDaysAgo  = new Date(); sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)
  const ninetyDaysAgo = new Date(); ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  let eligible = 0, ativos = 0, producaoTotal = 0
  const ufCount: Record<string, number> = {}
  const last12 = monthCols.slice(-12)
  const monthlyProd: Record<string, number> = {}
  last12.forEach(m => { monthlyProd[m.label] = 0 })

  const alertPartners: { nome: string; uf: string; lastMonth: string; total: number; status: string }[] = []

  for (const row of dataRows) {
    if (!row[idxCodigo]?.trim()) continue

    let lastCol: { label: string; date: Date } | null = null
    for (let i = monthCols.length - 1; i >= 0; i--) {
      if (parseBRL(row[monthCols[i].idx]) > 0) { lastCol = monthCols[i]; break }
    }
    if (!lastCol) continue

    eligible++
    const isAtivo = lastCol.date >= sixtyDaysAgo
    if (isAtivo) ativos++

    const total = parseBRL(row[idxTotal])
    producaoTotal += total

    const uf = row[idxUF]?.trim().toUpperCase()
    if (uf) ufCount[uf] = (ufCount[uf] ?? 0) + 1

    last12.forEach(m => { monthlyProd[m.label] += parseBRL(row[m.idx]) })

    if (!isAtivo && lastCol.date >= ninetyDaysAgo && alertPartners.length < 15) {
      alertPartners.push({
        nome:      toTitleCase(row[idxNome]?.trim() ?? ''),
        uf:        uf ?? '—',
        lastMonth: lastCol.label,
        total,
        status:    'INATIVO',
      })
    }
  }

  return NextResponse.json({
    eligible,
    ativos,
    producaoTotal:  Math.round(producaoTotal),
    mediaAtivo:     ativos > 0 ? Math.round(producaoTotal / ativos) : 0,
    taxaAtivos:     eligible > 0 ? ((ativos / eligible) * 100).toFixed(1) : '0',
    productionData: last12.map(m => ({ month: m.label, amount: Math.round(monthlyProd[m.label]) })),
    ufTop6:         Object.entries(ufCount).sort((a,b) => b[1]-a[1]).slice(0,6).map(([label,value]) => ({ label, value })),
    alertPartners,
  })
}
