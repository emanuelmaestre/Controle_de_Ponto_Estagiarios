'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SpellCheck, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react'

export default function FixActivitiesSpellingButton() {
  const [state, setState]           = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [count, setCount]           = useState<number | null>(null)
  const [corrections, setCorrections] = useState<string[]>([])
  const [msg, setMsg]               = useState<string>('')

  const run = async () => {
    setState('loading')
    try {
      const res  = await fetch('/api/admin/fix-activities-spelling', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) {
        setMsg(json.error ?? 'Erro ao corrigir.')
        setState('error')
        setTimeout(() => setState('idle'), 4000)
      } else {
        setCount(json.updated ?? 0)
        setCorrections(json.corrections ?? [])
        setMsg(json.message ?? '')
        setState('success')
        setTimeout(() => setState('idle'), 8000)
      }
    } catch {
      setMsg('Erro de conexão.')
      setState('error')
      setTimeout(() => setState('idle'), 4000)
    }
  }

  return (
    <AnimatePresence mode="wait">
      {state === 'success' ? (
        <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="space-y-1">
          <div className="flex items-center gap-2 text-xs px-1" style={{ color: '#00c853' }}>
            <CheckCircle2 size={13} className="flex-shrink-0" />
            {count === 0
              ? 'Todas as atividades já estão corretas!'
              : `${count} atividade(s) corrigida(s).`}
          </div>
          {corrections.slice(0, 5).map((c, i) => (
            <p key={i} className="text-[10px] px-1 opacity-60" style={{ color: '#3fe56c' }}>{c}</p>
          ))}
          {corrections.length > 5 && (
            <p className="text-[10px] px-1 opacity-50" style={{ color: '#3fe56c' }}>
              +{corrections.length - 5} mais...
            </p>
          )}
        </motion.div>
      ) : state === 'error' ? (
        <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="flex items-center gap-2 text-xs px-1" style={{ color: '#ff5252' }}>
          <AlertTriangle size={13} className="flex-shrink-0" /> {msg}
        </motion.div>
      ) : (
        <motion.button key="btn" onClick={run} disabled={state === 'loading'}
          whileHover={{ opacity: 0.8 }} whileTap={{ scale: 0.97 }}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-[11px] font-bold tracking-wider disabled:opacity-50 transition-all"
          style={{ border: '1px solid rgba(0,200,83,0.25)', color: '#3fe56c', background: 'transparent' }}
        >
          {state === 'loading' ? <Loader2 size={13} className="animate-spin" /> : <SpellCheck size={13} />}
          {state === 'loading' ? 'CORRIGINDO ATIVIDADES...' : 'CORRIGIR ORTOGRAFIA DAS ATIVIDADES'}
        </motion.button>
      )}
    </AnimatePresence>
  )
}
