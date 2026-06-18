import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { createToken, COOKIE, COOKIE_MAX_AGE } from '@/lib/auth'
import { logger } from '@/lib/logger'
import { serializeBigInt } from '@/lib/utils'
import { checkVerification } from '@/lib/whatsapp'

const schema = z.object({
  email: z.string().email(),
  code:  z.string().length(6),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Email and 6-digit OTP required.' }, { status: 400 })
    }
    const { email, code } = parsed.data

    const user = await db.user.findUnique({ where: { email } })
    if (!user || !user.mobile) {
      return NextResponse.json({ success: false, error: 'Invalid OTP.' }, { status: 400 })
    }

    const approved = await checkVerification(user.mobile, code)
    if (!approved) {
      return NextResponse.json({ success: false, error: 'Incorrect or expired OTP. Please try again.' }, { status: 400 })
    }

    const token = await createToken({ userId: user.id, email: user.email })
    logger.info('AUTH', 'Organizer logged in via WhatsApp OTP', { userId: user.id })

    const safeUser = { id: user.id, email: user.email, name: user.name, businessName: user.businessName, logoKey: user.logoKey, plan: user.plan, storageUsed: user.storageUsed, storageLimit: user.storageLimit }
    const res = NextResponse.json({ success: true, data: { user: serializeBigInt(safeUser) } })
    res.cookies.set(COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: COOKIE_MAX_AGE, path: '/' })
    return res
  } catch {
    return NextResponse.json({ success: false, error: 'Something went wrong.' }, { status: 500 })
  }
}
