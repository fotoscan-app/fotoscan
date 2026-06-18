import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { checkVerification, normalizeMobile } from '@/lib/whatsapp'
import { randomUUID } from 'crypto'

const schema = z.object({
  mobile: z.string().min(7).max(20),
  code:   z.string().length(6),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ eventCode: string }> }) {
  const { eventCode } = await params

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Mobile and 6-digit code required.' }, { status: 400 })

  const mobile = normalizeMobile(parsed.data.mobile)
  const { code } = parsed.data

  const approved = await checkVerification(mobile, code)
  if (!approved) return NextResponse.json({ success: false, error: 'Incorrect or expired OTP. Please try again.' }, { status: 400 })

  const verifiedToken = randomUUID()

  await db.whatsappOtp.create({
    data: {
      mobile,
      code: 'verified',
      purpose: 'guest',
      refId: eventCode.toUpperCase(),
      verifiedToken,
      used: false,
      expiresAt: new Date(Date.now() + 15 * 60_000),
    },
  })

  return NextResponse.json({ success: true, data: { verifiedToken } })
}
