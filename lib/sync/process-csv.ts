import { createGunzip } from 'zlib'
import { Transform, Readable } from 'stream'
import { prisma } from '@/lib/db/client'

interface RawRow {
  ff: string
  ade?: string
  codParceiro: string
  banco?: string
  convenio?: string
  tipoOperacao?: string
  parcela?: number
  producao: number
  dataCadastro?: Date
  dataPgtoBanco?: Date
  dataPgtoCms?: Date
  arquivoOrigem?: string
}

function parseDate(s: string): Date | undefined {
  if (!s || s === '0000-00-00') return undefined
  const d = new Date(s.trim())
  return isNaN(d.getTime()) ? undefined : d
}

function parseDecimal(s: string): number {
  if (!s) return 0
  return parseFloat(s.replace(',', '.')) || 0
}

// Divide o CSV linha a linha respeitando aspas
class LineParser extends Transform {
  private buf = ''
  private headers: string[] = []
  private idxFF = -1
  private idxADE = -1
  private idxCod = -1
  private idxBanco = -1
  private idxConvenio = -1
  private idxTipo = -1
  private idxParcela = -1
  private idxProducao = -1
  private idxCadastro = -1
  private idxPgtoBanco = -1
  private idxPgtoCms = -1
  private idxArquivo = -1
  private firstLine = true

  constructor() { super({ objectMode: true }) }

  private splitLine(line: string): string[] {
    return line.split(';').map(c => c.trim().replace(/^"|"$/g, ''))
  }

  _transform(chunk: Buffer, _enc: string, cb: () => void) {
    this.buf += chunk.toString('latin1')
    const lines = this.buf.split('\n')
    this.buf = lines.pop() ?? ''

    for (const raw of lines) {
      const line = raw.replace(/\r$/, '').replace(/^﻿/, '')
      if (!line) continue

      if (this.firstLine) {
        this.firstLine = false
        this.headers = this.splitLine(line).map(h => h.toLowerCase().trim())
        this.idxFF        = this.headers.indexOf('ff')
        this.idxADE       = this.headers.indexOf('ade')
        this.idxCod       = this.headers.indexOf('cod_parceiro')
        this.idxBanco     = this.headers.indexOf('banco')
        this.idxConvenio  = this.headers.indexOf('convenio')
        this.idxTipo      = this.headers.indexOf('tipo_operacoes')
        this.idxParcela   = this.headers.indexOf('parcela')
        this.idxProducao  = this.headers.indexOf('producao')
        this.idxCadastro  = this.headers.indexOf('data cadastro da proposta no sistema')
        this.idxPgtoBanco = this.headers.indexOf('data pgto banco')
        this.idxPgtoCms   = this.headers.indexOf('data pgto cms')
        this.idxArquivo   = this.headers.indexOf('_arquivo_origem')
        continue
      }

      const cols = this.splitLine(line)
      const ff   = this.idxFF >= 0 ? cols[this.idxFF] : ''
      if (!ff || !ff.startsWith('FF-')) continue

      const cod = this.idxCod >= 0 ? cols[this.idxCod] : ''
      if (!cod) continue

      this.push({
        ff,
        ade:           this.idxADE       >= 0 ? cols[this.idxADE]       || undefined : undefined,
        codParceiro:   cod,
        banco:         this.idxBanco     >= 0 ? cols[this.idxBanco]     || undefined : undefined,
        convenio:      this.idxConvenio  >= 0 ? cols[this.idxConvenio]  || undefined : undefined,
        tipoOperacao:  this.idxTipo      >= 0 ? cols[this.idxTipo]      || undefined : undefined,
        parcela:       this.idxParcela   >= 0 ? parseDecimal(cols[this.idxParcela])   : undefined,
        producao:      this.idxProducao  >= 0 ? parseDecimal(cols[this.idxProducao])  : 0,
        dataCadastro:  this.idxCadastro  >= 0 ? parseDate(cols[this.idxCadastro])     : undefined,
        dataPgtoBanco: this.idxPgtoBanco >= 0 ? parseDate(cols[this.idxPgtoBanco])    : undefined,
        dataPgtoCms:   this.idxPgtoCms   >= 0 ? parseDate(cols[this.idxPgtoCms])      : undefined,
        arquivoOrigem: this.idxArquivo   >= 0 ? cols[this.idxArquivo]   || undefined : undefined,
      } as RawRow)
    }
    cb()
  }

  _flush(cb: () => void) {
    if (this.buf.trim()) this._transform(Buffer.from(this.buf), '', () => {})
    cb()
  }
}

const BATCH_SIZE = 500

export interface ProcessResult {
  linhasLidas: number
  novos: number
  atualizados: number
}

export async function processStream(
  stream: NodeJS.ReadableStream,
  isGzip = false
): Promise<ProcessResult> {
  const src = isGzip ? stream.pipe(createGunzip()) : stream
  const parser = new LineParser()
  src.pipe(parser)

  let batch: RawRow[] = []
  let linhasLidas = 0
  let novos = 0
  let atualizados = 0

  async function flushBatch(rows: RawRow[]) {
    if (!rows.length) return
    // Busca quais FFs já existem
    const ffs = rows.map(r => r.ff)
    const existing = await prisma.proposal.findMany({
      where: { ff: { in: ffs } },
      select: { ff: true },
    })
    const existingSet = new Set(existing.map(e => e.ff))

    const toCreate = rows.filter(r => !existingSet.has(r.ff))
    const toUpdate = rows.filter(r =>  existingSet.has(r.ff))

    if (toCreate.length) {
      await prisma.proposal.createMany({ data: toCreate, skipDuplicates: true })
      novos += toCreate.length
    }

    for (const row of toUpdate) {
      await prisma.proposal.update({ where: { ff: row.ff }, data: row })
      atualizados++
    }
  }

  await new Promise<void>((resolve, reject) => {
    parser.on('data', async (row: RawRow) => {
      linhasLidas++
      batch.push(row)
      if (batch.length >= BATCH_SIZE) {
        parser.pause()
        const toFlush = batch
        batch = []
        try {
          await flushBatch(toFlush)
        } catch (e) {
          reject(e)
          return
        }
        parser.resume()
      }
    })
    parser.on('end', async () => {
      try {
        await flushBatch(batch)
        resolve()
      } catch (e) { reject(e) }
    })
    parser.on('error', reject)
    src.on('error', reject)
  })

  return { linhasLidas, novos, atualizados }
}

export async function processLocalFile(filePath: string): Promise<ProcessResult> {
  const { createReadStream } = await import('fs')
  const isGzip = filePath.endsWith('.gz')
  const stream = createReadStream(filePath)
  return processStream(stream, isGzip)
}
