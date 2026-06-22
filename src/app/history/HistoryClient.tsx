'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home, ClipboardList, LogOut, Trophy, User,
  Plus, X, Send, CheckCircle2, Clock, PenLine,
  AlertCircle, Sparkles, Pencil, Save,
} from 'lucide-react'
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

// ── Edição inline de uma atividade existente ──────────────────────────────────
function ActivityItem({
  activity,
  onUpdated,
}: {
  activity: Activity
  onUpdated: (updated: Activity) => void
}) {
  const [editing, setEditing]   = useState(false)
  const [text, setText]         = useState(activity.description)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const [saved, setSaved]       = useState(false)

  async function save() {
    if (text.trim().length < 3) { setError('Mínimo 3 caracteres'); return }
    setSaving(true); setError('')
    const res = await fetch('/api/intern/activities', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activityId: activity.id, description: text.trim() }),
    })
    setSaving(false)
    if (res.ok) {
      const { activity: updated } = await res.json()
      setSaved(true)
      onUpdated(updated)
      setTimeout(() => { setSaved(false); setEditing(false) }, 1000)
    } else {
      const j = await res.json()
      setError(j.error ?? 'Erro ao salvar')
    }
  }

  function cancel() {
    setText(activity.description)
    setError('')
    setEditing(false)
  }

  if (editing) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-xl overflow-hidden"
        style={{ border: '1.5px solid rgba(63,229,108,0.35)', background: 'rgba(63,229,108,0.04)' }}
      >
        <textarea
          value={text}
          onChange={e => { setText(e.target.value); setError('') }}
          rows={3}
          className="w-full px-3 py-2.5 text-sm resize-none outline-none"
          style={{ background: 'transparent', color: 'var(--text)', lineHeight: 1.6 }}
          spellCheck
          autoCorrect="on"
          autoCapitalize="sentences"
          autoFocus
        />
        <div className="flex items-center justify-between px-3 pb-2.5 gap-2">
          {error
            ? <p className="text-[10px]" style={{ color: 'var(--danger)' }}>{error}</p>
            : <p className="text-[10px]" style={{ color: 'var(--text-3)' }}>A ortografia será corrigida automaticamente</p>
          }
          <div className="flex gap-1.5">
            <motion.button onClick={cancel} whileTap={{ scale: 0.94 }}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-3)' }}>
              Cancelar
            </motion.button>
            <motion.button onClick={save} disabled={saving || text.trim().length < 3}
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-black disabled:opacity-40"
              style={{ background: saved ? 'rgba(63,229,108,0.2)' : 'var(--primary)', color: saved ? 'var(--primary)' : '#000' }}>
              {saved ? <><CheckCircle2 size={11} /> Salvo!</> : saving ? 'Salvando...' : <><Save size={11} /> Salvar</>}
            </motion.button>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      layout
      className="flex items-start gap-2.5 group"
      initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
    >
      <Sparkles size={11} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--primary)', opacity: 0.7 }} />
      <div className="min-w-0 flex-1">
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>
          {activity.description}
        </p>
        {activity.created_at && (
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-3)' }}>
            {formatDateTime(activity.created_at)}
          </p>
        )}
      </div>
      <motion.button
        onClick={() => setEditing(true)}
        className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1 rounded-lg transition-opacity"
        style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-3)' }}
        whileHover={{ scale: 1.1, color: 'var(--primary)' }}
        whileTap={{ scale: 0.9 }}
        title="Editar atividade"
      >
        <Pencil size={11} />
      </motion.button>
    </motion.div>
  )
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

