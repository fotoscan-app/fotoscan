import { redirect } from 'next/navigation'
import { getAdminUser } from '@/lib/admin-auth'
import AdminSidebar from './AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdminUser()
  if (!admin) redirect('/admin/login?error=unauthorized')

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar name={admin.name} />
      <main className="flex-1 overflow-auto p-8">
        {children}
      </main>
    </div>
  )
}
