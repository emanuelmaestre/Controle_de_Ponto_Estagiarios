'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ACHIEVEMENTS } from '@/lib/gamification'

interface AchievementBurstProps {
  achievements: { type: string; unlocked_at: string }[]
  /** quantos mostrar antes do +N */
  visibleCount?: number
  /** tamanho mobile (menor) vs desktop */
  size?: 'sm' | 'md'
}

export default function AchievementBurst({
  achievements,
  visibleCount = 3,
  size = 'md',
}: AchievementBurstProps) {
  const [open, setOpen] = useState(false)

  const visible  = achievements.slice(0, visibleCount)
  const hidden   = achievements.slice(visibleCount)
  const hasMore  = hidden.length > 0
  const emojiSz  = size === 'sm' ? 'text-sm' : 'text-base'
  const labelSz  = size === 'sm' ? 'text-[8px]' : 'text-[10px]'

  return (
    <div className="relative flex items-center gap-0.5">
      {/* Always-visible achievements */}
      {visible.map((a, i) => (
        <motion.span
          key={a.type}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: i * 0.04, type: 'spring', stiffness: 300, damping: 20 }}
          className={`${emojiSz} leading-none cursor-default`}
          title={ACHIEVEMENTS[a.type]?.label ?? a.type}
        >
          {ACHIEVEMENTS[a.type]?.emoji ?? '🏅'}
        </motion.span>
      ))}

      {/* +N button */}
      {hasMore && (
        <motion.button
          onClick={e => { e.stopPropagation(); setOpen(v => !v) }}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          className={`${labelSz} font-black px-1.5 py-0.5 rounded-full leading-none transition-all select-none`}
          style={{
            background: open ? 'rgba(63,229,108,0.18)' : 'rgba(255,255,255,0.07)',
            color: open ? '#3fe56c' : 'rgba(255,255,255,0.4)',
            border: `1px solid ${open ? 'rgba(63,229,108,0.35)' : 'rgba(255,255,255,0.12)'}`,
          }}
          aria-label={open ? 'Ocultar conquistas' : `Ver mais ${hidden.length} conquistas`}
        >
          {open ? '−' : `+${hidden.length}`}
        </motion.button>
      )}

      {/* Burst panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.7, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7, y: 6 }}
            transition={{ type: 'spring', stiffness: 400, damping: 24 }}
            className="absolute z-50 bottom-full mb-2 right-0 rounded-2xl p-3 shadow-2xl"
            style={{
              background: '#0d2218',
              border: '1px solid rgba(63,229,108,0.25)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(63,229,108,0.1)',
              minWidth: 160,
            }}
          >
            {/* Arrow */}
            <div className="absolute -bottom-1.5 right-4 w-3 h-3 rotate-45"
              style={{ background: '#0d2218', border: '1px solid rgba(63,229,108,0.25)', borderTop: 'none', borderLeft: 'none' }} />

            <p className="text-[8px] font-black tracking-widest mb-2.5"
              style={{ color: 'rgba(255,255,255,0.25)' }}>
              CONQUISTAS DESBLOQUEADAS
            </p>

            <div className="space-y-1.5">
              {hidden.map((a, i) => {
                const ach = ACHIEVEMENTS[a.type]
                return (
                  <motion.div
                    key={a.type}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-2"
                  >
                    <span className="text-lg leading-none flex-shrink-0">{ach?.emoji ?? '🏅'}</span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold leading-tight truncate"
                        style={{ color: 'rgba(255,255,255,0.85)' }}>
                        {ach?.label ?? a.type}
                      </p>
                      {ach?.desc && (
                        <p className="text-[9px] leading-tight truncate"
                          style={{ color: 'rgba(255,255,255,0.3)' }}>
                          {ach.desc}
                        </p>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
