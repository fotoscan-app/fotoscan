'use client'
import { useState } from 'react'
import { XMarkIcon, ClipboardIcon, CheckIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

interface Props {
  eventId: string
  eventName: string
  eventStatus: string
  galleryToken: string | null
  onChange: (galleryToken: string | null) => void
  onClose: () => void
}

// Organizer controls for the full-gallery share link. Unlike the QR (face match,
// each guest sees only their own photos), anyone with this link sees every photo.
export default function ShareGalleryModal({ eventId, eventName, eventStatus, galleryToken, onChange, onClose }: Props) {
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const link = galleryToken ? `${window.location.origin}/g/${galleryToken}` : ''
  const message = `Here are all the photos from ${eventName}: ${link}`

  async function call(method: 'POST' | 'DELETE') {
    setBusy(true); setError('')
    try {
      const res = await fetch(`/api/events/${eventId}/gallery-link`, { method })
      const d = await res.json()
      if (!d.success) { setError(d.error || 'Something went wrong. Please try again.'); return }
      onChange(d.data.galleryToken)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  function regenerate() {
    if (confirm('Create a new link? The current link will stop working for everyone who has it.')) call('POST')
  }

  function turnOff() {
    if (confirm('Turn off the gallery link? Anyone who has it will no longer be able to see the photos.')) call('DELETE')
  }

  async function copyLink() {
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Share full gallery</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Anyone with this link can see <strong>all photos</strong> of this event, without a selfie or OTP.
          Share it only with people who should see every photo, such as the host family.
        </p>

        {!galleryToken ? (
          <button onClick={() => call('POST')} disabled={busy} className="btn-primary w-full">
            {busy ? 'Creating link…' : 'Create gallery link'}
          </button>
        ) : (
          <>
            {eventStatus !== 'active' && (
              <p className="text-sm text-accent-700 bg-accent-50 rounded-lg px-3 py-2 mb-3">
                This event is closed, so the link won&apos;t open until you reopen the event.
              </p>
            )}
            <div className="flex gap-2 mb-3">
              <input readOnly value={link} className="input-field text-sm flex-1 min-w-0" onFocus={e => e.target.select()} />
              <button onClick={copyLink} className="btn-secondary flex items-center gap-1.5 text-sm shrink-0">
                {copied ? <CheckIcon className="w-4 h-4" /> : <ClipboardIcon className="w-4 h-4" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5b] text-white font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors mb-4">
              Share on WhatsApp
            </a>
            <div className="flex items-center justify-between text-sm">
              <button onClick={regenerate} disabled={busy} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700">
                <ArrowPathIcon className="w-4 h-4" /> New link
              </button>
              <button onClick={turnOff} disabled={busy} className="text-red-600 hover:text-red-700">
                Turn off sharing
              </button>
            </div>
          </>
        )}
        {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
      </div>
    </div>
  )
}
