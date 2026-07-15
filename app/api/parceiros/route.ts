import { NextRequest, NextResponse } from 'next/server'
import { fetchAllPartners } from '@/lib/sheets/partners'

const PAGE_SIZE = 20

function monthToNum(m: string | null) {
  if (!m) return 0
  const [mon, yr] = m.split('/')
  const mm: Record<string,string> = { jan:'01',fev:'02',mar:'03',abr:'04',mai:'05',jun:'06',jul:'07',ago:'08',set:'09',out:'10',nov:'11',dez:'12' }
  return parseInt(`20${yr}${mm[mon] ?? '00'}`) || 0
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const page    = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const busca   = (searchParams.get('q') ?? '').toLowerCase().trim()
  const status  = searchParams.get('status') ?? ''
  const uf      = (searchParams.get('uf') ?? '').toUpperCase()
  const sortBy  = searchParams.get('sortBy')  ?? 'nome'
  const sortDir = searchParams.get('sortDir') ?? 'asc'

  const all = await fetchAllPartners()
  const eligible = all.filter(p => p.isEligible)

  const filtered = eligible.filter(p => {
    if (busca  && !p.nome.toLowerCase().includes(busca) && !p.codigo.toLowerCase().includes(busca)) return false
    if (status && p.status !== status) return false
    if (uf     && p.uf !== uf) return false
    return true
  })

  filtered.sort((a, b) => {
    let diff = 0
    if      (sortBy === 'totalProducao')       diff = a.totalProducao - b.totalProducao
    else if (sortBy === 'lastProductionMonth') diff = monthToNum(a.lastProductionMonth) - monthToNum(b.lastProductionMonth)
    else if (sortBy === 'codigo')              diff = a.codigo.localeCompare(b.codigo, 'pt-BR', { numeric: true })
    else if (sortBy === 'funcionarioCidade')   diff = (a.funcionarioCidade ?? '').localeCompare(b.funcionarioCidade ?? '', 'pt-BR')
    else if (sortBy === 'status')              diff = a.status.localeCompare(b.status)
    else                                       diff = a.nome.localeCompare(b.nome, 'pt-BR')
    return sortDir === 'desc' ? -diff : diff
  })

  const total = filtered.length
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const slice = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(p => ({
    id:                  p.codigo,
    codigo:              p.codigo,
    nome:                p.nome,
    funcionarioCidade:   p.funcionarioCidade,
    uf:                  p.uf,
    telefoneOficial:     p.telefoneOficial,
    emailOficial:        p.emailOficial,
    status:              p.status,
    totalProducao:       p.totalProducao,
    lastProductionMonth: p.lastProductionMonth,
  }))

  return NextResponse.json({ data: slice, total, page, pages, sortBy, sortDir })
}
