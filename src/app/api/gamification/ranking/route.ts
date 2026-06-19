import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseServiceClient } from '@/infra/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createSupabaseServiceClient()

  const { searchParams } = request.nextUrl
  const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))
  const year  = parseInt(searchParams.get('year')  || String(new Date().getFullYear()))

  const monthStart = `${year}-${String(month).padStart(2, '0')}-01`
  const monthEnd   = new Date(year, month, 1).toISOString().slice(0, 10)

  // Interns with gamification columns
  const { data: profiles } = await service
    .from('profiles')
    .select('id, full_name, photo_url, points, level, streak_days')
    .eq('role', 'intern')
    .eq('is_active', true)

  if (!profiles?.length) return NextResponse.json({ ranking: [] })

  // Monthly minutes per intern
  const { data: monthlyData } = await service
    .from('time_records')
    .select('intern_id, duration_minutes')
    .gte('clock_in', `${monthStart}T00:00:00Z`)
    .lt('clock_in', `${monthEnd}T00:00:00Z`)
    .not('clock_out', 'is', null)

  const minutesByIntern = new Map<string, number>()
  for (const r of monthlyData ?? []) {
    minutesByIntern.set(r.intern_id, (minutesByIntern.get(r.intern_id) ?? 0) + (r.duration_minutes ?? 0))
  }

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

  // Build ranking sorted by monthly minutes, then total points as tiebreaker
  const ranking = profiles
    .map(p => ({
      internId:     p.id,
      internName:   p.full_name,
      photoUrl:     p.photo_url,
      points:       p.points ?? 0,
      level:        p.level ?? 1,
      streakDays:   p.streak_days ?? 0,
      monthMinutes: minutesByIntern.get(p.id) ?? 0,
      achievements: achievementsByIntern.get(p.id) ?? [],
      position:     0,
    }))
    .filter(r => r.monthMinutes > 0 || r.points > 0)
    .sort((a, b) => b.monthMinutes - a.monthMinutes || b.points - a.points)

  ranking.forEach((r, i) => { r.position = i + 1 })

  return NextResponse.json({ ranking, month, year, currentUserId: user.id })
}
