import { prisma } from '@/lib/db/client'
import { listFolderFiles, downloadFileStream } from '@/lib/drive/client'
import { processStream } from './process-csv'

const CSV_PATTERN = /\.(csv|csv\.gz)$/i

export async function runDriveSync(folderId: string): Promise<{
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
    const files = await listFolderFiles(folderId)
    const csvFiles = files.filter(f => CSV_PATTERN.test(f.name))

    if (!csvFiles.length) {
      await prisma.syncExecution.update({
        where: { id: exec.id },
        data: { status: 'SKIPPED', finishedAt: new Date(), erro: 'Nenhum CSV encontrado na pasta' },
      })
      return { status: 'skipped', message: 'Nenhum CSV encontrado na pasta' }
    }

    // Pega o mais recente
    const latest = csvFiles[0]

    // Verifica se já foi processado
    const config = await prisma.driveConfig.findFirst()
    if (config?.lastFileId === latest.id) {
      const modifiedSince = config.lastSyncAt && new Date(latest.modifiedTime) <= config.lastSyncAt
      if (modifiedSince) {
        await prisma.syncExecution.update({
          where: { id: exec.id },
          data: { status: 'SKIPPED', finishedAt: new Date(), fileName: latest.name, fileId: latest.id },
        })
        return { status: 'skipped', message: `Arquivo ${latest.name} não foi modificado desde a última sync` }
      }
    }

    const isGzip = latest.name.endsWith('.gz')
    const stream = await downloadFileStream(latest.id)
    const result = await processStream(stream, isGzip)

    // Atualiza config
    await prisma.driveConfig.upsert({
      where: { id: config?.id ?? '' },
      create: { folderId, lastSyncAt: new Date(), lastFileId: latest.id },
      update: { lastSyncAt: new Date(), lastFileId: latest.id },
    })

    await prisma.syncExecution.update({
      where: { id: exec.id },
      data: {
        status: 'SUCCESS',
        finishedAt: new Date(),
        fileName: latest.name,
        fileId: latest.id,
        linhasLidas: result.linhasLidas,
        novos: result.novos,
        atualizados: result.atualizados,
      },
    })

    return {
      status: 'success',
      message: `Sync concluído: ${latest.name}`,
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
