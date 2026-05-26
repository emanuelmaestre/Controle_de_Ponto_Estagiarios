'use client'

import { useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

function SetupPinContent() {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [step, setStep] = useState<'create' | 'confirm'>('create')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDigit = (d: string) => {
    if (step === 'create') {
      if (pin.length < 6) setPin(p => p + d)
    } else {
      if (confirmPin.length < 6) setConfirmPin(p => p + d)
    }
  }

  const handleDelete = () => {
    if (step === 'create') {
      setPin(p => p.slice(0, -1))
    } else {
      setConfirmPin(p => p.slice(0, -1))
    }
  }

  const currentPin = step === 'create' ? pin : confirmPin

  // Quando PIN de criação atinge 4-6 dígitos
  const handleNext = () => {
    if (pin.length < 4) {
      setError('O PIN deve ter no mínimo 4 dígitos.')
      return
    }
    setError(null)
    setStep('confirm')
  }

  const handleSubmit = async () => {
    if (pin !== confirmPin) {
      setError('Os PINs não coincidem. Tente novamente.')
      setConfirmPin('')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/login')
        return
      }

      const res = await fetch('/api/auth/change-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_pin: pin, user_id: user.id }),
      })

      if (!res.ok) {
        setError('Erro ao salvar PIN. Tente novamente.')
        return
      }

      // Redirecionar baseado no role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      router.push(profile?.role === 'manager' ? '/admin' : '/dashboard')
      router.refresh()
    } catch {
      setError('Erro de conexão.')
    } finally {
      setLoading(false)
    }
  }

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫']

  return (
    <div className="flex items-center justify-center p-4" style={{ height: '100dvh', overflow: 'hidden', background: 'var(--bg)' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full blur-3xl opacity-30" style={{ background: 'var(--primary)' }} />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full blur-3xl opacity-20" style={{ background: 'var(--accent)' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div className="px-8 py-7 text-center" style={{ background: 'var(--nav-bg)' }}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-[64px] h-[64px] bg-white/20 rounded-2xl mx-auto mb-3 flex items-center justify-center"
          >
            <span className="text-3xl">🔢</span>
          </motion.div>
          <h1 className="text-white font-bold text-lg">
            {step === 'create' ? 'Criar seu PIN' : 'Confirmar PIN'}
          </h1>
          <p className="text-blue-200 text-sm mt-1">
            {step === 'create'
              ? 'Digite um PIN de 4 a 6 dígitos para acesso rápido'
              : 'Repita o PIN para confirmar'}
          </p>
        </div>

        <div className="px-8 py-6 space-y-4">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-start gap-2"
            >
              <span>⚠️</span> {error}
            </motion.div>
          )}

          {/* PIN dots */}
          <div className="flex justify-center gap-3 py-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  scale: i === currentPin.length - 1 ? [1.3, 1] : 1,
                  backgroundColor: i < currentPin.length ? '#3b82f6' : 'rgba(255,255,255,0.2)',
                }}
                transition={{ duration: 0.15 }}
                className="w-3.5 h-3.5 rounded-full"
              />
            ))}
          </div>

          {/* PinPad */}
          <div className="grid grid-cols-3 gap-2">
            {keys.map((k, i) => (
              <motion.button
                key={i}
                type="button"
                whileTap={{ scale: k !== '' ? 0.9 : 1 }}
                disabled={k === '' || currentPin.length >= 6}
                onClick={() => k === '⌫' ? handleDelete() : k !== '' && handleDigit(k)}
                className={`
                  h-14 rounded-2xl text-xl font-semibold transition-colors
                  ${k === '' ? 'invisible' : ''}
                  ${k === '⌫'
                    ? 'bg-white/10 text-red-300 hover:bg-red-500/20'
                    : 'bg-white/10 hover:bg-white/20 text-white shadow-sm border border-white/10'}
                  disabled:opacity-40 disabled:cursor-not-allowed
                `}
              >
                {k}
              </motion.button>
            ))}
          </div>

          {step === 'create' ? (
            <motion.button
              onClick={handleNext}
              disabled={pin.length < 4}
              whileTap={{ scale: 0.97 }}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-500 hover:to-blue-300 text-white font-bold rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continuar →
            </motion.button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => { setStep('create'); setConfirmPin(''); setError(null) }}
                className="flex-1 py-3 border border-white/20 text-white/70 hover:text-white rounded-xl text-sm font-semibold transition-all"
              >
                ← Voltar
              </button>
              <motion.button
                onClick={handleSubmit}
                disabled={loading || confirmPin.length < 4}
                whileTap={{ scale: 0.97 }}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-emerald-400 text-white font-bold rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : '✓ Salvar PIN'}
              </motion.button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default function SetupPinPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center" style={{ height: '100dvh', background: 'linear-gradient(135deg, #172554, #1e3a8a, #312e81)' }}>
        <div className="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SetupPinContent />
    </Suspense>
  )
}
