'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence, useAnimation } from 'framer-motion'
import { Bell, X, ArrowRight, CheckCircle2, AlertTriangle, UserPen, MessageSquareReply, Trophy } from 'lucide-react'
import Link from 'next/link'
import type { InternNotification, InternNotificationType } from '@/app/api/intern/notifications/route'

const SEEN_KEY = 'intern_notifs_seen_v1'

// ── Type config ───────────────────────────────────────────────────────────────
const TYPE_CONFIG: Record<InternNotificationType, {
  label: string; color: string; bg: string; border: string; icon: React.ReactNode
}> = {
  alert: {
    label: 'AÇÃO URGENTE', color: '#ff5252',
    bg: 'rgba(255,82,82,0.08)', border: 'rgba(255,82,82,0.25)',
    icon: <AlertTriangle size={14} />,
  },
  action: {
    label: 'CADASTRO', color: '#f97316',
    bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.25)',
    icon: <UserPen size={14} />,
  },
  feedback: {
    label: 'FEEDBACK', color: '#22d3ee',
    bg: 'rgba(34,211,238,0.08)', border: 'rgba(34,211,238,0.25)',
    icon: <MessageSquareReply size={14} />,
  },
  achievement: {
    label: 'CONQUISTA', color: '#3fe56c',
    bg: 'rgba(63,229,108,0.08)', border: 'rgba(63,229,108,0.25)',
    icon: <Trophy size={14} />,
  },
}

// ── localStorage de "vistas" ──────────────────────────────────────────────────
function readSeen(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) ?? '[]')) }
  catch { return new Set() }
}
function writeSeen(ids: string[]) {
  try { localStorage.setItem(SEEN_KEY, JSON.stringify(ids)) } catch { /* ignore */ }
}

// ── Card ──────────────────────────────────────────────────────────────────────
function NotificationCard({ n, index, onClose }: { n: InternNotification; index: number; onClose: () => void }) {
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
          className="flex items-start gap-3 rounded-2xl p-4 cursor-pointer relative overflow-hidden"
          style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
          whileHover={{ scale: 1.01, x: 4, transition: { duration: 0.18 } }}
          whileTap={{ scale: 0.99 }}
        >
          <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: cfg.color }} />
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ml-1"
            style={{ background: `${cfg.color}18`, border: `1px solid ${cfg.border}`, color: cfg.color }}
          >
            {cfg.icon}
          </div>
          <div className="flex-1 min-w-0">
            <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full mb-1"
              style={{ background: `${cfg.color}20`, border: `1px solid ${cfg.border}`, color: cfg.color }}>
              {cfg.label}
            </span>
            <p className="text-[15px] font-black leading-snug" style={{ color: 'rgba(255,255,255,0.92)' }}>
              {n.title}
            </p>
            <p className="text-[13px] mt-1 leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {n.description}
            </p>
          </div>
          <div className="flex-shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: cfg.color }}>
            <ArrowRight size={18} />
          </div>
        </motion.div>
      </Link>
    </motion.div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.1, type: 'spring', stiffness: 240, damping: 20 }}
      className="flex flex-col items-center justify-center gap-5 py-20 text-center"
    >
      <div className="w-24 h-24 rounded-3xl flex items-center justify-center"
        style={{ background: 'rgba(63,229,108,0.12)', border: '2px solid rgba(63,229,108,0.3)' }}>
        <CheckCircle2 size={44} style={{ color: '#3fe56c' }} />
      </div>
      <div className="space-y-1.5">
        <p className="text-xl font-black" style={{ color: '#3fe56c' }}>Tudo em dia!</p>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Você não tem nenhuma notificação no momento.
        </p>
      </div>
    </motion.div>
  )
}

function Skeleton() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <motion.div key={i} className="h-20 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  )
}

// ── Bell + painel (mobile, full-screen de baixo) ──────────────────────────────
export default function InternNotificationBell() {
  const [open, setOpen]             = useState(false)
  const [items, setItems]           = useState<InternNotification[]>([])
  const [loading, setLoading]       = useState(false)
  const [seen, setSeen]             = useState<Set<string>>(() => readSeen())
  const bellControls                = useAnimation()

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/intern/notifications', { cache: 'no-store' })
      if (!res.ok) return
      const json = await res.json()
      setItems(json.notifications ?? [])
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    queueMicrotask(() => { void fetchItems() })
    const interval = setInterval(fetchItems, 60_000)
    return () => clearInterval(interval)
  }, [fetchItems])

  // Badge = pendências persistentes (sempre) + eventos ainda não vistos
  const unread = useMemo(() => items.filter(n => n.persistent || !seen.has(n.id)).length, [items, seen])
  const hasUrgent = useMemo(() => items.some(n => n.type === 'alert'), [items])

  useEffect(() => {
    if (unread > 0) {
      bellControls.start({ rotate: [0, -10, 10, -6, 6, 0], transition: { duration: 0.5, delay: 0.3 } })
    }
  }, [unread, bellControls])

  const handleOpen = () => {
    setOpen(true)
    void fetchItems()
    // marca todos os IDs atuais como vistos (zera o badge dos eventos)
    const ids = items.map(n => n.id)
    const merged = Array.from(new Set([...readSeen(), ...ids]))
    writeSeen(merged)
    setSeen(new Set(merged))
  }

  const total = items.length

  return (
    <>
      <button
        onClick={handleOpen}
        aria-label="Notificações"
        className="relative flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0"
        style={{ border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)' }}
      >
        <motion.div animate={bellControls}>
          <Bell size={17} style={{ color: unread > 0 ? (hasUrgent ? '#ff5252' : '#3fe56c') : 'rgba(255,255,255,0.6)' }} />
        </motion.div>
        {unread > 0 && (
          <motion.span
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 flex items-center justify-center text-[8px] font-black rounded-full min-w-[15px] h-[15px] px-0.5"
            style={{
              background: hasUrgent ? '#ff5252' : '#f97316', color: 'white',
              boxShadow: `0 0 6px ${hasUrgent ? 'rgba(255,82,82,0.6)' : 'rgba(249,115,22,0.5)'}`,
            }}>
            {unread > 9 ? '9+' : unread}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="intern-notif-overlay"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[150]"
              style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              key="intern-notif-modal"
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              className="fixed z-[160] flex flex-col"
              style={{ inset: 0, background: '#0b1d12' }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-5 py-4 flex-shrink-0"
                style={{ borderBottom: '1px solid rgba(0,200,83,0.15)', paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
              >
                <div className="flex items-center gap-3">
                  <motion.div animate={{ rotate: [0, -10, 10, -6, 6, 0] }} transition={{ duration: 0.6, delay: 0.2 }}>
                    <Bell size={22} style={{ color: '#3fe56c' }} />
                  </motion.div>
                  <div>
                    <p className="text-lg font-black" style={{ color: '#3fe56c' }}>Notificações</p>
                    {total > 0 && (
                      <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        {total} {total === 1 ? 'item' : 'itens'}
                      </p>
                    )}
                  </div>
                </div>
                <motion.button
                  onClick={() => setOpen(false)}
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)' }}
                  whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
                >
                  <X size={18} />
                </motion.button>
              </div>

              {/* Lista */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3"
                style={{ scrollbarWidth: 'thin', paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
                {loading && items.length === 0
                  ? <Skeleton />
                  : items.length === 0
                    ? <EmptyState />
                    : (
                      <AnimatePresence mode="popLayout">
                        {items.map((n, i) => (
                          <NotificationCard key={n.id} n={n} index={i} onClose={() => setOpen(false)} />
                        ))}
                      </AnimatePresence>
                    )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
