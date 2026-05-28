'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence, useAnimation } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock, AlertCircle, Loader2, CheckCircle2, ShieldCheck, ArrowBigUp } from 'lucide-react'
import { toast } from 'sonner'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { loginSchema, type LoginInput } from '@/lib/validations'
import ThemeToggle from '@/components/ThemeToggle'

/* ── Shake hook ──────────────────────────────────────── */
function useShake() {
  const controls = useAnimation()
  const shake = async () => {
    await controls.start({
      x: [0, -10, 10, -8, 8, -5, 5, 0],
      transition: { duration: 0.45, ease: 'easeInOut' },
    })
  }
  return { controls, shake }
}

/* ── Success overlay ─────────────────────────────────── */
function SuccessOverlay({ name }: { name: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center rounded-3xl"
      style={{ background: 'var(--nav-bg)' }}
    >
      {/* Ripple rings */}
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="absolute rounded-full border-2"
          style={{ borderColor: 'var(--primary-light)', opacity: 0 }}
          animate={{ scale: [0.6, 2.2], opacity: [0.6, 0] }}
          transition={{ duration: 1.4, delay: i * 0.25, repeat: Infinity, ease: 'easeOut' }}
        />
      ))}

      {/* Check icon */}
      <motion.div
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
        className="w-20 h-20 rounded-full flex items-center justify-center mb-5 relative"
        style={{ background: 'rgba(255,255,255,0.08)' }}
      >
        <motion.div
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
        >
          <CheckCircle2 size={44} style={{ color: 'var(--primary-light)' }} strokeWidth={1.5} />
        </motion.div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="font-bold text-lg text-white"
      >
        Acesso liberado!
      </motion.p>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-sm mt-1"
        style={{ color: 'var(--nav-muted)' }}
      >
        Bem-vindo{name ? `, ${name}` : ''}
      </motion.p>

      {/* Progress bar */}
      <motion.div
        className="absolute bottom-0 left-0 h-1 rounded-b-3xl"
        style={{ background: 'var(--primary-light)' }}
        initial={{ width: '0%' }}
        animate={{ width: '100%' }}
        transition={{ duration: 1.5, ease: 'linear', delay: 0.2 }}
      />
    </motion.div>
  )
}

/* ── PIN Pad ─────────────────────────────────────────── */
function PinPad({ pin, onDigit, onDelete, shake }: {
  pin: string
  onDigit: (d: string) => void
  onDelete: () => void
  shake?: boolean
}) {
  const keys = ['1','2','3','4','5','6','7','8','9','','0','⌫']
  return (
    <div className="space-y-3">
      {/* Dots */}
      <div className="flex justify-center gap-3 py-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.div
            key={i}
            animate={{
              scale: i === pin.length - 1 ? [1.4, 1] : 1,
              backgroundColor: i < pin.length ? 'var(--primary)' : 'var(--border)',
            }}
            transition={{ duration: 0.15 }}
            className="w-3 h-3 rounded-full"
          />
        ))}
      </div>
      {/* Grid */}
      <div className="grid grid-cols-3 gap-2">
        {keys.map((k, i) => (
          <motion.button
            key={i}
            type="button"
            whileTap={{ scale: k ? 0.88 : 1 }}
            disabled={!k || pin.length >= 6}
            onClick={() => k === '⌫' ? onDelete() : k && onDigit(k)}
            className={`h-12 sm:h-14 rounded-2xl text-base sm:text-lg font-bold transition-all disabled:opacity-30 ${!k ? 'invisible' : ''}`}
            style={{
              background: k === '⌫' ? 'var(--bg-secondary)' : 'var(--surface)',
              color: k === '⌫' ? 'var(--accent)' : 'var(--text)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--card-shadow)',
            }}
          >
            {k}
          </motion.button>
        ))}
      </div>
    </div>
  )
}

