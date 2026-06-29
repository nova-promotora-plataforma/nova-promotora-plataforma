import { Prisma } from '@prisma/client'

export interface CampaignFilters {
  status?:      'ATIVO' | 'INATIVO'
  ufs?:         string[]
  faixas?:      number[]        // 1–6
  inativDays?:  [number, number] // [min, max]
}

export function buildPartnerWhere(f: CampaignFilters): Prisma.PartnerWhereInput {
  const where: Prisma.PartnerWhereInput = {
    isEligible: true,   // filtro padrão obrigatório — exclui zerados (CLAUDE.md §4.1)
    deletedAt:  null,
  }

  if (f.status) where.status = f.status

  if (f.ufs?.length) where.uf = { in: f.ufs }

  if (f.inativDays) {
    const [minDays, maxDays] = f.inativDays
    const now = new Date()
    where.lastProductionDate = {
      gte: new Date(now.getTime() - maxDays * 86_400_000),
      lte: new Date(now.getTime() - minDays * 86_400_000),
    }
  }

  return where
}
