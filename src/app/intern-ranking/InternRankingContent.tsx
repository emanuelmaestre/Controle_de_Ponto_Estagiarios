'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Home, ClipboardList, Trophy, LogOut, Star, Flame, Crown, User } from 'lucide-react'
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

const PODIUM_ORDER = [1, 0, 2]
const PODIUM_META = [
  { pos: 2, height: 64,  color: '#94a3b8', glow: 'rgba(148,163,184,0.2)' },
  { pos: 1, height: 100, color: '#fbbf24', glow: 'rgba(251,191,36,0.25)' },
  { pos: 3, height: 48,  color: '#f97316', glow: 'rgba(249,115,22,0.2)'  },
]

function Avatar({ name, photo, size = 36, border }: { name: string; photo: string | null; size?: number; border?: string }) {
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

export default function InternRankingContent() {
  const [ranking, setRanking]         = useState<RankingEntry[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading]         = useState(true)
  const [month]                       = useState(new Date().getMonth() + 1)
  const [year]                        = useState(new Date().getFullYear())

  useEffect(() => {
    fetch(`/api/gamification/ranking?month=${month}&year=${year}`)
      .then(r => r.json())
      .then(d => {
        setRanking(d.ranking ?? [])
        setCurrentUserId(d.currentUserId ?? null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [month, year])

  const podium = ranking.slice(0, 3)

  return (
    <div className="flex flex-col" style={{ height: '100dvh', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* Header */}
      <header className="flex-shrink-0 flex items-center gap-3 px-5 py-4"
        style={{ background: 'var(--nav-bg)', borderBottom: '1px solid rgba(0,200,83,0.12)' }}>
        <Trophy size={18} style={{ color: '#fbbf24' }} />
        <h1 className="text-base font-black" style={{ color: 'white' }}>Ranking</h1>
        <span className="ml-1 text-[9px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(0,200,83,0.1)', border: '1px solid rgba(0,200,83,0.2)', color: '#3fe56c' }}>
          {new Date().toLocaleString('pt-BR', { month: 'long' }).toUpperCase()}
        </span>
      </header>

      {/* Content */}
      <main className="flex-1 min-h-0 overflow-y-auto px-4 py-4">

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-7 h-7 rounded-full border-2 animate-spin"
              style={{ borderColor: '#3fe56c', borderTopColor: 'transparent' }} />
          </div>
        ) : ranking.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <Trophy size={36} className="opacity-20" style={{ color: '#fbbf24' }} />
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Nenhum registro este mês ainda.</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

              {/* ── Podium ── */}
              {podium.length >= 2 && (
                <div className="flex items-end justify-center gap-3 mb-6 pt-2">
                  {PODIUM_ORDER.map(idx => {
                    const entry = podium[idx]
                    const meta  = PODIUM_META[PODIUM_ORDER.indexOf(idx)]
                    if (!entry) return null
                    const lvl   = getLevelInfo(entry.level)
                    const isMe  = entry.internId === currentUserId
                    return (
                      <motion.div key={entry.internId}
                        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.08 }}
                        className="flex flex-col items-center gap-1.5"
                      >
                        {meta.pos === 1 && (
                          <motion.div animate={{ rotate: [-4, 4, -4] }} transition={{ duration: 2, repeat: Infinity }}>
                            <Crown size={14} style={{ color: '#fbbf24' }} />
                          </motion.div>
                        )}
                        <motion.div
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 2.5 + idx * 0.4, repeat: Infinity, ease: 'easeInOut' }}
                        >
                          <Avatar name={entry.internName} photo={entry.photoUrl}
                            size={meta.pos === 1 ? 46 : 36}
                            border={`2px solid ${isMe ? '#00c853' : meta.color}`} />
                        </motion.div>
                        <p className="text-[9px] font-bold max-w-[60px] text-center truncate"
                          style={{ color: isMe ? '#3fe56c' : meta.color }}>
                          {entry.internName.split(' ')[0]}
                        </p>
                        <motion.div
                          initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
                          transition={{ delay: 0.25 + idx * 0.1, duration: 0.5 }}
                          className="w-16 rounded-t-xl flex flex-col items-center justify-end pb-1.5"
                          style={{
                            height: meta.height,
                            background: `linear-gradient(180deg, ${meta.glow} 0%, transparent 100%)`,
                            border: `1px solid ${meta.color}`,
                            borderBottom: 'none',
                            transformOrigin: 'bottom',
                          }}
                        >
                          <p className="font-black text-base" style={{ color: meta.color }}>{meta.pos}º</p>
                          <p className="text-[8px] font-bold" style={{ color: meta.color, opacity: 0.7 }}>
                            {minutesToDisplay(entry.monthMinutes)}
                          </p>
                        </motion.div>
                      </motion.div>
                    )
                  })}
                </div>
              )}

              {/* ── List ── */}
              <div className="space-y-2 pb-4">
                {ranking.map((entry, i) => {
                  const lvl   = getLevelInfo(entry.level)
                  const prog  = getProgressToNextLevel(entry.points, entry.level)
                  const isMe  = entry.internId === currentUserId
                  return (
                    <motion.div key={entry.internId}
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                      style={{
                        background: isMe ? 'rgba(0,200,83,0.08)' : 'var(--surface-card, #0f2318)',
                        border: `1px solid ${isMe ? 'rgba(0,200,83,0.35)' : 'rgba(0,200,83,0.10)'}`,
                      }}
                    >
                      {/* Position */}
                      <span className="text-xs font-black w-5 text-center flex-shrink-0"
                        style={{ color: i === 0 ? '#fbbf24' : i === 1 ? '#94a3b8' : i === 2 ? '#f97316' : 'rgba(255,255,255,0.3)' }}>
                        {entry.position}
                      </span>

                      <Avatar name={entry.internName} photo={entry.photoUrl} size={34} />

                      {/* Name + bar */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold truncate" style={{ color: isMe ? '#3fe56c' : 'white' }}>
                            {isMe ? 'Você' : entry.internName.split(' ')[0]}
                          </p>
                          <span className="text-[8px] font-bold px-1 py-0.5 rounded flex-shrink-0"
                            style={{ background: `${lvl.color}18`, color: lvl.color }}>
                            {lvl.title}
                          </span>
                        </div>
                        <div className="mt-1 h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                          <motion.div className="h-full rounded-full"
                            initial={{ width: 0 }} animate={{ width: `${prog}%` }}
                            transition={{ delay: 0.2 + i * 0.03, duration: 0.5 }}
                            style={{ background: lvl.color }} />
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {entry.streakDays > 0 && (
                          <div className="flex items-center gap-0.5">
                            <Flame size={10} style={{ color: entry.streakDays >= 7 ? '#f97316' : '#fbbf24' }} />
                            <span className="text-[10px] font-bold" style={{ color: 'rgba(255,255,255,0.6)' }}>
                              {entry.streakDays}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-0.5">
                          <Star size={10} style={{ color: '#3fe56c' }} />
                          <span className="text-[10px] font-bold" style={{ color: 'rgba(255,255,255,0.6)' }}>
                            {entry.points}
                          </span>
                        </div>
                        {entry.achievements.slice(0, 2).map(a => (
                          <span key={a.type} className="text-sm"
                            title={ACHIEVEMENTS[a.type]?.label}>
                            {ACHIEVEMENTS[a.type]?.emoji ?? '🏅'}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  )
                })}
              </div>

            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* Bottom nav */}
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
