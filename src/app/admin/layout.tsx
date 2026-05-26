import { redirect } from 'next/navigation'
import { getServerUser, getServerProfile } from '@/lib/supabase/cached'
import PageTransition from '@/components/ui/PageTransition'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: { user } } = await getServerUser()
  if (!user) redirect('/login')

  const { data: profile } = await getServerProfile(user.id)

  if (!profile?.is_active || profile?.role !== 'manager') {
    redirect('/dashboard')
  }

  return <PageTransition>{children}</PageTransition>
}
