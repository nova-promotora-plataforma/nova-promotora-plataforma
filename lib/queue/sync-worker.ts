// @ts-nocheck
import { Worker } from 'bullmq'
import { connection } from './redis'
import { prisma } from '@/lib/db/client'
import { calcStatus, calcIsEligible } from '@/domain/partners/classification'
import { Decimal } from '@prisma/client/runtime/library'

interface SyncRow {
  codigo:            string
  nome:              string
  funcionario_cidade?: string
  uf?:               string
  cpf_responsavel?:  string
  telefone_oficial?: string
  email_oficial?:    string
  productions:       { month: string; amount: number; diffValue?: number; diffPct?: number }[]
  totalProducao:     number
}

const worker = new Worker('nova-sync', async job => {
  const rows: SyncRow[] = job.data.rows ?? []
  const BATCH_SIZE = 50

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)

    await Promise.all(batch.map(async row => {
      if (!row.codigo) {
        // Rejeita e loga registros sem código (CLAUDE.md §4.3)
        console.warn('[sync] Registro rejeitado — sem codigo:', row)
        await prisma.auditLog.create({
          data: {
            userId: 'system', entityType: 'partner', entityId: 'unknown',
            action: 'CREATE', newData: { error: 'missing_codigo', row },
          },
        })
        return
      }

      const lastProd = row.productions
        .filter(p => p.amount > 0)
        .sort((a, b) => b.month.localeCompare(a.month))[0]

      const lastProductionDate = lastProd ? new Date(lastProd.month + '-01') : null
      const status    = calcStatus(lastProductionDate)
      const isEligible = calcIsEligible(row.totalProducao)

      // Upsert parceiro (CLAUDE.md §7 — sync usa codigo como chave)
      const partner = await prisma.partner.upsert({
        where:  { codigo: row.codigo },
        create: {
          codigo: row.codigo, nome: row.nome,
          funcionarioCidade: row.funcionario_cidade, uf: row.uf,
          cpfResponsavel: row.cpf_responsavel,
          telefoneOficial: row.telefone_oficial, emailOficial: row.email_oficial,
          status, isEligible,
          totalProducao: new Decimal(row.totalProducao),
          lastProductionDate,
        },
        update: {
          nome: row.nome, funcionarioCidade: row.funcionario_cidade, uf: row.uf,
          telefoneOficial: row.telefone_oficial, emailOficial: row.email_oficial,
          status, isEligible,
          totalProducao: new Decimal(row.totalProducao),
          lastProductionDate,
        },
      })

      // Upsert produções mensais
      await Promise.all(row.productions.map(p =>
        prisma.partnerProduction.upsert({
          where:  { partnerId_referenceMonth: { partnerId: partner.id, referenceMonth: new Date(p.month + '-01') } },
          create: {
            partnerId:     partner.id,
            referenceMonth:new Date(p.month + '-01'),
            amount:        new Decimal(p.amount),
            diffPrevValue: p.diffValue != null ? new Decimal(p.diffValue) : null,
            diffPrevPct:   p.diffPct   != null ? new Decimal(p.diffPct)   : null,
            source:        'IMPORT_SHEETS',
          },
          update: {
            amount:        new Decimal(p.amount),
            diffPrevValue: p.diffValue != null ? new Decimal(p.diffValue) : null,
            diffPrevPct:   p.diffPct   != null ? new Decimal(p.diffPct)   : null,
          },
        })
      ))
    }))
  }

  console.log(`[sync] Job ${job.id} concluído — ${rows.length} registros processados`)
}, { connection, concurrency: 3 })

worker.on('failed', (job, err) => {
  console.error(`[sync] Job ${job?.id} falhou:`, err.message)
})

export { worker }
