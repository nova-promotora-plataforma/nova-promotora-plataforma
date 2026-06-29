import Link from 'next/link'
import { ArrowLeft, Phone, Mail, Megaphone, TrendingUp, TrendingDown } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ProductionChart } from '@/components/charts/ProductionChart'
import { cn } from '@/lib/utils'

// Dados estáticos de exemplo — substituir por: prisma.partner.findUnique({ where: { id } })
const PARTNER = {
  id: '1',
  codigo: 'NP-00142',
  nome: 'João Ferreira Silva',
  cidade: 'São Paulo',
  uf: 'SP',
  cpf: '123.456.789-00',
  telefone: '(11) 98765-4321',
  email: 'joao@email.com',
  status: 'INATIVO' as 'ATIVO' | 'INATIVO',
  faixa: 'Faixa 3',
  totalProducao: 124800,
  productions: [
    { month: 'jan/26', amount: 24800, diffPct:  3.2 },
    { month: 'fev/26', amount: 22800, diffPct: -8.1 },
    { month: 'mar/26', amount: 25600, diffPct: 12.3 },
    { month: 'abr/26', amount:  8200, diffPct:-68.0 },
    { month: 'mai/26', amount:     0, diffPct:   0  },
  ],
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

export default function ParceiroProfilePage({ params }: { params: { id: string } }) {
  void params.id // usado para fetch real

  const chartData = PARTNER.productions.map(p => ({ month: p.month, amount: p.amount }))

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

        {/* Cabeçalho do perfil */}
        <div className="flex flex-wrap items-center gap-4 rounded-md border border-[var(--nova-border)] bg-[var(--nova-bg-elev)] p-4">
          <div
            className="h-12 w-12 flex-shrink-0 rounded-full bg-[var(--btn-blue-bg)] border border-[var(--btn-blue-border)] flex items-center justify-center text-base font-bold text-[var(--btn-blue-text)]"
            aria-hidden
          >
            {PARTNER.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-[var(--nova-text)]">{PARTNER.nome}</p>
            <p className="text-xs text-[var(--nova-text-muted)] mt-0.5">
              {PARTNER.codigo} · {PARTNER.cidade} / {PARTNER.uf} · CPF: {PARTNER.cpf}
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant={PARTNER.status === 'ATIVO' ? 'ativo' : 'inativo'} dot>
                {PARTNER.status === 'ATIVO' ? 'Ativo' : 'Inativo'}
              </Badge>
              <Badge variant="amber">{PARTNER.faixa}</Badge>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-[0.625rem] text-[var(--nova-text-dim)] uppercase tracking-widest mb-1">Produção total</p>
            <p className="text-xl font-bold text-[var(--nova-text)]">{formatCurrency(PARTNER.totalProducao)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Dados de contato + histórico */}
          <div className="space-y-4">
            <div className="rounded-md border border-[var(--nova-border)] bg-[var(--nova-bg-elev)] p-4">
              <p className="text-[0.625rem] font-medium uppercase tracking-widest text-[var(--nova-text-dim)] mb-3">
                Dados de contato
              </p>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center gap-2 text-[var(--nova-text-muted)]">
                  <Phone size={13} aria-hidden className="flex-shrink-0" />
                  <span className="text-[var(--nova-text)]">{PARTNER.telefone}</span>
                </div>
                <div className="flex items-center gap-2 text-[var(--nova-text-muted)]">
                  <Mail size={13} aria-hidden className="flex-shrink-0" />
                  <span className="text-[var(--nova-text)]">{PARTNER.email}</span>
                </div>
              </div>
            </div>

            <div className="rounded-md border border-[var(--nova-border)] bg-[var(--nova-bg-elev)] p-4">
              <p className="text-[0.625rem] font-medium uppercase tracking-widest text-[var(--nova-text-dim)] mb-3">
                Histórico recente
              </p>
              <div className="divide-y divide-[var(--nova-border)]/50">
                {[...PARTNER.productions].reverse().map(prod => (
                  <div key={prod.month} className="flex items-center justify-between py-2 text-sm">
                    <span className="text-[var(--nova-text-muted)]">{prod.month}</span>
                    <span className="font-semibold text-[var(--nova-text)]">{formatCurrency(prod.amount)}</span>
                    {prod.diffPct !== 0 && (
                      <span
                        className={cn(
                          'flex items-center gap-0.5 text-xs',
                          prod.diffPct > 0 ? 'text-emerald-400' : 'text-red-400',
                        )}
                      >
                        {prod.diffPct > 0
                          ? <TrendingUp size={11} aria-hidden />
                          : <TrendingDown size={11} aria-hidden />
                        }
                        {prod.diffPct > 0 ? '+' : ''}{prod.diffPct.toFixed(1)}%
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Gráfico + ação */}
          <div className="flex flex-col gap-4">
            <ProductionChart data={chartData} title="Evolução de produção" />
            <Link href="/campanhas/nova">
              <Button variant="blue" fullWidth>
                <Megaphone size={15} /> Incluir em campanha
              </Button>
            </Link>
          </div>

        </div>
      </main>
    </>
  )
}
