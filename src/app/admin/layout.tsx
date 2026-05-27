import { redirect } from 'next/navigation'
import { getServerUser, getServerProfile } from '@/lib/supabase/cached'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import AdminSidebar from '@/components/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: { user } } = await getServerUser()
  if (!user) redirect('/login')

  const { data: profile } = await getServerProfile(user.id)
  if (!profile?.is_active || profile?.role !== 'manager') redirect('/dashboard')

  // Pending count for badge
  const supabase = await createSupabaseServerClient()
  const { data: pending } = await supabase.from('v_pending_approvals').select('id')
  const pendingCount = pending?.length ?? 0

  const fullName = profile?.full_name ?? 'Gerente'
  const initials = fullName.split(' ').slice(0, 2).map((n: string) => n[0]).join('')

  return (
    <div className="flex flex-col md:flex-row" style={{ height: '100dvh', overflow: 'hidden', background: 'var(--bg)' }}>
      <AdminSidebar fullName={fullName} initials={initials} pending={pendingCount} />
      {/* Content area — pb-16 on mobile to clear fixed bottom nav */}
      <div className="flex-1 min-w-0 flex flex-col pb-16 md:pb-0 min-h-0" style={{ overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  )
}
