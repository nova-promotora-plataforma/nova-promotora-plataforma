import { PossiblePartnerRow } from './possiveis-parceiros'
import { Priority, priorityFor } from './possiveis-parceiros-priority'

export interface Filters {
  busca: string
  uf: string
  cidade: string
  camada: string
  jaParceiro: string
  prioridade: string
}

export function parseFilters(searchParams: URLSearchParams): Filters {
  return {
    busca:      (searchParams.get('q') ?? '').toLowerCase().trim(),
    uf:         (searchParams.get('uf') ?? '').toUpperCase().trim(),
    cidade:     (searchParams.get('cidade') ?? '').toUpperCase().trim(),
    camada:     (searchParams.get('camada') ?? '').toUpperCase().trim(),
    jaParceiro: searchParams.get('jaParceiro') ?? '',
    prioridade: (searchParams.get('prioridade') ?? '').toUpperCase().trim(),
  }
}

export function applyFilters(all: PossiblePartnerRow[], f: Filters, indiceMap?: Map<string, number>): PossiblePartnerRow[] {
  return all.filter(p => {
    if (f.busca &&
        !p.razaoSocial.toLowerCase().includes(f.busca) &&
        !(p.nomeFantasia ?? '').toLowerCase().includes(f.busca) &&
        !p.cnpj.includes(f.busca)) return false
    if (f.uf         && p.uf !== f.uf) return false
    if (f.cidade     && (p.cidade ?? '').toUpperCase() !== f.cidade) return false
    if (f.camada     && p.camada !== f.camada) return false
    if (f.jaParceiro === 'sim' && !p.jaParceiro) return false
    if (f.jaParceiro === 'nao' && p.jaParceiro) return false
    if (f.prioridade && indiceMap && priorityFor(p, indiceMap) !== f.prioridade as Priority) return false
    return true
  })
}
