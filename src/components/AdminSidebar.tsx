'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, TrendingUp, BarChart2, Settings,
  LogOut, Users, ChevronDown, X, Trophy, Bell, Sparkles, Shield,
} from 'lucide-react'
import AdminNotificationBell from '@/components/AdminNotificationBell'

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
  { href: '/admin',              label: 'Painel',           icon: LayoutDashboard, end: true },
  { href: '/admin/interns',      label: 'Cadastros',        icon: Users },
  { href: '/admin/workload',     label: 'Carga de Trabalho',icon: TrendingUp },
  { href: '/admin/reports',      label: 'Relatórios',       icon: BarChart2 },
  { href: '/admin/ranking',      label: 'Ranking',          icon: Trophy },
  { href: '/admin/updates',      label: 'Atualizações',     icon: Sparkles },
  { href: '/admin/settings',     label: 'Configurações',    icon: Settings },
]

const MOBILE_NAV = [
  { href: '/admin',              label: 'Painel',      icon: LayoutDashboard, end: true },
  { href: '/admin/interns',      label: 'Cadastros',   icon: Users },
  { href: '/admin/workload',     label: 'Carga',       icon: TrendingUp },
  { href: '/admin/reports',      label: 'Relatórios',  icon: BarChart2 },
  { href: '/admin/ranking',      label: 'Ranking',     icon: Trophy },
  { href: '/admin/updates',      label: 'Novidades',   icon: Sparkles },
]

const AVATAR_COLORS = ['#3b82f6','#8b5cf6','#ec4899','#10b981','#f59e0b','#06b6d4']
const avatarColor   = (name: string) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]

