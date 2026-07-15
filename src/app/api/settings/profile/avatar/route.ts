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

// Get presigned URL to upload a profile photo directly to S3
export async function POST(req: NextRequest) {
  const payload = await auth(req)
  if (!payload) return NextResponse.json({ success: false, error: ErrorCodes.NOT_LOGGED_IN.message }, { status: 401 })

  const body = await req.json()
  const { contentType } = body
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(contentType)) {
    return NextResponse.json({ success: false, error: 'Photo must be PNG, JPEG, or WebP.' }, { status: 400 })
  }

  const ext = contentType.split('/')[1].replace('jpeg', 'jpg')
  const avatarKey = `avatars/${payload.userId}/avatar.${ext}`
  const uploadUrl = await getPresignedUploadUrl(avatarKey, contentType, 300)

  // Store the key in DB immediately so it's linked on upload
  await db.user.update({ where: { id: payload.userId }, data: { avatarKey } })

  logger.info('SYSTEM', 'Avatar upload URL issued', { userId: payload.userId, avatarKey })
  return NextResponse.json({ success: true, data: { uploadUrl, avatarKey, avatarUrl: cdnUrl(avatarKey) } })
}

// Delete profile photo
export async function DELETE(req: NextRequest) {
  const payload = await auth(req)
  if (!payload) return NextResponse.json({ success: false, error: ErrorCodes.NOT_LOGGED_IN.message }, { status: 401 })

  const user = await db.user.findUnique({ where: { id: payload.userId }, select: { avatarKey: true } })
  if (!user?.avatarKey) return NextResponse.json({ success: false, error: 'No photo to delete.' }, { status: 404 })

  await deleteObject(user.avatarKey)
  await db.user.update({ where: { id: payload.userId }, data: { avatarKey: null } })

  logger.info('SYSTEM', 'Avatar deleted', { userId: payload.userId })
  return NextResponse.json({ success: true })
}
