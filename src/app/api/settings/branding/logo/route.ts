import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken, COOKIE } from '@/lib/auth'
import { getPresignedUploadUrl, deleteObject, cdnUrl } from '@/lib/aws-s3'
import { logger } from '@/lib/logger'
import { ErrorCodes } from '@/lib/error-codes'

async function auth(req: NextRequest) {
  const token = req.cookies.get(COOKIE)?.value
  if (!token) return null
  return verifyToken(token)
}

// Get presigned URL to upload a logo directly to S3
export async function POST(req: NextRequest) {
  const payload = await auth(req)
  if (!payload) return NextResponse.json({ success: false, error: ErrorCodes.NOT_LOGGED_IN.message }, { status: 401 })

  const body = await req.json()
  const { contentType } = body
  if (!['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'].includes(contentType)) {
    return NextResponse.json({ success: false, error: 'Logo must be PNG, JPEG, WebP, or SVG.' }, { status: 400 })
  }

  const ext = contentType.split('/')[1].replace('jpeg', 'jpg')
  const logoKey = `logos/${payload.userId}/logo.${ext}`
  const uploadUrl = await getPresignedUploadUrl(logoKey, contentType, 300)

  // Store the key in DB immediately so it's linked on upload
  await db.user.update({ where: { id: payload.userId }, data: { logoKey } })

  logger.info('BRANDING', 'Logo upload URL issued', { userId: payload.userId, logoKey })
  return NextResponse.json({ success: true, data: { uploadUrl, logoKey, logoUrl: cdnUrl(logoKey) } })
}

// Delete logo
export async function DELETE(req: NextRequest) {
  const payload = await auth(req)
  if (!payload) return NextResponse.json({ success: false, error: ErrorCodes.NOT_LOGGED_IN.message }, { status: 401 })

  const user = await db.user.findUnique({ where: { id: payload.userId }, select: { logoKey: true } })
  if (!user?.logoKey) return NextResponse.json({ success: false, error: 'No logo to delete.' }, { status: 404 })

  await deleteObject(user.logoKey)
  await db.user.update({ where: { id: payload.userId }, data: { logoKey: null } })

  logger.info('BRANDING', 'Logo deleted', { userId: payload.userId })
  return NextResponse.json({ success: true })
}
