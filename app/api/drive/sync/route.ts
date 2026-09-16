export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { runDriveSync } from '@/lib/sync/drive-sync'

export async function GET(req: NextRequest) {
  const force = req.nextUrl.searchParams.get('force') === 'true'
  const result = await runDriveSync(force)
  return NextResponse.json(result)
}
