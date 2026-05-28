import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { Profile } from '@/types/database'
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/MotionWrappers'
import { UserPlus, Users } from 'lucide-react'

export const dynamic = 'force-dynamic'

const AVATAR_COLORS = [
  { bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.3)', text: '#60a5fa' },
  { bg: 'rgba(139,92,246,0.15)', border: 'rgba(139,92,246,0.3)', text: '#a78bfa' },
  { bg: 'rgba(236,72,153,0.15)', border: 'rgba(236,72,153,0.3)', text: '#f472b6' },
  { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)', text: '#34d399' },
  { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)', text: '#fbbf24' },
  { bg: 'rgba(6,182,212,0.15)',  border: 'rgba(6,182,212,0.3)',  text: '#22d3ee' },
]

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
    <div className="flex flex-col flex-1 min-h-0" style={{ background: 'var(--bg)' }}>

      {/* ── TopAppBar ──────────────────────────────── */}
      <FadeIn delay={0}>
        <header
          className="flex items-center justify-between px-6 h-16 flex-shrink-0"
          style={{ background: 'var(--bg)', borderBottom: '1px solid rgba(0,200,83,0.15)' }}
        >
          <h2 className="text-2xl font-semibold" style={{ color: 'var(--text)' }}>
            Estagiários
          </h2>
        </header>
      </FadeIn>

      {/* ── Main content ───────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto p-6" style={{ maxWidth: 1400, margin: '0 auto', width: '100%' }}>

        {/* Header */}
        <FadeIn delay={0.04}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-3xl font-semibold" style={{ color: 'var(--text)' }}>
                Lista de Estagiários
              </h3>
              <p className="text-base mt-1 preserve-case" style={{ color: 'var(--text-3)' }}>
                {active.length} ativo{active.length !== 1 ? 's' : ''} &middot; {inactive.length} inativo{inactive.length !== 1 ? 's' : ''}
              </p>
            </div>
            <Link
              href="/admin/interns/new"
              className="flex items-center gap-2 px-6 py-2.5 rounded font-bold text-sm transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: '#00c853', color: '#003912' }}
            >
              <UserPlus size={16} />
              Novo Estagiário
            </Link>
          </div>
        </FadeIn>

        {/* Ativos */}
        <section className="mb-8">
          <FadeIn delay={0.08}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#00c853' }} />
              <h4 className="text-sm font-semibold" style={{ color: 'var(--text-3)' }}>
                Ativos — {active.length}
              </h4>
              <div className="flex-1 h-px" style={{ background: 'rgba(0,200,83,0.15)' }} />
            </div>
          </FadeIn>

          {active.length === 0 ? (
            <FadeIn>
              <div
                className="rounded-xl flex flex-col items-center justify-center py-12"
                style={{ background: 'var(--surface-card, #0f2318)', border: '1px solid rgba(0,200,83,0.15)' }}
              >
                <Users size={40} className="mb-3" style={{ color: 'var(--text-3)', opacity: 0.4 }} />
                <p className="text-sm preserve-case" style={{ color: 'var(--text-3)' }}>Nenhum estagiário ativo.</p>
              </div>
            </FadeIn>
          ) : (
            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {active.map((intern, idx) => (
                <StaggerItem key={intern.id}>
                  <InternCard intern={intern} colorIdx={idx} isActive />
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </section>

        {/* Inativos */}
        {inactive.length > 0 && (
          <section>
            <FadeIn delay={0.04}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: 'var(--text-3)' }} />
                <h4 className="text-sm font-semibold" style={{ color: 'var(--text-3)' }}>
                  Inativos — {inactive.length}
                </h4>
                <div className="flex-1 h-px" style={{ background: 'rgba(0,200,83,0.15)' }} />
              </div>
            </FadeIn>
            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 opacity-60">
              {inactive.map((intern, idx) => (
                <StaggerItem key={intern.id}>
                  <InternCard intern={intern} colorIdx={active.length + idx} isActive={false} />
                </StaggerItem>
              ))}
            </StaggerContainer>
          </section>
        )}

        {/* Empty state */}
        {active.length === 0 && inactive.length === 0 && (
          <FadeIn>
            <div
              className="rounded-xl flex flex-col items-center justify-center py-16"
              style={{ background: 'var(--surface-card, #0f2318)', border: '1px solid rgba(0,200,83,0.15)' }}
            >
              <Users size={48} className="mb-4" style={{ color: 'var(--text-3)', opacity: 0.4 }} />
              <p className="text-lg font-semibold mb-1" style={{ color: 'var(--text)' }}>
                Nenhum estagiário cadastrado
              </p>
              <p className="text-sm mb-6 preserve-case" style={{ color: 'var(--text-3)' }}>
                Comece adicionando o primeiro estagiário ao sistema.
              </p>
              <Link
                href="/admin/interns/new"
                className="flex items-center gap-2 px-6 py-2.5 rounded font-bold text-sm transition-all hover:opacity-90"
                style={{ background: '#00c853', color: '#003912' }}
              >
                <UserPlus size={16} />
                Adicionar Estagiário
              </Link>
            </div>
          </FadeIn>
        )}
      </div>
    </div>
  )
}

function InternCard({
  intern,
  colorIdx,
  isActive,
}: {
  intern: Pick<Profile, 'id' | 'full_name' | 'email' | 'course' | 'internship_start' | 'photo_url' | 'is_active'>
  colorIdx: number
  isActive: boolean
}) {
  const initials = intern.full_name.split(' ').slice(0, 2).map(w => w[0]).join('')
  const ac = AVATAR_COLORS[colorIdx % AVATAR_COLORS.length]

  return (
    <Link
      href={`/admin/interns/${intern.id}`}
      className="group block p-5 rounded-xl transition-all duration-200"
      style={{ background: 'var(--surface-card, #0f2318)', border: '1px solid rgba(0,200,83,0.15)' }}
    >
      {/* Top: avatar + name + status */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {intern.photo_url ? (
            <img
              src={intern.photo_url}
              alt={intern.full_name}
              className="w-12 h-12 rounded-full object-cover flex-shrink-0"
              style={{ border: `1px solid ${ac.border}` }}
            />
          ) : (
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0"
              style={{ background: ac.bg, border: `1px solid ${ac.border}`, color: ac.text }}
            >
              {initials}
            </div>
          )}
          <div>
            <h5 className="text-base font-bold preserve-case" style={{ color: 'var(--text)' }}>
              {intern.full_name}
            </h5>
            {intern.course && (
              <p className="text-xs preserve-case truncate" style={{ color: 'var(--text-3)', maxWidth: 160 }}>
                {intern.course}
              </p>
            )}
          </div>
        </div>
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded flex-shrink-0"
          style={{
            background: isActive ? 'rgba(0,200,83,0.10)' : 'rgba(134,149,131,0.10)',
            border: `1px solid ${isActive ? '#00c853' : 'var(--text-3)'}`,
            color: isActive ? '#00c853' : 'var(--text-3)',
          }}
        >
          {isActive ? 'Ativo' : 'Inativo'}
        </span>
      </div>

      {/* Divider */}
      <div className="w-full mb-4" style={{ height: 1, background: 'rgba(0,200,83,0.15)' }} />

      {/* Email */}
      <p className="text-xs preserve-case truncate" style={{ color: 'var(--text-3)' }}>
        {intern.email}
      </p>
    </Link>
  )
}
