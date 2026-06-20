'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, MessageSquare, Plus, Trash2, RefreshCw, CheckCircle2,
  Wrench, Megaphone, Star, Bug, Lightbulb, Heart, HelpCircle,
  ChevronDown, Send, X,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────────
type UpdateType   = 'feature' | 'fix' | 'improvement' | 'announcement'
type FeedbackCategory = 'suggestion' | 'bug' | 'praise' | 'other'
type FeedbackStatus   = 'new' | 'read' | 'implemented' | 'archived'

interface SystemUpdate {
  id: string; title: string; description: string; type: UpdateType; created_at: string
}
interface Feedback {
  id: string; category: FeedbackCategory; message: string; status: FeedbackStatus
  admin_reply: string | null; created_at: string
  profiles: { full_name: string; photo_url: string | null }
}

// ── Configs ────────────────────────────────────────────────────────────────────
const UPDATE_TYPE: Record<UpdateType, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  feature:      { label: 'Nova função',   color: '#3fe56c', bg: 'rgba(63,229,108,0.1)',   icon: <Sparkles size={12} /> },
  improvement:  { label: 'Melhoria',      color: '#22d3ee', bg: 'rgba(34,211,238,0.1)',   icon: <Star size={12} /> },
  fix:          { label: 'Correção',      color: '#f97316', bg: 'rgba(249,115,22,0.1)',   icon: <Wrench size={12} /> },
  announcement: { label: 'Aviso',         color: '#a78bfa', bg: 'rgba(167,139,250,0.1)',  icon: <Megaphone size={12} /> },
}
const FEEDBACK_CAT: Record<FeedbackCategory, { label: string; color: string; icon: React.ReactNode }> = {
  suggestion: { label: 'Sugestão', color: '#22d3ee', icon: <Lightbulb size={12} /> },
  bug:        { label: 'Problema', color: '#ff5252', icon: <Bug size={12} /> },
  praise:     { label: 'Elogio',   color: '#3fe56c', icon: <Heart size={12} /> },
  other:      { label: 'Outro',    color: '#94a3b8', icon: <HelpCircle size={12} /> },
}
const FEEDBACK_STATUS: Record<FeedbackStatus, { label: string; color: string }> = {
  new:         { label: 'Novo',         color: '#f97316' },
  read:        { label: 'Lido',         color: '#94a3b8' },
  implemented: { label: 'Implementado', color: '#3fe56c' },
  archived:    { label: 'Arquivado',    color: '#475569' },
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const d = Math.floor(diff / 86400000)
  if (d === 0) return 'Hoje'
  if (d === 1) return 'Ontem'
  if (d < 30)  return `${d} dias atrás`
  return new Date(iso).toLocaleDateString('pt-BR')
}

function avatarInitials(name: string) {
  return name.split(' ').filter(Boolean).slice(0,2).map(w => w[0].toUpperCase()).join('')
}
const COLORS = ['#3fe56c','#22d3ee','#a78bfa','#f97316','#fbbf24']
function avatarColor(name: string) { return COLORS[name.charCodeAt(0) % COLORS.length] }

// ── Add Update Modal ────────────────────────────────────────────────────────────
function AddUpdateModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [title, setTitle]       = useState('')
  const [description, setDesc]  = useState('')
  const [type, setType]         = useState<UpdateType>('feature')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const submit = async () => {
    if (!title.trim() || !description.trim()) { setError('Preencha título e descrição'); return }
    setLoading(true); setError('')
    const res = await fetch('/api/admin/system-updates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim(), description: description.trim(), type }),
    })
    setLoading(false)
    if (res.ok) { onAdded(); onClose() }
    else { const j = await res.json(); setError(j.error ?? 'Erro ao salvar') }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl p-6 flex flex-col gap-4"
        style={{ background: '#0d1f14', border: '1px solid rgba(63,229,108,0.2)' }}>
        <div className="flex items-center justify-between">
          <h3 className="font-black text-base" style={{ color: '#3fe56c' }}>Nova atualização</h3>
          <button onClick={onClose}><X size={18} style={{ color: 'rgba(255,255,255,0.4)' }} /></button>
        </div>

        {/* Tipo */}
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(UPDATE_TYPE) as UpdateType[]).map(t => {
            const cfg = UPDATE_TYPE[t]
            return (
              <button key={t} onClick={() => setType(t)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all"
                style={type === t
                  ? { background: cfg.bg, border: `1px solid ${cfg.color}`, color: cfg.color }
                  : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}>
                {cfg.icon} {cfg.label}
              </button>
            )
          })}
        </div>

        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título da novidade..."
          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)' }} />

        <textarea value={description} onChange={e => setDesc(e.target.value)} rows={3}
          placeholder="Descreva o que foi adicionado ou corrigido..."
          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)' }} />

        {error && <p className="text-xs" style={{ color: '#ff5252' }}>{error}</p>}

        <button onClick={submit} disabled={loading}
          className="w-full py-3 rounded-xl text-sm font-black transition-opacity disabled:opacity-50"
          style={{ background: '#3fe56c', color: '#000' }}>
          {loading ? 'Publicando...' : 'Publicar atualização'}
        </button>
      </motion.div>
    </div>
  )
}

