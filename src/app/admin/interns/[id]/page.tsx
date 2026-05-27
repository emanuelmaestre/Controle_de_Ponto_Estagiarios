import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { minutesToHours } from '@/lib/utils'
import InternForm from '../InternForm'
import ScheduleManager from './ScheduleManager'
import type { Profile, MonthlyHours, InternSchedule } from '@/types/database'
import {
  Clock, TrendingUp, Calendar, UserCheck, GraduationCap,
  BarChart2, Settings2, ArrowLeft,
} from 'lucide-react'
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/MotionWrappers'

export const dynamic = 'force-dynamic'

type Tab = 'visao-geral' | 'horario' | 'cadastro'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}

/* ── Initials Avatar ─────────────────────────────────────── */
function InitialsAvatar({ name, photoUrl, size = 56 }: { name: string; photoUrl?: string | null; size?: number }) {
  if (photoUrl) {
    return (
      <Image
        src={photoUrl}
        alt={name}
        width={size}
        height={size}
        className="rounded-2xl object-cover ring-2"
        style={{ width: size, height: size, outline: '2px solid rgba(255,255,255,0.2)', outlineOffset: 0 }}
      />
    )
  }
  const initials = name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
  return (
    <div
      className="rounded-2xl flex items-center justify-center font-black text-white flex-shrink-0"
      style={{
        width: size, height: size,
        background: 'linear-gradient(135deg, var(--primary-light), var(--primary-dark))',
        fontSize: size * 0.33,
        boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
      }}
    >
      {initials}
    </div>
  )
}

/* ── Circular Progress Ring (SVG) ────────────────────────── */
function ProgressRing({ pct, color, size = 72 }: { pct: number; color: string; size?: number }) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={6} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={6}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s ease' }}
      />
    </svg>
  )
}

