import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { minutesToHours } from '@/lib/utils'
import InternForm from '../InternForm'
import ScheduleManager from './ScheduleManager'
import AdminNav from '@/components/AdminNav'
import type { Profile, MonthlyHours, InternSchedule } from '@/types/database'
import { Clock, TrendingUp, Calendar, UserCheck } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function InternDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: internRaw } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .eq('role', 'intern')
    .single()
  const intern = internRaw as Profile | null
  if (!intern) notFound()

  // Last 3 months
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
  const { data: hoursRaw } = await supabase
    .from('v_monthly_hours')
    .select('*')
    .eq('intern_id', id)
    .gte('month', threeMonthsAgo.toISOString())
    .order('month', { ascending: false })
  const hours = hoursRaw as MonthlyHours[] | null

  // Schedules
  const { data: schedulesRaw } = await supabase
    .from('intern_schedules')
    .select('*')
    .eq('intern_id', id)
  const schedules = (schedulesRaw ?? []) as InternSchedule[]

  // This month total minutes
  const thisMonth = hoursRaw?.[0]
  const monthMinutes = thisMonth?.total_minutes ?? 0
  const totalRequired = (intern.total_hours_required ?? 120) * 60
  const pct = totalRequired > 0 ? Math.min(100, Math.round((monthMinutes / totalRequired) * 100)) : 0

  const statusLabel = pct >= 100 ? 'CONCLUIDO' : pct >= 75 ? 'QUASE LA' : pct >= 40 ? 'EM DIA' : 'ATENCAO'
  const statusColor = pct >= 100 ? 'var(--success)' : pct >= 75 ? 'var(--info)' : pct >= 40 ? 'var(--primary)' : 'var(--warning)'

  return (
    <div className="min-h-screen pb-24 md:pb-8" style={{ background: 'var(--bg)' }}>
      <AdminNav />

      {/* Page header */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/admin/interns" className="text-sm hover:opacity-70 flex-shrink-0" style={{ color: 'var(--text-3)' }}>
              &larr; ESTAGIARIOS
            </Link>
            <div className="min-w-0">
              <h1 className="font-bold text-lg truncate" style={{ color: 'var(--text)' }}>{intern.full_name}</h1>
              <p className="text-xs truncate" style={{ color: 'var(--text-3)' }}>{intern.email}</p>
            </div>
          </div>
          <span
            className="text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0"
            style={{
              background: intern.is_active ? 'rgba(22,163,74,0.12)' : 'rgba(148,163,184,0.12)',
              color: intern.is_active ? 'var(--success)' : 'var(--text-3)',
              border: `1px solid ${intern.is_active ? 'rgba(22,163,74,0.3)' : 'var(--border)'}`,
            }}
          >
            {intern.is_active ? 'ATIVO' : 'INATIVO'}
          </span>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* Hour progress */}
        <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} style={{ color: 'var(--primary)' }} />
            <h2 className="font-bold text-sm" style={{ color: 'var(--text)' }}>PROGRESSO DE HORAS</h2>
            <span
              className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: `${statusColor}18`, color: statusColor, border: `1px solid ${statusColor}30` }}
            >
              {statusLabel}
            </span>
          </div>

          <div className="flex items-end justify-between mb-2">
            <p className="text-2xl font-black" style={{ color: 'var(--text)' }}>{minutesToHours(monthMinutes)}</p>
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>/ {intern.total_hours_required ?? 120}H TOTAL</p>
          </div>

          <div className="h-3 rounded-full overflow-hidden mb-2" style={{ background: 'var(--bg)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, background: statusColor }}
            />
          </div>
          <p className="text-[10px] font-bold" style={{ color: statusColor }}>{pct}% CONCLUIDO</p>

          {/* Monthly breakdown */}
          {hours && hours.length > 0 && (
            <div className="mt-4 pt-4 space-y-2" style={{ borderTop: '1px solid var(--border)' }}>
              <p className="text-[10px] font-bold mb-2" style={{ color: 'var(--text-3)' }}>ULTIMOS 3 MESES</p>
              {hours.map(h => {
                const hPct = totalRequired > 0 ? Math.min(100, (h.total_minutes / totalRequired) * 100) : 0
                return (
                  <div key={h.month}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold" style={{ color: 'var(--text-2)' }}>
                        {new Date(h.month).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).toUpperCase()}
                      </span>
                      <span className="text-[10px] font-bold" style={{ color: 'var(--text)' }}>
                        {minutesToHours(h.total_minutes)}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: 'var(--bg)' }}>
                      <div className="h-full rounded-full" style={{ width: `${hPct}%`, background: 'var(--primary)' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: <Clock size={14} />, label: 'SESSOES', value: thisMonth?.total_sessions ?? 0 },
            { icon: <UserCheck size={14} />, label: 'APROVADAS', value: thisMonth?.approved_sessions ?? 0 },
            { icon: <Calendar size={14} />, label: 'PENDENTES', value: thisMonth?.pending_sessions ?? 0 },
          ].map(s => (
            <div
              key={s.label}
              className="rounded-2xl p-3 text-center"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div className="flex justify-center mb-1" style={{ color: 'var(--primary)' }}>{s.icon}</div>
              <p className="text-lg font-black" style={{ color: 'var(--text)' }}>{s.value}</p>
              <p className="text-[9px] font-bold" style={{ color: 'var(--text-3)' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Schedule manager */}
        <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2 mb-5">
            <Calendar size={16} style={{ color: 'var(--primary)' }} />
            <h2 className="font-bold text-sm" style={{ color: 'var(--text)' }}>HORARIO SEMANAL</h2>
          </div>
          <ScheduleManager
            internId={intern.id}
            initialSchedules={schedules}
            totalHoursRequired={intern.total_hours_required}
          />
        </div>

        {/* Edit form */}
        <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h2 className="font-bold text-sm mb-5" style={{ color: 'var(--text)' }}>DADOS CADASTRAIS</h2>
          <InternForm mode="edit" intern={intern} />
        </div>

      </main>
    </div>
  )
}
