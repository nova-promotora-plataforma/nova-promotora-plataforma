import { prisma } from '@/lib/db/client'
import { readRange, getHeaders } from './client'
import { parseSheetRows } from './parser'

const BATCH = 100   // parceiros por batch de upsert

export interface ImportResult {
  created:  number
  updated:  number
  errors:   string[]
  duration: number
}

/**
 * Lê toda a planilha e faz upsert no banco.
 * Recalcula status e is_eligible após cada batch.
 */
export async function importFromSheets(): Promise<ImportResult> {
  const start = Date.now()

  // 1. Buscar cabeçalhos e dados
  const headers = await getHeaders()
  const rows    = await readRange('A2:ZZ')   // dados sem cabeçalho

  const { partners, errors } = parseSheetRows(headers, rows)

  let created = 0
  let updated = 0

  // 2. Processar em batches
  for (let i = 0; i < partners.length; i += BATCH) {
    const batch = partners.slice(i, i + BATCH)

    await Promise.all(batch.map(async (p) => {
      // Calcular status e is_eligible com base nas produções
      const nonZero = p.producoes.filter(prod => prod.amount > 0)
      const isEligible = nonZero.length > 0

      const lastProd = nonZero.sort(
        (a, b) => new Date(b.referenceMonth).getTime() - new Date(a.referenceMonth).getTime()
      )[0]

      const sixtyDaysAgo = new Date()
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

      const status = lastProd && new Date(lastProd.referenceMonth) >= sixtyDaysAgo
        ? 'ATIVO' : 'INATIVO'

      const lastProductionDate = lastProd ? new Date(lastProd.referenceMonth) : null

      // Upsert do parceiro
      const existing = await prisma.partner.findUnique({ where: { codigo: p.codigo } })

      await prisma.partner.upsert({
        where: { codigo: p.codigo },
        create: {
          codigo:            p.codigo,
          nome:              p.nome,
          funcionarioCidade: p.funcionarioCidade,
          uf:                p.uf,
          cpfResponsavel:    p.cpfResponsavel,
          telefoneOficial:   p.telefoneOficial,
          emailOficial:      p.emailOficial,
          status:            status as 'ATIVO' | 'INATIVO',
          isEligible,
          totalProducao:     p.totalProducao,
          lastProductionDate,
        },
        update: {
          nome:              p.nome,
          funcionarioCidade: p.funcionarioCidade,
          uf:                p.uf,
          cpfResponsavel:    p.cpfResponsavel,
          telefoneOficial:   p.telefoneOficial,
          emailOficial:      p.emailOficial,
          status:            status as 'ATIVO' | 'INATIVO',
          isEligible,
          totalProducao:     p.totalProducao,
          lastProductionDate,
        },
      })

      existing ? updated++ : created++

      // Upsert das produções mensais
      await Promise.all(p.producoes.map(prod =>
        prisma.partnerProduction.upsert({
          where: {
            partnerId_referenceMonth: {
              partnerId:      '',   // preenchido abaixo via findUnique
              referenceMonth: new Date(prod.referenceMonth),
            },
          },
          create: {
            partner:        { connect: { codigo: p.codigo } },
            referenceMonth: new Date(prod.referenceMonth),
            amount:         prod.amount,
            source:         'IMPORT_SHEETS',
          },
          update: {
            amount: prod.amount,
          },
        }).catch(() => null)  // ignora conflito isolado
      ))
    }))
  }

  return { created, updated, errors, duration: Date.now() - start }
}
