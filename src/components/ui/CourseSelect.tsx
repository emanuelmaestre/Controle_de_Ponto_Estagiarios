'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Check, Sprout, Tractor, Dna, FlaskConical, Microscope, Trees, X } from 'lucide-react'

const COURSES = [
  { value: 'BACHARELADO EM AGRONOMIA',                     label: 'Bacharelado em Agronomia',                     icon: Sprout,       color: '#4ade80', bg: 'rgba(74,222,128,0.12)'  },
  { value: 'TÉCNICO EM AGROPECUÁRIA',                      label: 'Técnico em Agropecuária',                      icon: Tractor,      color: '#fb923c', bg: 'rgba(251,146,60,0.12)'  },
  { value: 'LICENCIATURA EM CIÊNCIAS BIOLÓGICAS',          label: 'Lic. em Ciências Biológicas',                  icon: Dna,          color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  { value: 'MESTRADO EM PROTEÇÃO DE PLANTAS',              label: 'Mestrado em Proteção de Plantas',              icon: FlaskConical, color: '#38bdf8', bg: 'rgba(56,189,248,0.12)'  },
  { value: 'TÉCNICO EM BIOTECNOLOGIA',                     label: 'Técnico em Biotecnologia',                     icon: Microscope,   color: '#f472b6', bg: 'rgba(244,114,182,0.12)' },
  { value: 'CONSERVAÇÃO DOS RECURSOS NATURAIS DO CERRADO', label: 'Conservação dos Recursos Naturais do Cerrado', icon: Trees,        color: '#86efac', bg: 'rgba(134,239,172,0.12)' },
]

interface Props { value: string; onChange: (val: string) => void }

function isTouchDevice() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(hover: none) and (pointer: coarse)').matches
}

