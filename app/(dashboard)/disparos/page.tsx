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
  { key: '0-50',    label: 'Até R$ 50 mil'           },
  { key: '50-150',  label: 'R$ 50 mil – R$ 150 mil'  },
  { key: '150-300', label: 'R$ 150 mil – R$ 300 mil' },
  { key: '300-500', label: 'R$ 300 mil – R$ 500 mil' },
  { key: '500-1M',  label: 'R$ 500 mil – R$ 1 milhão'},
  { key: '1M+',     label: 'Acima de R$ 1 milhão'    },
]

// Template fixo da Meta — espelha exatamente o modelo cadastrado no Gerenciador
const TEMPLATE = `Oi {{1}}!

Aqui é a Maria Eduarda, Especialista em Performance da Nova.
Analisei sua operação e vi que em {{4}} você chegou a produzir {{2}} aqui com a gente. Hoje está em {{3}}.

Teve alguma mudança na sua operação ou estratégia nesse período?`

interface Partner {
  codigo:        string
  nome:          string
  telefone:      string | null
  uf:            string | null
  totalProducao: number
  mediaProducao: number
  diasInativo:   number
  tempoLabel:    string
  convenio:      string
}

// Monta as 4 variáveis do template Meta para cada parceiro
function buildVars(p: Partner) {
  const v1 = p.nome.split(' ')[0]                          // {{1}} primeiro nome
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

export default function DisparosPage() {
  const [inatividade, setInatividade] = useState('')
  const [producao,    setProducao]    = useState('')
  const [loading,     setLoading]     = useState(false)
  const [results,     setResults]     = useState<Partner[] | null>(null)
  const [preview,     setPreview]     = useState<Partner | null>(null)

  const buscar = useCallback(async () => {
    if (!inatividade || !producao) return
    setLoading(true)
    setResults(null)
    try {
      const params = new URLSearchParams({ inatividade, producao })
      const res  = await fetch(`/api/disparos?${params}`)
      const json = await res.json()
      setResults(json.partners ?? [])
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [inatividade, producao])

  function exportCSV() {
    if (!results?.length) return
    // Formato Meta: telefone + uma coluna por variável ({{1}} a {{4}})
    const header = ['telefone', '{{1}} nome', '{{2}} media_mensal', '{{3}} situacao', '{{4}} convenio']
    const rows = results.map(p => {
      const { v1, v2, v3, v4 } = buildVars(p)
      return [
        p.telefone ?? '',
        v1,
        v2,
        v3,
        v4,
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

  const canSearch = !!inatividade && !!producao

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
                  onClick={() => setInatividade(prev => prev === opt.key ? '' : opt.key)}
                  className={cn(
                    'px-3 py-1.5 rounded-sm text-sm border transition-nova',
                    inatividade === opt.key
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
              Faixa de produção total acumulada
            </p>
            <div className="flex flex-wrap gap-2">
              {PRODUCAO_OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setProducao(prev => prev === opt.key ? '' : opt.key)}
                  className={cn(
                    'px-3 py-1.5 rounded-sm text-sm border transition-nova',
                    producao === opt.key
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
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--nova-border)]">
              <div>
                <p className="text-sm font-semibold text-[var(--nova-text)]">
                  {results.length === 0
                    ? 'Nenhum parceiro encontrado'
                    : `${results.length} parceiro${results.length !== 1 ? 's' : ''} encontrado${results.length !== 1 ? 's' : ''}`}
                </p>
                {results.length > 0 && (
                  <p className="text-xs text-[var(--nova-text-dim)] mt-0.5">
                    CSV exportado no formato Meta — telefone + 4 variáveis do template
                  </p>
                )}
              </div>
              {results.length > 0 && (
                <Button variant="primary" size="sm" onClick={exportCSV}>
                  <Download size={14} /> Exportar CSV
                </Button>
              )}
            </div>

            {results.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[var(--nova-bg-elev-2)]">
                      {['Parceiro', 'UF', 'Convênio principal', 'Tempo inativo', 'Média/mês', 'Preview'].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left text-[0.625rem] font-medium uppercase tracking-wider text-[var(--nova-text-dim)]">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--nova-border)]/50">
                    {results.map(p => (
                      <tr key={p.codigo} className="hover:bg-white/[0.02] transition-nova">
                        <td className="px-4 py-2.5">
                          <p className="font-medium text-[var(--nova-text)] truncate max-w-[180px]">{p.nome}</p>
                          <p className="text-[0.625rem] text-[var(--nova-text-dim)] font-mono">{p.codigo}</p>
                          {p.telefone && (
                            <p className="text-[0.625rem] text-[var(--nova-text-dim)]">{p.telefone}</p>
                          )}
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
