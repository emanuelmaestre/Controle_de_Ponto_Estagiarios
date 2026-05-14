import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { formatDate, formatTime, minutesToHours } from '@/lib/utils'
import StatusBadge from '@/components/StatusBadge'
import type { RecordStatus } from '@/types/database'

export default async function HistoryPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

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
    .select(`
      id, clock_in, clock_out, duration_minutes, status, rejection_reason, notes,
      activities (description)
    `)
    .eq('intern_id', user.id)
    .gte('clock_in', since.toISOString())
    .order('clock_in', { ascending: false })
  const records = recordsRaw as RecordWithActivities[] | null

  const { data: monthData } = await supabase
    .from('v_monthly_hours')
    .select('total_minutes, approved_sessions, pending_sessions, rejected_sessions')
    .eq('intern_id', user.id)
    .gte('month', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
    .maybeSingle()

  const statusDotColor: Record<string, string> = {
    approved: 'bg-emerald-400',
    pending: 'bg-amber-400',
    rejected: 'bg-red-400',
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-950 to-blue-800 text-white px-5 py-5">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link href="/dashboard" className="text-blue-300 hover:text-white text-sm flex items-center gap-1 transition-colors">
            ← Início
          </Link>
          <div>
            <h1 className="font-bold text-xl">Meu Histórico</h1>
            <p className="text-blue-300 text-xs">Últimos 60 dias</p>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 space-y-5">
        {/* Monthly summary */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-50">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Este mês</h2>
          </div>
          <div className="grid grid-cols-4 gap-0 divide-x divide-slate-100">
            <div className="px-4 py-4 text-center">
              <p className="text-xl font-bold text-slate-800">{minutesToHours(monthData?.total_minutes ?? 0)}</p>
              <p className="text-xs text-slate-400 mt-0.5">Total</p>
            </div>
            <div className="px-4 py-4 text-center">
              <p className="text-xl font-bold text-emerald-600">{monthData?.approved_sessions ?? 0}</p>
              <p className="text-xs text-slate-400 mt-0.5">Aprovados</p>
            </div>
            <div className="px-4 py-4 text-center">
              <p className="text-xl font-bold text-amber-500">{monthData?.pending_sessions ?? 0}</p>
              <p className="text-xs text-slate-400 mt-0.5">Pendentes</p>
            </div>
            <div className="px-4 py-4 text-center">
              <p className="text-xl font-bold text-red-500">{monthData?.rejected_sessions ?? 0}</p>
              <p className="text-xs text-slate-400 mt-0.5">Reprovados</p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        {records && records.length > 0 ? (
          <div className="relative">
            {/* Vertical timeline line */}
            <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-200" style={{ marginLeft: '1px' }} />

            <div className="space-y-3 pl-12 relative">
              {records.map((record, idx) => (
                <div key={record.id} className="relative">
                  {/* Timeline dot */}
                  <div
                    className={`absolute -left-7 top-4 w-3 h-3 rounded-full border-2 border-white shadow-sm ${
                      statusDotColor[record.status] ?? 'bg-slate-300'
                    }`}
                  />

                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-4 py-3 flex items-center justify-between border-b border-slate-50">
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{formatDate(record.clock_in)}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {formatTime(record.clock_in)}
                          {record.clock_out
                            ? <span> → {formatTime(record.clock_out)}</span>
                            : <span className="text-emerald-500"> → em andamento</span>}
                          {record.duration_minutes
                            ? <span> · {minutesToHours(record.duration_minutes)}</span>
                            : null}
                        </p>
                      </div>
                      <StatusBadge status={record.status as RecordStatus} />
                    </div>

                    {record.activities && record.activities.length > 0 && (
                      <div className="px-4 py-3">
                        <ul className="space-y-1">
                          {record.activities.map((a, i) => (
                            <li key={i} className="text-sm text-slate-600 flex items-start gap-1.5">
                              <span className="text-slate-300 mt-0.5 flex-shrink-0">•</span>
                              {a.description}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {record.status === 'rejected' && record.rejection_reason && (
                      <div className="px-4 py-3 bg-red-50 border-t border-red-100">
                        <p className="text-xs font-bold text-red-700 uppercase tracking-wider mb-0.5">Motivo da reprovação</p>
                        <p className="text-sm text-red-600">{record.rejection_reason}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-20 text-slate-400">
            <p className="text-5xl mb-4">📋</p>
            <p className="font-semibold text-slate-600">Nenhum registro encontrado</p>
            <p className="text-sm mt-1">Seus registros dos últimos 60 dias aparecerão aqui.</p>
          </div>
        )}
      </main>

      {/* Bottom nav */}
      <nav className="sticky bottom-0 bg-white border-t border-slate-100 shadow-lg">
        <div className="max-w-lg mx-auto flex">
          <Link href="/dashboard" className="flex-1 flex flex-col items-center gap-1 py-3 text-slate-400 hover:text-slate-600">
            <span className="text-xl">🏠</span>
            <span className="text-[10px] font-semibold">Hoje</span>
          </Link>
          <Link href="/history" className="flex-1 flex flex-col items-center gap-1 py-3 text-blue-700">
            <span className="text-xl">📋</span>
            <span className="text-[10px] font-semibold">Histórico</span>
          </Link>
          <form action="/api/auth/signout" method="POST" className="flex-1">
            <button type="submit" className="w-full flex flex-col items-center gap-1 py-3 text-slate-400 hover:text-slate-600">
              <span className="text-xl">👤</span>
              <span className="text-[10px] font-semibold">Sair</span>
            </button>
          </form>
        </div>
      </nav>
    </div>
  )
}
