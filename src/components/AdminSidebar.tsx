'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, TrendingUp, BarChart2, Settings,
  LogOut, Users, ChevronDown,
} from 'lucide-react'

interface Props {
  fullName: string
  initials: string
}

interface NavItem {
  href?: string
  label: string
  icon: React.ElementType
  end?: boolean
  children?: { href: string; label: string }[]
}

const NAV_ITEMS: NavItem[] = [
  { href: '/admin',           label: 'Painel',           icon: LayoutDashboard, end: true },
  {
    label: 'Cadastros',
    icon: Users,
    children: [{ href: '/admin/interns', label: 'Estagiários' }],
  },
  { href: '/admin/workload',  label: 'Carga de Trabalho', icon: TrendingUp },
  { href: '/admin/reports',   label: 'Relatórios',        icon: BarChart2 },
  { href: '/admin/settings',  label: 'Configurações',     icon: Settings },
]

const MOBILE_NAV = [
  { href: '/admin',           label: 'Painel',      icon: LayoutDashboard, end: true },
  { href: '/admin/interns',   label: 'Cadastros',   icon: Users },
  { href: '/admin/workload',  label: 'Carga',       icon: TrendingUp },
  { href: '/admin/reports',   label: 'Relatórios',  icon: BarChart2 },
  { href: '/admin/settings',  label: 'Config',      icon: Settings },
]

const AVATAR_COLORS = ['#3b82f6','#8b5cf6','#ec4899','#10b981','#f59e0b','#06b6d4']
const avatarColor   = (name: string) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]

