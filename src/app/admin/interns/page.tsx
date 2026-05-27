import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { Profile } from '@/types/database'
import AdminNav from '@/components/AdminNav'
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/MotionWrappers'
import { UserPlus, Users } from 'lucide-react'

export const dynamic = 'force-dynamic'

const AVATAR_COLORS = ['#3b82f6','#8b5cf6','#ec4899','#10b981','#f59e0b','#06b6d4']

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

  return (
    <div className="flex flex-col" style={{ height: '100dvh', background: 'var(--bg)', overflow: 'hidden' }}>
      <AdminNav />

      {/* Header compacto */}
      <div className="flex-shrink-0" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/admin" className="text-sm font-bold hover:opacity-70 flex-shrink-0" style={{ color: 'var(--text-3)' }}>
              &larr; INICIO
            </Link>
            <div className="w-px h-4 flex-shrink-0" style={{ background: 'var(--border)' }} />
            <div className="min-w-0">
              <h1 className="font-bold text-sm" style={{ color: 'var(--text)' }}>ESTAGIARIOS</h1>
              <p className="text-[10px]" style={{ color: 'var(--text-3)' }}>
                {active.length} ATIVO{active.length !== 1 ? 'S' : ''} &middot; {inactive.length} INATIVO{inactive.length !== 1 ? 'S' : ''}
              </p>
            </div>
          </div>
          <Link
            href="/admin/interns/new"
            className="flex items-center gap-1.5 font-bold text-[10px] px-3 py-2 rounded-xl transition-all hover:opacity-90 flex-shrink-0"
            style={{ background: 'var(--primary)', color: 'white' }}
          >
            <UserPlus size={13} /> NOVO ESTAGIARIO
          </Link>
        </div>
      </div>

      {/* Lista scrollavel internamente */}
      <div
        className="flex-1 min-h-0 overflow-y-auto"
        style={{ scrollbarWidth: 'thin' }}
      >
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-4 space-y-6">

          {/* Ativos */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: 'var(--success)' }} />
              <h2 className="text-[10px] font-bold" style={{ color: 'var(--text-3)' }}>
                ATIVOS &mdash; {active.length}
              </h2>
              <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            </div>

            <StaggerContainer className="space-y-2">
              {active.map((intern, idx) => (
                <StaggerItem key={intern.id}>
                  <InternCard intern={intern} color={AVATAR_COLORS[idx % AVATAR_COLORS.length]} isActive />
                </StaggerItem>
              ))}
              {active.length === 0 && (
                <FadeIn>
                  <div className="py-8 text-center" style={{ color: 'var(--text-3)' }}>
                    <Users size={32} className="mx-auto mb-1" style={{ color: "var(--text-3)", opacity: 0.35 }} />
                    <p className="text-xs">Nenhum estagiario ativo.</p>
                  </div>
                </FadeIn>
              )}
            </StaggerContainer>
          </section>

          {/* Inativos */}
          {inactive.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: 'var(--text-3)' }} />
                <h2 className="text-[10px] font-bold" style={{ color: 'var(--text-3)' }}>
                  INATIVOS &mdash; {inactive.length}
                </h2>
                <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
              </div>
              <StaggerContainer className="space-y-2 opacity-60">
                {inactive.map((intern, idx) => (
                  <StaggerItem key={intern.id}>
                    <InternCard
                      intern={intern}
                      color={AVATAR_COLORS[(active.length + idx) % AVATAR_COLORS.length]}
                      isActive={false}
                    />
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </section>
          )}

        </main>
      </div>
    </div>
  )
}

function InternCard({
  intern,
  color,
  isActive,
}: {
  intern: Pick<Profile, 'id' | 'full_name' | 'email' | 'course' | 'internship_start' | 'photo_url' | 'is_active'>
  color: string
  isActive: boolean
}) {
  const initials = intern.full_name.split(' ').slice(0, 2).map(w => w[0]).join('')
  return (
    <Link
      href={`/admin/interns/${intern.id}`}
      className="group flex items-center gap-3 rounded-2xl px-4 py-3 transition-all hover:shadow-md"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}
    >
      {intern.photo_url ? (
        <img src={intern.photo_url} alt={intern.full_name} className="w-9 h-9 rounded-xl object-cover flex-shrink-0" />
      ) : (
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 text-white"
          style={{ background: color }}
        >
          {initials}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm truncate" style={{ color: 'var(--text)' }}>{intern.full_name}</p>
        <p className="text-[10px] truncate" style={{ color: 'var(--text-3)' }}>{intern.email}</p>
      </div>

      {intern.course && (
        <p className="text-xs hidden sm:block flex-shrink-0" style={{ color: 'var(--text-2)' }}>{intern.course}</p>
      )}

      <span
        className="text-[9px] font-bold px-2 py-1 rounded-full flex-shrink-0"
        style={{
          background: isActive ? 'rgba(22,163,74,0.10)' : 'var(--bg)',
          color: isActive ? 'var(--success)' : 'var(--text-3)',
          border: `1px solid ${isActive ? 'rgba(22,163,74,0.25)' : 'var(--border)'}`,
        }}
      >
        {isActive ? 'ATIVO' : 'INATIVO'}
      </span>

      <span className="text-base flex-shrink-0" style={{ color: 'var(--text-3)' }}>&#8250;</span>
    </Link>
  )
}
