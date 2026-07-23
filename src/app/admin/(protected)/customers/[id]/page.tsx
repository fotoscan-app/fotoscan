'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeftIcon, CalendarDaysIcon, PhotoIcon, UserGroupIcon } from '@heroicons/react/24/outline'
import { formatBytes } from '@/lib/utils'

interface Event {
  id: string; name: string; eventDate: string | null
  status: string; photoCount: number; createdAt: string
  _count: { guestSessions: number }
}

interface Customer {
  id: string; name: string; email: string; businessName: string | null
  plan: string; isActive: boolean; storageUsed: number; storageLimit: number
  subscriptionStatus: string; createdAt: string
  events: Event[]
}

const PLANS = ['starter', 'pro', 'studio', 'elite', 'business']
const PLAN_BADGE: Record<string, string> = {
  starter:  'bg-gray-100 text-gray-600',
  pro:      'bg-brand-50 text-brand-700',
  studio:   'bg-amber-50 text-amber-700',
  elite:    'bg-rose-50 text-rose-700',
  business: 'bg-purple-50 text-purple-700',
}

export default function CustomerDetailPage() {
  const { id }                  = useParams<{ id: string }>()
  const router                  = useRouter()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)

  useEffect(() => {
    fetch(`/api/admin/customers/${id}`).then(r => r.json()).then(setCustomer).finally(() => setLoading(false))
  }, [id])

  async function patch(data: Partial<{ isActive: boolean; plan: string }>) {
    setSaving(true)
    const res  = await fetch(`/api/admin/customers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const updated = await res.json()
    setCustomer(prev => prev ? { ...prev, ...updated } : prev)
    setSaving(false)
  }

  if (loading) return <div className="text-gray-400 text-sm">Loading…</div>
  if (!customer) return <div className="text-red-500 text-sm">Customer not found.</div>

  const storagePercent = Math.min(100, Math.round((customer.storageUsed / customer.storageLimit) * 100))

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back */}
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
        <ArrowLeftIcon className="w-4 h-4" /> Back to Customers
      </button>

      {/* Profile card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{customer.name}</h1>
            <p className="text-gray-500 text-sm">{customer.email}</p>
            {customer.businessName && <p className="text-gray-400 text-sm">{customer.businessName}</p>}
            <p className="text-xs text-gray-400 mt-1">
              Joined {new Date(customer.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Plan selector */}
            <select value={customer.plan} disabled={saving}
              onChange={e => patch({ plan: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600">
              {PLANS.map(p => <option key={p} value={p} className="capitalize">{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
            {/* Toggle active */}
            <button disabled={saving} onClick={() => patch({ isActive: !customer.isActive })}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50
                ${customer.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>
              {saving ? 'Saving…' : customer.isActive ? 'Disable Account' : 'Enable Account'}
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: CalendarDaysIcon, label: 'Events',    value: customer.events.length },
            { icon: PhotoIcon,        label: 'Photos',    value: customer.events.reduce((s, e) => s + e.photoCount, 0) },
            { icon: UserGroupIcon,    label: 'Guests',    value: customer.events.reduce((s, e) => s + e._count.guestSessions, 0) },
            { icon: null,             label: 'Plan',      value: <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${PLAN_BADGE[customer.plan]}`}>{customer.plan}</span> },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-gray-50 rounded-lg p-3 text-center">
              {Icon && <Icon className="w-5 h-5 text-gray-400 mx-auto mb-1" />}
              <p className="text-lg font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Storage bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Storage used</span>
            <span>{formatBytes(customer.storageUsed)} / {formatBytes(customer.storageLimit)}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-brand-600 rounded-full transition-all" style={{ width: `${storagePercent}%` }} />
          </div>
        </div>
      </div>

      {/* Events table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Events ({customer.events.length})</h2>
        </div>
        {customer.events.length === 0 ? (
          <p className="px-5 py-8 text-center text-gray-400 text-sm">No events yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Event Name', 'Date', 'Photos', 'Guests', 'Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customer.events.map(ev => (
                <tr key={ev.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{ev.name}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {ev.eventDate ? new Date(ev.eventDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{ev.photoCount}</td>
                  <td className="px-4 py-3 text-gray-700">{ev._count.guestSessions}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize
                      ${ev.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {ev.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
