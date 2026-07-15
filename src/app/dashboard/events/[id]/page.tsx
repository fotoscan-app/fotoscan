'use client'
import { useEffect, useState, useRef, useCallback, memo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeftIcon, ArrowUpTrayIcon, QrCodeIcon, ExclamationTriangleIcon,
  TrashIcon, PhotoIcon, UserGroupIcon, CheckCircleIcon, PhoneIcon, UserIcon,
  FolderIcon, PlusIcon, PencilIcon, XMarkIcon,
} from '@heroicons/react/24/outline'
import { formatBytes, formatDate } from '@/lib/utils'
import ModerationQueue from '@/components/ModerationQueue'
import QRCodeDisplay from '@/components/QRCodeDisplay'

interface Photo {
  id: string; fileName: string; fileSize: number; thumbnailUrl: string
  isFlagged: boolean; folderId: string | null
}

interface Folder {
  id: string; name: string; _count: { photos: number }
}

interface GuestEntry {
  id: string; guestName: string | null; guestMobile: string | null
  matchCount: number; createdAt: string; sessionToken: string
}

interface Event {
  id: string; name: string; description: string | null; eventDate: string | null
  venue: string | null; status: string; photoCount: number; pendingReviewCount: number
  allowGuestDownload: boolean; eventCode: string; eventType: string; createdAt: string
  folders: Folder[]; _count: { guestSessions: number }
}

type Tab = 'photos' | 'guests'

