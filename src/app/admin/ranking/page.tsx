'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion'
import { Trophy, Star, Flame, Crown, Calendar, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { getLevelInfo, getProgressToNextLevel, ACHIEVEMENTS, minutesToDisplay } from '@/lib/gamification'

interface RankingEntry {
  internId:      string
  internName:    string
  photoUrl:      string | null
  points:        number
  level:         number
  streakDays:    number
  periodMinutes: number
  achievements:  { type: string; unlocked_at: string }[]
  position:      number
}

type Period = 'monthly' | 'weekly'

// ── Animated number counter ──────────────────────────────────
function AnimCount({ value }: { value: number }) {
  const spring = useSpring(0, { stiffness: 60, damping: 18 })
  const display = useTransform(spring, v => Math.round(v).toLocaleString('pt-BR'))
  useEffect(() => { spring.set(value) }, [value, spring])
  return <motion.span>{display}</motion.span>
}

// ── Avatar ───────────────────────────────────────────────────
function Avatar({ name, photo, size = 44, border }: {
  name: string; photo: string | null; size?: number; border?: string
}) {
  if (photo) return (
    <img src={photo} alt={name}
      className="rounded-full object-cover flex-shrink-0"
      style={{ width: size, height: size, border: border ?? '2px solid rgba(0,200,83,0.3)' }} />
  )
  return (
    <div className="rounded-full flex items-center justify-center flex-shrink-0 font-black select-none"
      style={{
        width: size, height: size, fontSize: size * 0.38,
        background: 'rgba(0,200,83,0.12)', border: border ?? '2px solid rgba(0,200,83,0.25)', color: '#3fe56c',
      }}>
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

// ── Floating particles (decorative) ─────────────────────────
function Particles() {
  const items = Array.from({ length: 12 }, (_, i) => i)
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {items.map(i => (
        <motion.div key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{
            left: `${8 + i * 7.5}%`,
            top: `${20 + (i % 3) * 25}%`,
            background: i % 3 === 0 ? '#fbbf24' : i % 3 === 1 ? '#3fe56c' : '#f97316',
            opacity: 0.25,
          }}
          animate={{ y: [0, -12, 0], opacity: [0.15, 0.35, 0.15] }}
          transition={{ duration: 3 + i * 0.4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.25 }}
        />
      ))}
    </div>
  )
}

// ── Empty state illustration ─────────────────────────────────
function EmptyState({ period }: { period: Period }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-24 gap-6 text-center"
    >
      {/* Animated podium illustration */}
      <div className="flex items-end justify-center gap-3 mb-2">
        {[
          { h: 64, c: '#94a3b8', delay: 0.1 },
          { h: 96, c: '#fbbf24', delay: 0   },
          { h: 48, c: '#f97316', delay: 0.2 },
        ].map((b, i) => (
          <motion.div key={i}
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 0.25 }}
            transition={{ delay: b.delay + 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="w-14 rounded-t-xl"
            style={{ height: b.h, background: b.c, transformOrigin: 'bottom' }}
          />
        ))}
      </div>

      <motion.div
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Trophy size={42} style={{ color: '#fbbf24', opacity: 0.35 }} />
      </motion.div>

      <div>
        <p className="text-base font-black mb-1" style={{ color: 'var(--text)' }}>
          Sem registros {period === 'weekly' ? 'esta semana' : 'neste mês'}
        </p>
        <p className="text-sm" style={{ color: 'var(--text-3)' }}>
          Os estagiários aparecerão aqui conforme registrarem o ponto.
        </p>
      </div>
    </motion.div>
  )
}

// ── Podium card ──────────────────────────────────────────────
const PODIUM_SLOTS = [
  { idx: 1, pos: 2, height: 84,  color: '#94a3b8', glow: 'rgba(148,163,184,0.18)', avatarSize: 44 },
  { idx: 0, pos: 1, height: 124, color: '#fbbf24', glow: 'rgba(251,191,36,0.22)',  avatarSize: 56 },
  { idx: 2, pos: 3, height: 64,  color: '#f97316', glow: 'rgba(249,115,22,0.18)', avatarSize: 40 },
]

