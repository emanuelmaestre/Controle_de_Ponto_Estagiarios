'use client'

import { useState, useEffect } from 'react'
import { minutesToHours } from '@/lib/utils'

interface InternReport {
  internId: string
  internName: string
  totalMinutes: number
  totalSessions: number
  records: {
    date: string
    clockIn: string
    clockOut: string | null
    durationMinutes: number | null
    activities: string[]
  }[]
}

export default function ReportsPage() {
  const [report, setReport] = useState<InternReport[]>([])
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/reports?month=${month}&year=${year}`)
      .then(r => r.json())
      .then(data => { setReport(data.report || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [month, year])

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const monthLabel = new Date(year, month - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  function exportCSV() {
    const rows = [['Estagiario', 'Total Horas', 'Sessoes']]
    report.forEach(r => {
      rows.push([r.internName, minutesToHours(r.totalMinutes), String(r.totalSessions)])
    })
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio-${year}-${String(month).padStart(2, '0')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">Relatorios</h2>
        <button
          onClick={exportCSV}
          disabled={report.length === 0}
          className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-sm rounded-xl transition-colors"
        >
          Exportar CSV
        </button>
      </div>

      {/* Month Selector */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <button onClick={prevMonth} className="text-gray-400 hover:text-white px-3 py-1">←</button>
        <span className="text-sm font-medium capitalize">{monthLabel}</span>
        <button onClick={nextMonth} className="text-gray-400 hover:text-white px-3 py-1">→</button>
      </div>

      {/* Report Table */}
      {loading ? (
        <p className="text-gray-600 text-sm">Carregando...</p>
      ) : report.length === 0 ? (
        <p className="text-gray-600 text-sm">Nenhum dado para este periodo.</p>
      ) : (
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Estagiario</th>
                <th className="text-right px-4 py-3 text-gray-400 font-medium">Horas</th>
                <th className="text-right px-4 py-3 text-gray-400 font-medium">Sessoes</th>
              </tr>
            </thead>
            <tbody>
              {report.map(r => (
                <tr key={r.internId} className="border-b border-gray-800 last:border-0">
                  <td className="px-4 py-3 text-white">{r.internName}</td>
                  <td className="px-4 py-3 text-right text-green-400 font-medium">{minutesToHours(r.totalMinutes)}</td>
                  <td className="px-4 py-3 text-right text-gray-400">{r.totalSessions}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-700">
                <td className="px-4 py-3 text-white font-semibold">Total</td>
                <td className="px-4 py-3 text-right text-green-400 font-bold">
                  {minutesToHours(report.reduce((s, r) => s + r.totalMinutes, 0))}
                </td>
                <td className="px-4 py-3 text-right text-gray-400 font-medium">
                  {report.reduce((s, r) => s + r.totalSessions, 0)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
