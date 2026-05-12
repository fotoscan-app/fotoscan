'use client'
import Link from 'next/link'
import { PaintBrushIcon, UserCircleIcon } from '@heroicons/react/24/outline'

const sections = [
  {
    href: '/dashboard/settings/branding',
    icon: PaintBrushIcon,
    title: 'Branding',
    desc: 'Add your logo and business name. These appear on every guest page.',
  },
]

export default function SettingsPage() {
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Settings</h1>
      <div className="space-y-4">
        {sections.map(s => (
          <Link key={s.href} href={s.href} className="card p-6 flex items-center gap-4 hover:shadow-md transition-shadow block">
            <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center shrink-0">
              <s.icon className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{s.title}</p>
              <p className="text-sm text-gray-500">{s.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