// ── Modal de adicionar atividade ──────────────────────────────────────────────
function AddActivityModal({
  record, onClose, onSaved, onUpdatedActivity,
}: {
  record: TimeRecord
  onClose: () => void
  onSaved: (recordId: string, activity: Activity) => void
  onUpdatedActivity: (recordId: string, updated: Activity) => void
}) {
  const [text, setText]       = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError]     = useState('')
  const [done, setDone]       = useState(false)

  const semAtividade = record.activities.length === 0

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
      setTimeout(() => { onSaved(record.id, activity); onClose() }, 1600)
    } else {
      const j = await res.json()
      setError(j.error ?? 'Erro ao salvar')
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-end justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      {/* Overlay */}
      <motion.div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      />

      {/* Drawer de baixo */}
      <motion.div
        className="relative w-full max-w-lg flex flex-col"
        style={{
          background: 'var(--surface)',
          borderRadius: '28px 28px 0 0',
          border: '1px solid var(--border)',
          borderBottom: 'none',
          maxHeight: '88dvh',
          boxShadow: '0 -24px 64px rgba(0,0,0,0.5)',
        }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 38 }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border)' }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3 pt-1 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: semAtividade ? 'rgba(249,115,22,0.15)' : 'rgba(63,229,108,0.12)' }}
            >
              <PenLine size={15} style={{ color: semAtividade ? '#f97316' : 'var(--primary)' }} />
            </div>
            <div>
              <p className="font-black text-sm leading-tight" style={{ color: 'var(--text)' }}>
                {semAtividade ? 'Adicionar Atividade' : 'Nova Atividade'}
              </p>
              <p className="text-[10px]" style={{ color: 'var(--text-3)' }}>
                {formatDate(record.clock_in)} · {formatTime(record.clock_in)}
                {record.clock_out ? ` → ${formatTime(record.clock_out)}` : ''}
              </p>
            </div>
          </div>
          <motion.button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-3)' }}
            whileHover={{ scale: 1.08, background: 'rgba(255,255,255,0.1)' }}
            whileTap={{ scale: 0.94 }}
          >
            <X size={15} />
          </motion.button>
        </div>

        {/* Info do registro — entrada/saída/duração */}
        <div className="mx-5 mb-3 flex-shrink-0 rounded-2xl px-4 py-3 flex items-center gap-3"
          style={{ background: 'rgba(0,200,83,0.06)', border: '1px solid rgba(0,200,83,0.15)' }}>
          <Clock size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
          <div className="flex gap-4 text-xs">
            <div>
              <p className="text-[10px] font-bold mb-0.5" style={{ color: 'var(--text-3)' }}>ENTRADA</p>
              <p className="font-black" style={{ color: 'var(--text)' }}>{formatTime(record.clock_in)}</p>
            </div>
            {record.clock_out && (
              <>
                <div style={{ width: 1, background: 'var(--border)' }} />
                <div>
                  <p className="text-[10px] font-bold mb-0.5" style={{ color: 'var(--text-3)' }}>SAÍDA</p>
                  <p className="font-black" style={{ color: 'var(--text)' }}>{formatTime(record.clock_out)}</p>
                </div>
              </>
            )}
            {record.duration_minutes && (
              <>
                <div style={{ width: 1, background: 'var(--border)' }} />
                <div>
                  <p className="text-[10px] font-bold mb-0.5" style={{ color: 'var(--text-3)' }}>DURAÇÃO</p>
                  <p className="font-black" style={{ color: 'var(--primary)' }}>{minutesToHours(record.duration_minutes)}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Corpo scrollável */}
        <div className="flex-1 overflow-y-auto px-5 pb-6" style={{ scrollbarWidth: 'none' }}>

          {/* Atividades já cadastradas */}
          {record.activities.length > 0 && (
            <div className="mb-4">
              <p className="text-[10px] font-black mb-2.5 tracking-wide" style={{ color: 'var(--text-3)' }}>
                JÁ REGISTRADAS — toque no lápis para editar
              </p>
              <div className="space-y-2">
                {record.activities.map((a, i) => (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="rounded-2xl px-3 py-2.5"
                    style={{ background: 'rgba(63,229,108,0.05)', border: '1px solid rgba(63,229,108,0.12)' }}
                  >
                    <ActivityItem
                      activity={a}
                      onUpdated={updated => onUpdatedActivity(record.id, updated)}
                    />
                  </motion.div>
                ))}
              </div>
              <div className="my-4 h-px" style={{ background: 'var(--border)' }} />
            </div>
          )}

          {/* Formulário ou sucesso */}
          <AnimatePresence mode="wait">
            {done ? (
              <motion.div
                key="done"
                initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.85, opacity: 0 }}
                className="flex flex-col items-center gap-4 py-10"
              >
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 0.4 }}
                  className="w-16 h-16 rounded-3xl flex items-center justify-center"
                  style={{ background: 'rgba(63,229,108,0.15)', border: '2px solid rgba(63,229,108,0.3)' }}
                >
                  <CheckCircle2 size={32} style={{ color: 'var(--primary)' }} />
                </motion.div>
                <div className="text-center">
                  <p className="font-black text-base" style={{ color: 'var(--primary)' }}>Atividade salva!</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>O registro foi atualizado com sucesso.</p>
                </div>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <p className="text-[10px] font-black mb-2.5 tracking-wide" style={{ color: 'var(--text-3)' }}>
                  {record.activities.length > 0 ? 'ADICIONAR OUTRA' : 'O QUE VOCÊ FEZ?'}
                </p>

                <div className="relative">
                  <textarea
                    value={text}
                    onChange={e => { setText(e.target.value); setError('') }}
                    rows={5}
                    placeholder="Ex: Analisei amostras, preparei meios de cultura, realizei leituras de placa..."
                    className="w-full px-4 py-3.5 rounded-2xl text-sm resize-none outline-none transition-all"
                    style={{
                      background: 'var(--bg)',
                      border: `1.5px solid ${error ? 'var(--danger)' : text.length >= 3 ? 'rgba(63,229,108,0.4)' : 'var(--border)'}`,
                      color: 'var(--text)',
                      lineHeight: 1.6,
                    }}
                    spellCheck
                    autoCorrect="on"
                    autoCapitalize="sentences"
                    autoFocus
                  />
                  {/* Contador */}
                  <span
                    className="absolute bottom-3 right-3 text-[10px] font-bold pointer-events-none"
                    style={{ color: text.length >= 3 ? 'rgba(63,229,108,0.6)' : 'var(--text-3)' }}
                  >
                    {text.length >= 3 ? `${text.length} ✓` : `${text.length}/3`}
                  </span>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="flex items-center gap-1.5 mt-2"
                    >
                      <AlertCircle size={12} style={{ color: 'var(--danger)' }} />
                      <p className="text-xs" style={{ color: 'var(--danger)' }}>{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button
                  onClick={submit}
                  disabled={sending || text.trim().length < 3}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-sm mt-4 transition-all disabled:opacity-40"
                  style={{ background: 'var(--primary)', color: '#000' }}
                  whileHover={{ scale: 1.02, boxShadow: '0 8px 24px rgba(63,229,108,0.3)' }}
                  whileTap={{ scale: 0.97 }}
                >
                  {sending ? (
                    <>
                      <motion.div
                        className="w-4 h-4 rounded-full border-2 border-black border-t-transparent"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
                      />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      Salvar atividade
                    </>
                  )}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function HistoryClient({ records: initialRecords, monthMinutes, approvedSessions, totalHoursRequired }: Props) {
  const [records, setRecords]     = useState<TimeRecord[]>(initialRecords)
  const [activeRecord, setActive] = useState<TimeRecord | null>(null)

  const pct      = totalHoursRequired > 0 ? Math.min(100, Math.round((monthMinutes / (totalHoursRequired * 60)) * 100)) : 0
  const pctColor = pct >= 80 ? 'var(--success)' : pct >= 40 ? 'var(--primary)' : 'var(--warning)'

  const statusDot: { [key: string]: string } = {
    approved: 'var(--success)',
    pending:  'var(--warning)',
    rejected: 'var(--danger)',
  }

  function onSaved(recordId: string, activity: Activity) {
    setRecords(prev => prev.map(r =>
      r.id === recordId ? { ...r, activities: [...r.activities, activity] } : r
    ))
  }

  function onUpdatedActivity(recordId: string, updated: Activity) {
    setRecords(prev => prev.map(r =>
      r.id === recordId
        ? { ...r, activities: r.activities.map(a => a.id === updated.id ? updated : a) }
        : r
    ))
    // Atualiza também o record ativo no modal se estiver aberto
    setActive(prev => prev?.id === recordId
      ? { ...prev, activities: prev.activities.map(a => a.id === updated.id ? updated : a) }
      : prev
    )
  }

  const pendentes = records.filter(r => r.clock_out && r.activities.length === 0).length

  return (
    <div className="flex flex-col" style={{ height: '100dvh', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* Header */}
      <header className="flex-shrink-0 shadow-lg" style={{ background: 'var(--nav-bg)' }}>
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center gap-4">
          <Link href="/dashboard" className="text-sm font-bold hover:opacity-70" style={{ color: 'var(--nav-muted)' }}>
            &larr;
          </Link>
          <div className="flex-1">
            <h1 className="font-bold text-base" style={{ color: 'var(--nav-fg)' }}>MEU HISTÓRICO</h1>
            <p className="text-[10px]" style={{ color: 'var(--nav-muted)' }}>ÚLTIMOS 60 DIAS DE REGISTROS</p>
          </div>
          {/* Badge de sessões sem atividade */}
          {pendentes > 0 && (
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.3)' }}
            >
              <AlertCircle size={11} style={{ color: '#f97316' }} />
              <span className="text-[10px] font-black" style={{ color: '#f97316' }}>
                {pendentes} sem atividade
              </span>
            </motion.div>
          )}
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
                      {/* Dot na timeline */}
                      <motion.div
                        className="absolute -left-[28px] top-4 w-3 h-3 rounded-full border-2 flex-shrink-0"
                        style={{ background: statusDot[record.status] ?? 'var(--text-3)', borderColor: 'var(--bg)' }}
                        animate={semAtividade ? { scale: [1, 1.25, 1] } : {}}
                        transition={{ duration: 1.8, repeat: Infinity }}
                      />

                      <motion.div
                        className="rounded-2xl overflow-hidden"
                        style={{
                          background: 'var(--surface)',
                          border: `1px solid ${semAtividade ? 'rgba(249,115,22,0.35)' : 'var(--border)'}`,
                          boxShadow: semAtividade ? '0 0 0 3px rgba(249,115,22,0.06)' : 'var(--card-shadow)',
                        }}
                        whileHover={{ y: -1 }}
                        transition={{ duration: 0.15 }}
                      >
                        {/* Linha de entrada/saída + botão */}
                        <div
                          className="px-4 py-3 flex items-center justify-between gap-3"
                          style={{
                            borderBottom: (record.activities.length > 0 || record.rejection_reason || semAtividade)
                              ? '1px solid var(--border)' : 'none',
                          }}
                        >
                          <div className="min-w-0">
                            <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>
                              {formatDate(record.clock_in)}
                            </p>
                            <p className="text-[11px] mt-0.5 flex items-center gap-1" style={{ color: 'var(--text-3)' }}>
                              <Clock size={10} />
                              {formatTime(record.clock_in)}
                              {record.clock_out
                                ? <> → {formatTime(record.clock_out)}</>
                                : <span style={{ color: 'var(--success)' }}> → em andamento</span>}
                              {record.duration_minutes && (
                                <span style={{ color: 'var(--primary)' }}>· {minutesToHours(record.duration_minutes)}</span>
                              )}
                            </p>
                          </div>

                          {/* Botão — só se tiver saída registrada */}
                          {record.clock_out && (
                            <motion.button
                              onClick={() => setActive(record)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black flex-shrink-0"
                              style={semAtividade
                                ? { background: 'rgba(249,115,22,0.14)', color: '#f97316', border: '1px solid rgba(249,115,22,0.35)' }
                                : { background: 'rgba(63,229,108,0.08)', color: 'var(--primary)', border: '1px solid rgba(63,229,108,0.2)' }
                              }
                              whileHover={{ scale: 1.06 }}
                              whileTap={{ scale: 0.94 }}
                            >
                              <Plus size={11} />
                              {semAtividade ? 'Adicionar' : '+ Atividade'}
                            </motion.button>
                          )}
                        </div>

                        {/* Banner de alerta sem atividade */}
                        {semAtividade && (
                          <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="px-4 py-2 flex items-center gap-2"
                            style={{ background: 'rgba(249,115,22,0.07)' }}
                          >
                            <AlertCircle size={12} style={{ color: '#f97316', flexShrink: 0 }} />
                            <p className="text-[11px]" style={{ color: '#f97316' }}>
                              Sessão sem atividade registrada — toque em <strong>Adicionar</strong> para complementar
                            </p>
                          </motion.div>
                        )}

                        {/* Lista de atividades */}
                        {record.activities.length > 0 && (
                          <div className="px-4 py-3 space-y-2.5">
                            {record.activities.map((a, i) => (
                              <motion.div
                                key={a.id}
                                initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.04 }}
                              >
                                <ActivityItem
                                  activity={a}
                                  onUpdated={updated => onUpdatedActivity(record.id, updated)}
                                />
                              </motion.div>
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
                      </motion.div>
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
          {[
            { href: '/dashboard',     icon: <Home size={18} />,          label: 'INICIO',    active: false },
            { href: '/history',       icon: <ClipboardList size={18} />, label: 'HISTÓRICO', active: true  },
            { href: '/intern-ranking', icon: <Trophy size={18} />,        label: 'RANKING',   active: false },
            { href: '/profile',       icon: <User size={18} />,          label: 'PERFIL',    active: false },
          ].map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center gap-1 py-3"
              style={{ color: item.active ? 'var(--primary)' : 'var(--text-3)' }}
            >
              {item.icon}
              <span className="text-[10px] font-bold">{item.label}</span>
            </Link>
          ))}
          <form action="/api/auth/signout" method="POST" className="flex-1">
            <button type="submit" className="w-full flex flex-col items-center gap-1 py-3" style={{ color: 'var(--text-3)' }}>
              <LogOut size={18} />
              <span className="text-[10px] font-bold">SAIR</span>
            </button>
          </form>
        </div>
      </nav>

      {/* Drawer de atividade */}
      <AnimatePresence>
        {activeRecord && (
          <AddActivityModal
            record={activeRecord}
            onClose={() => setActive(null)}
            onSaved={onSaved}
            onUpdatedActivity={onUpdatedActivity}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
