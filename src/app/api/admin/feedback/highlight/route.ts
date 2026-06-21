import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { requireManager } from '@/lib/route-auth'

export const dynamic = 'force-dynamic'

const highlightSchema = z.object({
  id: z.string().uuid(),
})

export async function POST(req: Request) {
  const auth = await requireManager()
  if (!auth.ok) return auth.response

  const parsed = highlightSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'ID obrigatorio' }, { status: 400 })

  const db = createSupabaseServiceClient()
  const { data: feedback } = await db
    .from('feedback')
    .select('intern_id, status')
    .eq('id', parsed.data.id)
    .single()

  if (!feedback) return NextResponse.json({ error: 'Feedback nao encontrado' }, { status: 404 })

  const alreadyHighlighted = feedback.status === 'implemented'
  const { error } = await db
    .from('feedback')
    .update({ status: 'implemented' })
    .eq('id', parsed.data.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  if (!alreadyHighlighted) {
    const { data: internProfile } = await db
      .from('profiles')
      .select('points, role')
      .eq('id', feedback.intern_id)
      .single()

    if (internProfile?.role === 'intern') {
      await db
        .from('profiles')
        .update({ points: (internProfile.points ?? 0) + 50 })
        .eq('id', feedback.intern_id)
    }
  }

  return NextResponse.json({ ok: true, points_awarded: alreadyHighlighted ? 0 : 50 })
}
