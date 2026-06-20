'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence, useAnimation } from 'framer-motion'
import { Bell, X, ArrowRight, CheckCircle2, AlertTriangle, Info, User, Shield } from 'lucide-react'
import Link from 'next/link'
import type { AdminNotification, NotificationType } from '@/app/api/admin/notifications/route'

// ── Type config ───────────────────────────────────────────────────────────────
const TYPE_CONFIG: Record<NotificationType, {
  label: string; color: string; bg: string; border: string; icon: React.ReactNode; glow: string
}> = {
  critical: {
    label: 'CRÍTICO',
    color: '#ff5252',
    bg:    'rgba(255,82,82,0.08)',
    border:'rgba(255,82,82,0.25)',
    glow:  'rgba(255,82,82,0.15)',
    icon:  <AlertTriangle size={14} />,
  },
  admin: {
    label: 'ADMIN',
    color: '#f97316',
    bg:    'rgba(249,115,22,0.08)',
    border:'rgba(249,115,22,0.25)',
    glow:  'rgba(249,115,22,0.12)',
    icon:  <Shield size={14} />,
  },
  intern: {
    label: 'ALUNO',
    color: '#22d3ee',
    bg:    'rgba(34,211,238,0.08)',
    border:'rgba(34,211,238,0.25)',
    glow:  'rgba(34,211,238,0.12)',
    icon:  <User size={14} />,
  },
  info: {
    label: 'INFO',
    color: '#94a3b8',
    bg:    'rgba(148,163,184,0.06)',
    border:'rgba(148,163,184,0.20)',
    glow:  'rgba(148,163,184,0.08)',
    icon:  <Info size={14} />,
  },
}

const TYPE_ORDER: NotificationType[] = ['critical', 'admin', 'intern', 'info']
const TYPE_LABELS: Record<NotificationType, string> = {
  critical: 'Crítico',
  admin:    'Admin',
  intern:   'Aluno',
  info:     'Info',
}

// ── Avatar ────────────────────────────────────────────────────────────────────
const COLORS = ['#3fe56c','#22d3ee','#a78bfa','#f97316','#fbbf24','#48e1a6']
function InternAvatar({ initials, name }: { initials: string; name: string }) {
  const color = COLORS[name.charCodeAt(0) % COLORS.length]
  return (
    <div
      className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base flex-shrink-0"
      style={{
        background: `${color}18`,
        border: `2px solid ${color}50`,
        color,
        boxShadow: `0 0 16px ${color}20`,
      }}
    >
      {initials}
    </div>
  )
}

// ── Notification Card ─────────────────────────────────────────────────────────
function NotificationCard({ n, index, onClose }: { n: AdminNotification; index: number; onClose: () => void }) {
  const cfg = TYPE_CONFIG[n.type]
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, height: 0, marginBottom: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="group"
    >
      <Link href={n.href} onClick={onClose}>
        <motion.div
          className="flex items-center gap-4 rounded-2xl p-4 cursor-pointer relative overflow-hidden"
          style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
          whileHover={{ scale: 1.01, x: 4, transition: { duration: 0.18 } }}
          whileTap={{ scale: 0.99 }}
        >
          {/* Left accent bar */}
          <motion.div
            className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
            style={{ background: cfg.color }}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: index * 0.05 + 0.1, duration: 0.3 }}
          />
          {/* Glow shimmer on hover */}
          <motion.div
            className="absolute inset-0 pointer-events-none rounded-2xl"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            style={{ background: `radial-gradient(ellipse at left, ${cfg.glow} 0%, transparent 70%)` }}
          />

          <div className="ml-1 flex-shrink-0">
            <InternAvatar initials={n.internInitials} name={n.internName} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-full"
                style={{ background: `${cfg.color}20`, border: `1px solid ${cfg.border}`, color: cfg.color }}>
                {cfg.icon} {cfg.label}
              </span>
              <span className="text-sm font-semibold truncate" style={{ color: 'rgba(255,255,255,0.55)' }}>
                {n.internName}
              </span>
            </div>
            <p className="text-base font-black leading-snug" style={{ color: 'rgba(255,255,255,0.92)' }}>
              {n.title}
            </p>
            <p className="text-sm mt-1 leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {n.description}
            </p>
          </div>

          <motion.div
            className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: cfg.color }}
          >
            <ArrowRight size={18} />
          </motion.div>
        </motion.div>
      </Link>
    </motion.div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.15, type: 'spring', stiffness: 240, damping: 20 }}
      className="flex flex-col items-center justify-center h-full gap-6 py-20"
    >
      <div className="relative">
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="relative"
        >
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{ background: 'radial-gradient(circle, rgba(63,229,108,0.25) 0%, transparent 70%)' }}
          />
          <div
            className="w-28 h-28 rounded-3xl flex items-center justify-center relative"
            style={{
              background: 'linear-gradient(135deg, rgba(63,229,108,0.15) 0%, rgba(63,229,108,0.05) 100%)',
              border: '2px solid rgba(63,229,108,0.3)',
              boxShadow: '0 0 40px rgba(63,229,108,0.15), inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
          >
            <CheckCircle2 size={48} style={{ color: '#3fe56c' }} />
          </div>
        </motion.div>
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              background: '#3fe56c',
              top: `${20 + i * 25}%`,
              left: i % 2 === 0 ? '-20px' : 'calc(100% + 12px)',
            }}
            animate={{ y: [0, -6, 0], opacity: [0.3, 0.7, 0.3], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 2 + i * 0.4, repeat: Infinity, delay: i * 0.3 }}
          />
        ))}
      </div>

      <div className="text-center space-y-2">
        <p className="text-2xl font-black" style={{ color: '#3fe56c' }}>Tudo em ordem!</p>
        <p className="text-base" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Nenhuma pendência identificada no momento.
        </p>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.22)' }}>
          O sistema atualiza automaticamente a cada 60s
        </p>
      </div>
    </motion.div>
  )
}

