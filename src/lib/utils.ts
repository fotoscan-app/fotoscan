import { randomBytes } from 'crypto'
import { v4 as uuidv4 } from 'uuid'

export function generateEventCode(): string {
  return randomBytes(4).toString('hex').toUpperCase()
}

export function generateS3Key(prefix: string, ext: string): string {
  return `${prefix}/${uuidv4()}.${ext}`
}

export function formatBytes(bytes: number | bigint): string {
  const b = typeof bytes === 'bigint' ? Number(bytes) : bytes
  if (b === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(b) / Math.log(k))
  return parseFloat((b / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

export function getFileExt(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || 'jpg'
}

export function getContentType(ext: string): string {
  const types: Record<string, string> = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg',
    png: 'image/png', webp: 'image/webp',
    heic: 'image/heic', heif: 'image/heif',
  }
  return types[ext] || 'image/jpeg'
}

export function serializeBigInt<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj, (_, v) =>
    typeof v === 'bigint' ? Number(v) : v
  ))
}
