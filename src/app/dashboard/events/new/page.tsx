'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

export default function NewEventPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '', description: '', eventDate: '', venue: '', allowGuestDownload: true,
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function update(field: string, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!data.success) { setError(data.error || 'Failed to create event'); return }
      router.push(`/dashboard/events/${data.data.event.id}`)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link href="/dashboard" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeftIcon className="w-4 h-4" /> Back to dashboard
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Create new event</h1>
      <div className="card p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event name *</label>
            <input type="text" required className="input-field" value={form.name}
              onChange={e => update('name', e.target.value)} placeholder="Annual Company Party 2024" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea rows={3} className="input-field resize-none" value={form.description}
              onChange={e => update('description', e.target.value)} placeholder="Optional description for guests…" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event date</label>
              <input type="date" className="input-field" value={form.eventDate}
                onChange={e => update('eventDate', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
              <input type="text" className="input-field" value={form.venue}
                onChange={e => update('venue', e.target.value)} placeholder="Grand Ballroom, Mumbai" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="allowDownload" className="w-4 h-4 text-brand-600 rounded"
              checked={form.allowGuestDownload}
              onChange={e => update('allowGuestDownload', e.target.checked)} />
            <label htmlFor="allowDownload" className="text-sm text-gray-700">
              Allow guests to download their photos
            </label>
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Creating…' : 'Create event'}
            </button>
            <Link href="/dashboard" className="btn-secondary px-6">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
