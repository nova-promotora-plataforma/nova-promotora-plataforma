import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const fileId = req.nextUrl.searchParams.get('fileId')
  const apiKey = process.env.GOOGLE_API_KEY

  if (!fileId) return NextResponse.json({ error: 'fileId required' }, { status: 400 })
  if (!apiKey)  return NextResponse.json({ error: 'GOOGLE_API_KEY not configured' }, { status: 500 })

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?fields=modifiedTime&key=${apiKey}`,
    { cache: 'no-store' }
  )

  if (!res.ok) {
    const body = await res.text()
    console.error('Drive API error', res.status, body)
    return NextResponse.json({ error: 'Drive API error', status: res.status, body }, { status: res.status })
  }

  const { modifiedTime } = await res.json()
  return NextResponse.json({ modifiedTime })
}
