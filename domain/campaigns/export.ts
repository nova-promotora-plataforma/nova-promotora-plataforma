import * as XLSX from 'xlsx'

interface PartnerRow {
  codigo:           string
  nome:             string
  cidade:           string | null
  uf:               string | null
  telefone:         string | null
  email:            string | null
  status:           string
  totalProducao:    number
  lastProductionDate: string | null
}

export function exportToXLSX(rows: PartnerRow[], filename = 'campanha'): Buffer {
  const ws = XLSX.utils.json_to_sheet(
    rows.map(r => ({
      'Código':            r.codigo,
      'Nome':              r.nome,
      'Cidade':            r.cidade ?? '',
      'UF':                r.uf ?? '',
      'Telefone':          r.telefone ?? '',
      'E-mail':            r.email ?? '',
      'Status':            r.status === 'ATIVO' ? 'Ativo' : 'Inativo',
      'Total de Produção': r.totalProducao,
      'Última Produção':   r.lastProductionDate ?? '',
    }))
  )
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Parceiros')
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer
}

export function exportToCSV(rows: PartnerRow[]): string {
  const headers = ['Código','Nome','Cidade','UF','Telefone','E-mail','Status','Total de Produção','Última Produção']
  const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`
  const lines = [
    headers.map(escape).join(','),
    ...rows.map(r => [
      r.codigo, r.nome, r.cidade ?? '', r.uf ?? '',
      r.telefone ?? '', r.email ?? '',
      r.status === 'ATIVO' ? 'Ativo' : 'Inativo',
      String(r.totalProducao),
      r.lastProductionDate ?? '',
    ].map(escape).join(',')),
  ]
  return lines.join('\r\n')
}
