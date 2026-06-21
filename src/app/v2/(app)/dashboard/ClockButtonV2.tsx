'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  hasOpenRecord: boolean
  openRecordId: string | null
  clockInTime: string | null
}

export default function ClockButtonV2({ hasOpenRecord, openRecordId, clockInTime }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const router = useRouter()

  useEffect(() => {
    if (!hasOpenRecord || !clockInTime) return
    const updateElapsed = () => {
      setElapsed(Math.floor((new Date().getTime() - new Date(clockInTime).getTime()) / 60000))
    }
    queueMicrotask(updateElapsed)
    const interval = setInterval(updateElapsed, 60_000)
    return () => clearInterval(interval)
  }, [clockInTime, hasOpenRecord])

  async function handleClockIn() {
    setLoading(true)
    setError('')

    const res = await fetch('/api/clock/in', { method: 'POST' })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) { setError(data.error); return }
    router.refresh()
  }

  function handleClockOut() {
    if (openRecordId) {
      router.push(`/v2/checkout?record=${openRecordId}`)
    }
  }

  if (hasOpenRecord) {
    const h = Math.floor(elapsed / 60)
    const m = elapsed % 60

    return (
      <div className="space-y-3">
        <div className="bg-green-950 border border-green-800 rounded-xl p-4 text-center">
          <p className="text-green-400 text-sm">Trabalhando ha</p>
          <p className="text-3xl font-bold text-white mt-1">{h}h {String(m).padStart(2, '0')}min</p>
        </div>
        <button
          onClick={handleClockOut}
          className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-lg transition-colors"
        >
          Registrar Saida
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleClockIn}
        disabled={loading}
        className="w-full py-4 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold rounded-xl text-lg transition-colors"
      >
        {loading ? 'Registrando...' : 'Registrar Entrada'}
      </button>
      {error && <p className="text-red-400 text-sm text-center">{error}</p>}
    </div>
  )
}
