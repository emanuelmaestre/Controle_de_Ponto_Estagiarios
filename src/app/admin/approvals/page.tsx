import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { formatDateTime, minutesToHours } from '@/lib/utils'
import ApprovalActions from './ApprovalActions'
import AdminNav from '@/components/AdminNav'
import { StaggerContainer, StaggerItem, FadeIn } from '@/components/ui/MotionWrappers'

export default async function ApprovalsPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: pendingRaw } = await supabase
    .from('v_pending_approvals')
    .select('*')
  const pending = pendingRaw as import('@/types/database').PendingApproval[] | null

  const count = pending?.length ?? 0

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminNav pending={count} />

      {/* Page header */}
      <div className="bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center gap-2 sm:gap-4">
          <Link href="/admin" className="text-slate-400 hover:text-slate-600 text-sm transition-colors flex-shrink-0">
            ←<span className="hidden sm:inline"> Início</span>
          </Link>
          <span className="text-slate-200 hidden sm:inline">|</span>
          <div className="flex items-center gap-2 sm:gap-3">
            <h1 className="font-bold text-slate-800 text-lg sm:text-xl">Aprovações</h1>
            {count > 0 ? (
              <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                {count}
              </span>
            ) : (
              <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                0
              </span>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 md:pb-8 space-y-4">
        {pending && pending.length > 0 ? (
          <StaggerContainer className="space-y-4">
          {pending.map((record) => (
            <StaggerItem key={record.id}>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {/* Card header */}
              <div className="px-5 py-4 flex items-center gap-3 border-b border-slate-50">
                {record.photo_url ? (
                  <img
                    src={record.photo_url}
                    alt={record.intern_name}
                    className="w-10 h-10 rounded-xl object-cover ring-2 ring-slate-100"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                    {record.intern_name.charAt(0)}
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-semibold text-slate-800">{record.intern_name}</p>
                  <p className="text-xs text-slate-400">{formatDateTime(record.clock_in)}</p>
                </div>
                <span className="text-xs bg-amber-50 text-amber-600 border border-amber-200 px-2.5 py-1 rounded-full font-semibold">
                  ⏳ Pendente
                </span>
              </div>

              {/* Stats */}
              <div className="px-4 sm:px-5 py-3 sm:py-4 grid grid-cols-3 gap-2 sm:gap-4 text-sm border-b border-slate-50">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Entrada</p>
                  <p className="font-bold text-slate-700">
                    {new Date(record.clock_in).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Saída</p>
                  <p className="font-bold text-slate-700">
                    {record.clock_out
                      ? new Date(record.clock_out).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Duração</p>
                  <p className="font-bold text-slate-700">
                    {record.duration_minutes ? minutesToHours(record.duration_minutes) : '—'}
                  </p>
                </div>
              </div>

              {/* Activities */}
              {Array.isArray(record.activities) && record.activities.length > 0 && (
                <div className="px-5 py-4 border-b border-slate-50">
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-2">Atividades</p>
                  <ul className="space-y-1.5">
                    {(record.activities as string[]).map((a, i) => (
                      <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                        <span className="text-slate-300 mt-0.5">•</span>
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {record.notes && (
                <div className="px-5 py-3 border-b border-slate-50 bg-slate-50">
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Observações</p>
                  <p className="text-sm text-slate-600 italic">{record.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="px-5 py-4 bg-slate-50/50">
                <ApprovalActions recordId={record.id} approverId={user.id} />
              </div>
            </div>
            </StaggerItem>
          ))}
          </StaggerContainer>
        ) : (
          <FadeIn><div className="text-center py-24 text-slate-400">
            <div className="text-6xl mb-4">✅</div>
            <p className="font-bold text-slate-700 text-xl">Tudo em dia!</p>
            <p className="text-sm mt-2">Nenhum registro aguardando aprovação.</p>
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 mt-6 px-4 py-2 bg-blue-700 text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition-all"
            >
              ← Voltar ao painel
            </Link>
          </div></FadeIn>
        )}
      </main>
    </div>
  )
}
