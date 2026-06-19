'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Download, FileText, AlertCircle, CheckCircle2, ChevronDown, CalendarDays,
  Calendar, Timer, Clock, ClipboardList, FolderOpen, Gauge, Trophy, Award,
} from 'lucide-react'
import { exportPDF } from '@/lib/pdfExport'

const monthOptions = Array.from({ length: 12 }, (_, i) => {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() - i)
  const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  return { value: val, label }
})

function getCurrentMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

interface ReportDef {
  id: string
  icon: React.ReactNode
  color: string
  title: string
  desc: string
}

const MY_REPORTS: ReportDef[] = [
  { id: 'attendance',  icon: <Calendar size={18} />,     color: '#3fe56c', title: 'Minha Frequência',    desc: 'Todos os seus registros de entrada e saída no período.' },
  { id: 'hours',       icon: <Timer size={18} />,        color: '#22d3ee', title: 'Minhas Horas',        desc: 'Total de horas aprovadas e sessões registradas.' },
  { id: 'punctuality', icon: <Clock size={18} />,        color: '#f97316', title: 'Minha Pontualidade',  desc: 'Seu índice de pontualidade e atrasos no período.' },
  { id: 'activities',  icon: <ClipboardList size={18} />,color: '#a78bfa', title: 'Minhas Atividades',   desc: 'Lista de todas as atividades que você documentou.' },
  { id: 'sheet',       icon: <FolderOpen size={18} />,   color: '#fbbf24', title: 'Minha Ficha',         desc: 'Resumo completo dos seus dados e progresso no estágio.' },
  { id: 'workload',    icon: <Gauge size={18} />,        color: '#48e1a6', title: 'Carga Horária',        desc: 'Quanto já cumpriu e quanto falta para encerrar o estágio.' },
  { id: 'ranking',     icon: <Trophy size={18} />,       color: '#fbbf24', title: 'Meu Ranking',         desc: 'Sua posição no ranking de pontos deste mês.' },
  { id: 'achievements',icon: <Award size={18} />,        color: '#a78bfa', title: 'Minhas Conquistas',   desc: 'Todas as suas conquistas desbloqueadas e pontuação total.' },
]

function MonthSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const selected = monthOptions.find(o => o.value === value)

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold w-full transition-all"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}
      >
        <CalendarDays size={11} style={{ color: '#3fe56c' }} />
        <span className="flex-1 text-left capitalize">{selected?.label}</span>
        <ChevronDown size={11} />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}
              className="absolute z-50 top-full mt-1 left-0 right-0 rounded-xl overflow-hidden"
              style={{
                background: '#0b1d12', border: '1px solid rgba(63,229,108,0.2)',
                boxShadow: '0 16px 40px rgba(0,0,0,0.7)', maxHeight: 200, overflowY: 'auto',
              }}
            >
              {monthOptions.map(opt => (
                <button key={opt.value} type="button"
                  onClick={() => { onChange(opt.value); setOpen(false) }}
                  className="w-full text-left px-3 py-2.5 text-xs capitalize"
                  style={{
                    color: opt.value === value ? '#3fe56c' : 'rgba(255,255,255,0.6)',
                    background: opt.value === value ? 'rgba(63,229,108,0.08)' : 'transparent',
                    fontWeight: opt.value === value ? 700 : 400,
                  }}
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

function ReportCard({ report, index }: { report: ReportDef; index: number }) {
  const [month, setMonth] = useState(getCurrentMonth())
  const [loadingExcel, setLoadingExcel] = useState(false)
  const [loadingPdf, setLoadingPdf] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fetchData = async () => {
    const p = new URLSearchParams({ report: report.id, month })
    const res = await fetch(`/api/intern/reports?${p}`)
    if (!res.ok) throw new Error()
    const json = await res.json()

    // Mapear dados por tipo de relatório
    const period = monthOptions.find(o => o.value === month)?.label ?? month

    if (report.id === 'attendance') {
      return {
        columns: [
          { header: 'Entrada', dataKey: 'entrada' }, { header: 'Saída', dataKey: 'saida' },
          { header: 'Duração', dataKey: 'duracao' }, { header: 'Status', dataKey: 'status' },
          { header: 'Pontual', dataKey: 'pontual' },
        ],
        rows: (json.records ?? []).map((r: { clock_in: string; clock_out?: string; duration_minutes?: number; status: string; is_late?: boolean }) => ({
          entrada: new Date(r.clock_in).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }),
          saida:   r.clock_out ? new Date(r.clock_out).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : '—',
          duracao: r.duration_minutes ? `${Math.floor(r.duration_minutes / 60)}h${String(r.duration_minutes % 60).padStart(2, '0')}` : '—',
          status:  r.status === 'approved' ? 'Aprovado' : r.status === 'pending' ? 'Pendente' : 'Reprovado',
          pontual: r.is_late ? 'Não' : 'Sim',
        })),
        period,
      }
    }

    if (report.id === 'hours') {
      const s = json.stats
      return {
        columns: [{ header: 'Métrica', dataKey: 'metrica' }, { header: 'Valor', dataKey: 'valor' }],
        rows: [
          { metrica: 'Horas aprovadas no período',  valor: `${Math.floor(s.totalMinutes / 60)}h${String(s.totalMinutes % 60).padStart(2, '0')}` },
          { metrica: 'Sessões registradas',          valor: String(s.totalSessions) },
          { metrica: 'Sessões aprovadas',            valor: String(s.approvedSessions) },
        ],
        period,
      }
    }

    if (report.id === 'punctuality') {
      const s = json.stats
      return {
        columns: [{ header: 'Métrica', dataKey: 'metrica' }, { header: 'Valor', dataKey: 'valor' }],
        rows: [
          { metrica: 'Chegadas no horário', valor: String(s.onTimeCount) },
          { metrica: 'Atrasos',             valor: String(s.lateCount) },
          { metrica: 'Taxa de pontualidade',valor: `${s.punctualityRate}%` },
        ],
        period,
      }
    }

    if (report.id === 'activities') {
      const rows: { data: string; atividade: string }[] = []
      for (const r of json.records ?? []) {
        const acts = Array.isArray(r.activities) ? r.activities : []
        for (const act of acts) {
          rows.push({ data: new Date(r.clock_in).toLocaleDateString('pt-BR'), atividade: act })
        }
      }
      return {
        columns: [{ header: 'Data', dataKey: 'data' }, { header: 'Atividade', dataKey: 'atividade', width: 120 }],
        rows, period,
      }
    }

    if (report.id === 'sheet') {
      const p = json.profile
      const s = json.stats
      return {
        columns: [{ header: 'Campo', dataKey: 'campo', width: 50 }, { header: 'Valor', dataKey: 'valor', width: 120 }],
        rows: [
          { campo: 'Nome',              valor: p?.full_name ?? '—' },
          { campo: 'E-mail',            valor: p?.email ?? '—' },
          { campo: 'Curso',             valor: p?.course ?? '—' },
          { campo: 'Pontos',            valor: String(p?.points ?? 0) },
          { campo: 'Nível',             valor: String(p?.level ?? 1) },
          { campo: 'Sequência',         valor: `${p?.streak_days ?? 0} dias` },
          { campo: 'Horas cumpridas',   valor: `${Math.floor(s.totalWorkedMinutes / 60)}h${String(s.totalWorkedMinutes % 60).padStart(2, '0')}` },
          { campo: 'Pontualidade',      valor: `${s.punctualityRate}%` },
        ],
        period,
      }
    }

    if (report.id === 'workload') {
      const s = json.stats
      return {
        columns: [{ header: 'Métrica', dataKey: 'metrica' }, { header: 'Valor', dataKey: 'valor' }],
        rows: [
          { metrica: 'Carga total',      valor: `${Math.floor(s.workloadMinutes / 60)}h` },
          { metrica: 'Horas cumpridas',  valor: `${Math.floor(s.totalWorkedMinutes / 60)}h` },
          { metrica: 'Horas restantes',  valor: `${Math.floor(s.remainingMinutes / 60)}h` },
          { metrica: 'Percentual',       valor: s.workloadMinutes > 0 ? `${Math.round((s.totalWorkedMinutes / s.workloadMinutes) * 100)}%` : '—' },
        ],
        period,
      }
    }

    if (report.id === 'ranking') {
      const r = json.ranking
      return {
        columns: [{ header: 'Métrica', dataKey: 'metrica' }, { header: 'Valor', dataKey: 'valor' }],
        rows: [
          { metrica: 'Posição no ranking',      valor: `${r.position}º de ${r.total}` },
          { metrica: 'Pontos acumulados',        valor: String(json.profile?.points ?? 0) },
          { metrica: 'Nível atual',              valor: String(json.profile?.level ?? 1) },
        ],
        period,
      }
    }

    if (report.id === 'achievements') {
      return {
        columns: [{ header: 'Conquista', dataKey: 'label' }, { header: 'Desbloqueada em', dataKey: 'data' }],
        rows: (json.achievements ?? []).map((a: { type: string; unlocked_at: string }) => ({
          label: a.type,
          data: new Date(a.unlocked_at).toLocaleDateString('pt-BR'),
        })),
        period,
      }
    }

    return { columns: [], rows: [], period }
  }

  const handleExcel = async () => {
    setLoadingExcel(true); setError('')
    try {
      const { columns, rows, period } = await fetchData()
      const XLSX = await import('xlsx')
      const headers = columns.map((c: { header: string; dataKey: string }) => c.header)
      const data = rows.map((r: Record<string, string>) => columns.map((c: { dataKey: string }) => r[c.dataKey] ?? ''))
      const ws = XLSX.utils.aoa_to_sheet([headers, ...data])
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Dados')
      XLSX.writeFile(wb, `${report.id}-${period}.xlsx`)
      setSuccess('Excel gerado!'); setTimeout(() => setSuccess(''), 2500)
    } catch { setError('Erro ao gerar') }
    finally { setLoadingExcel(false) }
  }

  const handlePdf = async () => {
    setLoadingPdf(true); setError('')
    try {
      const { columns, rows, period } = await fetchData()
      await exportPDF({ title: report.title, period, columns, rows })
      setSuccess('PDF gerado!'); setTimeout(() => setSuccess(''), 2500)
    } catch { setError('Erro ao gerar') }
    finally { setLoadingPdf(false) }
  }

  const isLoading = loadingExcel || loadingPdf

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.06, type: 'spring', stiffness: 280, damping: 24 }}
      className="rounded-2xl p-4 flex flex-col gap-3 relative overflow-hidden"
      style={{ background: 'rgba(15,35,24,0.8)', border: `1px solid ${report.color}22` }}
    >
      {/* Watermark */}
      <div className="absolute -bottom-3 -right-3 opacity-[0.06] pointer-events-none select-none"
        style={{ color: report.color, transform: 'scale(3.5)', transformOrigin: 'bottom right' }}>
        {report.icon}
      </div>

      {/* Header */}
      <div className="flex items-center gap-3">
        <motion.div
          whileHover={{ scale: 1.1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 18 }}
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${report.color}18`, border: `1px solid ${report.color}35`, color: report.color }}
        >
          {report.icon}
        </motion.div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-black leading-tight" style={{ color: 'rgba(255,255,255,0.9)' }}>
            {report.title}
          </p>
          <p className="text-[10px] mt-0.5 leading-relaxed" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {report.desc}
          </p>
        </div>
      </div>

      <MonthSelect value={month} onChange={setMonth} />

      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="text-[9px] font-bold flex items-center gap-1" style={{ color: '#ff5252' }}>
            <AlertCircle size={9} /> {error}
          </motion.p>
        )}
        {success && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="text-[9px] font-bold flex items-center gap-1" style={{ color: '#3fe56c' }}>
            <CheckCircle2 size={9} /> {success}
          </motion.p>
        )}
      </AnimatePresence>

      <div className="flex gap-2">
        <button onClick={handleExcel} disabled={isLoading}
          className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-[10px] font-black transition-all disabled:opacity-40"
          style={{ background: 'rgba(149,214,154,0.07)', border: '1px solid rgba(149,214,154,0.3)', color: '#95d69a' }}
        >
          {loadingExcel
            ? <span className="w-2.5 h-2.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            : <Download size={10} />}
          Excel
        </button>
        <button onClick={handlePdf} disabled={isLoading}
          className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-[10px] font-black transition-all disabled:opacity-40"
          style={{ background: 'rgba(255,82,82,0.07)', border: '1px solid rgba(255,82,82,0.3)', color: '#ff8a80' }}
        >
          {loadingPdf
            ? <span className="w-2.5 h-2.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            : <FileText size={10} />}
          PDF
        </button>
      </div>
    </motion.div>
  )
}

export default function ProfileReports() {
  return (
    <div className="space-y-4 pb-6">

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-2xl p-4 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(0,200,83,0.08) 0%, #0f2318 100%)', border: '1px solid rgba(0,200,83,0.2)' }}
      >
        {/* Blob */}
        <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full blur-2xl pointer-events-none"
          style={{ background: '#3fe56c', opacity: 0.1 }} />

        <div className="relative flex items-center gap-3">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity }}
            className="text-3xl flex-shrink-0"
          >
            📄
          </motion.div>
          <div>
            <p className="text-sm font-black" style={{ color: '#3fe56c' }}>Seus Relatórios</p>
            <p className="text-[10px] mt-0.5 leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Baixe os relatórios dos seus próprios dados em Excel ou PDF.
            </p>
          </div>
        </div>

        {/* Shimmer */}
        <motion.div
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', repeatDelay: 2 }}
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(63,229,108,0.06), transparent)' }}
        />
      </motion.div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 gap-3">
        {MY_REPORTS.map((report, i) => (
          <ReportCard key={report.id} report={report} index={i} />
        ))}
      </div>
    </div>
  )
}
