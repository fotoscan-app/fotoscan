import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { verifyToken, COOKIE } from '@/lib/auth'
import { cdnUrl } from '@/lib/aws-s3'
import { logger } from '@/lib/logger'
import { ErrorCodes } from '@/lib/error-codes'

async function auth(req: NextRequest) {
  const token = req.cookies.get(COOKIE)?.value
  if (!token) return null
  return verifyToken(token)
}

export async function GET(req: NextRequest) {
  const payload = await auth(req)
  if (!payload) return NextResponse.json({ success: false, error: ErrorCodes.NOT_LOGGED_IN.message }, { status: 401 })

  const user = await db.user.findUnique({
    where: { id: payload.userId },
    select: { name: true, businessName: true, logoKey: true },
  })
  if (!user) return NextResponse.json({ success: false, error: ErrorCodes.USER_NOT_FOUND.message }, { status: 404 })

  return NextResponse.json({
    success: true,
    data: {
      businessName: user.businessName || user.name,
      logoUrl: user.logoKey ? cdnUrl(user.logoKey) : null,
    },
  })
}

const updateSchema = z.object({
  businessName: z.string().min(1).max(100).optional(),
})

export async function PUT(req: NextRequest) {
  const payload = await auth(req)
  if (!payload) return NextResponse.json({ success: false, error: ErrorCodes.NOT_LOGGED_IN.message }, { status: 401 })

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 })

  const user = await db.user.update({
    where: { id: payload.userId },
    data: { businessName: parsed.data.businessName?.trim() },
    select: { name: true, businessName: true, logoKey: true },
  })

  logger.info('BRANDING', 'Branding updated', { userId: payload.userId })
  return NextResponse.json({
    success: true,
    data: {
      businessName: user.businessName || user.name,
      logoUrl: user.logoKey ? cdnUrl(user.logoKey) : null,
    },
  })
}
