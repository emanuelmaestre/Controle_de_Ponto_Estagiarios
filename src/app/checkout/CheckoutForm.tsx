'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Check, ClipboardList, Loader2, AlertTriangle, LogOut, Pencil } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { correctPortuguese } from '@/lib/ptCorrector'
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
  const [editingDesc, setEditingDesc] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const toggleFavorite = (desc: string) => {
    setSelected((prev) =>
      prev.includes(desc) ? prev.filter((d) => d !== desc) : [...prev, desc],
    )
  }

  const toUpper = (v: string) => v.toUpperCase()

  const addNewActivity = () => {
    const trimmed = correctPortuguese(newActivity.trim().toUpperCase())
    if (!trimmed || trimmed.length < 3) return
    if (!selected.includes(trimmed)) setSelected((prev) => [...prev, trimmed])
    setNewActivity('')
  }

  const startEdit = (desc: string) => {
    setEditingDesc(desc)
    setEditValue(desc)
  }

  const confirmEdit = () => {
    if (!editingDesc) return
    const trimmed = correctPortuguese(editValue.trim().toUpperCase())
    if (trimmed.length >= 3) {
      setSelected(prev => prev.map(d => d === editingDesc ? trimmed : d))
    }
    setEditingDesc(null)
    setEditValue('')
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

  const cardStyle = {
    background: 'var(--surface-card, #0f2318)',
    border: '1px solid rgba(0,200,83,0.15)',
    boxShadow: 'var(--card-shadow-md)',
  }

  const canSubmit = selected.length > 0 && !loading

  return (
    <div className="space-y-4">
      {/* Atividades favoritas */}
      {favorites.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-2xl p-4"
          style={cardStyle}
        >
          <h2 className="font-bold text-sm mb-3" style={{ color: 'var(--text)' }}>
            Atividades frequentes
          </h2>
          <div className="flex flex-wrap gap-2">
            {favorites.map((f) => {
              const active = selected.includes(f.description)
              return (
                <motion.button
                  key={f.id}
                  type="button"
                  onClick={() => toggleFavorite(f.description)}
                  whileTap={{ scale: 0.94 }}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
                  style={{
                    background: active ? 'rgba(0,200,83,0.18)' : 'rgba(0,0,0,0.2)',
                    color: active ? 'var(--primary)' : 'var(--text-2)',
                    border: `1px solid ${active ? 'rgba(0,200,83,0.4)' : 'rgba(0,200,83,0.12)'}`,
                  }}
                >
                  {f.description}
                </motion.button>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Nova atividade */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="rounded-2xl p-4"
        style={cardStyle}
      >
        <h2 className="font-bold text-sm mb-3" style={{ color: 'var(--text)' }}>
          Adicionar atividade
        </h2>
        <div className="flex gap-2">
          <input
            value={newActivity}
            onChange={(e) => setNewActivity(toUpper(e.target.value))}
            onKeyDown={(e) => e.key === 'Enter' && addNewActivity()}
            placeholder="DESCREVA A ATIVIDADE..."
            maxLength={200}
            className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none transition-colors"
            style={{
              background: 'rgba(0,0,0,0.25)',
              border: '1px solid rgba(0,200,83,0.15)',
              color: 'var(--text)',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--primary)')}
            onBlur={(e) => (e.target.style.borderColor = 'rgba(0,200,83,0.15)')}
          />
          <motion.button
            type="button"
            onClick={addNewActivity}
            disabled={newActivity.trim().length < 3}
            whileTap={{ scale: 0.94 }}
            className="px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-1.5 disabled:opacity-40 transition-opacity"
            style={{ background: '#00c853', color: '#003912' }}
          >
            <Plus size={16} />
            Adicionar
          </motion.button>
        </div>
        <label className="flex items-center gap-2 mt-3 text-xs cursor-pointer" style={{ color: 'var(--text-3)' }}>
          <input
            type="checkbox"
            checked={saveAsFavorite}
            onChange={(e) => setSaveAsFavorite(e.target.checked)}
            className="rounded accent-[#00c853]"
          />
          Salvar como favorita
        </label>
      </motion.div>

      {/* Atividades selecionadas */}
      <AnimatePresence>
        {selected.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="rounded-2xl p-4 overflow-hidden"
            style={{ background: 'rgba(0,200,83,0.06)', border: '1px solid rgba(0,200,83,0.2)' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <ClipboardList size={15} style={{ color: 'var(--primary)' }} />
              <h3 className="text-xs font-bold" style={{ color: 'var(--primary)' }}>
                Atividades do turno ({selected.length})
              </h3>
            </div>
            <ul className="space-y-2">
              <AnimatePresence>
                {selected.map((desc) => (
                  <motion.li
                    key={desc}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col gap-1.5"
                  >
                    {editingDesc === desc ? (
                      /* ── Modo edição ── */
                      <motion.div
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex gap-2"
                      >
                        <input
                          autoFocus
                          value={editValue}
                          onChange={e => setEditValue(toUpper(e.target.value))}
                          onKeyDown={e => {
                            if (e.key === 'Enter') confirmEdit()
                            if (e.key === 'Escape') { setEditingDesc(null); setEditValue('') }
                          }}
                          maxLength={200}
                          className="flex-1 px-3 py-1.5 rounded-xl text-sm outline-none"
                          style={{
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid rgba(0,200,83,0.5)',
                            color: 'var(--text)',
                          }}
                        />
                        <button type="button" onClick={confirmEdit}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold"
                          style={{ background: '#00c853', color: '#003912' }}>
                          <Check size={14} />
                        </button>
                        <button type="button" onClick={() => { setEditingDesc(null); setEditValue('') }}
                          className="px-2 py-1.5 rounded-xl text-xs"
                          style={{ background: 'rgba(255,82,82,0.12)', color: '#ff5252', border: '1px solid rgba(255,82,82,0.25)' }}>
                          <X size={14} />
                        </button>
                      </motion.div>
                    ) : (
                      /* ── Modo visualização ── */
                      <div className="flex items-start justify-between gap-2 text-sm">
                        <span className="flex items-start gap-2 font-medium uppercase" style={{ color: 'var(--text)' }}>
                          <Check size={15} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--primary)' }} />
                          {desc}
                        </span>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => startEdit(desc)}
                            className="p-1 rounded-md transition-colors hover:bg-white/5"
                            style={{ color: '#3fe56c' }}
                            aria-label={`Editar ${desc}`}
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelected((prev) => prev.filter((d) => d !== desc))}
                            className="p-1 rounded-md transition-colors hover:bg-white/5"
                            style={{ color: 'var(--text-3)' }}
                            aria-label={`Remover ${desc}`}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Observações */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-2)' }}>
          Observações (opcional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(toUpper(e.target.value))}
          placeholder="ALGUMA OBSERVAÇÃO SOBRE O TURNO..."
          maxLength={500}
          rows={2}
          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none transition-colors"
          style={{
            background: 'rgba(0,0,0,0.25)',
            border: '1px solid rgba(0,200,83,0.15)',
            color: 'var(--text)',
          }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--primary)')}
          onBlur={(e) => (e.target.style.borderColor = 'rgba(0,200,83,0.15)')}
        />
      </motion.div>

      {/* Erro */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
            style={{ background: 'rgba(255,82,82,0.08)', border: '1px solid rgba(255,82,82,0.25)' }}
          >
            <AlertTriangle size={16} style={{ color: 'var(--danger)' }} />
            <span style={{ color: 'var(--danger)' }}>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botão confirmar */}
      <motion.button
        onClick={handleSubmit}
        disabled={!canSubmit}
        whileHover={canSubmit ? { scale: 1.01, y: -1 } : {}}
        whileTap={canSubmit ? { scale: 0.97 } : {}}
        animate={{
          boxShadow: canSubmit
            ? '0 8px 24px rgba(0,200,83,0.35)'
            : '0 4px 12px rgba(0,0,0,0.3)',
        }}
        className="w-full py-4 rounded-2xl text-base font-bold flex items-center justify-center gap-2 transition-colors disabled:cursor-not-allowed"
        style={{
          background: canSubmit ? '#00c853' : 'var(--surface-variant)',
          color: canSubmit ? '#003912' : 'var(--text-3)',
        }}
      >
        {loading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Registrando...
          </>
        ) : (
          <>
            <LogOut size={18} />
            Confirmar Saída
          </>
        )}
      </motion.button>
    </div>
  )
}
