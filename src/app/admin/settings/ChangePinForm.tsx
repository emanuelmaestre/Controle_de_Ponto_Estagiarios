'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { changePinSchema, type ChangePinInput } from '@/lib/validations'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertTriangle, Loader2, ShieldCheck } from 'lucide-react'

interface Props {
  userId: string
}

export default function ChangePinForm({ userId }: Props) {
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ChangePinInput>({
    resolver: zodResolver(changePinSchema),
  })

  const onSubmit = async (data: ChangePinInput) => {
    setLoading(true)
    setError(null)
    setSaved(false)

    const res = await fetch('/api/auth/change-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ new_pin: data.new_pin, user_id: userId }),
    })
    const json = await res.json()

    if (!res.ok) {
      setError(json.error ?? 'Erro ao alterar PIN.')
    } else {
      setSaved(true)
      reset()
    }
    setLoading(false)
  }

  const inputStyle = { background: 'var(--input-bg, #f9fafb)', border: '1.5px solid var(--border, #e5e7eb)', color: 'var(--text, #111)' }

  return (
    <motion.form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 text-sm px-3 py-2.5 rounded-xl"
            style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)', color: 'var(--danger, #dc2626)' }}
          >
            <AlertTriangle size={14} /> {error}
          </motion.div>
        )}
        {saved && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            className="flex items-center gap-2 text-sm px-3 py-2.5 rounded-xl"
            style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.25)', color: 'var(--success, #16a34a)' }}
          >
            <CheckCircle2 size={14} /> PIN alterado com sucesso!
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }}>
        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-2, #374151)' }}>Novo PIN (4-6 dígitos)</label>
        <input
          {...register('new_pin')}
          type="password"
          inputMode="numeric"
          maxLength={6}
          placeholder="••••"
          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all tracking-widest"
          style={inputStyle}
          onFocus={e => (e.target.style.borderColor = 'var(--primary, #1e3a5f)')}
          onBlur={e => (e.target.style.borderColor = 'var(--border, #e5e7eb)')}
        />
        {errors.new_pin && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            className="text-xs mt-1" style={{ color: 'var(--danger, #dc2626)' }}>
            {errors.new_pin.message}
          </motion.p>
        )}
      </motion.div>

      <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25, delay: 0.06 }}>
        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-2, #374151)' }}>Confirmar PIN</label>
        <input
          {...register('confirm_pin')}
          type="password"
          inputMode="numeric"
          maxLength={6}
          placeholder="••••"
          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all tracking-widest"
          style={inputStyle}
          onFocus={e => (e.target.style.borderColor = 'var(--primary, #1e3a5f)')}
          onBlur={e => (e.target.style.borderColor = 'var(--border, #e5e7eb)')}
        />
        {errors.confirm_pin && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            className="text-xs mt-1" style={{ color: 'var(--danger, #dc2626)' }}>
            {errors.confirm_pin.message}
          </motion.p>
        )}
      </motion.div>

      <motion.button
        type="submit"
        disabled={loading}
        whileHover={{ scale: 1.02, y: -1 }}
        whileTap={{ scale: 0.97 }}
        className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
        style={{ background: 'var(--primary, #1e293b)', color: 'white' }}
      >
        {loading
          ? <><Loader2 size={14} className="animate-spin" /> Salvando...</>
          : <><ShieldCheck size={14} /> Alterar PIN</>
        }
      </motion.button>
    </motion.form>
  )
}
