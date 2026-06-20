'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence, useAnimation } from 'framer-motion'
import {
  Sparkles, MessageSquare, Plus, Trash2, RefreshCw, CheckCircle2,
  Wrench, Megaphone, Star, Bug, Lightbulb, Heart, HelpCircle,
  ChevronDown, Send, X, Zap, TrendingUp, Shield,
} from 'lucide-react'

type UpdateType       = 'feature' | 'fix' | 'improvement' | 'announcement'
type FeedbackCategory = 'suggestion' | 'bug' | 'praise' | 'other'
type FeedbackStatus   = 'new' | 'read' | 'implemented' | 'archived'

interface SystemUpdate {
  id: string; title: string; description: string; type: UpdateType
  module: string | null; details: string | null; created_at: string
}
interface Feedback {
  id: string; category: FeedbackCategory; message: string; status: FeedbackStatus
  admin_reply: string | null; created_at: string
  profiles: { full_name: string; photo_url: string | null }
}

const UPDATE_TYPE: Record<UpdateType, {
  label: string; color: string; bg: string; border: string
  gradient: string; icon: React.ReactNode; illustration: React.ReactNode
}> = {
  feature: {
    label: 'Nova função', color: '#3fe56c', bg: 'rgba(63,229,108,0.07)',
    border: 'rgba(63,229,108,0.2)', gradient: 'linear-gradient(135deg,rgba(63,229,108,0.15),rgba(63,229,108,0.02))',
    icon: <Sparkles size={13} />,
    illustration: (
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="32" r="28" fill="rgba(63,229,108,0.08)" stroke="rgba(63,229,108,0.2)" strokeWidth="1"/>
        <path d="M32 16 L36 28 L48 28 L38 36 L42 48 L32 40 L22 48 L26 36 L16 28 L28 28Z" fill="rgba(63,229,108,0.4)" stroke="rgba(63,229,108,0.8)" strokeWidth="1.5" strokeLinejoin="round"/>
      </svg>
    ),
  },
  improvement: {
    label: 'Melhoria', color: '#22d3ee', bg: 'rgba(34,211,238,0.07)',
    border: 'rgba(34,211,238,0.2)', gradient: 'linear-gradient(135deg,rgba(34,211,238,0.15),rgba(34,211,238,0.02))',
    icon: <TrendingUp size={13} />,
    illustration: (
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="32" r="28" fill="rgba(34,211,238,0.08)" stroke="rgba(34,211,238,0.2)" strokeWidth="1"/>
        <polyline points="14,44 26,30 34,36 50,18" stroke="rgba(34,211,238,0.8)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <circle cx="50" cy="18" r="3" fill="rgba(34,211,238,0.9)"/>
        <circle cx="26" cy="30" r="2.5" fill="rgba(34,211,238,0.6)"/>
        <circle cx="34" cy="36" r="2.5" fill="rgba(34,211,238,0.6)"/>
      </svg>
    ),
  },
  fix: {
    label: 'Correção', color: '#f97316', bg: 'rgba(249,115,22,0.07)',
    border: 'rgba(249,115,22,0.2)', gradient: 'linear-gradient(135deg,rgba(249,115,22,0.15),rgba(249,115,22,0.02))',
    icon: <Wrench size={13} />,
    illustration: (
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="32" r="28" fill="rgba(249,115,22,0.08)" stroke="rgba(249,115,22,0.2)" strokeWidth="1"/>
        <path d="M40 16 C44 20 44 28 40 32 L28 44 C26 46 22 46 20 44 C18 42 18 38 20 36 L32 24 C36 20 36 12 40 16Z" stroke="rgba(249,115,22,0.8)" strokeWidth="2" fill="rgba(249,115,22,0.2)" strokeLinecap="round"/>
        <circle cx="23" cy="41" r="3" fill="rgba(249,115,22,0.6)"/>
        <line x1="38" y1="18" x2="46" y2="26" stroke="rgba(249,115,22,0.5)" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  announcement: {
    label: 'Aviso', color: '#a78bfa', bg: 'rgba(167,139,250,0.07)',
    border: 'rgba(167,139,250,0.2)', gradient: 'linear-gradient(135deg,rgba(167,139,250,0.15),rgba(167,139,250,0.02))',
    icon: <Megaphone size={13} />,
    illustration: (
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="32" r="28" fill="rgba(167,139,250,0.08)" stroke="rgba(167,139,250,0.2)" strokeWidth="1"/>
        <path d="M18 26 L18 38 L24 38 L24 26Z" fill="rgba(167,139,250,0.4)" stroke="rgba(167,139,250,0.7)" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M24 22 L44 14 L44 50 L24 42Z" fill="rgba(167,139,250,0.25)" stroke="rgba(167,139,250,0.7)" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M24 38 L22 48 L28 48 L30 38" fill="rgba(167,139,250,0.3)" stroke="rgba(167,139,250,0.5)" strokeWidth="1.5" strokeLinejoin="round"/>
        <line x1="47" y1="24" x2="51" y2="20" stroke="rgba(167,139,250,0.6)" strokeWidth="2" strokeLinecap="round"/>
        <line x1="48" y1="32" x2="53" y2="32" stroke="rgba(167,139,250,0.6)" strokeWidth="2" strokeLinecap="round"/>
        <line x1="47" y1="40" x2="51" y2="44" stroke="rgba(167,139,250,0.6)" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
}

const FEEDBACK_CAT: Record<FeedbackCategory, { label: string; color: string; icon: React.ReactNode }> = {
  suggestion: { label: 'Sugestão',  color: '#22d3ee', icon: <Lightbulb size={12} /> },
  bug:        { label: 'Problema',  color: '#ff5252', icon: <Bug size={12} /> },
  praise:     { label: 'Elogio',    color: '#3fe56c', icon: <Heart size={12} /> },
  other:      { label: 'Outro',     color: '#94a3b8', icon: <HelpCircle size={12} /> },
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
  if (d < 7)   return `${d} dias atrás`
  if (d < 30)  return `${Math.floor(d/7)} sem. atrás`
  return new Date(iso).toLocaleDateString('pt-BR')
}
function avatarInitials(name: string) {
  return name.split(' ').filter(Boolean).slice(0,2).map(w => w[0].toUpperCase()).join('')
}
const AV_COLORS = ['#3fe56c','#22d3ee','#a78bfa','#f97316','#fbbf24']
function avatarColor(name: string) { return AV_COLORS[name.charCodeAt(0) % AV_COLORS.length] }

// ── Módulos disponíveis ────────────────────────────────────────────────────────
const MODULES = [
  'Painel', 'Cadastros', 'Carga de Trabalho', 'Relatórios',
  'Ranking', 'Atualizações', 'Configurações', 'Registro de Ponto',
  'Perfil do Aluno', 'Gamificação', 'Notificações', 'Geral',
]

// ── Update Card ────────────────────────────────────────────────────────────────
function UpdateCard({ u, index, onDelete }: { u: SystemUpdate; index: number; onDelete: () => void }) {
  const cfg = UPDATE_TYPE[u.type]
  const [expanded, setExpanded] = useState(false)
  const [hovered, setHovered]   = useState(false)

  const bullets = u.details
    ? u.details.split('\n').map(l => l.replace(/^[-•*]\s*/, '').trim()).filter(Boolean)
    : []

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.96 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="group relative rounded-2xl overflow-hidden"
      style={{ background: cfg.bg, border: `1px solid ${hovered ? cfg.color + '60' : cfg.border}`, transition: 'border-color 0.2s' }}
    >
      {/* Left accent */}
      <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl"
        style={{ background: `linear-gradient(to bottom, ${cfg.color}, transparent)` }} />

      {/* ── Cabeçalho: ONDE foi feito ── */}
      {u.module && (
        <div className="relative flex items-center justify-between px-5 pt-4 pb-2">
          <div className="flex items-center gap-2">
            {/* Ícone do tipo */}
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: `${cfg.color}18`, color: cfg.color }}>
              {cfg.icon}
            </div>
            {/* Caminho do módulo — destaque principal */}
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest mb-0.5"
                style={{ color: 'rgba(255,255,255,0.25)' }}>Local da atualização</p>
              <p className="text-sm font-black" style={{ color: cfg.color }}>
                {u.module}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: `${cfg.color}15`, color: cfg.color, border: `1px solid ${cfg.color}30` }}>
              {cfg.label}
            </span>
            <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.22)' }}>
              {timeAgo(u.created_at)}
            </span>
            <motion.button onClick={onDelete}
              initial={{ opacity: 0 }} animate={{ opacity: hovered ? 1 : 0 }}
              className="p-1.5 rounded-lg" style={{ background: 'rgba(255,82,82,0.1)', color: '#ff5252' }}
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Trash2 size={11} />
            </motion.button>
          </div>
        </div>
      )}

      {/* Divisor */}
      {u.module && (
        <div className="mx-5 mb-3" style={{ height: 1, background: `${cfg.color}15` }} />
      )}

      {/* ── Corpo ── */}
      <div className="relative px-5 pb-5">
        {/* Cabeçalho sem módulo */}
        {!u.module && (
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1 rounded-full"
                style={{ background: `${cfg.color}20`, color: cfg.color, border: `1px solid ${cfg.color}40` }}>
                {cfg.icon} {cfg.label}
              </span>
              <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.28)' }}>
                {timeAgo(u.created_at)}
              </span>
            </div>
            <motion.button onClick={onDelete}
              initial={{ opacity: 0 }} animate={{ opacity: hovered ? 1 : 0 }}
              className="p-1.5 rounded-lg" style={{ background: 'rgba(255,82,82,0.1)', color: '#ff5252' }}
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Trash2 size={11} />
            </motion.button>
          </div>
        )}

        {/* Título */}
        <motion.p className="text-[15px] font-black mb-1.5 leading-snug"
          animate={{ color: hovered ? cfg.color : 'rgba(255,255,255,0.92)' }}
          transition={{ duration: 0.2 }}>
          {u.title}
        </motion.p>

        {/* Descrição */}
        <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
          {u.description}
        </p>

        {/* Expandir detalhes */}
        {bullets.length > 0 && (
          <button onClick={() => setExpanded(o => !o)}
            className="flex items-center gap-1.5 mt-3 text-[11px] font-black"
            style={{ color: cfg.color }}>
            <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown size={13} />
            </motion.span>
            {expanded ? 'Ocultar detalhes' : `Ver o que mudou (${bullets.length} item${bullets.length > 1 ? 's' : ''})`}
          </button>
        )}
      </div>

      {/* Detalhes expandidos */}
      <AnimatePresence>
        {expanded && bullets.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden">
            <div className="px-5 pb-5">
              <div className="rounded-xl p-4"
                style={{ background: 'rgba(0,0,0,0.2)', border: `1px solid ${cfg.color}20` }}>
                <p className="text-[10px] font-black uppercase tracking-wider mb-3"
                  style={{ color: cfg.color }}>O que mudou</p>
                <ul className="space-y-2">
                  {bullets.map((b, i) => (
                    <motion.li key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="flex items-start gap-2.5 text-sm"
                      style={{ color: 'rgba(255,255,255,0.65)' }}>
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: cfg.color }} />
                      {b}
                    </motion.li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom shimmer */}
      <motion.div className="absolute bottom-0 left-0 h-[1px]"
        initial={{ width: '0%' }}
        animate={{ width: hovered ? '100%' : '0%' }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{ background: `linear-gradient(to right, transparent, ${cfg.color}, transparent)` }} />
    </motion.div>
  )
}

