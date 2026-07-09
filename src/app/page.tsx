'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  QrCodeIcon, FaceSmileIcon, ArrowDownTrayIcon, ShieldCheckIcon,
  BoltIcon, PhotoIcon, DevicePhoneMobileIcon, SparklesIcon,
  ChevronLeftIcon, ChevronRightIcon, MapPinIcon, PhoneIcon, EnvelopeIcon,
} from '@heroicons/react/24/outline'

// ── Slider ────────────────────────────────────────────────────────────────────
const SLIDES = [
  { src: '/slider/banner-01.jpeg', tag: 'Your Best Moments, Perfectly Framed.' },
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
    <section className="relative w-full h-[78vh] min-h-[450px] overflow-hidden bg-white">
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

// ── useInView ─────────────────────────────────────────────────────────────────
function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect() } },
      { threshold }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])
  return { ref, inView }
}

// ── Features ──────────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: FaceSmileIcon,        title: 'AI Face Recognition', desc: 'AWS-powered AI instantly matches guests to their photos with 99%+ accuracy.',           color: 'bg-blue-100 text-blue-600',    bar: 'bg-blue-500',   bg: 'from-white to-blue-50',   glow: 'rgba(59,130,246,0.30)' },
  { icon: QrCodeIcon,           title: 'QR Code Access',      desc: 'One unique QR code per event. Display it anywhere — print, screen, or share digitally.', color: 'bg-purple-100 text-purple-600', bar: 'bg-purple-500', bg: 'from-white to-purple-50', glow: 'rgba(168,85,247,0.30)' },
  { icon: DevicePhoneMobileIcon, title: 'No App Needed',      desc: 'Guests open a link in any browser. No downloads, no sign-ups, no friction.',            color: 'bg-green-100 text-green-600',   bar: 'bg-green-500',  bg: 'from-white to-green-50',  glow: 'rgba(34,197,94,0.30)'  },
  { icon: BoltIcon,             title: 'Instant Delivery',    desc: 'Photos appear in seconds after selfie upload — not hours, not days.',                    color: 'bg-amber-100 text-amber-600',   bar: 'bg-amber-500',  bg: 'from-white to-amber-50',  glow: 'rgba(245,158,11,0.30)' },
  { icon: ShieldCheckIcon,      title: 'Secure & Private',    desc: 'Each guest sees only their own photos. Sessions expire in 24 hours automatically.',      color: 'bg-red-100 text-red-600',       bar: 'bg-red-500',    bg: 'from-white to-red-50',    glow: 'rgba(239,68,68,0.30)'  },
  { icon: PhotoIcon,            title: 'Bulk Upload',         desc: 'Upload hundreds of photos at once. Duplicates are auto-detected and rejected.',          color: 'bg-teal-100 text-teal-600',     bar: 'bg-teal-500',   bg: 'from-white to-teal-50',   glow: 'rgba(20,184,166,0.30)' },
  { icon: SparklesIcon,         title: 'Custom Branding',     desc: 'Add your studio logo and business name. Every touchpoint reflects your brand.',          color: 'bg-pink-100 text-pink-600',     bar: 'bg-pink-500',   bg: 'from-white to-pink-50',   glow: 'rgba(236,72,153,0.30)' },
  { icon: ArrowDownTrayIcon,    title: 'Guest Downloads',     desc: 'Guests can download full-resolution photos straight to their device.',                   color: 'bg-indigo-100 text-indigo-600', bar: 'bg-indigo-500', bg: 'from-white to-indigo-50', glow: 'rgba(99,102,241,0.30)' },
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

function FeaturesSection() {
  const { ref, inView } = useInView(0.1)
  return (
    <section id="features" className="features-bg py-28 relative overflow-hidden">
      {/* Soft radial overlay to blend the dot grid at edges */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/60" />

      <div className="relative max-w-6xl mx-auto px-6">
        {/* Heading */}
        <div className={`text-center mb-16 transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <span className="inline-block bg-brand-100 text-brand-700 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
            Why QuickPik
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 leading-tight">
            Everything your event needs
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto text-lg">
            From AI face recognition to instant delivery — QuickPik handles every step of event photo sharing.
          </p>
        </div>

        {/* Cards grid */}
        <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              style={{ transitionDelay: `${i * 80}ms` }}
              className={`transition-all duration-500 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
            >
              <div
                className={`feature-card group relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br ${f.bg} shadow-sm h-full`}
                style={{ '--card-glow': f.glow } as React.CSSProperties}
              >
                {/* Colored top bar */}
                <div className={`h-1.5 ${f.bar}`} />

                {/* Watermark number */}
                <span className="absolute top-3 right-4 text-7xl font-black text-gray-100 select-none leading-none pointer-events-none">
                  {String(i + 1).padStart(2, '0')}
                </span>

                <div className="relative p-6 pt-5">
                  {/* Icon with pulse ring */}
                  <div className="relative w-16 h-16 mb-5">
                    <div className={`absolute inset-0 rounded-xl ${f.bar} feature-icon-ring opacity-30`} />
                    <div className={`relative w-full h-full rounded-xl flex items-center justify-center ${f.color} transition-transform duration-300 group-hover:scale-110`}>
                      <f.icon className="w-8 h-8" />
                    </div>
                  </div>

                  <h3 className="font-bold text-gray-900 text-base mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-2 flex items-center justify-between">
          <Image src="/logo.jpeg" alt="QuickPik" width={140} height={48} className="object-contain" />
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
      <FeaturesSection />

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

          {/* Demo video */}
          <div className="mt-16 rounded-2xl overflow-hidden shadow-xl border border-gray-100 max-w-3xl mx-auto">
            <video
              src="/how-it-works.mp4"
              controls
              playsInline
              className="w-full"
              poster=""
            />
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
            <Image src="/logo.jpeg" alt="QuickPik" width={120} height={40} className="object-contain brightness-0 invert" />
            <p className="text-xs mt-1 text-gray-400">by Anss Studio Pvt. Ltd.</p>
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
