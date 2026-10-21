'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import {
  ArrowDownTrayIcon, PhotoIcon, CalendarIcon, MapPinIcon, ChevronLeftIcon, ChevronRightIcon,
} from '@heroicons/react/24/outline'
import { formatBytes, formatDate } from '@/lib/utils'

interface Photo {
  id: string; fileName: string; fileSize: number
  thumbnailUrl: string; downloadUrl: string | null
}

interface GalleryEvent {
  name: string; eventDate: string | null; venue: string | null; allowGuestDownload: boolean; allCount: number
  folders: { id: string; name: string; count: number }[]
}

// Public full-event gallery opened from the organizer's share link.
export default function SharedGalleryPage() {
  const { token } = useParams<{ token: string }>()
  const [event, setEvent]   = useState<GalleryEvent | null>(null)
  const [error, setError]   = useState('')
  const [folder, setFolder] = useState('all')
  const [photos, setPhotos] = useState<Photo[]>([])
  const [total, setTotal]   = useState(0)
  const [page, setPage]     = useState(1)
  const [hasMore, setHasMore]         = useState(true)
  const [loading, setLoading]         = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [selected, setSelected]       = useState<number | null>(null)

  const stateRef = useRef({ hasMore, loading, loadingMore, page })
  stateRef.current = { hasMore, loading, loadingMore, page }
  const observerRef = useRef<IntersectionObserver | null>(null)

  const fetchPage = useCallback(async (pageNum: number, append: boolean) => {
    if (append) setLoadingMore(true); else setLoading(true)
    try {
      const res = await fetch(`/api/gallery/${token}?folder=${encodeURIComponent(folder)}&page=${pageNum}`)
      const d = await res.json()
      if (!d.success) { setError(d.error || 'This gallery is not available.'); return }
      setEvent(d.data.event)
      setPhotos(prev => append ? [...prev, ...d.data.photos] : d.data.photos)
      setTotal(d.data.total)
      setHasMore(d.data.page < d.data.totalPages)
      setPage(d.data.page)
    } catch {
      setError('Could not load photos. Please check your connection and try again.')
    } finally {
      if (append) setLoadingMore(false); else setLoading(false)
    }
  }, [token, folder])

  useEffect(() => { fetchPage(1, false) }, [fetchPage])

  const sentinelRef = useCallback((el: HTMLDivElement | null) => {
    observerRef.current?.disconnect()
    if (!el) return
    observerRef.current = new IntersectionObserver(entries => {
      const s = stateRef.current
      if (entries[0].isIntersecting && s.hasMore && !s.loading && !s.loadingMore) fetchPage(s.page + 1, true)
    }, { rootMargin: '600px' })
    observerRef.current.observe(el)
  }, [fetchPage])

  // Arrow keys / Escape in the lightbox
  useEffect(() => {
    if (selected === null) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setSelected(null)
      if (e.key === 'ArrowLeft') setSelected(i => (i !== null && i > 0 ? i - 1 : i))
      if (e.key === 'ArrowRight') setSelected(i => (i !== null && i < photos.length - 1 ? i + 1 : i))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected, photos.length])

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="card p-12 text-center max-w-md">
        <PhotoIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Gallery not available</h2>
        <p className="text-gray-500">{error}</p>
      </div>
    </div>
  )

  if (!event) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400">Loading photos…</p>
    </div>
  )

  const photo = selected !== null ? photos[selected] : null

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 py-5">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{event.name}</h1>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
            {event.eventDate && <span className="flex items-center gap-1.5"><CalendarIcon className="w-4 h-4" />{formatDate(event.eventDate)}</span>}
            {event.venue && <span className="flex items-center gap-1.5"><MapPinIcon className="w-4 h-4" />{event.venue}</span>}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {event.folders.length > 0 && (
          <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
            {[{ id: 'all', name: 'All photos', count: event.allCount }, ...event.folders].map(f => (
              <button key={f.id} onClick={() => { setFolder(f.id); setSelected(null) }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  folder === f.id ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                }`}>
                {f.name} ({f.count})
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="text-gray-400 py-16 text-center">Loading photos…</div>
        ) : photos.length === 0 ? (
          <div className="card p-12 text-center">
            <PhotoIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No photos here yet. Please check back later.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-3">
              {total} photo{total !== 1 ? 's' : ''}{event.allowGuestDownload && ' · tap a photo to view and download'}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
              {photos.map((p, i) => (
                <button key={p.id} onClick={() => setSelected(i)}
                  className="aspect-square rounded-lg overflow-hidden bg-gray-100 hover:opacity-90 transition-opacity">
                  <img src={p.thumbnailUrl} alt={p.fileName} loading="lazy" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
            <div ref={sentinelRef} className="h-1" />
            {loadingMore && <div className="text-gray-400 text-sm text-center py-6">Loading more…</div>}
          </>
        )}
      </main>

      <footer className="text-center text-xs text-gray-400 py-8">Shared with QuickPik</footer>

      {/* Lightbox */}
      {photo && selected !== null && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="relative max-w-3xl w-full" onClick={e => e.stopPropagation()}>
            <img src={photo.thumbnailUrl} alt={photo.fileName} className="w-full rounded-xl object-contain max-h-[75vh]" />
            {selected > 0 && (
              <button onClick={() => setSelected(selected - 1)} aria-label="Previous photo"
                className="absolute left-2 top-[37vh] -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2">
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
            )}
            {selected < photos.length - 1 && (
              <button onClick={() => setSelected(selected + 1)} aria-label="Next photo"
                className="absolute right-2 top-[37vh] -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2">
                <ChevronRightIcon className="w-5 h-5" />
              </button>
            )}
            <div className="mt-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-white font-medium text-sm truncate">{photo.fileName}</p>
                <p className="text-gray-400 text-xs">{formatBytes(photo.fileSize)}</p>
              </div>
              {photo.downloadUrl && (
                <a href={photo.downloadUrl} download={photo.fileName} className="btn-primary flex items-center gap-2 text-sm shrink-0">
                  <ArrowDownTrayIcon className="w-4 h-4" /> Download
                </a>
              )}
            </div>
            <button onClick={() => setSelected(null)} aria-label="Close"
              className="absolute top-2 right-2 text-white bg-black/50 rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/70">
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
