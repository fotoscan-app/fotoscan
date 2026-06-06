'use client'
import { Suspense, useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { ShieldCheckIcon } from '@heroicons/react/24/outline'

function LoginForm() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [otpCode, setOtpCode]   = useState('')
  const [maskedMobile, setMaskedMobile] = useState('')
  const [step, setStep]         = useState<'credentials' | 'otp'>('credentials')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [success, setSuccess]   = useState('')
  const [countdown, setCountdown] = useState(0)
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get('reset') === '1') {
      setSuccess('Password reset successfully! Sign in with your new password.')
    }
  }, [searchParams])

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setSuccess('')
    setLoading(true)
    try {
      const res  = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!data.success) { setError(data.error || 'Login failed'); return }

      if (data.data.otpSent) {
        setMaskedMobile(data.data.maskedMobile)
        setStep('otp')
        setCountdown(60)
      } else {
        window.location.href = '/dashboard'
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (otpCode.length !== 6) { setError('Enter the 6-digit OTP.'); return }
    setError('')
    setLoading(true)
    try {
      const res  = await fetch('/api/auth/verify-login-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otpCode }),
      })
      const data = await res.json()
      if (!data.success) { setError(data.error || 'Invalid OTP'); return }
      window.location.href = '/dashboard'
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function resendOtp() {
    setError(''); setOtpCode('')
    setLoading(true)
    try {
      const res  = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!data.success) { setError(data.error || 'Failed to resend OTP'); return }
      setCountdown(60)
    } catch {
      setError('Failed to resend. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            <Image src="/logo.jpeg" alt="QuickPik" width={180} height={60} className="object-contain mx-auto" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-4">
            {step === 'credentials' ? 'Welcome back' : 'Verify your identity'}
          </h1>
          <p className="text-gray-500 mt-1">
            {step === 'credentials'
              ? 'Sign in to your organizer account'
              : `OTP sent to WhatsApp ${maskedMobile}`}
          </p>
        </div>

        <div className="card p-8">
          {/* Credentials step */}
          {step === 'credentials' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" required className="input-field" value={email}
                  onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input type="password" required className="input-field" value={password}
                  onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
                <div className="text-right mt-1">
                  <Link href="/forgot-password" className="text-sm text-brand-600 hover:underline">
                    Forgot password?
                  </Link>
                </div>
              </div>
              {error   && <p className="text-red-600 text-sm">{error}</p>}
              {success && <p className="text-green-600 text-sm">{success}</p>}
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          )}

          {/* OTP step */}
          {step === 'otp' && (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl mb-2">
                <ShieldCheckIcon className="w-5 h-5 text-green-600 shrink-0" />
                <p className="text-sm text-green-700">Check your WhatsApp for the 6-digit code.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">6-digit OTP</label>
                <input
                  type="number"
                  inputMode="numeric"
                  required
                  className="input-field text-center text-2xl tracking-[0.5em] font-bold"
                  placeholder="------"
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value.slice(0, 6))}
                  autoFocus
                />
              </div>
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <button type="submit" disabled={loading || otpCode.length !== 6} className="btn-primary w-full">
                {loading ? 'Verifying…' : 'Verify & Sign in'}
              </button>
              <div className="text-center">
                {countdown > 0 ? (
                  <p className="text-sm text-gray-400">Resend OTP in {countdown}s</p>
                ) : (
                  <button type="button" onClick={resendOtp} disabled={loading}
                    className="text-sm text-brand-600 hover:underline">
                    Resend OTP
                  </button>
                )}
              </div>
              <button type="button" onClick={() => { setStep('credentials'); setOtpCode(''); setError('') }}
                className="w-full text-sm text-gray-400 hover:text-gray-600">
                ← Back to sign in
              </button>
            </form>
          )}
        </div>

        {step === 'credentials' && (
          <p className="text-center text-sm text-gray-500 mt-4">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-brand-600 font-medium hover:underline">Create one free</Link>
          </p>
        )}
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
