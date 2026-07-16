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
  { key: '3m', label: '3 meses'         },
  { key: '6m', label: '6 meses'         },
  { key: '1a', label: '1 ano'           },
  { key: '2a', label: '2 anos'          },
  { key: '3a', label: '3 anos ou mais'  },
]

const PRODUCAO_OPTIONS = [
  { key: '0-50',    label: 'Até R$ 50 mil'          },
  { key: '50-150',  label: 'R$ 50 mil – R$ 150 mil'  },
  { key: '150-300', label: 'R$ 150 mil – R$ 300 mil' },
  { key: '300-500', label: 'R$ 300 mil – R$ 500 mil' },
  { key: '500-1M',  label: 'R$ 500 mil – R$ 1 milhão'},
  { key: '1M+',     label: 'Acima de R$ 1 milhão'   },
]

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
  mensagem:      string
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
    const header = ['Código', 'Nome', 'Telefone', 'UF', 'Convênio', 'Tempo inativo', 'Total produção', 'Média/mês', 'Mensagem']
    const rows = results.map(p => [
      p.codigo,
      p.nome,
      p.telefone ?? '',
      p.uf ?? '',
      p.convenio,
      p.tempoLabel,
      p.totalProducao,
      p.mediaProducao,
      `"${p.mensagem.replace(/"/g, '""').replace(/\n/g, ' ')}"`,
    ])
    const csv = [header, ...rows].map(r => r.join(';')).join('\n')
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

          {/* Filtro 1: Tempo inativo */}
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

          {/* Filtro 2: Faixa de produção */}
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
            <Button
              variant="blue"
              onClick={buscar}
              disabled={!canSearch || loading}
            >
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
                    : `${results.length} parceiro${results.length > 1 ? 's' : ''} encontrado${results.length > 1 ? 's' : ''}`}
                </p>
                {results.length > 0 && (
                  <p className="text-xs text-[var(--nova-text-dim)] mt-0.5">
                    Clique em <Eye size={10} className="inline" /> para ver a mensagem personalizada
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
                      {['Parceiro', 'UF', 'Convênio principal', 'Tempo inativo', 'Total', 'Média/mês', 'Mensagem'].map(h => (
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
                        <td className="px-4 py-2.5 font-semibold text-[var(--nova-text)]">
                          {fmt(p.totalProducao)}
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

        {/* Modal de preview de mensagem */}
        {preview && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => setPreview(null)}
          >
            <div
              className="w-full max-w-lg rounded-lg border border-[var(--nova-border)] bg-[var(--nova-bg-elev)] shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--nova-border)]">
                <div className="flex items-center gap-2">
                  <MessageSquare size={16} className="text-[var(--nova-blue)]" />
                  <p className="text-sm font-semibold text-[var(--nova-text)]">
                    Mensagem — {preview.nome}
                  </p>
                </div>
                <button
                  onClick={() => setPreview(null)}
                  className="text-[var(--nova-text-dim)] hover:text-[var(--nova-text)] transition-nova"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Balão de WhatsApp */}
              <div className="p-5">
                <div className="rounded-lg bg-[#075E54]/20 border border-[#075E54]/30 p-4">
                  <div className="inline-block bg-[#DCF8C6]/10 border border-[#DCF8C6]/20 rounded-lg px-4 py-3 max-w-full">
                    <p className="text-sm text-[var(--nova-text)] whitespace-pre-line leading-relaxed">
                      {preview.mensagem}
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-5 pb-4 flex flex-wrap gap-2 text-xs text-[var(--nova-text-dim)]">
                <span>Convênio: <strong className="text-[var(--nova-text)]">{preview.convenio}</strong></span>
                <span>·</span>
                <span>Inativo há: <strong className="text-[var(--nova-text)]">{preview.tempoLabel}</strong></span>
                <span>·</span>
                <span>Total: <strong className="text-[var(--nova-text)]">{fmt(preview.totalProducao)}</strong></span>
                <span>·</span>
                <span>Média: <strong className="text-[var(--nova-text)]">{fmt(preview.mediaProducao)}/mês</strong></span>
              </div>

              <div className="px-5 pb-5 flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setPreview(null)}>Fechar</Button>
                <Button
                  variant="blue"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(preview.mensagem)
                  }}
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
