'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { formatTime } from '@/lib/utils'

interface Props {
  openRecord: { id: string; clock_in: string } | null
}

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m`
  return `${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`
}

export default function ClockButton({ openRecord }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const supabase = createSupabaseBrowserClient()

  const isActive = !!openRecord

  useEffect(() => {
    if (!openRecord) return
    const start = new Date(openRecord.clock_in).getTime()
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000))
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [openRecord])

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
    router.push(`/checkout?record=${openRecord!.id}`)
  }

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-center flex items-center justify-center gap-2"
          >
            ⚠️ {error}
          </motion.div>
        )}
      </AnimatePresence>

      {isActive && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-1"
        >
          <p className="text-sm text-slate-500">
            Entrada às{' '}
            <span className="font-bold text-emerald-600">{formatTime(openRecord.clock_in)}</span>
          </p>
          <p className="text-2xl font-bold text-slate-700 tabular-nums">{formatElapsed(elapsed)}</p>
          <p className="text-xs text-slate-400">tempo em andamento</p>
        </motion.div>
      )}

      <div className="relative flex justify-center">
        {/* Ping ring when active */}
        {isActive && (
          <>
            <span className="absolute inset-0 rounded-2xl bg-red-400 opacity-20 animate-ping" />
            <span className="absolute inset-0 rounded-2xl bg-red-400 opacity-10 animate-ping" style={{ animationDelay: '0.5s' }} />
          </>
        )}

        <motion.button
          onClick={isActive ? handleClockOut : handleClockIn}
          disabled={loading}
          whileTap={{ scale: 0.96 }}
          whileHover={{ scale: 1.02 }}
          className={`
            relative w-full py-7 rounded-2xl text-white text-lg font-bold shadow-xl
            transition-all disabled:opacity-60 disabled:cursor-not-allowed
            flex items-center justify-center gap-3
            ${isActive
              ? 'bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/30 hover:from-red-600 hover:to-rose-700'
              : 'bg-gradient-to-br from-emerald-500 to-green-600 shadow-emerald-500/30 hover:from-emerald-600 hover:to-green-700'
            }
          `}
        >
          {loading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-6 h-6 border-3 border-white border-t-transparent rounded-full"
              style={{ borderWidth: 3 }}
            />
          ) : isActive ? (
            <>
              <span className="text-2xl">⏹</span>
              <span>Registrar Saída</span>
            </>
          ) : (
            <>
              <span className="text-2xl">▶</span>
              <span>Registrar Entrada</span>
            </>
          )}
        </motion.button>
      </div>
    </div>
  )
}
