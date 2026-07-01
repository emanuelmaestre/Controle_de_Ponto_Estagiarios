import { NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server'
import { createLogger } from '@/lib/logger'

const logger = createLogger('clock/auto-out')

export async function POST() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const db = createSupabaseServiceClient()

  const { data: openRecord } = await db
    .from('time_records')
    .select('id, clock_in, intern_id')
    .eq('intern_id', user.id)
    .is('clock_out', null)
    .maybeSingle()

  if (!openRecord) {
    return NextResponse.json({ ok: true, message: 'Nenhum registro em aberto' })
  }

  const now = new Date()

  const { error } = await db
    .from('time_records')
    .update({
      clock_out: now.toISOString(),
      notes: 'auto_close_geo',
    })
    .eq('id', openRecord.id)
    .eq('intern_id', user.id)

  if (error) {
    logger.error('Falha ao fechar registro automaticamente', error, { userId: user.id, recordId: openRecord.id })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const durationMinutes = Math.round(
    (now.getTime() - new Date(openRecord.clock_in).getTime()) / 60_000,
  )
  logger.info('Registro fechado automaticamente por geofence', { userId: user.id, recordId: openRecord.id, durationMinutes })

  return NextResponse.json({ ok: true, recordId: openRecord.id })
}
