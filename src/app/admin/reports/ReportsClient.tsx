'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { minutesToHours } from '@/lib/utils'
import ReportExport from './ReportExport'
import { Clock, ClipboardList, CheckCircle2, AlertCircle, XCircle, Search, BarChart2 } from 'lucide-react'

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

// Calcula o início da semana (segunda) para uma data
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

  // Meses para o select mensal
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

  // Carrega ao montar
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

  // Totais
  const totalMinutes  = data?.interns.reduce((a, i) => a + i.total_minutes, 0) ?? 0
  const totalApproved = data?.interns.reduce((a, i) => a + i.approved_sessions, 0) ?? 0
  const totalSessions = data?.interns.reduce((a, i) => a + i.total_sessions, 0) ?? 0
  const totalPending  = data?.interns.reduce((a, i) => a + i.pending_sessions, 0) ?? 0
  const totalRejected = data?.interns.reduce((a, i) => a + i.rejected_sessions, 0) ?? 0

  const exportData = data?.interns.map(i => ({
    nome: i.full_name,
    apelido: i.nickname ?? '',
    email: i.email,
    curso: i.course ?? '',
    total_horas: minutesToHours(i.total_minutes),
    sessoes: i.total_sessions,
    aprovados: i.approved_sessions,
    pendentes: i.pending_sessions,
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

      {/* Sub-header */}
      <div className="no-print flex-shrink-0" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <a
              href="/admin"
              className="text-sm font-medium transition-colors flex-shrink-0 hover:opacity-70"
              style={{ color: 'var(--text-3)' }}
            >
              &larr; PAINEL
            </a>
            <div className="w-px h-5 hidden sm:block" style={{ background: 'var(--border)' }} />
            <div className="min-w-0">
              <h1 className="font-bold text-base sm:text-lg leading-tight" style={{ color: 'var(--text)' }}>RELATORIOS</h1>
              {data && applied && (
                <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-3)' }}>
                  {periodTypeLabels[data.type].toUpperCase()} &middot; {data.label}
                </p>
              )}
            </div>
          </div>
          <ReportExport
            data={exportData}
            label={data?.label ?? ''}
            disabled={!data || data.interns.length === 0}
          />
        </div>
      </div>

      <main className="flex-1 min-h-0 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}><div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">

        {/* Filtros */}
        <div
          className="rounded-2xl p-4 sm:p-5 no-print"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}
        >
          <h2 className="text-sm font-bold mb-3 sm:mb-4 flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <Search size={15} style={{ color: 'var(--primary)' }} /> FILTRAR POR PERIODO
          </h2>

          <div className="grid grid-cols-4 sm:flex sm:flex-wrap gap-1.5 sm:gap-2 mb-4 sm:mb-5">
            {(['daily', 'weekly', 'monthly', 'custom'] as PeriodType[]).map(t => (
              <button
                key={t}
                onClick={() => setPeriodType(t)}
                className="px-2 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border text-center"
                style={periodType === t
                  ? { background: 'var(--primary)', color: 'white', borderColor: 'var(--primary)' }
                  : { background: 'var(--bg)', color: 'var(--text-2)', borderColor: 'var(--border)' }
                }
              >
                {periodTypeLabels[t]}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-3 sm:gap-4">
            {periodType === 'daily' && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>Data</label>
                <input
                  type="date"
                  value={dailyDate}
                  onChange={e => setDailyDate(e.target.value || getTodayStr())}
                  className="px-3 py-2 rounded-xl text-sm focus:outline-none"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
                />
              </div>
            )}

            {periodType === 'weekly' && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>Qualquer dia da semana</label>
                <input
                  type="date"
                  value={weeklyDate}
                  onChange={e => setWeeklyDate(e.target.value || getTodayStr())}
                  className="px-3 py-2 rounded-xl text-sm focus:outline-none"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
                />
                {weeklyDate && (
                  <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>
                    Semana: {new Date(weekStart + 'T12:00:00Z').toLocaleDateString('pt-BR')} &mdash; {new Date(weekEnd + 'T12:00:00Z').toLocaleDateString('pt-BR')}
                  </p>
                )}
              </div>
            )}

            {periodType === 'monthly' && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>Mes e Ano</label>
                <select
                  value={month}
                  onChange={e => setMonth(e.target.value)}
                  className="px-3 py-2 rounded-xl text-sm focus:outline-none min-w-[180px]"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
                >
                  {monthOptions.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            )}

            {periodType === 'custom' && (
              <>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>Data inicial</label>
                  <input
                    type="date" value={customStart}
                    onChange={e => setCustomStart(e.target.value || getTodayStr())}
                    className="px-3 py-2 rounded-xl text-sm focus:outline-none"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>Data final</label>
                  <input
                    type="date" value={customEnd} min={customStart}
                    onChange={e => setCustomEnd(e.target.value || getTodayStr())}
                    className="px-3 py-2 rounded-xl text-sm focus:outline-none"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
                  />
                </div>
              </>
            )}

            <div className="flex gap-2 sm:ml-auto w-full sm:w-auto">
              {applied && (
                <button
                  onClick={handleClear}
                  className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-70"
                  style={{ border: '1px solid var(--border)', color: 'var(--text-2)', background: 'var(--bg)' }}
                >
                  Limpar
                </button>
              )}
              <button
                onClick={fetchData} disabled={loading}
                className="px-5 py-2 rounded-xl text-sm font-bold transition-all shadow-sm disabled:opacity-60 flex items-center gap-2 hover:opacity-90"
                style={{ background: 'var(--primary)', color: 'white' }}
              >
                {loading ? (
                  <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" /> Carregando...</>
                ) : <><Search size={14} /> APLICAR FILTRO</>}
              </button>
            </div>
          </div>
        </div>

        {/* Erro */}
        {error && (
          <div className="text-sm rounded-xl px-4 py-3 flex items-center gap-2"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: 'var(--danger)' }}>
            <AlertCircle size={14} style={{ flexShrink: 0 }} /> {error}
            <button onClick={fetchData} className="ml-auto underline hover:opacity-70">Tentar novamente</button>
          </div>
        )}

        {/* Skeleton */}
        {loading && !data && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-2xl p-4 animate-pulse h-20 sm:h-24"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }} />
            ))}
          </div>
        )}

        {/* Cards de resumo */}
        <AnimatePresence>
          {data && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3"
            >
              <SummaryCard label="TOTAL DE HORAS" value={minutesToHours(totalMinutes)} color="blue"  icon={<Clock size={15}        />} delay={0} />
              <SummaryCard label="SESSOES"         value={totalSessions}               color="gray"  icon={<ClipboardList size={15} />} delay={0.05} />
              <SummaryCard label="APROVADAS"       value={totalApproved}               color="green" icon={<CheckCircle2 size={15}  />} delay={0.1} />
              <SummaryCard label="PENDENTES"       value={totalPending}                color="amber" icon={<AlertCircle size={15}   />} delay={0.15} />
              <SummaryCard label="REPROVADAS"      value={totalRejected}               color="red"   icon={<XCircle size={15}       />} delay={0.2} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabela */}
        {data && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="rounded-2xl overflow-hidden"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}
          >
            {data.interns.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                      <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>Estagiario</th>
                      <th className="text-center px-4 py-3.5 text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--info)' }}>Horas</th>
                      <th className="text-center px-4 py-3.5 text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>Sessoes</th>
                      <th className="text-center px-4 py-3.5 text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--success)' }}>Aprov.</th>
                      <th className="text-center px-4 py-3.5 text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--warning)' }}>Pend.</th>
                      <th className="text-center px-4 py-3.5 text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--danger)' }}>Reprov.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.interns.map((intern, i) => (
                      <tr
                        key={intern.id}
                        style={{ borderTop: '1px solid var(--border)', background: i % 2 !== 0 ? 'rgba(0,0,0,0.02)' : 'transparent' }}
                      >
                        <td className="px-5 py-4">
                          <p className="font-semibold" style={{ color: 'var(--text)' }}>
                            {intern.full_name}
                            {intern.nickname && <span className="ml-2 text-xs font-normal" style={{ color: 'var(--text-3)' }}>({intern.nickname})</span>}
                          </p>
                          {intern.course && <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{intern.course}</p>}
                        </td>
                        <td className="px-4 py-4 text-center font-bold" style={{ color: intern.total_minutes > 0 ? 'var(--info)' : 'var(--text-3)' }}>
                          {intern.total_minutes > 0 ? minutesToHours(intern.total_minutes) : '—'}
                        </td>
                        <td className="px-4 py-4 text-center font-medium" style={{ color: 'var(--text-2)' }}>{intern.total_sessions || '—'}</td>
                        <td className="px-4 py-4 text-center">
                          {intern.approved_sessions > 0
                            ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">{intern.approved_sessions}</span>
                            : <span style={{ color: 'var(--text-3)' }}>—</span>}
                        </td>
                        <td className="px-4 py-4 text-center">
                          {intern.pending_sessions > 0
                            ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-600">{intern.pending_sessions}</span>
                            : <span style={{ color: 'var(--text-3)' }}>—</span>}
                        </td>
                        <td className="px-4 py-4 text-center">
                          {intern.rejected_sessions > 0
                            ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-600">{intern.rejected_sessions}</span>
                            : <span style={{ color: 'var(--text-3)' }}>—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot style={{ borderTop: '2px solid var(--border)', background: 'var(--bg)' }}>
                    <tr>
                      <td className="px-5 py-3 text-xs font-bold uppercase" style={{ color: 'var(--text-3)' }}>Total</td>
                      <td className="px-4 py-3 text-center font-bold" style={{ color: 'var(--info)' }}>{minutesToHours(totalMinutes)}</td>
                      <td className="px-4 py-3 text-center font-bold" style={{ color: 'var(--text)' }}>{totalSessions}</td>
                      <td className="px-4 py-3 text-center font-bold text-emerald-600">{totalApproved}</td>
                      <td className="px-4 py-3 text-center font-bold" style={{ color: 'var(--warning)' }}>{totalPending}</td>
                      <td className="px-4 py-3 text-center font-bold" style={{ color: 'var(--danger)' }}>{totalRejected}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="py-20 text-center" style={{ color: 'var(--text-3)' }}>
                <BarChart2 size={44} className="mx-auto mb-4" style={{ color: 'var(--text-3)', opacity: 0.35 }} />
                <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>NENHUM DADO ENCONTRADO</p>
                <p className="text-xs mt-1">Nao ha registros para o periodo selecionado.</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Estado inicial */}
        {!data && !loading && !error && (
          <div className="py-20 text-center" style={{ color: 'var(--text-3)' }}>
            <Search size={44} className="mx-auto mb-4" style={{ color: 'var(--text-3)', opacity: 0.35 }} />
            <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>SELECIONE UM PERIODO</p>
            <p className="text-xs mt-1">Configure o filtro acima e clique em Aplicar filtro.</p>
          </div>
        )}
      </div></main>
    </div>
  )
}

function SummaryCard({ label, value, color, icon, delay = 0 }: {
  label: string
  value: string | number
  color: 'blue' | 'green' | 'amber' | 'red' | 'gray'
  icon: React.ReactNode
  delay?: number
}) {
  const textColor = { blue: 'var(--info)', green: 'var(--success)', amber: 'var(--warning)', red: 'var(--danger)', gray: 'var(--text)' }
  const bgColor   = { blue: 'rgba(14,165,233,0.10)', green: 'rgba(22,163,74,0.10)', amber: 'rgba(217,119,6,0.10)', red: 'rgba(220,38,38,0.10)', gray: 'var(--bg)' }
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, delay }}
      className="rounded-2xl p-3 sm:p-4"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}
    >
      <div className="mb-2 p-1.5 rounded-lg w-fit" style={{ background: bgColor[color], color: textColor[color] }}>
        {icon}
      </div>
      <p className="text-xl sm:text-2xl font-black" style={{ color: textColor[color] }}>{value}</p>
      <p className="text-[9px] font-bold mt-0.5 tracking-wide" style={{ color: 'var(--text-3)' }}>{label}</p>
    </motion.div>
  )
}
