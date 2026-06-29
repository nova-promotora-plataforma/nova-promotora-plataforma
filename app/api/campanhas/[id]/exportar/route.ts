import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { error: 'Banco de dados não configurado. Configure o Supabase para usar exportação.' },
    { status: 503 }
  )
}
