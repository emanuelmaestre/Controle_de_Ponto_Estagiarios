import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { formatFullName } from '@/lib/utils'

export async function POST() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'manager') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, full_name, course')
    .eq('role', 'intern')
    .not('course', 'is', null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const updated = []
  for (const p of profiles ?? []) {
    const normalized = formatFullName(p.course!)
    if (normalized !== p.course) {
      await supabase.from('profiles').update({ course: normalized }).eq('id', p.id)
      updated.push({ name: p.full_name, before: p.course, after: normalized })
    }
  }

  return NextResponse.json({ updated: updated.length, changes: updated })
}
