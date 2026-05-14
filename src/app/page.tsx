'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  QrCodeIcon, FaceSmileIcon, ArrowDownTrayIcon, ShieldCheckIcon,
  BoltIcon, PhotoIcon, DevicePhoneMobileIcon, SparklesIcon,
  ChevronLeftIcon, ChevronRightIcon, MapPinIcon, PhoneIcon, EnvelopeIcon,
} from '@heroicons/react/24/outline'

// ── Slider ────────────────────────────────────────────────────────────────────
const SLIDES = [
  { src: '/slider/pic1.png', tag: 'Every Moment, Instantly Shared.' },
  { src: '/slider/pic2.png', tag: 'Where Memories Meet Instantly.' },
  { src: '/slider/pic3.png', tag: 'Smart Sharing for Smart Events.' },
  { src: '/slider/pic4.png', tag: 'No App. Just Scan.' },
]

function HeroSlider() {
  const [current, setCurrent] = useState(0)
  const [animating, setAnimating] = useState(false)

  const go = useCallback((idx: number) => {
    if (animating) return
    setAnimating(true)
    setCurrent(idx)
    setTimeout(() => setAnimating(false), 600)
  }, [animating])

  const prev = () => go((current - 1 + SLIDES.length) % SLIDES.length)
  const next = useCallback(() => go((current + 1) % SLIDES.length), [current, go])

  useEffect(() => {
    const t = setInterval(next, 5000)
    return () => clearInterval(t)
  }, [next])

  return (
    <section className="relative w-full h-[78vh] min-h-[450px] overflow-hidden" style={{ background: '#fdfaf3' }}>
      {SLIDES.map((s, i) => (
        <div key={i} className={`absolute inset-0 transition-opacity duration-700 ${i === current ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
          <Image src={s.src} alt={s.tag} fill className="object-contain" priority={i === 0} />
        </div>
      ))}

      {/* Arrows */}
      <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 text-white w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors">
        <ChevronLeftIcon className="w-5 h-5" />
      </button>
      <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 text-white w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors">
        <ChevronRightIcon className="w-5 h-5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {SLIDES.map((_, i) => (
          <button key={i} onClick={() => go(i)}
            className={`h-2 rounded-full transition-all duration-300 ${i === current ? 'bg-white w-6' : 'bg-white/50 w-2'}`} />
        ))}
      </div>
    </section>
  )
}

// ── Features ──────────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: FaceSmileIcon,       title: 'AI Face Recognition',    desc: 'AWS-powered AI instantly matches guests to their photos with 99%+ accuracy.',           color: 'bg-blue-50 text-blue-600' },
  { icon: QrCodeIcon,          title: 'QR Code Access',         desc: 'One unique QR code per event. Display it anywhere — print, screen, or share digitally.', color: 'bg-purple-50 text-purple-600' },
  { icon: DevicePhoneMobileIcon, title: 'No App Needed',        desc: 'Guests open a link in any browser. No downloads, no sign-ups, no friction.',            color: 'bg-green-50 text-green-600' },
  { icon: BoltIcon,            title: 'Instant Delivery',       desc: 'Photos appear in seconds after selfie upload — not hours, not days.',                    color: 'bg-amber-50 text-amber-600' },
  { icon: ShieldCheckIcon,     title: 'Secure & Private',       desc: 'Each guest sees only their own photos. Sessions expire in 24 hours automatically.',      color: 'bg-red-50 text-red-600' },
  { icon: PhotoIcon,           title: 'Bulk Upload',            desc: 'Upload hundreds of photos at once. Duplicates are auto-detected and rejected.',          color: 'bg-teal-50 text-teal-600' },
  { icon: SparklesIcon,        title: 'Custom Branding',        desc: 'Add your studio logo and business name. Every touchpoint reflects your brand.',          color: 'bg-pink-50 text-pink-600' },
  { icon: ArrowDownTrayIcon,   title: 'Guest Downloads',        desc: 'Guests can download full-resolution photos straight to their device.',                   color: 'bg-indigo-50 text-indigo-600' },
]

// ── How it works ──────────────────────────────────────────────────────────────
const STEPS = [
  { step: '01', icon: PhotoIcon,          title: 'Upload Event Photos',  desc: 'After your event, upload all photos to your secure QuickPik dashboard in bulk.' },
  { step: '02', icon: QrCodeIcon,         title: 'Share the QR Code',    desc: 'Display or send the event QR code to all your guests digitally or on print.' },
  { step: '03', icon: FaceSmileIcon,      title: 'Guests Scan & Selfie', desc: 'Guests scan the QR, take or upload one selfie — AI finds their photos instantly.' },
  { step: '04', icon: ArrowDownTrayIcon,  title: 'Instant Download',     desc: 'Guests view and download only their photos. Private, fast, no app required.' },
]

// ── Stats ─────────────────────────────────────────────────────────────────────
const STATS = [
  { value: '99%+',    label: 'Face match accuracy' },
  { value: '<3 sec',  label: 'Average match time' },
  { value: '0',       label: 'App downloads needed' },
  { value: '24/7',    label: 'Cloud availability' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <span className="text-2xl font-extrabold text-brand-600">QuickPik</span>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <a href="#features"    className="hover:text-brand-600 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-brand-600 transition-colors">How it works</a>
            <Link href="/pricing"  className="hover:text-brand-600 transition-colors">Pricing</Link>
            <a href="#contact"     className="hover:text-brand-600 transition-colors">Contact</a>
          </div>
          <div className="flex gap-2">
            <Link href="/login"    className="btn-secondary text-sm">Log in</Link>
            <Link href="/register" className="btn-primary text-sm">Get started free</Link>
          </div>
        </div>
      </nav>

      {/* Spacer for fixed nav */}
      <div className="h-14" />

      {/* Hero Slider */}
      <HeroSlider />

      {/* Stats bar */}
      <div className="bg-brand-600 text-white py-8">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {STATS.map(s => (
            <div key={s.label}>
              <p className="text-3xl font-extrabold">{s.value}</p>
              <p className="text-sm text-brand-200 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="text-brand-600 text-sm font-semibold uppercase tracking-widest">Why QuickPik</span>
            <h2 className="text-4xl font-extrabold text-gray-900 mt-2 mb-4">Everything your event needs</h2>
            <p className="text-gray-500 max-w-xl mx-auto">From AI face recognition to instant delivery — QuickPik handles every step of event photo sharing.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map(f => (
              <div key={f.title} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="text-brand-600 text-sm font-semibold uppercase tracking-widest">Simple Process</span>
            <h2 className="text-4xl font-extrabold text-gray-900 mt-2 mb-4">How it works</h2>
            <p className="text-gray-500">Up and running in minutes. No technical setup required.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {STEPS.map((s, i) => (
              <div key={i} className="text-center relative">
                <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <s.icon className="w-8 h-8 text-brand-600" />
                </div>
                <span className="text-xs font-bold text-brand-400 uppercase tracking-widest">Step {s.step}</span>
                <h3 className="font-semibold text-gray-900 mt-1 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500">{s.desc}</p>
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-brand-100 -translate-x-1/2" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="bg-gradient-to-r from-brand-600 to-brand-500 py-20 text-center text-white">
        <h2 className="text-4xl font-extrabold mb-4">Ready to wow your guests?</h2>
        <p className="text-brand-100 mb-8 text-lg">Create your first event in under 2 minutes. No credit card required.</p>
        <Link href="/register" className="bg-white text-brand-600 font-bold px-10 py-4 rounded-xl hover:bg-brand-50 transition-colors shadow-lg inline-block">
          Start free today
        </Link>
      </section>

      {/* Contact */}
      <section id="contact" className="py-24 bg-gray-50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="text-brand-600 text-sm font-semibold uppercase tracking-widest">Contact Us</span>
            <h2 className="text-4xl font-extrabold text-gray-900 mt-2 mb-4">Get In Touch!</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              We'd love to hear from you. Feel free to contact us. We'll do everything we can to respond quickly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Details */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6 uppercase tracking-wide">Details</h3>
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center shrink-0">
                    <MapPinIcon className="w-5 h-5 text-brand-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Anss Studio Pvt. Ltd.</p>
                    <p className="text-sm text-gray-500 mt-0.5">B-146 West Vinod Nagar</p>
                    <p className="text-sm text-gray-500">Opposite Press Apartment</p>
                    <p className="text-sm text-gray-500">Delhi - 110092</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center shrink-0">
                    <PhoneIcon className="w-5 h-5 text-brand-600" />
                  </div>
                  <div>
                    <a href="tel:+919540642600" className="text-sm text-gray-700 hover:text-brand-600 transition-colors block">+91 9540642600</a>
                    <a href="tel:+919599349600" className="text-sm text-gray-700 hover:text-brand-600 transition-colors block">+91 9599349600</a>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center shrink-0">
                    <EnvelopeIcon className="w-5 h-5 text-brand-600" />
                  </div>
                  <a href="mailto:hello@quickpik.in" className="text-sm text-gray-700 hover:text-brand-600 transition-colors">
                    hello@quickpik.in
                  </a>
                </div>
              </div>
            </div>

            {/* Contact form */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6 uppercase tracking-wide">Send a Message</h3>
              <form className="space-y-4" onSubmit={e => e.preventDefault()}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                  <input type="text" className="input-field" placeholder="John Smith" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input type="email" className="input-field" placeholder="you@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea rows={4} className="input-field resize-none" placeholder="How can we help you?" />
                </div>
                <button type="submit" className="btn-primary w-full">Send Message</button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-white font-extrabold text-xl">QuickPik</span>
            <p className="text-xs mt-1">by Anss Studio Pvt. Ltd.</p>
          </div>
          <div className="flex gap-6 text-sm">
            <a href="#features"     className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
            <Link href="/pricing"   className="hover:text-white transition-colors">Pricing</Link>
            <a href="#contact"      className="hover:text-white transition-colors">Contact</a>
          </div>
          <p className="text-xs">© {new Date().getFullYear()} QuickPik. All rights reserved.</p>
        </div>
      </footer>

    </div>
  )
}
