'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'

type State = 'idle' | 'loading' | 'done' | 'error'

export default function RecalcGamificationButton() {
  const [state, setState] = useState<State>('idle')
  const [result, setResult] = useState<{ interns_processed: number; total_points_awarded: number } | null>(null)
  const [msg, setMsg]       = useState('')

  const handle = async () => {
    setState('loading')
    try {
      const res  = await fetch('/api/admin/gamification-backfill', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) { setMsg(json.error ?? 'Erro'); setState('error'); return }
      setResult(json)
      setState('done')
    } catch {
      setMsg('Erro de conexão.')
      setState('error')
    }
  }

  return (
    <AnimatePresence mode="wait">
      {state === 'done' ? (
        <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="flex items-center gap-2 text-xs px-1" style={{ color: '#00c853' }}>
          <CheckCircle2 size={13} className="flex-shrink-0" />
          {result?.interns_processed} aluno(s) · {result?.total_points_awarded} pts distribuídos
        </motion.div>
      ) : state === 'error' ? (
        <motion.div key="err" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="flex items-center gap-2 text-xs px-1" style={{ color: '#ff5252' }}>
          <AlertCircle size={13} className="flex-shrink-0" /> {msg}
        </motion.div>
      ) : (
        <motion.button key="btn" onClick={handle} disabled={state === 'loading'}
          whileHover={{ opacity: 0.8 }} whileTap={{ scale: 0.97 }}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-[11px] font-bold tracking-wider disabled:opacity-50 transition-all"
          style={{ border: '1px solid rgba(0,200,83,0.25)', color: '#3fe56c', background: 'transparent' }}
        >
          {state === 'loading' ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
          {state === 'loading' ? 'CALCULANDO...' : 'RECALCULAR PONTUAÇÃO'}
        </motion.button>
      )}
    </AnimatePresence>
  )
}
