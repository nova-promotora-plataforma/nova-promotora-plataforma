import { NextResponse } from 'next/server'
import { fetchSheetByGid, parseCSV } from '@/lib/sheets/client'
import { norm, parseBRL, toTitleCase, MONTH_MAP } from '@/lib/sheets/partners'

const LEADS_SHEET_ID = '1PJRqQTynNS4UYLyFqeoYn8G_Y8VjmRFwGRQZ8-y38as'
const LEADS_GID      = '820076792'
const PARCEIROS_GID  = '1311285376'
const MONTH_RE       = /^[a-z]{3}\/\d{2}$/i
const TEL_COLS       = ['telefone','telefone_com','celular','telefone_comercial_1','telefone_comercial_2','celular_comercial']

const normKey = (s: string) => norm(s).replace(/\s+/g, '_')

function normTel(t: string): string {
  const d = t.replace(/\D/g, '')
  if (d.length === 13 && d.startsWith('55')) return d.slice(2)
  if (d.length === 12 && d.startsWith('55')) return d.slice(2)
  return d
}

async function fetchCSVPublic(id: string, gid: string): Promise<string> {
  const url = `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`
  const res = await fetch(url, { next: { revalidate: 3600 } })
  const buf = await res.arrayBuffer()
  return new TextDecoder('utf-8').decode(buf)
}

export async function GET() {
  const [leadsCSV, parceirosCSV] = await Promise.all([
    fetchCSVPublic(LEADS_SHEET_ID, LEADS_GID),
    fetchSheetByGid(PARCEIROS_GID),
  ])

  // --- Parse leads ---
  const leadsRows = parseCSV(leadsCSV)
  if (leadsRows.length < 2) return NextResponse.json({ parceiros: [], stats: {} })

  const lh         = leadsRows[0]
  const idxLTel    = lh.findIndex(h => normKey(h).includes('telefone') || normKey(h) === 'phone')
  const idxLNome   = lh.findIndex(h => normKey(h) === 'nome' || normKey(h) === 'name')
  const idxLStatus = lh.findIndex(h => normKey(h) === 'status')

  const leadTels = new Map<string, { nome: string; status: string }>()
  for (const row of leadsRows.slice(1)) {
    const raw = row[idxLTel]?.trim() ?? ''
    const tel = normTel(raw)
    if (!tel || tel.length < 8) continue
    leadTels.set(tel, { nome: row[idxLNome]?.trim() ?? '', status: row[idxLStatus]?.trim() ?? '' })
    // também sem o 9 (11 → 10 dígitos)
    if (tel.length === 11) leadTels.set(tel.slice(0, 2) + tel.slice(3), { nome: row[idxLNome]?.trim() ?? '', status: row[idxLStatus]?.trim() ?? '' })
  }

  // --- Parse parceiros ---
  const parcRows = parseCSV(parceirosCSV)
  if (parcRows.length < 2) return NextResponse.json({ parceiros: [], stats: {} })

  const ph      = parcRows[0]
  const idxCod  = ph.findIndex(h => normKey(h) === 'codigo')
  const idxNome = ph.findIndex(h => normKey(h) === 'nome')
  const idxUF   = ph.findIndex(h => normKey(h) === 'uf')
  const idxCid  = ph.findIndex(h => normKey(h) === 'funcionario_cidade')
  const idxTot  = ph.findIndex(h => normKey(h) === 'total' || normKey(h).includes('total_em_produ'))
  const telIdxs = TEL_COLS.map(col => ({ col, idx: ph.findIndex(h => normKey(h) === col) }))

  const monthCols: { idx: number; label: string; date: Date }[] = []
  ph.forEach((h, i) => {
    const t = h.trim()
    if (!MONTH_RE.test(t)) return
    const [mon, yr] = t.toLowerCase().split('/')
    const m = MONTH_MAP[mon]
    if (m) monthCols.push({ idx: i, label: t.toLowerCase(), date: new Date(`20${yr}-${m}-01`) })
  })
  monthCols.sort((a, b) => a.date.getTime() - b.date.getTime())

  const now = new Date()
  const sixtyDaysAgo = new Date(now); sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

  const matched: object[] = []
  let totalLeads = leadTels.size, naoCadastrados = 0

  for (const row of parcRows.slice(1)) {
    const code = row[idxCod]?.trim(); if (!code) continue

    // Verifica se algum telefone desse parceiro está nos leads
    let found = false
    for (const { idx } of telIdxs) {
      if (idx < 0) continue
      const t = normTel(row[idx]?.trim() ?? '')
      if (t && t.length >= 8 && leadTels.has(t)) { found = true; break }
    }
    if (!found) continue

    // Dados do parceiro
    const nomeRaw = row[idxNome]?.trim() ?? ''
    const total   = idxTot >= 0 ? parseBRL(row[idxTot]) : 0
    let lastLabel: string | null = null
    let lastDate:  Date   | null = null
    for (let i = monthCols.length - 1; i >= 0; i--) {
      if (parseBRL(row[monthCols[i].idx]) > 0) {
        lastLabel = monthCols[i].label
        lastDate  = monthCols[i].date
        break
      }
    }
    const status  = lastDate && lastDate >= sixtyDaysAgo ? 'ATIVO' : 'INATIVO'
    const cidade  = row[idxCid]?.trim() ? toTitleCase(row[idxCid].trim()) : null
    const uf      = row[idxUF]?.trim().toUpperCase() || null

    matched.push({
      codigo:      code,
      nome:        toTitleCase(nomeRaw),
      cidade,
      uf,
      ultimaProd:  lastLabel,
      total:       Math.round(total),
      status,
    })
  }

  naoCadastrados = Math.max(0, totalLeads - matched.length)

  matched.sort((a: any, b: any) => b.total - a.total)

  return NextResponse.json({
    parceiros: matched,
    stats: {
      totalLeads,
      jaParceiros:    matched.length,
      naoCadastrados,
      taxaConversao:  totalLeads > 0 ? +((matched.length / totalLeads) * 100).toFixed(1) : 0,
    },
  })
}
