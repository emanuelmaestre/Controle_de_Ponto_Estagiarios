'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Check, Sprout, Tractor, Dna, FlaskConical, Microscope, Trees, X } from 'lucide-react'

const COURSES = [
  { value: 'BACHARELADO EM AGRONOMIA',                    label: 'Bacharelado em Agronomia',                    icon: Sprout,      color: '#4ade80', bg: 'rgba(74,222,128,0.12)'  },
  { value: 'TÉCNICO EM AGROPECUÁRIA',                     label: 'Técnico em Agropecuária',                     icon: Tractor,     color: '#fb923c', bg: 'rgba(251,146,60,0.12)'  },
  { value: 'LICENCIATURA EM CIÊNCIAS BIOLÓGICAS',         label: 'Lic. em Ciências Biológicas',                 icon: Dna,         color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  { value: 'MESTRADO EM PROTEÇÃO DE PLANTAS',             label: 'Mestrado em Proteção de Plantas',             icon: FlaskConical,color: '#38bdf8', bg: 'rgba(56,189,248,0.12)'  },
  { value: 'TÉCNICO EM BIOTECNOLOGIA',                    label: 'Técnico em Biotecnologia',                    icon: Microscope,  color: '#f472b6', bg: 'rgba(244,114,182,0.12)' },
  { value: 'CONSERVAÇÃO DOS RECURSOS NATURAIS DO CERRADO',label: 'Conservação dos Recursos Naturais do Cerrado',icon: Trees,       color: '#86efac', bg: 'rgba(134,239,172,0.12)' },
]

interface Props {
  value: string
  onChange: (val: string) => void
}

export default function CourseSelect({ value, onChange }: Props) {
  const [open, setOpen]         = useState(false)
  const [mounted, setMounted]   = useState(false)
  const ref                     = useRef<HTMLDivElement>(null)
  const selected                = COURSES.find(c => c.value === value) ?? null

  useEffect(() => { setMounted(true) }, [])

  // Fecha ao clicar fora (desktop)
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [open])

  // Bloqueia scroll do body quando aberto no mobile
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const select = (val: string) => { onChange(val); setOpen(false) }

  return (
    <div ref={ref} style={{ position: 'relative', userSelect: 'none' }}>

      {/* ── Trigger button ── */}
      <motion.button
        type="button"
        onClick={() => setOpen(o => !o)}
        whileTap={{ scale: 0.98 }}
        className="w-full flex items-center gap-2 px-3 py-3 rounded-xl font-medium outline-none"
        style={{
          background: 'rgba(0,0,0,0.25)',
          border: `1.5px solid ${open ? '#3fe56c' : 'rgba(0,200,83,0.18)'}`,
          color: selected ? '#d4e8d5' : 'rgba(212,232,213,0.4)',
          transition: 'border-color 0.2s',
        }}
      >
        {selected ? (
          <span className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: selected.bg }}>
            <selected.icon size={13} style={{ color: selected.color }} />
          </span>
        ) : (
          <span className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,200,83,0.08)' }}>
            <Sprout size={13} style={{ color: 'rgba(0,200,83,0.4)' }} />
          </span>
        )}
        <span className="flex-1 text-left text-sm" style={{ fontSize: 16 }}>
          {selected ? selected.label : 'Selecione o curso'}
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={16} style={{ color: 'rgba(0,200,83,0.5)' }} />
        </motion.span>
      </motion.button>

      {/* ── Bottom sheet (Portal) ── */}
      {mounted && createPortal(
        <AnimatePresence>
          {open && (
            <>
              {/* Backdrop */}
              <motion.div
                key="backdrop"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setOpen(false)}
                style={{
                  position: 'fixed', inset: 0, zIndex: 99998,
                  background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
                }}
              />

              {/* Sheet */}
              <motion.div
                key="sheet"
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 380, damping: 38 }}
                style={{
                  position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 99999,
                  background: '#0a1f10',
                  borderTop: '1.5px solid rgba(0,200,83,0.20)',
                  borderRadius: '20px 20px 0 0',
                  paddingBottom: 'env(safe-area-inset-bottom)',
                  maxHeight: '80dvh',
                  display: 'flex', flexDirection: 'column',
                }}
              >
                {/* Handle + header */}
                <div style={{ padding: '12px 20px 8px', borderBottom: '1px solid rgba(0,200,83,0.10)', flexShrink: 0 }}>
                  <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(0,200,83,0.25)', margin: '0 auto 12px' }} />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <p style={{ color: '#3fe56c', fontSize: 12, fontWeight: 800, letterSpacing: '0.12em' }}>CURSO DE GRADUAÇÃO</p>
                    <button type="button" onClick={() => setOpen(false)}
                      style={{ color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                      <X size={18} />
                    </button>
                  </div>
                </div>

                {/* Options list */}
                <div style={{ overflowY: 'auto', flex: 1, padding: '8px 0' }}>
                  {COURSES.map((course) => {
                    const Icon = course.icon
                    const isSelected = value === course.value
                    return (
                      <button
                        key={course.value}
                        type="button"
                        onClick={() => select(course.value)}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                          padding: '14px 20px',
                          background: isSelected ? course.bg : 'transparent',
                          border: 'none', cursor: 'pointer',
                          borderBottom: '1px solid rgba(0,200,83,0.06)',
                          textAlign: 'left',
                        }}
                      >
                        <span style={{
                          width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                          background: course.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Icon size={18} style={{ color: course.color }} />
                        </span>
                        <span style={{ flex: 1, color: isSelected ? course.color : '#d4e8d5', fontSize: 14, fontWeight: isSelected ? 700 : 500, lineHeight: 1.3 }}>
                          {course.label}
                        </span>
                        {isSelected && (
                          <span style={{
                            width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                            background: course.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <Check size={13} color="#003912" strokeWidth={3} />
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  )
}
