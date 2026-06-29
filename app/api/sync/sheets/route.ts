import { NextRequest, NextResponse } from 'next/server'
import { fetchSheetCSV, parseCSV } from '@/lib/sheets/client'

const MONTH_RE = /^[a-z]{3}\/\d{2}$/i

function norm(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}
function parseBRL(raw: string | undefined): number {
  if (!raw) return 0
  return parseFloat(raw.replace(/[R$\s.]/g, '').replace(',', '.')) || 0
}

export async function POST(req: NextRequest) {
  const auth   = req.headers.get('authorization') ?? ''
  const secret = process.env.WEBHOOK_SECRET
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const start = Date.now()
  try {
    const csv  = await fetchSheetCSV()
    const rows = parseCSV(csv)
    if (rows.length < 2) return NextResponse.json({ ok: false, error: 'Planilha vazia' })

    const headers  = rows[0]
    const dataRows = rows.slice(1)
    const idxCodigo = headers.findIndex(h => norm(h) === 'codigo')
    const monthCols = headers.reduce<number[]>((acc, h, i) => {
      if (MONTH_RE.test(h.trim())) acc.push(i)
      return acc
    }, [])

    let eligible = 0
    const seen = new Set<string>()
    for (const row of dataRows) {
      const codigo = row[idxCodigo]?.trim()
      if (!codigo || seen.has(codigo)) continue
      seen.add(codigo)
      const hasProduction = monthCols.some(i => parseBRL(row[i]) > 0)
      if (hasProduction) eligible++
    }

    return NextResponse.json({
      ok:       true,
      created:  eligible,
      updated:  0,
      errors:   [],
      duration: `${Date.now() - start}ms`,
    })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
