'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { minutesToHours } from '@/lib/utils'
import ReportExport from './ReportExport'
import { Clock, CheckCircle2, XCircle, Search, BarChart2, AlertCircle, Download, Printer, ChevronDown, CalendarDays } from 'lucide-react'
import DatePicker from '@/components/ui/DatePicker'
import AnimatedNumber from '@/components/ui/AnimatedNumber'
import AnimatedBar from '@/components/ui/AnimatedBar'
import { HoverLift } from '@/components/ui/MotionWrappers'

/* ── Custom animated month dropdown ── */
function MonthDropdown({
  value,
  options,
  onChange,
}: {
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const selected = options.find(o => o.value === value)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Scroll selected item into view when opening
  useEffect(() => {
    if (open && listRef.current) {
      const activeEl = listRef.current.querySelector('[data-active="true"]') as HTMLElement
      if (activeEl) {
        setTimeout(() => activeEl.scrollIntoView({ block: 'center', behavior: 'smooth' }), 80)
      }
    }
  }, [open])

  return (
    <div ref={ref} className="relative" style={{ minWidth: 200 }}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all focus:outline-none"
        style={{
          background: open ? 'rgba(63,229,108,0.10)' : 'var(--surface-card, #0f2318)',
          border: `1px solid ${open ? 'rgba(63,229,108,0.40)' : 'rgba(0,200,83,0.20)'}`,
          color: 'var(--text)',
          boxShadow: open ? '0 0 0 3px rgba(63,229,108,0.08)' : 'none',
        }}
      >
        <div className="flex items-center gap-2">
          <CalendarDays size={14} style={{ color: '#3fe56c', flexShrink: 0 }} />
          <span className="capitalize font-semibold">{selected?.label ?? 'Selecionar'}</span>
        </div>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2, ease: 'easeInOut' }}>
          <ChevronDown size={14} style={{ color: 'var(--text-3)' }} />
        </motion.span>
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute z-50 left-0 mt-1.5 w-full rounded-xl overflow-hidden"
            style={{
              background: 'var(--surface-card, #0f2318)',
              border: '1px solid rgba(63,229,108,0.25)',
              boxShadow: '0 16px 48px rgba(0,0,0,0.55)',
            }}
          >
            <div
              ref={listRef}
              className="overflow-y-auto py-1"
              style={{ maxHeight: 280, scrollbarWidth: 'thin', scrollbarColor: 'rgba(63,229,108,0.2) transparent' }}
            >
              {options.map((opt, i) => {
                const isSelected = opt.value === value
                return (
                  <motion.button
                    key={opt.value}
                    data-active={isSelected}
                    type="button"
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(i * 0.018, 0.25), duration: 0.15 }}
                    onClick={() => { onChange(opt.value); setOpen(false) }}
                    className="w-full text-left px-4 py-2.5 text-sm flex items-center justify-between gap-2 transition-colors"
                    style={{
                      color: isSelected ? '#3fe56c' : 'var(--text-2)',
                      background: isSelected ? 'rgba(63,229,108,0.10)' : 'transparent',
                      fontWeight: isSelected ? 700 : 400,
                      borderLeft: isSelected ? '2px solid #3fe56c' : '2px solid transparent',
                    }}
                    onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'rgba(63,229,108,0.05)' }}
                    onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                  >
                    <span className="capitalize">{opt.label}</span>
                    {isSelected && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                      >
                        <CheckCircle2 size={13} style={{ color: '#3fe56c', flexShrink: 0 }} />
                      </motion.span>
                    )}
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

type PeriodType = 'daily' | 'weekly' | 'monthly' | 'custom'

interface InternRow {
  id: string
  full_name: string
  email: string
  course: string | null
  nickname: string | null
  total_minutes: number
  total_sessions: number
  approved_sessions: number
  pending_sessions: number
  rejected_sessions: number
}

interface ReportData {
  interns: InternRow[]
  startDate: string
  endDate: string
  label: string
  type: PeriodType
}

