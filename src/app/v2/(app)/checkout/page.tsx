'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function CheckoutPage() {
  const searchParams = useSearchParams()
  const recordId = searchParams.get('record')
  const router = useRouter()

  const [activities, setActivities] = useState<string[]>([])
  const [newActivity, setNewActivity] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function addActivity() {
    const trimmed = newActivity.trim()
    if (trimmed.length < 3) return
    if (activities.includes(trimmed)) return
    setActivities(prev => [...prev, trimmed])
    setNewActivity('')
  }

  function removeActivity(index: number) {
    setActivities(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit() {
    if (activities.length === 0) { setError('Adicione pelo menos uma atividade.'); return }
    setLoading(true)
    setError('')

    const res = await fetch('/api/clock/out', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recordId, activities, notes: notes || undefined }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) { setError(data.error); return }
    router.push('/v2/dashboard')
  }

  if (!recordId) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-red-400">Registro nao encontrado.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <h1 className="text-xl font-bold mb-6">Registrar Saida</h1>

      {/* Add Activity */}
      <div className="mb-6">
        <label className="block text-sm text-gray-400 mb-2">O que voce fez hoje?</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={newActivity}
            onChange={e => setNewActivity(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addActivity()}
            className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
            placeholder="Descreva a atividade..."
          />
          <button
            onClick={addActivity}
            className="px-4 py-3 bg-green-600 hover:bg-green-500 rounded-xl text-white font-medium transition-colors"
          >
            +
          </button>
        </div>
      </div>

      {/* Activity List */}
      {activities.length > 0 && (
        <div className="mb-6 space-y-2">
          {activities.map((act, i) => (
            <div key={i} className="flex items-center justify-between bg-gray-900 rounded-xl px-4 py-3 border border-gray-800">
              <span className="text-sm text-gray-300">{act}</span>
              <button onClick={() => removeActivity(i)} className="text-red-400 text-sm hover:text-red-300">
                Remover
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Notes */}
      <div className="mb-6">
        <label className="block text-sm text-gray-400 mb-2">Observacoes (opcional)</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-green-500 resize-none"
          placeholder="Alguma observacao..."
        />
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      <div className="flex gap-3">
        <button
          onClick={() => router.back()}
          className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors"
        >
          Voltar
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading || activities.length === 0}
          className="flex-1 py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
        >
          {loading ? 'Finalizando...' : 'Finalizar'}
        </button>
      </div>
    </div>
  )
}
