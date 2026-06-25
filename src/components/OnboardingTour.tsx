'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { X, ChevronRight, ChevronLeft, CheckCircle } from 'lucide-react'

interface Step {
  target: string
  title: string
  description: string
  position: 'top' | 'bottom' | 'center'
}

const STEPS: Step[] = [
  {
    target: 'tour-header',
    title: 'Bem-vindo ao ChronosLab!',
    description: 'Este é o seu painel pessoal. Aqui você controla sua presença e acompanha seu desempenho no laboratório.',
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
    title: 'Gamificação',
    description: 'Ganhe pontos ao comparecer ao laboratório, suba de nível e colecione conquistas! Quanto mais você vem, mais avança.',
    position: 'bottom',
  },
  {
    target: 'tour-clock',
    title: 'Registrar Ponto',
    description: 'Este é o botão mais importante! Toque para registrar sua entrada e saída do laboratório. Sua localização é verificada automaticamente.',
    position: 'top',
  },
  {
    target: 'tour-nav',
    title: 'Navegação',
    description: 'Acesse seu Histórico de registros, o Ranking de estagiários e seu Perfil por aqui.',
    position: 'top',
  },
]

interface Rect {
  top: number
  left: number
  width: number
  height: number
}

const PADDING = 10
const TOOLTIP_OFFSET = 16

function getLocalKey(userId: string) {
  return `onboarding_done_${userId}`
}