function Podium({ top3 }: { top3: RankingEntry[] }) {
  return (
    <div className="relative flex items-end justify-center gap-5 pt-8 pb-0">
      <Particles />
      {PODIUM_SLOTS.map(slot => {
        const entry = top3[slot.idx]
        if (!entry) return null
        const lvl = getLevelInfo(entry.level)
        return (
          <motion.div key={entry.internId}
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: slot.idx * 0.12, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center relative"
            style={{ zIndex: slot.pos === 1 ? 2 : 1 }}
          >
            {/* Crown */}
            {slot.pos === 1 && (
              <motion.div className="mb-1"
                animate={{ rotate: [-6, 6, -6], y: [0, -2, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Crown size={20} style={{ color: '#fbbf24', filter: 'drop-shadow(0 0 6px rgba(251,191,36,0.6))' }} />
              </motion.div>
            )}

            {/* Avatar */}
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2.8 + slot.idx * 0.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="relative">
                <Avatar name={entry.internName} photo={entry.photoUrl}
                  size={slot.avatarSize}
                  border={`2px solid ${slot.color}`} />
                {/* Glow ring for 1st */}
                {slot.pos === 1 && (
                  <motion.div className="absolute inset-0 rounded-full"
                    animate={{ opacity: [0.4, 0.9, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{ boxShadow: `0 0 16px 4px ${slot.glow}` }} />
                )}
              </div>
            </motion.div>

            {/* Name + level */}
            <p className="mt-2 text-[11px] font-black max-w-[80px] text-center truncate"
              style={{ color: slot.color }}>
              {entry.internName.split(' ')[0]}
            </p>
            <p className="text-[9px] mb-2" style={{ color: lvl.color }}>{lvl.title}</p>

            {/* Bar */}
            <motion.div
              initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
              transition={{ delay: 0.3 + slot.idx * 0.1, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center justify-end pb-3 rounded-t-2xl w-24 relative overflow-hidden"
              style={{
                height: slot.height,
                background: `linear-gradient(180deg, ${slot.glow} 0%, transparent 100%)`,
                border: `1px solid ${slot.color}40`,
                borderBottom: 'none',
                transformOrigin: 'bottom',
              }}
            >
              {/* Shimmer */}
              <motion.div className="absolute inset-0 opacity-20"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2.5, repeat: Infinity, delay: slot.idx * 0.5, ease: 'easeInOut' }}
                style={{ background: `linear-gradient(90deg, transparent, ${slot.color}, transparent)` }}
              />
              <p className="font-black text-xl relative z-10" style={{ color: slot.color }}>
                {slot.pos}º
              </p>
              <p className="text-[9px] font-bold relative z-10" style={{ color: slot.color, opacity: 0.7 }}>
                {minutesToDisplay(entry.periodMinutes)}
              </p>
            </motion.div>
          </motion.div>
        )
      })}
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────
const MONTHS = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
]

export default function RankingPage() {
  const [ranking, setRanking] = useState<RankingEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod]   = useState<Period>('monthly')
  const [month, setMonth]     = useState(new Date().getMonth() + 1)
  const [year]                = useState(new Date().getFullYear())
  const prevPeriod            = useRef(period)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/gamification/ranking?period=${period}&month=${month}&year=${year}`)
      .then(r => r.json())
      .then(d => { setRanking(d.ranking ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [period, month, year])

  const top3 = ranking.slice(0, 3)
  const rest = ranking.slice(3)

  return (
    <div className="flex flex-col flex-1 min-h-0" style={{ background: 'var(--bg)' }}>

      {/* ── Header ── */}
      <header className="flex items-center justify-between px-4 sm:px-6 h-14 sm:h-16 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(0,200,83,0.15)', background: 'var(--bg)' }}>
        <div className="flex items-center gap-3">
          <Trophy size={20} style={{ color: '#fbbf24' }} />
          <h2 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>Ranking</h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Period toggle */}
          <div className="flex rounded-lg overflow-hidden"
            style={{ border: '1px solid rgba(0,200,83,0.2)' }}>
            {(['weekly', 'monthly'] as Period[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold transition-all"
                style={{
                  background: period === p ? 'rgba(0,200,83,0.15)' : 'transparent',
                  color: period === p ? '#3fe56c' : 'var(--text-3)',
                }}>
                {p === 'weekly'
                  ? <><CalendarDays size={13} /> Semanal</>
                  : <><Calendar size={13} /> Mensal</>
                }
              </button>
            ))}
          </div>

          {/* Month picker — only when monthly */}
          <AnimatePresence>
            {period === 'monthly' && (
              <motion.div
                initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="flex items-center gap-1 overflow-hidden"
              >
                <button onClick={() => setMonth(m => m === 1 ? 12 : m - 1)}
                  className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                  style={{ color: 'var(--text-3)' }}>
                  <ChevronLeft size={14} />
                </button>
                <span className="text-[11px] font-bold whitespace-nowrap" style={{ color: 'var(--text)' }}>
                  {MONTHS[month - 1]}
                </span>
                <button onClick={() => setMonth(m => m === 12 ? 1 : m + 1)}
                  className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                  style={{ color: 'var(--text-3)' }}>
                  <ChevronRight size={14} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* ── Content ── */}
      <main className="flex-1 overflow-y-auto">
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '1.5rem 1rem' }}>

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="loading"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col gap-3 pt-4"
              >
                {/* Skeleton podium */}
                <div className="flex items-end justify-center gap-5 mb-6 pt-4">
                  {[{ h: 84, w: 96 }, { h: 124, w: 96 }, { h: 64, w: 96 }].map((b, i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                      <div className="rounded-full animate-pulse" style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.06)' }} />
                      <div className="rounded-t-2xl animate-pulse" style={{ width: b.w, height: b.h, background: 'rgba(255,255,255,0.04)' }} />
                    </div>
                  ))}
                </div>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl animate-pulse"
                    style={{ background: 'rgba(255,255,255,0.03)', height: 60 }}>
                    <div className="w-8 h-4 rounded" style={{ background: 'rgba(255,255,255,0.05)' }} />
                    <div className="w-10 h-10 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 rounded w-1/3" style={{ background: 'rgba(255,255,255,0.05)' }} />
                      <div className="h-1 rounded w-1/2" style={{ background: 'rgba(255,255,255,0.04)' }} />
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : ranking.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <EmptyState period={period} />
              </motion.div>
            ) : (
              <motion.div key={`${period}-${month}`}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
              >
                {/* ── Podium ── */}
                {top3.length >= 2 && (
                  <div className="rounded-2xl mb-6 overflow-hidden relative"
                    style={{ background: 'var(--surface-card, #0f2318)', border: '1px solid rgba(0,200,83,0.12)' }}>
                    <Podium top3={top3} />
                    {/* Base line */}
                    <div style={{ height: 1, background: 'rgba(0,200,83,0.12)', marginTop: -1 }} />
                    {/* Stats below podium */}
                    <div className="grid grid-cols-3 divide-x" style={{ borderColor: 'rgba(0,200,83,0.1)' }}>
                      {top3.map((e, i) => (
                        <div key={e.internId} className="flex flex-col items-center py-3 gap-1">
                          <span className="text-lg font-black" style={{ color: ['#fbbf24','#94a3b8','#f97316'][i] }}>
                            <AnimCount value={e.periodMinutes} />
                            <span className="text-[10px] font-medium ml-0.5">min</span>
                          </span>
                          <div className="flex items-center gap-1">
                            <Star size={10} style={{ color: '#3fe56c' }} />
                            <span className="text-[10px]" style={{ color: 'var(--text-3)' }}>{e.points} pts</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Full list ── */}
                <div className="space-y-2">
                  {ranking.map((entry, i) => {
                    const lvl  = getLevelInfo(entry.level)
                    const prog = getProgressToNextLevel(entry.points, entry.level)
                    const posColor = i === 0 ? '#fbbf24' : i === 1 ? '#94a3b8' : i === 2 ? '#f97316' : 'var(--text-3)'
                    return (
                      <motion.div key={entry.internId}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.045, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl group transition-all"
                        style={{
                          background: 'var(--surface-card, #0f2318)',
                          border: '1px solid rgba(0,200,83,0.10)',
                        }}
                        whileHover={{ scale: 1.005, borderColor: 'rgba(0,200,83,0.22)' }}
                      >
                        {/* Position medal */}
                        <div className="w-7 flex-shrink-0 flex items-center justify-center">
                          {i < 3 ? (
                            <span className="text-lg">{['🥇','🥈','🥉'][i]}</span>
                          ) : (
                            <span className="text-xs font-black" style={{ color: 'var(--text-3)' }}>
                              {entry.position}º
                            </span>
                          )}
                        </div>

                        <Avatar name={entry.internName} photo={entry.photoUrl} size={38} />

                        {/* Name + level + bar */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-bold truncate" style={{ color: 'var(--text)' }}>
                              {entry.internName}
                            </p>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                              style={{ background: `${lvl.color}18`, color: lvl.color, border: `1px solid ${lvl.color}30` }}>
                              {lvl.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                              <motion.div className="h-full rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${prog}%` }}
                                transition={{ delay: 0.2 + i * 0.03, duration: 0.6, ease: 'easeOut' }}
                                style={{ background: lvl.color }} />
                            </div>
                            <span className="text-[9px] flex-shrink-0" style={{ color: 'rgba(255,255,255,0.2)' }}>
                              Nv.{entry.level}
                            </span>
                          </div>
                        </div>

                        {/* Right side stats */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                          {/* Streak */}
                          {entry.streakDays > 0 && (
                            <motion.div className="flex items-center gap-1"
                              animate={entry.streakDays >= 7 ? { scale: [1, 1.12, 1] } : {}}
                              transition={{ duration: 1.5, repeat: Infinity }}>
                              <Flame size={13} style={{ color: entry.streakDays >= 7 ? '#f97316' : '#fbbf24' }} />
                              <span className="text-xs font-black" style={{ color: entry.streakDays >= 7 ? '#f97316' : '#fbbf24' }}>
                                {entry.streakDays}d
                              </span>
                            </motion.div>
                          )}

                          {/* Points */}
                          <div className="flex items-center gap-1">
                            <Star size={12} style={{ color: '#3fe56c' }} />
                            <span className="text-xs font-bold tabular-nums" style={{ color: 'var(--text-2)' }}>
                              {entry.points}
                            </span>
                          </div>

                          {/* Hours */}
                          <div className="text-right">
                            <p className="text-xs font-black tabular-nums" style={{ color: 'var(--text)' }}>
                              {minutesToDisplay(entry.periodMinutes)}
                            </p>
                            <p className="text-[9px]" style={{ color: 'var(--text-3)' }}>
                              {period === 'weekly' ? 'semana' : 'mês'}
                            </p>
                          </div>

                          {/* Badges */}
                          {entry.achievements.length > 0 && (
                            <div className="flex gap-0.5">
                              {entry.achievements.slice(0, 3).map(a => (
                                <span key={a.type} className="text-sm leading-none"
                                  title={ACHIEVEMENTS[a.type]?.label ?? a.type}>
                                  {ACHIEVEMENTS[a.type]?.emoji ?? '🏅'}
                                </span>
                              ))}
                              {entry.achievements.length > 3 && (
                                <span className="text-[9px] font-bold self-end leading-none"
                                  style={{ color: 'var(--text-3)' }}>
                                  +{entry.achievements.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>

                {/* Footer legend */}
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                  className="flex items-center justify-center gap-6 mt-8 pb-4"
                >
                  {[
                    { icon: <Flame size={12} />, label: 'Dias seguidos', color: '#f97316' },
                    { icon: <Star size={12} />,  label: 'Pontos totais', color: '#3fe56c' },
                    { icon: <span className="text-xs">🏅</span>, label: 'Conquistas', color: '#fbbf24' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-1.5">
                      <span style={{ color: item.color }}>{item.icon}</span>
                      <span className="text-[10px]" style={{ color: 'var(--text-3)' }}>{item.label}</span>
                    </div>
                  ))}
                </motion.div>

              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
