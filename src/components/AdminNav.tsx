import Link from 'next/link'
import Image from 'next/image'
import { getServerUser, getServerProfile } from '@/lib/supabase/cached'
import { Home, Users, BarChart2, Settings, TrendingUp, LogOut } from 'lucide-react'
import ThemeToggle from './ThemeToggle'

export default async function AdminNav() {
  const { data: { user } } = await getServerUser()
  const { data: profile } = user
    ? await getServerProfile(user.id)
    : { data: null }

  const navItems = [
    { href: '/admin',           label: 'INÍCIO',      icon: <Home       size={15} /> },
    { href: '/admin/interns',   label: 'ESTAGIÁRIOS', icon: <Users      size={15} /> },
    { href: '/admin/workload',  label: 'CARGA',       icon: <TrendingUp size={15} /> },
    { href: '/admin/reports',   label: 'RELATÓRIOS',  icon: <BarChart2  size={15} /> },
    { href: '/admin/settings',  label: 'CONFIG',      icon: <Settings   size={15} /> },
  ]

  const initials = profile?.full_name
    ? profile.full_name.split(' ').slice(0, 2).map((n: string) => n[0]).join('')
    : 'AD'

  return (
    <>
      {/* ── Desktop header ─────────────────────────────── */}
      <header
        className="sticky top-0 z-50 shadow-md border-b"
        style={{ background: 'var(--nav-bg)', borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <div className="w-full px-4 sm:px-6 h-14 flex items-center gap-3">

          {/* Logo — fixed width, compact */}
          <Link href="/admin" className="flex items-center gap-2.5 flex-shrink-0" style={{ minWidth: 140 }}>
            <div className="relative h-9 w-9 flex-shrink-0">
              <Image src="/logo.svg" alt="ChronosLab" fill className="object-contain" />
            </div>
            <div className="hidden sm:flex flex-col">
              <p className="text-[11px] font-black leading-none tracking-wide" style={{ color: 'white' }}>
                CHRONOS<span style={{ color: 'var(--primary-fg, #4ade80)' }}> LAB</span>
              </p>
              <p className="text-[9px] leading-none mt-0.5 whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.35)' }}>
                CONTROLE DE PONTO
              </p>
            </div>
          </Link>

          {/* Divider */}
          <div className="hidden sm:block w-px h-7 flex-shrink-0" style={{ background: 'rgba(255,255,255,0.12)' }} />

          {/* Nav — takes remaining space, centered */}
          <nav className="hidden md:flex items-center gap-0.5 flex-1">
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="nav-link relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all duration-150 whitespace-nowrap tracking-wide"
              >
                <span className="flex-shrink-0">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Right side — fixed, never shrinks */}
          <div className="flex items-center gap-2 ml-auto flex-shrink-0">
            <ThemeToggle compact />

            <div className="w-px h-6 flex-shrink-0" style={{ background: 'rgba(255,255,255,0.12)' }} />

            {/* User chip */}
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-black flex-shrink-0"
                style={{ background: 'var(--primary)', color: 'white', minWidth: 32 }}
                title={profile?.full_name ?? 'Gerente'}
              >
                {initials}
              </div>
              <div className="hidden lg:flex flex-col" style={{ maxWidth: 100 }}>
                <span className="text-[10px] font-bold leading-none truncate" style={{ color: 'white' }}>
                  {profile?.full_name?.split(' ')[0] ?? 'Gerente'}
                </span>
                <span className="text-[9px] leading-none mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>ADMIN</span>
              </div>
            </div>

            <form action="/api/auth/signout" method="POST">
              <button
                className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg border transition-all hover:opacity-80 flex-shrink-0"
                style={{
                  color: 'rgba(255,255,255,0.6)',
                  borderColor: 'rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.06)',
                }}
              >
                SAIR
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
        {/* User info bar */}
        <div
          className="flex items-center justify-between gap-2 px-4 py-2 border-b"
          style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black flex-shrink-0"
              style={{ background: 'var(--primary)', color: 'white' }}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold leading-none truncate" style={{ color: 'var(--text)' }}>
                {profile?.full_name?.split(' ')[0] ?? 'Gerente'}
              </p>
              <p className="text-[9px] mt-0.5" style={{ color: 'var(--text-3)' }}>ADMINISTRADOR</p>
            </div>
          </div>
          <form action="/api/auth/signout" method="POST">
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all active:scale-95"
              style={{
                background: 'rgba(220,38,38,0.08)',
                border: '1px solid rgba(220,38,38,0.2)',
                color: 'var(--danger)',
              }}
            >
              <LogOut size={11} /> SAIR
            </button>
          </form>
        </div>

        {/* Nav items */}
        <div className="flex justify-around items-center py-1">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center gap-0.5 py-2 px-2 flex-1 transition-all"
              style={{ color: 'var(--text-3)' }}
            >
              <span>{item.icon}</span>
              <span className="text-[9px] font-semibold">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  )
}
