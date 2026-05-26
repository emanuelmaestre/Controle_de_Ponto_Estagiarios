import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { formatDateTime, minutesToHours } from '@/lib/utils'
import ApprovalActions from './ApprovalActions'
import AdminNav from '@/components/AdminNav'
import { StaggerContainer, StaggerItem, FadeIn } from '@/components/ui/MotionWrappers'

export const dynamic = 'force-dynamic'

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
    <div className="min-h-screen pb-24 md:pb-8" style={{ background: 'var(--bg)' }}>
      <AdminNav pending={count} />

      {/* Page header */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <Link
            href="/admin"
            className="text-sm transition-colors hover:opacity-70 flex-shrink-0"
            style={{ color: 'var(--text-3)' }}
          >
            &larr; <span className="hidden sm:inline">Inicio</span>
          </Link>
          <span className="hidden sm:inline" style={{ color: 'var(--border)' }}>|</span>
          <div className="flex items-center gap-2 sm:gap-3">
            <h1 className="font-bold text-lg" style={{ color: 'var(--text)' }}>Aprovacoes</h1>
            {count > 0 ? (
              <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                {count}
              </span>
            ) : (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                0
              </span>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-4">
        {pending && pending.length > 0 ? (
          <StaggerContainer className="space-y-4">
            {pending.map((record) => (
              <StaggerItem key={record.id}>
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}
                >
                  {/* Card header */}
                  <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid var(--border)' }}>
                    {record.photo_url ? (
                      <img
                        src={record.photo_url}
                        alt={record.intern_name}
                        className="w-10 h-10 rounded-xl object-cover ring-2 ring-slate-200"
                      />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm"
                        style={{ background: 'rgba(14,165,233,0.1)', color: 'var(--info)' }}
                      >
                        {record.intern_name.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-semibold" style={{ color: 'var(--text)' }}>{record.intern_name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-3)' }}>{formatDateTime(record.clock_in)}</p>
                    </div>
                    <span
                      className="text-xs px-2.5 py-1 rounded-full font-semibold border"
                      style={{ background: 'rgba(245,158,11,0.08)', color: 'var(--warning)', borderColor: 'rgba(245,158,11,0.3)' }}
                    >
                      &#9203; Pendente
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="px-4 sm:px-5 py-3 sm:py-4 grid grid-cols-3 gap-2 sm:gap-4 text-sm" style={{ borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <p className="text-xs uppercase tracking-wider font-semibold mb-1" style={{ color: 'var(--text-3)' }}>Entrada</p>
                      <p className="font-bold" style={{ color: 'var(--text)' }}>
                        {new Date(record.clock_in).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider font-semibold mb-1" style={{ color: 'var(--text-3)' }}>Saida</p>
                      <p className="font-bold" style={{ color: 'var(--text)' }}>
                        {record.clock_out
                          ? new Date(record.clock_out).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })
                          : <span style={{ color: 'var(--text-3)' }}>&mdash;</span>}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider font-semibold mb-1" style={{ color: 'var(--text-3)' }}>Duracao</p>
                      <p className="font-bold" style={{ color: 'var(--text)' }}>
                        {record.duration_minutes ? minutesToHours(record.duration_minutes) : <span style={{ color: 'var(--text-3)' }}>&mdash;</span>}
                      </p>
                    </div>
                  </div>

                  {/* Activities */}
                  {Array.isArray(record.activities) && record.activities.length > 0 && (
                    <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
                      <p className="text-xs uppercase tracking-wider font-semibold mb-2" style={{ color: 'var(--text-3)' }}>Atividades</p>
                      <ul className="space-y-1.5">
                        {(record.activities as string[]).map((a, i) => (
                          <li key={i} className="text-sm flex items-start gap-2" style={{ color: 'var(--text-2)' }}>
                            <span style={{ color: 'var(--text-3)' }}>•</span>
                            {a}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {record.notes && (
                    <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
                      <p className="text-xs uppercase tracking-wider font-semibold mb-1" style={{ color: 'var(--text-3)' }}>Observacoes</p>
                      <p className="text-sm italic" style={{ color: 'var(--text-2)' }}>{record.notes}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="px-5 py-4" style={{ background: 'var(--bg-secondary, var(--bg))' }}>
                    <ApprovalActions recordId={record.id} approverId={user.id} />
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        ) : (
          <FadeIn>
            <div className="text-center py-24" style={{ color: 'var(--text-3)' }}>
              <div className="text-6xl mb-4">&#9989;</div>
              <p className="font-bold text-xl" style={{ color: 'var(--text)' }}>Tudo em dia!</p>
              <p className="text-sm mt-2">Nenhum registro aguardando aprovacao.</p>
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 mt-6 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                style={{ background: 'var(--primary)', color: 'white' }}
              >
                &larr; Voltar ao painel
              </Link>
            </div>
          </FadeIn>
        )}
      </main>
    </div>
  )
}
