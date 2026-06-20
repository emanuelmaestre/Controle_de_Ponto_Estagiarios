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

export async function PATCH(req: Request) {
  const authClient = await createSupabaseServerClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: profile } = await authClient.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'manager') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const body = await req.json()
  const db = createSupabaseServiceClient()
  const { data, error } = await db
    .from('feedback')
    .update({ status: body.status, admin_reply: body.admin_reply ?? null })
    .eq('id', body.id)
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ feedback: data })
}
