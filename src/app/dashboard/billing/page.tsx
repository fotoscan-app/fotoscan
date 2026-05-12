'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckIcon } from '@heroicons/react/24/solid'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { PLANS, getPlanById } from '@/lib/plans'
import { formatBytes } from '@/lib/utils'

const IS_DEV_BILLING = process.env.NEXT_PUBLIC_DEV_BILLING === 'true'

interface UserData {
  name: string
  email: string
  plan: string
  subscriptionStatus: string
  razorpayCustomerId: string | null
  storageUsed: number
  storageLimit: number
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active:          { label: 'Active',              color: 'text-green-700 bg-green-100' },
  trialing:        { label: 'Trial',               color: 'text-blue-700 bg-blue-100' },
  past_due:        { label: 'Past due',            color: 'text-red-700 bg-red-100' },
  pending_cancel:  { label: 'Cancelling',          color: 'text-amber-700 bg-amber-100' },
  canceled:        { label: 'Canceled',            color: 'text-gray-600 bg-gray-100' },
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise(resolve => {
    if ((window as typeof window & { Razorpay?: unknown }).Razorpay) { resolve(true); return }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export default function BillingPage() {
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const searchParams = useSearchParams()
  const justUpgraded = searchParams.get('success') === '1'

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => { if (d.success) setUser(d.data.user) })
      .finally(() => setLoading(false))
  }, [])

