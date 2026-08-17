'use client'

import { useState, useMemo } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { Badge } from '@/components/ui/Badge'
import { Search, Users, Phone, CheckCircle2, XCircle, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Lead {
  codigo: string
  nome: string
  telefone: string
  media: string
  inatividade: string
  convenio: string
  cidade: string
  uf: string
}

const LEADS: Lead[] = [
  { codigo: '065',   nome: 'CS Promotora',             telefone: '(48) 98856-6505', media: 'R$ 97.941/mês', inatividade: '3 meses', convenio: 'INSS',               cidade: 'Palhoça',        uf: 'SC' },
  { codigo: '9146',  nome: 'WR Cred',                  telefone: '(48) 99970-7059', media: 'R$ 72.582/mês', inatividade: '3 meses', convenio: 'FGTS',               cidade: 'São José',       uf: 'SC' },
  { codigo: '7021',  nome: 'Gisele Silverio',           telefone: '(48) 98476-7636', media: 'R$ 82.148/mês', inatividade: '3 meses', convenio: 'Demais Convênios',   cidade: 'São José',       uf: 'SC' },
  { codigo: '1645',  nome: 'Vanessa Silva',             telefone: '(48) 99155-2361', media: 'R$ 57.527/mês', inatividade: '3 meses', convenio: 'INSS',               cidade: 'São José',       uf: 'SC' },
  { codigo: '6251',  nome: 'Juliana Oliveira',          telefone: '(48) 99614-6869', media: 'R$ 82.869/mês', inatividade: '3 meses', convenio: 'INSS',               cidade: 'Florianópolis',  uf: 'SC' },
  { codigo: '5961',  nome: 'Priscila Souza',            telefone: '(48) 98868-5979', media: 'R$ 72.671/mês', inatividade: '6 meses', convenio: 'INSS',               cidade: 'São José',       uf: 'SC' },
  { codigo: '1951',  nome: 'Felipe Sartorato',          telefone: '(48) 99127-8500', media: 'R$ 76.705/mês', inatividade: '6 meses', convenio: 'INSS',               cidade: 'Florianópolis',  uf: 'SC' },
  { codigo: '2985',  nome: 'MRS Serviços',              telefone: '(48) 98453-9528', media: 'R$ 65.018/mês', inatividade: '6 meses', convenio: 'FGTS',               cidade: 'Florianópolis',  uf: 'SC' },
  { codigo: '8067',  nome: 'Andre Machado',             telefone: '(48) 99621-9148', media: 'R$ 84.451/mês', inatividade: '6 meses', convenio: 'INSS',               cidade: 'Florianópolis',  uf: 'SC' },
  { codigo: '5206',  nome: 'Impacta Consignados',       telefone: '(48) 99651-9648', media: 'R$ 86.893/mês', inatividade: '3 meses', convenio: 'INSS',               cidade: 'São José',       uf: 'SC' },
  { codigo: '1134',  nome: 'Paulo Henrique',            telefone: '(48) 99901-0091', media: 'R$ 75.143/mês', inatividade: '3 meses', convenio: 'INSS',               cidade: 'São José',       uf: 'SC' },
  { codigo: '6243',  nome: 'Mauricio Bittencourt',      telefone: '(48) 98429-6827', media: 'R$ 87.601/mês', inatividade: '6 meses', convenio: 'INSS',               cidade: 'São José',       uf: 'SC' },
  { codigo: '8325',  nome: 'ALG Cred',                  telefone: '(48) 99982-4636', media: 'R$ 59.124/mês', inatividade: '3 meses', convenio: 'FGTS',               cidade: 'São José',       uf: 'SC' },
  { codigo: '79140', nome: 'EFS Cred',                  telefone: '(48) 99112-3347', media: 'R$ 52.148/mês', inatividade: '6 meses', convenio: 'INSS',               cidade: 'Florianópolis',  uf: 'SC' },
  { codigo: '5133',  nome: 'Guilherme Aguirre',         telefone: '(48) 99907-4498', media: 'R$ 91.204/mês', inatividade: '3 meses', convenio: 'INSS',               cidade: 'São José',       uf: 'SC' },
  { codigo: '62287', nome: 'Failla Oliveira',           telefone: '(48) 99126-7744', media: 'R$ 63.471/mês', inatividade: '6 meses', convenio: 'Demais Convênios',   cidade: 'Florianópolis',  uf: 'SC' },
  { codigo: '6523',  nome: 'Duplic Promotora',          telefone: '(48) 99629-3994', media: 'R$ 78.334/mês', inatividade: '3 meses', convenio: 'INSS',               cidade: 'São José',       uf: 'SC' },
  { codigo: '0713',  nome: 'Luciana Moreira',           telefone: '(48) 99145-8827', media: 'R$ 55.982/mês', inatividade: '6 meses', convenio: 'INSS',               cidade: 'São José',       uf: 'SC' },
  { codigo: '68145', nome: 'Elen Silva',                telefone: '(48) 99643-2210', media: 'R$ 50.341/mês', inatividade: '3 meses', convenio: 'FGTS',               cidade: 'Palhoça',        uf: 'SC' },
  { codigo: '33808', nome: 'Lumen Consultoria',         telefone: '(48) 99988-1144', media: 'R$ 98.762/mês', inatividade: '6 meses', convenio: 'INSS',               cidade: 'Florianópolis',  uf: 'SC' },
  { codigo: '7519',  nome: 'Gabriel Quintino',          telefone: '(48) 98801-4423', media: 'R$ 67.215/mês', inatividade: '3 meses', convenio: 'INSS',               cidade: 'Florianópolis',  uf: 'SC' },
  { codigo: '38598', nome: 'Seven Intermediações',      telefone: '(48) 99534-7712', media: 'R$ 53.609/mês', inatividade: '6 meses', convenio: 'FGTS',               cidade: 'São José',       uf: 'SC' },
  { codigo: '24589', nome: 'Carolina Moreira',          telefone: '(48) 99271-6635', media: 'R$ 60.873/mês', inatividade: '3 meses', convenio: 'INSS',               cidade: 'Florianópolis',  uf: 'SC' },
  { codigo: '25346', nome: 'Mayara Martini',            telefone: '(48) 99384-5521', media: 'R$ 71.440/mês', inatividade: '6 meses', convenio: 'Demais Convênios',   cidade: 'São José',       uf: 'SC' },
  { codigo: '32458', nome: 'Karla Kowalski',            telefone: '(48) 99502-8893', media: 'R$ 88.127/mês', inatividade: '3 meses', convenio: 'INSS',               cidade: 'Florianópolis',  uf: 'SC' },
  { codigo: '26569', nome: 'Schmidt Intermediações',    telefone: '(48) 99617-3308', media: 'R$ 56.094/mês', inatividade: '6 meses', convenio: 'INSS',               cidade: 'Florianópolis',  uf: 'SC' },
]

const CIDADES = ['Todas', 'Florianópolis', 'São José', 'Palhoça', 'Biguaçu']

export default function ArianePage() {
  const [busca, setBusca] = useState('')
  const [cidadeFiltro, setCidadeFiltro] = useState('Todas')
  const [atendido, setAtendido] = useState<Record<string, boolean>>({})
  const [reativado, setReativado] = useState<Record<string, boolean>>({})
  const [obs, setObs] = useState<Record<string, string>>({})
  const [editObs, setEditObs] = useState<string | null>(null)

  const leads = useMemo(() => {
    const q = busca.toLowerCase()
    return LEADS.filter(l => {
      const matchBusca = !q || l.nome.toLowerCase().includes(q) || l.codigo.includes(q) || l.telefone.includes(q)
      const matchCidade = cidadeFiltro === 'Todas' || l.cidade === cidadeFiltro
      return matchBusca && matchCidade
    })
  }, [busca, cidadeFiltro])

  const totalAtendidos  = Object.values(atendido).filter(Boolean).length
  const totalReativados = Object.values(reativado).filter(Boolean).length

  return (
    <>
      <TopBar title="Grande Florianópolis — Leads Ariane" />
      <main className="flex-1 overflow-auto p-5 space-y-4">

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total de leads',  value: LEADS.length,    icon: Users,         color: 'text-[var(--nova-text)]',  bg: 'bg-[var(--nova-bg-elev-2)]' },
            { label: 'Atendidos',       value: totalAtendidos,  icon: CheckCircle2,  color: 'text-green-400',           bg: 'bg-green-500/10' },
            { label: 'Reativados',      value: totalReativados, icon: RefreshCw,     color: 'text-indigo-400',          bg: 'bg-indigo-500/10' },
          ].map(k => {
            const Icon = k.icon
            return (
              <div key={k.label} className="rounded-lg border border-[var(--nova-border)] bg-[var(--nova-bg-elev)] p-4 flex items-center gap-3">
                <div className={cn('w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0', k.bg)}>
                  <Icon size={18} className={k.color} />
                </div>
                <div>
                  <p className="text-xs text-[var(--nova-text-dim)]">{k.label}</p>
                  <p className={cn('text-2xl font-bold', k.color)}>{k.value}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--nova-text-dim)]" />
            <input
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar por nome, código ou telefone…"
              className="w-full pl-8 pr-3 py-2 text-sm rounded-md border border-[var(--nova-border)] bg-[var(--nova-bg-elev)] text-[var(--nova-text)] placeholder:text-[var(--nova-text-dim)] focus:outline-none focus:ring-1 focus:ring-[var(--nova-blue)]"
            />
          </div>
          <div className="flex gap-1">
            {CIDADES.map(c => (
              <button
                key={c}
                onClick={() => setCidadeFiltro(c)}
                className={cn(
                  'px-3 py-1.5 text-xs rounded-md border transition-nova',
                  cidadeFiltro === c
                    ? 'bg-[var(--btn-blue-bg)] border-[var(--btn-blue-border)] text-[var(--btn-blue-text)]'
                    : 'border-[var(--nova-border)] text-[var(--nova-text-muted)] hover:text-[var(--nova-text)] hover:bg-white/[0.04]',
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Tabela */}
        <div className="rounded-lg border border-[var(--nova-border)] bg-[var(--nova-bg-elev)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--nova-bg-elev-2)]">
                  {['Código', 'Nome', 'Telefone', 'Média/mês', 'Inatividade', 'Convênio', 'Cidade', 'Atendido?', 'Reativado?', 'Obs'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-[0.625rem] font-medium uppercase tracking-wider text-[var(--nova-text-dim)] whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--nova-border)]/50">
                {leads.map(l => (
                  <tr key={l.codigo} className="hover:bg-white/[0.02]">
                    <td className="px-3 py-2.5 font-mono text-xs text-[var(--nova-text-dim)]">{l.codigo}</td>
                    <td className="px-3 py-2.5 font-medium text-[var(--nova-text)] whitespace-nowrap">{l.nome}</td>
                    <td className="px-3 py-2.5 text-[var(--nova-text-muted)] whitespace-nowrap">
                      <a href={`tel:${l.telefone}`} className="hover:text-[var(--nova-blue)] flex items-center gap-1">
                        <Phone size={11} /> {l.telefone}
                      </a>
                    </td>
                    <td className="px-3 py-2.5 text-[var(--nova-text)] whitespace-nowrap">{l.media}</td>
                    <td className="px-3 py-2.5">
                      <Badge variant={l.inatividade === '3 meses' ? 'default' : 'inativo'} dot>
                        {l.inatividade}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5 text-[var(--nova-text-muted)] whitespace-nowrap">{l.convenio}</td>
                    <td className="px-3 py-2.5 text-[var(--nova-text-muted)] whitespace-nowrap">{l.cidade}</td>

                    {/* Atendido */}
                    <td className="px-3 py-2.5">
                      <button
                        onClick={() => setAtendido(p => ({ ...p, [l.codigo]: !p[l.codigo] }))}
                        className={cn(
                          'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full transition-nova',
                          atendido[l.codigo]
                            ? 'bg-green-500/15 text-green-400'
                            : 'bg-[var(--nova-bg-elev-2)] text-[var(--nova-text-dim)] hover:text-[var(--nova-text)]',
                        )}
                      >
                        {atendido[l.codigo] ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                        {atendido[l.codigo] ? 'Sim' : 'Não'}
                      </button>
                    </td>

                    {/* Reativado */}
                    <td className="px-3 py-2.5">
                      <button
                        onClick={() => setReativado(p => ({ ...p, [l.codigo]: !p[l.codigo] }))}
                        className={cn(
                          'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full transition-nova',
                          reativado[l.codigo]
                            ? 'bg-indigo-500/15 text-indigo-400'
                            : 'bg-[var(--nova-bg-elev-2)] text-[var(--nova-text-dim)] hover:text-[var(--nova-text)]',
                        )}
                      >
                        {reativado[l.codigo] ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                        {reativado[l.codigo] ? 'Sim' : 'Não'}
                      </button>
                    </td>

                    {/* Observações */}
                    <td className="px-3 py-2.5 min-w-[160px]">
                      {editObs === l.codigo ? (
                        <input
                          autoFocus
                          value={obs[l.codigo] ?? ''}
                          onChange={e => setObs(p => ({ ...p, [l.codigo]: e.target.value }))}
                          onBlur={() => setEditObs(null)}
                          onKeyDown={e => e.key === 'Enter' && setEditObs(null)}
                          className="w-full text-xs px-2 py-1 rounded border border-[var(--nova-border)] bg-[var(--nova-bg-elev-2)] text-[var(--nova-text)] focus:outline-none focus:ring-1 focus:ring-[var(--nova-blue)]"
                        />
                      ) : (
                        <button
                          onClick={() => setEditObs(l.codigo)}
                          className="text-xs text-left w-full text-[var(--nova-text-dim)] hover:text-[var(--nova-text)] truncate max-w-[160px]"
                        >
                          {obs[l.codigo] || <span className="italic opacity-50">Adicionar…</span>}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2.5 border-t border-[var(--nova-border)] text-xs text-[var(--nova-text-dim)]">
            {leads.length} de {LEADS.length} leads
          </div>
        </div>

      </main>
    </>
  )
}
