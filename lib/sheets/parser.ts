/**
 * Converte as linhas brutas da planilha em objetos estruturados
 * conforme mapeamento definido no CLAUDE.md (seção 7)
 */

export interface SheetPartner {
  codigo: string
  nome: string
  funcionarioCidade: string | null
  uf: string | null
  cpfResponsavel: string | null
  telefoneOficial: string | null
  emailOficial: string | null
  totalProducao: number
  producoes: SheetProducao[]      // 1 por mês
  comparativos: SheetComparativo[]
}

export interface SheetProducao {
  referenceMonth: string   // 'YYYY-MM-01'
  amount: number
}

export interface SheetComparativo {
  referenceMonth: string
  diffPrevValue: number | null
  diffPrevPct: number | null
}

function parseBRL(raw: string | undefined): number {
  if (!raw) return 0
  return parseFloat(raw.replace(/[R$\s.]/g, '').replace(',', '.')) || 0
}

function parseMonth(label: string): string | null {
  // Formato da planilha: "abr/21", "jun/26" etc.
  const months: Record<string, string> = {
    jan: '01', fev: '02', mar: '03', abr: '04', mai: '05', jun: '06',
    jul: '07', ago: '08', set: '09', out: '10', nov: '11', dez: '12',
  }
  const match = label.toLowerCase().match(/^([a-z]{3})\/(\d{2})$/)
  if (!match) return null
  const [, mon, yr] = match
  const m = months[mon]
  if (!m) return null
  return `20${yr}-${m}-01`
}

export function parseSheetRows(
  headers: string[],
  rows: string[][]
): { partners: SheetPartner[]; errors: string[] } {
  const errors: string[] = []
  const partners: SheetPartner[] = []

  // Identificar colunas fixas pelo cabeçalho
  const col = (name: string) => headers.indexOf(name)

  const idxCodigo       = col('codigo')
  const idxNome         = col('nome')
  const idxCidade       = col('funcionario_cidade')
  const idxUF           = col('uf')
  const idxCPF          = col('cpf_responsavel')
  const idxTel          = col('Telefone Oficial')
  const idxEmail        = col('Email Oficial')
  const idxTotal        = col('Total em Produção')

  // Detectar colunas de meses (ex: "abr/21" … "jun/26")
  const monthCols: { idx: number; month: string }[] = []
  const diffValCols: { idx: number; month: string }[] = []
  const diffPctCols: { idx: number; month: string }[] = []

  headers.forEach((h, i) => {
    if (/^[a-z]{3}\/\d{2}$/i.test(h.trim())) {
      const month = parseMonth(h.trim())
      if (month) monthCols.push({ idx: i, month })
    }
  })

  // Comparativos ficam em blocos após os meses (mesmo índice de mês, colunas seguintes)
  // A planilha tem "Comparativo em Valores" e "Comparativo em Porcentagem"
  // Detectamos por prefixo de cabeçalho
  headers.forEach((h, i) => {
    const clean = h.trim()
    // Colunas "Comparativo em Valores abr/21" ou apenas o mês repetido numa segunda faixa
    // Dependendo da estrutura real, ajustar aqui
    if (clean.startsWith('Comparativo em Valores')) {
      const mon = clean.replace('Comparativo em Valores', '').trim()
      const month = parseMonth(mon)
      if (month) diffValCols.push({ idx: i, month })
    }
    if (clean.startsWith('Comparativo em Porcentagem')) {
      const mon = clean.replace('Comparativo em Porcentagem', '').trim()
      const month = parseMonth(mon)
      if (month) diffPctCols.push({ idx: i, month })
    }
  })

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r]
    const codigo = row[idxCodigo]?.trim()

    if (!codigo) {
      errors.push(`Linha ${r + 2}: sem código — ignorada`)
      continue
    }

    const producoes: SheetProducao[] = monthCols.map(({ idx, month }) => ({
      referenceMonth: month,
      amount: parseBRL(row[idx]),
    }))

    const comparativos: SheetComparativo[] = monthCols.map(({ month }, i) => {
      const dv = diffValCols[i]
      const dp = diffPctCols[i]
      return {
        referenceMonth: month,
        diffPrevValue: dv ? parseBRL(row[dv.idx]) || null : null,
        diffPrevPct:   dp ? parseFloat(row[dp.idx]?.replace(',', '.') ?? '') || null : null,
      }
    })

    partners.push({
      codigo,
      nome:             row[idxNome]?.trim() ?? '',
      funcionarioCidade: row[idxCidade]?.trim() || null,
      uf:               row[idxUF]?.trim().toUpperCase() || null,
      cpfResponsavel:   row[idxCPF]?.trim() || null,
      telefoneOficial:  row[idxTel]?.trim() || null,
      emailOficial:     row[idxEmail]?.trim() || null,
      totalProducao:    parseBRL(row[idxTotal]),
      producoes,
      comparativos,
    })
  }

  return { partners, errors }
}
