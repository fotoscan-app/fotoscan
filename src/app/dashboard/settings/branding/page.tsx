'use client'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeftIcon, PhotoIcon, TrashIcon } from '@heroicons/react/24/outline'

export default function BrandingPage() {
  const [businessName, setBusinessName] = useState('')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/settings/branding')
      .then(r => r.json())
      .then(d => {
        if (d.success) { setBusinessName(d.data.businessName || ''); setLogoUrl(d.data.logoUrl) }
      })
  }, [])

  async function saveName(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError('')
    const res = await fetch('/api/settings/branding', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessName }),
    })
    const d = await res.json()
    setSaving(false)
    if (d.success) { setSaved(true); setTimeout(() => setSaved(false), 2000) }
    else setError(d.error || 'Save failed')
  }

  async function uploadLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoUploading(true); setError('')

    // Get presigned upload URL
    const res = await fetch('/api/settings/branding/logo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentType: file.type }),
    })
    const d = await res.json()
    if (!d.success) { setError(d.error || 'Upload failed'); setLogoUploading(false); return }

    // Upload to S3
    await fetch(d.data.uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
    setLogoUrl(d.data.logoUrl + `?t=${Date.now()}`)
    setLogoUploading(false)
  }

  async function deleteLogo() {
    if (!confirm('Remove your logo?')) return
    const res = await fetch('/api/settings/branding/logo', { method: 'DELETE' })
    const d = await res.json()
    if (d.success) setLogoUrl(null)
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link href="/dashboard/settings" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeftIcon className="w-4 h-4" /> Settings
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Branding</h1>
      <p className="text-gray-500 mb-8">Your logo and business name appear on every guest page.</p>

      <div className="space-y-6">
        {/* Logo */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Logo</h2>
          {logoUrl ? (
            <div className="flex items-center gap-4">
              <img src={logoUrl} alt="Logo" className="h-16 w-16 object-contain rounded-lg border border-gray-200" />
              <div>
                <button onClick={() => fileInputRef.current?.click()}
                  className="btn-secondary text-sm block mb-2">Change logo</button>
                <button onClick={deleteLogo}
                  className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700">
                  <TrashIcon className="w-4 h-4" /> Remove
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => fileInputRef.current?.click()} disabled={logoUploading}
              className="border-2 border-dashed border-gray-300 hover:border-brand-400 rounded-xl p-8 w-full flex flex-col items-center gap-2 transition-colors">
              <PhotoIcon className="w-8 h-8 text-gray-300" />
              <span className="text-sm text-gray-500">
                {logoUploading ? 'Uploading…' : 'Click to upload logo (PNG, JPEG, WebP, SVG)'}
              </span>
            </button>
          )}
          <input ref={fileInputRef} type="file" className="hidden"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={uploadLogo} />
        </div>

        {/* Business name */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Business name</h2>
          <form onSubmit={saveName} className="flex gap-3">
            <input type="text" className="input-field flex-1" value={businessName}
              onChange={e => setBusinessName(e.target.value)}
              placeholder="Your Photography Studio" />
            <button type="submit" disabled={saving} className="btn-primary shrink-0">
              {saving ? 'Saving…' : saved ? 'Saved!' : 'Save'}
            </button>
          </form>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>

        {/* Preview */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-3">Preview — Guest page header</h2>
          <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-3">
            {logoUrl
              ? <img src={logoUrl} alt="Logo" className="h-10 w-10 object-contain rounded" />
              : <div className="h-10 w-10 bg-brand-100 rounded flex items-center justify-center text-brand-600 font-bold text-lg">
                  {(businessName || 'F')[0].toUpperCase()}
                </div>
            }
            <span className="font-semibold text-gray-900">{businessName || 'Your Business Name'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
