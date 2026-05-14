'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const res  = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!data.success) { setError(data.error || 'Something went wrong'); return }
      router.push(`/reset-password?email=${encodeURIComponent(email)}`)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#fdfaf3' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-extrabold text-brand-600">QuickPik</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-4">Forgot your password?</h1>
          <p className="text-gray-500 mt-1">Enter your email and we'll send you a 6-digit OTP.</p>
        </div>
        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
              <input type="email" required className="input-field" value={email}
                onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Sending OTP…' : 'Send OTP'}
            </button>
          </form>
        </div>
        <p className="text-center text-sm text-gray-500 mt-4">
          Remember your password?{' '}
          <Link href="/login" className="text-brand-600 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
