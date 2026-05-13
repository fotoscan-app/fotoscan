'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PlusIcon, PhotoIcon, UserGroupIcon, ExclamationTriangleIcon, CalendarDaysIcon, BoltIcon } from '@heroicons/react/24/outline'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { formatBytes, formatDate } from '@/lib/utils'

interface Event {
  id: string; name: string; eventDate: string | null; venue: string | null
  status: string; photoCount: number; pendingReviewCount: number
  _count: { guestSessions: number }; createdAt: string
}

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
  const [events, setEvents] = useState<Event[]>([])
  const [user, setUser]     = useState<UserData | null>(null)
  const [stats, setStats]   = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/events').then(r => r.json()),
      fetch('/api/auth/me').then(r => r.json()),
      fetch('/api/dashboard/stats').then(r => r.json()),
    ]).then(([evData, meData, stData]) => {
      if (evData.success) setEvents(evData.data.events)
      if (meData.success) setUser(meData.data.user)
      if (stData.success) setStats(stData.data)
    }).finally(() => setLoading(false))
  }, [])

  const storagePercent = user ? Math.min(100, (user.storageUsed / user.storageLimit) * 100) : 0

  if (loading) return <div className="p-8 text-gray-400">Loading…</div>

  // Show only every 5th label on x-axis to avoid crowding
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
          <StatCard label="Total Guests"        value={stats.totalGuests}  icon={UserGroupIcon}    color="bg-blue-50 text-blue-600" />
          <StatCard label="Total Events"        value={stats.totalEvents}  icon={CalendarDaysIcon} color="bg-purple-50 text-purple-600" />
          <StatCard label="Total Photos"        value={stats.totalPhotos}  icon={PhotoIcon}        color="bg-green-50 text-green-600" />
          <StatCard label="Active Events"       value={stats.activeEvents} icon={BoltIcon}         color="bg-amber-50 text-amber-600" />
        </div>
      )}

      {/* Charts row */}
      {stats && stats.daily.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Guest sessions chart */}
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

          {/* Events created chart */}
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
        <div className="card p-5 mb-8">
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

      {/* Events list */}
      {events.length === 0 ? (
        <div className="card p-16 text-center">
          <PhotoIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No events yet</h3>
          <p className="text-gray-500 mb-6">Create your first event to start sharing photos with guests.</p>
          <Link href="/dashboard/events/new" className="btn-primary inline-flex items-center gap-2">
            <PlusIcon className="w-4 h-4" /> Create event
          </Link>
        </div>
      ) : (
        <>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {events.map(ev => (
              <Link key={ev.id} href={`/dashboard/events/${ev.id}`}
                className="card p-5 hover:shadow-md transition-shadow block">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 line-clamp-1">{ev.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    ev.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>{ev.status}</span>
                </div>
                {ev.eventDate && <p className="text-sm text-gray-500 mb-1">{formatDate(ev.eventDate)}</p>}
                {ev.venue && <p className="text-sm text-gray-400 mb-3 line-clamp-1">{ev.venue}</p>}
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1"><PhotoIcon className="w-4 h-4" /> {ev.photoCount}</span>
                  <span className="flex items-center gap-1"><UserGroupIcon className="w-4 h-4" /> {ev._count.guestSessions}</span>
                  {ev.pendingReviewCount > 0 && (
                    <span className="flex items-center gap-1 text-accent-600 font-medium">
                      <ExclamationTriangleIcon className="w-4 h-4" /> {ev.pendingReviewCount} review
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
