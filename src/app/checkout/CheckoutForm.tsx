'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import type { FavoriteActivity } from '@/types/database'

interface Props {
  recordId: string
  clockIn: string
  favorites: Pick<FavoriteActivity, 'id' | 'description' | 'use_count'>[]
}

export default function CheckoutForm({ recordId, clockIn, favorites }: Props) {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  const [selected, setSelected] = useState<string[]>([])
  const [newActivity, setNewActivity] = useState('')
  const [saveAsFavorite, setSaveAsFavorite] = useState(false)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleFavorite = (desc: string) => {
    setSelected((prev) =>
      prev.includes(desc) ? prev.filter((d) => d !== desc) : [...prev, desc],
    )
  }

  const addNewActivity = () => {
    const trimmed = newActivity.trim()
    if (!trimmed || trimmed.length < 3) return
    if (!selected.includes(trimmed)) setSelected((prev) => [...prev, trimmed])
    setNewActivity('')
  }

  const handleSubmit = async () => {
    if (selected.length === 0) {
      setError('Informe ao menos uma atividade realizada.')
      return
    }
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const clockOut = new Date().toISOString()

    // 1. Registrar saída
    const { error: clockOutError } = await supabase
      .from('time_records')
      .update({ clock_out: clockOut, notes: notes.trim() || null })
      .eq('id', recordId)

    if (clockOutError) {
      setError('Erro ao registrar saída. Tente novamente.')
      setLoading(false)
      return
    }

    // 2. Inserir atividades
    const activitiesToInsert = selected.map((desc) => ({
      time_record_id: recordId,
      description: desc,
      is_favorite: saveAsFavorite && newActivity.trim() === desc,
    }))

    await supabase.from('activities').insert(activitiesToInsert)

    // 3. Salvar/incrementar favoritas
    if (saveAsFavorite && newActivity.trim()) {
      const desc = newActivity.trim()
      const existing = favorites.find((f) => f.description === desc)
      if (existing) {
        await supabase
          .from('favorite_activities')
          .update({ use_count: existing.use_count + 1 })
          .eq('id', existing.id)
      } else {
        await supabase.from('favorite_activities').insert({
          intern_id: user.id,
          description: desc,
          use_count: 1,
        })
      }
    }

    // Incrementar contagem das favoritas usadas
    for (const desc of selected) {
      const fav = favorites.find((f) => f.description === desc)
      if (fav) {
        await supabase
          .from('favorite_activities')
          .update({ use_count: fav.use_count + 1 })
          .eq('id', fav.id)
      }
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="space-y-5">
      {/* Atividades favoritas */}
      {favorites.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h2 className="font-semibold text-gray-800 mb-3">Atividades frequentes</h2>
          <div className="flex flex-wrap gap-2">
            {favorites.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => toggleFavorite(f.description)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  selected.includes(f.description)
                    ? 'bg-blue-900 text-white border-blue-900'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
                }`}
              >
                {f.description}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Nova atividade */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <h2 className="font-semibold text-gray-800 mb-3">Adicionar atividade</h2>
        <div className="flex gap-2">
          <input
            value={newActivity}
            onChange={(e) => setNewActivity(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addNewActivity()}
            placeholder="Descreva a atividade..."
            maxLength={200}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={addNewActivity}
            disabled={!newActivity.trim()}
            className="px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-40"
          >
            Adicionar
          </button>
        </div>
        <label className="flex items-center gap-2 mt-2 text-sm text-gray-500 cursor-pointer">
          <input
            type="checkbox"
            checked={saveAsFavorite}
            onChange={(e) => setSaveAsFavorite(e.target.checked)}
            className="rounded"
          />
          Salvar como favorita
        </label>
      </div>

      {/* Atividades selecionadas */}
      {selected.length > 0 && (
        <div className="bg-blue-50 rounded-xl border border-blue-100 p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            Atividades do turno ({selected.length})
          </h3>
          <ul className="space-y-1">
            {selected.map((desc, i) => (
              <li key={i} className="flex items-start justify-between gap-2 text-sm">
                <span className="text-blue-800">• {desc}</span>
                <button
                  type="button"
                  onClick={() => setSelected((prev) => prev.filter((_, j) => j !== i))}
                  className="text-red-400 hover:text-red-600 shrink-0 text-xs"
                >
                  remover
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Observações */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Observações (opcional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Alguma observação sobre o turno..."
          maxLength={500}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      {error && (
        <p className="text-red-600 text-sm text-center">{error}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading || selected.length === 0}
        className="w-full py-4 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Registrando...' : 'Confirmar Saída'}
      </button>
    </div>
  )
}
