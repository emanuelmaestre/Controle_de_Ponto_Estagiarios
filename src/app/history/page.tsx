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

  // Buscar registros dos últimos 60 dias
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

  // Totais do mês atual
  const { data: monthData } = await supabase
    .from('v_monthly_hours')
    .select('total_minutes, approved_sessions, pending_sessions, rejected_sessions')
    .eq('intern_id', user.id)
    .gte('month', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
    .maybeSingle()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-900 text-white px-4 py-4 flex items-center gap-4">
        <Link href="/dashboard" className="text-blue-200 hover:text-white text-sm">← Início</Link>
        <h1 className="font-bold text-xl">Meu Histórico</h1>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Resumo do mês */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h2 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">
            Este mês
          </h2>
          <div className="grid grid-cols-4 gap-3 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-900">
                {minutesToHours(monthData?.total_minutes ?? 0)}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Total</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{monthData?.approved_sessions ?? 0}</p>
              <p className="text-xs text-gray-400 mt-0.5">Aprovados</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-500">{monthData?.pending_sessions ?? 0}</p>
              <p className="text-xs text-gray-400 mt-0.5">Pendentes</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-500">{monthData?.rejected_sessions ?? 0}</p>
              <p className="text-xs text-gray-400 mt-0.5">Reprovados</p>
            </div>
          </div>
        </div>

        {/* Lista de registros */}
        {records?.map((record) => (
          <div key={record.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 flex items-center justify-between border-b border-gray-50">
              <div>
                <p className="font-semibold text-gray-800 text-sm">{formatDate(record.clock_in)}</p>
                <p className="text-xs text-gray-400">
                  {formatTime(record.clock_in)}
                  {record.clock_out ? ` → ${formatTime(record.clock_out)}` : ' → em andamento'}
                  {record.duration_minutes ? ` · ${minutesToHours(record.duration_minutes)}` : ''}
                </p>
              </div>
              <StatusBadge status={record.status as RecordStatus} />
            </div>

            {/* Atividades */}
            {record.activities && record.activities.length > 0 && (
              <div className="px-4 py-3">
                <ul className="space-y-0.5">
                  {record.activities.map((a, i) => (
                    <li key={i} className="text-sm text-gray-600">• {a.description}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Motivo de reprovação */}
            {record.status === 'rejected' && record.rejection_reason && (
              <div className="px-4 py-3 bg-red-50 border-t border-red-100">
                <p className="text-xs font-semibold text-red-700 mb-0.5">Motivo da reprovação:</p>
                <p className="text-sm text-red-600">{record.rejection_reason}</p>
              </div>
            )}
          </div>
        ))}

        {(!records || records.length === 0) && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">📋</p>
            <p>Nenhum registro nos últimos 60 dias.</p>
          </div>
        )}
      </main>
    </div>
  )
}
