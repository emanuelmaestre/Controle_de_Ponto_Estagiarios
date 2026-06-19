// @ts-nocheck
import { NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server'
import { minutesToHours } from '@/lib/utils'

export async function GET(request: Request) {
  const authClient = await createSupabaseServerClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'NÃ£o autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const reportType = searchParams.get('report') ?? 'attendance'
  const month = searchParams.get('month')

  const supabase = createSupabaseServiceClient()
  const db = supabase as any
  const SP = 3 * 60 * 60 * 1000

  // PerÃ­odo
  let startDate: string
  let endDate: string
  let label = ''

  if (month) {
    const [year, mon] = month.split('-').map(Number)
    startDate = new Date(Date.UTC(year, mon - 1, 1, 0, 0, 0) + SP).toISOString()
    endDate   = new Date(Date.UTC(year, mon,     1, 0, 0, 0) + SP).toISOString()
    label = new Date(Date.UTC(year, mon - 1, 15)).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  } else {
    const now = new Date()
    const year = now.getFullYear()
    const mon = now.getMonth() + 1
    startDate = new Date(Date.UTC(year, mon - 1, 1, 0, 0, 0) + SP).toISOString()
    endDate   = new Date(Date.UTC(year, mon,     1, 0, 0, 0) + SP).toISOString()
    label = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  }

  // Perfil
  const { data: profile } = await db
    .from('profiles')
    .select('id, full_name, email, course, nickname, points, level, streak_days, photo_url, created_at, workload_hours')
    .eq('id', user.id)
    .single()

  // Registros do perÃ­odo
  const { data: records } = await db
    .from('time_records')
    .select('id, clock_in, clock_out, duration_minutes, status, activities, is_late')
    .eq('intern_id', user.id)
    .gte('clock_in', startDate)
    .lt('clock_in', endDate)
    .order('clock_in', { ascending: false })

  // Todos os registros para carga horÃ¡ria
  const { data: allRecords } = await db
    .from('time_records')
    .select('duration_minutes, status')
    .eq('intern_id', user.id)
    .eq('status', 'approved')

  const totalWorkedMinutes = allRecords?.reduce((a, r) => a + (r.duration_minutes ?? 0), 0) ?? 0
  const workloadHours = (profile as any)?.workload_hours ?? 0
  const workloadMinutes = workloadHours * 60
  const remainingMinutes = Math.max(0, workloadMinutes - totalWorkedMinutes)

  // Pontualidade
  const approvedRecords = records?.filter(r => r.status === 'approved') ?? []
  const lateCount = approvedRecords.filter(r => r.is_late).length
  const onTimeCount = approvedRecords.filter(r => !r.is_late).length
  const punctualityRate = approvedRecords.length > 0
    ? Math.round((onTimeCount / approvedRecords.length) * 100)
    : 100

  // Conquistas
  const { data: achievements } = await db
    .from('achievements')
    .select('type, unlocked_at')
    .eq('intern_id', user.id)
    .order('unlocked_at', { ascending: false })

  // Ranking do mÃªs
  const { data: allInternPoints } = await db
    .from('profiles')
    .select('id, points')
    .eq('role', 'intern')
    .eq('is_active', true)
    .order('points', { ascending: false })

  const rankingPosition = (allInternPoints ?? []).findIndex(p => p.id === user.id) + 1
  const totalInterns = (allInternPoints ?? []).length

  return NextResponse.json({
    profile,
    period: { startDate, endDate, label },
    records: records ?? [],
    stats: {
      totalMinutes: approvedRecords.reduce((a, r) => a + (r.duration_minutes ?? 0), 0),
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
    ranking: { position: rankingPosition, total: totalInterns },
  })
}
