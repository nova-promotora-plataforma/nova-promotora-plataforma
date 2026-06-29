import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(
    { error: 'Banco de dados não configurado.' },
    { status: 503 }
  )
}
