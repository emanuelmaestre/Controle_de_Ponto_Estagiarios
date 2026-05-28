import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { minutesToHours } from '@/lib/utils'
import type { Profile, MonthlyHours, InternSchedule } from '@/types/database'
import {
  TrendingUp, Users, CheckCircle2, AlertTriangle,
  Clock, Eye, XCircle, AlertCircle,
} from 'lucide-react'
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/MotionWrappers'

export const dynamic = 'force-dynamic'

/* ─────────────────────────────────────────
   Helpers de status
───────────────────────────────────────── */
type StatusKey = 'done' | 'ontrack' | 'attention' | 'late'

function getStatus(pct: number): StatusKey {
  if (pct >= 100) return 'done'
  if (pct >= 75)  return 'ontrack'
  if (pct >= 40)  return 'attention'
  return 'late'
}

const STATUS_META: Record<StatusKey, {
  label: string
  icon: React.ReactNode
  color: string
  bg: string
  border: string
  barColor: string
}> = {
  done: {
    label: 'META CONCLUÍDA',
    icon: <CheckCircle2 size={11} />,
    color:    '#3fe56c',
    bg:       'rgba(63,229,108,0.10)',
    border:   'rgba(63,229,108,0.30)',
    barColor: '#3fe56c',
  },
  ontrack: {
    label: 'NO PRAZO',
    icon: <CheckCircle2 size={11} />,
    color:    '#00c853',
    bg:       'rgba(0,200,83,0.10)',
    border:   'rgba(0,200,83,0.30)',
    barColor: '#00c853',
  },
  attention: {
    label: 'ATENÇÃO NECESSÁRIA',
    icon: <AlertCircle size={11} />,
    color:    '#ffbf00',
    bg:       'rgba(255,191,0,0.10)',
    border:   'rgba(255,191,0,0.30)',
    barColor: '#ffbf00',
  },
  late: {
    label: 'ATRASADO',
    icon: <XCircle size={11} />,
    color:    '#ff5252',
    bg:       'rgba(255,82,82,0.10)',
    border:   'rgba(255,82,82,0.30)',
    barColor: '#ff5252',
  },
}

const AVATAR_COLORS = [
  { bg: 'rgba(59,130,246,0.15)',  border: 'rgba(59,130,246,0.3)',  text: '#60a5fa' },
  { bg: 'rgba(139,92,246,0.15)',  border: 'rgba(139,92,246,0.3)',  text: '#a78bfa' },
  { bg: 'rgba(236,72,153,0.15)',  border: 'rgba(236,72,153,0.3)',  text: '#f472b6' },
  { bg: 'rgba(16,185,129,0.15)',  border: 'rgba(16,185,129,0.3)',  text: '#34d399' },
  { bg: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.3)',  text: '#fbbf24' },
  { bg: 'rgba(6,182,212,0.15)',   border: 'rgba(6,182,212,0.3)',   text: '#22d3ee' },
]

