import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { minutesToHours, formatTime } from '@/lib/utils'
import type { TodayStatus } from '@/types/database'
import AdminNav from '@/components/AdminNav'
import StatCard from '@/components/ui/StatCard'
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/MotionWrappers'

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: internsRaw } = await supabase
    .from('v_today_status')
    .select('*')
    .order('full_name')
  const interns = internsRaw as TodayStatus[] | null

  // Buscar cadastros pendentes de aprovação (contas inativas)
  const { data: pendingRegistrations } = await supabase
    .from('profiles')
    .select('id, full_name, email, course, created_at')
    .eq('role', 'intern')
    .eq('is_active', false)
    .order('created_at', { ascending: false })
  const pendingCount = pendingRegistrations?.length ?? 0

  const totalPending = interns?.reduce((acc, i) => acc + (i.pending_count ?? 0), 0) ?? 0
  const activeCount = interns?.filter((i) => i.today_status === 'ativo').length ?? 0
  const totalCount = interns?.length ?? 0

  const statusColor: Record<string, string> = {
    ativo:   'bg-emerald-100 text-emerald-700 border-emerald-200',
    saiu:    'bg-blue-50 text-blue-700 border-blue-200',
    ausente: 'bg-slate-100 text-slate-500 border-slate-200',
  }
  const statusLabel: Record<string, string> = {
    ativo: '● No laboratório',
    saiu: '● Saiu hoje',
    ausente: '● Ausente',
  }
  const statusDot: Record<string, string> = {
    ativo: 'text-emerald-500',
    saiu: 'text-blue-400',
    ausente: 'text-slate-300',
  }

  const avatarColors = [
    'bg-blue-100 text-blue-700',
    'bg-purple-100 text-purple-700',
    'bg-rose-100 text-rose-700',
    'bg-emerald-100 text-emerald-700',
    'bg-amber-100 text-amber-700',
    'bg-cyan-100 text-cyan-700',
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminNav pending={totalPending} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 md:pb-8">
        {/* Banner de cadastros pendentes */}
        {pendingCount > 0 && (
          <FadeIn>
            <Link
              href="/admin/interns"
              className="block mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl px-5 py-4 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                  👤
                </div>
                <div className="flex-1">
                  <p className="font-bold text-amber-800 text-sm">
                    {pendingCount} cadastro{pendingCount !== 1 ? 's' : ''} aguardando aprovação
                  </p>
                  <p className="text-amber-600 text-xs mt-0.5">
                    {pendingRegistrations?.map(p => p.full_name).join(', ')}
                  </p>
                </div>
                <span className="text-amber-400 text-xl group-hover:text-amber-600 transition-colors">›</span>
              </div>
            </Link>
          </FadeIn>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard
            label="No laboratório agora"
            value={activeCount}
            icon="🧪"
            color="green"
            sub="estagiários presentes"
            delay={0}
          />
          <StatCard
            label="Total de estagiários"
            value={totalCount}
            icon="👥"
            color="blue"
            sub="cadastrados no sistema"
            delay={0.05}
          />
          <StatCard
            label="Pendentes de aprovação"
            value={totalPending}
            icon="⏳"
            color={totalPending > 0 ? 'amber' : 'gray'}
            sub={totalPending > 0 ? 'clique para revisar' : 'tudo em dia'}
            delay={0.1}
          />
        </div>

        {/* Section title */}
        <FadeIn delay={0.2}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-700">Estagiários hoje</h2>
            <span className="text-xs text-slate-400 font-medium uppercase tracking-widest">
              {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
            </span>
          </div>
        </FadeIn>

        {/* Intern grid */}
        {interns && interns.length > 0 ? (
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {interns.map((intern, idx) => {
              const colorClass = avatarColors[idx % avatarColors.length]
              return (
                <StaggerItem key={intern.id}>
                <Link
                  href={`/admin/interns/${intern.id}`}
                  className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200 p-5 flex flex-col gap-4"
                >
                  <div className="flex items-start gap-3">
                    {intern.photo_url ? (
                      <img
                        src={intern.photo_url}
                        alt={intern.full_name}
                        className="w-11 h-11 rounded-xl object-cover flex-shrink-0 ring-2 ring-slate-100 group-hover:ring-blue-100 transition-all"
                      />
                    ) : (
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${colorClass}`}>
                        {intern.full_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 truncate group-hover:text-blue-800 transition-colors">
                        {intern.full_name}
                      </p>
                      <span className={`inline-flex mt-1 text-xs px-2 py-0.5 rounded-full border font-medium ${statusColor[intern.today_status]}`}>
                        {statusLabel[intern.today_status]}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                    <div>
                      <p className="text-xs text-slate-400 font-medium">Hoje</p>
                      <p className="font-bold text-slate-700 text-sm">{minutesToHours(intern.today_minutes)}</p>
                    </div>
                    {intern.today_status === 'ativo' && intern.clock_in && (
                      <div className="text-right">
                        <p className="text-xs text-slate-400 font-medium">Entrada</p>
                        <p className="font-bold text-emerald-600 text-sm">{formatTime(intern.clock_in)}</p>
                      </div>
                    )}
                    {intern.pending_count > 0 && (
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">
                          ⏳ {intern.pending_count}
                        </span>
                      </div>
                    )}
                    <span className="text-slate-300 text-base group-hover:text-blue-400 transition-colors">›</span>
                  </div>
                </Link>
                </StaggerItem>
              )
            })}
          </StaggerContainer>
        ) : (
          <div className="text-center py-24 text-slate-400">
            <div className="text-6xl mb-4 float-anim inline-block">👥</div>
            <p className="font-semibold text-slate-600 text-lg">Nenhum estagiário cadastrado</p>
            <p className="text-sm mt-2 mb-6">Comece adicionando o primeiro estagiário ao sistema.</p>
            <Link
              href="/admin/interns"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold transition-all hover:shadow-lg hover:-translate-y-0.5"
            >
              Estagiários
            </Link>
          </div>
        )}
      </main>

    </div>
  )
}
