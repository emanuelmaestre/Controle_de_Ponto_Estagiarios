'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import type { InternSchedule } from '@/types/database'
import { toast } from 'sonner'
import { Clock, CheckCircle2, Loader2, X, Plus, AlertTriangle } from 'lucide-react'
import { slotMinutes, weeklyMinutes, formatHm } from '@/lib/schedule'

const DAYS = [
  { key: 1, abbr: 'SEG', full: 'Segunda-feira' },
  { key: 2, abbr: 'TER', full: 'Terça-feira'  },
  { key: 3, abbr: 'QUA', full: 'Quarta-feira' },
  { key: 4, abbr: 'QUI', full: 'Quinta-feira' },
  { key: 5, abbr: 'SEX', full: 'Sexta-feira'  },
  { key: 6, abbr: 'SÁB', full: 'Sábado'       },
  { key: 0, abbr: 'DOM', full: 'Domingo'      },
]

interface Props {
  internId: string
  initialSchedules: InternSchedule[]
  totalHoursRequired: number | null
}

type Slot = { key: string; start: string; end: string }

const newSlot = (start = '08:00', end = '12:00'): Slot => ({
  key: (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36)), start, end,
})

export default function ScheduleManager({ internId, initialSchedules, totalHoursRequired }: Props) {
  const supabase = createSupabaseBrowserClient()

  const buildInitial = (): Record<number, Slot[]> => {
    const map: Record<number, Slot[]> = {}
    for (const d of DAYS) {
      map[d.key] = initialSchedules
        .filter(s => s.day_of_week === d.key && s.is_active)
        .sort((a, b) => a.expected_start.localeCompare(b.expected_start))
        .map(s => newSlot(s.expected_start.slice(0, 5), s.expected_end.slice(0, 5)))
    }
    return map
  }

  const [schedule, setSchedule]       = useState<Record<number, Slot[]>>(buildInitial)
  const [totalHours, setTotalHours]   = useState<number>(totalHoursRequired ?? 120)
  const [saving, setSaving]           = useState(false)
  const [dayConfirmed, setDayConfirmed] = useState<Record<number, 'saving' | 'done'>>({})

  const saveDay = async (dayKey: number) => {
    const slots = schedule[dayKey]
    const invalid = slots.some(s => s.start && s.end && slotMinutes(s.start, s.end) === null)
    if (invalid) { toast.error('Corrija os horários inválidos antes de confirmar.'); return }

    setDayConfirmed(prev => ({ ...prev, [dayKey]: 'saving' }))
    try {
      await supabase.from('intern_schedules').delete().match({ intern_id: internId, day_of_week: dayKey })
      const rows = slots
        .filter(s => slotMinutes(s.start, s.end) !== null)
        .map(s => ({ intern_id: internId, day_of_week: dayKey, expected_start: s.start + ':00', expected_end: s.end + ':00', is_active: true }))
      if (rows.length > 0) await supabase.from('intern_schedules').insert(rows)
      setDayConfirmed(prev => ({ ...prev, [dayKey]: 'done' }))
      setTimeout(() => setDayConfirmed(prev => { const n = { ...prev }; delete n[dayKey]; return n }), 2500)
      toast.success(`${DAYS.find(d => d.key === dayKey)?.full} salvo!`)
    } catch {
      toast.error('Erro ao salvar o dia.')
      setDayConfirmed(prev => { const n = { ...prev }; delete n[dayKey]; return n })
    }
  }

  // ── Cálculo (fonte única: lib/schedule) ──
  const weeklyMin     = weeklyMinutes(schedule)               // soma real dos turnos da semana
  const totalLoadMin  = Math.max(0, totalHours) * 60          // carga total obrigatória do estágio
  const remainingMin  = Math.max(0, totalLoadMin - weeklyMin)
  const allSlots      = DAYS.flatMap(d => schedule[d.key])
  const hasInvalid    = allSlots.some(s => s.start && s.end && slotMinutes(s.start, s.end) === null)

  const addSlot = (day: number) => {
    setSchedule(prev => {
      const slots = prev[day]
      const last = slots[slots.length - 1]
      const start = last ? last.end : '08:00'
      return { ...prev, [day]: [...slots, newSlot(start, start)] }
    })
  }

  const removeSlot = (day: number, key: string) => {
    setSchedule(prev => ({ ...prev, [day]: prev[day].filter(s => s.key !== key) }))
  }

  const updateSlot = (day: number, key: string, field: 'start' | 'end', value: string) => {
    setSchedule(prev => ({
      ...prev,
      [day]: prev[day].map(s => s.key === key ? { ...s, [field]: value } : s),
    }))
  }

  const clearDay = (day: number) => {
    setSchedule(prev => ({ ...prev, [day]: [] }))
  }

  const discard = () => setSchedule(buildInitial())

  const save = async () => {
    if (hasInvalid) {
      toast.error('Há turnos com horário de saída anterior ou igual à entrada.')
      return
    }
    setSaving(true)
    try {
      const { error: profileErr } = await supabase
        .from('profiles').update({ total_hours_required: totalHours }).eq('id', internId)
      if (profileErr) throw profileErr

      // Substitui todos os horários: apaga os existentes e insere os atuais válidos
      const { error: delErr } = await supabase
        .from('intern_schedules').delete().eq('intern_id', internId)
      if (delErr) throw delErr

      const rows = DAYS.flatMap(d =>
        schedule[d.key]
          .filter(s => slotMinutes(s.start, s.end) !== null)
          .map(s => ({
            intern_id: internId,
            day_of_week: d.key,
            expected_start: s.start + ':00',
            expected_end: s.end + ':00',
            is_active: true,
          })),
      )

      if (rows.length > 0) {
        const { error: insErr } = await supabase.from('intern_schedules').insert(rows)
        if (insErr) throw insErr
      }

      toast.success('Horário salvo com sucesso!')
    } catch (e) {
      toast.error('Erro ao salvar horário.')
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">

      {/* ── Header section ── */}
      <div
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-xl p-6"
        style={{ background: 'var(--surface-card, #0f2318)', border: '1px solid rgba(0,200,83,0.15)' }}
      >
        <div>
          <h3 className="text-base font-semibold" style={{ color: '#3fe56c' }}>Horário do Estagiário</h3>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>
            Adicione quantos turnos precisar por dia. Ideal para horários personalizados.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
          {/* Carga total obrigatória (editável) */}
          <div
            className="flex items-center justify-between gap-3 rounded-lg px-4 py-3"
            style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(0,200,83,0.15)' }}
          >
            <label className="text-[10px] font-bold tracking-wider" style={{ color: 'var(--text-3)' }}>
              CARGA HORÁRIA TOTAL
            </label>
            <div
              className="flex items-center gap-2 rounded px-3 py-1"
              style={{ background: 'var(--bg)', border: '1px solid rgba(0,200,83,0.25)' }}
            >
              <input
                type="number" min={1} max={9999} value={totalHours}
                onChange={e => setTotalHours(Number(e.target.value))}
                className="w-12 text-center font-bold text-lg outline-none bg-transparent"
                style={{ color: 'var(--text)' }}
              />
              <span className="text-sm font-medium" style={{ color: 'var(--text-3)' }}>hrs</span>
            </div>
          </div>

          {/* Total de horas semanais (somente leitura — soma dos turnos) */}
          <div
            className="flex items-center justify-between gap-3 rounded-lg px-4 py-3"
            style={{ background: 'rgba(0,200,83,0.08)', border: '1px solid rgba(0,200,83,0.30)' }}
          >
            <label className="text-[10px] font-bold tracking-wider" style={{ color: '#3fe56c' }}>
              TOTAL DE HORAS SEMANAIS
            </label>
            <span className="font-bold text-lg tabular-nums" style={{ color: 'var(--text)' }}>
              {formatHm(weeklyMin)}
              <span className="text-xs font-medium ml-1" style={{ color: 'var(--text-3)' }}>/semana</span>
            </span>
          </div>
        </div>
      </div>

      {/* ── Day rows ── */}
      <div className="space-y-3">
        {DAYS.map((d, i) => {
          const slots = schedule[d.key]
          const active = slots.length > 0
          const dayMin = slots.reduce((sum, s) => sum + (slotMinutes(s.start, s.end) ?? 0), 0)

          return (
            <motion.div
              key={d.key}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-xl overflow-hidden transition-all"
              style={{
                background: 'var(--surface-card, #0f2318)',
                border: `1px solid ${active ? 'rgba(0,200,83,0.30)' : 'rgba(0,200,83,0.10)'}`,
                opacity: active ? 1 : 0.6,
              }}
            >
              {/* Header row */}
              <div className="flex items-center gap-3 sm:gap-6 p-4 sm:p-5">
                {/* Toggle */}
                <button
                  onClick={() => active ? clearDay(d.key) : addSlot(d.key)}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
                  style={{
                    background: active ? 'rgba(0,200,83,0.15)' : 'var(--bg)',
                    border: `1px solid ${active ? 'rgba(0,200,83,0.40)' : 'rgba(0,200,83,0.15)'}`,
                    color: active ? '#00c853' : 'var(--text-3)',
                  }}
                >
                  <CheckCircle2 size={20} style={{ fill: active ? 'rgba(0,200,83,0.15)' : 'transparent' }} />
                </button>

                {/* Day label */}
                <div className="flex items-center gap-2 flex-shrink-0" style={{ minWidth: 90 }}>
                  <div>
                    <span className="block font-bold text-[11px] tracking-tight"
                      style={{ color: active ? '#3fe56c' : 'var(--text-3)' }}>
                      {d.abbr}
                    </span>
                    <span className="font-medium text-sm" style={{ color: active ? 'var(--text)' : 'var(--text-3)' }}>
                      {d.full}
                    </span>
                  </div>
                </div>

                {/* Summary / empty */}
                <div className="flex-1">
                  {active ? (
                    <span className="text-sm font-medium" style={{ color: 'var(--text-3)' }}>
                      {slots.length} {slots.length === 1 ? 'turno' : 'turnos'}
                      <span className="mx-1.5" style={{ opacity: 0.4 }}>·</span>
                      <span style={{ color: '#3fe56c' }}>{formatHm(dayMin)}</span>
                    </span>
                  ) : (
                    <span className="text-sm italic" style={{ color: 'var(--text-3)' }}>
                      Nenhum horário configurado.
                    </span>
                  )}
                </div>

                {/* Add time button */}
                <button
                  onClick={() => addSlot(d.key)}
                  className="flex items-center gap-1.5 px-2 sm:px-4 py-2 rounded-lg text-[11px] font-bold tracking-wider transition-all flex-shrink-0"
                  style={{ border: '1px solid rgba(0,200,83,0.30)', color: '#3fe56c', background: 'transparent' }}
                >
                  <Plus size={13} />
                  <span className="hidden sm:inline">ADICIONAR HORÁRIO</span>
                </button>
              </div>

              {/* Slots list */}
              <AnimatePresence initial={false}>
                {active && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    style={{ borderTop: '1px solid rgba(0,200,83,0.12)' }}
                  >
                    <div className="px-4 sm:px-5 py-4 space-y-3">
                      <AnimatePresence initial={false}>
                        {slots.map((s, idx) => {
                          const min = slotMinutes(s.start, s.end)
                          const invalid = !!s.start && !!s.end && min === null
                          return (
                            <motion.div
                              key={s.key}
                              layout
                              initial={{ opacity: 0, y: -6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, x: 10 }}
                              transition={{ duration: 0.18 }}
                            >
                              <div className="flex items-end gap-3">
                                <span
                                  className="text-[10px] font-bold w-5 text-center pb-2.5 flex-shrink-0"
                                  style={{ color: 'var(--text-3)' }}
                                >
                                  {idx + 1}
                                </span>

                                {(['start', 'end'] as const).map(f => (
                                  <div key={f} className="flex-1 min-w-0">
                                    <label className="text-[10px] font-bold flex items-center gap-1 mb-1.5" style={{ color: 'var(--text-3)' }}>
                                      <Clock size={10} /> {f === 'start' ? 'Entrada' : 'Saída'}
                                    </label>
                                    <input
                                      type="time"
                                      value={f === 'start' ? s.start : s.end}
                                      onChange={e => updateSlot(d.key, s.key, f, e.target.value)}
                                      className="w-full px-3 py-2 rounded-lg text-sm font-bold outline-none transition-all"
                                      style={{
                                        background: 'var(--bg)',
                                        border: `1.5px solid ${invalid ? 'rgba(255,82,82,0.6)' : 'rgba(0,200,83,0.20)'}`,
                                        color: 'var(--text)',
                                      }}
                                      onFocus={e => (e.target.style.borderColor = invalid ? '#ff5252' : '#3fe56c')}
                                      onBlur={e  => (e.target.style.borderColor = invalid ? 'rgba(255,82,82,0.6)' : 'rgba(0,200,83,0.20)')}
                                    />
                                  </div>
                                ))}

                                {/* Hours badge */}
                                <span
                                  className="text-[11px] font-bold pb-2.5 w-14 text-right flex-shrink-0 tabular-nums"
                                  style={{ color: invalid ? 'var(--danger)' : 'var(--text-3)' }}
                                >
                                  {min !== null ? formatHm(min) : '—'}
                                </span>

                                {/* Remove */}
                                <button
                                  onClick={() => removeSlot(d.key, s.key)}
                                  title="Remover turno"
                                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all hover:opacity-70"
                                  style={{ border: '1px solid rgba(255,82,82,0.25)', color: 'rgba(255,82,82,0.8)', background: 'transparent' }}
                                >
                                  <X size={15} />
                                </button>
                              </div>

                              {/* Mensagem de turno inválido (não quebra o formulário) */}
                              {invalid && (
                                <p className="text-[11px] mt-1.5 ml-8 flex items-center gap-1" style={{ color: 'var(--danger)' }}>
                                  <AlertTriangle size={11} />
                                  A saída deve ser depois da entrada.
                                </p>
                              )}
                            </motion.div>
                          )
                        })}
                      </AnimatePresence>

                      {/* Botão Confirmar dia */}
                      <div className="flex justify-end pt-1">
                        <motion.button
                          onClick={() => saveDay(d.key)}
                          disabled={dayConfirmed[d.key] === 'saving'}
                          whileTap={{ scale: 0.96 }}
                          className="flex items-center gap-2 px-5 py-2 rounded-lg text-[11px] font-bold tracking-wider transition-all"
                          style={{
                            background: dayConfirmed[d.key] === 'done' ? 'rgba(0,200,83,0.15)' : '#00c853',
                            color: dayConfirmed[d.key] === 'done' ? '#3fe56c' : '#003912',
                            border: dayConfirmed[d.key] === 'done' ? '1px solid rgba(0,200,83,0.4)' : 'none',
                          }}
                        >
                          {dayConfirmed[d.key] === 'saving' ? (
                            <><Loader2 size={12} className="animate-spin" /> Salvando...</>
                          ) : dayConfirmed[d.key] === 'done' ? (
                            <><CheckCircle2 size={13} /> Confirmado!</>
                          ) : (
                            <><CheckCircle2 size={13} /> Confirmar</>
                          )}
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>

      {/* ── Sticky bottom bar ── */}
      <div
        className="sticky bottom-0 rounded-xl mt-2 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4"
        style={{ background: 'var(--surface-card, #0f2318)', border: '1px solid rgba(0,200,83,0.20)', boxShadow: '0 -4px 20px rgba(0,0,0,0.3)' }}
      >
        <div />

        <div className="flex items-center gap-3">
          <button
            onClick={discard}
            className="px-5 py-2.5 rounded-lg text-sm font-bold transition-all hover:opacity-80"
            style={{ border: '1px solid rgba(0,200,83,0.20)', color: 'var(--text-3)', background: 'transparent' }}
          >
            DESCARTAR ALTERAÇÕES
          </button>
          <motion.button
            onClick={save}
            disabled={saving || hasInvalid}
            whileHover={{ scale: saving || hasInvalid ? 1 : 1.02 }}
            whileTap={{ scale: saving || hasInvalid ? 1 : 0.97 }}
            className="px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: '#3fe56c', color: '#003912' }}
          >
            {saving
              ? <><Loader2 size={14} className="animate-spin" /> Salvando...</>
              : 'SALVAR CRONOGRAMA'
            }
          </motion.button>
        </div>
      </div>
    </div>
  )
}
