'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { LEVELS, ACHIEVEMENTS, SCORING_RULES } from '@/lib/gamification'

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 14 } as const,
  animate: { opacity: 1, y: 0 } as const,
  transition: { duration: 0.35, delay, ease: [0.16, 1, 0.3, 1] as const },
})

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
      <main className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-5">

        {/* Intro */}
        <motion.div {...fadeUp(0.03)}
          className="rounded-2xl px-4 py-3 flex items-center gap-3"
          style={{ background: 'rgba(0,200,83,0.06)', border: '1px solid rgba(0,200,83,0.18)' }}>
          <span className="text-2xl flex-shrink-0">🎯</span>
          <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Quanto mais você <strong style={{ color: '#3fe56c' }}>registra, documenta e aparece</strong>, mais pontos você ganha e mais alto sobe no ranking.
          </p>
        </motion.div>

        {/* O que gera pontos */}
        <motion.section {...fadeUp(0.07)}>
          <p className="text-[9px] font-black tracking-widest mb-3 px-1" style={{ color: 'rgba(255,255,255,0.25)' }}>
            O QUE GERA PONTOS
          </p>
          <div className="space-y-2">
            {SCORING_RULES.map((rule, i) => {
              const isMulti = rule.points.startsWith('×')
              return (
                <motion.div key={rule.id}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: rule.id === 'photo' ? 'rgba(251,191,36,0.07)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${rule.id === 'photo' ? 'rgba(251,191,36,0.22)' : 'rgba(255,255,255,0.07)'}`,
                  }}>
                  <div className="flex items-center gap-3 px-3 pt-3 pb-1.5">
                    <span className="text-xl flex-shrink-0">{rule.emoji}</span>
                    <p className="flex-1 text-[12px] font-black" style={{ color: rule.id === 'photo' ? '#fbbf24' : 'rgba(255,255,255,0.9)' }}>
                      {rule.label}
                    </p>
                    <span className="text-sm font-black flex-shrink-0 px-2 py-0.5 rounded-lg"
                      style={{
                        background: isMulti ? 'rgba(249,115,22,0.12)' : 'rgba(63,229,108,0.12)',
                        color: isMulti ? '#f97316' : '#3fe56c',
                        border: `1px solid ${isMulti ? 'rgba(249,115,22,0.25)' : 'rgba(63,229,108,0.25)'}`,
                      }}>
                      {rule.points}
                    </span>
                  </div>
                  <div className="flex items-start gap-1.5 px-3 pb-3">
                    <ChevronRight size={11} className="mt-0.5 flex-shrink-0" style={{ color: '#3fe56c' }} />
                    <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{rule.detail}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Exemplo */}
          <div className="mt-3 rounded-2xl px-3 py-3"
            style={{ background: 'rgba(0,200,83,0.05)', border: '1px solid rgba(0,200,83,0.15)' }}>
            <p className="text-[10px] font-black mb-1" style={{ color: '#3fe56c' }}>💡 EXEMPLO DO DIA</p>
            <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Entrou pontual + descreveu atividade + está na 7ª sequência:
            </p>
            <p className="text-[13px] font-black mt-1" style={{ color: '#fbbf24' }}>
              (10 + 5 + 5) × 1.5 = 30 pts em 1 dia
            </p>
          </div>
        </motion.section>

        {/* Conquistas */}
        <motion.section {...fadeUp(0.15)}>
          <p className="text-[9px] font-black tracking-widest mb-3 px-1" style={{ color: 'rgba(255,255,255,0.25)' }}>
            CONQUISTAS — O QUE FAZER PARA DESBLOQUEAR
          </p>
          <div className="space-y-2">
            {Object.entries(ACHIEVEMENTS).map(([key, ach], i) => (
              <motion.div key={key}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.18 + i * 0.04 }}
                className="rounded-2xl overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-start gap-3 px-3 pt-3 pb-1.5">
                  <span className="text-2xl flex-shrink-0 leading-none mt-0.5">{ach.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-black" style={{ color: 'rgba(255,255,255,0.88)' }}>{ach.label}</p>
                    <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{ach.desc}</p>
                  </div>
                </div>
                <div className="mx-3 mb-3 rounded-xl px-3 py-2 flex items-start gap-2"
                  style={{ background: 'rgba(63,229,108,0.05)', border: '1px solid rgba(63,229,108,0.12)' }}>
                  <span className="text-[11px] flex-shrink-0">✅</span>
                  <p className="text-[10px] font-bold leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {ach.how}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Níveis */}
        <motion.section {...fadeUp(0.25)}>
          <p className="text-[9px] font-black tracking-widest mb-3 px-1" style={{ color: 'rgba(255,255,255,0.25)' }}>
            TÍTULOS — EVOLUA DE NÍVEL COM PONTOS
          </p>
          <div className="grid grid-cols-2 gap-2">
            {LEVELS.map((lvl, i) => (
              <motion.div key={lvl.level}
                initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.28 + i * 0.05, type: 'spring', stiffness: 280, damping: 22 }}
                className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5"
                style={{ background: `${lvl.color}0d`, border: `1px solid ${lvl.color}25` }}>
                <span className="text-xl">{lvl.icon}</span>
                <div>
                  <p className="text-[11px] font-black" style={{ color: lvl.color }}>
                    {lvl.titleM === lvl.titleF ? lvl.titleM : `${lvl.titleM} / ${lvl.titleF}`}
                  </p>
                  <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    {lvl.minPoints === 0 ? 'começo' : `a partir de ${lvl.minPoints} pts`}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <div className="h-4" />
      </main>
    </div>
  )
}
