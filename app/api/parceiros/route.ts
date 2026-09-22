export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'

const PAGE_SIZE = 20
const ACTIVE_DAYS = 60

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const page    = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const busca   = (searchParams.get('q') ?? '').trim()
  const status  = searchParams.get('status') ?? ''
  const uf      = (searchParams.get('uf') ?? '').toUpperCase()
  const sortBy  = searchParams.get('sortBy')  ?? 'totalProducao'
  const sortDir = (searchParams.get('sortDir') ?? 'desc') as 'asc' | 'desc'
  const ano     = parseInt(searchParams.get('ano') ?? '0') || 0
  const mes     = parseInt(searchParams.get('mes') ?? '0') || 0

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - ACTIVE_DAYS)

  // Filtro de período opcional (para producao do período selecionado)
  let periodoClause = ''
  if (ano && mes) {
    periodoClause = `AND EXTRACT(YEAR FROM data_pgto_cms) = ${ano} AND EXTRACT(MONTH FROM data_pgto_cms) = ${mes}`
  } else if (ano) {
    periodoClause = `AND EXTRACT(YEAR FROM data_pgto_cms) = ${ano}`
  }

  // Agregação principal: usa MAX global para calcular status ATIVO/INATIVO (independente do período),
  // mas SUM de producao restrito ao período quando filtrado
  const agg = await prisma.$queryRawUnsafe<{
    cod_parceiro:         string
    total_producao:       number
    ultima_producao:      Date | null
    ultima_producao_geral: Date | null
    num_propostas:        number
  }[]>(`
    SELECT
      cod_parceiro,
      SUM(CASE WHEN TRUE ${periodoClause} THEN producao ELSE 0 END)::float AS total_producao,
      MAX(CASE WHEN TRUE ${periodoClause} THEN data_pgto_cms ELSE NULL END) AS ultima_producao,
      MAX(data_pgto_cms)                                                     AS ultima_producao_geral,
      COUNT(*)::int                                                          AS num_propostas
    FROM proposals
    GROUP BY cod_parceiro
    ${periodoClause ? 'HAVING SUM(CASE WHEN TRUE ' + periodoClause + ' THEN producao ELSE 0 END) > 0' : ''}
  `)

  const parceiros = agg.map(r => {
    const ultimaGeral = r.ultima_producao_geral
    const ativo = ultimaGeral ? ultimaGeral >= cutoff : false
    return {
      codigo:         r.cod_parceiro,
      nome:           r.cod_parceiro,
      uf:             null as string | null,
      funcionarioCidade: null as string | null,
      status:         ativo ? 'ATIVO' : 'INATIVO',
      totalProducao:  r.total_producao,
      ultimaProducao: r.ultima_producao,
      numPropostas:   r.num_propostas,
    }
  })

  // Enriquece com dados cadastrais da tabela partners
  const codigos   = parceiros.map(p => p.codigo)
  const cadastros = await prisma.partner.findMany({
    where:  { codigo: { in: codigos } },
    select: { codigo: true, nome: true, uf: true, funcionarioCidade: true },
  })
  const cadMap = new Map(cadastros.map(c => [c.codigo, c]))

  const MONTH_NAMES = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']

  const enriched = parceiros.map(p => {
    const cad = cadMap.get(p.codigo)
    const d   = p.ultimaProducao ? new Date(p.ultimaProducao) : null
    const mon = d ? MONTH_NAMES[d.getUTCMonth()] : null
    const yr  = d ? String(d.getUTCFullYear()).slice(2) : null
    return {
      id:                p.codigo,
      codigo:            p.codigo,
      nome:              cad?.nome ?? p.codigo,
      uf:                cad?.uf ?? null,
      funcionarioCidade: cad?.funcionarioCidade ?? null,
      status:            p.status,
      totalProducao:     p.totalProducao,
      lastProductionMonth: d && mon ? `${mon}/${yr}` : null,
    }
  })

  // Totais globais (sem filtro de status/uf/busca, sem período)
  const totalAtivos   = enriched.filter(p => p.status === 'ATIVO').length
  const totalInativos = enriched.filter(p => p.status === 'INATIVO').length

  // Filtros
  let filtered = enriched.filter(p => {
    if (busca) {
      const q = busca.toLowerCase()
      if (!p.nome.toLowerCase().includes(q) && !p.codigo.toLowerCase().includes(q)) return false
    }
    if (status && p.status !== status) return false
    if (uf && p.uf !== uf) return false
    return true
  })

  // Ordenação
  filtered.sort((a, b) => {
    let diff = 0
    if      (sortBy === 'totalProducao')      diff = a.totalProducao - b.totalProducao
    else if (sortBy === 'lastProductionMonth') diff = (a.lastProductionMonth ?? '').localeCompare(b.lastProductionMonth ?? '')
    else if (sortBy === 'codigo') diff = a.codigo.localeCompare(b.codigo, 'pt-BR', { numeric: true })
    else if (sortBy === 'nome')   diff = a.nome.localeCompare(b.nome, 'pt-BR')
    else if (sortBy === 'status') diff = a.status.localeCompare(b.status)
    return sortDir === 'desc' ? -diff : diff
  })

  const total = filtered.length
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const slice = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return NextResponse.json({ data: slice, total, page, pages, sortBy, sortDir, totalAtivos, totalInativos })
}
