'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { PlusIcon, PhotoIcon, UserGroupIcon, ExclamationTriangleIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { formatDate } from '@/lib/utils'
import { EVENT_TYPE_LABELS, EVENT_TYPE_COLORS } from '@/lib/event-types'

interface Event {
  id: string; name: string; eventDate: string | null; venue: string | null
  status: string; photoCount: number; pendingReviewCount: number
  allowGuestDownload: boolean; eventType: string; thumbnailUrl: string | null
  _count: { guestSessions: number }; createdAt: string
}

export default function EventsPage() {
  const [events, setEvents]   = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/events').then(r => r.json()).then(data => {
      if (data.success) setEvents(data.data.events)
    }).finally(() => setLoading(false))
  }, [])

  const toggleDownload = useCallback(async (id: string, current: boolean) => {
    setToggling(id)
    try {
      const res = await fetch(`/api/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allowGuestDownload: !current }),
      })
      const data = await res.json()
      if (data.success) {
        setEvents(prev => prev.map(ev => ev.id === id ? { ...ev, allowGuestDownload: !current } : ev))
      }
    } finally {
      setToggling(null)
    }
  }, [])

  if (loading) return <div className="p-8 text-gray-400">Loading…</div>

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <p className="text-sm text-gray-500 mt-1">{events.length} event{events.length !== 1 ? 's' : ''} total</p>
        </div>
        <Link href="/dashboard/events/new" className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-4 h-4" /> New Event
        </Link>
      </div>

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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {events.map(ev => (
            <div key={ev.id} className="card overflow-hidden hover:shadow-lg transition-shadow flex flex-col">

              {/* Thumbnail */}
              <Link href={`/dashboard/events/${ev.id}`} className="block relative shrink-0 bg-gray-900" style={{ height: '220px' }}>
                {ev.thumbnailUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={ev.thumbnailUrl}
                    alt={ev.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50">
                    <PhotoIcon className="w-20 h-20 text-gray-200" />
                    <span className="text-xs text-gray-300 mt-2">No photos yet</span>
                  </div>
                )}
                <span className={`absolute top-3 right-3 text-xs px-2.5 py-1 rounded-full font-semibold shadow-sm ${
                  ev.status === 'active' ? 'bg-green-500 text-white' : 'bg-gray-600 text-white'
                }`}>{ev.status}</span>
              </Link>

              {/* Card body */}
              <Link href={`/dashboard/events/${ev.id}`} className="block px-5 pt-4 pb-3 flex-1">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-gray-900 line-clamp-1 text-base leading-snug">{ev.name}</h3>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium shrink-0 ${EVENT_TYPE_COLORS[ev.eventType] ?? EVENT_TYPE_COLORS.custom}`}>
                    {EVENT_TYPE_LABELS[ev.eventType] ?? 'Custom'}
                  </span>
                </div>
                {ev.eventDate && <p className="text-sm text-gray-500 mb-0.5">{formatDate(ev.eventDate)}</p>}
                {ev.venue     && <p className="text-sm text-gray-400 line-clamp-1">{ev.venue}</p>}
                <div className="flex items-center gap-4 text-sm text-gray-500 mt-3">
                  <span className="flex items-center gap-1.5"><PhotoIcon className="w-4 h-4" />{ev.photoCount}</span>
                  <span className="flex items-center gap-1.5"><UserGroupIcon className="w-4 h-4" />{ev._count.guestSessions}</span>
                  {ev.pendingReviewCount > 0 && (
                    <span className="flex items-center gap-1.5 text-amber-600 font-medium">
                      <ExclamationTriangleIcon className="w-4 h-4" />{ev.pendingReviewCount} to review
                    </span>
                  )}
                </div>
              </Link>

              {/* Download checkbox */}
              <div className="px-5 py-3 border-t border-gray-100">
                <label
                  className="flex items-center gap-3 cursor-pointer select-none group"
                  onClick={e => { e.preventDefault(); if (toggling !== ev.id) toggleDownload(ev.id, ev.allowGuestDownload) }}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                    ev.allowGuestDownload
                      ? 'bg-brand-600 border-brand-600'
                      : 'bg-white border-gray-300 group-hover:border-brand-400'
                  } ${toggling === ev.id ? 'opacity-50' : ''}`}>
                    {ev.allowGuestDownload && (
                      <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <span className="flex items-center gap-1.5 text-sm text-gray-600">
                    <ArrowDownTrayIcon className="w-4 h-4 text-gray-400" />
                    Allow guest downloads
                  </span>
                </label>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  )
}
