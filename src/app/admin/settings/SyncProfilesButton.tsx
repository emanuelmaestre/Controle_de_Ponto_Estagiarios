'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'

type State = 'idle' | 'loading' | 'done' | 'error'

export default function SyncProfilesButton() {
  const [state, setState] = useState<State>('idle')
  const [synced, setSynced] = useState(0)
  const [errors, setErrors] = useState(0)
  const [msg, setMsg] = useState('')

  const handle = async () => {
    setState('loading')
    try {
      const res = await fetch('/api/admin/sync-profiles', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) { setMsg(json.error ?? 'Erro'); setState('error'); return }
      setSynced(json.synced ?? 0)
      setErrors(json.errors ?? 0)
      setState('done')
    } catch {
      setMsg('Erro de conexão.')
      setState('error')
    }
  }

  return (
    <div
      className="rounded-xl p-5"
      style={{ background: 'var(--surface-card, #0f2318)', border: '1px solid rgba(0,200,83,0.15)' }}
    >
      <div className="flex items-center gap-2 mb-2">
        <RefreshCw size={14} style={{ color: '#3fe56c' }} />
        <p className="text-[11px] font-bold tracking-widest uppercase" style={{ color: '#3fe56c' }}>
          Sincronizar Perfis
        </p>
      </div>

      <p className="text-xs mb-4 leading-relaxed" style={{ color: 'var(--text-3)' }}>
        Atualiza os metadados de autenticação de todos os estagiários com os dados
        do cadastro (nome, curso, apelido). Garante que se um perfil for perdido,
        os dados originais possam ser recuperados automaticamente.
      </p>

      <AnimatePresence mode="wait">
        {state === 'done' ? (
          <motion.div key="done" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-xs font-bold" style={{ color: '#00c853' }}>
            <CheckCircle2 size={15} />
            {synced} perfil(is) sincronizado(s){errors > 0 ? `, ${errors} erro(s)` : ''}
          </motion.div>
        ) : state === 'error' ? (
          <motion.div key="err" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-xs" style={{ color: '#ff5252' }}>
            <AlertCircle size={14} /> {msg}
          </motion.div>
        ) : (
          <motion.button
            key="btn"
            onClick={handle}
            disabled={state === 'loading'}
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[11px] font-bold tracking-wider disabled:opacity-50"
            style={{ border: '1px solid rgba(0,200,83,0.30)', color: '#3fe56c', background: 'transparent' }}
          >
            {state === 'loading'
              ? <><Loader2 size={13} className="animate-spin" /> SINCRONIZANDO...</>
              : <><RefreshCw size={13} /> SINCRONIZAR TODOS OS PERFIS</>}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
