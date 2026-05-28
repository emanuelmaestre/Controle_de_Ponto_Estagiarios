import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { minutesToHours } from '@/lib/utils'
import type { Profile, MonthlyHours, InternSchedule } from '@/types/database'
import { TrendingUp, Users } from 'lucide-react'
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/MotionWrappers'
import BackButton from '@/components/ui/BackButton'

export const dynamic = 'force-dynamic'

export default async function WorkloadPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // All active interns
  const { data: internsRaw } = await supabase
    .from('profiles')
    .select('id, full_name, photo_url, course, total_hours_required')
    .eq('role', 'intern')
    .eq('is_active', true)
    .order('full_name')
  const interns = (internsRaw ?? []) as Pick<Profile, 'id' | 'full_name' | 'photo_url' | 'course' | 'total_hours_required'>[]

  // This month hours for all interns
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
  const { data: allHoursRaw } = await supabase
    .from('v_monthly_hours')
    .select('intern_id, total_minutes, approved_sessions')
    .gte('month', monthStart)
  const allHours = (allHoursRaw ?? []) as Pick<MonthlyHours, 'intern_id' | 'total_minutes' | 'approved_sessions'>[]

  // Schedules - weekly expected hours per intern
  const { data: schedulesRaw } = await supabase
    .from('intern_schedules')
    .select('intern_id, expected_hours')
    .eq('is_active', true)
  const schedules = (schedulesRaw ?? []) as Pick<InternSchedule, 'intern_id' | 'expected_hours'>[]

  const weeklyByIntern: Record<string, number> = {}
  for (const s of schedules) {
    weeklyByIntern[s.intern_id] = (weeklyByIntern[s.intern_id] ?? 0) + (s.expected_hours ?? 0)
  }

  type InternRow = {
    id: string
    full_name: string
    photo_url: string | null
    course: string | null
    total_hours_required: number | null
    monthMinutes: number
    approvedSessions: number
    pct: number
    weeklyHours: number
  }

  const rows: InternRow[] = interns.map(i => {
    const h = allHours.find(x => x.intern_id === i.id)
    const monthMinutes = h?.total_minutes ?? 0
    const totalRequired = (i.total_hours_required ?? 120) * 60
    const pct = totalRequired > 0 ? Math.min(100, Math.round((monthMinutes / totalRequired) * 100)) : 0
    return {
      ...i,
      monthMinutes,
      approvedSessions: h?.approved_sessions ?? 0,
      pct,
      weeklyHours: weeklyByIntern[i.id] ?? 0,
    }
  })

  // Sort: lowest pct first (needs attention)
  rows.sort((a, b) => a.pct - b.pct)

  const getColor = (pct: number) =>
    pct >= 100 ? '#00c853' : pct >= 75 ? '#3fe56c' : pct >= 40 ? '#95d69a' : '#ffbf00'
  const getLabel = (pct: number) =>
    pct >= 100 ? 'CONCLUÍDO' : pct >= 75 ? 'QUASE LÁ' : pct >= 40 ? 'EM DIA' : 'ATENÇÃO'

  const avatarColors = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#06b6d4']

  return (
    <div className="flex flex-col" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, background: 'var(--bg)' }}>


      {/* Header */}
      <div style={{ background: 'var(--surface-card)', borderBottom: '1px solid rgba(0,200,83,0.15)' }}>
        <div className="px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3 mb-2">
            <BackButton href="/admin" />
            <div>
              <h1 className="font-bold text-lg" style={{ color: 'var(--text)' }}>CARGA HORÁRIA</h1>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>ACOMPANHAMENTO DE HORAS &mdash; {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()}</p>
            </div>
          </div>

          {/* Summary chips */}
          <div className="flex gap-2 flex-wrap mt-3">
            {[
              { label: 'TOTAL ESTAGIÁRIOS', value: rows.length, color: 'var(--primary)' },
              { label: 'CONCLUÍRAM META', value: rows.filter(r => r.pct >= 100).length, color: 'var(--success)' },
              { label: 'ATENÇÃO', value: rows.filter(r => r.pct < 40).length, color: 'var(--warning)' },
            ].map(c => (
              <div
                key={c.label}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-bold"
                style={{ background: 'var(--surface-container)', border: '1px solid rgba(0,200,83,0.12)', color: 'var(--text-2)' }}
              >
                <span style={{ color: c.color }}>{c.value}</span> {c.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      <main className="flex-1 min-h-0 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}><div className="px-4 sm:px-6 py-4 space-y-4">
        {rows.length === 0 && (
          <FadeIn>
            <div className="text-center py-16" style={{ color: 'var(--text-3)' }}>
              <Users size={40} className="mx-auto mb-3" style={{ color: 'var(--text-3)', opacity: 0.35 }} />
              <p className="text-sm font-bold">NENHUM ESTAGIÁRIO ATIVO</p>
            </div>
          </FadeIn>
        )}

        <StaggerContainer className="space-y-4">
        {rows.map((r, i) => {
          const color = getColor(r.pct)
          const label = getLabel(r.pct)
          const initials = r.full_name.split(' ').slice(0, 2).map(w => w[0]).join('')
          const avatarBg = avatarColors[i % avatarColors.length]

          return (
            <StaggerItem key={r.id}>
            <Link
              href={`/admin/interns/${r.id}`}
              className="block card-surface rounded-2xl p-4 transition-all hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-4">
                {/* Avatar */}
                {r.photo_url ? (
                  <img src={r.photo_url} alt={r.full_name} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 text-white"
                    style={{ background: avatarBg }}
                  >
                    {initials}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  {/* Name + status */}
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="font-bold text-sm truncate" style={{ color: 'var(--text)' }}>{r.full_name}</p>
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}
                    >
                      {label}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2 rounded-full overflow-hidden mb-1.5" style={{ background: 'var(--surface-variant)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${r.pct}%`, background: color }}
                    />
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-3 text-[10px] font-bold" style={{ color: 'var(--text-3)' }}>
                    <span style={{ color }}>
                      {minutesToHours(r.monthMinutes)} / {r.total_hours_required ?? 120}H ({r.pct}%)
                    </span>
                    <span>&middot;</span>
                    <span>{r.approvedSessions} APROVADAS</span>
                    {r.weeklyHours > 0 && (
                      <>
                        <span>&middot;</span>
                        <span>{r.weeklyHours.toFixed(1)}H/SEM</span>
                      </>
                    )}
                  </div>
                </div>

                <TrendingUp size={16} className="flex-shrink-0" style={{ color }} />
              </div>
            </Link>
            </StaggerItem>
          )
        })}
        </StaggerContainer>
      </div></main>
    </div>
  )
}

