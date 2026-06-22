import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const PONTOS_POR_ATIVIDADE = 5

const schemaPost = z.object({
  recordId:    z.string().uuid(),
  description: z.string().trim().min(3, 'Descreva ao menos 3 caracteres').max(1000),
})

const schemaPatch = z.object({
  activityId:  z.string().uuid(),
  description: z.string().trim().min(3, 'Descreva ao menos 3 caracteres').max(1000),
})

const schemaDelete = z.object({
  activityId: z.string().uuid(),
})

// Sempre salva em MAIÚSCULAS
function normalizar(texto: string): string {
  return texto.trim().toUpperCase()
}

async function getInternId(user: { id: string }, db: ReturnType<typeof createSupabaseServiceClient>) {
  return user.id
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const parsed = schemaPost.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { recordId, description } = parsed.data
  const db = createSupabaseServiceClient()

  const { data: record, error: recErr } = await db
    .from('time_records')
    .select('id, clock_out, intern_id')
    .eq('id', recordId)
    .eq('intern_id', user.id)
    .maybeSingle()

  if (recErr || !record) {
    return NextResponse.json({ error: 'Registro não encontrado' }, { status: 404 })
  }

  if (!record.clock_out) {
    return NextResponse.json({ error: 'Só é possível adicionar atividade após registrar a saída' }, { status: 400 })
  }

  const { data: activity, error } = await db
    .from('activities')
    .insert({ time_record_id: recordId, description: normalizar(description) })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Concede +5 pontos ao aluno
  const { data: profile } = await db.from('profiles').select('points').eq('id', user.id).maybeSingle()
  if (profile) {
    await db.from('profiles').update({ points: (profile.points ?? 0) + PONTOS_POR_ATIVIDADE }).eq('id', user.id)
  }

  return NextResponse.json({ activity })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const parsed = schemaPatch.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { activityId, description } = parsed.data
  const db = createSupabaseServiceClient()

  const { data: existing, error: findErr } = await db
    .from('activities')
    .select('id, time_record_id, time_records!inner(intern_id)')
    .eq('id', activityId)
    .maybeSingle()

  if (findErr || !existing) {
    return NextResponse.json({ error: 'Atividade não encontrada' }, { status: 404 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((existing.time_records as any)?.intern_id !== user.id) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const { data: activity, error } = await db
    .from('activities')
    .update({ description: normalizar(description) })
    .eq('id', activityId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ activity })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const parsed = schemaDelete.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { activityId } = parsed.data
  const db = createSupabaseServiceClient()

  const { data: existing, error: findErr } = await db
    .from('activities')
    .select('id, time_record_id, time_records!inner(intern_id)')
    .eq('id', activityId)
    .maybeSingle()

  if (findErr || !existing) {
    return NextResponse.json({ error: 'Atividade não encontrada' }, { status: 404 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((existing.time_records as any)?.intern_id !== user.id) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const { error } = await db.from('activities').delete().eq('id', activityId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Deduz -5 pontos ao excluir
  const { data: profile } = await db.from('profiles').select('points').eq('id', user.id).maybeSingle()
  if (profile) {
    await db.from('profiles').update({ points: Math.max(0, (profile.points ?? 0) - PONTOS_POR_ATIVIDADE) }).eq('id', user.id)
  }

  return NextResponse.json({ ok: true, pontosDebitados: PONTOS_POR_ATIVIDADE })
}
