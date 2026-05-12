import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { verifyPassword, createToken, COOKIE, COOKIE_MAX_AGE } from '@/lib/auth'
import { logger } from '@/lib/logger'
import { ErrorCodes } from '@/lib/error-codes'
import { serializeBigInt } from '@/lib/utils'

const schema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Email and password required' }, { status: 400 })
    }
    const { email, password } = parsed.data

    const user = await db.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ success: false, error: ErrorCodes.INVALID_CREDENTIALS.message, code: ErrorCodes.INVALID_CREDENTIALS.code }, { status: 401 })
    }
    if (!user.isActive) {
      return NextResponse.json({ success: false, error: ErrorCodes.ACCOUNT_DISABLED.message, code: ErrorCodes.ACCOUNT_DISABLED.code }, { status: 403 })
    }

    const valid = await verifyPassword(password, user.passwordHash)
    if (!valid) {
      logger.warn('AUTH', 'Failed login attempt', { userId: user.id })
      return NextResponse.json({ success: false, error: ErrorCodes.INVALID_CREDENTIALS.message, code: ErrorCodes.INVALID_CREDENTIALS.code }, { status: 401 })
    }

    const token = await createToken({ userId: user.id, email: user.email })
    logger.info('AUTH', 'Organizer logged in', { userId: user.id })

    const safeUser = { id: user.id, email: user.email, name: user.name, businessName: user.businessName, logoKey: user.logoKey, plan: user.plan, storageUsed: user.storageUsed, storageLimit: user.storageLimit }
    const res = NextResponse.json({ success: true, data: { user: serializeBigInt(safeUser) } })
    res.cookies.set(COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: COOKIE_MAX_AGE, path: '/' })
    return res
  } catch (err) {
    logger.error('AUTH', 'Login failed', { errorCode: 'PS-500' })
    return NextResponse.json({ success: false, error: ErrorCodes.SERVER_ERROR.message, code: ErrorCodes.SERVER_ERROR.code }, { status: 500 })
  }
}
