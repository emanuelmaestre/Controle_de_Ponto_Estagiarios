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
    <div
      className="rounded-xl p-5"
      style={{ background: 'var(--surface-card, #0f2318)', border: '1px solid rgba(0,200,83,0.15)' }}
    >
      <div className="flex items-center gap-2 mb-3">
        <CaseSensitive size={16} style={{ color: '#3fe56c' }} />
        <p className="text-[10px] font-bold tracking-widest" style={{ color: 'var(--text-3)' }}>
          PADRONIZAÇÃO DE NOMES
        </p>
      </div>

      <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--text-2)' }}>
        Corrige todos os nomes cadastrados para o padrão pt-BR:{' '}
        <span style={{ color: '#3fe56c' }}>Emanuel Maestre dos Santos</span>.
      </p>

      <AnimatePresence mode="wait">
        {state === 'success' ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-start gap-2 text-xs"
            style={{ color: '#00c853' }}
          >
            <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0" />
            <span>
              {count === 0
                ? 'Todos os nomes já estão no padrão!'
                : `${count} nome${count! > 1 ? 's' : ''} corrigido${count! > 1 ? 's' : ''} com sucesso.`}
            </span>
          </motion.div>
        ) : state === 'error' ? (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-start gap-2 text-xs"
            style={{ color: '#ff5252' }}
          >
            <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
            <span>{msg}</span>
          </motion.div>
        ) : (
          <motion.button
            key="btn"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={run}
            disabled={state === 'loading'}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[11px] font-bold tracking-wider transition-all disabled:opacity-50"
            style={{
              border: '1px solid rgba(0,200,83,0.30)',
              color: '#3fe56c',
              background: 'transparent',
            }}
            whileHover={{ opacity: 0.80 }}
            whileTap={{ scale: 0.97 }}
          >
            {state === 'loading' ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <CaseSensitive size={13} />
            )}
            {state === 'loading' ? 'NORMALIZANDO...' : 'NORMALIZAR NOMES'}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
