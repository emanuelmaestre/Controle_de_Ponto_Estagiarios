'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Check, Sprout, Tractor, Dna, FlaskConical, Microscope, Trees } from 'lucide-react'

const COURSES = [
  { value: 'BACHARELADO EM AGRONOMIA',                     label: 'Bacharelado em Agronomia',                     icon: Sprout,       color: '#4ade80', bg: 'rgba(74,222,128,0.12)'  },
  { value: 'TÉCNICO EM AGROPECUÁRIA',                      label: 'Técnico em Agropecuária',                      icon: Tractor,      color: '#fb923c', bg: 'rgba(251,146,60,0.12)'  },
  { value: 'LICENCIATURA EM CIÊNCIAS BIOLÓGICAS',          label: 'Lic. em Ciências Biológicas',                  icon: Dna,          color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  { value: 'MESTRADO EM PROTEÇÃO DE PLANTAS',              label: 'Mestrado em Proteção de Plantas',              icon: FlaskConical, color: '#38bdf8', bg: 'rgba(56,189,248,0.12)'  },
  { value: 'TÉCNICO EM BIOTECNOLOGIA',                     label: 'Técnico em Biotecnologia',                     icon: Microscope,   color: '#f472b6', bg: 'rgba(244,114,182,0.12)' },
  { value: 'CONSERVAÇÃO DOS RECURSOS NATURAIS DO CERRADO', label: 'Conservação dos Recursos Naturais do Cerrado', icon: Trees,        color: '#86efac', bg: 'rgba(134,239,172,0.12)' },
]

interface Props { value: string; onChange: (val: string) => void }

export default function CourseSelect({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const ref             = useRef<HTMLDivElement>(null)
  const selected        = COURSES.find(c => c.value === value) ?? null

  // Fecha ao clicar fora
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('touchstart', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('touchstart', close)
    }
  }, [open])

  const select = (val: string) => { onChange(val); setOpen(false) }

  return (
    <div ref={ref} style={{ position: 'relative' }}>

      {/* ── Trigger ── */}
      <button
        type="button"
        onMouseDown={e => { e.preventDefault(); setOpen(o => !o) }}
        onTouchEnd={e => { e.preventDefault(); setOpen(o => !o) }}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 8,
          padding: '11px 12px', borderRadius: 12, outline: 'none', cursor: 'pointer',
          background: 'rgba(0,0,0,0.25)',
          border: `1.5px solid ${open ? '#3fe56c' : 'rgba(0,200,83,0.18)'}`,
          color: selected ? '#d4e8d5' : 'rgba(212,232,213,0.30)',
          fontSize: 14, transition: 'border-color 0.2s', userSelect: 'none',
        }}
      >
        {selected ? (
          <span style={{ width: 24, height: 24, borderRadius: 8, flexShrink: 0, background: selected.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <selected.icon size={13} style={{ color: selected.color }} />
          </span>
        ) : (
          <span style={{ width: 24, height: 24, borderRadius: 8, flexShrink: 0, background: 'rgba(0,200,83,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sprout size={13} style={{ color: 'rgba(0,200,83,0.30)' }} />
          </span>
        )}
        <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected ? selected.label : 'Selecione o curso'}
        </span>
        <ChevronDown size={14} style={{ color: 'rgba(0,200,83,0.5)', flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {/* ── Dropdown ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0, right: 0,
              zIndex: 1000,
              background: '#0a1f10',
              border: '1.5px solid rgba(0,200,83,0.25)',
              borderRadius: 12,
              overflow: 'hidden',
              boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
            }}
          >
            {COURSES.map((course, i) => {
              const Icon = course.icon
              const isSel = value === course.value
              return (
                <button
                  key={course.value}
                  type="button"
                  onMouseDown={e => { e.preventDefault(); select(course.value) }}
                  onTouchEnd={e => { e.preventDefault(); e.stopPropagation(); select(course.value) }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '11px 14px', border: 'none', cursor: 'pointer', textAlign: 'left',
                    background: isSel ? course.bg : 'transparent',
                    borderBottom: i < COURSES.length - 1 ? '1px solid rgba(0,200,83,0.07)' : 'none',
                    color: isSel ? course.color : '#d4e8d5',
                    fontSize: 13, fontWeight: isSel ? 700 : 400,
                  }}
                  onMouseEnter={e => { if (!isSel) (e.currentTarget as HTMLElement).style.background = 'rgba(0,200,83,0.06)' }}
                  onMouseLeave={e => { if (!isSel) (e.currentTarget as HTMLElement).style.background = isSel ? course.bg : 'transparent' }}
                >
                  <span style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: course.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={14} style={{ color: course.color }} />
                  </span>
                  <span style={{ flex: 1 }}>{course.label}</span>
                  {isSel && <Check size={13} style={{ color: course.color, flexShrink: 0 }} />}
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
