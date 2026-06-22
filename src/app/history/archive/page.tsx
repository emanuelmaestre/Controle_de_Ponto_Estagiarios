import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import MobileOnlyGuard from '@/components/MobileOnlyGuard'
import ArchiveClient from './ArchiveClient'

export const dynamic = 'force-dynamic'

export default async function ArchivePage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, total_hours_required')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.role === 'manager') redirect('/admin')

  // Registros com mais de 60 dias, agrupados por mês
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 60)

  const { data: recordsRaw } = await supabase
    .from('time_records')
    .select('id, clock_in, clock_out, duration_minutes, status, rejection_reason, notes, activities!activities_time_record_id_fkey (id, description, created_at)')
    .eq('intern_id', user.id)
    .lt('clock_in', cutoff.toISOString())
    .order('clock_in', { ascending: false })

  return (
    <MobileOnlyGuard>
      <ArchiveClient
        records={(recordsRaw ?? []) as unknown as Parameters<typeof ArchiveClient>[0]['records']}
        userName={profile?.full_name ?? ''}
      />
    </MobileOnlyGuard>
  )
}
