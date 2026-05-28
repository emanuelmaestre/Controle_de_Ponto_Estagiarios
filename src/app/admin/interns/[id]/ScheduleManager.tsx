'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import type { InternSchedule } from '@/types/database'
import { toast } from 'sonner'
import { Clock, Check, X, Loader2, Save } from 'lucide-react'

const DAYS = [
  { key: 1, label: 'SEG', full: 'SEGUNDA-FEIRA',  color: 'var(--primary-light)' },
  { key: 2, label: 'TER', full: 'TERÇA-FEIRA',    color: 'var(--primary-light)' },
  { key: 3, label: 'QUA', full: 'QUARTA-FEIRA',   color: 'var(--primary-light)' },
  { key: 4, label: 'QUI', full: 'QUINTA-FEIRA',   color: 'var(--primary-light)' },
  { key: 5, label: 'SEX', full: 'SEXTA-FEIRA',    color: 'var(--primary-light)' },
  { key: 6, label: 'SAB', full: 'SÁBADO',         color: 'var(--warning)' },
  { key: 0, label: 'DOM', full: 'DOMINGO',        color: 'var(--accent-light)' },
]

interface Props {
  internId: string
  initialSchedules: InternSchedule[]
  totalHoursRequired: number | null
}

type DaySchedule = { active: boolean; start: string; end: string }

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
        ? { active: found.is_active, start: found.expected_start.slice(0, 5), end: found.expected_end.slice(0, 5) }
        : { active: false, start: '08:00', end: '12:00' }
    }
    return map
  }

  const [schedule, setSchedule] = useState<Record<number, DaySchedule>>(buildInitial)
  const [totalHours, setTotalHours] = useState<number>(totalHoursRequired ?? 120)
  const [saving, setSaving] = useState(false)

  const weeklyHours = DAYS.filter(d => schedule[d.key]?.active)
    .reduce((sum, d) => sum + calcHours(schedule[d.key].start, schedule[d.key].end), 0)

  const toggleDay = (key: number) => {
    setSchedule(prev => ({ ...prev, [key]: { ...prev[key], active: !prev[key].active } }))
  }

  const updateTime = (key: number, field: 'start' | 'end', value: string) => {
    setSchedule(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }))
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
    <div className="space-y-4">

      {/* ── Carga horária total ───────────────────────── */}
      <div className="rounded-xl px-4 py-3 flex items-center justify-between gap-4"
        style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
        <div className="min-w-0">
          <p className="text-xs font-bold" style={{ color: 'var(--text)' }}>Carga Horária Total</p>
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-3)' }}>
            Semana atual:&nbsp;
            <span style={{ color: 'var(--primary-light)', fontWeight: 700 }}>{weeklyHours.toFixed(1)}h/sem</span>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <input
            type="number" min={1} max={9999} value={totalHours}
            onChange={e => setTotalHours(Number(e.target.value))}
            className="w-20 text-center font-bold text-lg rounded-xl px-2 py-1.5 outline-none"
            style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', color: 'var(--text)' }}
            onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
            onBlur={e  => (e.target.style.borderColor = 'var(--border)')}
          />
          <span className="text-xs font-bold" style={{ color: 'var(--text-3)' }}>H</span>
        </div>
      </div>

      {/* ── Dias da semana ────────────────────────────── */}
      <div className="space-y-2">
        {DAYS.map((d, i) => {
          const ds = schedule[d.key]
          const hours = ds.active ? calcHours(ds.start, ds.end) : 0

          return (
            <motion.div
              key={d.key}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.035 }}
              className="rounded-2xl overflow-hidden"
              style={{
                border: `1.5px solid ${ds.active ? 'var(--primary)' : 'var(--border)'}`,
                background: ds.active ? 'var(--surface)' : 'var(--bg)',
                boxShadow: ds.active ? 'var(--card-shadow)' : 'none',
                transition: 'border-color 0.2s, background 0.2s',
              }}
            >
              {/* ── Day header row ──── */}
              <div className="flex items-center gap-3 px-3 py-2.5">

                {/* Toggle button */}
                <motion.button
                  type="button"
                  onClick={() => toggleDay(d.key)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.88 }}
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
                  style={{
                    background: ds.active ? 'var(--primary)' : 'var(--bg-secondary)',
                    border: `1.5px solid ${ds.active ? 'var(--primary)' : 'var(--border)'}`,
                    boxShadow: ds.active ? '0 2px 10px rgba(30,92,45,0.4)' : 'none',
                  }}
                >
                  <AnimatePresence mode="wait">
                    {ds.active ? (
                      <motion.div key="check" initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}>
                        <Check size={14} color="white" />
                      </motion.div>
                    ) : (
                      <motion.div key="x" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                        <X size={14} style={{ color: 'var(--text-3)' }} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>

                {/* Day label pill */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-lg flex-shrink-0"
                    style={{
                      background: ds.active ? `${d.color}18` : 'var(--bg-secondary)',
                      color: ds.active ? d.color : 'var(--text-3)',
                      border: `1px solid ${ds.active ? `${d.color}30` : 'transparent'}`,
                    }}>
                    {d.label}
                  </span>
                  <span className="text-xs font-bold truncate"
                    style={{ color: ds.active ? 'var(--text)' : 'var(--text-3)' }}>
                    {d.full}
                  </span>
                </div>

                {/* Hours badge when active */}
                {ds.active && hours > 0 && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-[10px] font-black px-2 py-0.5 rounded-lg flex-shrink-0"
                    style={{ background: 'rgba(30,92,45,0.12)', color: 'var(--primary-light)' }}
                  >
                    {hours.toFixed(1)}H
                  </motion.span>
                )}
              </div>

              {/* ── Inline time inputs (shown when active) ──── */}
              <AnimatePresence>
                {ds.active && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    style={{ borderTop: '1px solid var(--border)' }}
                  >
                    <div className="px-3 py-3 grid grid-cols-2 gap-3">
                      {(['start', 'end'] as const).map(f => (
                        <div key={f}>
                          <label className="text-[10px] font-bold flex items-center gap-1 mb-1.5" style={{ color: 'var(--text-3)' }}>
                            <Clock size={10} style={{ color: f === 'start' ? 'var(--success)' : 'var(--accent-light)' }} />
                            {f === 'start' ? 'Entrada' : 'Saída'}
                          </label>
                          <input
                            type="time"
                            value={f === 'start' ? ds.start : ds.end}
                            onChange={e => updateTime(d.key, f, e.target.value)}
                            className="w-full px-3 py-2 rounded-xl text-sm font-bold outline-none transition-all"
                            style={{
                              background: 'var(--bg)',
                              border: `1.5px solid ${f === 'start' ? 'rgba(22,163,74,0.3)' : 'rgba(220,38,38,0.2)'}`,
                              color: 'var(--text)',
                            }}
                            onFocus={e => (e.target.style.borderColor = f === 'start' ? 'var(--success)' : 'var(--accent)')}
                            onBlur={e  => (e.target.style.borderColor = f === 'start' ? 'rgba(22,163,74,0.3)' : 'rgba(220,38,38,0.2)')}
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

      {/* ── Save button ───────────────────────────────── */}
      <motion.button
        onClick={save}
        disabled={saving}
        whileHover={{ scale: 1.01, y: -1 }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        style={{
          background: 'var(--primary)',
          color: 'white',
          boxShadow: '0 4px 18px rgba(30,92,45,0.4)',
        }}
      >
        {saving
          ? <><Loader2 size={15} className="animate-spin" /> Salvando...</>
          : <><Save size={14} /> Salvar horário</>
        }
      </motion.button>
    </div>
  )
}
