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
    { href: '/admin',           label: 'INÍCIO',      icon: <Home       size={16} /> },
    { href: '/admin/interns',   label: 'ESTAGIÁRIOS', icon: <Users      size={16} /> },
    { href: '/admin/workload',  label: 'CARGA',       icon: <TrendingUp size={16} /> },
    { href: '/admin/reports',   label: 'RELATÓRIOS',  icon: <BarChart2  size={16} /> },
    { href: '/admin/settings',  label: 'CONFIG',      icon: <Settings   size={16} /> },
  ]

  const initials = profile?.full_name
    ? profile.full_name.split(' ').slice(0, 2).map((n: string) => n[0]).join('')
    : 'AD'

  return (
    <>
      {/* ── Desktop Sidebar ─────────────────────────────── */}
      <aside
        className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 z-50"
        style={{
          width: 260,
          background: 'var(--nav-bg)',
          borderRight: '1px solid rgba(0,200,83,0.15)',
        }}
      >
        {/* Logo area */}
        <Link
          href="/admin"
          className="flex items-center gap-3 px-5 py-5 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(0,200,83,0.10)' }}
        >
          <div className="relative h-9 w-9 flex-shrink-0">
            <Image src="/logo.svg" alt="ChronosLab" fill className="object-contain" />
          </div>
          <div className="flex flex-col">
            <p className="text-[13px] font-black leading-none tracking-wider" style={{ color: '#3fe56c' }}>
              CHRONOS<span style={{ color: '#d4e8d5' }}>LAB</span>
            </p>
            <p className="text-[9px] leading-none mt-1 tracking-widest" style={{ color: 'var(--text-3)' }}>
              CONTROLE DE PONTO
            </p>
          </div>
        </Link>

        {/* Nav items */}
        <nav className="flex-1 flex flex-col gap-0.5 px-3 pt-4">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="nav-link flex items-center gap-3 px-3 py-2.5 rounded-lg text-[11px] font-bold tracking-wide transition-all duration-150"
            >
              <span className="flex-shrink-0">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Bottom: theme + user + logout */}
        <div className="flex-shrink-0 px-3 pb-4 space-y-2" style={{ borderTop: '1px solid rgba(0,200,83,0.10)', paddingTop: 12 }}>
          {/* User info */}
          <div
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
            style={{ background: 'var(--surface-container-high, #1d2e21)' }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black flex-shrink-0 ring-2"
              style={{
                background: 'var(--surface-variant)',
                color: 'var(--primary)',
                ringColor: 'rgba(0,200,83,0.25)',
                border: '2px solid rgba(0,200,83,0.3)',
              }}
              title={profile?.full_name ?? 'Gerente'}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold leading-none truncate" style={{ color: 'var(--text)' }}>
                {profile?.full_name?.split(' ')[0] ?? 'Gerente'}
              </p>
              <p className="text-[9px] mt-0.5 tracking-widest" style={{ color: 'var(--text-3)' }}>ADMIN</p>
            </div>
            <ThemeToggle compact />
          </div>

          {/* Logout */}
          <form action="/api/auth/signout" method="POST" className="w-full">
            <button
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-[11px] font-bold tracking-wide transition-all hover:opacity-90"
              style={{
                background: 'rgba(255,82,82,0.08)',
                border: '1px solid rgba(255,82,82,0.2)',
                color: 'var(--danger)',
              }}
            >
              <LogOut size={14} /> SAIR
            </button>
          </form>
        </div>
      </aside>

      {/* ── Mobile top header ──────────────────────────── */}
      <header
        className="md:hidden sticky top-0 z-50 shadow-md"
        style={{
          background: 'var(--nav-bg)',
          borderBottom: '1px solid rgba(0,200,83,0.15)',
        }}
      >
        <div className="w-full px-4 h-14 flex items-center gap-3">
          <Link href="/admin" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="relative h-8 w-8 flex-shrink-0">
              <Image src="/logo.svg" alt="ChronosLab" fill className="object-contain" />
            </div>
            <p className="text-[11px] font-black leading-none tracking-wide" style={{ color: '#3fe56c' }}>
              CHRONOS<span style={{ color: '#d4e8d5' }}>LAB</span>
            </p>
          </Link>
          <div className="flex items-center gap-2 ml-auto">
            <ThemeToggle compact />
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black"
              style={{ background: 'var(--surface-variant)', color: 'var(--primary)', border: '2px solid rgba(0,200,83,0.3)' }}
            >
              {initials}
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile bottom nav ──────────────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50"
        style={{
          background: 'var(--surface-card)',
          borderTop: '1px solid rgba(0,200,83,0.15)',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.4)',
        }}
      >
        <div className="flex justify-around items-center py-1">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center gap-0.5 py-2 px-2 flex-1 transition-all"
              style={{ color: 'var(--text-3)' }}
            >
              <span>{item.icon}</span>
              <span className="text-[8px] font-semibold tracking-wide">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  )
}
