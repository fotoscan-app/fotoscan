import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { hashPassword, createToken, COOKIE, COOKIE_MAX_AGE } from '@/lib/auth'
import { logger } from '@/lib/logger'
import { ErrorCodes } from '@/lib/error-codes'
import { serializeBigInt } from '@/lib/utils'

const schema = z.object({
  name:     z.string().min(2).max(100),
  email:    z.string().email(),
  password: z.string().min(8).max(100),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }
    const { name, email, password } = parsed.data

    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ success: false, error: 'Email already registered' }, { status: 409 })
    }

    const passwordHash = await hashPassword(password)
    const user = await db.user.create({
      data: { name, email, passwordHash },
      select: { id: true, email: true, name: true, businessName: true, plan: true, storageUsed: true, storageLimit: true },
    })

    const token = await createToken({ userId: user.id, email: user.email })
    logger.info('AUTH', 'New organizer registered', { userId: user.id })

    const res = NextResponse.json({ success: true, data: { user: serializeBigInt(user) } }, { status: 201 })
    res.cookies.set(COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: COOKIE_MAX_AGE, path: '/' })
    return res
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[REGISTER ERROR]', message)
    logger.error('AUTH', 'Register failed', { errorCode: 'PS-500' })
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
