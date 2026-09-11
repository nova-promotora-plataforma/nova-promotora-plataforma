/**
 * Importação histórica do CSV de produção
 * Uso: npx ts-node scripts/import-historico.ts "caminho/do/arquivo.csv.gz"
 */
import { processLocalFile } from '../lib/sync/process-csv'

async function main() {
  const filePath = process.argv[2]
  if (!filePath) {
    console.error('Uso: npx ts-node scripts/import-historico.ts <arquivo.csv.gz>')
    process.exit(1)
  }

  console.log(`Iniciando importação: ${filePath}`)
  const start = Date.now()

  const result = await processLocalFile(filePath)

  const elapsed = ((Date.now() - start) / 1000 / 60).toFixed(1)
  console.log(`\nConcluído em ${elapsed} minutos`)
  console.log(`  Linhas lidas: ${result.linhasLidas.toLocaleString('pt-BR')}`)
  console.log(`  Novos:        ${result.novos.toLocaleString('pt-BR')}`)
  console.log(`  Atualizados:  ${result.atualizados.toLocaleString('pt-BR')}`)

  process.exit(0)
}

main().catch(err => {
  console.error('Erro:', err)
  process.exit(1)
})
