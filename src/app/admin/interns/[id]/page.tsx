import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { minutesToHours, formatDate, formatTime } from '@/lib/utils'
import InternForm from '../InternForm'
import ScheduleManager from './ScheduleManager'
import type { Profile, MonthlyHours, InternSchedule } from '@/types/database'
import {
  ArrowLeft, GraduationCap, Mail,
  History, CheckCircle2, BarChart2, Settings2, Calendar,
} from 'lucide-react'
import { FadeIn } from '@/components/ui/MotionWrappers'

export const dynamic = 'force-dynamic'

type Tab = 'visao-geral' | 'horario' | 'cadastro'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}

/* ── Avatar ─────────────────────────────────────────────────── */
function Avatar({ name, photoUrl, size = 128 }: { name: string; photoUrl?: string | null; size?: number }) {
  if (photoUrl) {
    return (
      <div className="rounded-full flex-shrink-0" style={{
        width: size, height: size,
        border: '4px solid #3fe56c',
        boxShadow: '0 0 20px rgba(0,200,83,0.20)',
        overflow: 'hidden',
        position: 'relative',
      }}>
        <Image src={photoUrl} alt={name} width={size} height={size}
          className="object-cover rounded-full" style={{ width: size, height: size }} />
      </div>
    )
  }
  const initials = name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
  return (
    <div className="rounded-full flex items-center justify-center font-black flex-shrink-0"
      style={{
        width: size, height: size,
        background: 'linear-gradient(135deg, #3fe56c, #00c853)',
        color: '#003912',
        fontSize: size * 0.3,
        border: '4px solid #3fe56c',
        boxShadow: '0 0 20px rgba(0,200,83,0.20)',
      }}>
      {initials}
    </div>
  )
}

/* ── Large Circular Ring ─────────────────────────────────────── */
function BigRing({ pct, color, size = 192 }: { pct: number; color: string; size?: number }) {
  const r    = (size - 16) / 2
  const circ = 2 * Math.PI * r
  const off  = circ - (pct / 100) * circ
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(0,200,83,0.12)" strokeWidth={12} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={12}
        strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s ease', filter: `drop-shadow(0 0 8px ${color}80)` }} />
    </svg>
  )
}

