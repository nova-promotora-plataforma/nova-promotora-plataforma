import { NextRequest, NextResponse } from 'next/server'
import { runDriveSync } from '@/lib/sync/drive-sync'
import { prisma } from '@/lib/db/client'

// Rota chamada pelo Vercel Cron às 10:00 UTC (07:00 Brasília)
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const config = await prisma.driveConfig.findFirst()
  if (!config?.folderId) {
    return NextResponse.json({ error: 'Drive não configurado' }, { status: 400 })
  }

  const result = await runDriveSync(config.folderId)
  return NextResponse.json(result)
}
