'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
  ChartBarIcon, UsersIcon, ArrowLeftIcon, ArrowRightStartOnRectangleIcon,
} from '@heroicons/react/24/outline'

const NAV = [
  { href: '/admin',           label: 'Overview',  icon: ChartBarIcon },
  { href: '/admin/customers', label: 'Customers', icon: UsersIcon },
]

export default function AdminSidebar({ name }: { name: string }) {
  const pathname = usePathname()
  const router   = useRouter()

  async function signOut() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <aside className="w-60 shrink-0 bg-white border-r border-gray-200 flex flex-col min-h-screen">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-gray-100">
        <Image src="/logo.jpeg" alt="QuickPik" width={130} height={44} className="object-contain" />
        <span className="text-[11px] font-semibold text-brand-600 uppercase tracking-widest mt-1 block">Admin Portal</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${active ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
              <Icon className="w-5 h-5 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-gray-100 space-y-1">
        <div className="px-3 py-2 text-xs text-gray-400 truncate">{name}</div>
        <Link href="/dashboard"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
          <ArrowLeftIcon className="w-5 h-5 shrink-0" />
          Back to Dashboard
        </Link>
        <button onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
          <ArrowRightStartOnRectangleIcon className="w-5 h-5 shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
