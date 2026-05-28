'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import type { InternSchedule } from '@/types/database'
import { toast } from 'sonner'
import { Clock, CheckCircle2, Loader2, X } from 'lucide-react'

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

type DaySchedule = { active: boolean; start: string; end: string; editing: boolean }

function calcHours(start: string, end: string): number {
  if (!start || !end) return 0
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return Math.max(0, (eh * 60 + em - (sh * 60 + sm)) / 60)
}

export default function ScheduleManager({ internId, initialSchedules, totalHoursRequired }: Props) {
  const supabase = createSupabaseBrowserClient()

  const buildInitial = (): Record<number, DaySchedule> => {
    const map: Record<number, DaySchedule> = {}
    for (const d of DAYS) {
      const found = initialSchedules.find(s => s.day_of_week === d.key)
      map[d.key] = found
        ? { active: found.is_active, start: found.expected_start.slice(0, 5), end: found.expected_end.slice(0, 5), editing: false }
        : { active: false, start: '08:00', end: '12:00', editing: false }
    }
    return map
  }

  const [schedule, setSchedule]     = useState<Record<number, DaySchedule>>(buildInitial)
  const [original]                  = useState<Record<number, DaySchedule>>(buildInitial)
  const [totalHours, setTotalHours] = useState<number>(totalHoursRequired ?? 120)
  const [saving, setSaving]         = useState(false)

  const scheduledHours = DAYS.filter(d => schedule[d.key]?.active)
    .reduce((sum, d) => sum + calcHours(schedule[d.key].start, schedule[d.key].end), 0)
  const remainingHours = Math.max(0, totalHours - scheduledHours)

  const toggleDay = (key: number) => {
    setSchedule(prev => ({
      ...prev,
      [key]: { ...prev[key], active: !prev[key].active, editing: !prev[key].active },
    }))
  }

  const setEditing = (key: number, val: boolean) => {
    setSchedule(prev => ({ ...prev, [key]: { ...prev[key], editing: val } }))
  }

  const updateTime = (key: number, field: 'start' | 'end', value: string) => {
    setSchedule(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }))
  }

  const discard = () => {
    setSchedule(buildInitial())
  }

  const save = async () => {
    setSaving(true)
    try {
      const { error: profileErr } = await supabase
        .from('profiles').update({ total_hours_required: totalHours }).eq('id', internId)
      if (profileErr) throw profileErr

      for (const d of DAYS) {
        const ds = schedule[d.key]
        if (ds.active) {
          const { error } = await supabase.from('intern_schedules').upsert({
            intern_id: internId, day_of_week: d.key,
            expected_start: ds.start + ':00', expected_end: ds.end + ':00', is_active: true,
          }, { onConflict: 'intern_id,day_of_week' })
          if (error) throw error
        } else {
          await supabase.from('intern_schedules')
            .update({ is_active: false }).eq('intern_id', internId).eq('day_of_week', d.key)
        }
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
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl p-6"
        style={{ background: 'var(--surface-card, #0f2318)', border: '1px solid rgba(0,200,83,0.15)' }}
      >
        <div>
          <h3 className="text-base font-semibold" style={{ color: '#3fe56c' }}>Horário do Estagiário</h3>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>
            Gerencie turnos semanais e a capacidade total necessária para este perfil.
          </p>
        </div>
        <div
          className="flex items-center gap-3 rounded-lg px-4 py-3"
          style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(0,200,83,0.15)' }}
        >
          <label className="text-[10px] font-bold tracking-wider" style={{ color: '#3fe56c' }}>
            TOTAL DE HORAS SEMANAIS
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
            <span className="text-sm font-medium" style={{ color: 'var(--text-3)' }}>hrs / semana</span>
          </div>
        </div>
      </div>

      {/* ── Day rows ── */}
      <div className="space-y-3">
        {DAYS.map((d, i) => {
          const ds = schedule[d.key]
          const timeRange = `${ds.start} — ${ds.end}`

          return (
            <motion.div
              key={d.key}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-xl overflow-hidden transition-all"
              style={{
                background: 'var(--surface-card, #0f2318)',
                border: `1px solid ${ds.active ? 'rgba(0,200,83,0.30)' : 'rgba(0,200,83,0.10)'}`,
                opacity: ds.active ? 1 : 0.6,
              }}
            >
              {/* Row */}
              <div className="flex items-center gap-3 sm:gap-6 p-4 sm:p-5">

                {/* Toggle */}
                <button
                  onClick={() => toggleDay(d.key)}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
                  style={{
                    background: ds.active ? 'rgba(0,200,83,0.15)' : 'var(--bg)',
                    border: `1px solid ${ds.active ? 'rgba(0,200,83,0.40)' : 'rgba(0,200,83,0.15)'}`,
                    color: ds.active ? '#00c853' : 'var(--text-3)',
                  }}
                >
                  <CheckCircle2 size={20} style={{ fill: ds.active ? 'rgba(0,200,83,0.15)' : 'transparent' }} />
                </button>

                {/* Day label */}
                <div className="flex items-center gap-2 flex-shrink-0" style={{ minWidth: 90 }}>
                  <div>
                    <span className="block font-bold text-[11px] tracking-tight"
                      style={{ color: ds.active ? '#3fe56c' : 'var(--text-3)' }}>
                      {d.abbr}
                    </span>
                    <span className="font-medium text-sm" style={{ color: ds.active ? 'var(--text)' : 'var(--text-3)' }}>
                      {d.full}
                    </span>
                  </div>
                </div>

                {/* Time slot pill or empty text */}
                <div className="flex-1 flex flex-wrap gap-3">
                  {ds.active ? (
                    <div
                      className="flex items-center gap-2 px-4 py-2 rounded-full"
                      style={{
                        background: 'var(--surface-variant)',
                        border: `1px solid ${ds.editing ? 'rgba(0,200,83,0.50)' : 'rgba(0,200,83,0.20)'}`,
                      }}
                    >
                      <button
                        onClick={() => setEditing(d.key, !ds.editing)}
                        className="flex items-center gap-2"
                        style={{ color: 'var(--text)' }}
                      >
                        <Clock size={13} style={{ color: '#3fe56c' }} />
                        <span className="text-sm font-medium">{timeRange}</span>
                      </button>
                      {/* Divisor discreto */}
                      <span style={{ width: 1, height: 14, background: 'rgba(0,0,0,0.12)', display: 'inline-block', flexShrink: 0 }} />
                      {/* X dentro da pílula */}
                      <button
                        onClick={() => toggleDay(d.key)}
                        title="Remover horário"
                        className="flex items-center justify-center transition-all hover:opacity-70"
                        style={{ color: 'rgba(180,40,40,0.7)', lineHeight: 1 }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <span className="text-sm italic" style={{ color: 'var(--text-3)' }}>
                      Nenhum horário configurado.
                    </span>
                  )}
                </div>

                {/* Add time button */}
                <button
                  onClick={() => { if (!ds.active) toggleDay(d.key); else setEditing(d.key, !ds.editing) }}
                  className="flex items-center gap-1.5 px-2 sm:px-4 py-2 rounded-lg text-[11px] font-bold tracking-wider transition-all flex-shrink-0"
                  style={ds.active
                    ? { border: '1px solid rgba(0,200,83,0.30)', color: '#3fe56c', background: 'transparent' }
                    : { border: '1px solid rgba(0,200,83,0.20)', color: 'var(--text-3)', background: 'transparent' }
                  }
                >
                  <span>+</span>
                  <span className="hidden sm:inline">ADICIONAR HORÁRIO</span>
                </button>
              </div>

              {/* Inline time inputs (when editing) */}
              <AnimatePresence>
                {ds.active && ds.editing && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    style={{ borderTop: '1px solid rgba(0,200,83,0.12)' }}
                  >
                    <div className="px-5 py-4 grid grid-cols-2 gap-4">
                      {(['start', 'end'] as const).map(f => (
                        <div key={f}>
                          <label className="text-[10px] font-bold flex items-center gap-1 mb-1.5" style={{ color: 'var(--text-3)' }}>
                            <Clock size={10} /> {f === 'start' ? 'Entrada' : 'Saída'}
                          </label>
                          <input
                            type="time"
                            value={f === 'start' ? ds.start : ds.end}
                            onChange={e => updateTime(d.key, f, e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); setEditing(d.key, false) } }}
                            className="w-full px-3 py-2 rounded-lg text-sm font-bold outline-none transition-all"
                            style={{
                              background: 'var(--bg)',
                              border: '1.5px solid rgba(0,200,83,0.20)',
                              color: 'var(--text)',
                            }}
                            onFocus={e => (e.target.style.borderColor = '#3fe56c')}
                            onBlur={e  => (e.target.style.borderColor = 'rgba(0,200,83,0.20)')}
                          />
                        </div>
                      ))}
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
        <div className="flex items-center gap-8">
          <div>
            <p className="text-[10px] font-bold tracking-wider mb-0.5" style={{ color: 'var(--text-3)' }}>HORAS AGENDADAS</p>
            <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>
              {scheduledHours.toFixed(0)} / {totalHours} hrs
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-wider mb-0.5" style={{ color: 'var(--text-3)' }}>RESTANTE</p>
            <p className="text-sm font-bold" style={{ color: remainingHours > 0 ? '#ffbf00' : '#00c853' }}>
              {remainingHours.toFixed(0)} hrs
            </p>
          </div>
        </div>

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
            disabled={saving}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 disabled:opacity-60"
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
