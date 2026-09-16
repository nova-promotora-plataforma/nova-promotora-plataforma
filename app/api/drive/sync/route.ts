import { NextResponse } from 'next/server'
import { runDriveSync } from '@/lib/sync/drive-sync'

export async function GET() {
  const result = await runDriveSync()
  return NextResponse.json(result)
}
