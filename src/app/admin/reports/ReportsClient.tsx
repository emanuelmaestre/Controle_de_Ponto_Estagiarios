'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Download, FileText, Users, BarChart2, Trophy,
  CheckCircle2, AlertCircle, ChevronDown, CalendarDays,
} from 'lucide-react'
import { exportPDF } from '@/lib/pdfExport'

// ── Types ──────────────────────────────────────────────────────────────────────
type Category = 'intern' | 'general' | 'ranking'
type PeriodType = 'monthly' | 'weekly' | 'daily' | 'custom'

function getCurrentMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

const monthOptions = Array.from({ length: 24 }, (_, i) => {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() - i)
  const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  return { value: val, label }
})

// ── Report definitions ─────────────────────────────────────────────────────────
interface ReportDef {
  id: string
  category: Category
  emoji: string
  color: string
  title: string
  desc: string
  needsIntern?: boolean
  availablePeriods: PeriodType[]
}

const REPORTS: ReportDef[] = [
  // Por Estagiário
  {
    id: 'attendance', category: 'intern', emoji: '📅', color: '#3fe56c',
    title: 'Frequência Individual', desc: 'Todos os registros de entrada e saída do estagiário no período.',
    needsIntern: true, availablePeriods: ['monthly', 'weekly', 'daily', 'custom'],
  },
  {
    id: 'hours', category: 'intern', emoji: '⏱️', color: '#22d3ee',
    title: 'Horas Trabalhadas', desc: 'Total de horas aprovadas, sessões e médias por dia.',
    needsIntern: true, availablePeriods: ['monthly', 'weekly', 'custom'],
  },
  {
    id: 'punctuality', category: 'intern', emoji: '⏰', color: '#f97316',
    title: 'Pontualidade', desc: 'Índice de pontualidade, atrasos e registros no período.',
    needsIntern: true, availablePeriods: ['monthly', 'weekly', 'custom'],
  },
  {
    id: 'activities', category: 'intern', emoji: '📋', color: '#a78bfa',
    title: 'Atividades Realizadas', desc: 'Lista de todas as atividades documentadas pelo estagiário.',
    needsIntern: true, availablePeriods: ['monthly', 'weekly', 'custom'],
  },
  {
    id: 'sheet', category: 'intern', emoji: '🗂️', color: '#fbbf24',
    title: 'Ficha Completa', desc: 'Dados cadastrais, histórico e resumo completo do estágio.',
    needsIntern: true, availablePeriods: ['monthly', 'custom'],
  },
  {
    id: 'workload', category: 'intern', emoji: '📊', color: '#48e1a6',
    title: 'Carga Horária Restante', desc: 'Horas cumpridas vs. total da carga horária do estágio.',
    needsIntern: true, availablePeriods: ['monthly', 'custom'],
  },
  // Geral
  {
    id: 'summary', category: 'general', emoji: '📈', color: '#3fe56c',
    title: 'Resumo Mensal Geral', desc: 'Visão consolidada de todos os estagiários no período.',
    availablePeriods: ['monthly', 'weekly', 'custom'],
  },
  {
    id: 'daily_log', category: 'general', emoji: '🗓️', color: '#22d3ee',
    title: 'Diário de Ponto', desc: 'Relatório diário com entradas e saídas de todos.',
    availablePeriods: ['daily', 'weekly'],
  },
  {
    id: 'by_course', category: 'general', emoji: '🎓', color: '#a78bfa',
    title: 'Horas por Curso', desc: 'Comparativo de horas trabalhadas agrupado por curso.',
    availablePeriods: ['monthly', 'custom'],
  },
  {
    id: 'ending_soon', category: 'general', emoji: '⚠️', color: '#fbbf24',
    title: 'Próximos do Encerramento', desc: 'Estagiários com carga horária próxima do limite.',
    availablePeriods: ['monthly'],
  },
  // Ranking
  {
    id: 'ranking_full', category: 'ranking', emoji: '🏆', color: '#fbbf24',
    title: 'Ranking Completo', desc: 'Classificação geral de todos os estagiários por pontos.',
    availablePeriods: ['monthly'],
  },
  {
    id: 'ranking_punctuality', category: 'ranking', emoji: '⏰', color: '#3fe56c',
    title: 'Ranking de Pontualidade', desc: 'Quem mais chegou no horário no período.',
    availablePeriods: ['monthly', 'custom'],
  },
  {
    id: 'ranking_activities', category: 'ranking', emoji: '📋', color: '#22d3ee',
    title: 'Ranking de Atividades', desc: 'Quem mais documentou atividades no período.',
    availablePeriods: ['monthly', 'custom'],
  },
  {
    id: 'hall_of_fame', category: 'ranking', emoji: '👑', color: '#a78bfa',
    title: 'Hall da Fama', desc: 'Os melhores de todos os tempos — conquistas e recordes.',
    availablePeriods: ['monthly'],
  },
]

