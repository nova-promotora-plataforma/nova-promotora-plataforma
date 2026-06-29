import { NextRequest, NextResponse } from 'next/server'

// Usuários válidos — adicione aqui ou migre para Supabase futuramente
const USERS: Record<string, { password: string; name: string; role: string }> = {
  'design@novafinanceira.com': {
    password: process.env.AUTH_PASSWORD_DESIGN ?? 'Nova@2026',
    name:     'Design',
    role:     'designer',
  },
  'marketing3@novapromotora.com': {
    password: process.env.AUTH_PASSWORD_MARKETING ?? 'Nova@2026',
    name:     'Marketing',
    role:     'analyst',
  },
}

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  const user = USERS[email?.toLowerCase?.()]
  if (!user || user.password !== password) {
    return NextResponse.json({ error: 'E-mail ou senha incorretos.' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true, name: user.name, role: user.role })

  // Cookie de sessão simples — 8 horas
  res.cookies.set('nova_session', Buffer.from(JSON.stringify({ email, name: user.name, role: user.role })).toString('base64'), {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   60 * 60 * 8,
    path:     '/',
  })

  return res
}
