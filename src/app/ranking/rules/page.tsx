'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { LEVELS, ACHIEVEMENTS, SCORING_RULES } from '@/lib/gamification'

export default function RankingRulesPage() {
  return (
    <div className="flex flex-col" style={{ height: '100dvh', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* Header */}
      <header className="flex-shrink-0 flex items-center gap-3 px-5 py-4"
        style={{ background: 'var(--nav-bg)', borderBottom: '1px solid rgba(0,200,83,0.12)' }}>
        <Link href="/intern-ranking"
          className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
          <ArrowLeft size={15} />
        </Link>
        <div>
          <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>Ranking</p>
          <h1 className="text-sm font-black" style={{ color: 'white' }}>Como pontuar</h1>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4">

        {/* O que pontua */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="rounded-xl p-4"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(0,200,83,0.15)' }}>
          <p className="text-[9px] font-black tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>O QUE GERA PONTOS</p>
          <div className="space-y-2">
            {SCORING_RULES.map((rule, i) => (
              <motion.div key={rule.id}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                style={{
                  background: rule.id === 'photo' ? 'rgba(251,191,36,0.08)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${rule.id === 'photo' ? 'rgba(251,191,36,0.25)' : 'rgba(255,255,255,0.06)'}`,
                }}>
                <span className="text-xl flex-shrink-0">{rule.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold" style={{ color: rule.id === 'photo' ? '#fbbf24' : 'rgba(255,255,255,0.85)' }}>
                    {rule.label}
                  </p>
                  <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{rule.detail}</p>
                </div>
                <span className="text-sm font-black flex-shrink-0"
                  style={{ color: rule.points.startsWith('×') ? '#f97316' : '#3fe56c' }}>
                  {rule.points}
                </span>
              </motion.div>
            ))}
          </div>
          <div className="mt-3 rounded-xl px-3 py-2.5 text-[11px]"
            style={{ background: 'rgba(0,200,83,0.06)', border: '1px solid rgba(0,200,83,0.15)', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7 }}>
            💡 <strong style={{ color: '#3fe56c' }}>Exemplo:</strong> Pontual + 7 dias seguidos → (10+5) × 1.5 = <strong style={{ color: '#fbbf24' }}>22 pts</strong>
          </div>
        </motion.section>

        {/* Níveis */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="rounded-xl p-4"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(0,200,83,0.15)' }}>
          <p className="text-[9px] font-black tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>NÍVEIS</p>
          <div className="grid grid-cols-2 gap-2">
            {LEVELS.map(lvl => (
              <div key={lvl.level} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5"
                style={{ background: `${lvl.color}0e`, border: `1px solid ${lvl.color}28` }}>
                <span className="text-xl">{lvl.icon}</span>
                <div>
                  <p className="text-[11px] font-black" style={{ color: lvl.color }}>{lvl.title}</p>
                  <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {lvl.minPoints === 0 ? 'início' : `${lvl.minPoints} pts`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Conquistas */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-xl p-4"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(0,200,83,0.15)' }}>
          <p className="text-[9px] font-black tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>CONQUISTAS</p>
          <div className="space-y-2">
            {Object.entries(ACHIEVEMENTS).map(([key, ach]) => (
              <div key={key} className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="text-xl flex-shrink-0">{ach.emoji}</span>
                <div>
                  <p className="text-[12px] font-bold" style={{ color: 'rgba(255,255,255,0.85)' }}>{ach.label}</p>
                  <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{ach.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        <div className="h-4" />
      </main>
    </div>
  )
}
