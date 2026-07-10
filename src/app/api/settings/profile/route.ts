import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { verifyToken, COOKIE } from '@/lib/auth'
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
    select: { name: true, email: true },
  })
  if (!user) return NextResponse.json({ success: false, error: ErrorCodes.USER_NOT_FOUND.message }, { status: 404 })

  return NextResponse.json({ success: true, data: { name: user.name, email: user.email } })
}

const updateSchema = z.object({ name: z.string().trim().min(2).max(100) })

export async function PUT(req: NextRequest) {
  const payload = await auth(req)
  if (!payload) return NextResponse.json({ success: false, error: ErrorCodes.NOT_LOGGED_IN.message }, { status: 401 })

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Name must be 2-100 characters.' }, { status: 400 })

  const user = await db.user.update({
    where: { id: payload.userId },
    data: { name: parsed.data.name },
    select: { name: true, email: true },
  })

  logger.info('SYSTEM', 'Profile name updated', { userId: payload.userId })
  return NextResponse.json({ success: true, data: { name: user.name, email: user.email } })
}
