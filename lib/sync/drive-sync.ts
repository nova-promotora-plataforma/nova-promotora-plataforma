import { prisma } from '@/lib/db/client'
import { getFileMetadata, downloadFileStream } from '@/lib/drive/client'
import { processStream } from './process-csv'

const FILE_ID = '1fSM0Mj3UupYztA2Bp5Er9cS6YMG-NaFw'

export async function runDriveSync(): Promise<{
  status: 'success' | 'skipped' | 'error'
  message: string
  novos?: number
  atualizados?: number
  linhasLidas?: number
}> {
  const exec = await prisma.syncExecution.create({
    data: { status: 'RUNNING' },
  })

  try {
    const file = await getFileMetadata(FILE_ID)

    // Verifica se já foi processado e não mudou
    const config = await prisma.driveConfig.findFirst()
    if (config?.lastSyncAt && new Date(file.modifiedTime) <= config.lastSyncAt) {
      await prisma.syncExecution.update({
        where: { id: exec.id },
        data: { status: 'SKIPPED', finishedAt: new Date(), fileName: file.name, fileId: FILE_ID },
      })
      return { status: 'skipped', message: `Arquivo não foi modificado desde a última sync` }
    }

    const isGzip = file.name.endsWith('.gz')
    const stream = await downloadFileStream(FILE_ID)
    const result = await processStream(stream, isGzip)

    if (config) {
      await prisma.driveConfig.update({
        where: { id: config.id },
        data: { lastSyncAt: new Date(), lastFileId: FILE_ID },
      })
    } else {
      await prisma.driveConfig.create({
        data: { folderId: FILE_ID, lastSyncAt: new Date(), lastFileId: FILE_ID },
      })
    }

    await prisma.syncExecution.update({
      where: { id: exec.id },
      data: {
        status: 'SUCCESS',
        finishedAt: new Date(),
        fileName: file.name,
        fileId: FILE_ID,
        linhasLidas: result.linhasLidas,
        novos: result.novos,
        atualizados: result.atualizados,
      },
    })

    return {
      status: 'success',
      message: `Sync concluído: ${file.name}`,
      ...result,
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    await prisma.syncExecution.update({
      where: { id: exec.id },
      data: { status: 'ERROR', finishedAt: new Date(), erro: msg },
    })
    return { status: 'error', message: msg }
  }
}
