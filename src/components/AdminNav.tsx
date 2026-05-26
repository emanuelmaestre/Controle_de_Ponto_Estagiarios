import Link from 'next/link'
import Image from 'next/image'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { Home, Users, CheckSquare, BarChart2, Settings } from 'lucide-react'
import ThemeToggle from './ThemeToggle'

export default async function AdminNav({ pending = 0 }: { pending?: number }) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = user
    ? await supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle()
    : { data: null }

  const navItems = [
    { href: '/admin',          label: 'Início',      icon: <Home        size={18} /> },
    { href: '/admin/interns',  label: 'Estagiários', icon: <Users       size={18} /> },
    { href: '/admin/approvals',label: 'Aprovações',  icon: <CheckSquare size={18} />, badge: pending },
    { href: '/admin/reports',  label: 'Relatórios',  icon: <BarChart2   size={18} /> },
    { href: '/admin/settings', label: 'Config',      icon: <Settings    size={18} /> },
  ]

  const initials = profile?.full_name
    ? profile.full_name.split(' ').slice(0, 2).map((n: string) => n[0]).join('')
    : 'AD'

  return (
    <>
      {/* ── Desktop header ─────────────────────────────── */}
      <header
        className="sticky top-0 z-50 shadow-lg border-b"
        style={{ background: 'var(--nav-bg)', borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/admin" className="flex items-center gap-3 flex-shrink-0 group">
            <div className="relative w-8 h-8 flex-shrink-0">
              <Image src="/logo.svg" alt="ChronosLab" fill className="object-contain" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-bold leading-none" style={{ color: 'var(--nav-fg)' }}>ChronosLab</p>
              <p className="text-[10px] leading-none mt-0.5" style={{ color: 'var(--nav-muted)' }}>Controle de Ponto</p>
            </div>
          </Link>

          {/* Nav desktop */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="nav-link relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-150"
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
                {(item.badge ?? 0) > 0 && (
                  <span
                    className="absolute -top-1 -right-1 w-4 h-4 text-[10px] font-black rounded-full flex items-center justify-center"
                    style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <ThemeToggle compact />

            <div
              className="hidden lg:flex items-center gap-2.5 pl-3 border-l"
              style={{ borderColor: 'rgba(255,255,255,0.12)' }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                style={{ background: 'var(--primary)', color: 'var(--primary-fg)' }}
              >
                {initials}
              </div>
              <span className="text-xs font-medium truncate max-w-[120px]" style={{ color: 'var(--nav-muted)' }}>
                {profile?.full_name ?? 'Gerente'}
              </span>
            </div>

            <form action="/api/auth/signout" method="POST">
              <button
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all hover:opacity-90"
                style={{
                  color: 'var(--nav-muted)',
                  borderColor: 'rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.05)',
                }}
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* ── Mobile bottom nav ──────────────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)', boxShadow: '0 -4px 24px rgba(0,0,0,0.12)' }}
      >
        <div className="flex justify-around items-center py-1">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center gap-0.5 py-2.5 px-3 flex-1 transition-all"
              style={{ color: 'var(--text-3)' }}
            >
              <span>{item.icon}</span>
              <span className="text-[10px] font-semibold">{item.label}</span>
              {(item.badge ?? 0) > 0 && (
                <span
                  className="absolute top-1.5 right-1/4 translate-x-1/2 w-4 h-4 text-[9px] font-black rounded-full flex items-center justify-center"
                  style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </div>
      </nav>
    </>
  )
}
