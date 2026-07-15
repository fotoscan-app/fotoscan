'use client'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeftIcon, UserCircleIcon, TrashIcon } from '@heroicons/react/24/outline'
import { INDIA_STATES, CITIES_BY_STATE } from '@/lib/india-locations'

interface ProfileData {
  name: string; email: string; avatarUrl: string | null
  country: string; state: string; city: string
  companyName: string; industry: string; gstNumber: string
}

const EMPTY: ProfileData = {
  name: '', email: '', avatarUrl: null,
  country: 'India', state: '', city: '',
  companyName: '', industry: '', gstNumber: '',
}

export default function ProfilePage() {
  const [data, setData]       = useState<ProfileData>(EMPTY)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [error, setError]     = useState('')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/settings/profile')
      .then(r => r.json())
      .then(d => { if (d.success) setData({ ...EMPTY, ...d.data, country: 'India' }) })
  }, [])

  function set<K extends keyof ProfileData>(key: K, value: ProfileData[K]) {
    setData(prev => ({ ...prev, [key]: value }))
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError(''); setSaved(false)
    const res = await fetch('/api/settings/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const d = await res.json()
    setSaving(false)
    if (d.success) { setData(prev => ({ ...prev, ...d.data })); setSaved(true); setTimeout(() => setSaved(false), 2000) }
    else setError(d.error || 'Save failed')
  }

  async function uploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarUploading(true); setError('')

    const res = await fetch('/api/settings/profile/avatar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentType: file.type }),
    })
    const d = await res.json()
    if (!d.success) { setError(d.error || 'Upload failed'); setAvatarUploading(false); return }

    await fetch(d.data.uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
    set('avatarUrl', d.data.avatarUrl + `?t=${Date.now()}`)
    setAvatarUploading(false)
  }

  async function deleteAvatar() {
    if (!confirm('Remove your profile photo?')) return
    const res = await fetch('/api/settings/profile/avatar', { method: 'DELETE' })
    const d = await res.json()
    if (d.success) set('avatarUrl', null)
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link href="/dashboard/settings" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeftIcon className="w-4 h-4" /> Settings
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Profile</h1>
      <p className="text-gray-500 mb-8">Your personal, company, and billing details.</p>

      <form onSubmit={save} className="space-y-6">

        {/* Profile photo */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Profile photo</h2>
          <div className="flex items-center gap-4">
            {data.avatarUrl ? (
              <img src={data.avatarUrl} alt="Profile" className="h-16 w-16 object-cover rounded-full border border-gray-200" />
            ) : (
              <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
                <UserCircleIcon className="w-10 h-10 text-gray-300" />
              </div>
            )}
            <div>
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={avatarUploading}
                className="btn-secondary text-sm block mb-2">
                {avatarUploading ? 'Uploading…' : data.avatarUrl ? 'Change photo' : 'Upload photo'}
              </button>
              {data.avatarUrl && (
                <button type="button" onClick={deleteAvatar} className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700">
                  <TrashIcon className="w-4 h-4" /> Remove
                </button>
              )}
            </div>
          </div>
          <input ref={fileInputRef} type="file" className="hidden"
            accept="image/png,image/jpeg,image/webp" onChange={uploadAvatar} />
        </div>

        {/* Personal info */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Personal info</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your name</label>
              <input type="text" required minLength={2} maxLength={100} className="input-field"
                value={data.name} onChange={e => set('name', e.target.value)} placeholder="Your full name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" disabled className="input-field bg-gray-50 text-gray-400 cursor-not-allowed" value={data.email} />
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed — contact support if you need to update it.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <select disabled className="input-field bg-gray-50 text-gray-500 cursor-not-allowed" value={data.country}>
                  <option value="India">India</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <select className="input-field" value={data.state}
                  onChange={e => setData(prev => ({ ...prev, state: e.target.value, city: '' }))}>
                  <option value="">Select state</option>
                  {INDIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input type="text" maxLength={100} className="input-field" list="city-options"
                  value={data.city} onChange={e => set('city', e.target.value)}
                  placeholder={data.state ? 'Select or type your city' : 'Select a state first'} />
                <datalist id="city-options">
                  {(CITIES_BY_STATE[data.state] ?? []).map(c => <option key={c} value={c} />)}
                </datalist>
              </div>
            </div>
          </div>
        </div>

        {/* Company details */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Company details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company name</label>
              <input type="text" maxLength={200} className="input-field"
                value={data.companyName} onChange={e => set('companyName', e.target.value)} placeholder="Your company's registered name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
              <input type="text" maxLength={100} className="input-field"
                value={data.industry} onChange={e => set('industry', e.target.value)} placeholder="Photography, Events, Weddings…" />
            </div>
          </div>
        </div>

        {/* Billing details */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Billing details</h2>
          <p className="text-xs text-gray-400 mb-4">Used on GST invoices.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name of the company</label>
              <input type="text" maxLength={200} className="input-field"
                value={data.companyName} onChange={e => set('companyName', e.target.value)} placeholder="Your company's registered name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GST number</label>
              <input type="text" maxLength={15} className="input-field uppercase"
                value={data.gstNumber} onChange={e => set('gstNumber', e.target.value.toUpperCase())} placeholder="22AAAAA0000A1Z5" />
            </div>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Saving…' : saved ? 'Saved!' : 'Save changes'}
        </button>
      </form>
    </div>
  )
}
