'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Home, ClipboardList, Trophy, LogOut, Star, Flame, Crown, User, CalendarDays, Calendar } from 'lucide-react'
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
  isActive:      boolean
  position:      number
}

type Period = 'monthly' | 'weekly'

const REFRESH_INTERVAL = 30_000

function Avatar({ name, photo, size = 36, border }: {
  name: string; photo: string | null; size?: number; border?: string
}) {
  if (photo) return (
    <img src={photo} alt={name} className="rounded-full object-cover flex-shrink-0"
      style={{ width: size, height: size, border: border ?? '2px solid rgba(0,200,83,0.3)' }} />
  )
  return (
    <div className="rounded-full flex items-center justify-center flex-shrink-0 font-black"
      style={{ width: size, height: size, fontSize: size * 0.38,
        background: 'rgba(0,200,83,0.15)', border: border ?? '2px solid rgba(0,200,83,0.3)', color: '#3fe56c' }}>
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

const PODIUM_SLOTS = [
  { idx: 1, pos: 2, height: 68,  color: '#94a3b8', glow: 'rgba(148,163,184,0.2)',  avatarSize: 40 },
  { idx: 0, pos: 1, height: 104, color: '#fbbf24', glow: 'rgba(251,191,36,0.25)',  avatarSize: 52 },
  { idx: 2, pos: 3, height: 52,  color: '#f97316', glow: 'rgba(249,115,22,0.18)', avatarSize: 36 },
]

export default function InternRankingContent() {
  const [ranking, setRanking]         = useState<RankingEntry[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading]         = useState(true)
  const [period, setPeriod]           = useState<Period>('monthly')
  const [updatedAt, setUpdatedAt]     = useState<Date | null>(null)
  const [month]                       = useState(new Date().getMonth() + 1)
  const [year]                        = useState(new Date().getFullYear())

  const fetchRanking = useCallback((showLoader = false) => {
    if (showLoader) setLoading(true)
    fetch(`/api/gamification/ranking?period=${period}&month=${month}&year=${year}`)
      .then(r => r.json())
      .then(d => {
        setRanking(d.ranking ?? [])
        setCurrentUserId(d.currentUserId ?? null)
        setUpdatedAt(new Date())
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [period, month, year])

  useEffect(() => { fetchRanking(true) }, [fetchRanking])

  useEffect(() => {
    const id = setInterval(() => fetchRanking(false), REFRESH_INTERVAL)
    return () => clearInterval(id)
  }, [fetchRanking])

  const top3    = ranking.slice(0, 3)
  const myEntry = ranking.find(r => r.internId === currentUserId)
  const myPos   = myEntry?.position ?? null

  return (
    <div className="flex flex-col" style={{ height: '100dvh', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* ── Header ── */}
      <header className="flex-shrink-0 px-5 py-3"
        style={{ background: 'var(--nav-bg)', borderBottom: '1px solid rgba(0,200,83,0.12)' }}>

        {/* Top row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Trophy size={18} style={{ color: '#fbbf24' }} />
            <h1 className="text-base font-black" style={{ color: 'white' }}>Ranking</h1>
            {/* Live dot */}
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full"
              style={{ background: 'rgba(0,200,83,0.08)', border: '1px solid rgba(0,200,83,0.2)' }}>
              <motion.div className="w-1.5 h-1.5 rounded-full" style={{ background: '#00c853' }}
                animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
              <span className="text-[9px] font-bold" style={{ color: '#3fe56c' }}>AO VIVO</span>
            </div>
          </div>

          {/* My position badge */}
          {myPos && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)' }}>
              <Trophy size={11} style={{ color: '#fbbf24' }} />
              <span className="text-[11px] font-black" style={{ color: '#fbbf24' }}>
                {myPos}º lugar
              </span>
            </motion.div>
          )}
        </div>

        {/* Period toggle */}
        <div className="flex rounded-lg overflow-hidden w-full"
          style={{ border: '1px solid rgba(0,200,83,0.2)' }}>
          {(['monthly', 'weekly'] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-bold transition-all"
              style={{
                background: period === p ? 'rgba(0,200,83,0.15)' : 'transparent',
                color: period === p ? '#3fe56c' : 'rgba(255,255,255,0.35)',
              }}>
              {p === 'monthly'
                ? <><Calendar size={12} /> Mensal</>
                : <><CalendarDays size={12} /> Semanal</>}
            </button>
          ))}
        </div>
      </header>

      {/* ── Content ── */}
      <main className="flex-1 min-h-0 overflow-y-auto px-4 py-3">

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-7 h-7 rounded-full border-2 animate-spin"
              style={{ borderColor: '#3fe56c', borderTopColor: 'transparent' }} />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={period}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
            >

              {/* ── Podium ── */}
              {top3.length >= 2 && (
                <div className="rounded-2xl mb-3 overflow-hidden"
                  style={{ background: 'var(--surface-card, #0f2318)', border: '1px solid rgba(0,200,83,0.12)' }}>
                  <div className="flex items-end justify-center gap-3 pt-5 px-4">
                    {PODIUM_SLOTS.map(slot => {
                      const entry = top3[slot.idx]
                      if (!entry) return null
                      const isMe = entry.internId === currentUserId
                      return (
                        <motion.div key={entry.internId}
                          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: slot.idx * 0.1 }}
                          className="flex flex-col items-center"
                        >
                          {slot.pos === 1 && (
                            <motion.div animate={{ rotate: [-5, 5, -5], y: [0, -2, 0] }}
                              transition={{ duration: 2, repeat: Infinity }}>
                              <Crown size={16} style={{ color: '#fbbf24' }} />
                            </motion.div>
                          )}
                          <motion.div
                            animate={{ y: [0, -4, 0] }}
                            transition={{ duration: 2.6 + slot.idx * 0.4, repeat: Infinity, ease: 'easeInOut' }}
                            className="relative"
                          >
                            <Avatar name={entry.internName} photo={entry.photoUrl}
                              size={slot.avatarSize}
                              border={`2px solid ${isMe ? '#00c853' : slot.color}`} />
                            {entry.isActive && (
                              <motion.div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
                                style={{ background: '#00c853', border: '2px solid #0f1a12' }}
                                animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
                            )}
                          </motion.div>
                          <p className="mt-1.5 text-[10px] font-black max-w-[64px] text-center truncate"
                            style={{ color: isMe ? '#3fe56c' : slot.color }}>
                            {isMe ? 'Você' : entry.internName.split(' ')[0]}
                          </p>
                          <motion.div
                            initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
                            transition={{ delay: 0.25 + slot.idx * 0.1, duration: 0.5 }}
                            className="w-[72px] rounded-t-xl flex flex-col items-center justify-end pb-2 mt-1.5 relative overflow-hidden"
                            style={{
                              height: slot.height,
                              background: `linear-gradient(180deg, ${slot.glow} 0%, transparent 100%)`,
                              border: `1px solid ${slot.color}40`,
                              borderBottom: 'none',
                              transformOrigin: 'bottom',
                            }}
                          >
                            <motion.div className="absolute inset-0 opacity-20"
                              animate={{ x: ['-100%', '200%'] }}
                              transition={{ duration: 2.5, repeat: Infinity, delay: slot.idx * 0.6, ease: 'easeInOut' }}
                              style={{ background: `linear-gradient(90deg, transparent, ${slot.color}, transparent)` }} />
                            <p className="font-black text-base relative z-10" style={{ color: slot.color }}>{slot.pos}º</p>
                            <p className="text-[8px] font-bold relative z-10" style={{ color: slot.color, opacity: 0.7 }}>
                              {minutesToDisplay(entry.periodMinutes)}
                            </p>
                          </motion.div>
                        </motion.div>
                      )
                    })}
                  </div>

                  {/* Stats strip */}
                  <div className="grid grid-cols-3 mt-1" style={{ borderTop: '1px solid rgba(0,200,83,0.1)' }}>
                    {top3.map((e, i) => (
                      <div key={e.internId} className="flex flex-col items-center py-2 gap-0.5"
                        style={{ borderRight: i < 2 ? '1px solid rgba(0,200,83,0.08)' : 'none' }}>
                        <span className="text-xs font-black" style={{ color: ['#fbbf24','#94a3b8','#f97316'][i] }}>
                          {minutesToDisplay(e.periodMinutes)}
                        </span>
                        <div className="flex items-center gap-0.5">
                          <Star size={9} style={{ color: '#3fe56c' }} />
                          <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{e.points}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Full list ── */}
              <div className="space-y-1.5 pb-4">
                {ranking.map((entry, i) => {
                  const lvl  = getLevelInfo(entry.level)
                  const prog = getProgressToNextLevel(entry.points, entry.level)
                  const isMe = entry.internId === currentUserId
                  return (
                    <motion.div key={entry.internId}
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.035 }}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
                      style={{
                        background: isMe ? 'rgba(0,200,83,0.07)' : 'var(--surface-card, #0f2318)',
                        border: `1px solid ${entry.isActive ? 'rgba(0,200,83,0.3)' : isMe ? 'rgba(0,200,83,0.3)' : 'rgba(0,200,83,0.08)'}`,
                      }}
                    >
                      {/* Medal / position */}
                      <div className="w-6 flex items-center justify-center flex-shrink-0">
                        {i < 3
                          ? <span className="text-base leading-none">{['🥇','🥈','🥉'][i]}</span>
                          : <span className="text-[11px] font-black" style={{ color: 'rgba(255,255,255,0.25)' }}>{entry.position}</span>
                        }
                      </div>

                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        <Avatar name={entry.internName} photo={entry.photoUrl} size={34} />
                        {entry.isActive && (
                          <motion.div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
                            style={{ background: '#00c853', border: '2px solid #0f1a12' }}
                            animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
                        )}
                      </div>

                      {/* Name + bar */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold truncate"
                            style={{ color: isMe ? '#3fe56c' : 'white' }}>
                            {isMe ? 'Você' : entry.internName.split(' ')[0]}
                          </p>
                          <span className="text-[8px] font-bold px-1 py-0.5 rounded flex-shrink-0"
                            style={{ background: `${lvl.color}18`, color: lvl.color }}>
                            {lvl.title}
                          </span>
                          {entry.isActive && (
                            <span className="text-[8px] font-bold flex-shrink-0" style={{ color: '#00c853' }}>
                              • ativo
                            </span>
                          )}
                        </div>
                        <div className="mt-1 h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <motion.div className="h-full rounded-full"
                            initial={{ width: 0 }} animate={{ width: `${prog}%` }}
                            transition={{ delay: 0.15 + i * 0.03, duration: 0.5 }}
                            style={{ background: lvl.color }} />
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {entry.streakDays > 0 && (
                          <div className="flex items-center gap-0.5">
                            <Flame size={11} style={{ color: entry.streakDays >= 7 ? '#f97316' : '#fbbf24' }} />
                            <span className="text-[10px] font-black"
                              style={{ color: entry.streakDays >= 7 ? '#f97316' : '#fbbf24' }}>
                              {entry.streakDays}
                            </span>
                          </div>
                        )}
                        <div className="text-right">
                          <p className="text-[11px] font-black tabular-nums" style={{ color: 'white' }}>
                            {minutesToDisplay(entry.periodMinutes)}
                          </p>
                          <div className="flex items-center gap-0.5 justify-end">
                            <Star size={9} style={{ color: '#3fe56c' }} />
                            <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{entry.points}</span>
                          </div>
                        </div>
                        {entry.achievements.slice(0, 2).map(a => (
                          <span key={a.type} className="text-sm leading-none"
                            title={ACHIEVEMENTS[a.type]?.label}>
                            {ACHIEVEMENTS[a.type]?.emoji ?? '🏅'}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              {/* Last updated */}
              {updatedAt && (
                <p className="text-center text-[9px] pb-2" style={{ color: 'rgba(255,255,255,0.2)' }}>
                  Atualizado às {updatedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </p>
              )}

            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* ── Bottom nav ── */}
      <nav className="flex-shrink-0 border-t"
        style={{ background: 'var(--nav-bg)', borderColor: 'rgba(0,200,83,0.12)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="max-w-lg mx-auto flex">
          <Link href="/dashboard" className="flex-1 flex flex-col items-center gap-1 py-3" style={{ color: 'var(--text-3)' }}>
            <Home size={18} /><span className="text-[10px] font-bold">Início</span>
          </Link>
          <Link href="/history" className="flex-1 flex flex-col items-center gap-1 py-3" style={{ color: 'var(--text-3)' }}>
            <ClipboardList size={18} /><span className="text-[10px] font-bold">Histórico</span>
          </Link>
          <Link href="/intern-ranking" className="flex-1 flex flex-col items-center gap-1 py-3" style={{ color: '#fbbf24' }}>
            <Trophy size={18} /><span className="text-[10px] font-bold">Ranking</span>
          </Link>
          <Link href="/profile" className="flex-1 flex flex-col items-center gap-1 py-3" style={{ color: 'var(--text-3)' }}>
            <User size={18} /><span className="text-[10px] font-bold">Perfil</span>
          </Link>
          <form action="/api/auth/signout" method="POST" className="flex-1">
            <button type="submit" className="w-full flex flex-col items-center gap-1 py-3" style={{ color: 'var(--text-3)' }}>
              <LogOut size={18} /><span className="text-[10px] font-bold">Sair</span>
            </button>
          </form>
        </div>
      </nav>
    </div>
  )
}
