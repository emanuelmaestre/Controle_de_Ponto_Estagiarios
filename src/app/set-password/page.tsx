'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Lock, Eye, EyeOff, AlertCircle, Loader2, CheckCircle2, ShieldCheck } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import ThemeToggle from '@/components/ThemeToggle'

/* ── Success overlay ─────────────────────────────────────── */
function SuccessOverlay() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center rounded-3xl"
      style={{ background: 'var(--nav-bg)' }}
    >
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="absolute rounded-full border-2"
          style={{ borderColor: 'var(--primary-light)', opacity: 0 }}
          animate={{ scale: [0.6, 2.2], opacity: [0.6, 0] }}
          transition={{ duration: 1.4, delay: i * 0.25, repeat: Infinity, ease: 'easeOut' }}
        />
      ))}
      <motion.div
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
        className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
        style={{ background: 'rgba(255,255,255,0.08)' }}
      >
        <CheckCircle2 size={44} style={{ color: 'var(--primary-light)' }} strokeWidth={1.5} />
      </motion.div>
      <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        className="font-bold text-lg text-white">SENHA DEFINIDA!</motion.p>
      <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="text-sm mt-1" style={{ color: 'var(--nav-muted)' }}>REDIRECIONANDO...</motion.p>
      <motion.div
        className="absolute bottom-0 left-0 h-1 rounded-b-3xl"
        style={{ background: 'var(--primary-light)' }}
        initial={{ width: '0%' }}
        animate={{ width: '100%' }}
        transition={{ duration: 1.8, ease: 'linear', delay: 0.2 }}
      />
    </motion.div>
  )
}

/* ── Password strength indicator ─────────────────────────── */
function StrengthBar({ password }: { password: string }) {
  const checks = [
    password.length >= 6,
    password.length >= 10,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^a-zA-Z0-9]/.test(password),
  ]
  const score = checks.filter(Boolean).length
  const colors = ['var(--danger)', 'var(--warning)', 'var(--warning)', 'var(--success)', 'var(--success)']
  const labels = ['', 'FRACA', 'REGULAR', 'BOA', 'FORTE', 'EXCELENTE']

  if (!password) return null
  return (
    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mt-1.5">
      <div className="flex gap-1 mb-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <motion.div
            key={i}
            className="h-1 flex-1 rounded-full"
            animate={{ background: i < score ? colors[score - 1] : 'var(--border)' }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>
      <p className="text-[10px] font-bold" style={{ color: score > 0 ? colors[score - 1] : 'var(--text-3)' }}>
        {labels[score]}
      </p>
    </motion.div>
  )
}

