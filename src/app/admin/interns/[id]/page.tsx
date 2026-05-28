import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { minutesToHours } from '@/lib/utils'
import InternForm from '../InternForm'
import ScheduleManager from './ScheduleManager'
import type { Profile, MonthlyHours, InternSchedule } from '@/types/database'
import {
  Clock, TrendingUp, UserCheck, GraduationCap,
  BarChart2, Settings2, Calendar, ArrowLeft,
} from 'lucide-react'
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/MotionWrappers'

export const dynamic = 'force-dynamic'

type Tab = 'visao-geral' | 'horario' | 'cadastro'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}

/* ── Initials Avatar ─────────────────────────────────────── */
function InitialsAvatar({ name, photoUrl, size = 72 }: { name: string; photoUrl?: string | null; size?: number }) {
  if (photoUrl) {
    return (
      <Image src={photoUrl} alt={name} width={size} height={size}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size, border: '3px solid rgba(0,200,83,0.4)' }} />
    )
  }
  const initials = name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
  return (
    <div className="rounded-full flex items-center justify-center font-black flex-shrink-0"
      style={{
        width: size, height: size,
        background: 'linear-gradient(135deg, #3fe56c, #00c853)',
        color: '#003912',
        fontSize: size * 0.33,
        border: '3px solid rgba(0,200,83,0.4)',
      }}>
      {initials}
    </div>
  )
}

/* ── Circular Progress Ring ──────────────────────────────── */
function ProgressRing({ pct, color, size = 64 }: { pct: number; color: string; size?: number }) {
  const r    = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const off  = circ - (pct / 100) * circ
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(0,200,83,0.12)" strokeWidth={6} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={6}
        strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s ease' }} />
    </svg>
  )
}