/* ── Main content ───────────────────────────────────── */
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
  const [capsLock, setCapsLock] = useState(false)
  const [error, setError] = useState<string | null>(
    errorParam === 'conta-inativa' ? 'Conta desativada. Contate o responsável.' : null
  )
  const [success, setSuccess] = useState(false)
  const [successName, setSuccessName] = useState('')

  const { shake: shakeForm, controls: formControls } = useShake()

  const supabase = createSupabaseBrowserClient()

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<LoginInput>({ resolver: zodResolver(loginSchema) })

  const getRedirectUrl = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return '/login'
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, pin, is_active, full_name')
      .eq('id', user.id)
      .maybeSingle()

    if (profile && !profile.is_active) {
      await supabase.auth.signOut()
      return null
    }
    setSuccessName(profile?.full_name?.split(' ')[0] ?? '')
    if (profile && !profile.pin) return '/setup-pin'
    if (redirect) return redirect
    return profile?.role === 'manager' ? '/admin' : '/dashboard'
  }

  const handleSuccess = (url: string) => {
    setSuccess(true)
    setTimeout(() => {
      router.push(url)
      router.refresh()
    }, 1800)
  }

  const handleError = (msg: string) => {
    setError(msg)
    shakeForm()
    toast.error(msg, {
      icon: <AlertCircle size={16} />,
      duration: 4000,
    })
  }

  const onSubmitEmail = async (data: LoginInput) => {
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    if (error) {
      handleError('E-mail ou senha incorretos.')
      return
    }
    const url = await getRedirectUrl()
    if (!url) {
      handleError('Conta desativada. Contate o responsável.')
      return
    }
    handleSuccess(url)
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
        setPin('')
        handleError(json.error || 'PIN incorreto.')
        return
      }
      const url = await getRedirectUrl()
      if (url) handleSuccess(url)
    } catch {
      handleError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm">
      {/* Orbs — cores fixas verdes, não dependem do tema salvo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full blur-3xl opacity-20"
          style={{ background: '#3fe56c' }} />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full blur-3xl opacity-15"
          style={{ background: '#00c853' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-3xl opacity-[0.07]"
          style={{ background: '#69ff87' }} />
      </div>

      <motion.div
        animate={formControls}
        initial={{ opacity: 0, scale: 0.94, y: 24 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        {/* Success overlay */}
        <AnimatePresence>
          {success && <SuccessOverlay name={successName} />}
        </AnimatePresence>

        {/* ── Header ── */}
        <div
          className="px-6 pt-6 pb-5 sm:px-8 sm:pt-8 sm:pb-7 text-center relative overflow-hidden"
          style={{ background: 'var(--nav-bg)' }}
        >
          <div className="absolute top-3 right-3">
            <ThemeToggle compact />
          </div>
          {/* Dot grid */}
          <div className="absolute inset-0 opacity-5 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />

          {/* Logo */}
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.5, delay: 0.15, type: 'spring', stiffness: 220 }}
            className="float-anim mx-auto mb-3"
            style={{ width: 160, height: 44 }}
          >
            <Image src="/logo.svg" alt="ChronosLab" width={160} height={44} className="object-contain" />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-sm"
            style={{ color: 'var(--nav-muted)' }}
          >
            Controle de Ponto — acesso seguro
          </motion.p>
        </div>

        {/* ── Error banner ── */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 20 }}
              exit={{   opacity: 0, height: 0, marginTop: 0 }}
              className="mx-5 p-3 rounded-2xl flex items-start gap-2 text-sm overflow-hidden"
              style={{
                background: 'rgba(220,38,38,0.08)',
                border: '1px solid rgba(220,38,38,0.25)',
                color: 'var(--danger)',
              }}
            >
              <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
              <span className="font-medium">{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Tabs ── */}
        <div
          className="relative flex mx-5 mt-5 p-1 rounded-2xl"
          style={{ background: 'var(--bg-secondary)' }}
        >
          <motion.div
            className="absolute top-1 bottom-1 rounded-xl shadow-sm"
            animate={{ left: mode === 'email' ? '4px' : '50%', width: 'calc(50% - 4px)' }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            style={{ background: 'var(--surface)' }}
          />
          {(['email', 'pin'] as const).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(null); setPin('') }}
              className="relative flex-1 py-2 text-sm font-semibold rounded-xl z-10 flex items-center justify-center gap-1.5 transition-colors"
              style={{ color: mode === m ? 'var(--primary)' : 'var(--text-3)' }}
            >
              {m === 'email' ? <Mail size={13} /> : <ShieldCheck size={13} />}
              {m === 'email' ? 'E-mail' : 'PIN'}
            </button>
          ))}
        </div>

        {/* ── Forms ── */}
        <div className="px-5 pt-5 pb-6">
          <AnimatePresence mode="wait">

            {/* EMAIL */}
            {mode === 'email' && (
              <motion.form
                key="email"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{   opacity: 0, x:  16 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleSubmit(onSubmitEmail)}
                className="space-y-3"
              >
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-3)' }}>
                    E-mail
                  </label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
                    <input
                      {...register('email')}
                      type="email"
                      autoComplete="email"
                      placeholder="seu@email.com"
                      className="w-full pl-9 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
                      style={{
                        background: 'var(--input-bg)',
                        border: `1.5px solid ${errors.email ? 'var(--danger)' : 'var(--border)'}`,
                        color: 'var(--text)',
                      }}
                      onFocus={e  => (e.target.style.borderColor = 'var(--primary)')}
                      onBlur={e   => (e.target.style.borderColor = errors.email ? 'var(--danger)' : 'var(--border)')}
                    />
                  </div>
                  {errors.email && (
                    <motion.p initial={{ opacity:0,y:-4 }} animate={{ opacity:1,y:0 }}
                      className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--danger)' }}>
                      <AlertCircle size={11} /> {errors.email.message}
                    </motion.p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>
                      Senha
                    </label>
                    {/* ── Caps Lock badge ── */}
                    <AnimatePresence>
                      {capsLock && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.6, y: -4 }}
                          animate={{ opacity: 1, scale: 1, y: 0,
                            transition: { type: 'spring', stiffness: 380, damping: 18 }
                          }}
                          exit={{ opacity: 0, scale: 0.7, y: -4, transition: { duration: 0.15 } }}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black tracking-widest select-none"
                          style={{
                            background: 'rgba(255,191,0,0.15)',
                            border: '1px solid rgba(255,191,0,0.45)',
                            color: '#ffbf00',
                          }}
                        >
                          <ArrowBigUp size={11} className="fill-current" />
                          CAPS LOCK ATIVO
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
                    <input
                      {...register('password')}
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      className="w-full pl-9 pr-10 py-3 rounded-xl text-sm outline-none transition-all"
                      style={{
                        background: 'var(--input-bg)',
                        border: `1.5px solid ${capsLock ? 'rgba(255,191,0,0.5)' : errors.password ? 'var(--danger)' : 'var(--border)'}`,
                        color: 'var(--text)',
                      }}
                      onKeyDown={e => setCapsLock(e.getModifierState('CapsLock'))}
                      onKeyUp={e   => setCapsLock(e.getModifierState('CapsLock'))}
                      onFocus={e   => (e.target.style.borderColor = capsLock ? 'rgba(255,191,0,0.6)' : 'var(--primary)')}
                      onBlur={e    => {
                        e.target.style.borderColor = capsLock ? 'rgba(255,191,0,0.5)'
                          : errors.password ? 'var(--danger)' : 'var(--border)'
                      }}
                    />
                    <button type="button" onClick={() => setShowPassword(v => !v)} tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-80"
                      style={{ color: 'var(--text-3)' }}>
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {/* Caps Lock tooltip abaixo do campo */}
                  <AnimatePresence>
                    {capsLock && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-[10px] mt-1.5 flex items-center gap-1 overflow-hidden"
                        style={{ color: '#ffbf00' }}
                      >
                        <ArrowBigUp size={10} className="fill-current flex-shrink-0" />
                        Caps Lock ligado — sua senha pode estar incorreta.
                      </motion.p>
                    )}
                  </AnimatePresence>
                  {errors.password && !capsLock && (
                    <motion.p initial={{ opacity:0,y:-4 }} animate={{ opacity:1,y:0 }}
                      className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--danger)' }}>
                      <AlertCircle size={11} /> {errors.password.message}
                    </motion.p>
                  )}
                </div>

                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 mt-1"
                  style={{
                    background: 'var(--primary)',
                    color: 'var(--primary-fg)',
                    boxShadow: '0 4px 18px rgba(30,92,45,0.45)',
                    opacity: isSubmitting ? 0.75 : 1,
                  }}
                >
                  {isSubmitting ? (
                    <><Loader2 size={15} className="animate-spin" /> Entrando...</>
                  ) : 'Entrar'}
                </motion.button>
              </motion.form>
            )}

            {/* PIN */}
            {mode === 'pin' && (
              <motion.div
                key="pin"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{   opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-3)' }}>
                    E-mail
                  </label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
                    <input
                      type="email"
                      value={pinEmail}
                      onChange={e => setPinEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="w-full pl-9 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
                      style={{
                        background: 'var(--input-bg)',
                        border: '1.5px solid var(--border)',
                        color: 'var(--text)',
                      }}
                      onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
                      onBlur={e  => (e.target.style.borderColor = 'var(--border)')}
                    />
                  </div>
                </div>

                <PinPad
                  pin={pin}
                  onDigit={d => setPin(p => p.length < 6 ? p + d : p)}
                  onDelete={() => setPin(p => p.slice(0, -1))}
                />

                <motion.button
                  onClick={handlePinSubmit}
                  disabled={pin.length < 4 || !pinEmail || loading}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                  style={{
                    background: 'var(--primary)',
                    color: 'var(--primary-fg)',
                    boxShadow: '0 4px 18px rgba(30,92,45,0.45)',
                    opacity: (pin.length < 4 || !pinEmail || loading) ? 0.4 : 1,
                  }}
                >
                  {loading ? (
                    <><Loader2 size={15} className="animate-spin" /> Verificando...</>
                  ) : 'Entrar com PIN'}
                </motion.button>
              </motion.div>
            )}

          </AnimatePresence>

          <div className="flex flex-col items-center gap-1.5 mt-4">
            {mode === 'email' && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
              >
                <Link href="/forgot-password" className="text-xs font-semibold transition-opacity hover:opacity-70"
                  style={{ color: 'var(--text-3)' }}>
                  Esqueceu a senha?
                </Link>
              </motion.div>
            )}
            <p className="text-center text-xs" style={{ color: 'var(--text-3)' }}>
              Não tem conta?{' '}
              <Link href="/register" className="font-semibold transition-colors hover:opacity-80"
                style={{ color: 'var(--primary)' }}>
                Criar conta
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default function LoginPage() {
  return (
    /* Força sempre o background verde — página de entrada é sempre on-brand */
    <div
      data-theme="green"
      className="flex items-center justify-center relative"
      style={{ minHeight: '100dvh', overflowY: 'auto', background: '#07170c', padding: '16px 16px 32px' }}
    >
      <Suspense fallback={
        <div className="w-full max-w-sm rounded-3xl p-10 text-center" style={{ background: '#0f2318' }}>
          <Loader2 size={32} className="animate-spin mx-auto" style={{ color: '#3fe56c' }} />
        </div>
      }>
        <LoginContent />
      </Suspense>
    </div>
  )
}
