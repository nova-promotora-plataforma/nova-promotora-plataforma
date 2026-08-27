import { PossiblePartnerRow } from './possiveis-parceiros'
import { Priority, priorityFor } from './possiveis-parceiros-priority'

// Termos que sugerem, pelo nome, que a empresa atua como correspondente/promotora/financeira
// (mesma lógica do filtro_nome_amplos do robô de extração, mais os termos validados com o Diego).
export const TERMOS_MERCADO = ['CRED', 'CONSIG', 'FINANC', 'EMPREST', 'PROMOTORA', 'BANCARI', 'BENEFICIO', 'BANK', 'BANCO']
const TERMOS_MERCADO_RE = new RegExp(TERMOS_MERCADO.join('|'), 'i')

function norm(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '')
}

export function pareceAgenteMercado(p: PossiblePartnerRow): boolean {
  const nome = norm(`${p.razaoSocial} ${p.nomeFantasia ?? ''}`)
  return TERMOS_MERCADO_RE.test(nome)
}

export interface Filters {
  busca: string
  uf: string
  cidade: string
  camada: string
  jaParceiro: string
  prioridade: string
  termoMercado: string
}

export function parseFilters(searchParams: URLSearchParams): Filters {
  return {
    busca:        (searchParams.get('q') ?? '').toLowerCase().trim(),
    uf:           (searchParams.get('uf') ?? '').toUpperCase().trim(),
    cidade:       (searchParams.get('cidade') ?? '').toUpperCase().trim(),
    camada:       (searchParams.get('camada') ?? '').toUpperCase().trim(),
    jaParceiro:   searchParams.get('jaParceiro') ?? '',
    prioridade:   (searchParams.get('prioridade') ?? '').toUpperCase().trim(),
    termoMercado: searchParams.get('termoMercado') ?? '',
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
    if (f.termoMercado === 'sim' && !pareceAgenteMercado(p)) return false
    return true
  })
}
