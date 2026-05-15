'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { formatBytes } from '@/lib/utils'

interface Customer {
  id: string; name: string; email: string; businessName: string | null
  plan: string; isActive: boolean; storageUsed: number
  subscriptionStatus: string; createdAt: string
  _count: { events: number }
}

const PLAN_BADGE: Record<string, string> = {
  starter:  'bg-gray-100 text-gray-600',
  pro:      'bg-brand-50 text-brand-700',
  business: 'bg-purple-50 text-purple-700',
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [search, setSearch]       = useState('')
  const [loading, setLoading]     = useState(true)

  const load = useCallback(async (q: string) => {
    setLoading(true)
    const res  = await fetch(`/api/admin/customers?search=${encodeURIComponent(q)}`)
    const data = await res.json()
    setCustomers(data)
    setLoading(false)
  }, [])

  useEffect(() => { load('') }, [load])

  useEffect(() => {
    const t = setTimeout(() => load(search), 300)
    return () => clearTimeout(t)
  }, [search, load])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500 mt-1">{customers.length} registered organizers</p>
        </div>
        {/* Search */}
        <div className="relative w-72">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search name, email…"
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-600" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Customer', 'Plan', 'Events', 'Storage', 'Status', 'Joined', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No customers found.</td></tr>
            ) : customers.map(c => (
              <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{c.name}</p>
                  <p className="text-xs text-gray-400">{c.email}</p>
                  {c.businessName && <p className="text-xs text-gray-400">{c.businessName}</p>}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${PLAN_BADGE[c.plan] ?? PLAN_BADGE.starter}`}>
                    {c.plan}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-700">{c._count.events}</td>
                <td className="px-4 py-3 text-gray-700">{formatBytes(c.storageUsed)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${c.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                    {c.isActive ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {new Date(c.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/customers/${c.id}`}
                    className="text-brand-600 font-medium hover:underline text-xs">View →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