// ── Add Update Modal ────────────────────────────────────────────────────────────
function AddUpdateModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [title, setTitle]      = useState('')
  const [description, setDesc] = useState('')
  const [details, setDetails]  = useState('')
  const [module_, setModule]   = useState('')
  const [type, setType]        = useState<UpdateType>('feature')
  const [loading, setLoading]  = useState(false)
  const [error, setError]      = useState('')

  const submit = async () => {
    if (!title.trim() || !description.trim()) { setError('Preencha título e descrição'); return }
    setLoading(true); setError('')
    const res = await fetch('/api/admin/system-updates', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title.trim(), description: description.trim(), type,
        module: module_.trim() || null,
        details: details.trim() || null,
      }),
    })
    setLoading(false)
    if (res.ok) { onAdded(); onClose() }
    else { const j = await res.json(); setError(j.error ?? 'Erro ao salvar') }
  }

  const inputStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)' }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        className="w-full max-w-lg rounded-3xl p-6 flex flex-col gap-4 overflow-y-auto"
        style={{ background: '#0a1a10', border: '1px solid rgba(63,229,108,0.25)', boxShadow: '0 40px 80px rgba(0,0,0,0.6)', maxHeight: '90vh' }}>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider mb-0.5" style={{ color: 'rgba(63,229,108,0.6)' }}>
              PUBLICAR NOVIDADE
            </p>
            <h3 className="text-lg font-black" style={{ color: 'var(--text)' }}>Nova atualização</h3>
          </div>
          <motion.button onClick={onClose} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            className="p-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <X size={16} style={{ color: 'rgba(255,255,255,0.5)' }} />
          </motion.button>
        </div>

        {/* Tipo */}
        <div>
          <label className="text-[10px] font-black uppercase tracking-wider mb-2 block" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Tipo de atualização
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(UPDATE_TYPE) as UpdateType[]).map(t => {
              const cfg = UPDATE_TYPE[t]
              return (
                <motion.button key={t} onClick={() => setType(t)}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold"
                  style={type === t
                    ? { background: cfg.bg, border: `1px solid ${cfg.color}`, color: cfg.color, boxShadow: `0 0 12px ${cfg.color}20` }
                    : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}>
                  {cfg.icon} {cfg.label}
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Módulo / Local exato */}
        <div>
          <label className="text-[10px] font-black uppercase tracking-wider mb-1 block" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Local da atualização <span style={{ color: 'rgba(255,255,255,0.2)', fontWeight: 400 }}>— onde exatamente foi feito</span>
          </label>
          {/* Chips: pré-preenchem o campo; admin pode editar para ser mais específico */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {MODULES.map(m => (
              <button key={m} onClick={() => setModule(module_ === m ? '' : m)}
                className="text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all"
                style={module_.startsWith(m)
                  ? { background: 'rgba(63,229,108,0.15)', color: '#3fe56c', border: '1px solid rgba(63,229,108,0.4)' }
                  : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.07)' }}>
                {m}
              </button>
            ))}
          </div>
          <input value={module_} onChange={e => setModule(e.target.value)}
            placeholder="Ex: Relatórios → Dropdown de Mês  |  Cadastros → Formulário de Aluno"
            className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ ...inputStyle, fontSize: 12 }} />
          <p className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>
            Clique no chip para base, depois edite para detalhar: "Relatórios → Filtro de Estagiário"
          </p>
        </div>

        {/* Título */}
        <div>
          <label className="text-[10px] font-black uppercase tracking-wider mb-2 block" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Título
          </label>
          <input value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Ex: Dropdowns não cortam mais nos relatórios"
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={inputStyle} />
        </div>

        {/* Descrição resumida */}
        <div>
          <label className="text-[10px] font-black uppercase tracking-wider mb-2 block" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Descrição curta
          </label>
          <textarea value={description} onChange={e => setDesc(e.target.value)} rows={2}
            placeholder="Resumo em 1-2 frases do que foi feito..."
            className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
            style={inputStyle} />
        </div>

        {/* Detalhes (bullets) */}
        <div>
          <label className="text-[10px] font-black uppercase tracking-wider mb-1 block" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Detalhes do que mudou <span style={{ color: 'rgba(255,255,255,0.2)', fontWeight: 400, textTransform: 'none' }}>(uma linha por item)</span>
          </label>
          <p className="text-[10px] mb-2" style={{ color: 'rgba(255,255,255,0.2)' }}>
            Cada linha vira um bullet ponto. Ex: "Dropdown agora usa position fixed"
          </p>
          <textarea value={details} onChange={e => setDetails(e.target.value)} rows={5}
            placeholder={`Dropdown de mês usa position:fixed — não corta mais\nBotão PDF mantém a cor vermelha no hover\nSeletores de estagiário com scroll suave`}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none font-mono"
            style={{ ...inputStyle, fontSize: 11, lineHeight: 1.7 }} />
        </div>

        {error && <p className="text-xs px-1" style={{ color: '#ff5252' }}>{error}</p>}

        <motion.button onClick={submit} disabled={loading}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          className="w-full py-3 rounded-xl text-sm font-black flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg,#3fe56c,#22d3ee)', color: '#000' }}>
          <Sparkles size={14} />
          {loading ? 'Publicando...' : 'Publicar atualização'}
        </motion.button>
      </motion.div>
    </motion.div>
  )
}