// ── Feedback Card ───────────────────────────────────────────────────────────────
function FeedbackCard({ fb, onUpdate }: { fb: Feedback; onUpdate: () => void }) {
  const [open, setOpen]     = useState(false)
  const [reply, setReply]   = useState(fb.admin_reply ?? '')
  const [status, setStatus] = useState<FeedbackStatus>(fb.status)
  const [saving, setSaving] = useState(false)
  const cat = FEEDBACK_CAT[fb.category]
  const sts = FEEDBACK_STATUS[fb.status]
  const initials = avatarInitials(fb.profiles?.full_name ?? '?')
  const color    = avatarColor(fb.profiles?.full_name ?? '?')

  const save = async () => {
    setSaving(true)
    await fetch('/api/admin/feedback', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: fb.id, status, admin_reply: reply || null }),
    })
    setSaving(false); setOpen(false); onUpdate()
  }

  return (
    <motion.div layout className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <button className="w-full flex items-start gap-3 p-4 text-left" onClick={() => setOpen(o => !o)}>
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center font-black text-[11px]"
          style={{ background: `${color}22`, border: `1.5px solid ${color}55`, color }}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full"
              style={{ background: `${cat.color}18`, color: cat.color }}>
              {cat.icon} {cat.label}
            </span>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: `${sts.color}18`, color: sts.color }}>
              {sts.label}
            </span>
            <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {fb.profiles?.full_name} · {timeAgo(fb.created_at)}
            </span>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>{fb.message}</p>
        </div>
        <ChevronDown size={14} style={{ color: 'rgba(255,255,255,0.3)', transform: open ? 'rotate(180deg)' : undefined, transition: '0.2s', flexShrink: 0, marginTop: 4 }} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
            className="overflow-hidden">
            <div className="px-4 pb-4 flex flex-col gap-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <p className="text-[11px] pt-3" style={{ color: 'rgba(255,255,255,0.35)' }}>Resposta / atualização de status</p>

              {/* Status */}
              <div className="flex gap-2 flex-wrap">
                {(Object.keys(FEEDBACK_STATUS) as FeedbackStatus[]).map(s => {
                  const sc = FEEDBACK_STATUS[s]
                  return (
                    <button key={s} onClick={() => setStatus(s)}
                      className="text-[10px] font-black px-2.5 py-1 rounded-lg transition-all"
                      style={status === s
                        ? { background: `${sc.color}20`, color: sc.color, border: `1px solid ${sc.color}50` }
                        : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)', border: '1px solid transparent' }}>
                      {sc.label}
                    </button>
                  )
                })}
              </div>

              <textarea value={reply} onChange={e => setReply(e.target.value)} rows={2}
                placeholder="Escreva uma resposta para o aluno (opcional)..."
                className="w-full px-3 py-2 rounded-xl text-xs outline-none resize-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)' }} />

              <button onClick={save} disabled={saving}
                className="flex items-center gap-2 self-end px-4 py-2 rounded-xl text-xs font-black transition-opacity disabled:opacity-50"
                style={{ background: '#3fe56c', color: '#000' }}>
                <Send size={11} /> {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function AdminUpdatesPage() {
  const [tab, setTab]             = useState<'updates' | 'feedback'>('updates')
  const [updates, setUpdates]     = useState<SystemUpdate[]>([])
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [loading, setLoading]     = useState(true)
  const [showModal, setShowModal] = useState(false)

  const loadUpdates = useCallback(async () => {
    const res = await fetch('/api/admin/system-updates')
    const j   = await res.json()
    setUpdates(j.updates ?? [])
  }, [])

  const loadFeedbacks = useCallback(async () => {
    const res = await fetch('/api/admin/feedback')
    const j   = await res.json()
    setFeedbacks(j.feedbacks ?? [])
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    await Promise.all([loadUpdates(), loadFeedbacks()])
    setLoading(false)
  }, [loadUpdates, loadFeedbacks])

  useEffect(() => { load() }, [load])

  const deleteUpdate = async (id: string) => {
    await fetch('/api/admin/system-updates', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }),
    })
    loadUpdates()
  }

  const newFeedbacks = feedbacks.filter(f => f.status === 'new').length

  return (
    <div className="flex flex-col flex-1 min-h-0" style={{ background: 'var(--bg)' }}>

      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-6 h-14 sm:h-16 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(0,200,83,0.15)' }}>
        <div className="flex gap-1">
          {[
            { key: 'updates',  label: 'Novidades',  icon: <Sparkles size={14} /> },
            { key: 'feedback', label: 'Feedbacks',  icon: <MessageSquare size={14} />, badge: newFeedbacks },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all relative"
              style={tab === t.key
                ? { background: 'rgba(63,229,108,0.12)', color: '#3fe56c', border: '1px solid rgba(63,229,108,0.25)' }
                : { color: 'rgba(255,255,255,0.4)', border: '1px solid transparent' }}>
              {t.icon} {t.label}
              {t.badge ? (
                <span className="w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center"
                  style={{ background: '#f97316', color: '#000' }}>{t.badge}</span>
              ) : null}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={load} disabled={loading}
            className="p-2 rounded-lg transition-opacity disabled:opacity-40"
            style={{ color: 'rgba(255,255,255,0.35)' }}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          {tab === 'updates' && (
            <button onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black"
              style={{ background: '#3fe56c', color: '#000' }}>
              <Plus size={13} /> Publicar
            </button>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div style={{ maxWidth: 720, margin: '0 auto' }}>

          {/* ── ABA: NOVIDADES ── */}
          {tab === 'updates' && (
            <AnimatePresence mode="popLayout">
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <motion.div key={i} className="h-20 rounded-2xl"
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                      animate={{ opacity: [0.4, 0.7, 0.4] }}
                      transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.15 }} />
                  ))}
                </div>
              ) : updates.length === 0 ? (
                <div className="flex flex-col items-center py-20 gap-3">
                  <Sparkles size={36} style={{ color: 'rgba(255,255,255,0.1)' }} />
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>Nenhuma atualização publicada ainda</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {updates.map((u, i) => {
                    const cfg = UPDATE_TYPE[u.type]
                    return (
                      <motion.div key={u.id}
                        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }} transition={{ delay: i * 0.04 }}
                        className="group relative flex gap-4 p-4 rounded-2xl"
                        style={{ background: cfg.bg, border: `1px solid ${cfg.color}25` }}>
                        {/* Accent */}
                        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: cfg.color }} />

                        <div className="ml-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full"
                              style={{ background: `${cfg.color}20`, color: cfg.color }}>
                              {cfg.icon} {cfg.label}
                            </span>
                            <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.28)' }}>
                              {timeAgo(u.created_at)}
                            </span>
                          </div>
                          <p className="text-sm font-black mb-1" style={{ color: 'rgba(255,255,255,0.9)' }}>{u.title}</p>
                          <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>{u.description}</p>
                        </div>

                        <button onClick={() => deleteUpdate(u.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 p-1 rounded-lg hover:bg-red-500/10"
                          style={{ color: '#ff5252' }}>
                          <Trash2 size={13} />
                        </button>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </AnimatePresence>
          )}

          {/* ── ABA: FEEDBACKS ── */}
          {tab === 'feedback' && (
            <AnimatePresence mode="popLayout">
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <motion.div key={i} className="h-20 rounded-2xl"
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                      animate={{ opacity: [0.4, 0.7, 0.4] }}
                      transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.15 }} />
                  ))}
                </div>
              ) : feedbacks.length === 0 ? (
                <div className="flex flex-col items-center py-20 gap-3">
                  <MessageSquare size={36} style={{ color: 'rgba(255,255,255,0.1)' }} />
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>Nenhum feedback recebido ainda</p>
                  <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.2)' }}>
                    Os alunos podem enviar sugestões pelo painel deles em "Atualizações"
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {feedbacks.map((fb, i) => (
                    <motion.div key={fb.id}
                      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}>
                      <FeedbackCard fb={fb} onUpdate={loadFeedbacks} />
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          )}

        </div>
      </div>

      {showModal && <AddUpdateModal onClose={() => setShowModal(false)} onAdded={loadUpdates} />}
    </div>
  )
}
