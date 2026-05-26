'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { loginSchema, type LoginInput } from '@/lib/validations'

function PinPad({ pin, onDigit, onDelete }: {
  pin: string
  onDigit: (d: string) => void
  onDelete: () => void
}) {
  const keys = ['1','2','3','4','5','6','7','8','9','','0','⌫']
  return (
    <div className="space-y-4">
      <div className="flex justify-center gap-3 py-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.div
            key={i}
            animate={{
              scale: i === pin.length - 1 ? [1.3, 1] : 1,
              backgroundColor: i < pin.length ? '#1d4ed8' : '#e2e8f0',
            }}
            transition={{ duration: 0.15 }}
            className="w-3.5 h-3.5 rounded-full"
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {keys.map((k, i) => (
          <motion.button
            key={i}
            type="button"
            whileTap={{ scale: k !== '' ? 0.9 : 1 }}
            disabled={k === '' || pin.length >= 6}
            onClick={() => k === '⌫' ? onDelete() : k !== '' && onDigit(k)}
            className={`
              h-14 rounded-2xl text-xl font-semibold transition-colors
              ${k === '' ? 'invisible' : ''}
              ${k === '⌫'
                ? 'bg-slate-100 text-red-500 hover:bg-red-50'
                : 'bg-white/60 hover:bg-blue-50 text-slate-800 shadow-sm border border-slate-100'}
              disabled:opacity-40 disabled:cursor-not-allowed
            `}
          >
            {k}
          </motion.button>
        ))}
      </div>
    </div>
  )
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || ''
  const errorParam = searchParams.get('error')

  const [mode, setMode] = useState<'email' | 'pin'>('email')
  const [pin, setPin] = useState('')
  const [pinEmail, setPinEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(
    errorParam === 'conta-inativa' ? 'Conta desativada. Contate o chefe do laboratório.' : null
  )

  const supabase = createSupabaseBrowserClient()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) })

  const getRedirectUrl = async () => {
    if (redirect) return redirect
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return '/login'
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
    return profile?.role === 'manager' ? '/admin' : '/dashboard'
  }

  const onSubmitEmail = async (data: LoginInput) => {
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    if (error) {
      setError('E-mail ou senha incorretos.')
      return
    }
    const url = await getRedirectUrl()
    router.push(url)
    router.refresh()
  }

  const handlePinSubmit = async () => {
    if (pin.length < 4 || !pinEmail) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pinEmail, pin }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'PIN incorreto.')
        setPin('')
        return
      }
      const url = await getRedirectUrl()
      router.push(url)
      router.refresh()
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm">
      {/* Decorative circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-800/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative glass rounded-3xl overflow-hidden shadow-2xl border border-white/30"
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-900/90 to-blue-700/90 px-8 py-8 text-center">
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.5, delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-18 h-18 bg-white/20 rounded-2xl mx-auto mb-4 flex items-center justify-center w-[72px] h-[72px] float-anim"
          >
            <span className="text-4xl">🔬</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <h1 className="text-white font-bold text-xl">Controle de Ponto</h1>
            <p className="text-blue-200 text-sm mt-1">Laboratório — acesso seguro</p>
          </motion.div>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mx-6 mt-5 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2"
            >
              <span>⚠️</span>
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div className="relative flex mx-6 mt-5 bg-slate-100 rounded-xl p-1">
          <motion.div
            className="absolute top-1 bottom-1 bg-white rounded-lg shadow-sm"
            animate={{ left: mode === 'email' ? '4px' : '50%', width: 'calc(50% - 4px)' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
          {(['email', 'pin'] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(null); setPin('') }}
              className={`relative flex-1 py-2 text-sm font-semibold transition-colors rounded-lg z-10 ${
                mode === m ? 'text-blue-900' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {m === 'email' ? '✉️ E-mail' : '🔢 PIN'}
            </button>
          ))}
        </div>

        <div className="px-6 py-6">
          <AnimatePresence mode="wait">
            {mode === 'email' ? (
              <motion.form
                key="email"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleSubmit(onSubmitEmail)}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">E-mail</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">✉️</span>
                    <input
                      {...register('email')}
                      type="email"
                      autoComplete="email"
                      placeholder="seu@email.com"
                      className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 transition-all"
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Senha</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔒</span>
                    <input
                      {...register('password')}
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      className="w-full pl-9 pr-10 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                </div>
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileTap={{ scale: 0.97 }}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-800 to-blue-600 hover:from-blue-700 hover:to-blue-500 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-blue-500/25 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      />
                      Entrando...
                    </>
                  ) : (
                    'Entrar'
                  )}
                </motion.button>
              </motion.form>
            ) : (
              <motion.div
                key="pin"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">E-mail</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">✉️</span>
                    <input
                      type="email"
                      value={pinEmail}
                      onChange={(e) => setPinEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 transition-all"
                    />
                  </div>
                </div>
                <PinPad
                  pin={pin}
                  onDigit={(d) => setPin((p) => (p.length < 6 ? p + d : p))}
                  onDelete={() => setPin((p) => p.slice(0, -1))}
                />
                <motion.button
                  onClick={handlePinSubmit}
                  disabled={pin.length < 4 || !pinEmail || loading}
                  whileTap={{ scale: 0.97 }}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-800 to-blue-600 hover:from-blue-700 hover:to-blue-500 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-blue-500/25 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      />
                      Verificando...
                    </>
                  ) : (
                    'Entrar com PIN'
                  )}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-800 flex items-center justify-center p-4 relative">
      <Suspense fallback={
        <div className="w-full max-w-sm glass rounded-3xl shadow-2xl p-10 text-center">
          <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-blue-200 text-sm mt-4">Carregando...</p>
        </div>
      }>
        <LoginContent />
      </Suspense>
    </div>
  )
}
