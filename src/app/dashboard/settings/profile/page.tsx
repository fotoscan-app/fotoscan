'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

export default function ProfilePage() {
  const [name, setName]     = useState('')
  const [email, setEmail]   = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [error, setError]   = useState('')

  useEffect(() => {
    fetch('/api/settings/profile')
      .then(r => r.json())
      .then(d => { if (d.success) { setName(d.data.name); setEmail(d.data.email) } })
  }, [])

  async function saveName(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError(''); setSaved(false)
    const res = await fetch('/api/settings/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    const d = await res.json()
    setSaving(false)
    if (d.success) { setName(d.data.name); setSaved(true); setTimeout(() => setSaved(false), 2000) }
    else setError(d.error || 'Save failed')
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link href="/dashboard/settings" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeftIcon className="w-4 h-4" /> Settings
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Profile</h1>
      <p className="text-gray-500 mb-8">Update your name. This is used across your QuickPik account.</p>

      <div className="card p-6">
        <form onSubmit={saveName} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your name</label>
            <input type="text" required minLength={2} maxLength={100} className="input-field"
              value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" disabled className="input-field bg-gray-50 text-gray-400 cursor-not-allowed" value={email} />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed — contact support if you need to update it.</p>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : saved ? 'Saved!' : 'Save changes'}
          </button>
        </form>
      </div>
    </div>
  )
}
