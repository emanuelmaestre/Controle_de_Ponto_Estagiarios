'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { X, ChevronRight, ChevronLeft, CheckCircle, Home, ClipboardList, Trophy, User, Star, Clock, Zap } from 'lucide-react'

// ── Slides de apresentação ───────────────────────────────────
const SLIDES = [
  {
    icon: <Zap size={52} strokeWidth={1.5} />,
    color: '#3fe56c',
    title: 'Bem-vindo ao ChronosLab!',
    description: 'Seu sistema de controle de presença no laboratório. Rápido, simples e gamificado.',
  },
  {
    icon: <Clock size={52} strokeWidth={1.5} />,
    color: '#3fe56c',
    title: 'Registre sua Presença',
    description: 'Na tela Início, registre sua entrada e saída do laboratório com um toque. Sua localização é verificada automaticamente.',
  },
  {
    icon: <ClipboardList size={52} strokeWidth={1.5} />,
    color: '#60a5fa',
    title: 'Histórico',
    description: 'Acompanhe todos os seus registros de ponto, horas cumpridas e sessões aprovadas por mês.',
  },
  {
    icon: <Trophy size={52} strokeWidth={1.5} />,
    color: '#fbbf24',
    title: 'Ranking',
    description: 'Veja como você se compara com os outros estagiários. Quanto mais você vem, mais pontos acumula e sobe no ranking!',
  },
  {
    icon: <Star size={52} strokeWidth={1.5} />,
    color: '#f97316',
    title: 'Gamificação',
    description: 'Ganhe pontos, suba de nível e desbloqueie conquistas conforme comparece ao laboratório. Cada presença conta!',
  },
  {
    icon: <User size={52} strokeWidth={1.5} />,
    color: '#a78bfa',
    title: 'Seu Perfil',
    description: 'Atualize seus dados, veja suas conquistas e baixe relatórios de frequência diretamente pelo app.',
  },
]

// ── Passos do tour interativo (tooltips) ────────────────────
interface Step {
  target: string
  title: string
  description: string
  position: 'top' | 'bottom' | 'center'
}

const STEPS: Step[] = [
  {
    target: 'tour-header',
    title: 'Seu painel pessoal',
    description: 'Aqui você vê seu nome, data, hora atual e pode sair da conta.',
    position: 'bottom',
  },
  {
    target: 'tour-progress',
    title: 'Progresso Mensal',
    description: 'Acompanhe quantas horas você já cumpriu no mês e quanto falta para atingir sua meta.',
    position: 'bottom',
  },
  {
    target: 'tour-stats',
    title: 'Suas Estatísticas',
    description: 'Veja suas horas de hoje e o total de sessões aprovadas no mês. Atualiza em tempo real!',
    position: 'bottom',
  },
  {
    target: 'tour-gamification',
    title: 'Nível e Pontos',
    description: 'Seu nível atual, pontos acumulados e conquistas desbloqueadas. Toque para ver o ranking completo.',
    position: 'bottom',
  },
  {
    target: 'tour-clock',
    title: 'Registrar Ponto',
    description: 'Este é o botão mais importante! Toque para registrar sua entrada e saída do laboratório.',
    position: 'top',
  },
  {
    target: 'tour-nav',
    title: 'Navegação',
    description: 'Acesse Histórico, Ranking, Perfil e outras seções por aqui a qualquer momento.',
    position: 'top',
  },
]

interface Rect { top: number; left: number; width: number; height: number }

const PADDING = 10
const TOOLTIP_OFFSET = 16

function getLocalKey(userId: string) { return `onboarding_done_${userId}` }

