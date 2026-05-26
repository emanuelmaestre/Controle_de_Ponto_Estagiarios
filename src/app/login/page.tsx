'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock, Hash, AlertCircle, Loader2 } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { loginSchema, type LoginInput } from '@/lib/validations'
import ThemeToggle from '@/components/ThemeToggle'

/* ── PIN Pad ─────────────────────────────────────────── */
function PinPad({ pin, onDigit, onDelete }: {
  pin: string
  onDigit: (d: string) => void
  onDelete: () => void
}) {
  const keys = ['1','2','3','4','5','6','7','8','9','','0','⌫']
  return (
    <div className="space-y-4">
      {/* Dots */}
      <div className="flex justify-center gap-3 py-2">
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
            className={`h-14 rounded-2xl text-lg font-bold transition-all disabled:opacity-30 ${
              !k ? 'invisible' : ''
            } ${
              k === '⌫'
                ? 'hover:opacity-80'
                : 'hover:opacity-80'
            }`}
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
  const [error, setError] = useState<string | null>(
    errorParam === 'conta-inativa' ? 'Conta desativada. Contate o responsável.' : null
  )

  const supabase = createSupabaseBrowserClient()

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<LoginInput>({ resolver: zodResolver(loginSchema) })

  const getRedirectUrl = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return '/login'
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, pin, is_active')
      .eq('id', user.id)
      .maybeSingle()

    if (profile && !profile.is_active) {
      await supabase.auth.signOut()
      setError('Conta desativada. Contate o responsável.')
      return ''
    }
    if (profile && !profile.pin) return '/setup-pin'
    if (redirect) return redirect
    return profile?.role === 'manager' ? '/admin' : '/dashboard'
  }

  const onSubmitEmail = async (data: LoginInput) => {
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    if (error) { setError('E-mail ou senha incorretos.'); return }
    const url = await getRedirectUrl()
    if (!url) return
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
      if (!res.ok) { setError(json.error || 'PIN incorreto.'); setPin(''); return }
      const url = await getRedirectUrl()
      if (url) { router.push(url); router.refresh() }
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm">
      {/* Orbs decorativos */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full blur-3xl opacity-30"
          style={{ background: 'var(--primary)' }} />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ background: 'var(--accent)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-3xl opacity-10"
          style={{ background: 'var(--primary-light)' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 24 }}
        animate={{ opacity: 1, scale: 1,    y: 0  }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        {/* ── Header ── */}
        <div
          className="px-8 pt-8 pb-7 text-center relative overflow-hidden"
          style={{ background: 'var(--nav-bg)' }}
        >
          {/* Theme toggle */}
          <div className="absolute top-3 right-3">
            <ThemeToggle compact />
          </div>

          {/* Padrão decorativo */}
          <div className="absolute inset-0 opacity-5 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />

          {/* Logo */}
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.5, delay: 0.15, type: 'spring', stiffness: 220 }}
            className="float-anim w-20 h-20 mx-auto mb-5 rounded-2xl flex items-center justify-center relative"
            style={{ background: 'rgba(255,255,255,0.12)' }}
          >
            <Image src="/logo.svg" alt="ChronosLab" width={56} height={56} className="object-contain" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="text-white font-bold text-xl tracking-tight">ChronosLab</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--nav-muted)' }}>
              Controle de Ponto — acesso seguro
            </p>
          </motion.div>
        </div>

        {/* ── Error ── */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{   opacity: 0, height: 0 }}
              className="mx-5 mt-5 p-3 rounded-2xl flex items-start gap-2 text-sm"
              style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', color: 'var(--danger)' }}
            >
              <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
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
              {m === 'email' ? <Mail size={13} /> : <Hash size={13} />}
              {m === 'email' ? 'E-mail' : 'PIN'}
            </button>
          ))}
        </div>

        {/* ── Forms ── */}
        <div className="px-5 pt-5 pb-6">
          <AnimatePresence mode="wait">
            {mode === 'email' ? (
              <motion.form
                key="email"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{   opacity: 0, x:  16 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleSubmit(onSubmitEmail)}
                className="space-y-3"
              >
                {/* E-mail */}
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
                        border: '1.5px solid var(--border)',
                        color: 'var(--text)',
                      }}
                      onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
                      onBlur={e  => (e.target.style.borderColor = 'var(--border)')}
                    />
                  </div>
                  {errors.email && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.email.message}</p>}
                </div>

                {/* Senha */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-3)' }}>
                    Senha
                  </label>
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
                        border: '1.5px solid var(--border)',
                        color: 'var(--text)',
                      }}
                      onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
                      onBlur={e  => (e.target.style.borderColor = 'var(--border)')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-80"
                      style={{ color: 'var(--text-3)' }}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.password.message}</p>}
                </div>

                {/* Submit */}
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileTap={{ scale: 0.97 }}
                  className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all mt-1"
                  style={{
                    background: 'var(--primary)',
                    color: 'var(--primary-fg)',
                    boxShadow: '0 4px 14px rgba(30,92,45,0.4)',
                    opacity: isSubmitting ? 0.7 : 1,
                  }}
                >
                  {isSubmitting ? (
                    <><Loader2 size={15} className="animate-spin" /> Entrando...</>
                  ) : 'Entrar'}
                </motion.button>
              </motion.form>
            ) : (
              <motion.div
                key="pin"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{   opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                {/* E-mail para PIN */}
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
                  whileTap={{ scale: 0.97 }}
                  className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
                  style={{
                    background: 'var(--primary)',
                    color: 'var(--primary-fg)',
                    boxShadow: '0 4px 14px rgba(30,92,45,0.4)',
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

          <p className="text-center text-xs mt-4" style={{ color: 'var(--text-3)' }}>
            Não tem conta?{' '}
            <Link
              href="/register"
              className="font-semibold transition-colors hover:opacity-80"
              style={{ color: 'var(--primary)' }}
            >
              Criar conta
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{ background: 'var(--bg)' }}
    >
      <Suspense fallback={
        <div className="w-full max-w-sm rounded-3xl p-10 text-center" style={{ background: 'var(--surface)' }}>
          <Loader2 size={32} className="animate-spin mx-auto" style={{ color: 'var(--primary)' }} />
          <p className="text-sm mt-4" style={{ color: 'var(--text-3)' }}>Carregando...</p>
        </div>
      }>
        <LoginContent />
      </Suspense>
    </div>
  )
}
