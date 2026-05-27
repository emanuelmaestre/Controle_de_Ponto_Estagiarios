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
function InitialsAvatar({ name, photoUrl, size = 52 }: { name: string; photoUrl?: string | null; size?: number }) {
  if (photoUrl) {
    return (
      <Image src={photoUrl} alt={name} width={size} height={size}
        className="rounded-2xl object-cover"
        style={{ width: size, height: size, outline: '2px solid rgba(255,255,255,0.15)', outlineOffset: 0 }} />
    )
  }
  const initials = name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
  return (
    <div className="rounded-2xl flex items-center justify-center font-black text-white flex-shrink-0"
      style={{
        width: size, height: size,
        background: 'linear-gradient(135deg, var(--primary-light), var(--primary-dark))',
        fontSize: size * 0.33,
        boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
      }}>
      {initials}
    </div>
  )
}

/* ── Circular Progress Ring ──────────────────────────────── */
function ProgressRing({ pct, color, size = 60 }: { pct: number; color: string; size?: number }) {
  const r    = (size - 7) / 2
  const circ = 2 * Math.PI * r
  const off  = circ - (pct / 100) * circ
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={5.5} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={5.5}
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

  const statusLabel = pct >= 100 ? 'CONCLUÍDO' : pct >= 75 ? 'QUASE LÁ' : pct >= 40 ? 'EM DIA' : 'ATENÇÃO'
  const statusColor = pct >= 100 ? 'var(--success)' : pct >= 75 ? 'var(--info)' : pct >= 40 ? 'var(--primary-light)' : 'var(--warning)'

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'visao-geral', label: 'VISÃO GERAL', icon: <BarChart2 size={12} /> },
    { key: 'horario',     label: 'HORÁRIO',     icon: <Calendar size={12} /> },
    { key: 'cadastro',    label: 'CADASTRO',    icon: <Settings2 size={12} /> },
  ]

  return (
    /* Outer: fills the content area from layout, no overflow */
    <div style={{ display:'flex', flexDirection:'column', flex:1, minHeight:0, overflow:'hidden', background:'var(--bg)' }}>

      {/* ── Compact Hero Header ─────────────────────── */}
      <div className="flex-shrink-0 relative overflow-hidden" style={{ background: 'var(--nav-bg)' }}>
        {/* Decorations */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{ backgroundImage:'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize:'20px 20px' }} />
        <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full blur-3xl pointer-events-none"
          style={{ background:'var(--primary)', opacity:0.2 }} />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-3 pb-0">
          {/* Back + Intern info in one compact row */}
          <div className="flex items-center gap-3 mb-3">
            <Link href="/admin/interns"
              className="flex items-center gap-1 text-xs font-bold flex-shrink-0 transition-opacity hover:opacity-70"
              style={{ color: 'rgba(255,255,255,0.45)' }}>
              <ArrowLeft size={11} /> ESTAGIÁRIOS
            </Link>

            <div className="flex items-center gap-3 flex-1 min-w-0">
              <InitialsAvatar name={intern.full_name} photoUrl={intern.photo_url} size={44} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-black text-sm sm:text-base text-white truncate">{intern.full_name}</h1>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{
                      background: intern.is_active ? 'rgba(34,197,94,0.18)' : 'rgba(148,163,184,0.12)',
                      color: intern.is_active ? '#4ade80' : 'rgba(255,255,255,0.35)',
                      border: `1px solid ${intern.is_active ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.08)'}`,
                    }}>
                    {intern.is_active ? 'ATIVO' : 'INATIVO'}
                  </span>
                </div>
                <p className="text-[10px] preserve-case truncate" style={{ color:'rgba(255,255,255,0.4)' }}>{intern.email}</p>
                {intern.course && (
                  <div className="flex items-center gap-1">
                    <GraduationCap size={9} style={{ color:'rgba(255,255,255,0.3)', flexShrink:0 }} />
                    <p className="text-[9px] truncate" style={{ color:'rgba(255,255,255,0.3)' }}>{intern.course}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Progress ring — desktop */}
            <div className="hidden sm:flex flex-col items-center flex-shrink-0">
              <div className="relative">
                <ProgressRing pct={pct} color={statusColor} size={58} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[11px] font-black text-white">{pct}%</span>
                </div>
              </div>
              <span className="text-[9px] font-bold mt-0.5" style={{ color: statusColor }}>{statusLabel}</span>
            </div>
          </div>

          {/* Mobile progress bar */}
          <div className="sm:hidden mb-3">
            <div className="flex justify-between mb-1">
              <span className="text-[9px]" style={{ color:'rgba(255,255,255,0.4)' }}>PROGRESSO</span>
              <span className="text-[9px] font-bold" style={{ color: statusColor }}>{pct}% · {statusLabel}</span>
            </div>
            <div className="h-1 rounded-full" style={{ background:'rgba(255,255,255,0.1)' }}>
              <div className="h-full rounded-full" style={{ width:`${pct}%`, background:statusColor }} />
            </div>
          </div>

          {/* Tab nav */}
          <div className="flex gap-1">
            {tabs.map(t => (
              <Link key={t.key} href={`/admin/interns/${id}?tab=${t.key}`}
                className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold whitespace-nowrap transition-all rounded-t-xl"
                style={activeTab === t.key
                  ? { background:'var(--bg)', color:'var(--text)', borderTop:'1px solid var(--border)', borderLeft:'1px solid var(--border)', borderRight:'1px solid var(--border)' }
                  : { color:'rgba(255,255,255,0.4)' }
                }>
                {t.icon} {t.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab Content — truly fills remaining height, no scrollbar ── */}
      <div className="no-scrollbar" style={{ flex:1, minHeight:0, overflowY:'auto', background:'var(--bg)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 h-full">

          {/* ════ ABA: VISÃO GERAL ════ */}
          {activeTab === 'visao-geral' && (
            <div className="h-full flex flex-col gap-3">

              {/* Stats row — 3 compact cards */}
              <StaggerContainer className="grid grid-cols-3 gap-3 flex-shrink-0">
                {[
                  { icon: <Clock size={16}/>,     label:'SESSÕES',   value: thisMonth?.total_sessions ?? 0,          color:'var(--info)' },
                  { icon: <UserCheck size={16}/>, label:'APROVADAS', value: thisMonth?.approved_sessions ?? 0,        color:'var(--success)' },
                  { icon: <Calendar size={16}/>,  label:'PENDENTES', value: thisMonth?.pending_sessions ?? 0,         color:'var(--warning)' },
                ].map(s => (
                  <StaggerItem key={s.label}>
                    <div className="rounded-2xl p-3 text-center relative overflow-hidden"
                      style={{ background:'var(--surface)', border:'1px solid var(--border)', boxShadow:'var(--card-shadow)' }}>
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full blur-xl pointer-events-none"
                        style={{ background:s.color, opacity:0.18 }} />
                      <div className="flex justify-center mb-1" style={{ color:s.color }}>{s.icon}</div>
                      <p className="text-xl font-black" style={{ color:'var(--text)' }}>{s.value}</p>
                      <p className="text-[9px] font-bold mt-0.5" style={{ color:'var(--text-3)' }}>{s.label}</p>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerContainer>

              {/* Progress card — grows to fill */}
              <FadeIn delay={0.08} className="flex-1 min-h-0">
                <div className="rounded-2xl p-4 h-full relative overflow-hidden"
                  style={{ background:'var(--surface)', border:'1px solid var(--border)', boxShadow:'var(--card-shadow)' }}>
                  <div className="absolute top-0 right-0 w-28 h-28 rounded-full blur-3xl pointer-events-none"
                    style={{ background:statusColor, opacity:0.07 }} />

                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp size={14} style={{ color:'var(--primary)' }} />
                    <h2 className="font-bold text-xs" style={{ color:'var(--text)' }}>PROGRESSO DE HORAS</h2>
                    <span className="ml-auto text-[9px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background:`${statusColor}18`, color:statusColor, border:`1px solid ${statusColor}30` }}>
                      {statusLabel}
                    </span>
                  </div>

                  {/* Number + ring */}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-2xl font-black" style={{ color:'var(--text)' }}>{minutesToHours(monthMinutes)}</p>
                      <p className="text-[10px]" style={{ color:'var(--text-3)' }}>DE {intern.total_hours_required ?? 120}H TOTAIS</p>
                    </div>
                    <div className="hidden sm:block relative flex-shrink-0">
                      <ProgressRing pct={pct} color={statusColor} size={56} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-black" style={{ color:statusColor }}>{pct}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Bar */}
                  <div className="h-2.5 rounded-full overflow-hidden mb-1" style={{ background:'var(--bg)' }}>
                    <div className="h-full rounded-full relative"
                      style={{ width:`${pct}%`, background:statusColor, transition:'width 1.2s cubic-bezier(0.16,1,0.3,1)' }}>
                      <div className="absolute inset-0 rounded-full opacity-40"
                        style={{ background:'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)' }} />
                    </div>
                  </div>
                  <p className="text-[10px] font-bold mb-4" style={{ color:statusColor }}>{pct}% CONCLUÍDO</p>

                  {/* Monthly breakdown — compact */}
                  {hours && hours.length > 0 && (
                    <div className="space-y-2 pt-3" style={{ borderTop:'1px solid var(--border)' }}>
                      <p className="text-[9px] font-bold" style={{ color:'var(--text-3)' }}>ÚLTIMOS 3 MESES</p>
                      {hours.map((h, idx) => {
                        const hPct = totalRequired > 0 ? Math.min(100, (h.total_minutes / totalRequired) * 100) : 0
                        const c = ['var(--primary-light)','var(--primary)','var(--primary-dark)'][idx] ?? 'var(--primary)'
                        return (
                          <div key={h.month}>
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-[9px] font-bold" style={{ color:'var(--text-2)' }}>
                                {new Date(h.month).toLocaleDateString('pt-BR', { month:'short', year:'numeric', timeZone:'UTC' }).toUpperCase()}
                              </span>
                              <span className="text-[9px] font-bold" style={{ color:'var(--text)' }}>{minutesToHours(h.total_minutes)}</span>
                            </div>
                            <div className="h-1.5 rounded-full" style={{ background:'var(--bg)' }}>
                              <div className="h-full rounded-full" style={{ width:`${hPct}%`, background:c }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Course + period chips */}
                  {(intern.course || intern.internship_start || intern.internship_end) && (
                    <div className="flex flex-wrap gap-2 mt-3 pt-3" style={{ borderTop:'1px solid var(--border)' }}>
                      {intern.course && (
                        <div className="flex items-center gap-1 rounded-lg px-2 py-1"
                          style={{ background:'var(--bg)', border:'1px solid var(--border)' }}>
                          <GraduationCap size={10} style={{ color:'var(--primary)' }} />
                          <span className="text-[9px] font-bold" style={{ color:'var(--text-2)' }}>{intern.course}</span>
                        </div>
                      )}
                      {intern.internship_start && (
                        <div className="rounded-lg px-2 py-1" style={{ background:'var(--bg)', border:'1px solid var(--border)' }}>
                          <span className="text-[9px] font-bold" style={{ color:'var(--text-3)' }}>INÍCIO: </span>
                          <span className="text-[9px] font-bold" style={{ color:'var(--text-2)' }}>
                            {new Date(intern.internship_start).toLocaleDateString('pt-BR',{timeZone:'UTC'})}
                          </span>
                        </div>
                      )}
                      {intern.internship_end && (
                        <div className="rounded-lg px-2 py-1" style={{ background:'var(--bg)', border:'1px solid var(--border)' }}>
                          <span className="text-[9px] font-bold" style={{ color:'var(--text-3)' }}>TÉRMINO: </span>
                          <span className="text-[9px] font-bold" style={{ color:'var(--text-2)' }}>
                            {new Date(intern.internship_end).toLocaleDateString('pt-BR',{timeZone:'UTC'})}
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
            <FadeIn className="h-full flex flex-col">
              <div className="rounded-2xl p-4 sm:p-5 flex-1 flex flex-col"
                style={{ background:'var(--surface)', border:'1px solid var(--border)', boxShadow:'var(--card-shadow)' }}>
                <div className="flex items-center gap-2 mb-4 flex-shrink-0">
                  <Calendar size={14} style={{ color:'var(--primary)' }} />
                  <h2 className="font-bold text-sm" style={{ color:'var(--text)' }}>HORÁRIO SEMANAL</h2>
                </div>
                <div className="flex-1 min-h-0 no-scrollbar" style={{ overflowY:'auto' }}>
                  <ScheduleManager internId={intern.id} initialSchedules={schedules} totalHoursRequired={intern.total_hours_required} />
                </div>
              </div>
            </FadeIn>
          )}

          {/* ════ ABA: CADASTRO ════ */}
          {activeTab === 'cadastro' && (
            <FadeIn className="h-full flex flex-col">
              <div className="rounded-2xl p-4 sm:p-5 flex-1 flex flex-col"
                style={{ background:'var(--surface)', border:'1px solid var(--border)', boxShadow:'var(--card-shadow)' }}>
                <h2 className="font-bold text-sm mb-4 flex-shrink-0" style={{ color:'var(--text)' }}>DADOS CADASTRAIS</h2>
                <div className="flex-1 min-h-0 no-scrollbar" style={{ overflowY:'auto' }}>
                  <InternForm mode="edit" intern={intern} />
                </div>
              </div>
            </FadeIn>
          )}

        </div>
      </div>
    </div>
  )
}
