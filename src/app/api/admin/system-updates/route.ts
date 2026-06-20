// @ts-nocheck
import { NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const authClient = await createSupabaseServerClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const db = createSupabaseServiceClient()
  const { data } = await db.from('system_updates').select('*').order('created_at', { ascending: false })
  return NextResponse.json({ updates: data ?? [] })
}

export async function POST(req: Request) {
  const authClient = await createSupabaseServerClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: profile } = await authClient.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'manager') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const body = await req.json()
  const db = createSupabaseServiceClient()
  const { data, error } = await db.from('system_updates').insert({
    title: body.title, description: body.description, type: body.type ?? 'feature',
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ update: data })
}

export async function DELETE(req: Request) {
  const authClient = await createSupabaseServerClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: profile } = await authClient.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'manager') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const { id } = await req.json()
  const db = createSupabaseServiceClient()
  await db.from('system_updates').delete().eq('id', id)
  return NextResponse.json({ ok: true })
}
