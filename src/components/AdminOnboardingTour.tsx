'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import {
  X, ChevronRight, ChevronLeft, CheckCircle, Shield, LayoutDashboard,
  Users, TrendingUp, BarChart2, Trophy, Sparkles, Settings, Bell,
} from 'lucide-react'

// ── Slides do tour do administrador ──────────────────────────
interface Slide {
  icon: React.ReactNode
  color: string
  title: string
  description: string
  features?: string[]
}

const SLIDES: Slide[] = [
  {
    icon: <Shield size={48} strokeWidth={1.5} />,
    color: '#f97316',
    title: 'Bem-vindo, Administrador!',
    description: 'Este é o painel de gestão do ChronosLab. Aqui você acompanha a frequência dos estagiários, gera relatórios e mantém tudo sob controle. Vamos dar um tour rápido pelas seções.',
  },
  {
    icon: <LayoutDashboard size={48} strokeWidth={1.5} />,
    color: '#3fe56c',
    title: 'Painel',
    description: 'Sua visão geral do laboratório em tempo real.',
    features: [
      'Métricas de presença e horas do dia',
      'Estagiários ativos e quem está no laboratório agora',
      'Atalhos para as pendências mais urgentes',
    ],
  },
  {
    icon: <Users size={48} strokeWidth={1.5} />,
    color: '#60a5fa',
    title: 'Cadastros',
    description: 'O coração da gestão de estagiários.',
    features: [
      'Cadastre novos estagiários e edite seus dados',
      'Defina os horários da semana de cada um',
      'Configure a carga horária total do estágio',
      'Ative ou desative o acesso quando necessário',
    ],
  },
  {
    icon: <TrendingUp size={48} strokeWidth={1.5} />,
    color: '#a78bfa',
    title: 'Carga de Trabalho',
    description: 'Acompanhe o progresso de horas de toda a equipe.',
    features: [
      'Percentual de carga cumprida por estagiário',
      'Identifique quem está atrasado ou quase concluindo',
      'Visão consolidada do mês',
    ],
  },
  {
    icon: <BarChart2 size={48} strokeWidth={1.5} />,
    color: '#22d3ee',
    title: 'Relatórios',
    description: 'Gere documentos profissionais em segundos.',
    features: [
      'Folha de frequência individual em PDF',
      'Exportação em Excel para o RH',
      'Filtros por mês e por estagiário',
    ],
  },
  {
    icon: <Trophy size={48} strokeWidth={1.5} />,
    color: '#fbbf24',
    title: 'Ranking & Gamificação',
    description: 'Veja o engajamento da equipe e premie a dedicação.',
    features: [
      'Classificação por pontos, níveis e conquistas',
      'Hall da fama dos estagiários mais dedicados',
      'Regras de pontuação configuráveis',
    ],
  },
  {
    icon: <Sparkles size={48} strokeWidth={1.5} />,
    color: '#ec4899',
    title: 'Atualizações & Feedback',
    description: 'Comunique-se com os estagiários pelo próprio sistema.',
    features: [
      'Publique novidades e avisos para todos',
      'Leia e responda os feedbacks enviados',
      'Marque sugestões como implementadas',
    ],
  },
  {
    icon: <Bell size={48} strokeWidth={1.5} />,
    color: '#ff5252',
    title: 'Sino de Pendências',
    description: 'O sino (perto do seu perfil) avisa em tempo real o que precisa de atenção: cadastros incompletos, carga horária não definida, horários faltando e registros para revisar. Toque para resolver direto.',
  },
  {
    icon: <Settings size={48} strokeWidth={1.5} />,
    color: '#94a3b8',
    title: 'Tudo pronto!',
    description: 'Em Configurações você ajusta os parâmetros do laboratório e seu PIN de acesso. Você pode rever este tour a qualquer momento por lá. Bom trabalho!',
  },
]

function getKey(userId: string) { return `onboarding_done_admin_${userId}` }

