'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home, BarChart2, Settings,
  MapPin, TrendingUp, LogOut, ChevronRight, Leaf,
  FolderOpen, ChevronDown
} from 'lucide-react'
import ThemeToggle from './ThemeToggle'

interface Props {
  fullName: string
  initials: string
  pending?: number
}

interface SubItem {
  href: string
  label: string
}

interface NavItem {
  href?: string
  label: string
  icon: React.ElementType
  end?: boolean
  badge?: boolean
  children?: SubItem[]
}

const NAV_ITEMS: NavItem[] = [
  { href: '/admin',            label: 'Início',      icon: Home,        end: true },
  {
    label: 'Cadastros',
    icon: FolderOpen,
    children: [
      { href: '/admin/interns', label: 'Estagiários' },
    ],
  },
  { href: '/admin/location',  label: 'Localização', icon: MapPin },
  { href: '/admin/workload',  label: 'Carga',       icon: TrendingUp },
  { href: '/admin/reports',   label: 'Relatórios',  icon: BarChart2 },
  { href: '/admin/settings',  label: 'Config',      icon: Settings },
]

// 5 items for mobile bottom nav
const MOBILE_NAV = [
  { href: '/admin',            label: 'Início',      icon: Home,        end: true },
  { href: '/admin/interns',   label: 'Cadastros',   icon: FolderOpen },
  { href: '/admin/workload',  label: 'Carga',       icon: TrendingUp },
  { href: '/admin/reports',   label: 'Relatórios',  icon: BarChart2 },
  { href: '/admin/settings',  label: 'Config',      icon: Settings },
]

const avatarColors = ['#3b82f6','#8b5cf6','#ec4899','#10b981','#f59e0b','#06b6d4']
const getAvatarColor = (name: string) => avatarColors[name.charCodeAt(0) % avatarColors.length]

