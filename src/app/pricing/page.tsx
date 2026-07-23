'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { CheckIcon } from '@heroicons/react/24/solid'
import { BoltIcon, CubeIcon } from '@heroicons/react/24/outline'
import { PLANS, EVENT_PACKS, BILLING_CYCLES, getPlanPrice } from '@/lib/plans'
import type { BillingCycle } from '@/lib/plans'

export default function PricingPage() {
  const [cycle, setCycle] = useState<BillingCycle['id']>('monthly')
  const selectedCycle = BILLING_CYCLES.find(c => c.id === cycle)!

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <Link href="/">
          <Image src="/logo.jpeg" alt="QuickPik" width={140} height={48} className="object-contain" />
        </Link>
        <div className="flex gap-3">
          <Link href="/login"    className="btn-secondary text-sm">Log in</Link>
          <Link href="/register" className="btn-primary text-sm">Get started free</Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-20">

        {/* ── Heading ── */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Simple, transparent pricing</h1>
          <p className="text-lg text-gray-500">Start free. Upgrade as you grow. Cancel anytime.</p>
        </div>

        {/* ── Billing cycle toggle ── */}
        <div className="flex justify-center mb-14">
          <div className="inline-flex bg-gray-100 rounded-xl p-1 gap-1">
            {BILLING_CYCLES.map(c => (
              <button
                key={c.id}
                onClick={() => setCycle(c.id)}
                className={`relative px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  cycle === c.id
                    ? 'bg-white shadow text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {c.label}
                {c.discountPct > 0 && (
                  <span className="ml-1.5 bg-green-100 text-green-700 text-xs font-bold px-1.5 py-0.5 rounded-full">
                    -{c.discountPct}%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Subscription plan cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-24">
          {PLANS.map(plan => {
            const { monthly, total } = plan.priceINR > 0
              ? getPlanPrice(plan, cycle)
              : { monthly: 0, total: 0 }

            return (
              <div
                key={plan.id}
                className={`rounded-2xl border-2 p-8 flex flex-col relative ${
                  plan.highlighted
                    ? 'border-brand-500 shadow-xl shadow-brand-100'
                    : 'border-gray-200'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-brand-500 text-white text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full shadow">
                      Most popular
                    </span>
                  </div>
                )}

                <h2 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h2>

                {/* Price */}
                <div className="mb-2">
                  {plan.priceINR === 0 ? (
                    <span className="text-4xl font-extrabold text-gray-900">Free</span>
                  ) : (
                    <>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-extrabold text-gray-900">
                          ₹{monthly.toLocaleString('en-IN')}
                        </span>
                        <span className="text-gray-400 text-sm">/ mo</span>
                      </div>
                      {selectedCycle.months > 1 && (
                        <p className="text-xs text-gray-400 mt-1">
                          Billed ₹{total.toLocaleString('en-IN')} every {selectedCycle.months} months
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* Trial badge */}
                {plan.trialDays ? (
                  <div className="mt-3 mb-5 inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-lg w-fit">
                    <BoltIcon className="w-3.5 h-3.5 shrink-0" />
                    {plan.trialDays}-day free trial · {plan.trialStorageGB} GB data
                  </div>
                ) : (
                  <div className="mb-7" />
                )}

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckIcon className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/register"
                  className={`text-center py-3 px-4 rounded-xl font-semibold text-sm transition-colors ${
                    plan.highlighted
                      ? 'bg-brand-500 hover:bg-brand-600 text-white'
                      : 'border border-gray-300 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {plan.priceINR === 0
                    ? 'Get started free'
                    : plan.trialDays
                    ? `Start ${plan.trialDays}-day free trial`
                    : 'Get started'}
                </Link>
              </div>
            )
          })}
        </div>

        {/* ── Event Packs ── */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <span className="inline-block bg-gray-100 text-gray-600 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
              No Subscription
            </span>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-3">Pay per event</h2>
            <p className="text-gray-500 max-w-lg mx-auto">
              No monthly commitment. Buy a pack, use it anytime — events never expire.
              Perfect for part-time or seasonal photographers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {EVENT_PACKS.map(pack => (
              <div
                key={pack.id}
                className={`rounded-2xl border-2 p-8 flex flex-col relative ${
                  pack.highlighted
                    ? 'border-brand-500 shadow-xl shadow-brand-100'
                    : 'border-gray-200'
                }`}
              >
                {pack.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-brand-500 text-white text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full shadow">
                      Best value
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2 mb-2">
                  <CubeIcon className="w-5 h-5 text-brand-500" />
                  <h3 className="text-lg font-bold text-gray-900">{pack.name}</h3>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-gray-900">
                      ₹{pack.priceINR.toLocaleString('en-IN')}
                    </span>
                    <span className="text-gray-400 text-sm">one-time</span>
                  </div>
                  <p className="text-xs text-brand-600 font-semibold mt-1">
                    ₹{pack.pricePerEvent}/event
                  </p>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  <li className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckIcon className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" />
                    {pack.events} events — never expire
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckIcon className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" />
                    {pack.storageGB} GB storage
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckIcon className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" />
                    AI face recognition included
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckIcon className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" />
                    QR code &amp; guest download
                  </li>
                </ul>

                <Link
                  href="/register"
                  className={`text-center py-3 px-4 rounded-xl font-semibold text-sm transition-colors ${
                    pack.highlighted
                      ? 'bg-brand-500 hover:bg-brand-600 text-white'
                      : 'border border-gray-300 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  Buy {pack.name}
                </Link>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-sm text-gray-400">
          All prices in INR · GST as applicable · Cancel anytime · No hidden fees
        </p>
      </div>

      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} QuickPik by Anss Studio Pvt. Ltd. All rights reserved.
      </footer>
    </div>
  )
}
