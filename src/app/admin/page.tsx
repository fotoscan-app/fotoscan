'use client'
import { useEffect, useState } from 'react'
import { UsersIcon, CalendarDaysIcon, PhotoIcon, UserGroupIcon, ServerIcon, UserPlusIcon } from '@heroicons/react/24/outline'
import { formatBytes } from '@/lib/utils'

interface Stats {
  totalUsers: number; activeUsers: number; newThisMonth: number
  totalEvents: number; totalPhotos: number; totalGuestSessions: number
  totalStorageBytes: number
  plans: Record<string, number>
}

function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string | number; sub?: string; icon: React.ElementType; color: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 shadow-sm">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function AdminOverviewPage() {
  const [stats, setStats]     = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats').then(r => r.json()).then(setStats).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-gray-400 text-sm">Loading…</div>
  if (!stats)  return <div className="text-red-500 text-sm">Failed to load stats.</div>

  const planOrder = ['starter', 'pro', 'business']

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
        <p className="text-gray-500 text-sm mt-1">QuickPik platform at a glance</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <StatCard label="Total Customers"   value={stats.totalUsers}         icon={UsersIcon}       color="bg-blue-50 text-brand-600" />
        <StatCard label="Active Customers"  value={stats.activeUsers}        icon={UsersIcon}       color="bg-green-50 text-green-600" sub={`${stats.totalUsers - stats.activeUsers} inactive`} />
        <StatCard label="New This Month"    value={stats.newThisMonth}       icon={UserPlusIcon}    color="bg-purple-50 text-purple-600" />
        <StatCard label="Total Events"      value={stats.totalEvents}        icon={CalendarDaysIcon} color="bg-amber-50 text-amber-600" />
        <StatCard label="Total Photos"      value={stats.totalPhotos.toLocaleString()} icon={PhotoIcon} color="bg-pink-50 text-pink-600" />
        <StatCard label="Guest Sessions"    value={stats.totalGuestSessions.toLocaleString()} icon={UserGroupIcon} color="bg-teal-50 text-teal-600" />
        <StatCard label="Total Storage"     value={formatBytes(stats.totalStorageBytes)} icon={ServerIcon} color="bg-indigo-50 text-indigo-600" />
      </div>

      {/* Plan breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Plan Breakdown</h2>
        <div className="grid grid-cols-3 gap-4">
          {planOrder.map(plan => {
            const count = stats.plans[plan] ?? 0
            const total = stats.totalUsers || 1
            const pct   = Math.round((count / total) * 100)
            const colors: Record<string, string> = {
              starter: 'bg-gray-100 text-gray-600',
              pro:     'bg-brand-50 text-brand-700',
              business: 'bg-purple-50 text-purple-700',
            }
            return (
              <div key={plan} className={`rounded-xl p-4 text-center ${colors[plan]}`}>
                <p className="text-3xl font-extrabold">{count}</p>
                <p className="text-sm font-semibold capitalize mt-1">{plan}</p>
                <p className="text-xs mt-0.5 opacity-70">{pct}% of customers</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
