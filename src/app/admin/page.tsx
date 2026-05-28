import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { minutesToHours, formatTime } from '@/lib/utils'
import type { TodayStatus } from '@/types/database'
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/MotionWrappers'
import { Users, Activity, AlertTriangle, Clock, Search, UserPlus } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: internsRaw } = await supabase
    .from('v_today_status')
    .select('*')
    .order('full_name')
  const interns = internsRaw as TodayStatus[] | null

  const activeCount  = interns?.filter(i => i.today_status === 'ativo').length ?? 0
  const saiuCount    = interns?.filter(i => i.today_status === 'saiu').length ?? 0
  const ausenteCount = interns?.filter(i => i.today_status === 'ausente').length ?? 0
  const totalCount   = interns?.length ?? 0

  const avatarColors = [
    { bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.3)', text: '#60a5fa' },
    { bg: 'rgba(139,92,246,0.15)', border: 'rgba(139,92,246,0.3)', text: '#a78bfa' },
    { bg: 'rgba(236,72,153,0.15)', border: 'rgba(236,72,153,0.3)', text: '#f472b6' },
    { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)', text: '#34d399' },
    { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)', text: '#fbbf24' },
    { bg: 'rgba(6,182,212,0.15)',  border: 'rgba(6,182,212,0.3)',  text: '#22d3ee' },
  ]

  const statusCfg: Record<string, { label: string; color: string; bg: string; border: string }> = {
    ativo:   { label: 'Presente',  color: '#00c853', bg: 'rgba(0,200,83,0.10)',    border: '#00c853' },
    saiu:    { label: 'Saiu',      color: '#95d69a', bg: 'rgba(149,214,154,0.08)', border: '#95d69a' },
    ausente: { label: 'Ausente',   color: '#ff5252', bg: 'rgba(255,82,82,0.10)',   border: '#ff5252' },
  }

  return (
    <div className="flex flex-col flex-1 min-h-0" style={{ background: 'var(--bg)' }}>

      {/* ── TopAppBar ──────────────────────────────── */}
      <FadeIn delay={0}>
        <header
          className="flex items-center justify-between px-6 h-16 flex-shrink-0"
          style={{ background: 'var(--bg)', borderBottom: '1px solid rgba(0,200,83,0.15)' }}
        >
          <div className="flex items-center gap-4 flex-1">
            <h2 className="text-2xl font-semibold" style={{ color: 'var(--text)' }}>
              Painel
            </h2>
            <div className="relative hidden sm:block ml-8" style={{ maxWidth: 400, width: '100%' }}>
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--text-3)' }}
              />
              <input
                type="text"
                placeholder="Pesquisar estagiários, projetos ou logs..."
                className="preserve-case w-full rounded-lg py-2 pl-10 pr-4 text-sm outline-none transition-all"
                style={{
                  background: 'var(--surface-container-low, #031107)',
                  border: '1px solid rgba(0,200,83,0.15)',
                  color: 'var(--text)',
                }}
              />
            </div>
          </div>
        </header>
      </FadeIn>

      {/* ── Main content ───────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto p-6" style={{ maxWidth: 1400, margin: '0 auto', width: '100%' }}>

        {/* Header section */}
        <FadeIn delay={0.04}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-3xl font-semibold" style={{ color: 'var(--text)' }}>
                Visão Geral Operacional
              </h3>
              <p className="text-base mt-1 preserve-case" style={{ color: 'var(--text-3)' }}>
                Monitoramento em tempo real do pessoal do Chronos Lab.
              </p>
            </div>
            <Link
              href="/admin/interns/new"
              className="hidden sm:flex items-center gap-2 px-6 py-2.5 rounded font-bold text-sm transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: '#00c853', color: '#003912' }}
            >
              <UserPlus size={16} />
              Novo Estagiário
            </Link>
          </div>
        </FadeIn>

        {/* ── Metrics Bento ─────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Total de Estagiários */}
          <FadeIn delay={0.08}>
            <div
              className="relative overflow-hidden p-6 rounded-xl transition-all group"
              style={{
                background: 'var(--surface-card, #0f2318)',
                border: '1px solid rgba(0,200,83,0.15)',
              }}
            >
              <div className="relative z-10">
                <p className="text-xs font-semibold tracking-widest mb-2" style={{ color: 'var(--text-3)' }}>
                  Total de Estagiários
                </p>
                <div className="flex items-end gap-3">
                  <span className="text-5xl font-bold leading-none" style={{ color: 'var(--text)' }}>
                    {String(totalCount).padStart(2, '0')}
                  </span>
                  {saiuCount > 0 && (
                    <span className="text-xs font-medium mb-2 preserve-case" style={{ color: 'var(--text-3)' }}>
                      {saiuCount} saíram hoje
                    </span>
                  )}
                </div>
              </div>
              {/* Ghost watermark */}
              <Users
                size={120}
                className="absolute -right-4 -bottom-4"
                style={{ color: 'var(--text)', opacity: 0.05 }}
                strokeWidth={1}
              />
            </div>
          </FadeIn>

          {/* Presentes */}
          <FadeIn delay={0.12}>
            <div
              className="relative overflow-hidden p-6 rounded-xl transition-all group"
              style={{
                background: 'var(--surface-card, #0f2318)',
                border: '1px solid rgba(0,200,83,0.15)',
              }}
            >
              <div className="relative z-10">
                <p className="text-xs font-semibold tracking-widest mb-2" style={{ color: 'var(--text-3)' }}>
                  Presentes
                </p>
                <div className="flex items-end gap-3">
                  <span className="text-5xl font-bold leading-none" style={{ color: '#00c853' }}>
                    {String(activeCount).padStart(2, '0')}
                  </span>
                  <span className="text-xs font-medium mb-2 preserve-case" style={{ color: 'var(--text-3)' }}>
                    Ativos agora
                  </span>
                </div>
              </div>
              <Activity
                size={120}
                className="absolute -right-4 -bottom-4"
                style={{ color: '#00c853', opacity: 0.05 }}
                strokeWidth={1}
              />
            </div>
          </FadeIn>

          {/* Ausentes */}
          <FadeIn delay={0.16}>
            <div
              className="relative overflow-hidden p-6 rounded-xl transition-all group"
              style={{
                background: 'var(--surface-card, #0f2318)',
                border: '1px solid rgba(0,200,83,0.15)',
              }}
            >
              <div className="relative z-10">
                <p className="text-xs font-semibold tracking-widest mb-2" style={{ color: 'var(--text-3)' }}>
                  Ausentes
                </p>
                <div className="flex items-end gap-3">
                  <span className="text-5xl font-bold leading-none" style={{ color: ausenteCount > 0 ? '#ff5252' : 'var(--text-3)' }}>
                    {String(ausenteCount).padStart(2, '0')}
                  </span>
                  <span className="text-xs font-medium mb-2 preserve-case" style={{ color: 'var(--text-3)' }}>
                    {ausenteCount > 0 ? 'Fora do laboratório' : 'Todos presentes'}
                  </span>
                </div>
              </div>
              <AlertTriangle
                size={120}
                className="absolute -right-4 -bottom-4"
                style={{ color: ausenteCount > 0 ? '#ff5252' : 'var(--text-3)', opacity: 0.05 }}
                strokeWidth={1}
              />
            </div>
          </FadeIn>
        </div>

        {/* ── Lista de Estagiários ────────────────── */}
        <FadeIn delay={0.20}>
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-2xl font-semibold" style={{ color: 'var(--text)' }}>
              Lista de Estagiários
            </h4>
            <Link
              href="/admin/interns"
              className="flex items-center gap-2 px-3 py-2 rounded text-xs font-medium transition-colors"
              style={{
                background: 'var(--surface-variant, #28392c)',
                color: 'var(--text-3)',
              }}
            >
              Ver todos
            </Link>
          </div>
        </FadeIn>

        {interns && interns.length > 0 ? (
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 pb-4">
            {interns.map((intern, idx) => {
              const cfg = statusCfg[intern.today_status] ?? statusCfg.ausente
              const initials = intern.full_name.split(' ').slice(0, 2).map((w: string) => w[0]).join('')
              const ac = avatarColors[idx % avatarColors.length]
              return (
                <StaggerItem key={intern.id}>
                  <Link
                    href={`/admin/interns/${intern.id}`}
                    className="group block p-5 rounded-xl transition-all duration-200"
                    style={{
                      background: 'var(--surface-card, #0f2318)',
                      border: '1px solid rgba(0,200,83,0.15)',
                    }}
                  >
                    {/* Top: avatar + name + status */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {intern.photo_url ? (
                          <img
                            src={intern.photo_url}
                            alt={intern.full_name}
                            className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                            style={{ border: `1px solid ${ac.border}` }}
                          />
                        ) : (
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0"
                            style={{ background: ac.bg, border: `1px solid ${ac.border}`, color: ac.text }}
                          >
                            {initials}
                          </div>
                        )}
                        <div>
                          <h5 className="text-base font-bold preserve-case" style={{ color: 'var(--text)' }}>
                            {intern.full_name}
                          </h5>
                        </div>
                      </div>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded flex-shrink-0"
                        style={{
                          background: cfg.bg,
                          border: `1px solid ${cfg.border}`,
                          color: cfg.color,
                        }}
                      >
                        {cfg.label}
                      </span>
                    </div>

                    {/* Divider */}
                    <div className="w-full mb-4" style={{ height: 1, background: 'rgba(0,200,83,0.15)' }} />

                    {/* Bottom: hours */}
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span style={{ color: 'var(--text-3)' }}>Horas Hoje</span>
                      <span style={{ color: intern.today_status === 'ausente' ? 'var(--text-3)' : '#3fe56c' }}>
                        {intern.today_status === 'ausente'
                          ? '--:-- hrs'
                          : `${minutesToHours(intern.today_minutes)} hrs`
                        }
                      </span>
                    </div>

                    {/* Clock in time */}
                    {intern.today_status === 'ativo' && intern.clock_in && (
                      <div className="flex justify-between items-center text-xs mt-2">
                        <span style={{ color: 'var(--text-3)' }}>Entrada</span>
                        <span className="flex items-center gap-1" style={{ color: '#00c853' }}>
                          <Clock size={12} />
                          {formatTime(intern.clock_in)}
                        </span>
                      </div>
                    )}
                  </Link>
                </StaggerItem>
              )
            })}
          </StaggerContainer>
        ) : (
          <FadeIn>
            <div
              className="rounded-xl flex flex-col items-center justify-center py-16"
              style={{
                background: 'var(--surface-card, #0f2318)',
                border: '1px solid rgba(0,200,83,0.15)',
              }}
            >
              <Users size={48} className="mb-4" style={{ color: 'var(--text-3)', opacity: 0.4 }} />
              <p className="text-lg font-semibold mb-1" style={{ color: 'var(--text)' }}>
                Nenhum estagiário cadastrado
              </p>
              <p className="text-sm mb-6 preserve-case" style={{ color: 'var(--text-3)' }}>
                Comece adicionando o primeiro estagiário ao sistema.
              </p>
              <Link
                href="/admin/interns/new"
                className="flex items-center gap-2 px-6 py-2.5 rounded font-bold text-sm transition-all hover:opacity-90"
                style={{ background: '#00c853', color: '#003912' }}
              >
                <UserPlus size={16} />
                Adicionar Estagiário
              </Link>
            </div>
          </FadeIn>
        )}
      </div>
    </div>
  )
}
