'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { CameraIcon, ArrowUpTrayIcon, UserIcon, PhoneIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'

interface EventInfo {
  id: string; name: string; description: string | null; eventDate: string | null
  venue: string | null; photoCount: number; allowGuestDownload: boolean
}
interface Branding { businessName: string; logoUrl: string | null }

type Step = 'details' | 'otp' | 'selfie'

export default function GuestEventPage() {
  const { eventCode } = useParams<{ eventCode: string }>()
  const router = useRouter()

  const [event, setEvent]     = useState<EventInfo | null>(null)
  const [branding, setBranding] = useState<Branding | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [otpDisabled, setOtpDisabled] = useState(false)

  // Step state
  const [step, setStep]                 = useState<Step>('details')
  const [guestName, setGuestName]       = useState('')
  const [guestMobile, setGuestMobile]   = useState('')
  const [otpCode, setOtpCode]           = useState('')
  const [verifiedToken, setVerifiedToken] = useState('')
  const [selfie, setSelfie]             = useState<File | null>(null)
  const [preview, setPreview]           = useState<string | null>(null)

  const [consent, setConsent]     = useState(false)
  const [sending, setSending]     = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError]         = useState('')
  const [countdown, setCountdown] = useState(0)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const otpInputRef  = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch(`/api/guest/${eventCode}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setEvent(d.data.event)
          setBranding(d.data.branding)
          setOtpDisabled(!!d.data.otpDisabled)
        }
        else setNotFound(true)
      })
  }, [eventCode])

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  function validateMobile(val: string) {
    return /^\+?[0-9\s\-]{10,15}$/.test(val.trim())
  }

  async function sendOtp() {
    if (!guestName.trim()) { setError('Please enter your name.'); return }
    if (!validateMobile(guestMobile)) { setError('Please enter a valid mobile number.'); return }
    if (!consent) { setError('Please agree to the Privacy Policy to continue.'); return }
    setSending(true); setError('')
    try {
      const res  = await fetch(`/api/guest/${eventCode}/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: guestMobile.trim() }),
      })
      const data = await res.json()
      if (!data.success) { setError(data.error || 'Failed to send OTP.'); return }
      if (data.data.otpRequired === false) {
        setVerifiedToken(data.data.verifiedToken)
        setStep('selfie')
        return
      }
      setStep('otp')
      setCountdown(60)
      setTimeout(() => otpInputRef.current?.focus(), 100)
    } catch {
      setError('Could not send OTP. Check your connection.')
    } finally {
      setSending(false)
    }
  }

  async function verifyOtp() {
    if (otpCode.length !== 6) { setError('Enter the 6-digit code.'); return }
    setVerifying(true); setError('')
    try {
      const res  = await fetch(`/api/guest/${eventCode}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: guestMobile.trim(), code: otpCode }),
      })
      const data = await res.json()
      if (!data.success) { setError(data.error || 'Invalid OTP.'); return }
      setVerifiedToken(data.data.verifiedToken)
      setStep('selfie')
    } catch {
      setError('Verification failed. Check your connection.')
    } finally {
      setVerifying(false)
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setSelfie(file)
    setPreview(URL.createObjectURL(file))
    setError('')
  }

  async function findMyPhotos() {
    if (!selfie || !verifiedToken) return
    setUploading(true); setError('')
    try {
      const form = new FormData()
      form.append('selfie', selfie)
      form.append('guestName', guestName.trim())
      form.append('verifiedToken', verifiedToken)
      const res  = await fetch(`/api/guest/${eventCode}/match`, { method: 'POST', body: form })
      const data = await res.json()
      if (!data.success) { setError(data.error || 'Something went wrong.'); return }
      sessionStorage.setItem(`fs_session_${eventCode}`, data.data.sessionToken)
      router.push(`/e/${eventCode}/results?token=${data.data.sessionToken}`)
    } catch {
      setError('Upload failed. Please check your connection.')
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

  const steps: Step[] = otpDisabled ? ['details', 'selfie'] : ['details', 'otp', 'selfie']

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                step === s ? 'bg-brand-600 text-white' :
                (steps.indexOf(step) > i) ? 'bg-brand-100 text-brand-600' :
                'bg-gray-100 text-gray-400'
              }`}>{i + 1}</div>
              {i < steps.length - 1 && <div className={`w-8 h-0.5 ${(steps.indexOf(step) > i) ? 'bg-brand-300' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <div className="card p-6 space-y-5">

          {/* ── Step 1: Details ── */}
          {step === 'details' && (
            <>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Your details</h2>
                <p className="text-gray-500 text-sm">
                  {otpDisabled
                    ? 'Enter your name and WhatsApp number to continue.'
                    : 'Enter your name and WhatsApp number to receive an OTP.'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" className="input-field pl-9" placeholder="Enter your full name"
                    value={guestName} onChange={e => setGuestName(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  WhatsApp number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="tel" className="input-field pl-9" placeholder="+91 98765 43210"
                    value={guestMobile} onChange={e => setGuestMobile(e.target.value)} />
                </div>
                {!otpDisabled && <p className="text-xs text-gray-400 mt-1">OTP will be sent to this WhatsApp number</p>}
              </div>

              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" className="mt-0.5 shrink-0" checked={consent}
                  onChange={e => setConsent(e.target.checked)} />
                <span className="text-xs text-gray-500">
                  I agree to the{' '}
                  <a href="/privacy-policy" target="_blank" className="text-brand-600 underline">Privacy Policy</a>
                  {' '}and{' '}
                  <a href="/terms" target="_blank" className="text-brand-600 underline">Terms of Service</a>.
                  My phone number and selfie are used only to find my photos and will not be stored.
                </span>
              </label>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button onClick={sendOtp} disabled={sending || !consent}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3">
                {otpDisabled
                  ? (sending ? 'Please wait…' : 'Continue')
                  : (sending ? 'Sending OTP…' : 'Send OTP on WhatsApp')}
              </button>
            </>
          )}

          {/* ── Step 2: OTP ── */}
          {step === 'otp' && (
            <>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Enter OTP</h2>
                <p className="text-gray-500 text-sm">
                  We sent a 6-digit code to <span className="font-medium text-gray-700">{guestMobile}</span> on WhatsApp.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  6-digit OTP <span className="text-red-500">*</span>
                </label>
                <input
                  ref={otpInputRef}
                  type="number"
                  inputMode="numeric"
                  maxLength={6}
                  className="input-field text-center text-2xl tracking-[0.5em] font-bold"
                  placeholder="------"
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value.slice(0, 6))}
                />
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button onClick={verifyOtp} disabled={verifying || otpCode.length !== 6}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3">
                <ShieldCheckIcon className="w-5 h-5" />
                {verifying ? 'Verifying…' : 'Verify OTP'}
              </button>

              <div className="text-center">
                {countdown > 0 ? (
                  <p className="text-sm text-gray-400">Resend OTP in {countdown}s</p>
                ) : (
                  <button onClick={() => { setStep('details'); setOtpCode(''); setError('') }}
                    className="text-sm text-brand-600 hover:underline">
                    Resend OTP
                  </button>
                )}
              </div>
            </>
          )}

          {/* ── Step 3: Selfie ── */}
          {step === 'selfie' && (
            <>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Upload your selfie</h2>
                <p className="text-gray-500 text-sm">Our AI will find all photos with your face instantly.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Your selfie <span className="text-red-500">*</span>
                </label>
                {preview ? (
                  <div className="flex flex-col items-center">
                    <img src={preview} alt="Your selfie" className="w-28 h-28 rounded-full object-cover mb-2 ring-4 ring-brand-200" />
                    <button onClick={() => { setSelfie(null); setPreview(null) }}
                      className="text-sm text-gray-400 hover:text-gray-600">
                      Choose different photo
                    </button>
                  </div>
                ) : (
                  <button onClick={() => fileInputRef.current?.click()}
                    className="w-full h-28 rounded-xl bg-gray-50 hover:bg-gray-100 flex flex-col items-center justify-center transition-colors border-2 border-dashed border-gray-300 hover:border-brand-400">
                    <CameraIcon className="w-8 h-8 text-gray-400 mb-1" />
                    <span className="text-sm text-gray-400">Tap to upload selfie</span>
                  </button>
                )}
                <input ref={fileInputRef} type="file" className="hidden"
                  accept="image/jpeg,image/png,image/webp" capture="user"
                  onChange={onFileChange} />
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button onClick={findMyPhotos} disabled={!selfie || uploading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3">
                <ArrowUpTrayIcon className="w-5 h-5" />
                {uploading ? 'Searching your photos…' : 'Find my photos'}
              </button>
            </>
          )}

          <p className="text-xs text-gray-400 text-center">
            Your selfie is used only for face matching and is not stored permanently.
          </p>
        </div>
      </main>
    </div>
  )
}
