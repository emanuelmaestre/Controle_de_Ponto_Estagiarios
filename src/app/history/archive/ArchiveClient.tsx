'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Home, ClipboardList, Trophy, User, LogOut,
  Archive, ChevronDown, CheckCircle2, Clock, XCircle,
  Hourglass, CalendarDays, Sparkles,
} from 'lucide-react'
import { formatDate, formatTime, minutesToHours } from '@/lib/utils'

type Activity = { id: string; description: string; created_at: string }
type TimeRecord = {
  id: string; clock_in: string; clock_out: string | null
  duration_minutes: number | null; status: string
  rejection_reason: string | null; notes: string | null
  activities: Activity[]
}
type Props = { records: TimeRecord[]; userName: string }

function formatMonth(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}
function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const STATUS_CFG = {
  approved: { label: 'Aprovado',  color: 'var(--success)',  icon: <CheckCircle2 size={11} /> },
  pending:  { label: 'Pendente',  color: 'var(--warning)',  icon: <Hourglass size={11} /> },
  rejected: { label: 'Reprovado', color: 'var(--danger)',   icon: <XCircle size={11} /> },
}

function MonthGroup({ month, records, index }: { month: string; records: TimeRecord[]; index: number }) {
  const [open, setOpen] = useState(index === 0) // primeiro mês abre sozinho

  const totalMin = records.reduce((s, r) => s + (r.duration_minutes ?? 0), 0)
  const approved = records.filter(r => r.status === 'approved').length

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-3xl overflow-hidden"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      {/* Cabeçalho do mês — clicável */}
      <motion.button
        className="w-full flex items-center justify-between px-5 py-4"
        onClick={() => setOpen(o => !o)}
        whileHover={{ backgroundColor: 'rgba(63,229,108,0.03)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(63,229,108,0.1)', border: '1px solid rgba(63,229,108,0.2)' }}
          >
            <CalendarDays size={16} style={{ color: 'var(--primary)' }} />
          </div>
          <div className="text-left">
            <p className="text-sm font-black capitalize" style={{ color: 'var(--text)' }}>{month}</p>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-3)' }}>
              {records.length} sessão{records.length !== 1 ? 'ões' : ''} · {minutesToHours(totalMin)} · {approved} aprovada{approved !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.22 }}>
          <ChevronDown size={16} style={{ color: 'var(--text-3)' }} />
        </motion.div>
      </motion.button>

      {/* Lista de registros */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2.5 border-t" style={{ borderColor: 'var(--border)' }}>
              {records.map((r, i) => {
                const cfg = STATUS_CFG[r.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.pending
                return (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="rounded-2xl overflow-hidden mt-2.5"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                  >
                    {/* Linha principal */}
                    <div className="px-4 py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>{formatDate(r.clock_in)}</p>
                        <p className="text-[11px] mt-0.5 flex items-center gap-1" style={{ color: 'var(--text-3)' }}>
                          <Clock size={10} />
                          {formatTime(r.clock_in)}
                          {r.clock_out ? <> → {formatTime(r.clock_out)}</> : <span style={{ color: 'var(--success)' }}> em andamento</span>}
                          {r.duration_minutes && <span style={{ color: 'var(--primary)' }}> · {minutesToHours(r.duration_minutes)}</span>}
                        </p>
                      </div>
                      <span
                        className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black flex-shrink-0"
                        style={{ background: `${cfg.color}15`, color: cfg.color, border: `1px solid ${cfg.color}30` }}
                      >
                        {cfg.icon} {cfg.label}
                      </span>
                    </div>

                    {/* Atividades */}
                    {r.activities.length > 0 && (
                      <div className="px-4 py-2.5 space-y-1.5 border-t" style={{ borderColor: 'var(--border)' }}>
                        {r.activities.map((a, ai) => (
                          <div key={ai} className="flex items-start gap-2">
                            <Sparkles size={10} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--primary)', opacity: 0.6 }} />
                            <div className="min-w-0">
                              <p className="text-xs font-bold" style={{ color: 'var(--text-2)' }}>{a.description}</p>
                              <p className="text-[10px]" style={{ color: 'var(--text-3)' }}>{formatDateTime(a.created_at)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Reprovação */}
                    {r.status === 'rejected' && r.rejection_reason && (
                      <div className="px-4 py-2" style={{ background: 'rgba(220,38,38,0.06)', borderTop: '1px solid rgba(220,38,38,0.15)' }}>
                        <p className="text-[9px] font-black mb-0.5" style={{ color: 'var(--danger)' }}>MOTIVO DA REPROVAÇÃO</p>
                        <p className="text-xs" style={{ color: 'var(--danger)', opacity: 0.85 }}>{r.rejection_reason}</p>
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// Ilustração de arquivo vazio
function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center py-20 px-8 text-center"
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        className="relative mb-6"
      >
        <div
          className="w-28 h-28 rounded-3xl flex items-center justify-center"
          style={{ background: 'rgba(63,229,108,0.07)', border: '1.5px solid rgba(63,229,108,0.15)' }}
        >
          <Archive size={48} style={{ color: 'rgba(63,229,108,0.35)' }} />
        </div>
        {/* Partículas flutuantes */}
        {[
          { delay: 0,   x: -24, y: -20 },
          { delay: 0.6, x:  28, y: -16 },
          { delay: 1.2, x: -18, y:  22 },
        ].map((p, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{ background: 'rgba(63,229,108,0.3)', top: '50%', left: '50%', x: p.x, y: p.y }}
            animate={{ opacity: [0.2, 0.8, 0.2], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: p.delay }}
          />
        ))}
      </motion.div>
      <p className="text-xl font-black mb-2" style={{ color: 'var(--text)' }}>Nenhum registro antigo</p>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-3)' }}>
        Seus registros com mais de 60 dias aparecerão aqui, organizados por mês.
      </p>
      <Link href="/history">
        <motion.div
          className="mt-6 flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-black"
          style={{ background: 'rgba(63,229,108,0.1)', color: 'var(--primary)', border: '1px solid rgba(63,229,108,0.2)' }}
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
        >
          <ClipboardList size={15} />
          Ver registros recentes
        </motion.div>
      </Link>
    </motion.div>
  )
}

export default function ArchiveClient({ records, userName }: Props) {
  const [search, setSearch] = useState('')

  // Agrupa por mês
  const grouped = useMemo(() => {
    const filtered = search
      ? records.filter(r =>
          r.activities.some(a => a.description.toLowerCase().includes(search.toLowerCase())) ||
          formatDate(r.clock_in).includes(search)
        )
      : records

    const map: Record<string, TimeRecord[]> = {}
    for (const r of filtered) {
      const key = formatMonth(r.clock_in)
      if (!map[key]) map[key] = []
      map[key].push(r)
    }
    return Object.entries(map) // [ [mês, registros[]] ]
  }, [records, search])

  const totalSessoes = records.length
  const totalMin     = records.reduce((s, r) => s + (r.duration_minutes ?? 0), 0)

  return (
    <div className="flex flex-col" style={{ height: '100dvh', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* Header */}
      <header className="flex-shrink-0" style={{ background: 'var(--nav-bg)', boxShadow: '0 1px 0 var(--border)' }}>
        <div className="max-w-2xl mx-auto px-5 py-4">
          <div className="flex items-center gap-3 mb-3">
            <Link href="/history" className="w-8 h-8 rounded-xl flex items-center justify-center hover:opacity-70 transition-opacity"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--nav-muted)' }}>
              <ArrowLeft size={16} />
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Archive size={16} style={{ color: 'var(--primary)' }} />
                <h1 className="font-black text-base" style={{ color: 'var(--nav-fg)' }}>ARQUIVO DE REGISTROS</h1>
              </div>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--nav-muted)' }}>
                REGISTROS COM MAIS DE 60 DIAS · {totalSessoes} SESSÕES · {minutesToHours(totalMin)}
              </p>
            </div>
          </div>

          {/* Busca */}
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por data ou atividade..."
            className="w-full px-4 py-2.5 rounded-2xl text-sm outline-none"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
            }}
          />
        </div>
      </header>

      {/* Conteúdo */}
      <main className="flex-1 min-h-0 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-3 pb-6">
          {grouped.length === 0 ? (
            <EmptyState />
          ) : (
            grouped.map(([month, recs], i) => (
              <MonthGroup key={month} month={month} records={recs} index={i} />
            ))
          )}
        </div>
      </main>

      {/* Bottom nav */}
      <nav className="flex-shrink-0 border-t" style={{ background: 'var(--surface)', borderColor: 'var(--border)', boxShadow: '0 -4px 20px rgba(0,0,0,0.08)' }}>
        <div className="max-w-lg mx-auto flex">
          {[
            { href: '/dashboard',      icon: <Home size={18} />,          label: 'INICIO',    active: false },
            { href: '/history',        icon: <ClipboardList size={18} />, label: 'HISTÓRICO', active: true  },
            { href: '/intern-ranking', icon: <Trophy size={18} />,        label: 'RANKING',   active: false },
            { href: '/profile',        icon: <User size={18} />,          label: 'PERFIL',    active: false },
          ].map(item => (
            <Link key={item.href} href={item.href} className="flex-1 flex flex-col items-center gap-1 py-3"
              style={{ color: item.active ? 'var(--primary)' : 'var(--text-3)' }}>
              {item.icon}
              <span className="text-[10px] font-bold">{item.label}</span>
            </Link>
          ))}
          <form action="/api/auth/signout" method="POST" className="flex-1">
            <button type="submit" className="w-full flex flex-col items-center gap-1 py-3" style={{ color: 'var(--text-3)' }}>
              <LogOut size={18} />
              <span className="text-[10px] font-bold">SAIR</span>
            </button>
          </form>
        </div>
      </nav>
    </div>
  )
}
