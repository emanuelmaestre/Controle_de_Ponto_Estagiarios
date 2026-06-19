'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, AlertTriangle, Shield, User, Info, ArrowRight, RefreshCw, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import type { AdminNotification, NotificationType } from '@/app/api/admin/notifications/route'

const TYPE_CONFIG: Record<NotificationType, {
  label: string; color: string; bg: string; border: string; icon: React.ReactNode
}> = {
  critical: { label: 'Crítico',        color: '#ff5252', bg: 'rgba(255,82,82,0.08)',    border: 'rgba(255,82,82,0.25)',    icon: <AlertTriangle size={13} /> },
  admin:    { label: 'Administrador',   color: '#f97316', bg: 'rgba(249,115,22,0.08)',   border: 'rgba(249,115,22,0.25)',   icon: <Shield size={13} /> },
  intern:   { label: 'Aluno',          color: '#22d3ee', bg: 'rgba(34,211,238,0.08)',   border: 'rgba(34,211,238,0.25)',   icon: <User size={13} /> },
  info:     { label: 'Informativo',    color: '#94a3b8', bg: 'rgba(148,163,184,0.06)',  border: 'rgba(148,163,184,0.20)',  icon: <Info size={13} /> },
}

const TYPE_ORDER: NotificationType[] = ['critical', 'admin', 'intern', 'info']

const COLORS = ['#3fe56c','#22d3ee','#a78bfa','#f97316','#fbbf24','#48e1a6']
function avatar(name: string) {
  const color = COLORS[name.charCodeAt(0) % COLORS.length]
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('')
  return { color, initials }
}

export default function UpdatesPage() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([])
  const [loading, setLoading]  = useState(true)
  const [filter, setFilter]    = useState<NotificationType | 'all'>('all')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetch_ = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/admin/notifications', { cache: 'no-store' })
      const json = await res.json()
      setNotifications(json.notifications ?? [])
      setLastUpdated(new Date())
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetch_() }, [fetch_])

  const total = notifications.length
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
    <div className="flex flex-col flex-1 min-h-0" style={{ background: 'var(--bg)' }}>

      {/* ── Header ── */}
      <header className="flex items-center justify-between px-4 sm:px-6 h-14 sm:h-16 flex-shrink-0"
        style={{ background: 'var(--bg)', borderBottom: '1px solid rgba(0,200,83,0.15)' }}>
        <div className="flex items-center gap-3">
          <Bell size={20} style={{ color: '#3fe56c' }} />
          <h2 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>Atualizações</h2>
          {total > 0 && (
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
              style={{
                background: hasCritical ? 'rgba(255,82,82,0.12)' : 'rgba(249,115,22,0.12)',
                color:      hasCritical ? '#ff5252' : '#f97316',
                border:     `1px solid ${hasCritical ? 'rgba(255,82,82,0.3)' : 'rgba(249,115,22,0.3)'}`,
              }}>
              {total} {total === 1 ? 'pendência' : 'pendências'}
            </span>
          )}
        </div>

        <button onClick={fetch_} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-opacity disabled:opacity-40 hover:opacity-70"
          style={{ color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          Atualizar
        </button>
      </header>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div style={{ maxWidth: 860, margin: '0 auto' }}>

          {/* Last updated */}
          {lastUpdated && (
            <p className="text-[10px] mb-4" style={{ color: 'rgba(255,255,255,0.2)' }}>
              Última verificação: {lastUpdated.toLocaleTimeString('pt-BR')} · Clique em uma pendência para resolver diretamente
            </p>
          )}

          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {TYPE_ORDER.map((t, i) => {
              const cfg = TYPE_CONFIG[t]
              return (
                <motion.button key={t}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.3, ease: [0.16,1,0.3,1] }}
                  onClick={() => setFilter(filter === t ? 'all' : t)}
                  className="flex flex-col gap-1 p-3 rounded-xl text-left transition-all"
                  style={{
                    background: filter === t ? cfg.bg : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${filter === t ? cfg.border : 'rgba(255,255,255,0.07)'}`,
                  }}>
                  <div className="flex items-center justify-between">
                    <span style={{ color: cfg.color }}>{cfg.icon}</span>
                    <span className="text-lg font-black" style={{ color: cfg.color }}>
                      {countByType[t]}
                    </span>
                  </div>
                  <p className="text-[10px] font-bold" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {cfg.label}
                  </p>
                </motion.button>
              )
            })}
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 mb-4 flex-wrap">
            <button onClick={() => setFilter('all')}
              className="text-[11px] font-black px-3 py-1.5 rounded-lg transition-all"
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
                  className="text-[11px] font-black px-3 py-1.5 rounded-lg transition-all"
                  style={filter === t
                    ? { background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }
                    : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', border: '1px solid transparent' }}>
                  {cfg.label} ({countByType[t]})
                </button>
              )
            })}
          </div>

          {/* List */}
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <motion.div key={i} className="h-20 rounded-2xl"
                  style={{ background: 'rgba(255,255,255,0.04)' }}
                  animate={{ opacity: [0.4, 0.7, 0.4] }}
                  transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.15 }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              className="flex flex-col items-center justify-center py-20 gap-4"
            >
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="w-20 h-20 rounded-2xl flex items-center justify-center relative"
                style={{ background: 'rgba(63,229,108,0.08)', border: '1px solid rgba(63,229,108,0.2)', color: '#3fe56c' }}>
                <CheckCircle2 size={36} />
                <div className="absolute inset-0 rounded-2xl blur-2xl pointer-events-none"
                  style={{ background: 'rgba(63,229,108,0.1)' }} />
              </motion.div>
              <div className="text-center">
                <p className="text-base font-black" style={{ color: '#3fe56c' }}>Tudo em ordem!</p>
                <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  {filter === 'all' ? 'Nenhuma pendência identificada no momento.' : `Nenhuma pendência do tipo "${TYPE_CONFIG[filter].label}".`}
                </p>
              </div>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="space-y-3">
                {filtered.map((n, i) => {
                  const cfg = TYPE_CONFIG[n.type]
                  const av  = avatar(n.internName)
                  return (
                    <motion.div key={n.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8, height: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.28, ease: [0.16,1,0.3,1] }}
                    >
                      <Link href={n.href}>
                        <motion.div
                          className="group flex items-center gap-4 p-4 rounded-2xl cursor-pointer relative overflow-hidden"
                          style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
                          whileHover={{ x: 4, transition: { duration: 0.15 } }}
                        >
                          {/* Left accent */}
                          <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: cfg.color }} />

                          {/* Avatar */}
                          <div className="ml-1 w-10 h-10 rounded-full flex items-center justify-center font-black text-[11px] flex-shrink-0"
                            style={{ background: `${av.color}22`, border: `1.5px solid ${av.color}55`, color: av.color }}>
                            {av.initials}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                              <span className="flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full"
                                style={{ background: `${cfg.color}18`, border: `1px solid ${cfg.border}`, color: cfg.color }}>
                                {cfg.icon} {cfg.label}
                              </span>
                              <span className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.45)' }}>
                                {n.internName}
                              </span>
                            </div>
                            <p className="text-sm font-black leading-snug" style={{ color: 'rgba(255,255,255,0.9)' }}>
                              {n.title}
                            </p>
                            <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: 'rgba(255,255,255,0.38)' }}>
                              {n.description}
                            </p>
                          </div>

                          {/* Arrow */}
                          <ArrowRight size={16} className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ color: cfg.color }} />
                        </motion.div>
                      </Link>
                    </motion.div>
                  )
                })}
              </div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  )
}
