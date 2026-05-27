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
    <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden', background: 'var(--bg)' }}>
      <AdminSidebar fullName={fullName} initials={initials} pending={pendingCount} />
      <div style={{ flex: 1, minWidth: 0, height: '100dvh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  )
}
