'use client'

import { useState } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ArrowLeft, Save, FileSpreadsheet, FileText } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'

type ChipGroup = {
  key: string
  label: string
  options: string[]
  multi?: boolean
}

const FILTER_GROUPS: ChipGroup[] = [
  { key: 'status',    label: 'Status do parceiro', options: ['Ativo', 'Inativo', 'Todos'], multi: false },
  { key: 'uf',        label: 'UF', options: ['SP', 'MG', 'RJ', 'PR', 'BA', 'RS', 'SC', 'GO', 'DF'], multi: true },
  { key: 'faixa',     label: 'Faixa de produção',  options: ['Faixa 1 (até R$5K)', 'Faixa 2 (R$5K–20K)', 'Faixa 3 (R$20K–50K)', 'Faixa 4 (R$50K+)'], multi: true },
  { key: 'inatividade', label: 'Período de inatividade', options: ['30–60 dias', '60–90 dias', '90–180 dias', '180+ dias'], multi: true },
]

export default function NovaCampanhaPage() {
  const { add: addToast } = useToast()
  const [name, setName]   = useState('')
  const [filters, setFilters] = useState<Record<string, string[]>>({
    status:      ['Inativo'],
    uf:          ['SP', 'MG'],
    faixa:       ['Faixa 2 (R$5K–20K)', 'Faixa 3 (R$20K–50K)'],
    inatividade: ['60–90 dias'],
  })

  function toggle(group: ChipGroup, option: string) {
    setFilters(prev => {
      const cur = prev[group.key] ?? []
      if (!group.multi) return { ...prev, [group.key]: [option] }
      return {
        ...prev,
        [group.key]: cur.includes(option) ? cur.filter(x => x !== option) : [...cur, option],
      }
    })
  }

  function isSelected(key: string, option: string) {
    return (filters[key] ?? []).includes(option)
  }

  // Simulação de contagem — substituir por query real
  const count = 1284

  async function handleExport(format: 'xlsx' | 'csv') {
    addToast('success', `Exportação ${format.toUpperCase()} iniciada. O arquivo será baixado em instantes.`)
    // TODO: POST /api/campanhas/exportar
  }

  async function handleSave() {
    if (!name.trim()) { addToast('error', 'Informe um nome para a campanha.'); return }
    addToast('success', 'Campanha salva como rascunho.')
    // TODO: POST /api/campanhas
  }

  return (
    <>
      <TopBar
        title="Nova campanha"
        actions={
          <Link href="/campanhas">
            <Button variant="ghost" size="sm"><ArrowLeft size={14} /> Voltar</Button>
          </Link>
        }
      />
      <main className="flex-1 overflow-auto p-5">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">

          {/* Filtros */}
          <div className="space-y-4">
            <div className="rounded-md border border-[var(--nova-border)] bg-[var(--nova-bg-elev)] p-4 space-y-5">
              {FILTER_GROUPS.map(group => (
                <div key={group.key}>
                  <p className="text-[0.625rem] font-medium uppercase tracking-widest text-[var(--nova-text-dim)] mb-2">
                    {group.label}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {group.options.map(opt => {
                      const sel = isSelected(group.key, opt)
                      return (
                        <button
                          key={opt}
                          onClick={() => toggle(group, opt)}
                          aria-pressed={sel}
                          className={cn(
                            'px-3 py-1 rounded-full text-xs border transition-nova',
                            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--nova-blue)]',
                            sel
                              ? 'bg-[var(--btn-blue-bg)] border-[var(--btn-blue-border)] text-[var(--btn-blue-text)]'
                              : 'border-[var(--nova-border)] text-[var(--nova-text-muted)] hover:border-[var(--nova-blue)]/40 hover:text-[var(--nova-text)]',
                          )}
                        >
                          {opt}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            <Input
              label="Nome da campanha"
              placeholder="Ex: Reativação Inativos SP/MG jun/26"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          {/* Pré-visualização */}
          <aside className="rounded-md border border-[var(--nova-border)] bg-[var(--nova-bg-elev)] p-4 self-start sticky top-4">
            <p className="text-[0.625rem] font-medium uppercase tracking-widest text-[var(--nova-text-dim)] text-center mb-1">
              Pré-visualização
            </p>
            <p className="text-4xl font-bold text-[var(--nova-text)] text-center py-4 leading-none">
              {new Intl.NumberFormat('pt-BR').format(count)}
            </p>
            <p className="text-xs text-[var(--nova-text-muted)] text-center mb-4">parceiros na lista</p>

            <div className="border-t border-[var(--nova-border)] pt-4 mb-4 space-y-2">
              {[['SP', 742, 58], ['MG', 542, 42]].map(([uf, n, pct]) => (
                <div key={uf}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[var(--nova-text-dim)]">{uf}</span>
                    <span className="text-[var(--nova-text)] font-medium">
                      {new Intl.NumberFormat('pt-BR').format(n as number)}
                    </span>
                  </div>
                  <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                    <div className="h-full bg-[var(--nova-blue)] rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              ))}
              <div className="flex justify-between text-xs pt-1">
                <span className="text-[var(--nova-text-dim)]">Faixa 2</span>
                <span className="text-[var(--nova-text)] font-medium">891</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[var(--nova-text-dim)]">Faixa 3</span>
                <span className="text-[var(--nova-text)] font-medium">393</span>
              </div>
            </div>

            <div className="border-t border-[var(--nova-border)] pt-4 flex flex-col gap-2">
              <Button variant="primary" fullWidth onClick={handleSave}>
                <Save size={14} /> Salvar rascunho
              </Button>
              <Button variant="blue" fullWidth onClick={() => handleExport('xlsx')}>
                <FileSpreadsheet size={14} /> Exportar XLSX
              </Button>
              <Button variant="ghost" fullWidth onClick={() => handleExport('csv')}>
                <FileText size={14} /> Exportar CSV
              </Button>
            </div>
          </aside>

        </div>
      </main>
    </>
  )
}
