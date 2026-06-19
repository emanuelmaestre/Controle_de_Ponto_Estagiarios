import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseServiceClient } from '@/infra/supabase/server'

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createSupabaseServiceClient()

  const { data: profile } = await service
    .from('profiles')
    .select('points, level, streak_days, last_activity_date')
    .eq('id', user.id)
    .maybeSingle()

  const { data: achievements } = await service
    .from('achievements')
    .select('type, unlocked_at')
    .eq('intern_id', user.id)
    .order('unlocked_at', { ascending: false })

  // My ranking position (by points)
  const { data: allPoints } = await service
    .from('profiles')
    .select('id, points')
    .eq('role', 'intern')
    .eq('is_active', true)
    .order('points', { ascending: false })

  const position = (allPoints ?? []).findIndex(p => p.id === user.id) + 1

  return NextResponse.json({
    points:           profile?.points ?? 0,
    level:            profile?.level ?? 1,
    streakDays:       profile?.streak_days ?? 0,
    lastActivityDate: profile?.last_activity_date ?? null,
    achievements:     achievements ?? [],
    position,
    totalInterns:     allPoints?.length ?? 0,
  })
}