// Memoized so deleting one photo (which only removes that item from the array,
// leaving every other photo object at the same reference) doesn't re-render
// the rest of a large grid.
const PhotoTile = memo(function PhotoTile({ photo, onDelete }: { photo: Photo; onDelete: (p: Photo) => void }) {
  return (
    <div className={`group relative aspect-square rounded-lg overflow-hidden bg-gray-100 ${photo.isFlagged ? 'ring-2 ring-accent-400' : ''}`}>
      <img src={photo.thumbnailUrl} alt={photo.fileName} className="w-full h-full object-cover" loading="lazy" />
      {photo.isFlagged && (
        <div className="absolute top-1 left-1 bg-accent-500 rounded-full p-0.5">
          <ExclamationTriangleIcon className="w-3 h-3 text-white" />
        </div>
      )}
      <button onClick={() => onDelete(photo)} title="Delete photo"
        className="absolute top-1 right-1 bg-black/60 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <TrashIcon className="w-3.5 h-3.5" />
      </button>
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/50 to-transparent p-2">
        <p className="text-white text-xs truncate">{formatBytes(photo.fileSize)}</p>
      </div>
    </div>
  )
})

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [event, setEvent]   = useState<Event | null>(null)
  const [guests, setGuests] = useState<GuestEntry[]>([])
  const [tab, setTab]       = useState<Tab>('photos')
  const [loading, setLoading]       = useState(true)
  const [guestsLoading, setGuestsLoading] = useState(false)
  const [showQR, setShowQR]             = useState(false)
  const [showModeration, setShowModeration] = useState(false)
  const [deleting, setDeleting]         = useState(false)

  const [selectedFolder, setSelectedFolder] = useState<string>('all') // 'all' | 'uncategorized' | folderId
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName]   = useState('')
  const [folderError, setFolderError]       = useState('')

  const [photos, setPhotos]             = useState<Photo[]>([])
  const [photosPage, setPhotosPage]     = useState(1)
  const [photosHasMore, setPhotosHasMore] = useState(true)
  const [photosLoading, setPhotosLoading]         = useState(true)
  const [photosLoadingMore, setPhotosLoadingMore] = useState(false)
  const photosStateRef = useRef({ photosHasMore, photosLoading, photosLoadingMore, photosPage })
  photosStateRef.current = { photosHasMore, photosLoading, photosLoadingMore, photosPage }
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    fetch(`/api/events/${id}`)
      .then(r => r.json())
      .then(d => { if (d.success) setEvent(d.data.event) })
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (tab !== 'guests') return
    setGuestsLoading(true)
    fetch(`/api/events/${id}/guests`)
      .then(r => r.json())
      .then(d => { if (d.success) setGuests(d.data.guests) })
      .finally(() => setGuestsLoading(false))
  }, [tab, id])

  const fetchPhotosPage = useCallback(async (pageNum: number, append: boolean) => {
    if (append) setPhotosLoadingMore(true); else setPhotosLoading(true)
    try {
      const res = await fetch(`/api/events/${id}/photos?folder=${encodeURIComponent(selectedFolder)}&page=${pageNum}`)
      const d = await res.json()
      if (d.success) {
        setPhotos(prev => append ? [...prev, ...d.data.photos] : d.data.photos)
        setPhotosHasMore(d.data.page < d.data.totalPages)
        setPhotosPage(d.data.page)
      }
    } finally {
      if (append) setPhotosLoadingMore(false); else setPhotosLoading(false)
    }
  }, [id, selectedFolder])

  // Reset to page 1 whenever the folder (or tab) changes
  useEffect(() => {
    if (tab !== 'photos') return
    fetchPhotosPage(1, false)
  }, [tab, fetchPhotosPage])

  // Infinite scroll: fires the instant the sentinel div mounts (a callback ref,
  // unlike useRef+useEffect, never races the DOM commit), and reads state from
  // a ref so the observer doesn't need to be torn down/recreated on every update.
  const sentinelCallbackRef = useCallback((el: HTMLDivElement | null) => {
    observerRef.current?.disconnect()
    if (!el) return
    observerRef.current = new IntersectionObserver(entries => {
      const s = photosStateRef.current
      if (entries[0].isIntersecting && s.photosHasMore && !s.photosLoading && !s.photosLoadingMore) {
        fetchPhotosPage(s.photosPage + 1, true)
      }
    }, { rootMargin: '600px' })
    observerRef.current.observe(el)
  }, [fetchPhotosPage])

  function selectFolder(f: string) {
    setSelectedFolder(f)
  }

  const deletePhoto = useCallback(async (photo: Photo) => {
    if (!confirm('Delete this photo? This cannot be undone.')) return
    const res = await fetch(`/api/photos/${photo.id}`, { method: 'DELETE' })
    const d = await res.json()
    if (!d.success) { alert(d.error || 'Delete failed. Please try again.'); return }
    setPhotos(prev => prev.filter(p => p.id !== photo.id))
    setEvent(prev => prev && {
      ...prev,
      photoCount: prev.photoCount - 1,
      folders: photo.folderId
        ? prev.folders.map(f => f.id === photo.folderId ? { ...f, _count: { photos: f._count.photos - 1 } } : f)
        : prev.folders,
    })
  }, [])

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

  async function createFolder() {
    const name = newFolderName.trim()
    if (!name || !event) return
    setFolderError('')
    const res = await fetch(`/api/events/${id}/folders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    const d = await res.json()
    if (!d.success) { setFolderError(d.error || 'Could not create folder.'); return }
    setEvent({ ...event, folders: [...event.folders, d.data.folder] })
    setNewFolderName('')
    setCreatingFolder(false)
    selectFolder(d.data.folder.id)
  }

  async function renameFolder(folder: Folder) {
    const name = prompt('Rename folder', folder.name)?.trim()
    if (!name || name === folder.name || !event) return
    const res = await fetch(`/api/events/${id}/folders/${folder.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    const d = await res.json()
    if (!d.success) { alert(d.error || 'Rename failed.'); return }
    setEvent({ ...event, folders: event.folders.map(f => f.id === folder.id ? d.data.folder : f) })
  }

  async function deleteFolder(folder: Folder) {
    if (!event) return
    if (!confirm(`Delete folder "${folder.name}"? Photos inside will move to Uncategorized, not be deleted.`)) return
    const res = await fetch(`/api/events/${id}/folders/${folder.id}`, { method: 'DELETE' })
    const d = await res.json()
    if (!d.success) { alert(d.error || 'Delete failed.'); return }
    setEvent({ ...event, folders: event.folders.filter(f => f.id !== folder.id) })
    if (selectedFolder === folder.id) selectFolder('all')
  }

  if (loading) return <div className="p-8 text-gray-400">Loading…</div>
  if (!event)  return <div className="p-8 text-red-500">Event not found.</div>

  // Carry the currently selected folder into the upload page so photos land
  // where the customer is actually looking, instead of always defaulting to
  // uncategorized. 'all' and 'uncategorized' aren't real folder ids.
  const isRealFolder = selectedFolder !== 'all' && selectedFolder !== 'uncategorized'
  const uploadHref = `/dashboard/events/${id}/upload${isRealFolder ? `?folder=${selectedFolder}` : ''}`

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
          <Link href={uploadHref} className="btn-primary flex items-center gap-2 text-sm">
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
          { icon: PhotoIcon,       label: 'Photos',            value: event.photoCount },
          { icon: UserGroupIcon,   label: 'Guests scanned',    value: event._count.guestSessions },
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

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {(['photos', 'guests'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${
              tab === t
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {t === 'guests' ? `Guests (${event._count.guestSessions})` : 'Photos'}
          </button>
        ))}
      </div>

      {/* Photos tab */}
      {tab === 'photos' && (() => {
        const uncategorizedCount = event.photoCount - event.folders.reduce((sum, f) => sum + f._count.photos, 0)

        return (
          <>
            {/* Folder chips */}
            <div className="flex items-center gap-2 mb-5 flex-wrap">
              <button onClick={() => selectFolder('all')}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedFolder === 'all' ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                All photos ({event.photoCount})
              </button>
              <button onClick={() => selectFolder('uncategorized')}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedFolder === 'uncategorized' ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                Uncategorized ({uncategorizedCount})
              </button>
              {event.folders.map(f => (
                <div key={f.id} className={`group flex items-center gap-1 pl-3 pr-1.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedFolder === f.id ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                  <button onClick={() => selectFolder(f.id)} className="flex items-center gap-1.5">
                    <FolderIcon className="w-3.5 h-3.5" /> {f.name} ({f._count.photos})
                  </button>
                  <button onClick={() => renameFolder(f)} title="Rename"
                    className={`p-1 rounded-full ${selectedFolder === f.id ? 'hover:bg-brand-700' : 'hover:bg-gray-300'}`}>
                    <PencilIcon className="w-3 h-3" />
                  </button>
                  <button onClick={() => deleteFolder(f)} title="Delete"
                    className={`p-1 rounded-full ${selectedFolder === f.id ? 'hover:bg-brand-700' : 'hover:bg-gray-300'}`}>
                    <XMarkIcon className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {!creatingFolder ? (
                <button onClick={() => setCreatingFolder(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium border border-dashed border-gray-300 text-gray-500 hover:border-brand-400 hover:text-brand-600 transition-colors">
                  <PlusIcon className="w-3.5 h-3.5" /> New folder
                </button>
              ) : (
                <div className="flex items-center gap-1">
                  <input type="text" autoFocus className="input-field text-sm py-1.5 w-40"
                    placeholder="Folder name" value={newFolderName}
                    onChange={e => setNewFolderName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') createFolder(); if (e.key === 'Escape') { setCreatingFolder(false); setNewFolderName('') } }}
                  />
                  <button onClick={createFolder} className="btn-primary text-sm py-1.5 px-3">Add</button>
                  <button onClick={() => { setCreatingFolder(false); setNewFolderName('') }}
                    className="text-sm text-gray-400 hover:text-gray-600 px-2">Cancel</button>
                </div>
              )}
            </div>
            {folderError && <p className="text-red-500 text-sm mb-4">{folderError}</p>}

            {photosLoading ? (
              <div className="text-gray-400 py-16 text-center">Loading photos…</div>
            ) : photos.length === 0 ? (
              <div className="card p-16 text-center">
                <PhotoIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {event.photoCount === 0 ? 'No photos yet' : 'No photos in this folder'}
                </h3>
                <p className="text-gray-500 mb-6">Upload photos so guests can find themselves.</p>
                <Link href={uploadHref} className="btn-primary inline-flex items-center gap-2">
                  <ArrowUpTrayIcon className="w-4 h-4" /> Upload photos
                </Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {photos.map(p => (
                    <PhotoTile key={p.id} photo={p} onDelete={deletePhoto} />
                  ))}
                </div>

                {/* Infinite scroll sentinel */}
                <div ref={sentinelCallbackRef} className="h-1" />
                {photosLoadingMore && (
                  <div className="text-gray-400 text-sm text-center py-6">Loading more…</div>
                )}
                {!photosHasMore && photos.length > 0 && (
                  <p className="text-gray-300 text-xs text-center py-6">All {photos.length} photos loaded</p>
                )}
              </>
            )}
          </>
        )
      })()}

      {/* Guests tab */}
      {tab === 'guests' && (
        guestsLoading ? (
          <div className="text-gray-400 py-8 text-center">Loading guests…</div>
        ) : guests.length === 0 ? (
          <div className="card p-16 text-center">
            <UserGroupIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No guests yet</h3>
            <p className="text-gray-500">Guests will appear here after they scan the QR code.</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-5 py-3 text-gray-500 font-medium">#</th>
                    <th className="text-left px-5 py-3 text-gray-500 font-medium">Name</th>
                    <th className="text-left px-5 py-3 text-gray-500 font-medium">Mobile</th>
                    <th className="text-left px-5 py-3 text-gray-500 font-medium">Photos matched</th>
                    <th className="text-left px-5 py-3 text-gray-500 font-medium">Scanned at</th>
                  </tr>
                </thead>
                <tbody>
                  {guests.map((g, i) => (
                    <tr key={g.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 text-gray-400">{i + 1}</td>
                      <td className="px-5 py-3">
                        <span className="flex items-center gap-2 text-gray-900 font-medium">
                          <UserIcon className="w-4 h-4 text-gray-400 shrink-0" />
                          {g.guestName || <span className="text-gray-400 italic">—</span>}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="flex items-center gap-2 text-gray-700">
                          <PhoneIcon className="w-4 h-4 text-gray-400 shrink-0" />
                          {g.guestMobile || <span className="text-gray-400 italic">—</span>}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          g.matchCount > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {g.matchCount} photo{g.matchCount !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-400 whitespace-nowrap">
                        {new Date(g.createdAt).toLocaleString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
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
          <button onClick={toggleStatus} className="btn-secondary text-sm">
            {event.status === 'active' ? 'Close event' : 'Reopen event'}
          </button>
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

      {showQR && (
        <QRCodeDisplay
          eventId={id}
          eventName={event.name}
          eventDate={event.eventDate}
          venue={event.venue}
          eventType={event.eventType}
          onClose={() => setShowQR(false)}
        />
      )}
      {showModeration && (
        <ModerationQueue eventId={id} onClose={() => { setShowModeration(false); window.location.reload() }} />
      )}
    </div>
  )
}
