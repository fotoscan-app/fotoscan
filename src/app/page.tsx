'use client'
import Link from 'next/link'
import { CameraIcon, QrCodeIcon, FaceSmileIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'

const steps = [
  { icon: CameraIcon,       title: 'Organizer uploads photos', desc: 'Upload all event photos to your secure dashboard after the event.' },
  { icon: QrCodeIcon,       title: 'Share QR code',            desc: 'Display or print the unique QR code at your event or send it digitally.' },
  { icon: FaceSmileIcon,    title: 'Guests scan & selfie',     desc: 'Guests scan the QR, upload one selfie — AI finds their photos instantly.' },
  { icon: ArrowDownTrayIcon, title: 'Instant download',        desc: 'Guests download only their photos. Private, fast, no app required.' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <span className="text-2xl font-bold text-brand-600">QuickPik</span>
        <div className="flex gap-3">
          <Link href="/pricing" className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2">Pricing</Link>
          <Link href="/login" className="btn-secondary text-sm">Log in</Link>
          <Link href="/register" className="btn-primary text-sm">Get started free</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <h1 className="text-5xl font-extrabold text-gray-900 leading-tight mb-6">
          Event photos delivered to<br />
          <span className="text-brand-500">every guest instantly</span>
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
          Guests scan a QR code, upload a selfie, and AI finds their photos in seconds.
          No app download. No manual sorting. Powered by face recognition.
        </p>
        <Link href="/register" className="btn-primary text-lg px-8 py-3 inline-block">
          Start your first event — free
        </Link>
      </section>

      {/* Steps */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((s, i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 bg-brand-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <s.icon className="w-7 h-7 text-brand-600" />
                </div>
                <div className="text-xs font-bold text-brand-500 uppercase tracking-wider mb-2">Step {i + 1}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to wow your guests?</h2>
        <p className="text-gray-500 mb-8">Create your first event in under 2 minutes.</p>
        <Link href="/register" className="btn-primary text-lg px-8 py-3 inline-block">
          Create free account
        </Link>
      </section>

      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} QuickPik. All rights reserved.
      </footer>
    </div>
  )
}
