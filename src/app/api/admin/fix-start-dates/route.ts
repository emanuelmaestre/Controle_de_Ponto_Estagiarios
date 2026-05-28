import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'manager') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  // Busca todos os perfis sem data de início (exceto admin)
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, full_name, created_at, internship_start')
    .eq('role', 'intern')
    .is('internship_start', null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!profiles?.length) return NextResponse.json({ updated: 0, message: 'Todos já têm data de início.' })

  const results = []
  for (const p of profiles) {
    const startDate = p.created_at.slice(0, 10) // yyyy-mm-dd
    const { error: updateErr } = await supabase
      .from('profiles')
      .update({ internship_start: startDate })
      .eq('id', p.id)

    results.push({
      name: p.full_name,
      date: startDate,
      ok: !updateErr,
    })
  }

  return NextResponse.json({ updated: results.filter(r => r.ok).length, profiles: results })
}
