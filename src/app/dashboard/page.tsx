import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { formatTime, minutesToHours } from '@/lib/utils'
import ClockButton from '@/components/ClockButton'
import StatusBadge from '@/components/StatusBadge'
import ProgressRing from '@/components/ui/ProgressRing'
import { FadeIn, StaggerContainer, StaggerItem, ScaleIn } from '@/components/ui/MotionWrappers'
import { Home, ClipboardList, LogOut, Clock, TrendingUp, Calendar, AlertTriangle, CheckCircle, Trophy, Rocket, Zap, Target, Dumbbell } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'
import LiveClock from '@/components/ui/LiveClock'
import type { RecordStatus } from '@/types/database'

export const dynamic = 'force-dynamic'

// ─── Helpers de gamificação ─────────────────────────────────
function getHourStatus(pct: number) {
  if (pct >= 100) return {
    label: 'CARGA CONCLUIDA',
    color: 'var(--success)',
    bg: 'rgba(22,163,74,0.10)',
    border: 'rgba(22,163,74,0.25)',
    icon: <Trophy size={20} />,
    msg: 'Parabens! Voce completou sua carga horaria do mes.',
    sub: 'Continue sendo um exemplo de dedicacao e compromisso.',
  }
  if (pct >= 80) return {
    label: 'QUASE LA',
    color: 'var(--info)',
    bg: 'rgba(14,165,233,0.10)',
    border: 'rgba(14,165,233,0.25)',
    icon: <Rocket size={20} />,
    msg: 'Voce esta quase la! Falta pouco para completar sua meta.',
    sub: 'Mantenha o ritmo — voce esta indo muito bem!',
  }
  if (pct >= 50) return {
    label: 'EM DIA',
    color: 'var(--primary)',
    bg: 'rgba(30,92,45,0.10)',
    border: 'rgba(30,92,45,0.25)',
    icon: <Dumbbell size={20} />,
    msg: 'Otimo progresso! Voce esta na metade do caminho.',
    sub: 'Continue comparecendo para manter sua carga em dia.',
  }
  if (pct >= 25) return {
    label: 'ATENCAO',
    color: 'var(--warning)',
    bg: 'rgba(217,119,6,0.10)',
    border: 'rgba(217,119,6,0.25)',
    icon: <Zap size={20} />,
    msg: 'Voce esta progredindo, mas ainda ha horas a cumprir.',
    sub: 'Organize sua agenda para manter o ritmo e evitar pendencias.',
  }
  return {
    label: 'HORAS PENDENTES',
    color: 'var(--danger)',
    bg: 'rgba(220,38,38,0.10)',
    border: 'rgba(220,38,38,0.25)',
    icon: <Target size={20} />,
    msg: 'Atencao: suas horas precisam de dedicacao agora.',
    sub: 'Cada presenca conta. Voce ainda pode regularizar sua situacao!',
  }
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, total_hours_required')
    .eq('id', user.id)
    .maybeSingle()

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Ola'

  const { data: openRecord } = await supabase
    .from('time_records')
    .select('id, clock_in')
    .eq('intern_id', user.id)
    .is('clock_out', null)
    .maybeSingle()

  const today = new Date().toISOString().slice(0, 10)
  const { data: todayRecords } = await supabase
    .from('time_records')
    .select('id, clock_in, clock_out, duration_minutes, status')
    .eq('intern_id', user.id)
    .gte('clock_in', `${today}T00:00:00Z`)
    .order('clock_in', { ascending: false })

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
  const { data: monthData } = await supabase
    .from('v_monthly_hours')
    .select('total_minutes, approved_sessions, pending_sessions')
    .eq('intern_id', user.id)
    .gte('month', monthStart)
    .maybeSingle()

  // Horario de hoje
  const todayDow = new Date().getDay()
  const { data: todaySchedule } = await supabase
    .from('intern_schedules')
    .select('expected_start, expected_end, expected_hours')
    .eq('intern_id', user.id)
    .eq('day_of_week', todayDow)
    .eq('is_active', true)
    .maybeSingle()

  const todayMinutes = todayRecords?.reduce((acc, r) => acc + (r.duration_minutes ?? 0), 0) ?? 0
  const monthMinutes = monthData?.total_minutes ?? 0
  const totalRequiredMins = (profile?.total_hours_required ?? 120) * 60
  const pct = totalRequiredMins > 0 ? Math.min(100, Math.round((monthMinutes / totalRequiredMins) * 100)) : 0
  const remainingMins = Math.max(0, totalRequiredMins - monthMinutes)

  const status = getHourStatus(pct)

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'BOM DIA'
    if (h < 18) return 'BOA TARDE'
    return 'BOA NOITE'
  })()

  const weekDay = new Date().toLocaleDateString('pt-BR', { weekday: 'long' }).toUpperCase()
  const dateStr = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase()

  return (
    <div className="flex flex-col" style={{ height: '100dvh', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* ── Header ─────────────────────────────────────── */}
      <header className="flex-shrink-0 shadow-lg" style={{ background: 'var(--nav-bg)' }}>
        <div className="max-w-lg mx-auto px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 flex-shrink-0">
              <Image src="/logo.svg" alt="ChronosLab" fill className="object-contain" />
            </div>
            <div>
              <p className="text-[10px] font-bold" style={{ color: 'var(--nav-muted)' }}>{greeting}, {firstName}</p>
              <div className="flex items-center gap-1.5">
                <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{weekDay}, {dateStr}</p>
                <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
                <LiveClock className="text-[10px] font-bold tabular-nums" style={{ color: 'rgba(255,255,255,0.55)' }} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle compact />
            <form action="/api/auth/signout" method="POST">
              <button
                className="text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all"
                style={{ color: 'var(--nav-muted)', borderColor: 'rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)' }}
              >
                SAIR
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}><div className="max-w-lg mx-auto w-full px-4 py-4 space-y-3 pb-4">

        {/* ── Hero: Anel de progresso ─────────────────── */}
        <FadeIn delay={0}>
          <div
            className="rounded-3xl p-4 sm:p-6"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow-md)' }}
          >
            {/* Status badge */}
            <div className="flex items-center justify-between mb-5">
              <p className="text-[10px] font-bold" style={{ color: 'var(--text-3)' }}>PROGRESSO DO MES</p>
              <span
                className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                style={{ background: status.bg, color: status.color, border: `1px solid ${status.border}` }}
              >
                {status.label}
              </span>
            </div>

            {/* Ring + info */}
            <div className="flex items-center gap-4 sm:gap-6">
              <ProgressRing pct={pct} size={100} strokeWidth={10} color={status.color}>
                <div className="text-center">
                  <p className="text-2xl font-black leading-none" style={{ color: status.color }}>{pct}%</p>
                  <p className="text-[9px] font-bold mt-0.5" style={{ color: 'var(--text-3)' }}>CUMPRIDO</p>
                </div>
              </ProgressRing>

              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-[10px] font-bold" style={{ color: 'var(--text-3)' }}>HORAS CUMPRIDAS</p>
                  <p className="text-xl font-black" style={{ color: 'var(--text)' }}>{minutesToHours(monthMinutes)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold" style={{ color: 'var(--text-3)' }}>META TOTAL</p>
                  <p className="text-base font-bold" style={{ color: 'var(--text-2)' }}>{profile?.total_hours_required ?? 120}h</p>
                </div>
                {remainingMins > 0 && (
                  <div>
                    <p className="text-[10px] font-bold" style={{ color: 'var(--text-3)' }}>FALTAM</p>
                    <p className="text-base font-bold" style={{ color: status.color }}>{minutesToHours(remainingMins)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Motivational message */}
            <div
              className="mt-5 rounded-2xl p-3.5 flex items-start gap-3"
              style={{ background: status.bg, border: `1px solid ${status.border}` }}
            >
              <span className="flex-shrink-0" style={{ color: status.color }}>{status.icon}</span>
              <div>
                <p className="text-xs font-bold leading-snug" style={{ color: status.color }}>{status.msg}</p>
                <p className="text-[10px] mt-0.5 leading-relaxed" style={{ color: status.color, opacity: 0.75 }}>{status.sub}</p>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* ── Stats row ───────────────────────────────── */}
        <div className="grid grid-cols-3 gap-2.5">
          {[
            {
              icon: <Calendar size={14} />,
              label: 'HOJE',
              value: minutesToHours(todayMinutes),
              color: 'var(--info)',
              bg: 'rgba(14,165,233,0.08)',
              delay: 0.06,
            },
            {
              icon: <TrendingUp size={14} />,
              label: 'MES',
              value: `${monthData?.approved_sessions ?? 0} SESS.`,
              color: 'var(--success)',
              bg: 'rgba(22,163,74,0.08)',
              delay: 0.1,
            },
            {
              icon: <Clock size={14} />,
              label: 'PENDENTES',
              value: `${monthData?.pending_sessions ?? 0}`,
              color: (monthData?.pending_sessions ?? 0) > 0 ? 'var(--warning)' : 'var(--text-3)',
              bg: (monthData?.pending_sessions ?? 0) > 0 ? 'rgba(217,119,6,0.08)' : 'var(--bg)',
              delay: 0.14,
            },
          ].map(s => (
            <FadeIn key={s.label} delay={s.delay}>
              <div
                className="rounded-2xl p-3 text-center"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}
              >
                <div className="flex justify-center mb-1.5 p-1.5 rounded-xl w-fit mx-auto" style={{ background: s.bg, color: s.color }}>
                  {s.icon}
                </div>
                <p className="text-xs font-black leading-none" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[9px] font-bold mt-1" style={{ color: 'var(--text-3)' }}>{s.label}</p>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* ── Horario de hoje ─────────────────────────── */}
        {todaySchedule && (
          <FadeIn delay={0.16}>
            <div
              className="rounded-2xl px-4 py-3 flex items-center gap-3"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: openRecord ? 'rgba(22,163,74,0.12)' : 'var(--bg)' }}
              >
                {openRecord
                  ? <CheckCircle size={18} style={{ color: 'var(--success)' }} />
                  : <Clock size={18} style={{ color: 'var(--text-3)' }} />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold" style={{ color: 'var(--text)' }}>
                  HORARIO PREVISTO HOJE
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-3)' }}>
                  {todaySchedule.expected_start?.slice(0, 5)} &mdash; {todaySchedule.expected_end?.slice(0, 5)}
                  &nbsp;&middot;&nbsp;{(todaySchedule.expected_hours ?? 0).toFixed(1)}h previstas
                  &nbsp;&middot;&nbsp;{minutesToHours(todayMinutes)} realizadas
                </p>
              </div>
              {openRecord && (
                <span
                  className="text-[9px] font-bold px-2 py-1 rounded-full flex-shrink-0"
                  style={{ background: 'rgba(22,163,74,0.12)', color: 'var(--success)', border: '1px solid rgba(22,163,74,0.25)' }}
                >
                  EM ANDAMENTO
                </span>
              )}
            </div>
          </FadeIn>
        )}

        {/* ── Alertas de pendencia ─────────────────────── */}
        {(monthData?.pending_sessions ?? 0) > 0 && (
          <FadeIn delay={0.18}>
            <div
              className="rounded-2xl px-4 py-3 flex items-center gap-3"
              style={{ background: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.25)' }}
            >
              <AlertTriangle size={18} style={{ color: 'var(--warning)', flexShrink: 0 }} />
              <div>
                <p className="text-[10px] font-bold" style={{ color: 'var(--warning)' }}>
                  {monthData!.pending_sessions} {monthData!.pending_sessions === 1 ? 'REGISTRO PENDENTE' : 'REGISTROS PENDENTES'} DE APROVACAO
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--warning)', opacity: 0.75 }}>
                  Aguardando revisao do administrador. Suas horas serao contabilizadas apos aprovacao.
                </p>
              </div>
            </div>
          </FadeIn>
        )}

        {/* ── Botao de ponto ──────────────────────────── */}
        <ScaleIn delay={0.2}>
          <div
            className="rounded-3xl p-5"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow-md)' }}
          >
            <ClockButton openRecord={openRecord ?? null} />
          </div>
        </ScaleIn>

        {/* ── Registros de hoje ───────────────────────── */}
        {todayRecords && todayRecords.length > 0 && (
          <FadeIn delay={0.26}>
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}
            >
              <div
                className="px-5 py-3.5 flex items-center justify-between"
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                <h2 className="text-xs font-bold" style={{ color: 'var(--text)' }}>REGISTROS DE HOJE</h2>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--bg)', color: 'var(--text-3)', border: '1px solid var(--border)' }}
                >
                  {todayRecords.length}
                </span>
              </div>
              <StaggerContainer className="px-5 py-3 space-y-3">
                {todayRecords.map(r => (
                  <StaggerItem key={r.id}>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: r.clock_out ? 'var(--text-3)' : 'var(--success)' }}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                          {formatTime(r.clock_in)}
                          {r.clock_out
                            ? <span style={{ color: 'var(--text-3)', fontWeight: 400 }}> &rarr; {formatTime(r.clock_out)}</span>
                            : <span style={{ color: 'var(--success)', fontWeight: 400 }}> &rarr; em andamento</span>
                          }
                        </p>
                        {r.duration_minutes && (
                          <p className="text-[10px]" style={{ color: 'var(--text-3)' }}>{minutesToHours(r.duration_minutes)}</p>
                        )}
                      </div>
                      <StatusBadge status={r.status as RecordStatus} />
                    </div>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </div>
          </FadeIn>
        )}

      </div></main>

      {/* ── Bottom nav ──────────────────────────────────── */}
      <nav
        className="flex-shrink-0 border-t"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)', boxShadow: '0 -4px 20px rgba(0,0,0,0.08)' }}
      >
        <div className="max-w-lg mx-auto flex">
          <Link href="/dashboard" className="flex-1 flex flex-col items-center gap-1 py-3" style={{ color: 'var(--primary)' }}>
            <Home size={18} />
            <span className="text-[10px] font-bold">INICIO</span>
          </Link>
          <Link href="/history" className="flex-1 flex flex-col items-center gap-1 py-3" style={{ color: 'var(--text-3)' }}>
            <ClipboardList size={18} />
            <span className="text-[10px] font-bold">HISTORICO</span>
          </Link>
          <form action="/api/auth/signout" method="POST" className="flex-1">
            <button type="submit" className="w-full flex flex-col items-center gap-1 py-3" style={{ color: 'var(--text-3)' }}>
              <LogOut size={18} />
              <span className="text-[10px] font-bold">SAIR</span>
            </button>
          </form>
        </div>
      </nav>
    </div>
  )
}
