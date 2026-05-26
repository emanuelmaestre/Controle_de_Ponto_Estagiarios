'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import type { InternSchedule } from '@/types/database'
import { toast } from 'sonner'
import { Clock, Check, X, ChevronDown } from 'lucide-react'

const DAYS = [
  { key: 1, label: 'SEG', full: 'SEGUNDA-FEIRA' },
  { key: 2, label: 'TER', full: 'TERCA-FEIRA' },
  { key: 3, label: 'QUA', full: 'QUARTA-FEIRA' },
  { key: 4, label: 'QUI', full: 'QUINTA-FEIRA' },
  { key: 5, label: 'SEX', full: 'SEXTA-FEIRA' },
  { key: 6, label: 'SAB', full: 'SABADO' },
  { key: 0, label: 'DOM', full: 'DOMINGO' },
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
  const [expanded, setExpanded] = useState<number | null>(null)

  const weeklyHours = DAYS.filter(d => schedule[d.key]?.active)
    .reduce((sum, d) => sum + calcHours(schedule[d.key].start, schedule[d.key].end), 0)

  const toggleDay = (key: number) => {
    setSchedule(prev => ({
      ...prev,
      [key]: { ...prev[key], active: !prev[key].active }
    }))
  }

  const updateTime = (key: number, field: 'start' | 'end', value: string) => {
    setSchedule(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }))
  }

  const save = async () => {
    setSaving(true)
    try {
      // Update total_hours_required on profile
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ total_hours_required: totalHours })
        .eq('id', internId)
      if (profileErr) throw profileErr

      // Upsert each active day, delete inactive
      for (const d of DAYS) {
        const ds = schedule[d.key]
        if (ds.active) {
          const { error } = await supabase
            .from('intern_schedules')
            .upsert({
              intern_id: internId,
              day_of_week: d.key,
              expected_start: ds.start + ':00',
              expected_end: ds.end + ':00',
              is_active: true,
            }, { onConflict: 'intern_id,day_of_week' })
          if (error) throw error
        } else {
          await supabase
            .from('intern_schedules')
            .update({ is_active: false })
            .eq('intern_id', internId)
            .eq('day_of_week', d.key)
        }
      }

      toast.success('HORARIO SALVO COM SUCESSO')
    } catch (e) {
      toast.error('ERRO AO SALVAR HORARIO')
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Total hours required */}
      <div className="rounded-xl p-4" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold" style={{ color: 'var(--text)' }}>CARGA HORARIA TOTAL</p>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-3)' }}>TOTAL DE HORAS A CUMPRIR NO PERIODO</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={9999}
              value={totalHours}
              onChange={e => setTotalHours(Number(e.target.value))}
              className="w-20 text-center font-bold text-lg rounded-xl px-2 py-1.5 outline-none focus:ring-2"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                '--tw-ring-color': 'var(--primary)',
              } as React.CSSProperties}
            />
            <span className="text-xs font-bold" style={{ color: 'var(--text-3)' }}>H</span>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: 'var(--info)' }} />
          <p className="text-[10px]" style={{ color: 'var(--text-3)' }}>
            SEMANA ATUAL: <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{weeklyHours.toFixed(1)}H/SEMANA</span>
          </p>
        </div>
      </div>

      {/* Day cards */}
      <div className="space-y-2">
        {DAYS.map((d, i) => {
          const ds = schedule[d.key]
          const hours = ds.active ? calcHours(ds.start, ds.end) : 0
          const isOpen = expanded === d.key

          return (
            <motion.div
              key={d.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-2xl overflow-hidden"
              style={{ border: `1px solid ${ds.active ? 'var(--primary)' : 'var(--border)'}`, background: 'var(--surface)' }}
            >
              {/* Day header row */}
              <div className="flex items-center gap-3 p-3">
                {/* Toggle */}
                <button
                  onClick={() => toggleDay(d.key)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
                  style={{
                    background: ds.active ? 'var(--primary)' : 'var(--bg)',
                    border: `1px solid ${ds.active ? 'var(--primary)' : 'var(--border)'}`,
                  }}
                >
                  {ds.active
                    ? <Check size={14} color="white" />
                    : <X size={14} style={{ color: 'var(--text-3)' }} />
                  }
                </button>

                {/* Day label */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold" style={{ color: ds.active ? 'var(--text)' : 'var(--text-3)' }}>
                    {d.full}
                  </p>
                  {ds.active && (
                    <p className="text-[10px]" style={{ color: 'var(--text-3)' }}>
                      {ds.start} - {ds.end} &middot; {hours.toFixed(1)}H
                    </p>
                  )}
                </div>

                {/* Expand toggle */}
                {ds.active && (
                  <button
                    onClick={() => setExpanded(isOpen ? null : d.key)}
                    className="p-1.5 rounded-lg transition-all"
                    style={{ color: 'var(--text-3)' }}
                  >
                    <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown size={14} />
                    </motion.div>
                  </button>
                )}
              </div>

              {/* Time inputs */}
              <AnimatePresence>
                {ds.active && isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ borderTop: '1px solid var(--border)' }}
                  >
                    <div className="p-3 grid grid-cols-2 gap-3">
                      {(['start', 'end'] as const).map(f => (
                        <div key={f}>
                          <label className="text-[10px] font-bold block mb-1" style={{ color: 'var(--text-3)' }}>
                            {f === 'start' ? 'ENTRADA' : 'SAIDA'}
                          </label>
                          <div className="relative">
                            <Clock size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
                            <input
                              type="time"
                              value={f === 'start' ? ds.start : ds.end}
                              onChange={e => updateTime(d.key, f, e.target.value)}
                              className="w-full pl-7 pr-2 py-2 rounded-xl text-xs font-bold outline-none focus:ring-2"
                              style={{
                                background: 'var(--bg)',
                                border: '1px solid var(--border)',
                                color: 'var(--text)',
                                '--tw-ring-color': 'var(--primary)',
                              } as React.CSSProperties}
                            />
                          </div>
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

      {/* Save button */}
      <motion.button
        onClick={save}
        disabled={saving}
        className="w-full py-3 rounded-2xl font-bold text-sm transition-all disabled:opacity-50"
        style={{ background: 'var(--primary)', color: 'white' }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
      >
        {saving ? 'SALVANDO...' : 'SALVAR HORARIO'}
      </motion.button>
    </div>
  )
}
