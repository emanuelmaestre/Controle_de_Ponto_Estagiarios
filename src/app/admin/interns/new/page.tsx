import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import NewInternClient from './NewInternClient'

export const dynamic = 'force-dynamic'

export default async function NewInternPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return <NewInternClient />
}
