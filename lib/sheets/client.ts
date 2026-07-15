const SHEET1 = { id: '1I54OHatANESC5KVZggvif0knKD2IuCeL', gid: '1866816406' }
const SHEET2 = { id: '1WOr68pYEjPIVQkTOk7NasS96dfGBJdCo', gid: '1311285376' }

async function fetchOneCSV(id: string, gid: string): Promise<string> {
  const url = `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Erro ao buscar planilha ${id}: ${res.status}`)
  const buf = await res.arrayBuffer()
  return new TextDecoder('utf-8').decode(buf)
}

// Retorna rows da planilha principal (legado — usada por rotas que processam CSV diretamente)
export async function fetchSheetCSV(): Promise<string> {
  return fetchOneCSV(SHEET1.id, SHEET1.gid)
}

// Retorna rows de ambas as planilhas como arrays independentes para merge com headers próprios
export async function fetchAllSheetRows(): Promise<{ rows1: string[][], rows2: string[][] }> {
  const [csv1, csv2] = await Promise.all([
    fetchOneCSV(SHEET1.id, SHEET1.gid),
    fetchOneCSV(SHEET2.id, SHEET2.gid),
  ])
  return { rows1: parseCSV(csv1), rows2: parseCSV(csv2) }
}

/**
 * Parser CSV que suporta campos com quebras de linha dentro de aspas
 * (necessário para os cabeçalhos "Comparativo em Valores\n(mai/21 - abr/21)")
 */
export function parseCSV(csv: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cur = ''
  let inQuote = false

  for (let i = 0; i < csv.length; i++) {
    const ch = csv[i]

    if (ch === '"') {
      if (inQuote && csv[i + 1] === '"') { cur += '"'; i++ }  // aspas duplas escapadas
      else inQuote = !inQuote
    } else if (ch === ',' && !inQuote) {
      row.push(cur); cur = ''
    } else if (ch === '\r' && !inQuote) {
      // ignora \r isolado
    } else if (ch === '\n' && !inQuote) {
      row.push(cur); cur = ''
      if (row.length > 0) rows.push(row)
      row = []
    } else {
      cur += ch
    }
  }
  // última célula / linha
  if (cur || row.length) { row.push(cur); rows.push(row) }

  return rows
}
