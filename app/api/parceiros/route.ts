import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'

const PAGE_SIZE = 20
const ACTIVE_DAYS = 60

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const page    = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const busca   = (searchParams.get('q') ?? '').trim()
  const status  = searchParams.get('status') ?? ''   // 'ATIVO' | 'INATIVO' | ''
  const uf      = (searchParams.get('uf') ?? '').toUpperCase()
  const sortBy  = searchParams.get('sortBy')  ?? 'totalProducao'
  const sortDir = (searchParams.get('sortDir') ?? 'desc') as 'asc' | 'desc'

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - ACTIVE_DAYS)

  // Agrega por parceiro a partir das propostas
  const agg = await prisma.$queryRaw<{
    cod_parceiro:      string
    total_producao:    number
    ultima_producao:   Date | null
    num_propostas:     number
    bancos:            string
    convenios:         string
  }[]>`
    SELECT
      cod_parceiro,
      SUM(producao)::float                      AS total_producao,
      MAX(data_pgto_cms)                        AS ultima_producao,
      COUNT(*)::int                             AS num_propostas,
      STRING_AGG(DISTINCT banco, ', ' ORDER BY banco) FILTER (WHERE banco IS NOT NULL) AS bancos,
      STRING_AGG(DISTINCT convenio, ', ' ORDER BY convenio) FILTER (WHERE convenio IS NOT NULL) AS convenios
    FROM proposals
    GROUP BY cod_parceiro
  `

  // Cruza com dados cadastrais da tabela partners (que ainda vem do Sheets por ora)
  // e calcula status ATIVO/INATIVO
  const parceiros = agg.map(r => {
    const ativo = r.ultima_producao ? r.ultima_producao >= cutoff : false
    return {
      codigo:            r.cod_parceiro,
      nome:              r.cod_parceiro, // enriquecido abaixo se tiver na tabela partners
      uf:                null as string | null,
      funcionarioCidade: null as string | null,
      status:            ativo ? 'ATIVO' : 'INATIVO',
      totalProducao:     r.total_producao,
      ultimaProducao:    r.ultima_producao,
      numPropostas:      r.num_propostas,
      bancos:            r.bancos ?? '',
      convenios:         r.convenios ?? '',
    }
  })

  // Enriquece com dados cadastrais do Partner (caso existam)
  const codigos = parceiros.map(p => p.codigo)
  const cadastros = await prisma.partner.findMany({
    where: { codigo: { in: codigos } },
    select: { codigo: true, nome: true, uf: true, funcionarioCidade: true },
  })
  const cadMap = new Map(cadastros.map(c => [c.codigo, c]))

  const enriched = parceiros.map(p => {
    const cad = cadMap.get(p.codigo)
    return {
      ...p,
      nome:              cad?.nome ?? p.codigo,
      uf:                cad?.uf ?? null,
      funcionarioCidade: cad?.funcionarioCidade ?? null,
    }
  })

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
    if      (sortBy === 'totalProducao') diff = a.totalProducao - b.totalProducao
    else if (sortBy === 'ultimaProducao') {
      diff = (a.ultimaProducao?.getTime() ?? 0) - (b.ultimaProducao?.getTime() ?? 0)
    }
    else if (sortBy === 'codigo') diff = a.codigo.localeCompare(b.codigo, 'pt-BR', { numeric: true })
    else if (sortBy === 'nome')   diff = a.nome.localeCompare(b.nome, 'pt-BR')
    else if (sortBy === 'status') diff = a.status.localeCompare(b.status)
    return sortDir === 'desc' ? -diff : diff
  })

  const total = filtered.length
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const slice = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return NextResponse.json({ data: slice, total, page, pages, sortBy, sortDir })
}
