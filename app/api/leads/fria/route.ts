import { NextRequest, NextResponse } from 'next/server'
import { parseCSV } from '@/lib/sheets/client'
import { norm } from '@/lib/sheets/partners'

const SHEET_IDS: Record<string, string> = {
  'bot-alexandre': '1hPLlgcPUyILnguINQaWmyqf7i1Tysc6ynAe6B5ocXyY',
  'bot':           '1mJsgDxMj2-6fJYRqXTnW9TJg9P5UPR61UndLNQ476Uc',
  'nexxo':         '1PJRqQTynNS4UYLyFqeoYn8G_Y8VjmRFwGRQZ8-y38as',
}

const NEXXO_GID = '820076792'

// Status permitidos por base (lowercase para comparação)
const ALLOWED_STATUS: Record<string, string[]> = {
  'bot-alexandre': [
    '', 'lead sem retorno',
  ],
  'bot': [
    '', 'lead sem retorno', 'perdido', 'parceiro recusou cadastro',
    'negociação em andamento', 'não compareceu na reunião', 'perdido (outro)',
    'parceiro nao tem cnpj', 'parceiro com foco em produtos fora da grade',
    'parceiro sem pldft', 'sem retorno', 'parceiro com produção -20k',
    'parceiro sem aneps/febran',
  ],
  'nexxo': [
    '', 'sem retorno', 'perdido (outro)', 'negociação em andamento',
    'lead sem retorno', 'não tem certificado e não tem cnpj e nunca atuou no mercado',
    'não tem certificado e não tem cnpj',
  ],
}

const normKey = (s: string) => norm(s).replace(/\s+/g, '_')

async function fetchCSV(id: string, gid?: string): Promise<string> {
  const url = gid
    ? `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`
    : `https://docs.google.com/spreadsheets/d/${id}/export?format=csv`
  const res = await fetch(url, { cache: 'no-store' })
  const buf = await res.arrayBuffer()
  return new TextDecoder('utf-8').decode(buf)
}

function extractYear(val: string): number | null {
  // dd/mm/yyyy
  const dmy = val.match(/(\d{2})\/(\d{2})\/(\d{4})/)
  if (dmy) return parseInt(dmy[3])
  // yyyy-mm-dd
  const ymd = val.match(/(\d{4})-(\d{2})-(\d{2})/)
  if (ymd) return parseInt(ymd[1])
  return null
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const base = searchParams.get('base') ?? 'nexxo'
  const ano  = searchParams.get('ano')  // '2024' | '2025' | '2026' | null = todos

  const sheetId = SHEET_IDS[base]
  if (!sheetId) return NextResponse.json({ error: 'base inválida' }, { status: 400 })

  const gid = base === 'nexxo' ? NEXXO_GID : undefined
  const csv = await fetchCSV(sheetId, gid)
  const rows = parseCSV(csv)
  if (rows.length < 2) return NextResponse.json({ leads: [] })

  const h = rows[0]
  // Detectar colunas
  const idxData   = h.findIndex(c => normKey(c).startsWith('data') || normKey(c) === 'date')
  const idxNome   = h.findIndex(c => normKey(c) === 'nome' || normKey(c) === 'name')
  const idxTel    = h.findIndex(c => normKey(c) === 'telefone' || normKey(c) === 'phone' || normKey(c).includes('telefone'))
  const idxStatus = h.findIndex(c => normKey(c) === 'status')

  const allowed = new Set(ALLOWED_STATUS[base] ?? [''])
  const leads: { data: string; nome: string; telefone: string; status: string }[] = []

  for (const row of rows.slice(1)) {
    const status = (row[idxStatus] ?? '').trim()
    if (!allowed.has(status.toLowerCase())) continue

    const dataVal = idxData >= 0 ? (row[idxData] ?? '').trim() : ''
    if (ano) {
      const year = extractYear(dataVal)
      if (!year || year !== parseInt(ano)) continue
    }

    const nome = idxNome >= 0 ? (row[idxNome] ?? '').trim() : ''
    const tel  = idxTel  >= 0 ? (row[idxTel]  ?? '').trim() : ''
    if (!nome && !tel) continue

    leads.push({ data: dataVal, nome, telefone: tel, status })
  }

  return NextResponse.json({ leads, total: leads.length })
}
