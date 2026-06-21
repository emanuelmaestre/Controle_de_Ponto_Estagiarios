import { NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server'
import { createLogger } from '@/lib/logger'

const logger = createLogger('api.intern.reports')
const SP_OFFSET = 3 * 60 * 60 * 1000

function getMonthRange(month: string | null) {
  if (month) {
    const [year, mon] = month.split('-').map(Number)
    return {
      startDate: new Date(Date.UTC(year, mon - 1, 1, 0, 0, 0) + SP_OFFSET).toISOString(),
      endDate: new Date(Date.UTC(year, mon, 1, 0, 0, 0) + SP_OFFSET).toISOString(),
      label: new Date(Date.UTC(year, mon - 1, 15)).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
    }
  }

  const now = new Date()
  const year = now.getFullYear()
  const mon = now.getMonth() + 1

  return {
    startDate: new Date(Date.UTC(year, mon - 1, 1, 0, 0, 0) + SP_OFFSET).toISOString(),
    endDate: new Date(Date.UTC(year, mon, 1, 0, 0, 0) + SP_OFFSET).toISOString(),
    label: now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('report') ?? 'attendance'
    const { startDate, endDate, label } = getMonthRange(searchParams.get('month'))

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, email, course, nickname, points, level, streak_days, photo_url, created_at, total_hours_required')
      .eq('id', user.id)
      .single()

    if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 })

    const { data: records, error: recordsError } = await supabase
      .from('time_records')
      .select('id, clock_in, clock_out, duration_minutes, status, is_late')
      .eq('intern_id', user.id)
      .gte('clock_in', startDate)
      .lt('clock_in', endDate)
      .order('clock_in', { ascending: false })

    if (recordsError) return NextResponse.json({ error: recordsError.message }, { status: 500 })

    const recordIds = (records ?? []).map(record => record.id)
    const activitiesByRecord = new Map<string, string[]>()

    if (recordIds.length > 0) {
      const { data: activities, error: activitiesError } = await supabase
        .from('activities')
        .select('time_record_id, description')
        .in('time_record_id', recordIds)

      if (activitiesError) return NextResponse.json({ error: activitiesError.message }, { status: 500 })

      for (const activity of activities ?? []) {
        const current = activitiesByRecord.get(activity.time_record_id) ?? []
        current.push(activity.description)
        activitiesByRecord.set(activity.time_record_id, current)
      }
    }

    const { data: allRecords, error: allRecordsError } = await supabase
      .from('time_records')
      .select('duration_minutes, status')
      .eq('intern_id', user.id)
      .eq('status', 'approved')

    if (allRecordsError) return NextResponse.json({ error: allRecordsError.message }, { status: 500 })

    const approvedRecords = (records ?? []).filter(record => record.status === 'approved')
    const totalWorkedMinutes = (allRecords ?? []).reduce((total, record) => total + (record.duration_minutes ?? 0), 0)
    const workloadMinutes = (profile.total_hours_required ?? 0) * 60
    const remainingMinutes = Math.max(0, workloadMinutes - totalWorkedMinutes)
    const lateCount = approvedRecords.filter(record => record.is_late).length
    const onTimeCount = approvedRecords.filter(record => !record.is_late).length
    const punctualityRate = approvedRecords.length > 0
      ? Math.round((onTimeCount / approvedRecords.length) * 100)
      : 100

    const { data: achievements, error: achievementsError } = await supabase
      .from('achievements')
      .select('type, unlocked_at')
      .eq('intern_id', user.id)
      .order('unlocked_at', { ascending: false })

    if (achievementsError) return NextResponse.json({ error: achievementsError.message }, { status: 500 })

    const service = createSupabaseServiceClient()
    const { data: allInternPoints, error: rankingError } = await service
      .from('profiles')
      .select('id, points')
      .eq('role', 'intern')
      .eq('is_active', true)
      .order('points', { ascending: false })

    if (rankingError) return NextResponse.json({ error: rankingError.message }, { status: 500 })

    const rankingPosition = (allInternPoints ?? []).findIndex(intern => intern.id === user.id) + 1
    const recordsWithActivities = (records ?? []).map(record => ({
      ...record,
      activities: activitiesByRecord.get(record.id) ?? [],
    }))

    return NextResponse.json({
      profile,
      reportType,
      period: { startDate, endDate, label },
      records: recordsWithActivities,
      stats: {
        totalMinutes: approvedRecords.reduce((total, record) => total + (record.duration_minutes ?? 0), 0),
        totalSessions: records?.length ?? 0,
        approvedSessions: approvedRecords.length,
        lateCount,
        onTimeCount,
        punctualityRate,
        totalWorkedMinutes,
        remainingMinutes,
        workloadMinutes,
      },
      achievements: achievements ?? [],
      ranking: { position: rankingPosition, total: allInternPoints?.length ?? 0 },
    })
  } catch (err) {
    logger.error('request failed', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
