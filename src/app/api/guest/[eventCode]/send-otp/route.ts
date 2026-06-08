import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { sendWhatsAppOtp, generateOtp, normalizeMobile } from '@/lib/whatsapp'

const schema = z.object({ mobile: z.string().min(7).max(20) })

export async function POST(req: NextRequest, { params }: { params: Promise<{ eventCode: string }> }) {
  try {
    const { eventCode } = await params

    const event = await db.event.findFirst({
      where: { eventCode: eventCode.toUpperCase(), status: 'active' },
      select: { id: true },
    })
    if (!event) return NextResponse.json({ success: false, error: 'Event not found.' }, { status: 404 })

    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ success: false, error: 'Valid mobile number required.' }, { status: 400 })

    const mobile = normalizeMobile(parsed.data.mobile)

    // Rate limit: one OTP per 60 seconds per mobile+event
    const recent = await db.whatsappOtp.findFirst({
      where: {
        mobile,
        purpose: 'guest',
        refId: eventCode.toUpperCase(),
        createdAt: { gte: new Date(Date.now() - 60_000) },
      },
    })
    if (recent) {
      return NextResponse.json({ success: false, error: 'Please wait 60 seconds before requesting another OTP.' }, { status: 429 })
    }

    // Invalidate previous unused OTPs for this mobile+event
    await db.whatsappOtp.updateMany({
      where: { mobile, purpose: 'guest', refId: eventCode.toUpperCase(), used: false },
      data: { used: true },
    })

    const code = generateOtp()
    const expiresAt = new Date(Date.now() + 10 * 60_000)

    await db.whatsappOtp.create({
      data: { mobile, code, purpose: 'guest', refId: eventCode.toUpperCase(), expiresAt },
    })

    await sendWhatsAppOtp(mobile, code)

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const twilioErr = err as { code?: number; message?: string; status?: number }
    console.error('[SEND-OTP]', twilioErr?.code, twilioErr?.message)

    // Twilio sandbox: recipient hasn't joined the sandbox
    if (twilioErr?.code === 63016 || twilioErr?.message?.includes('not opted in')) {
      return NextResponse.json({
        success: false,
        error: 'This number has not joined the WhatsApp sandbox. Please send "join twilio-trial" to +17372583478 on WhatsApp first.',
      }, { status: 400 })
    }

    // Twilio: invalid number
    if (twilioErr?.code === 21211 || twilioErr?.code === 21614) {
      return NextResponse.json({ success: false, error: 'Invalid mobile number. Please check and try again.' }, { status: 400 })
    }

    return NextResponse.json({ success: false, error: 'Could not send OTP. Please try again.' }, { status: 500 })
  }
}
