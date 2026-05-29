import { createSupabaseServerClient } from '@/infra/supabase/server'
import { createContainer } from '@/infra/container'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const supabase = await createSupabaseServerClient()
  const container = createContainer(supabase)

  const interns = await container.repos.user.findAllInterns()

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const { data: todayRecords } = await supabase
    .from('time_records')
    .select('intern_id, clock_in, clock_out')
    .gte('clock_in', today.toISOString())
    .lt('clock_in', tomorrow.toISOString())

  const activeInternIds = new Set(
    (todayRecords ?? [])
      .filter(r => !r.clock_out)
      .map(r => r.intern_id)
  )

  const activeCount = activeInternIds.size
  const totalActive = interns.filter(i => i.isActive).length

  return (
    <div>
      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 text-center">
          <p className="text-3xl font-bold">{totalActive}</p>
          <p className="text-gray-400 text-sm mt-1">Estagiarios</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-6 border border-green-900 text-center">
          <p className="text-3xl font-bold text-green-400">{activeCount}</p>
          <p className="text-gray-400 text-sm mt-1">Presentes</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 text-center">
          <p className="text-3xl font-bold text-gray-500">{totalActive - activeCount}</p>
          <p className="text-gray-400 text-sm mt-1">Ausentes</p>
        </div>
      </div>

      {/* Intern List */}
      <h2 className="text-lg font-semibold mb-4">Estagiarios</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {interns.filter(i => i.isActive).map(intern => {
          const isActive = activeInternIds.has(intern.id)
          return (
            <div key={intern.id} className="bg-gray-900 rounded-xl p-4 border border-gray-800 flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-400' : 'bg-gray-600'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{intern.fullName}</p>
                <p className="text-xs text-gray-500">{intern.course ?? 'Sem curso'}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-lg ${isActive ? 'bg-green-950 text-green-400' : 'bg-gray-800 text-gray-500'}`}>
                {isActive ? 'Presente' : 'Ausente'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
