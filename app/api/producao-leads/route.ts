import { NextRequest, NextResponse } from 'next/server'

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let cur = '', inQ = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') { inQ = !inQ }
    else if (c === ',' && !inQ) { result.push(cur.trim()); cur = '' }
    else cur += c
  }
  result.push(cur.trim())
  return result
}

function norm(n: string) {
  return (n || '').replace(/\D/g, '').replace(/^55/, '').replace(/^0/, '')
}

function parseBRL(v: string) {
  if (!v) return 0
  return parseFloat(v.replace(/\./g, '').replace(',', '.')) || 0
}

async function fetchCSV(url: string): Promise<string> {
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)
  return res.text()
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const codesSheetId  = searchParams.get('codesSheetId')
  const producaoSheetId = searchParams.get('producaoSheetId')

  if (!codesSheetId || !producaoSheetId) {
    return NextResponse.json({ error: 'codesSheetId and producaoSheetId required' }, { status: 400 })
  }

  try {
    const [codesRaw, prodRaw] = await Promise.all([
      fetchCSV(`https://docs.google.com/spreadsheets/d/${codesSheetId}/gviz/tq?tqx=out:csv&sheet=Sheet1`),
      fetchCSV(`https://docs.google.com/spreadsheets/d/${producaoSheetId}/gviz/tq?tqx=out:csv&sheet=Sheet1`),
    ])

    // Build phone → codigo map from codes sheet
    const codesLines = codesRaw.split('\n').filter(Boolean)
    const codesH = parseCSVLine(codesLines[0])
    const codigoIdx = codesH.indexOf('codigo_nova')
    const phoneIdx  = codesH.indexOf('phone')

    const phoneToCode = new Map<string, string>()
    codesLines.slice(1).forEach(line => {
      const cols = parseCSVLine(line)
      const code  = cols[codigoIdx]
      const phone = norm(cols[phoneIdx] ?? '')
      if (code && phone) phoneToCode.set(phone, code)
    })

    // Build codigo → production map
    const MONTHS = ['jan/26','fev/26','mar/26','abr/26','mai/26','jun/26','jul/26']
    const prodLines = prodRaw.split('\n').filter(Boolean)
    const prodH = parseCSVLine(prodLines[0])
    const bCodigoIdx = prodH.indexOf('codigo')
    const monthIdxs = MONTHS.map(m => prodH.indexOf(m))

    const codeToProd = new Map<string, number[]>()
    prodLines.slice(1).forEach(line => {
      const cols = parseCSVLine(line)
      const cod = cols[bCodigoIdx]
      if (!cod) return
      const vals = monthIdxs.map(i => parseBRL(cols[i] ?? ''))
      codeToProd.set(cod, vals)
    })

    // Build phone → { pre, pos, meses } result
    const result: Record<string, { pre: number; pos: number; meses: number[] }> = {}

    phoneToCode.forEach((cod, phone) => {
      const meses = codeToProd.get(cod)
      if (!meses) return
      const pre = meses.slice(0, 4).reduce((s, v) => s + v, 0) // jan-abr
      const pos = meses.slice(4).reduce((s, v) => s + v, 0)    // mai-jul
      result[phone] = { pre, pos, meses }
    })

    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
