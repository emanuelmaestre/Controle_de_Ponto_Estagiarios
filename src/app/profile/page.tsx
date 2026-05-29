import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Home, ClipboardList, Trophy, LogOut, ArrowLeft, User } from 'lucide-react'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ensureProfile } from '@/lib/ensureProfile'
import MobileOnlyGuard from '@/components/MobileOnlyGuard'
import ProfileForm from './ProfileForm'

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let { data: profile } = await supabase
    .from('profiles')
    .select('full_name, nickname, email, course, photo_url, role')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) {
    await ensureProfile(user.id, user.email ?? null)
    const { data: reloaded } = await supabase
      .from('profiles')
      .select('full_name, nickname, email, course, photo_url, role')
      .eq('id', user.id)
      .maybeSingle()
    profile = reloaded
  }

  if (profile?.role === 'manager') redirect('/admin')

  const initialData = {
    full_name: profile?.full_name ?? '',
    nickname: profile?.nickname ?? null,
    email: profile?.email ?? user.email ?? '',
    course: profile?.course ?? null,
    photo_url: profile?.photo_url ?? null,
  }

  return (
    <MobileOnlyGuard>
      <div className="flex flex-col" style={{ height: '100dvh', overflow: 'hidden', background: 'var(--bg)' }}>
        {/* Header */}
        <header className="flex-shrink-0" style={{ background: 'var(--nav-bg)', borderBottom: '1px solid rgba(0,200,83,0.12)' }}>
          <div className="max-w-lg mx-auto px-5 py-4 flex items-center gap-3">
            <Link href="/dashboard" className="flex-shrink-0" style={{ color: 'rgba(255,255,255,0.6)' }}>
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-base font-black" style={{ color: 'white' }}>MEU PERFIL</h1>
              <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>Edite seus dados e foto</p>
            </div>
          </div>
        </header>

        {/* Conteúdo */}
        <main className="flex-1 min-h-0 overflow-y-auto">
          <div className="max-w-lg mx-auto px-5 py-6">
            <ProfileForm initial={initialData} />
          </div>
        </main>

        {/* Bottom nav */}
        <nav className="flex-shrink-0 border-t"
          style={{ background: 'var(--nav-bg)', borderColor: 'rgba(0,200,83,0.12)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="max-w-lg mx-auto flex">
            <Link href="/dashboard" className="flex-1 flex flex-col items-center gap-1 py-3" style={{ color: 'var(--text-3)' }}>
              <Home size={18} /><span className="text-[10px] font-bold">Início</span>
            </Link>
            <Link href="/history" className="flex-1 flex flex-col items-center gap-1 py-3" style={{ color: 'var(--text-3)' }}>
              <ClipboardList size={18} /><span className="text-[10px] font-bold">Histórico</span>
            </Link>
            <Link href="/intern-ranking" className="flex-1 flex flex-col items-center gap-1 py-3" style={{ color: 'var(--text-3)' }}>
              <Trophy size={18} /><span className="text-[10px] font-bold">Ranking</span>
            </Link>
            <Link href="/profile" className="flex-1 flex flex-col items-center gap-1 py-3" style={{ color: 'var(--primary)' }}>
              <User size={18} /><span className="text-[10px] font-bold">Perfil</span>
            </Link>
            <form action="/api/auth/signout" method="POST" className="flex-1">
              <button type="submit" className="w-full flex flex-col items-center gap-1 py-3" style={{ color: 'var(--text-3)' }}>
                <LogOut size={18} /><span className="text-[10px] font-bold">Sair</span>
              </button>
            </form>
          </div>
        </nav>
      </div>
    </MobileOnlyGuard>
  )
}
