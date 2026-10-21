'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { EnvelopeIcon } from '@heroicons/react/24/outline'

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', businessName: '', mobile: '' })
  const [step, setStep] = useState<'details' | 'verify'>('details')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function sendCode(): Promise<boolean> {
    const res = await fetch('/api/auth/register/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, email: form.email }),
    })
    const data = await res.json()
    if (!data.success) { setError(data.error || 'Could not send the code.'); return false }
    setCountdown(60)
    return true
  }

  // Step 1: validate the form and email a verification code
  async function handleDetails(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setLoading(true)
    try {
      if (await sendCode()) { setOtp(''); setStep('verify') }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Step 2: create the account with the code
  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (otp.length !== 6) { setError('Enter the 6-digit code.'); return }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, otp }),
      })
      const data = await res.json()
      if (!data.success) { setError(data.error || 'Registration failed'); return }
      window.location.href = '/dashboard'
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function resend() {
    setError(''); setOtp('')
    setLoading(true)
    try { await sendCode() } catch { setError('Failed to resend. Try again.') } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            <Image src="/logo.jpeg" alt="QuickPik" width={180} height={60} className="object-contain mx-auto" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-4">
            {step === 'details' ? 'Create your account' : 'Verify your email'}
          </h1>
          <p className="text-gray-500 mt-1">
            {step === 'details' ? 'Start sharing event photos in minutes' : `We sent a 6-digit code to ${form.email}`}
          </p>
        </div>
        <div className="card p-8">
          {step === 'details' ? (
            <form onSubmit={handleDetails} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your name</label>
                <input type="text" required className="input-field" value={form.name}
                  onChange={e => update('name', e.target.value)} placeholder="John Smith" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business / brand name <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input type="text" className="input-field" value={form.businessName}
                  onChange={e => update('businessName', e.target.value)} placeholder="John's Photography" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" required className="input-field" value={form.email}
                  onChange={e => update('email', e.target.value)} placeholder="you@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  WhatsApp number <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input type="tel" className="input-field" value={form.mobile}
                  onChange={e => update('mobile', e.target.value)} placeholder="+91 98765 43210" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input type="password" required className="input-field" value={form.password}
                  onChange={e => update('password', e.target.value)} placeholder="Min 8 characters" />
              </div>
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Sending code…' : 'Continue'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl mb-2">
                <EnvelopeIcon className="w-5 h-5 text-green-600 shrink-0" />
                <p className="text-sm text-green-700">Check your inbox (and spam folder) for the code.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">6-digit code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  className="input-field text-center text-2xl tracking-[0.5em] font-bold"
                  placeholder="------"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  autoFocus
                />
              </div>
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <button type="submit" disabled={loading || otp.length !== 6} className="btn-primary w-full">
                {loading ? 'Creating account…' : 'Verify & create account'}
              </button>
              <div className="text-center">
                {countdown > 0 ? (
                  <p className="text-sm text-gray-400">Resend code in {countdown}s</p>
                ) : (
                  <button type="button" onClick={resend} disabled={loading} className="text-sm text-brand-600 hover:underline">
                    Resend code
                  </button>
                )}
              </div>
              <button type="button" onClick={() => { setStep('details'); setError('') }}
                className="w-full text-sm text-gray-400 hover:text-gray-600">
                ← Change details
              </button>
            </form>
          )}
        </div>
        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-brand-600 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
