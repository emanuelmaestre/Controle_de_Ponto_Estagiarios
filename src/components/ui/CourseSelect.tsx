'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Check, Sprout, Tractor, Dna, FlaskConical, Microscope, Trees } from 'lucide-react'

const COURSES = [
  {
    value: 'BACHARELADO EM AGRONOMIA',
    label: 'Bacharelado em Agronomia',
    icon: Sprout,
    color: '#4ade80',
    bg: 'rgba(74,222,128,0.1)',
  },
  {
    value: 'TÉCNICO EM AGROPECUÁRIA',
    label: 'Técnico em Agropecuária',
    icon: Tractor,
    color: '#fb923c',
    bg: 'rgba(251,146,60,0.1)',
  },
  {
    value: 'LICENCIATURA EM CIÊNCIAS BIOLÓGICAS',
    label: 'Lic. em Ciências Biológicas',
    icon: Dna,
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.1)',
  },
  {
    value: 'MESTRADO EM PROTEÇÃO DE PLANTAS',
    label: 'Mestrado em Proteção de Plantas',
    icon: FlaskConical,
    color: '#38bdf8',
    bg: 'rgba(56,189,248,0.1)',
  },
  {
    value: 'TÉCNICO EM BIOTECNOLOGIA',
    label: 'Técnico em Biotecnologia',
    icon: Microscope,
    color: '#f472b6',
    bg: 'rgba(244,114,182,0.1)',
  },
  {
    value: 'CONSERVAÇÃO DOS RECURSOS NATURAIS DO CERRADO',
    label: 'Conservação dos Recursos Naturais do Cerrado',
    icon: Trees,
    color: '#86efac',
    bg: 'rgba(134,239,172,0.1)',
  },
]

interface Props {
  value: string
  onChange: (val: string) => void
}

export default function CourseSelect({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selected = COURSES.find(c => c.value === value) ?? null

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative', userSelect: 'none' }}>
      {/* Trigger */}
      <motion.button
        type="button"
        onClick={() => setOpen(o => !o)}
        whileTap={{ scale: 0.98 }}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium outline-none transition-all"
        style={{
          background: 'var(--bg)',
          border: `1.5px solid ${open ? 'var(--primary)' : 'var(--border)'}`,
          color: selected ? 'var(--text)' : 'var(--text-3)',
          boxShadow: open ? '0 0 0 3px rgba(30,92,45,0.12)' : 'none',
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}
      >
        {/* Icon pill */}
        <AnimatePresence mode="wait">
          {selected ? (
            <motion.span
              key={selected.value}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: selected.bg }}
            >
              <selected.icon size={13} style={{ color: selected.color }} />
            </motion.span>
          ) : (
            <motion.span
              key="placeholder-icon"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--border)' }}
            >
              <Sprout size={13} style={{ color: 'var(--text-3)' }} />
            </motion.span>
          )}
        </AnimatePresence>

        {/* Label */}
        <span className="flex-1 text-left truncate text-xs font-semibold">
          {selected ? selected.label : 'Selecione o curso'}
        </span>

        {/* Chevron */}
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center"
          style={{ background: 'rgba(30,92,45,0.1)' }}
        >
          <ChevronDown size={11} style={{ color: 'var(--primary)' }} />
        </motion.span>
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              right: 0,
              zIndex: 50,
              borderRadius: 14,
              overflow: 'hidden',
              background: 'var(--surface)',
              border: '1.5px solid var(--border)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
            }}
          >
            {COURSES.map((course, i) => {
              const Icon = course.icon
              const isSelected = value === course.value
              return (
                <motion.button
                  key={course.value}
                  type="button"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, type: 'spring', stiffness: 400, damping: 30 }}
                  onClick={() => { onChange(course.value); setOpen(false) }}
                  whileHover={{ x: 3 }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors"
                  style={{
                    background: isSelected ? course.bg : 'transparent',
                    borderBottom: i < COURSES.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg)'
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                  }}
                >
                  {/* Icon */}
                  <span
                    className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: course.bg }}
                  >
                    <Icon size={14} style={{ color: course.color }} />
                  </span>

                  {/* Text */}
                  <span className="flex-1 min-w-0">
                    <span
                      className="block text-[11px] font-bold leading-tight truncate"
                      style={{ color: isSelected ? course.color : 'var(--text)' }}
                    >
                      {course.label}
                    </span>
                  </span>

                  {/* Check */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.span
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                        className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: course.color }}
                      >
                        <Check size={10} color="white" strokeWidth={3} />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
