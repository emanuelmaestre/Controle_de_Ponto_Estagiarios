import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { formatTime, minutesToHours, STATUS_CONFIG } from '@/lib/utils'
import ClockButton from '@/components/ClockButton'
import StatusBadge from '@/components/StatusBadge'

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

  const todayMinutes = todayRecords?.reduce((acc, r) =>
    acc + (r.duration_minutes ?? 0), 0) ?? 0
  const monthMinutes = monthData?.total_minutes ?? 0

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Bom dia'
    if (h < 18) return 'Boa tarde'
    return 'Boa noite'
  })()

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-950 to-blue-800 text-white px-5 py-5">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <p className="text-blue-300 text-xs font-medium">{greeting},</p>
            <h1 className="font-bold text-lg leading-tight">{firstName} 👋</h1>
            <p className="text-blue-300 text-xs mt-0.5">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
            </p>
          </div>
          <form action="/api/auth/signout" method="POST">
            <button className="text-blue-300 hover:text-white text-xs font-medium border border-blue-700 hover:border-blue-400 px-3 py-1.5 rounded-lg transition-all">
              Sair
            </button>
          </form>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg p-1.5 bg-blue-50 rounded-lg">📅</span>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Hoje</p>
            </div>
            <p className="text-2xl font-bold text-slate-800">{minutesToHours(todayMinutes)}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg p-1.5 bg-purple-50 rounded-lg">📊</span>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Mês</p>
            </div>
            <p className="text-2xl font-bold text-slate-800">{minutesToHours(monthMinutes)}</p>
            {(monthData?.pending_sessions ?? 0) > 0 && (
              <p className="text-xs text-amber-500 mt-1 font-medium">
                {monthData?.pending_sessions} pendente(s)
              </p>
            )}
          </div>
        </div>

        {/* Clock button */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <ClockButton openRecord={openRecord ?? null} />
        </div>

        {/* Today records */}
        {todayRecords && todayRecords.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
              <h2 className="font-semibold text-slate-800 text-sm">Registros de hoje</h2>
              <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                {todayRecords.length}
              </span>
            </div>
            <div className="relative px-5 py-3">
              {/* Timeline line */}
              <div className="absolute left-8 top-3 bottom-3 w-px bg-slate-100" />
              <div className="space-y-4">
                {todayRecords.map((r) => (
                  <div key={r.id} className="flex items-start gap-4 pl-2">
                    <div className="w-4 h-4 rounded-full border-2 border-slate-200 bg-white mt-0.5 flex-shrink-0 z-10" />
                    <div className="flex-1 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-700">
                          {formatTime(r.clock_in)}
                          {r.clock_out ? (
                            <span className="text-slate-400 font-normal"> → {formatTime(r.clock_out)}</span>
                          ) : (
                            <span className="text-emerald-500 font-normal"> → em andamento</span>
                          )}
                        </p>
                        {r.duration_minutes && (
                          <p className="text-xs text-slate-400">{minutesToHours(r.duration_minutes)}</p>
                        )}
                      </div>
                      <StatusBadge status={r.status as 'pending' | 'approved' | 'rejected'} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom nav */}
      <nav className="sticky bottom-0 bg-white border-t border-slate-100 shadow-lg">
        <div className="max-w-lg mx-auto flex">
          <Link
            href="/dashboard"
            className="flex-1 flex flex-col items-center gap-1 py-3 text-blue-700"
          >
            <span className="text-xl">🏠</span>
            <span className="text-[10px] font-semibold">Hoje</span>
          </Link>
          <Link
            href="/history"
            className="flex-1 flex flex-col items-center gap-1 py-3 text-slate-400 hover:text-slate-600"
          >
            <span className="text-xl">📋</span>
            <span className="text-[10px] font-semibold">Histórico</span>
          </Link>
          <form action="/api/auth/signout" method="POST" className="flex-1">
            <button
              type="submit"
              className="w-full flex flex-col items-center gap-1 py-3 text-slate-400 hover:text-slate-600"
            >
              <span className="text-xl">👤</span>
              <span className="text-[10px] font-semibold">Sair</span>
            </button>
          </form>
        </div>
      </nav>
    </div>
  )
}