export default function AdminOnboardingTour({ userId }: { userId: string }) {
  const [visible, setVisible]   = useState(false)
  const [slide, setSlide]       = useState(0)
  const [dir, setDir]           = useState<'left' | 'right'>('right')
  const touchStartX             = useRef<number | null>(null)

  // Exibe no primeiro acesso (sem registro no localStorage)
  useEffect(() => {
    const done = localStorage.getItem(getKey(userId))
    if (!done) {
      const t = setTimeout(() => setVisible(true), 400)
      return () => clearTimeout(t)
    }
  }, [userId])

  const finish = useCallback(() => {
    localStorage.setItem(getKey(userId), '1')
    setVisible(false)
  }, [userId])

  const next = () => {
    if (slide < SLIDES.length - 1) { setDir('right'); setSlide(s => s + 1) }
    else finish()
  }
  const prev = () => {
    if (slide > 0) { setDir('left'); setSlide(s => s - 1) }
  }

  // Navegação por teclado (desktop)
  useEffect(() => {
    if (!visible) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next()
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'Escape') finish()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, slide])

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX }
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(dx) < 40) return
    if (dx < 0) next()
    else prev()
  }

  if (!visible) return null

  const s = SLIDES[slide]
  const isLast = slide === SLIDES.length - 1

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(5,15,10,0.97)', backdropFilter: 'blur(8px)' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Card central — responsivo (full no mobile, cartão no desktop) */}
      <div
        className="relative w-full flex flex-col rounded-3xl overflow-hidden"
        style={{
          maxWidth: 480,
          maxHeight: '92dvh',
          background: 'linear-gradient(160deg, #0f2318 0%, #0a1a11 100%)',
          border: '1px solid rgba(0,200,83,0.18)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
        }}
      >
        {/* Skip */}
        <div className="flex-shrink-0 flex justify-between items-center px-5 pt-5">
          <span className="text-[11px] font-black tracking-widest" style={{ color: 'rgba(255,255,255,0.25)' }}>
            TOUR DO GESTOR · {slide + 1}/{SLIDES.length}
          </span>
          <button
            onClick={finish}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-colors"
            style={{ color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <X size={13} /> Pular
          </button>
        </div>

        {/* Conteúdo */}
        <div
          key={slide}
          className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center justify-center px-7 sm:px-9 py-6 text-center"
          style={{
            animation: `adminSlideIn 0.32s cubic-bezier(0.16,1,0.3,1)`,
            ['--slide-from' as string]: dir === 'right' ? '24px' : '-24px',
          }}
        >
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6 flex-shrink-0"
            style={{ background: `${s.color}15`, border: `1px solid ${s.color}35`, color: s.color }}
          >
            {s.icon}
          </div>

          <h2 className="text-xl sm:text-2xl font-black leading-tight mb-3" style={{ color: 'white' }}>
            {s.title}
          </h2>
          <p className="text-sm leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.6)' }}>
            {s.description}
          </p>

          {s.features && (
            <ul className="w-full space-y-2 text-left mt-1">
              {s.features.map((f, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 rounded-xl px-3.5 py-2.5"
                  style={{ background: `${s.color}0d`, border: `1px solid ${s.color}22` }}
                >
                  <CheckCircle size={16} className="flex-shrink-0 mt-0.5" style={{ color: s.color }} />
                  <span className="text-[13px] leading-snug" style={{ color: 'rgba(255,255,255,0.78)' }}>{f}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Controles */}
        <div className="flex-shrink-0 px-6 pb-7 pt-2 space-y-5" style={{ paddingBottom: 'max(1.75rem, env(safe-area-inset-bottom))' }}>
          {/* Dots */}
          <div className="flex items-center justify-center gap-2">
            {SLIDES.map((_, i) => (
              <button key={i} onClick={() => { setDir(i > slide ? 'right' : 'left'); setSlide(i) }} aria-label={`Slide ${i + 1}`}>
                <div
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: i === slide ? 22 : 7, height: 7,
                    background: i === slide ? s.color : 'rgba(255,255,255,0.15)',
                  }}
                />
              </button>
            ))}
          </div>

          {/* Botões */}
          <div className="flex items-center gap-3">
            {slide > 0 && (
              <button
                onClick={prev}
                className="flex items-center justify-center gap-1 px-4 py-3 rounded-2xl text-sm font-bold transition-colors"
                style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <ChevronLeft size={16} /> Voltar
              </button>
            )}
            <button
              onClick={next}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-black transition-transform active:scale-[0.98]"
              style={{ background: s.color, color: '#051a0a' }}
            >
              {isLast ? <><CheckCircle size={16} /> Começar a usar</> : <>Próximo <ChevronRight size={16} /></>}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes adminSlideIn {
          from { opacity: 0; transform: translateX(var(--slide-from, 24px)); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}
