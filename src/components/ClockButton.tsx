'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { formatTime } from '@/lib/utils'

interface Props {
  openRecord: { id: string; clock_in: string } | null
}

export default function ClockButton({ openRecord }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createSupabaseBrowserClient()

  const isActive = !!openRecord

  const handleClockIn = async () => {
    setLoading(true)
    setError(null)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('time_records').insert({
      intern_id: user.id,
      clock_in: new Date().toISOString(),
    })

    if (error) {
      setError(error.message.includes('aberto')
        ? 'Você já tem uma entrada em aberto.'
        : 'Erro ao registrar entrada.')
    } else {
      router.refresh()
    }
    setLoading(false)
  }

  const handleClockOut = () => {
    // Redirecionar para tela de checkout onde o estagiário informa atividades
    router.push(`/checkout?record=${openRecord!.id}`)
  }

  return (
    <div className="space-y-2">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center">
          {error}
        </div>
      )}

      {isActive && (
        <p className="text-center text-sm text-gray-500">
          Entrada registrada às{' '}
          <span className="font-semibold text-blue-900">
            {formatTime(openRecord.clock_in)}
          </span>
        </p>
      )}

      <button
        onClick={isActive ? handleClockOut : handleClockIn}
        disabled={loading}
        className={`
          w-full py-6 rounded-2xl text-white text-xl font-bold shadow-lg
          transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed
          ${isActive
            ? 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
            : 'bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
          }
        `}
      >
        {loading
          ? '...'
          : isActive
          ? '🔴  Registrar Saída'
          : '🟢  Registrar Entrada'}
      </button>
    </div>
  )
}