const CATEGORIES = [
  { key: 'intern'   as Category, label: 'Por Estagiário', icon: <Users size={14} /> },
  { key: 'general'  as Category, label: 'Geral',          icon: <BarChart2 size={14} /> },
  { key: 'ranking'  as Category, label: 'Ranking',        icon: <Trophy size={14} /> },
]

// ── Intern selector ────────────────────────────────────────────────────────────
interface InternOption { id: string; full_name: string }

function InternSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [interns, setInterns] = useState<InternOption[]>([])
  const [open, setOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const load = async () => {
    if (loaded) { setOpen(o => !o); return }
    const res = await fetch('/api/admin/report-data?type=monthly')
    const json = await res.json()
    setInterns(json.interns ?? [])
    setLoaded(true)
    setOpen(true)
  }

  const selected = interns.find(i => i.id === value)

  return (
    <div className="relative">
      <button
        type="button" onClick={load}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all w-full"
        style={{
          background: value ? 'rgba(63,229,108,0.1)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${value ? 'rgba(63,229,108,0.3)' : 'rgba(255,255,255,0.08)'}`,
          color: value ? '#3fe56c' : 'rgba(255,255,255,0.4)',
        }}
      >
        <Users size={11} />
        <span className="flex-1 text-left truncate">{selected?.full_name ?? 'Selecionar estagiário'}</span>
        <ChevronDown size={11} />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute z-50 top-full mt-1 left-0 w-56 rounded-xl overflow-hidden"
              style={{
                background: '#0b1d12', border: '1px solid rgba(63,229,108,0.2)',
                boxShadow: '0 16px 48px rgba(0,0,0,0.6)', maxHeight: 220, overflowY: 'auto',
              }}
            >
              {interns.map(intern => (
                <button key={intern.id} type="button"
                  onClick={() => { onChange(intern.id); setOpen(false) }}
                  className="w-full text-left px-3 py-2.5 text-xs transition-colors"
                  style={{
                    color: intern.id === value ? '#3fe56c' : 'rgba(255,255,255,0.6)',
                    background: intern.id === value ? 'rgba(63,229,108,0.08)' : 'transparent',
                    fontWeight: intern.id === value ? 700 : 400,
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(63,229,108,0.05)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = intern.id === value ? 'rgba(63,229,108,0.08)' : 'transparent' }}
                >
                  {intern.full_name}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Month select compact ───────────────────────────────────────────────────────
function MonthSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const selected = monthOptions.find(o => o.value === value)

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all w-full"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}
      >
        <CalendarDays size={11} style={{ color: '#3fe56c' }} />
        <span className="flex-1 text-left capitalize">{selected?.label ?? 'Mês'}</span>
        <ChevronDown size={11} />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}
              className="absolute z-50 top-full mt-1 left-0 w-48 rounded-xl overflow-hidden"
              style={{
                background: '#0b1d12', border: '1px solid rgba(63,229,108,0.2)',
                boxShadow: '0 16px 48px rgba(0,0,0,0.6)', maxHeight: 220, overflowY: 'auto',
              }}
            >
              {monthOptions.map(opt => (
                <button key={opt.value} type="button"
                  onClick={() => { onChange(opt.value); setOpen(false) }}
                  className="w-full text-left px-3 py-2.5 text-xs capitalize transition-colors"
                  style={{
                    color: opt.value === value ? '#3fe56c' : 'rgba(255,255,255,0.6)',
                    background: opt.value === value ? 'rgba(63,229,108,0.08)' : 'transparent',
                    fontWeight: opt.value === value ? 700 : 400,
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(63,229,108,0.05)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = opt.value === value ? 'rgba(63,229,108,0.08)' : 'transparent' }}
                >
                  {opt.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Report Card ────────────────────────────────────────────────────────────────
function ReportCard({ report, index }: { report: ReportDef; index: number }) {
  const [month, setMonth] = useState(getCurrentMonth())
  const [internId, setInternId] = useState('')
  const [loadingExcel, setLoadingExcel] = useState(false)
  const [loadingPdf, setLoadingPdf] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const buildUrl = () => {
    const p = new URLSearchParams({ report: report.id, month })
    if (report.needsIntern && internId) p.set('internId', internId)
    return `/api/admin/reports-catalog?${p}`
  }

  const fetchData = async () => {
    const res = await fetch(buildUrl())
    if (!res.ok) throw new Error('Erro ao carregar dados')
    return res.json()
  }

  const handleExcel = async () => {
    if (report.needsIntern && !internId) { setError('Selecione um estagiário'); return }
    setLoadingExcel(true); setError('')
    try {
      const data = await fetchData()
      const XLSX = await import('xlsx')
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(data.rows ?? [])
      XLSX.utils.book_append_sheet(wb, ws, 'Dados')
      const period = monthOptions.find(o => o.value === month)?.label ?? month
      XLSX.writeFile(wb, `${report.title.toLowerCase().replace(/\s+/g, '-')}-${period}.xlsx`)
      setSuccess('Excel gerado!'); setTimeout(() => setSuccess(''), 2500)
    } catch { setError('Erro ao gerar Excel') }
    finally { setLoadingExcel(false) }
  }

  const handlePdf = async () => {
    if (report.needsIntern && !internId) { setError('Selecione um estagiário'); return }
    setLoadingPdf(true); setError('')
    try {
      const data = await fetchData()
      const period = monthOptions.find(o => o.value === month)?.label ?? month
      await exportPDF({
        title: report.title, subtitle: data.internName ?? undefined,
        period, columns: data.columns ?? [], rows: data.rows ?? [],
      })
      setSuccess('PDF gerado!'); setTimeout(() => setSuccess(''), 2500)
    } catch { setError('Erro ao gerar PDF') }
    finally { setLoadingPdf(false) }
  }

  const isLoading = loadingExcel || loadingPdf

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.05, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="rounded-2xl p-5 flex flex-col gap-4 relative overflow-hidden group cursor-default"
      style={{ background: 'rgba(15,35,24,0.85)', border: `1px solid ${report.color}22` }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 32px ${report.color}18` }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
    >
      {/* Glow bg */}
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: report.color, opacity: 0 }} />

      {/* Ghost watermark */}
      <div className="absolute -bottom-4 -right-4 text-7xl opacity-[0.04] pointer-events-none select-none group-hover:opacity-[0.07] transition-opacity">
        {report.emoji}
      </div>

      {/* Header */}
      <div className="flex items-start gap-3">
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 6, repeat: Infinity, delay: index * 0.4 }}
          className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{ background: `${report.color}18`, border: `1px solid ${report.color}35` }}
        >
          {report.emoji}
        </motion.div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black leading-tight" style={{ color: 'rgba(255,255,255,0.92)' }}>
            {report.title}
          </p>
          <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {report.desc}
          </p>
        </div>
      </div>

      {/* Selectors */}
      <div className="space-y-2">
        {report.needsIntern && <InternSelect value={internId} onChange={setInternId} />}
        <MonthSelect value={month} onChange={setMonth} />
      </div>

      {/* Feedback */}
      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="text-[10px] font-bold flex items-center gap-1" style={{ color: '#ff5252' }}>
            <AlertCircle size={10} /> {error}
          </motion.p>
        )}
        {success && (
          <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="text-[10px] font-bold flex items-center gap-1" style={{ color: '#3fe56c' }}>
            <CheckCircle2 size={10} /> {success}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Buttons */}
      <div className="flex gap-2 mt-auto">
        <button onClick={handleExcel} disabled={isLoading}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black transition-all disabled:opacity-40 hover:brightness-110"
          style={{ background: 'rgba(149,214,154,0.08)', border: '1px solid rgba(149,214,154,0.35)', color: '#95d69a' }}
        >
          {loadingExcel
            ? <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
            : <Download size={12} />}
          Excel
        </button>
        <button onClick={handlePdf} disabled={isLoading}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black transition-all disabled:opacity-40 hover:brightness-110"
          style={{ background: 'rgba(255,82,82,0.08)', border: '1px solid rgba(255,82,82,0.35)', color: '#ff8a80' }}
        >
          {loadingPdf
            ? <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
            : <FileText size={12} />}
          PDF
        </button>
      </div>
    </motion.div>
  )
}

// ── Stats strip ────────────────────────────────────────────────────────────────
function StatsStrip() {
  const stats = [
    { icon: <FileText size={15} />, label: 'Tipos de relatório', value: String(REPORTS.length),                                          color: '#3fe56c' },
    { icon: <Users size={15} />,    label: 'Por estagiário',     value: String(REPORTS.filter(r => r.category === 'intern').length),     color: '#22d3ee' },
    { icon: <BarChart2 size={15} />,label: 'Gerais',             value: String(REPORTS.filter(r => r.category === 'general').length),    color: '#a78bfa' },
    { icon: <Trophy size={15} />,   label: 'Ranking',            value: String(REPORTS.filter(r => r.category === 'ranking').length),    color: '#fbbf24' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map((s, i) => (
        <motion.div key={s.label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.07, type: 'spring', stiffness: 280, damping: 22 }}
          className="flex items-center gap-3 rounded-xl px-4 py-3"
          style={{ background: 'rgba(15,35,24,0.7)', border: `1px solid ${s.color}18` }}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: `${s.color}15`, color: s.color }}>
            {s.icon}
          </div>
          <div>
            <p className="text-lg font-black leading-none" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[9px] mt-0.5 font-bold" style={{ color: 'rgba(255,255,255,0.3)' }}>{s.label}</p>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ReportsClient() {
  const [activeCategory, setActiveCategory] = useState<Category>('intern')

  const filtered = REPORTS.filter(r => r.category === activeCategory)

  const categoryMeta = {
    intern:  { emoji: '👤', title: 'Relatórios Individuais',  desc: 'Selecione o estagiário e o período para gerar o relatório individual.' },
    general: { emoji: '📊', title: 'Relatórios Gerais',       desc: 'Visão consolidada de todos os estagiários. Selecione o período desejado.' },
    ranking: { emoji: '🏆', title: 'Relatórios de Ranking',   desc: 'Classificações e conquistas. Aberto para estagiários e administradores.' },
  }

  return (
    <div className="flex flex-col flex-1 min-h-0" style={{ background: 'var(--bg)' }}>

      {/* ── Header ── */}
      <header
        className="flex items-center gap-4 px-4 sm:px-6 h-14 sm:h-16 flex-shrink-0"
        style={{ background: 'var(--bg)', borderBottom: '1px solid rgba(0,200,83,0.15)' }}
      >
        <motion.div
          animate={{ rotate: [0, 8, -8, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
          style={{ background: 'rgba(0,200,83,0.12)', border: '1px solid rgba(0,200,83,0.25)' }}
        >
          📊
        </motion.div>
        <div>
          <h2 className="text-xl font-black" style={{ color: 'var(--text)' }}>Relatórios</h2>
          <p className="text-[10px] font-bold" style={{ color: 'var(--text-3)' }}>
            {REPORTS.length} relatórios · Excel e PDF com identidade visual
          </p>
        </div>
      </header>

      {/* ── Content ── */}
      <main className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-4 sm:p-6 space-y-6" style={{ maxWidth: 1200, margin: '0 auto' }}>

          <StatsStrip />

          {/* ── Category tabs ── */}
          <div
            className="flex p-1 rounded-xl overflow-x-auto"
            style={{ background: 'rgba(15,35,24,0.7)', border: '1px solid rgba(0,200,83,0.12)', scrollbarWidth: 'none' }}
          >
            {CATEGORIES.map(cat => {
              const isActive = activeCategory === cat.key
              return (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className="relative flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-lg text-xs sm:text-sm font-black whitespace-nowrap flex-shrink-0 transition-colors"
                  style={isActive ? { color: '#3fe56c' } : { color: 'rgba(255,255,255,0.35)' }}
                >
                  {isActive && (
                    <motion.div layoutId="tab-bg"
                      className="absolute inset-0 rounded-lg"
                      style={{ background: 'rgba(63,229,108,0.12)' }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    {cat.icon} {cat.label}
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-black"
                      style={{
                        background: isActive ? 'rgba(63,229,108,0.2)' : 'rgba(255,255,255,0.05)',
                        color: isActive ? '#3fe56c' : 'rgba(255,255,255,0.2)',
                      }}>
                      {REPORTS.filter(r => r.category === cat.key).length}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>

          {/* ── Cards ── */}
          <AnimatePresence mode="wait">
            <motion.div key={activeCategory}
              initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Category intro */}
              <div className="rounded-2xl px-5 py-4 flex items-center gap-4"
                style={{ background: 'rgba(0,200,83,0.04)', border: '1px solid rgba(0,200,83,0.12)' }}>
                <span className="text-3xl flex-shrink-0">{categoryMeta[activeCategory].emoji}</span>
                <div>
                  <p className="text-sm font-black" style={{ color: '#3fe56c' }}>{categoryMeta[activeCategory].title}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{categoryMeta[activeCategory].desc}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((report, i) => (
                  <ReportCard key={report.id} report={report} index={i} />
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

        </div>
      </main>
    </div>
  )
}
