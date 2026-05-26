import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { minutesToHours, formatTime } from '@/lib/utils'
import type { TodayStatus } from '@/types/database'
import AdminNav from '@/components/AdminNav'
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/MotionWrappers'
import { Users, Activity, Clock, AlertTriangle, TrendingUp, CheckCircle } from 'lucide-react'

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

  const totalPending = interns?.reduce((acc, i) => acc + (i.pending_count ?? 0), 0) ?? 0
  const activeCount  = interns?.filter(i => i.today_status === 'ativo').length ?? 0
  const saiuCount    = interns?.filter(i => i.today_status === 'saiu').length ?? 0
  const ausenteCount = interns?.filter(i => i.today_status === 'ausente').length ?? 0
  const totalCount   = interns?.length ?? 0

  // Hora / saudacao
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'BOM DIA' : hour < 18 ? 'BOA TARDE' : 'BOA NOITE'
  const dateStr = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).toUpperCase()

  const avatarColors = ['#3b82f6','#8b5cf6','#ec4899','#10b981','#f59e0b','#06b6d4']

  const statusCfg: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
    ativo:   { label: 'NO LABORATORIO',  color: 'var(--success)', bg: 'rgba(22,163,74,0.10)',  border: 'rgba(22,163,74,0.25)',  dot: 'var(--success)' },
    saiu:    { label: 'SAIU HOJE',       color: 'var(--info)',    bg: 'rgba(14,165,233,0.10)', border: 'rgba(14,165,233,0.25)', dot: 'var(--info)'    },
    ausente: { label: 'AUSENTE',         color: 'var(--text-3)',  bg: 'var(--bg)',             border: 'var(--border)',         dot: 'var(--text-3)'  },
  }

  return (
    <div className="min-h-screen pb-24 md:pb-8" style={{ background: 'var(--bg)' }}>
      <AdminNav pending={totalPending} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">

        {/* Saudacao */}
        <FadeIn delay={0}>
          <div>
            <p className="text-[10px] font-bold" style={{ color: 'var(--text-3)' }}>{greeting} &mdash; {dateStr}</p>
            <h1 className="text-2xl font-black mt-0.5" style={{ color: 'var(--text)' }}>PAINEL ADMINISTRATIVO</h1>
          </div>
        </FadeIn>

        {/* Stats cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              icon: <Activity size={18} />,
              label: 'PRESENTES AGORA',
              value: activeCount,
              sub: 'no laboratorio',
              color: 'var(--success)',
              bg: 'rgba(22,163,74,0.08)',
              delay: 0,
            },
            {
              icon: <Users size={18} />,
              label: 'TOTAL ESTAGIARIOS',
              value: totalCount,
              sub: `${saiuCount} sairam hoje`,
              color: 'var(--info)',
              bg: 'rgba(14,165,233,0.08)',
              delay: 0.05,
            },
            {
              icon: <Clock size={18} />,
              label: 'APROVACOES PENDENTES',
              value: totalPending,
              sub: totalPending > 0 ? 'necessitam revisao' : 'tudo em dia',
              color: totalPending > 0 ? 'var(--warning)' : 'var(--text-3)',
              bg: totalPending > 0 ? 'rgba(217,119,6,0.08)' : 'var(--bg)',
              delay: 0.10,
            },
            {
              icon: <AlertTriangle size={18} />,
              label: 'AUSENTES HOJE',
              value: ausenteCount,
              sub: ausenteCount > 0 ? 'verificar pendencias' : 'todos presentes',
              color: ausenteCount > 0 ? 'var(--danger)' : 'var(--text-3)',
              bg: ausenteCount > 0 ? 'rgba(220,38,38,0.08)' : 'var(--bg)',
              delay: 0.15,
            },
          ].map(s => (
            <FadeIn key={s.label} delay={s.delay}>
              <div
                className="rounded-2xl p-4"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 rounded-xl" style={{ background: s.bg, color: s.color }}>
                    {s.icon}
                  </div>
                </div>
                <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[9px] font-bold mt-0.5 uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>{s.label}</p>
                <p className="text-[9px] mt-0.5" style={{ color: 'var(--text-3)' }}>{s.sub}</p>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* Alerta de pendencias */}
        {totalPending > 0 && (
          <FadeIn delay={0.2}>
            <Link href="/admin/approvals">
              <div
                className="rounded-2xl px-5 py-4 flex items-center gap-4 transition-all hover:shadow-md"
                style={{ background: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.3)' }}
              >
                <Clock size={20} style={{ color: 'var(--warning)', flexShrink: 0 }} />
                <div className="flex-1">
                  <p className="text-sm font-bold" style={{ color: 'var(--warning)' }}>
                    {totalPending} {totalPending === 1 ? 'REGISTRO PENDENTE' : 'REGISTROS PENDENTES'} DE APROVACAO
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--warning)', opacity: 0.75 }}>
                    Clique para revisar e aprovar os registros de ponto aguardando sua analise.
                  </p>
                </div>
                <span className="text-[10px] font-bold px-3 py-1.5 rounded-xl" style={{ background: 'var(--warning)', color: 'white' }}>
                  REVISAR
                </span>
              </div>
            </Link>
          </FadeIn>
        )}

        {/* Lista de estagiarios */}
        <div>
          <FadeIn delay={0.22}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} style={{ color: 'var(--primary)' }} />
                <h2 className="text-xs font-bold" style={{ color: 'var(--text)' }}>ESTAGIARIOS &mdash; HOJE</h2>
              </div>
              <Link
                href="/admin/interns"
                className="text-[10px] font-bold px-3 py-1.5 rounded-xl transition-all hover:opacity-80"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-3)' }}
              >
                VER TODOS
              </Link>
            </div>
          </FadeIn>

          {interns && interns.length > 0 ? (
            <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {interns.map((intern, idx) => {
                const cfg = statusCfg[intern.today_status] ?? statusCfg.ausente
                const initials = intern.full_name.split(' ').slice(0, 2).map(w => w[0]).join('')
                const avatarBg = avatarColors[idx % avatarColors.length]
                return (
                  <StaggerItem key={intern.id}>
                    <Link
                      href={`/admin/interns/${intern.id}`}
                      className="group block rounded-2xl p-4 transition-all hover:shadow-md"
                      style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        {intern.photo_url ? (
                          <img
                            src={intern.photo_url}
                            alt={intern.full_name}
                            className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                            style={{ border: `2px solid ${cfg.color}30` }}
                          />
                        ) : (
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 text-white"
                            style={{ background: avatarBg }}
                          >
                            {initials}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate" style={{ color: 'var(--text)' }}>{intern.full_name}</p>
                          <span
                            className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full mt-0.5"
                            style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
                            {cfg.label}
                          </span>
                        </div>
                      </div>

                      <div
                        className="flex items-center justify-between pt-3"
                        style={{ borderTop: '1px solid var(--border)' }}
                      >
                        <div>
                          <p className="text-[9px] font-bold" style={{ color: 'var(--text-3)' }}>HOJE</p>
                          <p className="text-sm font-black" style={{ color: 'var(--text)' }}>
                            {minutesToHours(intern.today_minutes)}
                          </p>
                        </div>
                        {intern.today_status === 'ativo' && intern.clock_in && (
                          <div className="text-right">
                            <p className="text-[9px] font-bold" style={{ color: 'var(--text-3)' }}>ENTRADA</p>
                            <p className="text-sm font-black" style={{ color: 'var(--success)' }}>{formatTime(intern.clock_in)}</p>
                          </div>
                        )}
                        {intern.pending_count > 0 && (
                          <span
                            className="text-[9px] font-bold px-2 py-1 rounded-full"
                            style={{ background: 'rgba(217,119,6,0.12)', color: 'var(--warning)', border: '1px solid rgba(217,119,6,0.25)' }}
                          >
                            &#9203; {intern.pending_count} PEND.
                          </span>
                        )}
                        {intern.today_status === 'saiu' && (
                          <CheckCircle size={16} style={{ color: 'var(--info)' }} />
                        )}
                      </div>
                    </Link>
                  </StaggerItem>
                )
              })}
            </StaggerContainer>
          ) : (
            <FadeIn>
              <div
                className="rounded-3xl py-20 text-center"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <div className="text-5xl mb-4 float-anim inline-block">&#128100;</div>
                <p className="font-bold text-sm mb-1" style={{ color: 'var(--text)' }}>NENHUM ESTAGIARIO CADASTRADO</p>
                <p className="text-xs mb-5" style={{ color: 'var(--text-3)' }}>Comece adicionando o primeiro estagiario ao sistema.</p>
                <Link
                  href="/admin/interns/new"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90"
                  style={{ background: 'var(--primary)', color: 'white' }}
                >
                  + ADICIONAR ESTAGIARIO
                </Link>
              </div>
            </FadeIn>
          )}
        </div>

      </main>
    </div>
  )
}
