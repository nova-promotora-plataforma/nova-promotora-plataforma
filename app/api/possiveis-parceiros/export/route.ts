import { NextRequest, NextResponse } from 'next/server'
import { fetchPossiblePartners } from '@/lib/sheets/possiveis-parceiros'
import { parseFilters, applyFilters } from '@/lib/sheets/possiveis-parceiros-filters'

function formatCnpj(cnpj: string) {
  if (cnpj.length !== 14) return cnpj
  return `${cnpj.slice(0,2)}.${cnpj.slice(2,5)}.${cnpj.slice(5,8)}/${cnpj.slice(8,12)}-${cnpj.slice(12)}`
}

function csvField(v: string) {
  return /[;"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

const HEADERS = [
  'cnpj', 'razao_social', 'nome_fantasia', 'matriz', 'camada', 'cnae_principal', 'cnae_desc',
  'porte', 'cidade', 'uf', 'telefone', 'email', 'ja_parceiro', 'raiz_na_carteira',
]

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const filters = parseFilters(searchParams)

  const all = await fetchPossiblePartners()
  const filtered = applyFilters(all, filters)

  const lines = [HEADERS.join(';')]
  for (const p of filtered) {
    lines.push([
      formatCnpj(p.cnpj),
      p.razaoSocial,
      p.nomeFantasia ?? '',
      p.matriz ?? '',
      p.camada,
      p.cnaePrincipal,
      p.cnaeDesc ?? '',
      p.porte ?? '',
      p.cidade ?? '',
      p.uf ?? '',
      p.telefone ?? '',
      p.email ?? '',
      p.jaParceiro ? 'SIM' : '',
      p.raizNaCarteira ? 'SIM' : '',
    ].map(v => csvField(String(v))).join(';'))
  }

  const csv = '﻿' + lines.join('\r\n') // BOM — abre direto no Excel com acentos corretos
  const dataStr = new Date().toISOString().slice(0, 10)

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="possiveis_parceiros_${dataStr}.csv"`,
    },
  })
}
