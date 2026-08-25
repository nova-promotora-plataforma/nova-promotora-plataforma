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

const MONTHS = ['jan/26', 'fev/26', 'mar/26', 'abr/26', 'mai/26', 'jun/26', 'jul/26']

function buildAgregado(prodRaw: string, leadCodes: Set<string>) {
  const lines = prodRaw.split('\n').filter(Boolean)
  const h = parseCSVLine(lines[0])
  const codigoIdx = h.indexOf('codigo')
  const monthIdxs = MONTHS.map(m => h.indexOf(m))

  const totals = MONTHS.map(() => 0)
  let count = 0

  lines.slice(1).forEach(line => {
    const cols = parseCSVLine(line)
    if (!leadCodes.has(cols[codigoIdx])) return
    count++
    monthIdxs.forEach((mi, i) => { totals[i] += parseBRL(cols[mi] ?? '') })
  })

  const pre = totals.slice(0, 4).reduce((s, v) => s + v, 0)
  const pos = totals.slice(4).reduce((s, v) => s + v, 0)
  return { meses: totals, pre, pos, count }
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const codesSheetId   = searchParams.get('codesSheetId')
  const producaoSheetId = searchParams.get('producaoSheetId')
  const tabsParam      = searchParams.get('tabs') // comma-separated, e.g. "INSS,FGTS"

  if (!codesSheetId) {
    return NextResponse.json({ error: 'codesSheetId required' }, { status: 400 })
  }

  const tabs = tabsParam ? tabsParam.split(',').map(t => t.trim()).filter(Boolean) : []

  try {
    const codesRaw = await fetchCSV(
      `https://docs.google.com/spreadsheets/d/${codesSheetId}/gviz/tq?tqx=out:csv&sheet=Sheet1`
    )

    // Build phone → codigo map
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

    const leadCodes = new Set(phoneToCode.values())

    // Build phone → codigo map for export
    const porCodigo: Record<string, string> = {}
    phoneToCode.forEach((cod, phone) => { porCodigo[phone] = cod })

    // If no producaoSheetId, return only codes
    if (!producaoSheetId) {
      return NextResponse.json({ porLead: {}, agregado: {}, meses: MONTHS, porCodigo })
    }

    // Fetch total + product tabs in parallel
    const [prodRaw, ...tabsRaw] = await Promise.all([
      fetchCSV(`https://docs.google.com/spreadsheets/d/${producaoSheetId}/gviz/tq?tqx=out:csv&sheet=Sheet1`),
      ...tabs.map(tab =>
        fetchCSV(`https://docs.google.com/spreadsheets/d/${producaoSheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tab)}`)
      ),
    ])

    // Build codigo → monthly values (total tab)
    const prodLines = prodRaw.split('\n').filter(Boolean)
    const prodH = parseCSVLine(prodLines[0])
    const bCodigoIdx = prodH.indexOf('codigo')
    const monthIdxs = MONTHS.map(m => prodH.indexOf(m))

    const codeToProd = new Map<string, number[]>()
    prodLines.slice(1).forEach(line => {
      const cols = parseCSVLine(line)
      const cod = cols[bCodigoIdx]
      if (!cod) return
      codeToProd.set(cod, monthIdxs.map(i => parseBRL(cols[i] ?? '')))
    })

    // Per-lead result
    const porLead: Record<string, { pre: number; pos: number; meses: number[] }> = {}
    phoneToCode.forEach((cod, phone) => {
      const meses = codeToProd.get(cod)
      if (!meses) return
      const pre = meses.slice(0, 4).reduce((s, v) => s + v, 0)
      const pos = meses.slice(4).reduce((s, v) => s + v, 0)
      porLead[phone] = { pre, pos, meses }
    })

    // Aggregated totals
    const agregado: Record<string, { meses: number[]; pre: number; pos: number; count: number }> = {
      total: buildAgregado(prodRaw, leadCodes),
    }
    tabs.forEach((tab, i) => {
      agregado[tab] = buildAgregado(tabsRaw[i], leadCodes)
    })

    return NextResponse.json({ porLead, agregado, meses: MONTHS, porCodigo })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
