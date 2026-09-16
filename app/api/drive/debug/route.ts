import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'

export async function GET() {
  const sample = await prisma.proposal.findMany({
    take: 5,
    orderBy: { dataPgtoCms: 'desc' },
    select: { ff: true, dataPgtoCms: true, dataPgtoBanco: true, producao: true, codParceiro: true },
  })

  const count = await prisma.proposal.count()
  const withDate = await prisma.proposal.count({ where: { dataPgtoCms: { not: null } } })

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 60)
  const ativos = await prisma.proposal.groupBy({
    by: ['codParceiro'],
    where: { dataPgtoCms: { gte: cutoff } },
  })

  return NextResponse.json({ count, withDate, ativosCount: ativos.length, cutoff, sample })
}
