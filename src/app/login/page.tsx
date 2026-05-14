'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { loginSchema, type LoginInput } from '@/lib/validations'

// ──────────────────────────────────────────────────────────
// Componente: teclado de PIN
// ──────────────────────────────────────────────────────────
function PinPad({ pin, onDigit, onDelete }: {
  pin: string
  onDigit: (d: string) => void
  onDelete: () => void
}) {
  const keys = ['1','2','3','4','5','6','7','8','9','','0','⌫']
  return (
    <div className="space-y-3">
      {/* Pontos do PIN */}
      <div className="flex justify-center gap-3 py-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full border-2 transition-colors ${
              i < pin.length
                ? 'bg-blue-900 border-blue-900'
                : 'border-gray-300 bg-white'
            }`}
          />
        ))}
      </div>
      {/* Grade de dígitos */}
      <div className="grid grid-cols-3 gap-2">
        {keys.map((k, i) => (
          <button
            key={i}
            type="button"
            disabled={k === '' || pin.length >= 6}
            onClick={() => k === '⌫' ? onDelete() : k !== '' && onDigit(k)}
            className={`
              h-14 rounded-xl text-xl font-semibold transition-all
              ${k === '' ? 'invisible' : ''}
              ${k === '⌫'
                ? 'bg-gray-100 text-red-500 hover:bg-red-50 active:scale-95'
                : 'bg-gray-50 hover:bg-blue-50 active:scale-95 active:bg-blue-100 text-gray-800 shadow-sm'}
              disabled:opacity-40 disabled:cursor-not-allowed
            `}
          >
            {k}
          </button>
        ))}
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────
// Página de Login
// ──────────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || ''
  const errorParam = searchParams.get('error')

  const [mode, setMode] = useState<'email' | 'pin'>('email')
  const [pin, setPin] = useState('')
  const [pinEmail, setPinEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(
    errorParam === 'conta-inativa' ? 'Conta desativada. Contate o chefe do laboratório.' : null
  )

  const supabase = createSupabaseBrowserClient()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) })

  // Login por e-mail + senha
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
    router.push(redirect || '/dashboard')
    router.refresh()
  }

  // Login por PIN
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
      router.push(redirect || '/dashboard')
      router.refresh()
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-blue-900 px-6 py-8 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl mx-auto mb-3 flex items-center justify-center">
            <span className="text-3xl">🔬</span>
          </div>
          <h1 className="text-white font-bold text-xl">Controle de Ponto</h1>
          <p className="text-blue-200 text-sm mt-1">Laboratório</p>
        </div>

        {/* Alerta de erro */}
        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-100 mx-4 mt-4">
          {(['email', 'pin'] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(null); setPin('') }}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                mode === m
                  ? 'text-blue-900 border-b-2 border-blue-900'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {m === 'email' ? 'E-mail + Senha' : 'PIN'}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* ── Modo e-mail + senha ── */}
          {mode === 'email' && (
            <form onSubmit={handleSubmit(onSubmitEmail)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-mail
                </label>
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  placeholder="seu@email.com"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Senha
                </label>
                <input
                  {...register('password')}
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-blue-900 hover:bg-blue-800 text-white font-semibold rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
          )}

          {/* ── Modo PIN ── */}
          {mode === 'pin' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  value={pinEmail}
                  onChange={(e) => setPinEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <PinPad
                pin={pin}
                onDigit={(d) => setPin((p) => (p.length < 6 ? p + d : p))}
                onDelete={() => setPin((p) => p.slice(0, -1))}
              />
              <button
                onClick={handlePinSubmit}
                disabled={pin.length < 4 || !pinEmail || loading}
                className="w-full py-3 bg-blue-900 hover:bg-blue-800 text-white font-semibold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? 'Verificando...' : 'Entrar com PIN'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
