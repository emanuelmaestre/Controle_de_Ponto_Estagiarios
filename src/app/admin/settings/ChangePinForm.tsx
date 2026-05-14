'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { changePinSchema, type ChangePinInput } from '@/lib/validations'

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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && <p className="text-red-600 text-sm">{error}</p>}
      {saved && <p className="text-green-600 text-sm">PIN alterado com sucesso!</p>}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Novo PIN (4-6 dígitos)</label>
        <input
          {...register('new_pin')}
          type="password"
          inputMode="numeric"
          maxLength={6}
          placeholder="••••"
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 tracking-widest"
        />
        {errors.new_pin && <p className="text-red-500 text-xs mt-1">{errors.new_pin.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar PIN</label>
        <input
          {...register('confirm_pin')}
          type="password"
          inputMode="numeric"
          maxLength={6}
          placeholder="••••"
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 tracking-widest"
        />
        {errors.confirm_pin && <p className="text-red-500 text-xs mt-1">{errors.confirm_pin.message}</p>}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors"
      >
        {loading ? 'Salvando...' : 'Alterar PIN'}
      </button>
    </form>
  )
}
