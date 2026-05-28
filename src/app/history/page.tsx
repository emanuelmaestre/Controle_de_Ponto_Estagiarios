import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { formatDate, formatTime, minutesToHours } from '@/lib/utils'
import StatusBadge from '@/components/StatusBadge'
import ProgressRing from '@/components/ui/ProgressRing'
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/MotionWrappers'
import type { RecordStatus } from '@/types/database'
import { Home, ClipboardList, LogOut } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function HistoryPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('total_hours_required, role')
    .eq('id', user.id)
    .maybeSingle()

  // Administradores não têm histórico de ponto
  if (profile?.role === 'manager') redirect('/admin')

  const since = new Date()
  since.setDate(since.getDate() - 60)

  type RecordWithActivities = {
    id: string
    clock_in: string
    clock_out: string | null
    duration_minutes: number | null
    status: string
    rejection_reason: string | null
    notes: string | null
    activities: { description: string }[]
  }

  const { data: recordsRaw } = await supabase
    .from('time_records')
    .select('id, clock_in, clock_out, duration_minutes, status, rejection_reason, notes, activities (description)')
    .eq('intern_id', user.id)
    .gte('clock_in', since.toISOString())
    .order('clock_in', { ascending: false })
  const records = recordsRaw as RecordWithActivities[] | null

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
  const { data: monthData } = await supabase
    .from('v_monthly_hours')
    .select('total_minutes, approved_sessions, rejected_sessions')
    .eq('intern_id', user.id)
    .gte('month', monthStart)
    .maybeSingle()

  const monthMinutes = monthData?.total_minutes ?? 0
  const totalRequiredMins = (profile?.total_hours_required ?? 120) * 60
  const pct = totalRequiredMins > 0 ? Math.min(100, Math.round((monthMinutes / totalRequiredMins) * 100)) : 0
  const pctColor = pct >= 80 ? 'var(--success)' : pct >= 40 ? 'var(--primary)' : 'var(--warning)'

  const statusDot: Record<string, string> = {
    approved: 'var(--success)',
    pending:  'var(--warning)',
    rejected: 'var(--danger)',
  }

  return (
    <div className="flex flex-col" style={{ height: '100dvh', overflow: 'hidden', background: 'var(--bg)' }}>
      <header className="flex-shrink-0 shadow-lg" style={{ background: 'var(--nav-bg)' }}>
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center gap-4">
          <Link href="/dashboard" className="text-sm font-bold hover:opacity-70" style={{ color: 'var(--nav-muted)' }}>
            &larr;
          </Link>
          <div>
            <h1 className="font-bold text-base" style={{ color: 'var(--nav-fg)' }}>MEU HISTÓRICO</h1>
            <p className="text-[10px]" style={{ color: 'var(--nav-muted)' }}>ÚLTIMOS 60 DIAS DE REGISTROS</p>
          </div>
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}><div className="max-w-2xl mx-auto w-full px-4 py-4 space-y-3 pb-4">
        <FadeIn>
          <div className="rounded-3xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow-md)' }}>
            <p className="text-[10px] font-bold mb-4" style={{ color: 'var(--text-3)' }}>RESUMO DO MÊS ATUAL</p>
            <div className="flex items-center gap-5">
              <ProgressRing pct={pct} size={88} strokeWidth={9} color={pctColor}>
                <div className="text-center">
                  <p className="text-base font-black" style={{ color: pctColor }}>{pct}%</p>
                </div>
              </ProgressRing>
              <div className="flex-1 grid grid-cols-3 gap-3">
                {[
                  { label: 'Total', value: minutesToHours(monthMinutes), color: 'var(--text)' },
                  { label: 'Aprovados', value: monthData?.approved_sessions ?? 0, color: 'var(--success)' },
                  { label: 'Reprovados', value: monthData?.rejected_sessions ?? 0, color: 'var(--danger)' },
                ].map(s => (
                  <div key={s.label}>
                    <p className="text-[9px] font-bold mb-0.5" style={{ color: 'var(--text-3)' }}>{s.label}</p>
                    <p className="text-base font-black" style={{ color: s.color }}>{s.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </FadeIn>

        {records && records.length > 0 ? (
          <div className="relative">
            <div className="absolute left-[19px] top-2 bottom-2 w-px" style={{ background: 'var(--border)' }} />
            <StaggerContainer className="space-y-3 pl-11">
              {records.map(record => (
                <StaggerItem key={record.id} className="relative">
                  <div
                    className="absolute -left-[28px] top-4 w-3 h-3 rounded-full border-2 flex-shrink-0"
                    style={{ background: statusDot[record.status] ?? 'var(--text-3)', borderColor: 'var(--bg)' }}
                  />
                  <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}>
                    <div className="px-4 py-3 flex items-center justify-between gap-3" style={{ borderBottom: record.activities?.length || record.rejection_reason ? '1px solid var(--border)' : 'none' }}>
                      <div className="min-w-0">
                        <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>{formatDate(record.clock_in)}</p>
                        <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-3)' }}>
                          {formatTime(record.clock_in)}
                          {record.clock_out
                            ? <span> &rarr; {formatTime(record.clock_out)}</span>
                            : <span style={{ color: 'var(--success)' }}> &rarr; em andamento</span>}
                          {record.duration_minutes
                            ? <span> &middot; {minutesToHours(record.duration_minutes)}</span>
                            : null}
                        </p>
                      </div>
                      <StatusBadge status={record.status as RecordStatus} />
                    </div>
                    {record.activities && record.activities.length > 0 && (
                      <div className="px-4 py-3 space-y-1.5">
                        {record.activities.map((a, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <div className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0" style={{ background: 'var(--text-3)' }} />
                            <p className="text-xs" style={{ color: 'var(--text-2)' }}>{a.description}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {record.status === 'rejected' && record.rejection_reason && (
                      <div className="px-4 py-3" style={{ background: 'rgba(220,38,38,0.06)', borderTop: '1px solid rgba(220,38,38,0.15)' }}>
                        <p className="text-[9px] font-bold mb-0.5" style={{ color: 'var(--danger)' }}>MOTIVO DA REPROVAÇÃO</p>
                        <p className="text-xs" style={{ color: 'var(--danger)', opacity: 0.85 }}>{record.rejection_reason}</p>
                      </div>
                    )}
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        ) : (
          <FadeIn>
            <div className="rounded-3xl py-16 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <ClipboardList size={44} className="mx-auto mb-4" style={{ color: "var(--text-3)", opacity: 0.35 }} />
              <p className="font-bold text-sm mb-1" style={{ color: 'var(--text)' }}>NENHUM REGISTRO ENCONTRADO</p>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>Seus registros dos últimos 60 dias aparecerão aqui.</p>
            </div>
          </FadeIn>
        )}
      </div></main>

      <nav className="flex-shrink-0 border-t" style={{ background: 'var(--surface)', borderColor: 'var(--border)', boxShadow: '0 -4px 20px rgba(0,0,0,0.08)' }}>
        <div className="max-w-lg mx-auto flex">
          <Link href="/dashboard" className="flex-1 flex flex-col items-center gap-1 py-3" style={{ color: 'var(--text-3)' }}>
            <Home size={18} />
            <span className="text-[10px] font-bold">INICIO</span>
          </Link>
          <Link href="/history" className="flex-1 flex flex-col items-center gap-1 py-3" style={{ color: 'var(--primary)' }}>
            <ClipboardList size={18} />
            <span className="text-[10px] font-bold">HISTÓRICO</span>
          </Link>
          <form action="/api/auth/signout" method="POST" className="flex-1">
            <button type="submit" className="w-full flex flex-col items-center gap-1 py-3" style={{ color: 'var(--text-3)' }}>
              <LogOut size={18} />
              <span className="text-[10px] font-bold">SAIR</span>
            </button>
          </form>
        </div>
      </nav>
    </div>
  )
}
