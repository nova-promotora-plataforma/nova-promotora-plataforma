const SHEET_ID = '1WOr68pYEjPIVQkTOk7NasS96dfGBJdCo'

export const CONVENIOS = [
  { key: 'todos',              label: 'Todos',              gid: '1311285376' },
  { key: 'inss',               label: 'INSS',               gid: '1564763958' },
  { key: 'fgts',               label: 'FGTS',               gid: '688074922'  },
  { key: 'credito_trabalhador', label: 'Crédito Trabalhador', gid: '1714509462' },
  { key: 'demais',             label: 'Demais Convênios',   gid: '922735149'  },
]

export async function fetchSheetByGid(gid: string): Promise<string> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Erro ao buscar aba gid=${gid}: ${res.status}`)
  const buf = await res.arrayBuffer()
  return new TextDecoder('utf-8').decode(buf)
}

// Aba principal "Todos" — usada para listagem e KPIs
export async function fetchSheetCSV(): Promise<string> {
  return fetchSheetByGid(CONVENIOS[0].gid)
}

// Todas as abas em paralelo para merge (usado por fetchAllPartners)
export async function fetchAllSheetRows(): Promise<{ rows1: string[][], rows2: string[][] }> {
  // Legado: rows1 vazio, rows2 = aba Todos
  const csv = await fetchSheetCSV()
  return { rows1: [], rows2: parseCSV(csv) }
}

/**
 * Parser CSV com suporte a campos multilinhas entre aspas
 */
export function parseCSV(csv: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cur = ''
  let inQuote = false

  for (let i = 0; i < csv.length; i++) {
    const ch = csv[i]

    if (ch === '"') {
      if (inQuote && csv[i + 1] === '"') { cur += '"'; i++ }
      else inQuote = !inQuote
    } else if (ch === ',' && !inQuote) {
      row.push(cur); cur = ''
    } else if (ch === '\r' && !inQuote) {
      // ignora \r
    } else if (ch === '\n' && !inQuote) {
      row.push(cur); cur = ''
      if (row.length > 0) rows.push(row)
      row = []
    } else {
      cur += ch
    }
  }
  if (cur || row.length) { row.push(cur); rows.push(row) }

  return rows
}
