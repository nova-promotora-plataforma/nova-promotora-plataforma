import { parseCSV } from './client'

export const POSSIVEIS_PARCEIROS_SHEET_ID = '1cPCfWQbio8J3QiXwOrDYMeE33QdIey6cT4DsmsDzxKE'

export interface PossiblePartnerRow {
  cnpj:           string
  razaoSocial:    string
  nomeFantasia:   string | null
  matriz:         string | null
  camada:         'NUCLEO' | 'AMPLO'
  cnaePrincipal:  string
  cnaeDesc:       string | null
  porte:          string | null
  cidade:         string | null
  uf:             string | null
  telefone:       string | null
  email:          string | null
  jaParceiro:     boolean
  raizNaCarteira: boolean
}

function norm(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}

function normCamada(s: string | undefined): 'NUCLEO' | 'AMPLO' {
  const n = norm(s ?? '')
  return n === 'amplo' ? 'AMPLO' : 'NUCLEO'
}

let cache: { data: PossiblePartnerRow[]; fetchedAt: number } | null = null
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutos — base muda só ~1x/mês, não precisa buscar toda hora

export async function fetchPossiblePartners(): Promise<PossiblePartnerRow[]> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) return cache.data

  const url = `https://docs.google.com/spreadsheets/d/${POSSIVEIS_PARCEIROS_SHEET_ID}/export?format=csv`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Erro ao buscar planilha de possíveis parceiros: ${res.status}`)
  const buf = await res.arrayBuffer()
  const csv = new TextDecoder('utf-8').decode(buf)

  const rows = parseCSV(csv)
  if (rows.length < 2) { cache = { data: [], fetchedAt: Date.now() }; return [] }

  const headers = rows[0].map(h => norm(h))
  const idx = (name: string) => headers.indexOf(name)

  const col = {
    cnpj:           idx('cnpj'),
    razaoSocial:    idx('razao_social'),
    nomeFantasia:   idx('nome_fantasia'),
    matriz:         idx('matriz'),
    camada:         idx('camada'),
    cnaePrincipal:  idx('cnae_principal'),
    cnaeDesc:       idx('cnae_desc'),
    porte:          idx('porte'),
    cidade:         idx('cidade'),
    uf:             idx('uf'),
    telefone:       idx('telefone'),
    email:          idx('email'),
    jaParceiro:     idx('ja_parceiro'),
    raizNaCarteira: idx('raiz_na_carteira'),
  }

  const data: PossiblePartnerRow[] = []
  for (const r of rows.slice(1)) {
    // Sheets converte a coluna pra número e apaga zeros à esquerda — CNPJ sempre tem 14 dígitos.
    const cnpjRaw = r[col.cnpj]?.trim()
    if (!cnpjRaw) continue
    const cnpj = /^\d+$/.test(cnpjRaw) ? cnpjRaw.padStart(14, '0') : cnpjRaw

    data.push({
      cnpj,
      razaoSocial:    r[col.razaoSocial]?.trim() || '(sem razão social)',
      nomeFantasia:   r[col.nomeFantasia]?.trim() || null,
      matriz:         r[col.matriz]?.trim() || null,
      camada:         normCamada(r[col.camada]),
      cnaePrincipal:  r[col.cnaePrincipal]?.trim() || '',
      cnaeDesc:       r[col.cnaeDesc]?.trim() || null,
      porte:          r[col.porte]?.trim() || null,
      cidade:         r[col.cidade]?.trim() || null,
      uf:             r[col.uf]?.trim().toUpperCase() || null,
      telefone:       r[col.telefone]?.trim() || null,
      email:          r[col.email]?.trim() || null,
      jaParceiro:     (r[col.jaParceiro] ?? '').trim().toUpperCase() === 'SIM',
      raizNaCarteira: (r[col.raizNaCarteira] ?? '').trim().toUpperCase() === 'SIM',
    })
  }

  cache = { data, fetchedAt: Date.now() }
  return data
}
