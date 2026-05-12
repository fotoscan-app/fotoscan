import Link from 'next/link'
import { CheckIcon } from '@heroicons/react/24/solid'
import { PLANS } from '@/lib/plans'

export const metadata = { title: 'Pricing — QuickPik' }

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <Link href="/" className="text-2xl font-bold text-brand-600">QuickPik</Link>
        <div className="flex gap-3">
          <Link href="/login" className="btn-secondary text-sm">Log in</Link>
          <Link href="/register" className="btn-primary text-sm">Get started free</Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Simple, transparent pricing</h1>
          <p className="text-lg text-gray-500">Start free. Upgrade as you grow.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map(plan => (
            <div
              key={plan.id}
              className={`rounded-2xl border-2 p-8 flex flex-col ${
                plan.highlighted
                  ? 'border-brand-500 shadow-lg shadow-brand-100'
                  : 'border-gray-200'
              }`}
            >
              {plan.highlighted && (
                <div className="text-xs font-bold text-brand-600 uppercase tracking-wider mb-3">Most popular</div>
              )}
              <h2 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h2>
              <div className="mb-6">
                {plan.priceINR === 0 ? (
                  <span className="text-4xl font-extrabold text-gray-900">Free</span>
                ) : (
                  <>
                    <span className="text-4xl font-extrabold text-gray-900">₹{plan.priceINR.toLocaleString('en-IN')}</span>
                    <span className="text-gray-400 text-sm ml-1">/ month</span>
                  </>
                )}
              </div>

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
                className={`text-center py-2.5 px-4 rounded-lg font-semibold text-sm transition-colors ${
                  plan.highlighted
                    ? 'bg-brand-500 hover:bg-brand-600 text-white'
                    : 'border border-gray-300 hover:bg-gray-50 text-gray-700'
                }`}
              >
                {plan.priceINR === 0 ? 'Get started free' : 'Start free trial'}
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-gray-400 mt-10">
          All prices in INR. Cancel anytime. No hidden fees.
        </p>
      </div>

      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} QuickPik. All rights reserved.
      </footer>
    </div>
  )
}
