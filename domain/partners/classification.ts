/**
 * Regras de negócio: status e elegibilidade de parceiros
 * Status é SEMPRE calculado — nunca editado manualmente (CLAUDE.md §4.2)
 */

const ACTIVITY_WINDOW_DAYS = 60

export function calcStatus(lastProductionDate: Date | null): 'ATIVO' | 'INATIVO' {
  if (!lastProductionDate) return 'INATIVO'
  const diffMs = Date.now() - lastProductionDate.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  return diffDays <= ACTIVITY_WINDOW_DAYS ? 'ATIVO' : 'INATIVO'
}

export function calcIsEligible(totalProducao: number): boolean {
  // Elegível se teve ao menos 1 mês com produção > 0
  return totalProducao > 0
}

export function calcProductionBand(totalProducao: number): 1 | 2 | 3 | 4 | 5 | 6 {
  if (totalProducao <= 0)        return 1
  if (totalProducao <= 5_000)    return 2
  if (totalProducao <= 20_000)   return 3
  if (totalProducao <= 50_000)   return 4
  if (totalProducao <= 200_000)  return 5
  return 6
}
