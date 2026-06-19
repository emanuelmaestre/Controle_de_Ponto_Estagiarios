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

  // Profiles with gamification (fallback gracefully if columns don't exist yet)
  const { data: profiles } = await service
    .from('profiles')
    .select('id, full_name, photo_url, points, level, streak_days')
    .eq('role', 'intern')
    .eq('is_active', true)

  if (!profiles?.length) return NextResponse.json({ ranking: [], period, month, year })

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

  // Achievements per intern
  const { data: achievementsData } = await service
    .from('achievements')
    .select('intern_id, type, unlocked_at')
    .in('intern_id', profiles.map(p => p.id))

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
      points:        (p as any).points ?? 0,
      level:         (p as any).level ?? 1,
      streakDays:    (p as any).streak_days ?? 0,
      periodMinutes: minutesByIntern.get(p.id) ?? 0,
      achievements:  achievementsByIntern.get(p.id) ?? [],
      isActive:      activeInternIds.has(p.id),
      position:      0,
    }))
    .sort((a, b) => b.periodMinutes - a.periodMinutes || b.points - a.points || a.internName.localeCompare(b.internName))

  ranking.forEach((r, i) => { r.position = i + 1 })

  return NextResponse.json({ ranking, period, month, year, currentUserId: user.id, updatedAt: new Date().toISOString() })
}
