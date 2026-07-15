'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Phone, Mail, Megaphone, Loader2 } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ProductionChart } from '@/components/charts/ProductionChart'

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

interface Partner {
  codigo: string
  nome: string
  funcionarioCidade: string | null
  uf: string | null
  telefoneOficial: string | null
  emailOficial: string | null
  status: 'ATIVO' | 'INATIVO'
  totalProducao: number
  lastProductionMonth: string | null
}

interface ConvenioItem {
  key: string
  label: string
  total: number
  pct: number
}

interface ProfileData {
  partner: Partner | null
  ranking: ConvenioItem[]
  monthlyData: { month: string; amount: number }[]
}

const CONVENIO_COLORS: Record<string, string> = {
  inss:               'var(--nova-blue)',
  fgts:               '#34d399',
  credito_trabalhador:'#f59e0b',
  demais:             '#a78bfa',
}

export default function ParceiroProfilePage() {
  const { id } = useParams<{ id: string }>()
  const [data, setData]       = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [partRes, convRes] = await Promise.all([
          fetch(`/api/parceiros?q=${encodeURIComponent(id)}&page=1`),
          fetch(`/api/parceiros/${id}/convenios`),
        ])
        const partJson = await partRes.json()
        const convJson = await convRes.json()

        const partner = partJson.data?.find((p: Partner) => p.codigo === id) ?? null

        setData({ partner, ranking: convJson.ranking ?? [], monthlyData: convJson.monthlyData ?? [] })
      } catch {
        setData({ partner: null, ranking: [], monthlyData: [] })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const initials = (nome: string) =>
    nome.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()

  const p = data?.partner

  return (
    <>
      <TopBar
        title="Perfil do Parceiro"
        actions={
          <Link href="/parceiros">
            <Button variant="ghost" size="sm">
              <ArrowLeft size={14} /> Voltar
            </Button>
          </Link>
        }
      />
      <main className="flex-1 overflow-auto p-5 space-y-4">

        {loading ? (
          <div className="flex items-center justify-center h-40 text-[var(--nova-text-dim)]">
            <Loader2 size={20} className="animate-spin mr-2" /> Carregando…
          </div>
        ) : !p ? (
          <div className="text-center text-[var(--nova-text-dim)] py-16">Parceiro não encontrado.</div>
        ) : (
          <>
            {/* Cabeçalho */}
            <div className="flex flex-wrap items-center gap-4 rounded-md border border-[var(--nova-border)] bg-[var(--nova-bg-elev)] p-4">
              <div
                className="h-12 w-12 flex-shrink-0 rounded-full bg-[var(--btn-blue-bg)] border border-[var(--btn-blue-border)] flex items-center justify-center text-base font-bold text-[var(--btn-blue-text)]"
                aria-hidden
              >
                {initials(p.nome)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-[var(--nova-text)]">{p.nome}</p>
                <p className="text-xs text-[var(--nova-text-muted)] mt-0.5">
                  {p.codigo}
                  {p.funcionarioCidade && ` · ${p.funcionarioCidade}`}
                  {p.uf && ` / ${p.uf}`}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant={p.status === 'ATIVO' ? 'ativo' : 'inativo'} dot>
                    {p.status === 'ATIVO' ? 'Ativo' : 'Inativo'}
                  </Badge>
                  {p.lastProductionMonth && (
                    <span className="text-xs text-[var(--nova-text-dim)]">
                      Último prod.: {p.lastProductionMonth}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-[0.625rem] text-[var(--nova-text-dim)] uppercase tracking-widest mb-1">Produção total</p>
                <p className="text-xl font-bold text-[var(--nova-text)]">{fmt(p.totalProducao)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

              {/* Coluna esquerda: contato + ranking convênios */}
              <div className="space-y-4">

                {/* Contato */}
                {(p.telefoneOficial || p.emailOficial) && (
                  <div className="rounded-md border border-[var(--nova-border)] bg-[var(--nova-bg-elev)] p-4">
                    <p className="text-[0.625rem] font-medium uppercase tracking-widest text-[var(--nova-text-dim)] mb-3">
                      Dados de contato
                    </p>
                    <div className="flex flex-col gap-2 text-sm">
                      {p.telefoneOficial && (
                        <div className="flex items-center gap-2">
                          <Phone size={13} aria-hidden className="flex-shrink-0 text-[var(--nova-text-dim)]" />
                          <span className="text-[var(--nova-text)]">{p.telefoneOficial}</span>
                        </div>
                      )}
                      {p.emailOficial && (
                        <div className="flex items-center gap-2">
                          <Mail size={13} aria-hidden className="flex-shrink-0 text-[var(--nova-text-dim)]" />
                          <span className="text-[var(--nova-text)] break-all">{p.emailOficial}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Ranking de convênios */}
                <div className="rounded-md border border-[var(--nova-border)] bg-[var(--nova-bg-elev)] p-4">
                  <p className="text-[0.625rem] font-medium uppercase tracking-widest text-[var(--nova-text-dim)] mb-3">
                    Produção por convênio
                  </p>
                  {data!.ranking.length === 0 ? (
                    <p className="text-sm text-[var(--nova-text-dim)]">Sem dados de convênio.</p>
                  ) : (
                    <div className="space-y-3">
                      {data!.ranking.map((c, i) => (
                        <div key={c.key}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[0.625rem] font-bold text-[var(--nova-text-dim)] w-4">{i + 1}º</span>
                              <span className="text-sm font-medium text-[var(--nova-text)]">{c.label}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-semibold text-[var(--nova-text)]">{fmt(c.total)}</span>
                              <span className="ml-2 text-xs text-[var(--nova-text-dim)]">{c.pct}%</span>
                            </div>
                          </div>
                          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${c.pct}%`,
                                backgroundColor: CONVENIO_COLORS[c.key] ?? 'var(--nova-blue)',
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Coluna direita: gráfico + ação */}
              <div className="flex flex-col gap-4">
                {data!.monthlyData.length > 0 && (
                  <ProductionChart data={data!.monthlyData} title="Produção mensal (últimos 12 meses)" />
                )}
                <Link href="/campanhas/nova">
                  <Button variant="blue" fullWidth>
                    <Megaphone size={15} /> Incluir em campanha
                  </Button>
                </Link>
              </div>

            </div>
          </>
        )}

      </main>
    </>
  )
}
