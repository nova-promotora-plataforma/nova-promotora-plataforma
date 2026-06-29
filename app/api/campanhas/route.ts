import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { buildPartnerWhere, type CampaignFilters } from '@/domain/campaigns/filters'

export async function GET() {
  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: 'desc' },
    include: { creator: { select: { name: true, email: true } } },
  })
  return NextResponse.json({ data: campaigns })
}

export async function POST(req: NextRequest) {
  const body = await req.json() as { name: string; filters: CampaignFilters; userId: string }

  const where = buildPartnerWhere(body.filters)
  const count = await prisma.partner.count({ where })

  const campaign = await prisma.campaign.create({
    data: {
      name:           body.name,
      status:         'DRAFT',
      filterSnapshot: body.filters,
      partnersCount:  count,
      createdBy:      body.userId,
    },
  })

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId:     body.userId,
      entityType: 'campaign',
      entityId:   campaign.id,
      action:     'CREATE',
      newData:    campaign,
    },
  })

  return NextResponse.json({ data: campaign }, { status: 201 })
}
