import { NextRequest, NextResponse } from 'next/server'
import { fetchSheetCSV, parseCSV } from '@/lib/sheets/client'

const PAGE_SIZE = 20
const MONTH_RE  = /^[a-z]{3}\/\d{2}$/i

// Normaliza string para comparar colunas com possíveis problemas de encoding
function norm(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}

function findCol(headers: string[], ...candidates: string[]): number {
  for (const cand of candidates) {
    const n = norm(cand)
    const idx = headers.findIndex(h => norm(h) === n)
    if (idx >= 0) return idx
  }
  return -1
}

function parseBRL(raw: string | undefined): number {
  if (!raw) return 0
  return parseFloat(raw.replace(/[R$\s.]/g, '').replace(',', '.')) || 0
}

function toTitleCase(s: string): string {
  const minors = new Set(['de','da','do','das','dos','e','a','o','em','na','no'])
  return s.toLowerCase().split(' ').map((w, i) =>
    i === 0 || !minors.has(w) ? w.charAt(0).toUpperCase() + w.slice(1) : w
  ).join(' ')
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const page   = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const busca  = (searchParams.get('q') ?? '').toLowerCase().trim()
  const status = searchParams.get('status') ?? ''
  const uf     = (searchParams.get('uf') ?? '').toUpperCase()

  const csv  = await fetchSheetCSV()
  const rows = parseCSV(csv)
  if (rows.length < 2) return NextResponse.json({ data: [], total: 0, page: 1, pages: 1 })

  const headers = rows[0]
  const dataRows = rows.slice(1)

  // Índices das colunas fixas
  const idxCodigo = findCol(headers, 'codigo')
  const idxNome   = findCol(headers, 'nome')
  const idxCidade = findCol(headers, 'funcionario_cidade')
  const idxUF     = findCol(headers, 'uf')
  const idxTel    = findCol(headers, 'Telefone Oficial', 'telefone_oficial')
  const idxEmail  = findCol(headers, 'Email Oficial', 'email_oficial')
  // Total em Produção pode vir com encoding quebrado
  const idxTotal  = headers.findIndex(h => norm(h).includes('total em produ'))

  // Índices das colunas de mês (ex: "abr/21", "jun/26")
  const monthCols: number[] = []
  headers.forEach((h, i) => {
    if (MONTH_RE.test(h.trim())) monthCols.push(i)
  })

  // 60 dias atrás para classificar ativo/inativo
  const sixtyDaysAgo = new Date()
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

  const monthToDate: Record<number, Date> = {}
  const monthToLabel: Record<number, string> = {}
  const monthMap: Record<string, string> = {
    jan:'01',fev:'02',mar:'03',abr:'04',mai:'05',jun:'06',
    jul:'07',ago:'08',set:'09',out:'10',nov:'11',dez:'12',
  }
  monthCols.forEach(idx => {
    const h = headers[idx].trim().toLowerCase()
    const [mon, yr] = h.split('/')
    const m = monthMap[mon]
    if (m) {
      monthToDate[idx]  = new Date(`20${yr}-${m}-01`)
      monthToLabel[idx] = h
    }
  })

  const partners = dataRows
    .filter(row => row[idxCodigo]?.trim())
    .map(row => {
      // Encontrar último mês com produção > 0
      let lastIdx: number | null = null
      for (let i = monthCols.length - 1; i >= 0; i--) {
        const idx = monthCols[i]
        if (parseBRL(row[idx]) > 0) { lastIdx = idx; break }
      }

      const isEligible = lastIdx !== null
      const lastDate   = lastIdx !== null ? monthToDate[lastIdx] : null
      const isAtivo    = lastDate ? lastDate >= sixtyDaysAgo : false
      const totalProd  = idxTotal >= 0 ? parseBRL(row[idxTotal]) : 0

      return {
        id:                  row[idxCodigo].trim(),
        codigo:              row[idxCodigo].trim(),
        nome:                toTitleCase(row[idxNome]?.trim() ?? ''),
        funcionarioCidade:   row[idxCidade]?.trim() ? toTitleCase(row[idxCidade].trim()) : null,
        uf:                  row[idxUF]?.trim().toUpperCase() || null,
        telefoneOficial:     row[idxTel]?.trim() || null,
        emailOficial:        row[idxEmail]?.trim() || null,
        status:              isAtivo ? 'ATIVO' : 'INATIVO',
        isEligible,
        totalProducao:       totalProd,
        lastProductionMonth: lastIdx !== null ? monthToLabel[lastIdx] : null,
      }
    })
    .filter(p => p.isEligible)  // só quem já produziu alguma vez

  // Filtros
  const filtered = partners.filter(p => {
    if (busca && !p.nome.toLowerCase().includes(busca) && !p.codigo.toLowerCase().includes(busca)) return false
    if (status && p.status !== status) return false
    if (uf && p.uf !== uf) return false
    return true
  })

  const total = filtered.length
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const slice = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return NextResponse.json({ data: slice, total, page, pages })
}
