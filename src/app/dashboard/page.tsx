import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ensureProfile } from '@/lib/ensureProfile'
import MobileOnlyGuard from '@/components/MobileOnlyGuard'
import { formatTime, minutesToHours } from '@/lib/utils'
import ClockButton from '@/components/ClockButton'
import SelfieGate from '@/components/SelfieGate'
import StatusBadge from '@/components/StatusBadge'
import ProgressRing from '@/components/ui/ProgressRing'
import { FadeIn, StaggerContainer, StaggerItem, ScaleIn } from '@/components/ui/MotionWrappers'
import { Home, ClipboardList, LogOut, Clock, TrendingUp, Calendar, CheckCircle, Trophy, Rocket, Zap, Target, Dumbbell, AlertTriangle } from 'lucide-react'
import LiveClock from '@/components/ui/LiveClock'
import type { RecordStatus } from '@/types/database'

export const dynamic = 'force-dynamic'

// ─── Helpers de gamificação ─────────────────────────────────
function getHourStatus(pct: number) {
  if (pct >= 100) return {
    label: 'Carga Concluída',
    color: 'var(--success)',
    bg: 'rgba(22,163,74,0.10)',
    border: 'rgba(22,163,74,0.25)',
    icon: <Trophy size={20} />,
    msg: 'Parabéns! Você completou sua carga horária do mês.',
    sub: 'Continue sendo um exemplo de dedicação e compromisso.',
  }
  if (pct >= 80) return {
    label: 'Quase lá',
    color: 'var(--info)',
    bg: 'rgba(14,165,233,0.10)',
    border: 'rgba(14,165,233,0.25)',
    icon: <Rocket size={20} />,
    msg: 'Você está quase lá! Falta pouco para completar sua meta.',
    sub: 'Mantenha o ritmo — você está indo muito bem!',
  }
  if (pct >= 50) return {
    label: 'Em dia',
    color: 'var(--primary)',
    bg: 'rgba(30,92,45,0.10)',
    border: 'rgba(30,92,45,0.25)',
    icon: <Dumbbell size={20} />,
    msg: 'Ótimo progresso! Você está na metade do caminho.',
    sub: 'Continue comparecendo para manter sua carga em dia.',
  }
  if (pct >= 25) return {
    label: 'Atenção',
    color: 'var(--warning)',
    bg: 'rgba(217,119,6,0.10)',
    border: 'rgba(217,119,6,0.25)',
    icon: <Zap size={20} />,
    msg: 'Você está progredindo, mas ainda há horas a cumprir.',
    sub: 'Organize sua agenda para manter o ritmo e evitar pendências.',
  }
  return {
    label: 'Horas Pendentes',
    color: 'var(--danger)',
    bg: 'rgba(220,38,38,0.10)',
    border: 'rgba(220,38,38,0.25)',
    icon: <Target size={20} />,
    msg: 'Atenção: suas horas precisam de dedicação agora.',
    sub: 'Cada presença conta. Você ainda pode regularizar sua situação!',
  }
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let { data: profile } = await supabase
    .from('profiles')
    .select('full_name, total_hours_required, role, photo_url')
    .eq('id', user.id)
    .maybeSingle()

  // Garante perfil (cria/migra de forma segura e síncrona se necessário)
  if (!profile) {
    profile = await ensureProfile(user.id, user.email ?? null)
  }

  // Administradores não registram ponto — redirecionar para o painel admin
  if (profile?.role === 'manager') redirect('/admin')

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Olá'

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
    .select('total_minutes, approved_sessions')
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

  // ── Detecção de ponto em aberto esquecido ───────────
  const openRecordWarning = (() => {
    if (!openRecord) return null
    const clockInDate = openRecord.clock_in.slice(0, 10)
    const hoursOpen = (Date.now() - new Date(openRecord.clock_in).getTime()) / 3_600_000
    if (clockInDate < today) {
      const dayLabel = new Date(clockInDate + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' })
      return `Você esqueceu de registrar a saída de ${dayLabel}. Registre agora para não perder a sessão.`
    }
    if (hoursOpen > 10) {
      return `Seu ponto está em aberto há mais de ${Math.floor(hoursOpen)} horas. Não esqueça de registrar a saída!`
    }
    return null
  })()

  const todayMinutes = todayRecords?.reduce((acc, r) => acc + (r.duration_minutes ?? 0), 0) ?? 0
  const monthMinutes = monthData?.total_minutes ?? 0
  const totalRequiredMins = (profile?.total_hours_required ?? 120) * 60
  const pct = totalRequiredMins > 0 ? Math.min(100, Math.round((monthMinutes / totalRequiredMins) * 100)) : 0
  const remainingMins = Math.max(0, totalRequiredMins - monthMinutes)

  const status = getHourStatus(pct)

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Bom dia'
    if (h < 18) return 'Boa tarde'
    return 'Boa noite'
  })()

  const weekDay = new Date().toLocaleDateString('pt-BR', { weekday: 'long' }).toUpperCase()
  const dateStr = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase()

  return (
    <MobileOnlyGuard>
    <div className="flex flex-col" style={{ height: '100dvh', overflow: 'hidden', background: 'var(--bg)' }}>
      {/* Foto opcional no dashboard — só abre se não tiver foto E o usuário ainda não dispensou */}
      <SelfieGate hasPhoto={true} internId={user.id} />

      {/* ── Header ─────────────────────────────────────── */}
      <header className="flex-shrink-0" style={{ background: 'var(--nav-bg)', borderBottom: '1px solid rgba(0,200,83,0.12)' }}>
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center justify-between gap-3">
          {/* Avatar + nome (toque abre o perfil) */}
          <Link href="/profile" className="flex items-center gap-3 min-w-0">
            {profile?.photo_url ? (
              <img src={profile.photo_url} alt={firstName} className="w-10 h-10 rounded-full object-cover flex-shrink-0" style={{ border: '2px solid rgba(0,200,83,0.4)' }} />
            ) : (
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-black text-base flex-shrink-0"
                style={{ background: 'rgba(0,200,83,0.18)', border: '2px solid rgba(0,200,83,0.4)', color: '#3fe56c' }}
              >
                {firstName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-base font-bold leading-tight truncate" style={{ color: 'white' }}>
                {greeting}, {profile?.full_name?.toUpperCase() ?? firstName.toUpperCase()}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-[10px] font-medium tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {weekDay}, {dateStr}
                </p>
                <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
                <LiveClock className="text-[10px] font-bold tabular-nums" style={{ color: 'rgba(255,255,255,0.55)' }} />
              </div>
            </div>
          </Link>
          {/* Sair */}
          <form action="/api/auth/signout" method="POST" className="flex-shrink-0">
            <button
              type="submit"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-wider transition-all"
              style={{ color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)' }}
            >
              <LogOut size={13} />
              SAIR
            </button>
          </form>
        </div>
      </header>

      {/* ── Aviso ponto em aberto ───────────────────────── */}
      {openRecordWarning && (
        <div
          className="flex-shrink-0 flex items-start gap-3 px-5 py-3"
          style={{ background: 'rgba(255,191,0,0.10)', borderBottom: '1px solid rgba(255,191,0,0.20)' }}
        >
          <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" style={{ color: '#ffbf00' }} />
          <p className="text-xs leading-relaxed font-medium" style={{ color: '#ffbf00' }}>
            {openRecordWarning}
          </p>
        </div>
      )}

      <main className="flex-1 min-h-0 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}><div className="max-w-lg mx-auto w-full px-4 py-4 space-y-3 pb-24">

        {/* ── Hero: Anel de progresso ─────────────────── */}
        <FadeIn delay={0}>
          <div
            className="rounded-3xl p-4 sm:p-6"
            style={{ background: 'var(--surface-card, #0f2318)', border: '1px solid rgba(0,200,83,0.15)', boxShadow: 'var(--card-shadow-md)' }}
          >
            {/* Status badge */}
            <div className="flex items-center justify-between mb-5">
              <p className="text-[10px] font-bold" style={{ color: 'var(--text-3)' }}>Progresso do Mês</p>
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
                  <p className="text-[9px] font-bold mt-0.5" style={{ color: 'var(--text-3)' }}>cumprido</p>
                </div>
              </ProgressRing>

              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-[10px] font-bold" style={{ color: 'var(--text-3)' }}>Horas cumpridas</p>
                  <p className="text-xl font-black" style={{ color: 'var(--text)' }}>{minutesToHours(monthMinutes)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold" style={{ color: 'var(--text-3)' }}>Meta total</p>
                  <p className="text-base font-bold" style={{ color: 'var(--text-2)' }}>{profile?.total_hours_required ?? 120}h</p>
                </div>
                {remainingMins > 0 && (
                  <div>
                    <p className="text-[10px] font-bold" style={{ color: 'var(--text-3)' }}>Faltam</p>
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
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              icon: <Calendar size={22} />,
              label: 'HOJE',
              value: minutesToHours(todayMinutes),
              delay: 0.06,
            },
            {
              icon: <TrendingUp size={22} />,
              label: 'MÊS',
              value: `${monthData?.approved_sessions ?? 0} sess.`,
              delay: 0.1,
            },
          ].map(s => (
            <FadeIn key={s.label} delay={s.delay}>
              <div
                className="rounded-2xl p-5 flex flex-col items-center justify-center gap-2"
                style={{ background: 'var(--surface-card, #0f2318)', border: '1px solid rgba(0,200,83,0.15)', minHeight: 100 }}
              >
                <span style={{ color: '#3fe56c' }}>{s.icon}</span>
                <p className="text-2xl font-black leading-none" style={{ color: 'var(--text)' }}>{s.value}</p>
                <p className="text-[10px] font-bold tracking-widest" style={{ color: 'var(--text-3)' }}>{s.label}</p>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* ── Horario de hoje ─────────────────────────── */}
        {todaySchedule && (
          <FadeIn delay={0.16}>
            <div
              className="rounded-2xl px-4 py-3 flex items-center gap-3"
              style={{ background: 'var(--surface-card, #0f2318)', border: '1px solid rgba(0,200,83,0.15)' }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: openRecord ? 'rgba(22,163,74,0.12)' : 'rgba(0,0,0,0.2)' }}
              >
                {openRecord
                  ? <CheckCircle size={18} style={{ color: 'var(--success)' }} />
                  : <Clock size={18} style={{ color: 'var(--text-3)' }} />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold" style={{ color: 'var(--text)' }}>
                  Horário previsto hoje
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
                  Em andamento
                </span>
              )}
            </div>
          </FadeIn>
        )}


{/* ── Botao de ponto ──────────────────────────── */}
        <ScaleIn delay={0.2}>
          <ClockButton openRecord={openRecord ?? null} />
        </ScaleIn>

        {/* ── Registros de hoje ───────────────────────── */}
        {todayRecords && todayRecords.length > 0 && (
          <FadeIn delay={0.26}>
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: 'var(--surface-card, #0f2318)', border: '1px solid rgba(0,200,83,0.15)' }}
            >
              <div
                className="px-5 py-3.5 flex items-center justify-between"
                style={{ borderBottom: '1px solid rgba(0,200,83,0.10)' }}
              >
                <h2 className="text-xs font-bold" style={{ color: 'var(--text)' }}>Registros de hoje</h2>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(0,0,0,0.2)', color: 'var(--text-3)', border: '1px solid rgba(0,200,83,0.10)' }}
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
        style={{ background: 'var(--nav-bg)', borderColor: 'rgba(0,200,83,0.12)', boxShadow: '0 -4px 20px rgba(0,0,0,0.25)', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="max-w-lg mx-auto flex">
          <Link href="/dashboard" className="flex-1 flex flex-col items-center gap-1 py-3" style={{ color: 'var(--primary)' }}>
            <Home size={18} />
            <span className="text-[10px] font-bold">Início</span>
          </Link>
          <Link href="/history" className="flex-1 flex flex-col items-center gap-1 py-3" style={{ color: 'var(--text-3)' }}>
            <ClipboardList size={18} />
            <span className="text-[10px] font-bold">Histórico</span>
          </Link>
          <Link href="/intern-ranking" className="flex-1 flex flex-col items-center gap-1 py-3" style={{ color: 'var(--text-3)' }}>
            <Trophy size={18} />
            <span className="text-[10px] font-bold">Ranking</span>
          </Link>
          <form action="/api/auth/signout" method="POST" className="flex-1">
            <button type="submit" className="w-full flex flex-col items-center gap-1 py-3" style={{ color: 'var(--text-3)' }}>
              <LogOut size={18} />
              <span className="text-[10px] font-bold">Sair</span>
            </button>
          </form>
        </div>
      </nav>
    </div>
    </MobileOnlyGuard>
  )
}
