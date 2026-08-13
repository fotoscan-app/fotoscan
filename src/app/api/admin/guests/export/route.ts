import { getAdminUser } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { xlsxResponse } from '@/lib/xlsx-export'

// Exports GuestSession rows — the end-user / guest data (name, mobile,
// selfie match activity) captured per event, across all customers.
export async function GET() {
  const admin = await getAdminUser()
  if (!admin) return new Response('Forbidden', { status: 403 })

  const sessions = await db.guestSession.findMany({
    select: {
      guestName: true, guestMobile: true, matchCount: true,
      createdAt: true, expiresAt: true,
      event: {
        select: {
          name: true, eventCode: true,
          organizer: { select: { name: true, email: true, businessName: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const rows = sessions.map(s => ({
    guestName:      s.guestName || '',
    guestMobile:    s.guestMobile || '',
    eventName:      s.event.name,
    eventCode:      s.event.eventCode,
    organizer:      s.event.organizer.businessName || s.event.organizer.name,
    organizerEmail: s.event.organizer.email,
    matches:        s.matchCount,
    createdAt:      s.createdAt.toISOString().slice(0, 16).replace('T', ' '),
    expiresAt:      s.expiresAt.toISOString().slice(0, 16).replace('T', ' '),
  }))

  return xlsxResponse('Guest Sessions', [
    { header: 'Guest Name',      key: 'guestName',      width: 22 },
    { header: 'Guest Mobile',    key: 'guestMobile',    width: 16 },
    { header: 'Event',           key: 'eventName',      width: 26 },
    { header: 'Event Code',      key: 'eventCode',      width: 14 },
    { header: 'Organizer',       key: 'organizer',      width: 24 },
    { header: 'Organizer Email', key: 'organizerEmail', width: 28 },
    { header: 'Matched Photos',  key: 'matches',        width: 14 },
    { header: 'Session Created', key: 'createdAt',      width: 18 },
    { header: 'Session Expires', key: 'expiresAt',      width: 18 },
  ], rows, `quickpik-guest-sessions-${new Date().toISOString().slice(0, 10)}.xlsx`)
}
