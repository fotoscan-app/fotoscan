'use client'
import { Suspense, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const email        = searchParams.get('email') || ''
  const router       = useRouter()

  const [otp, setOtp]             = useState(['', '', '', '', '', ''])
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [resending, setResending] = useState(false)
  const [resent, setResent]       = useState(false)
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  function handleOtpChange(i: number, val: string) {
    if (!/^\d*$/.test(val)) return
    const next = [...otp]
    next[i] = val.slice(-1)
    setOtp(next)
    if (val && i < 5) inputs.current[i + 1]?.focus()
  }

  function handleOtpKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[i] && i > 0) inputs.current[i - 1]?.focus()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const otpStr = otp.join('')
    if (otpStr.length < 6) { setError('Please enter the complete 6-digit OTP.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setLoading(true)
    try {
      const res  = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpStr, password }),
      })
      const data = await res.json()
      if (!data.success) { setError(data.error || 'Something went wrong'); return }
      router.push('/login?reset=1')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function resendOtp() {
    setResending(true); setResent(false); setError('')
    await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    setResending(false); setResent(true)
    setTimeout(() => setResent(false), 5000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#fdfaf3' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-extrabold text-brand-600">QuickPik</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-4">Reset your password</h1>
          <p className="text-gray-500 mt-1">
            We sent a 6-digit OTP to <span className="font-medium text-gray-700">{email}</span>
          </p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Enter OTP</label>
              <div className="flex gap-2 justify-center">
                {otp.map((d, i) => (
                  <input
                    key={i}
                    ref={el => { inputs.current[i] = el }}
                    type="text" inputMode="numeric" maxLength={1}
                    value={d}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    className="w-11 h-12 text-center text-xl font-bold rounded-lg border focus:outline-none focus:ring-2"
                    style={{ borderColor: '#c9aa86', background: '#fdfaf3' }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
              <input type="password" required className="input-field" value={password}
                onChange={e => setPassword(e.target.value)} placeholder="Min 8 characters" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
              <input type="password" required className="input-field" value={confirm}
                onChange={e => setConfirm(e.target.value)} placeholder="Repeat new password" />
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}
            {resent && <p className="text-green-600 text-sm">OTP resent successfully!</p>}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Resetting…' : 'Reset Password'}
            </button>
          </form>
        </div>

        <div className="text-center mt-4 space-y-2">
          <p className="text-sm text-gray-500">
            Didn't receive the OTP?{' '}
            <button onClick={resendOtp} disabled={resending}
              className="text-brand-600 font-medium hover:underline disabled:opacity-50">
              {resending ? 'Sending…' : 'Resend OTP'}
            </button>
          </p>
          <p className="text-sm text-gray-500">
            <Link href="/login" className="text-brand-600 font-medium hover:underline">Back to login</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
