'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { minutesToHours } from '@/lib/utils'
import ReportExport from './ReportExport'

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
    <div className="min-h-screen bg-slate-50">
      {/* Print styles */}
      <style>{`@media print { .no-print { display: none !important; } body { background: white !important; } }`}</style>

      {/* Header */}
      <header className="bg-white border-b border-slate-200 no-print">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <a href="/admin" className="text-slate-400 hover:text-slate-600 text-sm font-medium transition-colors flex-shrink-0">← <span className="hidden sm:inline">Painel</span></a>
            <div className="w-px h-5 bg-slate-200 hidden sm:block" />
            <div className="min-w-0">
              <h1 className="font-bold text-slate-800 text-base sm:text-lg leading-tight">Relatórios</h1>
              {data && applied && (
                <p className="text-xs text-slate-400 mt-0.5 truncate">
                  {periodTypeLabels[data.type]} · {data.label}
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
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 pb-24 md:pb-6 space-y-4 sm:space-y-6">

        {/* ── Painel de Filtros ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 no-print">
          <h2 className="text-sm font-bold text-slate-700 mb-3 sm:mb-4 flex items-center gap-2">
            <span className="text-base">🔍</span> Filtrar por período
          </h2>

          {/* Tipo de período */}
          <div className="grid grid-cols-4 sm:flex sm:flex-wrap gap-1.5 sm:gap-2 mb-4 sm:mb-5">
            {(['daily', 'weekly', 'monthly', 'custom'] as PeriodType[]).map(t => (
              <button
                key={t}
                onClick={() => setPeriodType(t)}
                className={`px-2 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border text-center ${
                  periodType === t
                    ? 'bg-blue-700 text-white border-blue-700 shadow-sm'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-700'
                }`}
              >
                {periodTypeLabels[t]}
              </button>
            ))}
          </div>

          {/* Campos dinâmicos */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-3 sm:gap-4">
            {periodType === 'daily' && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Data</label>
                <input
                  type="date"
                  value={dailyDate}
                  onChange={e => setDailyDate(e.target.value || getTodayStr())}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                />
              </div>
            )}

            {periodType === 'weekly' && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Qualquer dia da semana</label>
                <input
                  type="date"
                  value={weeklyDate}
                  onChange={e => setWeeklyDate(e.target.value || getTodayStr())}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                />
                {weeklyDate && (
                  <p className="text-xs text-slate-400 mt-1">
                    Semana: {new Date(weekStart + 'T12:00:00Z').toLocaleDateString('pt-BR')} — {new Date(weekEnd + 'T12:00:00Z').toLocaleDateString('pt-BR')}
                  </p>
                )}
              </div>
            )}

            {periodType === 'monthly' && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Mês e Ano</label>
                <select
                  value={month}
                  onChange={e => setMonth(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent min-w-[180px]"
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
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Data inicial</label>
                  <input
                    type="date"
                    value={customStart}
                    onChange={e => setCustomStart(e.target.value || getTodayStr())}
                    className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Data final</label>
                  <input
                    type="date"
                    value={customEnd}
                    min={customStart}
                    onChange={e => setCustomEnd(e.target.value || getTodayStr())}
                    className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  />
                </div>
              </>
            )}

            {/* Botões */}
            <div className="flex gap-2 sm:ml-auto w-full sm:w-auto">
              {applied && (
                <button
                  onClick={handleClear}
                  className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 text-slate-500 hover:bg-slate-50 transition-all"
                >
                  Limpar
                </button>
              )}
              <button
                onClick={fetchData}
                disabled={loading}
                className="px-5 py-2 rounded-xl text-sm font-bold bg-blue-700 hover:bg-blue-600 text-white transition-all shadow-sm disabled:opacity-60 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                    Carregando...
                  </>
                ) : '🔎 Aplicar filtro'}
              </button>
            </div>
          </div>
        </div>

        {/* ── Estado de erro ── */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
            <span>⚠️</span> {error}
            <button onClick={fetchData} className="ml-auto underline text-red-600 hover:text-red-800">Tentar novamente</button>
          </div>
        )}

        {/* ── Skeleton / Loading ── */}
        {loading && !data && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 animate-pulse h-20 sm:h-24" />
            ))}
          </div>
        )}

        {/* ── Cards de resumo ── */}
        <AnimatePresence>
        {data && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3"
          >
            <SummaryCard label="Total de horas" value={minutesToHours(totalMinutes)} color="blue" icon="⏱️" delay={0} />
            <SummaryCard label="Sessões" value={totalSessions} color="gray" icon="📋" delay={0.05} />
            <SummaryCard label="Aprovadas" value={totalApproved} color="green" icon="✅" delay={0.1} />
            <SummaryCard label="Pendentes" value={totalPending} color="amber" icon="⏳" delay={0.15} />
            <SummaryCard label="Reprovadas" value={totalRejected} color="red" icon="❌" delay={0.2} />
          </motion.div>
        )}
        </AnimatePresence>

        {/* ── Tabela ── */}
        {data && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
          >
            {data.interns.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wide">Estagiário</th>
                      <th className="text-center px-4 py-3.5 text-xs font-bold text-blue-600 uppercase tracking-wide">Horas</th>
                      <th className="text-center px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wide">Sessões</th>
                      <th className="text-center px-4 py-3.5 text-xs font-bold text-green-600 uppercase tracking-wide">Aprov.</th>
                      <th className="text-center px-4 py-3.5 text-xs font-bold text-amber-500 uppercase tracking-wide">Pend.</th>
                      <th className="text-center px-4 py-3.5 text-xs font-bold text-red-500 uppercase tracking-wide">Reprov.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {data.interns.map(intern => (
                      <tr key={intern.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-800">
                            {intern.full_name}
                            {intern.nickname && (
                              <span className="ml-2 text-xs font-normal text-slate-400">({intern.nickname})</span>
                            )}
                          </p>
                          {intern.course && <p className="text-xs text-slate-400 mt-0.5">{intern.course}</p>}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className={`font-bold ${intern.total_minutes > 0 ? 'text-blue-700' : 'text-slate-300'}`}>
                            {intern.total_minutes > 0 ? minutesToHours(intern.total_minutes) : '—'}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center text-slate-600 font-medium">{intern.total_sessions || '—'}</td>
                        <td className="px-4 py-4 text-center">
                          {intern.approved_sessions > 0
                            ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-700">{intern.approved_sessions}</span>
                            : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-4 py-4 text-center">
                          {intern.pending_sessions > 0
                            ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-600">{intern.pending_sessions}</span>
                            : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-4 py-4 text-center">
                          {intern.rejected_sessions > 0
                            ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-600">{intern.rejected_sessions}</span>
                            : <span className="text-slate-300">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-slate-100 bg-slate-50">
                    <tr>
                      <td className="px-5 py-3 text-xs font-bold text-slate-500 uppercase">Total</td>
                      <td className="px-4 py-3 text-center font-bold text-blue-700">{minutesToHours(totalMinutes)}</td>
                      <td className="px-4 py-3 text-center font-bold text-slate-700">{totalSessions}</td>
                      <td className="px-4 py-3 text-center font-bold text-green-700">{totalApproved}</td>
                      <td className="px-4 py-3 text-center font-bold text-amber-600">{totalPending}</td>
                      <td className="px-4 py-3 text-center font-bold text-red-600">{totalRejected}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="py-20 text-center text-slate-400">
                <div className="text-5xl mb-4">📊</div>
                <p className="font-semibold text-slate-600">Nenhum dado encontrado</p>
                <p className="text-sm mt-1">Não há registros para o período selecionado.</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Estado inicial */}
        {!data && !loading && !error && (
          <div className="py-20 text-center text-slate-400">
            <div className="text-5xl mb-4">🔍</div>
            <p className="font-semibold text-slate-600">Selecione um período</p>
            <p className="text-sm mt-1">Configure o filtro acima e clique em Aplicar filtro.</p>
          </div>
        )}
      </main>
    </div>
  )
}

function SummaryCard({ label, value, color, icon, delay = 0 }: {
  label: string
  value: string | number
  color: 'blue' | 'green' | 'amber' | 'red' | 'gray'
  icon: string
  delay?: number
}) {
  const colors = {
    blue:  'text-blue-700 bg-blue-50 border-blue-100',
    green: 'text-green-700 bg-green-50 border-green-100',
    amber: 'text-amber-600 bg-amber-50 border-amber-100',
    red:   'text-red-600 bg-red-50 border-red-100',
    gray:  'text-slate-700 bg-white border-slate-100',
  }
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay }}
      className={`rounded-2xl border p-3 sm:p-4 shadow-sm ${colors[color]}`}
    >
      <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide opacity-70 flex items-center gap-1">
        <span>{icon}</span> {label}
      </p>
      <p className="text-xl sm:text-2xl font-bold mt-1 sm:mt-2">{value}</p>
    </motion.div>
  )
}
