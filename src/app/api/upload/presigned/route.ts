import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { verifyToken, COOKIE } from '@/lib/auth'
import { getPresignedUploadUrl } from '@/lib/aws-s3'
import { isAllowedExtension, isAllowedContentType } from '@/lib/upload-validator'
import { generateS3Key, getFileExt, getContentType } from '@/lib/utils'
import { logger } from '@/lib/logger'
import { ErrorCodes } from '@/lib/error-codes'

const schema = z.object({
  eventId:     z.string().min(1),
  fileName:    z.string().min(1).max(255),
  fileSize:    z.number().int().positive().max(20 * 1024 * 1024), // 20 MB max
  contentType: z.string().min(1),
})

export async function POST(req: NextRequest) {
  const token = req.cookies.get(COOKIE)?.value
  if (!token) return NextResponse.json({ success: false, error: ErrorCodes.NOT_LOGGED_IN.message, code: ErrorCodes.NOT_LOGGED_IN.code }, { status: 401 })
  const payload = await verifyToken(token)
  if (!payload) return NextResponse.json({ success: false, error: ErrorCodes.INVALID_TOKEN.message, code: ErrorCodes.INVALID_TOKEN.code }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid input', code: 'PS-300' }, { status: 400 })

  const { eventId, fileName, fileSize, contentType } = parsed.data

  // Validate file extension and content type
  const ext = getFileExt(fileName)
  if (!isAllowedExtension(ext)) {
    return NextResponse.json({ success: false, error: ErrorCodes.INVALID_FILE_TYPE.message, code: ErrorCodes.INVALID_FILE_TYPE.code }, { status: 400 })
  }
  if (!isAllowedContentType(contentType)) {
    return NextResponse.json({ success: false, error: ErrorCodes.INVALID_FILE_TYPE.message, code: ErrorCodes.INVALID_FILE_TYPE.code }, { status: 400 })
  }

  // Verify organizer owns this event
  const event = await db.event.findFirst({ where: { id: eventId, organizerId: payload.userId } })
  if (!event) return NextResponse.json({ success: false, error: ErrorCodes.EVENT_NOT_FOUND.message, code: ErrorCodes.EVENT_NOT_FOUND.code }, { status: 404 })

  // Check storage quota
  const user = await db.user.findUnique({ where: { id: payload.userId }, select: { storageUsed: true, storageLimit: true } })
  if (!user) return NextResponse.json({ success: false, error: ErrorCodes.USER_NOT_FOUND.message }, { status: 404 })
  if (user.storageUsed + BigInt(fileSize) > user.storageLimit) {
    return NextResponse.json({ success: false, error: ErrorCodes.STORAGE_QUOTA_EXCEEDED.message, code: ErrorCodes.STORAGE_QUOTA_EXCEEDED.code }, { status: 402 })
  }

  const s3Key = generateS3Key(eventId, fileName)
  const uploadUrl = await getPresignedUploadUrl(s3Key, contentType, 300) // 5 min

  logger.info('UPLOAD', 'Presigned URL issued', { userId: payload.userId, eventId, s3Key })
  return NextResponse.json({ success: true, data: { uploadUrl, s3Key, fileName } })
}
