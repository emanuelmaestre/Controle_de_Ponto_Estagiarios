import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const schema = z.object({
  recordId:    z.string().uuid(),
  description: z.string().trim().min(3, 'Descreva ao menos 3 caracteres').max(1000),
})

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { recordId, description } = parsed.data
  const db = createSupabaseServiceClient()

  // Garante que o registro pertence ao aluno e já tem clock_out
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
    .insert({ time_record_id: recordId, description })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ activity })
}
