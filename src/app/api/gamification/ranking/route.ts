import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseServiceClient } from '@/infra/supabase/server'

function getWeekRange() {
  const now = new Date()
  const day = now.getDay() // 0=Sun
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((day + 6) % 7))
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 7)
  return { start: monday.toISOString(), end: sunday.toISOString() }
}

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createSupabaseServiceClient()
  const { searchParams } = request.nextUrl
  const period = searchParams.get('period') ?? 'monthly' // 'monthly' | 'weekly'
  const month  = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))
  const year   = parseInt(searchParams.get('year')  || String(new Date().getFullYear()))

  let rangeStart: string
  let rangeEnd: string

  if (period === 'weekly') {
    const w = getWeekRange()
    rangeStart = w.start
    rangeEnd   = w.end
  } else {
    rangeStart = `${year}-${String(month).padStart(2, '0')}-01T00:00:00Z`
    rangeEnd   = new Date(year, month, 1).toISOString()
  }

  // Use service role client for all data queries — bypasses RLS which restricts
  // time_records to intern_id = auth.uid() (admin would get 0 records otherwise)
  const { data: profiles, error: profilesError } = await service
    .from('profiles')
    .select('*')
    .eq('role', 'intern')
    .eq('is_active', true)

  if (profilesError || !profiles?.length) {
    return NextResponse.json({ ranking: [], period, month, year, currentUserId: user.id })
  }

  // Minutes in period per intern (closed records)
  const { data: closedRecords } = await service
    .from('time_records')
    .select('intern_id, duration_minutes')
    .gte('clock_in', rangeStart)
    .lt('clock_in', rangeEnd)
    .not('clock_out', 'is', null)

  // Open records (currently clocked in) — count elapsed minutes live
  const { data: openRecords } = await service
    .from('time_records')
    .select('intern_id, clock_in')
    .gte('clock_in', rangeStart)
    .lt('clock_in', rangeEnd)
    .is('clock_out', null)

  const now = Date.now()
  const minutesByIntern = new Map<string, number>()

  for (const r of closedRecords ?? []) {
    minutesByIntern.set(r.intern_id, (minutesByIntern.get(r.intern_id) ?? 0) + (r.duration_minutes ?? 0))
  }
  for (const r of openRecords ?? []) {
    const elapsed = Math.floor((now - new Date(r.clock_in).getTime()) / 60000)
    minutesByIntern.set(r.intern_id, (minutesByIntern.get(r.intern_id) ?? 0) + elapsed)
  }

  // Which interns are currently active (clocked in right now)
  const activeInternIds = new Set((openRecords ?? []).map(r => r.intern_id))

  // Achievements per intern (table may not exist yet if migration hasn't run)
  let achievementsData: { intern_id: string; type: string; unlocked_at: string }[] | null = null
  try {
    const { data } = await service
      .from('achievements')
      .select('intern_id, type, unlocked_at')
      .in('intern_id', profiles.map((p: any) => p.id))
    achievementsData = data
  } catch { /* table doesn't exist yet */ }

  const achievementsByIntern = new Map<string, { type: string; unlocked_at: string }[]>()
  for (const a of achievementsData ?? []) {
    const list = achievementsByIntern.get(a.intern_id) ?? []
    list.push({ type: a.type, unlocked_at: a.unlocked_at })
    achievementsByIntern.set(a.intern_id, list)
  }

  const ranking = profiles
    .map(p => ({
      internId:      p.id,
      internName:    p.full_name,
      photoUrl:      p.photo_url,
      points:        p.points ?? 0,
      level:         p.level ?? 1,
      streakDays:    p.streak_days ?? 0,
      periodMinutes: minutesByIntern.get(p.id) ?? 0,
      achievements:  achievementsByIntern.get(p.id) ?? [],
      isActive:      activeInternIds.has(p.id),
      position:      0,
    }))
    // Ranking = pontos totais (refletem presença + pontualidade + streak)
    // Desempate: horas no período → nome
    .sort((a, b) => b.points - a.points || b.periodMinutes - a.periodMinutes || a.internName.localeCompare(b.internName))

  ranking.forEach((r, i) => { r.position = i + 1 })

  return NextResponse.json({ ranking, period, month, year, currentUserId: user.id, updatedAt: new Date().toISOString() })
}
