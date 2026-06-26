import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Home, ClipboardList, Trophy, LogOut, ArrowLeft, User } from 'lucide-react'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ensureProfile } from '@/lib/ensureProfile'
import MobileOnlyGuard from '@/components/MobileOnlyGuard'
import InternNotificationBell from '@/components/InternNotificationBell'
import ProfileForm from './ProfileForm'
import ProfileAchievements from './ProfileAchievements'
import ProfileReports from './ProfileReports'
import ProfileUpdates from './ProfileUpdates'
import ResetOnboardingButton from './ResetOnboardingButton'
import { getLevelInfo, getLevelTitle, getLevelForPoints } from '@/lib/gamification'
import { detectGender } from '@/lib/detectGender'

interface Props {
  searchParams: Promise<{ tab?: string }>
}

export default async function ProfilePage({ searchParams }: Props) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const activeTab = params.tab === 'conquistas' ? 'conquistas' : params.tab === 'relatorios' ? 'relatorios' : params.tab === 'novidades' ? 'novidades' : 'dados'

  let { data: profile } = await supabase
    .from('profiles')
    .select('full_name, nickname, email, course, photo_url, role, points, level, streak_days, course_duration_years')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) {
    await ensureProfile(user.id, user.email ?? null)
    const { data: reloaded } = await supabase
      .from('profiles')
      .select('full_name, nickname, email, course, photo_url, role, points, level, streak_days, course_duration_years')
      .eq('id', user.id)
      .maybeSingle()
    profile = reloaded
  }

  // managers can access their own profile

  const initialData = {
    full_name: profile?.full_name ?? '',
    nickname: profile?.nickname ?? null,
    email: profile?.email ?? user.email ?? '',
    course: profile?.course ?? null,
    photo_url: profile?.photo_url ?? null,
  }

  const pts             = profile?.points ?? 0
  const courseDuration  = profile?.course_duration_years ?? 5
  const effectiveLevel  = getLevelForPoints(pts, courseDuration)
  const lvl             = getLevelInfo(effectiveLevel)
  const gender          = detectGender(profile?.full_name ?? '')
  const title           = getLevelTitle(lvl.level, gender)
  const streak          = profile?.streak_days ?? 0

  const { data: achievementsData } = await supabase
    .from('achievements')
    .select('type, unlocked_at')
    .eq('intern_id', user.id)
    .order('unlocked_at', { ascending: false })

  const userAchievements = achievementsData ?? []

  return (
    <MobileOnlyGuard>
      <div className="flex flex-col" style={{ height: '100dvh', overflow: 'hidden', background: 'var(--bg)' }}>

        {/* Header */}
        <header className="flex-shrink-0" style={{ background: 'var(--nav-bg)', borderBottom: '1px solid rgba(0,200,83,0.12)' }}>
          <div className="max-w-lg mx-auto px-4 sm:px-5 py-3 sm:py-4 flex items-center gap-2 sm:gap-3">
            <Link href="/dashboard" className="flex-shrink-0" style={{ color: 'rgba(255,255,255,0.6)' }}>
              <ArrowLeft size={20} />
            </Link>
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-black" style={{ color: 'white' }}>MEU PERFIL</h1>
              <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>Edite seus dados e foto</p>
            </div>
            {/* Notificações + Level badge */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <InternNotificationBell />
              {streak > 0 && (
                <span className="text-[10px] sm:text-xs font-bold" style={{ color: '#f97316' }}>🔥 {streak}d</span>
              )}
              <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-black px-2 sm:px-2.5 py-1 rounded-full"
                style={{ background: `${lvl.color}18`, border: `1px solid ${lvl.color}35`, color: lvl.color }}>
                {lvl.icon} <span className="hidden xs:inline sm:inline">{title}</span>
              </span>
              <span className="text-[10px] font-bold hidden sm:inline" style={{ color: 'rgba(255,255,255,0.4)' }}>⭐{pts}</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="max-w-lg mx-auto flex overflow-x-auto scrollbar-hide" style={{ borderTop: '1px solid rgba(0,200,83,0.08)' }}>
            {[
              { key: 'dados',       label: 'Dados',       icon: '👤' },
              { key: 'conquistas',  label: 'Conquistas',  icon: '🏆' },
              { key: 'relatorios',  label: 'Relatórios',  icon: '📄' },
              { key: 'novidades',   label: 'Novidades',   icon: '✨' },
            ].map(t => (
              <Link
                key={t.key}
                href={`/profile?tab=${t.key}`}
                className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-black py-3 px-3 sm:px-4 whitespace-nowrap transition-colors flex-shrink-0"
                style={activeTab === t.key
                  ? { color: '#3fe56c', borderBottom: '2px solid #3fe56c', marginBottom: -1 }
                  : { color: 'rgba(255,255,255,0.3)' }
                }
              >
                {t.icon} {t.label}
                {t.key === 'conquistas' && userAchievements.length > 0 && (
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                    style={{ background: '#3fe56c', color: '#003912' }}>
                    {userAchievements.length}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </header>

        {/* Conteúdo */}
        <main className="flex-1 min-h-0 overflow-y-auto">
          <div className="max-w-lg mx-auto px-4 sm:px-5 py-4 sm:py-5">
            {activeTab === 'dados' && (
              <div className="space-y-5">
                <ProfileForm initial={initialData} />
                <ResetOnboardingButton userId={user.id} />
              </div>
            )}
            {activeTab === 'relatorios' && <ProfileReports />}
            {activeTab === 'novidades' && <ProfileUpdates />}
            {activeTab === 'conquistas' && (
              <ProfileAchievements
                points={pts}
                level={effectiveLevel}
                streakDays={streak}
                achievements={userAchievements}
                fullName={profile?.full_name ?? ''}
              />
            )}
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
