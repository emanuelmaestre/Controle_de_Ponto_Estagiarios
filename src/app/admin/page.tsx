import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { minutesToHours, formatTime } from '@/lib/utils'
import type { TodayStatus } from '@/types/database'
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/MotionWrappers'
import { Users, Activity, AlertTriangle, TrendingUp, CheckCircle } from 'lucide-react'

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

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'BOM DIA' : hour < 18 ? 'BOA TARDE' : 'BOA NOITE'
  const dateStr = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).toUpperCase()

  const avatarColors = ['#3b82f6','#8b5cf6','#ec4899','#10b981','#f59e0b','#06b6d4']

  const statusCfg: Record<string, { label: string; color: string; bg: string; border: string }> = {
    ativo:   { label: 'NO LABORATÓRIO', color: '#00c853', bg: 'rgba(0,200,83,0.10)',   border: 'rgba(0,200,83,0.3)'   },
    saiu:    { label: 'SAIU HOJE',      color: '#95d69a', bg: 'rgba(149,214,154,0.08)',border: 'rgba(149,214,154,0.2)'},
    ausente: { label: 'AUSENTE',        color: 'var(--text-3)', bg: 'var(--surface-container)', border: 'var(--border)' },
  }

  const stats = [
    {
      icon: <Activity size={16} />,
      label: 'PRESENTES',
      value: activeCount,
      sub: 'no laboratório',
      color: '#00c853',
      bg: 'rgba(0,200,83,0.08)',
    },
    {
      icon: <Users size={16} />,
      label: 'ESTAGIÁRIOS',
      value: totalCount,
      sub: `${saiuCount} saíram hoje`,
      color: 'var(--secondary)',
      bg: 'rgba(149,214,154,0.08)',
    },
    {
      icon: <AlertTriangle size={16} />,
      label: 'AUSENTES',
      value: ausenteCount,
      sub: ausenteCount > 0 ? 'verificar hoje' : 'todos presentes',
      color: ausenteCount > 0 ? 'var(--danger)' : 'var(--text-3)',
      bg: ausenteCount > 0 ? 'rgba(255,82,82,0.08)' : 'var(--surface-container)',
    },
  ]

  return (
    <div className="flex flex-col" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, background: 'var(--bg)' }}>


      <div className="flex-1 min-h-0 flex flex-col w-full px-4 sm:px-6 py-4 gap-3">

        {/* Saudacao compacta */}
        <FadeIn delay={0}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold" style={{ color: 'var(--text-3)' }}>
                {greeting} &mdash; {dateStr}
              </p>
              <h1 className="text-xl font-black leading-tight" style={{ color: 'var(--text)' }}>
                PAINEL ADMINISTRATIVO
              </h1>
            </div>
            <Link
              href="/admin/interns/new"
              className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold px-3 py-2 rounded-lg transition-all hover:opacity-90"
              style={{ background: '#00c853', color: '#003912' }}
            >
              + NOVO ESTAGIÁRIO
            </Link>
          </div>
        </FadeIn>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 flex-shrink-0">
          {stats.map((s, i) => (
            <FadeIn key={s.label} delay={i * 0.04}>
              <div
                className="card-surface rounded-2xl p-3.5 transition-all"
              >
                <div className="p-1.5 rounded-lg w-fit mb-2" style={{ background: s.bg, color: s.color }}>
                  {s.icon}
                </div>
                <p className="text-2xl font-black leading-none" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[9px] font-bold mt-1 leading-none" style={{ color: 'var(--text-3)' }}>{s.label}</p>
                <p className="text-[9px] mt-0.5" style={{ color: 'var(--text-3)' }}>{s.sub}</p>
              </div>
            </FadeIn>
          ))}
        </div>


{/* Estagiarios — ocupa o espaco restante */}
        <div className="flex-1 min-h-0 flex flex-col">
          <FadeIn delay={0.22}>
            <div className="flex items-center justify-between mb-3 flex-shrink-0">
              <div className="flex items-center gap-2">
                <TrendingUp size={14} style={{ color: 'var(--primary)' }} />
                <h2 className="text-[10px] font-bold" style={{ color: 'var(--text)' }}>
                  ESTAGIÁRIOS &mdash; HOJE
                </h2>
              </div>
              <Link
                href="/admin/interns"
                className="text-[9px] font-bold px-2.5 py-1.5 rounded-lg"
                style={{ background: 'var(--surface-card)', border: '1px solid rgba(0,200,83,0.15)', color: 'var(--text-3)' }}
              >
                VER TODOS
              </Link>
            </div>
          </FadeIn>

          {interns && interns.length > 0 ? (
            <div className="flex-1 min-h-0 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
              <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pb-2">
                {interns.map((intern, idx) => {
                  const cfg = statusCfg[intern.today_status] ?? statusCfg.ausente
                  const initials = intern.full_name.split(' ').slice(0, 2).map((w: string) => w[0]).join('')
                  const avatarBg = avatarColors[idx % avatarColors.length]
                  return (
                    <StaggerItem key={intern.id}>
                      <Link
                        href={`/admin/interns/${intern.id}`}
                        className="group card-surface flex items-center gap-3 rounded-2xl p-3.5 transition-all"
                      >
                        {/* Avatar */}
                        {intern.photo_url ? (
                          <img
                            src={intern.photo_url}
                            alt={intern.full_name}
                            className="w-9 h-9 rounded-full object-cover flex-shrink-0 ring-2"
                            style={{ ringColor: 'rgba(0,200,83,0.3)' }}
                          />
                        ) : (
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 text-white ring-2"
                            style={{ background: avatarBg, border: '2px solid rgba(0,200,83,0.25)' }}
                            style={{ background: avatarBg }}
                          >
                            {initials}
                          </div>
                        )}

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-xs truncate" style={{ color: 'var(--text)' }}>
                            {intern.full_name}
                          </p>
                          <span
                            className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-0.5"
                            style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
                          >
                            <span className="w-1 h-1 rounded-full" style={{ background: cfg.color }} />
                            {cfg.label}
                          </span>
                        </div>

                        {/* Right side */}
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs font-black" style={{ color: 'var(--text)' }}>
                            {minutesToHours(intern.today_minutes)}
                          </p>
                          {intern.today_status === 'ativo' && intern.clock_in && (
                            <p className="text-[9px] font-bold" style={{ color: 'var(--success)' }}>
                              {formatTime(intern.clock_in)}
                            </p>
                          )}
                          {intern.today_status === 'saiu' && (
                            <CheckCircle size={12} style={{ color: 'var(--info)', marginLeft: 'auto' }} />
                          )}
                        </div>
                      </Link>
                    </StaggerItem>
                  )
                })}
              </StaggerContainer>
            </div>
          ) : (
            <FadeIn>
              <div
                className="flex-1 card-surface rounded-3xl flex flex-col items-center justify-center py-10"
              >
                <Users size={44} className="mx-auto mb-3" style={{ color: "var(--text-3)", opacity: 0.35 }} />
                <p className="font-bold text-sm mb-1" style={{ color: 'var(--text)' }}>NENHUM ESTAGIÁRIO CADASTRADO</p>
                <p className="text-xs mb-4" style={{ color: 'var(--text-3)' }}>Comece adicionando o primeiro estagiário.</p>
                <Link
                  href="/admin/interns/new"
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all hover:opacity-90"
                  style={{ background: '#00c853', color: '#003912' }}
                >
                  + ADICIONAR ESTAGIÁRIO
                </Link>
              </div>
            </FadeIn>
          )}
        </div>

      </div>
    </div>
  )
}
