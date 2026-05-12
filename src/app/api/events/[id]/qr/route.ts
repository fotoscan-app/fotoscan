import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'
import { db } from '@/lib/db'
import { verifyToken, COOKIE } from '@/lib/auth'
import { ErrorCodes } from '@/lib/error-codes'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = req.cookies.get(COOKIE)?.value
  if (!token) return NextResponse.json({ success: false, error: ErrorCodes.NOT_LOGGED_IN.message }, { status: 401 })
  const payload = await verifyToken(token)
  if (!payload) return NextResponse.json({ success: false, error: ErrorCodes.INVALID_TOKEN.message }, { status: 401 })
  const { id } = await params

  const event = await db.event.findFirst({ where: { id, organizerId: payload.userId } })
  if (!event) return NextResponse.json({ success: false, error: ErrorCodes.EVENT_NOT_FOUND.message }, { status: 404 })

  // Use the request origin so QR works from any host (localhost or IP)
  const origin = req.headers.get('origin') || req.headers.get('referer')?.replace(/\/[^/]*$/, '') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const guestUrl = `${origin}/e/${event.eventCode}`

  const qrDataUrl = await QRCode.toDataURL(guestUrl, {
    width: 400, margin: 2,
    color: { dark: '#0284c7', light: '#ffffff' },
  })

  return NextResponse.json({ success: true, data: { qrDataUrl, guestUrl } })
}
