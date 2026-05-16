'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PlusIcon, PhotoIcon, UserGroupIcon, CalendarDaysIcon, BoltIcon } from '@heroicons/react/24/outline'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { formatBytes } from '@/lib/utils'

interface UserData { storageUsed: number; storageLimit: number; plan: string }

interface Stats {
  totalEvents: number; activeEvents: number; totalPhotos: number; totalGuests: number
  daily: { date: string; guests: number; events: number }[]
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: React.ElementType; color: string }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [user, setUser]   = useState<UserData | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then(r => r.json()),
      fetch('/api/dashboard/stats').then(r => r.json()),
    ]).then(([meData, stData]) => {
      if (meData.success) setUser(meData.data.user)
      if (stData.success) setStats(stData.data)
    }).finally(() => setLoading(false))
  }, [])

  const storagePercent = user ? Math.min(100, (user.storageUsed / user.storageLimit) * 100) : 0

  if (loading) return <div className="p-8 text-gray-400">Loading…</div>

  const tickFormatter = (_: string, i: number) => (i % 5 === 0 ? _ : '')

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <Link href="/dashboard/events/new" className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-4 h-4" /> New event
        </Link>
      </div>

      {/* Stat cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Guests"  value={stats.totalGuests}  icon={UserGroupIcon}    color="bg-blue-50 text-blue-600" />
          <StatCard label="Total Events"  value={stats.totalEvents}  icon={CalendarDaysIcon} color="bg-purple-50 text-purple-600" />
          <StatCard label="Total Photos"  value={stats.totalPhotos}  icon={PhotoIcon}        color="bg-green-50 text-green-600" />
          <StatCard label="Active Events" value={stats.activeEvents} icon={BoltIcon}         color="bg-amber-50 text-amber-600" />
        </div>
      )}

      {/* Charts row */}
      {stats && stats.daily.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Guest sessions — last 30 days</h2>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={stats.daily} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="guestGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#0ea5e9" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={tickFormatter} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="guests" stroke="#0ea5e9" fill="url(#guestGrad)" strokeWidth={2} dot={false} name="Guests" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="card p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Events created — last 30 days</h2>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={stats.daily} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={tickFormatter} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="events" fill="#8b5cf6" radius={[3, 3, 0, 0]} name="Events" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Storage bar */}
      {user && (
        <div className="card p-5">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-medium text-gray-700">Storage used</span>
            <span className="text-gray-500">{formatBytes(user.storageUsed)} / {formatBytes(user.storageLimit)}</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${storagePercent > 90 ? 'bg-red-500' : storagePercent > 70 ? 'bg-accent-500' : 'bg-brand-500'}`}
              style={{ width: `${storagePercent}%` }} />
          </div>
          <p className="text-xs text-gray-400 mt-1">{user.plan.toUpperCase()} plan</p>
        </div>
      )}
    </div>
  )
}
