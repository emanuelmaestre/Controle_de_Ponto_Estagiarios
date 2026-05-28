import Link from 'next/link'
import Image from 'next/image'
import { getServerUser, getServerProfile } from '@/lib/supabase/cached'
import { LayoutDashboard, Clock, BarChart2, Settings, LogOut } from 'lucide-react'
import ThemeToggle from './ThemeToggle'

export default async function AdminNav() {
  const { data: { user } } = await getServerUser()
  const { data: profile } = user
    ? await getServerProfile(user.id)
    : { data: null }

  const navItems = [
    { href: '/admin',           label: 'Painel',         icon: <LayoutDashboard size={20} /> },
    { href: '/admin/workload',  label: 'Carga Horária',  icon: <Clock           size={20} /> },
    { href: '/admin/reports',   label: 'Relatórios',     icon: <BarChart2       size={20} /> },
    { href: '/admin/settings',  label: 'Configurações',  icon: <Settings        size={20} /> },
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
          background: 'var(--surface, #07170c)',
          borderRight: '1px solid rgba(0,200,83,0.15)',
        }}
      >
        {/* Logo area */}
        <div className="px-6 mb-10 pt-6">
          <Link href="/admin" className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(63,229,108,0.2)', border: '1px solid rgba(63,229,108,0.4)' }}
            >
              <div className="relative h-6 w-6">
                <Image src="/logo.svg" alt="Chronos Lab" fill className="object-contain" />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-bold leading-none" style={{ color: '#3fe56c' }}>
                Chronos Lab
              </h1>
              <p className="text-[10px] tracking-widest font-bold mt-0.5 preserve-case" style={{ color: 'var(--text-3)' }}>
                Console de Admin
              </p>
            </div>
          </Link>
        </div>

        {/* Nav items */}
        <nav className="flex-1 space-y-2 px-3">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="nav-link flex items-center gap-3 px-4 py-3 rounded-lg text-base transition-all duration-200 active:scale-[0.98]"
            >
              <span className="flex-shrink-0">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Bottom: logout */}
        <div className="mt-auto px-3 pb-6">
          <form action="/api/auth/signout" method="POST" className="w-full">
            <button
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-base transition-colors duration-200 hover:opacity-90"
              style={{ color: 'var(--text-3)' }}
            >
              <LogOut size={20} /> Sair
            </button>
          </form>
        </div>
      </aside>

      {/* ── Mobile top header ──────────────────────────── */}
      <header
        className="md:hidden sticky top-0 z-50 shadow-md"
        style={{
          background: 'var(--surface, #07170c)',
          borderBottom: '1px solid rgba(0,200,83,0.15)',
        }}
      >
        <div className="w-full px-4 h-14 flex items-center gap-3">
          <Link href="/admin" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="relative h-7 w-7 flex-shrink-0">
              <Image src="/logo.svg" alt="Chronos Lab" fill className="object-contain" />
            </div>
            <span className="text-base font-bold" style={{ color: '#3fe56c' }}>
              Chronos Lab
            </span>
          </Link>
          <div className="flex items-center gap-3 ml-auto">
            <ThemeToggle compact />
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: 'var(--surface-variant)', color: 'var(--primary)', border: '1px solid rgba(63,229,108,0.3)' }}
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
          background: 'var(--surface-card, #0f2318)',
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
              <span className="text-[9px] font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  )
}