export default function AdminSidebar({ fullName, initials }: Props) {
  const pathname = usePathname()
  const [mounted,    setMounted]    = useState(false)
  const [isDesktop,  setIsDesktop]  = useState(false)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ Cadastros: true })

  useEffect(() => {
    setMounted(true)
    const check = () => setIsDesktop(window.innerWidth >= 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // auto-abrir grupo se filho está ativo
  useEffect(() => {
    NAV_ITEMS.forEach(item => {
      if (item.children?.some(c => pathname.startsWith(c.href))) {
        setOpenGroups(prev => ({ ...prev, [item.label]: true }))
      }
    })
  }, [pathname])

  const isActive      = (href: string, end?: boolean) => end ? pathname === href : pathname.startsWith(href)
  const isGroupActive = (item: NavItem) => item.children?.some(c => pathname.startsWith(c.href)) ?? false

  if (!mounted) return null

  /* ── Renderizar item simples ── */
  const NavLink = ({ item }: { item: NavItem }) => {
    if (!item.href) return null
    const active = isActive(item.href, item.end)
    const Icon   = item.icon
    return (
      <Link href={item.href}>
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer"
          style={{
            color:      active ? '#3fe56c' : 'var(--text-3)',
            fontWeight: active ? 700 : 400,
            background: active ? 'rgba(0,200,83,0.08)' : 'transparent',
            borderLeft: active ? '4px solid #00c853' : '4px solid transparent',
          }}
        >
          <Icon size={20} style={{ flexShrink: 0 }} />
          <span className="text-sm">{item.label}</span>
        </div>
      </Link>
    )
  }

  /* ── Renderizar grupo com filhos ── */
  const NavGroup = ({ item }: { item: NavItem }) => {
    const Icon       = item.icon
    const groupActive = isGroupActive(item)
    const isOpen      = openGroups[item.label] ?? false

    return (
      <div>
        <button
          onClick={() => setOpenGroups(prev => ({ ...prev, [item.label]: !prev[item.label] }))}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200"
          style={{
            color:      groupActive ? '#3fe56c' : 'var(--text-3)',
            fontWeight: groupActive ? 700 : 400,
            background: groupActive && !isOpen ? 'rgba(0,200,83,0.08)' : 'transparent',
            borderLeft: groupActive && !isOpen ? '4px solid #00c853' : '4px solid transparent',
          }}
        >
          <Icon size={20} style={{ flexShrink: 0 }} />
          <span className="text-sm flex-1 text-left">{item.label}</span>
          <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={14} style={{ color: 'rgba(255,255,255,0.3)' }} />
          </motion.div>
        </button>

        <AnimatePresence initial={false}>
          {isOpen && item.children && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              style={{ overflow: 'hidden' }}
            >
              <div className="ml-5 pl-3 mt-0.5 space-y-0.5" style={{ borderLeft: '1px solid rgba(0,200,83,0.15)' }}>
                {item.children.map(child => {
                  const childActive = pathname.startsWith(child.href)
                  return (
                    <Link key={child.href} href={child.href}>
                      <div
                        className="flex items-center px-3 py-2 rounded-lg text-sm transition-all duration-200"
                        style={{
                          color:      childActive ? '#3fe56c' : 'var(--text-3)',
                          fontWeight: childActive ? 700 : 400,
                          background: childActive ? 'rgba(0,200,83,0.08)' : 'transparent',
                          borderLeft: childActive ? '3px solid #00c853' : '3px solid transparent',
                        }}
                      >
                        {child.label}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <>
      {/* ════════════════════════════════════════════
          MOBILE: Top bar
          ════════════════════════════════════════════ */}
      {!isDesktop && (
        <div
          className="flex items-center justify-between px-4 flex-shrink-0 z-40"
          style={{ height: 52, background: 'var(--nav-bg)', borderBottom: '1px solid rgba(0,200,83,0.12)' }}
        >
          <div className="flex items-center gap-2">
            <div className="relative w-7 h-7 flex-shrink-0">
              <Image src="/logo.svg" alt="Chronos" fill className="object-contain" />
            </div>
            <div>
              <p className="text-[11px] font-black leading-none tracking-widest" style={{ color: 'white' }}>
                CHRONOS <span style={{ color: '#3fe56c' }}>LAB</span>
              </p>
              <p className="text-[8px] leading-none" style={{ color: 'rgba(255,255,255,0.35)' }}>
                CONTROLE DE PONTO
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════
          DESKTOP: Sidebar fixo 260px
          ════════════════════════════════════════════ */}
      {isDesktop && (
        <aside
          className="flex flex-col flex-shrink-0 z-40"
          style={{
            width: 260,
            height: '100dvh',
            background: 'var(--nav-bg)',
            borderRight: '1px solid rgba(0,200,83,0.15)',
          }}
        >
          {/* ── Logo ── */}
          <div className="px-6 pt-7 pb-8 flex-shrink-0">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="relative w-7 h-7 flex-shrink-0">
                <Image src="/logo.svg" alt="Chronos" fill className="object-contain" />
              </div>
              <h1 className="text-xl font-bold" style={{ color: '#3fe56c' }}>Chronos Lab</h1>
            </div>
            <p className="text-[11px] font-medium tracking-wider ml-9" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Console de Administração
            </p>
          </div>

          {/* ── Navegação ── */}
          <nav className="flex-1 px-3 space-y-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
            {NAV_ITEMS.map(item =>
              item.children
                ? <NavGroup key={item.label} item={item} />
                : <NavLink  key={item.href}  item={item} />
            )}
          </nav>

          {/* ── Divisória ── */}
          <div className="mx-4 my-3" style={{ height: 1, background: 'rgba(0,200,83,0.10)' }} />

          {/* ── Usuário ── */}
          <div className="px-4 pb-2 flex-shrink-0">
            <div
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1"
              style={{ background: 'rgba(0,200,83,0.06)', border: '1px solid rgba(0,200,83,0.10)' }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black flex-shrink-0"
                style={{ background: avatarColor(fullName), color: 'white' }}
              >
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold leading-none truncate" style={{ color: 'white' }}>
                  {fullName.split(' ')[0]}
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>ADMIN</p>
              </div>
            </div>
          </div>

          {/* ── Sair ── */}
          <div className="px-4 pb-6 flex-shrink-0">
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-200 hover:opacity-80"
                style={{ color: 'var(--danger)', background: 'transparent' }}
              >
                <LogOut size={18} className="flex-shrink-0" />
                Sair
              </button>
            </form>
          </div>
        </aside>
      )}

      {/* ════════════════════════════════════════════
          MOBILE: Bottom nav bar
          ════════════════════════════════════════════ */}
      {!isDesktop && (
        <nav
          className="fixed bottom-0 left-0 right-0 z-50 flex"
          style={{
            background: 'var(--nav-bg)',
            borderTop: '1px solid rgba(0,200,83,0.15)',
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
          {MOBILE_NAV.map(item => {
            const active = isActive(item.href, item.end)
            const Icon   = item.icon
            return (
              <Link key={item.href} href={item.href} className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 relative">
                <Icon size={20} style={{ color: active ? '#3fe56c' : 'var(--text-3)' }} />
                <span className="text-[9px] font-bold leading-none" style={{ color: active ? '#4ade80' : 'rgba(255,255,255,0.4)' }}>
                  {item.label}
                </span>
                {active && (
                  <motion.div
                    layoutId="mobileActiveBar"
                    className="absolute top-0 left-1/2 -translate-x-1/2 rounded-b-full"
                    style={{ width: 24, height: 2, background: '#00c853' }}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            )
          })}
        </nav>
      )}
    </>
  )
}
