import { NextRequest, NextResponse } from 'next/server'
import { fetchPossiblePartners } from '@/lib/sheets/possiveis-parceiros'

export async function GET(req: NextRequest) {
  const uf = (req.nextUrl.searchParams.get('uf') ?? '').toUpperCase().trim()
  if (!uf) return NextResponse.json({ cidades: [] })

  const all = await fetchPossiblePartners()
  const cidades = Array.from(new Set(all.filter(p => p.uf === uf && p.cidade).map(p => p.cidade as string)))
    .sort((a, b) => a.localeCompare(b, 'pt-BR'))

  return NextResponse.json({ cidades })
}
