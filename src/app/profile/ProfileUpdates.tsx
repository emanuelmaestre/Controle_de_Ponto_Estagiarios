'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, Star, Wrench, Megaphone,
  Lightbulb, Bug, Heart, HelpCircle, CheckCircle2, Clock, Send, ChevronDown,
} from 'lucide-react'

type UpdateType       = 'feature' | 'fix' | 'improvement' | 'announcement'
type FeedbackCategory = 'suggestion' | 'bug' | 'praise' | 'other'
type FeedbackStatus   = 'new' | 'read' | 'implemented' | 'archived'

interface SystemUpdate {
  id: string; title: string; description: string; type: UpdateType
  module: string | null; details: string | null; created_at: string
}
interface MyFeedback {
  id: string; category: FeedbackCategory; message: string
  status: FeedbackStatus; admin_reply: string | null; created_at: string
}

const UPDATE_TYPE: Record<UpdateType, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  feature:      { label: 'Nova função', color: '#3fe56c', bg: 'rgba(63,229,108,0.08)',  icon: <Sparkles size={11} /> },
  improvement:  { label: 'Melhoria',   color: '#22d3ee', bg: 'rgba(34,211,238,0.08)',  icon: <Star size={11} /> },
  fix:          { label: 'Correção',   color: '#f97316', bg: 'rgba(249,115,22,0.08)',  icon: <Wrench size={11} /> },
  announcement: { label: 'Aviso',      color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', icon: <Megaphone size={11} /> },
}
const CATEGORIES: { key: FeedbackCategory; label: string; icon: React.ReactNode; color: string }[] = [
  { key: 'suggestion', label: 'Sugestão de melhoria', icon: <Lightbulb size={14} />, color: '#22d3ee' },
  { key: 'bug',        label: 'Reportar problema',    icon: <Bug size={14} />,        color: '#ff5252' },
  { key: 'praise',     label: 'Elogio',               icon: <Heart size={14} />,      color: '#3fe56c' },
  { key: 'other',      label: 'Outro assunto',         icon: <HelpCircle size={14} />, color: '#94a3b8' },
]
const STATUS_CFG: Record<FeedbackStatus, { label: string; color: string; icon: React.ReactNode }> = {
  new:         { label: 'Aguardando',   color: '#f97316', icon: <Clock size={11} /> },
  read:        { label: 'Lido',         color: '#94a3b8', icon: <CheckCircle2 size={11} /> },
  implemented: { label: 'Implementado', color: '#3fe56c', icon: <CheckCircle2 size={11} /> },
  archived:    { label: 'Arquivado',    color: '#475569', icon: <CheckCircle2 size={11} /> },
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const d = Math.floor(diff / 86400000)
  if (d === 0) return 'Hoje'
  if (d === 1) return 'Ontem'
  if (d < 30)  return `${d} dias atrás`
  return new Date(iso).toLocaleDateString('pt-BR')
}