export default function CourseSelect({ value, onChange }: Props) {
  const [open, setOpen]       = useState(false)
  const [mounted, setMounted] = useState(false)
  const [rect, setRect]       = useState<DOMRect | null>(null)
  const btnRef                = useRef<HTMLButtonElement>(null)
  const selected              = COURSES.find(c => c.value === value) ?? null
  const mobile                = mounted && isTouchDevice()

  useEffect(() => { setMounted(true) }, [])

  // Bloqueia scroll do body quando aberto
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Fecha ao clicar fora (desktop)
  useEffect(() => {
    if (!open || mobile) return
    const handler = (e: MouseEvent) => {
      if (btnRef.current && !btnRef.current.closest('[data-course-select]')?.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    setTimeout(() => document.addEventListener('click', handler), 0)
    return () => document.removeEventListener('click', handler)
  }, [open, mobile])

  const handleOpen = useCallback(() => {
    if (!open && btnRef.current) setRect(btnRef.current.getBoundingClientRect())
    setOpen(o => !o)
  }, [open])

  const select = useCallback((val: string) => {
    onChange(val)
    setOpen(false)
  }, [onChange])

  return (
    <div data-course-select="" style={{ position: 'relative' }}>
      {/* ── Trigger ── */}
      <button
        ref={btnRef}
        type="button"
        onClick={handleOpen}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 8,
          padding: '11px 12px', borderRadius: 12, outline: 'none', cursor: 'pointer',
          background: 'rgba(0,0,0,0.25)',
          border: `1.5px solid ${open ? '#3fe56c' : 'rgba(0,200,83,0.18)'}`,
          color: selected ? '#d4e8d5' : 'rgba(212,232,213,0.35)',
          fontSize: 16, transition: 'border-color 0.2s',
        }}
      >
        {selected ? (
          <span style={{ width: 24, height: 24, borderRadius: 8, flexShrink: 0, background: selected.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <selected.icon size={13} style={{ color: selected.color }} />
          </span>
        ) : (
          <span style={{ width: 24, height: 24, borderRadius: 8, flexShrink: 0, background: 'rgba(0,200,83,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sprout size={13} style={{ color: 'rgba(0,200,83,0.35)' }} />
          </span>
        )}
        <span style={{ flex: 1, textAlign: 'left', fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {selected ? selected.label : 'Selecione o curso'}
        </span>
        <ChevronDown size={15} style={{ color: 'rgba(0,200,83,0.5)', flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {mounted && createPortal(
        <AnimatePresence>
          {open && (
            <>
              {/* ── DESKTOP: dropdown ── */}
              {!mobile && rect && (
                <motion.div
                  key="desktop-drop"
                  initial={{ opacity: 0, y: -6, scaleY: 0.95 }}
                  animate={{ opacity: 1, y: 0, scaleY: 1 }}
                  exit={{ opacity: 0, y: -4, scaleY: 0.95 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    position: 'fixed',
                    top: rect.bottom + 4,
                    left: rect.left,
                    width: rect.width,
                    zIndex: 99999,
                    background: '#0a1f10',
                    border: '1.5px solid rgba(0,200,83,0.25)',
                    borderRadius: 12,
                    overflow: 'hidden',
                    boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
                    transformOrigin: 'top',
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
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                          padding: '10px 14px', border: 'none', cursor: 'pointer', textAlign: 'left',
                          background: isSel ? course.bg : 'transparent',
                          borderBottom: i < COURSES.length - 1 ? '1px solid rgba(0,200,83,0.07)' : 'none',
                          color: isSel ? course.color : '#d4e8d5',
                          fontSize: 13, fontWeight: isSel ? 700 : 400,
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => { if (!isSel) (e.currentTarget as HTMLElement).style.background = 'rgba(0,200,83,0.06)' }}
                        onMouseLeave={e => { if (!isSel) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                      >
                        <span style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, background: course.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Icon size={14} style={{ color: course.color }} />
                        </span>
                        <span style={{ flex: 1 }}>{course.label}</span>
                        {isSel && <Check size={13} style={{ color: course.color, flexShrink: 0 }} />}
                      </button>
                    )
                  })}
                </motion.div>
              )}

              {/* ── MOBILE: bottom sheet ── */}
              {mobile && (
                <>
                  <motion.div
                    key="mob-backdrop"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onPointerDown={() => setOpen(false)}
                    style={{ position: 'fixed', inset: 0, zIndex: 99998, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(3px)' }}
                  />
                  <motion.div
                    key="mob-sheet"
                    initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 40 }}
                    style={{
                      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 99999,
                      background: '#0a1f10',
                      borderTop: '1.5px solid rgba(0,200,83,0.20)',
                      borderRadius: '20px 20px 0 0',
                      paddingBottom: 'env(safe-area-inset-bottom)',
                    }}
                  >
                    {/* Handle */}
                    <div style={{ padding: '12px 20px 0' }}>
                      <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(0,200,83,0.25)', margin: '0 auto 10px' }} />
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1px solid rgba(0,200,83,0.10)' }}>
                        <p style={{ color: '#3fe56c', fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', margin: 0 }}>CURSO DE GRADUAÇÃO</p>
                        <button type="button" onPointerDown={() => setOpen(false)} style={{ color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                    {/* Items */}
                    {COURSES.map((course) => {
                      const Icon = course.icon
                      const isSel = value === course.value
                      return (
                        <button
                          key={course.value}
                          type="button"
                          onPointerDown={e => { e.stopPropagation(); select(course.value) }}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                            padding: '13px 20px', border: 'none', cursor: 'pointer', textAlign: 'left',
                            background: isSel ? course.bg : 'transparent',
                            borderBottom: '1px solid rgba(0,200,83,0.06)',
                            color: isSel ? course.color : '#d4e8d5',
                            fontSize: 15, fontWeight: isSel ? 700 : 400,
                          }}
                        >
                          <span style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: course.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Icon size={17} style={{ color: course.color }} />
                          </span>
                          <span style={{ flex: 1, lineHeight: 1.3 }}>{course.label}</span>
                          {isSel && (
                            <span style={{ width: 22, height: 22, borderRadius: '50%', background: course.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <Check size={12} color="#003912" strokeWidth={3} />
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </motion.div>
                </>
              )}
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  )
}
