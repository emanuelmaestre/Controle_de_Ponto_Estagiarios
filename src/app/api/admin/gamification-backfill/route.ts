import { NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/infra/supabase/server'
import { requireManager } from '@/lib/route-auth'

export async function POST() {
  const auth = await requireManager()
  if (!auth.ok) return auth.response

  const service = createSupabaseServiceClient()
  const { data, error } = await service.rpc('backfill_gamification')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
