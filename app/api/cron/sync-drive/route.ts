export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { runDriveSync } from '@/lib/sync/drive-sync'

// Rota chamada pelo Vercel Cron Ã s 10:00 UTC (07:00 BrasÃ­lia)
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await runDriveSync()
  return NextResponse.json(result)
}
