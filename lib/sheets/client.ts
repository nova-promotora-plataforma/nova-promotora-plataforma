const SHEET_ID = '1I54OHatANESC5KVZggvif0knKD2IuCeL'
const GID      = '1866816406'

export async function fetchSheetCSV(): Promise<string> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Erro ao buscar planilha: ${res.status}`)
  // Decodifica explicitamente como UTF-8
  const buf = await res.arrayBuffer()
  return new TextDecoder('utf-8').decode(buf)
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
