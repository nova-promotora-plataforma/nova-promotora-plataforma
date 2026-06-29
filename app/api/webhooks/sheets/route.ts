import { NextRequest, NextResponse } from 'next/server'

/**
 * Recebe trigger do Google Apps Script.
 * Valida o secret e enfileira job no BullMQ.
 * O worker processa assincronamente (CLAUDE.md §8).
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-webhook-secret')
  if (secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await req.json()

  // Enfileirar job — importação do módulo queue é lazy para não quebrar sem Redis
  try {
    const { getSyncQueue } = await import('@/lib/queue/sync-queue')
    const queue = getSyncQueue()
    await queue.add('sync-sheets', payload, { attempts: 3, backoff: { type: 'exponential', delay: 5000 } })
  } catch (err) {
    console.error('[webhook/sheets] Falha ao enfileirar:', err)
    return NextResponse.json({ error: 'Queue unavailable' }, { status: 503 })
  }

  return NextResponse.json({ ok: true })
}
