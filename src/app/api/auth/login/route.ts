import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import {
  verifyPassword, createToken, COOKIE, COOKIE_MAX_AGE,
  verifyTrustedDeviceToken, createTrustedDeviceToken, TRUSTED_DEVICE_COOKIE, TRUSTED_DEVICE_MAX_AGE,
} from '@/lib/auth'
import { logger } from '@/lib/logger'
import { ErrorCodes } from '@/lib/error-codes'
import { serializeBigInt } from '@/lib/utils'
import { sendVerification } from '@/lib/whatsapp'

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

    // Direct login: issues the auth cookie and, on a trusted device, slides the trust window
    async function directLogin(user: NonNullable<Awaited<ReturnType<typeof db.user.findUnique>>>, reason: string, slideTrust: boolean) {
      const token = await createToken({ userId: user.id, email: user.email })
      logger.info('AUTH', reason, { userId: user.id })
      const safeUser = { id: user.id, email: user.email, name: user.name, businessName: user.businessName, logoKey: user.logoKey, plan: user.plan, storageUsed: user.storageUsed, storageLimit: user.storageLimit }
      const res = NextResponse.json({ success: true, data: { otpSent: false, user: serializeBigInt(safeUser) } })
      res.cookies.set(COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: COOKIE_MAX_AGE, path: '/' })
      if (slideTrust) {
        res.cookies.set(TRUSTED_DEVICE_COOKIE, await createTrustedDeviceToken(user.id), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: TRUSTED_DEVICE_MAX_AGE, path: '/' })
      }
      return res
    }

    // Trusted device (verified OTP here within the last 30 days) — skip OTP
    const trustedCookie = req.cookies.get(TRUSTED_DEVICE_COOKIE)?.value
    const isTrustedDevice = trustedCookie ? await verifyTrustedDeviceToken(trustedCookie, user.id) : false

    // If user has a WhatsApp mobile and this isn't a trusted device — send OTP instead of logging in directly
    if (user.mobile && !isTrustedDevice) {
      try {
        await sendVerification(user.mobile)
        logger.info('AUTH', 'Login OTP sent', { userId: user.id })
        const maskedMobile = user.mobile.slice(0, -4).replace(/\d/g, '*') + user.mobile.slice(-4)
        return NextResponse.json({ success: true, data: { otpSent: true, maskedMobile } })
      } catch (twilioErr: unknown) {
        const e = twilioErr as { code?: number; message?: string }
        logger.error('AUTH', 'WhatsApp OTP send failed', { userId: user.id, code: e?.code, msg: e?.message })
        // Fall back to direct login so user isn't locked out
        return directLogin(user, 'Organizer logged in (OTP send failed — fell back to direct login)', false)
      }
    }

    if (isTrustedDevice) {
      return directLogin(user, 'Organizer logged in (trusted device — OTP skipped)', true)
    }

    // No mobile set — log in directly
    return directLogin(user, 'Organizer logged in (no OTP — mobile not set)', false)
  } catch (err) {
    logger.error('AUTH', 'Login failed', { errorCode: 'PS-500' })
    return NextResponse.json({ success: false, error: ErrorCodes.SERVER_ERROR.message, code: ErrorCodes.SERVER_ERROR.code }, { status: 500 })
  }
}
