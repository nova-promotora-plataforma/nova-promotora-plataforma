export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { listFolderFiles, extractFolderId } from '@/lib/drive/client'
import { runDriveSync } from '@/lib/sync/drive-sync'

// GET /api/drive/config — retorna config atual + últimas execuções
export async function GET() {
  const [config, execucoes] = await Promise.all([
    prisma.driveConfig.findFirst(),
    prisma.syncExecution.findMany({
      orderBy: { startedAt: 'desc' },
      take: 10,
    }),
  ])
  return NextResponse.json({ config, execucoes })
}

// POST /api/drive/config — salva folder ID
export async function POST(req: NextRequest) {
  const { folderUrl } = await req.json()
  const folderId = extractFolderId(folderUrl) ?? folderUrl.trim()

  if (!folderId) {
    return NextResponse.json({ error: 'Link inválido' }, { status: 400 })
  }

  const existing = await prisma.driveConfig.findFirst()
  const config = existing
    ? await prisma.driveConfig.update({ where: { id: existing.id }, data: { folderId } })
    : await prisma.driveConfig.create({ data: { folderId } })

  return NextResponse.json({ config })
}

// PUT /api/drive/config — testa conexão ou dispara sync manual
export async function PUT(req: NextRequest) {
  const { action } = await req.json()

  const config = await prisma.driveConfig.findFirst()
  if (!config?.folderId) {
    return NextResponse.json({ error: 'Pasta não configurada' }, { status: 400 })
  }

  if (action === 'test') {
    try {
      const files = await listFolderFiles(config.folderId)
      return NextResponse.json({ ok: true, files })
    } catch (err) {
      return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
    }
  }

  if (action === 'sync') {
    const result = await runDriveSync()
    return NextResponse.json(result)
  }

  return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
}
