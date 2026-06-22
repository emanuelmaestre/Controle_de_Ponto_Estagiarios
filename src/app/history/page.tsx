import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import MobileOnlyGuard from '@/components/MobileOnlyGuard'
import HistoryClient from './HistoryClient'
import type { ComponentProps } from 'react'

export const dynamic = 'force-dynamic'

export default async function HistoryPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('total_hours_required, role, full_name')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.role === 'manager') redirect('/admin')

  const since = new Date()
  since.setDate(since.getDate() - 60)

  const { data: recordsRaw } = await supabase
    .from('time_records')
    .select('id, clock_in, clock_out, duration_minutes, status, rejection_reason, notes, activities!activities_time_record_id_fkey (id, description, created_at)')
    .eq('intern_id', user.id)
    .gte('clock_in', since.toISOString())
    .order('clock_in', { ascending: false })

  const { data: monthData } = await supabase
    .from('v_monthly_hours')
    .select('total_minutes, approved_sessions')
    .eq('intern_id', user.id)
    .gte('month', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
    .maybeSingle()

  return (
    <MobileOnlyGuard>
      <HistoryClient
        records={(recordsRaw ?? []) as unknown as Parameters<typeof HistoryClient>[0]['records']}
        monthMinutes={monthData?.total_minutes ?? 0}
        approvedSessions={monthData?.approved_sessions ?? 0}
        totalHoursRequired={profile?.total_hours_required ?? 120}
        userName={profile?.full_name ?? ''}
      />
    </MobileOnlyGuard>
  )
}
