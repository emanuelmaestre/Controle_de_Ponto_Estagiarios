'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '', course: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (form.password.length < 6) { setError('Senha deve ter no minimo 6 caracteres.'); return }
    if (form.password !== form.confirmPassword) { setError('Senhas nao coincidem.'); return }

    setLoading(true)

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        course: form.course || undefined,
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) { setError(data.error || 'Erro ao cadastrar.'); return }

    setSuccess(true)
    setTimeout(() => router.push('/v2/login'), 2000)
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
        <div className="text-center">
          <div className="text-5xl mb-4">✓</div>
          <h2 className="text-xl font-bold text-white">Cadastro realizado!</h2>
          <p className="text-gray-400 mt-2">Redirecionando para login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      <div className="w-full max-w-sm bg-gray-900 rounded-2xl p-8 border border-gray-800">
        <h1 className="text-2xl font-bold text-white text-center mb-2">Criar Conta</h1>
        <p className="text-gray-400 text-center text-sm mb-8">ChronosLab</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Nome completo</label>
            <input
              type="text"
              value={form.fullName}
              onChange={e => update('fullName', e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
              placeholder="Seu nome completo"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => update('email', e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Curso (opcional)</label>
            <input
              type="text"
              value={form.course}
              onChange={e => update('course', e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
              placeholder="Ex: Ciencia da Computacao"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Senha</label>
            <input
              type="password"
              value={form.password}
              onChange={e => update('password', e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
              placeholder="Minimo 6 caracteres"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Confirmar senha</label>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={e => update('confirmPassword', e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
              placeholder="Repita a senha"
            />
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
          >
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Ja tem conta? <a href="/v2/login" className="text-green-400 hover:underline">Entrar</a>
        </p>
      </div>
    </div>
  )
}
