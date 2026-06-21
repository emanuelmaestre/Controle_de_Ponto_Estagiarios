import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { requireManager } from '@/lib/route-auth'

export const dynamic = 'force-dynamic'

const createFeedbackSchema = z.object({
  category: z.enum(['suggestion', 'bug', 'praise', 'other']).optional(),
  message: z.string().trim().min(10).max(2000),
})

const updateFeedbackSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['new', 'read', 'implemented', 'archived']),
  admin_reply: z.string().trim().max(2000).optional().nullable(),
})

export async function GET() {
  const auth = await requireManager()
  if (!auth.ok) return auth.response

  const db = createSupabaseServiceClient()
  const { data, error } = await db
    .from('feedback')
    .select('*, profiles(full_name, photo_url)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ feedbacks: data ?? [] })
}

export async function POST(req: Request) {
  const auth = await requireManager()
  if (!auth.ok) return auth.response

  const parsed = createFeedbackSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Mensagem muito curta (minimo 10 caracteres)' }, { status: 400 })
  }

  const db = createSupabaseServiceClient()
  const { data, error } = await db
    .from('feedback')
    .insert({
      intern_id: auth.user.id,
      category: parsed.data.category ?? 'suggestion',
      message: parsed.data.message,
      status: 'new',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ feedback: data })
}

export async function PATCH(req: Request) {
  const auth = await requireManager()
  if (!auth.ok) return auth.response

  const parsed = updateFeedbackSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'Dados invalidos' }, { status: 400 })

  const db = createSupabaseServiceClient()
  const { data: existing } = await db
    .from('feedback')
    .select('status, intern_id')
    .eq('id', parsed.data.id)
    .single()

  const { data, error } = await db
    .from('feedback')
    .update({
      status: parsed.data.status,
      admin_reply: parsed.data.admin_reply ?? null,
    })
    .eq('id', parsed.data.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  if (parsed.data.status === 'implemented' && existing?.status !== 'implemented' && existing?.intern_id) {
    const { data: internProfile } = await db
      .from('profiles')
      .select('points, role')
      .eq('id', existing.intern_id)
      .single()

    if (internProfile?.role === 'intern') {
      await db
        .from('profiles')
        .update({ points: (internProfile.points ?? 0) + 25 })
        .eq('id', existing.intern_id)
    }
  }

  return NextResponse.json({ feedback: data })
}
