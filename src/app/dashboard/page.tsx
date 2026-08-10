'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PlusIcon, PhotoIcon, UserGroupIcon, CalendarDaysIcon, BoltIcon, CreditCardIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { formatBytes, formatDate } from '@/lib/utils'
import { getPlanById } from '@/lib/plans'

interface UserData { storageUsed: number; storageLimit: number; plan: string; subscriptionStatus: string }

interface Stats {
  totalEvents: number; activeEvents: number; closedEvents: number; totalPhotos: number; totalGuests: number
  eventsThisMonth: number; scansThisMonth: number
  daily: { date: string; guests: number; events: number }[]
}

interface RecentEvent {
  id: string; name: string; status: string; photoCount: number; createdAt: string
  _count: { guestSessions: number }
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active:         { label: 'Active',     color: 'text-green-700 bg-green-100' },
  trialing:       { label: 'Trial',      color: 'text-blue-700 bg-blue-100' },
  past_due:       { label: 'Past due',   color: 'text-red-700 bg-red-100' },
  pending_cancel: { label: 'Cancelling', color: 'text-amber-700 bg-amber-100' },
  canceled:       { label: 'Canceled',   color: 'text-gray-600 bg-gray-100' },
}

function UsageRow({ label, used, limit, format }: { label: string; used: number; limit: number; format?: (n: number) => string }) {
  const unlimited = limit === -1
  const percent = unlimited ? 0 : Math.min(100, (used / limit) * 100)
  const fmt = format ?? ((n: number) => n.toLocaleString('en-IN'))
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1.5">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-500">{unlimited ? 'Unlimited' : `${fmt(used)} / ${fmt(limit)}`}</span>
      </div>
      {!unlimited && (
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${percent > 90 ? 'bg-red-500' : percent > 70 ? 'bg-accent-500' : 'bg-brand-500'}`}
            style={{ width: `${percent}%` }} />
        </div>
      )}
    </div>
  )
}

function EventStatusBar({ active, closed }: { active: number; closed: number }) {
  const total = active + closed
  const activePercent = total === 0 ? 0 : (active / total) * 100
  const closedPercent = total === 0 ? 0 : (closed / total) * 100
  return (
    <div className="card p-5">
      <h2 className="text-sm font-semibold text-gray-700 mb-4">Event status</h2>
      {total === 0 ? (
        <p className="text-sm text-gray-400">No events yet.</p>
      ) : (
        <>
          <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden flex gap-0.5">
            <div className="h-full bg-green-500 first:rounded-l-full last:rounded-r-full" style={{ width: `${activePercent}%` }} />
            <div className="h-full bg-gray-400 first:rounded-l-full last:rounded-r-full" style={{ width: `${closedPercent}%` }} />
          </div>
          <div className="flex items-center gap-5 mt-3 text-sm">
            <span className="flex items-center gap-1.5 text-gray-600">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" /> Active <span className="font-semibold text-gray-900">{active}</span>
            </span>
            <span className="flex items-center gap-1.5 text-gray-600">
              <span className="w-2.5 h-2.5 rounded-full bg-gray-400 shrink-0" /> Closed <span className="font-semibold text-gray-900">{closed}</span>
            </span>
          </div>
        </>
      )}
    </div>
  )
}

function RecentEventsTable({ events }: { events: RecentEvent[] }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-700">Recent events</h2>
        <Link href="/dashboard/events" className="text-sm text-brand-600 hover:underline font-medium">View all</Link>
      </div>
      {events.length === 0 ? (
        <p className="text-sm text-gray-400">No events yet.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-100">
              <th className="font-medium pb-2 pr-4">Event</th>
              <th className="font-medium pb-2 pr-4">Status</th>
              <th className="font-medium pb-2 pr-4 text-right">Photos</th>
              <th className="font-medium pb-2 pr-4 text-right">Guests</th>
              <th className="font-medium pb-2 text-right">Created</th>
            </tr>
          </thead>
          <tbody>
            {events.slice(0, 5).map(ev => (
              <tr key={ev.id} className="border-b border-gray-50 last:border-0">
                <td className="py-2.5 pr-4">
                  <Link href={`/dashboard/events/${ev.id}`} className="font-medium text-gray-900 hover:text-brand-600">{ev.name}</Link>
                </td>
                <td className="py-2.5 pr-4">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ev.status === 'active' ? 'text-green-700 bg-green-100' : 'text-gray-600 bg-gray-100'}`}>
                    {ev.status}
                  </span>
                </td>
                <td className="py-2.5 pr-4 text-right text-gray-600">{ev.photoCount}</td>
                <td className="py-2.5 pr-4 text-right text-gray-600">{ev._count.guestSessions}</td>
                <td className="py-2.5 text-right text-gray-500">{formatDate(ev.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
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
  const [user, setUser]     = useState<UserData | null>(null)
  const [stats, setStats]   = useState<Stats | null>(null)
  const [events, setEvents] = useState<RecentEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then(r => r.json()),
      fetch('/api/dashboard/stats').then(r => r.json()),
      fetch('/api/events').then(r => r.json()),
    ]).then(([meData, stData, evData]) => {
      if (meData.success) setUser(meData.data.user)
      if (stData.success) setStats(stData.data)
      if (evData.success) setEvents(evData.data.events)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8 text-gray-400">Loading…</div>

  const tickFormatter = (_: string, i: number) => (i % 5 === 0 ? _ : '')

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/billing" className="btn-secondary flex items-center gap-2">
            <CreditCardIcon className="w-4 h-4" /> {user?.plan === 'business' ? 'Manage Plan' : 'Upgrade Your Plan'}
          </Link>
          <Link href="/dashboard/events/new" className="btn-primary flex items-center gap-2">
            <PlusIcon className="w-4 h-4" /> New event
          </Link>
        </div>
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

      {/* Recent events + status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <RecentEventsTable events={events} />
        </div>
        {stats && <EventStatusBar active={stats.activeEvents} closed={stats.closedEvents} />}
      </div>

      {/* Current plan */}
      {user && (() => {
        const plan = getPlanById(user.plan)
        const statusInfo = STATUS_LABELS[user.subscriptionStatus] ?? STATUS_LABELS.active
        const isTotalCap = plan.id === 'starter' // Starter's limits are lifetime totals, not monthly
        // Always measure against the plan's real limit, not user.storageLimit —
        // that DB field can legitimately lag behind the plan (e.g. during a
        // grace period after a stale value let someone upload past their
        // entitlement) so it's not a reliable signal for "should this person
        // upgrade?".
        const storageOverPlan = user.storageUsed > plan.storageLimit
        const storageNearPlan = !storageOverPlan && user.storageUsed >= plan.storageLimit * 0.9
        return (
          <>
            {storageOverPlan && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600 shrink-0" />
                <div>
                  <p className="text-red-800 font-medium">You&apos;ve used {formatBytes(user.storageUsed)}, over the {plan.name} plan&apos;s {formatBytes(plan.storageLimit)} limit.</p>
                  <p className="text-red-600 text-sm">Upgrade now to keep uploading and avoid interruption. <Link href="/dashboard/billing" className="underline font-medium">Upgrade plan →</Link></p>
                </div>
              </div>
            )}
            {storageNearPlan && (
              <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
                <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 shrink-0" />
                <p className="text-amber-800 text-sm">You&apos;re nearing your {plan.name} plan&apos;s storage limit. <Link href="/dashboard/billing" className="underline font-medium">Consider upgrading →</Link></p>
              </div>
            )}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-gray-900">{plan.name} plan</h2>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusInfo.color}`}>{statusInfo.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">
                    {plan.priceINR === 0 ? 'Free' : <>₹{plan.priceINR.toLocaleString('en-IN')}<span className="text-gray-400">/mo</span></>}
                  </span>
                  <Link href="/dashboard/billing" className="text-sm text-brand-600 hover:underline font-medium">
                    {plan.id === 'business' ? 'Manage plan' : 'Upgrade'}
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <UsageRow label="Storage" used={user.storageUsed} limit={plan.storageLimit} format={formatBytes} />
                <UsageRow
                  label={isTotalCap ? 'Events (total)' : 'Events this month'}
                  used={isTotalCap ? stats?.totalEvents ?? 0 : stats?.eventsThisMonth ?? 0}
                  limit={plan.eventLimit}
                />
                <UsageRow
                  label={isTotalCap ? 'Face scans (total)' : 'Face scans this month'}
                  used={isTotalCap ? stats?.totalGuests ?? 0 : stats?.scansThisMonth ?? 0}
                  limit={plan.scanLimit}
                />
              </div>
            </div>
          </>
        )
      })()}
    </div>
  )
}
