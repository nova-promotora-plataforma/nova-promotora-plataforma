import { google } from 'googleapis'

function getAuth() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON não definido')
  const creds = JSON.parse(raw)
  return new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  })
}

export function getDrive() {
  return google.drive({ version: 'v3', auth: getAuth() })
}

export interface DriveFile {
  id: string
  name: string
  modifiedTime: string
  size: string
}

export async function listFolderFiles(folderId: string): Promise<DriveFile[]> {
  const drive = getDrive()
  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: 'files(id, name, modifiedTime, size)',
    orderBy: 'modifiedTime desc',
    pageSize: 100,
  })
  return (res.data.files ?? []) as DriveFile[]
}

export async function downloadFileStream(fileId: string): Promise<NodeJS.ReadableStream> {
  const drive = getDrive()
  const res = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'stream' }
  )
  return res.data as unknown as NodeJS.ReadableStream
}

export function extractFolderId(url: string): string | null {
  const m = url.match(/\/folders\/([a-zA-Z0-9_-]+)/)
  return m?.[1] ?? null
}
