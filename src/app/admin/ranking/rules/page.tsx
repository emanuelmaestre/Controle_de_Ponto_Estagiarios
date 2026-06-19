import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { LEVELS, ACHIEVEMENTS, SCORING_RULES } from '@/lib/gamification'
import { FadeIn } from '@/components/ui/MotionWrappers'

export const dynamic = 'force-dynamic'

export default async function RankingRulesPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="flex flex-col flex-1 min-h-0" style={{ background: 'var(--bg)' }}>
      <FadeIn delay={0}>
        <header className="flex items-center gap-4 px-6 h-16 flex-shrink-0"
          style={{ background: 'var(--bg)', borderBottom: '1px solid rgba(0,200,83,0.15)' }}>
          <Link href="/admin/ranking"
            className="flex items-center justify-center w-9 h-9 rounded-lg transition-colors"
            style={{ background: 'var(--surface-card, #0f2318)', border: '1px solid rgba(0,200,83,0.15)', color: 'var(--text-3)' }}>
            <ArrowLeft size={16} />
          </Link>
          <div>
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>Ranking</p>
            <h2 className="text-base font-semibold leading-none" style={{ color: 'var(--text)' }}>Como funciona a pontuação</h2>
          </div>
        </header>
      </FadeIn>

      <div className="flex-1 min-h-0 overflow-y-auto p-6">
        <div style={{ maxWidth: 720, margin: '0 auto' }} className="space-y-6">

          <RulesContent />

        </div>
      </div>
    </div>
  )
}

function RulesContent() {
  return (
    <>
      {/* Intro */}
      <FadeIn delay={0.02}>
        <div className="rounded-xl px-5 py-4 flex items-center gap-3"
          style={{ background: 'rgba(0,200,83,0.05)', border: '1px solid rgba(0,200,83,0.18)' }}>
          <span className="text-2xl flex-shrink-0">🎯</span>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
            Quanto mais o estagiário <strong style={{ color: '#3fe56c' }}>registra, documenta e aparece</strong>, mais pontos ganha e mais alto sobe no ranking.
          </p>
        </div>
      </FadeIn>

      {/* O que gera pontos */}
      <FadeIn delay={0.05}>
        <section className="rounded-xl p-6"
          style={{ background: 'var(--surface-card, #0f2318)', border: '1px solid rgba(0,200,83,0.15)' }}>
          <p className="text-[10px] font-black tracking-widest mb-4" style={{ color: 'var(--text-3)' }}>O QUE GERA PONTOS</p>
          <div className="space-y-2">
            {SCORING_RULES.map(rule => {
              const isMulti = rule.points.startsWith('×')
              return (
                <div key={rule.id} className="rounded-xl overflow-hidden"
                  style={{
                    background: rule.id === 'photo' ? 'rgba(251,191,36,0.06)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${rule.id === 'photo' ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.07)'}`,
                  }}>
                  <div className="flex items-center gap-4 px-4 pt-3 pb-2">
                    <span className="text-2xl flex-shrink-0">{rule.emoji}</span>
                    <p className="flex-1 text-sm font-bold" style={{ color: rule.id === 'photo' ? '#fbbf24' : 'var(--text)' }}>
                      {rule.label}
                    </p>
                    <span className="text-sm font-black flex-shrink-0 px-2.5 py-1 rounded-lg"
                      style={{
                        background: isMulti ? 'rgba(249,115,22,0.1)' : 'rgba(63,229,108,0.1)',
                        color: isMulti ? '#f97316' : '#3fe56c',
                        border: `1px solid ${isMulti ? 'rgba(249,115,22,0.2)' : 'rgba(63,229,108,0.2)'}`,
                      }}>
                      {rule.points}
                    </span>
                  </div>
                  <div className="flex items-start gap-1.5 px-4 pb-3">
                    <ChevronRight size={12} className="mt-0.5 flex-shrink-0" style={{ color: '#3fe56c' }} />
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{rule.detail}</p>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-4 rounded-xl px-4 py-3"
            style={{ background: 'rgba(0,200,83,0.06)', border: '1px solid rgba(0,200,83,0.15)' }}>
            <p className="text-[11px] font-black mb-0.5" style={{ color: '#3fe56c' }}>💡 EXEMPLO PRÁTICO</p>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)', lineHeight: 1.7 }}>
              Entrou pontual + descreveu atividade + sequência de 7 dias →
              (10 + 5 + 5) × 1.5 = <strong style={{ color: '#fbbf24' }}>30 pts</strong> naquele dia.
            </p>
          </div>
        </section>
      </FadeIn>

      {/* Conquistas */}
      <FadeIn delay={0.09}>
        <section className="rounded-xl p-6"
          style={{ background: 'var(--surface-card, #0f2318)', border: '1px solid rgba(0,200,83,0.15)' }}>
          <p className="text-[10px] font-black tracking-widest mb-4" style={{ color: 'var(--text-3)' }}>
            CONQUISTAS — O QUE FAZER PARA DESBLOQUEAR
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(ACHIEVEMENTS).map(([key, ach]) => (
              <div key={key} className="rounded-xl overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-start gap-3 px-4 pt-3 pb-1.5">
                  <span className="text-2xl flex-shrink-0 leading-none mt-0.5">{ach.emoji}</span>
                  <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>{ach.label}</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{ach.desc}</p>
                  </div>
                </div>
                <div className="mx-4 mb-3 rounded-lg px-3 py-2 flex items-start gap-2"
                  style={{ background: 'rgba(63,229,108,0.05)', border: '1px solid rgba(63,229,108,0.12)' }}>
                  <span className="text-xs flex-shrink-0 mt-0.5">✅</span>
                  <p className="text-xs font-medium leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {ach.how}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </FadeIn>

      {/* Níveis */}
      <FadeIn delay={0.13}>
        <section className="rounded-xl p-6"
          style={{ background: 'var(--surface-card, #0f2318)', border: '1px solid rgba(0,200,83,0.15)' }}>
          <p className="text-[10px] font-black tracking-widest mb-4" style={{ color: 'var(--text-3)' }}>
            TÍTULOS — EVOLUA DE NÍVEL COM PONTOS
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {LEVELS.map(lvl => (
              <div key={lvl.level} className="flex items-center gap-3 rounded-xl px-4 py-3"
                style={{ background: `${lvl.color}0e`, border: `1px solid ${lvl.color}28` }}>
                <span className="text-2xl">{lvl.icon}</span>
                <div>
                  <p className="text-sm font-black" style={{ color: lvl.color }}>{lvl.title}</p>
                  <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {lvl.minPoints === 0 ? 'início' : `a partir de ${lvl.minPoints} pts`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </FadeIn>
    </>
  )
}
