'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { CameraIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline'

interface EventInfo {
  id: string; name: string; description: string | null; eventDate: string | null
  venue: string | null; photoCount: number; allowGuestDownload: boolean
}

interface Branding {
  businessName: string; logoUrl: string | null
}

export default function GuestEventPage() {
  const { eventCode } = useParams<{ eventCode: string }>()
  const router = useRouter()
  const [event, setEvent] = useState<EventInfo | null>(null)
  const [branding, setBranding] = useState<Branding | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [selfie, setSelfie] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch(`/api/guest/${eventCode}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) { setEvent(d.data.event); setBranding(d.data.branding) }
        else setNotFound(true)
      })
  }, [eventCode])

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setSelfie(file)
    setPreview(URL.createObjectURL(file))
    setError('')
  }

  async function findMyPhotos() {
    if (!selfie) return
    setUploading(true); setError('')
    try {
      const form = new FormData()
      form.append('selfie', selfie)
      const res = await fetch(`/api/guest/${eventCode}/match`, { method: 'POST', body: form })
      const data = await res.json()
      if (!data.success) {
        setError(data.error || 'Something went wrong. Please try again.')
        return
      }
      // Save session token and redirect to results
      sessionStorage.setItem(`fs_session_${eventCode}`, data.data.sessionToken)
      router.push(`/e/${eventCode}/results?token=${data.data.sessionToken}`)
    } catch {
      setError('Upload failed. Please check your connection and try again.')
    } finally {
      setUploading(false)
    }
  }

  if (notFound) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 text-center">
      <div>
        <p className="text-4xl mb-4">404</p>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Event not found</h1>
        <p className="text-gray-500">This event may have ended or the link is incorrect.</p>
      </div>
    </div>
  )

  if (!event) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400">Loading…</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with branding */}
      <header className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          {branding?.logoUrl
            ? <img src={branding.logoUrl} alt="Logo" className="h-8 w-8 object-contain rounded" />
            : <div className="h-8 w-8 bg-brand-100 rounded flex items-center justify-center text-brand-600 font-bold">
                {(branding?.businessName || 'F')[0].toUpperCase()}
              </div>
          }
          <span className="font-semibold text-gray-900">{branding?.businessName}</span>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8">
        {/* Event info */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{event.name}</h1>
          {event.description && <p className="text-gray-500 mb-2">{event.description}</p>}
          <p className="text-sm text-brand-600 font-medium">{event.photoCount} photos in this event</p>
        </div>

        {/* Selfie upload */}
        <div className="card p-6 text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Find your photos</h2>
          <p className="text-gray-500 text-sm mb-6">
            Upload a clear selfie and our AI will find all photos with your face in seconds.
          </p>

          {preview ? (
            <div className="mb-6">
              <img src={preview} alt="Your selfie" className="w-32 h-32 rounded-full object-cover mx-auto mb-3 ring-4 ring-brand-200" />
              <button onClick={() => { setSelfie(null); setPreview(null) }}
                className="text-sm text-gray-400 hover:text-gray-600">
                Choose different photo
              </button>
            </div>
          ) : (
            <button onClick={() => fileInputRef.current?.click()}
              className="w-32 h-32 rounded-full bg-gray-100 hover:bg-gray-200 flex flex-col items-center justify-center mx-auto mb-6 transition-colors border-2 border-dashed border-gray-300 hover:border-brand-400">
              <CameraIcon className="w-8 h-8 text-gray-400 mb-1" />
              <span className="text-xs text-gray-400">Upload selfie</span>
            </button>
          )}

          <input ref={fileInputRef} type="file" className="hidden"
            accept="image/jpeg,image/png,image/webp" capture="user"
            onChange={onFileChange} />

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          <button onClick={findMyPhotos} disabled={!selfie || uploading}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3">
            <ArrowUpTrayIcon className="w-5 h-5" />
            {uploading ? 'Searching your photos…' : 'Find my photos'}
          </button>

          <p className="text-xs text-gray-400 mt-4">
            Your selfie is used only for face matching and is not stored permanently.
          </p>
        </div>
      </main>
    </div>
  )
}