export default function AdminSidebar({ fullName, initials, pending }: Props) {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState(true)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  // Track which parent menu groups are open (by label)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ Cadastros: true })

  useEffect(() => {
    setMounted(true)
    const check = () => setIsDesktop(window.innerWidth >= 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Auto-open group if a child route is active
  useEffect(() => {
    NAV_ITEMS.forEach(item => {
      if (item.children) {
        const childActive = item.children.some(c => pathname.startsWith(c.href))
        if (childActive) {
          setOpenGroups(prev => ({ ...prev, [item.label]: true }))
        }
      }
    })
  }, [pathname])

  const isActive = (href: string, end?: boolean) => {
    if (end) return pathname === href
    return pathname.startsWith(href)
  }

  const isGroupActive = (item: NavItem) => {
    if (!item.children) return false
    return item.children.some(c => pathname.startsWith(c.href))
  }

  const SIDEBAR_W_EXPANDED = 220
  const SIDEBAR_W_COLLAPSED = 64

  if (!mounted) return null

  // Render a standard nav item (no children)
  const renderNavItem = (item: NavItem) => {
    if (!item.href) return null
    const active = isActive(item.href, item.end)
    const Icon = item.icon
    const showBadge = item.badge && (pending ?? 0) > 0

    return (
      <div key={item.href} className="relative">
        <Link
          href={item.href}
          onMouseEnter={() => setHoveredItem(item.href!)}
          onMouseLeave={() => setHoveredItem(null)}
        >
          <motion.div
            whileHover={{ x: expanded ? 3 : 0, scale: expanded ? 1 : 1.08 }}
            whileTap={{ scale: 0.96 }}
            className="relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors"
            style={{
              background: active
                ? 'linear-gradient(135deg, rgba(74,222,128,0.15), rgba(14,165,233,0.08))'
                : hoveredItem === item.href
                ? 'rgba(255,255,255,0.06)'
                : 'transparent',
              border: active ? '1px solid rgba(74,222,128,0.2)' : '1px solid transparent',
            }}
          >
            {active && (
              <motion.div
                layoutId="activeIndicator"
                className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r-full"
                style={{ width: 3, height: 22, background: '#4ade80' }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <div className="relative flex-shrink-0">
              <motion.div animate={active ? { color: '#4ade80' } : { color: 'rgba(255,255,255,0.45)' }}>
                <Icon size={17} />
              </motion.div>
              {active && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute inset-0 rounded-full blur-sm"
                  style={{ background: 'rgba(74,222,128,0.3)', zIndex: -1 }}
                />
              )}
              {showBadge && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 text-[9px] font-black rounded-full flex items-center justify-center"
                  style={{ background: '#ef4444', color: 'white' }}
                >
                  {pending}
                </motion.span>
              )}
            </div>
            <AnimatePresence>
              {expanded && (
                <motion.span
                  initial={{ opacity: 0, x: -8, width: 0 }}
                  animate={{ opacity: 1, x: 0, width: 'auto' }}
                  exit={{ opacity: 0, x: -8, width: 0 }}
                  transition={{ duration: 0.16 }}
                  className="text-[11px] font-bold whitespace-nowrap overflow-hidden"
                  style={{ color: active ? 'white' : 'rgba(255,255,255,0.5)' }}
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>
        </Link>

        {/* Tooltip collapsed */}
        {!expanded && hoveredItem === item.href && (
          <motion.div
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap pointer-events-none z-50"
            style={{
              background: 'var(--surface)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            }}
          >
            {item.label}
            {showBadge && (
              <span className="ml-1.5 px-1 py-0.5 rounded-full text-[9px]" style={{ background: '#ef4444', color: 'white' }}>
                {pending}
              </span>
            )}
            <div
              className="absolute right-full top-1/2 -translate-y-1/2"
              style={{
                width: 0, height: 0,
                borderTop: '5px solid transparent',
                borderBottom: '5px solid transparent',
                borderRight: '5px solid var(--border)',
              }}
            />
          </motion.div>
        )}
      </div>
    )
  }

  // Render a group item (with children / submenu)
  const renderGroupItem = (item: NavItem) => {
    const Icon = item.icon
    const groupActive = isGroupActive(item)
    const isOpen = openGroups[item.label] ?? false

    const toggleGroup = () => {
      if (!expanded) {
        // When sidebar is collapsed, expand it first then open group
        setExpanded(true)
        setOpenGroups(prev => ({ ...prev, [item.label]: true }))
      } else {
        setOpenGroups(prev => ({ ...prev, [item.label]: !prev[item.label] }))
      }
    }

    return (
      <div key={item.label}>
        {/* Parent button */}
        <motion.button
          onClick={toggleGroup}
          onMouseEnter={() => setHoveredItem(item.label)}
          onMouseLeave={() => setHoveredItem(null)}
          whileHover={{ x: expanded ? 3 : 0, scale: expanded ? 1 : 1.08 }}
          whileTap={{ scale: 0.96 }}
          className="w-full relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors"
          style={{
            background: groupActive && !isOpen
              ? 'linear-gradient(135deg, rgba(74,222,128,0.15), rgba(14,165,233,0.08))'
              : hoveredItem === item.label
              ? 'rgba(255,255,255,0.06)'
              : 'transparent',
            border: groupActive && !isOpen ? '1px solid rgba(74,222,128,0.2)' : '1px solid transparent',
          }}
        >
          {groupActive && !isOpen && (
            <motion.div
              layoutId="activeIndicator"
              className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r-full"
              style={{ width: 3, height: 22, background: '#4ade80' }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            />
          )}
          <div className="relative flex-shrink-0">
            <motion.div animate={groupActive ? { color: '#4ade80' } : { color: 'rgba(255,255,255,0.45)' }}>
              <Icon size={17} />
            </motion.div>
          </div>
          <AnimatePresence>
            {expanded && (
              <motion.span
                initial={{ opacity: 0, x: -8, width: 0 }}
                animate={{ opacity: 1, x: 0, width: 'auto' }}
                exit={{ opacity: 0, x: -8, width: 0 }}
                transition={{ duration: 0.16 }}
                className="flex-1 text-left text-[11px] font-bold whitespace-nowrap overflow-hidden"
                style={{ color: groupActive ? 'white' : 'rgba(255,255,255,0.5)' }}
              >
                {item.label.toUpperCase()}
              </motion.span>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, rotate: isOpen ? 180 : 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex-shrink-0"
              >
                <ChevronDown size={12} style={{ color: 'rgba(255,255,255,0.35)' }} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Tooltip for collapsed sidebar */}
        {!expanded && hoveredItem === item.label && (
          <motion.div
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap pointer-events-none z-50"
            style={{
              background: 'var(--surface)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            }}
          >
            {item.label.toUpperCase()}
            <div
              className="absolute right-full top-1/2 -translate-y-1/2"
              style={{
                width: 0, height: 0,
                borderTop: '5px solid transparent',
                borderBottom: '5px solid transparent',
                borderRight: '5px solid var(--border)',
              }}
            />
          </motion.div>
        )}

        {/* Submenu children */}
        <AnimatePresence initial={false}>
          {isOpen && expanded && item.children && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              style={{ overflow: 'hidden' }}
            >
              <div className="ml-4 pl-3 mt-0.5 space-y-0.5" style={{ borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
                {item.children.map(child => {
                  const childActive = pathname.startsWith(child.href)
                  return (
                    <Link key={child.href} href={child.href}>
                      <motion.div
                        whileHover={{ x: 3 }}
                        whileTap={{ scale: 0.97 }}
                        className="relative flex items-center gap-2 rounded-lg px-3 py-2"
                        style={{
                          background: childActive
                            ? 'linear-gradient(135deg, rgba(74,222,128,0.12), rgba(14,165,233,0.06))'
                            : 'transparent',
                          border: childActive ? '1px solid rgba(74,222,128,0.15)' : '1px solid transparent',
                        }}
                      >
                        {childActive && (
                          <motion.div
                            layoutId="activeIndicator"
                            className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r-full"
                            style={{ width: 2, height: 16, background: '#4ade80' }}
                            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                          />
                        )}
                        <span
                          className="text-[11px] font-bold whitespace-nowrap"
                          style={{ color: childActive ? '#4ade80' : 'rgba(255,255,255,0.45)' }}
                        >
                          {child.label.toUpperCase()}
                        </span>
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
          MOBILE: Top bar (mobile only)
          ════════════════════════════════════════════ */}
      {!isDesktop && (
        <div
          className="flex items-center justify-between px-4 flex-shrink-0 z-40"
          style={{
            height: 52,
            background: 'var(--nav-bg)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div className="flex items-center gap-2">
            <div className="relative w-7 h-7 flex-shrink-0">
              <Image src="/logo.svg" alt="Chronos" fill className="object-contain" />
            </div>
            <div>
              <p className="text-[10px] font-black leading-none tracking-widest" style={{ color: 'white' }}>
                CHRONOS <span style={{ color: '#4ade80' }}>LAB</span>
              </p>
              <p className="text-[8px] leading-none" style={{ color: 'rgba(255,255,255,0.35)' }}>
                CONTROLE DE PONTO
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle compact />
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════
          DESKTOP: Left sidebar (desktop only)
          ════════════════════════════════════════════ */}
      {isDesktop && (
        <motion.aside
          animate={{ width: expanded ? SIDEBAR_W_EXPANDED : SIDEBAR_W_COLLAPSED }}
          transition={{ type: 'spring', stiffness: 280, damping: 28 }}
          className="relative flex flex-col flex-shrink-0 z-40"
          style={{
            height: '100dvh',
            background: 'var(--nav-bg)',
            borderRight: '1px solid rgba(255,255,255,0.06)',
            overflow: 'hidden',
          }}
        >
          {/* Glow decorativo */}
          <div
            className="absolute pointer-events-none"
            style={{
              top: -80, left: -80, width: 240, height: 240,
              background: 'radial-gradient(circle, rgba(30,92,45,0.18) 0%, transparent 70%)',
              borderRadius: '50%',
            }}
          />
          <div
            className="absolute pointer-events-none"
            style={{
              bottom: 40, right: -60, width: 180, height: 180,
              background: 'radial-gradient(circle, rgba(14,165,233,0.08) 0%, transparent 70%)',
              borderRadius: '50%',
            }}
          />

          {/* ── Logo ─────────────────────────── */}
          <div
            className="flex items-center gap-3 px-4 flex-shrink-0"
            style={{ height: 64, borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <motion.div
              whileHover={{ rotate: [0, -8, 8, 0] }}
              transition={{ duration: 0.5 }}
              className="flex-shrink-0"
            >
              <div className="relative w-8 h-8">
                <Image src="/logo.svg" alt="Chronos" fill className="object-contain" />
              </div>
            </motion.div>

            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.18 }}
                  className="overflow-hidden"
                >
                  <p className="text-[11px] font-black leading-none tracking-widest whitespace-nowrap" style={{ color: 'white' }}>
                    CHRONOS <span style={{ color: '#4ade80' }}>LAB</span>
                  </p>
                  <p className="text-[9px] leading-none mt-0.5 whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    CONTROLE DE PONTO
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              onClick={() => setExpanded(v => !v)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.92 }}
              className="ml-auto flex-shrink-0 rounded-lg p-1 transition-colors"
              style={{ color: 'rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.05)' }}
            >
              <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.25 }}>
                <ChevronRight size={14} />
              </motion.div>
            </motion.button>
          </div>

          {/* ── Nav items ─────────────────────── */}
          <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
            {NAV_ITEMS.map((item) =>
              item.children
                ? renderGroupItem(item)
                : renderNavItem(item)
            )}
          </nav>

          {/* ── Divider ─────────────────────── */}
          <div className="mx-3 mb-2" style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

          {/* ── Bottom: user + actions ─────────── */}
          <div className="px-2 pb-4 space-y-1 flex-shrink-0">
            <div className="flex items-center gap-1 px-2 py-1">
              <ThemeToggle compact />
            </div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 cursor-default"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black flex-shrink-0"
                style={{ background: getAvatarColor(fullName), color: 'white', minWidth: 28 }}
              >
                {initials}
              </div>
              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.15 }}
                    className="min-w-0 flex-1"
                  >
                    <p className="text-[10px] font-bold leading-none truncate" style={{ color: 'white' }}>
                      {fullName.split(' ')[0]}
                    </p>
                    <p className="text-[9px] leading-none mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>ADMIN</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <form action="/api/auth/signout" method="POST">
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02, background: 'rgba(239,68,68,0.12)' }}
                whileTap={{ scale: 0.97 }}
                className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 transition-colors"
                style={{ color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <LogOut size={15} className="flex-shrink-0" />
                <AnimatePresence>
                  {expanded && (
                    <motion.span
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.15 }}
                      className="text-[10px] font-bold whitespace-nowrap"
                    >
                      SAIR
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </form>
          </div>

          <motion.div
            animate={{ rotate: [0, 5, -5, 0], opacity: [0.08, 0.14, 0.08] }}
            transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
            className="absolute bottom-20 right-2 pointer-events-none"
          >
            <Leaf size={28} style={{ color: '#4ade80' }} />
          </motion.div>
        </motion.aside>
      )}

      {/* ════════════════════════════════════════════
          MOBILE: Bottom nav bar (mobile only)
          ════════════════════════════════════════════ */}
      {!isDesktop && (
        <nav
          className="fixed bottom-0 left-0 right-0 z-50 flex"
          style={{
            background: 'var(--nav-bg)',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
          {MOBILE_NAV.map((item) => {
            const active = isActive(item.href, item.end)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 relative"
              >
                <div className="relative">
                  <Icon
                    size={20}
                    style={{ color: active ? '#4ade80' : 'rgba(255,255,255,0.4)' }}
                  />
                </div>
                <span
                  className="text-[9px] font-bold leading-none"
                  style={{ color: active ? '#4ade80' : 'rgba(255,255,255,0.4)' }}
                >
                  {item.label}
                </span>
                {active && (
                  <motion.div
                    layoutId="mobileActiveBar"
                    className="absolute top-0 left-1/2 -translate-x-1/2 rounded-b-full"
                    style={{ width: 24, height: 2, background: '#4ade80' }}
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
