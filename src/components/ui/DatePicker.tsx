'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react'

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
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
]
const DAYS_PT = ['D','S','T','Q','Q','S','S']

function parseDate(str: string): Date | null {
  if (!str) return null
  const [y, m, d] = str.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

function toStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

export default function DatePicker({ value, onChange, label, min, max, placeholder = 'Selecionar data' }: Props) {
  const selected = parseDate(value)
  const today = new Date()

  const [open, setOpen] = useState(false)
  const [viewDate, setViewDate] = useState(() => {
    const d = selected ?? today
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [direction, setDirection] = useState<1 | -1>(1)

  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  const year  = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const firstDay = new Date(year, month, 1).getDay()  // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const minDate = parseDate(min ?? '')
  const maxDate = parseDate(max ?? '')

  // Grid cells: leading empty + days
  const cells: (Date | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))

  function prevMonth() {
    setDirection(-1)
    setViewDate(new Date(year, month - 1, 1))
  }
  function nextMonth() {
    setDirection(1)
    setViewDate(new Date(year, month + 1, 1))
  }

  function selectDay(d: Date) {
    onChange(toStr(d))
    setOpen(false)
  }

  function isDisabled(d: Date) {
    if (minDate && d < minDate) return true
    if (maxDate && d > maxDate) return true
    return false
  }

  const displayValue = selected
    ? selected.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : ''

  return (
    <div ref={ref} className="relative" style={{ userSelect: 'none' }}>
      {/* Trigger */}
      <motion.button
        type="button"
        onClick={() => setOpen(v => !v)}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm w-full text-left transition-all"
        style={{
          background: 'var(--bg)',
          border: open ? '1.5px solid var(--primary)' : '1px solid var(--border)',
          color: displayValue ? 'var(--text)' : 'var(--text-3)',
          boxShadow: open ? '0 0 0 3px rgba(74,222,128,0.1)' : 'none',
          minWidth: 148,
        }}
      >
        <Calendar size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
        <span className="flex-1 font-medium">{displayValue || placeholder}</span>
        {displayValue && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            onClick={e => { e.stopPropagation(); onChange(''); }}
            className="flex-shrink-0 hover:opacity-60"
            style={{ cursor: 'pointer', color: 'var(--text-3)' }}
          >
            <X size={12} />
          </motion.span>
        )}
      </motion.button>

      {/* Popover Calendar */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: -6 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="absolute z-50 mt-2 rounded-2xl p-4"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              boxShadow: '0 16px 48px rgba(0,0,0,0.35)',
              width: 280,
              top: '100%',
              left: 0,
              overflow: 'hidden',
            }}
          >
            {/* Glow decoration */}
            <div className="absolute pointer-events-none" style={{
              top: -40, right: -40, width: 120, height: 120,
              background: 'radial-gradient(circle, rgba(74,222,128,0.08) 0%, transparent 70%)',
              borderRadius: '50%',
            }} />

            {/* Month nav */}
            <div className="flex items-center justify-between mb-4">
              <motion.button
                type="button"
                onClick={prevMonth}
                whileHover={{ scale: 1.15, x: -1 }}
                whileTap={{ scale: 0.9 }}
                className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
                style={{ background: 'var(--bg)', color: 'var(--text-2)', border: '1px solid var(--border)' }}
              >
                <ChevronLeft size={14} />
              </motion.button>

              <motion.div key={`${year}-${month}`} className="text-center">
                <p className="text-xs font-black tracking-widest" style={{ color: 'var(--text)' }}>
                  {MONTHS_PT[month].toUpperCase()}
                </p>
                <p className="text-[10px] font-bold" style={{ color: 'var(--primary)' }}>{year}</p>
              </motion.div>

              <motion.button
                type="button"
                onClick={nextMonth}
                whileHover={{ scale: 1.15, x: 1 }}
                whileTap={{ scale: 0.9 }}
                className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
                style={{ background: 'var(--bg)', color: 'var(--text-2)', border: '1px solid var(--border)' }}
              >
                <ChevronRight size={14} />
              </motion.button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {DAYS_PT.map((d, i) => (
                <div key={i} className="text-center text-[10px] font-bold py-1" style={{ color: 'var(--text-3)' }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={`${year}-${month}`}
                custom={direction}
                initial={{ opacity: 0, x: direction * 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -30 }}
                transition={{ duration: 0.18 }}
                className="grid grid-cols-7 gap-y-0.5"
              >
                {cells.map((d, i) => {
                  if (!d) return <div key={i} />
                  const isSelected = selected ? isSameDay(d, selected) : false
                  const isToday    = isSameDay(d, today)
                  const disabled   = isDisabled(d)

                  return (
                    <motion.button
                      key={i}
                      type="button"
                      onClick={() => !disabled && selectDay(d)}
                      whileHover={!disabled ? { scale: 1.15 } : {}}
                      whileTap={!disabled ? { scale: 0.92 } : {}}
                      className="relative flex items-center justify-center rounded-lg text-xs font-bold transition-colors mx-0.5"
                      style={{
                        height: 32,
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        opacity: disabled ? 0.25 : 1,
                        background: isSelected
                          ? 'var(--primary)'
                          : isToday
                          ? 'rgba(74,222,128,0.12)'
                          : 'transparent',
                        color: isSelected
                          ? 'white'
                          : isToday
                          ? 'var(--primary)'
                          : 'var(--text-2)',
                        border: isToday && !isSelected ? '1px solid rgba(74,222,128,0.35)' : '1px solid transparent',
                      }}
                    >
                      {isSelected && (
                        <motion.div
                          layoutId="selectedDay"
                          className="absolute inset-0 rounded-lg"
                          style={{ background: 'var(--primary)', zIndex: -1 }}
                          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                        />
                      )}
                      {d.getDate()}
                    </motion.button>
                  )
                })}
              </motion.div>
            </AnimatePresence>

            {/* Footer */}
            <div className="mt-4 pt-3 flex items-center justify-between" style={{ borderTop: '1px solid var(--border)' }}>
              <motion.button
                type="button"
                onClick={() => { onChange(''); setOpen(false) }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="text-xs font-bold transition-opacity hover:opacity-70"
                style={{ color: 'var(--text-3)' }}
              >
                Limpar
              </motion.button>
              <motion.button
                type="button"
                onClick={() => { selectDay(today) }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                style={{ background: 'rgba(74,222,128,0.12)', color: 'var(--primary)', border: '1px solid rgba(74,222,128,0.25)' }}
              >
                Hoje
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
