import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { buildPartnerWhere, type CampaignFilters } from '@/domain/campaigns/filters'

/**
 * Retorna contagem de parceiros para os filtros selecionados
 * Usado pelo construtor de campanhas para pré-visualização em tempo real
 */
export async function POST(req: NextRequest) {
  const filters: CampaignFilters = await req.json()
  const where = buildPartnerWhere(filters)
  const count = await prisma.partner.count({ where })
  return NextResponse.json({ count })
}
