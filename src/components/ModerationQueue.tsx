'use client'
import { useEffect, useState } from 'react'
import { XMarkIcon, CheckIcon, TrashIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { formatBytes } from '@/lib/utils'

interface FlaggedPhoto {
  id: string; fileName: string; fileSize: number
  reason: string; confidence: number; viewUrl: string
}

interface Props {
  eventId: string
  onClose: () => void
}

export default function ModerationQueue({ eventId, onClose }: Props) {
  const [photos, setPhotos] = useState<FlaggedPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/events/${eventId}/moderation`)
      .then(r => r.json())
      .then(d => { if (d.success) setPhotos(d.data.photos) })
      .finally(() => setLoading(false))
  }, [eventId])

  async function moderate(photoId: string, action: 'approve' | 'remove') {
    setActing(photoId)
    const res = await fetch(`/api/photos/${photoId}/moderation`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    const d = await res.json()
    if (d.success) setPhotos(prev => prev.filter(p => p.id !== photoId))
    setActing(null)
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-accent-500" />
            <h2 className="text-lg font-bold text-gray-900">Pending Review</h2>
            {photos.length > 0 && (
              <span className="bg-accent-100 text-accent-700 text-xs px-2 py-0.5 rounded-full font-medium">
                {photos.length}
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto px-6 py-4">
          {loading ? (
            <p className="text-center text-gray-400 py-8">Loading…</p>
          ) : photos.length === 0 ? (
            <div className="text-center py-12">
              <CheckIcon className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">All caught up!</p>
              <p className="text-gray-400 text-sm">No photos pending review.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                These photos were flagged by AI content moderation. Review each one and approve (show to guests) or remove it.
              </p>
              {photos.map(p => (
                <div key={p.id} className="border border-gray-200 rounded-xl overflow-hidden flex gap-4 p-4">
                  <img src={p.viewUrl} alt={p.fileName}
                    className="w-24 h-24 object-cover rounded-lg shrink-0 bg-gray-100" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{p.fileName}</p>
                    <p className="text-xs text-gray-400 mb-1">{formatBytes(p.fileSize)}</p>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">
                        {p.reason}
                      </span>
                      <span className="text-xs text-gray-400">
                        {Math.round(p.confidence)}% confidence
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => moderate(p.id, 'approve')}
                        disabled={acting === p.id}
                        className="flex items-center gap-1 text-xs bg-green-50 hover:bg-green-100 text-green-700 font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                        <CheckIcon className="w-3.5 h-3.5" />
                        {acting === p.id ? 'Working…' : 'Approve'}
                      </button>
                      <button
                        onClick={() => moderate(p.id, 'remove')}
                        disabled={acting === p.id}
                        className="flex items-center gap-1 text-xs bg-red-50 hover:bg-red-100 text-red-700 font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                        <TrashIcon className="w-3.5 h-3.5" />
                        {acting === p.id ? 'Working…' : 'Remove'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="btn-secondary w-full">Done</button>
        </div>
      </div>
    </div>
  )
}
