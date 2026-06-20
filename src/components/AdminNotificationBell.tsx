'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence, useAnimation } from 'framer-motion'
import { Bell, X, ArrowRight, CheckCircle2, AlertTriangle, Info, User, Shield } from 'lucide-react'
import Link from 'next/link'
import type { AdminNotification, NotificationType } from '@/app/api/admin/notifications/route'

// ── Type config ───────────────────────────────────────────────────────────────
const TYPE_CONFIG: Record<NotificationType, {
  label: string; color: string; bg: string; border: string; icon: React.ReactNode
}> = {
  critical: {
    label: 'CRÍTICO',
    color: '#ff5252',
    bg:    'rgba(255,82,82,0.08)',
    border:'rgba(255,82,82,0.25)',
    icon:  <AlertTriangle size={11} />,
  },
  admin: {
    label: 'ADMIN',
    color: '#f97316',
    bg:    'rgba(249,115,22,0.08)',
    border:'rgba(249,115,22,0.25)',
    icon:  <Shield size={11} />,
  },
  intern: {
    label: 'ALUNO',
    color: '#22d3ee',
    bg:    'rgba(34,211,238,0.08)',
    border:'rgba(34,211,238,0.25)',
    icon:  <User size={11} />,
  },
  info: {
    label: 'INFO',
    color: '#94a3b8',
    bg:    'rgba(148,163,184,0.06)',
    border:'rgba(148,163,184,0.20)',
    icon:  <Info size={11} />,
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
      className="w-8 h-8 rounded-full flex items-center justify-center font-black text-[10px] flex-shrink-0"
      style={{ background: `${color}22`, border: `1.5px solid ${color}55`, color }}
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
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12, height: 0, marginBottom: 0 }}
      transition={{ delay: index * 0.04, duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="group relative"
    >
      <Link href={n.href} onClick={onClose}>
        <motion.div
          className="flex items-start gap-3 rounded-xl p-3 cursor-pointer relative overflow-hidden"
          style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
          whileHover={{ x: 3, transition: { duration: 0.15 } }}
        >
          {/* Left border accent */}
          <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl" style={{ background: cfg.color }} />

          <div className="ml-1 flex-shrink-0 mt-0.5">
            <InternAvatar initials={n.internInitials} name={n.internName} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
              <span className="flex items-center gap-0.5 text-[8px] font-black px-1.5 py-0.5 rounded-full"
                style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}>
                {cfg.icon} {cfg.label}
              </span>
              <span className="text-[10px] font-bold truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {n.internName}
              </span>
            </div>
            <p className="text-[11px] font-black leading-tight" style={{ color: 'rgba(255,255,255,0.88)' }}>
              {n.title}
            </p>
            <p className="text-[10px] mt-0.5 leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {n.description}
            </p>
          </div>

          <motion.div
            className="flex-shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: cfg.color }}
          >
            <ArrowRight size={13} />
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
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.1, type: 'spring', stiffness: 280, damping: 22 }}
      className="flex flex-col items-center justify-center py-10 gap-3 relative"
    >
      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="relative"
      >
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(63,229,108,0.1)', border: '1px solid rgba(63,229,108,0.2)', color: '#3fe56c' }}>
          <CheckCircle2 size={28} />
        </div>
        <div className="absolute inset-0 rounded-2xl blur-xl pointer-events-none"
          style={{ background: 'rgba(63,229,108,0.12)' }} />
      </motion.div>

      <div className="text-center">
        <p className="text-sm font-black" style={{ color: '#3fe56c' }}>Tudo em ordem!</p>
        <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Nenhuma pendência identificada.
        </p>
      </div>
    </motion.div>
  )
}

// ── Loading skeleton ──────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="space-y-2">
      {[...Array(3)].map((_, i) => (
        <motion.div key={i} className="h-16 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.04)' }}
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.2 }}
        />
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
  const total      = notifications.length
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
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(0,200,83,0.12)', background: 'rgba(0,0,0,0.2)' }}>
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: [0, -8, 8, -4, 4, 0] }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Bell size={14} style={{ color: '#3fe56c' }} />
          </motion.div>
          <p className="text-sm font-black" style={{ color: '#3fe56c' }}>Pendências</p>
          {total > 0 && (
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
              style={{
                background: hasCritical ? 'rgba(255,82,82,0.15)' : 'rgba(249,115,22,0.15)',
                color:      hasCritical ? '#ff5252' : '#f97316',
              }}>
              {total} {total === 1 ? 'item' : 'itens'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onRefresh}
            className="text-[10px] font-bold px-2 py-1 rounded-lg transition-opacity hover:opacity-70"
            style={{ color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.08)' }}>
            Atualizar
          </button>
          <button onClick={onClose} className="hover:opacity-70 transition-opacity"
            style={{ color: 'rgba(255,255,255,0.35)' }}>
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      {total > 0 && (
        <div className="flex gap-1 px-3 py-2 flex-shrink-0 overflow-x-auto"
          style={{ borderBottom: '1px solid rgba(0,200,83,0.08)', scrollbarWidth: 'none' }}>
          <button onClick={() => setFilter('all')}
            className="flex-shrink-0 text-[9px] font-black px-2 py-1 rounded-lg transition-all"
            style={filter === 'all'
              ? { background: 'rgba(63,229,108,0.15)', color: '#3fe56c', border: '1px solid rgba(63,229,108,0.3)' }
              : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', border: '1px solid transparent' }}>
            Todos ({countByType.all})
          </button>
          {TYPE_ORDER.map(t => {
            if (countByType[t] === 0) return null
            const cfg = TYPE_CONFIG[t]
            return (
              <button key={t} onClick={() => setFilter(t)}
                className="flex-shrink-0 text-[9px] font-black px-2 py-1 rounded-lg transition-all"
                style={filter === t
                  ? { background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }
                  : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', border: '1px solid transparent' }}>
                {TYPE_LABELS[t]} ({countByType[t]})
              </button>
            )
          })}
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(63,229,108,0.2) transparent' }}>
        {loading ? <Skeleton /> : filtered.length === 0 ? <EmptyState /> : (
          <AnimatePresence mode="popLayout">
            {filtered.map((n, i) => (
              <NotificationCard key={n.id} n={n} index={i} onClose={onClose} />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Footer */}
      {!loading && total > 0 && (
        <div className="px-4 py-2.5 flex-shrink-0"
          style={{ borderTop: '1px solid rgba(0,200,83,0.08)', background: 'rgba(0,0,0,0.1)' }}>
          <p className="text-[9px] text-center" style={{ color: 'rgba(255,255,255,0.2)' }}>
            Clique em uma pendência para resolver diretamente · Atualizado a cada 60s
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
