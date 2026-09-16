export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { listFolderFiles } from '@/lib/drive/client'

const FOLDER_ID = '1IboNpEPvcVhuPKW7A7fvHTBoPYAcczP0'

export async function GET() {
  try {
    const existing = await prisma.driveConfig.findFirst()
    const config = existing
      ? await prisma.driveConfig.update({ where: { id: existing.id }, data: { folderId: FOLDER_ID } })
      : await prisma.driveConfig.create({ data: { folderId: FOLDER_ID } })

    const files = await listFolderFiles(FOLDER_ID)

    return NextResponse.json({
      ok: true,
      config,
      arquivosEncontrados: files.map(f => ({
        nome: f.name,
        modificado: f.modifiedTime,
        tamanho: `${(parseInt(f.size ?? '0') / 1024 / 1024).toFixed(1)} MB`,
      })),
    })
  } catch (err) {
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 })
  }
}
