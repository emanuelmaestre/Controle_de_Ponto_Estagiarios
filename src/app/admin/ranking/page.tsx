'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Star, Flame, Zap, Crown } from 'lucide-react'
import { getLevelInfo, getProgressToNextLevel, ACHIEVEMENTS, minutesToDisplay } from '@/lib/gamification'

interface RankingEntry {
  internId:     string
  internName:   string
  photoUrl:     string | null
  points:       number
  level:        number
  streakDays:   number
  monthMinutes: number
  achievements: { type: string; unlocked_at: string }[]
  position:     number
}

const PODIUM_ORDER = [1, 0, 2] // 2nd, 1st, 3rd
const PODIUM_META = [
  { pos: 2, height: 80,  color: '#94a3b8', glow: 'rgba(148,163,184,0.2)' },
  { pos: 1, height: 120, color: '#fbbf24', glow: 'rgba(251,191,36,0.25)' },
  { pos: 3, height: 60,  color: '#f97316', glow: 'rgba(249,115,22,0.2)'  },
]

function Avatar({ name, photo, size = 40, border }: { name: string; photo: string | null; size?: number; border?: string }) {
  if (photo) return (
    <img src={photo} alt={name} width={size} height={size}
      className="rounded-full object-cover flex-shrink-0"
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

export default function RankingPage() {
  const [ranking, setRanking] = useState<RankingEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [month, setMonth]     = useState(new Date().getMonth() + 1)
  const [year]                = useState(new Date().getFullYear())

  useEffect(() => {
    setLoading(true)
    fetch(`/api/gamification/ranking?month=${month}&year=${year}`)
      .then(r => r.json())
      .then(d => { setRanking(d.ranking ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [month, year])

  const podium = ranking.slice(0, 3)
  const rest   = ranking.slice(3)

  const months = [
    'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
    'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
  ]

  return (
    <div className="flex flex-col flex-1 min-h-0" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-6 h-14 sm:h-16 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(0,200,83,0.15)', background: 'var(--bg)' }}>
        <div className="flex items-center gap-3">
          <Trophy size={20} style={{ color: '#fbbf24' }} />
          <h2 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>Ranking</h2>
        </div>
        {/* Month picker */}
        <select
          value={month}
          onChange={e => setMonth(Number(e.target.value))}
          className="text-xs font-bold rounded-lg px-3 py-2 outline-none"
          style={{ background: 'var(--surface-card, #0f2318)', border: '1px solid rgba(0,200,83,0.2)', color: 'var(--text)' }}
        >
          {months.map((m, i) => (
            <option key={i + 1} value={i + 1}>{m} {year}</option>
          ))}
        </select>
      </header>

      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div style={{ maxWidth: 720, margin: '0 auto' }}>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#3fe56c', borderTopColor: 'transparent' }} />
            </div>
          ) : ranking.length === 0 ? (
            <div className="text-center py-20">
              <Trophy size={40} className="mx-auto mb-4 opacity-20" style={{ color: '#fbbf24' }} />
              <p className="text-sm" style={{ color: 'var(--text-3)' }}>Nenhum registro neste mês ainda.</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div key={month} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

                {/* ── Podium ── */}
                {podium.length >= 2 && (
                  <div className="flex items-end justify-center gap-4 mb-10 pt-4">
                    {PODIUM_ORDER.map(idx => {
                      const entry = podium[idx]
                      const meta  = PODIUM_META[PODIUM_ORDER.indexOf(idx)]
                      if (!entry) return null
                      const lvl = getLevelInfo(entry.level)
                      return (
                        <motion.div key={entry.internId}
                          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="flex flex-col items-center gap-2"
                        >
                          {/* Crown for 1st */}
                          {meta.pos === 1 && (
                            <motion.div animate={{ rotate: [-5, 5, -5] }} transition={{ duration: 2, repeat: Infinity }}>
                              <Crown size={18} style={{ color: '#fbbf24' }} />
                            </motion.div>
                          )}
                          <motion.div
                            animate={{ y: [0, -5, 0] }}
                            transition={{ duration: 2.5 + idx * 0.4, repeat: Infinity, ease: 'easeInOut' }}
                          >
                            <Avatar name={entry.internName} photo={entry.photoUrl}
                              size={meta.pos === 1 ? 52 : 42}
                              border={`2px solid ${meta.color}`} />
                          </motion.div>
                          <p className="text-[10px] font-bold text-center max-w-[70px] truncate" style={{ color: meta.color }}>
                            {entry.internName.split(' ')[0]}
                          </p>
                          <p className="text-[9px]" style={{ color: lvl.color }}>{lvl.title}</p>
                          <motion.div
                            initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
                            transition={{ delay: 0.3 + idx * 0.1, duration: 0.5 }}
                            className="w-20 rounded-t-xl flex flex-col items-center justify-end pb-2"
                            style={{
                              height: meta.height,
                              background: `linear-gradient(180deg, ${meta.glow} 0%, transparent 100%)`,
                              border: `1px solid ${meta.color}`,
                              borderBottom: 'none',
                              transformOrigin: 'bottom',
                            }}
                          >
                            <p className="font-black text-lg" style={{ color: meta.color }}>{meta.pos}º</p>
                            <p className="text-[9px] font-bold" style={{ color: meta.color, opacity: 0.7 }}>
                              {minutesToDisplay(entry.monthMinutes)}
                            </p>
                          </motion.div>
                        </motion.div>
                      )
                    })}
                  </div>
                )}

                {/* ── Full list ── */}
                <div className="space-y-2">
                  {ranking.map((entry, i) => {
                    const lvl  = getLevelInfo(entry.level)
                    const prog = getProgressToNextLevel(entry.points, entry.level)
                    return (
                      <motion.div key={entry.internId}
                        initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl"
                        style={{ background: 'var(--surface-card, #0f2318)', border: '1px solid rgba(0,200,83,0.12)' }}
                      >
                        {/* Position */}
                        <span className="text-sm font-black w-6 text-center flex-shrink-0"
                          style={{ color: i === 0 ? '#fbbf24' : i === 1 ? '#94a3b8' : i === 2 ? '#f97316' : 'var(--text-3)' }}>
                          {entry.position}º
                        </span>

                        <Avatar name={entry.internName} photo={entry.photoUrl} size={38} />

                        {/* Name + level */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold truncate" style={{ color: 'var(--text)' }}>
                              {entry.internName}
                            </p>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                              style={{ background: `${lvl.color}18`, color: lvl.color, border: `1px solid ${lvl.color}40` }}>
                              {lvl.title}
                            </span>
                          </div>
                          {/* Progress bar */}
                          <div className="mt-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                            <motion.div className="h-full rounded-full"
                              initial={{ width: 0 }} animate={{ width: `${prog}%` }}
                              transition={{ delay: 0.2 + i * 0.03, duration: 0.6 }}
                              style={{ background: lvl.color }} />
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                          {/* Streak */}
                          {entry.streakDays > 0 && (
                            <div className="flex items-center gap-1">
                              <Flame size={12} style={{ color: entry.streakDays >= 7 ? '#f97316' : '#fbbf24' }} />
                              <span className="text-[11px] font-bold" style={{ color: 'var(--text-2)' }}>
                                {entry.streakDays}d
                              </span>
                            </div>
                          )}
                          {/* Points */}
                          <div className="flex items-center gap-1">
                            <Star size={12} style={{ color: '#3fe56c' }} />
                            <span className="text-[11px] font-bold" style={{ color: 'var(--text-2)' }}>
                              {entry.points}
                            </span>
                          </div>
                          {/* Hours this month */}
                          <span className="text-[11px] font-bold" style={{ color: 'var(--text-3)' }}>
                            {minutesToDisplay(entry.monthMinutes)}
                          </span>
                        </div>

                        {/* Achievements badges */}
                        {entry.achievements.length > 0 && (
                          <div className="flex gap-0.5 flex-shrink-0">
                            {entry.achievements.slice(0, 3).map(a => (
                              <span key={a.type} title={ACHIEVEMENTS[a.type]?.label ?? a.type}
                                className="text-sm">{ACHIEVEMENTS[a.type]?.emoji ?? '🏅'}</span>
                            ))}
                            {entry.achievements.length > 3 && (
                              <span className="text-[9px] font-bold self-end" style={{ color: 'var(--text-3)' }}>
                                +{entry.achievements.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </motion.div>
                    )
                  })}
                </div>

              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </main>
    </div>
  )
}
