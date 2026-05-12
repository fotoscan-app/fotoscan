import {
  S3Client, PutObjectCommand, GetObjectCommand,
  DeleteObjectCommand, GetObjectCommandInput,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const BUCKET = process.env.AWS_S3_BUCKET!
const CDN   = process.env.AWS_CLOUDFRONT_URL!

export async function getPresignedUploadUrl(
  key: string, contentType: string, expiresIn = 300
): Promise<string> {
  const cmd = new PutObjectCommand({
    Bucket: BUCKET, Key: key, ContentType: contentType,
  })
  return getSignedUrl(s3, cmd, { expiresIn })
}

export async function getPresignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
  const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: key })
  return getSignedUrl(s3, cmd, { expiresIn })
}

export async function uploadBuffer(key: string, buffer: Buffer, contentType: string): Promise<void> {
  await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: buffer, ContentType: contentType }))
}

export async function getObjectBuffer(key: string): Promise<Buffer> {
  const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }))
  const bytes = await res.Body!.transformToByteArray()
  return Buffer.from(bytes)
}

export async function deleteObject(key: string): Promise<void> {
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
  } catch { /* ignore if already deleted */ }
}

export function cdnUrl(key: string): string {
  return `${CDN}/${key}`
}

export { BUCKET }
