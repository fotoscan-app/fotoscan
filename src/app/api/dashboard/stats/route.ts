import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken, COOKIE } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE)?.value
  if (!token) return NextResponse.json({ success: false }, { status: 401 })
  const payload = await verifyToken(token)
  if (!payload) return NextResponse.json({ success: false }, { status: 401 })

  const since30 = new Date()
  since30.setDate(since30.getDate() - 29)
  since30.setHours(0, 0, 0, 0)

  const [events, guestSessions] = await Promise.all([
    db.event.findMany({
      where: { organizerId: payload.userId },
      select: { id: true, status: true, photoCount: true, createdAt: true, _count: { select: { guestSessions: true } } },
    }),
    db.guestSession.findMany({
      where: { event: { organizerId: payload.userId }, createdAt: { gte: since30 } },
      select: { createdAt: true },
    }),
  ])

  const totalEvents  = events.length
  const activeEvents = events.filter(e => e.status === 'active').length
  const totalPhotos  = events.reduce((s, e) => s + e.photoCount, 0)
  const totalGuests  = events.reduce((s, e) => s + e._count.guestSessions, 0)

  // Build last 30 days buckets
  const days: { date: string; guests: number; events: number }[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push({ date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }), guests: 0, events: 0 })
  }

  guestSessions.forEach(gs => {
    const label = new Date(gs.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
    const bucket = days.find(d => d.date === label)
    if (bucket) bucket.guests++
  })

  events.forEach(ev => {
    if (new Date(ev.createdAt) >= since30) {
      const label = new Date(ev.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
      const bucket = days.find(d => d.date === label)
      if (bucket) bucket.events++
    }
  })

  return NextResponse.json({
    success: true,
    data: { totalEvents, activeEvents, totalPhotos, totalGuests, daily: days },
  })
}