/* ── Main content ───────────────────────────────────────── */
function SetPasswordContent() {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/login')
      } else {
        setReady(true)
      }
    })
  }, []) // eslint-disable-line

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password.length < 6) { setError('A senha deve ter no mínimo 6 caracteres.'); return }
    if (password !== confirm) { setError('As senhas não coincidem.'); return }

    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) { setError('Erro ao definir senha. Tente novamente.'); setLoading(false); return }

    setSuccess(true)
    setTimeout(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
        router.push(profile?.role === 'manager' ? '/admin' : '/dashboard')
      } else {
        router.push('/login')
      }
    }, 2000)
  }

  const passwordsMatch = confirm.length > 0 && password === confirm && password.length >= 6

  if (!ready) {
    return (
      <div className="flex items-center justify-center" style={{ height: '100dvh', background: 'var(--bg)' }}>
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary)' }} />
      </div>
    )
  }

  return (
    <div
      className="flex items-center justify-center p-4 relative"
      style={{ height: '100dvh', overflow: 'hidden', background: 'var(--bg)' }}
    >
      {/* Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full blur-3xl opacity-30" style={{ background: 'var(--primary)' }} />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full blur-3xl opacity-20" style={{ background: 'var(--accent)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-3xl opacity-10" style={{ background: 'var(--primary-light)' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative rounded-3xl overflow-hidden shadow-2xl w-full max-w-sm"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        {/* Success overlay */}
        <AnimatePresence>
          {success && <SuccessOverlay />}
        </AnimatePresence>

        {/* Header */}
        <div
          className="px-8 pt-8 pb-7 text-center relative overflow-hidden"
          style={{ background: 'var(--nav-bg)' }}
        >
          <div className="absolute top-3 right-3">
            <ThemeToggle compact />
          </div>
          <div className="absolute inset-0 opacity-5 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />

          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.5, delay: 0.15, type: 'spring', stiffness: 220 }}
            className="float-anim mx-auto mb-4"
            style={{ width: 200, height: 56 }}
          >
            <Image src="/logo.svg" alt="ChronosLab" width={200} height={56} className="object-contain" />
          </motion.div>

          {/* Shield icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 220, delay: 0.3 }}
            className="mx-auto mb-2 w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.10)' }}
          >
            <ShieldCheck size={24} style={{ color: 'var(--primary-light)' }} strokeWidth={1.5} />
          </motion.div>

          <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="text-sm" style={{ color: 'var(--nav-muted)' }}>
            DEFINIR NOVA SENHA
          </motion.p>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              className="mx-5 p-3 rounded-2xl flex items-start gap-2 text-xs overflow-hidden"
              style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)', color: 'var(--danger)' }}
            >
              <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
              <span className="font-medium">{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 pt-5 pb-6 space-y-3">
          {/* Nova senha */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-3)' }}>
              Nova senha
            </label>
            <div className="relative">
              <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
                required
                className="w-full pl-9 pr-10 py-3 rounded-xl text-sm outline-none transition-all"
                style={{ background: 'var(--input-bg)', border: '1.5px solid var(--border)', color: 'var(--text)' }}
                onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              />
              <button type="button" onClick={() => setShowPassword(v => !v)} tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-80"
                style={{ color: 'var(--text-3)' }}>
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <StrengthBar password={password} />
          </div>

          {/* Confirmar */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-3)' }}>
              Confirmar senha
            </label>
            <div className="relative">
              <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Repita a senha"
                autoComplete="new-password"
                required
                className="w-full pl-9 pr-10 py-3 rounded-xl text-sm outline-none transition-all"
                style={{ background: 'var(--input-bg)', border: `1.5px solid ${confirm && !passwordsMatch ? 'var(--danger)' : 'var(--border)'}`, color: 'var(--text)' }}
                onFocus={e => (e.target.style.borderColor = passwordsMatch ? 'var(--success)' : 'var(--primary)')}
                onBlur={e => (e.target.style.borderColor = confirm && !passwordsMatch ? 'var(--danger)' : 'var(--border)')}
              />
              <button type="button" onClick={() => setShowConfirm(v => !v)} tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-80"
                style={{ color: 'var(--text-3)' }}>
                {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <AnimatePresence>
              {confirm && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="text-xs mt-1 flex items-center gap-1 font-medium"
                  style={{ color: passwordsMatch ? 'var(--success)' : 'var(--danger)' }}
                >
                  {passwordsMatch
                    ? <><CheckCircle2 size={11} /> Senhas coincidem</>
                    : <><AlertCircle size={11} /> As senhas não coincidem</>
                  }
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <motion.button
            type="submit"
            disabled={loading || password.length < 6 || password !== confirm}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.97 }}
            className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 mt-1"
            style={{
              background: 'var(--primary)',
              color: 'var(--primary-fg)',
              boxShadow: '0 4px 18px rgba(30,92,45,0.45)',
              opacity: (loading || password.length < 6 || password !== confirm) ? 0.5 : 1,
            }}
          >
            {loading
              ? <><Loader2 size={15} className="animate-spin" /> Salvando...</>
              : <><ShieldCheck size={15} /> CRIAR SENHA E ENTRAR</>
            }
          </motion.button>

          <p className="text-center text-xs mt-2">
            <Link href="/login" className="font-semibold transition-opacity hover:opacity-70"
              style={{ color: 'var(--text-3)' }}>
              Voltar para o login
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  )
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center" style={{ height: '100dvh', background: 'var(--bg)' }}>
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary)' }} />
      </div>
    }>
      <SetPasswordContent />
    </Suspense>
  )
}
