import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { EVENT_PACKS } from '@/lib/plans'
import { sendEventPackLeadEmail } from '@/lib/email'
import { logger } from '@/lib/logger'

// No self-serve checkout exists for Event Packs yet (see /pricing) — this
// just captures interest and emails the team so they can follow up and
// close the sale manually.
const schema = z.object({
  name:   z.string().min(1).max(100),
  email:  z.string().email(),
  phone:  z.string().max(20).optional(),
  packId: z.string().min(1),
})

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 })

  const { name, email, phone, packId } = parsed.data
  const pack = EVENT_PACKS.find(p => p.id === packId)
  if (!pack) return NextResponse.json({ success: false, error: 'Unknown pack' }, { status: 400 })

  try {
    await sendEventPackLeadEmail({ name, email, phone, pack })
    logger.info('LEADS', 'Event pack interest captured', { email, packId })
    return NextResponse.json({ success: true })
  } catch {
    logger.error('LEADS', 'Failed to send event pack lead email', { email, packId })
    return NextResponse.json({ success: false, error: 'Could not submit right now — please email us directly.' }, { status: 500 })
  }
}
