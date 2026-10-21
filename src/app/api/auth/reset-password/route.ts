import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

const MAX_ATTEMPTS = 5

const schema = z.object({
  email:    z.string().email(),
  otp:      z.string().length(6),
  password: z.string().min(8).max(100),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 })

    const { email, otp, password } = parsed.data

    // Look up the latest live code for this email (not by code), so wrong guesses
    // can be counted — otherwise the 6-digit code could be brute-forced.
    const record = await db.passwordReset.findFirst({
      where: { email, used: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    })

    if (!record) {
      return NextResponse.json({ success: false, error: 'Invalid or expired OTP. Please request a new one.' }, { status: 400 })
    }

    if (record.otp !== otp) {
      const attempts = record.attempts + 1
      await db.passwordReset.update({ where: { id: record.id }, data: { attempts, used: attempts >= MAX_ATTEMPTS } })
      return NextResponse.json({
        success: false,
        error: attempts >= MAX_ATTEMPTS
          ? 'Too many wrong attempts. Please request a new OTP.'
          : 'Incorrect OTP. Please try again.',
      }, { status: 400 })
    }

    const passwordHash = await hashPassword(password)

    await db.$transaction([
      db.user.update({ where: { email }, data: { passwordHash } }),
      db.passwordReset.update({ where: { id: record.id }, data: { used: true } }),
    ])

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[RESET PASSWORD]', err)
    return NextResponse.json({ success: false, error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
