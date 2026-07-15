import { fetchAllSheetRows } from './client'

const MONTH_RE = /^[a-z]{3}\/\d{2}$/i
export const MONTH_MAP: Record<string, string> = {
  jan:'01',fev:'02',mar:'03',abr:'04',mai:'05',jun:'06',
  jul:'07',ago:'08',set:'09',out:'10',nov:'11',dez:'12',
}

export function norm(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}

export function parseBRL(raw: string | undefined): number {
  if (!raw) return 0
  return parseFloat(raw.replace(/[R$\s.]/g, '').replace(',', '.')) || 0
}

export function toTitleCase(s: string): string {
  const minors = new Set(['de','da','do','das','dos','e','a','o','em','na','no'])
  return s.toLowerCase().split(' ').map((w, i) =>
    i === 0 || !minors.has(w) ? w.charAt(0).toUpperCase() + w.slice(1) : w
  ).join(' ')
}

export interface PartnerRow {
  codigo:              string
  nome:                string
  funcionarioCidade:   string | null
  uf:                  string | null
  telefoneOficial:     string | null
  emailOficial:        string | null
  totalProducao:       number
  lastProductionMonth: string | null
  lastProductionDate:  Date   | null
  status:              'ATIVO' | 'INATIVO'
  isEligible:          boolean
  monthlyData:         Record<string, number>  // label -> valor
}

function extractFromRows(rows: string[][], sixtyDaysAgo: Date): PartnerRow[] {
  if (rows.length < 2) return []

  const headers = rows[0]

  const idxCodigo = headers.findIndex(h => norm(h) === 'codigo')
  const idxNome   = headers.findIndex(h => norm(h) === 'nome')
  const idxCidade = headers.findIndex(h => norm(h) === 'funcionario_cidade')
  const idxUF     = headers.findIndex(h => norm(h) === 'uf')
  const idxTel    = headers.findIndex(h => ['telefone oficial', 'telefone_oficial'].includes(norm(h)))
  const idxEmail  = headers.findIndex(h => ['email oficial', 'email_oficial'].includes(norm(h)))
  const idxTotal  = headers.findIndex(h => norm(h).includes('total em produ') || norm(h) === 'total')

  const monthCols: { idx: number; label: string; date: Date }[] = []
  headers.forEach((h, i) => {
    const t = h.trim()
    if (!MONTH_RE.test(t)) return
    const [mon, yr] = t.toLowerCase().split('/')
    const m = MONTH_MAP[mon]
    if (m) monthCols.push({ idx: i, label: t.toLowerCase(), date: new Date(`20${yr}-${m}-01`) })
  })
  monthCols.sort((a, b) => a.date.getTime() - b.date.getTime())

  const result: PartnerRow[] = []

  for (const row of rows.slice(1)) {
    const code = row[idxCodigo]?.trim()
    if (!code) continue

    const monthlyData: Record<string, number> = {}
    let lastCol: { label: string; date: Date } | null = null

    for (let i = monthCols.length - 1; i >= 0; i--) {
      const mc = monthCols[i]
      const val = parseBRL(row[mc.idx])
      if (val > 0) {
        monthlyData[mc.label] = val
        if (!lastCol) lastCol = mc
      }
    }
    // fill remaining months with values
    for (const mc of monthCols) {
      const val = parseBRL(row[mc.idx])
      if (!(mc.label in monthlyData) && val > 0) monthlyData[mc.label] = val
    }

    const totalRaw   = idxTotal >= 0 ? parseBRL(row[idxTotal]) : Object.values(monthlyData).reduce((a,b)=>a+b,0)
    const isEligible = lastCol !== null
    const isAtivo    = lastCol ? lastCol.date >= sixtyDaysAgo : false

    result.push({
      codigo:              code,
      nome:                toTitleCase(row[idxNome]?.trim() ?? ''),
      funcionarioCidade:   row[idxCidade]?.trim() ? toTitleCase(row[idxCidade].trim()) : null,
      uf:                  row[idxUF]?.trim().toUpperCase() || null,
      telefoneOficial:     idxTel >= 0  ? (row[idxTel]?.trim()   || null) : null,
      emailOficial:        idxEmail >= 0 ? (row[idxEmail]?.trim() || null) : null,
      totalProducao:       totalRaw,
      lastProductionMonth: lastCol?.label ?? null,
      lastProductionDate:  lastCol?.date  ?? null,
      status:              isAtivo ? 'ATIVO' : 'INATIVO',
      isEligible,
      monthlyData,
    })
  }

  return result
}

export async function fetchAllPartners(): Promise<PartnerRow[]> {
  const sixtyDaysAgo = new Date()
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

  const { rows1, rows2 } = await fetchAllSheetRows()

  const partners1 = extractFromRows(rows1, sixtyDaysAgo)
  const partners2 = extractFromRows(rows2, sixtyDaysAgo)

  // Merge by codigo: prefer the record with more monthly data
  const map = new Map<string, PartnerRow>()

  for (const p of partners1) {
    map.set(p.codigo, p)
  }
  for (const p of partners2) {
    const existing = map.get(p.codigo)
    if (!existing) {
      map.set(p.codigo, p)
    } else {
      // Merge: combine monthlyData and pick the most complete record
      const merged = Object.keys(p.monthlyData).length >= Object.keys(existing.monthlyData).length ? p : existing
      const combinedMonthly = { ...existing.monthlyData, ...p.monthlyData }
      // Recalculate last production from combined data
      const allMonths = Object.keys(combinedMonthly)
        .map(label => {
          const [mon, yr] = label.split('/')
          const m = MONTH_MAP[mon]
          return m ? { label, date: new Date(`20${yr}-${m}-01`) } : null
        })
        .filter(Boolean) as { label: string; date: Date }[]
      allMonths.sort((a, b) => b.date.getTime() - a.date.getTime())
      const lastCol = allMonths[0] ?? null

      const total = Object.values(combinedMonthly).reduce((a, b) => a + b, 0)
      const isAtivo = lastCol ? lastCol.date >= sixtyDaysAgo : false

      map.set(p.codigo, {
        ...merged,
        monthlyData:         combinedMonthly,
        totalProducao:       total,
        lastProductionMonth: lastCol?.label ?? null,
        lastProductionDate:  lastCol?.date  ?? null,
        status:              isAtivo ? 'ATIVO' : 'INATIVO',
        isEligible:          lastCol !== null,
      })
    }
  }

  return Array.from(map.values())
}
