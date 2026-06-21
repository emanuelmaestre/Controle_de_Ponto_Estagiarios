'use client'

import { useState, useEffect } from 'react'
import { minutesToHours } from '@/lib/utils'

interface Record {
  id: string
  clockIn: string
  clockOut: string | null
  durationMinutes: number | null
  isOpen: boolean
  notes: string | null
  activities: string[]
}

export default function HistoryPage() {
  const [records, setRecords] = useState<Record[]>([])
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    queueMicrotask(() => {
      setLoading(true)
      fetch(`/api/records?month=${month}&year=${year}`)
        .then(r => r.json())
        .then(data => { setRecords(data.records || []); setLoading(false) })
        .catch(() => setLoading(false))
    })
  }, [month, year])

  const totalMinutes = records.reduce((sum, r) => sum + (r.durationMinutes ?? 0), 0)

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const monthLabel = new Date(year, month - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24">
      <header className="px-6 pt-8 pb-4">
        <h1 className="text-xl font-bold">Historico</h1>
      </header>

      {/* Month Selector */}
      <div className="px-6 mb-4 flex items-center justify-between">
        <button onClick={prevMonth} className="text-gray-400 hover:text-white px-3 py-1">←</button>
        <span className="text-sm font-medium capitalize">{monthLabel}</span>
        <button onClick={nextMonth} className="text-gray-400 hover:text-white px-3 py-1">→</button>
      </div>

      {/* Summary */}
      <div className="px-6 mb-6">
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 flex justify-between">
          <div>
            <p className="text-gray-400 text-xs">Total</p>
            <p className="text-lg font-bold text-green-400">{minutesToHours(totalMinutes)}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs">Registros</p>
            <p className="text-lg font-bold">{records.length}</p>
          </div>
        </div>
      </div>

      {/* Records */}
      <section className="px-6">
        {loading ? (
          <p className="text-gray-600 text-sm">Carregando...</p>
        ) : records.length === 0 ? (
          <p className="text-gray-600 text-sm">Nenhum registro neste mes.</p>
        ) : (
          <div className="space-y-3">
            {records.map(record => {
              const date = new Date(record.clockIn).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', weekday: 'short', timeZone: 'America/Sao_Paulo' })
              const timeIn = new Date(record.clockIn).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })
              const timeOut = record.clockOut
                ? new Date(record.clockOut).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })
                : null

              return (
                <div key={record.id} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm text-gray-400 capitalize">{date}</span>
                    <span className="text-sm font-medium text-green-400">
                      {record.durationMinutes ? minutesToHours(record.durationMinutes) : 'Aberto'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300">
                    {timeIn} → {timeOut ?? '...'}
                  </p>
                  {record.activities.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {record.activities.map((a, i) => (
                        <span key={i} className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded-lg">{a}</span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 inset-x-0 bg-gray-900 border-t border-gray-800 flex justify-around py-3">
        <a href="/v2/dashboard" className="text-gray-500 text-xs">Inicio</a>
        <a href="/v2/history" className="text-green-400 text-xs font-medium">Historico</a>
        <a href="/v2/ranking" className="text-gray-500 text-xs">Ranking</a>
        <a href="/v2/profile" className="text-gray-500 text-xs">Perfil</a>
      </nav>
    </div>
  )
}