export default async function InternDetailPage({ params, searchParams }: Props) {
  const { id }       = await params
  const { tab: tabP } = await searchParams
  const activeTab = (['visao-geral','horario','cadastro'].includes(tabP ?? '') ? tabP : 'visao-geral') as Tab

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: internRaw } = await supabase.from('profiles').select('*').eq('id', id).eq('role','intern').single()
  const intern = internRaw as Profile | null
  if (!intern) notFound()

  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
  const { data: hoursRaw } = await supabase.from('v_monthly_hours').select('*').eq('intern_id', id)
    .gte('month', threeMonthsAgo.toISOString()).order('month', { ascending: false })
  const hours = hoursRaw as MonthlyHours[] | null

  const { data: schedulesRaw } = await supabase.from('intern_schedules').select('*').eq('intern_id', id)
  const schedules = (schedulesRaw ?? []) as InternSchedule[]

  const thisMonth    = hoursRaw?.[0]
  const monthMinutes = thisMonth?.total_minutes ?? 0
  const totalRequired = (intern.total_hours_required ?? 120) * 60
  const pct = totalRequired > 0 ? Math.min(100, Math.round((monthMinutes / totalRequired) * 100)) : 0

  const statusLabel = pct >= 100 ? 'Concluído' : pct >= 75 ? 'Quase lá' : pct >= 40 ? 'Em dia' : 'Atenção'
  const statusColor = pct >= 100 ? '#00c853' : pct >= 75 ? '#95d69a' : pct >= 40 ? '#3fe56c' : '#ffbf00'

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'visao-geral', label: 'Visão Geral', icon: <BarChart2 size={14} /> },
    { key: 'horario',     label: 'Horário',     icon: <Calendar size={14} /> },
    { key: 'cadastro',    label: 'Cadastro',    icon: <Settings2 size={14} /> },
  ]

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, minHeight:0, overflow:'hidden', background:'var(--bg)' }}>

      {/* ── TopAppBar ─────────────────────────────── */}
      <FadeIn delay={0}>
        <header
          className="flex items-center gap-4 px-6 h-16 flex-shrink-0"
          style={{ background: 'var(--bg)', borderBottom: '1px solid rgba(0,200,83,0.15)' }}
        >
          <Link
            href="/admin/interns"
            className="flex items-center justify-center w-9 h-9 rounded-lg transition-colors"
            style={{ background: 'var(--surface-card, #0f2318)', border: '1px solid rgba(0,200,83,0.15)', color: 'var(--text-3)' }}
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>Estagiários</p>
            <h2 className="text-base font-semibold preserve-case leading-none" style={{ color: 'var(--text)' }}>
              {intern.full_name}
            </h2>
          </div>
        </header>
      </FadeIn>

      {/* ── Tab Content ─────────────────────────────── */}
      <div className="no-scrollbar" style={{ flex:1, minHeight:0, overflowY:'auto', background:'var(--bg)' }}>
        <div className="p-6" style={{ maxWidth: 1000, margin: '0 auto' }}>

          {/* Hero card */}
          <FadeIn delay={0.04}>
            <div
              className="rounded-xl p-6 mb-6 relative overflow-hidden"
              style={{ background: 'var(--surface-card, #0f2318)', border: '1px solid rgba(0,200,83,0.15)' }}
            >
              {/* Subtle glow */}
              <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl pointer-events-none"
                style={{ background: '#00c853', opacity: 0.06 }} />

              <div className="flex items-center gap-5 relative z-10">
                <InitialsAvatar name={intern.full_name} photoUrl={intern.photo_url} size={72} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap mb-1">
                    <h1 className="text-2xl font-bold preserve-case" style={{ color: 'var(--text)' }}>{intern.full_name}</h1>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded flex-shrink-0"
                      style={{
                        background: intern.is_active ? 'rgba(0,200,83,0.10)' : 'rgba(134,149,131,0.10)',
                        color: intern.is_active ? '#00c853' : 'var(--text-3)',
                        border: `1px solid ${intern.is_active ? '#00c853' : 'var(--text-3)'}`,
                      }}>
                      {intern.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  <p className="text-sm preserve-case truncate mb-1" style={{ color: 'var(--text-3)' }}>{intern.email}</p>
                  {intern.course && (
                    <div className="flex items-center gap-1">
                      <GraduationCap size={12} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
                      <p className="text-sm preserve-case truncate" style={{ color: 'var(--text-3)' }}>{intern.course}</p>
                    </div>
                  )}
                </div>

                {/* Progress ring */}
                <div className="hidden sm:flex flex-col items-center flex-shrink-0 gap-1">
                  <div className="relative">
                    <ProgressRing pct={pct} color={statusColor} size={64} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-black" style={{ color: statusColor }}>{pct}%</span>
                    </div>
                  </div>
                  <span className="text-xs font-semibold" style={{ color: statusColor }}>{statusLabel}</span>
                </div>
              </div>

              {/* Mobile progress */}
              <div className="sm:hidden mt-4">
                <div className="flex justify-between mb-1.5">
                  <span className="text-xs" style={{ color: 'var(--text-3)' }}>Progresso</span>
                  <span className="text-xs font-bold" style={{ color: statusColor }}>{pct}% · {statusLabel}</span>
                </div>
                <div className="h-2 rounded-full" style={{ background: 'var(--surface-variant)' }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: statusColor }} />
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Tabs */}
          <FadeIn delay={0.08}>
            <div className="flex gap-2 mb-6">
              {tabs.map(t => (
                <Link key={t.key} href={`/admin/interns/${id}?tab=${t.key}`}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
                  style={activeTab === t.key
                    ? { background: '#00c853', color: '#003912' }
                    : { background: 'var(--surface-card, #0f2318)', color: 'var(--text-3)', border: '1px solid rgba(0,200,83,0.15)' }
                  }>
                  {t.icon} {t.label}
                </Link>
              ))}
            </div>
          </FadeIn>

          {/* ════ ABA: VISÃO GERAL ════ */}
          {activeTab === 'visao-geral' && (
            <div className="space-y-4">

              {/* Stats row */}
              <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { icon: <Clock size={18}/>,     label: 'Horas Este Mês', value: minutesToHours(monthMinutes), color: '#95d69a' },
                  { icon: <UserCheck size={18}/>,  label: 'Sessões Aprovadas', value: thisMonth?.approved_sessions ?? 0, color: '#00c853' },
                  { icon: <BarChart2 size={18}/>,  label: 'Total de Sessões', value: thisMonth?.total_sessions ?? 0, color: '#3fe56c' },
                  { icon: <TrendingUp size={18}/>, label: 'Meta Concluída', value: `${pct}%`, color: statusColor },
                ].map(s => (
                  <StaggerItem key={s.label}>
                    <div
                      className="rounded-xl p-4 text-center relative overflow-hidden"
                      style={{ background: 'var(--surface-card, #0f2318)', border: '1px solid rgba(0,200,83,0.15)' }}
                    >
                      <div className="flex justify-center mb-2" style={{ color: s.color }}>{s.icon}</div>
                      <p className="text-2xl font-bold mb-1" style={{ color: 'var(--text)' }}>{s.value}</p>
                      <p className="text-xs preserve-case" style={{ color: 'var(--text-3)' }}>{s.label}</p>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerContainer>

              {/* Progress card */}
              <FadeIn delay={0.08}>
                <div
                  className="rounded-xl p-6 relative overflow-hidden"
                  style={{ background: 'var(--surface-card, #0f2318)', border: '1px solid rgba(0,200,83,0.15)' }}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl pointer-events-none"
                    style={{ background: statusColor, opacity: 0.07 }} />

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={16} style={{ color: 'var(--primary)' }} />
                      <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>Progresso da Meta Mensal</h2>
                    </div>
                    <span
                      className="text-xs font-bold px-3 py-1 rounded"
                      style={{ background: `${statusColor}18`, color: statusColor, border: `1px solid ${statusColor}40` }}>
                      {statusLabel}
                    </span>
                  </div>

                  <div className="flex items-center gap-6 mb-4">
                    <div>
                      <p className="text-3xl font-bold" style={{ color: 'var(--text)' }}>{minutesToHours(monthMinutes)}</p>
                      <p className="text-sm" style={{ color: 'var(--text-3)' }}>de {intern.total_hours_required ?? 120}h totais</p>
                    </div>
                    <div className="hidden sm:block relative flex-shrink-0">
                      <ProgressRing pct={pct} color={statusColor} size={64} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-black" style={{ color: statusColor }}>{pct}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="h-3 rounded-full overflow-hidden mb-2" style={{ background: 'var(--surface-variant)' }}>
                    <div className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: statusColor, transition: 'width 1.2s cubic-bezier(0.16,1,0.3,1)' }} />
                  </div>
                  <p className="text-sm font-semibold mb-5" style={{ color: statusColor }}>{pct}% concluído</p>

                  {/* Monthly breakdown */}
                  {hours && hours.length > 0 && (
                    <div className="space-y-3 pt-4" style={{ borderTop: '1px solid rgba(0,200,83,0.15)' }}>
                      <p className="text-xs font-semibold" style={{ color: 'var(--text-3)' }}>Últimos 3 meses</p>
                      {hours.map((h, idx) => {
                        const hPct = totalRequired > 0 ? Math.min(100, (h.total_minutes / totalRequired) * 100) : 0
                        const c = ['#3fe56c', '#00c853', '#95d69a'][idx] ?? '#3fe56c'
                        return (
                          <div key={h.month}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs capitalize preserve-case" style={{ color: 'var(--text-2)' }}>
                                {new Date(h.month).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })}
                              </span>
                              <span className="text-xs font-bold" style={{ color: 'var(--text)' }}>{minutesToHours(h.total_minutes)}</span>
                            </div>
                            <div className="h-2 rounded-full" style={{ background: 'var(--surface-variant)' }}>
                              <div className="h-full rounded-full" style={{ width: `${hPct}%`, background: c }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Info chips */}
                  {(intern.course || intern.internship_start || intern.internship_end) && (
                    <div className="flex flex-wrap gap-2 mt-4 pt-4" style={{ borderTop: '1px solid rgba(0,200,83,0.15)' }}>
                      {intern.course && (
                        <div className="flex items-center gap-1.5 rounded-lg px-3 py-1.5"
                          style={{ background: 'var(--surface-variant)', border: '1px solid rgba(0,200,83,0.15)' }}>
                          <GraduationCap size={12} style={{ color: 'var(--primary)' }} />
                          <span className="text-xs preserve-case" style={{ color: 'var(--text-2)' }}>{intern.course}</span>
                        </div>
                      )}
                      {intern.internship_start && (
                        <div className="rounded-lg px-3 py-1.5" style={{ background: 'var(--surface-variant)', border: '1px solid rgba(0,200,83,0.15)' }}>
                          <span className="text-xs" style={{ color: 'var(--text-3)' }}>Início: </span>
                          <span className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>
                            {new Date(intern.internship_start).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                          </span>
                        </div>
                      )}
                      {intern.internship_end && (
                        <div className="rounded-lg px-3 py-1.5" style={{ background: 'var(--surface-variant)', border: '1px solid rgba(0,200,83,0.15)' }}>
                          <span className="text-xs" style={{ color: 'var(--text-3)' }}>Término: </span>
                          <span className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>
                            {new Date(intern.internship_end).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </FadeIn>
            </div>
          )}

          {/* ════ ABA: HORÁRIO ════ */}
          {activeTab === 'horario' && (
            <FadeIn>
              <div
                className="rounded-xl p-6"
                style={{ background: 'var(--surface-card, #0f2318)', border: '1px solid rgba(0,200,83,0.15)' }}
              >
                <div className="flex items-center gap-2 mb-6">
                  <Calendar size={16} style={{ color: 'var(--primary)' }} />
                  <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>Horário Semanal</h2>
                </div>
                <ScheduleManager internId={intern.id} initialSchedules={schedules} totalHoursRequired={intern.total_hours_required} />
              </div>
            </FadeIn>
          )}

          {/* ════ ABA: CADASTRO ════ */}
          {activeTab === 'cadastro' && (
            <FadeIn>
              <div
                className="rounded-xl p-6"
                style={{ background: 'var(--surface-card, #0f2318)', border: '1px solid rgba(0,200,83,0.15)' }}
              >
                <h2 className="text-base font-semibold mb-6" style={{ color: 'var(--text)' }}>Dados Cadastrais</h2>
                <InternForm mode="edit" intern={intern} />
              </div>
            </FadeIn>
          )}

        </div>
      </div>
    </div>
  )
}
