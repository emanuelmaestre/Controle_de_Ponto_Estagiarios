import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { requireManager } from '@/lib/route-auth'

export const dynamic = 'force-dynamic'

const systemUpdateSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(3).max(1000),
  type: z.enum(['feature', 'fix', 'improvement', 'announcement']).optional(),
  module: z.string().trim().max(80).optional().nullable(),
  details: z.string().trim().max(4000).optional().nullable(),
})

const deleteSystemUpdateSchema = z.object({
  id: z.string().uuid(),
})

export async function GET() {
  const auth = await requireManager()
  if (!auth.ok) return auth.response

  const db = createSupabaseServiceClient()
  const { data, error } = await db
    .from('system_updates')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ updates: data ?? [] })
}

export async function POST(req: Request) {
  const auth = await requireManager()
  if (!auth.ok) return auth.response

  const parsed = systemUpdateSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados invalidos' }, { status: 400 })
  }

  const db = createSupabaseServiceClient()
  const { data, error } = await db.from('system_updates').insert({
    title: parsed.data.title,
    description: parsed.data.description,
    type: parsed.data.type ?? 'feature',
    module: parsed.data.module ?? null,
    details: parsed.data.details ?? null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ update: data })
}

export async function DELETE(req: Request) {
  const auth = await requireManager()
  if (!auth.ok) return auth.response

  const parsed = deleteSystemUpdateSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'ID invalido' }, { status: 400 })
  }

  const db = createSupabaseServiceClient()
  const { error } = await db.from('system_updates').delete().eq('id', parsed.data.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ ok: true })
}
