import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const EMAILS_TO_FIX = [
  'flaviamariaeng.agro@gmail.com',
  'olavogassis.agro@gmail.com',
  'asilvarodrigues123@gmail.com',
  'soaresdearaujoanavitoria@gmail.com',
]

export async function POST() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'manager') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { data, error } = await supabase
    .from('profiles')
    .update({ role: 'intern', is_active: true })
    .in('email', EMAILS_TO_FIX)
    .select('full_name, email')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ fixed: data?.length, users: data })
}
