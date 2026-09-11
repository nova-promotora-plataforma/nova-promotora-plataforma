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

  const config = await prisma.driveConfig.upsert({
    where: { id: (await prisma.driveConfig.findFirst())?.id ?? '' },
    create: { folderId },
    update: { folderId },
  })

  return NextResponse.json({ config })
}

// POST /api/drive/test — testa conexão e lista arquivos da pasta
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
    const result = await runDriveSync(config.folderId)
    return NextResponse.json(result)
  }

  return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
}
