'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PlusIcon, PhotoIcon, UserGroupIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { formatBytes, formatDate } from '@/lib/utils'

interface Event {
  id: string; name: string; eventDate: string | null; venue: string | null
  status: string; photoCount: number; pendingReviewCount: number
  _count: { guestSessions: number }; createdAt: string
}

interface UserData {
  storageUsed: number; storageLimit: number; plan: string
}

export default function DashboardPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/events').then(r => r.json()),
      fetch('/api/auth/me').then(r => r.json()),
    ]).then(([evData, meData]) => {
      if (evData.success) setEvents(evData.data.events)
      if (meData.success) setUser(meData.data.user)
    }).finally(() => setLoading(false))
  }, [])

  const storagePercent = user ? Math.min(100, (user.storageUsed / user.storageLimit) * 100) : 0

  if (loading) return <div className="p-8 text-gray-400">Loading…</div>

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <Link href="/dashboard/events/new" className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-4 h-4" /> New event
        </Link>
      </div>

      {/* Storage bar */}
      {user && (
        <div className="card p-5 mb-8">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-medium text-gray-700">Storage used</span>
            <span className="text-gray-500">{formatBytes(user.storageUsed)} / {formatBytes(user.storageLimit)}</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${storagePercent > 90 ? 'bg-red-500' : storagePercent > 70 ? 'bg-accent-500' : 'bg-brand-500'}`}
              style={{ width: `${storagePercent}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">{user.plan.toUpperCase()} plan</p>
        </div>
      )}

      {/* Events */}
      {events.length === 0 ? (
        <div className="card p-16 text-center">
          <PhotoIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No events yet</h3>
          <p className="text-gray-500 mb-6">Create your first event to start sharing photos with guests.</p>
          <Link href="/dashboard/events/new" className="btn-primary inline-flex items-center gap-2">
            <PlusIcon className="w-4 h-4" /> Create event
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map(ev => (
            <Link key={ev.id} href={`/dashboard/events/${ev.id}`}
              className="card p-5 hover:shadow-md transition-shadow block">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-900 line-clamp-1">{ev.name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  ev.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>{ev.status}</span>
              </div>
              {ev.eventDate && (
                <p className="text-sm text-gray-500 mb-1">{formatDate(ev.eventDate)}</p>
              )}
              {ev.venue && <p className="text-sm text-gray-400 mb-3 line-clamp-1">{ev.venue}</p>}
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <PhotoIcon className="w-4 h-4" /> {ev.photoCount}
                </span>
                <span className="flex items-center gap-1">
                  <UserGroupIcon className="w-4 h-4" /> {ev._count.guestSessions}
                </span>
                {ev.pendingReviewCount > 0 && (
                  <span className="flex items-center gap-1 text-accent-600 font-medium">
                    <ExclamationTriangleIcon className="w-4 h-4" /> {ev.pendingReviewCount} review
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
