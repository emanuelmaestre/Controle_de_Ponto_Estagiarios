'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { minutesToHours } from '@/lib/utils'
import ReportExport from './ReportExport'
import { Clock, ClipboardList, CheckCircle2, AlertCircle, XCircle, Search, BarChart2, Download } from 'lucide-react'
import DatePicker from '@/components/ui/DatePicker'

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

function getTodayStr() {
  return new Date().toISOString().slice(0, 10)
}

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

  const handleClear = () => {
    setPeriodType('monthly')
    setMonth(getCurrentMonth())
    setDailyDate(getTodayStr())
    setWeeklyDate(getTodayStr())
    setCustomStart(getTodayStr())
    setCustomEnd(getTodayStr())
    setApplied(false)
    setData(null)
  }

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

  const periodTypeLabels: Record<PeriodType, string> = {
    daily: 'Diário', weekly: 'Semanal', monthly: 'Mensal', custom: 'Personalizado'
  }

  return (
    <div className="flex flex-col flex-1 min-h-0" style={{ background: 'var(--bg)' }}>
      <style>{`@media print { .no-print { display: none !important; } body { background: white !important; } }`}</style>

      {/* ── TopAppBar ──────────────────────────────── */}
      <header
        className="no-print flex items-center justify-between px-6 h-16 flex-shrink-0"
        style={{ background: 'var(--bg)', borderBottom: '1px solid rgba(0,200,83,0.15)' }}
      >
        <h2 className="text-2xl font-semibold" style={{ color: 'var(--text)' }}>
          Relatórios
        </h2>
        <ReportExport
          data={exportData}
          label={data?.label ?? ''}
          disabled={!data || data.interns.length === 0}
        />
      </header>

      {/* ── Main content ──────────────────────────── */}
      <main className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-6 space-y-6" style={{ maxWidth: 1400, margin: '0 auto' }}>

          {/* Header */}
          <div>
            <h3 className="text-3xl font-semibold" style={{ color: 'var(--text)' }}>
              Matriz de Desempenho
            </h3>
            <p className="text-base mt-1 preserve-case" style={{ color: 'var(--text-3)' }}>
              {data && applied
                ? `${periodTypeLabels[data.type]} · ${data.label}`
                : 'Selecione um período para visualizar os dados.'
              }
            </p>
          </div>

          {/* Filtros */}
          <div
            className="rounded-xl p-6 no-print"
            style={{ background: 'var(--surface-card, #0f2318)', border: '1px solid rgba(0,200,83,0.15)' }}
          >
            <h4 className="text-base font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <Search size={16} style={{ color: 'var(--primary)' }} />
              Filtrar por Período
            </h4>

            {/* Period type buttons */}
            <div className="flex flex-wrap gap-2 mb-5">
              {(['daily', 'weekly', 'monthly', 'custom'] as PeriodType[]).map(t => (
                <motion.button
                  key={t}
                  onClick={() => setPeriodType(t)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-5 py-2 rounded-lg text-sm font-semibold transition-all"
                  style={periodType === t
                    ? { background: '#00c853', color: '#003912' }
                    : { background: 'var(--surface-variant)', color: 'var(--text-3)', border: '1px solid rgba(0,200,83,0.15)' }
                  }
                >
                  {periodTypeLabels[t]}
                </motion.button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-4">
              {periodType === 'daily' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: 'var(--text-3)' }}>Data</label>
                  <DatePicker value={dailyDate} onChange={v => setDailyDate(v || getTodayStr())} placeholder="Selecionar data" />
                </div>
              )}

              {periodType === 'weekly' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: 'var(--text-3)' }}>Qualquer dia da semana</label>
                  <DatePicker value={weeklyDate} onChange={v => setWeeklyDate(v || getTodayStr())} placeholder="Selecionar data" />
                  {weeklyDate && (
                    <p className="text-xs font-medium" style={{ color: 'var(--primary)' }}>
                      {new Date(weekStart + 'T12:00:00Z').toLocaleDateString('pt-BR')} &mdash; {new Date(weekEnd + 'T12:00:00Z').toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
              )}

              {periodType === 'monthly' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: 'var(--text-3)' }}>Mês e ano</label>
                  <select
                    value={month}
                    onChange={e => setMonth(e.target.value)}
                    className="px-4 py-2.5 rounded-lg text-sm focus:outline-none min-w-[200px] font-medium preserve-case"
                    style={{ background: 'var(--surface-variant)', border: '1px solid rgba(0,200,83,0.15)', color: 'var(--text)' }}
                  >
                    {monthOptions.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {periodType === 'custom' && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold" style={{ color: 'var(--text-3)' }}>Data inicial</label>
                    <DatePicker value={customStart} onChange={v => setCustomStart(v || getTodayStr())} placeholder="Data inicial" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold" style={{ color: 'var(--text-3)' }}>Data final</label>
                    <DatePicker value={customEnd} onChange={v => setCustomEnd(v || getTodayStr())} min={customStart} placeholder="Data final" />
                  </div>
                </>
              )}

              <div className="flex gap-2 sm:ml-auto">
                {applied && (
                  <button
                    onClick={handleClear}
                    className="px-4 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-70"
                    style={{ border: '1px solid rgba(0,200,83,0.15)', color: 'var(--text-2)', background: 'var(--surface-variant)' }}
                  >
                    Limpar
                  </button>
                )}
                <button
                  onClick={fetchData} disabled={loading}
                  className="px-6 py-2.5 rounded-lg text-sm font-bold transition-all disabled:opacity-60 flex items-center gap-2 hover:opacity-90"
                  style={{ background: '#00c853', color: '#003912' }}
                >
                  {loading ? (
                    <><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" /> Carregando...</>
                  ) : <><Search size={14} /> Aplicar</>}
                </button>
              </div>
            </div>
          </div>

          {/* Erro */}
          {error && (
            <div className="text-sm rounded-xl px-4 py-3 flex items-center gap-2"
              style={{ background: 'rgba(255,82,82,0.08)', border: '1px solid rgba(255,82,82,0.25)', color: 'var(--danger)' }}>
              <AlertCircle size={14} style={{ flexShrink: 0 }} /> {error}
              <button onClick={fetchData} className="ml-auto underline hover:opacity-70">Tentar novamente</button>
            </div>
          )}

          {/* Skeleton */}
          {loading && !data && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl p-5 animate-pulse h-24"
                  style={{ background: 'var(--surface-card, #0f2318)', border: '1px solid rgba(0,200,83,0.15)' }} />
              ))}
            </div>
          )}

          {/* Cards de resumo */}
          <AnimatePresence>
            {data && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-3"
              >
                <SummaryCard label="Total de Horas"  value={minutesToHours(totalMinutes)} color="#95d69a"  icon={<Clock size={16}        />} delay={0} />
                <SummaryCard label="Sessões"          value={totalSessions}               color="#3fe56c"  icon={<ClipboardList size={16} />} delay={0.05} />
                <SummaryCard label="Aprovadas"        value={totalApproved}               color="#00c853"  icon={<CheckCircle2 size={16}  />} delay={0.1} />
                <SummaryCard label="Reprovadas"       value={totalRejected}               color="#ff5252"  icon={<XCircle size={16}       />} delay={0.15} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tabela */}
          {data && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              className="rounded-xl overflow-hidden"
              style={{ background: 'var(--surface-card, #0f2318)', border: '1px solid rgba(0,200,83,0.15)' }}
            >
              {data.interns.length > 0 ? (
                <>
                  {/* Mobile: card list */}
                  <div className="md:hidden space-y-2 p-4">
                    {data.interns.map((intern, i) => (
                      <motion.div
                        key={intern.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: i * 0.04 }}
                        className="rounded-xl p-4"
                        style={{ background: 'var(--surface-variant)', border: '1px solid rgba(0,200,83,0.15)' }}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0">
                            <p className="font-bold text-sm preserve-case truncate" style={{ color: 'var(--text)' }}>
                              {intern.full_name}
                              {intern.nickname && <span className="ml-1 font-normal text-xs" style={{ color: 'var(--text-3)' }}>({intern.nickname})</span>}
                            </p>
                            {intern.course && <p className="text-xs preserve-case truncate" style={{ color: 'var(--text-3)' }}>{intern.course}</p>}
                          </div>
                          <span className="font-bold text-base flex-shrink-0" style={{ color: intern.total_minutes > 0 ? '#95d69a' : 'var(--text-3)' }}>
                            {intern.total_minutes > 0 ? minutesToHours(intern.total_minutes) : '—'}
                          </span>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: 'rgba(0,200,83,0.08)', color: 'var(--text-3)', border: '1px solid rgba(0,200,83,0.15)' }}>
                            {intern.total_sessions} sessões
                          </span>
                          {intern.approved_sessions > 0 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: 'rgba(0,200,83,0.10)', color: '#00c853', border: '1px solid rgba(0,200,83,0.3)' }}>
                              {intern.approved_sessions} aprov.
                            </span>
                          )}
                          {intern.rejected_sessions > 0 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: 'rgba(255,82,82,0.10)', color: '#ff5252', border: '1px solid rgba(255,82,82,0.3)' }}>
                              {intern.rejected_sessions} reprov.
                            </span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                    <div className="rounded-xl p-4 flex items-center justify-between" style={{ background: 'var(--surface-variant)', border: '1px solid rgba(0,200,83,0.15)' }}>
                      <span className="text-xs font-bold" style={{ color: 'var(--text-3)' }}>Total — {data.interns.length} estagiários</span>
                      <span className="font-bold" style={{ color: '#95d69a' }}>{minutesToHours(totalMinutes)}</span>
                    </div>
                  </div>

                  {/* Desktop: table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ background: 'var(--surface-variant)', borderBottom: '1px solid rgba(0,200,83,0.15)' }}>
                          <th className="text-left px-5 py-4 text-xs font-semibold" style={{ color: 'var(--text-3)' }}>Estagiário</th>
                          <th className="text-center px-4 py-4 text-xs font-semibold" style={{ color: '#95d69a' }}>Horas</th>
                          <th className="text-center px-4 py-4 text-xs font-semibold" style={{ color: 'var(--text-3)' }}>Sessões</th>
                          <th className="text-center px-4 py-4 text-xs font-semibold" style={{ color: '#00c853' }}>Aprov.</th>
                          <th className="text-center px-4 py-4 text-xs font-semibold" style={{ color: '#ff5252' }}>Reprov.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.interns.map((intern, i) => (
                          <motion.tr
                            key={intern.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2, delay: i * 0.04 }}
                            style={{ borderTop: '1px solid rgba(0,200,83,0.08)' }}
                          >
                            <td className="px-5 py-4">
                              <p className="font-semibold preserve-case" style={{ color: 'var(--text)' }}>
                                {intern.full_name}
                                {intern.nickname && <span className="ml-2 text-xs font-normal" style={{ color: 'var(--text-3)' }}>({intern.nickname})</span>}
                              </p>
                              {intern.course && <p className="text-xs mt-0.5 preserve-case" style={{ color: 'var(--text-3)' }}>{intern.course}</p>}
                            </td>
                            <td className="px-4 py-4 text-center font-bold" style={{ color: intern.total_minutes > 0 ? '#95d69a' : 'var(--text-3)' }}>
                              {intern.total_minutes > 0 ? minutesToHours(intern.total_minutes) : '—'}
                            </td>
                            <td className="px-4 py-4 text-center font-medium" style={{ color: 'var(--text-2)' }}>{intern.total_sessions || '—'}</td>
                            <td className="px-4 py-4 text-center">
                              {intern.approved_sessions > 0
                                ? <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold" style={{ background: 'rgba(0,200,83,0.10)', color: '#00c853', border: '1px solid rgba(0,200,83,0.3)' }}>{intern.approved_sessions}</span>
                                : <span style={{ color: 'var(--text-3)' }}>—</span>}
                            </td>
                            <td className="px-4 py-4 text-center">
                              {intern.rejected_sessions > 0
                                ? <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold" style={{ background: 'rgba(255,82,82,0.10)', color: '#ff5252', border: '1px solid rgba(255,82,82,0.3)' }}>{intern.rejected_sessions}</span>
                                : <span style={{ color: 'var(--text-3)' }}>—</span>}
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                      <tfoot style={{ borderTop: '2px solid rgba(0,200,83,0.15)', background: 'var(--surface-variant)' }}>
                        <tr>
                          <td className="px-5 py-4 text-sm font-bold" style={{ color: 'var(--text-3)' }}>Total — {data.interns.length} estagiários</td>
                          <td className="px-4 py-4 text-center font-bold" style={{ color: '#95d69a' }}>{minutesToHours(totalMinutes)}</td>
                          <td className="px-4 py-4 text-center font-bold" style={{ color: 'var(--text)' }}>{totalSessions}</td>
                          <td className="px-4 py-4 text-center font-bold" style={{ color: '#00c853' }}>{totalApproved}</td>
                          <td className="px-4 py-4 text-center font-bold" style={{ color: '#ff5252' }}>{totalRejected}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </>
              ) : (
                <div className="py-20 text-center">
                  <BarChart2 size={48} className="mx-auto mb-4" style={{ color: 'var(--text-3)', opacity: 0.35 }} />
                  <p className="font-semibold text-base mb-1" style={{ color: 'var(--text)' }}>Nenhum dado encontrado</p>
                  <p className="text-sm preserve-case" style={{ color: 'var(--text-3)' }}>Não há registros para o período selecionado.</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Estado inicial */}
          {!data && !loading && !error && (
            <div className="py-20 text-center">
              <Search size={48} className="mx-auto mb-4" style={{ color: 'var(--text-3)', opacity: 0.35 }} />
              <p className="font-semibold text-base mb-1" style={{ color: 'var(--text)' }}>Selecione um período</p>
              <p className="text-sm preserve-case" style={{ color: 'var(--text-3)' }}>Configure o filtro acima e clique em Aplicar.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function SummaryCard({ label, value, color, icon, delay = 0 }: {
  label: string
  value: string | number
  color: string
  icon: React.ReactNode
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.3, delay, type: 'spring', stiffness: 280, damping: 22 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className="rounded-xl p-5 relative overflow-hidden"
      style={{ background: 'var(--surface-card, #0f2318)', border: '1px solid rgba(0,200,83,0.15)' }}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="p-2 rounded-lg" style={{ background: `${color}15`, color }}>
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold mb-1" style={{ color }}>
        {value}
      </p>
      <p className="text-xs font-semibold preserve-case" style={{ color: 'var(--text-3)' }}>{label}</p>
    </motion.div>
  )
}