// ── Componente principal ─────────────────────────────────────
export default function OnboardingTour({ userId }: { userId: string }) {
  const [phase, setPhase]         = useState<'hidden' | 'slides' | 'tour'>('hidden')
  const [slide, setSlide]         = useState(0)
  const [step, setStep]           = useState(0)
  const [targetRect, setTargetRect] = useState<Rect | null>(null)
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({})
  const [arrowStyle, setArrowStyle]     = useState<React.CSSProperties>({})
  const [slideDir, setSlideDir]   = useState<'left' | 'right'>('right')
  const touchStartX = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)

  // Check localStorage on mount
  useEffect(() => {
    const done = localStorage.getItem(getLocalKey(userId))
    if (!done) {
      const t = setTimeout(() => setPhase('slides'), 500)
      return () => clearTimeout(t)
    }
  }, [userId])

  // ── Slides: swipe support ────────────────────────────────
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(dx) < 40) return
    if (dx < 0 && slide < SLIDES.length - 1) { setSlideDir('right'); setSlide(s => s + 1) }
    if (dx > 0 && slide > 0)                 { setSlideDir('left');  setSlide(s => s - 1) }
  }

  const nextSlide = () => {
    if (slide < SLIDES.length - 1) { setSlideDir('right'); setSlide(s => s + 1) }
    else startTour()
  }
  const prevSlide = () => {
    if (slide > 0) { setSlideDir('left'); setSlide(s => s - 1) }
  }

  const startTour = () => {
    setStep(0)
    setPhase('tour')
  }

  const finish = useCallback(() => {
    localStorage.setItem(getLocalKey(userId), '1')
    setPhase('hidden')
  }, [userId])

  // ── Tour: measure target element ─────────────────────────
  const measureTarget = useCallback((stepIndex: number) => {
    const target = STEPS[stepIndex]?.target
    if (!target) return
    const el = document.querySelector(`[data-tour="${target}"]`) as HTMLElement | null
    if (!el) return

    const r = el.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight

    const rect: Rect = {
      top:    r.top    - PADDING,
      left:   r.left   - PADDING,
      width:  r.width  + PADDING * 2,
      height: r.height + PADDING * 2,
    }
    setTargetRect(rect)

    const tooltipW = Math.min(300, vw - 32)
    const pos = STEPS[stepIndex].position
    let top: number

    const belowTop  = rect.top + rect.height + TOOLTIP_OFFSET
    const aboveTop  = rect.top - TOOLTIP_OFFSET - 170

    if (pos === 'bottom') top = belowTop + 170 > vh ? aboveTop : belowTop
    else if (pos === 'top') top = aboveTop < 8 ? belowTop : aboveTop
    else top = vh / 2 - 85

    let left = rect.left + rect.width / 2 - tooltipW / 2
    left = Math.max(16, Math.min(left, vw - tooltipW - 16))

    const arrowLeft = Math.max(16, Math.min(rect.left + rect.width / 2 - left - 8, tooltipW - 32))
    const isAbove   = top < rect.top

    setTooltipStyle({ top, left, width: tooltipW })
    setArrowStyle({
      left: arrowLeft,
      ...(isAbove
        ? { bottom: -8, borderTop: '8px solid rgba(15,35,24,0.97)', borderBottom: 'none' }
        : { top:    -8, borderBottom: '8px solid rgba(15,35,24,0.97)', borderTop: 'none' }),
    })
  }, [])

  useEffect(() => {
    if (phase !== 'tour') return
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => measureTarget(step))
  }, [phase, step, measureTarget])

  useEffect(() => {
    if (phase !== 'tour') return
    const target = STEPS[step]?.target
    const el = document.querySelector(`[data-tour="${target}"]`) as HTMLElement | null
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      const t = setTimeout(() => measureTarget(step), 350)
      return () => clearTimeout(t)
    }
  }, [phase, step, measureTarget])

  const nextStep = useCallback(() => {
    if (step < STEPS.length - 1) setStep(s => s + 1)
    else finish()
  }, [step, finish])

  const prevStep = useCallback(() => {
    if (step > 0) setStep(s => s - 1)
  }, [step])

  if (phase === 'hidden') return null

  // ════════════════════════════════════════════════════════════
  // FASE 1 — SLIDES
  // ════════════════════════════════════════════════════════════
  if (phase === 'slides') {
    const s = SLIDES[slide]
    const isLast = slide === SLIDES.length - 1

    return (
      <div
        className="fixed inset-0 z-[9999] flex flex-col"
        style={{ background: 'rgba(5,15,10,0.97)', backdropFilter: 'blur(8px)' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Skip */}
        <div className="flex-shrink-0 flex justify-end px-5 pt-5">
          <button
            onClick={finish}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold"
            style={{ color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <X size={13} /> Pular
          </button>
        </div>

        {/* Slide content */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          {/* Icon */}
          <div
            className="w-24 h-24 rounded-3xl flex items-center justify-center mb-8"
            style={{ background: `${s.color}15`, border: `1px solid ${s.color}30`, color: s.color }}
          >
            {s.icon}
          </div>

          {/* Text */}
          <h2 className="text-2xl font-black leading-tight mb-4" style={{ color: 'white' }}>
            {s.title}
          </h2>
          <p className="text-sm leading-relaxed max-w-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
            {s.description}
          </p>
        </div>

        {/* Bottom controls */}
        <div className="flex-shrink-0 px-6 pb-10 space-y-5">
          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2">
            {SLIDES.map((_, i) => (
              <button key={i} onClick={() => setSlide(i)}>
                <div
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: i === slide ? 24 : 7,
                    height: 7,
                    background: i === slide ? s.color : 'rgba(255,255,255,0.15)',
                  }}
                />
              </button>
            ))}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3">
            {slide > 0 && (
              <button
                onClick={prevSlide}
                className="flex items-center gap-1 px-4 py-3 rounded-2xl text-sm font-bold"
                style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <ChevronLeft size={16} />
              </button>
            )}
            <button
              onClick={nextSlide}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-black transition-all"
              style={{ background: s.color, color: '#051a0a' }}
            >
              {isLast ? (
                <><CheckCircle size={16} /> Começar tour!</>
              ) : (
                <>Próximo <ChevronRight size={16} /></>
              )}
            </button>
          </div>

          <p className="text-center text-[11px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
            Deslize para navegar entre os slides
          </p>
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════════════════════════
  // FASE 2 — TOUR INTERATIVO (tooltips)
  // ════════════════════════════════════════════════════════════
  if (!targetRect) return null

  const isLast = step === STEPS.length - 1
  const currentStep = STEPS[step]

  return (
    <>
      {/* Overlay com spotlight */}
      <div
        className="fixed inset-0 z-[9990] pointer-events-none"
        style={{
          background: 'rgba(0,0,0,0.72)',
          clipPath: `polygon(
            0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%,
            ${targetRect.left}px ${targetRect.top}px,
            ${targetRect.left}px ${targetRect.top + targetRect.height}px,
            ${targetRect.left + targetRect.width}px ${targetRect.top + targetRect.height}px,
            ${targetRect.left + targetRect.width}px ${targetRect.top}px,
            ${targetRect.left}px ${targetRect.top}px
          )`,
        }}
      />

      {/* Borda verde no spotlight */}
      <div
        className="fixed pointer-events-none z-[9991]"
        style={{
          top: targetRect.top, left: targetRect.left,
          width: targetRect.width, height: targetRect.height,
          borderRadius: 16,
          border: '2px solid #3fe56c',
          boxShadow: '0 0 0 2px rgba(63,229,108,0.12), 0 0 20px rgba(63,229,108,0.18)',
          transition: 'all 0.3s ease',
        }}
      />

      {/* Bloqueador de cliques */}
      <div className="fixed inset-0 z-[9992]" onClick={e => e.stopPropagation()} />

      {/* Tooltip */}
      <div className="fixed z-[9999] pointer-events-auto" style={{ ...tooltipStyle, transition: 'top 0.3s ease, left 0.3s ease' }}>
        {/* Seta */}
        <div
          className="absolute w-0 h-0"
          style={{ ...arrowStyle, borderLeft: '8px solid transparent', borderRight: '8px solid transparent', transition: 'left 0.3s ease' }}
        />

        {/* Card */}
        <div className="rounded-2xl p-4 shadow-2xl" style={{ background: 'rgba(15,35,24,0.97)', border: '1px solid rgba(63,229,108,0.25)', backdropFilter: 'blur(12px)' }}>
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(63,229,108,0.15)', color: '#3fe56c' }}>
                {step + 1}/{STEPS.length}
              </span>
              <p className="text-sm font-black mt-1 leading-tight" style={{ color: 'white' }}>
                {currentStep.title}
              </p>
            </div>
            <button onClick={finish} className="flex-shrink-0 p-1 rounded-lg" style={{ color: 'rgba(255,255,255,0.4)' }}>
              <X size={16} />
            </button>
          </div>

          <p className="text-xs leading-relaxed mb-3" style={{ color: 'rgba(255,255,255,0.7)' }}>
            {currentStep.description}
          </p>

          {/* Dots */}
          <div className="flex items-center justify-center gap-1.5 mb-3">
            {STEPS.map((_, i) => (
              <div key={i} className="rounded-full transition-all duration-300"
                style={{ width: i === step ? 16 : 6, height: 6, background: i === step ? '#3fe56c' : 'rgba(255,255,255,0.15)' }} />
            ))}
          </div>

          {/* Botões */}
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button onClick={prevStep} className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <ChevronLeft size={14} /> Voltar
              </button>
            )}
            <button onClick={nextStep} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-black"
              style={{ background: '#3fe56c', color: '#0a1f0f' }}>
              {isLast ? <><CheckCircle size={14} /> Pronto!</> : <>Próximo <ChevronRight size={14} /></>}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