/* ─────────────────────────────────────────
   Page
───────────────────────────────────────── */
export default async function WorkloadPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  /* fetch */
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
    id: string; full_name: string; photo_url: string | null
    course: string | null; total_hours_required: number | null
    monthMinutes: number; approvedSessions: number; pct: number
    status: StatusKey; weeklyHours: number
  }

  const rows: InternRow[] = interns.map((i, _idx) => {
    const h = allHours.find(x => x.intern_id === i.id)
    const monthMinutes = h?.total_minutes ?? 0
    const totalRequired = (i.total_hours_required ?? 120) * 60
    const pct = totalRequired > 0 ? Math.round((monthMinutes / totalRequired) * 100) : 0
    return {
      ...i, monthMinutes,
      approvedSessions: h?.approved_sessions ?? 0,
      pct, status: getStatus(pct),
      weeklyHours: weeklyByIntern[i.id] ?? 0,
    }
  })

  rows.sort((a, b) => a.pct - b.pct)

  const completedCount = rows.filter(r => r.pct >= 100).length
  const attentionCount = rows.filter(r => r.pct < 40).length
  const currentMonth   = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <div className="flex flex-col flex-1 min-h-0" style={{ background: 'var(--bg)' }}>

      {/* ── TopAppBar ── */}
      <FadeIn delay={0}>
        <header
          className="flex items-center justify-between px-6 h-16 flex-shrink-0"
          style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}
        >
          <h2 className="text-2xl font-semibold" style={{ color: 'var(--text)' }}>
            Carga Horária
          </h2>
          <p className="text-sm preserve-case capitalize" style={{ color: 'var(--text-3)' }}>
            {currentMonth}
          </p>
        </header>
      </FadeIn>

      {/* ── Main ── */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6" style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}>

        {/* Subtitle */}
        <FadeIn delay={0.04}>
          <div className="mb-6">
            <h3 className="text-2xl font-semibold" style={{ color: 'var(--text)' }}>
              Visão Geral de Horas
            </h3>
            <p className="text-sm mt-0.5 preserve-case" style={{ color: 'var(--text-3)' }}>
              Acompanhamento do progresso de horas dos estagiários.
            </p>
          </div>
        </FadeIn>

        {/* ── Metrics ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            {
              label: 'Total de Estagiários',
              value: String(rows.length).padStart(2, '0'),
              color: 'var(--text)',
              icon: <Users size={96} strokeWidth={1} />,
              delay: 0.08,
            },
            {
              label: 'Concluíram a Meta',
              value: String(completedCount).padStart(2, '0'),
              sub: 'este mês',
              color: '#00c853',
              icon: <CheckCircle2 size={96} strokeWidth={1} />,
              delay: 0.12,
            },
            {
              label: 'Necessitam Atenção',
              value: String(attentionCount).padStart(2, '0'),
              sub: attentionCount > 0 ? 'abaixo de 40%' : 'todos em dia',
              color: attentionCount > 0 ? '#ffbf00' : 'var(--text-3)',
              icon: <AlertTriangle size={96} strokeWidth={1} />,
              delay: 0.16,
            },
          ].map(m => (
            <FadeIn key={m.label} delay={m.delay}>
              <div
                className="relative overflow-hidden p-6 rounded-2xl"
                style={{ background: 'var(--surface-card)', border: '1px solid var(--border)' }}
              >
                <p className="text-[10px] font-bold tracking-widest mb-2 uppercase" style={{ color: 'var(--text-3)' }}>
                  {m.label}
                </p>
                <div className="flex items-end gap-2">
                  <span className="text-5xl font-bold leading-none" style={{ color: m.color }}>
                    {m.value}
                  </span>
                  {m.sub && (
                    <span className="text-xs mb-1 preserve-case" style={{ color: 'var(--text-3)' }}>{m.sub}</span>
                  )}
                </div>
                <div className="absolute -right-3 -bottom-3 opacity-[0.04]" style={{ color: m.color }}>
                  {m.icon}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* ── Progresso Individual ── */}
        <FadeIn delay={0.20}>
          <h4 className="text-xl font-semibold mb-4" style={{ color: 'var(--text)' }}>
            Progresso Individual
          </h4>
        </FadeIn>

        {rows.length === 0 ? (
          <FadeIn>
            <div
              className="rounded-2xl flex flex-col items-center justify-center py-16"
              style={{ background: 'var(--surface-card)', border: '1px solid var(--border)' }}
            >
              <Users size={48} className="mb-4" style={{ color: 'var(--text-3)', opacity: 0.4 }} />
              <p className="text-lg font-semibold mb-1" style={{ color: 'var(--text)' }}>
                Nenhum estagiário ativo
              </p>
              <p className="text-sm preserve-case" style={{ color: 'var(--text-3)' }}>
                Adicione estagiários para acompanhar as horas.
              </p>
            </div>
          </FadeIn>
        ) : (
          <StaggerContainer className="space-y-3 pb-4">
            {rows.map((r, i) => {
              const st   = STATUS_META[r.status]
              const ac   = AVATAR_COLORS[i % AVATAR_COLORS.length]
              const initials = r.full_name.split(' ').slice(0, 2).map(w => w[0]).join('')
              const hoursLabel = minutesToHours(r.monthMinutes)
              const totalH    = r.total_hours_required ?? 120
              const pctDisplay = r.pct > 100 ? '100%+' : `${r.pct}%`
              const barWidth   = Math.min(100, r.pct)

              return (
                <StaggerItem key={r.id}>
                  <Link
                    href={`/admin/interns/${r.id}`}
                    className="group block rounded-2xl transition-all duration-200"
                    style={{
                      background: 'var(--surface-card)',
                      border: `1px solid var(--border)`,
                    }}
                  >
                    <div className="flex items-center gap-4 sm:gap-6 p-4 sm:p-5">

                      {/* ── Avatar ── */}
                      <div className="flex-shrink-0">
                        {r.photo_url ? (
                          <img
                            src={r.photo_url}
                            alt={r.full_name}
                            className="w-14 h-14 rounded-full object-cover"
                            style={{ border: `2px solid ${ac.border}` }}
                          />
                        ) : (
                          <div
                            className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg"
                            style={{ background: ac.bg, border: `2px solid ${ac.border}`, color: ac.text }}
                          >
                            {initials}
                          </div>
                        )}
                      </div>

                      {/* ── Nome + Badge ── */}
                      <div className="flex-shrink-0" style={{ minWidth: 160, width: 180 }}>
                        <p
                          className="font-bold text-base preserve-case leading-tight mb-1.5 group-hover:opacity-80 transition-opacity"
                          style={{ color: 'var(--text)' }}
                        >
                          {r.full_name}
                        </p>
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold"
                          style={{ background: st.bg, border: `1px solid ${st.border}`, color: st.color }}
                        >
                          {st.icon}
                          {st.label}
                        </span>
                      </div>

                      {/* ── Barra + Horas ── */}
                      <div className="flex-1 min-w-0">
                        {/* Label acima */}
                        <p className="text-[10px] font-medium mb-2 flex items-center gap-1" style={{ color: 'var(--text-3)' }}>
                          <Clock size={10} />
                          Horas Concluídas / Meta de {totalH}h
                        </p>

                        {/* Barra */}
                        <div
                          className="h-2.5 rounded-full overflow-hidden mb-2"
                          style={{ background: 'var(--surface-variant)' }}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${barWidth}%`, background: st.barColor }}
                          />
                        </div>

                        {/* Valor */}
                        <div className="flex items-baseline gap-2">
                          <span className="text-base font-bold" style={{ color: st.color }}>
                            {hoursLabel} / {totalH}h
                          </span>
                          <span className="text-xs font-semibold" style={{ color: 'var(--text-3)' }}>
                            ({pctDisplay})
                          </span>
                        </div>
                      </div>

                      {/* ── Sessões Aprovadas ── */}
                      <div
                        className="flex-shrink-0 flex flex-col items-center gap-0.5 pl-4 sm:pl-6 hidden sm:flex"
                        style={{ borderLeft: '1px solid var(--border)', minWidth: 100 }}
                      >
                        <p className="text-[9px] font-bold tracking-widest text-center" style={{ color: 'var(--text-3)' }}>
                          SESSÕES APROVADAS
                        </p>
                        <span className="text-4xl font-bold leading-none mt-1" style={{ color: st.color }}>
                          {String(r.approvedSessions).padStart(2, '0')}
                        </span>
                        <p className="text-[10px]" style={{ color: 'var(--text-3)' }}>Sessões</p>
                      </div>

                      {/* ── Eye icon ── */}
                      <div className="flex-shrink-0 pl-2 hidden sm:flex">
                        <Eye
                          size={20}
                          className="opacity-40 group-hover:opacity-100 transition-opacity"
                          style={{ color: st.color }}
                        />
                      </div>

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
