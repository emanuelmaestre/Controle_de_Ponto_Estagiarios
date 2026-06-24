import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server'
import { FrequenciaIndividual } from '@/components/pdf/FrequenciaIndividual'
import { minutesToHours, formatDate, formatTime } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  // Só admins
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Não autenticado', { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (profile?.role !== 'manager') return new NextResponse('Sem permissão', { status: 403 })

  const { searchParams } = new URL(req.url)
  const internId  = searchParams.get('intern')
  const startDate = searchParams.get('start')  // YYYY-MM-DD
  const endDate   = searchParams.get('end')    // YYYY-MM-DD

  if (!internId) return new NextResponse('intern obrigatório', { status: 400 })

  const db = createSupabaseServiceClient()

  // Dados do estagiário
  const { data: intern } = await db
    .from('profiles').select('full_name').eq('id', internId).maybeSingle()

  // Registros do período
  let query = db
    .from('time_records')
    .select('id, clock_in, clock_out, duration_minutes, status, activities!activities_time_record_id_fkey(description)')
    .eq('intern_id', internId)
    .order('clock_in', { ascending: true })

  if (startDate) query = query.gte('clock_in', `${startDate}T00:00:00`)
  if (endDate)   query = query.lte('clock_in', `${endDate}T23:59:59`)

  const { data: rawRecords } = await query

  type RawRecord = {
    id: string; clock_in: string; clock_out: string | null
    duration_minutes: number | null; status: string
    activities: { description: string }[]
  }

  const records = ((rawRecords ?? []) as unknown as RawRecord[]).map(r => ({
    date:       formatDate(r.clock_in),
    clockIn:    formatTime(r.clock_in),
    clockOut:   r.clock_out ? formatTime(r.clock_out) : null,
    duration:   r.duration_minutes ? minutesToHours(r.duration_minutes) : '—',
    status:     r.status as 'approved' | 'pending' | 'rejected',
    activities: r.activities.map(a => a.description),
  }))

  const totalMin      = ((rawRecords ?? []) as unknown as RawRecord[]).reduce((s, r) => s + (r.duration_minutes ?? 0), 0)
  const totalSessions = records.length
  const approved      = records.filter(r => r.status === 'approved').length

  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('pt-BR') : '—'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdf = React.createElement(FrequenciaIndividual as any, {
    studentName:      intern?.full_name ?? 'Estagiário',
    period:           { start: fmtDate(startDate), end: fmtDate(endDate) },
    records,
    totalHours:       minutesToHours(totalMin),
    totalSessions,
    approvedSessions: approved,
  })

  const buffer = Buffer.from(await renderToBuffer(pdf as any))

  const filename = `frequencia_${(intern?.full_name ?? 'estagiario').toLowerCase().replace(/\s+/g, '_')}.pdf`

  return new NextResponse(buffer, {
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
