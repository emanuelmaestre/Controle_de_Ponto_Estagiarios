import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { formatDateTime, minutesToHours } from '@/lib/utils'
import ApprovalActions from './ApprovalActions'

export default async function ApprovalsPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: pendingRaw } = await supabase
    .from('v_pending_approvals')
    .select('*')
  const pending = pendingRaw as import('@/types/database').PendingApproval[] | null

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-900 text-white px-6 py-4 flex items-center gap-4">
        <Link href="/admin" className="text-blue-200 hover:text-white text-sm">← Painel</Link>
        <div>
          <h1 className="font-bold text-xl">Fila de Aprovações</h1>
          <p className="text-blue-200 text-sm">{pending?.length ?? 0} registro(s) pendente(s)</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-6 space-y-4">
        {pending?.map((record) => (
          <div key={record.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Cabeçalho do card */}
            <div className="px-5 py-4 flex items-center gap-3 border-b border-gray-50">
              {record.photo_url ? (
                <img src={record.photo_url} alt={record.intern_name}
                  className="w-9 h-9 rounded-full object-cover" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-900 font-bold text-sm">
                  {record.intern_name.charAt(0)}
                </div>
              )}
              <div>
                <p className="font-semibold text-gray-800">{record.intern_name}</p>
                <p className="text-xs text-gray-400">{formatDateTime(record.clock_in)}</p>
              </div>
            </div>

            {/* Dados do turno */}
            <div className="px-5 py-4 space-y-3">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Entrada</p>
                  <p className="font-semibold">
                    {new Date(record.clock_in).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Saída</p>
                  <p className="font-semibold">
                    {record.clock_out
                      ? new Date(record.clock_out).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Duração</p>
                  <p className="font-semibold">
                    {record.duration_minutes ? minutesToHours(record.duration_minutes) : '—'}
                  </p>
                </div>
              </div>

              {/* Atividades */}
              {Array.isArray(record.activities) && record.activities.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Atividades</p>
                  <ul className="space-y-0.5">
                    {(record.activities as string[]).map((a, i) => (
                      <li key={i} className="text-sm text-gray-700">• {a}</li>
                    ))}
                  </ul>
                </div>
              )}

              {record.notes && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Observações</p>
                  <p className="text-sm text-gray-600 italic">{record.notes}</p>
                </div>
              )}
            </div>

            {/* Ações */}
            <div className="px-5 py-4 bg-gray-50 border-t border-gray-100">
              <ApprovalActions recordId={record.id} approverId={user.id} />
            </div>
          </div>
        ))}

        {(!pending || pending.length === 0) && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-4xl mb-3">✅</p>
            <p className="font-medium text-lg">Tudo em dia!</p>
            <p className="text-sm mt-1">Nenhum registro aguardando aprovação.</p>
          </div>
        )}
      </main>
    </div>
  )
}
