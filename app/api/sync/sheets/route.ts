import { NextRequest, NextResponse } from 'next/server'
import { importFromSheets } from '@/lib/sheets/importer'

/**
 * POST /api/sync/sheets
 * Dispara importação manual ou via webhook do Google Apps Script.
 * Header Authorization: Bearer <WEBHOOK_SECRET>
 */
export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? ''
  const secret = process.env.WEBHOOK_SECRET

  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const result = await importFromSheets()
    return NextResponse.json({
      ok: true,
      created:  result.created,
      updated:  result.updated,
      errors:   result.errors.slice(0, 50),   // limitar para não explodir o payload
      duration: `${result.duration}ms`,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
