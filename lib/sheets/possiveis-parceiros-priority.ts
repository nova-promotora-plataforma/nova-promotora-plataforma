import { PossiblePartnerRow } from './possiveis-parceiros'

export type Priority = 'ALTA' | 'MEDIA' | 'BAIXA'

// Rótulo do CNAE usado na comparação — mesma regra do breakdown "Novos prospects por CNAE".
export function cnaeLabel(p: PossiblePartnerRow): string {
  return p.cnaeDesc && p.cnaeDesc !== '(secundária)' ? p.cnaeDesc : 'CNAE secundário (não informado)'
}

/**
 * Índice de concentração por CNAE = (% do CNAE entre quem já é parceiro) / (% do CNAE entre quem ainda é só prospect).
 * >1 → esse CNAE converte melhor que a média da base; <1 → converte pior.
 * Calculado sobre a base inteira (não filtrada) pra não distorcer com filtros aplicados na tela.
 */
export function computeCnaeIndice(all: PossiblePartnerRow[]): Map<string, number> {
  const partnerCounts = new Map<string, number>()
  const prospectCounts = new Map<string, number>()
  let partnerTotal = 0, prospectTotal = 0

  for (const p of all) {
    const label = cnaeLabel(p)
    if (p.jaParceiro) { partnerCounts.set(label, (partnerCounts.get(label) ?? 0) + 1); partnerTotal++ }
    else              { prospectCounts.set(label, (prospectCounts.get(label) ?? 0) + 1); prospectTotal++ }
  }

  const indice = new Map<string, number>()
  const labels = new Set(Array.from(partnerCounts.keys()).concat(Array.from(prospectCounts.keys())))
  labels.forEach(label => {
    const partnerPct = ((partnerCounts.get(label) ?? 0) / partnerTotal) * 100
    const prospectPct = ((prospectCounts.get(label) ?? 0) / prospectTotal) * 100
    indice.set(label, prospectPct > 0 ? partnerPct / prospectPct : 0)
  })
  return indice
}

export function classifyIndice(indice: number): Priority {
  if (indice >= 2)   return 'ALTA'
  if (indice >= 0.9) return 'MEDIA'
  return 'BAIXA'
}

export function priorityFor(p: PossiblePartnerRow, indiceMap: Map<string, number>): Priority {
  return classifyIndice(indiceMap.get(cnaeLabel(p)) ?? 0)
}