export default function OnboardingTour({ userId }: { userId: string }) {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)
  const [targetRect, setTargetRect] = useState<Rect | null>(null)
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({})
  const [arrowStyle, setArrowStyle] = useState<React.CSSProperties>({})
  const rafRef = useRef<number | null>(null)

  const measureTarget = useCallback((stepIndex: number) => {
    const target = STEPS[stepIndex]?.target
    if (!target) return
    const el = document.querySelector(`[data-tour="${target}"]`) as HTMLElement | null
    if (!el) return

    const r = el.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight

    const rect: Rect = {
      top: r.top - PADDING,
      left: r.left - PADDING,
      width: r.width + PADDING * 2,
      height: r.height + PADDING * 2,
    }
    setTargetRect(rect)

    // Tooltip width capped to screen
    const tooltipW = Math.min(300, vw - 32)

    const pos = STEPS[stepIndex].position
    let top: number
    let arrowTop: string | undefined
    let arrowBottom: string | undefined
    let arrowBorderTop: string | undefined
    let arrowBorderBottom: string | undefined

    if (pos === 'bottom') {
      top = rect.top + rect.height + TOOLTIP_OFFSET
      // If it goes off screen, flip to top
      if (top + 160 > vh) {
        top = rect.top - TOOLTIP_OFFSET - 160
      }
      arrowBottom = undefined
      arrowTop = undefined
      arrowBorderBottom = '8px solid rgba(15,35,24,0.97)'
      arrowBorderTop = 'none'
    } else if (pos === 'top') {
      top = rect.top - TOOLTIP_OFFSET - 160
      if (top < 8) top = rect.top + rect.height + TOOLTIP_OFFSET
      arrowBorderTop = '8px solid rgba(15,35,24,0.97)'
      arrowBorderBottom = 'none'
    } else {
      top = vh / 2 - 80
      arrowBorderBottom = 'none'
      arrowBorderTop = 'none'
    }

    // Horizontal: center over target, clamp to screen
    let left = rect.left + rect.width / 2 - tooltipW / 2
    left = Math.max(16, Math.min(left, vw - tooltipW - 16))

    // Arrow horizontal position relative to tooltip
    const arrowLeft = Math.max(16, Math.min(rect.left + rect.width / 2 - left - 8, tooltipW - 32))

    setTooltipStyle({ top, left, width: tooltipW })
    setArrowStyle({
      left: arrowLeft,
      ...(pos === 'bottom'
        ? { top: -8, borderBottom: arrowBorderBottom, borderTop: 'none' }
        : pos === 'top'
          ? { bottom: -8, borderTop: arrowBorderTop, borderBottom: 'none' }
          : { display: 'none' }),
    })
  }, [])

  // Check localStorage on mount
  useEffect(() => {
    const done = localStorage.getItem(getLocalKey(userId))
    if (!done) {
      // Small delay so the page renders first
      const t = setTimeout(() => setVisible(true), 600)
      return () => clearTimeout(t)
    }
  }, [userId])

  // Measure target whenever step changes or visible
  useEffect(() => {
    if (!visible) return
    // Cancel any pending RAF
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      measureTarget(step)
    })
  }, [visible, step, measureTarget])

  // Scroll target into view
  useEffect(() => {
    if (!visible) return
    const target = STEPS[step]?.target
    const el = document.querySelector(`[data-tour="${target}"]`) as HTMLElement | null
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      // Re-measure after scroll settles
      const t = setTimeout(() => measureTarget(step), 350)
      return () => clearTimeout(t)
    }
  }, [visible, step, measureTarget])

  const finish = useCallback(() => {
    localStorage.setItem(getLocalKey(userId), '1')
    setVisible(false)
  }, [userId])

  const next = useCallback(() => {
    if (step < STEPS.length - 1) setStep(s => s + 1)
    else finish()
  }, [step, finish])

  const prev = useCallback(() => {
    if (step > 0) setStep(s => s - 1)
  }, [step])

  if (!visible || !targetRect) return null

  const isLast = step === STEPS.length - 1
  const currentStep = STEPS[step]

  return (
    <>
      {/* Dark overlay with spotlight hole using clip-path */}
      <div
        className="fixed inset-0 z-[9990] pointer-events-none"
        style={{
          background: 'rgba(0,0,0,0.72)',
          // Cut a transparent hole over the target using clip-path
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

      {/* Spotlight border glow */}
      <div
        className="fixed pointer-events-none z-[9991]"
        style={{
          top: targetRect.top,
          left: targetRect.left,
          width: targetRect.width,
          height: targetRect.height,
          borderRadius: 16,
          border: '2px solid #3fe56c',
          boxShadow: '0 0 0 2px rgba(63,229,108,0.15), 0 0 20px rgba(63,229,108,0.2)',
          transition: 'all 0.3s ease',
        }}
      />

      {/* Invisible click-blocker overlay (allows interacting only through tour buttons) */}
      <div className="fixed inset-0 z-[9992]" onClick={e => e.stopPropagation()} />

      {/* Tooltip balloon */}
      <div
        className="fixed z-[9999] pointer-events-auto"
        style={{
          ...tooltipStyle,
          transition: 'top 0.3s ease, left 0.3s ease',
        }}
      >
        {/* Arrow */}
        {currentStep.position !== 'center' && (
          <div
            className="absolute w-0 h-0"
            style={{
              ...arrowStyle,
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              transition: 'left 0.3s ease',
            }}
          />
        )}

        {/* Card */}
        <div
          className="rounded-2xl p-4 shadow-2xl"
          style={{
            background: 'rgba(15,35,24,0.97)',
            border: '1px solid rgba(63,229,108,0.25)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {/* Header row */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                  style={{ background: 'rgba(63,229,108,0.15)', color: '#3fe56c' }}
                >
                  {step + 1}/{STEPS.length}
                </span>
              </div>
              <p className="text-sm font-black leading-tight" style={{ color: 'white' }}>
                {currentStep.title}
              </p>
            </div>
            <button
              onClick={finish}
              className="flex-shrink-0 p-1 rounded-lg transition-all"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              <X size={16} />
            </button>
          </div>

          <p className="text-xs leading-relaxed mb-3" style={{ color: 'rgba(255,255,255,0.7)' }}>
            {currentStep.description}
          </p>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-1.5 mb-3">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === step ? 16 : 6,
                  height: 6,
                  background: i === step ? '#3fe56c' : 'rgba(255,255,255,0.15)',
                }}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                onClick={prev}
                className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold transition-all"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <ChevronLeft size={14} />
                Voltar
              </button>
            )}
            <button
              onClick={next}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-black transition-all"
              style={{ background: '#3fe56c', color: '#0a1f0f' }}
            >
              {isLast ? (
                <>
                  <CheckCircle size={14} />
                  Começar!
                </>
              ) : (
                <>
                  Próximo
                  <ChevronRight size={14} />
                </>
              )}
            </button>
          </div>

          {step === 0 && (
            <button
              onClick={finish}
              className="w-full mt-2 text-center text-[11px] py-1"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              Pular tour
            </button>
          )}
        </div>
      </div>
    </>
  )
}
