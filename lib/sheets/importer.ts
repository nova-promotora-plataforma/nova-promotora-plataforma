import { fetchSheetCSV, parseCSV } from './client'

const MONTH_RE = /^[a-z]{3}\/\d{2}$/i
const MONTH_MAP: Record<string, string> = {
  jan:'01',fev:'02',mar:'03',abr:'04',mai:'05',jun:'06',
  jul:'07',ago:'08',set:'09',out:'10',nov:'11',dez:'12',
}

export interface ImportResult {
  created:  number
  updated:  number
  errors:   string[]
  duration: number
}

function norm(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}
function parseBRL(raw: string | undefined): number {
  if (!raw) return 0
  return parseFloat(raw.replace(/[R$\s.]/g, '').replace(',', '.')) || 0
}

export async function importFromSheets(): Promise<ImportResult> {
  const start = Date.now()
  const errors: string[] = []

  const csv  = await fetchSheetCSV()
  const rows = parseCSV(csv)

  if (rows.length < 2) {
    return { created: 0, updated: 0, errors: ['Planilha vazia'], duration: Date.now() - start }
  }

  const headers  = rows[0]
  const dataRows = rows.slice(1)

  const idxCodigo = headers.findIndex(h => norm(h) === 'codigo')
  const idxNome   = headers.findIndex(h => norm(h) === 'nome')

  const monthCols: { idx: number; label: string }[] = []
  headers.forEach((h, i) => {
    const t = h.trim()
    if (!MONTH_RE.test(t)) return
    const [mon, yr] = t.toLowerCase().split('/')
    if (MONTH_MAP[mon]) monthCols.push({ idx: i, label: `20${yr}-${MONTH_MAP[mon]}-01` })
  })

  let created = 0
  const processed = new Set<string>()

  for (const row of dataRows) {
    const codigo = row[idxCodigo]?.trim()
    if (!codigo) continue
    if (processed.has(codigo)) continue
    processed.add(codigo)

    const hasProduction = monthCols.some(m => parseBRL(row[m.idx]) > 0)
    if (!hasProduction) continue

    created++
  }

  return {
    created,
    updated:  0,
    errors,
    duration: Date.now() - start,
  }
}
