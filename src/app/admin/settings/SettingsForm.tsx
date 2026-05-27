'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { settingsSchema, type SettingsInput } from '@/lib/validations'
import type { Settings } from '@/types/database'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react'

interface Props {
  settings: Settings | null
}

export default function SettingsForm({ settings }: Props) {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<SettingsInput>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      lab_name: settings?.lab_name ?? 'Laboratório',
      reminder_in_time: (settings?.reminder_in_time ?? '08:00').slice(0, 5),
      reminder_out_after_hours: settings?.reminder_out_after_hours ?? 6,
      expected_daily_hours: settings?.expected_daily_hours ?? 4,
      report_email: settings?.report_email ?? '',
    },
  })

  const onSubmit = async (data: SettingsInput) => {
    setLoading(true)
    setError(null)
    setSaved(false)

    const { error: err } = await supabase
      .from('settings')
      .update({
        lab_name: data.lab_name,
        reminder_in_time: data.reminder_in_time,
        reminder_out_after_hours: data.reminder_out_after_hours,
        expected_daily_hours: data.expected_daily_hours,
        report_email: data.report_email || null,
      })
      .eq('id', settings?.id ?? '')

    if (err) {
      setError('Erro ao salvar configurações.')
    } else {
      setSaved(true)
      router.refresh()
    }
    setLoading(false)
  }

  const inputCls = "w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
  const inputStyle = { background: 'var(--input-bg, #f9fafb)', border: '1.5px solid var(--border, #e5e7eb)', color: 'var(--text, #111)' }

  return (
    <motion.form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5"
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
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 text-sm px-3 py-2.5 rounded-xl"
            style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.25)', color: 'var(--success, #16a34a)' }}
          >
            <CheckCircle2 size={14} /> Configurações salvas!
          </motion.div>
        )}
      </AnimatePresence>

      {[
        { label: 'Nome do laboratório', field: 'lab_name' as const, type: 'text', error: errors.lab_name },
      ].map(({ label, field, type, error: fieldErr }) => (
        <motion.div key={field} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }}>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-2, #374151)' }}>{label}</label>
          <input
            {...register(field)}
            type={type}
            className={inputCls}
            style={inputStyle}
            onFocus={e => (e.target.style.borderColor = 'var(--primary, #1e7a38)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border, #e5e7eb)')}
          />
          {fieldErr && (
            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              className="text-xs mt-1" style={{ color: 'var(--danger, #dc2626)' }}>
              {fieldErr.message}
            </motion.p>
          )}
        </motion.div>
      ))}

      <motion.div className="grid grid-cols-1 sm:grid-cols-2 gap-4" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25, delay: 0.05 }}>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-2, #374151)' }}>Lembrete de entrada (horário)</label>
          <input
            {...register('reminder_in_time')}
            type="time"
            className={inputCls}
            style={inputStyle}
            onFocus={e => (e.target.style.borderColor = 'var(--primary, #1e7a38)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border, #e5e7eb)')}
          />
          {errors.reminder_in_time && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.reminder_in_time.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-2, #374151)' }}>Lembrete de saída (após X horas)</label>
          <input
            {...register('reminder_out_after_hours', { valueAsNumber: true })}
            type="number" min={1} max={12}
            className={inputCls}
            style={inputStyle}
            onFocus={e => (e.target.style.borderColor = 'var(--primary, #1e7a38)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border, #e5e7eb)')}
          />
          {errors.reminder_out_after_hours && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.reminder_out_after_hours.message}</p>}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25, delay: 0.1 }}>
        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-2, #374151)' }}>Horas diárias esperadas</label>
        <input
          {...register('expected_daily_hours', { valueAsNumber: true })}
          type="number" min={1} max={12}
          className={inputCls}
          style={inputStyle}
          onFocus={e => (e.target.style.borderColor = 'var(--primary, #1e7a38)')}
          onBlur={e => (e.target.style.borderColor = 'var(--border, #e5e7eb)')}
        />
        {errors.expected_daily_hours && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.expected_daily_hours.message}</p>}
      </motion.div>

      <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25, delay: 0.15 }}>
        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-2, #374151)' }}>E-mail para relatórios mensais (opcional)</label>
        <input
          {...register('report_email')}
          type="email"
          placeholder="relatorio@exemplo.com"
          className={inputCls}
          style={inputStyle}
          onFocus={e => (e.target.style.borderColor = 'var(--primary, #1e7a38)')}
          onBlur={e => (e.target.style.borderColor = 'var(--border, #e5e7eb)')}
        />
        {errors.report_email && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.report_email.message}</p>}
      </motion.div>

      <motion.button
        type="submit"
        disabled={loading}
        whileHover={{ scale: 1.02, y: -1 }}
        whileTap={{ scale: 0.97 }}
        className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
        style={{ background: 'var(--primary, #1e3a5f)', color: 'white' }}
      >
        {loading ? <><Loader2 size={14} className="animate-spin" /> Salvando...</> : 'Salvar configurações'}
      </motion.button>
    </motion.form>
  )
}
