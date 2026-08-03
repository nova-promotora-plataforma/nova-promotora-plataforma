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

// Produção mínima global — parceiros abaixo disso nunca aparecem
const PRODUCAO_MINIMA = 0

// Faixas de média mensal de produção em reais
const PRODUCAO: Record<string, { min: number; max: number; label: string }> = {
  '0-5':    { min: 0,     max: 5000,   label: 'Até R$ 5 mil/mês'              },
  '5-25':   { min: 5000,  max: 25000,  label: 'R$ 5 mil – R$ 25 mil/mês'     },
  '25-50':  { min: 25000, max: 50000,  label: 'R$ 25 mil – R$ 50 mil/mês'    },
  '50-100': { min: 50000, max: 100000, label: 'R$ 50 mil – R$ 100 mil/mês'   },
  '100+':   { min: 100000, max: Infinity, label: 'Acima de R$ 100 mil/mês'   },
}

// Blocklist do financeiro — parceiros com saldo negativo (Relatorio 27.JUL)
// Fonte: coluna Saldo < 0 na planilha enviada pelo financeiro
const BLOCKLIST: Set<string> = new Set([
  "8523",
  "365",
  "425",
  "7236",
  "5299",
  "7190",
  "6103",
  "9381",
  "7435",
  "1617",
  "6230",
  "8985",
  "6818",
  "6586",
  "2901",
  "3058",
  "4477",
  "1300",
  "8164",
  "9608",
  "9950",
  "5276",
  "7821",
  "1355",
  "6663",
  "999",
  "2540",
  "747",
  "4913",
  "6404",
  "9500",
  "6271",
  "2612",
  "3724",
  "1912",
  "3087",
  "5635",
  "3828",
  "7436",
  "863",
  "4934",
  "1014",
  "9857",
  "6264",
  "3286",
  "8686",
  "3452",
  "1737",
  "6661",
  "928",
  "6297",
  "2990",
  "7674",
  "9099",
  "6409",
  "1043",
  "1449",
  "8020",
  "8143",
  "3710",
  "4802",
  "4341",
  "5894",
  "6202",
  "4975",
  "7024",
  "3712",
  "65791",
  "4323",
  "6403",
  "582",
  "2979",
  "2860",
  "8000",
  "4785",
  "4402",
  "1245",
  "2969",
  "1728",
  "4756",
  "3017",
  "7590",
  "8832",
  "8223",
  "5804",
  "9273",
  "7194",
  "8645",
  "8901",
  "19962",
  "7234",
  "5188",
  "1570",
  "9235",
  "1313",
  "5034",
  "5923",
  "3018",
  "8070",
  "9760",
  "3993",
  "2514",
  "7786",
  "4663",
  "4635",
  "27714",
  "35",
  "7622",
  "7797",
  "6782",
  "8736",
  "4844",
  "8861",
  "2322",
  "1909",
  "6885",
  "9143",
  "4538",
  "7283",
  "2941",
  "3267",
  "13884",
  "8636",
  "3926",
  "3500",
  "7504",
  "9380",
  "32451",
  "1006",
  "4158",
  "96122",
  "6867",
  "1711",
  "8881",
  "9267",
  "4010",
  "753",
  "7663",
  "2874",
  "6325",
  "3332",
  "7361",
  "3370",
  "8105",
  "55484",
  "5551",
  "2813",
  "7758",
  "2767",
  "6456",
  "3711",
  "798",
  "66828",
  "8852",
  "6358",
  "6587",
  "5818",
  "8054",
  "633",
  "623",
  "1708",
  "8174",
  "4960",
  "8680",
  "1225",
  "7062",
  "5161",
  "1577",
  "3746",
  "6919",
  "3739",
  "7449",
  "2839",
  "3583",
  "9780",
  "562",
  "5350",
  "6469",
  "5056",
  "10926",
  "7359",
  "7882",
  "4419",
  "1631",
  "2173",
  "2660",
  "9450",
  "7353",
  "9845",
  "5875",
  "3479",
  "3922",
  "9887",
  "4016",
  "4759",
  "4358",
  "1042",
  "254",
  "387",
  "2650",
  "7037",
  "50934",
  "2646",
  "13",
  "4372",
  "8208",
  "348",
  "7602",
  "4255",
  "6660",
  "8168",
  "4176",
  "1943",
  "5694",
  "185",
  "9794",
  "6286",
  "490",
  "6030",
  "6813",
  "9979",
  "1998",
  "7995",
  "32979",
  "3000",
  "99425",
  "5731",
  "1635",
  "899",
  "2211",
  "1459",
  "5797",
  "8956",
  "8629",
  "8702",
  "3598",
  "6399",
  "4834",
  "5707",
  "3063",
  "9990",
  "1398",
  "579",
  "3499",
  "7475",
  "3164",
  "8084",
  "1324",
  "6406",
  "3307",
  "5504",
  "6956",
  "2128",
  "2768",
  "9459",
  "1411",
  "560",
  "2630",
  "61090",
  "8094",
  "8603",
  "3722",
  "9216",
  "3943",
  "2695",
  "1605",
  "4619",
  "9374",
  "5358",
  "8783",
  "9982",
  "6152",
  "25705",
  "94449",
  "6249",
  "53702",
  "9753",
  "3391",
  "8458",
  "3394",
  "4800",
  "1905",
  "3885",
  "71",
  "6864",
  "5139",
  "4671",
  "6216",
  "325",
  "19080",
  "1008",
  "6790",
  "6240",
  "4751",
  "5684",
  "3365",
  "7493",
  "9833",
  "4359",
  "1975",
  "6011",
  "7896",
  "8569",
  "9907",
  "52914",
  "6496",
  "6854",
  "7302",
  "9441",
  "42421",
  "4910",
  "2995",
  "2030",
  "718",
  "27452",
  "9894",
  "4863",
  "5826",
  "678",
  "49874",
  "3159",
  "4595",
  "10622",
  "35180",
  "4334",
  "40091",
  "9131",
  "6001",
  "9171",
  "6034",
  "4501",
  "5396",
  "1404",
  "8870",
  "2770",
  "1673",
  "4171",
  "6180",
  "8757",
  "8233",
  "3074",
  "7171",
  "5229",
  "2385",
  "1241",
  "8863",
  "6272",
  "6407",
  "2965",
  "4562",
  "58467",
  "4269",
  "2545",
  "7976",
  "3196",
  "3045",
  "5113",
  "7274",
  "1927",
  "3057",
  "2109",
  "7318",
  "95419",
  "7418",
  "7380",
  "870",
  "8236",
  "6028",
  "67748",
  "5764",
  "751",
  "4659",
  "9911",
  "6670",
  "7018",
  "4505",
  "5231",
  "7159",
  "9084",
  "7362",
  "2165",
  "2432",
  "2025",
  "2198",
  "9355",
  "9397",
  "9884",
  "88740",
  "1548",
  "90446",
  "6161",
  "6504",
  "5338",
  "8678",
  "4162",
  "9738",
  "1179",
  "4530",
  "537",
  "50922",
  "1246",
  "5914",
  "7916",
  "4124",
  "7464",
  "846",
  "3311",
  "21520",
  "5766",
  "8605",
  "3525",
  "6998",
  "30",
  "2131",
  "3912",
  "1421",
  "8930",
  "5497",
  "1950",
  "8414",
  "6658",
  "5746",
  "3117",
  "2359",
  "7304",
  "7839",
  "9028",
  "8627",
  "1867",
  "1007",
  "6843",
  "96093",
  "7915",
  "9956",
  "8428",
  "41022",
  "6389",
  "88923",
  "27651",
  "92347",
  "4166",
  "8962",
  "15232",
  "1549",
  "1352",
  "42318",
  "4309",
  "50785",
  "8936",
  "81904",
  "2084",
  "5095",
  "13045",
  "3417",
  "6648",
  "32272",
  "1809",
  "3088",
  "1795",
  "93896",
  "85",
  "3838",
  "6003",
  "3338",
  "34840",
  "349",
  "5800",
  "2420",
  "4736",
  "3069",
  "4561",
  "9035",
  "7055",
  "1373",
  "6365",
  "9138",
  "263",
  "1137",
  "2141",
  "8158",
  "16821",
  "9177",
  "68389",
  "27091",
  "2580",
  "5315",
  "3262",
  "9579",
  "7125",
  "64762",
  "14266",
  "2013",
  "8097",
  "8463",
  "1457",
  "689",
  "6118",
  "8837",
  "8424",
  "2807",
  "55336",
  "506",
  "1326",
  "6207",
  "4080",
  "5844",
  "3740",
  "3249",
  "4173",
  "6433",
  "6540",
  "2982",
  "3344",
  "328",
  "3414",
  "1485",
  "213",
  "6277",
  "1193",
  "1115",
  "5261",
  "212",
  "9347",
  "67255",
  "8108",
  "2168",
  "1701",
  "6312",
  "9206",
  "487",
  "8823",
  "3038",
  "2215",
  "9363",
  "9253",
  "4657",
  "96335",
  "5655",
  "83209",
  "1723",
  "8347",
  "2027",
  "19826",
  "39661",
  "7647",
  "76823",
  "5148",
  "3753",
  "15969",
  "1936",
  "69737",
  "6633",
  "2613",
  "3791",
  "3826",
  "307",
  "5906",
  "6554",
  "6928",
  "2456",
  "7094",
  "9615",
  "66786",
  "8690",
  "8323",
  "8457",
  "43109",
  "957",
  "60781",
  "9623",
  "74135",
  "721",
  "5351",
  "5016",
  "9357",
  "22",
  "7690",
  "80437",
  "4596",
  "28173",
  "3295",
  "41042",
  "50937",
  "5709",
])

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
  telefones:     { col: string; valor: string }[]  // todos os campos, um por coluna
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
  // Normaliza header substituindo espaços por underscore para comparação
  const normKey = (s: string) => norm(s).replace(/\s+/g, '_')
  const idxCodigo = headers.findIndex(h => normKey(h) === 'codigo')
  const idxNome   = headers.findIndex(h => normKey(h) === 'nome')
  const idxUF     = headers.findIndex(h => normKey(h) === 'uf')

  // Todos os campos de telefone úteis para WhatsApp (exclui ramal)
  const TEL_COLS = ['telefone', 'telefone_com', 'celular', 'telefone_comercial_1', 'telefone_comercial_2', 'celular_comercial']
  const idxTels  = TEL_COLS.map(col => ({ col, idx: headers.findIndex(h => normKey(h) === col) }))
  const idxTotal  = headers.findIndex(h => normKey(h) === 'total' || normKey(h).includes('total_em_produ') || norm(h).includes('total em produ'))

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
    const ciNormKey = (s: string) => norm(s).replace(/\s+/g, '_')
    const ciCodigo = ch.findIndex(h => ciNormKey(h) === 'codigo')
    const ciTotal  = ch.findIndex(h => ciNormKey(h) === 'total' || ciNormKey(h).includes('total_em_produ') || norm(h).includes('total em produ'))
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
    if (total < PRODUCAO_MINIMA) continue // abaixo do mínimo global de R$ 25 mil

    // Blocklist do financeiro
    if (BLOCKLIST.has(code)) continue

    // Aplicar filtros de segmentação
    if (inativoRange && (diasInativo < inativoRange.min || diasInativo > inativoRange.max)) continue

    // Média mensal (meses com produção) — calculada antes do filtro de produção
    const media = monthsWithProduction > 0 ? Math.round(total / monthsWithProduction) : 0

    if (producaoRange && (media < producaoRange.min || media >= producaoRange.max)) continue

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

    const nomeRaw = row[idxNome]?.trim() ?? ''
    // Ignora linhas onde o nome é vazio ou começa com dígito (CPF/código)
    if (!nomeRaw || /^\d/.test(nomeRaw)) continue

    // Coleta todos os campos de telefone separadamente (sem deduplicar)
    const telefones = idxTels
      .filter(({ idx }) => idx >= 0)
      .map(({ col, idx }) => ({ col, valor: row[idx]?.trim() ?? '' }))

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