function getTodayStr() { return new Date().toISOString().slice(0, 10) }
function getCurrentMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}
function getWeekStart(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00Z')
  const day = d.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setUTCDate(d.getUTCDate() + diff)
  return d.toISOString().slice(0, 10)
}

/* ── Initials avatar ── */
function InternAvatar({ name, color }: { name: string; color: string }) {
  const initials = name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
  return (
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
      style={{ background: color + '30', color }}
    >
      {initials}
    </div>
  )
}

/* ── Activity bar mini-chart (animated) ── */
function ActivityBars({ approved, total }: { approved: number; total: number }) {
  const bars = [0.4, 0.6, 1, 0.5, 0.8]
  const pct = total > 0 ? approved / total : 0
  return (
    <div className="flex items-end gap-0.5 justify-end">
      {bars.map((h, i) => (
        <motion.div
          key={i}
          className="w-1.5 rounded-full"
          initial={{ scaleY: 0, originY: 1 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: 0.1 + i * 0.06, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          style={{
            height: `${h * 32}px`,
            background: pct > 0.7 ? '#3fe56c' : pct > 0.3 ? '#fbbf24' : '#ff5252',
            opacity: pct > 0.7 ? (0.4 + i * 0.15) : pct > 0.3 ? (0.3 + i * 0.12) : (0.3 + i * 0.1),
            transformOrigin: 'bottom',
          }}
        />
      ))}
    </div>
  )
}

const AVATAR_COLORS = ['#3fe56c', '#48e1a6', '#95d69a', '#00c853', '#22d3ee', '#a78bfa', '#f97316', '#fbbf24']

export default function ReportsClient() {
  const [periodType, setPeriodType] = useState<PeriodType>('monthly')
  const [dailyDate, setDailyDate]   = useState(getTodayStr())
  const [weeklyDate, setWeeklyDate] = useState(getTodayStr())
  const [month, setMonth]           = useState(getCurrentMonth())
  const [customStart, setCustomStart] = useState(getTodayStr())
  const [customEnd, setCustomEnd]     = useState(getTodayStr())

  const [data, setData]       = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [applied, setApplied] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)

  const monthOptions = Array.from({ length: 24 }, (_, i) => {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - i)
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    return { value: val, label }
  })

  const buildUrl = useCallback(() => {
    const params = new URLSearchParams({ type: periodType })
    if (periodType === 'daily')   params.set('date', dailyDate)
    if (periodType === 'weekly')  params.set('date', weeklyDate)
    if (periodType === 'monthly') params.set('month', month)
    if (periodType === 'custom')  { params.set('start', customStart); params.set('end', customEnd) }
    return `/api/admin/report-data?${params}`
  }, [periodType, dailyDate, weeklyDate, month, customStart, customEnd])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(buildUrl())
      if (!res.ok) throw new Error('Erro ao carregar dados')
      const json: ReportData = await res.json()
      setData(json)
      setApplied(true)
    } catch {
      setError('Não foi possível carregar o relatório. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }, [buildUrl])

  useEffect(() => { fetchData() }, []) // eslint-disable-line

  const totalMinutes  = data?.interns.reduce((a, i) => a + i.total_minutes, 0) ?? 0
  const totalApproved = data?.interns.reduce((a, i) => a + i.approved_sessions, 0) ?? 0
  const totalSessions = data?.interns.reduce((a, i) => a + i.total_sessions, 0) ?? 0
  const totalRejected = data?.interns.reduce((a, i) => a + i.rejected_sessions, 0) ?? 0

  const exportData = data?.interns.map(i => ({
    nome: i.full_name,
    apelido: i.nickname ?? '',
    email: i.email,
    curso: i.course ?? '',
    total_horas: minutesToHours(i.total_minutes),
    sessoes: i.total_sessions,
    aprovados: i.approved_sessions,
    reprovados: i.rejected_sessions,
  })) ?? []

  const weekStart = getWeekStart(weeklyDate)
  const weekEnd = (() => {
    const d = new Date(weekStart + 'T12:00:00Z')
    d.setUTCDate(d.getUTCDate() + 6)
    return d.toISOString().slice(0, 10)
  })()

  const periodLabels: Record<PeriodType, string> = {
    daily: 'Diário', weekly: 'Semanal', monthly: 'Mensal', custom: 'Personalizado',
  }

  return (
    <div className="flex flex-col flex-1 min-h-0" style={{ background: 'var(--bg)' }}>
      <style>{`@media print { .no-print { display: none !important; } body { background: white !important; } }`}</style>

      {/* ── TopAppBar ── */}
      <header
        className="no-print flex items-center justify-between px-4 sm:px-6 h-14 sm:h-16 flex-shrink-0"
        style={{ background: 'var(--bg)', borderBottom: '1px solid rgba(0,200,83,0.15)' }}
      >
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-semibold" style={{ color: 'var(--text)' }}>Relatórios</h2>
          <div className="hidden md:block h-5 w-px" style={{ background: 'rgba(0,200,83,0.20)' }} />
          <div
            className="hidden md:flex items-center rounded-full px-4 py-1.5"
            style={{ background: 'var(--surface-card, #0f2318)', border: '1px solid rgba(0,200,83,0.15)' }}
          >
            <Search size={15} style={{ color: 'var(--text-3)', marginRight: 8 }} />
            <input
              readOnly
              placeholder="Pesquisar estagiários ou projetos..."
              className="bg-transparent border-none outline-none text-sm w-52"
              style={{ color: 'var(--text-3)' }}
            />
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-4 sm:p-6 space-y-6 sm:space-y-8" style={{ maxWidth: 1400, margin: '0 auto' }}>

          {/* ── Filters & export row ── */}
          <section className="no-print flex flex-col gap-4">
            <div className="space-y-3">
              <p className="text-[10px] font-bold tracking-widest" style={{ color: 'var(--text-3)' }}>
                PERÍODO DO RELATÓRIO
              </p>

              {/* Period type tabs - contained group */}
              <div
                className="flex p-1 rounded-lg overflow-x-auto"
                style={{ background: 'var(--surface-card, #0f2318)', border: '1px solid rgba(0,200,83,0.15)', scrollbarWidth: 'none' }}
              >
                {(['daily', 'weekly', 'monthly', 'custom'] as PeriodType[]).map(t => (
                  <button
                    key={t}
                    onClick={() => setPeriodType(t)}
                    className="px-3 sm:px-5 py-2 text-xs sm:text-sm font-medium rounded-md transition-all whitespace-nowrap flex-shrink-0"
                    style={periodType === t
                      ? { background: 'rgba(0,200,83,0.20)', color: '#84c48a', fontWeight: 700 }
                      : { color: 'var(--text-3)' }
                    }
                  >
                    {periodLabels[t]}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-end gap-3">
              {/* Period-specific picker */}
              <div className="flex flex-col gap-1.5">
                {periodType !== 'custom' && (
                  <label className="text-[11px]" style={{ color: 'var(--text-3)' }}>Seleção</label>
                )}

                {periodType === 'daily' && (
                  <DatePicker value={dailyDate} onChange={v => setDailyDate(v || getTodayStr())} placeholder="Selecionar data" />
                )}
                {periodType === 'weekly' && (
                  <div>
                    <DatePicker value={weeklyDate} onChange={v => setWeeklyDate(v || getTodayStr())} placeholder="Qualquer dia da semana" />
                    {weeklyDate && (
                      <p className="text-xs mt-1 font-medium" style={{ color: 'var(--primary)' }}>
                        {new Date(weekStart + 'T12:00:00Z').toLocaleDateString('pt-BR')} — {new Date(weekEnd + 'T12:00:00Z').toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                )}
                {periodType === 'monthly' && (
                  <MonthDropdown
                    value={month}
                    options={monthOptions}
                    onChange={setMonth}
                  />
                )}
                {periodType === 'custom' && (
                  <div className="flex gap-2">
                    <div>
                      <label className="text-[11px] mb-1 block" style={{ color: 'var(--text-3)' }}>Data inicial</label>
                      <DatePicker value={customStart} onChange={v => setCustomStart(v || getTodayStr())} placeholder="Início" />
                    </div>
                    <div>
                      <label className="text-[11px] mb-1 block" style={{ color: 'var(--text-3)' }}>Data final</label>
                      <DatePicker value={customEnd} onChange={v => setCustomEnd(v || getTodayStr())} min={customStart} placeholder="Fim" />
                    </div>
                  </div>
                )}
              </div>

              {/* Export buttons — outline style matching reference */}
              <div className="flex items-center gap-2 mt-auto py-2 -my-2 px-1 -mx-1 flex-wrap" style={{ scrollbarWidth: 'none' }}>
                <button
                  onClick={async () => {
                    if (!exportData.length) return
                    const XLSX = await import('xlsx')
                    const wsData = [
                      [`Relatório de Horas — ${data?.label}`],
                      [],
                      ['Nome', 'Apelido', 'E-mail', 'Curso', 'Total Horas', 'Sessões', 'Aprovadas', 'Reprovadas'],
                      ...exportData.map(r => [r.nome, r.apelido, r.email, r.curso, r.total_horas, r.sessoes, r.aprovados, r.reprovados]),
                    ]
                    const ws = XLSX.utils.aoa_to_sheet(wsData)
                    ws['!cols'] = [{ wch: 28 }, { wch: 16 }, { wch: 28 }, { wch: 20 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 10 }]
                    const wb = XLSX.utils.book_new()
                    XLSX.utils.book_append_sheet(wb, ws, 'Relatório')
                    XLSX.writeFile(wb, `relatorio-${(data?.label ?? 'dados').replace(/\//g, '-')}.xlsx`)
                  }}
                  disabled={!data || data.interns.length === 0}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-all disabled:opacity-40 hover:opacity-80"
                  style={{
                    background: 'rgba(149,214,154,0.08)',
                    border: '1px solid #95d69a',
                    color: '#95d69a',
                  }}
                >
                  <Download size={16} /> Excel
                </button>
                <button
                  onClick={() => window.print()}
                  disabled={!data}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-all disabled:opacity-40 hover:opacity-80"
                  style={{
                    background: 'rgba(255,82,82,0.08)',
                    border: '1px solid #ff5252',
                    color: '#ff5252',
                  }}
                >
                  <Printer size={16} /> PDF
                </button>
              </div>

              {/* Apply button */}
              <button
                onClick={fetchData}
                disabled={loading}
                className="mt-auto px-6 py-2.5 rounded-lg text-sm font-bold disabled:opacity-60 flex items-center gap-2"
                style={{ background: '#3fe56c', color: '#003912' }}
              >
                {loading
                  ? <><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" /> Carregando...</>
                  : <><Search size={14} /> Aplicar</>
                }
              </button>
            </div>
          </section>

          {/* Error */}
          {error && (
            <div className="text-sm rounded-xl px-4 py-3 flex items-center gap-2"
              style={{ background: 'rgba(255,82,82,0.08)', border: '1px solid rgba(255,82,82,0.25)', color: '#ff5252' }}>
              <AlertCircle size={14} /> {error}
              <button onClick={fetchData} className="ml-auto underline hover:opacity-70">Tentar novamente</button>
            </div>
          )}

          {/* ── Summary metric cards with ghost icons ── */}
          <AnimatePresence>
            {(data || loading) && (
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
              >
                {[
                  { label: 'Total de Horas',  numValue: null,          strValue: loading ? '—' : minutesToHours(totalMinutes), color: '#3fe56c',      icon: <Clock        size={100} />, barPct: Math.min(100, totalMinutes / 6) },
                  { label: 'Sessões',         numValue: totalSessions, strValue: null,                                          color: 'var(--text)',  icon: <BarChart2    size={100} />, barPct: Math.min(100, totalSessions * 12) },
                  { label: 'Aprovados',       numValue: totalApproved, strValue: null,                                          color: '#00c853',      icon: <CheckCircle2 size={100} />, barPct: totalSessions > 0 ? Math.round(totalApproved / totalSessions * 100) : 0 },
                  { label: 'Rejeitados',      numValue: totalRejected, strValue: null,                                          color: '#ff5252',      icon: <XCircle      size={100} />, barPct: totalSessions > 0 ? Math.round(totalRejected / totalSessions * 100) : 0 },
                ].map((card, i) => (
                  <motion.div
                    key={card.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                  >
                  <HoverLift>
                    <div
                      className="rounded-xl p-6 relative overflow-hidden group transition-all duration-300 h-full"
                      style={{
                        background: '#0f2318',
                        border: '1px solid rgba(0,200,83,0.18)',
                      }}
                    >
                      {/* Ghost watermark icon */}
                      <div className="absolute -right-4 -bottom-4 opacity-[0.05] pointer-events-none transition-opacity group-hover:opacity-[0.09]"
                        style={{ color: card.color }}>
                        {card.icon}
                      </div>
                      <p className="text-[10px] font-bold tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        {card.label.toUpperCase()}
                      </p>
                      <div className="flex items-baseline gap-2">
                        {loading ? (
                          <span className="text-4xl font-bold" style={{ color: card.color }}>—</span>
                        ) : card.strValue !== null ? (
                          <span className="text-4xl font-bold tabular-nums" style={{ color: card.color }}>{card.strValue}</span>
                        ) : (
                          <AnimatedNumber
                            value={card.numValue ?? 0}
                            className="text-4xl font-bold leading-none tabular-nums"
                            style={{ color: card.numValue === 0 ? 'rgba(255,255,255,0.7)' : card.color }}
                          />
                        )}
                      </div>
                      <div className="mt-4">
                        <AnimatedBar pct={loading ? 0 : card.barPct} color={card.color} height={4} />
                      </div>
                    </div>
                  </HoverLift>
                  </motion.div>
                ))}
              </motion.section>
            )}
          </AnimatePresence>

          {/* ── Data table ── */}
          {data && !loading && (
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-xl overflow-hidden"
              style={{ background: 'rgba(15,35,24,0.7)', border: '1px solid rgba(0,200,83,0.15)' }}
            >
              {/* Table header */}
              <div
                className="p-6 flex items-center justify-between"
                style={{ borderBottom: '1px solid rgba(0,200,83,0.12)', background: 'rgba(0,0,0,0.15)' }}
              >
                <h3 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>
                  Matriz de Desempenho de Estagiários
                </h3>
                <div className="flex gap-2">
                  <button className="p-2 rounded-lg transition-colors hover:opacity-70">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-3)' }}>
                      <line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="14" y2="12"/><line x1="4" y1="18" x2="9" y2="18"/>
                    </svg>
                  </button>
                </div>
              </div>

              {data.interns.length > 0 ? (
                <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr style={{ background: 'rgba(0,0,0,0.20)', borderBottom: '1px solid rgba(0,200,83,0.12)' }}>
                        {['Estagiário', 'Horas', 'Sessões', 'Aprovados', 'Rejeitados', 'Atividade'].map(h => (
                          <th key={h} className="px-6 py-4 text-[10px] font-semibold tracking-widest" style={{ color: 'var(--text-3)' }}>
                            {h.toUpperCase()}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody style={{ borderTop: 'none' }}>
                      {data.interns.map((intern, i) => {
                        const color = AVATAR_COLORS[i % AVATAR_COLORS.length]
                        const handle = intern.nickname
                          ? `@${intern.nickname.toLowerCase().replace(/\s+/g, '_')}`
                          : `@${intern.full_name.toLowerCase().split(' ')[0]}`
                        return (
                          <motion.tr
                            key={intern.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.04 }}
                            className="group transition-colors"
                            style={{ borderBottom: '1px solid rgba(0,200,83,0.07)' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(63,229,108,0.04)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          >
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-4">
                                <InternAvatar name={intern.full_name} color={color} />
                                <div>
                                  <p className="text-sm font-bold transition-colors group-hover:text-green-400" style={{ color: 'var(--text)' }}>
                                    {intern.full_name}
                                  </p>
                                  <p className="text-[11px]" style={{ color: 'var(--text-3)' }}>
                                    {handle}{intern.course ? ` • ${intern.course}` : ''}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                                {intern.total_minutes > 0 ? minutesToHours(intern.total_minutes) : '—'}
                              </p>
                            </td>
                            <td className="px-6 py-5 text-sm font-medium" style={{ color: 'var(--text-2)' }}>
                              {intern.total_sessions || '—'}
                            </td>
                            <td className="px-6 py-5">
                              {intern.approved_sessions > 0
                                ? <span className="px-3 py-1 rounded-full text-[11px] font-bold"
                                    style={{ background: 'rgba(0,200,83,0.10)', border: '1px solid rgba(0,200,83,0.30)', color: '#00c853' }}>
                                    {intern.approved_sessions}
                                  </span>
                                : <span style={{ color: 'var(--text-3)' }}>—</span>
                              }
                            </td>
                            <td className="px-6 py-5">
                              {intern.rejected_sessions > 0
                                ? <span className="px-3 py-1 rounded-full text-[11px] font-bold"
                                    style={{ background: 'rgba(255,82,82,0.10)', border: '1px solid rgba(255,82,82,0.30)', color: '#ff5252' }}>
                                    {intern.rejected_sessions}
                                  </span>
                                : <span style={{ color: 'var(--text-3)' }}>—</span>
                              }
                            </td>
                            <td className="px-6 py-5 text-right">
                              <ActivityBars
                                approved={intern.approved_sessions}
                                total={intern.total_sessions}
                              />
                            </td>
                          </motion.tr>
                        )
                      })}
                    </tbody>
                  </table>

                  {/* Pagination footer */}
                  <div
                    className="px-6 py-4 flex items-center justify-between"
                    style={{ borderTop: '1px solid rgba(0,200,83,0.10)', background: 'rgba(0,0,0,0.10)' }}
                  >
                    <span className="text-xs" style={{ color: 'var(--text-3)' }}>
                      Mostrando 1–{data.interns.length} de {data.interns.length} estagiários
                    </span>
                    <div className="flex gap-2">
                      <button
                        disabled
                        className="px-4 py-1.5 rounded-lg text-xs font-medium disabled:opacity-40"
                        style={{ border: '1px solid rgba(0,200,83,0.15)', color: 'var(--text-3)' }}
                      >
                        Anterior
                      </button>
                      <button
                        disabled
                        className="px-4 py-1.5 rounded-lg text-xs font-medium disabled:opacity-40"
                        style={{ border: '1px solid rgba(0,200,83,0.15)', color: 'var(--text-3)' }}
                      >
                        Próximo
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center">
                  <BarChart2 size={48} className="mx-auto mb-4" style={{ color: 'var(--text-3)', opacity: 0.35 }} />
                  <p className="font-semibold text-base mb-1" style={{ color: 'var(--text)' }}>Nenhum dado encontrado</p>
                  <p className="text-sm" style={{ color: 'var(--text-3)' }}>Não há registros para o período selecionado.</p>
                </div>
              )}
            </motion.section>
          )}

          {/* Initial state */}
          {!data && !loading && !error && (
            <div className="py-20 text-center">
              <Search size={48} className="mx-auto mb-4" style={{ color: 'var(--text-3)', opacity: 0.35 }} />
              <p className="font-semibold text-base mb-1" style={{ color: 'var(--text)' }}>Selecione um período</p>
              <p className="text-sm" style={{ color: 'var(--text-3)' }}>Configure o filtro acima e clique em Aplicar.</p>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
