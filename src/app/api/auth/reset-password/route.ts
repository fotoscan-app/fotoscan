import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

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

    const record = await db.passwordReset.findFirst({
      where: { email, otp, used: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    })

    if (!record) {
      return NextResponse.json({ success: false, error: 'Invalid or expired OTP. Please request a new one.' }, { status: 400 })
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
