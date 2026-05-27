'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin, CheckCircle2, XCircle, AlertTriangle,
  Navigation, Loader2, Lock, WifiOff, Clock
} from 'lucide-react'
import { formatTime } from '@/lib/utils'

interface Props {
  openRecord: { id: string; clock_in: string } | null
}

type Phase =
  | 'idle'
  | 'geo_requesting'
  | 'geo_validating'
  | 'approved'
  | 'blocked_outside'
  | 'blocked_permission'
  | 'blocked_unavailable'
  | 'already_open'
  | 'error'

interface BlockedInfo {
  distance?: number
  radius?: number
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
  const [phase, setPhase] = useState<Phase>('idle')
  const [elapsed, setElapsed] = useState(0)
  const [blockedInfo, setBlockedInfo] = useState<BlockedInfo>({})
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const didApprove = useRef(false)

  const isActive = !!openRecord

  // Elapsed timer for active session
  useEffect(() => {
    if (!openRecord) return
    const start = new Date(openRecord.clock_in).getTime()
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000))
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [openRecord])

  // Auto-reset blocked states after 6s
  useEffect(() => {
    if (!['blocked_outside', 'blocked_permission', 'blocked_unavailable', 'already_open', 'error'].includes(phase)) return
    const t = setTimeout(() => setPhase('idle'), 6000)
    return () => clearTimeout(t)
  }, [phase])

  const handleClockOut = () => {
    router.push(`/checkout?record=${openRecord!.id}`)
  }

  const handleClockIn = async () => {
    if (phase !== 'idle') return
    setPhase('geo_requesting')
    setBlockedInfo({})
    setErrorMsg(null)

    const userAgent = navigator.userAgent

    const sendRequest = async (
      geoStatus: string,
      lat?: number,
      lng?: number,
      accuracy?: number,
    ) => {
      setPhase('geo_validating')
      try {
        const res = await fetch('/api/clock/in', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            geo_lat: lat,
            geo_lng: lng,
            geo_accuracy: accuracy,
            geo_status: geoStatus,
            user_agent: userAgent,
          }),
        })

        const data = await res.json()

        if (!res.ok) {
          if (res.status === 409) {
            setPhase('already_open')
          } else {
            setErrorMsg(data.error ?? 'Erro ao registrar ponto.')
            setPhase('error')
          }
          return
        }

        if (data.success) {
          didApprove.current = true
          setPhase('approved')
          setTimeout(() => {
            router.refresh()
            setPhase('idle')
            didApprove.current = false
          }, 2000)
        } else {
          const gs = data.geo_status as string
          setBlockedInfo({ distance: data.distance, radius: data.radius })
          if (gs === 'blocked') setPhase('blocked_outside')
          else if (gs === 'permission_denied') setPhase('blocked_permission')
          else setPhase('blocked_unavailable')
        }
      } catch {
        setErrorMsg('Sem conexão. Verifique sua internet.')
        setPhase('error')
      }
    }

    // Request geolocation
    if (!navigator.geolocation) {
      await sendRequest('unavailable')
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await sendRequest('available', pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy)
      },
      async (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          await sendRequest('permission_denied')
        } else if (err.code === err.TIMEOUT) {
          await sendRequest('timeout')
        } else {
          await sendRequest('unavailable')
        }
      },
      { timeout: 12000, maximumAge: 30000, enableHighAccuracy: true },
    )
  }

  // ─── Status card content ─────────────────────────────
  const statusCard = () => {
    switch (phase) {
      case 'geo_requesting':
        return (
          <motion.div
            key="requesting"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm"
            style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)' }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            >
              <Navigation size={16} style={{ color: 'var(--info)' }} />
            </motion.div>
            <div>
              <p className="font-semibold" style={{ color: 'var(--info)' }}>Detectando localização…</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>Mantenha a localização ativada</p>
            </div>
          </motion.div>
        )

      case 'geo_validating':
        return (
          <motion.div
            key="validating"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm"
            style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)' }}
          >
            <Loader2 size={16} className="animate-spin" style={{ color: 'var(--info)' }} />
            <div>
              <p className="font-semibold" style={{ color: 'var(--info)' }}>Validando localização…</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>Verificando se você está no local autorizado</p>
            </div>
          </motion.div>
        )

      case 'approved':
        return (
          <motion.div
            key="approved"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm"
            style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.25)' }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            >
              <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
            </motion.div>
            <div>
              <p className="font-semibold" style={{ color: 'var(--success)' }}>Ponto registrado com sucesso!</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>Localização validada no laboratório</p>
            </div>
          </motion.div>
        )

      case 'blocked_outside':
        return (
          <motion.div
            key="blocked_outside"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="px-4 py-3 rounded-xl text-sm"
            style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.25)' }}
          >
            <div className="flex items-start gap-3">
              <XCircle size={18} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--danger)' }} />
              <div>
                <p className="font-semibold" style={{ color: 'var(--danger)' }}>Fora da área permitida</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-2)' }}>
                  Sua localização está a{' '}
                  <strong>{blockedInfo.distance ?? '?'}m</strong> do laboratório.
                  É necessário estar a menos de{' '}
                  <strong>{blockedInfo.radius ?? 150}m</strong> para registrar o ponto.
                </p>
                <p className="text-xs mt-1.5" style={{ color: 'var(--text-3)' }}>
                  Dirija-se ao local autorizado e tente novamente.
                </p>
              </div>
            </div>
          </motion.div>
        )

      case 'blocked_permission':
        return (
          <motion.div
            key="blocked_perm"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="px-4 py-3 rounded-xl text-sm"
            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}
          >
            <div className="flex items-start gap-3">
              <Lock size={18} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--warning)' }} />
              <div>
                <p className="font-semibold" style={{ color: 'var(--warning)' }}>Permissão de localização negada</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-2)' }}>
                  Para registrar o ponto, ative a localização no seu navegador e recarregue a página.
                </p>
              </div>
            </div>
          </motion.div>
        )

      case 'blocked_unavailable':
        return (
          <motion.div
            key="blocked_unavail"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="px-4 py-3 rounded-xl text-sm"
            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}
          >
            <div className="flex items-start gap-3">
              <WifiOff size={18} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--warning)' }} />
              <div>
                <p className="font-semibold" style={{ color: 'var(--warning)' }}>GPS indisponível</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-2)' }}>
                  Verifique se o GPS está ativado e tente novamente.
                </p>
              </div>
            </div>
          </motion.div>
        )

      case 'already_open':
        return (
          <motion.div
            key="already_open"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm"
            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}
          >
            <AlertTriangle size={16} style={{ color: 'var(--warning)' }} />
            <p style={{ color: 'var(--warning)' }}>Você já tem uma entrada em aberto.</p>
          </motion.div>
        )

      case 'error':
        return (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm"
            style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            <AlertTriangle size={16} style={{ color: 'var(--danger)' }} />
            <p style={{ color: 'var(--danger)' }}>{errorMsg ?? 'Erro ao registrar. Tente novamente.'}</p>
          </motion.div>
        )

      default:
        return null
    }
  }

  const isLoading = phase === 'geo_requesting' || phase === 'geo_validating'
  const isBlocked = ['blocked_outside', 'blocked_permission', 'blocked_unavailable', 'already_open', 'error'].includes(phase)
  const isSuccess = phase === 'approved'

  // Button label & icon
  const buttonContent = () => {
    if (isActive) {
      return (
        <>
          <span className="text-xl">⏹</span>
          <span>Registrar Saída</span>
        </>
      )
    }
    if (isLoading) {
      return (
        <>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Navigation size={22} />
          </motion.div>
          <span>{phase === 'geo_requesting' ? 'Detectando…' : 'Validando…'}</span>
        </>
      )
    }
    if (isSuccess) {
      return (
        <>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400 }}>
            <CheckCircle2 size={22} />
          </motion.div>
          <span>Registrado!</span>
        </>
      )
    }
    return (
      <>
        <MapPin size={22} />
        <span>Registrar Entrada</span>
      </>
    )
  }

  const buttonBg = isActive
    ? 'linear-gradient(135deg, #ef4444, #dc2626)'
    : isSuccess
    ? 'linear-gradient(135deg, #16a34a, #15803d)'
    : isBlocked
    ? 'linear-gradient(135deg, #78716c, #57534e)'
    : 'linear-gradient(135deg, #1e7a38, #15803d)'

  return (
    <div className="space-y-3">
      {/* Elapsed timer for active session */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center space-y-0.5"
          >
            <div className="flex items-center justify-center gap-1.5">
              <Clock size={13} style={{ color: 'var(--text-3)' }} />
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                Entrada às{' '}
                <span className="font-bold" style={{ color: 'var(--success)' }}>
                  {formatTime(openRecord!.clock_in)}
                </span>
              </p>
            </div>
            <p className="text-3xl font-black tabular-nums" style={{ color: 'var(--text)' }}>
              {formatElapsed(elapsed)}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>tempo em andamento</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main button */}
      <div className="relative">
        {/* Heartbeat rings when active (clocked in) */}
        {isActive && (
          <>
            <motion.span
              className="absolute inset-0 rounded-2xl bg-red-400"
              animate={{ scale: [1, 1.06, 1], opacity: [0.18, 0, 0.18] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.span
              className="absolute inset-0 rounded-2xl bg-red-500"
              animate={{ scale: [1, 1.12, 1], opacity: [0.10, 0, 0.10] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
            />
            <motion.span
              className="absolute inset-0 rounded-2xl bg-red-400"
              animate={{ scale: [1, 1.18, 1], opacity: [0.06, 0, 0.06] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
            />
          </>
        )}
        {/* Success pulse ring */}
        {isSuccess && (
          <>
            <motion.span
              className="absolute inset-0 rounded-2xl bg-emerald-400"
              animate={{ scale: [1, 1.08, 1], opacity: [0.25, 0, 0.25] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
            <motion.span
              className="absolute inset-0 rounded-2xl bg-emerald-400"
              animate={{ scale: [1, 1.16, 1], opacity: [0.15, 0, 0.15] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: 0.3 }}
            />
          </>
        )}

        <motion.button
          onClick={isActive ? handleClockOut : handleClockIn}
          disabled={isLoading || isSuccess || isBlocked}
          whileHover={!isLoading && !isBlocked ? { scale: 1.02, y: -2 } : {}}
          whileTap={{ scale: isLoading || isBlocked ? 1 : 0.95 }}
          animate={{
            scale: isSuccess ? 1.03 : 1,
            boxShadow: isActive
              ? ['0 8px 32px rgba(239,68,68,0.4)', '0 8px 48px rgba(239,68,68,0.6)', '0 8px 32px rgba(239,68,68,0.4)']
              : isSuccess
              ? '0 8px 32px rgba(22,163,74,0.5)'
              : '0 8px 24px rgba(0,0,0,0.2)',
          }}
          transition={isActive ? { boxShadow: { duration: 1.8, repeat: Infinity } } : { duration: 0.3 }}
          style={{ background: buttonBg }}
          className="relative w-full py-6 rounded-2xl text-white text-lg font-bold shadow-xl flex items-center justify-center gap-3 disabled:cursor-not-allowed"
        >
          {buttonContent()}
        </motion.button>
      </div>

      {/* Status card */}
      <AnimatePresence mode="wait">
        {statusCard()}
      </AnimatePresence>

      {/* Geo hint when idle */}
      {phase === 'idle' && !isActive && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-xs flex items-center justify-center gap-1"
          style={{ color: 'var(--text-3)' }}
        >
          <MapPin size={11} />
          Verificação de localização obrigatória
        </motion.p>
      )}
    </div>
  )
}
