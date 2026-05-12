'use client'
import { useEffect, useState } from 'react'
import { XMarkIcon, ArrowDownTrayIcon, ClipboardIcon, CheckIcon } from '@heroicons/react/24/outline'

interface Props {
  eventId: string
  onClose: () => void
}

export default function QRCodeDisplay({ eventId, onClose }: Props) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [guestUrl, setGuestUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/events/${eventId}/qr`)
      .then(r => r.json())
      .then(d => {
        if (d.success) { setQrDataUrl(d.data.qrDataUrl); setGuestUrl(d.data.guestUrl) }
      })
      .finally(() => setLoading(false))
  }, [eventId])

  async function copyLink() {
    await navigator.clipboard.writeText(guestUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function downloadQR() {
    if (!qrDataUrl) return
    const a = document.createElement('a')
    a.href = qrDataUrl
    a.download = `quickpik-qr-${eventId}.png`
    a.click()
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">QR Code</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="h-48 flex items-center justify-center text-gray-400">Loading…</div>
        ) : qrDataUrl ? (
          <>
            <img src={qrDataUrl} alt="Event QR Code"
              className="w-full rounded-xl border border-gray-100 mb-4" />
            <p className="text-xs text-gray-500 text-center mb-4 break-all">{guestUrl}</p>
            <div className="flex gap-2">
              <button onClick={copyLink}
                className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm">
                {copied ? <CheckIcon className="w-4 h-4 text-green-500" /> : <ClipboardIcon className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy link'}
              </button>
              <button onClick={downloadQR}
                className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm">
                <ArrowDownTrayIcon className="w-4 h-4" /> Download
              </button>
            </div>
          </>
        ) : (
          <p className="text-center text-red-500 text-sm">Failed to load QR code.</p>
        )}
      </div>
    </div>
  )
}