export default async function InternDetailPage({ params, searchParams }: Props) {
  const { id } = await params
  const { tab: tabParam } = await searchParams
  const activeTab = (['visao-geral', 'horario', 'cadastro'].includes(tabParam ?? '')
    ? tabParam : 'visao-geral') as Tab

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: internRaw } = await supabase
    .from('profiles').select('*').eq('id', id).eq('role', 'intern').single()
  const intern = internRaw as Profile | null
  if (!intern) notFound()

  // Last 3 months
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
  const { data: hoursRaw } = await supabase
    .from('v_monthly_hours').select('*').eq('intern_id', id)
    .gte('month', threeMonthsAgo.toISOString()).order('month', { ascending: false })
  const hours = hoursRaw as MonthlyHours[] | null

  const { data: schedulesRaw } = await supabase.from('intern_schedules').select('*').eq('intern_id', id)
  const schedules = (schedulesRaw ?? []) as InternSchedule[]

  const thisMonth = hoursRaw?.[0]
  const monthMinutes = thisMonth?.total_minutes ?? 0
  const totalRequired = (intern.total_hours_required ?? 120) * 60
  const pct = totalRequired > 0 ? Math.min(100, Math.round((monthMinutes / totalRequired) * 100)) : 0

  const statusLabel = pct >= 100 ? 'CONCLUÍDO' : pct >= 75 ? 'QUASE LÁ' : pct >= 40 ? 'EM DIA' : 'ATENÇÃO'
  const statusColor = pct >= 100 ? 'var(--success)' : pct >= 75 ? 'var(--info)' : pct >= 40 ? 'var(--primary-light)' : 'var(--warning)'

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'visao-geral', label: 'VISÃO GERAL', icon: <BarChart2 size={13} /> },
    { key: 'horario',     label: 'HORÁRIO',     icon: <Calendar size={13} /> },
    { key: 'cadastro',    label: 'CADASTRO',    icon: <Settings2 size={13} /> },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, background: 'var(--bg)', overflow: 'hidden' }}>

      {/* ── Hero Header ───────────────────────────────────── */}
      <div className="relative overflow-hidden flex-shrink-0" style={{ background: 'var(--nav-bg)' }}>
        {/* Dot grid */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '22px 22px' }} />
        {/* Glow orb */}
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'var(--primary)', opacity: 0.25 }} />
        <div className="absolute -bottom-10 left-0 w-40 h-40 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'var(--accent)', opacity: 0.10 }} />

        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          {/* Back link */}
          <Link href="/admin/interns"
            className="inline-flex items-center gap-1.5 text-xs font-bold mb-4 transition-opacity hover:opacity-70"
            style={{ color: 'rgba(255,255,255,0.55)' }}>
            <ArrowLeft size={12} /> ESTAGIÁRIOS
          </Link>

          {/* Intern info row */}
          <div className="flex items-center gap-4 mb-5">
            {/* Avatar + ring */}
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 rounded-2xl" style={{
                background: `conic-gradient(${statusColor} ${pct}%, transparent ${pct}%)`,
                padding: 3, borderRadius: 20,
              }} />
              <div className="relative" style={{ padding: 3 }}>
                <InitialsAvatar name={intern.full_name} photoUrl={intern.photo_url} size={56} />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-black text-base sm:text-lg text-white truncate">{intern.full_name}</h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{
                    background: intern.is_active ? 'rgba(34,197,94,0.18)' : 'rgba(148,163,184,0.15)',
                    color: intern.is_active ? '#4ade80' : 'rgba(255,255,255,0.4)',
                    border: `1px solid ${intern.is_active ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.1)'}`,
                  }}>
                  {intern.is_active ? 'ATIVO' : 'INATIVO'}
                </span>
              </div>
              <p className="text-xs preserve-case truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>{intern.email}</p>
              {intern.course && (
                <div className="flex items-center gap-1 mt-0.5">
                  <GraduationCap size={10} style={{ color: 'rgba(255,255,255,0.35)' }} />
                  <p className="text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>{intern.course}</p>
                </div>
              )}
            </div>

            {/* Progress ring on desktop */}
            <div className="hidden sm:flex flex-col items-center flex-shrink-0">
              <div className="relative">
                <ProgressRing pct={pct} color={statusColor} size={68} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xs font-black text-white leading-none">{pct}%</span>
                </div>
              </div>
              <span className="text-[9px] font-bold mt-1" style={{ color: statusColor }}>{statusLabel}</span>
            </div>
          </div>

          {/* Mini progress bar on mobile */}
          <div className="sm:hidden mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold" style={{ color: 'rgba(255,255,255,0.5)' }}>PROGRESSO</span>
              <span className="text-[10px] font-bold" style={{ color: statusColor }}>{pct}% · {statusLabel}</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: statusColor, transition: 'width 1s ease' }} />
            </div>
          </div>

          {/* Tab nav */}
          <div className="flex gap-1 overflow-x-auto pb-1">
            {tabs.map(t => (
              <Link
                key={t.key}
                href={`/admin/interns/${id}?tab=${t.key}`}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0"
                style={activeTab === t.key
                  ? { background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }
                  : { color: 'rgba(255,255,255,0.45)', border: '1px solid transparent' }
                }
              >
                {t.icon} {t.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab Content ───────────────────────────────────── */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div className="no-scrollbar" style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-5" style={{ flex: 1 }}>

            {/* ── ABA: VISÃO GERAL ────────────────────────── */}
            {activeTab === 'visao-geral' && (
              <div className="space-y-4">
                {/* Stats row */}
                <StaggerContainer className="grid grid-cols-3 gap-3">
                  {[
                    {
                      icon: <Clock size={18} />,
                      label: 'SESSÕES',
                      value: thisMonth?.total_sessions ?? 0,
                      sub: 'ESTE MÊS',
                      color: 'var(--info)',
                    },
                    {
                      icon: <UserCheck size={18} />,
                      label: 'APROVADAS',
                      value: thisMonth?.approved_sessions ?? 0,
                      sub: 'CONFIRMADAS',
                      color: 'var(--success)',
                    },
                    {
                      icon: <Calendar size={18} />,
                      label: 'PENDENTES',
                      value: thisMonth?.pending_sessions ?? 0,
                      sub: 'AGUARDANDO',
                      color: 'var(--warning)',
                    },
                  ].map(s => (
                    <StaggerItem key={s.label}>
                      <div className="rounded-2xl p-3 sm:p-4 text-center relative overflow-hidden"
                        style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}>
                        {/* Glow */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full blur-xl pointer-events-none"
                          style={{ background: s.color, opacity: 0.15 }} />
                        <div className="flex justify-center mb-2 relative" style={{ color: s.color }}>{s.icon}</div>
                        <p className="text-2xl font-black relative" style={{ color: 'var(--text)' }}>{s.value}</p>
                        <p className="text-[9px] font-bold mt-0.5" style={{ color: 'var(--text-3)' }}>{s.label}</p>
                        <p className="text-[8px] mt-0.5" style={{ color: 'var(--text-3)', opacity: 0.6 }}>{s.sub}</p>
                      </div>
                    </StaggerItem>
                  ))}
                </StaggerContainer>

                {/* Hour progress card */}
                <FadeIn delay={0.1}>
                  <div className="rounded-2xl p-5 relative overflow-hidden"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}>
                    {/* Decorative glow */}
                    <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl pointer-events-none"
                      style={{ background: statusColor, opacity: 0.08 }} />

                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp size={16} style={{ color: 'var(--primary)' }} />
                      <h2 className="font-bold text-sm" style={{ color: 'var(--text)' }}>PROGRESSO DE HORAS</h2>
                      <span className="ml-auto text-[10px] font-bold px-2.5 py-1 rounded-full"
                        style={{ background: `${statusColor}18`, color: statusColor, border: `1px solid ${statusColor}30` }}>
                        {statusLabel}
                      </span>
                    </div>

                    {/* Big number */}
                    <div className="flex items-end justify-between mb-3">
                      <div>
                        <p className="text-3xl font-black" style={{ color: 'var(--text)' }}>{minutesToHours(monthMinutes)}</p>
                        <p className="text-[10px] font-bold mt-0.5" style={{ color: 'var(--text-3)' }}>
                          DE {intern.total_hours_required ?? 120}H TOTAIS
                        </p>
                      </div>
                      {/* Mini ring */}
                      <div className="relative hidden sm:block">
                        <ProgressRing pct={pct} color={statusColor} size={64} />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-sm font-black" style={{ color: statusColor }}>{pct}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Progress track */}
                    <div className="h-3 rounded-full overflow-hidden mb-1.5" style={{ background: 'var(--bg)' }}>
                      <div className="h-full rounded-full relative"
                        style={{ width: `${pct}%`, background: statusColor, transition: 'width 1.2s cubic-bezier(0.16,1,0.3,1)' }}>
                        {/* Shimmer */}
                        <div className="absolute inset-0 rounded-full opacity-40"
                          style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)' }} />
                      </div>
                    </div>
                    <p className="text-[10px] font-bold" style={{ color: statusColor }}>{pct}% CONCLUÍDO</p>

                    {/* Monthly breakdown */}
                    {hours && hours.length > 0 && (
                      <div className="mt-5 pt-4 space-y-3" style={{ borderTop: '1px solid var(--border)' }}>
                        <p className="text-[10px] font-bold" style={{ color: 'var(--text-3)' }}>ÚLTIMOS 3 MESES</p>
                        {hours.map((h, idx) => {
                          const hPct = totalRequired > 0 ? Math.min(100, (h.total_minutes / totalRequired) * 100) : 0
                          const monthColors = ['var(--primary-light)', 'var(--primary)', 'var(--primary-dark)']
                          const c = monthColors[idx] ?? 'var(--primary)'
                          return (
                            <div key={h.month}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-bold" style={{ color: 'var(--text-2)' }}>
                                  {new Date(h.month).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).toUpperCase()}
                                </span>
                                <span className="text-[10px] font-bold" style={{ color: 'var(--text)' }}>
                                  {minutesToHours(h.total_minutes)}
                                </span>
                              </div>
                              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg)' }}>
                                <div className="h-full rounded-full" style={{ width: `${hPct}%`, background: c, transition: `width ${1 + idx * 0.15}s ease` }} />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </FadeIn>

                {/* Course / period card */}
                {(intern.course || intern.internship_start || intern.internship_end) && (
                  <FadeIn delay={0.18}>
                    <div className="rounded-2xl p-4 sm:p-5"
                      style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}>
                      <div className="flex items-center gap-2 mb-3">
                        <GraduationCap size={15} style={{ color: 'var(--primary)' }} />
                        <h2 className="font-bold text-sm" style={{ color: 'var(--text)' }}>INFORMAÇÕES ACADÊMICAS</h2>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {intern.course && (
                          <div className="rounded-xl p-3" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                            <p className="text-[9px] font-bold mb-1" style={{ color: 'var(--text-3)' }}>CURSO</p>
                            <p className="text-xs font-bold" style={{ color: 'var(--text)' }}>{intern.course}</p>
                          </div>
                        )}
                        {intern.internship_start && (
                          <div className="rounded-xl p-3" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                            <p className="text-[9px] font-bold mb-1" style={{ color: 'var(--text-3)' }}>INÍCIO</p>
                            <p className="text-xs font-bold" style={{ color: 'var(--text)' }}>
                              {new Date(intern.internship_start).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                            </p>
                          </div>
                        )}
                        {intern.internship_end && (
                          <div className="rounded-xl p-3" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                            <p className="text-[9px] font-bold mb-1" style={{ color: 'var(--text-3)' }}>TÉRMINO</p>
                            <p className="text-xs font-bold" style={{ color: 'var(--text)' }}>
                              {new Date(intern.internship_end).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </FadeIn>
                )}
              </div>
            )}

            {/* ── ABA: HORÁRIO ────────────────────────────── */}
            {activeTab === 'horario' && (
              <FadeIn>
                <div className="rounded-2xl p-5"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}>
                  <div className="flex items-center gap-2 mb-5">
                    <Calendar size={16} style={{ color: 'var(--primary)' }} />
                    <h2 className="font-bold text-sm" style={{ color: 'var(--text)' }}>HORÁRIO SEMANAL</h2>
                  </div>
                  <ScheduleManager
                    internId={intern.id}
                    initialSchedules={schedules}
                    totalHoursRequired={intern.total_hours_required}
                  />
                </div>
              </FadeIn>
            )}

            {/* ── ABA: CADASTRO ───────────────────────────── */}
            {activeTab === 'cadastro' && (
              <FadeIn>
                <div className="rounded-2xl p-5"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}>
                  <h2 className="font-bold text-sm mb-5" style={{ color: 'var(--text)' }}>DADOS CADASTRAIS</h2>
                  <InternForm mode="edit" intern={intern} />
                </div>
              </FadeIn>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