export default function AdminSidebar({ fullName, initials }: Props) {
  const pathname = usePathname()
  const [mounted,    setMounted]    = useState(false)
  const [isDesktop,  setIsDesktop]  = useState(false)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ Cadastros: true })
  const [profileOpen, setProfileOpen] = useState(false)

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
        <motion.div
          className="relative flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer overflow-hidden"
          style={{
            color:      active ? '#3fe56c' : 'var(--text-3)',
            fontWeight: active ? 700 : 400,
            borderLeft: active ? '3px solid #00c853' : '3px solid transparent',
          }}
          whileHover="hover"
          initial="rest"
          animate="rest"
        >
          {/* Fundo que desliza da esquerda no hover */}
          <motion.span
            className="absolute inset-0 rounded-lg pointer-events-none"
            style={{ background: active ? 'rgba(0,200,83,0.08)' : 'rgba(0,200,83,0.00)' }}
            variants={{
              rest:  { scaleX: active ? 1 : 0, originX: 0 },
              hover: { scaleX: 1, originX: 0, background: 'rgba(0,200,83,0.10)' },
            }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          />
          {/* Borda esquerda que acende no hover */}
          <motion.span
            className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full pointer-events-none"
            style={{ height: active ? '70%' : '0%', background: '#00c853' }}
            variants={{
              rest:  { height: active ? '70%' : '0%', opacity: active ? 1 : 0 },
              hover: { height: '70%', opacity: 1 },
            }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          />
          {/* Ícone com glow no hover */}
          <motion.span
            className="relative z-10 flex-shrink-0"
            variants={{
              rest:  { scale: 1,    filter: 'drop-shadow(0 0 0px transparent)' },
              hover: { scale: 1.15, filter: 'drop-shadow(0 0 6px rgba(63,229,108,0.7))' },
            }}
            transition={{ duration: 0.18 }}
          >
            <Icon size={20} />
          </motion.span>
          <motion.span
            className="relative z-10 text-sm"
            variants={{
              rest:  { x: 0,   color: active ? '#3fe56c' : 'var(--text-3)' },
              hover: { x: 2,   color: '#3fe56c' },
            }}
            transition={{ duration: 0.18 }}
          >
            {item.label}
          </motion.span>
        </motion.div>
      </Link>
    )
  }

  /* ── Renderizar grupo com filhos ── */
  const NavGroup = ({ item }: { item: NavItem }) => {
    const Icon        = item.icon
    const groupActive = isGroupActive(item)
    const isOpen      = openGroups[item.label] ?? false

    return (
      <div>
        <motion.button
          onClick={() => setOpenGroups(prev => ({ ...prev, [item.label]: !prev[item.label] }))}
          className="relative w-full flex items-center gap-3 px-4 py-3 rounded-lg overflow-hidden"
          style={{
            color:      groupActive ? '#3fe56c' : 'var(--text-3)',
            fontWeight: groupActive ? 700 : 400,
            borderLeft: groupActive && !isOpen ? '3px solid #00c853' : '3px solid transparent',
          }}
          whileHover="hover"
          initial="rest"
          animate="rest"
        >
          <motion.span
            className="absolute inset-0 rounded-lg pointer-events-none"
            variants={{
              rest:  { scaleX: groupActive && !isOpen ? 1 : 0, originX: 0, background: 'rgba(0,200,83,0.08)' },
              hover: { scaleX: 1, originX: 0, background: 'rgba(0,200,83,0.10)' },
            }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          />
          <motion.span
            className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full pointer-events-none"
            variants={{
              rest:  { height: groupActive && !isOpen ? '70%' : '0%', opacity: groupActive && !isOpen ? 1 : 0 },
              hover: { height: '70%', opacity: 1 },
            }}
            style={{ background: '#00c853' }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          />
          <motion.span
            className="relative z-10 flex-shrink-0"
            variants={{
              rest:  { scale: 1,    filter: 'drop-shadow(0 0 0px transparent)' },
              hover: { scale: 1.15, filter: 'drop-shadow(0 0 6px rgba(63,229,108,0.7))' },
            }}
            transition={{ duration: 0.18 }}
          >
            <Icon size={20} />
          </motion.span>
          <motion.span
            className="relative z-10 text-sm flex-1 text-left"
            variants={{
              rest:  { x: 0, color: groupActive ? '#3fe56c' : 'var(--text-3)' },
              hover: { x: 2, color: '#3fe56c' },
            }}
            transition={{ duration: 0.18 }}
          >
            {item.label}
          </motion.span>
          <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="relative z-10">
            <ChevronDown size={14} style={{ color: 'rgba(255,255,255,0.3)' }} />
          </motion.div>
        </motion.button>

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
                      <motion.div
                        className="relative flex items-center px-3 py-2 rounded-lg text-sm overflow-hidden"
                        style={{
                          color:      childActive ? '#3fe56c' : 'var(--text-3)',
                          fontWeight: childActive ? 700 : 400,
                        }}
                        whileHover="hover"
                        initial="rest"
                        animate="rest"
                      >
                        <motion.span
                          className="absolute inset-0 rounded-lg pointer-events-none"
                          variants={{
                            rest:  { scaleX: childActive ? 1 : 0, originX: 0, background: 'rgba(0,200,83,0.08)' },
                            hover: { scaleX: 1, originX: 0, background: 'rgba(0,200,83,0.10)' },
                          }}
                          transition={{ duration: 0.2 }}
                        />
                        <motion.span
                          className="relative z-10"
                          variants={{
                            rest:  { x: 0, color: childActive ? '#3fe56c' : 'var(--text-3)' },
                            hover: { x: 2, color: '#3fe56c' },
                          }}
                          transition={{ duration: 0.15 }}
                        >
                          {child.label}
                        </motion.span>
                      </motion.div>
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
              <p className="text-[11px] font-black leading-none tracking-widest" style={{ color: '#3fe56c' }}>
                CHRONOS <span style={{ color: '#C0392B' }}>LAB</span>
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
          <div className="px-6 pt-7 pb-6 flex-shrink-0 flex items-center justify-center">
            <div className="relative w-10 h-10">
              <Image src="/logo.svg" alt="Chronos" fill className="object-contain" />
            </div>
          </div>

          {/* ── Navegação ── */}
          <nav className="flex-1 px-3 space-y-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
            {NAV_ITEMS.map(item =>
              item.children
                ? <NavGroup key={item.label} item={item} />
                : <NavLink  key={item.href}  item={item} />
            )}
            <AdminNotificationBell />
          </nav>

          {/* ── Divisória ── */}
          <div className="mx-4 my-3" style={{ height: 1, background: 'rgba(0,200,83,0.10)' }} />

          {/* ── Usuário + Tema ── */}
          <div className="px-4 pb-2 flex-shrink-0">
            <div
              className="rounded-lg overflow-hidden"
              style={{ background: 'rgba(0,200,83,0.06)', border: '1px solid rgba(0,200,83,0.10)' }}
            >
              {/* linha do usuário — clicável para o perfil */}
              <Link href="/profile">
                <motion.div
                  className="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
                  whileHover="hover" initial="rest" animate="rest"
                  style={{ transition: 'background 0.15s' }}
                  variants={{ rest: { background: 'transparent' }, hover: { background: 'rgba(0,200,83,0.08)' } }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 relative"
                    style={{ background: 'linear-gradient(135deg,#f97316,#fbbf24)', boxShadow: '0 0 10px rgba(249,115,22,0.45)' }}
                  >
                    <Shield size={16} style={{ color: '#fff' }} />
                    <span className="absolute -top-0.5 -right-0.5 text-[9px] leading-none">👑</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold leading-none truncate" style={{ color: 'white' }}>
                      {fullName.split(' ')[0]}
                    </p>
                    <p className="text-[10px] mt-0.5 font-black" style={{ color: '#f97316' }}>ADMINISTRADOR</p>
                  </div>
                  <motion.span
                    variants={{ rest: { opacity: 0, x: -4 }, hover: { opacity: 1, x: 0 } }}
                    className="text-[9px] font-bold flex-shrink-0"
                    style={{ color: '#3fe56c' }}
                  >
                    Ver perfil
                  </motion.span>
                </motion.div>
              </Link>

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
        <>
          {/* Overlay escuro ao abrir o drawer */}
          <AnimatePresence>
            {profileOpen && (
              <motion.div
                key="overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40"
                style={{ background: 'rgba(0,0,0,0.55)' }}
                onClick={() => setProfileOpen(false)}
              />
            )}
          </AnimatePresence>

          {/* Mini drawer — perfil + sair */}
          <AnimatePresence>
            {profileOpen && (
              <motion.div
                key="drawer"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 380, damping: 36 }}
                className="fixed left-0 right-0 z-50 rounded-t-2xl overflow-hidden"
                style={{
                  bottom: 'calc(56px + env(safe-area-inset-bottom))',
                  background: 'var(--nav-bg)',
                  border: '1px solid rgba(0,200,83,0.20)',
                  borderBottom: 'none',
                }}
              >
                {/* Header do drawer */}
                <div className="flex items-center justify-between px-5 pt-4 pb-3" style={{ borderBottom: '1px solid rgba(0,200,83,0.12)' }}>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                      style={{ background: `${avatarColor(fullName)}22`, border: `1px solid ${avatarColor(fullName)}55`, color: avatarColor(fullName) }}
                    >
                      {initials}
                    </div>
                    <div>
                      <p className="text-sm font-bold leading-tight" style={{ color: 'white' }}>{fullName}</p>
                      <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>ADMIN</p>
                    </div>
                  </div>
                  <button onClick={() => setProfileOpen(false)} style={{ color: 'rgba(255,255,255,0.4)' }}>
                    <X size={18} />
                  </button>
                </div>

                {/* Opções */}
                <div className="p-3 space-y-1">
                  <Link
                    href="/admin/settings"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium"
                    style={{ color: 'var(--text-3)', background: 'rgba(255,255,255,0.04)' }}
                  >
                    <Settings size={18} style={{ color: 'var(--text-3)' }} />
                    Configurações
                  </Link>

                  <form action="/api/auth/signout" method="POST">
                    <button
                      type="submit"
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold"
                      style={{
                        color: '#ff5252',
                        background: 'rgba(255,82,82,0.08)',
                        border: '1px solid rgba(255,82,82,0.20)',
                      }}
                    >
                      <LogOut size={18} />
                      Sair da conta
                    </button>
                  </form>
                </div>

                {/* Espaço seguro */}
                <div style={{ height: 8 }} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Barra de navegação */}
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
                  <motion.div
                    whileTap={{ scale: 0.82 }}
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  >
                    <Icon size={20} style={{ color: active ? '#3fe56c' : 'var(--text-3)' }} />
                  </motion.div>
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

            {/* Avatar — abre o drawer */}
            <button
              onClick={() => setProfileOpen(v => !v)}
              className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 relative"
            >
              <motion.div
                whileTap={{ scale: 0.82 }}
                whileHover={{ scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px]"
                style={{
                  background: profileOpen ? `${avatarColor(fullName)}44` : `${avatarColor(fullName)}22`,
                  border: `1.5px solid ${profileOpen ? avatarColor(fullName) : `${avatarColor(fullName)}55`}`,
                  color: avatarColor(fullName),
                }}
              >
                {initials}
              </motion.div>
              <span className="text-[9px] font-bold leading-none" style={{ color: profileOpen ? '#4ade80' : 'rgba(255,255,255,0.4)' }}>
                Eu
              </span>
              {profileOpen && (
                <motion.div
                  layoutId="mobileActiveBar"
                  className="absolute top-0 left-1/2 -translate-x-1/2 rounded-b-full"
                  style={{ width: 24, height: 2, background: '#00c853' }}
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          </nav>
        </>
      )}
    </>
  )
}
