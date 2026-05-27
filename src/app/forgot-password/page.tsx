'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, ArrowLeft, Loader2, AlertCircle, Send, CheckCircle2 } from 'lucide-react'
import Image from 'next/image'
import ThemeToggle from '@/components/ThemeToggle'

/* ── Success State ─────────────────────────────────────── */
function SuccessState({ email }: { email: string }) {
  return (
    <motion.div
      key="success"
      initial={{ opacity: 0, scale: 0.92, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center text-center py-4"
    >
      {/* Envelope animation */}
      <div className="relative mb-6">
        {/* Ripple rings */}
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full border-2"
            style={{ borderColor: 'var(--primary-light)', margin: -4 - i * 12 }}
            animate={{ scale: [1, 1.5 + i * 0.2], opacity: [0.5, 0] }}
            transition={{ duration: 1.6, delay: i * 0.3, repeat: Infinity, ease: 'easeOut' }}
          />
        ))}
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 240, damping: 16, delay: 0.1 }}
          className="w-20 h-20 rounded-2xl flex items-center justify-center relative z-10"
          style={{ background: 'rgba(30,92,45,0.12)', border: '1.5px solid var(--primary-light)' }}
        >
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Send size={36} style={{ color: 'var(--primary-light)' }} strokeWidth={1.5} />
          </motion.div>
        </motion.div>
      </div>

      <motion.h2
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="font-bold text-xl mb-2"
        style={{ color: 'var(--text)' }}
      >
        E-MAIL ENVIADO!
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="text-sm leading-relaxed mb-1"
        style={{ color: 'var(--text-2)' }}
      >
        ENVIAMOS UM LINK DE RECUPERAÇÃO PARA:
      </motion.p>

      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="text-sm font-bold mb-5 preserve-case"
        style={{ color: 'var(--primary-light)' }}
      >
        {email}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65 }}
        className="w-full p-3.5 rounded-2xl text-xs text-left mb-5"
        style={{ background: 'rgba(30,92,45,0.07)', border: '1px solid var(--border)', color: 'var(--text-2)' }}
      >
        <p className="flex items-start gap-2">
          <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--primary)' }} />
          VERIFIQUE SUA CAIXA DE ENTRADA E A PASTA DE SPAM. O LINK EXPIRA EM 1 HORA.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.75 }}
      >
        <Link
          href="/login"
          className="flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-70"
          style={{ color: 'var(--primary)' }}
        >
          <ArrowLeft size={14} /> VOLTAR PARA O LOGIN
        </Link>
      </motion.div>
    </motion.div>
  )
}

/* ── Main Page ─────────────────────────────────────────── */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'Erro ao enviar e-mail.')
      } else {
        setSent(true)
      }
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="flex items-center justify-center p-4 relative"
      style={{ height: '100dvh', overflow: 'hidden', background: 'var(--bg)' }}
    >
      {/* Orbs */}
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
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative rounded-3xl overflow-hidden shadow-2xl w-full max-w-sm"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div
          className="px-8 pt-8 pb-7 text-center relative overflow-hidden"
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
            className="float-anim mx-auto mb-4"
            style={{ width: 200, height: 56 }}
          >
            <Image src="/logo.svg" alt="ChronosLab" width={200} height={56} className="object-contain" />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-sm"
            style={{ color: 'var(--nav-muted)' }}
          >
            RECUPERAÇÃO DE SENHA
          </motion.p>
        </div>

        {/* Body */}
        <div className="px-5 pt-5 pb-6">
          <AnimatePresence mode="wait">
            {sent ? (
              <SuccessState key="success" email={email} />
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-xs mb-5 leading-relaxed" style={{ color: 'var(--text-2)' }}>
                  INFORME SEU E-MAIL E ENVIAREMOS UM LINK PARA REDEFINIR SUA SENHA.
                </p>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginBottom: 12 }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                      className="p-3 rounded-2xl flex items-start gap-2 text-xs overflow-hidden"
                      style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)', color: 'var(--danger)' }}
                    >
                      <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
                      <span className="font-medium">{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-3)' }}>
                      E-mail
                    </label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="seu@email.com"
                        required
                        autoComplete="email"
                        className="w-full pl-9 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
                        style={{
                          background: 'var(--input-bg)',
                          border: '1.5px solid var(--border)',
                          color: 'var(--text)',
                        }}
                        onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
                        onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                      />
                    </div>
                  </div>

                  <motion.button
                    type="submit"
                    disabled={loading || !email.trim()}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 mt-1"
                    style={{
                      background: 'var(--primary)',
                      color: 'var(--primary-fg)',
                      boxShadow: '0 4px 18px rgba(30,92,45,0.45)',
                      opacity: (loading || !email.trim()) ? 0.6 : 1,
                    }}
                  >
                    {loading ? (
                      <><Loader2 size={15} className="animate-spin" /> Enviando...</>
                    ) : (
                      <><Send size={14} /> ENVIAR LINK</>
                    )}
                  </motion.button>
                </form>

                <p className="text-center text-xs mt-4">
                  <Link href="/login" className="flex items-center justify-center gap-1 font-semibold transition-opacity hover:opacity-70"
                    style={{ color: 'var(--text-3)' }}>
                    <ArrowLeft size={12} /> VOLTAR PARA O LOGIN
                  </Link>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
