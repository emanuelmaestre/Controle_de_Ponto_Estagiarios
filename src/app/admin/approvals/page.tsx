import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { minutesToHours } from '@/lib/utils'
import ApprovalActions from './ApprovalActions'
import { StaggerContainer, StaggerItem, FadeIn, ScaleIn } from '@/components/ui/MotionWrappers'
import { CheckSquare, CheckCircle2 } from 'lucide-react'

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
    <div className="flex flex-col" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, background: 'var(--bg)' }}>


      {/* Header compacto */}
      <FadeIn delay={0}>
      <div className="flex-shrink-0" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <Link href="/admin" className="text-sm font-bold hover:opacity-70 flex-shrink-0" style={{ color: 'var(--text-3)' }}>
            &larr; Início
          </Link>
          <div className="w-px h-4 flex-shrink-0" style={{ background: 'var(--border)' }} />
          <div className="flex items-center gap-2">
            <CheckSquare size={14} style={{ color: 'var(--primary)' }} />
            <h1 className="font-bold text-sm" style={{ color: 'var(--text)' }}>Aprovações</h1>
            {count > 0 ? (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ background: 'var(--danger)', color: 'white' }}>
                {count}
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(22,163,74,0.12)', color: 'var(--success)' }}>
                Em dia
              </span>
            )}
          </div>
        </div>
      </div>
      </FadeIn>

      {/* Lista scrollavel internamente */}
      <div className="flex-1 min-h-0 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-4 space-y-3">
          {pending && pending.length > 0 ? (
            <StaggerContainer className="space-y-3">
              {pending.map(record => (
                <StaggerItem key={record.id}>
                  <div
                    className="rounded-2xl overflow-hidden hover-lift"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}
                  >
                    {/* Card header */}
                    <div className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: '1px solid var(--border)' }}>
                      {record.photo_url ? (
                        <img src={record.photo_url} alt={record.intern_name} className="w-9 h-9 rounded-xl object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
                          style={{ background: 'rgba(14,165,233,0.1)', color: 'var(--info)' }}>
                          {record.intern_name.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate" style={{ color: 'var(--text)' }}>{record.intern_name}</p>
                        <p className="text-[10px]" style={{ color: 'var(--text-3)' }}>
                          {new Date(record.clock_in).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Sao_Paulo' })}
                          &nbsp;{new Date(record.clock_in).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                        style={{ background: 'rgba(217,119,6,0.10)', color: 'var(--warning)', border: '1px solid rgba(217,119,6,0.25)' }}>
                        <span style={{ fontSize: 10 }}>●</span> Pendente
                      </span>
                    </div>

                    {/* Stats compactos */}
                    <div className="px-4 py-3 grid grid-cols-3 gap-3" style={{ borderBottom: '1px solid var(--border)' }}>
                      {[
                        {
                          label: 'Entrada',
                          value: new Date(record.clock_in).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })
                        },
                        {
                          label: 'Saída',
                          value: record.clock_out
                            ? new Date(record.clock_out).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })
                            : '—'
                        },
                        {
                          label: 'Duração',
                          value: record.duration_minutes ? minutesToHours(record.duration_minutes) : '—'
                        },
                      ].map(s => (
                        <div key={s.label}>
                          <p className="text-[9px] font-bold mb-0.5" style={{ color: 'var(--text-3)' }}>{s.label}</p>
                          <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>{s.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Atividades */}
                    {Array.isArray(record.activities) && record.activities.length > 0 && (
                      <div className="px-4 py-3 space-y-1.5" style={{ borderBottom: '1px solid var(--border)' }}>
                        <p className="text-[9px] font-bold mb-1.5" style={{ color: 'var(--text-3)' }}>Atividades</p>
                        {(record.activities as string[]).map((a, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <div className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0" style={{ background: 'var(--text-3)' }} />
                            <p className="text-xs" style={{ color: 'var(--text-2)' }}>{a}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {record.notes && (
                      <div className="px-4 py-2.5" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
                        <p className="text-[9px] font-bold mb-0.5" style={{ color: 'var(--text-3)' }}>Observações</p>
                        <p className="text-xs italic" style={{ color: 'var(--text-2)' }}>{record.notes}</p>
                      </div>
                    )}

                    {/* Acoes */}
                    <div className="px-4 py-3" style={{ background: 'var(--bg)' }}>
                      <ApprovalActions recordId={record.id} approverId={user.id} />
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          ) : (
            <FadeIn>
              <div
                className="rounded-3xl py-20 text-center mt-8"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <CheckCircle2 size={44} className="mx-auto mb-3" style={{ color: 'var(--success)', opacity: 0.5 }} />
                <p className="font-bold text-sm mb-1" style={{ color: 'var(--text)' }}>Tudo em dia!</p>
                <p className="text-xs mb-5" style={{ color: 'var(--text-3)' }}>Nenhum registro aguardando aprovação.</p>
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90"
                  style={{ background: 'var(--primary)', color: 'white' }}
                >
                  &larr; Voltar ao painel
                </Link>
              </div>
            </FadeIn>
          )}
        </main>
      </div>
    </div>
  )
}
