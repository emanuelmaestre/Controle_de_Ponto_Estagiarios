'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, ClipboardList, LogOut, Trophy, User, Plus, X, Send, CheckCircle2, Clock, PenLine } from 'lucide-react'
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/MotionWrappers'
import ProgressRing from '@/components/ui/ProgressRing'
import { formatDate, formatTime, minutesToHours } from '@/lib/utils'

type Activity = {
  id: string
  description: string
  created_at: string
}

type TimeRecord = {
  id: string
  clock_in: string
  clock_out: string | null
  duration_minutes: number | null
  status: string
  rejection_reason: string | null
  notes: string | null
  activities: Activity[]
}

type Props = {
  records: TimeRecord[]
  monthMinutes: number
  approvedSessions: number
  totalHoursRequired: number
  userName: string
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function AddActivityModal({
  record,
  onClose,
  onSaved,
}: {
  record: TimeRecord
  onClose: () => void
  onSaved: (recordId: string, activity: Activity) => void
}) {
  const [text, setText]       = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError]     = useState('')
  const [done, setDone]       = useState(false)

  async function submit() {
    if (text.trim().length < 3) { setError('Descreva ao menos 3 caracteres'); return }
    setSending(true); setError('')
    const res = await fetch('/api/intern/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recordId: record.id, description: text.trim() }),
    })
    setSending(false)
    if (res.ok) {
      const { activity } = await res.json()
      setDone(true)
      setTimeout(() => { onSaved(record.id, activity); onClose() }, 1200)
    } else {
      const j = await res.json()
      setError(j.error ?? 'Erro ao salvar')
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      {/* Overlay */}
      <motion.div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
        onClick={onClose}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      />

      {/* Modal */}
      <motion.div
        className="relative w-full max-w-md rounded-3xl overflow-hidden flex flex-col"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', maxHeight: '90dvh' }}
        initial={{ y: 60, opacity: 0, scale: 0.97 }}
        animate={{ y: 0,  opacity: 1, scale: 1 }}
        exit={{   y: 60, opacity: 0, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <PenLine size={16} style={{ color: 'var(--primary)' }} />
            <p className="font-black text-sm" style={{ color: 'var(--text)' }}>Adicionar Atividade</p>
          </div>
          <button onClick={onClose} className="opacity-50 hover:opacity-100 transition-opacity">
            <X size={18} style={{ color: 'var(--text)' }} />
          </button>
        </div>

        {/* Resumo do registro */}
        <div className="px-5 py-3 flex-shrink-0" style={{ background: 'rgba(0,200,83,0.04)', borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-4">
            <div>
              <p className="text-xs font-black" style={{ color: 'var(--text)' }}>{formatDate(record.clock_in)}</p>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-3)' }}>
                <Clock size={10} className="inline mr-1" />
                {formatTime(record.clock_in)}
                {record.clock_out && <> → {formatTime(record.clock_out)}</>}
                {record.duration_minutes && <> · {minutesToHours(record.duration_minutes)}</>}
              </p>
            </div>
          </div>
        </div>

        {/* Atividades já cadastradas */}
        {record.activities.length > 0 && (
          <div className="px-5 py-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
            <p className="text-[10px] font-black mb-2" style={{ color: 'var(--text-3)' }}>ATIVIDADES JÁ REGISTRADAS</p>
            <div className="space-y-1.5">
              {record.activities.map((a, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 size={12} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--primary)' }} />
                  <div className="min-w-0">
                    <p className="text-xs leading-snug" style={{ color: 'var(--text-2)' }}>{a.description}</p>
                    {a.created_at && (
                      <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-3)' }}>
                        Adicionada em {formatDateTime(a.created_at)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Formulário */}
        <div className="px-5 py-4 flex-1 overflow-y-auto">
          {done ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center gap-3 py-6"
            >
              <CheckCircle2 size={40} style={{ color: 'var(--primary)' }} />
              <p className="font-black text-sm" style={{ color: 'var(--primary)' }}>Atividade salva!</p>
            </motion.div>
          ) : (
            <>
              <p className="text-[11px] font-bold mb-2" style={{ color: 'var(--text-3)' }}>NOVA ATIVIDADE</p>
              <textarea
                value={text}
                onChange={e => { setText(e.target.value); setError('') }}
                rows={4}
                placeholder="Descreva a atividade realizada neste período..."
                className="w-full px-4 py-3 rounded-2xl text-sm resize-none outline-none"
                style={{
                  background: 'var(--bg)',
                  border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
                  color: 'var(--text)',
                }}
                autoFocus
              />
              <div className="flex items-center justify-between mt-1">
                {error
                  ? <p className="text-xs" style={{ color: 'var(--danger)' }}>{error}</p>
                  : <span />
                }
                <p className="text-[10px]" style={{ color: text.length >= 3 ? 'var(--primary)' : 'var(--text-3)' }}>
                  {text.length < 3 ? `${text.length}/3 mín` : `${text.length} ✓`}
                </p>
              </div>

              <motion.button
                onClick={submit}
                disabled={sending || text.trim().length < 3}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-sm mt-3 transition-all disabled:opacity-40"
                style={{ background: 'var(--primary)', color: '#000' }}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              >
                <Send size={14} />
                {sending ? 'Salvando...' : 'Salvar atividade'}
              </motion.button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function HistoryClient({ records: initialRecords, monthMinutes, approvedSessions, totalHoursRequired }: Props) {
  const [records, setRecords]       = useState<TimeRecord[]>(initialRecords)
  const [activeRecord, setActive]   = useState<TimeRecord | null>(null)

  const pct      = totalHoursRequired > 0 ? Math.min(100, Math.round((monthMinutes / (totalHoursRequired * 60)) * 100)) : 0
  const pctColor = pct >= 80 ? 'var(--success)' : pct >= 40 ? 'var(--primary)' : 'var(--warning)'

  const statusDot: { [key: string]: string } = {
    approved: 'var(--success)',
    pending:  'var(--warning)',
    rejected: 'var(--danger)',
  }

  function onSaved(recordId: string, activity: Activity) {
    setRecords(prev => prev.map(r =>
      r.id === recordId
        ? { ...r, activities: [...r.activities, activity] }
        : r
    ))
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

      <main className="flex-1 min-h-0 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
        <div className="max-w-2xl mx-auto w-full px-4 py-4 space-y-3 pb-4">

          {/* Resumo do mês */}
          <FadeIn>
            <div className="rounded-3xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow-md)' }}>
              <p className="text-[10px] font-bold mb-4" style={{ color: 'var(--text-3)' }}>RESUMO DO MÊS ATUAL</p>
              <div className="flex items-center gap-5">
                <ProgressRing pct={pct} size={88} strokeWidth={9} color={pctColor}>
                  <div className="text-center">
                    <p className="text-base font-black" style={{ color: pctColor }}>{pct}%</p>
                  </div>
                </ProgressRing>
                <div className="flex-1 grid grid-cols-2 gap-3">
                  {[
                    { label: 'Total',   value: minutesToHours(monthMinutes), color: 'var(--text)' },
                    { label: 'Sessões', value: approvedSessions,             color: 'var(--success)' },
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

          {/* Lista de registros */}
          {records.length > 0 ? (
            <div className="relative">
              <div className="absolute left-[19px] top-2 bottom-2 w-px" style={{ background: 'var(--border)' }} />
              <StaggerContainer className="space-y-3 pl-11">
                {records.map(record => {
                  const semAtividade = record.clock_out && record.activities.length === 0
                  return (
                    <StaggerItem key={record.id} className="relative">
                      <div
                        className="absolute -left-[28px] top-4 w-3 h-3 rounded-full border-2 flex-shrink-0"
                        style={{ background: statusDot[record.status] ?? 'var(--text-3)', borderColor: 'var(--bg)' }}
                      />
                      <div
                        className="rounded-2xl overflow-hidden"
                        style={{
                          background: 'var(--surface)',
                          border: `1px solid ${semAtividade ? 'rgba(249,115,22,0.3)' : 'var(--border)'}`,
                          boxShadow: 'var(--card-shadow)',
                        }}
                      >
                        {/* Linha principal */}
                        <div
                          className="px-4 py-3 flex items-center justify-between gap-3"
                          style={{ borderBottom: (record.activities.length > 0 || record.rejection_reason || semAtividade) ? '1px solid var(--border)' : 'none' }}
                        >
                          <div className="min-w-0">
                            <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>{formatDate(record.clock_in)}</p>
                            <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-3)' }}>
                              {formatTime(record.clock_in)}
                              {record.clock_out
                                ? <> → {formatTime(record.clock_out)}</>
                                : <span style={{ color: 'var(--success)' }}> → em andamento</span>}
                              {record.duration_minutes && <> · {minutesToHours(record.duration_minutes)}</>}
                            </p>
                          </div>

                          {/* Botão adicionar atividade — só aparece se já saiu */}
                          {record.clock_out && (
                            <motion.button
                              onClick={() => setActive(record)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black flex-shrink-0 transition-all"
                              style={semAtividade
                                ? { background: 'rgba(249,115,22,0.12)', color: '#f97316', border: '1px solid rgba(249,115,22,0.3)' }
                                : { background: 'rgba(63,229,108,0.08)', color: 'var(--primary)', border: '1px solid rgba(63,229,108,0.2)' }
                              }
                              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            >
                              <Plus size={11} />
                              {semAtividade ? 'Adicionar' : 'Editar'}
                            </motion.button>
                          )}
                        </div>

                        {/* Aviso sem atividade */}
                        {semAtividade && (
                          <div className="px-4 py-2.5" style={{ background: 'rgba(249,115,22,0.06)' }}>
                            <p className="text-[10px]" style={{ color: '#f97316' }}>
                              ⚠ Nenhuma atividade registrada nesta sessão. Toque em "Adicionar" para complementar.
                            </p>
                          </div>
                        )}

                        {/* Atividades */}
                        {record.activities.length > 0 && (
                          <div className="px-4 py-3 space-y-2">
                            {record.activities.map((a, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <div className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0" style={{ background: 'var(--text-3)' }} />
                                <div className="min-w-0">
                                  <p className="text-xs leading-snug" style={{ color: 'var(--text-2)' }}>{a.description}</p>
                                  {a.created_at && (
                                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-3)' }}>
                                      {formatDateTime(a.created_at)}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Motivo de reprovação */}
                        {record.status === 'rejected' && record.rejection_reason && (
                          <div className="px-4 py-3" style={{ background: 'rgba(220,38,38,0.06)', borderTop: '1px solid rgba(220,38,38,0.15)' }}>
                            <p className="text-[9px] font-bold mb-0.5" style={{ color: 'var(--danger)' }}>MOTIVO DA REPROVAÇÃO</p>
                            <p className="text-xs" style={{ color: 'var(--danger)', opacity: 0.85 }}>{record.rejection_reason}</p>
                          </div>
                        )}
                      </div>
                    </StaggerItem>
                  )
                })}
              </StaggerContainer>
            </div>
          ) : (
            <FadeIn>
              <div className="rounded-3xl py-16 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <ClipboardList size={44} className="mx-auto mb-4" style={{ color: 'var(--text-3)', opacity: 0.35 }} />
                <p className="font-bold text-sm mb-1" style={{ color: 'var(--text)' }}>NENHUM REGISTRO ENCONTRADO</p>
                <p className="text-xs" style={{ color: 'var(--text-3)' }}>Seus registros dos últimos 60 dias aparecerão aqui.</p>
              </div>
            </FadeIn>
          )}
        </div>
      </main>

      {/* Bottom nav */}
      <nav className="flex-shrink-0 border-t" style={{ background: 'var(--surface)', borderColor: 'var(--border)', boxShadow: '0 -4px 20px rgba(0,0,0,0.08)' }}>
        <div className="max-w-lg mx-auto flex">
          <Link href="/dashboard"     className="flex-1 flex flex-col items-center gap-1 py-3" style={{ color: 'var(--text-3)' }}><Home size={18} /><span className="text-[10px] font-bold">INICIO</span></Link>
          <Link href="/history"       className="flex-1 flex flex-col items-center gap-1 py-3" style={{ color: 'var(--primary)' }}><ClipboardList size={18} /><span className="text-[10px] font-bold">HISTÓRICO</span></Link>
          <Link href="/intern-ranking" className="flex-1 flex flex-col items-center gap-1 py-3" style={{ color: 'var(--text-3)' }}><Trophy size={18} /><span className="text-[10px] font-bold">RANKING</span></Link>
          <Link href="/profile"       className="flex-1 flex flex-col items-center gap-1 py-3" style={{ color: 'var(--text-3)' }}><User size={18} /><span className="text-[10px] font-bold">PERFIL</span></Link>
          <form action="/api/auth/signout" method="POST" className="flex-1">
            <button type="submit" className="w-full flex flex-col items-center gap-1 py-3" style={{ color: 'var(--text-3)' }}><LogOut size={18} /><span className="text-[10px] font-bold">SAIR</span></button>
          </form>
        </div>
      </nav>

      {/* Modal de atividade */}
      <AnimatePresence>
        {activeRecord && (
          <AddActivityModal
            record={activeRecord}
            onClose={() => setActive(null)}
            onSaved={onSaved}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