  async function startCheckout(planId: string) {
    if (!user) return
    setUpgrading(planId)

    const res = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId }),
    })
    const d = await res.json()
    if (!d.success) {
      alert(d.error ?? 'Could not start checkout')
      setUpgrading(null)
      return
    }

    const loaded = await loadRazorpayScript()
    if (!loaded) {
      alert('Could not load payment gateway. Check your internet connection.')
      setUpgrading(null)
      return
    }

    const planName = PLANS.find(p => p.id === planId)?.name ?? planId

    const options = {
      key: d.data.keyId,
      subscription_id: d.data.subscriptionId,
      name: 'QuickPik',
      description: `${planName} Plan — Monthly`,
      prefill: { email: user.email, name: user.name },
      theme: { color: '#0ea5e9' },
      handler: async function (response: {
        razorpay_payment_id: string
        razorpay_subscription_id: string
        razorpay_signature: string
      }) {
        const verifyRes = await fetch('/api/billing/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(response),
        })
        const verifyData = await verifyRes.json()
        if (verifyData.success) {
          window.location.href = '/dashboard/billing?success=1'
        } else {
          alert('Payment received but verification failed. Your account will be updated shortly, or contact support.')
          setUpgrading(null)
        }
      },
      modal: { ondismiss: () => setUpgrading(null) },
    }

    const rzp = new (window as typeof window & { Razorpay: new (o: typeof options) => { open(): void } }).Razorpay(options)
    rzp.open()
  }

  async function simulateUpgrade(planId: string) {
    setUpgrading(planId)
    const res = await fetch('/api/billing/dev-upgrade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId }),
    })
    const d = await res.json()
    if (d.success) {
      window.location.href = '/dashboard/billing?success=1'
    } else {
      alert(d.error ?? 'Dev upgrade failed')
      setUpgrading(null)
    }
  }

  async function cancelSubscription() {
    setCancelling(true)
    const res = await fetch('/api/billing/cancel', { method: 'POST' })
    const d = await res.json()
    if (d.success) {
      setUser(u => u ? { ...u, subscriptionStatus: 'pending_cancel' } : u)
      setShowCancelConfirm(false)
    } else {
      alert(d.error ?? 'Could not cancel subscription')
    }
    setCancelling(false)
  }

  if (loading) return <div className="p-8 text-gray-400">Loading…</div>
  if (!user) return null

  const currentPlan = getPlanById(user.plan)
  const statusInfo = STATUS_LABELS[user.subscriptionStatus] ?? STATUS_LABELS.active
  const storagePercent = Math.min(100, (user.storageUsed / user.storageLimit) * 100)
  const hasPaidPlan = user.plan !== 'starter'
  const canCancel = hasPaidPlan && user.subscriptionStatus === 'active'

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Billing</h1>

      {IS_DEV_BILLING && (
        <div className="mb-6 bg-yellow-50 border border-yellow-300 rounded-xl p-4 flex items-center gap-3">
          <span className="text-xs font-bold text-yellow-800 bg-yellow-200 px-2 py-0.5 rounded uppercase tracking-wide">Dev Mode</span>
          <p className="text-yellow-800 text-sm">Payments are simulated — no Razorpay account needed. Disable <code>NEXT_PUBLIC_DEV_BILLING</code> before going live.</p>
        </div>
      )}

      {justUpgraded && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckIcon className="w-5 h-5 text-green-600 shrink-0" />
          <p className="text-green-800 font-medium">Your plan has been upgraded successfully!</p>
        </div>
      )}

      {user.subscriptionStatus === 'past_due' && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-600 shrink-0" />
          <div>
            <p className="text-red-800 font-medium">Payment failed</p>
            <p className="text-red-600 text-sm">Razorpay will retry automatically. Update your payment method via the Razorpay email you received.</p>
          </div>
        </div>
      )}

      {user.subscriptionStatus === 'pending_cancel' && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="text-amber-800">Your subscription is cancelled. You retain access until the end of the current billing period.</p>
        </div>
      )}

      {/* Current plan */}
      <div className="card p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">Current plan</p>
            <h2 className="text-2xl font-bold text-gray-900">{currentPlan.name}</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
            {canCancel && (
              <button onClick={() => setShowCancelConfirm(true)}
                className="text-sm text-red-500 hover:text-red-700 font-medium">
                Cancel plan
              </button>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-sm mb-1.5">
            <span className="text-gray-600 font-medium">Storage</span>
            <span className="text-gray-500">{formatBytes(user.storageUsed)} / {formatBytes(user.storageLimit)}</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${storagePercent > 90 ? 'bg-red-500' : storagePercent > 70 ? 'bg-accent-500' : 'bg-brand-500'}`}
              style={{ width: `${storagePercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Cancel confirmation */}
      {showCancelConfirm && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-5">
          <p className="font-semibold text-red-900 mb-1">Cancel your subscription?</p>
          <p className="text-sm text-red-700 mb-4">You will keep access until the end of the current billing period, then be downgraded to the free Starter plan.</p>
          <div className="flex gap-3">
            <button onClick={cancelSubscription} disabled={cancelling}
              className="btn-danger text-sm">
              {cancelling ? 'Cancelling…' : 'Yes, cancel subscription'}
            </button>
            <button onClick={() => setShowCancelConfirm(false)}
              className="btn-secondary text-sm">
              Keep my plan
            </button>
          </div>
        </div>
      )}

      {/* Plan cards */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        {user.plan === 'business' ? 'Your plan' : 'Upgrade your plan'}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {PLANS.map(plan => {
          const isCurrent = plan.id === user.plan
          const currentIdx = PLANS.findIndex(p => p.id === user.plan)
          const thisIdx = PLANS.findIndex(p => p.id === plan.id)
          const isDowngrade = thisIdx < currentIdx

          return (
            <div key={plan.id}
              className={`rounded-xl border-2 p-6 flex flex-col ${
                isCurrent ? 'border-brand-500 bg-brand-50' : 'border-gray-200 bg-white'
              }`}>
              {plan.highlighted && !isCurrent && (
                <div className="text-xs font-bold text-brand-600 uppercase tracking-wider mb-2">Most popular</div>
              )}
              <h3 className="text-lg font-bold text-gray-900 mb-1">{plan.name}</h3>
              <div className="mb-5">
                {plan.priceINR === 0 ? (
                  <span className="text-2xl font-extrabold text-gray-900">Free</span>
                ) : (
                  <>
                    <span className="text-2xl font-extrabold text-gray-900">₹{plan.priceINR.toLocaleString('en-IN')}</span>
                    <span className="text-gray-400 text-xs ml-1">/ month</span>
                  </>
                )}
              </div>

              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckIcon className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <div className="text-center py-2 text-sm font-semibold text-brand-600">Current plan</div>
              ) : isDowngrade ? (
                <div className="text-center py-2 text-sm text-gray-400">Cancel your plan to downgrade</div>
              ) : IS_DEV_BILLING ? (
                <button
                  onClick={() => simulateUpgrade(plan.id)}
                  disabled={!!upgrading}
                  className="btn-primary text-sm w-full bg-yellow-500 hover:bg-yellow-600">
                  {upgrading === plan.id ? 'Activating…' : `Simulate ${plan.name} (Dev)`}
                </button>
              ) : (
                <button
                  onClick={() => startCheckout(plan.id)}
                  disabled={!!upgrading || user.subscriptionStatus === 'pending_cancel'}
                  className="btn-primary text-sm w-full">
                  {upgrading === plan.id ? 'Opening payment…' : `Upgrade to ${plan.name}`}
                </button>
              )}
            </div>
          )
        })}
      </div>

      <p className="text-sm text-gray-400 mt-6 text-center">
        Payments processed securely by Razorpay. Cancel anytime.
      </p>
    </div>
  )
}
