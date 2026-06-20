// @ts-nocheck
import { NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data } = await supabase
    .from('feedback')
    .select('id, category, message, status, admin_reply, created_at')
    .eq('intern_id', user.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ feedbacks: data ?? [] })
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role, points').eq('id', user.id).single()
  if (profile?.role !== 'intern') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const body = await req.json()
  if (!body.message || body.message.trim().length < 10)
    return NextResponse.json({ error: 'Mensagem muito curta (mínimo 10 caracteres)' }, { status: 400 })

  const service = createSupabaseServiceClient()

  const { data, error } = await service.from('feedback').insert({
    intern_id: user.id,
    category: body.category ?? 'suggestion',
    message: body.message.trim(),
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // +10 pts por enviar feedback
  await service
    .from('profiles')
    .update({ points: (profile.points ?? 0) + 10 })
    .eq('id', user.id)

  return NextResponse.json({ feedback: data, points_awarded: 10 })
}
