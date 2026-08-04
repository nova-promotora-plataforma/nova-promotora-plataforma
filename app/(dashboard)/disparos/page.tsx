'use client'

import { useState, useCallback } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Loader2, Search, Download, MessageSquare, Eye, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

const INATIVIDADE_OPTIONS = [
  { key: '3m', label: '3 meses'        },
  { key: '6m', label: '6 meses'        },
  { key: '1a', label: '1 ano'          },
  { key: '2a', label: '2 anos'         },
  { key: '3a', label: '3 anos ou mais' },
]

const PRODUCAO_OPTIONS = [
  { key: '0-20',    label: 'Até R$ 20 mil/mês'             },
  { key: '20-50',   label: 'R$ 20 mil – R$ 50 mil/mês'    },
  { key: '50-100',  label: 'R$ 50 mil – R$ 100 mil/mês'   },
  { key: '100-200', label: 'R$ 100 mil – R$ 200 mil/mês'  },
  { key: '200+',    label: 'Acima de R$ 200 mil/mês'       },
]

// Template fixo da Meta — espelha exatamente o modelo cadastrado no Gerenciador
const TEMPLATE = `Oi {{1}}!

Aqui é a Maria Eduarda, Especialista em Performance da Nova.
Analisei sua operação e vi que em {{4}} você chegou a produzir {{2}} aqui com a gente. Hoje está em {{3}}.

Teve alguma mudança na sua operação ou estratégia nesse período?`

interface TelField { col: string; valor: string }

interface Partner {
  codigo:        string
  nome:          string
  telefones:     TelField[]
  uf:            string | null
  cidade:        string | null
  totalProducao: number
  mediaProducao: number
  diasInativo:   number
  tempoLabel:    string
  convenio:      string
}

const TEL_LABELS: Record<string, string> = {
  telefone:             'Telefone',
  telefone_com:         'Tel. comercial',
  celular:              'Celular',
  telefone_comercial_1: 'Comercial 1',
  telefone_comercial_2: 'Comercial 2',
  celular_comercial:    'Celular comercial',
}

function isBadNumber(v: string) {
  if (!v || v === '.' || v === '0') return true
  const digits = v.replace(/\D/g, '')
  if (digits.length < 8) return true
  if (/^0+$/.test(digits)) return true
  if (/^(9)\1+$/.test(digits)) return true
  if (/^(20202020|99999999|22222222|11111111)/.test(digits)) return true
  // Sequências repetitivas de 2 dígitos: 20202020, 12121212, etc.
  if (/^(\d{2})\1{3,}/.test(digits)) return true
  return false
}

// Ordem de preferência: celular > celular_comercial > demais
const TEL_PRIORITY = [
  'celular',
  'celular_comercial',
  'telefone',
  'telefone_com',
  'telefone_comercial_1',
  'telefone_comercial_2',
]

function melhorTelefone(telefones: TelField[]): string {
  const map = Object.fromEntries(telefones.map(t => [t.col, t.valor]))
  for (const col of TEL_PRIORITY) {
    const v = map[col] ?? ''
    if (!isBadNumber(v)) return v
  }
  return ''
}

// Partículas que não contam como nome
const PARTICLES = new Set(['de','da','do','das','dos','e','a','o','em','na','no','di','du','van','von'])

// Retorna mínimo 2 palavras de nome real, pulando partículas e iniciais (A. B.)
function primeiroNome(nome: string): string {
  const words = nome.trim().split(/\s+/)
  // Palavras que são nome próprio: ≥2 letras, sem ponto, sem dígito, não partícula
  const nameWords = words.filter(w =>
    /^[a-zA-ZÀ-ú]{2,}$/.test(w) && !PARTICLES.has(w.toLowerCase())
  )
  if (nameWords.length === 0) return nome          // fallback: nome completo
  if (nameWords.length === 1) return nameWords[0]  // só um nome real
  return nameWords.slice(0, 2).join(' ')           // primeiros 2 nomes reais
}

// Monta as 4 variáveis do template Meta para cada parceiro
function buildVars(p: Partner) {
  const v1 = primeiroNome(p.nome)                          // {{1}} primeiro nome
  const v2 = `${fmt(p.mediaProducao)}/mês`                 // {{2}} média mensal
  const v3 = `${p.tempoLabel} sem produção conosco`        // {{3}} situação atual
  const v4 = p.convenio                                    // {{4}} convênio
  return { v1, v2, v3, v4 }
}

function renderTemplate(p: Partner) {
  const { v1, v2, v3, v4 } = buildVars(p)
  return TEMPLATE
    .replace('{{1}}', v1)
    .replace('{{2}}', v2)
    .replace('{{3}}', v3)
    .replace('{{4}}', v4)
}

