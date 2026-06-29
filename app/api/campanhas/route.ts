import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ data: [] })
}

export async function POST() {
  return NextResponse.json(
    { error: 'Banco de dados não configurado. Configure o Supabase para usar campanhas.' },
    { status: 503 }
  )
}
