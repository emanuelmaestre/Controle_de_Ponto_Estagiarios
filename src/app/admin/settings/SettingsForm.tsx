'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { settingsSchema, type SettingsInput } from '@/lib/validations'
import type { Settings } from '@/types/database'
import { useRouter } from 'next/navigation'

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
      reminder_in_time: settings?.reminder_in_time ?? '08:00',
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {error && <p className="text-red-600 text-sm">{error}</p>}
      {saved && <p className="text-green-600 text-sm">Configurações salvas!</p>}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nome do laboratório</label>
        <input
          {...register('lab_name')}
          type="text"
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        {errors.lab_name && <p className="text-red-500 text-xs mt-1">{errors.lab_name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Lembrete de entrada (horário)
          </label>
          <input
            {...register('reminder_in_time')}
            type="time"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          {errors.reminder_in_time && (
            <p className="text-red-500 text-xs mt-1">{errors.reminder_in_time.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Lembrete de saída (após X horas)
          </label>
          <input
            {...register('reminder_out_after_hours', { valueAsNumber: true })}
            type="number"
            min={1}
            max={12}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          {errors.reminder_out_after_hours && (
            <p className="text-red-500 text-xs mt-1">{errors.reminder_out_after_hours.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Horas diárias esperadas
        </label>
        <input
          {...register('expected_daily_hours', { valueAsNumber: true })}
          type="number"
          min={1}
          max={12}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        {errors.expected_daily_hours && (
          <p className="text-red-500 text-xs mt-1">{errors.expected_daily_hours.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          E-mail para relatórios mensais (opcional)
        </label>
        <input
          {...register('report_email')}
          type="email"
          placeholder="relatorio@exemplo.com"
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        {errors.report_email && <p className="text-red-500 text-xs mt-1">{errors.report_email.message}</p>}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors"
      >
        {loading ? 'Salvando...' : 'Salvar configurações'}
      </button>
    </form>
  )
}
