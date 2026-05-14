import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { formatTime, minutesToHours, STATUS_CONFIG } from '@/lib/utils'
import ClockButton from '@/components/ClockButton'
import StatusBadge from '@/components/StatusBadge'

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Turno aberto (clock_in sem clock_out)
  const { data: openRecord } = await supabase
    .from('time_records')
    .select('id, clock_in')
    .eq('intern_id', user.id)
    .is('clock_out', null)
    .maybeSingle()

  // Registros de hoje
  const today = new Date().toISOString().slice(0, 10)
  const { data: todayRecords } = await supabase
    .from('time_records')
    .select('id, clock_in, clock_out, duration_minutes, status')
    .eq('intern_id', user.id)
    .gte('clock_in', `${today}T00:00:00Z`)
    .order('clock_in', { ascending: false })

  // Horas do mês
  const { data: monthData } = await supabase
    .from('v_monthly_hours')
    .select('total_minutes, approved_sessions, pending_sessions')
    .eq('intern_id', user.id)
    .gte('month', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
    .maybeSingle()

  const todayMinutes = todayRecords?.reduce((acc, r) =>
    acc + (r.duration_minutes ?? 0), 0) ?? 0
  const monthMinutes = monthData?.total_minutes ?? 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-900 text-white px-4 py-4 flex items-center justify-between">
        <h1 className="font-bold text-lg">Meu Ponto</h1>
        <form action="/api/auth/signout" method="POST">
          <button className="text-blue-200 text-sm hover:text-white">Sair</button>
        </form>
      </header>

      <main className="max-w-lg mx-auto p-4 space-y-4">
        {/* Cards de horas */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Hoje</p>
            <p className="text-2xl font-bold text-blue-900 mt-1">
              {minutesToHours(todayMinutes)}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Este mês</p>
            <p className="text-2xl font-bold text-blue-900 mt-1">
              {minutesToHours(monthMinutes)}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {monthData?.pending_sessions ?? 0} pendente(s)
            </p>
          </div>
        </div>

        {/* Botão de ponto */}
        <ClockButton openRecord={openRecord ?? null} />

        {/* Registros de hoje */}
        {todayRecords && todayRecords.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">Registros de hoje</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {todayRecords.map((r) => (
                <div key={r.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {formatTime(r.clock_in)}
                      {r.clock_out ? ` → ${formatTime(r.clock_out)}` : ' → em andamento'}
                    </p>
                    {r.duration_minutes && (
                      <p className="text-xs text-gray-400">
                        {minutesToHours(r.duration_minutes)}
                      </p>
                    )}
                  </div>
                  <StatusBadge status={r.status as 'pending' | 'approved' | 'rejected'} />
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