// ── Feedback Card ───────────────────────────────────────────────────────────────
function FeedbackCard({ fb, onUpdate }: { fb: Feedback; onUpdate: () => void }) {
  const [open, setOpen]     = useState(false)
  const [reply, setReply]   = useState(fb.admin_reply ?? '')
  const [status, setStatus] = useState<FeedbackStatus>(fb.status)
  const [saving, setSaving] = useState(false)
  const cat   = FEEDBACK_CAT[fb.category]
  const sts   = FEEDBACK_STATUS[fb.status]
  const inits = avatarInitials(fb.profiles?.full_name ?? '?')
  const color = avatarColor(fb.profiles?.full_name ?? '?')

  const save = async () => {
    setSaving(true)
    await fetch('/api/admin/feedback', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: fb.id, status, admin_reply: reply || null }),
    })
    setSaving(false); setOpen(false); onUpdate()
  }

  return (
    <motion.div layout className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${fb.status === 'new' ? 'rgba(249,115,22,0.3)' : 'rgba(255,255,255,0.07)'}` }}>
      <motion.button className="w-full flex items-start gap-3 p-4 text-left"
        onClick={() => setOpen(o => !o)} whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center font-black text-[11px]"
          style={{ background: `${color}22`, border: `1.5px solid ${color}55`, color }}>
          {inits}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className="flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full"
              style={{ background: `${cat.color}18`, color: cat.color, border: `1px solid ${cat.color}30` }}>
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
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>{fb.message}</p>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex-shrink-0 mt-1">
          <ChevronDown size={14} style={{ color: 'rgba(255,255,255,0.3)' }} />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: [0.16,1,0.3,1] }}
            className="overflow-hidden">
            <div className="px-4 pb-4 flex flex-col gap-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <p className="text-[10px] font-black pt-3 uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.25)' }}>Gerenciar feedback</p>
              <div className="flex gap-2 flex-wrap">
                {(Object.keys(FEEDBACK_STATUS) as FeedbackStatus[]).map(s => {
                  const sc = FEEDBACK_STATUS[s]
                  return (
                    <motion.button key={s} onClick={() => setStatus(s)}
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      className="text-[10px] font-black px-2.5 py-1 rounded-lg"
                      style={status === s
                        ? { background: `${sc.color}20`, color: sc.color, border: `1px solid ${sc.color}50` }
                        : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)', border: '1px solid transparent' }}>
                      {sc.label}
                    </motion.button>
                  )
                })}
              </div>
              <textarea value={reply} onChange={e => setReply(e.target.value)} rows={2}
                placeholder="Resposta para o aluno (opcional)..."
                className="w-full px-3 py-2 rounded-xl text-xs outline-none resize-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)' }} />
              <motion.button onClick={save} disabled={saving}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 self-end px-4 py-2 rounded-xl text-xs font-black disabled:opacity-50"
                style={{ background: '#3fe56c', color: '#000' }}>
                <Send size={11} /> {saving ? 'Salvando...' : 'Salvar'}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Stats Bar ───────────────────────────────────────────────────────────────────
function StatsBar({ updates, feedbacks }: { updates: SystemUpdate[]; feedbacks: Feedback[] }) {
  const byType = (t: UpdateType) => updates.filter(u => u.type === t).length
  const newFb  = feedbacks.filter(f => f.status === 'new').length

  const stats = [
    { label: 'Nova função',   value: byType('feature'),      color: '#3fe56c', icon: <Sparkles size={12} /> },
    { label: 'Melhorias',     value: byType('improvement'),  color: '#22d3ee', icon: <TrendingUp size={12} /> },
    { label: 'Correções',     value: byType('fix'),          color: '#f97316', icon: <Wrench size={12} /> },
    { label: 'Feedbacks novos', value: newFb,                color: '#a78bfa', icon: <MessageSquare size={12} /> },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {stats.map((s, i) => (
        <motion.div key={s.label}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07, duration: 0.35, ease: [0.16,1,0.3,1] }}
          className="flex flex-col gap-1.5 p-3.5 rounded-2xl"
          style={{ background: `${s.color}08`, border: `1px solid ${s.color}20` }}>
          <div className="flex items-center justify-between">
            <span style={{ color: s.color }}>{s.icon}</span>
            <span className="text-2xl font-black" style={{ color: s.color }}>{s.value}</span>
          </div>
          <p className="text-[10px] font-bold" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.label}</p>
        </motion.div>
      ))}
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function AdminUpdatesPage() {
  const [tab, setTab]             = useState<'updates' | 'feedback'>('updates')
  const [updates, setUpdates]     = useState<SystemUpdate[]>([])
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [loading, setLoading]     = useState(true)
  const [showModal, setShowModal] = useState(false)

  const loadUpdates  = useCallback(async () => {
    const r = await fetch('/api/admin/system-updates'); const j = await r.json()
    setUpdates(j.updates ?? [])
  }, [])
  const loadFeedbacks = useCallback(async () => {
    const r = await fetch('/api/admin/feedback'); const j = await r.json()
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

      {/* ── Header ── */}
      <header className="flex-shrink-0 px-4 sm:px-6 pt-5 pb-0"
        style={{ borderBottom: '1px solid rgba(0,200,83,0.1)' }}>

        {/* Title row */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}>
                <Sparkles size={18} style={{ color: '#3fe56c' }} />
              </motion.div>
              <h1 className="text-xl font-black" style={{ color: 'var(--text)' }}>Atualizações do Sistema</h1>
            </div>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Novidades, melhorias e feedbacks dos alunos
            </p>
          </div>

          <div className="flex items-center gap-2">
            <motion.button onClick={load} disabled={loading}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="p-2 rounded-xl disabled:opacity-40"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </motion.button>
            {tab === 'updates' && (
              <motion.button onClick={() => setShowModal(true)}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black"
                style={{ background: 'linear-gradient(135deg,#3fe56c,#22d3ee)', color: '#000', boxShadow: '0 4px 16px rgba(63,229,108,0.3)' }}>
                <Plus size={13} /> Publicar
              </motion.button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          {[
            { key: 'updates',  label: 'Novidades',  icon: <Sparkles size={13} /> },
            { key: 'feedback', label: 'Feedbacks',  icon: <MessageSquare size={13} />, badge: newFeedbacks },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className="relative flex items-center gap-1.5 px-4 py-2.5 text-xs font-black transition-colors"
              style={{ color: tab === t.key ? '#3fe56c' : 'rgba(255,255,255,0.4)', borderBottom: tab === t.key ? '2px solid #3fe56c' : '2px solid transparent' }}>
              {t.icon} {t.label}
              {t.badge ? (
                <span className="w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center"
                  style={{ background: '#f97316', color: '#000' }}>{t.badge}</span>
              ) : null}
            </button>
          ))}
        </div>
      </header>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div style={{ maxWidth: 760, margin: '0 auto' }}>

          {!loading && <StatsBar updates={updates} feedbacks={feedbacks} />}

          {/* ── Novidades ── */}
          {tab === 'updates' && (
            <AnimatePresence mode="popLayout">
              {loading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <motion.div key={i} className="h-28 rounded-2xl"
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                      animate={{ opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.2 }} />
                  ))}
                </div>
              ) : updates.length === 0 ? (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center py-24 gap-5">
                  <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-24 h-24 rounded-3xl flex items-center justify-center"
                    style={{ background: 'rgba(63,229,108,0.08)', border: '1px solid rgba(63,229,108,0.2)' }}>
                    <Sparkles size={40} style={{ color: 'rgba(63,229,108,0.4)' }} />
                  </motion.div>
                  <div className="text-center">
                    <p className="text-base font-black mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Nenhuma novidade publicada</p>
                    <p className="text-sm" style={{ color: 'rgba(255,255,255,0.2)' }}>Clique em "Publicar" para adicionar a primeira</p>
                  </div>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  {updates.map((u, i) => (
                    <UpdateCard key={u.id} u={u} index={i} onDelete={() => deleteUpdate(u.id)} />
                  ))}
                </div>
              )}
            </AnimatePresence>
          )}

          {/* ── Feedbacks ── */}
          {tab === 'feedback' && (
            <AnimatePresence mode="popLayout">
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <motion.div key={i} className="h-20 rounded-2xl"
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                      animate={{ opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.2 }} />
                  ))}
                </div>
              ) : feedbacks.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex flex-col items-center py-24 gap-5">
                  <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-24 h-24 rounded-3xl flex items-center justify-center"
                    style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)' }}>
                    <MessageSquare size={40} style={{ color: 'rgba(167,139,250,0.4)' }} />
                  </motion.div>
                  <div className="text-center">
                    <p className="text-base font-black mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Nenhum feedback ainda</p>
                    <p className="text-sm" style={{ color: 'rgba(255,255,255,0.2)' }}>Os alunos podem enviar sugestões pelo painel deles em "Novidades"</p>
                  </div>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  {feedbacks.map((fb, i) => (
                    <motion.div key={fb.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}>
                      <FeedbackCard fb={fb} onUpdate={loadFeedbacks} />
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          )}

        </div>
      </div>

      <AnimatePresence>
        {showModal && <AddUpdateModal onClose={() => setShowModal(false)} onAdded={loadUpdates} />}
      </AnimatePresence>
    </div>
  )
}
