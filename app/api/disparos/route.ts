import { NextRequest, NextResponse } from 'next/server'
import { CONVENIOS, fetchSheetByGid, parseCSV } from '@/lib/sheets/client'
import { norm, parseBRL, toTitleCase, MONTH_MAP } from '@/lib/sheets/partners'

const MONTH_RE = /^[a-z]{3}\/\d{2}$/i

// Faixas de inatividade em dias
const INATIVIDADE: Record<string, { min: number; max: number; label: string }> = {
  '3m':  { min: 60,   max: 179,  label: '3 meses'  },
  '6m':  { min: 180,  max: 364,  label: '6 meses'  },
  '1a':  { min: 365,  max: 729,  label: '1 ano'    },
  '2a':  { min: 730,  max: 1094, label: '2 anos'   },
  '3a':  { min: 1095, max: 99999, label: '3 anos ou mais' },
}

// Faixas de produção total em reais
const PRODUCAO: Record<string, { min: number; max: number; label: string }> = {
  '0-50':    { min: 0,       max: 50000,   label: 'até R$ 50 mil'        },
  '50-150':  { min: 50000,   max: 150000,  label: 'R$ 50 mil a R$ 150 mil' },
  '150-300': { min: 150000,  max: 300000,  label: 'R$ 150 mil a R$ 300 mil' },
  '300-500': { min: 300000,  max: 500000,  label: 'R$ 300 mil a R$ 500 mil' },
  '500-1M':  { min: 500000,  max: 1000000, label: 'R$ 500 mil a R$ 1 milhão' },
  '1M+':     { min: 1000000, max: Infinity, label: 'acima de R$ 1 milhão'  },
}

function gerarMensagem(params: {
  nome: string
  tempoLabel: string
  diasInativo: number
  convenio: string
  media: number
  total: number
}): string {
  const { nome, tempoLabel, diasInativo, convenio, media } = params
  const primeiroNome = nome.split(' ')[0]
  const mediaFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(media)

  if (diasInativo <= 179) {
    // 3 meses — tom: verificar, oferecer suporte
    return `Olá, ${primeiroNome}! 👋

Aqui é a equipe da *Nova Promotora*. Percebemos que faz cerca de *${tempoLabel}* que não recebemos sua produção conosco.

Você tinha uma média de *${mediaFmt}/mês* no convênio *${convenio}* — sabemos que você tem capacidade e gostaríamos de entender se está tudo bem.

Podemos ajudar com suporte, treinamento ou tirar alguma dúvida? Estamos aqui! 💪`
  }

  if (diasInativo <= 364) {
    // 6 meses — tom: sentindo falta, novas condições
    return `Olá, ${primeiroNome}!

Faz cerca de *${tempoLabel}* que você não produz com a *Nova Promotora*, e sentimos muito a sua falta.

Lembramos da sua produção média de *${mediaFmt}/mês* no convênio *${convenio}*. Você construiu um histórico importante aqui!

Temos novidades e condições especiais que podem te interessar. Que tal retomarmos uma conversa? 🤝`
  }

  if (diasInativo <= 729) {
    // 1 ano — tom: reencontro, evolução do mercado
    return `Olá, ${primeiroNome}!

A *Nova Promotora* está entrando em contato porque faz quase *${tempoLabel}* que você não produz conosco — e isso é tempo demais para ficarmos sem nos falar.

Você produzia em média *${mediaFmt}/mês* no convênio *${convenio}*. O mercado evoluiu, temos novos produtos e melhores condições.

Gostaríamos de apresentar as novidades e entender como podemos trabalhar juntos novamente. Pode ser um rápido papo? 😊`
  }

  if (diasInativo <= 1094) {
    // 2 anos — tom: reconexão, proposta diferenciada
    return `Olá, ${primeiroNome}!

Faz *${tempoLabel}* que você não produz com a *Nova Promotora* — e nunca é tarde para reconectar!

Você tinha uma produção média de *${mediaFmt}/mês* no convênio *${convenio}*, o que mostra o quanto você é capaz.

Passamos por muitas evoluções aqui e temos propostas diferenciadas para parceiros com o seu perfil. Quer saber mais? Podemos conversar sem compromisso. 🙌`
  }

  // 3 anos ou mais — tom: reativação especial, parceria histórica
  return `Olá, ${primeiroNome}!

A *Nova Promotora* está resgatando parcerias importantes — e a sua é uma delas!

Há *${tempoLabel}*, você produzia em média *${mediaFmt}/mês* no convênio *${convenio}*. Sua trajetória conosco foi significativa e gostaríamos muito de retomá-la.

Temos condições especiais de reativação para parceiros com o seu histórico. Vale uma conversa? Estamos à disposição! 🌟`
}

interface PartnerResult {
  codigo:        string
  nome:          string
  telefones:     string[]   // todos os números encontrados, deduplicados
  uf:            string | null
  totalProducao: number
  mediaProducao: number
  diasInativo:   number
  tempoLabel:    string
  convenio:      string
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const faixaInatividade = searchParams.get('inatividade') ?? ''
  const faixaProducao    = searchParams.get('producao')   ?? ''

  const inativoRange = INATIVIDADE[faixaInatividade]
  const producaoRange = PRODUCAO[faixaProducao]

  // Busca aba Todos + 4 abas de convênio em paralelo
  const [todosCSV, ...conveniosCSVs] = await Promise.all([
    fetchSheetByGid(CONVENIOS[0].gid),
    ...CONVENIOS.filter(c => c.key !== 'todos').map(c => fetchSheetByGid(c.gid)),
  ])

  const todosRows = parseCSV(todosCSV)
  if (todosRows.length < 2) return NextResponse.json({ partners: [], total: 0 })

