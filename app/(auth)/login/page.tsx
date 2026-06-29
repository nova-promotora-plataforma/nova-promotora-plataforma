'use client'

import { useState } from 'react'
import { Building2, Eye, EyeOff, Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AccessibilityButton } from '@/components/layout/AccessibilityButton'
import { useTheme } from '@/hooks/useTheme'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const { theme, toggle } = useTheme()
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const form = new FormData(e.currentTarget)
    const email = form.get('email') as string
    const password = form.get('password') as string

    // TODO: integrar Supabase Auth
    await new Promise(r => setTimeout(r, 1000))
    if (!email || !password) {
      setError('Preencha e-mail e senha.')
      setLoading(false)
      return
    }
    // supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--nova-bg)] px-4">
      <div className="w-full max-w-sm">

        {/* Card de login */}
        <div className="rounded-xl border border-[var(--nova-border)] bg-[var(--nova-bg-elev)] p-8 shadow-2xl">

          {/* Marca */}
          <div className="mb-8 flex flex-col items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--btn-blue-border)] bg-[var(--btn-blue-bg)]"
              aria-hidden
            >
              <Building2 size={22} className="text-[var(--btn-blue-text)]" />
            </div>
            <div className="text-center">
              <h1 className="text-lg font-bold text-[var(--nova-text)]">Nova Promotora</h1>
              <p className="text-[0.6875rem] font-medium uppercase tracking-widest text-[var(--nova-text-dim)] mt-0.5">
                Plataforma Comercial
              </p>
            </div>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <Input
              name="email"
              type="email"
              label="E-mail"
              placeholder="seu@email.com"
              autoComplete="email"
              required
            />

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-xs font-medium text-[var(--nova-text-muted)] uppercase tracking-wider">
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  className={cn(
                    'w-full rounded-sm border bg-white/[0.04] px-3 py-2 pr-10 text-sm',
                    'text-[var(--nova-text)] placeholder:text-[var(--nova-text-dim)]',
                    'border-[var(--nova-border)] outline-none transition-nova',
                    'focus:border-[var(--nova-blue)]/50 focus-visible:ring-2 focus-visible:ring-[var(--nova-blue)]/30',
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  aria-label={showPwd ? 'Ocultar senha' : 'Mostrar senha'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--nova-text-dim)] hover:text-[var(--nova-text)] transition-nova"
                >
                  {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {error && (
              <p role="alert" className="text-xs text-red-400 text-center">{error}</p>
            )}

            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={loading}
              className="mt-1"
            >
              {loading ? 'Entrando…' : 'Entrar na plataforma'}
            </Button>
          </form>

          <p className="mt-5 text-center text-xs text-[var(--nova-text-dim)]">
            Esqueceu a senha?{' '}
            <a
              href="#"
              className="text-[var(--btn-blue-text)] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--nova-blue)]"
            >
              Recuperar acesso
            </a>
          </p>

          {/* Barra de acessibilidade */}
          <div className="mt-6 border-t border-[var(--nova-border)] pt-4 flex items-center justify-center gap-2">
            <AccessibilityButton />
            <button
              onClick={toggle}
              aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-sm border border-[var(--nova-border)]',
                'text-[var(--nova-text-muted)] hover:bg-white/5 hover:text-[var(--nova-text)] transition-nova',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--nova-blue)]',
              )}
            >
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          </div>
        </div>

        <p className="mt-4 text-center text-[0.625rem] text-[var(--nova-text-dim)]">
          © {new Date().getFullYear()} Nova Promotora · Uso interno
        </p>
      </div>
    </main>
  )
}
