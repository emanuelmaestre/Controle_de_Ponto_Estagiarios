'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ACHIEVEMENTS, LEVELS, getLevelInfo, getNextLevel, getProgressToNextLevel } from '@/lib/gamification'
import { useState } from 'react'
import { ChevronDown, ChevronUp, Lock, Star } from 'lucide-react'

interface UserAchievement {
  type: string
  unlocked_at: string
}

interface Props {
  points:       number
  level:        number
  streakDays:   number
  achievements: UserAchievement[]
}

const ALL_ACHIEVEMENT_KEYS = Object.keys(ACHIEVEMENTS)

export default function ProfileAchievements({ points, level, streakDays, achievements }: Props) {
  const [showLocked, setShowLocked] = useState(false)

  const lvl     = getLevelInfo(level)
  const nextLvl = getNextLevel(level)
  const prog    = getProgressToNextLevel(points, level)

  const unlockedTypes = new Set(achievements.map(a => a.type))
  const unlocked = ALL_ACHIEVEMENT_KEYS.filter(k => unlockedTypes.has(k))
  const locked   = ALL_ACHIEVEMENT_KEYS.filter(k => !unlockedTypes.has(k))

  const getUnlockedAt = (type: string) => {
    const a = achievements.find(a => a.type === type)
    if (!a) return ''
    return new Date(a.unlocked_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div className="space-y-4 pb-6">

      {/* ── Card de nível / XP ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-2xl p-4 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${lvl.color}12 0%, #0f2318 100%)`, border: `1px solid ${lvl.color}30` }}
      >
        {/* Glow blob */}
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full blur-2xl pointer-events-none"
          style={{ background: lvl.color, opacity: 0.12 }} />

        <div className="relative flex items-center gap-4">
          {/* Big icon */}
          <motion.div
            animate={{ scale: [1, 1.06, 1], rotate: [0, 4, -4, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center text-4xl"
            style={{ background: `${lvl.color}18`, border: `1px solid ${lvl.color}35` }}
          >
            {lvl.icon}
          </motion.div>

          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black tracking-widest mb-0.5" style={{ color: `${lvl.color}99` }}>
              NÍVEL {level}
            </p>
            <p className="text-xl font-black leading-tight" style={{ color: lvl.color }}>{lvl.title}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <Star size={11} style={{ color: '#3fe56c' }} />
              <span className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.6)' }}>{points} pts</span>
              {streakDays > 0 && (
                <span className="text-xs font-bold" style={{ color: '#f97316' }}>🔥 {streakDays} dias</span>
              )}
            </div>
          </div>
        </div>

        {/* XP bar */}
        {nextLvl && (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Progresso para {nextLvl.icon} {nextLvl.title}
              </span>
              <span className="text-[10px] font-black" style={{ color: lvl.color }}>{prog}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${prog}%` }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                className="h-full rounded-full relative overflow-hidden"
                style={{ background: `linear-gradient(90deg, ${lvl.color}aa, ${lvl.color})` }}
              >
                {/* shimmer */}
                <motion.div
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                  className="absolute inset-0"
                  style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }}
                />
              </motion.div>
            </div>
            <p className="text-[9px] mt-1" style={{ color: 'rgba(255,255,255,0.25)' }}>
              Faltam {nextLvl.minPoints - points} pts
            </p>
          </div>
        )}

        {/* Nível máximo */}
        {!nextLvl && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: `${lvl.color}12`, border: `1px solid ${lvl.color}25` }}>
            <span className="text-base">👑</span>
            <p className="text-[11px] font-black" style={{ color: lvl.color }}>Nível máximo atingido!</p>
          </div>
        )}
      </motion.div>

      {/* ── Jornada de níveis ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-2xl p-4"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(0,200,83,0.12)' }}
      >
        <p className="text-[9px] font-black tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.25)' }}>
          JORNADA DE TÍTULOS
        </p>
        <div className="flex items-center justify-between gap-1">
          {LEVELS.map((lvlItem, i) => {
            const reached  = level >= lvlItem.level
            const isCurrent = level === lvlItem.level
            return (
              <div key={lvlItem.level} className="flex flex-col items-center gap-1.5 flex-1">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.15 + i * 0.07, type: 'spring', stiffness: 300, damping: 20 }}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-lg relative"
                  style={{
                    background: reached ? `${lvlItem.color}20` : 'rgba(255,255,255,0.04)',
                    border: `2px solid ${reached ? lvlItem.color : 'rgba(255,255,255,0.08)'}`,
                    opacity: reached ? 1 : 0.35,
                  }}
                >
                  {lvlItem.icon}
                  {isCurrent && (
                    <motion.div
                      animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 rounded-xl"
                      style={{ border: `2px solid ${lvlItem.color}`, background: 'transparent' }}
                    />
                  )}
                </motion.div>
                <p className="text-[8px] font-black text-center leading-tight"
                  style={{ color: reached ? lvlItem.color : 'rgba(255,255,255,0.2)' }}>
                  {lvlItem.title}
                </p>
                {/* connector line */}
                {i < LEVELS.length - 1 && (
                  <div className="absolute" />
                )}
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* ── Conquistas desbloqueadas ── */}
      {unlocked.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-[9px] font-black tracking-widest mb-3 px-1" style={{ color: 'rgba(255,255,255,0.25)' }}>
            CONQUISTAS DESBLOQUEADAS — {unlocked.length}/{ALL_ACHIEVEMENT_KEYS.length}
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {unlocked.map((key, i) => {
              const ach = ACHIEVEMENTS[key]
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.18 + i * 0.06, type: 'spring', stiffness: 280, damping: 22 }}
                  className="rounded-2xl p-3 relative overflow-hidden"
                  style={{ background: 'rgba(0,200,83,0.07)', border: '1px solid rgba(0,200,83,0.2)' }}
                >
                  {/* shimmer on unlock */}
                  <motion.div
                    initial={{ x: '-100%' }}
                    animate={{ x: '200%' }}
                    transition={{ duration: 0.8, delay: 0.3 + i * 0.06 }}
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: 'linear-gradient(90deg, transparent, rgba(63,229,108,0.15), transparent)' }}
                  />
                  <span className="text-2xl block mb-1.5 leading-none">{ach.emoji}</span>
                  <p className="text-[11px] font-black leading-tight" style={{ color: 'rgba(255,255,255,0.9)' }}>
                    {ach.label}
                  </p>
                  <p className="text-[9px] mt-0.5 leading-tight" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {ach.desc}
                  </p>
                  {getUnlockedAt(key) && (
                    <p className="text-[8px] mt-1.5 font-bold" style={{ color: '#3fe56c55' }}>
                      {getUnlockedAt(key)}
                    </p>
                  )}
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* ── Conquistas bloqueadas ── */}
      {locked.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.22 }}
        >
          <button
            onClick={() => setShowLocked(v => !v)}
            className="w-full flex items-center justify-between px-1 mb-3"
          >
            <p className="text-[9px] font-black tracking-widest" style={{ color: 'rgba(255,255,255,0.2)' }}>
              BLOQUEADAS — {locked.length} restantes
            </p>
            <span style={{ color: 'rgba(255,255,255,0.25)' }}>
              {showLocked ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </span>
          </button>

          <AnimatePresence>
            {showLocked && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-2 gap-2.5 overflow-hidden"
              >
                {locked.map((key, i) => {
                  const ach = ACHIEVEMENTS[key]
                  return (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.04 }}
                      className="rounded-2xl p-3 relative"
                      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
                    >
                      <div className="relative inline-block mb-1.5">
                        <span className="text-2xl leading-none" style={{ filter: 'grayscale(1)', opacity: 0.3 }}>
                          {ach.emoji}
                        </span>
                        <Lock size={10} className="absolute -bottom-0.5 -right-1"
                          style={{ color: 'rgba(255,255,255,0.25)' }} />
                      </div>
                      <p className="text-[11px] font-black leading-tight" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        {ach.label}
                      </p>
                      <p className="text-[9px] mt-0.5 leading-tight" style={{ color: 'rgba(255,255,255,0.15)' }}>
                        {ach.desc}
                      </p>
                    </motion.div>
                  )
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Estado vazio */}
      {unlocked.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="flex flex-col items-center gap-3 py-8"
        >
          <span className="text-5xl">🏅</span>
          <p className="text-sm font-bold text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Nenhuma conquista ainda
          </p>
          <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.18)' }}>
            Continue comparecendo e documentando atividades!
          </p>
        </motion.div>
      )}
    </div>
  )
}
