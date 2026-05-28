import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import ReportsClient from './ReportsClient'

export const dynamic = 'force-dynamic'

export default async function ReportsPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return <ReportsClient />
}
