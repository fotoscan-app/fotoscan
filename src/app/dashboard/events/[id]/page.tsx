'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeftIcon, ArrowUpTrayIcon, QrCodeIcon, ExclamationTriangleIcon,
  TrashIcon, PhotoIcon, UserGroupIcon, CheckCircleIcon,
} from '@heroicons/react/24/outline'
import { formatBytes, formatDate } from '@/lib/utils'
import ModerationQueue from '@/components/ModerationQueue'
import QRCodeDisplay from '@/components/QRCodeDisplay'

interface Photo {
  id: string; fileName: string; fileSize: number; s3Url: string
  thumbnailKey: string | null; faceCount: number; isFlagged: boolean; uploadedAt: string
}

interface Event {
  id: string; name: string; description: string | null; eventDate: string | null
  venue: string | null; status: string; photoCount: number; pendingReviewCount: number
  allowGuestDownload: boolean; eventCode: string; createdAt: string
  photos: Photo[]; _count: { guestSessions: number }
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [showQR, setShowQR] = useState(false)
  const [showModeration, setShowModeration] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetch(`/api/events/${id}`)
      .then(r => r.json())
      .then(d => { if (d.success) setEvent(d.data.event) })
      .finally(() => setLoading(false))
  }, [id])

  async function toggleStatus() {
    if (!event) return
    const newStatus = event.status === 'active' ? 'closed' : 'active'
    const res = await fetch(`/api/events/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    const d = await res.json()
    if (d.success) setEvent(d.data.event)
  }

  async function deleteEvent() {
    if (!confirm('Delete this event and all its photos? This cannot be undone.')) return
    setDeleting(true)
    const res = await fetch(`/api/events/${id}`, { method: 'DELETE' })
    const d = await res.json()
    if (d.success) router.push('/dashboard')
    else { alert('Delete failed. Please try again.'); setDeleting(false) }
  }

  if (loading) return <div className="p-8 text-gray-400">Loading…</div>
  if (!event) return <div className="p-8 text-red-500">Event not found.</div>

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <Link href="/dashboard" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeftIcon className="w-4 h-4" /> All events
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">{event.name}</h1>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
              event.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
            }`}>{event.status}</span>
          </div>
          {event.eventDate && <p className="text-gray-500 text-sm">{formatDate(event.eventDate)}</p>}
          {event.venue && <p className="text-gray-400 text-sm">{event.venue}</p>}
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowQR(true)} className="btn-secondary flex items-center gap-2 text-sm">
            <QrCodeIcon className="w-4 h-4" /> QR Code
          </button>
          <Link href={`/dashboard/events/${id}/upload`} className="btn-primary flex items-center gap-2 text-sm">
            <ArrowUpTrayIcon className="w-4 h-4" /> Upload photos
          </Link>
          {event.pendingReviewCount > 0 && (
            <button onClick={() => setShowModeration(true)}
              className="bg-accent-500 hover:bg-accent-600 text-white font-semibold px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors">
              <ExclamationTriangleIcon className="w-4 h-4" /> {event.pendingReviewCount} to review
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { icon: PhotoIcon, label: 'Photos', value: event.photoCount },
          { icon: UserGroupIcon, label: 'Guests', value: event._count.guestSessions },
          { icon: CheckCircleIcon, label: 'Downloads allowed', value: event.allowGuestDownload ? 'Yes' : 'No' },
        ].map((s, i) => (
          <div key={i} className="card p-4 flex items-center gap-3">
            <s.icon className="w-8 h-8 text-brand-500" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-sm text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Photo grid */}
      {event.photos.length === 0 ? (
        <div className="card p-16 text-center">
          <PhotoIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No photos yet</h3>
          <p className="text-gray-500 mb-6">Upload photos so guests can find themselves.</p>
          <Link href={`/dashboard/events/${id}/upload`} className="btn-primary inline-flex items-center gap-2">
            <ArrowUpTrayIcon className="w-4 h-4" /> Upload photos
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {event.photos.map(p => (
            <div key={p.id} className={`relative aspect-square rounded-lg overflow-hidden bg-gray-100 ${p.isFlagged ? 'ring-2 ring-accent-400' : ''}`}>
              <img src={p.s3Url} alt={p.fileName}
                className="w-full h-full object-cover" loading="lazy" />
              {p.isFlagged && (
                <div className="absolute top-1 right-1 bg-accent-500 rounded-full p-0.5">
                  <ExclamationTriangleIcon className="w-3 h-3 text-white" />
                </div>
              )}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/50 to-transparent p-2">
                <p className="text-white text-xs truncate">{formatBytes(p.fileSize)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Danger zone */}
      <div className="mt-12 card p-6 border-red-200">
        <h3 className="font-semibold text-red-700 mb-2">Danger zone</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 font-medium">
              {event.status === 'active' ? 'Close this event' : 'Reopen this event'}
            </p>
            <p className="text-xs text-gray-400">
              {event.status === 'active' ? 'Guests will no longer be able to access this event.' : 'Allow guests to access this event again.'}
            </p>
          </div>
          <button onClick={toggleStatus} className="btn-secondary text-sm">{event.status === 'active' ? 'Close event' : 'Reopen event'}</button>
        </div>
        <hr className="my-4 border-gray-100" />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-red-600 font-medium">Delete this event</p>
            <p className="text-xs text-gray-400">Permanently deletes all photos and guest sessions. Cannot be undone.</p>
          </div>
          <button onClick={deleteEvent} disabled={deleting}
            className="btn-danger flex items-center gap-2 text-sm">
            <TrashIcon className="w-4 h-4" /> {deleting ? 'Deleting…' : 'Delete event'}
          </button>
        </div>
      </div>

      {showQR && <QRCodeDisplay eventId={id} onClose={() => setShowQR(false)} />}
      {showModeration && (
        <ModerationQueue eventId={id} onClose={() => { setShowModeration(false); window.location.reload() }} />
      )}
    </div>
  )
}
