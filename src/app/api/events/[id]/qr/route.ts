import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'
import sharp from 'sharp'
import { db } from '@/lib/db'
import { verifyToken, COOKIE } from '@/lib/auth'
import { getObjectBuffer } from '@/lib/aws-s3'
import { logger } from '@/lib/logger'
import { ErrorCodes } from '@/lib/error-codes'

const QR_SIZE = 400

async function embedLogo(qrBuffer: Buffer, logoKey: string): Promise<Buffer> {
  const logoSize = Math.round(QR_SIZE * 0.2)
  const padding = 8
  const backdropSize = logoSize + padding * 2
  const offset = Math.round((QR_SIZE - backdropSize) / 2)

  const rawLogo = await getObjectBuffer(logoKey)
  const logo = await sharp(rawLogo)
    .resize(logoSize, logoSize, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toBuffer()

  const backdrop = Buffer.from(
    `<svg width="${backdropSize}" height="${backdropSize}"><rect width="100%" height="100%" rx="10" fill="white"/></svg>`
  )

  return sharp(qrBuffer)
    .composite([
      { input: backdrop, top: offset, left: offset },
      { input: logo, top: offset + padding, left: offset + padding },
    ])
    .png()
    .toBuffer()
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = req.cookies.get(COOKIE)?.value
  if (!token) return NextResponse.json({ success: false, error: ErrorCodes.NOT_LOGGED_IN.message }, { status: 401 })
  const payload = await verifyToken(token)
  if (!payload) return NextResponse.json({ success: false, error: ErrorCodes.INVALID_TOKEN.message }, { status: 401 })
  const { id } = await params

  const event = await db.event.findFirst({
    where: { id, organizerId: payload.userId },
    include: { organizer: { select: { logoKey: true } } },
  })
  if (!event) return NextResponse.json({ success: false, error: ErrorCodes.EVENT_NOT_FOUND.message }, { status: 404 })

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '')
  const guestUrl = `${appUrl}/e/${event.eventCode}`
  const logoKey = event.organizer.logoKey

  // High error correction leaves enough redundancy to cover a centered logo.
  let qrBuffer = await QRCode.toBuffer(guestUrl, {
    width: QR_SIZE, margin: 2,
    color: { dark: '#0284c7', light: '#ffffff' },
    errorCorrectionLevel: logoKey ? 'H' : 'M',
  })

  if (logoKey) {
    try {
      qrBuffer = await embedLogo(qrBuffer, logoKey)
    } catch (err) {
      logger.error('SYSTEM', 'QR logo embed failed', { eventId: id, errorCode: 'PS-500' })
      // Fall back to the plain QR code rather than failing the request.
    }
  }

  const qrDataUrl = `data:image/png;base64,${qrBuffer.toString('base64')}`

  return NextResponse.json({ success: true, data: { qrDataUrl, guestUrl } })
}
