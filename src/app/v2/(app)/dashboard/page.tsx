import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/infra/supabase/server'
import { createContainer } from '@/infra/container'
import { minutesToHours } from '@/lib/utils'
import ClockButtonV2 from './ClockButtonV2'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/v2/login')

  const container = createContainer(supabase)

  const profile = await container.repos.user.findById(user.id)
  if (!profile) redirect('/v2/login')

  const openRecord = await container.repos.record.findOpenByUser(user.id)
  const todayRecords = await container.repos.record.findTodayByUser(user.id)

  const now = new Date()
  const monthRecords = await container.repos.record.findByUser(user.id, now.getMonth() + 1, now.getFullYear())
  const totalMinutes = monthRecords.reduce((sum, r) => sum + (r.durationMinutes ?? 0), 0)
  const totalSessions = monthRecords.filter(r => !r.isOpen).length

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="px-6 pt-8 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Ola,</p>
            <h1 className="text-xl font-bold">{profile.fullName.split(' ')[0]}</h1>
          </div>
          <a
            href="/api/auth/logout"
            className="text-sm text-gray-500 hover:text-red-400 transition-colors"
          >
            Sair
          </a>
        </div>
      </header>

      {/* Stats */}
      <section className="px-6 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <p className="text-gray-400 text-xs mb-1">Horas no mes</p>
            <p className="text-2xl font-bold text-green-400">{minutesToHours(totalMinutes)}</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <p className="text-gray-400 text-xs mb-1">Sessoes</p>
            <p className="text-2xl font-bold">{totalSessions}</p>
          </div>
        </div>
      </section>

      {/* Clock Button */}
      <section className="px-6 mb-8">
        <ClockButtonV2
          hasOpenRecord={!!openRecord}
          openRecordId={openRecord?.id ?? null}
          clockInTime={openRecord?.clockIn.toISOString() ?? null}
        />
      </section>

      {/* Today Records */}
      <section className="px-6 pb-24">
        <h2 className="text-sm font-semibold text-gray-400 mb-3">Registros de hoje</h2>
        {todayRecords.length === 0 ? (
          <p className="text-gray-600 text-sm">Nenhum registro hoje.</p>
        ) : (
          <div className="space-y-2">
            {todayRecords.map(record => (
              <div key={record.id} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-sm text-gray-300">
                      {record.clockIn.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })}
                    </span>
                    <span className="text-gray-600 mx-2">→</span>
                    <span className="text-sm text-gray-300">
                      {record.clockOut
                        ? record.clockOut.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })
                        : '...'}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {record.durationMinutes ? minutesToHours(record.durationMinutes) : 'Em andamento'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 inset-x-0 bg-gray-900 border-t border-gray-800 flex justify-around py-3">
        <a href="/v2/dashboard" className="text-green-400 text-xs font-medium">Inicio</a>
        <a href="/v2/history" className="text-gray-500 text-xs">Historico</a>
        <a href="/v2/profile" className="text-gray-500 text-xs">Perfil</a>
      </nav>
    </div>
  )
}