type SortKey = 'mediaProducao' | 'diasInativo' | null
type SortDir = 'asc' | 'desc'

export default function DisparosPage() {
  const [inatividade, setInatividade] = useState<string[]>([])
  const [producao,    setProducao]    = useState<string[]>([])
  const [loading,     setLoading]     = useState(false)
  const [results,     setResults]     = useState<Partner[] | null>(null)
  const [preview,     setPreview]     = useState<Partner | null>(null)
  const [sortKey,     setSortKey]     = useState<SortKey>(null)
  const [sortDir,     setSortDir]     = useState<SortDir>('asc')
  const [selected,    setSelected]    = useState<Set<string>>(new Set())
  const [busca,       setBusca]       = useState('')

  const buscar = useCallback(async () => {
    if (!inatividade.length || !producao.length) return
    setLoading(true)
    setResults(null)
    setSelected(new Set())
    try {
      const params = new URLSearchParams()
      inatividade.forEach(v => params.append('inatividade', v))
      producao.forEach(v => params.append('producao', v))
      const res  = await fetch(`/api/disparos?${params}`)
      const json = await res.json()
      setResults(json.partners ?? [])
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [inatividade, producao])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const filteredResults = results
    ? results.filter(p => p.nome.toLowerCase().includes(busca.toLowerCase()) ||
        p.codigo.includes(busca) || (p.uf ?? '').toLowerCase().includes(busca.toLowerCase()))
    : []

  const sortedResults = [...filteredResults].sort((a, b) => {
    if (!sortKey) return 0
    const diff = a[sortKey] - b[sortKey]
    return sortDir === 'asc' ? diff : -diff
  })

  const allSelected = !!filteredResults.length && filteredResults.every(p => selected.has(p.codigo))
  function toggleAll() {
    if (allSelected) setSelected(new Set())
    else setSelected(new Set(filteredResults.map(p => p.codigo)))
  }
  function toggleOne(codigo: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(codigo) ? next.delete(codigo) : next.add(codigo)
      return next
    })
  }

  function exportCSV() {
    if (!results?.length) return
    const base = selected.size > 0 ? results.filter(p => selected.has(p.codigo)) : results
    const telCols = ['telefone', 'telefone_com', 'celular', 'telefone_comercial_1', 'telefone_comercial_2', 'celular_comercial']
    const header = ['telefone_principal', ...telCols, '{{1}} nome', '{{2}} media_mensal', '{{3}} situacao', '{{4}} convenio', 'cidade', 'uf']
    const rows = base.map(p => {
      const { v1, v2, v3, v4 } = buildVars(p)
      const telMap = Object.fromEntries(p.telefones.map(t => [t.col, t.valor]))
      return [
        melhorTelefone(p.telefones),
        ...telCols.map(c => telMap[c] ?? ''),
        v1, v2, v3, v4,
        p.cidade ?? '', p.uf ?? '',
      ]
    })
    const csv = [header, ...rows]
      .map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
      .join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `disparos_${inatividade}_${producao}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function toggle(list: string[], setList: (v: string[]) => void, key: string) {
    setList(list.includes(key) ? list.filter(k => k !== key) : [...list, key])
  }

  const canSearch = inatividade.length > 0 && producao.length > 0

  return (
    <>
      <TopBar title="Disparos WhatsApp" />
      <main className="flex-1 overflow-auto p-5 space-y-5">

        {/* Filtros */}
        <div className="rounded-md border border-[var(--nova-border)] bg-[var(--nova-bg-elev)] p-5 space-y-5">
          <p className="text-sm font-semibold text-[var(--nova-text)]">Segmentação de parceiros inativos</p>

          <div>
            <p className="text-[0.625rem] font-medium uppercase tracking-widest text-[var(--nova-text-dim)] mb-2">
              Tempo sem produção
            </p>
            <div className="flex flex-wrap gap-2">
              {INATIVIDADE_OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => toggle(inatividade, setInatividade, opt.key)}
                  className={cn(
                    'px-3 py-1.5 rounded-sm text-sm border transition-nova',
                    inatividade.includes(opt.key)
                      ? 'bg-[var(--btn-blue-bg)] border-[var(--btn-blue-border)] text-[var(--btn-blue-text)]'
                      : 'border-[var(--nova-border)] text-[var(--nova-text-muted)] hover:text-[var(--nova-text)] hover:border-[var(--nova-blue)]/40',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[0.625rem] font-medium uppercase tracking-widest text-[var(--nova-text-dim)] mb-2">
              Média mensal de produção
            </p>
            <div className="flex flex-wrap gap-2">
              {PRODUCAO_OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => toggle(producao, setProducao, opt.key)}
                  className={cn(
                    'px-3 py-1.5 rounded-sm text-sm border transition-nova',
                    producao.includes(opt.key)
                      ? 'bg-[var(--btn-blue-bg)] border-[var(--btn-blue-border)] text-[var(--btn-blue-text)]'
                      : 'border-[var(--nova-border)] text-[var(--nova-text-muted)] hover:text-[var(--nova-text)] hover:border-[var(--nova-blue)]/40',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <Button variant="blue" onClick={buscar} disabled={!canSearch || loading}>
              {loading
                ? <><Loader2 size={14} className="animate-spin" /> Buscando…</>
                : <><Search size={14} /> Buscar parceiros</>
              }
            </Button>
            {!canSearch && (
              <span className="text-xs text-[var(--nova-text-dim)]">
                Selecione tempo inativo e faixa de produção para buscar
              </span>
            )}
          </div>
        </div>

        {/* Resultados */}
        {results !== null && (
          <div className="rounded-md border border-[var(--nova-border)] bg-[var(--nova-bg-elev)] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--nova-border)] flex-wrap gap-3">
              <div>
                <p className="text-sm font-semibold text-[var(--nova-text)]">
                  {results.length === 0
                    ? 'Nenhum parceiro encontrado'
                    : busca
                      ? `${sortedResults.length} de ${results.length} parceiros`
                      : `${results.length} parceiro${results.length !== 1 ? 's' : ''} encontrado${results.length !== 1 ? 's' : ''}`}
                </p>
                {results.length > 0 && (
                  <p className="text-xs text-[var(--nova-text-dim)] mt-0.5">
                    CSV exportado no formato Meta — telefone + 4 variáveis do template
                  </p>
                )}
              </div>
              {results.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--nova-text-dim)]" />
                    <input
                      type="text"
                      placeholder="Filtrar por nome, código, UF…"
                      value={busca}
                      onChange={e => setBusca(e.target.value)}
                      className="pl-8 pr-3 py-1.5 text-xs rounded-sm border border-[var(--nova-border)] bg-[var(--nova-bg-elev-2)] text-[var(--nova-text)] placeholder:text-[var(--nova-text-dim)] focus:outline-none focus:border-[var(--nova-blue)]/60 w-56"
                    />
                  </div>
                  <Button variant="primary" size="sm" onClick={exportCSV}>
                    <Download size={14} />
                    {selected.size > 0 ? `Exportar ${selected.size} selecionados` : 'Exportar CSV'}
                  </Button>
                </div>
              )}
            </div>

            {results.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[var(--nova-bg-elev-2)]">
                        <th className="pl-4 pr-2 py-2.5 w-8">
                          <input
                            type="checkbox"
                            checked={allSelected}
                            onChange={toggleAll}
                            className="accent-[var(--nova-blue)] cursor-pointer"
                            title="Selecionar todos"
                          />
                        </th>
                        {['Parceiro', 'UF', 'Convênio principal', 'Tempo inativo'].map(h => (
                          <th key={h} className="px-4 py-2.5 text-left text-[0.625rem] font-medium uppercase tracking-wider text-[var(--nova-text-dim)]">
                            {h}
                          </th>
                        ))}
                        <th
                          className="px-4 py-2.5 text-left text-[0.625rem] font-medium uppercase tracking-wider text-[var(--nova-text-dim)] cursor-pointer select-none hover:text-[var(--nova-text)] transition-nova"
                          onClick={() => toggleSort('mediaProducao')}
                        >
                          Média/mês {sortKey === 'mediaProducao' ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
                        </th>
                        <th className="px-4 py-2.5 text-left text-[0.625rem] font-medium uppercase tracking-wider text-[var(--nova-text-dim)]">
                          Preview
                        </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--nova-border)]/50">
                    {sortedResults.map(p => (
                      <tr key={p.codigo} className={cn('hover:bg-white/[0.02] transition-nova', selected.has(p.codigo) && 'bg-[var(--nova-blue)]/5')}>
                        <td className="pl-4 pr-2 py-2.5 w-8">
                          <input
                            type="checkbox"
                            checked={selected.has(p.codigo)}
                            onChange={() => toggleOne(p.codigo)}
                            className="accent-[var(--nova-blue)] cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-2.5">
                          <p className="font-medium text-[var(--nova-text)] truncate max-w-[180px]">{p.nome}</p>
                          <p className="text-[0.625rem] text-[var(--nova-text-dim)] font-mono mb-1">{p.codigo}</p>
                          {/* Telefone principal */}
                          {(() => {
                            const principal = melhorTelefone(p.telefones)
                            return principal ? (
                              <p className="text-xs font-semibold text-emerald-400 mb-1 flex items-center gap-1">
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                                {principal}
                              </p>
                            ) : (
                              <p className="text-[0.625rem] text-red-400 mb-1">Sem número válido</p>
                            )
                          })()}
                          {/* Todos os campos */}
                          {p.telefones.filter(t => t.valor).map(t => (
                            <p key={t.col} className="text-[0.625rem] flex items-center gap-1">
                              <span className={cn(
                                'inline-block w-1.5 h-1.5 rounded-full flex-shrink-0',
                                isBadNumber(t.valor) ? 'bg-red-400' : 'bg-emerald-400'
                              )} />
                              <span className="text-[var(--nova-text-dim)]/50 w-20 flex-shrink-0">
                                {TEL_LABELS[t.col] ?? t.col}
                              </span>
                              <span className={isBadNumber(t.valor) ? 'text-red-400/70' : 'text-[var(--nova-text-dim)]'}>
                                {t.valor}
                              </span>
                            </p>
                          ))}
                        </td>
                        <td className="px-4 py-2.5 text-[var(--nova-text-muted)]">{p.uf ?? '—'}</td>
                        <td className="px-4 py-2.5">
                          <Badge variant="amber">{p.convenio}</Badge>
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge variant="inativo" dot>{p.tempoLabel}</Badge>
                        </td>
                        <td className="px-4 py-2.5 text-[var(--nova-text-muted)]">
                          {fmt(p.mediaProducao)}
                        </td>
                        <td className="px-4 py-2.5">
                          <button
                            onClick={() => setPreview(p)}
                            className="flex items-center gap-1.5 text-xs text-[var(--nova-blue)] hover:underline"
                          >
                            <Eye size={13} /> Ver mensagem
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Modal preview — template Meta preenchido */}
        {preview && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => setPreview(null)}
          >
            <div
              className="w-full max-w-lg rounded-lg border border-[var(--nova-border)] bg-[var(--nova-bg-elev)] shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--nova-border)]">
                <div className="flex items-center gap-2">
                  <MessageSquare size={16} className="text-[var(--nova-blue)]" />
                  <p className="text-sm font-semibold text-[var(--nova-text)]">
                    Preview — {preview.nome}
                  </p>
                </div>
                <button onClick={() => setPreview(null)} className="text-[var(--nova-text-dim)] hover:text-[var(--nova-text)]">
                  <X size={16} />
                </button>
              </div>

              {/* Balão WhatsApp */}
              <div className="p-5">
                <div className="rounded-xl bg-[#128C7E]/10 border border-[#128C7E]/20 p-4">
                  {/* Header do chat */}
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/10">
                    <div className="w-8 h-8 rounded-full bg-[#128C7E] flex items-center justify-center text-white text-xs font-bold">N</div>
                    <div>
                      <p className="text-xs font-semibold text-[var(--nova-text)]">Nova Promotora</p>
                      <p className="text-[0.625rem] text-emerald-400">online</p>
                    </div>
                  </div>
                  {/* Balão da mensagem */}
                  <div className="flex justify-end">
                    <div className="bg-[#DCF8C6]/15 border border-[#DCF8C6]/25 rounded-lg rounded-tr-sm px-4 py-3 max-w-[90%]">
                      <p className="text-sm text-[var(--nova-text)] whitespace-pre-line leading-relaxed">
                        {renderTemplate(preview)}
                      </p>
                      <p className="text-[0.625rem] text-[var(--nova-text-dim)] text-right mt-1">✓✓</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Variáveis preenchidas */}
              <div className="px-5 pb-4 grid grid-cols-2 gap-x-4 gap-y-1.5">
                {(() => {
                  const { v1, v2, v3, v4 } = buildVars(preview)
                  return [
                    ['{​{1}} nome',     v1],
                    ['{​{2}} média',    v2],
                    ['{​{3}} situação', v3],
                    ['{​{4}} convênio', v4],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <span className="text-[0.625rem] text-[var(--nova-text-dim)] uppercase tracking-wider">{label}</span>
                      <p className="text-xs font-medium text-[var(--nova-text)]">{val}</p>
                    </div>
                  ))
                })()}
              </div>

              <div className="px-5 pb-5 flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setPreview(null)}>Fechar</Button>
                <Button
                  variant="blue"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(renderTemplate(preview))}
                >
                  Copiar mensagem
                </Button>
              </div>
            </div>
          </div>
        )}

      </main>
    </>
  )
}
