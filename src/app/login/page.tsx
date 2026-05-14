'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get('reset') === '1') {
      setSuccess('Password reset successfully! Sign in with your new password.')
    }
  }, [searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setSuccess('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!data.success) { setError(data.error || 'Login failed'); return }
      window.location.href = '/dashboard'
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
          <h1 className="text-2xl font-bold text-gray-900 mt-4">Welcome back</h1>
          <p className="text-gray-500 mt-1">Sign in to your organizer account</p>
        </div>
        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" required className="input-field" value={email}
                onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
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
        </div>
        <p className="text-center text-sm text-gray-500 mt-4">
          Don't have an account?{' '}
          <Link href="/register" className="text-brand-600 font-medium hover:underline">Create one free</Link>
        </p>
      </div>
    </div>
  )
}
