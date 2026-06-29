import { NextResponse } from 'next/server'
import { fetchSheetCSV, parseCSV } from '@/lib/sheets/client'

export async function GET() {
  try {
    const csv  = await fetchSheetCSV()
    const rows = parseCSV(csv)
    return NextResponse.json({
      totalRows:   rows.length,
      headers:     rows[0] ?? [],
      amostra:     rows.slice(1, 4),
      csvPreview:  csv.slice(0, 500),
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
