'use client'
import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { ArrowDownTrayIcon, ArrowLeftIcon, PhotoIcon } from '@heroicons/react/24/outline'
import { formatBytes } from '@/lib/utils'

interface Photo {
  id: string; fileName: string; fileSize: number
  thumbnailUrl: string; downloadUrl: string | null
}

export default function GuestResultsPage() {
  const { eventCode } = useParams<{ eventCode: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token') || ''
  const [photos, setPhotos] = useState<Photo[]>([])
  const [matchCount, setMatchCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() => {
    if (!token) { router.push(`/e/${eventCode}`); return }
    fetch(`/api/guest/${eventCode}/session/${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) { setPhotos(d.data.photos); setMatchCount(d.data.matchCount) }
      })
      .finally(() => setLoading(false))
  }, [eventCode, token])

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400">Loading your photos…</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button onClick={() => router.push(`/e/${eventCode}`)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeftIcon className="w-4 h-4" /> Try again
          </button>
          <span className="text-sm font-medium text-gray-700">Your photos</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {matchCount === 0 ? (
          <div className="card p-12 text-center">
            <PhotoIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">No photos found</h2>
            <p className="text-gray-500 mb-6">
              We couldn't find any photos with your face. Try a clearer, well-lit selfie.
            </p>
            <button onClick={() => router.push(`/e/${eventCode}`)} className="btn-primary">
              Try again with a different selfie
            </button>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                Found {matchCount} photo{matchCount !== 1 ? 's' : ''} with you!
              </h2>
              <p className="text-gray-500 text-sm">Tap any photo to view full size and download.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {photos.map(p => (
                <div key={p.id} className="aspect-square rounded-xl overflow-hidden bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setSelected(p.id)}>
                  <img src={p.thumbnailUrl} alt={p.fileName} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Lightbox */}
      {selected && (() => {
        const photo = photos.find(p => p.id === selected)!
        return (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setSelected(null)}>
            <div className="relative max-w-lg w-full" onClick={e => e.stopPropagation()}>
              <img src={photo.thumbnailUrl} alt={photo.fileName}
                className="w-full rounded-xl object-contain max-h-[70vh]" />
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="text-white font-medium text-sm">{photo.fileName}</p>
                  <p className="text-gray-400 text-xs">{formatBytes(photo.fileSize)}</p>
                </div>
                {photo.downloadUrl && (
                  <a href={photo.downloadUrl} download={photo.fileName}
                    className="btn-primary flex items-center gap-2 text-sm"
                    onClick={e => e.stopPropagation()}>
                    <ArrowDownTrayIcon className="w-4 h-4" /> Download
                  </a>
                )}
              </div>
              <button onClick={() => setSelected(null)}
                className="absolute top-2 right-2 text-white bg-black/50 rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/70">
                ✕
              </button>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
