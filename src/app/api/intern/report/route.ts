import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server'
import { FrequenciaIndividual } from '@/components/pdf/FrequenciaIndividual'
import { minutesToHours, formatDate, formatTime } from '@/lib/utils'
import { getLevelTitle } from '@/lib/gamification'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Não autenticado', { status: 401 })

  const { searchParams } = new URL(req.url)
  const startDate = searchParams.get('start')
  const endDate   = searchParams.get('end')

  const db = createSupabaseServiceClient()

  const { data: profile } = await db
    .from('profiles').select('full_name, course, internship_start, level').eq('id', user.id).maybeSingle()

  let query = db
    .from('time_records')
    .select('id, clock_in, clock_out, duration_minutes, status, activities!activities_time_record_id_fkey(description)')
    .eq('intern_id', user.id)
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
  const approved      = records.filter(r => r.status === 'approved').length

  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('pt-BR') : '—'

  const periodLabel = startDate
    ? new Date(startDate + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    : undefined

  const rankTitle = getLevelTitle((profile as any)?.level ?? 1, 'M')

  const pdf = React.createElement(FrequenciaIndividual as any, {
    studentName:      profile?.full_name ?? 'Estagiário',
    course:           (profile as any)?.course ?? undefined,
    title:            rankTitle,
    internshipStart:  (profile as any)?.internship_start
                        ? fmtDate((profile as any).internship_start) : undefined,
    period:           { start: fmtDate(startDate), end: fmtDate(endDate) },
    periodLabel,
    records,
    totalHours:       minutesToHours(totalMin),
    totalSessions:    records.length,
    approvedSessions: approved,
    institutionName:  'Controle de Ponto',
  })

  const buffer = Buffer.from(await renderToBuffer(pdf as any))
  const filename = `frequencia_${(profile?.full_name ?? 'estagiario').toLowerCase().replace(/\s+/g, '_')}.pdf`

  return new NextResponse(buffer, {
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
