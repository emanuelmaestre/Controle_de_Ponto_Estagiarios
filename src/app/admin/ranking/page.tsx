'use client'

import { motion } from 'framer-motion'
import { Trophy, Star, Zap, Lock } from 'lucide-react'

const PODIUM = [
  { pos: 2, label: '2º', height: 80,  color: '#94a3b8', glow: 'rgba(148,163,184,0.15)' },
  { pos: 1, label: '1º', height: 120, color: '#fbbf24', glow: 'rgba(251,191,36,0.20)'  },
  { pos: 3, label: '3º', height: 60,  color: '#f97316', glow: 'rgba(249,115,22,0.15)'  },
]

export default function RankingPage() {
  return (
    <div className="flex flex-col flex-1 min-h-0" style={{ background: 'var(--bg)' }}>

      {/* Header */}
      <header className="flex items-center gap-4 px-4 sm:px-6 h-14 sm:h-16 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(0,200,83,0.15)', background: 'var(--bg)' }}>
        <Trophy size={20} style={{ color: '#fbbf24' }} />
        <h2 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>Ranking</h2>
        <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider"
          style={{ background: 'rgba(251,191,36,0.10)', border: '1px solid rgba(251,191,36,0.25)', color: '#fbbf24' }}>
          EM BREVE
        </span>
      </header>

      {/* Main */}
      <main className="flex-1 overflow-y-auto flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg text-center">

          {/* Animated podium illustration */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-end justify-center gap-3 mb-12"
          >
            {PODIUM.map((p, i) => (
              <motion.div key={p.pos}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.12, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center gap-2"
              >
                {/* Avatar placeholder */}
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 2.5 + i * 0.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: p.glow, border: `2px solid ${p.color}`, color: p.color }}
                >
                  {p.pos === 1 ? <Trophy size={16} /> : <Star size={14} />}
                </motion.div>

                {/* Bar */}
                <motion.div
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="w-20 rounded-t-xl flex items-center justify-center font-black text-lg"
                  style={{
                    height: p.height,
                    background: `linear-gradient(180deg, ${p.glow} 0%, transparent 100%)`,
                    border: `1px solid ${p.color}`,
                    borderBottom: 'none',
                    color: p.color,
                    transformOrigin: 'bottom',
                  }}
                >
                  {p.label}
                </motion.div>
              </motion.div>
            ))}
          </motion.div>

          {/* Lock icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ background: 'rgba(0,200,83,0.08)', border: '1px solid rgba(0,200,83,0.20)' }}
          >
            <Lock size={28} style={{ color: '#3fe56c' }} />
          </motion.div>

          {/* Text */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
            className="text-2xl font-black mb-3" style={{ color: 'var(--text)' }}
          >
            Módulo em construção
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
            className="text-sm leading-relaxed mb-8" style={{ color: 'var(--text-3)', maxWidth: 340, margin: '0 auto 2rem' }}
          >
            Em breve você poderá acompanhar o ranking de desempenho dos estagiários com base em horas cumpridas, presença e sessões aprovadas.
          </motion.p>

          {/* Coming soon features */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-8"
          >
            {[
              { icon: <Trophy size={18} />, label: 'Top estagiários', desc: 'Por horas cumpridas no mês' },
              { icon: <Star size={18} />,   label: 'Pontuação',        desc: 'Sistema de pontos por presença' },
              { icon: <Zap size={18} />,    label: 'Conquistas',       desc: 'Badges e metas atingidas' },
            ].map((f, i) => (
              <motion.div key={f.label}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 + i * 0.08 }}
                className="rounded-xl p-4 text-left"
                style={{ background: 'var(--surface-card, #0f2318)', border: '1px solid rgba(0,200,83,0.12)' }}
              >
                <div className="mb-2" style={{ color: '#3fe56c' }}>{f.icon}</div>
                <p className="text-sm font-bold mb-0.5" style={{ color: 'var(--text)' }}>{f.label}</p>
                <p className="text-[11px]" style={{ color: 'var(--text-3)' }}>{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </main>
    </div>
  )
}
