import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const schemaPost = z.object({
  recordId:    z.string().uuid(),
  description: z.string().trim().min(3, 'Descreva ao menos 3 caracteres').max(1000),
})

const schemaPatch = z.object({
  activityId:  z.string().uuid(),
  description: z.string().trim().min(3, 'Descreva ao menos 3 caracteres').max(1000),
})

// Normaliza texto: converte ALL CAPS para Sentence case e ajusta pontuação básica
function normalizar(texto: string): string {
  const trimmed = texto.trim()
  // Se o texto está todo em maiúsculas, converte para Sentence case
  if (trimmed === trimmed.toUpperCase() && /[A-ZÁÉÍÓÚÃÕÂÊÎÔÛÇ]/.test(trimmed)) {
    const sentenceCase = trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase()
    return sentenceCase
  }
  // Caso contrário, apenas garante que começa com maiúscula
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
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

  // Verifica que a atividade pertence a um registro do próprio aluno
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
