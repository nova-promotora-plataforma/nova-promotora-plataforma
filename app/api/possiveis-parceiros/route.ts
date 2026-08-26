import { NextRequest, NextResponse } from 'next/server'
import { fetchPossiblePartners } from '@/lib/sheets/possiveis-parceiros'

const PAGE_SIZE = 20

const VALID_UFS = new Set(['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'])

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const page       = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const busca      = (searchParams.get('q') ?? '').toLowerCase().trim()
  const uf         = (searchParams.get('uf') ?? '').toUpperCase()
  const camada     = (searchParams.get('camada') ?? '').toUpperCase()
  const jaParceiro = searchParams.get('jaParceiro') ?? ''
  const sortBy     = searchParams.get('sortBy')  ?? 'razaoSocial'
  const sortDir    = searchParams.get('sortDir') ?? 'asc'

  const all = await fetchPossiblePartners()

  const stats = {
    total:      all.length,
    jaParceiro: all.filter(p => p.jaParceiro).length,
    novos:      all.filter(p => !p.jaParceiro).length,
  }

  const ufMap = new Map<string, { jaParceiro: number; novos: number }>()
  for (const p of all) {
    if (!p.uf || !VALID_UFS.has(p.uf)) continue
    const entry = ufMap.get(p.uf) ?? { jaParceiro: 0, novos: 0 }
    if (p.jaParceiro) entry.jaParceiro++
    else entry.novos++
    ufMap.set(p.uf, entry)
  }
  const porUf = Array.from(ufMap, ([uf, c]) => ({ uf, jaParceiro: c.jaParceiro, novos: c.novos, total: c.jaParceiro + c.novos }))
    .sort((a, b) => b.total - a.total)

  const filtered = all.filter(p => {
    if (busca &&
        !p.razaoSocial.toLowerCase().includes(busca) &&
        !(p.nomeFantasia ?? '').toLowerCase().includes(busca) &&
        !p.cnpj.includes(busca)) return false
    if (uf         && p.uf !== uf) return false
    if (camada     && p.camada !== camada) return false
    if (jaParceiro === 'sim' && !p.jaParceiro) return false
    if (jaParceiro === 'nao' && p.jaParceiro) return false
    return true
  })

  filtered.sort((a, b) => {
    let diff = 0
    if      (sortBy === 'cidade') diff = (a.cidade ?? '').localeCompare(b.cidade ?? '', 'pt-BR')
    else if (sortBy === 'uf')     diff = (a.uf ?? '').localeCompare(b.uf ?? '', 'pt-BR')
    else if (sortBy === 'camada') diff = a.camada.localeCompare(b.camada)
    else                          diff = a.razaoSocial.localeCompare(b.razaoSocial, 'pt-BR')
    return sortDir === 'desc' ? -diff : diff
  })

  const total = filtered.length
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const slice = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((p, i) => ({
    id: `${p.cnpj}-${(page - 1) * PAGE_SIZE + i}`,
    ...p,
  }))

  return NextResponse.json({ data: slice, total, page, pages, sortBy, sortDir, stats, porUf })
}