export default async function InternDetailPage({ params, searchParams }: Props) {
  const { id }        = await params
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

  /* Recent records for activity feed */
  type RecentRecord = { id: string; clock_in: string; clock_out: string | null; status: string; duration_minutes: number | null }
  const { data: recentRaw } = await supabase
    .from('time_records')
    .select('id, clock_in, clock_out, status, duration_minutes')
    .eq('intern_id', id)
    .order('clock_in', { ascending: false })
    .limit(4)
  const recentRecords = (recentRaw ?? []) as RecentRecord[]

  const thisMonth    = hoursRaw?.[0]
  const monthMinutes = thisMonth?.total_minutes ?? 0
  const totalRequired = (intern.total_hours_required ?? 120) * 60
  const pct = totalRequired > 0 ? Math.min(100, Math.round((monthMinutes / totalRequired) * 100)) : 0
  const remainingMins = Math.max(0, totalRequired - monthMinutes)
  const pace = thisMonth ? ((monthMinutes / 60) / new Date().getDate() * 30 - (totalRequired / 60)) : 0

  const statusColor = pct >= 100 ? '#00c853' : pct >= 75 ? '#95d69a' : pct >= 40 ? '#3fe56c' : '#ffbf00'

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'visao-geral', label: 'Visão Geral', icon: <BarChart2 size={14} /> },
    { key: 'horario',     label: 'Horário',     icon: <Calendar size={14} /> },
    { key: 'cadastro',    label: 'Cadastro',    icon: <Settings2 size={14} /> },
  ]

  const statusIcon: Record<string, string> = {
    approved: '#00c853',
    pending:  '#ffbf00',
    rejected: '#ff5252',
  }

  const statusLabel: Record<string, string> = {
    approved: 'Sessão Aprovada',
    pending:  'Aguardando Aprovação',
    rejected: 'Sessão Reprovada',
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, minHeight:0, overflow:'hidden', background:'var(--bg)' }}>

      {/* ── TopAppBar ── */}
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
            <h2 className="text-base font-semibold leading-none" style={{ color: 'var(--text)' }}>
              {intern.full_name}
            </h2>
          </div>
        </header>
      </FadeIn>

      {/* ── Scrollable body ── */}
      <div className="no-scrollbar flex-1 min-h-0 overflow-y-auto">
        <div className="p-6" style={{ maxWidth: 1100, margin: '0 auto' }}>

          {/* ══ HERO CARD ══ */}
          <FadeIn delay={0.04}>
            <div
              className="rounded-xl p-8 mb-6 relative overflow-hidden flex flex-col md:flex-row items-center md:items-end gap-8"
              style={{ background: 'var(--surface-card, #0f2318)', border: '1px solid rgba(0,200,83,0.15)' }}
            >
              {/* Glow blob */}
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl pointer-events-none"
                style={{ background: '#00c853', opacity: 0.05, transform: 'translate(30%, -30%)' }} />

              {/* Avatar with status dot */}
              <div className="relative flex-shrink-0">
                <Avatar name={intern.full_name} photoUrl={intern.photo_url} size={128} />
                <div className="absolute bottom-2 right-2 w-5 h-5 rounded-full border-4"
                  style={{ background: intern.is_active ? '#00c853' : '#869583', borderColor: '#0f2318' }} />
              </div>

              {/* Info */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                  <h2 className="text-3xl font-bold" style={{ color: 'var(--text)' }}>{intern.full_name}</h2>
                  <span
                    className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold self-center md:self-auto"
                    style={{
                      background: intern.is_active ? 'rgba(0,200,83,0.10)' : 'rgba(134,149,131,0.10)',
                      color: intern.is_active ? '#00c853' : 'var(--text-3)',
                      border: `1px solid ${intern.is_active ? 'rgba(0,200,83,0.30)' : 'rgba(134,149,131,0.30)'}`,
                    }}
                  >
                    {intern.is_active ? 'ATIVO' : 'INATIVO'}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <p className="flex items-center justify-center md:justify-start gap-2 text-sm" style={{ color: 'var(--text-3)' }}>
                    <Mail size={15} /> {intern.email}
                  </p>
                  {intern.course && (
                    <div className="flex items-center justify-center md:justify-start gap-3 mt-3">
                      <span className="px-3 py-1 text-[11px] font-bold rounded"
                        style={{ background: 'rgba(0,200,83,0.08)', color: '#3fe56c', border: '1px solid rgba(0,200,83,0.15)' }}>
                        {intern.course.toUpperCase()}
                      </span>
                      {intern.internship_start && (
                        <span className="px-3 py-1 text-[11px] rounded" style={{ background: 'var(--surface-variant)', color: 'var(--text-3)' }}>
                          Início: {new Date(intern.internship_start).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Edit button */}
              <div className="flex gap-3 flex-shrink-0">
                <Link
                  href={`/admin/interns/${id}?tab=cadastro`}
                  className="px-6 py-2.5 rounded-lg font-bold text-sm transition-all hover:opacity-90 active:scale-95"
                  style={{ background: '#3fe56c', color: '#003912' }}
                >
                  Editar Perfil
                </Link>
              </div>
            </div>
          </FadeIn>

          {/* ── Underline Tabs ── */}
          <FadeIn delay={0.06}>
            <div className="flex gap-8 mb-6" style={{ borderBottom: '1px solid rgba(0,200,83,0.15)' }}>
              {tabs.map(t => (
                <Link key={t.key} href={`/admin/interns/${id}?tab=${t.key}`}
                  className="flex items-center gap-2 text-sm font-semibold transition-colors pb-4 inline-block"
                  style={activeTab === t.key
                    ? { color: '#3fe56c', borderBottom: '2px solid #3fe56c', marginBottom: -1 }
                    : { color: 'var(--text-3)' }
                  }
                >
                  {t.icon} {t.label}
                </Link>
              ))}
            </div>
          </FadeIn>

          {/* ════ ABA: VISÃO GERAL ════ */}
          {activeTab === 'visao-geral' && (
            <FadeIn delay={0.08}>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Left 8 cols */}
                <div className="lg:col-span-8 space-y-6">

                  {/* Metric cards row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Total de Sessões */}
                    <div
                      className="rounded-xl p-6 hover:border-green-500/40 transition-colors"
                      style={{ background: 'var(--surface-card, #0f2318)', border: '1px solid rgba(0,200,83,0.15)' }}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-[10px] font-bold tracking-wider" style={{ color: 'var(--text-3)' }}>
                          TOTAL DE SESSÕES
                        </span>
                        <History size={18} style={{ color: '#3fe56c' }} />
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-bold" style={{ color: 'var(--text)' }}>
                          {thisMonth?.total_sessions ?? 0}
                        </span>
                        {(thisMonth?.approved_sessions ?? 0) > 0 && (
                          <span className="text-xs font-bold flex items-center gap-0.5" style={{ color: '#00c853' }}>
                            ↑ {Math.round(((thisMonth?.approved_sessions ?? 0) / Math.max(1, thisMonth?.total_sessions ?? 1)) * 100)}%
                          </span>
                        )}
                      </div>
                      <p className="text-xs mt-2" style={{ color: 'var(--text-3)' }}>Registradas este mês</p>
                    </div>

                    {/* Sessões Aprovadas */}
                    <div
                      className="rounded-xl p-6 hover:border-green-500/40 transition-colors"
                      style={{ background: 'var(--surface-card, #0f2318)', border: '1px solid rgba(0,200,83,0.15)' }}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-[10px] font-bold tracking-wider" style={{ color: 'var(--text-3)' }}>
                          SESSÕES APROVADAS
                        </span>
                        <CheckCircle2 size={18} style={{ color: '#48e1a6', fill: 'rgba(72,225,166,0.15)' }} />
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-bold" style={{ color: 'var(--text)' }}>
                          {thisMonth?.approved_sessions ?? 0}
                        </span>
                        <span className="text-sm" style={{ color: 'var(--text-3)' }}>
                          / {thisMonth?.total_sessions ?? 0} total
                        </span>
                      </div>
                      <div className="w-full rounded-full mt-4 overflow-hidden h-1.5"
                        style={{ background: 'rgba(0,200,83,0.12)' }}>
                        <div className="h-full rounded-full" style={{
                          width: `${thisMonth?.total_sessions ? Math.round((thisMonth.approved_sessions / thisMonth.total_sessions) * 100) : 0}%`,
                          background: '#48e1a6',
                        }} />
                      </div>
                    </div>
                  </div>

                  {/* Monthly goal progress */}
                  <div
                    className="rounded-xl p-8"
                    style={{ background: 'var(--surface-card, #0f2318)', border: '1px solid rgba(0,200,83,0.15)' }}
                  >
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>
                        Progresso da Meta Mensal
                      </h3>
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold"
                        style={{ background: 'rgba(149,214,154,0.12)', color: '#95d69a', border: '1px solid rgba(149,214,154,0.25)' }}>
                        {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()}
                      </span>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-10">
                      {/* Big ring */}
                      <div className="relative flex-shrink-0" style={{ width: 192, height: 192 }}>
                        <BigRing pct={pct} color={statusColor} size={192} />
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-4xl font-bold" style={{ color: 'var(--text)' }}>{pct}%</span>
                          <span className="text-[10px] font-bold tracking-wider mt-1" style={{ color: 'var(--text-3)' }}>META</span>
                        </div>
                      </div>

                      {/* Right side: bar + stats */}
                      <div className="flex-1 w-full space-y-6">
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-base" style={{ color: 'var(--text)' }}>Horas Registradas</span>
                            <span className="font-bold" style={{ color: statusColor }}>
                              {minutesToHours(monthMinutes)} / {intern.total_hours_required ?? 120}h
                            </span>
                          </div>
                          <div className="w-full rounded-full overflow-hidden p-0.5 h-3"
                            style={{ background: 'rgba(0,200,83,0.12)' }}>
                            <div className="h-full rounded-full"
                              style={{
                                width: `${pct}%`,
                                background: statusColor,
                                boxShadow: `0 0 8px ${statusColor}66`,
                                transition: 'width 1.2s cubic-bezier(0.16,1,0.3,1)',
                              }} />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="rounded-lg p-4" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(0,200,83,0.15)' }}>
                            <p className="text-[10px] font-bold mb-1 tracking-wider" style={{ color: 'var(--text-3)' }}>RESTANTE</p>
                            <p className="text-2xl font-semibold" style={{ color: 'var(--text)' }}>{minutesToHours(remainingMins)}</p>
                          </div>
                          <div className="rounded-lg p-4" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(0,200,83,0.15)' }}>
                            <p className="text-[10px] font-bold mb-1 tracking-wider" style={{ color: 'var(--text-3)' }}>RITMO</p>
                            <p className="text-2xl font-semibold" style={{ color: pace >= 0 ? '#00c853' : '#ffbf00' }}>
                              {pace >= 0 ? '+' : ''}{pace.toFixed(1)}h
                            </p>
                          </div>
                        </div>

                        {/* Monthly breakdown */}
                        {hours && hours.length > 1 && (
                          <div className="space-y-2 pt-4" style={{ borderTop: '1px solid rgba(0,200,83,0.10)' }}>
                            {hours.slice(0, 3).map((h, idx) => {
                              const hPct = totalRequired > 0 ? Math.min(100, (h.total_minutes / totalRequired) * 100) : 0
                              const c = ['#3fe56c', '#00c853', '#95d69a'][idx] ?? '#3fe56c'
                              return (
                                <div key={h.month}>
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs capitalize" style={{ color: 'var(--text-2)' }}>
                                      {new Date(h.month).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })}
                                    </span>
                                    <span className="text-xs font-bold" style={{ color: 'var(--text)' }}>{minutesToHours(h.total_minutes)}</span>
                                  </div>
                                  <div className="h-1.5 rounded-full" style={{ background: 'rgba(0,200,83,0.10)' }}>
                                    <div className="h-full rounded-full" style={{ width: `${hPct}%`, background: c }} />
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right 4 cols — Activity Feed */}
                <div className="lg:col-span-4">
                  <div
                    className="rounded-xl p-6 h-full"
                    style={{ background: 'var(--surface-card, #0f2318)', border: '1px solid rgba(0,200,83,0.15)' }}
                  >
                    <h3 className="text-xl font-semibold mb-6" style={{ color: 'var(--text)' }}>
                      Feed de Atividades
                    </h3>

                    {recentRecords.length > 0 ? (
                      <div className="space-y-6">
                        {recentRecords.slice(0, 3).map((rec, i) => (
                          <div key={rec.id} className="flex gap-4 relative">
                            {i < 2 && (
                              <div className="absolute left-4 top-8 bottom-0 w-px" style={{ background: 'rgba(0,200,83,0.15)' }} />
                            )}
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10"
                              style={{
                                background: `${statusIcon[rec.status] ?? '#869583'}18`,
                                border: `1px solid ${statusIcon[rec.status] ?? '#869583'}40`,
                              }}
                            >
                              <div className="w-2 h-2 rounded-full" style={{ background: statusIcon[rec.status] ?? '#869583' }} />
                            </div>
                            <div className={i < recentRecords.length - 1 ? 'pb-6' : ''}>
                              <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                                {statusLabel[rec.status] ?? 'Registro'}
                              </p>
                              <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                                {formatDate(rec.clock_in)} às {formatTime(rec.clock_in)}
                                {rec.duration_minutes ? ` · ${minutesToHours(rec.duration_minutes)}` : ''}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-center py-8" style={{ color: 'var(--text-3)' }}>
                        Nenhuma atividade recente.
                      </p>
                    )}

                    <Link
                      href={`/admin/approvals`}
                      className="w-full mt-8 py-3 rounded-lg text-sm font-bold flex items-center justify-center transition-all hover:opacity-80"
                      style={{ border: '1px solid rgba(0,200,83,0.15)', color: 'var(--text-3)' }}
                    >
                      Ver Todas as Aprovações
                    </Link>
                  </div>
                </div>
              </div>
            </FadeIn>
          )}

          {/* ════ ABA: HORÁRIO ════ */}
          {activeTab === 'horario' && (
            <FadeIn delay={0.08}>
              <ScheduleManager internId={intern.id} initialSchedules={schedules} totalHoursRequired={intern.total_hours_required} />
            </FadeIn>
          )}

          {/* ════ ABA: CADASTRO ════ */}
          {activeTab === 'cadastro' && (
            <FadeIn delay={0.08}>
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
