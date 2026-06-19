'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CaseSensitive, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react'

export default function NormalizeNamesButton() {
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [count, setCount]  = useState<number | null>(null)
  const [msg,   setMsg]    = useState<string>('')

  const run = async () => {
    setState('loading')
    try {
      const res  = await fetch('/api/admin/normalize-names', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) {
        setMsg(json.error ?? 'Erro ao normalizar.')
        setState('error')
      } else {
        setCount(json.updated ?? 0)
        setMsg(json.message ?? '')
        setState('success')
        // Volta para idle após 6s
        setTimeout(() => setState('idle'), 6000)
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
          className="flex items-center gap-2 text-xs px-1" style={{ color: '#00c853' }}>
          <CheckCircle2 size={13} className="flex-shrink-0" />
          {count === 0 ? 'Nomes já estão no padrão!' : `${count} nome(s) corrigido(s).`}
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
          {state === 'loading' ? <Loader2 size={13} className="animate-spin" /> : <CaseSensitive size={13} />}
          {state === 'loading' ? 'NORMALIZANDO...' : 'NORMALIZAR NOMES'}
        </motion.button>
      )}
    </AnimatePresence>
  )
}
