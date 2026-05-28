import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { minutesToHours } from '@/lib/utils'
import type { Profile, MonthlyHours, InternSchedule } from '@/types/database'
import { TrendingUp, Users, CheckCircle2, AlertTriangle, Clock } from 'lucide-react'
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/MotionWrappers'

export const dynamic = 'force-dynamic'

export default async function WorkloadPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: internsRaw } = await supabase
    .from('profiles')
    .select('id, full_name, photo_url, course, total_hours_required')
    .eq('role', 'intern')
    .eq('is_active', true)
    .order('full_name')
  const interns = (internsRaw ?? []) as Pick<Profile, 'id' | 'full_name' | 'photo_url' | 'course' | 'total_hours_required'>[]

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
  const { data: allHoursRaw } = await supabase
    .from('v_monthly_hours')
    .select('intern_id, total_minutes, approved_sessions')
    .gte('month', monthStart)
  const allHours = (allHoursRaw ?? []) as Pick<MonthlyHours, 'intern_id' | 'total_minutes' | 'approved_sessions'>[]

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

  rows.sort((a, b) => a.pct - b.pct)

  const getColor = (pct: number) =>
    pct >= 100 ? '#00c853' : pct >= 75 ? '#3fe56c' : pct >= 40 ? '#95d69a' : '#ffbf00'
  const getLabel = (pct: number) =>
    pct >= 100 ? 'Concluído' : pct >= 75 ? 'Quase lá' : pct >= 40 ? 'Em dia' : 'Atenção'

  const avatarColors = [
    { bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.3)', text: '#60a5fa' },
    { bg: 'rgba(139,92,246,0.15)', border: 'rgba(139,92,246,0.3)', text: '#a78bfa' },
    { bg: 'rgba(236,72,153,0.15)', border: 'rgba(236,72,153,0.3)', text: '#f472b6' },
    { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)', text: '#34d399' },
    { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)', text: '#fbbf24' },
    { bg: 'rgba(6,182,212,0.15)',  border: 'rgba(6,182,212,0.3)',  text: '#22d3ee' },
  ]

  const currentMonth = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const completedCount = rows.filter(r => r.pct >= 100).length
  const attentionCount = rows.filter(r => r.pct < 40).length

  return (
    <div className="flex flex-col flex-1 min-h-0" style={{ background: 'var(--bg)' }}>

      {/* ── TopAppBar ──────────────────────────────── */}
      <FadeIn delay={0}>
        <header
          className="flex items-center justify-between px-6 h-16 flex-shrink-0"
          style={{ background: 'var(--bg)', borderBottom: '1px solid rgba(0,200,83,0.15)' }}
        >
          <h2 className="text-2xl font-semibold" style={{ color: 'var(--text)' }}>
            Carga Horária
          </h2>
          <p className="text-sm preserve-case capitalize" style={{ color: 'var(--text-3)' }}>
            {currentMonth}
          </p>
        </header>
      </FadeIn>

      {/* ── Main content ───────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto p-6" style={{ maxWidth: 1400, margin: '0 auto', width: '100%' }}>

        {/* Header */}
        <FadeIn delay={0.04}>
          <div className="mb-8">
            <h3 className="text-3xl font-semibold" style={{ color: 'var(--text)' }}>
              Visão Geral de Horas
            </h3>
            <p className="text-base mt-1 preserve-case" style={{ color: 'var(--text-3)' }}>
              Acompanhamento do progresso de horas dos estagiários.
            </p>
          </div>
        </FadeIn>

        {/* ── Metrics Bento ─────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Total */}
          <FadeIn delay={0.08}>
            <div
              className="relative overflow-hidden p-6 rounded-xl"
              style={{ background: 'var(--surface-card, #0f2318)', border: '1px solid rgba(0,200,83,0.15)' }}
            >
              <div className="relative z-10">
                <p className="text-xs font-semibold tracking-widest mb-2" style={{ color: 'var(--text-3)' }}>
                  Total de Estagiários
                </p>
                <span className="text-5xl font-bold leading-none" style={{ color: 'var(--text)' }}>
                  {String(rows.length).padStart(2, '0')}
                </span>
              </div>
              <Users size={120} className="absolute -right-4 -bottom-4" style={{ color: 'var(--text)', opacity: 0.05 }} strokeWidth={1} />
            </div>
          </FadeIn>

          {/* Concluíram */}
          <FadeIn delay={0.12}>
            <div
              className="relative overflow-hidden p-6 rounded-xl"
              style={{ background: 'var(--surface-card, #0f2318)', border: '1px solid rgba(0,200,83,0.15)' }}
            >
              <div className="relative z-10">
                <p className="text-xs font-semibold tracking-widest mb-2" style={{ color: 'var(--text-3)' }}>
                  Concluíram a Meta
                </p>
                <div className="flex items-end gap-3">
                  <span className="text-5xl font-bold leading-none" style={{ color: '#00c853' }}>
                    {String(completedCount).padStart(2, '0')}
                  </span>
                  <span className="text-xs font-medium mb-2 preserve-case" style={{ color: 'var(--text-3)' }}>
                    este mês
                  </span>
                </div>
              </div>
              <CheckCircle2 size={120} className="absolute -right-4 -bottom-4" style={{ color: '#00c853', opacity: 0.05 }} strokeWidth={1} />
            </div>
          </FadeIn>

          {/* Atenção */}
          <FadeIn delay={0.16}>
            <div
              className="relative overflow-hidden p-6 rounded-xl"
              style={{ background: 'var(--surface-card, #0f2318)', border: '1px solid rgba(0,200,83,0.15)' }}
            >
              <div className="relative z-10">
                <p className="text-xs font-semibold tracking-widest mb-2" style={{ color: 'var(--text-3)' }}>
                  Necessitam Atenção
                </p>
                <div className="flex items-end gap-3">
                  <span className="text-5xl font-bold leading-none" style={{ color: attentionCount > 0 ? '#ffbf00' : 'var(--text-3)' }}>
                    {String(attentionCount).padStart(2, '0')}
                  </span>
                  <span className="text-xs font-medium mb-2 preserve-case" style={{ color: 'var(--text-3)' }}>
                    {attentionCount > 0 ? 'abaixo de 40%' : 'todos em dia'}
                  </span>
                </div>
              </div>
              <AlertTriangle size={120} className="absolute -right-4 -bottom-4" style={{ color: attentionCount > 0 ? '#ffbf00' : 'var(--text-3)', opacity: 0.05 }} strokeWidth={1} />
            </div>
          </FadeIn>
        </div>

        {/* ── Lista ─────────────────────────────────── */}
        <FadeIn delay={0.20}>
          <h4 className="text-2xl font-semibold mb-6" style={{ color: 'var(--text)' }}>
            Progresso Individual
          </h4>
        </FadeIn>

        {rows.length === 0 ? (
          <FadeIn>
            <div
              className="rounded-xl flex flex-col items-center justify-center py-16"
              style={{ background: 'var(--surface-card, #0f2318)', border: '1px solid rgba(0,200,83,0.15)' }}
            >
              <Users size={48} className="mb-4" style={{ color: 'var(--text-3)', opacity: 0.4 }} />
              <p className="text-lg font-semibold mb-1" style={{ color: 'var(--text)' }}>Nenhum estagiário ativo</p>
              <p className="text-sm preserve-case" style={{ color: 'var(--text-3)' }}>
                Adicione estagiários para acompanhar as horas.
              </p>
            </div>
          </FadeIn>
        ) : (
          <StaggerContainer className="space-y-3 pb-4">
            {rows.map((r, i) => {
              const color = getColor(r.pct)
              const label = getLabel(r.pct)
              const initials = r.full_name.split(' ').slice(0, 2).map(w => w[0]).join('')
              const ac = avatarColors[i % avatarColors.length]

              return (
                <StaggerItem key={r.id}>
                  <Link
                    href={`/admin/interns/${r.id}`}
                    className="group block p-5 rounded-xl transition-all duration-200"
                    style={{ background: 'var(--surface-card, #0f2318)', border: '1px solid rgba(0,200,83,0.15)' }}
                  >
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      {r.photo_url ? (
                        <img
                          src={r.photo_url}
                          alt={r.full_name}
                          className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                          style={{ border: `1px solid ${ac.border}` }}
                        />
                      ) : (
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0"
                          style={{ background: ac.bg, border: `1px solid ${ac.border}`, color: ac.text }}
                        >
                          {initials}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        {/* Name + status */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <p className="font-bold text-base preserve-case" style={{ color: 'var(--text)' }}>{r.full_name}</p>
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded flex-shrink-0"
                            style={{ background: `${color}18`, color, border: `1px solid ${color}40` }}
                          >
                            {label}
                          </span>
                        </div>

                        {/* Progress bar */}
                        <div className="h-2 rounded-full overflow-hidden mb-2" style={{ background: 'var(--surface-variant)' }}>
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${r.pct}%`, background: color }}
                          />
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-3)' }}>
                          <span className="flex items-center gap-1" style={{ color }}>
                            <Clock size={11} />
                            {minutesToHours(r.monthMinutes)} / {r.total_hours_required ?? 120}h ({r.pct}%)
                          </span>
                          <span>&middot;</span>
                          <span>{r.approvedSessions} aprovadas</span>
                          {r.weeklyHours > 0 && (
                            <>
                              <span>&middot;</span>
                              <span>{r.weeklyHours.toFixed(1)}h/sem</span>
                            </>
                          )}
                        </div>
                      </div>

                      <TrendingUp size={18} className="flex-shrink-0" style={{ color }} />
                    </div>
                  </Link>
                </StaggerItem>
              )
            })}
          </StaggerContainer>
        )}
      </div>
    </div>
  )
}
