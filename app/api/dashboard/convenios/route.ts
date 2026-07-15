import { NextResponse } from 'next/server'
import { CONVENIOS, fetchSheetByGid, parseCSV } from '@/lib/sheets/client'
import { norm, parseBRL, MONTH_MAP } from '@/lib/sheets/partners'

const MONTH_RE = /^[a-z]{3}\/\d{2}$/i

interface ConvenioStats {
  key:           string
  label:         string
  totalProducao: number
  ativos:        number
  inativos:      number
  mediaAtivo:    number
  taxaAtivos:    string
  productionData: { month: string; amount: number }[]
  topPartners:   { codigo: string; nome: string; uf: string | null; total: number; lastMonth: string | null }[]
}

function toTitleCase(s: string): string {
  const minors = new Set(['de','da','do','das','dos','e','a','o','em','na','no'])
  return s.toLowerCase().split(' ').map((w, i) =>
    i === 0 || !minors.has(w) ? w.charAt(0).toUpperCase() + w.slice(1) : w
  ).join(' ')
}

async function processConvenio(key: string, label: string, gid: string): Promise<ConvenioStats> {
  const sixtyDaysAgo = new Date()
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

  const csv  = await fetchSheetByGid(gid)
  const rows = parseCSV(csv)

  if (rows.length < 2) {
    return { key, label, totalProducao: 0, ativos: 0, inativos: 0, mediaAtivo: 0, taxaAtivos: '0', productionData: [], topPartners: [] }
  }

  const headers   = rows[0]
  const idxCodigo = headers.findIndex(h => norm(h) === 'codigo')
  const idxNome   = headers.findIndex(h => norm(h) === 'nome')
  const idxUF     = headers.findIndex(h => norm(h) === 'uf')
  const idxTotal  = headers.findIndex(h => norm(h) === 'total' || norm(h).includes('total em produ'))

  const monthCols: { idx: number; label: string; date: Date }[] = []
  headers.forEach((h, i) => {
    const t = h.trim()
    if (!MONTH_RE.test(t)) return
    const [mon, yr] = t.toLowerCase().split('/')
    const m = MONTH_MAP[mon]
    if (m) monthCols.push({ idx: i, label: t.toLowerCase(), date: new Date(`20${yr}-${m}-01`) })
  })
  monthCols.sort((a, b) => a.date.getTime() - b.date.getTime())
  const last12 = monthCols.slice(-12)

  const monthlyProd: Record<string, number> = {}
  last12.forEach(m => { monthlyProd[m.label] = 0 })

  let totalProducao = 0, ativos = 0, eligible = 0
  const partnerTotals: { codigo: string; nome: string; uf: string | null; total: number; lastMonth: string | null }[] = []

  for (const row of rows.slice(1)) {
    const code = row[idxCodigo]?.trim()
    if (!code) continue

    let lastCol: { label: string; date: Date } | null = null
    for (let i = monthCols.length - 1; i >= 0; i--) {
      if (parseBRL(row[monthCols[i].idx]) > 0) { lastCol = monthCols[i]; break }
    }
    if (!lastCol) continue

    eligible++
    const isAtivo = lastCol.date >= sixtyDaysAgo
    if (isAtivo) ativos++

    const total = idxTotal >= 0 ? parseBRL(row[idxTotal]) : 0
    totalProducao += total

    last12.forEach(m => { monthlyProd[m.label] += parseBRL(row[m.idx]) })

    partnerTotals.push({
      codigo:    code,
      nome:      toTitleCase(row[idxNome]?.trim() ?? ''),
      uf:        row[idxUF]?.trim().toUpperCase() || null,
      total,
      lastMonth: lastCol.label,
    })
  }

  const topPartners = partnerTotals
    .filter(p => p.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)

  return {
    key,
    label,
    totalProducao:  Math.round(totalProducao),
    ativos,
    inativos:       eligible - ativos,
    mediaAtivo:     ativos > 0 ? Math.round(totalProducao / ativos) : 0,
    taxaAtivos:     eligible > 0 ? ((ativos / eligible) * 100).toFixed(1) : '0',
    productionData: last12.map(m => ({ month: m.label, amount: Math.round(monthlyProd[m.label]) })),
    topPartners,
  }
}

export async function GET() {
  const convenioAbas = CONVENIOS.filter(c => c.key !== 'todos')

  const results = await Promise.all(
    convenioAbas.map(c => processConvenio(c.key, c.label, c.gid))
  )

  return NextResponse.json({ convenios: results })
}
