import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { formatTime, minutesToHours } from '@/lib/utils'
import ClockButton from '@/components/ClockButton'
import StatusBadge from '@/components/StatusBadge'
import { FadeIn, StaggerContainer, StaggerItem, ScaleIn } from '@/components/ui/MotionWrappers'
import { Home, ClipboardList, LogOut } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'

export const dynamic = 'force-dynamic'

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

  const { data: monthData } = await supabase
    .from('v_monthly_hours')
    .select('total_minutes, approved_sessions, pending_sessions')
    .eq('intern_id', user.id)
    .gte('month', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
    .maybeSingle()

  // Schedule for today
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
  const totalRequired = (profile?.total_hours_required ?? 120) * 60
  const pct = totalRequired > 0 ? Math.min(100, Math.round((monthMinutes / totalRequired) * 100)) : 0

  const motivational = (() => {
    if (pct >= 100) return { msg: 'META ATINGIDA! EXCELENTE TRABALHO!', color: 'var(--success)', emoji: '🏆' }
    if (pct >= 80) return { msg: 'QUASE LA! VOCE ESTA INDO MUITO BEM!', color: 'var(--info)', emoji: '🚀' }
    if (pct >= 50) return { msg: 'METADE DO CAMINHO! CONTINUE ASSIM!', color: 'var(--primary)', emoji: '💪' }
    if (pct >= 25) return { msg: 'BOM INICIO! MANTENHA O RITMO!', color: 'var(--warning)', emoji: '⚡' }
    return { msg: 'VAMOS COMECAR! CADA HORA CONTA!', color: 'var(--text-3)', emoji: '🎯' }
  })()

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'BOM DIA'
    if (h < 18) return 'BOA TARDE'
    return 'BOA NOITE'
  })()

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <header className="shadow-lg" style={{ background: 'var(--nav-bg)' }}>
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 flex-shrink-0">
              <Image src="/logo.svg" alt="ChronosLab" fill className="object-contain" />
            </div>
            <div>
              <p className="text-[11px] font-medium" style={{ color: 'var(--nav-muted)' }}>{greeting},</p>
              <h1 className="font-bold text-base leading-tight" style={{ color: 'var(--nav-fg)' }}>
                {firstName}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle compact />
            <form action="/api/auth/signout" method="POST">
              <button
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all"
                style={{ color: 'var(--nav-muted)', borderColor: 'rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)' }}
              >
                SAIR
              </button>
            </form>
          </div>
        </div>

        {/* Date strip */}
        <div className="max-w-lg mx-auto px-5 pb-3">
          <p className="text-[11px]" style={{ color: 'var(--nav-muted)' }}>
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase()}
          </p>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-5 space-y-4 pb-24">

        {/* Hour progress card */}
        <FadeIn delay={0}>
          <div
            className="rounded-2xl p-5"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-bold" style={{ color: 'var(--text-3)' }}>PROGRESSO DO MES</p>
              <span className="text-[10px] font-bold" style={{ color: motivational.color }}>
                {motivational.emoji} {pct}%
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-2.5 rounded-full overflow-hidden mb-2" style={{ background: 'var(--bg)' }}>
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${pct}%`, background: motivational.color }}
              />
            </div>

            <div className="flex items-center justify-between">
              <p className="text-[10px]" style={{ color: motivational.color, fontWeight: 700 }}>
                {motivational.msg}
              </p>
              <p className="text-[10px] font-bold tabular-nums" style={{ color: 'var(--text-3)' }}>
                {minutesToHours(monthMinutes)} / {profile?.total_hours_required ?? 120}H
              </p>
            </div>
          </div>
        </FadeIn>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <FadeIn delay={0.06}>
            <div
              className="rounded-2xl p-4"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base p-1.5 rounded-lg" style={{ background: 'rgba(14,165,233,0.1)' }}>&#128197;</span>
                <p className="text-[10px] font-bold" style={{ color: 'var(--text-3)' }}>HOJE</p>
              </div>
              <p className="text-xl font-black" style={{ color: 'var(--info)' }}>{minutesToHours(todayMinutes)}</p>
              {todaySchedule && (
                <p className="text-[10px] mt-1" style={{ color: 'var(--text-3)' }}>
                  PREVISTO: {(todaySchedule.expected_hours ?? 0).toFixed(1)}H
                </p>
              )}
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div
              className="rounded-2xl p-4"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base p-1.5 rounded-lg" style={{ background: 'rgba(30,92,45,0.1)' }}>&#128202;</span>
                <p className="text-[10px] font-bold" style={{ color: 'var(--text-3)' }}>MES</p>
              </div>
              <p className="text-xl font-black" style={{ color: 'var(--primary)' }}>{minutesToHours(monthMinutes)}</p>
              {(monthData?.pending_sessions ?? 0) > 0 && (
                <p className="text-[10px] mt-1 font-semibold" style={{ color: 'var(--warning)' }}>
                  {monthData?.pending_sessions} PENDENTE(S)
                </p>
              )}
            </div>
          </FadeIn>
        </div>

        {/* Today schedule hint */}
        {todaySchedule && (
          <FadeIn delay={0.13}>
            <div
              className="rounded-2xl px-4 py-3 flex items-center gap-3"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: openRecord ? 'var(--success)' : 'var(--text-3)' }} />
              <div>
                <p className="text-[10px] font-bold" style={{ color: 'var(--text)' }}>
                  HORARIO DE HOJE: {todaySchedule.expected_start?.slice(0, 5)} &mdash; {todaySchedule.expected_end?.slice(0, 5)}
                </p>
                <p className="text-[10px]" style={{ color: 'var(--text-3)' }}>
                  PREVISTO {(todaySchedule.expected_hours ?? 0).toFixed(1)}H &middot; REALIZADO {minutesToHours(todayMinutes)}
                </p>
              </div>
            </div>
          </FadeIn>
        )}

        {/* Clock button */}
        <ScaleIn delay={0.16}>
          <div
            className="rounded-2xl p-5"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}
          >
            <ClockButton openRecord={openRecord ?? null} />
          </div>
        </ScaleIn>

        {/* Today records */}
        {todayRecords && todayRecords.length > 0 && (
          <FadeIn delay={0.22}>
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}
            >
              <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
                <h2 className="font-bold text-sm" style={{ color: 'var(--text)' }}>REGISTROS DE HOJE</h2>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-secondary)', color: 'var(--text-2)' }}>
                  {todayRecords.length}
                </span>
              </div>
              <StaggerContainer className="px-5 py-3 space-y-3">
                {todayRecords.map(r => (
                  <StaggerItem key={r.id}>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: r.clock_out ? 'var(--text-3)' : 'var(--success)' }} />
                      <div className="flex-1">
                        <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                          {formatTime(r.clock_in)}
                          {r.clock_out
                            ? <span style={{ color: 'var(--text-3)', fontWeight: 400 }}> &rarr; {formatTime(r.clock_out)}</span>
                            : <span style={{ color: 'var(--success)', fontWeight: 400 }}> &rarr; EM ANDAMENTO</span>
                          }
                        </p>
                        {r.duration_minutes && (
                          <p className="text-xs" style={{ color: 'var(--text-3)' }}>{minutesToHours(r.duration_minutes)}</p>
                        )}
                      </div>
                      <StatusBadge status={r.status as 'pending' | 'approved' | 'rejected'} />
                    </div>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </div>
          </FadeIn>
        )}
      </main>

      {/* Bottom nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 border-t"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)', boxShadow: '0 -4px 20px rgba(0,0,0,0.08)' }}
      >
        <div className="max-w-lg mx-auto flex">
          <Link href="/dashboard" className="flex-1 flex flex-col items-center gap-1 py-3 transition-colors" style={{ color: 'var(--primary)' }}>
            <Home size={18} />
            <span className="text-[10px] font-bold">INICIO</span>
          </Link>
          <Link href="/history" className="flex-1 flex flex-col items-center gap-1 py-3 transition-colors" style={{ color: 'var(--text-3)' }}>
            <ClipboardList size={18} />
            <span className="text-[10px] font-bold">HISTORICO</span>
          </Link>
          <form action="/api/auth/signout" method="POST" className="flex-1">
            <button type="submit" className="w-full flex flex-col items-center gap-1 py-3 transition-colors" style={{ color: 'var(--text-3)' }}>
              <LogOut size={18} />
              <span className="text-[10px] font-bold">SAIR</span>
            </button>
          </form>
        </div>
      </nav>
    </div>
  )
}
