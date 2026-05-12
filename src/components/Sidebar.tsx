'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Squares2X2Icon, PhotoIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon, CreditCardIcon,
} from '@heroicons/react/24/outline'

interface User {
  name: string; businessName?: string | null; logoKey?: string | null
}

const navItems = [
  { href: '/dashboard',           icon: Squares2X2Icon, label: 'Dashboard' },
  { href: '/dashboard/events',    icon: PhotoIcon,      label: 'Events' },
  { href: '/dashboard/billing',   icon: CreditCardIcon, label: 'Billing' },
  { href: '/dashboard/settings',  icon: Cog6ToothIcon,  label: 'Settings' },
]

export default function Sidebar({ user }: { user: User }) {
  const pathname = usePathname()
  const router = useRouter()

  async function logout() {
    await fetch('/api/auth/me', { method: 'DELETE' })
    router.push('/login')
  }

  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100">
        <span className="text-xl font-bold text-brand-600">QuickPik</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(item => {
          const active = item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}>
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User + logout */}
      <div className="px-3 py-4 border-t border-gray-100">
        <div className="px-3 py-2 mb-1">
          <p className="text-sm font-medium text-gray-900 truncate">{user.businessName || user.name}</p>
          <p className="text-xs text-gray-400 truncate">{user.name}</p>
        </div>
        <button onClick={logout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 w-full transition-colors">
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
          Log out
        </button>
      </div>
    </aside>
  )
}
