// @ts-nocheck
import { NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const authClient = await createSupabaseServerClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: authProfile } = await authClient.from('profiles').select('role').eq('id', user.id).single()
  if (authProfile?.role !== 'manager') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

  const db = createSupabaseServiceClient()

  // Buscar o feedback para saber o dono e o status atual
  const { data: fb } = await db.from('feedback').select('intern_id, status').eq('id', id).single()
  if (!fb) return NextResponse.json({ error: 'Feedback não encontrado' }, { status: 404 })

  // Marca como implementado (se ainda não estava) e concede +50 pts
  const alreadyHighlighted = fb.status === 'implemented'

  await db.from('feedback').update({ status: 'implemented' }).eq('id', id)

  if (!alreadyHighlighted) {
    const { data: internProfile } = await db.from('profiles').select('points, role').eq('id', fb.intern_id).single()
    if (internProfile?.role === 'intern') {
      await db.from('profiles').update({ points: (internProfile.points ?? 0) + 50 }).eq('id', fb.intern_id)
    }
  }

  return NextResponse.json({ ok: true, points_awarded: alreadyHighlighted ? 0 : 50 })
}
