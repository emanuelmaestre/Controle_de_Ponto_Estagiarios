'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Home, ClipboardList, Trophy, LogOut, Star, Zap, Lock, User } from 'lucide-react'

const PODIUM = [
  { pos: 2, label: '2º', height: 72,  color: '#94a3b8', glow: 'rgba(148,163,184,0.15)' },
  { pos: 1, label: '1º', height: 108, color: '#fbbf24', glow: 'rgba(251,191,36,0.20)'  },
  { pos: 3, label: '3º', height: 52,  color: '#f97316', glow: 'rgba(249,115,22,0.15)'  },
]

export default function InternRankingContent() {
  return (
    <div className="flex flex-col" style={{ height: '100dvh', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* Header */}
      <header className="flex-shrink-0 flex items-center gap-3 px-5 py-4"
        style={{ background: 'var(--nav-bg)', borderBottom: '1px solid rgba(0,200,83,0.12)' }}>
        <Trophy size={18} style={{ color: '#fbbf24' }} />
        <h1 className="text-base font-black" style={{ color: 'white' }}>Ranking</h1>
        <span className="ml-1 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider"
          style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.25)', color: '#fbbf24' }}>
          EM BREVE
        </span>
      </header>

      {/* Content */}
      <main className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center justify-center px-5 py-8">
        <div className="w-full max-w-sm text-center">

          {/* Podium */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-end justify-center gap-2 mb-10"
          >
            {PODIUM.map((p, i) => (
              <motion.div key={p.pos}
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.1 }}
                className="flex flex-col items-center gap-2"
              >
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 2.5 + i * 0.4, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: p.glow, border: `2px solid ${p.color}`, color: p.color }}
                >
                  {p.pos === 1 ? <Trophy size={14} /> : <Star size={12} />}
                </motion.div>
                <motion.div
                  initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                  className="w-16 rounded-t-xl flex items-center justify-center font-black"
                  style={{
                    height: p.height,
                    background: `linear-gradient(180deg, ${p.glow} 0%, transparent 100%)`,
                    border: `1px solid ${p.color}`,
                    borderBottom: 'none',
                    color: p.color,
                    transformOrigin: 'bottom',
                    fontSize: '1rem',
                  }}
                >
                  {p.label}
                </motion.div>
              </motion.div>
            ))}
          </motion.div>

          {/* Lock */}
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: 'rgba(0,200,83,0.08)', border: '1px solid rgba(0,200,83,0.20)' }}
          >
            <Lock size={24} style={{ color: '#3fe56c' }} />
          </motion.div>

          <motion.h2 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="text-xl font-black mb-2" style={{ color: 'white' }}>
            Em construção
          </motion.h2>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            className="text-sm leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Em breve você poderá ver seu desempenho comparado aos outros estagiários do laboratório.
          </motion.p>

          {/* Features preview */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
            className="space-y-3">
            {[
              { icon: <Trophy size={15} />, label: 'Top do mês', desc: 'Quem mais horas cumpriu' },
              { icon: <Star size={15} />,   label: 'Pontuação',  desc: 'Presença e aprovações' },
              { icon: <Zap size={15} />,    label: 'Conquistas', desc: 'Badges por metas' },
            ].map((f, i) => (
              <motion.div key={f.label}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.75 + i * 0.07 }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-left"
                style={{ background: 'var(--surface-card, #0f2318)', border: '1px solid rgba(0,200,83,0.10)' }}
              >
                <span style={{ color: '#fbbf24' }}>{f.icon}</span>
                <div>
                  <p className="text-sm font-bold" style={{ color: 'white' }}>{f.label}</p>
                  <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
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
