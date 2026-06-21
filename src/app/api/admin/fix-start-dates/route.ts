import { NextResponse } from 'next/server'
import { requireManager } from '@/lib/route-auth'

export async function POST() {
  const auth = await requireManager()
  if (!auth.ok) return auth.response

  const { data: profiles, error } = await auth.supabase
    .from('profiles')
    .select('id, full_name, created_at, internship_start')
    .eq('role', 'intern')
    .is('internship_start', null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!profiles?.length) return NextResponse.json({ updated: 0, message: 'Todos ja tem data de inicio.' })

  const results = []
  for (const profile of profiles) {
    const startDate = profile.created_at.slice(0, 10)
    const { error: updateErr } = await auth.supabase
      .from('profiles')
      .update({ internship_start: startDate })
      .eq('id', profile.id)

    results.push({
      name: profile.full_name,
      date: startDate,
      ok: !updateErr,
    })
  }

  return NextResponse.json({
    updated: results.filter(result => result.ok).length,
    profiles: results,
  })
}