// ── Loading skeleton ──────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="space-y-3">
      {[...Array(4)].map((_, i) => (
        <motion.div key={i} className="h-24 rounded-2xl flex items-center gap-4 px-4"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.15 }}
        >
          <div className="w-12 h-12 rounded-2xl flex-shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <div className="flex-1 space-y-2">
            <div className="h-3 rounded-full w-1/3" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <div className="h-4 rounded-full w-2/3" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <div className="h-3 rounded-full w-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// ── Panel content (shared between desktop and mobile) ─────────────────────────
function PanelContent({
  loading, notifications, filter, setFilter, onClose, onRefresh,
}: {
  loading: boolean
  notifications: AdminNotification[]
  filter: NotificationType | 'all'
  setFilter: (f: NotificationType | 'all') => void
  onClose: () => void
  onRefresh: () => void
}) {
  const total       = notifications.length
  const hasCritical = notifications.some(n => n.type === 'critical')

  const countByType = {
    all:      total,
    critical: notifications.filter(n => n.type === 'critical').length,
    admin:    notifications.filter(n => n.type === 'admin').length,
    intern:   notifications.filter(n => n.type === 'intern').length,
    info:     notifications.filter(n => n.type === 'info').length,
  }

  const filtered = filter === 'all' ? notifications : notifications.filter(n => n.type === filter)

  return (
    <>
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-6 py-4 flex-shrink-0"
        style={{
          borderBottom: '1px solid rgba(0,200,83,0.15)',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.15))',
        }}
      >
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: [0, -10, 10, -6, 6, 0] }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Bell size={22} style={{ color: '#3fe56c' }} />
          </motion.div>
          <div>
            <p className="text-xl font-black" style={{ color: '#3fe56c' }}>Pendências</p>
            {total > 0 && (
              <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {total} {total === 1 ? 'item pendente' : 'itens pendentes'}
              </p>
            )}
          </div>
          {total > 0 && (
            <motion.span
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              className="text-sm font-black px-3 py-1 rounded-full"
              style={{
                background: hasCritical ? 'rgba(255,82,82,0.18)' : 'rgba(249,115,22,0.18)',
                color:      hasCritical ? '#ff5252' : '#f97316',
                border: `1px solid ${hasCritical ? 'rgba(255,82,82,0.3)' : 'rgba(249,115,22,0.3)'}`,
              }}>
              {hasCritical ? '⚠ Atenção' : '● Ativo'}
            </motion.span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            onClick={onRefresh}
            className="text-sm font-bold px-4 py-2 rounded-xl"
            style={{ color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)' }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
          >
            Atualizar
          </motion.button>
          <motion.button
            onClick={onClose}
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)' }}
            whileHover={{ scale: 1.08, background: 'rgba(255,82,82,0.12)', color: 'rgba(255,255,255,0.9)' }}
            whileTap={{ scale: 0.94 }}
          >
            <X size={18} />
          </motion.button>
        </div>
      </div>

      {/* ── Filter tabs ── */}
      {total > 0 && (
        <div
          className="flex gap-2 px-6 py-3 flex-shrink-0 overflow-x-auto"
          style={{ borderBottom: '1px solid rgba(0,200,83,0.08)', scrollbarWidth: 'none' }}
        >
          <motion.button
            onClick={() => setFilter('all')}
            className="flex-shrink-0 text-sm font-black px-4 py-2 rounded-xl"
            style={filter === 'all'
              ? { background: 'rgba(63,229,108,0.15)', color: '#3fe56c', border: '1px solid rgba(63,229,108,0.35)' }
              : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.45)', border: '1px solid transparent' }}
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          >
            Todos ({countByType.all})
          </motion.button>
          {TYPE_ORDER.map(t => {
            if (countByType[t] === 0) return null
            const cfg = TYPE_CONFIG[t]
            return (
              <motion.button
                key={t}
                onClick={() => setFilter(t)}
                className="flex-shrink-0 text-sm font-black px-4 py-2 rounded-xl flex items-center gap-1.5"
                style={filter === t
                  ? { background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }
                  : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.45)', border: '1px solid transparent' }}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              >
                {cfg.icon} {TYPE_LABELS[t]} ({countByType[t]})
              </motion.button>
            )
          })}
        </div>
      )}

      {/* ── List ── */}
      <div
        className="flex-1 overflow-y-auto px-6 py-4 space-y-3"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(63,229,108,0.2) transparent' }}
      >
        {loading ? <Skeleton /> : filtered.length === 0 ? <EmptyState /> : (
          <AnimatePresence mode="popLayout">
            {filtered.map((n, i) => (
              <NotificationCard key={n.id} n={n} index={i} onClose={onClose} />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* ── Footer ── */}
      {!loading && total > 0 && (
        <div className="px-6 py-3 flex-shrink-0"
          style={{ borderTop: '1px solid rgba(0,200,83,0.08)', background: 'rgba(0,0,0,0.15)' }}>
          <p className="text-sm text-center" style={{ color: 'rgba(255,255,255,0.22)' }}>
            Toque em uma pendência para resolver diretamente · Atualizado a cada 60s
          </p>
        </div>
      )}
    </>
  )
}

// ── Desktop Bell (sidebar) ────────────────────────────────────────────────────
export default function AdminNotificationBell() {
  const [open, setOpen]           = useState(false)
  const [notifications, setNotifications] = useState<AdminNotification[]>([])
  const [loading, setLoading]     = useState(false)
  const [filter, setFilter]       = useState<NotificationType | 'all'>('all')
  const bellControls              = useAnimation()
  const btnRef                    = useRef<HTMLButtonElement>(null)
  const panelRef                  = useRef<HTMLDivElement>(null)

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/notifications', { cache: 'no-store' })
      if (!res.ok) return
      const json = await res.json()
      setNotifications(json.notifications ?? [])
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 60_000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  useEffect(() => {
    if (notifications.length > 0) {
      bellControls.start({
        rotate: [0, -12, 12, -8, 8, -4, 4, 0],
        transition: { duration: 0.6, ease: 'easeInOut', delay: 0.5 },
      })
    }
  }, [notifications.length, bellControls])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        btnRef.current   && !btnRef.current.contains(e.target as Node)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const total       = notifications.length
  const hasCritical = notifications.some(n => n.type === 'critical')

  // Calcular posição do painel baseado no botão (evita sair da tela)
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({})
  useEffect(() => {
    if (!open || !btnRef.current) return
    const rect = btnRef.current.getBoundingClientRect()
    const panelW = 360
    const spaceRight = window.innerWidth - rect.right
    const spaceLeft  = rect.left

    let left: number
    let top: number = rect.top

    if (spaceRight >= panelW + 12) {
      // Abre para a direita da sidebar
      left = rect.right + 8
    } else if (spaceLeft >= panelW + 12) {
      // Abre para a esquerda
      left = rect.left - panelW - 8
    } else {
      // Centraliza na tela como fallback
      left = Math.max(8, (window.innerWidth - panelW) / 2)
    }

    // Garante que não sai embaixo
    const maxH = window.innerHeight - 80
    const maxTop = window.innerHeight - maxH - 8
    top = Math.min(top, maxTop)
    top = Math.max(8, top)

    setPanelStyle({ position: 'fixed', top, left, width: panelW, maxHeight: maxH })
  }, [open])

  return (
    <div className="relative">
      <motion.button
        ref={btnRef}
        onClick={() => { setOpen(o => !o); if (!open) fetchNotifications() }}
        className="relative flex items-center gap-2 w-full px-4 py-3 rounded-lg transition-colors"
        style={{
          color:      open ? '#3fe56c' : 'var(--text-3)',
          background: open ? 'rgba(63,229,108,0.08)' : 'transparent',
          borderLeft: open ? '3px solid #00c853' : '3px solid transparent',
        }}
        whileHover="hover"
        initial="rest"
        animate="rest"
      >
        <motion.span className="absolute inset-0 rounded-lg pointer-events-none"
          variants={{
            rest:  { scaleX: open ? 1 : 0, originX: 0, background: 'rgba(0,200,83,0.08)' },
            hover: { scaleX: 1, originX: 0, background: 'rgba(0,200,83,0.10)' },
          }}
          transition={{ duration: 0.22 }}
        />
        <motion.span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full pointer-events-none"
          variants={{
            rest:  { height: open ? '70%' : '0%', opacity: open ? 1 : 0 },
            hover: { height: '70%', opacity: 1 },
          }}
          style={{ background: '#00c853' }}
          transition={{ duration: 0.2 }}
        />

        <motion.span className="relative z-10 flex-shrink-0" animate={bellControls}
          variants={{
            rest:  { scale: 1,    filter: 'drop-shadow(0 0 0px transparent)' },
            hover: { scale: 1.15, filter: 'drop-shadow(0 0 6px rgba(63,229,108,0.7))' },
          }}
          transition={{ duration: 0.18 }}>
          <Bell size={20} />
        </motion.span>

        <motion.span className="relative z-10 text-sm flex-1 text-left"
          variants={{
            rest:  { x: 0, color: open ? '#3fe56c' : 'var(--text-3)' },
            hover: { x: 2, color: '#3fe56c' },
          }}
          transition={{ duration: 0.18 }}>
          Pendências
        </motion.span>

        {total > 0 && (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="relative z-10 flex items-center justify-center text-[9px] font-black rounded-full flex-shrink-0 min-w-[18px] h-[18px] px-1"
            style={{
              background: hasCritical ? '#ff5252' : '#f97316',
              color: 'white',
              boxShadow: hasCritical ? '0 0 8px rgba(255,82,82,0.5)' : '0 0 8px rgba(249,115,22,0.4)',
            }}>
            {total > 99 ? '99+' : total}
          </motion.span>
        )}
      </motion.button>

      {/* Modal tela cheia */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="overlay-desk"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[150]"
              style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              ref={panelRef}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{   opacity: 0, y: 24 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="fixed z-[160] flex flex-col"
              style={{ inset: 0, background: '#0b1d12' }}
            >
              <PanelContent
                loading={loading}
                notifications={notifications}
                filter={filter}
                setFilter={setFilter}
                onClose={() => setOpen(false)}
                onRefresh={fetchNotifications}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Mobile Bell (top bar) — abre drawer de baixo ──────────────────────────────
export function AdminNotificationBellMobile() {
  const [open, setOpen]           = useState(false)
  const [notifications, setNotifications] = useState<AdminNotification[]>([])
  const [loading, setLoading]     = useState(false)
  const [filter, setFilter]       = useState<NotificationType | 'all'>('all')
  const bellControls              = useAnimation()

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/notifications', { cache: 'no-store' })
      if (!res.ok) return
      const json = await res.json()
      setNotifications(json.notifications ?? [])
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 60_000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  useEffect(() => {
    if (notifications.length > 0) {
      bellControls.start({
        rotate: [0, -10, 10, -6, 6, 0],
        transition: { duration: 0.5, delay: 0.3 },
      })
    }
  }, [notifications.length, bellControls])

  const total       = notifications.length
  const hasCritical = notifications.some(n => n.type === 'critical')

  return (
    <>
      {/* Bell button */}
      <button
        onClick={() => { setOpen(true); if (!open) fetchNotifications() }}
        className="relative flex items-center justify-center w-9 h-9"
      >
        <motion.div animate={bellControls}>
          <Bell size={19} style={{
            color: total > 0 ? (hasCritical ? '#ff5252' : '#f97316') : 'rgba(255,255,255,0.5)',
          }} />
        </motion.div>
        {total > 0 && (
          <motion.span
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="absolute top-0.5 right-0.5 flex items-center justify-center text-[8px] font-black rounded-full min-w-[15px] h-[15px] px-0.5"
            style={{
              background: hasCritical ? '#ff5252' : '#f97316',
              color: 'white',
              boxShadow: `0 0 6px ${hasCritical ? 'rgba(255,82,82,0.6)' : 'rgba(249,115,22,0.5)'}`,
            }}>
            {total > 9 ? '9+' : total}
          </motion.span>
        )}
      </button>

      {/* Full-screen modal */}
      <AnimatePresence>
        {open && (
          <>
            {/* Overlay */}
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[150]"
              style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
              onClick={() => setOpen(false)}
            />

            {/* Modal tela cheia */}
            <motion.div
              key="modal"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="fixed z-[160] flex flex-col"
              style={{
                inset: 0,
                background: '#0b1d12',
                borderRadius: 0,
              }}
            >
              <PanelContent
                loading={loading}
                notifications={notifications}
                filter={filter}
                setFilter={setFilter}
                onClose={() => setOpen(false)}
                onRefresh={fetchNotifications}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
