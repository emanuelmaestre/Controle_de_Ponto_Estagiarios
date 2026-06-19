'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Info } from 'lucide-react'
import { useState } from 'react'
import { LEVELS, ACHIEVEMENTS, SCORING_RULES } from '@/lib/gamification'

export function GamificationRulesButton({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg transition-all hover:opacity-80"
        style={compact
          ? { padding: '4px 10px', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.1)' }
          : { padding: '6px 14px', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.12)' }
        }
      >
        <Info size={compact ? 11 : 13} />
        {compact ? 'Regras' : 'Como pontuar'}
      </button>

      <GamificationRulesModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}

export function GamificationRulesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            className="fixed z-50 overflow-y-auto"
            style={{
              inset: '0 0 0 0',
              margin: 'auto',
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'min(560px, calc(100vw - 24px))',
              maxHeight: 'calc(100vh - 48px)',
              background: '#0b1d12',
              border: '1px solid rgba(0,200,83,0.2)',
              borderRadius: 20,
              padding: '28px 24px 32px',
              position: 'fixed',
            }}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-lg font-black" style={{ color: '#3fe56c' }}>Como funciona a pontuação</h2>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Tudo que gera pontos e como subir de nível
                </p>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:opacity-70 transition-opacity"
                style={{ color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <X size={15} />
              </button>
            </div>

            {/* ── Seção 1: O que pontua ── */}
            <Section title="O que gera pontos">
              <div className="space-y-2">
                {SCORING_RULES.map(rule => (
                  <RuleRow key={rule.id}
                    emoji={rule.emoji}
                    label={rule.label}
                    points={rule.points}
                    detail={rule.detail}
                    highlight={rule.id === 'photo'}
                  />
                ))}
              </div>

              <div className="mt-3 rounded-xl px-4 py-3 text-xs" style={{ background: 'rgba(0,200,83,0.06)', border: '1px solid rgba(0,200,83,0.15)', color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>
                💡 <strong style={{ color: '#3fe56c' }}>Exemplo:</strong> Entrou pontual com streak de 7 dias →{' '}
                (10 + 5) × 1.5 = <strong style={{ color: '#fbbf24' }}>22 pts</strong> naquele dia
              </div>
            </Section>

            {/* ── Seção 2: Níveis ── */}
            <Section title="Níveis">
              <div className="grid grid-cols-2 gap-2">
                {LEVELS.map(lvl => (
                  <div key={lvl.level} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5"
                    style={{ background: `${lvl.color}0e`, border: `1px solid ${lvl.color}28` }}>
                    <span className="text-base leading-none">{lvl.icon}</span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-black truncate" style={{ color: lvl.color }}>
                        {lvl.titleM === lvl.titleF ? lvl.titleM : `${lvl.titleM} / ${lvl.titleF}`}
                      </p>
                      <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        {lvl.minPoints === 0 ? 'início' : `a partir de ${lvl.minPoints} pts`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {/* ── Seção 3: Conquistas ── */}
            <Section title="Conquistas" last>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(ACHIEVEMENTS).map(([key, ach]) => (
                  <div key={key} className="flex items-start gap-2 rounded-xl px-3 py-2.5"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <span className="text-base leading-none mt-0.5">{ach.emoji}</span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold truncate" style={{ color: 'rgba(255,255,255,0.8)' }}>{ach.label}</p>
                      <p className="text-[10px] leading-snug" style={{ color: 'rgba(255,255,255,0.35)' }}>{ach.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function Section({ title, children, last }: { title: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div className={last ? '' : 'mb-6'}>
      <p className="text-[10px] font-black tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>
        {title.toUpperCase()}
      </p>
      {children}
    </div>
  )
}

function RuleRow({ emoji, label, points, detail, highlight }: {
  emoji: string; label: string; points: string; detail: string; highlight?: boolean
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl px-3 py-2.5"
      style={{
        background: highlight ? 'rgba(251,191,36,0.06)' : 'rgba(255,255,255,0.03)',
        border: highlight ? '1px solid rgba(251,191,36,0.2)' : '1px solid rgba(255,255,255,0.07)',
      }}>
      <span className="text-base leading-none w-6 text-center flex-shrink-0">{emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-bold" style={{ color: highlight ? '#fbbf24' : 'rgba(255,255,255,0.8)' }}>{label}</p>
        <p className="text-[10px] leading-snug" style={{ color: 'rgba(255,255,255,0.35)' }}>{detail}</p>
      </div>
      <span className="text-[12px] font-black flex-shrink-0"
        style={{ color: points.startsWith('×') ? '#f97316' : '#3fe56c' }}>
        {points}
      </span>
    </div>
  )
}
