import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { buildPartnerWhere } from '@/domain/campaigns/filters'
import { exportToXLSX, exportToCSV } from '@/domain/campaigns/export'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { format = 'xlsx', userId } = await req.json() as { format?: 'xlsx' | 'csv'; userId: string }

  const campaign = await prisma.campaign.findUnique({ where: { id: params.id } })
  if (!campaign) return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 })

  const where = buildPartnerWhere(campaign.filterSnapshot as never)
  const partners = await prisma.partner.findMany({
    where,
    select: {
      codigo: true, nome: true, funcionarioCidade: true, uf: true,
      telefoneOficial: true, emailOficial: true,
      status: true, totalProducao: true, lastProductionDate: true,
    },
  })

  const rows = partners.map(p => ({
    codigo:             p.codigo,
    nome:               p.nome,
    cidade:             p.funcionarioCidade,
    uf:                 p.uf,
    telefone:           p.telefoneOficial,
    email:              p.emailOficial,
    status:             p.status,
    totalProducao:      Number(p.totalProducao),
    lastProductionDate: p.lastProductionDate?.toISOString().slice(0, 10) ?? null,
  }))

  // Audit log — exportações são sempre registradas (CLAUDE.md §13.10)
  await Promise.all([
    prisma.campaign.update({ where: { id: params.id }, data: { status: 'EXPORTED', exportedAt: new Date() } }),
    prisma.auditLog.create({
      data: {
        userId, entityType: 'campaign', entityId: params.id,
        action: 'EXPORT', newData: { format, rows: rows.length },
      },
    }),
  ])

  if (format === 'csv') {
    const csv = exportToCSV(rows)
    return new NextResponse(csv, {
      headers: {
        'Content-Type':        'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${campaign.name}.csv"`,
      },
    })
  }

  const buffer = exportToXLSX(rows, campaign.name)
  return new NextResponse(buffer, {
    headers: {
      'Content-Type':        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${campaign.name}.xlsx"`,
    },
  })
}
