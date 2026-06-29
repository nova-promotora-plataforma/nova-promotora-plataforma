'use client'

import { useState } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { RefreshCw, CheckCircle, AlertCircle, Clock, Database } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SyncResult {
  ok: boolean
  created?: number
  updated?: number
  errors?: string[]
  duration?: string
  error?: string
}

type SyncStatus = 'idle' | 'running' | 'success' | 'error'

export default function SyncPage() {
  const [status, setStatus] = useState<SyncStatus>('idle')
  const [result, setResult] = useState<SyncResult | null>(null)

  async function runSync() {
    setStatus('running')
    setResult(null)
    try {
      const res = await fetch('/api/sync/sheets', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_WEBHOOK_SECRET ?? ''}`,
        },
      })
      const json: SyncResult = await res.json()
      setResult(json)
      setStatus(json.ok ? 'success' : 'error')
    } catch (e) {
      setResult({ ok: false, error: 'Falha de rede ao chamar a API de sync.' })
      setStatus('error')
    }
  }

  return (
    <>
      <TopBar title="Sincronização" />
      <main className="flex-1 overflow-auto p-5 max-w-2xl">

        {/* Status card */}
        <Card className="mb-4">
          <CardHeader>
            <span className="text-sm font-semibold text-[var(--nova-text)]">
              Google Sheets → Banco de dados
            </span>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-[var(--nova-text-muted)] mb-1">
              Planilha: <span className="text-[var(--btn-blue-text)]">Base MKT + Producao Parceiro abaixo de estratégico</span>
            </p>
            <p className="text-xs text-[var(--nova-text-dim)] mb-4">
              ID: 1I54OHatANESC5KVZggvif0knKD2IuCeL · Aba: gid=1866816406
            </p>

            <div className="flex items-center gap-3 flex-wrap">
              <Button
                variant="blue"
                onClick={runSync}
                disabled={status === 'running'}
              >
                <RefreshCw size={15} className={cn(status === 'running' && 'animate-spin')} />
                {status === 'running' ? 'Sincronizando…' : 'Sincronizar agora'}
              </Button>

              {status === 'success' && (
                <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                  <CheckCircle size={14} /> Concluído em {result?.duration}
                </span>
              )}
              {status === 'error' && (
                <span className="flex items-center gap-1.5 text-xs text-red-400">
                  <AlertCircle size={14} /> Falha na sincronização
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Resultado */}
        {result && (
          <Card>
            <CardHeader>
              <span className="text-sm font-semibold text-[var(--nova-text)]">Resultado</span>
            </CardHeader>
            <CardContent>
              {result.ok ? (
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { icon: Database,     label: 'Criados',      value: result.created ?? 0, color: 'text-emerald-400' },
                      { icon: RefreshCw,    label: 'Atualizados',  value: result.updated ?? 0, color: 'text-[var(--btn-blue-text)]' },
                      { icon: AlertCircle,  label: 'Erros',        value: result.errors?.length ?? 0, color: result.errors?.length ? 'text-amber-400' : 'text-[var(--nova-text-dim)]' },
                    ].map(({ icon: Icon, label, value, color }) => (
                      <div key={label} className="rounded-sm border border-[var(--nova-border)] bg-[var(--nova-bg-elev-2)] p-3 text-center">
                        <Icon size={16} className={cn('mx-auto mb-1', color)} />
                        <p className={cn('text-xl font-bold', color)}>{value.toLocaleString('pt-BR')}</p>
                        <p className="text-[0.625rem] text-[var(--nova-text-dim)] uppercase tracking-wider mt-0.5">{label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[var(--nova-text-dim)]">
                    <Clock size={12} /> Duração: {result.duration}
                  </div>

                  {result.errors && result.errors.length > 0 && (
                    <details className="mt-1">
                      <summary className="text-xs text-amber-400 cursor-pointer">
                        {result.errors.length} linha(s) com problema
                      </summary>
                      <ul className="mt-2 space-y-1 max-h-40 overflow-auto">
                        {result.errors.map((e, i) => (
                          <li key={i} className="text-[0.6875rem] text-[var(--nova-text-dim)] font-mono">{e}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              ) : (
                <div className="flex items-start gap-2 text-sm text-red-400">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Erro ao sincronizar</p>
                    <p className="text-xs text-red-300/70 mt-0.5">{result.error}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Instruções de configuração */}
        <Card className="mt-4">
          <CardHeader>
            <span className="text-sm font-semibold text-[var(--nova-text)]">Configuração necessária</span>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2 text-xs text-[var(--nova-text-muted)] list-decimal list-inside">
              <li>Criar Service Account no Google Cloud Console</li>
              <li>Ativar a Google Sheets API no projeto</li>
              <li>Baixar o JSON de credenciais da conta de serviço</li>
              <li>
                Compartilhar a planilha com o e-mail da Service Account
                <span className="text-[var(--nova-text-dim)]"> (permissão: Leitor)</span>
              </li>
              <li>
                Preencher no <code className="text-[var(--btn-blue-text)]">.env.local</code>:
                <pre className="mt-1.5 rounded bg-[var(--nova-bg-elev-2)] p-2 text-[0.625rem] text-[var(--nova-text-dim)] overflow-auto">
{`GOOGLE_SERVICE_ACCOUNT_EMAIL=sua-conta@projeto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----"
GOOGLE_SHEETS_FILE_ID=1I54OHatANESC5KVZggvif0knKD2IuCeL`}
                </pre>
              </li>
            </ol>
          </CardContent>
        </Card>

      </main>
    </>
  )
}
