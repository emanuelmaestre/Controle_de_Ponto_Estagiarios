import { redirect } from 'next/navigation'
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server'
import ReportsClient from './ReportsClient'

export const dynamic = 'force-dynamic'

export default async function ReportsPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const db = createSupabaseServiceClient()
  const { data: internsRaw } = await db
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'intern')
    .eq('is_active', true)
    .order('full_name', { ascending: true })

  const interns = (internsRaw ?? []).map(i => ({
    id:   i.id,
    name: i.full_name ?? '—',
  }))

  return <ReportsClient interns={interns} />
}
