export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'

export async function GET() {
  const result = await prisma.$queryRaw<{ max_data: string; count_60d: number; count_90d: number }[]>`
    SELECT
      MAX(data_pgto_cms)::text                                                                AS max_data,
      COUNT(*) FILTER (WHERE data_pgto_cms >= NOW() - INTERVAL '60 days')::int               AS count_60d,
      COUNT(*) FILTER (WHERE data_pgto_cms >= NOW() - INTERVAL '90 days')::int               AS count_90d
    FROM proposals
    WHERE producao > 0
  `
  return NextResponse.json(result[0])
}