  const headers   = todosRows[0]
  const idxCodigo = headers.findIndex(h => norm(h) === 'codigo')
  const idxNome   = headers.findIndex(h => norm(h) === 'nome')
  const idxUF     = headers.findIndex(h => norm(h) === 'uf')
  // Todos os campos de telefone úteis para WhatsApp (exclui ramal)
  const TEL_COLS = ['telefone', 'telefone_com', 'celular', 'telefone_comercial_1', 'telefone_comercial_2', 'celular_comercial']
  const idxTels  = TEL_COLS.map(col => headers.findIndex(h => norm(h) === col)).filter(i => i >= 0)
  const idxTotal  = headers.findIndex(h => norm(h) === 'total' || norm(h).includes('total em produ'))

  const monthCols: { idx: number; label: string; date: Date }[] = []
  headers.forEach((h, i) => {
    const t = h.trim()
    if (!MONTH_RE.test(t)) return
    const [mon, yr] = t.toLowerCase().split('/')
    const m = MONTH_MAP[mon]
    if (m) monthCols.push({ idx: i, label: t.toLowerCase(), date: new Date(`20${yr}-${m}-01`) })
  })
  monthCols.sort((a, b) => a.date.getTime() - b.date.getTime())

  // Monta mapa de totais por convênio para cada codigo
  const convenioAbas = CONVENIOS.filter(c => c.key !== 'todos')
  const convTotals = new Map<string, Record<string, number>>() // codigo -> { convenioKey -> total }

  for (let ci = 0; ci < convenioAbas.length; ci++) {
    const convRows = parseCSV(conveniosCSVs[ci])
    if (convRows.length < 2) continue
    const ch = convRows[0]
    const ciCodigo = ch.findIndex(h => norm(h) === 'codigo')
    const ciTotal  = ch.findIndex(h => norm(h) === 'total' || norm(h).includes('total em produ'))
    const ciMonths: number[] = []
    ch.forEach((h, i) => { if (MONTH_RE.test(h.trim())) ciMonths.push(i) })

    for (const row of convRows.slice(1)) {
      const code = row[ciCodigo]?.trim()
      if (!code) continue
      const tot = ciTotal >= 0 ? parseBRL(row[ciTotal]) : ciMonths.reduce((s, i) => s + parseBRL(row[i]), 0)
      if (tot <= 0) continue
      if (!convTotals.has(code)) convTotals.set(code, {})
      convTotals.get(code)![convenioAbas[ci].key] = tot
    }
  }

  const now = new Date()
  const results: PartnerResult[] = []

  for (const row of todosRows.slice(1)) {
    const code = row[idxCodigo]?.trim()
    if (!code) continue

    // Encontrar último mês produzido
    let lastCol: { label: string; date: Date } | null = null
    let monthsWithProduction = 0
    for (let i = monthCols.length - 1; i >= 0; i--) {
      const val = parseBRL(row[monthCols[i].idx])
      if (val > 0) {
        if (!lastCol) lastCol = monthCols[i]
        monthsWithProduction++
      }
    }
    if (!lastCol) continue // nunca produziu

    const diasInativo = Math.floor((now.getTime() - lastCol.date.getTime()) / 86400000)
    if (diasInativo < 60) continue // ainda ativo (menos de 2 meses)

    const total = idxTotal >= 0 ? parseBRL(row[idxTotal]) : 0
    if (total <= 0) continue // ignora produção zero

    // Aplicar filtros
    if (inativoRange && (diasInativo < inativoRange.min || diasInativo > inativoRange.max)) continue
    if (producaoRange && (total < producaoRange.min || total >= producaoRange.max)) continue

    // Tempo inativo em label legível
    let tempoLabel = `${diasInativo} dias`
    if (diasInativo >= 1095)     tempoLabel = '3 anos ou mais'
    else if (diasInativo >= 730) tempoLabel = '2 anos'
    else if (diasInativo >= 365) tempoLabel = '1 ano'
    else if (diasInativo >= 180) tempoLabel = '6 meses'
    else if (diasInativo >= 60)  tempoLabel = '3 meses'

    // Melhor convênio
    const convMap = convTotals.get(code) ?? {}
    let bestConvKey = ''
    let bestConvTotal = 0
    for (const [k, v] of Object.entries(convMap)) {
      if (v > bestConvTotal) { bestConvTotal = v; bestConvKey = k }
    }
    const bestConvLabel = convenioAbas.find(c => c.key === bestConvKey)?.label ?? 'Consignado'

    // Média mensal (meses com produção)
    const media = monthsWithProduction > 0 ? Math.round(total / monthsWithProduction) : 0

    const nomeRaw = row[idxNome]?.trim() ?? ''
    // Ignora linhas onde o nome é vazio ou começa com dígito (CPF/código)
    if (!nomeRaw || /^\d/.test(nomeRaw)) continue

    // Coleta todos os telefones únicos (remove vazios e duplicatas)
    const telefones = Array.from(new Set(
      idxTels.map(i => row[i]?.trim()).filter((v): v is string => !!v && v.length > 5)
    ))

    results.push({
      codigo:        code,
      nome:          toTitleCase(nomeRaw),
      telefones,
      uf:            row[idxUF]?.trim().toUpperCase() || null,
      totalProducao: Math.round(total),
      mediaProducao: media,
      diasInativo,
      tempoLabel,
      convenio:      bestConvLabel,
    })
  }

  results.sort((a, b) => b.totalProducao - a.totalProducao)

  return NextResponse.json({
    partners: results,
    total:    results.length,
    faixas:   { inatividade: INATIVIDADE, producao: PRODUCAO },
  })
}
