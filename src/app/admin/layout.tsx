import { redirect } from 'next/navigation'
import { getServerUser, getServerProfile } from '@/lib/supabase/cached'
import AdminSidebar from '@/components/AdminSidebar'
import { AdminNotificationBellMobile } from '@/components/AdminNotificationBell'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: { user } } = await getServerUser()
  if (!user) redirect('/login')

  const { data: profile } = await getServerProfile(user.id)
  if (!profile?.is_active || profile?.role !== 'manager') redirect('/dashboard')

  const fullName = profile?.full_name ?? 'Gerente'
  const initials = fullName.split(' ').slice(0, 2).map((n: string) => n[0]).join('')

  return (
    <div className="flex flex-col md:flex-row" style={{ height: '100dvh', overflow: 'hidden', background: 'var(--bg)' }}>
      <AdminSidebar fullName={fullName} initials={initials} />
      {/* Content area — pb-16 on mobile to clear fixed bottom nav */}
      <div className="flex-1 min-w-0 flex flex-col pb-16 md:pb-0 min-h-0 relative" style={{ overflow: 'hidden' }}>
        {/* Sino de pendências — fixo no canto superior direito em todas as páginas */}
        <div className="absolute top-4 right-4 z-50 md:top-5 md:right-6">
          <AdminNotificationBellMobile />
        </div>
        {children}
      </div>
    </div>
  )
}
