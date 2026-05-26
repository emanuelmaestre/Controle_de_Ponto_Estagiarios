import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { Profile } from '@/types/database'
import AdminNav from '@/components/AdminNav'
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/MotionWrappers'

export default async function InternsPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: internsRaw } = await supabase
    .from('profiles')
    .select('id, full_name, email, course, internship_start, internship_end, is_active, role, photo_url')
    .eq('role', 'intern')
    .order('full_name')
  const interns = internsRaw as Pick<Profile,
    'id' | 'full_name' | 'email' | 'course' | 'internship_start' | 'internship_end' | 'is_active' | 'role' | 'photo_url'
  >[] | null

  const active = interns?.filter(i => i.is_active) ?? []
  const inactive = interns?.filter(i => !i.is_active) ?? []

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
      <AdminNav />

      {/* Page header */}
      <div className="bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link href="/admin" className="text-slate-400 hover:text-slate-600 text-sm flex items-center gap-1 transition-colors flex-shrink-0">
              ←<span className="hidden sm:inline"> Início</span>
            </Link>
            <span className="text-slate-200 hidden sm:inline">|</span>
            <div className="min-w-0">
              <h1 className="font-bold text-slate-800 text-lg sm:text-xl">Estagiários</h1>
              <p className="text-slate-400 text-xs">{active.length} ativo{active.length !== 1 ? 's' : ''} · {inactive.length} inativo{inactive.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <Link
            href="/admin/interns/new"
            className="flex items-center gap-1 sm:gap-2 bg-blue-700 hover:bg-blue-600 text-white font-semibold text-sm px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl hover:shadow-lg transition-all flex-shrink-0"
          >
            +<span className="hidden sm:inline"> Novo</span> estagiário
          </Link>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 md:pb-8 space-y-8">
        {/* Ativos */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-2 bg-emerald-400 rounded-full" />
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Ativos — {active.length}
            </h2>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          <StaggerContainer className="space-y-2">
            {active.map((intern, idx) => (
              <StaggerItem key={intern.id}>
                <InternCard
                  intern={intern}
                  colorClass={avatarColors[idx % avatarColors.length]}
                  isActive
                />
              </StaggerItem>
            ))}
            {active.length === 0 && (
              <FadeIn>
                <div className="py-10 text-center text-slate-400">
                  <p className="text-3xl mb-2">👤</p>
                  <p className="text-sm">Nenhum estagiário ativo.</p>
                </div>
              </FadeIn>
            )}
          </StaggerContainer>
        </section>

        {/* Inativos */}
        {inactive.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-2 bg-slate-300 rounded-full" />
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Inativos — {inactive.length}
              </h2>
              <div className="flex-1 h-px bg-slate-100" />
            </div>

            <StaggerContainer className="space-y-2 opacity-60">
              {inactive.map((intern, idx) => (
                <StaggerItem key={intern.id}>
                  <InternCard
                    intern={intern}
                    colorClass={avatarColors[(active.length + idx) % avatarColors.length]}
                    isActive={false}
                  />
                </StaggerItem>
              ))}
            </StaggerContainer>
          </section>
        )}
      </main>
    </div>
  )
}

function InternCard({
  intern,
  colorClass,
  isActive,
}: {
  intern: Pick<Profile, 'id' | 'full_name' | 'email' | 'course' | 'internship_start' | 'internship_end' | 'is_active' | 'photo_url'>
  colorClass: string
  isActive: boolean
}) {
  return (
    <Link
      href={`/admin/interns/${intern.id}`}
      className="group flex items-center gap-3 sm:gap-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200 px-4 sm:px-5 py-3 sm:py-4"
    >
      {intern.photo_url ? (
        <img
          src={intern.photo_url}
          alt={intern.full_name}
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl object-cover flex-shrink-0 ring-2 ring-slate-100 group-hover:ring-blue-100 transition-all"
        />
      ) : (
        <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${colorClass}`}>
          {intern.full_name.charAt(0).toUpperCase()}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-800 group-hover:text-blue-700 transition-colors text-sm sm:text-base truncate">{intern.full_name}</p>
        <p className="text-xs text-slate-400 truncate">{intern.email}</p>
        {/* Mobile: curso abaixo do email */}
        {intern.course && (
          <p className="text-xs text-slate-400 sm:hidden mt-0.5">{intern.course}</p>
        )}
      </div>

      <div className="text-right hidden sm:block flex-shrink-0">
        {intern.course && (
          <p className="text-sm text-slate-600 font-medium">{intern.course}</p>
        )}
        {intern.internship_start && (
          <p className="text-xs text-slate-400">
            Desde {new Date(intern.internship_start).toLocaleDateString('pt-BR')}
          </p>
        )}
      </div>

      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-semibold border ${
          isActive
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-slate-100 text-slate-500 border-slate-200'
        }`}>
          {isActive ? 'Ativo' : 'Inativo'}
        </span>
        <span className="text-slate-300 text-base group-hover:text-blue-400 transition-colors">›</span>
      </div>
    </Link>
  )
}
