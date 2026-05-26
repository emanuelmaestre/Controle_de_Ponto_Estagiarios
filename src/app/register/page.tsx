'use client'

import { useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

function RegisterContent() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const [form, setForm] = useState({
    full_name: '',
    nickname: '',
    email: '',
    course: '',
    password: '',
    confirm: '',
  })

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!form.full_name.trim() || !form.email.trim() || !form.password) {
      setError('Preencha todos os campos obrigatórios.')
      return
    }
    if (form.password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.')
      return
    }
    if (form.password !== form.confirm) {
      setError('As senhas não coincidem.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: form.full_name.trim(),
          nickname: form.nickname.trim() || null,
          email: form.email.trim().toLowerCase(),
          course: form.course.trim() || null,
          password: form.password,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'Erro ao criar conta.')
        return
      }
      setSuccess(true)
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="w-full max-w-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative glass rounded-3xl overflow-hidden shadow-2xl border border-white/30"
        >
          <div className="bg-gradient-to-br from-emerald-900/90 to-emerald-700/90 px-8 py-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-[72px] h-[72px] bg-white/20 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            >
              <span className="text-4xl">✅</span>
            </motion.div>
            <h1 className="text-white font-bold text-xl">Cadastro realizado!</h1>
            <p className="text-emerald-200 text-sm mt-2">
              Sua conta foi criada com sucesso. Já pode acessar o sistema!
            </p>
          </div>
          <div className="px-8 py-7 text-center space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
              <p className="text-emerald-700 text-sm font-medium">
                🎉 Faça login para configurar seu PIN e começar a usar o sistema.
              </p>
            </div>
            <Link
              href="/login"
              className="block w-full py-3 bg-gradient-to-r from-blue-800 to-blue-600 text-white font-bold rounded-xl text-center text-sm"
            >
              Fazer login →
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full blur-3xl opacity-30" style={{ background: 'var(--primary)' }} />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full blur-3xl opacity-20" style={{ background: 'var(--accent)' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div className="px-8 py-6 text-center" style={{ background: 'var(--nav-bg)' }}>
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.5, delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-[60px] h-[60px] bg-white/20 rounded-2xl mx-auto mb-3 flex items-center justify-center float-anim"
          >
            <span className="text-3xl">👤</span>
          </motion.div>
          <h1 className="text-white font-bold text-lg">Criar conta</h1>
          <p className="text-blue-200 text-sm mt-1">Cadastro de estagiário</p>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2"
            >
              <span>⚠️</span>
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-3">
          {/* Nome completo */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">Nome completo *</label>
            <input
              type="text"
              value={form.full_name}
              onChange={e => handleChange('full_name', e.target.value)}
              placeholder="Ex: Miltão Rei da Galáxia"
              required
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 transition-all"
            />
          </div>

          {/* Apelido */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">Apelido</label>
            <input
              type="text"
              value={form.nickname}
              onChange={e => handleChange('nickname', e.target.value)}
              placeholder="Ex: Miltinho"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 transition-all"
            />
          </div>

          {/* E-mail */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">E-mail *</label>
            <input
              type="email"
              value={form.email}
              onChange={e => handleChange('email', e.target.value)}
              placeholder="Ex: milton@exemplo.com"
              required
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 transition-all"
            />
          </div>

          {/* Curso */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">Curso</label>
            <input
              type="text"
              value={form.course}
              onChange={e => handleChange('course', e.target.value)}
              placeholder="Ex: Agronomia"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 transition-all"
            />
          </div>

          {/* Senha */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">Senha *</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={e => handleChange('password', e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                className="w-full px-4 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 transition-all"
              />
              <button type="button" onClick={() => setShowPassword(v => !v)} tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
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
          </div>

          {/* Confirmar senha */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">Confirmar senha *</label>
            <input
              type="password"
              value={form.confirm}
              onChange={e => handleChange('confirm', e.target.value)}
              placeholder="Repita a senha"
              required
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 transition-all"
            />
            {form.confirm && form.password !== form.confirm && (
              <p className="text-red-500 text-xs mt-1">As senhas não coincidem</p>
            )}
            {form.confirm && form.password === form.confirm && form.confirm.length >= 6 && (
              <p className="text-green-500 text-xs mt-1">✓ Senhas coincidem</p>
            )}
          </div>

          <motion.button
            type="submit"
            disabled={loading || form.password.length < 6 || form.password !== form.confirm}
            whileTap={{ scale: 0.97 }}
            className="w-full py-3 bg-gradient-to-r from-blue-800 to-blue-600 hover:from-blue-700 hover:to-blue-500 text-white font-bold rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1"
          >
            {loading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                />
                Criando conta...
              </>
            ) : '✓ Criar minha conta'}
          </motion.button>

          <p className="text-center text-xs text-slate-400 mt-3">
            Já tem conta?{' '}
            <Link href="/login" className="text-blue-600 hover:text-blue-800 font-semibold">
              Fazer login
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <div className="flex items-center justify-center p-4 relative" style={{ height: '100dvh', overflow: 'hidden', background: 'var(--bg)' }}>
      <Suspense fallback={
        <div className="w-full max-w-sm rounded-3xl shadow-2xl p-10 text-center" style={{ background: 'var(--surface)' }}>
          <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
        </div>
      }>
        <RegisterContent />
      </Suspense>
    </div>
  )
}
