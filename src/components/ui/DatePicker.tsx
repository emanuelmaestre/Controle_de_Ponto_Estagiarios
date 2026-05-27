'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Calendar, X, CalendarDays } from 'lucide-react'

interface Props {
  value: string          // YYYY-MM-DD
  onChange: (v: string) => void
  label?: string
  min?: string
  max?: string
  placeholder?: string
}

const MONTHS_PT = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
]
const DAYS_PT  = ['DOM','SEG','TER','QUA','QUI','SEX','SAB']
const DAYS_SHT = ['D','S','T','Q','Q','S','S']

function parseDate(str: string): Date | null {
  if (!str) return null
  const [y, m, d] = str.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

function toStr(d: Date): string {
  const y  = d.getFullYear()
  const m  = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth()     === b.getMonth()
    && a.getDate()      === b.getDate()
}

export default function DatePicker({
  value, onChange, placeholder = 'Selecionar data', min, max
}: Props) {
  const selected = parseDate(value)
  const today    = new Date()

  const [open, setOpen]           = useState(false)
  const [viewDate, setViewDate]   = useState(() => {
    const d = selected ?? today
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [direction, setDirection] = useState<1 | -1>(1)
  const [yearPick, setYearPick]   = useState(false)

  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onOut(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setYearPick(false)
      }
    }
    if (open) document.addEventListener('mousedown', onOut)
    return () => document.removeEventListener('mousedown', onOut)
  }, [open])

  const year        = viewDate.getFullYear()
  const month       = viewDate.getMonth()
  const firstDay    = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const minDate     = parseDate(min ?? '')
  const maxDate     = parseDate(max ?? '')

  const cells: (Date | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))

  function prevMonth() { setDirection(-1); setViewDate(new Date(year, month - 1, 1)) }
  function nextMonth() { setDirection(1);  setViewDate(new Date(year, month + 1, 1)) }
  function selectDay(d: Date) { onChange(toStr(d)); setOpen(false); setYearPick(false) }

  function isDisabled(d: Date) {
    if (minDate && d < minDate) return true
    if (maxDate && d > maxDate) return true
    return false
  }

  const displayValue = selected
    ? selected.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : ''

  // Year picker range (±6 years)
  const yearRange = Array.from({ length: 13 }, (_, i) => year - 6 + i)

  return (
    <div ref={ref} className="relative" style={{ userSelect: 'none' }}>

      {/* ── Trigger button ───────────────────────────────── */}
      <motion.button
        type="button"
        onClick={() => { setOpen(v => !v); setYearPick(false) }}
        whileHover={{ scale: 1.015 }}
        whileTap={{ scale: 0.975 }}
        className="flex items-center gap-2.5 w-full text-left transition-all"
        style={{
          background: open ? 'var(--surface)' : 'var(--bg)',
          border: open ? '1.5px solid var(--primary)' : '1.5px solid var(--border)',
          borderRadius: 12,
          padding: '10px 12px',
          color: displayValue ? 'var(--text)' : 'var(--text-3)',
          boxShadow: open
            ? '0 0 0 3px var(--ring), var(--card-shadow)'
            : 'var(--card-shadow)',
          minWidth: 0,
        }}
      >
        {/* Icon area */}
        <div className="flex items-center justify-center w-7 h-7 rounded-lg flex-shrink-0"
          style={{ background: open ? 'rgba(30,92,45,0.15)' : 'rgba(148,163,184,0.08)', border: '1px solid var(--border)' }}>
          <CalendarDays size={14} style={{ color: open ? 'var(--primary)' : 'var(--text-3)' }} />
        </div>

        <span className="flex-1 text-sm font-medium truncate">
          {displayValue || placeholder}
        </span>

        {displayValue ? (
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={e => { e.stopPropagation(); onChange('') }}
            className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center hover:opacity-70 transition-opacity"
            style={{ cursor: 'pointer', background: 'var(--bg-secondary)', color: 'var(--text-3)' }}
          >
            <X size={10} />
          </motion.span>
        ) : (
          <ChevronRight size={13} style={{ color: 'var(--text-3)', flexShrink: 0, transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .2s' }} />
        )}
      </motion.button>

      {/* ── Popover ──────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: -8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="absolute z-50 mt-2"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 20,
              boxShadow: '0 20px 60px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.2)',
              width: 296,
              top: '100%',
              left: 0,
              overflow: 'hidden',
            }}
          >
            {/* Glow */}
            <div className="absolute pointer-events-none" style={{
              top: -48, right: -48, width: 140, height: 140,
              background: 'radial-gradient(circle, rgba(30,92,45,0.12) 0%, transparent 70%)',
              borderRadius: '50%',
            }} />
            <div className="absolute pointer-events-none" style={{
              bottom: -40, left: -40, width: 100, height: 100,
              background: 'radial-gradient(circle, rgba(30,92,45,0.07) 0%, transparent 70%)',
              borderRadius: '50%',
            }} />

            {/* Header strip */}
            <div className="px-4 pt-4 pb-3">

              {/* Month / Year nav */}
              <div className="flex items-center justify-between mb-3">
                <motion.button
                  type="button"
                  onClick={prevMonth}
                  whileHover={{ scale: 1.18, x: -1 }}
                  whileTap={{ scale: 0.88 }}
                  className="w-8 h-8 flex items-center justify-center rounded-xl transition-colors"
                  style={{ background: 'var(--bg)', color: 'var(--text-2)', border: '1px solid var(--border)' }}
                >
                  <ChevronLeft size={15} />
                </motion.button>

                {/* Month + Year — click year to switch to year picker */}
                <div className="flex flex-col items-center gap-0.5">
                  <motion.p
                    key={`m-${year}-${month}`}
                    initial={{ opacity: 0, y: direction * 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}
                    className="text-xs font-black tracking-widest"
                    style={{ color: 'var(--text)' }}
                  >
                    {MONTHS_PT[month].toUpperCase()}
                  </motion.p>
                  <motion.button
                    type="button"
                    onClick={() => setYearPick(v => !v)}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    className="text-[11px] font-bold px-2 py-0.5 rounded-lg transition-all"
                    style={{
                      color: yearPick ? 'var(--primary-fg)' : 'var(--primary)',
                      background: yearPick ? 'var(--primary)' : 'rgba(30,92,45,0.10)',
                    }}
                  >
                    {year} ▾
                  </motion.button>
                </div>

                <motion.button
                  type="button"
                  onClick={nextMonth}
                  whileHover={{ scale: 1.18, x: 1 }}
                  whileTap={{ scale: 0.88 }}
                  className="w-8 h-8 flex items-center justify-center rounded-xl transition-colors"
                  style={{ background: 'var(--bg)', color: 'var(--text-2)', border: '1px solid var(--border)' }}
                >
                  <ChevronRight size={15} />
                </motion.button>
              </div>

              {/* Year picker grid */}
              <AnimatePresence>
                {yearPick && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="grid grid-cols-4 gap-1 mb-3 overflow-hidden"
                  >
                    {yearRange.map(y => (
                      <motion.button
                        key={y}
                        type="button"
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.92 }}
                        onClick={() => {
                          setViewDate(new Date(y, month, 1))
                          setYearPick(false)
                        }}
                        className="py-1.5 rounded-lg text-xs font-bold transition-all"
                        style={{
                          background: y === year ? 'var(--primary)' : 'var(--bg)',
                          color: y === year ? 'white' : 'var(--text-2)',
                          border: `1px solid ${y === year ? 'var(--primary)' : 'var(--border)'}`,
                        }}
                      >
                        {y}
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Day labels */}
              <div className="grid grid-cols-7">
                {DAYS_SHT.map((d, i) => (
                  <div key={i} className="text-center py-1"
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: i === 0 || i === 6 ? 'var(--accent-light)' : 'var(--text-3)',
                      letterSpacing: '0.05em',
                    }}>
                    {d}
                  </div>
                ))}
              </div>
            </div>

            {/* Days grid */}
            <div className="px-4 pb-3">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={`${year}-${month}`}
                  custom={direction}
                  initial={{ opacity: 0, x: direction * 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction * -40 }}
                  transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                  className="grid grid-cols-7 gap-y-1"
                >
                  {cells.map((d, i) => {
                    if (!d) return <div key={i} />
                    const isSelected = selected ? isSameDay(d, selected) : false
                    const isToday    = isSameDay(d, today)
                    const disabled   = isDisabled(d)
                    const isWeekend  = d.getDay() === 0 || d.getDay() === 6

                    return (
                      <motion.button
                        key={i}
                        type="button"
                        onClick={() => !disabled && selectDay(d)}
                        whileHover={!disabled ? { scale: 1.18 } : {}}
                        whileTap={!disabled ? { scale: 0.88 } : {}}
                        className="relative flex items-center justify-center rounded-xl transition-colors mx-0.5"
                        style={{
                          height: 34,
                          cursor: disabled ? 'not-allowed' : 'pointer',
                          opacity: disabled ? 0.22 : 1,
                          background: isSelected
                            ? 'var(--primary)'
                            : isToday
                            ? 'rgba(30,92,45,0.14)'
                            : 'transparent',
                          color: isSelected
                            ? 'white'
                            : isToday
                            ? 'var(--primary-light)'
                            : isWeekend
                            ? 'var(--accent-light)'
                            : 'var(--text-2)',
                          fontWeight: isSelected || isToday ? 800 : 500,
                          fontSize: 12,
                          border: isToday && !isSelected ? '1.5px solid rgba(30,92,45,0.4)' : '1.5px solid transparent',
                          boxShadow: isSelected ? '0 2px 10px rgba(30,92,45,0.4)' : 'none',
                        }}
                      >
                        {isSelected && (
                          <motion.div
                            layoutId="selectedDay"
                            className="absolute inset-0 rounded-xl"
                            style={{ background: 'var(--primary)', zIndex: -1 }}
                            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                          />
                        )}
                        {d.getDate()}
                      </motion.button>
                    )
                  })}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="mx-4 mb-4 pt-3 flex items-center justify-between" style={{ borderTop: '1px solid var(--border)' }}>
              <motion.button
                type="button"
                onClick={() => { onChange(''); setOpen(false) }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                style={{ color: 'var(--text-3)', background: 'var(--bg)', border: '1px solid var(--border)' }}
              >
                LIMPAR
              </motion.button>
              <motion.button
                type="button"
                onClick={() => selectDay(today)}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                style={{
                  background: 'rgba(30,92,45,0.15)',
                  color: 'var(--primary-light)',
                  border: '1.5px solid rgba(30,92,45,0.3)',
                }}
              >
                HOJE
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
