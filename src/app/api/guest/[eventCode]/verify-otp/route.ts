import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { normalizeMobile } from '@/lib/whatsapp'
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

  const otp = await db.whatsappOtp.findFirst({
    where: {
      mobile,
      purpose: 'guest',
      refId: eventCode.toUpperCase(),
      used: false,
      expiresAt: { gte: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!otp) return NextResponse.json({ success: false, error: 'OTP expired or not found. Please request a new one.' }, { status: 400 })
  if (otp.code !== code) return NextResponse.json({ success: false, error: 'Incorrect OTP. Please try again.' }, { status: 400 })

  const verifiedToken = randomUUID()

  await db.whatsappOtp.update({
    where: { id: otp.id },
    data: {
      used: true,
      verifiedToken,
      expiresAt: new Date(Date.now() + 15 * 60_000), // 15 min to complete selfie upload
    },
  })

  return NextResponse.json({ success: true, data: { verifiedToken } })
}
