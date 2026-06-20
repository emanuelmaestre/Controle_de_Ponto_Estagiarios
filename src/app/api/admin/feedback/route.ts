// @ts-nocheck
import { NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const authClient = await createSupabaseServerClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: profile } = await authClient.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'manager') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const db = createSupabaseServiceClient()
  const { data } = await db
    .from('feedback')
    .select('*, profiles(full_name, photo_url)')
    .order('created_at', { ascending: false })

  return NextResponse.json({ feedbacks: data ?? [] })
}

export async function POST(req: Request) {
  const authClient = await createSupabaseServerClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: profile } = await authClient.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'manager') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const body = await req.json()
  if (!body.message || body.message.trim().length < 10)
    return NextResponse.json({ error: 'Mensagem muito curta (mínimo 10 caracteres)' }, { status: 400 })

  const db = createSupabaseServiceClient()
  const { data, error } = await db.from('feedback').insert({
    intern_id: user.id,
    category: body.category ?? 'suggestion',
    message: body.message.trim(),
    status: 'new',
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ feedback: data })
}

export async function PATCH(req: Request) {
  const authClient = await createSupabaseServerClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: profile } = await authClient.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'manager') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const body = await req.json()
  const db = createSupabaseServiceClient()

  // Buscar status anterior para saber se está mudando para 'implemented'
  const { data: existing } = await db.from('feedback').select('status, intern_id').eq('id', body.id).single()

  const { data, error } = await db
    .from('feedback')
    .update({ status: body.status, admin_reply: body.admin_reply ?? null })
    .eq('id', body.id)
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // +25 pts ao estagiário quando feedback é marcado como implementado (apenas na primeira vez)
  if (body.status === 'implemented' && existing?.status !== 'implemented' && existing?.intern_id) {
    const { data: internProfile } = await db.from('profiles').select('points, role').eq('id', existing.intern_id).single()
    if (internProfile?.role === 'intern') {
      await db.from('profiles').update({ points: (internProfile.points ?? 0) + 25 }).eq('id', existing.intern_id)
    }
  }

  return NextResponse.json({ feedback: data })
}
