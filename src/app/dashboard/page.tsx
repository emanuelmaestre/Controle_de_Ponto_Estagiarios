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

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle()

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

  const { data: monthData } = await supabase
    .from('v_monthly_hours')
    .select('total_minutes, approved_sessions, pending_sessions')
    .eq('intern_id', user.id)
    .gte('month', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
    .maybeSingle()

  const todayMinutes = todayRecords?.reduce((acc, r) => acc + (r.duration_minutes ?? 0), 0) ?? 0
  const monthMinutes = monthData?.total_minutes ?? 0

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Bom dia'
    if (h < 18) return 'Boa tarde'
    return 'Boa noite'
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
                {firstName} 👋
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle compact />
            <form action="/api/auth/signout" method="POST">
              <button
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all"
                style={{
                  color: 'var(--nav-muted)',
                  borderColor: 'rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.06)',
                }}
              >
                Sair
              </button>
            </form>
          </div>
        </div>

        {/* Date strip */}
        <div className="max-w-lg mx-auto px-5 pb-3">
          <p className="text-[11px]" style={{ color: 'var(--nav-muted)' }}>
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-5 space-y-4 pb-24">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <FadeIn delay={0}>
            <div
              className="rounded-2xl p-4 transition-shadow hover:shadow-md"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="text-base p-1.5 rounded-lg"
                  style={{ background: 'rgba(14,165,233,0.1)', fontSize: '16px' }}
                >📅</span>
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>Hoje</p>
              </div>
              <p className="text-xl font-black" style={{ color: 'var(--info)' }}>{minutesToHours(todayMinutes)}</p>
            </div>
          </FadeIn>
          <FadeIn delay={0.08}>
            <div
              className="rounded-2xl p-4 transition-shadow hover:shadow-md"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base p-1.5 rounded-lg" style={{ background: 'rgba(30,92,45,0.1)', fontSize: '16px' }}>
                  📊
                </span>
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>Mês</p>
              </div>
              <p className="text-xl font-black" style={{ color: 'var(--primary)' }}>{minutesToHours(monthMinutes)}</p>
              {(monthData?.pending_sessions ?? 0) > 0 && (
                <p className="text-xs mt-1 font-semibold" style={{ color: 'var(--warning)' }}>
                  {monthData?.pending_sessions} pendente(s)
                </p>
              )}
            </div>
          </FadeIn>
        </div>

        {/* Clock button */}
        <ScaleIn delay={0.14}>
          <div
            className="rounded-2xl p-5 transition-shadow hover:shadow-md"
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
              <div
                className="px-5 py-4 flex items-center justify-between"
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                <h2 className="font-bold text-sm" style={{ color: 'var(--text)' }}>Registros de hoje</h2>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text-2)' }}
                >
                  {todayRecords.length}
                </span>
              </div>
              <StaggerContainer className="px-5 py-3 space-y-3">
                {todayRecords.map((r, i) => (
                  <StaggerItem key={r.id}>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: r.clock_out ? 'var(--text-3)' : 'var(--success)' }}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                          {formatTime(r.clock_in)}
                          {r.clock_out ? (
                            <span style={{ color: 'var(--text-3)', fontWeight: 400 }}> → {formatTime(r.clock_out)}</span>
                          ) : (
                            <span style={{ color: 'var(--success)', fontWeight: 400 }}> → em andamento</span>
                          )}
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
          <Link
            href="/dashboard"
            className="flex-1 flex flex-col items-center gap-1 py-3 transition-colors"
            style={{ color: 'var(--primary)' }}
          >
            <Home size={18} />
            <span className="text-[10px] font-bold">Hoje</span>
          </Link>
          <Link
            href="/history"
            className="flex-1 flex flex-col items-center gap-1 py-3 transition-colors"
            style={{ color: 'var(--text-3)' }}
          >
            <ClipboardList size={18} />
            <span className="text-[10px] font-bold">Histórico</span>
          </Link>
          <form action="/api/auth/signout" method="POST" className="flex-1">
            <button
              type="submit"
              className="w-full flex flex-col items-center gap-1 py-3 transition-colors"
              style={{ color: 'var(--text-3)' }}
            >
              <LogOut size={18} />
              <span className="text-[10px] font-bold">Sair</span>
            </button>
          </form>
        </div>
      </nav>
    </div>
  )
}
