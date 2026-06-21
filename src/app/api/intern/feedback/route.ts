import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server'
import { createLogger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const logger = createLogger('api.intern.feedback')

const feedbackSchema = z.object({
  category: z.enum(['suggestion', 'bug', 'praise', 'other']).optional(),
  message: z.string().trim().min(10).max(2000),
})

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const { data, error } = await supabase
    .from('feedback')
    .select('id, category, message, status, admin_reply, created_at')
    .eq('intern_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ feedbacks: data ?? [] })
}

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, points')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'intern') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const parsed = feedbackSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Mensagem muito curta (minimo 10 caracteres)' }, { status: 400 })
    }

    const service = createSupabaseServiceClient()
    const { data, error } = await service
      .from('feedback')
      .insert({
        intern_id: user.id,
        category: parsed.data.category ?? 'suggestion',
        message: parsed.data.message,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    await service
      .from('profiles')
      .update({ points: (profile.points ?? 0) + 10 })
      .eq('id', user.id)

    return NextResponse.json({ feedback: data, points_awarded: 10 })
  } catch (err) {
    logger.error('request failed', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
