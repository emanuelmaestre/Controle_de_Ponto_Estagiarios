import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { Profile } from '@/types/database'
import AdminNav from '@/components/AdminNav'
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/MotionWrappers'

export const dynamic = 'force-dynamic'

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

  const active   = interns?.filter(i => i.is_active) ?? []
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
    <div className="min-h-screen pb-24 md:pb-8" style={{ background: 'var(--bg)' }}>
      <AdminNav />

      {/* Page header */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/admin"
              className="text-sm flex items-center gap-1 transition-colors hover:opacity-70 flex-shrink-0"
              style={{ color: 'var(--text-3)' }}
            >
              &larr; <span className="hidden sm:inline">Inicio</span>
            </Link>
            <span style={{ color: 'var(--border)' }} className="hidden sm:inline">|</span>
            <div className="min-w-0">
              <h1 className="font-bold text-lg" style={{ color: 'var(--text)' }}>Estagiarios</h1>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                {active.length} ativo{active.length !== 1 ? 's' : ''} &middot; {inactive.length} inativo{inactive.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <Link
            href="/admin/interns/new"
            className="flex items-center gap-1 sm:gap-2 font-semibold text-sm px-3 sm:px-4 py-2 rounded-xl transition-all flex-shrink-0 hover:opacity-90"
            style={{ background: 'var(--primary)', color: 'white' }}
          >
            + <span className="hidden sm:inline">Novo</span> estagiario
          </Link>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        {/* Ativos */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-2 rounded-full" style={{ background: 'var(--success)' }} />
            <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>
              Ativos &mdash; {active.length}
            </h2>
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          </div>

          <StaggerContainer className="space-y-2">
            {active.map((intern, idx) => (
              <StaggerItem key={intern.id}>
                <InternCard intern={intern} colorClass={avatarColors[idx % avatarColors.length]} isActive />
              </StaggerItem>
            ))}
            {active.length === 0 && (
              <FadeIn>
                <div className="py-10 text-center" style={{ color: 'var(--text-3)' }}>
                  <p className="text-3xl mb-2">&#128100;</p>
                  <p className="text-sm">Nenhum estagiario ativo.</p>
                </div>
              </FadeIn>
            )}
          </StaggerContainer>
        </section>

        {/* Inativos */}
        {inactive.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-2 rounded-full" style={{ background: 'var(--text-3)' }} />
              <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>
                Inativos &mdash; {inactive.length}
              </h2>
              <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
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
      className="group flex items-center gap-3 sm:gap-4 rounded-2xl transition-all duration-200 px-4 sm:px-5 py-3 sm:py-4"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}
    >
      {intern.photo_url ? (
        <img
          src={intern.photo_url}
          alt={intern.full_name}
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl object-cover flex-shrink-0 ring-2 ring-slate-200 transition-all"
        />
      ) : (
        <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${colorClass}`}>
          {intern.full_name.charAt(0).toUpperCase()}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm sm:text-base truncate transition-colors" style={{ color: 'var(--text)' }}>
          {intern.full_name}
        </p>
        <p className="text-xs truncate" style={{ color: 'var(--text-3)' }}>{intern.email}</p>
        {intern.course && (
          <p className="text-xs sm:hidden mt-0.5" style={{ color: 'var(--text-3)' }}>{intern.course}</p>
        )}
      </div>

      <div className="text-right hidden sm:block flex-shrink-0">
        {intern.course && (
          <p className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>{intern.course}</p>
        )}
        {intern.internship_start && (
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>
            Desde {new Date(intern.internship_start).toLocaleDateString('pt-BR')}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <span
          className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-semibold border ${
            isActive
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-slate-100 text-slate-500 border-slate-200'
          }`}
        >
          {isActive ? 'Ativo' : 'Inativo'}
        </span>
        <span className="text-base transition-colors" style={{ color: 'var(--text-3)' }}>›</span>
      </div>
    </Link>
  )
}