export default function ProfileUpdates() {
  const [tab, setTab]           = useState<'news' | 'feedback'>('news')
  const [updates, setUpdates]   = useState<SystemUpdate[]>([])
  const [myFeedbacks, setMyFb]  = useState<MyFeedback[]>([])
  const [loading, setLoading]   = useState(true)
  const [category, setCategory] = useState<FeedbackCategory>('suggestion')
  const [message, setMessage]   = useState('')
  const [sending, setSending]   = useState(false)
  const [sent, setSent]         = useState(false)
  const [formError, setFormError] = useState('')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const load = useCallback(async () => {
    setLoading(true)
    const [u, f] = await Promise.all([
      fetch('/api/intern/updates').then(r => r.json()),
      fetch('/api/intern/feedback').then(r => r.json()),
    ])
    setUpdates(u.updates ?? [])
    setMyFb(f.feedbacks ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    queueMicrotask(() => {
      void load()
    })
  }, [load])

  const submit = async () => {
    if (message.trim().length < 10) { setFormError('Escreva pelo menos 10 caracteres'); return }
    setSending(true); setFormError('')
    const res = await fetch('/api/intern/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, message: message.trim() }),
    })
    setSending(false)
    if (res.ok) {
      setSent(true); setMessage('')
      setTimeout(() => setSent(false), 3000)
      load()
    } else {
      const j = await res.json()
      setFormError(j.error ?? 'Erro ao enviar')
    }
  }

  return (
    <div className="space-y-4 pb-6">
      {/* Sub-tabs */}
      <div className="flex gap-2">
        {[
          { key: 'news',     label: 'Novidades',   icon: <Sparkles size={12} /> },
          { key: 'feedback', label: 'Dar Feedback', icon: <Heart size={12} /> },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as 'news' | 'feedback')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all"
            style={tab === t.key
              ? { background: 'rgba(63,229,108,0.12)', color: '#3fe56c', border: '1px solid rgba(63,229,108,0.3)' }
              : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── NOVIDADES ── */}
      {tab === 'news' && (
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
            <div className="flex flex-col items-center py-16 gap-3">
              <Sparkles size={32} style={{ color: 'rgba(255,255,255,0.1)' }} />
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>Nenhuma novidade ainda</p>
            </div>
          ) : (
            <div className="space-y-3">
              {updates.map((u, i) => {
                const cfg    = UPDATE_TYPE[u.type]
                const bullets = u.details ? u.details.split('\n').filter(Boolean) : []
                const isExp  = expanded[u.id]
                return (
                  <motion.div key={u.id}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-2xl overflow-hidden"
                    style={{ background: cfg.bg, border: `1px solid ${cfg.color}25` }}>
                    <div className="flex items-center gap-2 px-4 pt-3 pb-2 flex-wrap">
                      <span className="flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1 rounded-full"
                        style={{ background: `${cfg.color}22`, color: cfg.color }}>
                        {cfg.icon} {cfg.label}
                      </span>
                      {u.module && (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                          style={{ background: 'rgba(255,255,255,0.06)', color: cfg.color, border: `1px solid ${cfg.color}20` }}>
                          {u.module}
                        </span>
                      )}
                      <span className="text-[10px] ml-auto" style={{ color: 'rgba(255,255,255,0.28)' }}>{timeAgo(u.created_at)}</span>
                    </div>
                    <div className="mx-4" style={{ height: 1, background: `${cfg.color}15` }} />
                    <div className="px-4 pt-2.5 pb-3">
                      <p className="text-sm font-black mb-1 leading-snug" style={{ color: 'rgba(255,255,255,0.92)' }}>{u.title}</p>
                      <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>{u.description}</p>
                      {bullets.length > 0 && (
                        <>
                          <button onClick={() => setExpanded(p => ({ ...p, [u.id]: !p[u.id] }))}
                            className="flex items-center gap-1 mt-2 text-[10px] font-black transition-colors"
                            style={{ color: cfg.color }}>
                            <ChevronDown size={11} style={{ transform: isExp ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                            {isExp ? 'Ocultar detalhes' : `Ver o que mudou (${bullets.length} itens)`}
                          </button>
                          <AnimatePresence>
                            {isExp && (
                              <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                                className="mt-2 space-y-1 overflow-hidden pl-1">
                                {bullets.map((b, bi) => (
                                  <li key={bi} className="flex items-start gap-2 text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                                    <span style={{ color: cfg.color, marginTop: 2 }}>•</span>{b}
                                  </li>
                                ))}
                              </motion.ul>
                            )}
                          </AnimatePresence>
                        </>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </AnimatePresence>
      )}

      {/* ── FEEDBACK ── */}
      {tab === 'feedback' && (
        <div className="space-y-5">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl"
            style={{ background: 'rgba(63,229,108,0.05)', border: '1px solid rgba(63,229,108,0.15)' }}>
            <p className="text-xs font-black mb-1" style={{ color: '#3fe56c' }}>Dar Feedback</p>
            <p className="text-[10px] mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Reporte problemas, sugira melhorias ou deixe um elogio
            </p>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {CATEGORIES.map(c => (
                <button key={c.key} onClick={() => setCategory(c.key)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all"
                  style={category === c.key
                    ? { background: `${c.color}18`, border: `1px solid ${c.color}50`, color: c.color }
                    : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.45)' }}>
                  {c.icon} {c.label}
                </button>
              ))}
            </div>
            <div className="relative mb-2">
              <textarea value={message} onChange={e => { setMessage(e.target.value); setFormError('') }}
                rows={4} placeholder="Descreva sua sugestão, elogio ou problema encontrado..."
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)' }} />
              <span className="absolute bottom-2.5 right-3 text-[10px] pointer-events-none"
                style={{ color: message.length >= 10 ? 'rgba(63,229,108,0.7)' : 'rgba(255,255,255,0.25)' }}>
                {message.length < 10 ? `${message.length}/10 mín.` : `${message.length} ✓`}
              </span>
            </div>
            {formError && <p className="text-xs mb-2" style={{ color: '#ff5252' }}>{formError}</p>}
            <AnimatePresence>
              {sent && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-xs mb-2 flex items-center gap-1" style={{ color: '#3fe56c' }}>
                  <CheckCircle2 size={12} /> Feedback enviado! Obrigado.
                </motion.p>
              )}
            </AnimatePresence>
            <button onClick={submit} disabled={sending || message.trim().length < 10}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black transition-all disabled:opacity-40"
              style={{ background: '#3fe56c', color: '#000' }}>
              <Send size={13} /> {sending ? 'Enviando...' : 'Enviar feedback'}
            </button>
            <p className="text-center text-[10px] mt-1.5" style={{ color: 'rgba(255,255,255,0.2)' }}>
              ✦ Enviar gera <span style={{ color: 'rgba(63,229,108,0.5)' }}>+10 pts</span> · Feedback implementado <span style={{ color: 'rgba(63,229,108,0.5)' }}>+25 pts</span>
            </p>
          </motion.div>

          {myFeedbacks.length > 0 && (
            <div>
              <p className="text-[11px] font-black mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>SEUS FEEDBACKS ANTERIORES</p>
              <div className="space-y-3">
                {myFeedbacks.map((fb, i) => {
                  const cat = CATEGORIES.find(c => c.key === fb.category)!
                  const sts = STATUS_CFG[fb.status]
                  return (
                    <motion.div key={fb.id}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="p-3 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full"
                          style={{ background: `${cat.color}18`, color: cat.color }}>
                          {cat.icon} {cat.label}
                        </span>
                        <span className="flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full"
                          style={{ background: `${sts.color}18`, color: sts.color }}>
                          {sts.icon} {sts.label}
                        </span>
                        <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>{timeAgo(fb.created_at)}</span>
                      </div>
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>{fb.message}</p>
                      {fb.admin_reply && (
                        <div className="mt-2 pl-3 py-1 border-l-2" style={{ borderColor: '#3fe56c' }}>
                          <p className="text-[10px] font-black mb-0.5" style={{ color: '#3fe56c' }}>Resposta do administrador</p>
                          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{fb.admin_reply}</p>
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
